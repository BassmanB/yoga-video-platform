# REST API Plan

## Yoga Video Platform MVP

**Version:** 1.0  
**Date:** 2026-01-18  
**Status:** Ready for Implementation  
**Tech Stack:** Astro 5 + TypeScript 5 + Supabase

---

## 1. Overview

This document defines the REST API for the Yoga Video Platform MVP. The API is built on Astro API routes and leverages Supabase for authentication, database, and storage. All security is enforced through Supabase Row Level Security (RLS) policies, minimizing custom authorization logic.

### Key Design Principles

- **Security First:** Leverage Supabase RLS for all access control
- **RESTful:** Follow REST conventions for predictable API design
- **Minimal:** Only endpoints necessary for MVP functionality
- **Type-Safe:** Full TypeScript support with generated types
- **Performance:** Optimized queries with strategic indexing

---

## 2. Resources

| Resource | Database Table   | Description                                |
| -------- | ---------------- | ------------------------------------------ |
| Videos   | `videos`         | Video metadata and access control          |
| Auth     | Supabase Auth    | User authentication and session management |
| Storage  | Supabase Storage | Video files and thumbnails                 |

**Note:** User management is handled entirely by Supabase Auth with user metadata. No custom users table exists in MVP.

---

## 3. Base URL

**Development:** `http://localhost:4321/api`  
**Production:** `https://[domain]/api`

All endpoints are prefixed with `/api`.

---

## 4. Authentication

### 4.1 Authentication Method

**Provider:** Supabase Auth  
**Method:** Magic Link (passwordless email authentication)  
**Optional:** Google OAuth

### 4.2 Implementation

Authentication is handled client-side using `@supabase/supabase-js`:

```typescript
// Login
const { data, error } = await supabase.auth.signInWithOtp({
  email: "user@example.com",
  options: {
    emailRedirectTo: "https://[domain]",
  },
});

// Logout
await supabase.auth.signOut();

// Get session
const {
  data: { session },
} = await supabase.auth.getSession();
```

### 4.3 Authorization Headers

For authenticated requests, include the session token:

```
Authorization: Bearer <access_token>
```

The Supabase client automatically handles this when configured properly.

### 4.4 User Roles

Roles are stored in Supabase Auth user metadata:

```json
{
  "role": "free" | "premium" | "admin",
  "display_name": "John Doe"
}
```

| Role      | Permissions                                |
| --------- | ------------------------------------------ |
| `free`    | Read published free videos                 |
| `premium` | Read all published videos (free + premium) |
| `admin`   | Full CRUD on videos, read all statuses     |

**Default:** Users without a role are treated as `free` (via COALESCE in RLS policies).

---

## 5. API Endpoints

### 5.1 Videos

#### 5.1.1 List Videos

**Endpoint:** `GET /api/videos`

**Description:** Retrieve a list of videos with optional filtering. Results are automatically filtered by RLS policies based on user role.

**Authentication:** Optional (anonymous users see only free published videos)

**Query Parameters:**

| Parameter    | Type    | Required | Default      | Description                                                     |
| ------------ | ------- | -------- | ------------ | --------------------------------------------------------------- |
| `category`   | string  | No       | -            | Filter by category: `yoga`, `mobility`, `calisthenics`          |
| `level`      | string  | No       | -            | Filter by difficulty: `beginner`, `intermediate`, `advanced`    |
| `is_premium` | boolean | No       | -            | Filter by premium status: `true`, `false`                       |
| `status`     | string  | No       | `published`  | Filter by status (admin only): `draft`, `published`, `archived` |
| `limit`      | integer | No       | 50           | Number of results per page (max 100)                            |
| `offset`     | integer | No       | 0            | Pagination offset                                               |
| `sort`       | string  | No       | `created_at` | Sort field: `created_at`, `title`, `duration`                   |
| `order`      | string  | No       | `desc`       | Sort order: `asc`, `desc`                                       |

**Request Example:**

```http
GET /api/videos?category=yoga&level=beginner&limit=10&offset=0
Authorization: Bearer <access_token>
```

