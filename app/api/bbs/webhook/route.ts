import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for webhook
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.user_id;
      const bbAmount = parseInt(session.metadata?.bb_amount || '0');
      const paymentIntentId = session.payment_intent as string;

      if (!userId || !bbAmount) {
        console.error('Missing metadata in checkout session');
        return NextResponse.json(
          { error: 'Invalid session metadata' },
          { status: 400 }
        );
      }

      // Call purchase_bbs function
      const { data, error } = await supabase.rpc('purchase_bbs', {
        user_uuid: userId,
        bb_amount: bbAmount,
        stripe_payment_id: paymentIntentId,
      });

      if (error) {
        console.error('Error purchasing BBs:', error);
        return NextResponse.json(
          { error: 'Failed to process BB purchase' },
          { status: 500 }
        );
      }

      console.log('BB purchase successful:', data);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error in webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}