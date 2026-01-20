'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BBStatus {
  monthly_bbs: number;
  purchased_bbs: number;
  total_bbs: number;
  days_until_reset: number;
  tier: string;
  can_purchase: number;
  is_gold: boolean;
}

export function BBCounter() {
  const [bbStatus, setBBStatus] = useState<BBStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBBStatus();
  }, []);

  async function fetchBBStatus() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

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

  if (loading) {
    return (
      <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  if (!bbStatus) {
    return null;
  }

  // Gold user display
  if (bbStatus.is_gold) {
    return (
      <div className="p-4 bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border border-yellow-600/50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⭐</span>
          <span className="font-semibold text-yellow-500">briefica gold</span>
        </div>
        <p className="text-sm text-gray-300">Unlimited downloads + goldilex access</p>
      </div>
    );
  }

  // Free user display
  return (
    <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">briefica bucks</span>
        <span className="text-2xl font-bold text-blue-400">{bbStatus.total_bbs} BB</span>
      </div>

      <div className="space-y-1 text-xs text-gray-500 mb-3">
        <div className="flex justify-between">
          <span>Monthly:</span>
          <span className="text-gray-300">{bbStatus.monthly_bbs} BB</span>
        </div>
        <div className="flex justify-between">
          <span>Purchased:</span>
          <span className="text-gray-300">{bbStatus.purchased_bbs} BB</span>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700">
          <span>Resets in {bbStatus.days_until_reset} days</span>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => window.location.href = '/buy-bbs'}
          disabled={bbStatus.can_purchase === 0}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
        >
          {bbStatus.can_purchase > 0 
            ? `Buy BBs (${bbStatus.can_purchase} available)` 
            : 'At purchase limit'}
        </button>
        
        <button
          onClick={() => window.location.href = '/pricing'}
          className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-medium transition-colors"
        >
          ⭐ Upgrade to Gold - $15/mo
        </button>
      </div>
    </div>
  );
}