**Response Success (200 OK):**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Poranna Yoga Flow - 15 min",
      "description": "Łagodna praktyka poranna na rozbudzenie ciała. Idealna dla początkujących.",
      "category": "yoga",
      "level": "beginner",
      "duration": 900,
      "video_url": "videos-free/morning-yoga-flow.mp4",
      "thumbnail_url": "thumbnails/morning-yoga-flow.jpg",
      "is_premium": false,
      "status": "published",
      "created_at": "2026-01-15T10:30:00Z",
      "updated_at": "2026-01-15T10:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Kalistenika dla Początkujących - 10 min",
      "description": "Wprowadzenie do kalisteniki. Podstawowe ćwiczenia z wagą własnego ciała.",
      "category": "calisthenics",
      "level": "beginner",
      "duration": 600,
      "video_url": "videos-free/calisthenics-intro.mp4",
      "thumbnail_url": "thumbnails/calisthenics-intro.jpg",
      "is_premium": false,
      "status": "published",
      "created_at": "2026-01-14T14:20:00Z",
      "updated_at": "2026-01-14T14:20:00Z"
    }
  ],
  "meta": {
    "total": 42,
    "limit": 10,
    "offset": 0,
    "count": 2
  }
}
```

**Response Error (400 Bad Request):**

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid category. Must be one of: yoga, mobility, calisthenics",
    "details": {
      "parameter": "category",
      "value": "pilates",
      "allowed_values": ["yoga", "mobility", "calisthenics"]
    }
  }
}
```

**Response Error (401 Unauthorized):**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please log in to access this resource."
  }
}
```

**Business Logic:**

- RLS policies automatically filter results based on user role
- Anonymous users: only `is_premium = false AND status = 'published'`
- Free users: only `is_premium = false AND status = 'published'`
- Premium users: all videos where `status = 'published'`
- Admin users: all videos regardless of status
- Default sort: `created_at DESC` (newest first)

**Performance:**

- Uses composite index: `idx_videos_category_premium_status`
- Expected response time: < 100ms for typical queries

---

#### 5.1.2 Get Video by ID

**Endpoint:** `GET /api/videos/:id`

**Description:** Retrieve detailed information about a specific video. Access control enforced by RLS.

**Authentication:** Optional (required for premium content)

**URL Parameters:**

| Parameter | Type | Required | Description             |
| --------- | ---- | -------- | ----------------------- |
| `id`      | UUID | Yes      | Video unique identifier |

**Request Example:**

```http
GET /api/videos/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**Response Success (200 OK):**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Poranna Yoga Flow - 15 min",
    "description": "Łagodna praktyka poranna na rozbudzenie ciała. Idealna dla początkujących. Skupiamy się na podstawowych pozycjach i świadomym oddechu.",
    "category": "yoga",
    "level": "beginner",
    "duration": 900,
    "video_url": "videos-free/morning-yoga-flow.mp4",
    "thumbnail_url": "thumbnails/morning-yoga-flow.jpg",
    "is_premium": false,
    "status": "published",
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-15T10:30:00Z"
  }
}
```

**Response Error (403 Forbidden):**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "This content is only available for premium users. Please contact admin@example.com to upgrade your account.",
    "details": {
      "required_role": "premium",
      "current_role": "free",
      "video_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**Response Error (404 Not Found):**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Video not found or you don't have permission to access it.",
    "details": {
      "video_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**Business Logic:**

- RLS policies determine if user can access the video
- Premium content requires authenticated user with `premium` or `admin` role
- Draft/archived videos only visible to admins
- Returns 404 for both non-existent videos and unauthorized access (security best practice)

**Note:** Video and thumbnail URLs are relative paths. Frontend must construct full URLs using Supabase Storage:

```typescript
const videoUrl = supabase.storage
  .from("videos-free") // or 'videos-premium'
  .getPublicUrl(video.video_url).data.publicUrl;

const thumbnailUrl = supabase.storage.from("thumbnails").getPublicUrl(video.thumbnail_url).data.publicUrl;
```

---

#### 5.1.3 Create Video

**Endpoint:** `POST /api/videos`

**Description:** Create a new video record. Admin only.

**Authentication:** Required (admin role)

**Request Headers:**

```
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "title": "Wieczorna Yoga - 15 min",
  "description": "Relaksująca praktyka wieczorna na uspokojenie umysłu i ciała.",
  "category": "yoga",
  "level": "beginner",
  "duration": 900,
  "video_url": "videos-free/evening-yoga.mp4",
  "thumbnail_url": "thumbnails/evening-yoga.jpg",
  "is_premium": false,
  "status": "draft"
}
```

**Request Body Schema:**

| Field           | Type    | Required | Constraints                                              | Description                       |
| --------------- | ------- | -------- | -------------------------------------------------------- | --------------------------------- |
| `title`         | string  | Yes      | 1-255 chars                                              | Video title                       |
| `description`   | string  | No       | Max 5000 chars                                           | Full description                  |
| `category`      | string  | Yes      | Enum: `yoga`, `mobility`, `calisthenics`                 | Content category                  |
| `level`         | string  | Yes      | Enum: `beginner`, `intermediate`, `advanced`             | Difficulty level                  |
| `duration`      | integer | Yes      | 1-7200                                                   | Duration in seconds (max 2 hours) |
| `video_url`     | string  | Yes      | Valid path                                               | Relative path in Supabase Storage |
| `thumbnail_url` | string  | Yes      | Valid path                                               | Relative path in Supabase Storage |
| `is_premium`    | boolean | No       | Default: `false`                                         | Premium content flag              |
| `status`        | string  | No       | Enum: `draft`, `published`, `archived`. Default: `draft` | Publication status                |

**Response Success (201 Created):**

```json
{
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "title": "Wieczorna Yoga - 15 min",
    "description": "Relaksująca praktyka wieczorna na uspokojenie umysłu i ciała.",
    "category": "yoga",
    "level": "beginner",
    "duration": 900,
    "video_url": "videos-free/evening-yoga.mp4",
    "thumbnail_url": "thumbnails/evening-yoga.jpg",
    "is_premium": false,
    "status": "draft",
    "created_at": "2026-01-18T15:45:00Z",
    "updated_at": "2026-01-18T15:45:00Z"
  }
}
```

**Response Error (400 Bad Request):**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "errors": [
        {
          "field": "duration",
          "message": "Duration must be between 1 and 7200 seconds",
          "value": 8000
        },
        {
          "field": "category",
          "message": "Category must be one of: yoga, mobility, calisthenics",
          "value": "pilates"
        }
      ]
    }
  }
}
```

