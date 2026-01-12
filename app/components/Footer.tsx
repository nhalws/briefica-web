"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Footer() {
  const router = useRouter();

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
        <div className="flex gap-6">
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
        </div>
      </div>
    </footer>
  );
}