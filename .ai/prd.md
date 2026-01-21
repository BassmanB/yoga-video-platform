# Product Requirements Document (PRD)

## Platforma do Udostępniania Nagrań Ćwiczeń Fizycznych

**Wersja:** 1.0  
**Data:** 13 stycznia 2026  
**Status:** Draft - POC  
**Autor:** Product Manager

---

## 1. Executive Summary

### 1.1 Cel Projektu

Stworzenie prostej platformy webowej do udostępniania nagrań wideo z ćwiczeniami fizycznymi (yoga, mobilność, kalistenika) dla małej grupy użytkowników (~20 osób). Platforma będzie działać w modelu freemium - część treści dostępna publicznie, część tylko dla wybranych użytkowników premium.

### 1.2 Kluczowe Założenia

- **Timeframe:** 3 tygodnie (development po godzinach pracy)
- **Scope:** MVP/POC - minimalna funkcjonalność
- **Użytkownicy:** ~20 osób
- **Content:** 3-4 testowe nagrania (~2 min każde)
- **Model biznesowy:** Freemium bez systemu płatności

### 1.3 Stack Technologiczny

- **Frontend:** Astro + React + TypeScript
- **Styling:** Tailwind CSS (+ daisyUI/shadcn-ui dla komponentów)
- **Backend/Auth/Storage:** Supabase
- **Video Player:** video.js lub Plyr
- **Hosting:** Bolt.new (POC) / VPS OVH (produkcja)

---

## 2. Problem Statement

### 2.1 Problem Użytkownika

Instruktorzy fitness potrzebują prostego sposobu na udostępnianie swoich nagrań treningowych wybranej grupie uczestników, z możliwością kontrolowania dostępu bez komplikowania procesu płatnościami.

### 2.2 Istniejące Rozwiązania i ich Wady

- **YouTube/Vimeo:** Brak kontroli dostępu dla wybranych użytkowników
- **Platformy kursowe (Teachable, Kajabi):** Za skomplikowane i kosztowne dla małej grupy
- **Google Drive:** Słabe doświadczenie oglądania wideo, brak organizacji

---

## 3. User Personas

### 3.1 Persona 1: Administrator/Instruktor (Ty)

- **Potrzeby:** Szybki upload nagrań, kontrola dostępu, prosta organizacja treści
- **Pain points:** Ograniczony czas, potrzeba prostoty
- **Tech skills:** Zaawansowane (developer)

### 3.2 Persona 2: Użytkownik Free

- **Potrzeby:** Dostęp do podstawowych/darmowych nagrań, łatwa nawigacja
- **Pain points:** Chce zobaczyć jakość przed decyzją o premium
- **Tech skills:** Podstawowe/średnie

### 3.3 Persona 3: Użytkownik Premium

- **Potrzeby:** Dostęp do wszystkich treści, wygodne oglądanie
- **Pain points:** Chce wartościowe treści bez komplikacji
- **Tech skills:** Podstawowe/średnie

---

## 4. User Stories & Use Cases

### 4.1 Epic: Przeglądanie Treści

**US-01:** Jako niezalogowany użytkownik, chcę zobaczyć darmowe nagrania na stronie głównej, aby ocenić jakość treści przed rejestracją.

**US-02:** Jako użytkownik, chcę filtrować nagrania po kategoriach (yoga/mobilność/kalistenika), aby szybko znaleźć interesujący mnie typ treningu.

**US-03:** Jako użytkownik, chcę zobaczyć podstawowe informacje o nagraniu (czas, poziom, opis) na karcie, aby zdecydować czy chcę je obejrzeć.

**US-04:** Jako użytkownik free, chcę widzieć które treści są premium (z oznaką + blur), aby wiedzieć co zyskam po upgrade.

### 4.2 Epic: Autentykacja

**US-05:** Jako nowy użytkownik, chcę otrzymać zaproszenie email, aby móc stworzyć konto.

**US-06:** Jako użytkownik, chcę logować się przez magic link (email), aby uniknąć zapamiętywania hasła.

**US-07:** Jako zalogowany użytkownik, chcę widzieć swój status (free/premium) w navbar, aby wiedzieć jakie mam uprawnienia.

### 4.3 Epic: Odtwarzanie Wideo

**US-08:** Jako użytkownik, chcę kliknąć na nagranie i przejść na dedykowaną stronę z odtwarzaczem, aby skoncentrować się na treningu.

**US-09:** Jako użytkownik, chcę kontrolować prędkość odtwarzania (0.5x - 2x), aby dopasować tempo do moich możliwości.

