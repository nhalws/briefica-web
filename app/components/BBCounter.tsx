'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
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

  // Determine which BB image to show
  const getBBImage = () => {
    if (!bbStatus) return '/0bb.png';
    if (bbStatus.is_gold) return '/7bb.png'; // Gold/infinite BB image
    const total = Math.min(bbStatus.total_bbs, 7); // Cap at 7
    return `/${total}bb.png`; // 0bb.png through 7bb.png
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/2 mb-2 mx-auto"></div>
        <div className="h-8 bg-white/10 rounded w-3/4 mx-auto"></div>
      </div>
    );
  }

  if (!bbStatus) {
    return null;
  }

  return (
    <div>
      {/* BB Title Image */}
      <div className="flex justify-center mb-2">
        <Image 
          src="/briefica-bucks.png" 
          alt="briefica bucks" 
          width={160} 
          height={40}
          className="object-contain"
        />
      </div>

      {/* BB Icon - ONLY THE IMAGE, NO TEXT */}
      <div className="flex justify-center mb-3">
        <Image 
          src={getBBImage()} 
          alt={`${bbStatus.total_bbs} BB`} 
          width={90} 
          height={90}
          className="object-contain"
        />
      </div>

      {/* BB Breakdown - Only show for non-gold users */}
      {!bbStatus.is_gold && (
        <div className="space-y-1 text-xs text-white/60 mb-3">
          <div className="flex justify-between">
            <span>Monthly:</span>
            <span className="font-medium text-white">{bbStatus.monthly_bbs} BB</span>
          </div>
          <div className="flex justify-between">
            <span>Purchased:</span>
            <span className="font-medium text-white">{bbStatus.purchased_bbs} BB</span>
          </div>
          <div className="text-xs text-white/40 mt-2">
            Resets in {bbStatus.days_until_reset} days
          </div>
        </div>
      )}

      {/* Gold badge for gold users */}
      {bbStatus.is_gold && (
        <div className="mb-3 text-center text-sm text-yellow-500">
          ⭐ briefica gold member
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {!bbStatus.is_gold && bbStatus.can_purchase > 0 && (
          <button
            onClick={() => router.push('/buy-bbs')}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors text-sm"
          >
            Buy BBs ({bbStatus.can_purchase} available)
          </button>
        )}

        {!bbStatus.is_gold && bbStatus.can_purchase === 0 && (
          <div className="w-full px-4 py-2 bg-gray-700 rounded font-medium text-center text-white/60 text-sm">
            At purchase limit
          </div>
        )}

        <button
          onClick={() => router.push('/pricing')}
          className="w-full px-4 py-2 rounded font-medium transition-colors hover:opacity-90 text-sm"
          style={{ backgroundColor: '#BF9B30', color: 'white' }}
        >
          Upgrade to Gold - $15/mo
        </button>
      </div>
    </div>
  );
}