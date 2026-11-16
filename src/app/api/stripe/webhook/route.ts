import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/orders";
import { saveAccountStatus } from "@/lib/sellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Stripe Connect webhook (registered with connect: true).
 * The sandbox is shared, so events for sessions/accounts we don't know are acknowledged and ignored.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await req.text(); // raw body is required for signature verification
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.warn("[stripe/webhook] bad signature", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const result = await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session, "webhook");
        if (result.outcome !== "ignored") console.log(`[stripe/webhook] ${event.type} -> ${result.outcome}`);
        break;
      }
      case "account.updated": {
        const seller = await saveAccountStatus(event.data.object as Stripe.Account);
        if (seller) console.log(`[stripe/webhook] account.updated ${seller.stripe_account_id} charges=${seller.charges_enabled}`);
        break;
      }
      default:
        break; // not subscribed / not relevant
    }
  } catch (err) {
    // Our own failure (e.g. database): return 500 so Stripe retries.
    console.error("[stripe/webhook] handler error", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