**US-10:** Jako użytkownik premium, chcę mieć dostęp do wszystkich nagrań bez ograniczeń.

**US-11:** Jako użytkownik free próbujący otworzyć premium content, chcę zobaczyć komunikat z informacją jak uzyskać dostęp.

### 4.4 Epic: Zarządzanie Treścią (Admin)

**US-12:** Jako admin, chcę uploadować nagrania przez Supabase Dashboard wraz z miniaturką.

**US-13:** Jako admin, chcę ustawić metadane nagrania (tytuł, opis, kategoria, poziom, status free/premium).

**US-14:** Jako admin, chcę edytować metadane po publikacji, aby poprawiać błędy bez re-uploadu.

**US-15:** Jako admin, chcę zarządzać rolami użytkowników (free/premium/admin) przez Supabase Dashboard.

---

## 5. Functional Requirements

### 5.1 Strona Główna (`/`)

**FR-01:** Wyświetlanie wszystkich nagrań w gridzie (2-3 kolumny responsive)

**FR-02:** Każda karta nagrania zawiera:

- Miniaturka
- Tytuł
- Czas trwania
- Kategoria
- Poziom trudności
- Badge "Premium" (jeśli płatne) z efektem blur dla niezalogowanych/free users

**FR-03:** Buttony filtrowania nad gridem:

- Wszystkie
- Yoga
- Mobilność
- Kalistenika

**FR-04:** Filtrowanie działa przez query params: `/?category=yoga`

**FR-05:** Navbar zawiera:

- Logo (link do home)
- Kategorie jako filtry
- Przycisk "Login" (niezalogowany) lub Avatar/Email + "Logout" (zalogowany)
- Burger menu na mobile

### 5.2 Strona Szczegółów Nagrania (`/video/[id]`)

**FR-06:** Odtwarzacz wideo (video.js/Plyr) z:

- Play/pause
- Progress bar
- Volume control
- Fullscreen
- Speed control (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)

**FR-07:** Sekcja informacji pod odtwarzaczem:

- Tytuł
- Kategoria + poziom
- Pełny opis
- Czas trwania

**FR-08:** Kontrola dostępu:

- Nagrania free: dostępne dla wszystkich
- Nagrania premium: tylko dla zalogowanych z rolą premium/admin
- Próba dostępu bez uprawnień → komunikat: "Ta treść jest dostępna tylko dla użytkowników premium. Skontaktuj się z [email], aby uzyskać dostęp."

### 5.3 Autentykacja

**FR-09:** System zaproszeń przez Supabase Dashboard (admin wysyła invite)

**FR-10:** Logowanie przez magic link (Supabase Auth)

**FR-11:** Po kliknięciu magic link → auto login → redirect na stronę główną

**FR-12:** Opcjonalnie: Google OAuth jako alternatywa

**FR-13:** Minimalne dane użytkownika:

- Email (wymagany)
- Imię/nick (opcjonalne)
- Rola (admin/premium/free)

### 5.4 Zarządzanie Treścią (Admin)

**FR-14:** Upload przez Supabase Storage Dashboard:

- Plik wideo (MP4 recommended)
- Miniaturka (JPG/PNG)

**FR-15:** Tabela `videos` w Supabase z polami:

- `id` (UUID, primary key)
- `title` (string)
- `description` (text)
- `category` (enum: yoga, mobility, calisthenics)
- `level` (enum: beginner, intermediate, advanced)
- `duration` (integer, seconds)
- `video_url` (string, Supabase Storage path)
- `thumbnail_url` (string, Supabase Storage path)
- `is_premium` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**FR-16:** Edycja metadanych przez Supabase Dashboard (SQL Editor lub Table Editor)

**FR-17:** Zarządzanie rolami użytkowników przez Supabase Auth Dashboard (user metadata: `role`)

### 5.5 Security & Permissions

**FR-18:** Row Level Security (RLS) policies w Supabase:

- **Videos (SELECT):**
  - Everyone: `is_premium = false`
  - Authenticated + (premium OR admin): `is_premium = true`
- **Videos (INSERT/UPDATE/DELETE):** Only admin role
- **Storage (Videos):**
  - Read: public for free content, authenticated for premium
  - Write: admin only

**FR-19:** Frontend route guards:

- `/video/[id]` sprawdza uprawnienia przed renderowaniem playera
- Nielegalne żądania → error message

### 5.6 Error Handling

**FR-20:** Strona 404 dla nieistniejących tras/nagrań

**FR-21:** Toast notifications dla akcji użytkownika (np. Sonner):

- Login success
- Brak uprawnień
- Błąd ładowania wideo

