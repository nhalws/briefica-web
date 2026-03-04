'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SubscriptionInfo {
  subscription_id: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string;
}

export default function ManageMembershipPage() {
  const router = useRouter();
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }

      const res = await fetch('/api/stripe/manage-subscription', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to load subscription info');
        return;
      }

      setSubInfo(await res.json());
    } catch {
      setError('Failed to load subscription info');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: 'cancel_at_period_end' | 'reactivate' | 'cancel_immediately') {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/stripe/manage-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Action failed');
        return;
      }

      if (action === 'cancel_immediately') {
        router.push('/dashboard');
        return;
      }

      setSuccessMsg(
        action === 'cancel_at_period_end'
          ? 'Auto-renewal turned off. Your Gold access continues until the end of the billing period.'
          : 'Auto-renewal reactivated. Your membership will renew automatically.'
      );
      setShowUnsubscribeConfirm(false);
      await fetchSubscription();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  const periodEnd = subInfo ? new Date(subInfo.current_period_end) : null;

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 text-white/60 hover:text-white flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold mb-2">Manage Membership</h1>
        <p className="text-white/60 text-sm mb-8">Manage your briefica gold subscription.</p>

        {loading && (
          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-white/10 rounded w-1/2" />
              <div className="h-4 bg-white/10 rounded w-3/4" />
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="border border-red-500/30 bg-red-900/10 rounded-2xl p-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 border border-green-500/30 bg-green-900/10 rounded-xl p-4">
            <p className="text-green-400 text-sm">{successMsg}</p>
          </div>
        )}

        {subInfo && !loading && (
          <>
            {/* Current plan card */}
            <div className="border border-yellow-600/40 bg-[#1e1e1e] rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⭐</span>
                <div>
                  <p className="font-semibold text-yellow-400">briefica gold</p>
                  <p className="text-xs text-white/50">$15 / month</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Status</span>
                  <span className={subInfo.cancel_at_period_end ? 'text-yellow-400' : 'text-green-400'}>
                    {subInfo.cancel_at_period_end ? 'Cancels at period end' : 'Active'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">
                    {subInfo.cancel_at_period_end ? 'Access until' : 'Next renewal'}
                  </span>
                  <span>{periodEnd?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Auto-renewal</span>
                  <span className={subInfo.cancel_at_period_end ? 'text-red-400' : 'text-green-400'}>
                    {subInfo.cancel_at_period_end ? 'Off' : 'On'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-6 space-y-4">
              <h2 className="font-semibold">Subscription options</h2>

              {/* Toggle auto-renewal */}
              {!subInfo.cancel_at_period_end ? (
                <div>
                  <p className="text-sm text-white/60 mb-3">
                    Turn off auto-renewal and your Gold membership will remain active until{' '}
                    <span className="text-white">
                      {periodEnd?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    , then you will revert to the free plan.
                  </p>
                  <button
                    onClick={() => handleAction('cancel_at_period_end')}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors text-sm disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating...' : 'Turn off auto-renewal'}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-white/60 mb-3">
                    Auto-renewal is off. Your membership ends on{' '}
                    <span className="text-white">
                      {periodEnd?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    . Reactivate to keep your Gold membership going.
                  </p>
                  <button
                    onClick={() => handleAction('reactivate')}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {actionLoading ? 'Updating...' : 'Reactivate auto-renewal'}
                  </button>
                </div>
              )}

              <hr className="border-white/10" />

              {/* Unsubscribe */}
              {!showUnsubscribeConfirm ? (
                <div>
                  <p className="text-sm text-white/60 mb-3">
                    Unsubscribing immediately ends your Gold membership. You will lose access to Goldilex and revert to a 3 BB / 30-day download limit.
                  </p>
                  <button
                    onClick={() => setShowUnsubscribeConfirm(true)}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 rounded-lg bg-red-700/30 border border-red-600/40 hover:bg-red-700/50 text-red-400 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    Unsubscribe from Gold
                  </button>
                </div>
              ) : (
                <div className="border border-red-600/40 bg-red-900/10 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-400 mb-2">Are you sure?</p>
                  <p className="text-sm text-white/60 mb-4">
                    This will immediately cancel your Gold subscription. You will:
                  </p>
                  <ul className="text-sm text-white/60 mb-4 space-y-1 list-disc list-inside">
                    <li>Lose access to Goldilex AI</li>
                    <li>Revert to a 3 BB / 30-day download limit</li>
                    <li>Not receive a refund for the current billing period</li>
                  </ul>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowUnsubscribeConfirm(false)}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-colors text-sm"
                    >
                      Keep membership
                    </button>
                    <button
                      onClick={() => handleAction('cancel_immediately')}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {actionLoading ? 'Cancelling...' : 'Yes, unsubscribe'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
