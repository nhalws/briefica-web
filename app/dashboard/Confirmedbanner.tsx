"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function ConfirmedBanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [type, setType] = useState<"account" | "gold" | null>(null);

  useEffect(() => {
    const confirmed = searchParams.get("confirmed");
    if (confirmed !== "1" && confirmed !== "gold") return;

    const url = new URL(window.location.href);
    url.searchParams.delete("confirmed");
    router.replace(url.pathname + url.search, { scroll: false });

    if (confirmed === "gold") {
      // Provision gold client-side — session is guaranteed established by now
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session) return;
        try {
          await fetch('/api/early-access/provision', {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
        } catch (e) {
          console.error('[ConfirmedBanner] provision error:', e);
        }
        setType("gold");
        // Reload so dashboard re-checks goldilex_access and enables the button
        setTimeout(() => window.location.reload(), 3000);
      });
    } else {
      setType("account");
      const t = window.setTimeout(() => setType(null), 5000);
      return () => window.clearTimeout(t);
    }
  }, [searchParams, router]);

  if (!type) return null;

  if (type === "gold") {
    return (
      <div
        style={{
          background: "#BF9B30",
          color: "#fff",
          padding: "12px 16px",
          borderRadius: 12,
          fontWeight: 600,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span>Gold membership activated — you now have access to Goldilex.</span>
        <button
          onClick={() => router.push("/goldilex")}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "1px solid rgba(255,255,255,0.5)",
            color: "#fff",
            padding: "4px 14px",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Open Goldilex
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#66b2ff",
        color: "#fff",
        padding: "12px 16px",
        borderRadius: 12,
        fontWeight: 600,
        marginBottom: 16,
      }}
    >
      Account has been activated.
    </div>
  );
}
