import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowUpRight, Check, Circle, ShieldCheck, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshSeller } from "@/lib/sellers";
import { PLATFORM_FEE_PERCENT } from "@/lib/stripe";
import { formatPrice, shortAgo } from "@/lib/format";
import type { Order, Seller } from "@/lib/types";

export const metadata = { title: "Get paid · Wayne Market" };
export const dynamic = "force-dynamic";

type SP = Promise<{ onboarding?: string; error?: string }>;

export default async function PayoutsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/payouts");

  const admin = createAdminClient();
  const { data: row } = await admin.from("sellers").select("*").eq("user_id", user.id).maybeSingle();
  let seller = row as Seller | null;
  let syncError: string | null = null;
  if (seller) {
    try {
      seller = await refreshSeller(seller); // always show live status from Stripe
    } catch (e) {
      syncError = e instanceof Error ? e.message : "Couldn't reach Stripe";
    }
  }

  const [{ data: orderRows }, { count: listingCount }] = await Promise.all([
    supabase.from("orders").select("*").eq("seller_user_id", user.id).neq("status", "pending").order("created_at", { ascending: false }),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
  ]);
  const orders = (orderRows ?? []) as Order[];
  const paid = orders.filter((o) => o.status === "paid");
  const gross = paid.reduce((s, o) => s + o.amount_total, 0);
  const fees = paid.reduce((s, o) => s + o.application_fee_amount, 0);

  const state = !seller ? "none" : seller.charges_enabled ? "active" : "incomplete";
  const error = sp.error ?? syncError;

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-8 sm:px-6">
      <header className="animate-rise">
        <p className="eyebrow text-accent">Payouts</p>
        <h1 className="mt-2 font-serif text-[52px] leading-[0.95] tracking-tight sm:text-[64px]">
          Get <em>paid.</em>
        </h1>
        <p className="mt-3 max-w-xl text-[16px] text-ink-2">
          Connect a Stripe account and every listing you post gets a <strong className="text-ink">Buy Now</strong> button.
          Buyers pay by card, the money lands in your Stripe account, and Wayne Market keeps {PLATFORM_FEE_PERCENT}%.
        </p>
      </header>

      {error && (
        <p role="alert" className="mt-6 flex items-start gap-2 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-[14px] text-accent-dark">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {/* Status card */}
      <section
        className={`animate-rise mt-8 overflow-hidden rounded-[26px] border ${
          state === "active" ? "border-leaf/30 bg-leaf/[0.06]" : "border-line bg-card"
        }`}
        data-testid="payouts-status"
      >
        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div>
            {state === "active" ? (
              <>
                <p className="eyebrow flex items-center gap-2 text-leaf">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-leaf text-white">
                    <Check className="h-3 w-3" />
                  </span>
                  Connected · payments on
                </p>
                <h2 className="mt-3 font-serif text-[36px] leading-none">You&apos;re ready to sell.</h2>
                <p className="mt-2 text-[15px] text-ink-2">
                  {listingCount ?? 0} of your active listings now show <strong className="text-ink">Buy Now</strong>.
                </p>
              </>
            ) : state === "incomplete" ? (
              <>
                <p className="eyebrow text-accent">Almost there</p>
                <h2 className="mt-3 font-serif text-[36px] leading-none">Finish setting up Stripe.</h2>
                <p className="mt-2 text-[15px] text-ink-2">
                  Stripe still needs a few details before buyers can pay you. It takes about two minutes.
                </p>
              </>
            ) : (
              <>
                <p className="eyebrow text-ink-3">Not connected</p>
                <h2 className="mt-3 font-serif text-[36px] leading-none">Connect with Stripe.</h2>
                <p className="mt-2 text-[15px] text-ink-2">
                  You&apos;ll be taken to Stripe&apos;s secure onboarding, then brought right back here.
                </p>
              </>
            )}
          </div>

          {state !== "active" ? (
            <form action="/api/stripe/connect" method="post">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#635BFF] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[var(--shadow-lift)] transition hover:bg-[#5249e6] active:scale-[0.98] sm:w-auto"
              >
                <Zap className="h-4 w-4" />
                {state === "none" ? "Connect with Stripe" : "Continue onboarding"}
              </button>
            </form>
          ) : (
            <form action="/api/stripe/connect" method="post">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-card px-5 py-3 text-[14px] font-semibold transition hover:border-ink"
              >
                Update details <ArrowUpRight className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>

        {seller && (
          <div className="grid grid-cols-1 divide-y divide-dashed divide-line border-t border-dashed border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <Step done={seller.details_submitted} label="Details submitted" />
            <Step done={seller.charges_enabled} label="Can accept payments" />
            <Step done={seller.payouts_enabled} label="Payouts to bank" />
          </div>
        )}
        {seller && (
          <p className="border-t border-dashed border-line px-6 py-3 font-mono text-[11px] text-ink-3 sm:px-8">
            Stripe account <span className="text-ink-2" data-testid="stripe-account-id">{seller.stripe_account_id}</span>
          </p>
        )}
      </section>

      {/* How it works */}
      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <How n="01" title="List it">Post an item like always. It gets a Buy Now button automatically.</How>
        <How n="02" title="They pay">The buyer checks out with Stripe. No account needed.</How>
        <How n="03" title="You get paid">
          The sale goes straight to your Stripe account, minus our {PLATFORM_FEE_PERCENT}% fee. The item is marked Sold.
        </How>
      </section>

      {/* Sales */}
      <section className="mt-12">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <h2 className="font-serif text-[32px] leading-none">Sales</h2>
          {paid.length > 0 && (
            <p className="font-mono text-[12px] text-ink-3">
              {formatPrice(gross / 100)} gross · {formatPrice(fees / 100)} fees ·{" "}
              <span className="font-semibold text-leaf">{formatPrice((gross - fees) / 100)} to you</span>
            </p>
          )}
        </div>
        {orders.length === 0 ? (
          <p className="py-10 text-center text-[15px] text-ink-3">No sales yet. They&apos;ll show up here.</p>
        ) : (
          <ul className="divide-y divide-dashed divide-line" data-testid="sales-list">
            {orders.map((o) => (
              <li key={o.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-4 sm:grid-cols-[1fr_140px_auto]">
                <div className="min-w-0">
                  {o.listing_id ? (
                    <Link href={`/listing/${o.listing_id}`} className="block truncate text-[15px] font-semibold hover:text-accent">
                      {o.listing_title}
                    </Link>
                  ) : (
                    <p className="truncate text-[15px] font-semibold">{o.listing_title}</p>
                  )}
                  <p className="eyebrow mt-1 text-ink-3">
                    {o.buyer_email ?? "Buyer"} · {shortAgo(o.paid_at ?? o.created_at)}
                  </p>
                </div>
                <span className="hidden font-mono text-[12px] text-ink-3 sm:block">
                  {formatPrice(o.amount_total / 100)} − {formatPrice(o.application_fee_amount / 100)}
                </span>
                {o.status === "paid" ? (
                  <span className="rounded-full bg-leaf px-3 py-1 font-mono text-[13px] font-semibold text-white">
                    +{formatPrice((o.amount_total - o.application_fee_amount) / 100)}
                  </span>
                ) : (
                  <span className="rounded-full bg-paper-2 px-3 py-1 font-mono text-[12px] text-ink-3">Refunded</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 flex items-start gap-2 text-[12px] leading-relaxed text-ink-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        Sandbox mode: no real money moves. Use Stripe&apos;s test data during onboarding and the card 4242 4242 4242 4242 at checkout.
      </p>
    </main>
  );
}

function Step({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 px-6 py-4 sm:px-8">
      {done ? (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-leaf text-white">
          <Check className="h-3 w-3" />
        </span>
      ) : (
        <Circle className="h-5 w-5 text-line" />
      )}
      <span className={`text-[14px] ${done ? "font-medium text-ink" : "text-ink-3"}`}>{label}</span>
    </div>
  );
}

function How({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-line bg-card p-5">
      <p className="font-mono text-[12px] text-accent">{n}</p>
      <p className="mt-1 font-serif text-[24px] leading-none">{title}</p>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{children}</p>
    </div>
  );
}
