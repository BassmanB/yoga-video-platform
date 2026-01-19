# Database Schema Plan
## Yoga Video Platform MVP

**Version:** 1.0  
**Database:** PostgreSQL (Supabase)  
**Created:** 2026-01-18  
**Status:** Ready for Implementation

---

## 1. Overview

This document defines the complete database schema for the Yoga Video Platform MVP. The platform serves ~20 users with a freemium model for fitness video content (yoga, mobility, calisthenics).

### Key Design Principles

- **Simplicity First:** Minimal schema for MVP scope
- **Security by Default:** RLS policies on all tables and storage
- **Performance Ready:** Strategic indexing for expected query patterns
- **Future-Proof:** UUID keys and extensible structure for growth

---

## 2. Tables

### 2.1 Table: `videos`

Primary table storing video metadata and access control information.

```sql
CREATE TABLE videos (
  -- Identity
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Content Metadata
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('yoga', 'mobility', 'calisthenics')),
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  duration INTEGER NOT NULL CHECK (duration > 0 AND duration <= 7200),
  
  -- File References (relative paths in Supabase Storage)
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  
  -- Access Control
  is_premium BOOLEAN DEFAULT false NOT NULL,
  status TEXT DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Audit Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

#### Column Descriptions

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `title` | TEXT | Video title (required) |
| `description` | TEXT | Full video description (optional) |
| `category` | TEXT | Content category: yoga, mobility, or calisthenics |
| `level` | TEXT | Difficulty: beginner, intermediate, or advanced |
| `duration` | INTEGER | Video length in seconds (1-7200 = max 2 hours) |
| `video_url` | TEXT | Relative path in Supabase Storage (e.g., `videos-free/yoga-flow.mp4`) |
| `thumbnail_url` | TEXT | Relative path in Supabase Storage (e.g., `thumbnails/yoga-flow.jpg`) |
| `is_premium` | BOOLEAN | True if content requires premium access |
| `status` | TEXT | Publication status: draft, published, or archived |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last modification timestamp (auto-updated) |

#### Design Notes

- **Relative Paths:** `video_url` and `thumbnail_url` store paths relative to storage buckets, not full URLs. This enables environment portability (dev/staging/prod).
- **Duration Constraint:** Maximum 2 hours (7200 seconds) aligns with expected content length.
- **Status Field:** Enables draft-publish workflow. Only `published` videos are visible to end users via RLS policies.
- **ENUMs via CHECK:** PostgreSQL TEXT with CHECK constraints instead of native ENUMs for easier schema evolution.

---

## 3. User Management

### 3.1 Supabase Auth Integration

**Decision:** No custom `users` or `user_profiles` table in MVP.

All user data managed through Supabase Auth with metadata:

```json
{
  "role": "free" | "premium" | "admin",
  "display_name": "John Doe"
}
```

#### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `free` | Default for new users | Access to free videos only (`is_premium = false`) |
| `premium` | Paid tier users | Access to all published videos |
| `admin` | Platform administrators | Full CRUD on videos, view all statuses, manage storage |

#### Role Assignment

- New users: Manual assignment by admin via Supabase Auth Dashboard
- Default behavior: `role = null` treated as `free` via COALESCE in RLS policies
- Future enhancement: Supabase Auth Hook to auto-assign `role: 'free'` on signup

---

## 4. Indexes

Strategic indexes for expected query patterns.

### 4.1 Primary Index

```sql
-- Automatically created with PRIMARY KEY
-- videos_pkey ON videos(id)
```

### 4.2 Composite Index: Category + Premium + Status

```sql
CREATE INDEX idx_videos_category_premium_status 
ON videos(category, is_premium, status);
```

**Purpose:** Optimize main user-facing query:
```sql
SELECT * FROM videos 
WHERE category = 'yoga' 
  AND (is_premium = false OR <user_has_premium>) 
  AND status = 'published'