**Response Error (403 Forbidden):**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only administrators can create videos",
    "details": {
      "required_role": "admin",
      "current_role": "premium"
    }
  }
}
```

**Response Error (409 Conflict):**

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "A video with this title already exists",
    "details": {
      "field": "title",
      "value": "Wieczorna Yoga - 15 min"
    }
  }
}
```

**Business Logic:**

- RLS policy enforces admin-only access
- All validations from database schema are enforced
- `created_at` and `updated_at` auto-generated
- `id` auto-generated as UUID
- Video and thumbnail files must be uploaded to Supabase Storage before creating record

**Validation Rules:**

1. `title`: Required, non-empty string
2. `category`: Must be exactly one of: `yoga`, `mobility`, `calisthenics`
3. `level`: Must be exactly one of: `beginner`, `intermediate`, `advanced`
4. `duration`: Integer between 1 and 7200 (inclusive)
5. `video_url`: Required, valid relative path format
6. `thumbnail_url`: Required, valid relative path format
7. `status`: Must be one of: `draft`, `published`, `archived`

---

#### 5.1.4 Update Video

**Endpoint:** `PUT /api/videos/:id`

**Description:** Update all fields of an existing video. Admin only.

**Authentication:** Required (admin role)

**URL Parameters:**

| Parameter | Type | Required | Description             |
| --------- | ---- | -------- | ----------------------- |
| `id`      | UUID | Yes      | Video unique identifier |

**Request Headers:**

```
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "title": "Poranna Yoga Flow - 15 min (Zaktualizowana)",
  "description": "Łagodna praktyka poranna na rozbudzenie ciała. Idealna dla początkujących. Zaktualizowany opis.",
  "category": "yoga",
  "level": "beginner",
  "duration": 900,
  "video_url": "videos-free/morning-yoga-flow-v2.mp4",
  "thumbnail_url": "thumbnails/morning-yoga-flow-v2.jpg",
  "is_premium": false,
  "status": "published"
}
```

**Request Body Schema:** Same as Create Video (all fields required for PUT)

**Response Success (200 OK):**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Poranna Yoga Flow - 15 min (Zaktualizowana)",
    "description": "Łagodna praktyka poranna na rozbudzenie ciała. Idealna dla początkujących. Zaktualizowany opis.",
    "category": "yoga",
    "level": "beginner",
    "duration": 900,
    "video_url": "videos-free/morning-yoga-flow-v2.mp4",
    "thumbnail_url": "thumbnails/morning-yoga-flow-v2.jpg",
    "is_premium": false,
    "status": "published",
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-18T16:20:00Z"
  }
}
```

**Response Errors:** Same as Create Video (400, 403, 404)

**Business Logic:**

- RLS policy enforces admin-only access
- `updated_at` automatically updated via database trigger
- All validations applied
- Returns 404 if video doesn't exist

---

#### 5.1.5 Partially Update Video

**Endpoint:** `PATCH /api/videos/:id`

**Description:** Update specific fields of an existing video. Admin only.

**Authentication:** Required (admin role)

**URL Parameters:**

| Parameter | Type | Required | Description             |
| --------- | ---- | -------- | ----------------------- |
| `id`      | UUID | Yes      | Video unique identifier |

**Request Headers:**

```
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body (partial):**

```json
{
  "status": "published",
  "description": "Updated description only"
}
```

**Request Body Schema:** Any subset of Create Video fields (all optional)

