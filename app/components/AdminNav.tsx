'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin user IDs - replace with your actual user ID
const ADMIN_USER_IDS = [
  'cebc00d5-e17d-4d97-87ac-0cb3c2d90b15', // Your user ID - replace this!
];

export default function AdminNav() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const adminStatus = ADMIN_USER_IDS.includes(session.user.id);
    setIsAdmin(adminStatus);

    if (adminStatus) {
      // Fetch pending submissions count
      const { count, error } = await supabase
        .from('grade_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (!error && count !== null) {
        setPendingCount(count);
      }
    }
  }

  if (!isAdmin) return null;

  return (
    <div className="relative">
      <Link
        href="/admin/grades"
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-medium flex items-center gap-2"
      >
        🛡️ Admin
        {pendingCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {pendingCount}
          </span>
        )}
      </Link>
    </div>
  );
}