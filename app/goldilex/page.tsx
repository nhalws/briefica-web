import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import GoldilexInterface from '@/components/goldilex/GoldilexInterface';

export default async function GoldilexPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Step 1: Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Not logged in - redirect to auth with return URL
    redirect('/auth?redirect=/goldilex');
  }

  // Step 2: Check if user has Gold access
  const { data: access, error } = await supabase
    .from('goldilex_access')
    .select('tier, approved')
    .eq('user_id', session.user.id)
    .single();

  // Check Gold status - must have tier='gold' AND approved=true
  const isGold = access?.tier === 'gold' && access?.approved === true;

  if (!isGold) {
    // Not Gold - redirect to pricing page
    redirect('/pricing?upgrade=goldilex');
  }

  // User is Gold and approved - show goldilex interface
  return <GoldilexInterface />;
}