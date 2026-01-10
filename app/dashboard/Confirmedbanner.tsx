"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ConfirmedBanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get("confirmed") !== "1") return;

    setShow(true);

    // Remove the param so refresh won't re-trigger
    const url = new URL(window.location.href);
    url.searchParams.delete("confirmed");
    router.replace(url.pathname + url.search, { scroll: false });

    // Auto-hide with cleanup
    const t = window.setTimeout(() => setShow(false), 5000);
    return () => window.clearTimeout(t);
  }, [searchParams, router]);

  if (!show) return null;

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