ORDER BY created_at DESC;
```

### 4.3 Single Index: Status

```sql
CREATE INDEX idx_videos_status 
ON videos(status);
```

**Purpose:** Admin dashboard filtering by status (draft/published/archived).

### 4.4 Index Strategy Summary

| Index | Columns | Use Case | Priority |
|-------|---------|----------|----------|
| Primary | `id` | Direct video lookup | Critical |
| Composite | `category, is_premium, status` | Filtered video grid | High |
| Single | `status` | Admin content management | Medium |

**Not Indexed:** `created_at` - Small dataset (~100 videos expected), sequential scan acceptable.

---

## 5. Triggers & Functions

### 5.1 Auto-Update `updated_at` Timestamp

Ensures `updated_at` always reflects last modification without application-level logic.

```sql
-- Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger
CREATE TRIGGER update_videos_updated_at 
BEFORE UPDATE ON videos
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
```

---

## 6. Row Level Security (RLS) Policies

### 6.1 Enable RLS

```sql
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
```

### 6.2 SELECT Policies

#### Policy 1: Public Videos (Free Content)

```sql
CREATE POLICY "Public videos are viewable by everyone"
ON videos FOR SELECT
USING (
  is_premium = false 
  AND status = 'published'
);
```

**Who:** Everyone (authenticated + anonymous)  
**What:** Free videos that are published  
**Use Case:** Homepage video grid for unauthenticated visitors

#### Policy 2: Premium Videos (Paid Content)

```sql
CREATE POLICY "Premium videos for authenticated premium/admin users"
ON videos FOR SELECT
USING (
  is_premium = true 
  AND status = 'published'
  AND auth.uid() IS NOT NULL 
  AND (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), 'free') = 'premium'
    OR COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), 'free') = 'admin'
  )
);
```

**Who:** Authenticated users with `role = 'premium'` or `role = 'admin'`  
**What:** Premium videos that are published  
**Use Case:** Premium content access for paying users  
**Note:** COALESCE handles users without role metadata (defaults to 'free')

#### Policy 3: Admin Full Access

```sql
CREATE POLICY "Admins can view all videos"
ON videos FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
```

**Who:** Authenticated admin users  
**What:** All videos regardless of status (draft/published/archived)  
**Use Case:** Admin content management dashboard

### 6.3 INSERT Policy

```sql
CREATE POLICY "Only admins can insert videos"
ON videos FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
```

**Who:** Admin users only  
**What:** Create new video records  
**Use Case:** Admin uploads new content via Supabase Dashboard or API

### 6.4 UPDATE Policy

```sql
CREATE POLICY "Only admins can update videos"
ON videos FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
```

**Who:** Admin users only  
**What:** Modify existing video metadata  
**Use Case:** Edit video details, change status (draft → published)

### 6.5 DELETE Policy

```sql
CREATE POLICY "Only admins can delete videos"
ON videos FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
```

**Who:** Admin users only  
**What:** Permanently delete video records  
**Use Case:** Remove unwanted content (prefer archiving via status change)

### 6.6 RLS Policy Summary

| Operation | Anonymous | Free User | Premium User | Admin |
|-----------|-----------|-----------|--------------|-------|
| SELECT free videos | ✅ | ✅ | ✅ | ✅ |
| SELECT premium videos | ❌ | ❌ | ✅ | ✅ |
| SELECT draft/archived | ❌ | ❌ | ❌ | ✅ |
| INSERT | ❌ | ❌ | ❌ | ✅ |
| UPDATE | ❌ | ❌ | ❌ | ✅ |
| DELETE | ❌ | ❌ | ❌ | ✅ |

---

## 7. Storage Buckets

### 7.1 Bucket Structure

```
videos-free/          # Public video files (free tier content)
  ├── yoga-morning-flow.mp4
  ├── calisthenics-intro.mp4
  └── ...

videos-premium/       # Restricted video files (premium content)
  ├── advanced-mobility.mp4
  ├── premium-yoga-sequence.mp4
  └── ...

thumbnails/           # Public thumbnail images
  ├── yoga-morning-flow.jpg
  ├── advanced-mobility.jpg
  └── ...
```

### 7.2 Bucket Configuration

```sql
-- Create Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('videos-free', 'videos-free', true),
  ('videos-premium', 'videos-premium', false),
  ('thumbnails', 'thumbnails', true);
