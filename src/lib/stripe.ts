import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

export function stripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key, { appInfo: { name: "Wayne Market" } });
  }
  return client;
}

/** Marketplace commission taken from every sale. */
export const PLATFORM_FEE_PERCENT = 10;

/** Tag on every Checkout Session we create; the shared sandbox sends us other apps' events too. */
export const APP_TAG = "wayne-market";

export const toCents = (price: number) => Math.round(Number(price) * 100);
export const platformFee = (amountCents: number) => Math.round((amountCents * PLATFORM_FEE_PERCENT) / 100);

/** Stripe Checkout limits for USD. */
export const MIN_CHARGE_CENTS = 50;
export const MAX_CHARGE_CENTS = 99_999_999;

/** Absolute origin of the current request (works locally and on Vercel). */
export function originOf(req: Request) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}