**Response Success (200 OK):**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Poranna Yoga Flow - 15 min",
    "description": "Updated description only",
    "category": "yoga",
    "level": "beginner",
    "duration": 900,
    "video_url": "videos-free/morning-yoga-flow.mp4",
    "thumbnail_url": "thumbnails/morning-yoga-flow.jpg",
    "is_premium": false,
    "status": "published",
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-01-18T16:25:00Z"
  }
}
```

**Response Errors:** Same as Create Video (400, 403, 404)

**Business Logic:**

- Only provided fields are updated
- Validations applied to provided fields only
- Common use case: Publishing a draft video (`status: "published"`)
- `updated_at` automatically updated

**Common Use Cases:**

1. Publish draft: `PATCH /api/videos/:id { "status": "published" }`
2. Archive video: `PATCH /api/videos/:id { "status": "archived" }`
3. Toggle premium: `PATCH /api/videos/:id { "is_premium": true }`
4. Update metadata: `PATCH /api/videos/:id { "title": "...", "description": "..." }`

---

#### 5.1.6 Delete Video

**Endpoint:** `DELETE /api/videos/:id`

**Description:** Permanently delete a video record. Admin only. **Warning:** This does not delete associated files from storage.

**Authentication:** Required (admin role)

**URL Parameters:**

| Parameter | Type | Required | Description             |
| --------- | ---- | -------- | ----------------------- |
| `id`      | UUID | Yes      | Video unique identifier |

**Request Example:**

```http
DELETE /api/videos/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <access_token>
```

**Response Success (204 No Content):**

No response body.

**Response Error (403 Forbidden):**

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Only administrators can delete videos",
    "details": {
      "required_role": "admin",
      "current_role": "premium"
    }
  }
}
```

**Response Error (404 Not Found):**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Video not found",
    "details": {
      "video_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**Business Logic:**

- RLS policy enforces admin-only access
- Deletes database record only
- Files in Supabase Storage must be deleted separately
- **Recommendation:** Use `PATCH` to set `status: "archived"` instead of permanent deletion

**Important Notes:**

- Deletion is permanent and cannot be undone
- Associated storage files (video, thumbnail) are NOT automatically deleted
- Consider archiving (`status: "archived"`) instead of deletion for data retention

---

### 5.2 Storage URLs

#### 5.2.1 Get Video Stream URL

**Endpoint:** Direct Supabase Storage (no custom endpoint needed)

**Description:** Video files are served directly from Supabase Storage with built-in RLS.

**Implementation:**

```typescript
// Free video (public bucket)
const videoUrl = supabase.storage.from("videos-free").getPublicUrl("morning-yoga-flow.mp4").data.publicUrl;

// Premium video (private bucket, requires auth)
const { data, error } = await supabase.storage.from("videos-premium").createSignedUrl("advanced-mobility.mp4", 3600); // 1 hour expiry

if (data) {
  const videoUrl = data.signedUrl;
}
```

**Access Control:**

- `videos-free` bucket: Public read access
- `videos-premium` bucket: Requires authenticated user with premium/admin role
- Storage RLS policies enforce access control automatically

---

#### 5.2.2 Get Thumbnail URL

**Endpoint:** Direct Supabase Storage (no custom endpoint needed)

**Description:** Thumbnails are served from public bucket.

**Implementation:**

```typescript
const thumbnailUrl = supabase.storage.from("thumbnails").getPublicUrl("morning-yoga-flow.jpg").data.publicUrl;
```

**Access Control:**

- `thumbnails` bucket: Public read access for all thumbnails
- Even premium video thumbnails are public (allows preview)

---

### 5.3 Health Check

#### 5.3.1 API Health

**Endpoint:** `GET /api/health`

**Description:** Check API and database connectivity.

**Authentication:** None

**Request Example:**

```http
GET /api/health
```

**Response Success (200 OK):**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-18T16:30:00Z",
  "services": {
    "api": "up",
    "database": "up",
    "storage": "up"
  },
  "version": "1.0.0"
}
```

**Response Error (503 Service Unavailable):**

```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-18T16:30:00Z",
  "services": {
    "api": "up",
    "database": "down",
    "storage": "up"
  },
  "version": "1.0.0"
}
```

---

## 6. Error Handling

### 6.1 Standard Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "additional": "context-specific information"
    }
  }
}
```

### 6.2 HTTP Status Codes

