"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient"; // adjust path

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      const code = searchParams.get("code");

      if (!code) {
        router.replace("/auth?mode=signin");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        router.replace(`/auth?mode=signin&error=${encodeURIComponent(error.message)}`);
        return;
      }

      router.replace("/dashboard?confirmed=1");
    })();
  }, [router, searchParams]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#2b2b2b] text-white">
      <div className="text-white/70">Confirming your account…</div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#2b2b2b] text-white">
          <div className="text-white/70">Loading…</div>
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
