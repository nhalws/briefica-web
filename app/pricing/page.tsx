"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const upgrade = searchParams.get("upgrade");
  
  const [loading, setLoading] = useState(true);
  const [isGold, setIsGold] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push("/auth?redirect=/pricing");
      return;
    }

    // Check if already Gold
    const { data: accessData } = await supabase
      .from("goldilex_access")
      .select("tier")
      .eq("user_id", session.user.id)
      .single();

    if (accessData?.tier === "gold") {
      setIsGold(true);
    }

    // Get username
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", session.user.id)
      .single();

    if (profileData) {
      setUsername(profileData.username);
    }

    setLoading(false);
  }

  async function handleGoldCheckout() {
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth?redirect=/pricing");
        return;
      }

      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_GOLD_PRICE_ID,
          userId: session.user.id,
          tier: "gold",
        }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBBCheckout() {
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth?redirect=/pricing");
        return;
      }

      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_BB_PRICE_ID,
          userId: session.user.id,
          tier: "free",
        }),
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#2b2b2b] text-white">
        <div>Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Image
            src="/logo_6.png"
            alt="Briefica"
            width={180}
            height={54}
            className="object-contain cursor-pointer"
            onClick={() => router.push("/dashboard")}
          />
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white/70 hover:text-white flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Upgrade message if coming from Goldilex */}
        {upgrade === "goldilex" && !isGold && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-blue-500/20 border border-blue-500/40 rounded-lg">
            <p className="text-center">
              🔒 Goldilex is a Gold-exclusive feature. Upgrade to access unlimited BBs and AI-powered legal research!
            </p>
          </div>
        )}

        {/* Already Gold message */}
        {isGold && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-[#BF9B30]/20 border border-[#BF9B30]/40 rounded-lg">
            <p className="text-center">
              ✨ You're already a Gold member! Enjoy unlimited BBs and full Goldilex access.
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <div className="bg-[#1e1e1e] border border-white/10 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-2">Free Tier</h2>
            <p className="text-white/60 mb-6">Pay as you go</p>
            
            <div className="mb-8">
              <div className="text-4xl font-bold mb-2">$5<span className="text-xl text-white/60">/BB</span></div>
              <p className="text-sm text-white/60">Maximum 3 BBs per month</p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Access to all briefsets</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Upload your own briefs</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-white/40">No Goldilex access</span>
              </li>
            </ul>

            <button
              onClick={handleBBCheckout}
              disabled={loading || isGold}
              className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGold ? "Current Plan" : "Buy BBs"}
            </button>
          </div>

          {/* Gold Tier */}
          <div className="bg-gradient-to-br from-[#BF9B30]/20 to-[#1e1e1e] border-2 border-[#BF9B30] rounded-xl p-8 relative">
            <div className="absolute top-4 right-4 bg-[#BF9B30] text-black px-3 py-1 rounded-full text-sm font-bold">
              RECOMMENDED
            </div>

            <h2 className="text-2xl font-bold mb-2 text-[#BF9B30]">Gold</h2>
            <p className="text-white/60 mb-6">Unlimited everything</p>
            
            <div className="mb-8">
              <div className="text-4xl font-bold mb-2">$15<span className="text-xl text-white/60">/month</span></div>
              <p className="text-sm text-white/60">Unlimited BBs + Goldilex</p>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Unlimited BBs</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Access to all briefsets</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Upload unlimited briefs</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-[#BF9B30] mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="font-medium text-[#BF9B30]">Full Goldilex AI access</span>
              </li>
            </ul>

            <button
              onClick={handleGoldCheckout}
              disabled={loading || isGold}
              className="w-full py-3 bg-[#BF9B30] text-black rounded-lg font-medium hover:bg-[#BF9B30]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGold ? "Current Plan ✓" : "Upgrade to Gold"}
            </button>
          </div>
        </div>

        {/* FAQ or additional info */}
        <div className="max-w-3xl mx-auto mt-16 text-center text-white/60 text-sm">
          <p>Questions? Email us at support@briefica.com</p>
        </div>
      </div>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[#2b2b2b] text-white">
        <div>Loading...</div>
      </main>
    }>
      <PricingContent />
    </Suspense>
  );
}
