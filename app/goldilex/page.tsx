'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import GoldilexInterface from '@/components/goldilex/GoldilexInterface';

export default function GoldilexPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/auth?redirect=/goldilex');
        return;
      }

      const { data, error } = await supabase
        .from('goldilex_access')
        .select('tier, approved')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error('Failed to fetch goldilex access:', error.message);
      }

      const isGold = data?.tier === 'gold' && data?.approved === true;

      if (!isGold) {
        router.replace('/pricing?upgrade=goldilex');
        return;
      }

      if (!cancelled) {
        setCanAccess(true);
        setChecking(false);
      }
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#1e1e1e] text-white">
        Checking access...
      </main>
    );
  }

  if (!canAccess) {
    return null;
  }

  return <GoldilexInterface />;
}