| Code | Status                | Description              | Use Case                              |
| ---- | --------------------- | ------------------------ | ------------------------------------- |
| 200  | OK                    | Success                  | GET, PUT, PATCH successful            |
| 201  | Created               | Resource created         | POST successful                       |
| 204  | No Content            | Success with no body     | DELETE successful                     |
| 400  | Bad Request           | Invalid input            | Validation errors, malformed JSON     |
| 401  | Unauthorized          | Not authenticated        | Missing or invalid auth token         |
| 403  | Forbidden             | Insufficient permissions | Wrong role for operation              |
| 404  | Not Found             | Resource doesn't exist   | Invalid ID or unauthorized access     |
| 409  | Conflict              | Resource conflict        | Duplicate title, constraint violation |
| 422  | Unprocessable Entity  | Semantic errors          | Business logic validation failed      |
| 429  | Too Many Requests     | Rate limit exceeded      | Too many requests from client         |
| 500  | Internal Server Error | Server error             | Unexpected server-side error          |
| 503  | Service Unavailable   | Service down             | Database or storage unavailable       |

### 6.3 Error Codes

| Code                  | HTTP Status | Description                     |
| --------------------- | ----------- | ------------------------------- |
| `VALIDATION_ERROR`    | 400         | Request validation failed       |
| `INVALID_PARAMETER`   | 400         | Invalid query parameter         |
| `MALFORMED_REQUEST`   | 400         | Invalid JSON or request format  |
| `UNAUTHORIZED`        | 401         | Authentication required         |
| `INVALID_TOKEN`       | 401         | Auth token invalid or expired   |
| `FORBIDDEN`           | 403         | Insufficient permissions        |
| `NOT_FOUND`           | 404         | Resource not found              |
| `CONFLICT`            | 409         | Resource conflict               |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests               |
| `INTERNAL_ERROR`      | 500         | Internal server error           |
| `DATABASE_ERROR`      | 500         | Database operation failed       |
| `STORAGE_ERROR`       | 500         | Storage operation failed        |
| `SERVICE_UNAVAILABLE` | 503         | Service temporarily unavailable |

### 6.4 Validation Error Details

Validation errors include field-specific information:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "errors": [
        {
          "field": "duration",
          "message": "Duration must be between 1 and 7200 seconds",
          "value": 8000,
          "constraint": "range"
        },
        {
          "field": "category",
          "message": "Category must be one of: yoga, mobility, calisthenics",
          "value": "pilates",
          "constraint": "enum"
        }
      ]
    }
  }
}
```

---

## 7. Validation Rules

### 7.1 Video Resource Validation

| Field           | Validation Rules                                                            |
| --------------- | --------------------------------------------------------------------------- |
| `title`         | Required, non-empty string, max 255 characters                              |
| `description`   | Optional, string, max 5000 characters                                       |
| `category`      | Required, enum: `yoga`, `mobility`, `calisthenics`                          |
| `level`         | Required, enum: `beginner`, `intermediate`, `advanced`                      |
| `duration`      | Required, integer, range: 1-7200 (1 second to 2 hours)                      |
| `video_url`     | Required, string, valid relative path format (e.g., `videos-free/file.mp4`) |
| `thumbnail_url` | Required, string, valid relative path format (e.g., `thumbnails/file.jpg`)  |
| `is_premium`    | Optional, boolean, default: `false`                                         |
| `status`        | Optional, enum: `draft`, `published`, `archived`, default: `draft`          |

### 7.2 Query Parameter Validation

| Parameter    | Validation Rules                                                         |
| ------------ | ------------------------------------------------------------------------ |
| `category`   | Optional, enum: `yoga`, `mobility`, `calisthenics`                       |
| `level`      | Optional, enum: `beginner`, `intermediate`, `advanced`                   |
| `is_premium` | Optional, boolean: `true`, `false`                                       |
| `status`     | Optional, enum: `draft`, `published`, `archived` (admin only)            |
| `limit`      | Optional, integer, range: 1-100, default: 50                             |
| `offset`     | Optional, integer, min: 0, default: 0                                    |
| `sort`       | Optional, enum: `created_at`, `title`, `duration`, default: `created_at` |
| `order`      | Optional, enum: `asc`, `desc`, default: `desc`                           |

### 7.3 Path Format Validation

Video and thumbnail URLs must follow these patterns:

**Valid formats:**

- `videos-free/filename.mp4`
- `videos-premium/filename.mp4`
- `thumbnails/filename.jpg`
- `thumbnails/filename.png`
- `thumbnails/filename.webp`

**Invalid formats:**

- Absolute URLs: `https://example.com/video.mp4`
- URLs with query params: `videos-free/file.mp4?token=abc`
- Paths with `..`: `videos-free/../other/file.mp4`
- Paths starting with `/`: `/videos-free/file.mp4`

---

## 8. Business Logic Implementation

### 8.1 Access Control Logic

**Implementation:** Supabase Row Level Security (RLS) policies

**Anonymous Users:**

