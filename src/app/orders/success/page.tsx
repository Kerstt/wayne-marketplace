import Link from "next/link";
import { Check, Clock, RotateCcw } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfillCheckoutSession } from "@/lib/orders";
import { stripe } from "@/lib/stripe";
import { formatPrice } from "@/lib/format";
import type { Listing, Order } from "@/lib/types";
import { AutoRefresh } from "@/components/AutoRefresh";

export const metadata = { title: "Order confirmed · Wayne Market" };
export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const admin = createAdminClient();

  const load = async () => {
    if (!session_id) return null;
    const { data } = await admin.from("orders").select("*").eq("checkout_session_id", session_id).maybeSingle();
    return data as Order | null;
  };

  let order = await load();
  if (!order) {
    return (
      <Shell>
        <h1 className="font-serif text-[48px] leading-none">Order not found.</h1>
        <p className="mt-3 text-ink-2">We couldn&apos;t find that checkout. If you were charged, contact the seller.</p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 font-semibold text-paper hover:bg-accent">
          Back to browsing
        </Link>
      </Shell>
    );
  }

  // Normally the webhook confirms the order within a second or two. Give it a moment,
  // then fall back to checking with Stripe directly so the buyer never sees a stale page.
  if (order.status === "pending") {
    for (let i = 0; i < 6 && order?.status === "pending"; i++) {
      await sleep(700);
      order = await load();
    }
    if (order?.status === "pending") {
      const session = await stripe().checkout.sessions.retrieve(
        order.checkout_session_id,
        {},
        { stripeAccount: order.stripe_account_id },
      );
      await fulfillCheckoutSession(session, "success_page");
      order = await load();
    }
  }
  if (!order) return null;

  const { data: listingRow } = order.listing_id
    ? await admin.from("listings").select("*").eq("id", order.listing_id).maybeSingle()
    : { data: null };
  const listing = listingRow as Listing | null;

  if (order.status === "pending") {
    return (
      <Shell>
        <AutoRefresh seconds={3} />
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sun">
          <Clock className="h-6 w-6" />
        </span>
        <h1 className="mt-6 font-serif text-[48px] leading-none">Confirming your payment…</h1>
        <p className="mt-3 text-ink-2">This page refreshes on its own. It usually takes a few seconds.</p>
      </Shell>
    );
  }

  if (order.status === "refunded") {
    return (
      <Shell>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white">
          <RotateCcw className="h-6 w-6" />
        </span>
        <h1 className="mt-6 font-serif text-[48px] leading-none">Someone beat you to it.</h1>
        <p className="mt-3 max-w-md text-ink-2">
          <strong className="text-ink">{order.listing_title}</strong> sold moments before your payment went through. We&apos;ve
          refunded you in full. It can take 5–10 days to appear on your statement.
        </p>
        <Link href="/" className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 font-semibold text-paper hover:bg-accent">
          Keep browsing
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <div data-testid="order-success" className="w-full max-w-lg">
        <span className="mx-auto flex h-16 w-16 -rotate-6 items-center justify-center rounded-2xl bg-leaf text-white shadow-[var(--shadow-sticker)]">
          <Check className="h-8 w-8" />
        </span>
        <p className="eyebrow mt-6 text-leaf">Payment received</p>
        <h1 className="mt-2 font-serif text-[56px] leading-[0.9] tracking-tight">
          It&apos;s <em className="text-accent">yours.</em>
        </h1>
        <p className="mt-3 text-[15px] text-ink-2">
          A receipt is on its way to <strong className="text-ink">{order.buyer_email ?? "your email"}</strong>. Message the
          seller to arrange pickup.
        </p>

        {/* Receipt */}
        <div className="mt-8 overflow-hidden rounded-[24px] border border-line bg-card text-left shadow-[var(--shadow-lift)]">
          <div className="flex items-center gap-4 p-4">
            {listing?.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.image_url} alt="" className="h-20 w-20 rounded-xl object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-xl bg-paper-2" />
            )}
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold" data-testid="order-title">{order.listing_title}</p>
              <span className="mt-1 inline-block rotate-[-3deg] rounded-full bg-ink px-2.5 py-0.5 font-mono text-[11px] font-semibold text-paper">
                SOLD TO YOU
              </span>
            </div>
          </div>
          <dl className="divide-y divide-dashed divide-line border-t border-dashed border-line font-mono text-[13px]">
            <Row label="Total paid">
              <span className="text-[15px] font-semibold text-ink" data-testid="order-total">
                {formatPrice(order.amount_total / 100)}
              </span>
            </Row>
            <Row label="Order">#{order.id.slice(0, 8)}</Row>
            <Row label="Paid">{order.paid_at ? new Date(order.paid_at).toLocaleString("en-US") : "—"}</Row>
          </dl>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {order.listing_id && (
            <Link
              href={`/listing/${order.listing_id}`}
              className="rounded-full border border-line bg-card px-6 py-3 text-[15px] font-semibold transition hover:border-ink"
            >
              View item
            </Link>
          )}
          <Link href="/" className="rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-paper transition hover:bg-accent">
            Keep browsing
          </Link>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="animate-rise mx-auto flex min-h-[75vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
      {children}
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <dt className="eyebrow text-ink-3">{label}</dt>
      <dd className="text-ink-2">{children}</dd>
    </div>
  );
}
