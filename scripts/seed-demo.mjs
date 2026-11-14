// Seeds demo listings through the public API (same path as the app: Storage upload + RLS insert).
// Usage: SEED_EMAIL=... SEED_PASSWORD=... node --experimental-websocket --env-file=.env.local scripts/seed-demo.mjs
// (--experimental-websocket is only needed on Node < 22)
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
  email: process.env.SEED_EMAIL,
  password: process.env.SEED_PASSWORD,
});
if (authErr) throw authErr;
const user = auth.user;

const img = (id) => `https://images.unsplash.com/photo-${id}?w=1000&q=80`;
const DEMO = [
  ["Apple Watch Series 7 — 45mm", 220, "electronics", "Mountain View, CA", "1523275335684-37898b6baf30", "Excellent condition, always used with a screen protector. Includes charger and two bands."],
  ["Nike Air Max — Red, Size 10", 65, "apparel", "San Jose, CA", "1542291026-7eec264c27ff", "Worn twice, basically new. No box."],
  ["MacBook Pro 13\" M1, 16GB / 512GB", 750, "electronics", "Palo Alto, CA", "1517336714731-489689fd1ca8", "Battery cycle count 112. Original charger included. Selling because I upgraded."],
  ["Mid-century green velvet sofa", 400, "home-goods", "Menlo Park, CA", "1555041469-a586c61ea9bc", "3-seater, super comfy. Smoke-free, pet-free home. You pick up."],
  ["Vintage road bike — 54cm frame", 280, "sporting-goods", "Redwood City, CA", "1485965120184-e220f721d03e", "Recently tuned, new tires and brake pads. Great commuter."],
  ["Acoustic guitar with gig bag", 150, "musical-instruments", "Sunnyvale, CA", "1510915361894-db8b60106cb1", "Plays beautifully, new strings. Comes with a padded gig bag and tuner."],
  ["1967 Ford Mustang Fastback", 48500, "vehicles", "Los Altos, CA", "1494976388531-d1058494cdd8", "Restored, numbers matching. Clean title. Serious inquiries only."],
  ["Cozy 1BR apartment — downtown", 2600, "property-rentals", "Palo Alto, CA", "1586023492125-27b2c045efd7", "Bright one-bedroom, in-unit laundry, 5 min walk to Caltrain. Available Dec 1."],
  ["PlayStation 5 console (disc edition)", 380, "toys-games", "Cupertino, CA", "1606813907291-d86efa9b94db", "Works perfectly, comes with one controller and all cables."],
  ["Yellow accent chair", 0, "free-stuff", "Mountain View, CA", "1592078615290-033ee584e267", "Free! Must pick up this weekend."],
  ["Garden trowel & potting soil set", 20, "garden-outdoor", "San Mateo, CA", "1416879595882-3373a0480b5b", "Sturdy steel trowel plus a bag of premium potting mix."],
  ["Mechanical keyboard (RGB, brown switches)", 60, "office-supplies", "Santa Clara, CA", "1587829741301-dc798b83add3", "Full-size, USB-C, barely used."],
];

for (const [title, price, category, location, photo, description] of DEMO) {
  const res = await fetch(img(photo));
  const bytes = new Uint8Array(await res.arrayBuffer());
  const path = `${user.id}/${crypto.randomUUID()}.jpg`;
  const { error: upErr } = await supabase.storage
    .from("listing-images")
    .upload(path, bytes, { contentType: "image/jpeg" });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from("listing-images").getPublicUrl(path);
  const { error } = await supabase.from("listings").insert({
    user_id: user.id,
    title,
    price,
    category,
    location,
    description,
    email: user.email,
    image_url: pub.publicUrl,
    image_path: path,
  });
  if (error) throw error;
  console.log("✓", title);
}
