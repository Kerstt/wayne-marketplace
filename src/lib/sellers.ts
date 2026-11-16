import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "./supabase/admin";
import { stripe } from "./stripe";
import type { Seller } from "./types";

/** Copy a connected account's capability flags into our sellers table. */
export async function saveAccountStatus(account: Stripe.Account) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sellers")
    .update({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", account.id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Seller | null; // null = not one of our sellers (shared sandbox)
}

/** Pull fresh status from Stripe (used when the seller returns from onboarding). */
export async function refreshSeller(seller: Seller) {
  const account = await stripe().accounts.retrieve(seller.stripe_account_id);
  return (await saveAccountStatus(account)) ?? seller;
}
