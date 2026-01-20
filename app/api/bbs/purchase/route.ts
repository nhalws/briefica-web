import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20' as any,
});

export async function POST(request: NextRequest) {
  try {
    const { bb_amount } = await request.json();

    // Validate amount (1, 2, or 3)
    if (![1, 2, 3].includes(bb_amount)) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be 1, 2, or 3 BBs.' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Stripe checkout session
    const cost = bb_amount * 5; // $5 per BB (in dollars)
    const amountInCents = cost * 100;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${bb_amount} briefica buck${bb_amount > 1 ? 's' : ''}`,
              description: `Purchase ${bb_amount} additional download${bb_amount > 1 ? 's' : ''}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?purchase=cancelled`,
      metadata: {
        user_id: user.id,
        bb_amount: bb_amount.toString(),
        type: 'bb_purchase',
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Error in /api/bbs/purchase:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}