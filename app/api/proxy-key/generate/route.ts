import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Guard: ensure env vars are present
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[proxy-key/generate] Missing Supabase env vars');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('[proxy-key/generate] getUser failed:', userError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check goldilex_access
    const { data: access, error: accessError } = await supabase
      .from('goldilex_access')
      .select('tier, approved')
      .eq('user_id', user.id)
      .single();

    if (accessError) {
      console.error('[proxy-key/generate] goldilex_access query error:', accessError.message);
    }

    if (!access || access.tier !== 'gold' || access.approved !== true) {
      return NextResponse.json({ error: 'Gold membership required' }, { status: 403 });
    }

    // Return existing non-revoked key for tier 100
    const { data: existingKey } = await supabase
      .from('proxy_keys')
      .select('key')
      .eq('user_id', user.id)
      .eq('tier', '100')
      .eq('revoked', false)
      .single();

    if (existingKey) {
      return NextResponse.json({ key: existingKey.key });
    }

    // Generate new key
    const newKey = `BRF7-G100-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`;

    const { error: insertError } = await supabase
      .from('proxy_keys')
      .insert({
        user_id: user.id,
        key: newKey,
        tier: '100',
        created_at: new Date().toISOString(),
        revoked: false,
      });

    if (insertError) {
      console.error('[proxy-key/generate] insert error:', insertError.message);
      return NextResponse.json({ error: 'Failed to generate key' }, { status: 500 });
    }

    return NextResponse.json({ key: newKey });

  } catch (err) {
    console.error('[proxy-key/generate] unhandled exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
