# Video Player - Test Scenarios

## Manual Testing Guide

### Prerequisites

- Local development server running (`npm run dev`)
- Supabase configured with test data
- Test accounts: free user, premium user, admin

---

## Scenario 1: Valid Free Video - Unauthenticated

**Setup:**

1. Logout (no session)
2. Navigate to `/video/[free-video-id]`

**Expected:**

- ✅ Skeleton loader appears
- ✅ Video player loads
- ✅ Video details display below player
- ✅ Can play/pause/seek video
- ✅ Can change playback speed
- ✅ Can enter fullscreen

**Edge Cases:**

- Video loads within 5s
- Plyr controls are in Polish
- Responsive on mobile

---

## Scenario 2: Valid Premium Video - Free User

**Setup:**

1. Login as free user
2. Navigate to `/video/[premium-video-id]`

**Expected:**

- ✅ Skeleton loader appears
- ✅ PremiumGate overlay displays
- ✅ Shows blurred thumbnail
- ✅ Shows video title and truncated description
- ✅ "Skontaktuj się" button opens email client
- ✅ "Powrót do strony głównej" button works
- ✅ ESC key dismisses overlay (if onDismiss implemented)

**Edge Cases:**

- Email pre-fills with video title and ID
- Clicking outside doesn't dismiss (modal is blocking)

---

## Scenario 3: Valid Premium Video - Premium User

**Setup:**

1. Login as premium user
2. Navigate to `/video/[premium-video-id]`

**Expected:**

- ✅ Skeleton loader appears
- ✅ Video player loads
- ✅ Video plays with signed URL
- ✅ Can control playback normally
- ✅ Video details display

**Edge Cases:**

- Signed URL works
- No access denied message

---

## Scenario 4: Invalid Video ID

**Setup:**

1. Navigate to `/video/invalid-uuid-format`

**Expected:**

- ✅ Error state appears immediately
- ✅ Shows "Nieprawidłowy adres nagrania"
- ✅ Only "Strona główna" button visible (no retry)
- ✅ Clicking button redirects to `/`

**Edge Cases:**

- No API call made (validation happens before fetch)

---

## Scenario 5: Non-Existent Video ID

**Setup:**