```

### 7.3 Storage RLS Policies

#### Bucket: `videos-free`

```sql
-- READ: Public access
CREATE POLICY "Public videos free read"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos-free');

-- WRITE: Admin only
CREATE POLICY "Admin can upload free videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos-free'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin can update free videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'videos-free'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin can delete free videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos-free'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
```

#### Bucket: `videos-premium`

```sql
-- READ: Premium/Admin users only
CREATE POLICY "Premium users can read premium videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'videos-premium'
  AND auth.uid() IS NOT NULL
  AND (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), 'free') = 'premium'
    OR COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), 'free') = 'admin'
  )
);

-- WRITE: Admin only
CREATE POLICY "Admin can upload premium videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos-premium'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin can update premium videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'videos-premium'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin can delete premium videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos-premium'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
```

#### Bucket: `thumbnails`

```sql
-- READ: Public access
CREATE POLICY "Public thumbnails read"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

-- WRITE: Admin only
CREATE POLICY "Admin can upload thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'thumbnails'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin can update thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'thumbnails'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin can delete thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'thumbnails'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
```

### 7.4 Storage Security Summary

| Bucket | Public Read | Authenticated Read | Admin Write |
|--------|-------------|-------------------|-------------|
| `videos-free` | ✅ | ✅ | ✅ |
| `videos-premium` | ❌ | Premium/Admin only | ✅ |
| `thumbnails` | ✅ | ✅ | ✅ |

---

## 8. Relationships

### 8.1 Current Relationships (MVP)

**None** - Single table architecture for MVP simplicity.

The `videos` table is self-contained with no foreign key relationships.

### 8.2 Future Relationships (Post-MVP)

Potential expansions when scaling beyond MVP:

#### User Profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Relationship:** `user_profiles.id → auth.users(id)` (1:1)

#### Video Views (Analytics)
```sql
CREATE TABLE video_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  watch_duration INTEGER -- seconds watched
);
```
**Relationships:** 
- `video_views.video_id → videos(id)` (N:1)
- `video_views.user_id → auth.users(id)` (N:1)

#### Playlists
```sql
CREATE TABLE playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE playlist_videos (
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (playlist_id, video_id)
);
```
**Relationships:** 
- `playlists.created_by → auth.users(id)` (N:1)
- `playlist_videos` (M:N junction table)

---

## 9. Sample Data

Seed data for testing and development.

```sql
INSERT INTO videos (
  title, 
  description, 
  category, 
  level, 
  duration, 
  video_url, 
  thumbnail_url, 
  is_premium,
  status
) VALUES 
-- Free Content
(
  'Poranna Yoga Flow - 15 min',
  'Łagodna praktyka poranna na rozbudzenie ciała. Idealna dla początkujących. Skupiamy się na podstawowych pozycjach i świadomym oddechu.',
  'yoga',
  'beginner',
  900,
  'videos-free/morning-yoga-flow.mp4',
  'thumbnails/morning-yoga-flow.jpg',
  false,
  'published'
),
(
  'Kalistenika dla Początkujących - 10 min',
  'Wprowadzenie do kalisteniki. Podstawowe ćwiczenia z wagą własnego ciała. Dowiesz się jak prawidłowo wykonywać pompki, przysiady i deski.',
  'calisthenics',
  'beginner',
  600,
  'videos-free/calisthenics-intro.mp4',
  'thumbnails/calisthenics-intro.jpg',
  false,
  'published'
),

-- Premium Content
(
  'Zaawansowana Mobilność - 20 min',
  'Intensywna sesja mobilności dla zaawansowanych. Wymaga doświadczenia. Praca nad głęboką mobilnością stawów i elastycznością.',
  'mobility',
  'advanced',
  1200,
  'videos-premium/advanced-mobility.mp4',
  'thumbnails/advanced-mobility.jpg',
  true,
  'published'
),
(
  'Power Yoga Flow - 30 min',
  'Dynamiczna praktyka power yoga. Wzmacnianie całego ciała przez płynne sekwencje. Dla osób z doświadczeniem w jodze.',
  'yoga',
  'intermediate',
  1800,
  'videos-premium/power-yoga-flow.mp4',
  'thumbnails/power-yoga-flow.jpg',
  true,
  'published'
),

