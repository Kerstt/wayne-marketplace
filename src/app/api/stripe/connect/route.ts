import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_TAG, originOf, stripe } from "@/lib/stripe";
import type { Seller } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * "Connect with Stripe": creates (once) a connected account for the signed-in seller,
 * stores its ID in Supabase, and redirects to Stripe's hosted onboarding.
 * POST from the Payouts page; GET is Stripe's refresh_url when a link expires.
 */
async function startOnboarding(req: NextRequest) {
  const origin = originOf(req);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.redirect(`${origin}/login?next=/payouts`, 303);

  try {
    const admin = createAdminClient();
    const { data: existing } = await admin.from("sellers").select("*").eq("user_id", user.id).maybeSingle();
    let seller = existing as Seller | null;

    if (!seller) {
      // Accounts v2 connected account with Stripe-hosted onboarding and no separate Stripe
      // dashboard login. Stripe collects the seller's details and is liable for losses, the seller
      // pays Stripe's processing fees, and we charge on this account directly (direct charges),
      // so it needs the "merchant" configuration with card payments.
      const account = await stripe().v2.core.accounts.create({
        contact_email: user.email,
        display_name: (user.user_metadata?.full_name as string | undefined)?.trim() || user.email,
        identity: { country: "US" },
        dashboard: "none",
        defaults: { responsibilities: { fees_collector: "stripe", losses_collector: "stripe" } },
        configuration: { merchant: { capabilities: { card_payments: { requested: true } } } },
        metadata: { app: APP_TAG, user_id: user.id },
      });
      const { data: inserted, error } = await admin
        .from("sellers")
        .insert({ user_id: user.id, email: user.email, stripe_account_id: account.id })
        .select()
        .single();
      if (error) throw error;
      seller = inserted as Seller;
    }

    const link = await stripe().v2.core.accountLinks.create({
      account: seller.stripe_account_id,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          refresh_url: `${origin}/api/stripe/connect`,
          return_url: `${origin}/payouts?onboarding=return`,
          collection_options: { fields: "currently_due" },
        },
      },
    });
    return NextResponse.redirect(link.url, 303);
  } catch (err) {
    console.error("[stripe/connect]", err);
    const msg = err instanceof Error ? err.message : "Could not start Stripe onboarding";
    return NextResponse.redirect(`${origin}/payouts?error=${encodeURIComponent(msg)}`, 303);
  }
}

export const POST = startOnboarding;
export const GET = startOnboarding;
