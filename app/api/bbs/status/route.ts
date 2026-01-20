import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's BB data
    const { data: userData, error: userError } = await supabase
      .from('user_bbs')
      .select('monthly_bbs, purchased_bbs, last_reset')
      .eq('user_id', user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user BBs:', userError);
      return NextResponse.json({ error: 'Failed to fetch BB status' }, { status: 500 });
    }

    // Check if user has Gold tier in goldilex_access table
    const { data: goldilexAccess } = await supabase
      .from('goldilex_access')
      .select('tier, approved')
      .eq('user_id', user.id)
      .single();

    const isGold = goldilexAccess?.tier === 'gold' && goldilexAccess?.approved === true;

    // If no BB record exists, create one
    if (!userData) {
      const { data: newUserData } = await supabase
        .from('user_bbs')
        .insert({
          user_id: user.id,
          monthly_bbs: 3,
          purchased_bbs: 0,
          last_reset: new Date().toISOString()
        })
        .select()
        .single();

      return NextResponse.json({
        monthly_bbs: 3,
        purchased_bbs: 0,
        total_bbs: isGold ? Infinity : 3,
        days_until_reset: 30,
        tier: isGold ? 'gold' : 'free',
        can_purchase: 3,
        is_gold: isGold
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

    return NextResponse.json({
      monthly_bbs: monthlyBBs,
      purchased_bbs: purchasedBBs,
      total_bbs: totalBBs,
      days_until_reset: Math.max(1, daysUntilReset),
      tier: isGold ? 'gold' : 'free',
      can_purchase: canPurchase,
      is_gold: isGold  // THIS IS THE KEY FIELD
    });

  } catch (error: any) {
    console.error('BB status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}