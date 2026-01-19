-- migration: create storage buckets for video files and thumbnails
-- description: sets up three storage buckets with appropriate public/private settings
-- affected storage: videos-free (public), videos-premium (private), thumbnails (public)
-- dependencies: none (storage is independent of tables)

-- ============================================================================
-- 1. create storage buckets
-- ============================================================================

-- bucket: videos-free
-- purpose: store free-tier video content accessible to all users
-- public: true (direct public access without authentication)
insert into storage.buckets (id, name, public) 
values ('videos-free', 'videos-free', true);

-- bucket: videos-premium
-- purpose: store premium video content requiring authentication and premium role
-- public: false (access controlled via rls policies)
insert into storage.buckets (id, name, public) 
values ('videos-premium', 'videos-premium', false);

-- bucket: thumbnails
-- purpose: store thumbnail images for all videos (free and premium)
-- public: true (thumbnails are always visible for preview purposes)
insert into storage.buckets (id, name, public) 
values ('thumbnails', 'thumbnails', true);
