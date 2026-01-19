-- migration: create videos table with indexes and triggers
-- description: creates the core videos table for storing video metadata and access control
-- affected tables: videos
-- dependencies: none

-- ============================================================================
-- 1. create videos table
-- ============================================================================

create table videos (
  -- identity
  id uuid default gen_random_uuid() primary key,
  
  -- content metadata
  title text not null,
  description text,
  category text not null check (category in ('yoga', 'mobility', 'calisthenics')),
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  duration integer not null check (duration > 0 and duration <= 7200),
  
  -- file references (relative paths in supabase storage)
  video_url text not null,
  thumbnail_url text not null,
  
  -- access control
  is_premium boolean default false not null,
  status text default 'draft' not null check (status in ('draft', 'published', 'archived')),
  
  -- audit timestamps
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================================================
-- 2. create indexes for query optimization
-- ============================================================================

-- composite index for main user-facing queries (category filtering + access control)
-- optimizes: select * from videos where category = 'yoga' and is_premium = false and status = 'published'
create index idx_videos_category_premium_status 
on videos(category, is_premium, status);

-- single index for admin dashboard filtering by status
-- optimizes: select * from videos where status = 'draft'
create index idx_videos_status 
on videos(status);

-- ============================================================================
-- 3. create function to auto-update updated_at timestamp
-- ============================================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
   new.updated_at = now();
   return new;
end;
$$ language 'plpgsql';

-- ============================================================================
-- 4. create trigger to automatically update updated_at on row updates
-- ============================================================================

create trigger update_videos_updated_at 
before update on videos
for each row 
execute function update_updated_at_column();

-- ============================================================================
-- 5. add table and column comments for documentation
-- ============================================================================

comment on table videos is 
  'tabela przechowująca metadane nagrań wideo z ćwiczeniami fizycznymi';

comment on column videos.duration is 
  'czas trwania nagrania w sekundach (maksymalnie 7200 = 2 godziny)';

comment on column videos.video_url is 
  'relatywna ścieżka do pliku wideo w supabase storage (np. videos-free/yoga-flow.mp4)';

comment on column videos.thumbnail_url is 
  'relatywna ścieżka do miniaturki w supabase storage (np. thumbnails/yoga-flow.jpg)';

comment on column videos.status is 
  'status publikacji: draft (roboczy), published (opublikowany), archived (zarchiwizowany)';

comment on column videos.is_premium is 
  'określa czy treść wymaga dostępu premium (true = płatne, false = darmowe)';