-- Draft Content (not visible to users)
(
  'Wieczorna Yoga - 15 min',
  'Relaksująca praktyka wieczorna. Nadal w fazie edycji.',
  'yoga',
  'beginner',
  900,
  'videos-free/evening-yoga.mp4',
  'thumbnails/evening-yoga.jpg',
  false,
  'draft'
);
```

---

## 10. Database Comments

Documentation embedded in the database schema.

```sql
-- Table Comments
COMMENT ON TABLE videos IS 
  'Tabela przechowująca metadane nagrań wideo z ćwiczeniami fizycznymi';

-- Column Comments
COMMENT ON COLUMN videos.duration IS 
  'Czas trwania nagrania w sekundach (maksymalnie 7200 = 2 godziny)';

COMMENT ON COLUMN videos.video_url IS 
  'Relatywna ścieżka do pliku wideo w Supabase Storage (np. videos-free/yoga-flow.mp4)';

COMMENT ON COLUMN videos.thumbnail_url IS 
  'Relatywna ścieżka do miniaturki w Supabase Storage (np. thumbnails/yoga-flow.jpg)';

COMMENT ON COLUMN videos.status IS 
  'Status publikacji: draft (roboczy), published (opublikowany), archived (zarchiwizowany)';

COMMENT ON COLUMN videos.is_premium IS 
  'Określa czy treść wymaga dostępu premium (true = płatne, false = darmowe)';