1. Navigate to `/video/00000000-0000-4000-8000-000000000000` (valid UUID format but doesn't exist)

**Expected:**

- ✅ Skeleton loader appears
- ✅ Error state appears after fetch
- ✅ Shows "Nagranie nie znalezione"
- ✅ Both "Spróbuj ponownie" and "Strona główna" buttons visible
- ✅ Retry button re-fetches (still fails)

**Edge Cases:**

- API returns 404
- Error message is user-friendly

---

## Scenario 6: Network Timeout

**Setup:**

1. Throttle network to "Slow 3G"
2. Navigate to any video
3. Wait >10 seconds

**Expected:**

- ✅ Skeleton loader appears
- ✅ After 10s, error appears
- ✅ Shows "Nie udało się załadować nagrania"
- ✅ Retry button works
- ✅ Removing throttle + retry succeeds

**Edge Cases:**

- AbortController cancels request
- No hanging promises

---

## Scenario 7: Video Player Error (Corrupted File)

**Setup:**

1. Video exists in DB but file is corrupted/missing in storage
2. Navigate to that video

**Expected:**

- ✅ Video player attempts to load
- ✅ Plyr error event fires
- ✅ Error overlay appears in player
- ✅ Shows "Nie udało się odtworzyć wideo"
- ✅ Retry button re-initializes player

**Edge Cases:**

- Plyr error handling works
- onError callback called

---

## Scenario 8: Back Button Navigation

**Setup:**

1. Start at home page
2. Click video card → navigate to `/video/[id]`
3. While loading, click browser back button

**Expected:**

- ✅ Returns to home page
- ✅ No errors in console
- ✅ Fetch request aborted
- ✅ No memory leaks

**Edge Cases:**

- Cleanup functions run
- Plyr instance destroyed

---

## Scenario 9: Rapid Video Switching

**Setup:**

1. Click video A → navigate to `/video/[a]`
2. Immediately click back
3. Click video B → navigate to `/video/[b]`
4. Repeat several times

**Expected:**

- ✅ Each video loads correctly
- ✅ No stale data from previous videos
- ✅ No memory leaks
- ✅ Previous Plyr instances cleaned up

**Edge Cases:**

- AbortController cancels pending fetches
- State resets properly

---

## Scenario 10: Draft Video - Regular User

**Setup:**

1. Login as free/premium user
2. Navigate to `/video/[draft-video-id]`

**Expected:**

- ✅ Skeleton loader appears
- ✅ Error or PremiumGate appears
- ✅ Message: "Nagranie niedostępne" or access denied

**Edge Cases:**

- RLS blocks access
- Status check works

---

## Scenario 11: Draft Video - Admin User

**Setup:**

1. Login as admin
2. Navigate to `/video/[draft-video-id]`

**Expected:**

- ✅ Video loads and plays normally
- ✅ Admin can access all statuses

**Edge Cases:**

- `canAccessVideo` allows admin bypass

---

## Scenario 12: Long Description Expand/Collapse

**Setup:**

1. Navigate to video with long description (>300px)
2. Observe description section

**Expected:**

- ✅ Description initially truncated with gradient fade
- ✅ "Rozwiń" button visible
- ✅ Clicking expands full description
- ✅ Button changes to "Zwiń"
- ✅ Clicking collapses description

**Edge Cases:**

- Height measurement works
- Button doesn't show for short descriptions

---

## Scenario 13: Mobile Responsive

**Setup:**

1. Open DevTools
2. Set to iPhone 12 (390px width)
3. Navigate to any video

**Expected:**

- ✅ Video player scales to fit (16:9 ratio maintained)
- ✅ All text readable
- ✅ Buttons accessible
- ✅ No horizontal scroll
- ✅ Plyr controls fit in viewport

**Edge Cases:**

- Test portrait and landscape
- Test on actual device if possible

---

## Scenario 14: Keyboard Navigation

**Setup:**

1. Navigate to video page
2. Use only keyboard (Tab, Enter, Space, ESC)

**Expected:**

- ✅ Can tab through all interactive elements
- ✅ Focus indicators visible
- ✅ Enter/Space activate buttons
- ✅ Can control Plyr with keyboard
- ✅ ESC closes PremiumGate (if applicable)

**Edge Cases:**

- Focus trap in modals
- Logical tab order

---

## Scenario 15: Screen Reader (Accessibility)

**Setup:**

1. Enable screen reader (NVDA on Windows, VoiceOver on Mac)
2. Navigate to video page

**Expected:**

- ✅ All elements announced correctly
- ✅ Loading state announced
- ✅ Error states announced
- ✅ Video title and metadata read
- ✅ Button purposes clear

**Edge Cases:**

- ARIA labels work
- Live regions announce updates

---

## Scenario 16: Signed URL Expiration

**Setup:**

1. Login as premium user
2. Play premium video
3. Pause for >1 hour
4. Resume playback

**Expected:**

- ✅ Plyr detects URL expired
- ✅ Hook regenerates signed URL
- ✅ Toast: "Odświeżono połączenie"
- ✅ Playback continues seamlessly

**Edge Cases:**

- `onUrlExpired` callback works
- No user interruption

**Note:** Hard to test in real-time - may need to mock or reduce expiry time in testing.

---

## Browser Compatibility

Test in:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Performance Metrics

Check with DevTools:

- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 3s
- [ ] No layout shifts
- [ ] Video starts buffering within 2s
- [ ] No memory leaks (check with Heap Snapshots)

---

## Console Errors

During all tests:

- [ ] No React errors
- [ ] No TypeScript errors
- [ ] No unhandled promise rejections
- [ ] Only expected console.log/info/warn

---

## Security Checks

- [ ] Premium video URLs are signed (not public)
- [ ] Free users can't access premium URLs directly
- [ ] RLS policies enforced on API
- [ ] No sensitive data in client logs
