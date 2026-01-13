"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function DownloadsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#1e1e1e]">
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

          <button
            onClick={() => router.push("/auth")}
            className="border border-white/20 rounded-lg py-2 px-4 font-medium hover:bg-white/5 transition-colors"
          >
            sign in
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">download briefica 6</h1>
          <p className="text-xl text-white/70">
            download our native software.
          </p>
        </div>

        {/* Download Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* macOS Card */}
          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8">
            <div className="flex items-center justify-center mb-6">
              <svg
                className="w-16 h-16 text-white/90"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
            </div>

            <h2 className="text-2xl font-semibold text-center mb-2">macOS</h2>
            <p className="text-center text-white/60 mb-6">
              version 6.0.0 - sunrise
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>macOS 11.0 or later</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Apple silicon & Intel</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>notarized by Apple</span>
              </div>
            </div>

            <a
              href="/downloads/briefica-6.0.0.dmg"
              className="block w-full text-center text-white rounded-lg py-3 px-4 font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: '#66b2ff' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5aa3ee';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#66b2ff';
              }}
            >
              download for macOS
            </a>

            <p className="text-xs text-white/50 text-center mt-4">
              ~65 MB • DMG installer
            </p>
          </div>

          {/* Windows Card (Coming Soon) */}
          <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-8 opacity-50">
            <div className="flex items-center justify-center mb-6">
              <svg
                className="w-16 h-16 text-white/90"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
              </svg>
            </div>

            <h2 className="text-2xl font-semibold text-center mb-2">Windows</h2>
            <p className="text-center text-white/60 mb-6">coming soon</p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Windows 10 or later</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>x64 & ARM64</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>in development</span>
              </div>
            </div>

            <button
              disabled
              className="block w-full text-center bg-white/10 text-white/50 rounded-lg py-3 px-4 font-medium cursor-not-allowed"
            >
              coming soon
            </button>

            <p className="text-xs text-white/50 text-center mt-4">
              stay tuned for updates
            </p>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="mt-12 border border-white/10 bg-[#1e1e1e] rounded-2xl p-8">
          <h3 className="text-xl font-semibold mb-4">installation</h3>
          
          <div className="space-y-4 text-white/70">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#66b2ff', color: '#1e1e1e' }}>
                1
              </div>
              <div>
                <p className="font-medium text-white mb-1">download the installer</p>
                <p className="text-sm">click the download button above to get the DMG file.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#66b2ff', color: '#1e1e1e' }}>
                2
              </div>
              <div>
                <p className="font-medium text-white mb-1">open the DMG</p>
                <p className="text-sm">double-click the downloaded file to mount the installer.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#66b2ff', color: '#1e1e1e' }}>
                3
              </div>
              <div>
                <p className="font-medium text-white mb-1">drag to your Desktop</p>
                <p className="text-sm">drag briefica to your destination folder and update the path.
                  NOTE: that briefica initially creates a /briefsets/ folder on your desktop where all sets must be stored to load.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#66b2ff', color: '#1e1e1e' }}>
                4
              </div>
              <div>
                <p className="font-medium text-white mb-1">launch briefica</p>
                <p className="text-sm">open briefica from your Applications folder.</p>
              </div>
            </div>
          </div>
        </div>

        {/* File Types */}
        <div className="mt-8 border border-white/10 bg-[#1e1e1e] rounded-2xl p-8">
          <h3 className="text-xl font-semibold mb-4">supported file types</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold mb-1">.bset</div>
              <div className="text-sm text-white/60">briefsets</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold mb-1">.bmod</div>
              <div className="text-sm text-white/60">b-modifications</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold mb-1">.tbank</div>
              <div className="text-sm text-white/60">typobanks</div>
            </div>
          </div>
        </div>

        {/* System Requirements */}
        <div className="mt-8 text-center text-sm text-white/50">
          <p>need help? visit our <a href="https://briefica.com/docs" className="text-white/70 hover:text-white underline">documentation</a> or contact <a href="mailto:support@briefica.com" className="text-white/70 hover:text-white underline">support</a>.</p>
        </div>
      </div>
    </main>
  );
}
