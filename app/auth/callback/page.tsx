"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient"; // adjust path

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      const code = searchParams.get("code");

      // If there is no code, bounce somewhere safe
      if (!code) {
        router.replace("/auth?mode=signin");
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        // Optionally send them back with an error flag
        router.replace(`/auth?mode=signin&error=${encodeURIComponent(error.message)}`);
        return;
      }

      // Success: send to dashboard with banner flag
      router.replace("/dashboard?confirmed=1");
    })();
  }, [router, searchParams]);

  return null;
}
