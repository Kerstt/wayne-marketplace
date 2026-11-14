-- Fix: deleting a listing's photo silently did nothing.
-- Supabase Storage's remove() first SELECTs the object, so without a SELECT policy the
-- delete matches zero rows. This lets each user see only the files in their own folder
-- (public image URLs keep working regardless, because the bucket is public).

create policy "Users can see their own listing images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
