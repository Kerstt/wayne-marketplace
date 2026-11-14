# Wayne Marketplace

A Facebook Marketplace–style app built with **Next.js 15 (App Router) + React 19 + Tailwind CSS 4** on the front end and **Supabase (Auth, Postgres, Storage)** on the back end.

## Features

- **Sign up / log in** – email + password via Supabase Auth (sessions in cookies via `@supabase/ssr`; `/create`, `/inbox`, `/selling` are protected by middleware).
- **Create listing** – photo upload to the `listing-images` Storage bucket plus title, price, category, description, contact email and optional location, with a live preview.
- **Browse & search** – grid or list view, 16 category tabs and sidebar, keyword search (title + description), sort by newest or price.
- **Listing detail** – large image, full details, seller info, and a **Message Seller** form (with quick replies). Messages are stored in Supabase.
- **Inbox** – sellers see messages received (with "Reply by email"); buyers see messages they sent.
- **Your listings** – manage and delete your listings (deletes the photo too).

## Design

The look is a "neighborhood flea market" style: warm paper and ink, a vermilion accent, yellow price-sticker tags, and taped polaroids. All tokens live in [`src/app/globals.css`](src/app/globals.css).

| Token | Use |
|---|---|
| `paper` `#f4efe5` / `card` `#fffcf6` | page and surface backgrounds (with a faint paper grain) |
| `ink` `#17140f` | text, primary buttons |
| `accent` `#ff5a1f` | highlights, hover, the "Publish" / "Send message" actions |
| `sun` `#ffd84d` | price stickers (green `leaf` for free items) |
| **Instrument Serif** | display headlines and titles |
| **Bricolage Grotesque** | UI and body text |
| **IBM Plex Mono** (`eyebrow` utility) | labels, metadata, prices |

Shared primitives (`PriceTag`, `Logo`, `Avatar`, button and input styles) are in [`src/components/ui.tsx`](src/components/ui.tsx).

## Setup

1. In your Supabase project's **SQL Editor**, run the files in [`supabase/migrations/`](supabase/migrations) in order (`0001_…`, then `0002_…`).
2. Copy `.env.example` to `.env.local` and fill in your Project URL and anon/publishable key.
3. `npm install` and then `npm run dev`. Open http://localhost:3000.

Optional demo data (12 listings with photos, owned by an existing account):

```bash
SEED_EMAIL=you@example.com SEED_PASSWORD=... node --experimental-websocket --env-file=.env.local scripts/seed-demo.mjs
```

## Deploy to Vercel

1. Make sure both SQL migrations have been run in Supabase (see Setup).
2. Deploy, using either of these:
   - **GitHub:** push this repo to GitHub, then go to Vercel → *Add New → Project* → import it (framework is detected as Next.js; no build settings to change).
   - **CLI:** run `vercel` in this folder (and `vercel --prod` for production).
3. In Vercel → *Settings → Environment Variables*, add these for Production, Preview and Development, then redeploy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. In Supabase → *Authentication → URL Configuration*:
   - **Site URL:** `https://<your-app>.vercel.app`
   - **Redirect URLs:** add `https://<your-app>.vercel.app/**` (and `https://*-<your-team>.vercel.app/**` if you want preview deployments to handle email links).

Before real users arrive, consider:
- **Turn "Confirm email" back on** (Auth → Sign In / Providers → Email). While it's off, anyone can sign up with an email address they don't own. Supabase's built-in mailer is rate-limited (a few emails per hour), so add a custom SMTP provider (Resend, Postmark, SES…) when you do.
- **Free-plan pausing:** Supabase pauses free projects after about a week with no traffic.
- **Public seller emails:** a listing's contact email is shown publicly, by design, which exposes it to scrapers.

## Security model (Row Level Security)

| Table / bucket     | Read                              | Write                                         |
|--------------------|-----------------------------------|-----------------------------------------------|
| `listings`         | everyone                          | only the owner can insert / update / delete   |
| `messages`         | only that message's seller and sender | signed-in users can insert as themselves; `seller_id` is set by a trigger from the listing |
| `listing-images`   | public URLs; via the API each user sees only their own `<user_id>/` folder | users can upload / delete only in their own folder |

## Notes

- Tailwind is pinned to 4.1.13 because the Node version in use (20.12) can't load the ESM-only dependency of newer Tailwind versions. Upgrading to **Node 22+** removes that constraint and the Supabase deprecation warning.
- If "Confirm email" is turned on in Supabase Auth, new users see a "Check your email" screen. The link returns to `/auth/callback`, so add your site URL under Auth → URL Configuration.
