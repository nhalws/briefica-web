import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const EARLY_ACCESS_LIMIT = 50;

export async function POST(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Verify the caller is authenticated
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.slice(7);
  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  // Check current state
  const { data: existing } = await admin
    .from('goldilex_access')
    .select('id, tier, approved')
    .eq('user_id', userId)
    .single();

  // Already gold — nothing to do
  if (existing?.tier === 'gold' && existing?.approved === true) {
    return NextResponse.json({ status: 'already_gold' });
  }

  // Check slot limit
  const { count } = await admin
    .from('goldilex_access')
    .select('id', { count: 'exact', head: true })
    .eq('tier', 'gold')
    .eq('approved', true);

  if ((count ?? 0) >= EARLY_ACCESS_LIMIT) {
    return NextResponse.json({ error: 'Early access is full' }, { status: 403 });
  }

  // Upgrade or insert
  if (existing) {
    const { error: updateError } = await admin
      .from('goldilex_access')
      .update({ tier: 'gold', approved: true })
      .eq('user_id', userId);
    if (updateError) {
      console.error('[early-access/provision] update error:', updateError.message);
      return NextResponse.json({ error: 'Provisioning failed' }, { status: 500 });
    }
  } else {
    const { error: insertError } = await admin
      .from('goldilex_access')
      .insert({ user_id: userId, tier: 'gold', approved: true });
    if (insertError) {
      console.error('[early-access/provision] insert error:', insertError.message);
      return NextResponse.json({ error: 'Provisioning failed' }, { status: 500 });
    }
  }

  // Proxy key (idempotent)
  const { data: existingKey } = await admin
    .from('proxy_keys')
    .select('key')
    .eq('user_id', userId)
    .eq('tier', '100')
    .eq('revoked', false)
    .single();

  if (!existingKey) {
    const newKey = `BRF7-G100-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`;
    await admin.from('proxy_keys').insert({
      user_id: userId,
      key: newKey,
      tier: '100',
      created_at: new Date().toISOString(),
      revoked: false,
    });
  }

  return NextResponse.json({ status: 'provisioned' });
}
