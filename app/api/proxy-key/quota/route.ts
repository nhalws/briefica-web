import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
  }

  if (!['100', '500', '2000'].includes(tier ?? '')) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('proxy_keys')
    .select('queries_used, queries_limit')
    .eq('key', key)
    .eq('tier', tier)
    .eq('revoked', false)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
  }

  return NextResponse.json({
    queries_used: data.queries_used ?? 0,
    queries_limit: data.queries_limit ?? 100,
  });
}
