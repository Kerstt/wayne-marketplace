"use client";

import { useState } from "react";
import { Loader2, Lock, Zap } from "lucide-react";
import { formatPrice } from "@/lib/format";

/** Plain form POST to /api/stripe/checkout (works without JS too); shows a spinner while redirecting. */
export function BuyNow({ listingId, price }: { listingId: string; price: number }) {
  const [busy, setBusy] = useState(false);
  return (
    <form action="/api/stripe/checkout" method="post" onSubmit={() => setBusy(true)} data-testid="buy-now-form">
      <input type="hidden" name="listing_id" value={listingId} />
      <button
        type="submit"
        disabled={busy}
        className="group flex w-full items-center justify-center gap-2 rounded-full bg-accent py-4 text-[16px] font-semibold text-white shadow-[var(--shadow-lift)] transition hover:bg-accent-dark active:scale-[0.98] disabled:opacity-70"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 transition group-hover:rotate-12" />}
        {busy ? "Opening secure checkout…" : `Buy Now · ${formatPrice(price)}`}
      </button>
      <p className="mt-2 flex items-center justify-center gap-1.5 font-mono text-[11px] text-ink-3">
        <Lock className="h-3 w-3" /> Secure checkout by Stripe · no account needed
      </p>
    </form>
  );
}
