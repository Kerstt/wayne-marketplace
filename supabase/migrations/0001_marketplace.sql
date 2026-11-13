-- Wayne Marketplace schema: listings, messages, storage bucket + RLS

-- ---------- listings ----------
create table if not exists public.listings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 5000),
  price       numeric(12, 2) not null check (price >= 0),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  category    text not null check (category in (
                'vehicles', 'property-rentals', 'apparel', 'electronics',
                'entertainment', 'family', 'free-stuff', 'garden-outdoor',
                'hobbies', 'home-goods', 'home-improvement', 'musical-instruments',
                'office-supplies', 'pet-supplies', 'sporting-goods', 'toys-games')),
  location    text not null default '' check (char_length(location) <= 120),
  image_url   text,
  image_path  text,
  created_at  timestamptz not null default now()
);

create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_category_idx on public.listings (category);
create index if not exists listings_user_id_idx on public.listings (user_id);

alter table public.listings enable row level security;

create policy "Listings are viewable by everyone"
  on public.listings for select
  to anon, authenticated
  using (true);

create policy "Users can create their own listings"
  on public.listings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own listings"
  on public.listings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own listings"
  on public.listings for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------- messages ----------
create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings (id) on delete cascade,
  seller_id    uuid not null references auth.users (id) on delete cascade,
  sender_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sender_name  text not null default '' check (char_length(sender_name) <= 80),
  sender_email text not null check (sender_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  body         text not null check (char_length(body) between 1 and 2000),
  created_at   timestamptz not null default now()
);

create index if not exists messages_seller_id_idx on public.messages (seller_id, created_at desc);
create index if not exists messages_sender_id_idx on public.messages (sender_id, created_at desc);
create index if not exists messages_listing_id_idx on public.messages (listing_id);

-- seller_id is always derived from the listing, never trusted from the client
create or replace function public.set_message_seller()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select l.user_id into new.seller_id from public.listings l where l.id = new.listing_id;
  if new.seller_id is null then
    raise exception 'Listing not found';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_set_seller on public.messages;
create trigger messages_set_seller
  before insert on public.messages
  for each row execute function public.set_message_seller();

alter table public.messages enable row level security;

create policy "Signed-in users can message sellers"
  on public.messages for insert
  to authenticated
  with check ((select auth.uid()) = sender_id);

create policy "Sellers and senders can read their messages"
  on public.messages for select
  to authenticated
  using ((select auth.uid()) = seller_id or (select auth.uid()) = sender_id);

-- ---------- storage ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-images', 'listing-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "Users upload listing images to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users delete their own listing images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
