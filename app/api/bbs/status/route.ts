import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Verify env vars are loaded
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('[BB Status API] Missing NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[BB Status API] Missing SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify user with the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[BB Status API] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[BB Status API] User authenticated:', user.id);

    // Get user's BB data
    const { data: userData, error: userError } = await supabase
      .from('user_bbs')
      .select('monthly_bbs, purchased_bbs, last_reset')
      .eq('user_id', user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('[BB Status API] Error fetching user BBs:', userError);
    }

    // Check if user has Gold tier in goldilex_access table - NOW INCLUDING gold_member_number
    const { data: goldilexAccess, error: goldError } = await supabase
      .from('goldilex_access')
      .select('tier, approved, gold_member_number')
      .eq('user_id', user.id)
      .single();

    if (goldError && goldError.code !== 'PGRST116') {
      console.error('[BB Status API] Error fetching goldilex access:', goldError);
    }

    const isGold = goldilexAccess?.tier === 'gold' && goldilexAccess?.approved === true;
    const memberNumber = goldilexAccess?.gold_member_number || null;
    
    console.log('[BB Status API] Is gold:', isGold, 'Member number:', memberNumber);

    // If no BB record exists, create one
    if (!userData) {
      console.log('[BB Status API] Creating new user_bbs record for:', user.id);
      
      const { data: newUserData, error: insertError } = await supabase
        .from('user_bbs')
        .insert({
          user_id: user.id,
          monthly_bbs: 3,
          purchased_bbs: 0,
          last_reset: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('[BB Status API] Error creating user_bbs:', insertError);
      }

      return NextResponse.json({
        monthly_bbs: 3,
        purchased_bbs: 0,
        total_bbs: isGold ? Infinity : 3,
        days_until_reset: 30,
        tier: isGold ? 'gold' : 'free',
        can_purchase: 3,
        is_gold: isGold,
        gold_member_number: memberNumber
      });
    }

    // Calculate days until reset
    const lastReset = new Date(userData.last_reset);
    const now = new Date();
    const nextReset = new Date(lastReset);
    nextReset.setMonth(nextReset.getMonth() + 1);
    const daysUntilReset = Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Check if we need to reset monthly BBs
    if (daysUntilReset <= 0) {
      console.log('[BB Status API] Resetting monthly BBs for:', user.id);
      
      await supabase
        .from('user_bbs')
        .update({
          monthly_bbs: 3,
          last_reset: new Date().toISOString()
        })
        .eq('user_id', user.id);

      userData.monthly_bbs = 3;
    }

    // Calculate total BBs and how many can be purchased
    const monthlyBBs = userData.monthly_bbs || 0;
    const purchasedBBs = userData.purchased_bbs || 0;
    const totalBBs = monthlyBBs + purchasedBBs;
    
    // User can purchase up to 3 BBs total per month
    const canPurchase = Math.max(0, 3 - purchasedBBs);

    const response = {
      monthly_bbs: monthlyBBs,
      purchased_bbs: purchasedBBs,
      total_bbs: totalBBs,
      days_until_reset: Math.max(1, daysUntilReset),
      tier: isGold ? 'gold' : 'free',
      can_purchase: canPurchase,
      is_gold: isGold,
      gold_member_number: memberNumber  // NEW FIELD
    };

    console.log('[BB Status API] Returning:', response);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[BB Status API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}