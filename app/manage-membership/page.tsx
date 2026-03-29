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
  const [manualGold, setManualGold] = useState(false);
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [proxyKey, setProxyKey] = useState<string | null>(null);
  const [keyVisible, setKeyVisible] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  useEffect(() => {
    if (manualGold || subInfo) fetchGoldilexKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualGold, subInfo]);

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
        if (data.error === 'Subscription not found in Stripe') {
          setManualGold(true);
        } else {
          setError((data.details ? `${data.error}: ${data.details}` : data.error) || 'Failed to load subscription info');
        }
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

  async function fetchGoldilexKey() {
    setKeyLoading(true);
    setKeyError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/proxy-key/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier_variant: '100' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setKeyError(data.error || 'Failed to generate key');
        return;
      }
      setProxyKey(data.key);
    } catch {
      setKeyError('Failed to generate key. Please try again.');
    } finally {
      setKeyLoading(false);
    }
  }

  async function copyKey() {
    if (!proxyKey) return;
    await navigator.clipboard.writeText(proxyKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const periodEnd = subInfo ? new Date(subInfo.current_period_end) : null;
  const isGold = manualGold || !!subInfo;

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

        {manualGold && !loading && (
          <div className="border border-yellow-600/40 bg-[#1e1e1e] rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⭐</span>
              <div>
                <p className="font-semibold text-yellow-400">briefica gold</p>
                <p className="text-xs text-white/50">Manually provisioned</p>
              </div>
            </div>
            <p className="text-sm text-white/60">
              Your Gold membership was set up outside of the standard billing flow and does not have an associated Stripe subscription. To make changes, please contact support.
            </p>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 border border-green-500/30 bg-green-900/10 rounded-xl p-4">
            <p className="text-green-400 text-sm">{successMsg}</p>
          </div>
        )}

        {isGold && !loading && (
          <div className="border border-yellow-600/40 bg-[#1e1e1e] rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-lg">🔑</span>
              <p className="font-semibold text-yellow-400 text-sm">goldilex key</p>
            </div>
            <p className="text-xs text-white/50 mb-4">
              Paste this key into briefica&nbsp;7 → Settings → Master Key to activate Goldilex AI.
            </p>

            {keyLoading && (
              <div className="text-xs text-white/40 py-2">Loading key…</div>
            )}

            {keyError && (
              <p className="text-xs text-red-400 mt-2">{keyError}</p>
            )}

            {proxyKey && (
              <div className="mt-2">
                <div className="flex items-center gap-2 bg-[#2b2b2b] border border-yellow-600/20 rounded-lg px-3 py-2">
                  <span className="font-mono text-xs text-yellow-300 flex-1 tracking-wide select-all break-all">
                    {keyVisible ? proxyKey : '•'.repeat(proxyKey.length)}
                  </span>
                  <button
                    onClick={() => setKeyVisible(v => !v)}
                    className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
                    title={keyVisible ? 'Hide key' : 'Reveal key'}
                  >
                    {keyVisible ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={copyKey}
                    className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0"
                    title="Copy key"
                  >
                    {copied ? (
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-white/30 mt-2">
                  This key is tied to your account. Do not share it.
                </p>
              </div>
            )}
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