```

---

## 11. Performance Considerations

### 11.1 Query Optimization

**Expected Query Patterns:**

1. **Homepage Grid (Most Frequent)**
   ```sql
   -- Anonymous User
   SELECT * FROM videos 
   WHERE is_premium = false 
     AND status = 'published'
   ORDER BY created_at DESC;
   
   -- Premium User
   SELECT * FROM videos 
   WHERE status = 'published'
     AND (is_premium = false OR is_premium = true)
   ORDER BY created_at DESC;
   ```
   **Optimization:** Composite index `idx_videos_category_premium_status`

2. **Category Filtering**
   ```sql
   SELECT * FROM videos 
   WHERE category = 'yoga' 
     AND status = 'published'
     AND (is_premium = false OR <user_premium>);
   ```
   **Optimization:** Same composite index covers this query

3. **Video Detail Page**
   ```sql
   SELECT * FROM videos WHERE id = '<uuid>';
   ```
   **Optimization:** Primary key index (automatic)

4. **Admin Dashboard**
   ```sql
   SELECT * FROM videos 
   WHERE status = 'draft'
   ORDER BY created_at DESC;
   ```
   **Optimization:** Single index `idx_videos_status`

### 11.2 Expected Load

- **Users:** ~20 concurrent users
- **Videos:** ~50-100 videos (first year)
- **Requests:** ~1000-5000 requests/day
- **Storage:** ~5-10 GB video files

**Verdict:** Over-provisioned for MVP scale. Current schema will perform excellently.

### 11.3 Scaling Considerations

When to optimize further:
- **1000+ videos:** Consider partitioning by `created_at` (monthly/yearly)
- **10,000+ users:** Add caching layer (Redis) for video metadata
- **100+ videos/day:** Implement full-text search (PostgreSQL `tsvector`)

---

## 12. Security Checklist

- [x] RLS enabled on all tables
- [x] RLS policies for all CRUD operations
- [x] Storage bucket policies for all buckets
- [x] Default deny policy (RLS enforced)
- [x] Role-based access control (RBAC)
- [x] NULL role handling (COALESCE to 'free')
- [x] Admin-only mutations (INSERT/UPDATE/DELETE)
- [x] Premium content gating
- [x] Draft content hidden from users
- [x] No PII in database (handled by Supabase Auth)

---

## 13. Migration Strategy

### 13.1 Initial Setup (Development)

1. Create database schema (tables, indexes, triggers)
2. Enable RLS and create policies
3. Create storage buckets
4. Create storage policies
5. Insert seed data
6. Test with different user roles

### 13.2 Environment Promotion

**Development → Staging → Production**

- Use Supabase CLI migrations
- Version control all SQL files
- Test RLS policies in each environment
- Verify storage bucket configuration

### 13.3 Rollback Plan

- Keep migration history
- Test rollback scripts
- Backup before production deployment
- Document breaking changes

---

## 14. Monitoring & Maintenance

### 14.1 Key Metrics to Monitor

- **Storage Usage:** Track video/thumbnail storage (500MB free tier limit)
- **Transfer Bandwidth:** Monitor monthly transfer (2GB free tier limit)
- **Query Performance:** Slow query log (queries >100ms)
- **RLS Policy Violations:** Failed auth attempts
- **Video Upload Failures:** Storage write errors

### 14.2 Maintenance Tasks

- **Weekly:** Review storage usage
- **Monthly:** Analyze slow queries, optimize if needed
- **Quarterly:** Review and prune archived content
- **Yearly:** Database VACUUM and reindex

---

## 15. Implementation Checklist

### Phase 1: Core Schema
- [ ] Create `videos` table with all columns and constraints
- [ ] Create indexes (composite + single)
- [ ] Create `update_updated_at_column()` function
- [ ] Create trigger `update_videos_updated_at`
- [ ] Add table and column comments

### Phase 2: Security
- [ ] Enable RLS on `videos` table
- [ ] Create SELECT policies (public, premium, admin)
- [ ] Create INSERT policy (admin only)
- [ ] Create UPDATE policy (admin only)
- [ ] Create DELETE policy (admin only)

### Phase 3: Storage
- [ ] Create `videos-free` bucket (public)
- [ ] Create `videos-premium` bucket (private)
- [ ] Create `thumbnails` bucket (public)
- [ ] Create storage RLS policies for all buckets
- [ ] Test upload/download with different roles

### Phase 4: Testing
- [ ] Test anonymous user access (free videos only)
- [ ] Test free user access (free videos only)
- [ ] Test premium user access (all published videos)
- [ ] Test admin access (all videos, all statuses)
- [ ] Test role = null scenario
- [ ] Test storage access per role
- [ ] Load test with seed data

### Phase 5: Documentation
- [ ] Document admin upload workflow
- [ ] Document role assignment process
- [ ] Create troubleshooting guide
- [ ] Document backup/restore procedure

---

## 16. Appendix

### A. Complete Migration Script

See `./migrations/001_initial_schema.sql` for the complete executable migration.

### B. TypeScript Types

Recommended types for frontend integration:

```typescript
// Database types
export type VideoCategory = 'yoga' | 'mobility' | 'calisthenics';
export type VideoLevel = 'beginner' | 'intermediate' | 'advanced';
export type VideoStatus = 'draft' | 'published' | 'archived';
export type UserRole = 'free' | 'premium' | 'admin';

export interface Video {
  id: string; // UUID
  title: string;
  description: string | null;
  category: VideoCategory;
  level: VideoLevel;
  duration: number; // seconds
  video_url: string;
  thumbnail_url: string;
  is_premium: boolean;
  status: VideoStatus;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface UserMetadata {
  role: UserRole;
  display_name?: string;
}
```

### C. Common Queries Reference

```sql
-- Get all published free videos
SELECT * FROM videos 
WHERE is_premium = false AND status = 'published'
ORDER BY created_at DESC;

-- Get published yoga videos (respects RLS)
SELECT * FROM videos 
WHERE category = 'yoga' AND status = 'published'
ORDER BY created_at DESC;

-- Admin: Get all draft videos
SELECT * FROM videos 
WHERE status = 'draft'
ORDER BY created_at DESC;

-- Admin: Publish a video
UPDATE videos 
SET status = 'published' 
WHERE id = '<uuid>';

-- Admin: Archive a video
UPDATE videos 
SET status = 'archived' 
WHERE id = '<uuid>';
```

---

**End of Database Schema Plan**
