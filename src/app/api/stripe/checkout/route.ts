import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshSeller } from "@/lib/sellers";
import {
  APP_TAG,
  MAX_CHARGE_CENTS,
  MIN_CHARGE_CENTS,
  originOf,
  platformFee,
  stripe,
  toCents,
} from "@/lib/stripe";
import type { Listing, Seller } from "@/lib/types";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * "Buy Now": creates a Stripe Checkout Session as a DIRECT CHARGE on the seller's
 * connected account, with the marketplace's platform fee as application_fee_amount.
 * No login required — Stripe Checkout collects the buyer's email.
 */
export async function POST(req: NextRequest) {
  const origin = originOf(req);
  const form = await req.formData();
  const listingId = String(form.get("listing_id") ?? "");
  if (!UUID_RE.test(listingId)) return NextResponse.redirect(`${origin}/`, 303);

  const back = (error: string) =>
    NextResponse.redirect(`${origin}/listing/${listingId}?error=${encodeURIComponent(error)}`, 303);

  try {
    const admin = createAdminClient();
    const { data: listingRow } = await admin.from("listings").select("*").eq("id", listingId).maybeSingle();
    const listing = listingRow as Listing | null;
    if (!listing) return NextResponse.redirect(`${origin}/`, 303);
    if (listing.status !== "active") return back("Sorry, this item has already been sold.");

    const amount = toCents(listing.price);
    if (amount < MIN_CHARGE_CENTS) return back("This item is free. Message the seller to arrange pickup.");
    if (amount > MAX_CHARGE_CENTS) return back("This item is too expensive to buy online. Message the seller.");

    // Sellers can't buy their own items.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id === listing.user_id) return back("You can't buy your own listing.");

    const { data: sellerRow } = await admin.from("sellers").select("*").eq("user_id", listing.user_id).maybeSingle();
    let seller = sellerRow as Seller | null;
    if (seller && !seller.charges_enabled) seller = await refreshSeller(seller); // in case a webhook was missed
    if (!seller?.charges_enabled) return back("The seller hasn't set up payments yet. Message them instead.");

    const fee = platformFee(amount);
    const metadata = { app: APP_TAG, listing_id: listing.id };

    const session = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: amount,
              product_data: {
                name: listing.title,
                description: listing.description.slice(0, 300) || undefined,
                images: listing.image_url ? [listing.image_url] : undefined,
              },
            },
          },
        ],
        payment_intent_data: {
          application_fee_amount: fee,
          description: `Wayne Market: ${listing.title}`,
          metadata,
        },
        customer_email: user?.email ?? undefined,
        metadata,
        success_url: `${origin}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/listing/${listing.id}?canceled=1`,
      },
      { stripeAccount: seller.stripe_account_id },
    );

    const { error } = await admin.from("orders").insert({
      listing_id: listing.id,
      listing_title: listing.title,
      seller_user_id: listing.user_id,
      stripe_account_id: seller.stripe_account_id,
      checkout_session_id: session.id,
      amount_total: amount,
      application_fee_amount: fee,
      currency: "usd",
      buyer_email: user?.email ?? null,
    });
    if (error) throw error;

    return NextResponse.redirect(session.url!, 303);
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return back("Checkout couldn't start. Please try again.");
  }
}
