# Architektura UI dla Platformy Wideo - Yoga/Mobilność/Kalistenika

**Wersja:** 1.0  
**Data:** 19 stycznia 2026  
**Status:** Ready for Implementation  
**Tech Stack:** Astro 5 + React 19 + TypeScript 5 + Tailwind 4 + Shadcn/ui

---

## 1. Przegląd struktury UI

### 1.1 Filozofia Projektu

Platforma wykorzystuje **hybrydowe podejście Astro + React**, gdzie:

- **Astro** odpowiada za SSR, routing, layouts i statyczne komponenty (SEO, performance)
- **React** obsługuje interaktywne komponenty (video player, filtry, auth)
- **Supabase** zapewnia backend (auth, database, storage) z automatycznym RLS

### 1.2 Design System Foundation

**Motywy wizualne:**

- **Dark-first design** - ciemny motyw jako domyślny i jedyny w MVP
- **Minimalistyczny** - focus na treści (wideo), bez rozpraszaczy
- **Modern & Clean** - rounded corners, subtle shadows, smooth transitions

**Kolory:**

- Primary: Indigo (#6366f1) - akcje, linki, aktywne stany
- Secondary: Purple (#8b5cf6) - premium badges, akcenty
- Background: Slate-900 (#0f172a) - tło główne
- Surface: Slate-800 (#1e293b) - karty, modalne
- Text Primary: Slate-100 (#f1f5f9) - główny tekst
- Text Secondary: Slate-400 (#94a3b8) - metadata, opisy

**Typografia:**

- Font: Inter (Google Fonts)
- Skala: 3xl/2xl/lg (headings), base (body), xs/sm (meta)
- Wagi: 700 (bold headings), 600 (semibold), 400 (regular)

**Spacing:**

- Grid gap: 1.5rem (24px)
- Card padding: 1rem (16px)
- Section padding: 2-4rem (32-64px)
- Container max-width: 1280px (max-w-7xl)

**Animacje:**

- Transitions: 200-300ms ease-in-out
- Hover effects: scale, shadow, color
- Loading: pulse, spin, skeleton

### 1.3 Architektura Komponentów

**Podział odpowiedzialności:**

```
Astro Components (.astro)
├── Pages - routing, SEO, initial data fetch
├── Layouts - struktura strony, meta tags
└── Static UI - navbar, footer, containers

React Components (.tsx)
├── Interactive UI - buttons, dropdowns, modals
├── Data Display - grids, cards (z event handlers)
├── Forms - login, filters
└── Video Player - Plyr integration
```

**Providers Hierarchy:**

```
Layout.astro
└── Providers.tsx (client:load)
    ├── QueryClientProvider (React Query)
    │   └── AuthProvider (Context API)
    │       └── {children} (App content)
```

### 1.4 State Management Strategy

**Podział stanu:**

1. **Server State** (React Query):
   - Videos list (filtered)
   - Single video details
   - Cache: 5-10 min stale time
   - Auto-refetch on window focus

2. **Auth State** (Context API + Supabase):
   - User session
   - User role (free/premium/admin)
   - Real-time updates via `onAuthStateChange`

3. **UI State** (Local React State):
   - Filter selections
   - Modal open/closed
   - Mobile menu toggle
   - Loading indicators

4. **URL State** (Query Params):
   - Active category filter: `/?category=yoga`
   - Active level filter: `/?level=beginner`
   - Preserved on back/forward navigation

### 1.5 Responsive Strategy

**Mobile-first approach:**

- Design dla mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1024px+
- Large: 1536px+

**Breakpoints:**

```
sm:  640px  (tablet portrait)
md:  768px  (tablet landscape)
lg:  1024px (desktop)
xl:  1280px (large desktop)
2xl: 1536px (ultra-wide)
```

---

## 2. Lista Widoków

### 2.1 Home Page (`/`)

**Ścieżka:** `/` (index.astro)

**Główny cel:**

- Wyświetlenie wszystkich dostępnych nagrań wideo
- Umożliwienie filtrowania po kategorii i poziomie
- Zachęcenie do interakcji (kliknięcie wideo)
- Pokazanie wartości premium content (blur preview)

**Kluczowe informacje do wyświetlenia:**

- Lista nagrań (VideoCard grid)
- Tytuł, thumbnail, czas trwania każdego nagrania
- Kategoria i poziom trudności
- Status premium/free
- Stan zalogowania użytkownika (navbar)

**Kluczowe komponenty widoku:**

1. **Navbar** (Navbar.astro + AuthButton.tsx)
   - Logo (link do home)
   - Auth section:
     - Niezalogowany: "Zaloguj się" button
     - Zalogowany: UserAvatar + dropdown (email, role badge, logout, [admin: dashboard link])
   - Mobile: Burger icon → MobileMenu drawer

2. **FilterBar** (FilterBar.tsx)
   - CategoryFilter: Horizontal scrollable pills
     - "Wszystkie", "Yoga", "Mobilność", "Kalistenika"
     - Active state: filled indigo z glow
     - Inactive: outline slate
   - LevelFilter: Shadcn Select dropdown
     - "Wszystkie poziomy", "Początkujący", "Średniozaawansowany", "Zaawansowany"
   - ClearFilters button (conditional - gdy filtry aktywne)

3. **VideoGrid** (VideoGrid.tsx)
   - Responsive grid: 1/2/3/4 columns
   - Gap: 1.5rem
   - Loading state: Skeleton loader (6-9 cards)
   - Empty state: EmptyState component
   - Error state: Toast notification + retry

4. **VideoCard** (VideoCard.tsx) - jednostka w gridzie
   - Thumbnail (16:9 aspect ratio)
     - Hover: scale 1.05
     - Premium badge (top-right): gradient purple-indigo
     - Duration badge (bottom-right): black/70 bg
     - Blur effect dla inaccessible content (free users)
   - Content section:
     - Title (2 linie max, ellipsis)
     - Metadata badges: Category + Level
   - Click handler: navigate to `/video/[id]`

**Data Flow:**

```
1. Page load → useVideos() hook → GET /api/videos
2. Filter change → update URL params → refetch with filters
3. Video click → navigate(`/video/${id}`)
```

**UX Considerations:**

- **Skeleton loading** zamiast spinera - mniej denerwujące
- **Smooth transitions** między filter states (no full reload)
- **Visual feedback** - hover effects, active states
- **Progressive enhancement** - działa bez JS (SSR)

**Accessibility:**

- Semantic HTML: `<main>`, `<nav>`, `<article>` dla cards
- Keyboard navigation: Tab przez cards, Enter do otwarcia
- ARIA labels: `aria-label="Filtruj po kategorii Yoga"`
- Focus indicators: ring-2 ring-indigo-500
- Alt text dla thumbnails

**Security:**

- RLS automatycznie filtruje videos based on user role
- Client-side blur dla premium content (visual only)
- Actual protection w API + Storage RLS
- No sensitive data w localStorage

**Edge Cases:**

- No videos: EmptyState "Brak nagrań"
- Filter no results: EmptyState "Nie znaleziono nagrań" + clear filters
- Loading > 3s: Message "Wolne połączenie"
- API error: Toast + retry button
- Offline: Toast "Sprawdź połączenie"

---

### 2.2 Video Details Page (`/video/[id]`)

**Ścieżka:** `/video/[id]` (pages/video/[id].astro)

**Główny cel:**

- Odtwarzanie wybranego nagrania
- Wyświetlenie szczegółowych informacji o nagraniu
- Kontrola dostępu do premium content
- Optymalne doświadczenie oglądania

**Kluczowe informacje do wyświetlenia:**

- Video player z pełną kontrolą
- Tytuł nagrania (H1)
- Metadata: kategoria, poziom, czas
- Pełny opis nagrania
- [Optional] Related videos

**Kluczowe komponenty widoku:**

1. **BackButton** (BackButton.tsx)
   - Position: sticky top-left
   - Icon (arrow-left) + "Powrót"
   - Logic: `window.history.back()` fallback `navigate('/')`

2. **VideoPlayer** (VideoPlayer.tsx)
   - Library: Plyr
   - Container: max-w-7xl centered, full width w kontenerze
   - Aspect ratio: 16:9 locked
   - Controls:
     - Play/pause
     - Progress bar (seek)
     - Volume
     - Fullscreen
     - Speed: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
   - Loading states:
     1. Skeleton player (pulsing gray rectangle)
     2. Spinner (URL fetching)
     3. Plyr built-in buffering indicator
   - Error state: "Nie udało się załadować wideo" + Retry button
   - Timeout (10s): "Sprawdź połączenie"
   - Video sources:
     - Free: public URL from `videos-free` bucket
     - Premium: signed URL from `videos-premium` bucket (1h expiry)

3. **VideoDetails** (VideoDetails.tsx)
   - Layout: Stack (poniżej playera)
   - Sections:
     - **Header:**
       - Title (H1): text-3xl md:text-4xl font-bold
       - Metadata row: Category badge + Level badge + Duration
     - **Description:**
       - Full text: text-base text-slate-300 leading-relaxed
       - Expandable: jeśli height > 300px, pokazać "Rozwiń" button
     - **[Optional] Related Videos:**
       - Horizontal scroll lub grid 2-3 items
       - Same category lub level

4. **PremiumGate** (PremiumGate.tsx) - overlay dla unauthorized
   - Trigger: user próbuje otworzyć premium video bez uprawnień
   - Layout: Fullscreen overlay
   - Content:
     - Blur backdrop (backdrop-blur-md)
     - Centered card (max-w-lg):
       - Thumbnail (blurred)
       - Tytuł
       - Krótki opis (first 150 chars)
       - Lock icon + "Ta treść jest dostępna tylko dla użytkowników premium"
       - Contact CTA: button z email
       - Secondary button: "Powrót do strony głównej"
   - Dismissable: backdrop click lub ESC key

**Data Flow:**

```
1. Page load → useVideo(id) → GET /api/videos/:id
2. Check access: canAccessVideo(video, userRole)
3. If no access → render PremiumGate
4. If access → fetch video URL:
   - Premium: createSignedUrl(path, 3600)
   - Free: getPublicUrl(path)
5. Mount VideoPlayer with URL
```

**UX Considerations:**

- **Immediate feedback** - skeleton zamiast blank screen
- **Clear error messages** - co poszło nie tak, co zrobić
- **Easy navigation** - back button + navbar logo
- **Optimal viewing** - max-width prevents too wide on ultra screens
- **Mobile friendly** - fullscreen option, touch controls

**Accessibility:**

- Heading hierarchy: H1 title → metadata w mniejszych headingach
- Keyboard shortcuts: Space (play/pause), Arrow keys (seek)
- ARIA live region: announce video status changes
- Captions support: Plyr built-in (jeśli dostarczysz VTT)
- Focus management: back button focusable

**Security:**

- Server-side access check: RLS w Supabase
- Signed URLs dla premium: time-limited (1h), auto-expire
- Frontend check: render PremiumGate, ale real protection w backend
- No video URL exposed dla unauthorized users

**Edge Cases:**

- Video not found (404): Redirect to 404 page
- Video deleted between list view and details: "Video not found"
- Slow loading: Timeout message after 10s
- Signed URL expired: Auto-retry z new URL
- Network error during playback: Plyr error UI + retry
- Premium access revoked: Show PremiumGate after refetch

---

### 2.3 Login Page (`/login`)

**Ścieżka:** `/login` (pages/login.astro)

**Główny cel:**

- Umożliwienie zalogowania przez magic link
- [Optional] Zalogowanie przez Google OAuth
- Jasna komunikacja procesu logowania
- Redirect po sukcesie

**Kluczowe informacje do wyświetlenia:**

- Formularz logowania (email input)
- Informacje o magic link
- Success state - "Sprawdź email"
- [Optional] Google OAuth button
- Link powrotu do home

**Kluczowe komponenty widoku:**

1. **LoginForm** (LoginForm.tsx)
   - Layout: Centered card (max-w-md)
   - Elements:
     - **Header:**
       - Logo
       - H1: "Zaloguj się"
       - Subtext: "Otrzymasz link do logowania na email"
     - **Form:**
       - Email input (type="email", required)
       - Validation: proper email format
       - "Wyślij magic link" submit button
       - Loading state: button disabled + spinner
     - **Success State:**
       - Checkmark icon (green)
       - "Link wysłany!"
       - "Sprawdź swoją skrzynkę email"
       - Small text: "Nie widzisz? Sprawdź spam"
     - **[Optional] Divider:** "lub"
     - **[Optional] Google OAuth:**
       - "Zaloguj przez Google" button
       - Google icon
     - **Footer:**
       - Link: "Powrót do strony głównej"

**Data Flow:**

```
1. User wpisuje email → validate format
2. Submit → supabase.auth.signInWithOtp({ email })
3. Success → show success state
4. User klika link w email → auto-login
5. Redirect → '/' (home page)
6. AuthProvider detects session → update context
```

**UX Considerations:**

- **Clear instructions** - użytkownik wie co zrobić
- **Immediate feedback** - validation errors inline
- **Success confirmation** - nie zostawia użytkownika w niepewności
- **Alternative method** - Google OAuth dla convenience
- **Easy exit** - link powrotu do home

**Accessibility:**

- Label dla input: "Adres email"
- Error messages: `aria-describedby` linked to input
- Focus management: auto-focus email input on load
- Keyboard: Tab przez form, Enter submits
- Success announced: ARIA live region

**Security:**

- Rate limiting: max 5 requests/minute per IP
- Email validation: client + server side
- CSRF protection: Supabase handles
- Secure redirect: tylko do własnej domeny

**Edge Cases:**

- Invalid email format: Inline error "Podaj poprawny email"
- Email not found: Generic success (security - don't reveal)
- Network error: Toast "Sprawdź połączenie" + retry
- Already logged in: Auto-redirect to home
- Magic link expired: Message "Link wygasł" → re-request

---

### 2.4 Login Modal (Component)

**Komponent:** LoginModal.tsx

**Główny cel:**

- Contextual login bez opuszczania strony
- Quick access dla user próbującego kliknąć premium
- Same funkcjonalność co `/login` page

**Trigger Events:**

- User klika premium video jako anonymous
- User klika premium video jako free user
- User klika "Zaloguj się" w navbar (optional - może iść do `/login`)

**Kluczowe komponenty:**

1. **Modal Container** (Shadcn Dialog)
   - Backdrop: bg-black/50
   - Content: Centered, max-w-md
   - Close button: X w prawym górnym rogu
   - ESC key: closes modal
   - Backdrop click: closes modal

2. **Modal Content**
   - Identyczny content jak LoginForm w `/login`
   - Po success: modal pozostaje otwarty, pokazuje success state
   - User może zamknąć modal i kontynuować browsing

**Data Flow:**

```
1. Trigger event → setLoginModalOpen(true)
2. User completes login → success state
3. User closes modal lub klika backdrop
4. Po otrzymaniu email + click link → auto-login
5. Page refetches data → premium unlocked
```

**UX Considerations:**

- **Non-blocking** - user może zamknąć i wrócić później
- **Context preserved** - user pozostaje na tej samej stronie
- **Smooth transition** - fade in/out animation
- **Focus trap** - keyboard navigation w obrębie modala

**Accessibility:**

- `role="dialog"`
- `aria-modal="true"`
- Focus trap: Tab cycles w obrębie modal
- ESC key closes: standard behavior
- Focus return: po zamknięciu wraca do trigger element

---

### 2.5 404 Error Page (`/404`)

**Ścieżka:** `/404` (pages/404.astro)

**Główny cel:**

- Informacja o nieznalezionym zasobie
- Jasna droga powrotu
- Utrzymanie branding

**Kluczowe informacje do wyświetlenia:**

- Error code: 404
- Message: "Strona nie znaleziona"
- Helpful subtext
- CTA powrotu do home

**Kluczowe komponenty:**

1. **ErrorLayout**
   - Layout: Fullscreen centered
   - Elements:
     - Large 404 (text-9xl, text-indigo-500)
     - H1: "Strona nie znaleziona"
     - Subtext: "Sprawdź adres lub wróć do strony głównej"
     - CTA button: "Powrót do strony głównej" (link to `/`)
     - [Optional] Illustration: Simple SVG

**UX Considerations:**

- **Friendly tone** - nie obwiniamy użytkownika
- **Clear action** - jeden oczywisty CTA
- **Maintain navigation** - navbar visible (logo działa)

**Accessibility:**

- Proper heading hierarchy
- High contrast text
- Large touch target dla CTA button

---

### 2.6 Mobile Menu Drawer (Component)

**Komponent:** MobileMenu.tsx

**Główny cel:**

- Navigation na mobile devices
- Access do auth actions
- Category filtering shortcuts

**Trigger:** Burger icon w navbar (< 768px)

**Kluczowe komponenty:**

1. **Drawer Container** (Shadcn Sheet)
   - Position: Slide from right
   - Width: 280px
   - Animation: 300ms ease-out
   - Backdrop: bg-black/50

2. **Drawer Content**
   - **Header:**
     - Close button (X)
     - User info (jeśli zalogowany):
       - Avatar
       - Email
       - Role badge
   - **Navigation:**
     - "Strona główna" link
     - Divider
     - "Kategorie" section:
       - Wszystkie
       - Yoga
       - Mobilność
       - Kalistenika
     - [Admin only] Divider + "Supabase Dashboard" external link
   - **Footer:**
     - [Logged in] "Wyloguj się" button
     - [Not logged in] "Zaloguj się" button

**UX Considerations:**

- **Thumb-friendly** - wszystkie elementy w reach
- **Clear hierarchy** - sekcje wizualnie separated
- **Quick actions** - logout/login prominent

**Accessibility:**

- `role="dialog"`
- Focus trap w drawer
- ESC closes
- Focus return to burger after close

---

## 3. Mapa Podróży Użytkownika

### 3.1 User Journey: Anonymous User Discovery

**Persona:** Nowy użytkownik, niezalogowany, szuka darmowych treści

**Cel:** Obejrzeć darmowe video i ocenić platformę

**Kroki:**

1. **Landing na home page (`/`)**
   - Widzi: Grid z 12 videos (mix free + premium)
   - Premium videos: blurred thumbnail + "Premium" badge + lock icon
   - Obserwuje: Różnorodność treści, profesjonalne thumbnails

2. **Filtruje po kategorii "Yoga"**
   - Klika: "Yoga" pill w FilterBar
   - URL update: `/?category=yoga`
   - Grid refetch: Pokazuje tylko yoga videos
   - Widzi: 4 yoga videos (2 free, 2 premium blurred)

3. **Klika darmowe video "Poranna Yoga Flow"**
   - Navigate: `/video/550e8400-e29b-41d4-a716-446655440000`
   - Page load: Skeleton player → spinner → video ready
   - Widzi: Full player + title + description + metadata

4. **Ogląda video**
   - Play button → video starts
   - Controls work: volume, seek, speed adjust (1.5x)
   - Doświadczenie: Smooth, professional, good quality

5. **Próbuje kliknąć premium video**
   - Back to home (`/`)
   - Klika premium blurred card
   - Navigate: `/video/660e8400-e29b-41d4-a716-446655440001`
   - Widzi: PremiumGate overlay
   - Komunikat: "Ta treść dostępna tylko dla premium"
   - CTA: Contact email

6. **Decyzja:**
   - **A)** Kontakt z adminem → otrzymuje invite → tworzy konto
   - **B)** "Powrót do strony głównej" → dalej browse free content

**Pain Points rozwiązane przez UI:**

- ✅ Jasne rozróżnienie free vs premium (blur + badge)
- ✅ Możliwość wypróbowania bez rejestracji
- ✅ Płynne filtrowanie bez reload
- ✅ Profesjonalny video player
- ✅ Jasny komunikat jak uzyskać premium

---

### 3.2 User Journey: Premium User Regular Session

**Persona:** Zalogowany użytkownik premium, wraca na platformę

**Cel:** Obejrzeć nowe treści premium

**Kroki:**

1. **Wchodzi na home page (`/`)**
   - Widzi: Navbar z avatar i email
   - Wszystkie premium videos: UNLOCKED (no blur)
   - Status: Logged in, role visible w dropdown

2. **Filtruje: Mobilność + Zaawansowany**
   - Klika: "Mobilność" pill
   - Wybiera: "Zaawansowany" z dropdown
   - URL: `/?category=mobility&level=advanced`
   - Grid: 3 advanced mobility videos

3. **Klika premium video "Advanced Hip Mobility"**
   - Navigate: `/video/[id]`
   - Page load: Skeleton → spinner (fetching signed URL) → player ready
   - NO PremiumGate: ma dostęp

4. **Ogląda video do końca**
   - Play, adjust speed to 0.75x (ćwiczy razem)
   - Fullscreen na mobile
   - Smooth experience

5. **Back to home**
   - Klika logo w navbar
   - Back to home (`/`)
   - Może filtrować dalej lub wylogować

6. **Logout**
   - Avatar dropdown → "Wyloguj się"
   - Confirmation toast: "Wylogowano"
   - Navbar update: "Zaloguj się" button
   - Premium content: teraz blurred

**Pain Points rozwiązane:**

- ✅ Quick login (magic link - brak password)
- ✅ Immediate access do premium
- ✅ Signed URLs (secure, time-limited)
- ✅ Smooth navigation
- ✅ Clear role indicator

---

### 3.3 User Journey: Admin Content Management

**Persona:** Administrator, zarządza content

**Cel:** Upload nowego video i opublikowanie

**Kroki:**

1. **Loguje się jako admin**
   - Email → magic link → login
   - Navbar: Avatar dropdown pokazuje "Admin" badge
   - Dodatkowa opcja: "Supabase Dashboard" link

2. **Klika "Supabase Dashboard"**
   - External link: otwiera `https://[project].supabase.co`
   - New tab: Supabase Dashboard

3. **Upload video (Supabase Storage)**
   - Storage → `videos-premium` bucket
   - Upload file: `advanced-flow-30min.mp4`
   - Copy path: `advanced-flow-30min.mp4`

4. **Upload thumbnail**
   - Storage → `thumbnails` bucket
   - Upload file: `advanced-flow-30min.jpg`
   - Copy path: `advanced-flow-30min.jpg`

5. **Create video record (Database)**
   - Table Editor → `videos` table
   - Insert new row:
     ```
     title: "Advanced Yoga Flow - 30 min"
     description: "Challenging flow for experienced practitioners..."
     category: "yoga"
     level: "advanced"
     duration: 1800
     video_url: "advanced-flow-30min.mp4"
     thumbnail_url: "advanced-flow-30min.jpg"
     is_premium: true
     status: "draft"
     ```
   - Save

6. **Test draft video (na platformie)**
   - Wraca do platformy: `/`
   - [Optional jeśli implementowane] Widzi draft badge na nowym video
   - Klika: `/video/[new-id]`
   - Testuje: video plays correctly

7. **Publikuje video**
   - Wraca do Supabase Dashboard
   - Table Editor → `videos` → find row
   - Update: `status: "published"`
   - Save

8. **Weryfikuje na platformie**
   - Refresh home page
   - Video teraz visible dla premium users
   - No draft badge

**Pain Points rozwiązane:**

- ✅ Admin badge visibility (wie że ma uprawnienia)
- ✅ Quick access do dashboard (jeden click)
- ✅ Draft testing przed publikacją
- ✅ Możliwość edycji metadata po publikacji

---

### 3.4 User Journey: Free User Upgrade Path

**Persona:** Zalogowany free user, chce upgrade do premium

**Cel:** Uzyskać dostęp do premium content

**Kroki:**

1. **Browse jako free user**
   - Logged in, role: "free"
   - Widzi: Free content unlocked, premium blurred

2. **Klika premium video**
   - Navigate: `/video/[id]`
   - PremiumGate overlay pokazuje się
   - Komunikat: "Wymagane konto Premium"
   - Contact email: admin@platform.com

3. **Kontaktuje się z adminem** (external)
   - Email do admin
   - Prośba o upgrade

4. **Admin nadaje premium role** (Supabase Dashboard)
   - Authentication → Users → find user
   - Edit user metadata: `role: "premium"`
   - Save

5. **User refresh strony**
   - Navbar: Role badge zmienia się "Free" → "Premium"
   - Premium videos: unlocked (no blur)
   - PremiumGate: znika

6. **Ogląda premium content**
   - Klika to samo video co wcześniej
   - NO overlay: direct access
   - Plays video

**Pain Points rozwiązane:**

- ✅ Jasny komunikat jak uzyskać premium
- ✅ Contact email visible
- ✅ Immediate role update po refresh
- ✅ Visual confirmation (role badge change)

---

## 4. Układ i Struktura Nawigacji

### 4.1 Hierarchia Nawigacji

**Primary Navigation** (Navbar - zawsze visible):

```
┌─────────────────────────────────────────────────┐
│ [Logo]                    [Avatar ▼] / [Login] │
└─────────────────────────────────────────────────┘
```

**Secondary Navigation** (FilterBar - na home page):

```
┌─────────────────────────────────────────────────┐
│ [Wszystkie] [Yoga] [Mobilność] [Kalistenika]   │
│ [Poziom trudności ▼]  [X Wyczyść filtry]       │
└─────────────────────────────────────────────────┘
```

**Tertiary Navigation** (Contextual):

- Back button (video details page)
- Mobile menu drawer (mobile devices)
- Login modal (contextual login)

### 4.2 Navigation Patterns

**Pattern 1: Global Navigation (Navbar)**

Desktop (>= 768px):

```
┌──────────────────────────────────────────────────────┐
│ [🏠 Logo]                              [👤 Avatar ▼] │
│                                                        │
│   Avatar Dropdown (logged in):                        │
│   ┌────────────────────────┐                         │
│   │ user@example.com       │                         │
│   │ [Badge: Premium]       │                         │
│   │ ─────────────────────  │                         │
│   │ Wyloguj się            │                         │
│   │ [Admin] Dashboard ↗    │                         │
│   └────────────────────────┘                         │
└──────────────────────────────────────────────────────┘
```

Mobile (< 768px):

```
┌──────────────────────────────────┐
│ [🏠 Logo]              [☰ Menu] │
└──────────────────────────────────┘

Menu click → Slide-in Drawer (right):
┌────────────────────┐
│ [X]                │
│ ──────────────────  │
│ 👤 user@example.com │
│ [Badge: Premium]    │
│ ──────────────────  │
│ 🏠 Strona główna    │
│ ──────────────────  │
│ Kategorie:          │
│ • Wszystkie         │
│ • Yoga              │
│ • Mobilność         │
│ • Kalistenika       │
│ ──────────────────  │
│ [Admin] Dashboard ↗ │
│ ──────────────────  │
│ Wyloguj się         │
└────────────────────┘
```

**Pattern 2: Filter Navigation (FilterBar)**

Desktop:

```
┌────────────────────────────────────────────────┐
│ [Wszystkie] [Yoga] [Mobilność] [Kalistenika]  │
│                                                 │
│ [Poziom trudności ▼]  [X Wyczyść filtry]      │
└────────────────────────────────────────────────┘
```

Mobile (horizontal scroll):

```
┌──────────────────────────────────────────┐
│ ← [Wszystkie] [Yoga] [Mobilność] [Kali…] → │
│                                            │
│ [Poziom trudności ▼]                      │
└──────────────────────────────────────────┘
```

**Pattern 3: Video Details Navigation**

```
┌────────────────────────────────────────────┐
│ [← Powrót]           [Logo]     [Avatar]  │ ← Navbar
└────────────────────────────────────────────┘
│                                            │
│ ┌────────────────────────────────────────┐│
│ │         VIDEO PLAYER (16:9)            ││
│ └────────────────────────────────────────┘│
│                                            │
│ Title, metadata, description…              │
└────────────────────────────────────────────┘
```

### 4.3 Navigation Flow Diagram

```
                    ┌─────────┐
                    │  HOME   │
                    │   /     │
                    └────┬────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
      ┌────▼────┐   ┌────▼────┐   ┌───▼────┐
      │ Filter  │   │  Click  │   │ Login  │
      │ Videos  │   │  Video  │   │ Button │
      └────┬────┘   └────┬────┘   └───┬────┘
           │             │             │
      ┌────▼────┐   ┌────▼──────┐ ┌───▼────────┐
      │ Same    │   │  /video/  │ │  /login    │
      │ Page    │   │   [id]    │ │  or Modal  │
      │ Refetch │   └────┬──────┘ └───┬────────┘
      └─────────┘        │             │
                         │        ┌────▼─────┐
                    ┌────▼────┐   │  Magic   │
                    │  Watch  │   │  Link    │
                    │  Video  │   └────┬─────┘
                    └────┬────┘        │
                         │        ┌────▼─────┐
                    ┌────▼────┐   │  Auto    │
                    │  Back   │   │  Login   │
                    │  Button │   └────┬─────┘
                    │  or     │        │
                    │  Logo   │   ┌────▼─────┐
                    └────┬────┘   │ Redirect │
                         │        │  Home    │
                         ▼        └──────────┘
                    ┌─────────┐
                    │  HOME   │
                    └─────────┘
```

### 4.4 URL Structure

**Routing Map:**

```
/                           → Home page (VideoGrid)
  ?category=yoga            → Filtered by yoga
  ?level=beginner           → Filtered by beginner
  ?category=yoga&level=...  → Combined filters

/video/[id]                 → Video details + player
  → If unauthorized + premium: PremiumGate overlay

/login                      → Login page (magic link)

/404                        → Not found page

[Future]
/profile                    → User profile
/favorites                  → Saved videos
```

**URL State Management:**

- **Query Params for Filters:**
  - Preserved on navigation (browser back/forward)
  - Shareable URLs (send link with filters)
  - Clean URLs (no hash routing)

- **Dynamic Routes:**
  - `/video/[id]` - Astro dynamic routing
  - SEO friendly
  - Pre-render capable (SSG)

### 4.5 Navigation Accessibility

**Keyboard Navigation:**

| Key         | Action                                |
| ----------- | ------------------------------------- |
| Tab         | Focus next interactive element        |
| Shift + Tab | Focus previous element                |
| Enter       | Activate button/link                  |
| Space       | Activate button, toggle               |
| Escape      | Close modal/drawer                    |
| Arrow keys  | Navigate video player, scroll filters |

**Focus Management:**

1. **Page Load:**
   - Main content receives focus (skip to main)
   - OR first interactive element

2. **Modal Open:**
   - Focus first element in modal
   - Trap focus inside modal
   - Return focus on close

3. **Navigation:**
   - Preserve scroll position on back
   - Announce page changes (ARIA live)

**Screen Reader Support:**

- Landmark regions: `<nav>`, `<main>`, `<footer>`
- ARIA labels: wszystkie icon-only buttons
- ARIA live regions: toast notifications, loading states
- Skip links: "Skip to main content"

---

## 5. Kluczowe Komponenty

### 5.1 Layout Components

#### 5.1.1 Layout.astro

**Odpowiedzialność:** Base page structure, SEO, global styles

**Struktura:**

```astro
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <!-- Open Graph, favicons, fonts -->
  </head>
  <body class="bg-slate-900 text-slate-100">
    <Providers client:load>
      <Navbar />
      <main class="min-h-screen">
        <slot />
      </main>
      <Footer />
    </Providers>
    <Toaster />
  </body>
</html>
```

**Props:**

- `title: string`
- `description?: string`
- `ogImage?: string`

---

#### 5.1.2 Navbar.astro + Components

**Odpowiedzialność:** Global navigation, auth status display

**Komponenty:**

- `Navbar.astro` - struktura, SSR
- `AuthButton.tsx` - client-side auth logic
- `UserAvatar.tsx` - dropdown dla zalogowanych
- `MobileMenu.tsx` - drawer dla mobile

**Features:**

- Sticky position (top: 0)
- Responsive (desktop vs mobile variants)
- Auth state reactivity
- Role badge display
- Admin dashboard link (conditional)

**Styling:**

- Background: bg-slate-800/95 backdrop-blur
- Height: h-16 (64px)
- Shadow: shadow-lg
- Z-index: z-50

---

#### 5.1.3 Footer.astro

**Odpowiedzialność:** Footer links, copyright, credits

**Zawartość:**

- Copyright notice
- [Optional] Link do regulaminu
- [Optional] Contact email
- [Optional] Social links

**Styling:**

- Background: bg-slate-800
- Padding: py-8
- Text: text-slate-400 text-sm
- Center aligned

---

### 5.2 Video Components

#### 5.2.1 VideoGrid.tsx

**Odpowiedzialność:** Display video cards in responsive grid, manage loading/empty states

**Props:**

```typescript
interface VideoGridProps {
  filters: {
    category?: VideoCategory;
    level?: VideoLevel;
  };
}
```

**Features:**

- React Query integration: `useVideos(filters)`
- Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Gap: `gap-6`
- Loading state: Skeleton cards (6-9)
- Empty state: `<EmptyState />`
- Error state: Toast + retry

**Data Flow:**

```typescript
const { data, isLoading, error } = useVideos(filters)

if (isLoading) return <SkeletonGrid />
if (error) return <ErrorToast />
if (!data.length) return <EmptyState />

return (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {data.map(video => (
      <VideoCard key={video.id} video={video} />
    ))}
  </div>
)
```

---

#### 5.2.2 VideoCard.tsx

**Odpowiedzialność:** Display individual video preview, handle click to details

**Props:**

```typescript
interface VideoCardProps {
  video: Video;
}
```

**Struktura:**

```tsx
<article className="group cursor-pointer" onClick={handleClick}>
  {/* Thumbnail Container */}
  <div className="relative aspect-video overflow-hidden rounded-lg">
    <img src={thumbnailUrl} alt={video.title} className="group-hover:scale-105 transition-transform duration-300" />

    {/* Premium Badge */}
    {video.is_premium && <Badge className="absolute top-2 right-2">Premium</Badge>}

    {/* Duration Badge */}
    <Badge className="absolute bottom-2 right-2">{formatDuration(video.duration)}</Badge>

    {/* Blur for inaccessible */}
    {!canAccess && (
      <div className="absolute inset-0 backdrop-blur-md bg-black/30">
        <LockIcon />
      </div>
    )}
  </div>

  {/* Content */}
  <div className="p-4">
    <h3 className="font-semibold text-lg line-clamp-2">{video.title}</h3>
    <div className="flex gap-2 mt-2">
      <CategoryBadge category={video.category} />
      <LevelBadge level={video.level} />
    </div>
  </div>
</article>
```

**Access Logic:**

```typescript
const canAccess = useMemo(() => {
  if (!video.is_premium) return true;
  if (!user) return false;
  return ["premium", "admin"].includes(user.role);
}, [video, user]);
```

**Hover Effects:**

- Card: `hover:scale-[1.02]`
- Thumbnail: `group-hover:scale-105`
- Shadow: `hover:shadow-2xl hover:shadow-indigo-500/20`
- Title: `group-hover:text-indigo-400`

---

#### 5.2.3 VideoPlayer.tsx

**Odpowiedzialność:** Video playback with Plyr, handle premium signed URLs

**Props:**

```typescript
interface VideoPlayerProps {
  video: Video;
}
```

**Features:**

- Plyr integration
- Signed URL fetching (premium)
- Public URL (free)
- Loading states (skeleton → spinner → player)
- Error handling with retry
- Speed controls (0.5x - 2x)
- Fullscreen support

**Implementation:**

```typescript
const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const playerRef = useRef<Plyr | null>(null)

  useEffect(() => {
    fetchVideoUrl()
  }, [video.id])

  const fetchVideoUrl = async () => {
    try {
      setLoading(true)
      const url = video.is_premium
        ? await getSignedUrl(video.video_url)
        : getPublicUrl(video.video_url)
      setVideoUrl(url)
    } catch (err) {
      setError('Nie udało się załadować wideo')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PlayerSkeleton />
  if (error) return <PlayerError onRetry={fetchVideoUrl} />

  return (
    <video ref={playerRef} src={videoUrl} />
  )
}
```

**Plyr Options:**

```typescript
{
  controls: ['play-large', 'play', 'progress', 'current-time',
             'duration', 'mute', 'volume', 'settings', 'fullscreen'],
  settings: ['quality', 'speed'],
  speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] }
}
```

---

#### 5.2.4 VideoDetails.tsx

**Odpowiedzialność:** Display video metadata and description

**Props:**

```typescript
interface VideoDetailsProps {
  video: Video;
}
```

**Struktura:**

```tsx
<div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
  {/* Header */}
  <div className="mb-6">
    <h1 className="text-3xl md:text-4xl font-bold mb-4">{video.title}</h1>
    <div className="flex flex-wrap gap-2">
      <CategoryBadge category={video.category} />
      <LevelBadge level={video.level} />
      <DurationBadge duration={video.duration} />
    </div>
  </div>

  {/* Description */}
  <div className="prose prose-invert max-w-none">
    <ExpandableText text={video.description} maxHeight={300} />
  </div>

  {/* [Optional] Related Videos */}
  {relatedVideos && <RelatedVideos videos={relatedVideos} />}
</div>
```

---

#### 5.2.5 PremiumGate.tsx

**Odpowiedzialność:** Block access to premium content, show upgrade CTA

**Props:**

```typescript
interface PremiumGateProps {
  video: Video;
}
```

**Struktura:**

```tsx
<div
  className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md 
                flex items-center justify-center p-4"
>
  <div className="bg-slate-800 rounded-xl max-w-lg w-full p-8 relative">
    {/* Close button */}
    <button onClick={onClose} className="absolute top-4 right-4">
      <XIcon />
    </button>

    {/* Blurred thumbnail */}
    <div className="aspect-video mb-6 rounded-lg overflow-hidden">
      <img src={video.thumbnail_url} className="blur-xl opacity-60" />
      <div className="absolute inset-0 flex items-center justify-center">
        <LockIcon className="w-16 h-16 text-purple-500" />
      </div>
    </div>

    {/* Content */}
    <h2 className="text-2xl font-bold mb-2">{video.title}</h2>
    <p className="text-slate-400 mb-6">{video.description?.substring(0, 150)}...</p>

    {/* Warning */}
    <div
      className="bg-purple-500/10 border border-purple-500/20 
                    rounded-lg p-4 mb-6"
    >
      <p className="text-purple-300">
        <LockIcon className="inline mr-2" />
        Ta treść jest dostępna tylko dla użytkowników premium
      </p>
    </div>

    {/* CTAs */}
    <div className="flex flex-col sm:flex-row gap-3">
      <Button asChild className="flex-1">
        <a href={`mailto:${ADMIN_EMAIL}`}>Skontaktuj się</a>
      </Button>
      <Button variant="outline" onClick={onClose} className="flex-1">
        Powrót
      </Button>
    </div>
  </div>
</div>
```

**Accessibility:**

- Focus trap
- ESC key closes
- ARIA role="dialog"
- Backdrop click closes

---

### 5.3 Filter Components

#### 5.3.1 FilterBar.tsx

**Odpowiedzialność:** Container for all filters, manage filter state

**Props:**

```typescript
interface FilterBarProps {
  onFilterChange: (filters: Filters) => void;
  initialFilters?: Filters;
}
```

**Struktura:**

```tsx
<div className="mb-8">
  <CategoryFilter value={filters.category} onChange={handleCategoryChange} />

  <div className="flex items-center gap-4 mt-4">
    <LevelFilter value={filters.level} onChange={handleLevelChange} />

    {hasActiveFilters && (
      <Button variant="ghost" onClick={clearFilters}>
        <XIcon /> Wyczyść filtry
      </Button>
    )}
  </div>
</div>
```

**State Management:**

```typescript
const [filters, setFilters] = useState(initialFilters);

// Sync with URL
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  params.set("category", filters.category);
  params.set("level", filters.level);
  router.push(`/?${params.toString()}`);
}, [filters]);
```

---

#### 5.3.2 CategoryFilter.tsx

**Odpowiedzialność:** Horizontal scrollable category pills

**Props:**

```typescript
interface CategoryFilterProps {
  value?: VideoCategory;
  onChange: (category?: VideoCategory) => void;
}
```

**Struktura:**

```tsx
<div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
  {CATEGORIES.map((category) => (
    <button
      key={category.value}
      onClick={() => onChange(category.value)}
      className={cn(
        "px-6 py-2.5 rounded-full font-medium text-sm whitespace-nowrap",
        "transition-all duration-200",
        value === category.value
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/50"
          : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
      )}
    >
      {category.label}
    </button>
  ))}
</div>
```

**Categories:**

```typescript
const CATEGORIES = [
  { value: undefined, label: "Wszystkie" },
  { value: "yoga", label: "Yoga" },
  { value: "mobility", label: "Mobilność" },
  { value: "calisthenics", label: "Kalistenika" },
];
```

---

#### 5.3.3 LevelFilter.tsx

**Odpowiedzialność:** Dropdown select for difficulty level

**Props:**

```typescript
interface LevelFilterProps {
  value?: VideoLevel;
  onChange: (level?: VideoLevel) => void;
}
```

**Implementation:**

```tsx
<Select value={value} onValueChange={onChange}>
  <SelectTrigger className="w-48">
    <SelectValue placeholder="Poziom trudności" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value={undefined}>Wszystkie poziomy</SelectItem>
    <SelectItem value="beginner">Początkujący</SelectItem>
    <SelectItem value="intermediate">Średniozaawansowany</SelectItem>
    <SelectItem value="advanced">Zaawansowany</SelectItem>
  </SelectContent>
</Select>
```

Uses Shadcn/ui Select component for consistency.

---

### 5.4 Auth Components

#### 5.4.1 AuthButton.tsx

**Odpowiedzialność:** Toggle between logged in (avatar) and logged out (button) states

**Props:** None (uses AuthContext)

**Implementation:**

```typescript
const AuthButton: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) return <Skeleton className="w-10 h-10 rounded-full" />

  if (user) {
    return <UserAvatar user={user} />
  }

  return (
    <Button
      onClick={() => navigate('/login')}
      variant="default"
    >
      Zaloguj się
    </Button>
  )
}
```

---

#### 5.4.2 UserAvatar.tsx

**Odpowiedzialność:** Display user avatar with dropdown menu

**Props:**

```typescript
interface UserAvatarProps {
  user: User;
}
```

**Struktura:**

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="flex items-center gap-2">
      <Avatar>
        <AvatarFallback>{user.email[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <ChevronDownIcon />
    </button>
  </DropdownMenuTrigger>

  <DropdownMenuContent align="end" className="w-56">
    {/* User info */}
    <div className="px-2 py-1.5">
      <p className="text-sm font-medium">{user.email}</p>
      <RoleBadge role={user.role} />
    </div>

    <DropdownMenuSeparator />

    {/* Admin link */}
    {user.role === "admin" && (
      <>
        <DropdownMenuItem asChild>
          <a href={SUPABASE_DASHBOARD_URL} target="_blank">
            Supabase Dashboard
            <ExternalLinkIcon className="ml-auto" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
      </>
    )}

    {/* Logout */}
    <DropdownMenuItem onClick={handleLogout}>Wyloguj się</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

#### 5.4.3 LoginForm.tsx

**Odpowiedzialność:** Magic link login form, success state

**Props:**

```typescript
interface LoginFormProps {
  onSuccess?: () => void;
}
```

**States:**

- `idle` - initial form
- `loading` - submitting
- `success` - email sent
- `error` - something went wrong

**Implementation:**

```tsx
const [email, setEmail] = useState("");
const [state, setState] = useState<FormState>("idle");

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setState("loading");

  try {
    await supabase.auth.signInWithOtp({ email });
    setState("success");
    onSuccess?.();
  } catch (error) {
    setState("error");
    toast.error("Nie udało się wysłać linka");
  }
};

if (state === "success") {
  return <SuccessState email={email} />;
}

return (
  <form onSubmit={handleSubmit}>
    <Input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="twoj@email.com"
      required
    />
    <Button type="submit" disabled={state === "loading"} className="w-full">
      {state === "loading" ? "Wysyłanie..." : "Wyślij magic link"}
    </Button>
  </form>
);
```

---

#### 5.4.4 LoginModal.tsx

**Odpowiedzialność:** Modal wrapper for LoginForm, contextual login

**Props:**

```typescript
interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Implementation:**

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Zaloguj się</DialogTitle>
      <DialogDescription>Otrzymasz link do logowania na email</DialogDescription>
    </DialogHeader>

    <LoginForm
      onSuccess={() => {
        // Modal pozostaje otwarty, pokazuje success
      }}
    />

    {/* Optional: Google OAuth */}
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-slate-800 px-2 text-slate-400">lub</span>
      </div>
    </div>

    <Button variant="outline" onClick={handleGoogleLogin}>
      <GoogleIcon className="mr-2" />
      Zaloguj przez Google
    </Button>
  </DialogContent>
</Dialog>
```

---

### 5.5 Common Components

#### 5.5.1 LoadingSpinner.tsx

**Odpowiedzialność:** Generic loading indicator

**Variants:**

- `inline` - small, inline with text
- `overlay` - fullscreen overlay
- `button` - inside button

```tsx
<div className="flex items-center justify-center">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
</div>
```

---

#### 5.5.2 EmptyState.tsx

**Odpowiedzialność:** Show when no results found

**Props:**

```typescript
interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Implementation:**

```tsx
<div className="flex flex-col items-center justify-center min-h-[400px] px-4">
  <SearchXIcon className="w-20 h-20 text-slate-600 mb-4" />
  <h3 className="text-xl font-semibold mb-2">{title}</h3>
  <p className="text-slate-400 text-center mb-6">{description}</p>
  {action && <Button onClick={action.onClick}>{action.label}</Button>}
</div>
```

---

#### 5.5.3 ErrorBoundary.tsx

**Odpowiedzialność:** Catch React errors, show fallback UI

**Implementation:**

```tsx
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Przepraszamy, coś poszło nie tak</h1>
          <Button onClick={() => window.location.reload()}>Odśwież stronę</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

#### 5.5.4 SkeletonGrid.tsx

**Odpowiedzialność:** Loading skeleton for VideoGrid

**Implementation:**

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {Array.from({ length: 8 }).map((_, i) => (
    <div key={i} className="space-y-4">
      <Skeleton className="aspect-video rounded-lg" />
      <Skeleton className="h-6 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  ))}
</div>
```

---

### 5.6 UI Primitives (Shadcn/ui)

**Komponenty z biblioteki Shadcn/ui:**

- **Button** - primary, secondary, outline, ghost variants
- **Input** - text inputs, email, search
- **Select** - dropdown selects
- **Dialog** - modals
- **Sheet** - slide-in drawers
- **Avatar** - user avatars
- **Badge** - labels, tags, status indicators
- **Skeleton** - loading placeholders
- **Dropdown Menu** - context menus
- **Toast** / **Sonner** - notifications
- **Card** - content containers

**Customization:**

- All styled with Tailwind
- Dark theme defaults
- Indigo accent colors
- Consistent spacing and shadows

---

## 6. Badge Color System

### 6.1 Category Badges

**Yoga:**

```tsx
<Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/20">Yoga</Badge>
```

**Mobilność:**

```tsx
<Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20">Mobilność</Badge>
```

**Kalistenika:**

```tsx
<Badge className="bg-orange-500/10 text-orange-400 border border-orange-500/20">Kalistenika</Badge>
```

### 6.2 Level Badges

**Beginner:**

```tsx
<Badge className="bg-green-500/10 text-green-400">Początkujący</Badge>
```

**Intermediate:**

```tsx
<Badge className="bg-yellow-500/10 text-yellow-400">Średniozaawansowany</Badge>
```

**Advanced:**

```tsx
<Badge className="bg-red-500/10 text-red-400">Zaawansowany</Badge>
```

### 6.3 Special Badges

**Premium:**

```tsx
<Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">Premium</Badge>
```

**Duration (on thumbnail):**

```tsx
<Badge className="bg-black/70 text-white text-xs px-2 py-1">{formatDuration(duration)}</Badge>
```

**Role Badges:**

```tsx
// Free
<Badge className="bg-slate-600 text-slate-200">Free</Badge>

// Premium
<Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
  Premium
</Badge>

// Admin
<Badge className="bg-indigo-600 text-white">Admin</Badge>
```

**Status Badges (Admin view):**

```tsx
// Draft
<Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
  Draft
</Badge>

// Published
<Badge className="bg-green-500/10 text-green-400 border border-green-500/20">
  Published
</Badge>

// Archived
<Badge className="bg-red-500/10 text-red-400 border border-red-500/20">
  Archived
</Badge>
```

---

## 7. Responsive Behavior Szczegóły

### 7.1 Home Page Responsive

**Mobile (< 640px):**

- Grid: 1 column
- FilterBar: horizontal scroll, stacked level dropdown
- Cards: full width, large touch targets
- Navbar: burger menu

**Tablet (640-1024px):**

- Grid: 2 columns
- FilterBar: horizontal scroll, inline level dropdown
- Cards: medium size
- Navbar: full navigation

**Desktop (>1024px):**

- Grid: 3-4 columns
- FilterBar: wszystkie filtry w jednej linii
- Cards: standard size
- Navbar: full with dropdown

### 7.2 Video Details Responsive

**All viewports:** Stack layout

- Player: full width w kontenerze
- Description: poniżej playera
- Back button: sticky top-left

**Mobile:**

- Container padding: px-4
- Font sizes: smaller (3xl → 2xl dla H1)
- Touch-friendly controls

**Desktop:**

- Container padding: px-8
- Larger typography
- Hover effects active

---

## 8. Accessibility Requirements

### 8.1 WCAG 2.1 Compliance

**Level AA minimum:**

1. **Perceivable:**
   - Text contrast: 4.5:1 minimum (slate-100 on slate-900)
   - Alt text dla wszystkich images
   - Captions dla videos (jeśli dostępne)

2. **Operable:**
   - Keyboard navigation: wszystkie funkcje dostępne
   - Focus indicators: wyraźne (ring-2 ring-indigo-500)
   - No keyboard traps

3. **Understandable:**
   - Clear language (polski)
   - Consistent navigation
   - Error messages: jasne i pomocne

4. **Robust:**
   - Semantic HTML
   - ARIA labels gdzie potrzebne
   - Valid HTML

### 8.2 Keyboard Navigation

**Global:**

- Tab: Next focusable
- Shift+Tab: Previous focusable
- Enter: Activate button/link
- Space: Activate button
- Escape: Close modal/drawer

**Video Player:**

- Space: Play/pause
- Arrow keys: Seek
- M: Mute
- F: Fullscreen

**Filters:**

- Arrow keys: Navigate pills
- Enter: Select filter

### 8.3 Screen Reader Support

**Landmarks:**

```html
<nav aria-label="Main navigation">
  <main aria-label="Main content">
    <footer aria-label="Site footer"></footer>
  </main>
</nav>
```

**Live Regions:**

```html
<div aria-live="polite" aria-atomic="true">
  <!-- Toast notifications -->
</div>
```

**Labels:**

```html
<button aria-label="Zamknij modal">
  <XIcon />
</button>
```

---

## 9. Security Considerations UI

### 9.1 Client-Side Validation

**Wszystkie formy:**

- Email: format validation
- Required fields: non-empty
- Sanitization: user input (descriptions)

**Note:** Server-side validation jest primary, client-side tylko dla UX.

### 9.2 Access Control Display

**Premium Content:**

- Visual indication (blur, badge)
- Actual blocking w API + Storage RLS
- No video URLs exposed dla unauthorized

**Admin Features:**

- Conditional rendering based on role
- Links do dashboard tylko dla admin
- Draft videos tylko dla admin

### 9.3 XSS Prevention

- React auto-escapes JSX
- Sanitize HTML w descriptions (DOMPurify jeśli potrzebne)
- No `dangerouslySetInnerHTML` bez sanitization

### 9.4 CSRF Protection

- Supabase handles automatycznie
- Same-site cookies
- HTTPS only w production

---

## 10. Performance Optimization

### 10.1 Loading Strategies

**Images:**

- Lazy loading: `loading="lazy"`
- WebP format: 80% compression
- Responsive images: srcset dla różnych sizes
- LQIP placeholders

**JavaScript:**

- Code splitting: Astro automatic
- Dynamic imports: heavy components (Plyr)
- React components: `client:load` tylko gdy interactive
- Tree shaking: unused code removed

**Data:**

- React Query caching: 5-10min stale time
- Prefetching: hover intent (optional)
- Optimistic updates: admin mutations

### 10.2 Bundle Size

**Targets:**

- Initial JS: < 100kb gzipped
- Total JS: < 300kb
- CSS: < 50kb

**Strategies:**

- Minimize dependencies
- Use Astro for static content
- Dynamic imports dla routes

### 10.3 Rendering Strategy

**Astro:**

- SSR dla dynamic content (user-specific)
- SSG dla static pages (optional w MVP)
- Partial hydration: tylko interactive components

**React:**

- `client:load` - default dla interactive
- `client:visible` - load when visible (optional optimization)
- `client:idle` - load when browser idle (optional)

---

## 11. Error Handling Strategy

### 11.1 Error Types

**Network Errors:**

- Toast: "Sprawdź połączenie internetowe"
- Retry button
- Offline indicator

**API Errors:**

- 400: Inline validation errors
- 401: Toast + redirect to login
- 403: Premium gate overlay lub toast
- 404: Dedicated page
- 500/503: Fullscreen error boundary + retry

**Client Errors:**

- React Error Boundary catches
- Fallback UI: "Coś poszło nie tak" + reload

**Validation Errors:**

- Inline pod input field
- Red border + error message
- ARIA describedby

### 11.2 Error Messages

**User-friendly:**

- "Nie udało się załadować wideo" nie "Error 500"
- "Sprawdź połączenie" nie "Network timeout"
- "Podaj poprawny email" nie "Invalid format"

**Actionable:**

- Zawsze oferuj next step
- Retry button gdzie sensowne
- Contact support jeśli critical

### 11.3 Logging

**Development:**

- console.error dla wszystkich errors
- Stack traces visible

**Production:**

- Error logging service (np. Sentry)
- No sensitive data w logs
- User-friendly messages only

---

## 12. Future Enhancements (Post-MVP)

### 12.1 Planned Features

**User Features:**

- Search bar (full-text search)
- Favorites/bookmarks
- Watch history
- Continue watching
- Progress tracking
- Playlists/collections

**Admin Features:**

- In-app video upload UI
- Bulk operations
- Analytics dashboard
- Content scheduling

**Social Features:**

- Comments/likes
- Ratings
- Share functionality
- User profiles public

### 12.2 Technical Enhancements

**Performance:**

- CDN dla static assets
- Image optimization service
- Video transcoding pipeline
- Lazy hydration optimization

**UX:**

- Dark/light mode toggle
- Multi-language support (i18n)
- Accessibility improvements
- Mobile app (React Native)

**Analytics:**

- View tracking
- Watch time metrics
- User behavior analytics
- A/B testing framework

---

## 13. Implementation Checklist

### Phase 1: Foundation (Week 1)

- [ ] Setup Astro project + dependencies
- [ ] Configure Tailwind + Shadcn/ui
- [ ] Create Layout.astro + basic structure
- [ ] Implement Navbar (desktop + mobile)
- [ ] Setup Supabase client
- [ ] Create AuthProvider + Context
- [ ] Setup React Query
- [ ] Create Providers wrapper

### Phase 2: Home Page (Week 1-2)

- [ ] Implement VideoCard component
- [ ] Implement VideoGrid component
- [ ] Implement FilterBar (CategoryFilter + LevelFilter)
- [ ] Connect to API: useVideos hook
- [ ] Loading states: Skeleton loader
- [ ] Empty state component
- [ ] Error handling: Toast notifications
- [ ] Premium blur effect dla unauthorized

### Phase 3: Video Details (Week 2)

- [ ] Create video details page route
- [ ] Implement VideoPlayer (Plyr integration)
- [ ] Signed URL fetching dla premium
- [ ] VideoDetails component (metadata + description)
- [ ] PremiumGate overlay
- [ ] Back button navigation
- [ ] Loading states (skeleton → spinner → player)
- [ ] Error handling (retry logic)

### Phase 4: Authentication (Week 2)

- [ ] Login page (`/login`)
- [ ] LoginForm component
- [ ] LoginModal component
- [ ] Magic link integration
- [ ] Google OAuth (optional)
- [ ] Auth state management
- [ ] UserAvatar + dropdown
- [ ] Logout functionality
- [ ] Role badge display

### Phase 5: Polish (Week 3)

- [ ] 404 error page
- [ ] Error boundary implementation
- [ ] Toast notifications (Sonner)
- [ ] Responsive testing (all breakpoints)
- [ ] Accessibility audit (WCAG AA)
- [ ] Keyboard navigation testing
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] Mobile menu drawer
- [ ] Admin dashboard link

### Phase 6: Testing & Deploy (Week 3)

- [ ] Manual testing: all user flows
- [ ] Integration testing: API calls
- [ ] Accessibility testing: screen reader
- [ ] Performance testing: Lighthouse
- [ ] Security audit: access control
- [ ] Deploy to production
- [ ] Upload test videos
- [ ] Create test users (free, premium, admin)
- [ ] Final QA
- [ ] Documentation

---

## 14. Mapping PRD User Stories do UI

### Epic: Przeglądanie Treści

**US-01:** Niezalogowany użytkownik widzi darmowe nagrania

- ✅ **UI:** VideoGrid pokazuje wszystkie videos, premium blurred
- ✅ **Component:** VideoCard z conditional blur effect
- ✅ **Access:** RLS filtruje w API, UI pokazuje visual indication

**US-02:** Filtrowanie po kategoriach

- ✅ **UI:** FilterBar z CategoryFilter pills
- ✅ **Component:** CategoryFilter.tsx z horizontal scroll
- ✅ **URL:** Query params `/?category=yoga`

**US-03:** Podstawowe informacje na karcie

- ✅ **UI:** VideoCard wyświetla: thumbnail, title, duration, category, level
- ✅ **Component:** Metadata badges (CategoryBadge, LevelBadge)

**US-04:** Oznaczenie premium content

- ✅ **UI:** Premium badge + blur effect dla unauthorized
- ✅ **Component:** Conditional rendering w VideoCard

### Epic: Autentykacja

**US-05:** Zaproszenie email (admin Supabase Dashboard)

- ⚠️ **UI:** Nie dotyczy - admin workflow external

**US-06:** Magic link login

- ✅ **UI:** LoginForm w `/login` + LoginModal
- ✅ **Component:** LoginForm.tsx z email input + success state

**US-07:** Status użytkownika w navbar

- ✅ **UI:** UserAvatar dropdown z role badge
- ✅ **Component:** UserAvatar.tsx + RoleBadge

### Epic: Odtwarzanie Wideo

**US-08:** Dedykowana strona z odtwarzaczem

- ✅ **UI:** `/video/[id]` page z VideoPlayer + VideoDetails
- ✅ **Component:** VideoPlayer.tsx (Plyr) + VideoDetails.tsx

**US-09:** Kontrola prędkości

- ✅ **UI:** Plyr speed controls (0.5x - 2x)
- ✅ **Component:** VideoPlayer.tsx z Plyr options

**US-10:** Premium access dla premium users

- ✅ **UI:** No PremiumGate dla authorized
- ✅ **Component:** Conditional rendering based on canAccess logic

**US-11:** Komunikat dla free users

- ✅ **UI:** PremiumGate overlay z upgrade message
- ✅ **Component:** PremiumGate.tsx

### Epic: Zarządzanie Treścią (Admin)

**US-12-15:** Admin przez Supabase Dashboard

- ✅ **UI:** Link "Supabase Dashboard" w UserAvatar dropdown (admin only)
- ✅ **Component:** Conditional rendering w UserAvatar.tsx

---

## 15. Unresolved Questions

### 15.1 Nice-to-Have Features

1. **Related Videos Section:**
   - Czy implementować w MVP?
   - Jaka logika: same category, same level, najpopularniejsze?
   - **Rekomendacja:** Skip w MVP, dodać w v1.1

2. **Video Progress Tracking:**
   - Czy zapisywać postęp oglądania?
   - Continue watching feature?
   - **Rekomendacja:** Skip w MVP, przygotować architekturę (Supabase table)

3. **Search Bar:**
   - Czy pokazać disabled search z tooltip "Wkrótce"?
   - **Rekomendacja:** Skip całkowicie w MVP

4. **Admin Draft Visibility:**
   - Czy draft videos w głównym gridzie z badge?
   - Czy osobny widok admin?
   - **Rekomendacja:** Main grid + badge, łatwiejsze w implementacji

5. **Video Upload UI:**
   - Czy planować miejsce w UI na przyszły upload?
   - **Rekomendacja:** Nie, Supabase Dashboard wystarczy dla MVP

6. **Analytics Display:**
   - Czy admin widzi view count?
   - **Rekomendacja:** Skip w MVP, dodać w v1.2

7. **Mobile Video UX:**
   - Picture-in-picture?
   - Auto-fullscreen on play?
   - **Rekomendacja:** Standard behavior, Plyr defaults

8. **Pagination:**
   - Classic pagination, load more, czy infinite scroll?
   - **Rekomendacja:** Load more button (prostsza implementacja)

9. **Translations:**
   - Kategorie/poziomy po polsku hardcoded czy i18n system?
   - **Rekomendacja:** Hardcoded w MVP, przygotować constants file

10. **Notifications:**
    - Email notifications po nadaniu premium?
    - **Rekomendacja:** Skip w MVP, manual communication

---

## Koniec Dokumentu

**Następne kroki:**

1. Review tego dokumentu z team/stakeholders
2. Zatwierdzenie decyzji designowych
3. Rozpoczęcie implementacji (Phase 1)
4. Iteracyjny development według checklisty
