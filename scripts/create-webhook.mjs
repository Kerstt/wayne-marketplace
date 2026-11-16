// Registers this app's webhook endpoint in the Stripe sandbox (run once, after deploying).
// Usage: node --env-file=.env.local scripts/create-webhook.mjs https://YOUR-APP.vercel.app
import Stripe from "stripe";

const base = (process.argv[2] ?? "").replace(/\/$/, "");
if (!/^https:\/\/.+/.test(base)) {
  console.error("Pass your public production URL, e.g. https://your-app.vercel.app");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const endpoint = await stripe.webhookEndpoints.create({
  url: `${base}/api/stripe/webhook`,
  connect: true, // direct charges: events come from the sellers' connected accounts
  enabled_events: ["checkout.session.completed", "account.updated"],
  description: "Wayne Market",
});

console.log("Endpoint:", endpoint.id, endpoint.url);
console.log("Signing secret:", endpoint.secret);
console.log("\nAdd it as STRIPE_WEBHOOK_SECRET in .env.local and in Vercel, then redeploy.");
