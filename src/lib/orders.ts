import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "./supabase/admin";
import { APP_TAG, stripe } from "./stripe";
import type { Order } from "./types";

export type FulfillResult =
  | { outcome: "ignored" } // not one of ours (shared sandbox)
  | { outcome: "unpaid" }
  | { outcome: "already_done"; order: Order }
  | { outcome: "fulfilled"; order: Order }
  | { outcome: "refunded"; order: Order }; // item was already sold to someone else

/**
 * Confirm a completed Checkout Session: mark the order paid and the listing sold.
 * Idempotent and race-safe — the webhook and the success page may both call it.
 */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  via: "webhook" | "success_page",
): Promise<FulfillResult> {
  if (session.metadata?.app !== APP_TAG) return { outcome: "ignored" };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("orders")
    .select("*")
    .eq("checkout_session_id", session.id)
    .maybeSingle();
  if (!existing) return { outcome: "ignored" };
  if (session.payment_status !== "paid") return { outcome: "unpaid" };

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  // 1) Claim the order: only one caller can flip pending -> paid.
  const { data: claimed, error: claimErr } = await admin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_intent_id: paymentIntentId,
      buyer_email: session.customer_details?.email ?? session.customer_email ?? null,
      amount_total: session.amount_total ?? (existing as Order).amount_total,
      confirmed_via: via,
    })
    .eq("id", existing.id)
    .eq("status", "pending")
    .select()
    .maybeSingle();
  if (claimErr) throw claimErr;
  if (!claimed) return { outcome: "already_done", order: existing as Order };
  const order = claimed as Order;

  // 2) Mark the listing sold — only if it's still available.
  const { data: sold, error: soldErr } = order.listing_id
    ? await admin
        .from("listings")
        .update({ status: "sold", sold_at: new Date().toISOString() })
        .eq("id", order.listing_id)
        .eq("status", "active")
        .select("id")
    : { data: [], error: null };
  if (soldErr) throw soldErr;

  if (sold && sold.length > 0) return { outcome: "fulfilled", order };

  // 3) Someone else bought it first (or it was deleted): refund this buyer in full, fee included.
  if (paymentIntentId) {
    await stripe().refunds.create(
      { payment_intent: paymentIntentId, refund_application_fee: true },
      { stripeAccount: order.stripe_account_id },
    );
  }
  const { data: refunded } = await admin
    .from("orders")
    .update({ status: "refunded" })
    .eq("id", order.id)
    .select()
    .single();
  return { outcome: "refunded", order: refunded as Order };
}
