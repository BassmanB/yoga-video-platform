-- migration: create row level security policies for videos table
-- description: implements role-based access control for video content (free, premium, admin)
-- affected tables: videos
-- dependencies: 20260118121900_create_videos_table.sql
-- security: enables rls and creates granular policies for each operation and role

-- ============================================================================
-- 1. enable row level security
-- ============================================================================

alter table videos enable row level security;

-- ============================================================================
-- 2. select policies - control who can view videos
-- ============================================================================

-- policy: public videos are viewable by everyone (authenticated + anonymous)
-- applies to: free content that is published
-- use case: homepage video grid for unauthenticated visitors
create policy "public videos are viewable by everyone"
on videos for select
using (
  is_premium = false 
  and status = 'published'
);

-- policy: premium videos for authenticated premium/admin users
-- applies to: paid content that is published
-- use case: premium content access for paying users
-- note: coalesce handles users without role metadata (defaults to 'free')
create policy "premium videos for authenticated premium/admin users"
on videos for select
using (
  is_premium = true 
  and status = 'published'
  and auth.uid() is not null 
  and (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), 'free') = 'premium'
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), 'free') = 'admin'
  )
);

-- policy: admins can view all videos regardless of status
-- applies to: all videos (draft, published, archived)
-- use case: admin content management dashboard
create policy "admins can view all videos"
on videos for select
using (
  auth.uid() is not null 
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ============================================================================
-- 3. insert policy - control who can create videos
-- ============================================================================

-- policy: only admins can insert videos
-- applies to: creating new video records
-- use case: admin uploads new content via supabase dashboard or api
create policy "only admins can insert videos"
on videos for insert
with check (
  auth.uid() is not null 
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ============================================================================
-- 4. update policy - control who can modify videos
-- ============================================================================

-- policy: only admins can update videos
-- applies to: modifying existing video metadata
-- use case: edit video details, change status (draft → published)
create policy "only admins can update videos"
on videos for update
using (
  auth.uid() is not null 
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ============================================================================
-- 5. delete policy - control who can delete videos
-- ============================================================================

-- policy: only admins can delete videos
-- applies to: permanently deleting video records
-- use case: remove unwanted content (prefer archiving via status change)
-- warning: this is a destructive operation - consider using status = 'archived' instead
create policy "only admins can delete videos"
on videos for delete
using (
  auth.uid() is not null 
  and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