```sql
-- Can only see free published videos
WHERE is_premium = false AND status = 'published'
```

**Free Users (authenticated, role = 'free'):**

```sql
-- Same as anonymous
WHERE is_premium = false AND status = 'published'
```

**Premium Users (authenticated, role = 'premium'):**

```sql
-- Can see all published videos
WHERE status = 'published'
```

**Admin Users (authenticated, role = 'admin'):**

```sql
-- Can see all videos regardless of status
-- No WHERE clause restriction
```

**Mutations (INSERT/UPDATE/DELETE):**

```sql
-- Only admin role
WHERE (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
```

### 8.2 Video Visibility Rules

| User Role | Free Videos  | Premium Videos | Draft Videos | Archived Videos |
| --------- | ------------ | -------------- | ------------ | --------------- |
| Anonymous | ✅ Published | ❌             | ❌           | ❌              |
| Free      | ✅ Published | ❌             | ❌           | ❌              |
| Premium   | ✅ Published | ✅ Published   | ❌           | ❌              |
| Admin     | ✅ All       | ✅ All         | ✅ All       | ✅ All          |

### 8.3 Publishing Workflow

1. **Create Draft:** Admin creates video with `status: "draft"`
2. **Upload Files:** Admin uploads video and thumbnail to Supabase Storage
3. **Test Access:** Admin verifies video plays correctly
4. **Publish:** Admin updates `status: "published"` via PATCH endpoint
5. **Visible:** Video now appears to appropriate users based on `is_premium` flag

### 8.4 Premium Content Gating

**Frontend Implementation:**

```typescript
// Check if user can access video
const canAccess = (video: Video, userRole: UserRole | null): boolean => {
  // Published check
  if (video.status !== 'published' && userRole !== 'admin') {
    return false
  }

  // Premium check
  if (video.is_premium) {
    return userRole === 'premium' || userRole === 'admin'
  }

  // Free content accessible to all
  return true
}

// Display appropriate UI
if (!canAccess(video, userRole)) {
  // Show blur overlay with upgrade message
  return <PremiumGate video={video} />
}

// Show video player
return <VideoPlayer video={video} />
```

**Backend Implementation:**

