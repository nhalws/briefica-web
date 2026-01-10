"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "./lib/supabaseClient";
import Footer from "./components/Footer";

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
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          STUDY SMARTER,
          <br />
          NOT HARDER.
        </h1>
        <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
          briefica is the all-in-one platform for law students. Create structured briefs with our native desktop app, 
          share with your school community, and access a growing library of study materials—all in one place.
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
              get started free
            </button>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">A true law school workspace.</h2>
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
            <h3 className="text-xl font-semibold mb-2">Native Desktop App</h3>
            <p className="text-white/70">
              Powerful macOS editor built specifically for day-to-day law school organization. 
              Create dynamic law school files (.bset, .bmod, and .tbank) with speed and precision.
            </p>
          </div>

          {/* Social Features */}
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
            <h3 className="text-xl font-semibold mb-2">School Communities</h3>
            <p className="text-white/70">
              Connect with classmates at your law school. Join subject-specific channels, 
              share materials, and collaborate in real-time with live chat.
            </p>
          </div>

          {/* Library */}
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Discover & Download</h3>
            <p className="text-white/70">
              Browse thousands of briefsets, mods and other b-files from students at top law schools. 
              Download study materials and open them directly in the desktop app.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: '#66b2ff', color: '#1e1e1e' }}>
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-lg">Download briefica</h4>
                <p className="text-white/70">
                  Get the native macOS desktop app. Free for all law students. Windows coming soon.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: '#66b2ff', color: '#1e1e1e' }}>
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-lg">create your briefsets</h4>
                <p className="text-white/70">
                  Use briefica 6 to create case briefsets, outlines, and other b-files. 
                  The native desktop tool makes organization effortless.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: '#66b2ff', color: '#1e1e1e' }}>
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-lg">Join Your School</h4>
                <p className="text-white/70">
                  Set your law school in your profile and instantly connect with classmates. 
                  Access school-specific chats and subject channels.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: '#66b2ff', color: '#1e1e1e' }}>
                4
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-lg">Share & Discover</h4>
                <p className="text-white/70">
                  Upload your work to share with the community. Browse and download materials 
                  from thousands of law students across the country.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8">
            <div className="aspect-video bg-[#2b2b2b] rounded-lg flex items-center justify-center overflow-hidden">
              <Image
                src="/b6.png"
                alt="briefica desktop app"
                width={600}
                height={400}
                className="object-cover w-full h-full"
              />
            </div>
            <p className="text-center text-sm text-white/60 mt-4">
              briefica 6
            </p>
          </div>
        </div>
      </div>

      {/* Social Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Built for Collaboration</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#66b2ff' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Live Chat</h3>
            </div>
            <p className="text-white/70">
              Join the main chat or connect with your school community in dedicated channels. 
              Real-time messaging for quick questions and study sessions.
            </p>
          </div>

          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#66b2ff' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Friend Network</h3>
            </div>
            <p className="text-white/70">
              Connect with classmates, follow their uploads, and build your study network. 
              See what materials your friends are working on.
            </p>
          </div>

          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#66b2ff' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Subject Channels</h3>
            </div>
            <p className="text-white/70">
              Select up to 3 subjects you're studying and join dedicated channels. 
              Chat with classmates taking the same courses.
            </p>
          </div>

          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#66b2ff' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Rankings & Stats</h3>
            </div>
            <p className="text-white/70">
              See top-rated briefs, most downloaded materials, and most helpful contributors 
              in your school community.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-12">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#66b2ff' }}>200+</div>
              <div className="text-white/70">ABA Law Schools</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#66b2ff' }}>3</div>
              <div className="text-white/70">File Types</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2" style={{ color: '#66b2ff' }}>Free</div>
              <div className="text-white/70">For All Students</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-white/70 mb-8">
            Join thousands of law students already using briefica.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push("/downloads")}
              className="text-white rounded-lg py-3 px-8 font-medium text-lg transition-colors hover:opacity-90"
              style={{ backgroundColor: '#66b2ff' }}
            >
              download
            </button>
            {!isLoggedIn && (
              <button
                onClick={() => router.push("/auth")}
                className="border border-white/20 rounded-lg py-3 px-8 font-medium text-lg hover:bg-white/5 transition-colors"
              >
                sign up
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}