**FR-22:** Loading states:

- Skeleton loader dla grid podczas ładowania
- Spinner dla video player
- Loading overlay dla operacji auth

---

## 6. Technical Architecture

### 6.1 Frontend Structure (Astro)

```
src/
├── pages/
│   ├── index.astro          # Strona główna z gridem
│   ├── video/
│   │   └── [id].astro       # Strona szczegółów nagrania
│   ├── login.astro          # Strona logowania (optional)
│   └── 404.astro            # Error page
├── components/
│   ├── Navbar.astro         # Nawigacja
│   ├── VideoCard.tsx        # React: karta nagrania
│   ├── VideoGrid.tsx        # React: grid z filtrowaniem
│   ├── VideoPlayer.tsx      # React: odtwarzacz
│   ├── CategoryFilter.tsx   # React: buttony filtrów
│   └── AuthButton.tsx       # React: login/logout
├── lib/
│   ├── supabase.ts          # Supabase client setup
│   ├── auth.ts              # Auth helpers
│   └── types.ts             # TypeScript types
└── layouts/
    └── Layout.astro         # Base layout
```

### 6.2 Database Schema (Supabase)

**Table: videos**

```sql
CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('yoga', 'mobility', 'calisthenics')),
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  duration INTEGER NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_videos_category ON videos(category);
CREATE INDEX idx_videos_is_premium ON videos(is_premium);
```

**User Metadata (Supabase Auth)**

```json
{
  "role": "free" | "premium" | "admin",
  "display_name": "string (optional)"
}
```

**Storage Buckets:**

- `videos` - dla plików wideo
- `thumbnails` - dla miniaturek

### 6.3 Supabase RLS Policies

```sql
-- SELECT policy for videos
CREATE POLICY "Public videos are viewable by everyone"
ON videos FOR SELECT
USING (is_premium = false);

CREATE POLICY "Premium videos for authenticated premium/admin users"
ON videos FOR SELECT
USING (
  is_premium = true
  AND auth.uid() IS NOT NULL
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'premium'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
);

-- Admin-only mutations
CREATE POLICY "Only admins can insert videos"
ON videos FOR INSERT
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Only admins can update videos"
ON videos FOR UPDATE
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Only admins can delete videos"
ON videos FOR DELETE
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
```

### 6.4 Key Dependencies

```json
{
  "dependencies": {
    "astro": "^4.x",
    "react": "^18.x",
    "@astrojs/react": "^3.x",
    "@supabase/supabase-js": "^2.x",
    "video.js": "^8.x" (lub "plyr": "^3.x"),
    "tailwindcss": "^3.x",
    "typescript": "^5.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/video.js": "^7.x"
  }
}
```

---

## 7. User Flows

### 7.1 Flow: Nowy Użytkownik Free

1. User wchodzi na stronę (bez logowania)
2. Widzi grid z nagraaniami (free + premium z blur)
3. Klika na darmowe nagranie
4. → `/video/[id]` - ogląda treść
5. Próbuje kliknąć premium → widzi komunikat o kontakcie
6. Decyduje się na premium → kontakt z adminem
7. Admin wysyła zaproszenie przez Supabase
8. User klika link w emailu → tworzy konto
9. Auto-login → redirect na `/`
10. Teraz widzi odblokowane premium content

### 7.2 Flow: Użytkownik Premium Wraca

1. User wchodzi na stronę
2. Klika "Login" w navbar
3. Wpisuje email → otrzymuje magic link
4. Klika link → auto-login
5. Redirect na `/` z odblokowanymi treściami
6. Filtruje po kategorii (np. Yoga)
7. Klika nagranie → ogląda
8. Wraca na home (logo w navbar)
9. Klika avatar → logout

### 7.3 Flow: Admin Upload Nowego Nagrania

1. Admin loguje się do Supabase Dashboard
2. Idzie do Storage → bucket `videos`
3. Uploaduje plik wideo
4. Kopiuje public URL
5. Idzie do Storage → bucket `thumbnails`
6. Uploaduje miniaturkę
7. Kopiuje public URL
8. Idzie do Table Editor → `videos`
9. Dodaje nowy rekord:
   - title, description, category, level
   - duration (ręcznie wpisany)
   - video_url, thumbnail_url (skopiowane)
   - is_premium (true/false)
10. Save → nagranie pojawia się na stronie

---

## 8. Non-Functional Requirements

### 8.1 Performance

- **NFR-01:** Strona główna ładuje się < 3s (good 3G)
- **NFR-02:** Video streaming start < 2s
- **NFR-03:** Obrazki (miniatury) optimized (WebP, lazy loading)

