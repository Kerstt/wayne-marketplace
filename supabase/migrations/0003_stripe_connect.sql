-- Stripe Connect: sellers' connected accounts, orders, and a sold state on listings.
-- All writes to these tables happen server-side with the service-role key (API routes + webhook).

-- ---------- listings: sold state ----------
alter table public.listings
  add column if not exists status text not null default 'active' check (status in ('active', 'sold')),
  add column if not exists sold_at timestamptz;

create index if not exists listings_status_idx on public.listings (status);

-- ---------- sellers ----------
create table if not exists public.sellers (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  email              text not null,
  stripe_account_id  text not null unique,
  charges_enabled    boolean not null default false,
  payouts_enabled    boolean not null default false,
  details_submitted  boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists sellers_email_idx on public.sellers (lower(email));

alter table public.sellers enable row level security;

-- Anyone may see whether a seller can take payments (drives the Buy Now button).
create policy "Seller payment status is public"
  on public.sellers for select
  to anon, authenticated
  using (true);
-- No insert/update/delete policies: only the server (service role) writes.

-- ---------- orders ----------
create table if not exists public.orders (
  id                      uuid primary key default gen_random_uuid(),
  listing_id              uuid references public.listings (id) on delete set null,
  listing_title           text not null,
  seller_user_id          uuid references auth.users (id) on delete set null,
  stripe_account_id       text not null,
  checkout_session_id     text not null unique,
  payment_intent_id       text,
  amount_total            integer not null check (amount_total >= 0),      -- cents
  application_fee_amount  integer not null check (application_fee_amount >= 0), -- cents
  currency                text not null default 'usd',
  buyer_email             text,
  status                  text not null default 'pending' check (status in ('pending', 'paid', 'refunded')),
  confirmed_via           text check (confirmed_via in ('webhook', 'success_page')),
  created_at              timestamptz not null default now(),
  paid_at                 timestamptz
);

create index if not exists orders_seller_idx on public.orders (seller_user_id, created_at desc);
create index if not exists orders_listing_idx on public.orders (listing_id);

alter table public.orders enable row level security;

-- Sellers can see their own sales. Buyers see their order on the success page (rendered server-side).
create policy "Sellers can read their own orders"
  on public.orders for select
  to authenticated
  using ((select auth.uid()) = seller_user_id);
-- No insert/update/delete policies: only the server (service role) writes.

-- A sold listing can't be edited back to active by the seller through the API.
create or replace function public.protect_listing_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and (new.status is distinct from old.status or new.sold_at is distinct from old.sold_at) then
    raise exception 'Listing status can only be changed by the server';
  end if;
  return new;
end;
$$;

drop trigger if exists listings_protect_status on public.listings;
create trigger listings_protect_status
  before update on public.listings
  for each row execute function public.protect_listing_status();
