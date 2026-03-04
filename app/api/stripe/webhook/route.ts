import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
        console.log('Processing Gold subscription for user:', userId);

        const stripeSubscriptionId = session.subscription as string | null;
        const stripeCustomerId = session.customer as string | null;

        const { data: existing } = await supabase
          .from('goldilex_access')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (existing) {
          const { error: updateError } = await supabase
            .from('goldilex_access')
            .update({
              tier: 'gold',
              approved: true,
              stripe_subscription_id: stripeSubscriptionId,
              stripe_customer_id: stripeCustomerId,
            })
            .eq('user_id', userId);

          if (updateError) {
            console.error('Error updating goldilex_access:', updateError);
          }
        } else {
          const { error: insertError } = await supabase
            .from('goldilex_access')
            .insert({
              user_id: userId,
              tier: 'gold',
              approved: true,
              stripe_subscription_id: stripeSubscriptionId,
              stripe_customer_id: stripeCustomerId,
            });

          if (insertError) {
            console.error('Error inserting goldilex_access:', insertError);
          }
        }

        await supabase
          .from('user_bbs')
          .update({ subscription_tier: 'gold' })
          .eq('user_id', userId);

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

    // Handle subscription cancelled/deleted (auto-renewal lapsed or immediate cancel)
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('Subscription deleted:', subscription.id);

      // Find user by stripe_subscription_id or stripe_customer_id
      const { data: access } = await supabase
        .from('goldilex_access')
        .select('user_id')
        .or(`stripe_subscription_id.eq.${subscription.id},stripe_customer_id.eq.${subscription.customer}`)
        .single();

      if (access?.user_id) {
        await supabase
          .from('goldilex_access')
          .update({ tier: 'free', approved: false })
          .eq('user_id', access.user_id);

        await supabase
          .from('user_bbs')
          .update({ subscription_tier: 'free' })
          .eq('user_id', access.user_id);

        console.log('Downgraded user to free:', access.user_id);
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