### 8.2 Accessibility

- **NFR-04:** Semantic HTML (Astro default)
- **NFR-05:** Keyboard navigation dla video player
- **NFR-06:** Alt texts dla miniaturek

### 8.3 Responsiveness

- **NFR-07:** Mobile-first design
- **NFR-08:** Breakpoints: mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
- **NFR-09:** Video player fullscreen support

### 8.4 Browser Support

- **NFR-10:** Chrome/Edge/Safari/Firefox (ostatnie 2 wersje)
- **NFR-11:** iOS Safari (mobile)

### 8.5 Security

- **NFR-12:** HTTPS only
- **NFR-13:** Supabase RLS enforced
- **NFR-14:** No sensitive data w localStorage (tylko auth tokens)

---

## 9. Design & UI

### 9.1 Color Scheme

- **Primary:** #6366f1 (indigo) - akcje, linki
- **Secondary:** #8b5cf6 (purple) - premium badges
- **Background:** #0f172a (slate-900) - dark theme
- **Surface:** #1e293b (slate-800) - karty
- **Text:** #f1f5f9 (slate-100) - główny tekst
- **Text Secondary:** #94a3b8 (slate-400) - meta info

### 9.2 Typography

- **Font Family:** Inter lub Poppins (Google Fonts)
- **Headings:** Font weight 600-700
- **Body:** Font weight 400
- **Meta:** Font size sm (0.875rem)

### 9.3 Components (daisyUI/shadcn-ui)

- **Button:** Primary (indigo), Secondary (outline)
- **Card:** Rounded, shadow, hover effect
- **Badge:** Small pill shape dla premium/kategorii
- **Toast:** Bottom-right position, auto-dismiss 3s
- **Avatar:** Circular, 2-3 sizes

### 9.4 Spacing

- **Grid gap:** 1.5rem (24px)
- **Card padding:** 1rem (16px)
- **Section padding:** 2-4rem (32-64px)

---

## 10. Timeline & Milestones

**Assumptions:** 2-3h/dzień, 5 dni/tydzień = ~30-45h total

### Week 1: Foundation (12-15h)

- **Day 1-2 (4-6h):** Setup
  - Init Astro project + TypeScript + Tailwind
  - Setup Supabase project
  - Configure auth (magic link)
  - Create database schema + RLS policies
  - Setup storage buckets
- **Day 3-4 (5-6h):** Core UI
  - Layout + Navbar component
  - VideoCard component
  - VideoGrid with static data
  - Responsive styling
- **Day 5 (3h):** Auth Integration
  - Login flow
  - Auth state management
  - Protected routes

### Week 2: Features (15-18h)

- **Day 1-2 (6h):** Video Page
  - Dynamic route `/video/[id]`
  - Video player integration (video.js/Plyr)
  - Speed controls
  - Premium content gating
- **Day 3-4 (6-8h):** Data Integration
  - Connect Supabase to VideoGrid
  - Fetch videos with RLS
  - Category filtering
  - Loading states
- **Day 5 (3-4h):** Admin Workflow
  - Document upload process
  - Test manual video upload
  - User role assignment

### Week 3: Polish & Deploy (12-15h)

- **Day 1-2 (5-6h):** Error Handling & Edge Cases
  - 404 page
  - Error messages
  - Toast notifications
  - Premium access denial UI
- **Day 3 (3-4h):** Testing
  - Test all user flows
  - Mobile responsive check
  - Cross-browser testing
  - Fix bugs
- **Day 4-5 (4-5h):** Deployment
  - Deploy to Bolt.new / VPS OVH
  - Configure env variables
  - Upload test videos (3-4)
  - Create test users (free + premium)
  - Final QA

---

## 11. Success Criteria

### 11.1 Launch Criteria (Must Have)

✅ Użytkownik może zobaczyć wszystkie nagrania na stronie głównej  
✅ Użytkownik może filtrować po kategoriach  
✅ Użytkownik free widzi premium content jako blur z badge  
✅ Użytkownik może zalogować się przez magic link  
✅ Użytkownik premium ma dostęp do premium content  
✅ Video player działa z kontrolą prędkości  
✅ Strona jest responsywna (mobile + desktop)  
✅ Admin może uploadować nagrania przez Supabase  
✅ Admin może edytować metadane nagrań

### 11.2 Post-Launch Success (Nice to Have)

- ⭐ 15+ użytkowników zarejestrowanych w miesiąc 1
- ⭐ Każde nagranie obejrzane średnio 5+ razy
- ⭐ 0 critical bugs w miesiąc 1
- ⭐ Pozytywny feedback od minimum 3 użytkowników

