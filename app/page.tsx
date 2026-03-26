"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "./lib/supabaseClient";
import Footer from "./components/Footer";

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedMcq, setSelectedMcq] = useState(0);
  const [b65Imgs, setB65Imgs] = useState<string[]>([]);
  const [b7Imgs, setB7Imgs] = useState<string[]>([]);
  const [b65Idx, setB65Idx] = useState(0);
  const [b7Idx, setB7Idx] = useState(0);
  const vizCanvasRef = useRef<HTMLDivElement>(null);
  const vizSvgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      setIsLoggedIn(!!data.user);
    }
    checkAuth();
  }, []);

  // Shuffle screencaps for versions section
  useEffect(() => {
    const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);
    const all65 = [1,2,3,4,5,6].map(i => `/screencaps/b65/sc${i}.png`);
    const all7 = [1,2,3,4,5,7,8,9,10,11].map(i => `/screencaps/b7/sc${i}.png`);
    setB65Imgs(shuffle(all65));
    setB7Imgs(shuffle(all7));
  }, []);

  // Cycle screencap slideshows
  useEffect(() => {
    if (b65Imgs.length < 2) return;
    const t = setInterval(() => setB65Idx(i => (i + 1) % b65Imgs.length), 3000);
    return () => clearInterval(t);
  }, [b65Imgs]);

  useEffect(() => {
    if (b7Imgs.length < 2) return;
    const t = setInterval(() => setB7Idx(i => (i + 1) % b7Imgs.length), 3200);
    return () => clearInterval(t);
  }, [b7Imgs]);

  // Fade-in on scroll
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        }),
      { threshold: 0.06 }
    );
    document.querySelectorAll(".fade-up").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Visualizer lines
  function drawVizLines() {
    const canvas = vizCanvasRef.current;
    const svg = vizSvgRef.current;
    if (!canvas || !svg) return;
    const anchor = document.getElementById("vn0");
    if (!anchor) return;
    const ax = anchor.offsetLeft + anchor.offsetWidth / 2;
    const ay = anchor.offsetTop + anchor.offsetHeight / 2;
    svg.innerHTML = "";
    ["vn1", "vn2", "vn3", "vn4", "vn5"].forEach((id) => {
      const n = document.getElementById(id);
      if (!n) return;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(ax));
      line.setAttribute("y1", String(ay));
      line.setAttribute("x2", String(n.offsetLeft + n.offsetWidth / 2));
      line.setAttribute("y2", String(n.offsetTop + n.offsetHeight / 2));
      line.setAttribute("stroke", "rgba(102,178,255,0.3)");
      line.setAttribute("stroke-width", "1.5");
      line.setAttribute("stroke-dasharray", "4 3");
      svg.appendChild(line);
    });
  }

  useEffect(() => {
    drawVizLines();
    window.addEventListener("resize", drawVizLines);
    return () => window.removeEventListener("resize", drawVizLines);
  });

  return (
    <main className="min-h-screen text-white overflow-x-hidden" style={{ background: "var(--bg)" }}>
      <style>{`
        html { scroll-behavior: smooth; }
        .fade-up { opacity: 0; transform: translateY(20px); transition: opacity 0.65s ease, transform 0.65s ease; }
        .fade-up.visible { opacity: 1; transform: translateY(0); }

        @keyframes heroLine1 {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroLine2 {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroDesc {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 0.85; transform: translateY(0); }
        }
        @keyframes heroBtns {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes titleGlow {
          0%, 100% { text-shadow: 0 0 60px rgba(102,178,255,0.0), 0 0 120px rgba(102,178,255,0.0); }
          50%       { text-shadow: 0 0 60px rgba(102,178,255,0.18), 0 0 120px rgba(102,178,255,0.08); }
        }
        @keyframes nodePulse {
          0%, 100% { opacity: 0.08; }
          50%       { opacity: 0.15; }
        }

        .hero-line1 {
          display: block;
          animation: heroLine1 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both;
        }
        .hero-line2 {
          display: block;
          animation: heroLine2 0.9s cubic-bezier(0.16,1,0.3,1) 0.35s both;
        }
        .hero-title {
          animation: titleGlow 5s ease-in-out 1.4s infinite;
        }
        .hero-desc {
          animation: heroDesc 1s cubic-bezier(0.16,1,0.3,1) 0.65s both;
        }
        .hero-btns {
          animation: heroBtns 0.8s cubic-bezier(0.16,1,0.3,1) 0.9s both;
        }
        .bg-node {
          animation: nodePulse 9s ease-in-out infinite;
        }
      `}</style>

      {/* ── NAV ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/10"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo_6.png" alt="briefica" width={160} height={48} className="object-contain" />
            {/* Spinning node — preserved exactly */}
            <div className="w-14 h-14 text-white/90">
              <svg viewBox="0 0 64 64" className="w-full h-full">
                <g transform="skewX(-8) skewY(5)">
                  <animateTransform attributeName="transform" type="rotate" from="0 32 32" to="360 32 32" dur="80s" repeatCount="indefinite" />
                  <circle cx="32" cy="32" r="5" fill="#66b2ff" stroke="#e6eaf0" strokeWidth="1.5" />
                  <defs>
                    <circle id="orbit-node" r="4" fill="#66b2ff" stroke="#e6eaf0" strokeWidth="1.5" />
                  </defs>
                  {[
                    { angle: 0, dur: "36s", sway: "8s" },
                    { angle: 60, dur: "40s", sway: "7s" },
                    { angle: 120, dur: "44s", sway: "9s" },
                    { angle: 180, dur: "38s", sway: "8.5s" },
                    { angle: 240, dur: "46s", sway: "7.5s" },
                    { angle: 300, dur: "42s", sway: "9.5s" },
                  ].map(({ angle, dur, sway }) => (
                    <g key={angle} transform={`rotate(${angle} 32 32)`}>
                      <g>
                        <line x1="32" y1="32" x2="32" y2="8" stroke="#e6eaf0" strokeWidth="1.25">
                          <animate attributeName="y2" dur={sway} repeatCount="indefinite" keyTimes="0;0.5;1" values="8;6;8" />
                        </line>
                        <use href="#orbit-node" x="32" y="8">
                          <animate attributeName="y" dur={sway} repeatCount="indefinite" keyTimes="0;0.5;1" values="8;6;8" />
                        </use>
                      </g>
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        dur={dur}
                        repeatCount="indefinite"
                        keyTimes="0;0.33;0.66;1"
                        values={`${angle} 32 32; ${angle + 360} 32 32; ${angle - 360} 32 32; ${angle + 360} 32 32`}
                      />
                    </g>
                  ))}
                </g>
              </svg>
            </div>
            {/* Nav links */}
            <div className="hidden md:flex items-center gap-1 ml-2">
              {(
                [
                  ["#versions", "versions"],
                  ["#how", "how it works"],
                  ["#goldilex", "goldilex"],
                  ["#pricing", "pricing"],
                  ["#bweb", "b-web"],
                ] as [string, string][]
              ).map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {isLoggedIn ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-white text-black rounded-lg py-2 px-4 font-semibold hover:bg-white/90 transition-colors"
              >
                dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push("/auth")}
                  className="border border-white/20 rounded-lg py-2 px-4 font-medium hover:bg-white/5 transition-colors"
                >
                  sign in
                </button>
                <button
                  onClick={() => router.push("/auth")}
                  className="bg-white text-black rounded-lg py-2 px-4 font-semibold hover:bg-white/90 transition-colors"
                >
                  create account
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="relative overflow-hidden">
        {/* Large background constellation node — right-aligned, partially clipped */}
        <div
          className="bg-node pointer-events-none select-none"
          style={{
            position: "absolute",
            top: "-120px",
            right: "-320px",
            width: "900px",
            height: "900px",
            zIndex: 0,
          }}
        >
          <svg viewBox="0 0 64 64" width="900" height="900">
            {/* Central hub */}
            <circle cx="32" cy="32" r="4.5" fill="rgba(102,178,255,0.75)" stroke="rgba(230,234,240,0.5)" strokeWidth="0.35" />

            {/* Arm 1 — long, clockwise 55s */}
            <g>
              <animateTransform attributeName="transform" type="rotate"
                from="0 32 32" to="360 32 32" dur="55s" repeatCount="indefinite" />
              <line x1="32" y1="32" x2="32" y2="5" stroke="rgba(230,234,240,0.35)" strokeWidth="0.5" />
              <circle cx="32" cy="5" r="3.5" fill="rgba(102,178,255,0.75)" stroke="rgba(230,234,240,0.5)" strokeWidth="0.3" />
            </g>

            {/* Arm 2 — medium, counter-clockwise 38s, offset 48° */}
            <g transform="rotate(48 32 32)">
              <animateTransform attributeName="transform" type="rotate"
                from="48 32 32" to="-312 32 32" dur="38s" repeatCount="indefinite" />
              <line x1="32" y1="32" x2="32" y2="10" stroke="rgba(230,234,240,0.3)" strokeWidth="0.4" />
              <circle cx="32" cy="10" r="2" fill="rgba(102,178,255,0.7)" stroke="rgba(230,234,240,0.45)" strokeWidth="0.25" />
            </g>

            {/* Arm 3 — medium-long, clockwise 72s, offset 105° */}
            <g transform="rotate(105 32 32)">
              <animateTransform attributeName="transform" type="rotate"
                from="105 32 32" to="465 32 32" dur="72s" repeatCount="indefinite" />
              <line x1="32" y1="32" x2="32" y2="7.5" stroke="rgba(230,234,240,0.3)" strokeWidth="0.45" />
              <circle cx="32" cy="7.5" r="2.8" fill="rgba(102,178,255,0.72)" stroke="rgba(230,234,240,0.48)" strokeWidth="0.28" />
            </g>

            {/* Arm 4 — very long, counter-clockwise 90s, offset 158° */}
            <g transform="rotate(158 32 32)">
              <animateTransform attributeName="transform" type="rotate"
                from="158 32 32" to="-202 32 32" dur="90s" repeatCount="indefinite" />
              <line x1="32" y1="32" x2="32" y2="4.5" stroke="rgba(230,234,240,0.35)" strokeWidth="0.55" />
              <circle cx="32" cy="4.5" r="3.8" fill="rgba(102,178,255,0.75)" stroke="rgba(230,234,240,0.5)" strokeWidth="0.32" />
            </g>

            {/* Arm 5 — short, fast clockwise 28s, offset 200° */}
            <g transform="rotate(200 32 32)">
              <animateTransform attributeName="transform" type="rotate"
                from="200 32 32" to="560 32 32" dur="28s" repeatCount="indefinite" />
              <line x1="32" y1="32" x2="32" y2="12" stroke="rgba(230,234,240,0.28)" strokeWidth="0.35" />
              <circle cx="32" cy="12" r="1.8" fill="rgba(102,178,255,0.68)" stroke="rgba(230,234,240,0.42)" strokeWidth="0.22" />
            </g>

            {/* Arm 6 — medium, clockwise 50s, offset 248° */}
            <g transform="rotate(248 32 32)">
              <animateTransform attributeName="transform" type="rotate"
                from="248 32 32" to="608 32 32" dur="50s" repeatCount="indefinite" />
              <line x1="32" y1="32" x2="32" y2="8.5" stroke="rgba(230,234,240,0.3)" strokeWidth="0.4" />
              <circle cx="32" cy="8.5" r="2.4" fill="rgba(102,178,255,0.7)" stroke="rgba(230,234,240,0.46)" strokeWidth="0.26" />
            </g>

            {/* Arm 7 — medium-long, counter-clockwise 68s, offset 308° */}
            <g transform="rotate(308 32 32)">
              <animateTransform attributeName="transform" type="rotate"
                from="308 32 32" to="-52 32 32" dur="68s" repeatCount="indefinite" />
              <line x1="32" y1="32" x2="32" y2="6" stroke="rgba(230,234,240,0.32)" strokeWidth="0.45" />
              <circle cx="32" cy="6" r="3" fill="rgba(102,178,255,0.73)" stroke="rgba(230,234,240,0.48)" strokeWidth="0.28" />
            </g>

            {/* Arm 8 — short, counter-clockwise 35s, offset 345° */}
            <g transform="rotate(345 32 32)">
              <animateTransform attributeName="transform" type="rotate"
                from="345 32 32" to="-15 32 32" dur="35s" repeatCount="indefinite" />
              <line x1="32" y1="32" x2="32" y2="11" stroke="rgba(230,234,240,0.28)" strokeWidth="0.35" />
              <circle cx="32" cy="11" r="2" fill="rgba(102,178,255,0.68)" stroke="rgba(230,234,240,0.42)" strokeWidth="0.22" />
            </g>

            {/* Arm 9 — very short inner, clockwise 22s, offset 130° */}
            <g transform="rotate(130 32 32)">
              <animateTransform attributeName="transform" type="rotate"
                from="130 32 32" to="490 32 32" dur="22s" repeatCount="indefinite" />
              <line x1="32" y1="32" x2="32" y2="15" stroke="rgba(230,234,240,0.25)" strokeWidth="0.3" />
              <circle cx="32" cy="15" r="1.5" fill="rgba(102,178,255,0.65)" stroke="rgba(230,234,240,0.4)" strokeWidth="0.2" />
            </g>
          </svg>
        </div>

        {/* Hero content */}
        <div className="relative max-w-6xl mx-auto px-6 text-center pt-[120px] pb-20" style={{ zIndex: 1 }}>
          <h1
            className="hero-title font-light uppercase leading-none mb-6"
            style={{
              fontSize: "clamp(30px,5vw,56px)",
              letterSpacing: "-1px",
              textShadow: "0 0 18px rgba(102,178,255,0.55), 0 0 40px rgba(102,178,255,0.25)",
            }}
          >
            <span className="hero-line1">A NEW WAY TO OUTLINE?</span>
            <span className="hero-line2" style={{ color: "#fff" }}>
              TIME TO MAKE A{" "}
              <span style={{ color: "#66b2ff" }}>B-LINE.</span>
            </span>
          </h1>
          <p className="hero-desc text-xl max-w-2xl mx-auto mb-9 leading-relaxed" style={{ color: "rgba(255,255,255,0.78)" }}>
            briefica is a comprehensive ecosystem for law students. create briefsets with our native desktop app,
            share with your school community, and study smarter with AI — all in one place.
          </p>
          <div className="hero-btns flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => router.push("/downloads")}
              className="rounded-xl py-3.5 px-8 font-semibold text-lg text-[#1e1e1e] hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#66b2ff" }}
            >
              download briefica
            </button>
            {!isLoggedIn && (
              <button
                onClick={() => router.push("/auth")}
                className="border border-white/20 rounded-xl py-3.5 px-8 font-medium text-lg hover:bg-white/5 transition-colors"
              >
                join b-web
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── VERSIONS ── */}
      <section id="versions" className="fade-up py-16 px-6" style={{ background: "var(--nav-bg)" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* v6 — Free */}
          <div
            className="rounded-2xl p-10 border border-white/10 flex flex-col"
            style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
          >
            <div
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-6 self-start"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
            >
              Free
            </div>
            {b65Imgs.length > 0 && (
              <div className="-mx-10 mb-8 relative overflow-hidden rounded-2xl" style={{ height: 400 }}>
                {b65Imgs.map((src, i) => (
                  <div
                    key={src}
                    className="absolute inset-0"
                    style={{ opacity: i === b65Idx ? 1 : 0, transition: "opacity 0.8s ease-in-out" }}
                  >
                    <Image src={src} alt={`briefica v6.5 screenshot ${i + 1}`} fill className="object-cover object-top" sizes="600px" />
                  </div>
                ))}
              </div>
            )}
            <div
              className="font-extrabold tracking-tight leading-none mb-1"
              style={{ fontSize: "clamp(48px,6vw,72px)", letterSpacing: "-2px" }}
            >
              v6
            </div>
            <div className="text-sm text-white/40 italic mb-6">sanddollar</div>
            <p className="text-sm text-white/70 leading-relaxed mb-7">
              Everything a law student needs to build a great outline. Add cases, construct your b-line,
              customize with mods, map your authorities with the visualizer, and export a print-ready
              .docx — completely free.
            </p>
            <div className="text-sm font-semibold text-white/60 mb-5">Free, always.</div>
            <ul className="flex flex-col gap-2.5 mb-8">
              {[
                "Library — unlimited cases & authorities",
                "B-line outline builder (WYSIWYG)",
                ".docx export — what you see is what you get",
                "Mods — color customization",
                "Visualizer — semantic authority mapping",
                "b-web community access",
              ].map((f) => (
                <li key={f} className="flex gap-2.5 text-sm text-white/70 items-start">
                  <span style={{ color: "#66b2ff" }} className="flex-shrink-0">✓</span>{" "}{f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push("/downloads")}
              className="mt-auto rounded-xl py-3 px-6 font-semibold text-base text-[#1e1e1e] hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#66b2ff" }}
            >
              Download — Free
            </button>
          </div>

          {/* v7 — Gold */}
          <div
            className="rounded-2xl p-10 border flex flex-col"
            style={{
              background: "rgba(240,192,64,0.03)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
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
            {b7Imgs.length > 0 && (
              <div className="-mx-10 mb-8 relative overflow-hidden rounded-2xl" style={{ height: 400 }}>
                {b7Imgs.map((src, i) => (
                  <div
                    key={src}
                    className="absolute inset-0"
                    style={{ opacity: i === b7Idx ? 1 : 0, transition: "opacity 0.8s ease-in-out" }}
                  >
                    <Image src={src} alt={`briefica v7 screenshot ${i + 1}`} fill className="object-cover object-top" sizes="600px" />
                  </div>
                ))}
              </div>
            )}
            <div
              className="font-extrabold tracking-tight leading-none mb-1"
              style={{ fontSize: "clamp(48px,6vw,72px)", letterSpacing: "-2px", color: "#f0c040" }}
            >
              v7
            </div>
            <div className="text-sm italic mb-6" style={{ color: "rgba(240,192,64,0.5)" }}>horizon</div>
            <p className="text-sm text-white/70 leading-relaxed mb-7">
              Everything in v6, plus goldilex AI for grounded Q&amp;A and comprehension checks, advanced
              custom themes, and unlimited briefsets.
            </p>
            <div className="text-sm font-semibold mb-5" style={{ color: "#f0c040" }}>
              From $15 / month
            </div>
            <ul className="flex flex-col gap-2.5 mb-8">
              {[
                "Everything in v6",
                "goldilex AI — grounded in your briefset only",
                "Comprehension check MCQs",
                "Custom themes & advanced color palettes",
                "Unlimited briefsets · 500 or 2,000 queries/mo",
              ].map((f) => (
                <li key={f} className="flex gap-2.5 text-sm text-white/70 items-start">
                  <span style={{ color: "#f0c040" }} className="flex-shrink-0">✓</span>{" "}{f}
                </li>
              ))}
            </ul>
            <button
              className="mt-auto rounded-xl py-3 px-6 font-bold text-base hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#f0c040", color: "#1a1200" }}
            >
              Explore briefica: gold →
            </button>
          </div>

        </div>
      </section>

      {/* ── FEATURES ── */}
      <div className="fade-up max-w-6xl mx-auto px-6 py-20">
        <h2
          className="font-bold text-center mb-3"
          style={{ fontSize: "clamp(24px,3vw,36px)" }}
        >
          A true law school workspace.
        </h2>
        <p className="text-base text-white/70 text-center max-w-md mx-auto mb-12 leading-relaxed">
          Four modules. One briefset. Everything you need from the first day of class to the morning of the exam.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
              name: "Library",
              desc: "Add cases, statutes, and authorities. Store facts, holdings, rules, and reasoning — structured, searchable, and saved to one file.",
              badge: "6.5 + 7",
              gold: false,
            },
            {
              d: "M4 6h16M4 12h16M4 18h7",
              name: "B-Line Builder",
              desc: "Build your outline directly from your library. WYSIWYG editor, auto-saved to your briefset. Come back anytime and keep going.",
              badge: "6.5 + 7",
              gold: false,
            },
            {
              d: "M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z",
              name: "WYSIWYG Export",
              desc: "Export your b-line as a clean .docx at any time. What you see in briefica is exactly what comes out — no reformatting, no surprises.",
              badge: "6.5 + 7",
              gold: false,
            },
            {
              d: "M13 10V3L4 14h7v7l9-11h-7z",
              name: "Visualizer",
              desc: "See how your authorities cluster and connect. Discover semantic overlap between cases before it shows up on an exam hypothetical.",
              badge: "6.5 + 7",
              gold: false,
            },
            {
              d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
              name: "goldilex AI",
              desc: "An AI tutor grounded exclusively in your briefset. Summaries, explanations, comprehension MCQs — governed by your materials only.",
              badge: "briefica: gold",
              gold: true,
            },
            {
              d: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
              name: "Custom Themes",
              desc: "Unlock full palette control and advanced theme customization. Make your briefset unmistakably yours — with colors that help it stick.",
              badge: "briefica: gold",
              gold: true,
            },
          ].map(({ d, name, desc, badge, gold }) => (
            <div
              key={name}
              className="rounded-2xl p-8 border transition-all hover:bg-[#242424]"
              style={{
                background: "#1e1e1e",
                borderColor: gold ? "rgba(240,192,64,0.2)" : "rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border"
                style={{
                  background: gold ? "rgba(240,192,64,0.12)" : "rgba(102,178,255,0.15)",
                  borderColor: gold ? "rgba(240,192,64,0.2)" : "rgba(102,178,255,0.2)",
                  color: gold ? "#f0c040" : "#66b2ff",
                }}
              >
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
                </svg>
              </div>
              <div className="text-lg font-semibold mb-2.5">{name}</div>
              <p className="text-sm text-white/70 leading-relaxed">{desc}</p>
              <span
                className="inline-block mt-4 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{
                  background: gold ? "rgba(240,192,64,0.12)" : "rgba(102,178,255,0.12)",
                  color: gold ? "#f0c040" : "#66b2ff",
                }}
              >
                {badge}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="fade-up max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-bold mb-2" style={{ fontSize: "clamp(24px,3vw,36px)" }}>
          How it works.
        </h2>
        <p className="text-sm text-white/70 leading-relaxed mb-10">
          One file. Everything flows from it. Build your library, construct your outline, study with AI,
          export and walk into the exam.
        </p>

        {/* 3-col grid: steps (2 col) + video (1 col) */}
        <div className="grid md:grid-cols-3 gap-6 items-start">

          {/* Steps — 2-col inner grid spanning first 2 columns */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                n: 1,
                title: "download briefica",
                desc: "Get the native macOS desktop app. Free for all law students.",
                tag: "v6 free",
                gold: false,
              },
              {
                n: 2,
                title: "build your library",
                desc: "Add cases with citation, facts, holding, and rule — saved to one .bset file.",
                tag: "v6 + v7",
                gold: false,
              },
              {
                n: 3,
                title: "b-line your outline",
                desc: "Pull cases into the builder, add headings, write notes. Auto-saves continuously.",
                tag: "v6 + v7",
                gold: false,
              },
              {
                n: 4,
                title: "study with goldilex",
                desc: "Ask goldilex to summarize, explain, or quiz you — grounded only in your briefset.",
                tag: "gold",
                gold: true,
              },
              {
                n: 5,
                title: "export your b-line",
                desc: "Export a clean .docx at any point. WYSIWYG — exactly as it looks in the app.",
                tag: "v6 + v7",
                gold: false,
              },
            ].map(({ n, title, desc, tag, gold }) => (
              <div
                key={n}
                className="rounded-xl p-5 border border-white/8 flex flex-col gap-3"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      background: gold ? "#f0c040" : "#66b2ff",
                      color: gold ? "#1a1200" : "#1e1e1e",
                    }}
                  >
                    {n}
                  </div>
                  <div className="text-sm font-semibold">{title}</div>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">{desc}</p>
                <span
                  className="inline-block self-start text-[10px] font-semibold px-2 py-0.5 rounded-full mt-auto"
                  style={{
                    background: gold ? "rgba(240,192,64,0.12)" : "rgba(255,255,255,0.08)",
                    color: gold ? "#f0c040" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {tag}
                </span>
              </div>
            ))}
          </div>

          {/* Video */}
          <div className="sticky top-24">
            <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4">
              <div className="aspect-video bg-[#2b2b2b] rounded-lg overflow-hidden">
                <video
                  src="/march 2026 briefica teaser.mp4"
                  controls
                  playsInline
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── GOLDILEX ── */}
      <section
        id="goldilex"
        className="fade-up bg-[#1e1e1e] border-t border-b border-white/10"
      >
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1 rounded-full border mb-5"
              style={{
                background: "rgba(240,192,64,0.12)",
                color: "#f0c040",
                borderColor: "rgba(240,192,64,0.25)",
              }}
            >
              ✦ briefica: gold
            </div>
            <h2
              className="font-extrabold leading-tight mb-4"
              style={{ fontSize: "clamp(28px,3.5vw,42px)", letterSpacing: "-0.5px" }}
            >
              AI that knows
              <br />
              your materials.
            </h2>
            <p className="text-sm text-white/70 leading-relaxed mb-7">
              goldilex is briefica&apos;s built-in AI tutor. Unlike general legal AI, goldilex is grounded
              exclusively in your briefset — it cannot surface a case you didn&apos;t read or pull a holding
              from the wrong jurisdiction.
            </p>
            <div className="flex flex-col gap-3.5 mb-7">
              {[
                ["Summaries on demand.", "Ask goldilex to explain any case or doctrine from your briefset."],
                [
                  "Comprehension checks.",
                  "Auto-generated MCQs drawn only from your briefset. No outside material.",
                ],
                [
                  "Zero outside noise.",
                  "goldilex cites only from your briefset authorities. No hallucinations.",
                ],
                [
                  "Chat freely.",
                  "Compare cases, find doctrinal tension, ask why two holdings conflict.",
                ],
              ].map(([label, text]) => (
                <div key={label} className="flex gap-3 items-start">
                  <span style={{ color: "#66b2ff" }} className="flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <p className="text-sm text-white/70 leading-relaxed">
                    <strong className="text-white">{label}</strong> {text}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border"
              style={{
                background: "rgba(240,192,64,0.08)",
                color: "#f0c040",
                borderColor: "rgba(240,192,64,0.25)",
              }}
            >
              ✦ goldilex is part of briefica: gold — starting at $15/month
            </div>
          </div>

          {/* Chat mock */}
          <div
            className="rounded-2xl overflow-hidden border border-white/10"
            style={{ background: "#161616" }}
          >
            <div
              className="px-4 py-3 flex items-center gap-2 border-b border-white/10"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <span className="text-sm font-semibold text-white/70 ml-1.5">goldilex</span>
              <span
                className="ml-auto text-[11px] font-medium px-2.5 py-0.5 rounded-md"
                style={{ background: "rgba(102,178,255,0.12)", color: "#66b2ff" }}
              >
                ✓ Heilman.bset
              </span>
            </div>
            <div className="p-4 flex flex-col gap-3.5">
              <div
                className="self-end max-w-[90%] px-4 py-3 text-sm leading-relaxed rounded-xl rounded-br-sm font-medium"
                style={{ background: "#66b2ff", color: "#1e1e1e" }}
              >
                Summarize Simpson v. Calivas
              </div>
              <div
                className="self-start max-w-[90%] px-4 py-3 text-sm leading-relaxed rounded-xl rounded-tl-sm text-white/80 border-l-2"
                style={{ background: "rgba(255,255,255,0.07)", borderColor: "#66b2ff" }}
              >
                <span style={{ color: "#66b2ff" }} className="font-medium">
                  Simpson v. Calivas, 650 A.2d 318 (1994)
                </span>{" "}
                — a will-drafting attorney owes a duty of care to intended beneficiaries even without privity
                of contract. Intended beneficiaries can enforce the attorney&apos;s agreement with the testator
                directly.
              </div>
              <div
                className="rounded-xl p-3.5 border border-white/10"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-2.5">
                  comprehension check · question 1 of 5
                </div>
                <div className="text-sm text-white font-medium leading-snug mb-3">
                  What is the primary issue in Simpson v. Calivas?
                </div>
                {[
                  "A. Whether an attorney owes a duty to third-party beneficiaries",
                  "B. Whether a will can be contested after probate closes",
                  "C. Whether beneficiaries must be named explicitly",
                  "D. Probate court jurisdiction over malpractice claims",
                ].map((opt, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedMcq(i)}
                    className="text-sm px-3 py-2 rounded-lg border mb-1.5 cursor-pointer transition-all"
                    style={{
                      color: selectedMcq === i ? "#66b2ff" : "rgba(255,255,255,0.7)",
                      borderColor:
                        selectedMcq === i ? "rgba(102,178,255,0.3)" : "rgba(255,255,255,0.1)",
                      background: selectedMcq === i ? "rgba(102,178,255,0.12)" : "transparent",
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 flex gap-2 border-t border-white/10">
              <input
                className="flex-1 bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg text-sm outline-none placeholder-white/40"
                type="text"
                placeholder="ask goldilex anything about your briefset..."
              />
              <button
                className="px-4 py-2 rounded-lg text-sm font-semibold text-[#1e1e1e] hover:opacity-90 transition-opacity"
                style={{ background: "#66b2ff" }}
              >
                send
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── VISUALIZER ── */}
      <section className="fade-up max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#1e1e1e]">
            <div
              className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <span className="text-sm font-semibold text-white/70">Visualizer · v2.0</span>
              <span className="text-[11px] text-white/50">Shapira v. Union National Bank</span>
            </div>
            <div
              ref={vizCanvasRef}
              id="vizCanvas"
              className="relative overflow-hidden"
              style={{ height: "240px", background: "#161616" }}
            >
              <svg
                ref={vizSvgRef}
                id="vizSvg"
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
              {(
                [
                  {
                    id: "vn0",
                    label: "Shapira v. Union Nat'l",
                    w: 70,
                    h: 70,
                    top: "50%",
                    left: "42%",
                    anchor: true,
                    xform: "translate(-50%,-50%)",
                    fs: "8px",
                  },
                  {
                    id: "vn1",
                    label: "Lipper v. Weslow",
                    w: 50,
                    h: 50,
                    top: "13%",
                    left: "15%",
                    anchor: false,
                    xform: undefined,
                    fs: "8px",
                  },
                  {
                    id: "vn2",
                    label: "Clark v. Greenhalge",
                    w: 50,
                    h: 50,
                    top: "11%",
                    left: "62%",
                    anchor: false,
                    xform: undefined,
                    fs: "8px",
                  },
                  {
                    id: "vn3",
                    label: "In re Searight's",
                    w: 36,
                    h: 36,
                    top: "73%",
                    left: "70%",
                    anchor: false,
                    xform: undefined,
                    fs: "7px",
                  },
                  {
                    id: "vn4",
                    label: "Estate of Russell",
                    w: 36,
                    h: 36,
                    top: "75%",
                    left: "18%",
                    anchor: false,
                    xform: undefined,
                    fs: "7px",
                  },
                  {
                    id: "vn5",
                    label: "Mahoney v. Grainger",
                    w: 36,
                    h: 36,
                    top: "35%",
                    left: "82%",
                    anchor: false,
                    xform: undefined,
                    fs: "7px",
                  },
                ] as {
                  id: string;
                  label: string;
                  w: number;
                  h: number;
                  top: string;
                  left: string;
                  anchor: boolean;
                  xform: string | undefined;
                  fs: string;
                }[]
              ).map(({ id, label, w, h, top, left, anchor, xform, fs }) => (
                <div
                  key={id}
                  id={id}
                  style={{
                    position: "absolute",
                    top,
                    left,
                    width: w,
                    height: h,
                    transform: xform,
                    borderRadius: "50%",
                    background: anchor ? "#66b2ff" : "rgba(102,178,255,0.7)",
                    boxShadow: anchor ? "0 0 20px rgba(102,178,255,0.4)" : undefined,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 600,
                    textAlign: "center",
                    padding: "5px",
                    cursor: "pointer",
                    fontSize: fs,
                    lineHeight: 1.2,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-white/50 px-5 pt-2.5 pb-1">
                related authorities
              </div>
              {[
                ["Lipper v. Weslow", "46%"],
                ["Clark v. Greenhalge", "41%"],
                ["In re Searight's Estate", "39%"],
                ["Estate of Russell", "38%"],
                ["Mahoney v. Grainger", "35%"],
              ].map(([name, pct]) => (
                <div
                  key={name}
                  className="flex justify-between px-5 py-2.5 border-b border-white/5 last:border-0 text-sm text-white/70"
                >
                  <span>{name}</span>
                  <span style={{ color: "#66b2ff" }} className="font-semibold">
                    {pct}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1 rounded-full border mb-4"
              style={{
                background: "rgba(102,178,255,0.1)",
                color: "#66b2ff",
                borderColor: "rgba(102,178,255,0.25)",
              }}
            >
              6.5 + briefica: gold
            </div>
            <h2 className="font-bold mb-3.5 leading-snug" style={{ fontSize: "clamp(24px,3vw,36px)" }}>
              See how your cases connect.
            </h2>
            <p className="text-sm text-white/70 leading-relaxed mb-3">
              Select any authority and the visualizer surfaces which other cases in your briefset share
              semantic overlap. Cases that cluster together tend to appear together on exam hypotheticals.
            </p>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              Available in both 6.5 and briefica: gold. Sort by authority or syllabus section —
              issue-spotting practice, built passively into how you study.
            </p>
            <button
              onClick={() => router.push("/downloads")}
              className="rounded-xl py-3 px-6 font-semibold text-base text-[#1e1e1e] hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#66b2ff" }}
            >
              Download briefica →
            </button>
          </div>
        </div>
      </section>

      {/* ── B-WEB ── */}
      <section
        id="bweb"
        className="fade-up bg-[#1e1e1e] border-t border-b border-white/10"
      >
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2
            className="font-bold text-center mb-3"
            style={{ fontSize: "clamp(24px,3vw,36px)" }}
          >
            Built for collaboration.
          </h2>
          <p className="text-base text-white/70 text-center max-w-md mx-auto mb-12 leading-relaxed">
            briefica.com connects law students across every ABA-accredited school. Share briefsets,
            discover materials, and build your study network.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
                name: "School Communities",
                desc: "Join your law school's community. Connect with classmates and access school-specific subject channels in real time.",
              },
              {
                d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                name: "Discover & Download",
                desc: "Browse briefsets from students at top law schools. Download materials and open them directly in the desktop app.",
              },
              {
                d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
                name: "Live Chat",
                desc: "Real-time messaging with your school community. Quick questions, study sessions, and subject-specific channels.",
              },
            ].map(({ d, name, desc }) => (
              <div
                key={name}
                className="rounded-2xl p-8 border border-white/10 transition-all hover:bg-[#242424]"
                style={{ background: "#242424" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border"
                  style={{
                    background: "rgba(102,178,255,0.15)",
                    borderColor: "rgba(102,178,255,0.2)",
                    color: "#66b2ff",
                  }}
                >
                  <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
                  </svg>
                </div>
                <div className="text-lg font-semibold mb-2.5">{name}</div>
                <p className="text-sm text-white/70 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <div id="pricing" className="fade-up max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-bold text-center mb-3" style={{ fontSize: "clamp(24px,3vw,36px)" }}>
          Simple pricing.
        </h2>
        <p className="text-base text-white/70 text-center max-w-md mx-auto mb-12 leading-relaxed">
          briefica 6.5 is free for every law student. briefica: gold unlocks the full AI suite for students
          who want to go deeper.
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          {/* Free */}
          <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-9 relative hover:-translate-y-1 transition-transform">
            <span className="block text-xs font-semibold uppercase tracking-wide text-white/50 mb-4">
              briefica 6.5 · sanddollar
            </span>
            <div className="font-extrabold leading-none mb-1" style={{ fontSize: "64px", letterSpacing: "-2px" }}>
              $0
            </div>
            <div className="text-sm text-white/50 mb-1.5">free, always</div>
            <div className="text-sm font-semibold text-white/70 mb-6">full library + export</div>
            <hr className="border-white/10 mb-6" />
            <ul className="flex flex-col gap-2.5 mb-7">
              {[
                "Unlimited library",
                "B-line outline builder",
                "WYSIWYG .docx export",
                "Mods — color customization",
                "Visualizer",
                "b-web community",
                "Briefset sharing & discovery",
              ].map((f) => (
                <li key={f} className="flex gap-2.5 text-sm text-white/70 items-start">
                  <span style={{ color: "#66b2ff" }} className="font-bold flex-shrink-0">
                    ✓
                  </span>{" "}
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push("/downloads")}
              className="w-full py-3 rounded-xl font-semibold text-[#1e1e1e] hover:opacity-90 transition-opacity"
              style={{ background: "#66b2ff" }}
            >
              Download Free
            </button>
          </div>

          {/* Gold 500 */}
          <div
            className="border rounded-2xl p-9 relative hover:-translate-y-1 transition-transform"
            style={{
              background: "linear-gradient(160deg,#1e1e1e 0%,#1c1800 100%)",
              borderColor: "rgba(240,192,64,0.25)",
            }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold tracking-wide px-4 py-1 rounded-full whitespace-nowrap"
              style={{ background: "#f0c040", color: "#1a1200" }}
            >
              ✦ briefica: gold
            </div>
            <span className="block text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "#f0c040" }}>
              briefica 7 · horizon
            </span>
            <div
              className="font-extrabold leading-none mb-1"
              style={{ fontSize: "64px", letterSpacing: "-2px", color: "#f0c040" }}
            >
              $15
            </div>
            <div className="text-sm text-white/50 mb-1.5">per month</div>
            <div className="text-sm font-semibold mb-6" style={{ color: "#f0c040" }}>
              500 queries / month
            </div>
            <hr className="border-white/10 mb-6" />
            <ul className="flex flex-col gap-2.5 mb-7">
              {[
                "Everything in 6.5",
                "goldilex AI — grounded Q&A",
                "Comprehension check MCQs",
                "Custom themes & advanced mods",
                "Unlimited briefsets",
                "500 goldilex queries / month",
              ].map((f) => (
                <li key={f} className="flex gap-2.5 text-sm text-white/70 items-start">
                  <span style={{ color: "#f0c040" }} className="font-bold flex-shrink-0">
                    ✓
                  </span>{" "}
                  {f}
                </li>
              ))}
            </ul>
            <button
              className="w-full py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
              style={{ background: "#f0c040", color: "#1a1200" }}
            >
              Start Gold · 500
            </button>
          </div>

          {/* Gold 2000 */}
          <div
            className="border rounded-2xl p-9 relative hover:-translate-y-1 transition-transform"
            style={{
              background: "linear-gradient(160deg,#1e1e1e 0%,#1c1800 100%)",
              borderColor: "rgba(240,192,64,0.25)",
            }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold tracking-wide px-4 py-1 rounded-full whitespace-nowrap"
              style={{ background: "#f0c040", color: "#1a1200" }}
            >
              ✦ briefica: gold
            </div>
            <span className="block text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "#f0c040" }}>
              briefica 7 · horizon
            </span>
            <div
              className="font-extrabold leading-none mb-1"
              style={{ fontSize: "64px", letterSpacing: "-2px", color: "#f0c040" }}
            >
              $30
            </div>
            <div className="text-sm text-white/50 mb-1.5">per month</div>
            <div className="text-sm font-semibold mb-6" style={{ color: "#f0c040" }}>
              2,000 queries / month
            </div>
            <hr className="border-white/10 mb-6" />
            <ul className="flex flex-col gap-2.5 mb-7">
              {[
                "Everything in 6.5",
                "goldilex AI — grounded Q&A",
                "Comprehension check MCQs",
                "Custom themes & advanced mods",
                "Unlimited briefsets",
                "2,000 goldilex queries / month",
              ].map((f) => (
                <li key={f} className="flex gap-2.5 text-sm text-white/70 items-start">
                  <span style={{ color: "#f0c040" }} className="font-bold flex-shrink-0">
                    ✓
                  </span>{" "}
                  {f}
                </li>
              ))}
            </ul>
            <button
              className="w-full py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
              style={{ background: "#f0c040", color: "#1a1200" }}
            >
              Start Gold · 2,000
            </button>
          </div>
        </div>
        <p className="text-center mt-6 text-sm text-white/50">
          briefica: gold plans include{" "}
          <span style={{ color: "#f0c040" }}>briefica 7 · horizon</span> — the full AI-powered workspace.
        </p>
      </div>

      {/* ── STATS ── */}
      <div className="fade-up max-w-6xl mx-auto px-6 pb-20">
        <div
          className="grid grid-cols-2 md:grid-cols-4 border border-white/10 rounded-2xl overflow-hidden bg-[#1e1e1e]"
        >
          {[
            { num: "200+", lbl: "ABA law schools" },
            { num: "Free", lbl: "for all students · 6.5" },
            { num: "1", lbl: "file. everything flows from it." },
            { num: "∞", lbl: "exports from one briefset" },
          ].map(({ num, lbl }, i) => (
            <div
              key={lbl}
              className="px-6 py-10 text-center border-r border-white/10 last:border-r-0"
              style={i === 1 || i === 3 ? { borderRight: "none" } : undefined}
            >
              <div
                className="font-extrabold leading-none mb-1.5"
                style={{ fontSize: "48px", color: "#66b2ff", letterSpacing: "-2px" }}
              >
                {num}
              </div>
              <div className="text-sm text-white/70">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="fade-up max-w-6xl mx-auto px-6 pb-20">
        <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-20 text-center">
          <h2
            className="font-extrabold uppercase mb-4"
            style={{ fontSize: "clamp(32px,4vw,52px)", letterSpacing: "-1px" }}
          >
            Ready to begin?
          </h2>
          <p className="text-lg text-white/70 mb-9">let&apos;s make a b-line.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => router.push("/downloads")}
              className="rounded-xl py-3.5 px-8 font-semibold text-lg text-[#1e1e1e] hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#66b2ff" }}
            >
              download briefica
            </button>
            {!isLoggedIn && (
              <button
                onClick={() => router.push("/auth")}
                className="border border-white/20 rounded-xl py-3.5 px-8 font-medium text-lg hover:bg-white/5 transition-colors"
              >
                sign up for b-web
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
