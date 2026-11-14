"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { inputCls } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const params = useSearchParams();
  const rawNext = params.get("next");
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error"));
  const [checkEmail, setCheckEmail] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setLoading(false);
      if (error) return setError(error.message);
      if (!data.session) return setCheckEmail(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setError(error.message);
    }

    // Full navigation (not router.push): the client router may hold a prefetched
    // "redirect to /login" for protected pages from before the user was signed in.
    window.location.assign(next);
  }

  if (checkEmail) {
    return (
      <div className="animate-rise w-full max-w-[400px] text-center">
        <span className="mx-auto flex h-16 w-16 -rotate-6 items-center justify-center rounded-2xl bg-sun shadow-[var(--shadow-sticker)]">
          <MailCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-6 font-serif text-[44px] leading-none">Check your inbox</h1>
        <p className="mt-3 text-[15px] text-ink-2">
          We sent a confirmation link to <strong className="text-ink">{email}</strong>. Click it and you&apos;re in.
        </p>
        <Link href="/login" className="eyebrow mt-8 inline-block text-ink hover:text-accent">
          ← Back to log in
        </Link>
      </div>
    );
  }

  const switchHref = `${isSignup ? "/login" : "/signup"}${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div className="animate-rise w-full max-w-[400px]">
      <p className="eyebrow text-accent">{isSignup ? "Join the neighborhood" : "Welcome back"}</p>
      <h1 className="mt-2 font-serif text-[52px] leading-[0.95] tracking-tight">
        {isSignup ? (
          <>
            Create your <em>account</em>
          </>
        ) : (
          <>
            Log <em>in</em>
          </>
        )}
      </h1>
      <p className="mt-3 text-[15px] text-ink-2">
        {isSignup ? "Free forever. Start selling in under a minute." : "Pick up where you left off."}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {isSignup && (
          <Labeled label="Full name" htmlFor="name">
            <input
              id="name"
              aria-label="Full name"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Appleseed"
              className={inputCls}
            />
          </Labeled>
        )}
        <Labeled label="Email address" htmlFor="email">
          <input
            id="email"
            aria-label="Email address"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
          />
        </Labeled>
        <Labeled label="Password" htmlFor="password" aside={isSignup ? "6+ characters" : undefined}>
          <div className="relative">
            <input
              id="password"
              aria-label="Password"
              type={showPw ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-3 hover:text-ink"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Labeled>

        {error && (
          <p role="alert" className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-[14px] text-accent-dark">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-[16px] font-semibold text-paper transition hover:bg-accent active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {isSignup ? "Sign Up" : "Log In"}
          {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
        </button>
      </form>

      <p className="mt-8 border-t border-dashed border-line pt-6 text-[14px] text-ink-2">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link href={switchHref} className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4 hover:text-accent">
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}

function Labeled({
  label,
  htmlFor,
  aside,
  children,
}: {
  label: string;
  htmlFor: string;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={htmlFor} className="text-[14px] font-medium">
          {label}
        </label>
        {aside && <span className="font-mono text-[11px] text-ink-3">{aside}</span>}
      </div>
      {children}
    </div>
  );
}
