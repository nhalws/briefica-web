'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface BBStatus {
  monthly_bbs: number;
  purchased_bbs: number;
  total_bbs: number;
  days_until_reset: number;
  can_purchase: number;
  is_gold: boolean;
}

export default function BuyBBsPage() {
  const [bbStatus, setBBStatus] = useState<BBStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      redirect('/login');
      return;
    }
    setSession(session);
    fetchBBStatus(session);
  }

  async function fetchBBStatus(session: any) {
    try {
      const response = await fetch('/api/bbs/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBBStatus(data);
      }
    } catch (error) {
      console.error('Error fetching BB status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(amount: number) {
    if (!session) return;

    setPurchasing(true);

    try {
      const response = await fetch('/api/bbs/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ bb_amount: amount })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create checkout session');
        setPurchasing(false);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to start purchase');
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!bbStatus) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <p>Failed to load BB status</p>
      </div>
    );
  }

  if (bbStatus.is_gold) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="max-w-md text-center">
          <span className="text-6xl mb-4 block">⭐</span>
          <h1 className="text-2xl font-bold mb-2">You're already gold!</h1>
          <p className="text-gray-400 mb-6">
            Gold subscribers have unlimited downloads. No need to buy BBs.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (bbStatus.can_purchase === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">At Purchase Limit</h1>
          <p className="text-gray-400 mb-2">
            You already have {bbStatus.purchased_bbs} purchased BBs (maximum 3).
          </p>
          <p className="text-gray-400 mb-6">
            Use some BBs to download artifacts, then you can buy more.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.href = '/pricing'}
              className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded"
            >
              ⭐ Upgrade to Gold for Unlimited
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-2xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Buy briefica bucks</h1>
          <p className="text-gray-400">
            Purchase additional downloads. BBs never expire.
          </p>
        </div>

        {/* Current Status */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">Current Balance</p>
              <p className="text-2xl font-bold">{bbStatus.total_bbs} BB</p>
              <p className="text-xs text-gray-500 mt-1">
                {bbStatus.monthly_bbs} monthly + {bbStatus.purchased_bbs} purchased
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Can Purchase</p>
              <p className="text-2xl font-bold text-blue-400">
                {bbStatus.can_purchase} BB
              </p>
            </div>
          </div>
        </div>

        {/* Purchase Options */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold">Select Amount</h2>
          
          {[1, 2, 3].map((amount) => {
            const canBuy = amount <= bbStatus.can_purchase;
            const cost = amount * 5;
            
            return (
              <button
                key={amount}
                onClick={() => handlePurchase(amount)}
                disabled={!canBuy || purchasing}
                className={`
                  w-full p-4 rounded-lg border-2 transition-all
                  ${canBuy 
                    ? 'border-blue-600 hover:bg-blue-900/20 cursor-pointer' 
                    : 'border-gray-700 opacity-50 cursor-not-allowed'
                  }
                  ${purchasing ? 'opacity-50 cursor-wait' : ''}
                `}
              >
                <div className="flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-lg font-bold">
                      {amount} BB{amount > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-400">
                      {amount} additional download{amount > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-400">
                      ${cost}
                    </p>
                    <p className="text-xs text-gray-500">
                      $5 per BB
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Or Upgrade */}
        <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border border-yellow-600/50 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <span className="text-4xl">⭐</span>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-yellow-500 mb-2">
                Or upgrade to briefica gold
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 mb-4">
                <li>✓ Unlimited downloads (no BB limits)</li>
                <li>✓ Full goldilex AI access</li>
                <li>✓ Priority support</li>
                <li>✓ Only $15/month</li>
              </ul>
              <button
                onClick={() => window.location.href = '/pricing'}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-medium"
              >
                View Gold Plans
              </button>
            </div>
          </div>
        </div>

        {/* Back */}
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}