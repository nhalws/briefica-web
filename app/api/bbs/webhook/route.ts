import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase inside the function (not at module level)
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Initialize Stripe inside the function (not at module level)
    // Remove apiVersion to use account default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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
      const purchaseType = session.metadata?.type;

      if (!userId) {
        console.error('Missing user_id in checkout session metadata');
        return NextResponse.json(
          { error: 'Invalid session metadata' },
          { status: 400 }
        );
      }

      if (purchaseType === 'gold_subscription') {
        // Handle Gold subscription activation
        console.log('Processing Gold subscription for user:', userId);

        // Check if user already has a goldilex_access record
        const { data: existing } = await supabase
          .from('goldilex_access')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (existing) {
          // Update existing record to gold
          const { error: updateError } = await supabase
            .from('goldilex_access')
            .update({ tier: 'gold', approved: true })
            .eq('user_id', userId);

          if (updateError) {
            console.error('Error updating goldilex_access:', updateError);
          }
        } else {
          // Insert new gold record
          const { error: insertError } = await supabase
            .from('goldilex_access')
            .insert({
              user_id: userId,
              tier: 'gold',
              approved: true,
            });

          if (insertError) {
            console.error('Error inserting goldilex_access:', insertError);
          }
        }

        // Update user_bbs subscription tier to gold
        const { error: bbError } = await supabase
          .from('user_bbs')
          .update({ subscription_tier: 'gold' })
          .eq('user_id', userId);

        if (bbError) {
          console.error('Error updating user_bbs tier:', bbError);
        }

        console.log('Gold subscription activated for user:', userId);

      } else {
        // Handle BB purchase
        const bbAmount = parseInt(session.metadata?.bb_amount || '0');
        const paymentIntentId = session.payment_intent as string;

        if (!bbAmount) {
          console.error('Missing bb_amount in checkout session metadata');
          return NextResponse.json(
            { error: 'Invalid session metadata' },
            { status: 400 }
          );
        }

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