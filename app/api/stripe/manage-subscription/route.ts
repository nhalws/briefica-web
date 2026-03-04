import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function findSubscription(stripe: Stripe, email: string, subscriptionId?: string | null) {
  // Try by stored subscription ID first
  if (subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      if (sub && sub.status !== 'canceled') return sub;
    } catch {}
  }

  // Fall back to lookup by email
  const customers = await stripe.customers.list({ email, limit: 5 });
  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({ customer: customer.id, limit: 5 });
    const active = subs.data.find(s => s.status === 'active' || s.status === 'trialing');
    if (active) return active;
  }
  return null;
}

// GET — return current subscription status
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Get stored subscription ID from DB (use * so missing columns don't error)
    const { data: access } = await supabase
      .from('goldilex_access')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!access || access.tier !== 'gold' || !access.approved) {
      return NextResponse.json({ error: 'No active Gold subscription' }, { status: 404 });
    }

    const subscription = await findSubscription(stripe, user.email!, access.stripe_subscription_id ?? null);

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found in Stripe' }, { status: 404 });
    }

    const periodEnd = new Date(subscription.items.data[0].current_period_end * 1000);

    return NextResponse.json({
      subscription_id: subscription.id,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: periodEnd.toISOString(),
    });

  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription', details: error?.message }, { status: 500 });
  }
}

// POST — cancel_at_period_end | cancel_immediately | reactivate
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = await request.json();
  if (!['cancel_at_period_end', 'cancel_immediately', 'reactivate'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const { data: access } = await supabase
      .from('goldilex_access')
      .select('tier, approved, stripe_subscription_id')
      .eq('user_id', user.id)
      .single();

    if (!access || access.tier !== 'gold' || !access.approved) {
      return NextResponse.json({ error: 'No active Gold subscription' }, { status: 404 });
    }

    const subscription = await findSubscription(stripe, user.email!, access.stripe_subscription_id);

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found in Stripe' }, { status: 404 });
    }

    if (action === 'cancel_at_period_end') {
      await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });
      return NextResponse.json({ success: true, action });
    }

    if (action === 'reactivate') {
      await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: false });
      return NextResponse.json({ success: true, action });
    }

    if (action === 'cancel_immediately') {
      await stripe.subscriptions.cancel(subscription.id);

      // Immediately downgrade in DB
      await supabase
        .from('goldilex_access')
        .update({ tier: 'free', approved: false })
        .eq('user_id', user.id);

      await supabase
        .from('user_bbs')
        .update({ subscription_tier: 'free' })
        .eq('user_id', user.id);

      return NextResponse.json({ success: true, action });
    }

  } catch (error: any) {
    console.error('Error managing subscription:', error);
    return NextResponse.json({ error: 'Failed to manage subscription', details: error?.message }, { status: 500 });
  }
}
