"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "../context/ThemeContext";

export default function Footer() {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  return (
    <footer className="border-t border-white/10 mt-12 py-6">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/60">
        <div className="flex items-center gap-2">
          <span>© 2026 VanHuxt. All rights reserved.</span>
          <Image
            src="/transparent.png"
            alt="VanHuxt"
            width={40}
            height={10}
            className="object-contain opacity-60 hover:opacity-100 transition-opacity"
          />
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/terms")}
            className="hover:text-white transition-colors"
          >
            Terms and Conditions
          </button>
          <button
            onClick={() => router.push("/privacy-policy")}
            className="hover:text-white transition-colors"
          >
            Privacy Policy
          </button>
          <button
            onClick={toggle}
            aria-label="Toggle light/dark mode"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            {theme === "dark" ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <span>Light</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}