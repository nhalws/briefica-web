import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Module-level rate limit map — keyed by IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  // Rate limiting — 20 requests per minute per IP
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (entry) {
    if (now < entry.resetAt) {
      if (entry.count >= 20) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
      }
      entry.count += 1;
    } else {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    }
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let body: { key?: string; tier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { key, tier } = body;

  if (!key || typeof key !== 'string' || !key.startsWith('BRF7-')) {
    return NextResponse.json({ error: 'Invalid or revoked key' }, { status: 401 });
  }

  if (!['100', '500', '2000'].includes(tier ?? '')) {
    return NextResponse.json({ error: 'Invalid or revoked key' }, { status: 401 });
  }

  // Look up the key
  const { data: proxyKey, error: lookupError } = await supabase
    .from('proxy_keys')
    .select('key, tier, revoked, queries_used, queries_limit')
    .eq('key', key)
    .eq('revoked', false)
    .eq('tier', tier)
    .single();

  if (lookupError || !proxyKey) {
    return NextResponse.json({ error: 'Invalid or revoked key' }, { status: 401 });
  }

  // Check quota
  const used = proxyKey.queries_used ?? 0;
  const limit = proxyKey.queries_limit ?? 100;
  if (used >= limit) {
    return NextResponse.json({ error: 'quota_exceeded', queries_used: used, queries_limit: limit }, { status: 403 });
  }

  // Increment counter
  await supabase
    .from('proxy_keys')
    .update({ queries_used: used + 1 })
    .eq('key', key);

  return NextResponse.json({
    api_key: process.env.ANTHROPIC_API_KEY,
    queries_used: used + 1,
    queries_limit: limit,
  });
}
