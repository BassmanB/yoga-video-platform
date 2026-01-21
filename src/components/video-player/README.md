# Video Player Components - Documentation

## Overview

Complete video player implementation with premium content support, access control, and comprehensive error handling.

## Architecture

```
VideoPlayerContainer (Orchestrator)
├── useVideoPlayer (Custom Hook)
│   ├── fetchVideoById (API)
│   ├── canAccessVideo (Access Control)
│   └── generateVideoUrl (Storage)
└── Conditional Rendering:
    ├── VideoPlayerSkeleton (Loading)
    ├── VideoPlayerError (Error)
    ├── PremiumGate (No Access)
    └── VideoPlayer (Success)
        └── Plyr (Library)
```

## Components

### VideoPlayerContainer
Main orchestrator that manages all states and renders appropriate components.

**Props:**
- `videoId: string` - UUID of video
- `userRole: UserRole | null` - User's role (free/premium/admin)
- `supabase: SupabaseClient` - Supabase client instance

**States:**
- Loading → `VideoPlayerSkeleton`
- Error → `VideoPlayerError`
- No Access → `PremiumGate`
- Success → `VideoPlayer` + `VideoDetails`

### VideoPlayer
Plyr video player wrapper with Polish translations.

**Features:**
- Speed control (0.5x - 2x)
- Fullscreen support
- Volume control
- Progress seeking
- Auto-regenerates expired signed URLs
- 10s loading timeout

### VideoDetails
Displays video metadata and description.

**Composition:**
- `VideoHeader` - Title + badges
- `VideoDescription` - Expandable description

## Error Handling

### Error Types

1. **NOT_FOUND** (404)
   - Video doesn't exist
   - User doesn't have permission (RLS)
   - **UI:** Error message + Home button

2. **NETWORK_ERROR**
   - API connection failed
   - **UI:** Error message + Retry button

3. **TIMEOUT**
   - Request took >10s
   - **UI:** Error message + Retry button

4. **PLAYBACK_ERROR**
   - Video file corrupted or unsupported
   - **UI:** Error message + Retry button

5. **INVALID_URL**
   - Malformed video ID in URL
   - **UI:** Error message + Home button

### Edge Cases Handled

#### 1. Invalid UUID in URL
**Scenario:** User visits `/video/invalid-id`

**Handling:**
- `isValidUUID()` validates format
- Returns `INVALID_URL` error
- Shows error with "Powrót do strony głównej" button

#### 2. Premium Content - Free User
**Scenario:** Free user tries to access premium video

**Handling:**
- `canAccessVideo()` checks permissions
- `hasAccess = false`
- Renders `PremiumGate` overlay with CTA

#### 3. Premium Content - Unauthenticated
**Scenario:** Not logged in user tries to access premium video

**Handling:**
- Same as free user
- `userRole = null` → no access
- `PremiumGate` displayed

#### 4. Signed URL Expired
**Scenario:** Premium video playing for >1 hour (signed URL expires)

**Handling:**
- Player detects playback error
- Calls `onUrlExpired()` callback
- Hook regenerates signed URL
- Playback continues with new URL
- Toast: "Odświeżono połączenie"

#### 5. Video Status Not Published
**Scenario:** User tries to access draft/archived video

**Handling:**
- `canAccessVideo()` checks status
- Returns `NOT_PUBLISHED` or `ARCHIVED`
- Error message displayed
- **Exception:** Admin can access all statuses

#### 6. Network Timeout
**Scenario:** API takes >10s to respond

**Handling:**
- AbortController cancels request
- `TIMEOUT` error thrown
- Retry button allows new attempt

#### 7. No Session
**Scenario:** Logged out user accesses free content

**Handling:**
- `userRole = null`
- Free content still accessible
- Premium content shows `PremiumGate`

#### 8. Browser Back Button
**Scenario:** User clicks back during loading

**Handling:**
- React cleanup in `useEffect`
- Plyr instance destroyed
- Pending requests aborted

#### 9. Video File Missing in Storage
**Scenario:** Database has video but file doesn't exist

**Handling:**
- Plyr triggers error event
- `PLAYBACK_ERROR` displayed
- Retry doesn't help (file truly missing)
- User can report issue

#### 10. Rapid Navigation
**Scenario:** User rapidly switches between videos

**Handling:**
- Each navigation creates new component instance
- Previous Plyr instances cleaned up
- AbortController cancels pending fetches
- No memory leaks

## Access Control Matrix

| User Role | Free Content | Premium Content |
|-----------|--------------|-----------------|
| null (not logged in) | ✅ Access | ❌ PremiumGate |
| free | ✅ Access | ❌ PremiumGate |
| premium | ✅ Access | ✅ Access |
| admin | ✅ Access | ✅ Access + Draft/Archived |

## API Integration

### GET /api/videos/:id

**Success Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "title": "Video Title",
    "description": "...",
    "category": "yoga",
    "level": "beginner",
    "duration": 900,
    "video_url": "relative/path.mp4",
    "thumbnail_url": "relative/path.jpg",
    "is_premium": false,
    "status": "published",
    "created_at": "2026-01-21T...",
    "updated_at": "2026-01-21T..."
  }
}
```

**Error Responses:**
- 404: Video not found or no access
- 403: Forbidden (explicit permission denial)
- 500: Server error

## Storage Integration

### Free Content
- Bucket: `videos-free`
- URL Type: Public URL
- Lifetime: Permanent
- Example: `https://...supabase.co/storage/v1/object/public/videos-free/video.mp4`

### Premium Content
- Bucket: `videos-premium`
- URL Type: Signed URL
- Lifetime: 3600s (1 hour)
- Auto-regeneration: Yes
- Example: `https://...supabase.co/storage/v1/object/sign/videos-premium/video.mp4?token=...`

## Performance

### Optimizations
- Lazy loading of Plyr library
- Conditional rendering to avoid unnecessary renders
- `useCallback` for event handlers
- AbortController for fetch cancellation
- Cleanup on unmount

### Bundle Size
- Plyr: ~30KB (gzipped)
- Components: ~15KB (gzipped)
- Total: ~45KB additional

## Accessibility

### ARIA Attributes
- `role="dialog"` on PremiumGate
- `aria-modal="true"` on PremiumGate
- `aria-labelledby` and `aria-describedby` on modals
- `role="status"` on loading states
- `role="alert"` on errors
- `aria-live="polite"` for dynamic updates

### Keyboard Support
- ESC to dismiss PremiumGate
- Full keyboard navigation in Plyr
- Focus management on error states

### Screen Readers
- Descriptive labels on all interactive elements
- Status announcements for loading/errors
- Clear error messages in Polish

## Testing Checklist

- [ ] Free user can watch free content
- [ ] Premium user can watch premium content
- [ ] Free user sees PremiumGate for premium content
- [ ] Invalid UUID shows error
- [ ] Network timeout handled
- [ ] Signed URL regeneration works
- [ ] Back button navigation works
- [ ] Mobile responsive (320px+)
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] All error states render correctly
- [ ] Retry functionality works
- [ ] Admin can access draft videos
