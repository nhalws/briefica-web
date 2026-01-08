"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "./lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      setIsLoggedIn(!!data.user);
    }
    checkAuth();
  }, []);

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/logo_6.png"
            alt="briefica"
            width={160}
            height={48}
            className="object-contain"
          />
          <div className="w-14 h-14 text-white/90">
            <svg
              viewBox="0 0 64 64"
              className="w-full h-full"
            >
              <g transform="skewX(-8) skewY(5)">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 32 32"
                  to="360 32 32"
                  dur="32s"
                  repeatCount="indefinite"
                />
                <circle cx="32" cy="32" r="5" fill="#66b2ff" stroke="#e6eaf0" strokeWidth="1.5" />
                <defs>
                  <circle id="orbit-node" r="4" fill="#66b2ff" stroke="#e6eaf0" strokeWidth="1.5" />
                </defs>
                {[
                  { angle: 0, dur: "18s", sway: "8s" },
                  { angle: 60, dur: "20s", sway: "7s" },
                  { angle: 120, dur: "22s", sway: "9s" },
                  { angle: 180, dur: "19s", sway: "8.5s" },
                  { angle: 240, dur: "23s", sway: "7.5s" },
                  { angle: 300, dur: "21s", sway: "9.5s" },
                ].map(({ angle, dur, sway }) => (
                  <g key={angle} transform={`rotate(${angle} 32 32)`}>
                    <g>
                      <line x1="32" y1="32" x2="32" y2="8" stroke="#e6eaf0" strokeWidth="1.25">
                        <animate
                          attributeName="y2"
                          dur={sway}
                          repeatCount="indefinite"
                          keyTimes="0;0.5;1"
                          values="8;6;8"
                        />
                      </line>
                      <use href="#orbit-node" x="32" y="8">
                        <animate
                          attributeName="y"
                          dur={sway}
                          repeatCount="indefinite"
                          keyTimes="0;0.5;1"
                          values="8;6;8"
                        />
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
        </div>

        <div className="flex gap-3">
          {isLoggedIn ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-white text-black rounded-lg py-2 px-4 font-medium hover:bg-white/90 transition-colors"
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
                className="bg-white text-black rounded-lg py-2 px-4 font-medium hover:bg-white/90 transition-colors"
              >
                create account
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-5 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          A NEW WAY TO OUTLINE?
          <br />
          TIME TO MAKE A B-LINE!!
        </h1>
        <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
          briefica is a native desktop editor and web platform for structured
          legal logic files. upload, browse, and share .bset, .bmod, and .tbank
          files with your community.
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push("/downloads")}
            className="text-white rounded-lg py-3 px-6 font-medium text-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: '#66b2ff' }}
          >
            download briefica
          </button>

          {!isLoggedIn && (
            <button
              onClick={() => router.push("/auth")}
              className="border border-white/20 rounded-lg py-3 px-6 font-medium text-lg hover:bg-white/5 transition-colors"
            >
              get started
            </button>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Native Editor */}
          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#66b2ff' }}>
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">native desktop app</h3>
            <p className="text-white/70">
              powerful macOS editor for .bset, .bmod, and .tbank files.
              built for speed and precision.
            </p>
          </div>

          {/* Web Platform */}
          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#66b2ff' }}>
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">web distribution</h3>
            <p className="text-white/70">
              upload and share your work. browse and download artifacts from
              the community.
            </p>
          </div>

          {/* Community */}
          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#66b2ff' }}>
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">legal community</h3>
            <p className="text-white/70">
              connect with law students and practitioners. share knowledge and
              collaborate.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">how it works</h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: '#66b2ff', color: '#1e1e1e' }}>
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">download briefica</h4>
                <p className="text-white/70">
                  get the native desktop app for macOS. Windows version coming
                  soon.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: '#66b2ff', color: '#1e1e1e' }}>
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">create & edit</h4>
                <p className="text-white/70">
                  build structured legal logic files using the native editor.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: '#66b2ff', color: '#1e1e1e' }}>
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">upload & share</h4>
                <p className="text-white/70">
                  share your work with the community through the web platform.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: '#66b2ff', color: '#1e1e1e' }}>
                4
              </div>
              <div>
                <h4 className="font-semibold mb-1">browse & download</h4>
                <p className="text-white/70">
                  discover and download artifacts from other users. open
                  directly in the app.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8">
            <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
              <svg
                className="w-24 h-24 text-white/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">ready to get started?</h2>
          <p className="text-xl text-white/70 mb-8">
            join the briefica community today.
          </p>
          <button
            onClick={() => router.push("/downloads")}
            className="text-white rounded-lg py-3 px-8 font-medium text-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: '#66b2ff' }}
          >
            download now
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#1e1e1e]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-white/60 text-sm">
              © 2026 briefica. all rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <a href="/downloads" className="text-white/60 hover:text-white transition-colors">
                downloads
              </a>
              <a href="/auth" className="text-white/60 hover:text-white transition-colors">
                sign in
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
