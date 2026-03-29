import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // Read auth token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  // Verify user
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check goldilex_access for gold + approved
  const { data: access } = await supabase
    .from('goldilex_access')
    .select('tier, approved')
    .eq('user_id', user.id)
    .single();

  if (!access || access.tier !== 'gold' || access.approved !== true) {
    return NextResponse.json({ error: 'Gold membership required' }, { status: 403 });
  }

  // Read tier_variant from body
  const body = await request.json();
  const { tier_variant } = body;

  if (!['100', '500', '2000'].includes(tier_variant)) {
    return NextResponse.json({ error: 'Invalid tier_variant. Must be 100, 500, or 2000.' }, { status: 400 });
  }

  // Check if user already has a non-revoked key for this tier_variant
  const { data: existingKey } = await supabase
    .from('proxy_keys')
    .select('key')
    .eq('user_id', user.id)
    .eq('tier', tier_variant)
    .eq('revoked', false)
    .single();

  if (existingKey) {
    return NextResponse.json({ key: existingKey.key });
  }

  // Generate new key
  const tierCode = tier_variant === '100' ? 'G100' : tier_variant === '500' ? 'G500' : 'G2K';
  const newKey = `BRF7-${tierCode}-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`;

  // Insert into proxy_keys
  const { error: insertError } = await supabase
    .from('proxy_keys')
    .insert({
      user_id: user.id,
      key: newKey,
      tier: tier_variant,
      created_at: new Date().toISOString(),
      revoked: false,
    });

  if (insertError) {
    return NextResponse.json({ error: 'Failed to generate key' }, { status: 500 });
  }

  return NextResponse.json({ key: newKey });
}
