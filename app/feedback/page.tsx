"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Footer from "../components/Footer";

export default function FeedbackPage() {
  const router = useRouter();
  const [version, setVersion] = useState("briefica v7");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "feedback - briefica";
  }, []);

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !message.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, username: username.trim(), message: message.trim() }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const json = await res.json();
        setError(json.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--t)" }}>
      {/* ── NAV ── */}
      <nav
        className="border-b border-white/10"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.push("/")}>
            <Image src="/logo_6.png" alt="briefica" width={160} height={48} className="object-contain" />
          </button>
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">
          <div
            className="rounded-2xl p-10 border border-white/10"
            style={{ background: "var(--card)" }}
          >
            <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--t)" }}>
              feedback & issues
            </h1>
            <p className="text-sm mb-8" style={{ color: "var(--t60)" }}>
              Let us know what's on your mind — bugs, suggestions, or anything else.
            </p>

            {sent ? (
              <div
                className="rounded-xl p-6 border text-center"
                style={{ borderColor: "rgba(102,178,255,0.3)", background: "rgba(102,178,255,0.06)" }}
              >
                <p className="font-semibold mb-1" style={{ color: "#66b2ff" }}>Thanks — feedback received!</p>
                <p className="text-sm mt-1" style={{ color: "var(--t60)" }}>We'll look into it shortly.</p>
                <button
                  onClick={() => { setSent(false); setMessage(""); setUsername(""); }}
                  className="mt-4 text-sm underline hover:opacity-80"
                  style={{ color: "var(--t50)" }}
                >
                  Submit another
                </button>
              </div>
            ) : (
              <form onSubmit={submitFeedback} className="flex flex-col gap-5">
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--t50)" }}>
                      Version
                    </label>
                    <select
                      value={version}
                      onChange={e => setVersion(e.target.value)}
                      className="rounded-lg px-3 py-2.5 text-sm outline-none"
                      style={{ background: "var(--inlay)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--t)" }}
                    >
                      <option value="briefica v7">briefica v7</option>
                      <option value="briefica v6">briefica v6</option>
                      <option value="other">other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--t50)" }}>
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="your username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="rounded-lg px-3 py-2.5 text-sm outline-none"
                      style={{ background: "var(--inlay)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--t)" }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--t50)" }}>
                    Feedback
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe your feedback or issue..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                    style={{ background: "var(--inlay)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--t)" }}
                  />
                </div>

                {error && <p className="text-xs" style={{ color: "#ff6b6b" }}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: "#66b2ff", color: "#1e1e1e" }}
                >
                  {loading ? "sending…" : "send feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
