-- migration: create row level security policies for storage buckets
-- description: implements access control for video files and thumbnails
-- affected storage: videos-free, videos-premium, thumbnails
-- dependencies: 20260118122100_create_storage_buckets.sql
-- security: granular policies for each bucket and operation (select, insert, update, delete)

-- ============================================================================
-- bucket: videos-free
-- access: public read, admin write
-- ============================================================================

-- read policy: anyone can access free videos (authenticated + anonymous)
create policy "public videos free read"
on storage.objects for select
using (bucket_id = 'videos-free');

-- insert policy: only admins can upload free videos
create policy "admin can upload free videos"
on storage.objects for insert
with check (
  bucket_id = 'videos-free'
  and auth.uid() is not null
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- update policy: only admins can update/replace free videos
create policy "admin can update free videos"
on storage.objects for update
using (
  bucket_id = 'videos-free'
  and auth.uid() is not null
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- delete policy: only admins can delete free videos
-- warning: destructive operation - ensure video metadata is also removed from videos table
create policy "admin can delete free videos"
on storage.objects for delete
using (
  bucket_id = 'videos-free'
  and auth.uid() is not null
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ============================================================================
-- bucket: videos-premium
-- access: premium/admin read, admin write
-- ============================================================================

-- read policy: only premium and admin users can access premium videos
-- note: coalesce handles users without role metadata (defaults to 'free')
create policy "premium users can read premium videos"
on storage.objects for select
using (
  bucket_id = 'videos-premium'
  and auth.uid() is not null
  and (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), 'free') = 'premium'
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), 'free') = 'admin'
  )
);

-- insert policy: only admins can upload premium videos
create policy "admin can upload premium videos"
on storage.objects for insert
with check (
  bucket_id = 'videos-premium'
  and auth.uid() is not null
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- update policy: only admins can update/replace premium videos
create policy "admin can update premium videos"
on storage.objects for update
using (
  bucket_id = 'videos-premium'
  and auth.uid() is not null
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- delete policy: only admins can delete premium videos
-- warning: destructive operation - ensure video metadata is also removed from videos table
create policy "admin can delete premium videos"
on storage.objects for delete
using (
  bucket_id = 'videos-premium'
  and auth.uid() is not null
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ============================================================================
-- bucket: thumbnails
-- access: public read, admin write
-- ============================================================================

-- read policy: anyone can access thumbnails (authenticated + anonymous)
-- rationale: thumbnails are preview images and should be visible to all users
create policy "public thumbnails read"
on storage.objects for select
using (bucket_id = 'thumbnails');

-- insert policy: only admins can upload thumbnails
create policy "admin can upload thumbnails"
on storage.objects for insert
with check (
  bucket_id = 'thumbnails'
  and auth.uid() is not null
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- update policy: only admins can update/replace thumbnails
create policy "admin can update thumbnails"
on storage.objects for update
using (
  bucket_id = 'thumbnails'
  and auth.uid() is not null
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- delete policy: only admins can delete thumbnails
-- warning: ensure corresponding video metadata is updated if thumbnail is removed
create policy "admin can delete thumbnails"
on storage.objects for delete
using (
  bucket_id = 'thumbnails'
  and auth.uid() is not null
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
