"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ConfirmedBanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [type, setType] = useState<"account" | "gold" | null>(null);

  useEffect(() => {
    const confirmed = searchParams.get("confirmed");
    if (confirmed !== "1" && confirmed !== "gold") return;

    setType(confirmed === "gold" ? "gold" : "account");

    const url = new URL(window.location.href);
    url.searchParams.delete("confirmed");
    router.replace(url.pathname + url.search, { scroll: false });

    const t = window.setTimeout(() => setType(null), 5000);
    return () => window.clearTimeout(t);
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
