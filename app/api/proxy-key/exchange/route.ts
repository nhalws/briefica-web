import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Module-level rate limit map — keyed by IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  // Rate limiting — 10 requests per minute per IP
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (entry) {
    if (now < entry.resetAt) {
      if (entry.count >= 10) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
      entry.count += 1;
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    }
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
  }

  // Read key and tier from body
  const body = await request.json();
  const { key, tier } = body;

  if (!key || typeof key !== 'string' || !key.startsWith('BRF7-')) {
    return NextResponse.json({ error: 'Invalid or revoked key' }, { status: 401 });
  }

  if (!['100', '500', '2000'].includes(tier)) {
    return NextResponse.json({ error: 'Invalid or revoked key' }, { status: 401 });
  }

  // Look up the key in proxy_keys
  const { data: proxyKey } = await supabase
    .from('proxy_keys')
    .select('key, tier, revoked')
    .eq('key', key)
    .eq('revoked', false)
    .eq('tier', tier)
    .single();

  if (!proxyKey) {
    return NextResponse.json({ error: 'Invalid or revoked key' }, { status: 401 });
  }

  return NextResponse.json({ api_key: process.env.ANTHROPIC_API_KEY });
}
