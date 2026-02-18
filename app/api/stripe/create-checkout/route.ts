import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, tier } = await request.json();

    if (!userId || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      console.error('User verification failed:', userError?.message);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    if (tier === 'gold') {
      const goldPriceId = process.env.NEXT_PUBLIC_STRIPE_GOLD_PRICE_ID;
      if (!goldPriceId) {
        console.error('Missing NEXT_PUBLIC_STRIPE_GOLD_PRICE_ID');
        return NextResponse.json(
          { error: 'Payment configuration error' },
          { status: 500 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: goldPriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        customer_email: userData.user.email,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?upgrade=cancelled`,
        metadata: {
          user_id: userId,
          type: 'gold_subscription',
        },
      });

      return NextResponse.json({ url: session.url });

    } else {
      return NextResponse.json(
        { error: 'Use /buy-bbs for BB purchases' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error?.message },
      { status: 500 }
    );
  }
}
