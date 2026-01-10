"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "../lib/supabaseClient";

type Mode = "signin" | "signup";

function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  
  const [mode, setMode] = useState<Mode>(
    modeParam === "signup" ? "signup" : "signin"
  );

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const normalizedUsername = useMemo(
    () => normalizeUsername(username),
    [username]
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  useEffect(() => {
    if (modeParam === "signup" || modeParam === "signin") {
      setMode(modeParam);
    }
  }, [modeParam]);

  async function isUsernameAvailable(u: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username", u)
      .maybeSingle();

    if (error) throw error;
    return !data;
  }

  async function signIn() {
    setLoading(true);
    setMessage(null);

    try {
      // Call the database function to get email from username
      const { data, error } = await supabase.rpc('get_email_by_username', {
        username_input: normalizedUsername
      });

      if (error || !data) {
        setMessage("Username not found.");
        setLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data,
        password,
      });

      if (signInError) setMessage(signInError.message);
      else {
        setMessage("Signed in successfully.");
        router.push("/dashboard");
      }
    } catch (e: any) {
      setMessage(e?.message ?? "Sign in failed.");
    }

    setLoading(false);
  }

  async function signUp() {
    setLoading(true);
    setMessage(null);

    const u = normalizedUsername;

    if (u.length < 3) {
      setMessage("Username must be at least 3 characters.");
      setLoading(false);
      return;
    }
    if (!/^[a-z0-9_]+$/.test(u)) {
      setMessage("Username can only contain letters, numbers, and underscores.");
      setLoading(false);
      return;
    }

    try {
      const available = await isUsernameAvailable(u);
      if (!available) {
        setMessage("That username is already taken.");
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: u },
        },
      });

      if (signUpError) {
        setMessage(signUpError.message);
        setLoading(false);
        return;
      }

      const userId = data.user?.id;
      if (!userId) {
        setMessage("Signup succeeded, but no user id returned.");
        setLoading(false);
        return;
      }

      setMessage("Account created. Check your email to confirm.");
      router.push("/dashboard");
    } catch (e: any) {
      setMessage(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#2b2b2b] text-white">
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 text-white/70 hover:text-white flex items-center gap-2 text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Homepage
      </button>
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1e1e1e] p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center">
            <Image
              src="/logo_6.png"
              alt="Briefica"
              width={140}
              height={42}
              className="object-contain"
            />
          </div>

          <div className="flex gap-2 text-sm">
            <button
              className={mode === "signin" ? "text-white" : "text-white/60"}
              onClick={() => setMode("signin")}
              disabled={loading}
              type="button"
            >
              Sign in
            </button>
            <span className="text-white/30">/</span>
            <button
              className={mode === "signup" ? "text-white" : "text-white/60"}
              onClick={() => setMode("signup")}
              disabled={loading}
              type="button"
            >
              Sign up
            </button>
          </div>
        </div>

        {mode === "signup" && (
          <>
            <label className="text-xs text-white/60">Username</label>
            <input
              placeholder="e.g., max"
              className="w-full mb-3 mt-1 px-3 py-2 rounded bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <p className="text-xs text-white/40 -mt-2 mb-3">
              Will be saved as{" "}
              <span className="text-white/70">
                {normalizedUsername || "…"}
              </span>
            </p>

            <label className="text-xs text-white/60">Email</label>
            <input
              type="email"
              placeholder="you@domain.com"
              className="w-full mb-3 mt-1 px-3 py-2 rounded bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </>
        )}

        {mode === "signin" && (
          <>
            <label className="text-xs text-white/60">Username</label>
            <input
              placeholder="your username"
              className="w-full mb-3 mt-1 px-3 py-2 rounded bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </>
        )}

        <label className="text-xs text-white/60">Password</label>
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 mt-1 px-3 py-2 rounded bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          {mode === "signin" ? (
            <button
              onClick={signIn}
              disabled={loading}
              className="bg-white text-black rounded py-2 font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
              type="button"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          ) : (
            <button
              onClick={signUp}
              disabled={loading}
              className="bg-white text-black rounded py-2 font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
              type="button"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          )}

          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            disabled={loading}
            className="border border-white/20 rounded py-2 font-medium text-white/80 hover:bg-white/5 transition-colors disabled:opacity-50"
            type="button"
          >
            {mode === "signin"
              ? "Need an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>

        {message && <p className="text-sm text-white/70 mt-4">{message}</p>}
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[#2b2b2b] text-white">
        <div className="text-white/70">Loading...</div>
      </main>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