---

## 12. Out of Scope (Future Iterations)

Poniższe funkcjonalności **NIE** będą implementowane w MVP:

❌ **Płatności online** - manual upgrade tylko  
❌ **System powiadomień email** - ręczne komunikaty  
❌ **Wyszukiwanie tekstowe** - tylko filtrowanie kategorii  
❌ **Komentarze/polubienia** - brak interakcji społecznościowych  
❌ **Śledzenie postępów** - brak "Continue Watching" / completed tracking  
❌ **Kompresja wideo serverless** - upload pre-compressed lokalnie  
❌ **Dark mode toggle** - tylko jeden schemat (dark)  
❌ **Metryki analytics** - podstawowe tylko (opcjonalnie Supabase Analytics)  
❌ **Multi-language** - tylko polski  
❌ **Playlists/Collections** - pojedyncze nagrania tylko  
❌ **Download option** - streaming only  
❌ **Certyfikaty po ukończeniu** - brak gamification  
❌ **Live streaming** - tylko pre-recorded

---

## 13. Risks & Mitigations

| Risk                                                  | Impact | Probability | Mitigation                                              |
| ----------------------------------------------------- | ------ | ----------- | ------------------------------------------------------- |
| Supabase free tier limits przekroczone                | High   | Low         | Monitor usage, upgrade plan jeśli potrzeba (~$25/m)     |
| Brak czasu na completion w 3 tygodnie                 | High   | Medium      | Priorytetyzacja core features, cut scope jeśli potrzeba |
| Video upload > 50MB slow na słabym internecie         | Medium | Medium      | Kompresja lokalna przed uploadem (Handbrake)            |
| RLS policies błędnie skonfigurowane (security breach) | High   | Low         | Testowanie z różnymi rolami, code review                |
| Browser compatibility issues z video player           | Medium | Low         | Używaj battle-tested library (video.js/Plyr)            |
| User confusion z magic link (nie znajdują emaila)     | Medium | Medium      | Clear instructions, check spam folder reminder          |

---

## 14. Dependencies & Assumptions

### 14.1 External Dependencies

- Supabase (99.9% uptime SLA)
- Vercel/Netlify/Bolt hosting (free tier limits)
- Email delivery dla magic links (Supabase SMTP)

### 14.2 Assumptions

- Użytkownicy mają stabilne połączenie (min. 3G) do streamingu
- Admin ma dostęp do narzędzi kompresji wideo (Handbrake/FFmpeg)
- Użytkownicy rozumieją email-based authentication
- ~20 użytkowników nie przekroczy Supabase free tier (500MB storage, 2GB transfer/month)

---

## 15. Glossary

- **POC (Proof of Concept):** Wstępna wersja produktu do walidacji konceptu
- **MVP (Minimum Viable Product):** Minimalna wersja z podstawowymi funkcjami
- **RLS (Row Level Security):** Supabase feature do kontroli dostępu na poziomie wierszy
- **Magic Link:** Bezhasłowe logowanie przez link w emailu
- **Freemium:** Model biznesowy z darmową podstawą i płatnymi dodatkami
- **SSR (Server-Side Rendering):** Renderowanie po stronie serwera (Astro capability)
- **CDN (Content Delivery Network):** Sieć dystrybucji treści (Supabase Storage ma wbudowane)

---

## 16. Appendix

### 16.1 Useful Links

- Astro Docs: https://docs.astro.build
- Supabase Docs: https://supabase.com/docs
- Video.js: https://videojs.com
- Plyr: https://plyr.io
- Tailwind CSS: https://tailwindcss.com
- daisyUI: https://daisyui.com

### 16.2 Example Video Metadata

```json
{
  "title": "Poranna Yoga Flow - 15 min",
  "description": "Łagodna praktyka poranna na rozbudzenie ciała. Idealna dla początkujących.",
  "category": "yoga",
  "level": "beginner",
  "duration": 900,
  "is_premium": false,
  "video_url": "https://[project].supabase.co/storage/v1/object/public/videos/morning-yoga-flow.mp4",
  "thumbnail_url": "https://[project].supabase.co/storage/v1/object/public/thumbnails/morning-yoga-flow.jpg"
}
```

---

**Koniec dokumentu PRD v1.0**

---

## Następne Kroki

1. **Review & Approval:** Przejrzyj dokument i potwierdź wszystkie wymagania
2. **Setup Environment:** Stwórz Supabase project + Astro repo
3. **Start Week 1:** Begin z foundation tasks
4. **Weekly Check-ins:** Review postępu co tydzień vs. timeline
