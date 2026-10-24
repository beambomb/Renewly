-- Private storage buckets with per-user folders and server-side limits.
-- Object path convention: <user_id>/<uuid>.<ext>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('logos', 'logos', false, 524288, array['image/png', 'image/jpeg', 'image/webp']),
  ('receipts', 'receipts', false, 3145728, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy renewly_objects_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id in ('logos', 'receipts')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy renewly_objects_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('logos', 'receipts')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy renewly_objects_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id in ('logos', 'receipts')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('logos', 'receipts')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy renewly_objects_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('logos', 'receipts')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