- RLS policies automatically prevent unauthorized queries
- API returns 404 for unauthorized access (security best practice - don't reveal existence)
- Storage RLS prevents direct file access

---

## 9. Performance Considerations

### 9.1 Database Query Optimization

**Indexes Used:**

- Primary key: `videos(id)` - automatic
- Composite: `videos(category, is_premium, status)` - for filtered lists
- Single: `videos(status)` - for admin filtering

**Query Performance Targets:**

- List videos: < 100ms
- Get video by ID: < 50ms
- Create/Update/Delete: < 200ms

### 9.2 Pagination Strategy

**Default:** 50 items per page (configurable via `limit` parameter)

**Implementation:**

```sql
SELECT * FROM videos
WHERE <filters>
ORDER BY created_at DESC
LIMIT 50 OFFSET 0
```

**Recommendation:** For MVP with ~50-100 videos, pagination is optional but implemented for future-proofing.

### 9.3 Caching Strategy

**Not implemented in MVP** but recommended for future:

- Cache video list responses (5-10 minutes)
- Cache individual video metadata (1 hour)
- Invalidate cache on video updates
- Use Supabase Realtime for cache invalidation

### 9.4 Rate Limiting

**Recommended Limits:**

- Anonymous: 100 requests/hour
- Authenticated: 1000 requests/hour
- Admin: 5000 requests/hour

**Implementation:** Use Astro middleware or Supabase Edge Functions rate limiting.

---

## 10. Security Considerations

### 10.1 Authentication Security

- **Token Storage:** Supabase handles secure token storage
- **Token Expiry:** Access tokens expire after 1 hour (configurable)
- **Refresh Tokens:** Automatically handled by Supabase client
- **HTTPS Only:** All API requests must use HTTPS in production

### 10.2 Authorization Security

- **RLS Enforcement:** All data access controlled by Supabase RLS
- **Role Validation:** User roles stored in Supabase Auth metadata
- **Default Deny:** Users without roles default to 'free' (most restrictive)
- **Admin Operations:** All mutations require explicit admin role check

### 10.3 Input Validation

- **Server-Side Validation:** All inputs validated on server (never trust client)
- **Type Safety:** TypeScript types enforce correct data structures
- **SQL Injection:** Prevented by Supabase parameterized queries
- **XSS Prevention:** Sanitize all user-generated content (descriptions)

### 10.4 Storage Security

- **Bucket Policies:** RLS policies on storage.objects table
- **Signed URLs:** Premium videos use time-limited signed URLs
- **Path Validation:** Prevent directory traversal attacks
- **File Type Validation:** Validate video/image MIME types on upload

### 10.5 CORS Configuration

**Allowed Origins:**

- Development: `http://localhost:4321`
- Production: `https://[your-domain]`

**Allowed Methods:** `GET, POST, PUT, PATCH, DELETE, OPTIONS`

**Allowed Headers:** `Content-Type, Authorization`

---

## 11. API Versioning

### 11.1 Current Version

**Version:** 1.0 (unversioned)

**Base Path:** `/api` (no version prefix for MVP)

### 11.2 Future Versioning Strategy

When breaking changes are needed:

- Introduce versioned paths: `/api/v2/videos`
- Maintain backward compatibility for v1
- Deprecation period: 6 months minimum
- Clear migration documentation

---

## 12. Testing Strategy

### 12.1 Unit Tests

Test individual endpoint handlers:

- Input validation
- Error handling
- Response formatting

### 12.2 Integration Tests

Test API with real Supabase instance:

- Authentication flows
- RLS policy enforcement
- CRUD operations
- Access control scenarios

### 12.3 Test Scenarios

**Authentication:**

- ✅ Anonymous user access
- ✅ Authenticated free user
- ✅ Authenticated premium user
- ✅ Admin user operations
- ❌ Invalid token
- ❌ Expired token

**Video Access:**

- ✅ Free user views free video
- ❌ Free user views premium video
- ✅ Premium user views premium video
- ❌ User views draft video
- ✅ Admin views draft video

**CRUD Operations:**

- ✅ Admin creates video
- ❌ Non-admin creates video
- ✅ Admin updates video
- ✅ Admin deletes video
- ❌ Non-admin deletes video

**Validation:**

- ❌ Invalid category
- ❌ Duration out of range
- ❌ Missing required fields
- ❌ Invalid UUID format

---

## 13. Monitoring & Logging

### 13.1 Logging Strategy

**Log Levels:**

- `ERROR`: Failed requests, exceptions
- `WARN`: Authorization failures, validation errors
- `INFO`: Successful requests, user actions
- `DEBUG`: Detailed request/response data (dev only)

**Log Format:**

```json
{
  "timestamp": "2026-01-18T16:30:00Z",
  "level": "INFO",
  "method": "GET",
  "path": "/api/videos",
  "status": 200,
  "duration_ms": 45,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_role": "premium",
  "ip": "192.168.1.1"
}
```

### 13.2 Metrics to Track

- Request count by endpoint
- Response time (p50, p95, p99)
- Error rate by status code
- Authentication success/failure rate
- Premium content access attempts
- Storage bandwidth usage

### 13.3 Alerts

- Error rate > 5%
- Response time p95 > 500ms
- Storage quota > 80%
- Bandwidth quota > 80%
- Failed auth attempts > 100/hour (potential attack)

---

## 14. API Client Examples

### 14.1 TypeScript/JavaScript (Frontend)

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabase = createClient<Database>(process.env.PUBLIC_SUPABASE_URL!, process.env.PUBLIC_SUPABASE_ANON_KEY!);

// List videos
async function getVideos(category?: string) {
  let query = supabase.from("videos").select("*").eq("status", "published").order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// Get video by ID
async function getVideo(id: string) {
  const { data, error } = await supabase.from("videos").select("*").eq("id", id).single();

  if (error) throw error;
  return data;
}

// Create video (admin only)
async function createVideo(video: Omit<Video, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("videos").insert(video).select().single();

  if (error) throw error;
  return data;
}

// Update video (admin only)
async function updateVideo(id: string, updates: Partial<Video>) {
  const { data, error } = await supabase.from("videos").update(updates).eq("id", id).select().single();

  if (error) throw error;
  return data;
}

// Delete video (admin only)
async function deleteVideo(id: string) {
  const { error } = await supabase.from("videos").delete().eq("id", id);

  if (error) throw error;
}

// Get video stream URL
function getVideoUrl(video: Video) {
  const bucket = video.is_premium ? "videos-premium" : "videos-free";

  if (video.is_premium) {
    // Premium videos use signed URLs
    return supabase.storage.from(bucket).createSignedUrl(video.video_url, 3600);
  } else {
    // Free videos use public URLs
    return supabase.storage.from(bucket).getPublicUrl(video.video_url);
  }
}

// Get thumbnail URL
function getThumbnailUrl(video: Video) {
  return supabase.storage.from("thumbnails").getPublicUrl(video.thumbnail_url).data.publicUrl;
}
```

### 14.2 cURL Examples

```bash
# List all videos (anonymous)
curl https://[domain]/api/videos

# List yoga videos
curl https://[domain]/api/videos?category=yoga

# Get specific video
curl https://[domain]/api/videos/550e8400-e29b-41d4-a716-446655440000

# Create video (admin)
curl -X POST https://[domain]/api/videos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "title": "New Yoga Session",
    "category": "yoga",
    "level": "beginner",
    "duration": 600,
    "video_url": "videos-free/new-session.mp4",
    "thumbnail_url": "thumbnails/new-session.jpg",
    "is_premium": false,
    "status": "draft"
  }'

# Update video status to published (admin)
curl -X PATCH https://[domain]/api/videos/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"status": "published"}'

# Delete video (admin)
curl -X DELETE https://[domain]/api/videos/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <admin_token>"
```

---

## 15. Implementation Checklist

### Phase 1: Core Endpoints

- [ ] Setup Astro API routes structure
- [ ] Configure Supabase client with environment variables
- [ ] Implement GET /api/videos (list with filtering)
- [ ] Implement GET /api/videos/:id (single video)
- [ ] Add query parameter validation
- [ ] Add error handling middleware
- [ ] Test with different user roles

### Phase 2: Admin Endpoints

- [ ] Implement POST /api/videos (create)
- [ ] Implement PUT /api/videos/:id (full update)
- [ ] Implement PATCH /api/videos/:id (partial update)
- [ ] Implement DELETE /api/videos/:id
- [ ] Add request body validation
- [ ] Test admin-only access control

### Phase 3: Storage Integration

- [ ] Configure Supabase Storage buckets
- [ ] Implement storage RLS policies
- [ ] Add helper functions for URL generation
- [ ] Test signed URLs for premium content
- [ ] Test public URLs for free content

### Phase 4: Polish

- [ ] Implement GET /api/health endpoint
- [ ] Add comprehensive error messages
- [ ] Add request/response logging
- [ ] Generate TypeScript types from database
- [ ] Write API documentation
- [ ] Add integration tests

### Phase 5: Optimization

- [ ] Add pagination to list endpoint
- [ ] Implement rate limiting
- [ ] Add response caching headers
- [ ] Optimize database queries
- [ ] Performance testing

---

## 16. Future Enhancements (Post-MVP)

### 16.1 Analytics Endpoints

```
GET /api/videos/:id/analytics
GET /api/analytics/overview
```

Track video views, watch time, popular content.

### 16.2 Search Endpoint

```
GET /api/videos/search?q=yoga+flow
```

Full-text search across title and description.

### 16.3 Playlist Endpoints

```
GET /api/playlists
POST /api/playlists
GET /api/playlists/:id
PUT /api/playlists/:id
DELETE /api/playlists/:id
```

User-created playlists and collections.

### 16.4 User Profile Endpoints

```
GET /api/users/me
PATCH /api/users/me
GET /api/users/me/favorites
POST /api/users/me/favorites/:videoId
```

User profiles and favorite videos.

### 16.5 Batch Operations

```
POST /api/videos/batch
PATCH /api/videos/batch
DELETE /api/videos/batch
```

Bulk operations for admin efficiency.

---

## 17. Appendix

### 17.1 TypeScript Types

```typescript
// Database types (auto-generated from Supabase)
export type VideoCategory = "yoga" | "mobility" | "calisthenics";
export type VideoLevel = "beginner" | "intermediate" | "advanced";
export type VideoStatus = "draft" | "published" | "archived";
export type UserRole = "free" | "premium" | "admin";

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

export interface VideoListResponse {
  data: Video[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    count: number;
  };
}

export interface VideoResponse {
  data: Video;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface CreateVideoRequest {
  title: string;
  description?: string;
  category: VideoCategory;
  level: VideoLevel;
  duration: number;
  video_url: string;
  thumbnail_url: string;
  is_premium?: boolean;
  status?: VideoStatus;
}

export interface UpdateVideoRequest extends CreateVideoRequest {}

export interface PartialUpdateVideoRequest extends Partial<CreateVideoRequest> {}
```

### 17.2 Environment Variables

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Server-side only

# API Configuration
API_RATE_LIMIT_ANONYMOUS=100 # requests per hour
API_RATE_LIMIT_AUTHENTICATED=1000
API_RATE_LIMIT_ADMIN=5000

# Feature Flags
ENABLE_PAGINATION=true
ENABLE_RATE_LIMITING=true
ENABLE_LOGGING=true
```

### 17.3 Useful Resources

- **Astro API Routes:** https://docs.astro.build/en/core-concepts/endpoints/
- **Supabase JavaScript Client:** https://supabase.com/docs/reference/javascript
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security
- **Supabase Storage:** https://supabase.com/docs/guides/storage
- **REST API Best Practices:** https://restfulapi.net/

---

**End of REST API Plan v1.0**
