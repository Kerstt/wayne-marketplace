"use client";

import Link from "next/link";
import { RotateCw } from "lucide-react";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <span className="rotate-2 rounded-full bg-accent px-4 py-1.5 font-mono text-[14px] font-semibold text-white shadow-[var(--shadow-sticker)]">
        HICCUP
      </span>
      <h1 className="mt-6 font-serif text-[56px] leading-[0.9] tracking-tight">
        That didn&apos;t <em className="text-accent">load.</em>
      </h1>
      <p className="mt-4 text-[16px] text-ink-2">We couldn&apos;t reach the marketplace just now. Give it another go.</p>
      <div className="mt-8 flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-paper transition hover:bg-accent"
        >
          <RotateCw className="h-4 w-4" /> Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-line bg-card px-6 py-3 text-[15px] font-semibold transition hover:border-ink"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
