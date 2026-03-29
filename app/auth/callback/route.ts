import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EARLY_ACCESS_LIMIT = 50;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const earlyAccess = requestUrl.searchParams.get('early_access') === '1';

  let userId: string | null = null;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);
    userId = session?.user?.id ?? null;
  }

  // Provision early access gold if flag is set and we have a user
  if (earlyAccess && userId) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user already has gold access
    const { data: existing } = await admin
      .from('goldilex_access')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!existing) {
      // Check total early access slots used
      const { count } = await admin
        .from('goldilex_access')
        .select('id', { count: 'exact', head: true })
        .eq('tier', 'gold')
        .eq('approved', true);

      if ((count ?? 0) < EARLY_ACCESS_LIMIT) {
        // Provision gold access
        await admin.from('goldilex_access').insert({
          user_id: userId,
          tier: 'gold',
          approved: true,
        });

        // Generate proxy key
        const newKey = `BRF7-G100-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`;
        await admin.from('proxy_keys').insert({
          user_id: userId,
          key: newKey,
          tier: '100',
          created_at: new Date().toISOString(),
          revoked: false,
        });
      }
    }
  }

  return NextResponse.redirect(new URL('/dashboard?confirmed=1', request.url));
}