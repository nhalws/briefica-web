import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EARLY_ACCESS_LIMIT = 50;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

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

  if (userId) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check current goldilex_access state (DB trigger may have already created a free-tier row)
    const { data: existing } = await admin
      .from('goldilex_access')
      .select('id, tier, approved')
      .eq('user_id', userId)
      .single();

    const alreadyGold = existing?.tier === 'gold' && existing?.approved === true;

    if (!alreadyGold) {
      // Check total early access slots used
      const { count } = await admin
        .from('goldilex_access')
        .select('id', { count: 'exact', head: true })
        .eq('tier', 'gold')
        .eq('approved', true);

      if ((count ?? 0) < EARLY_ACCESS_LIMIT) {
        if (existing) {
          // DB trigger already created a free-tier row — upgrade it to gold
          await admin
            .from('goldilex_access')
            .update({ tier: 'gold', approved: true })
            .eq('user_id', userId);
        } else {
          // No row yet — insert a gold row directly
          await admin.from('goldilex_access').insert({
            user_id: userId,
            tier: 'gold',
            approved: true,
          });
        }

        // Generate proxy key (idempotent — skip if one already exists)
        const { data: existingKey } = await admin
          .from('proxy_keys')
          .select('key')
          .eq('user_id', userId)
          .eq('tier', '100')
          .eq('revoked', false)
          .single();

        if (!existingKey) {
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
  }

  return NextResponse.redirect(new URL('/dashboard?confirmed=1', request.url));
}
