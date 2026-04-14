"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";
import Footer from "../components/Footer";

export default function DownloadsPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGold, setIsGold] = useState(false);
  const [checking, setChecking] = useState(true);
  const [proxyKey, setProxyKey] = useState<string | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);
  // Early access signup
  const [earlyEmail, setEarlyEmail] = useState("");
  const [earlyLoading, setEarlyLoading] = useState(false);
  const [earlySent, setEarlySent] = useState(false);
  const [earlyError, setEarlyError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "downloads - briefica";
  }, []);

  useEffect(() => {
    async function checkAccess() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoggedIn(false);
        setIsGold(false);
        setChecking(false);
        return;
      }
      setIsLoggedIn(true);
      const { data } = await supabase
        .from("goldilex_access")
        .select("tier, approved")
        .eq("user_id", session.user.id)
        .single();
      const gold = data?.tier === "gold" && data?.approved === true;
      setIsGold(gold);
      setChecking(false);
      if (gold) fetchProxyKey();
    }
    checkAccess();
  }, []);

  async function fetchProxyKey() {
    setKeyLoading(true);
    setKeyError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/proxy-key/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ tier_variant: '100' }),
      });
      const json = await res.json();
      if (!res.ok) setKeyError(json.error ?? 'failed to load key');
      else setProxyKey(json.key);
    } catch {
      setKeyError('failed to load key');
    } finally {
      setKeyLoading(false);
    }
  }

  async function copyKey() {
    if (!proxyKey) return;
    await navigator.clipboard.writeText(proxyKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  async function submitEarlyAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!earlyEmail.trim()) return;
    setEarlyLoading(true);
    setEarlyError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: earlyEmail.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/early-access`,
        },
      });
      if (error) {
        setEarlyError(error.message);
      } else {
        setEarlySent(true);
      }
    } catch {
      setEarlyError('Something went wrong. Please try again.');
    } finally {
      setEarlyLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen overflow-x-hidden"
      style={{ background: "var(--bg)", color: "var(--t)" }}
    >
      {/* ── NAV ── */}
      <nav
        className="border-b border-white/10"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.push("/")}>
            <Image
              src="/logo_6.png"
              alt="briefica"
              width={160}
              height={48}
              className="object-contain"
            />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(isLoggedIn ? "/dashboard" : "/auth")}
              className="border border-white/20 rounded-lg py-2 px-4 font-medium hover:bg-white/5 transition-colors text-sm"
              style={{ color: "var(--t)" }}
            >
              {isLoggedIn ? "dashboard" : "back"}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HEADER ── */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10 text-center">
        <h1
          className="font-extrabold tracking-tight leading-none mb-3"
          style={{ fontSize: "clamp(36px,5vw,56px)", letterSpacing: "-2px", color: "var(--t)" }}
        >
          download briefica
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--t70)" }}>
          native macOS software for law students. choose your version below.
        </p>
      </div>

      {/* ── TWO-SQUARE VERSION GRID ── */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* ── v6 — Free ── */}
          <div
            className="rounded-2xl p-10 border border-white/10 flex flex-col"
            style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(20px)" }}
          >
            <div
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-6 self-start"
              style={{ background: "var(--inlay)", color: "var(--t70)" }}
            >
              Free
            </div>

            {/* macOS icon */}
            <div className="flex items-center justify-center mb-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center border"
                style={{
                  background: "rgba(102,178,255,0.12)",
                  borderColor: "rgba(102,178,255,0.2)",
                }}
              >
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24" style={{ color: "#66b2ff" }}>
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              </div>
            </div>

            <div
              className="font-extrabold tracking-tight leading-none mb-1"
              style={{ fontSize: "clamp(48px,6vw,72px)", letterSpacing: "-2px", color: "var(--t)" }}
            >
              v6
            </div>
            <div className="text-sm italic mb-6" style={{ color: "var(--t40)" }}>sanddollar</div>

            <p className="text-sm leading-relaxed mb-7" style={{ color: "var(--t70)" }}>
              Everything a law student needs to build a great outline. Add cases, construct your
              b-line, customize with mods, map your authorities with the visualizer, and export a
              print-ready .docx — completely free.
            </p>

            <div className="text-sm font-semibold mb-5" style={{ color: "var(--t60)" }}>
              Free, always.
            </div>

            <ul className="flex flex-col gap-2.5 mb-8">
              {[
                "Library — unlimited cases & authorities",
                "B-line outline builder (WYSIWYG)",
                ".docx export — what you see is what you get",
                "Mods — color customization",
                "Visualizer — semantic authority mapping",
                "b-web community access",
              ].map((f) => (
                <li key={f} className="flex gap-2.5 text-sm items-start" style={{ color: "var(--t70)" }}>
                  <span style={{ color: "#66b2ff" }} className="flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href="/downloads/briefica6.dmg"
              className="mt-auto block w-full text-center rounded-xl py-3 px-6 font-semibold text-base hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#66b2ff", color: "#1e1e1e" }}
            >
              Download v6 — Free
            </a>

            <p className="text-xs text-center mt-3" style={{ color: "var(--t50)" }}>
              ~54 MB · macOS 11.0+ · Apple silicon & Intel
            </p>
          </div>

          {/* ── v7 — Gold ── */}
          <div
            className="rounded-2xl p-10 border flex flex-col"
            style={{
              background: "rgba(240,192,64,0.03)",
              backdropFilter: "blur(20px)",
              borderColor: "rgba(240,192,64,0.2)",
            }}
          >
            <div
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full border mb-6 self-start"
              style={{
                background: "rgba(240,192,64,0.12)",
                color: "#f0c040",
                borderColor: "rgba(240,192,64,0.25)",
              }}
            >
              ✦ Gold
            </div>

            {/* macOS icon — gold tint */}
            <div className="flex items-center justify-center mb-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center border"
                style={{
                  background: "rgba(240,192,64,0.1)",
                  borderColor: "rgba(240,192,64,0.2)",
                }}
              >
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24" style={{ color: "#f0c040" }}>
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              </div>
            </div>

            <div
              className="font-extrabold tracking-tight leading-none mb-1"
              style={{ fontSize: "clamp(48px,6vw,72px)", letterSpacing: "-2px", color: "#f0c040" }}
            >
              v7
            </div>
            <div className="text-sm italic mb-6" style={{ color: "rgba(240,192,64,0.5)" }}>horizon</div>

            <p className="text-sm leading-relaxed mb-7" style={{ color: "var(--t70)" }}>
              Everything in v6, plus goldilex AI for grounded Q&amp;A and comprehension checks,
              advanced custom themes, and unlimited briefsets.
            </p>

            <div className="text-sm font-semibold mb-5" style={{ color: "#f0c040" }}>
              Early access — free for the first 50 users
            </div>

            <ul className="flex flex-col gap-2.5 mb-8">
              {[
                "Everything in v6",
                "goldilex AI — grounded in your briefset only",
                "Comprehension check MCQs",
                "Custom themes & advanced color palettes",
                "100 goldilex queries / month",
              ].map((f) => (
                <li key={f} className="flex gap-2.5 text-sm items-start" style={{ color: "var(--t70)" }}>
                  <span style={{ color: "#f0c040" }} className="flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* Gold-gated download button */}
            {checking ? (
              <button
                disabled
                className="mt-auto block w-full text-center rounded-xl py-3 px-6 font-bold text-base cursor-wait opacity-50"
                style={{ backgroundColor: "#f0c040", color: "#1a1200" }}
              >
                checking access...
              </button>
            ) : isGold ? (
              <>
                <a
                  href="/downloads/briefica7.dmg"
                  className="mt-auto block w-full text-center rounded-xl py-3 px-6 font-bold text-base hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#f0c040", color: "#1a1200" }}
                >
                  Download v7 — Gold
                </a>
                <p className="text-xs text-center mt-3" style={{ color: "rgba(240,192,64,0.5)" }}>
                  ~55 MB · macOS 11.0+ · Apple silicon & Intel
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={() => document.getElementById("early-access")?.scrollIntoView({ behavior: "smooth" })}
                  className="mt-auto block w-full text-center rounded-xl py-3 px-6 font-bold text-base hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#f0c040", color: "#1a1200" }}
                >
                  ✦ join early access — free
                </button>
                <p className="text-xs text-center mt-3" style={{ color: "rgba(240,192,64,0.4)" }}>
                  free for the first 50 users · no credit card required
                </p>
              </>
            )}
          </div>

        </div>
      </div>

      {/* ── EARLY ACCESS / GOLDILEX KEY ── */}
      <div id="early-access" className="max-w-6xl mx-auto px-6 pb-16">
        <div
          className="rounded-2xl p-10 border"
          style={{
            background: "rgba(240,192,64,0.03)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(240,192,64,0.2)",
          }}
        >
          {isGold ? (
            /* ── Gold user: show key ── */
            <>
              <h3 className="text-xl font-semibold mb-2" style={{ color: "#f0c040" }}>
                your goldilex key
              </h3>
              <p className="text-sm mb-6" style={{ color: "var(--t70)" }}>
                paste this into Settings → Master Key inside briefica 7 to activate goldilex AI.
              </p>

              {keyLoading && (
                <p className="text-sm" style={{ color: "rgba(240,192,64,0.5)" }}>loading key…</p>
              )}

              {keyError && (
                <p className="text-sm" style={{ color: "#ff6b6b" }}>{keyError}</p>
              )}

              {proxyKey && (
                <div
                  className="rounded-xl p-4 border flex items-center gap-3"
                  style={{ background: "rgba(0,0,0,0.3)", borderColor: "rgba(240,192,64,0.2)" }}
                >
                  <code
                    className="flex-1 text-sm break-all select-all"
                    style={{ fontFamily: "Courier New, monospace", color: "#f0c040" }}
                  >
                    {keyVisible ? proxyKey : "•".repeat(proxyKey.length)}
                  </code>
                  <button
                    onClick={() => setKeyVisible(v => !v)}
                    className="flex-shrink-0 transition-opacity hover:opacity-80"
                    title={keyVisible ? "hide" : "reveal"}
                    style={{ color: "rgba(240,192,64,0.6)" }}
                  >
                    {keyVisible ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={copyKey}
                    className="flex-shrink-0 rounded-lg py-1.5 px-3 text-xs font-semibold border transition-opacity hover:opacity-80"
                    style={{ background: "rgba(240,192,64,0.12)", borderColor: "rgba(240,192,64,0.25)", color: "#f0c040" }}
                  >
                    {copiedKey ? "copied!" : "copy"}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ── Non-gold: early access signup ── */
            <>
              <div
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full border mb-6"
                style={{ background: "rgba(240,192,64,0.12)", color: "#f0c040", borderColor: "rgba(240,192,64,0.25)" }}
              >
                ✦ early access — first 50 users
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: "#f0c040" }}>
                join briefica gold early access
              </h3>
              <p className="text-sm mb-7 max-w-lg" style={{ color: "var(--t70)" }}>
                get free access to briefica v7 and goldilex AI — the legal AI grounded exclusively in your own briefset. enter your email and we&apos;ll send you a confirmation link. once confirmed, your goldilex key will appear in your dashboard.
              </p>

              {earlySent ? (
                <div
                  className="rounded-xl p-5 border text-center"
                  style={{ borderColor: "rgba(240,192,64,0.3)", background: "rgba(240,192,64,0.06)" }}
                >
                  <p className="font-semibold mb-1" style={{ color: "#f0c040" }}>check your email</p>
                  <p className="text-sm" style={{ color: "var(--t70)" }}>
                    we sent a confirmation link to <strong style={{ color: "var(--t)" }}>{earlyEmail}</strong>. click it to activate your early access.
                  </p>
                </div>
              ) : (
                <form onSubmit={submitEarlyAccess} className="flex flex-col sm:flex-row gap-3 max-w-md">
                  <input
                    type="email"
                    required
                    value={earlyEmail}
                    onChange={e => setEarlyEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(240,192,64,0.25)",
                      color: "var(--t)",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={earlyLoading}
                    className="rounded-xl py-3 px-6 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
                    style={{ backgroundColor: "#f0c040", color: "#1a1200" }}
                  >
                    {earlyLoading ? "sending…" : "request access →"}
                  </button>
                </form>
              )}

              {earlyError && (
                <p className="text-sm mt-3" style={{ color: "#ff6b6b" }}>{earlyError}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── INSTALLATION ── */}
      <div className="max-w-4xl mx-auto px-6 pb-10">
        <div
          className="rounded-2xl p-8 border border-white/10"
          style={{ background: "var(--card)" }}
        >
          <h3 className="text-xl font-semibold mb-6" style={{ color: "var(--t)" }}>installation</h3>
          <div className="flex flex-col gap-5">
            {[
              { n: 1, title: "download the installer", body: "click the download button above to get the DMG file." },
              { n: 2, title: "open the DMG", body: "double-click the downloaded file to mount the installer." },
              { n: 3, title: "drag briefica to your desktop", body: "drag the briefica icon to your desktop." },
              { n: 4, title: "launch briefica", body: "double-click briefica to launch the software." },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex gap-4">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: "#66b2ff", color: "#1e1e1e" }}
                >
                  {n}
                </div>
                <div>
                  <p className="font-medium mb-0.5" style={{ color: "var(--t)" }}>{title}</p>
                  <p className="text-sm" style={{ color: "var(--t70)" }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILE TYPES ── */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div
          className="rounded-2xl p-8 border border-white/10"
          style={{ background: "var(--card)" }}
        >
          <h3 className="text-xl font-semibold mb-6" style={{ color: "var(--t)" }}>supported file types</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { src: "/bset.png", ext: ".bset", label: "briefset" },
              { src: "/bmod.png", ext: ".bmod", label: "b-modification" },
              { src: "/b_blank.png", ext: ".tbank", label: "typobank" },
            ].map(({ src, ext, label }) => (
              <div
                key={ext}
                className="text-center p-4 rounded-lg"
                style={{ background: "var(--inlay)" }}
              >
                <div className="flex justify-center mb-2">
                  <Image src={src} alt={label} width={40} height={40} className="object-contain" />
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: "var(--t)" }}>{ext}</div>
                <div className="text-sm" style={{ color: "var(--t60)" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER HELP ── */}
      <div className="max-w-4xl mx-auto px-6 pb-8 text-center text-sm" style={{ color: "var(--t50)" }}>
        <p>
          need help? contact{" "}
          <a href="mailto:support@briefica.com" className="underline hover:opacity-80" style={{ color: "var(--t70)" }}>
            support@briefica.com
          </a>
        </p>
      </div>

      <Footer />
    </main>
  );
}
