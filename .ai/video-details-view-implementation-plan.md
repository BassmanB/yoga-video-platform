# Plan implementacji widoku szczegółów nagrania

## 1. Przegląd

Widok szczegółów nagrania (`/video/[id]`) umożliwia użytkownikom odtwarzanie wybranego nagrania wideo wraz z pełną kontrolą odtwarzacza oraz wyświetleniem szczegółowych informacji o treści. Widok implementuje kontrolę dostępu do treści premium, zapewniając optymalną obsługę zarówno treści darmowych jak i płatnych poprzez wykorzystanie Supabase Storage z podpisanymi URL-ami.

**Główne funkcjonalności:**

- Odtwarzanie wideo z pełną kontrolą (play/pause, seek, volume, fullscreen, speed control)
- Wyświetlanie metadanych nagrania (tytuł, kategoria, poziom, czas trwania, opis)
- Kontrola dostępu premium z wyświetlaniem odpowiedniego komunikatu dla nieuprawnionych użytkowników
- Nawigacja powrotna do strony głównej
- Obsługa stanów ładowania, błędów i edge cases

## 2. Routing widoku

**Ścieżka:** `/video/[id]`

**Struktura plików:**

- Plik Astro: `src/pages/video/[id].astro`
- Parametr dynamiczny: `id` (UUID nagrania)

**Przykłady URL:**

- `/video/550e8400-e29b-41d4-a716-446655440000`
- `/video/660e8400-e29b-41d4-a716-446655440001`

## 3. Struktura komponentów

```
[id].astro (Astro Page - SSR)
├── Layout.astro
│   └── Navbar (existing component)
├── BackButton.tsx (React)
├── VideoPlayerContainer.tsx (React - main orchestrator)
│   ├── VideoPlayerSkeleton.tsx (loading state)
│   ├── VideoPlayer.tsx (Plyr wrapper)
│   ├── VideoPlayerError.tsx (error state)
│   └── PremiumGate.tsx (access denied overlay)
├── VideoDetails.tsx (React)
│   ├── VideoHeader.tsx
│   ├── VideoDescription.tsx
│   └── RelatedVideos.tsx (optional - future)
└── Toast notifications (Sonner - existing)
```

**Diagram zależności:**

```
[id].astro
    ↓
VideoPlayerContainer (state orchestrator)
    ↓ (conditional rendering based on state)
    ├─→ VideoPlayerSkeleton (loading)
    ├─→ VideoPlayer (success + hasAccess)
    ├─→ PremiumGate (success + !hasAccess)
    └─→ VideoPlayerError (error)

VideoDetails (always rendered with video data)
```

## 4. Szczegóły komponentów

### 4.1 BackButton.tsx

**Opis:**
Komponent nawigacyjny umożliwiający powrót do poprzedniej strony lub strony głównej. Wyświetla ikonę strzałki z tekstem "Powrót".

**Główne elementy:**

- `<button>` z klasami Tailwind dla stylizacji
- Ikona strzałki w lewo (z biblioteki `lucide-react`)
- Tekst "Powrót"

**Obsługiwane zdarzenia:**

- `onClick`: Wywołuje `window.history.back()` lub w przypadku braku historii przekierowuje na `/` używając `window.location.href = '/'`

**Warunki walidacji:**

- Brak walidacji - komponent czysto prezentacyjny

**Typy:**

- Brak dodatkowych typów - komponent nie przyjmuje props

**Props (interfejs komponentu):**

```typescript
interface BackButtonProps {
  // Opcjonalny className dla dodatkowych styli
  className?: string;
}
```

---

### 4.2 VideoPlayerContainer.tsx

**Opis:**
Główny komponent orkiestrujący całą logikę widoku odtwarzacza. Zarządza stanem ładowania, pobiera dane nagrania z API, sprawdza uprawnienia dostępu, generuje URL do pliku wideo i renderuje odpowiedni podkomponent w zależności od stanu.

**Główne elementy:**

- Container `<div>` z max-width i centrowaniem
- Warunkowe renderowanie podkomponentów:
  - `VideoPlayerSkeleton` gdy `isLoading === true`
  - `PremiumGate` gdy `!hasAccess && video !== null`
  - `VideoPlayer` gdy `hasAccess && videoUrl !== null`
  - `VideoPlayerError` gdy `error !== null`

**Obsługiwane zdarzenia:**

- `useEffect` do pobrania danych nagrania przy montowaniu
- `useEffect` do wygenerowania URL wideo po pobraniu danych
- Retry action z `VideoPlayerError` - ponowne wywołanie fetch

**Warunki walidacji:**

- Walidacja UUID parametru `id` przed fetchem API
- Sprawdzenie czy użytkownik ma dostęp do premium content: `canAccessVideo(video, userRole)`
- Timeout 10s dla operacji fetch - jeśli przekroczony, wyświetl błąd timeout

**Typy:**

- `Video` - z `src/types.ts`
- `VideoPlayerState` - custom ViewModel (patrz sekcja 5)
- `ErrorResponse` - z `src/types.ts`
- `UserRole` - z `src/types.ts`

**Props (interfejs komponentu):**

```typescript
interface VideoPlayerContainerProps {
  videoId: string; // UUID przekazany z Astro
  userRole: UserRole | null; // Rola użytkownika z sesji (może być null dla niezalogowanych)
}
```

---

### 4.3 VideoPlayerSkeleton.tsx

**Opis:**
Komponent wyświetlający skeleton loader podczas ładowania danych nagrania. Zajmuje przestrzeń odtwarzacza z zachowaniem aspect ratio 16:9.

**Główne elementy:**

- `<div>` z klasą aspect ratio 16:9
- Pulsujący gradient (Tailwind `animate-pulse`, `bg-slate-700`)
- Ikona play w centrum (opcjonalnie)

**Obsługiwane zdarzenia:**

- Brak - komponent czysto prezentacyjny

**Warunki walidacji:**

- Brak

**Typy:**

- Brak

**Props (interfejs komponentu):**

```typescript
interface VideoPlayerSkeletonProps {
  className?: string;
}
```

---

### 4.4 VideoPlayer.tsx

**Opis:**
Wrapper dla biblioteki Plyr implementujący odtwarzacz wideo z pełną kontrolą. Obsługuje różne źródła wideo (public URL dla free content, signed URL dla premium), stany buffering, błędy playback.

**Główne elementy:**

- `<video>` element HTML5 z atrybutem `controls`
- Inicjalizacja Plyr w `useEffect` po montowaniu
- Konfiguracja Plyr controls (play/pause, progress, volume, fullscreen, speed)
- Loading spinner podczas buffering
- Error overlay w przypadku błędu playback

**Obsługiwane zdarzenia:**

- `onReady`: Plyr player gotowy do odtwarzania
- `onError`: Błąd podczas ładowania/odtwarzania wideo
- `onPlay`, `onPause`: Śledzenie stanu odtwarzania (opcjonalnie dla analytics)
- Cleanup w `useEffect` return - destroy Plyr instance

**Warunki walidacji:**

- Sprawdzenie czy `videoUrl` jest prawidłowym URL przed montowaniem playera
- Timeout 10s dla ładowania wideo - jeśli przekroczony, wyświetl komunikat

**Typy:**

- `PlyrOptions` - z biblioteki `plyr`
- `PlyrInstance` - z biblioteki `plyr`

**Props (interfejs komponentu):**

```typescript
interface VideoPlayerProps {
  videoUrl: string; // Pełny URL do pliku wideo (public lub signed)
  title: string; // Tytuł dla accessibility
  onError?: (error: Error) => void; // Callback w przypadku błędu
  className?: string;
}
```

---

### 4.5 VideoPlayerError.tsx

**Opis:**
Komponent wyświetlający komunikat błędu w przypadku problemów z załadowaniem nagrania. Oferuje możliwość ponowienia próby (retry).

**Główne elementy:**

- Container z ikoną błędu
- Komunikat błędu (dostosowany do typu błędu)
- Przycisk "Spróbuj ponownie"
- Przycisk "Powrót do strony głównej" (secondary)

**Obsługiwane zdarzenia:**

- `onClick` na przycisku retry - wywołanie `onRetry` callback
- `onClick` na przycisku home - przekierowanie na `/`

**Warunki walidacji:**

- Brak

**Typy:**

- `VideoErrorType` - custom enum (patrz sekcja 5)

**Props (interfejs komponentu):**

```typescript
interface VideoPlayerErrorProps {
  error: VideoErrorType;
  message?: string; // Opcjonalny niestandardowy komunikat
  onRetry: () => void; // Callback dla retry action
  className?: string;
}
```

---

### 4.6 PremiumGate.tsx

**Opis:**
Komponent overlay wyświetlany gdy użytkownik próbuje uzyskać dostęp do premium content bez odpowiednich uprawnień. Pokazuje rozmytą miniaturkę, informacje o nagraniu i CTA do kontaktu z adminem.

**Główne elementy:**

- Fullscreen overlay z `backdrop-blur-md`
- Centred card (`max-w-lg`)
- Rozmyta miniaturka nagrania (blur filter CSS)
- Ikona kłódki
- Tytuł nagrania
- Skrócony opis (pierwsze 150 znaków)
- Komunikat: "Ta treść jest dostępna tylko dla użytkowników premium"
- Przycisk CTA z mailto link: "Skontaktuj się aby uzyskać dostęp"
- Przycisk secondary: "Powrót do strony głównej"

**Obsługiwane zdarzenia:**

- `onClick` na backdrop - zamknięcie overlay (opcjonalnie)
- `onKeyDown` - zamknięcie na ESC key
- `onClick` na CTA button - otwarcie emaila
- `onClick` na home button - przekierowanie na `/`

**Warunki walidacji:**

- Brak

**Typy:**

- `Video` - z `src/types.ts`

**Props (interfejs komponentu):**

```typescript
interface PremiumGateProps {
  video: Video; // Dane nagrania dla wyświetlenia podstawowych info
  contactEmail: string; // Email do kontaktu (z konfiguracji)
  onDismiss?: () => void; // Opcjonalny callback przy zamknięciu
  className?: string;
}
```

---

### 4.7 VideoDetails.tsx

**Opis:**
Komponent wyświetlający szczegółowe informacje o nagraniu poniżej odtwarzacza. Składa się z sekcji nagłówkowej z metadanymi oraz rozwijalnego opisu.

**Główne elementy:**

- Container `<div>` ze stack layout (flex column)
- `VideoHeader` - nagłówek z tytułem i metadanymi
- `VideoDescription` - pełny opis (z opcją expand jeśli długi)
- `RelatedVideos` (optional, future) - powiązane nagrania

**Obsługiwane zdarzenia:**

- Brak - deleguje obsługę do subkomponentów

**Warunki walidacji:**

- Brak

**Typy:**

- `Video` - z `src/types.ts`

**Props (interfejs komponentu):**

```typescript
interface VideoDetailsProps {
  video: Video;
  className?: string;
}
```

---

### 4.8 VideoHeader.tsx

**Opis:**
Subkomponent `VideoDetails` wyświetlający tytuł nagrania oraz metadane w formie badges (kategoria, poziom, czas trwania).

**Główne elementy:**

- `<h1>` z tytułem nagrania (`text-3xl md:text-4xl font-bold`)
- Flex row z badges:
  - Badge kategoria (z kolorowym tłem według kategorii)
  - Badge poziom trudności
  - Badge czas trwania (sformatowany jako MM:SS)

**Obsługiwane zdarzenia:**

- Brak

**Warunki walidacji:**

- Brak

**Typy:**

- `Video` - z `src/types.ts`
- `FormattedDuration` - helper type (patrz sekcja 5)

**Props (interfejs komponentu):**

```typescript
interface VideoHeaderProps {
  title: string;
  category: VideoCategory;
  level: VideoLevel;
  duration: number; // w sekundach
  className?: string;
}
```

---

### 4.9 VideoDescription.tsx

**Opis:**
Subkomponent `VideoDetails` wyświetlający pełny opis nagrania z funkcją rozwijania jeśli tekst jest długi (>300px wysokości).

**Główne elementy:**

- `<div>` z tekstem opisu (`text-base text-slate-300 leading-relaxed`)
- Przycisk "Rozwiń" / "Zwiń" (conditional, jeśli opis przekracza wysokość)
- Gradient fade-out na końcu tekstu (gdy zwinięty)

**Obsługiwane zdarzenia:**

- `onClick` na przycisku expand/collapse - toggle stan `isExpanded`
- `useRef` + `useEffect` do pomiaru wysokości contentu

**Warunki walidacji:**

- Brak

**Typy:**

- Brak dodatkowych typów

**Props (interfejs komponentu):**

```typescript
interface VideoDescriptionProps {
  description: string | null;
  className?: string;
}
```

---

## 5. Typy

### 5.1 Istniejące typy (z src/types.ts)

Wykorzystywane bezpośrednio z `src/types.ts`:

```typescript
// Importowane z src/types.ts
import type { Video, VideoCategory, VideoLevel, VideoStatus, UserRole, VideoResponse, ErrorResponse } from "@/types";
```

### 5.2 Nowe typy ViewModel

#### VideoPlayerState

Stan zarządzający całym cyklem życia widoku odtwarzacza.

```typescript
/**
 * Stan widoku odtwarzacza wideo
 */
interface VideoPlayerState {
  // Dane nagrania
  video: Video | null;

  // URL do odtwarzania (public lub signed)
  videoUrl: string | null;

  // Stany ładowania
  isLoading: boolean;
  isLoadingUrl: boolean;

  // Stan błędu
  error: VideoError | null;

  // Stan dostępu
  hasAccess: boolean;
}
```

#### VideoError

Szczegółowy opis błędu dla lepszej obsługi UX.

```typescript
/**
 * Typ błędu odtwarzacza
 */
type VideoErrorType =
  | "NOT_FOUND" // Nagranie nie istnieje lub brak dostępu (404)
  | "NETWORK_ERROR" // Błąd sieci podczas fetch
  | "TIMEOUT" // Przekroczenie timeout (10s)
  | "PLAYBACK_ERROR" // Błąd podczas odtwarzania wideo
  | "INVALID_URL" // Nieprawidłowy URL wideo
  | "UNKNOWN"; // Nieznany błąd

/**
 * Obiekt błędu wideo
 */
interface VideoError {
  type: VideoErrorType;
  message: string;
  details?: unknown;
}
```

#### FormattedDuration

Helper type dla sformatowanego czasu trwania.

```typescript
/**
 * Sformatowany czas trwania
 */
interface FormattedDuration {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string; // np. "15:30" lub "1:15:30"
}
```

#### AccessCheckResult

Wynik sprawdzenia uprawnień dostępu.

```typescript
/**
 * Wynik sprawdzenia dostępu do nagrania
 */
interface AccessCheckResult {
  hasAccess: boolean;
  reason?: "PREMIUM_REQUIRED" | "NOT_PUBLISHED" | "ARCHIVED";
  requiredRole?: UserRole;
}
```

### 5.3 Typy pomocnicze (Utils)

```typescript
/**
 * Konfiguracja Plyr player
 */
interface PlyrConfig {
  controls: string[];
  speed: { selected: number; options: number[] };
  ratio: string;
  loadSprite: boolean;
  i18n: PlyrI18n;
}

/**
 * Polskie tłumaczenia dla Plyr
 */
interface PlyrI18n {
  play: string;
  pause: string;
  // ... pozostałe tłumaczenia
}
```

---

## 6. Zarządzanie stanem

### 6.1 Stan lokalny komponentu

Stan zarządzany jest lokalnie w komponencie `VideoPlayerContainer.tsx` przy użyciu hooków React:

```typescript
const [state, setState] = useState<VideoPlayerState>({
  video: null,
  videoUrl: null,
  isLoading: true,
  isLoadingUrl: false,
  error: null,
  hasAccess: false,
});
```

### 6.2 Custom Hook: useVideoPlayer

**Cel:** Enkapsulacja całej logiki pobierania nagrania, sprawdzania uprawnień i generowania URL.

**Lokalizacja:** `src/hooks/useVideoPlayer.ts`

**Interfejs:**

```typescript
function useVideoPlayer(videoId: string, userRole: UserRole | null) {
  // Wewnętrzna implementacja

  return {
    video: Video | null,
    videoUrl: string | null,
    isLoading: boolean,
    error: VideoError | null,
    hasAccess: boolean,
    retry: () => void,
  };
}
```

**Wewnętrzna logika:**

1. **Initial fetch** - Pobranie danych nagrania z API

   ```typescript
   useEffect(() => {
     fetchVideoData();
   }, [videoId]);
   ```

2. **Access check** - Sprawdzenie uprawnień po pobraniu danych

   ```typescript
   useEffect(() => {
     if (video) {
       const accessResult = canAccessVideo(video, userRole);
       setHasAccess(accessResult.hasAccess);
     }
   }, [video, userRole]);
   ```

3. **URL generation** - Wygenerowanie URL tylko jeśli użytkownik ma dostęp

   ```typescript
   useEffect(() => {
     if (video && hasAccess) {
       generateVideoUrl(video);
     }
   }, [video, hasAccess]);
   ```

4. **Retry mechanism** - Możliwość ponownej próby przy błędzie
   ```typescript
   const retry = useCallback(() => {
     setState((prev) => ({ ...prev, error: null, isLoading: true }));
     fetchVideoData();
   }, [videoId]);
   ```

### 6.3 Stan globalny (Context)

**Opcjonalnie:** Jeśli dane użytkownika (session, role) nie są dostępne z Astro locals, można stworzyć `AuthContext`:

```typescript
// src/contexts/AuthContext.tsx
interface AuthContextValue {
  user: User | null;
  userRole: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

Dla MVP zakładamy, że dane użytkownika są przekazywane z Astro page jako props.

---

## 7. Integracja API

### 7.1 Endpoint GET /api/videos/:id

**Wykorzystywany endpoint:** `GET /api/videos/:id`

**Implementacja:** `src/pages/api/videos/[id].ts`

**Request:**

```typescript
// Typ Request: brak body, tylko URL param
interface GetVideoByIdRequest {
  params: {
    id: string; // UUID
  };
  headers?: {
    Authorization?: string; // Bearer token (opcjonalny)
  };
}
```

**Response Success (200):**

```typescript
// Typ odpowiedzi: VideoResponse z src/types.ts
interface VideoResponse {
  data: Video;
}

// Przykład:
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Poranna Yoga Flow - 15 min",
    "description": "Łagodna praktyka poranna...",
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

**Response Error (404):**

```typescript
// Typ błędu: ErrorResponse z src/types.ts
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

**Response Error (403):**

```typescript
{
  "error": {
    "code": "FORBIDDEN",
    "message": "This content is only available for premium users...",
    "details": {
      "required_role": "premium",
      "current_role": "free",
      "video_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

### 7.2 Funkcja fetchVideoById

**Lokalizacja:** `src/lib/api/videos.ts`

```typescript
/**
 * Pobiera dane nagrania z API
 *
 * @param videoId - UUID nagrania
 * @param supabase - Klient Supabase (dla auth token)
 * @returns Promise z danymi nagrania lub null
 * @throws VideoError w przypadku błędu
 */
async function fetchVideoById(videoId: string, supabase: SupabaseClient): Promise<Video> {
  // Walidacja UUID
  if (!isValidUUID(videoId)) {
    throw new VideoError("INVALID_URL", "Invalid video ID format");
  }

  // Timeout 10s
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`/api/videos/${videoId}`, {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        // Token automatycznie dodawany przez Supabase client
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new VideoError("NOT_FOUND", "Video not found");
      }
      if (response.status === 403) {
        const errorData: ErrorResponse = await response.json();
        throw new VideoError("FORBIDDEN", errorData.error.message);
      }
      throw new VideoError("NETWORK_ERROR", "Failed to fetch video");
    }

    const data: VideoResponse = await response.json();
    return data.data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new VideoError("TIMEOUT", "Request timeout. Please check your connection.");
    }
    throw error;
  }
}
```

### 7.3 Generowanie URL wideo

**Free content:**

```typescript
function getPublicVideoUrl(video: Video, supabase: SupabaseClient): string {
  const bucket = "videos-free";
  const { data } = supabase.storage.from(bucket).getPublicUrl(video.video_url);

  return data.publicUrl;
}
```

**Premium content:**

```typescript
async function getSignedVideoUrl(video: Video, supabase: SupabaseClient): Promise<string> {
  const bucket = "videos-premium";
  const expiresIn = 3600; // 1 godzina

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(video.video_url, expiresIn);

  if (error) {
    throw new VideoError("INVALID_URL", "Failed to generate video URL");
  }

  return data.signedUrl;
}
```

**Wrapper function:**

```typescript
async function generateVideoUrl(video: Video, supabase: SupabaseClient): Promise<string> {
  if (video.is_premium) {
    return await getSignedVideoUrl(video, supabase);
  }
  return getPublicVideoUrl(video, supabase);
}
```

---

## 8. Interakcje użytkownika

### 8.1 Nawigacja do widoku

**Źródło:** Kliknięcie na kartę nagrania na stronie głównej

**Akcja:**

1. Router Astro przechodzi do `/video/[id]`
2. SSR renderuje stronę z przekazanym `videoId`
3. Komponent `VideoPlayerContainer` montuje się i rozpoczyna fetch

**Oczekiwany wynik:**

- URL zmienia się na `/video/[id]`
- Wyświetla się skeleton loader
- Po załadowaniu danych pojawia się odtwarzacz lub PremiumGate

### 8.2 Odtwarzanie wideo

**Trigger:** Użytkownik klika play na odtwarzaczu

**Akcja:**

1. Plyr rozpoczyna buffering wideo
2. Wyświetla się wskaźnik buffering
3. Video zaczyna się odtwarzać

**Oczekiwany wynik:**

- Wideo odtwarza się płynnie
- Kontrolki playera są responsywne
- Użytkownik może kontrolować playback (pause, seek, volume)

### 8.3 Zmiana prędkości odtwarzania

**Trigger:** Użytkownik wybiera inną prędkość z menu Plyr

**Akcja:**

1. Plyr zmienia `playbackRate` elementu `<video>`
2. Odtwarzanie kontynuuje się z nową prędkością

**Oczekiwany wynik:**

- Prędkość zmienia się natychmiastowo
- Dostępne opcje: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- Wybrana prędkość jest zaznaczona w menu

### 8.4 Próba dostępu do premium content (użytkownik free)

**Trigger:** Użytkownik free lub niezalogowany wchodzi na URL premium nagrania

**Akcja:**

1. `useVideoPlayer` wykonuje fetch `/api/videos/:id`
2. API zwraca 404 (z powodu RLS)
3. Hook ustawia `hasAccess = false`
4. Komponent renderuje `PremiumGate` overlay

**Oczekiwany wynik:**

- Wyświetla się overlay z rozmytą miniaturką
- Komunikat: "Ta treść jest dostępna tylko dla użytkowników premium"
- Przycisk CTA do kontaktu z adminem
- Przycisk powrotu do strony głównej

### 8.5 Kliknięcie "Spróbuj ponownie" po błędzie

**Trigger:** Błąd ładowania → użytkownik klika retry button

**Akcja:**

1. Wywołanie funkcji `retry()` z hooka
2. Reset stanu błędu
3. Ponowne wywołanie `fetchVideoData()`

**Oczekiwany wynik:**

- Skeleton loader pojawia się ponownie
- Próba ponownego pobrania danych
- W przypadku sukcesu - wyświetlenie odtwarzacza
- W przypadku kolejnego błędu - ponownie komunikat błędu

### 8.6 Powrót do strony głównej

**Trigger:** Kliknięcie przycisku "Powrót" lub logo w navbar

**Akcja:**

1. `BackButton`: wywołanie `window.history.back()` lub redirect na `/`
2. Router przechodzi do strony głównej

**Oczekiwany wynik:**

- Użytkownik wraca do poprzedniej strony lub strony głównej
- Odtwarzanie wideo zostaje zatrzymane (unmount komponentu)

### 8.7 Fullscreen

**Trigger:** Użytkownik klika ikonę fullscreen w Plyr

**Akcja:**

1. Plyr wywołuje Fullscreen API
2. Player zajmuje cały ekran

**Oczekiwany wynik:**

- Video player w trybie fullscreen
- Kontrolki nadal dostępne
- ESC lub ponowne kliknięcie ikony wychodzi z fullscreen

---

## 9. Warunki i walidacja

### 9.1 Walidacja UUID w parametrze URL

**Komponent:** `VideoPlayerContainer.tsx` (w hooku `useVideoPlayer`)

**Warunek:** Parametr `videoId` musi być prawidłowym UUID v4

**Implementacja:**

```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}
```

**Wpływ na UI:**

- Jeśli UUID nieprawidłowy → natychmiastowy błąd `INVALID_URL`
- Wyświetlenie `VideoPlayerError` z komunikatem "Nieprawidłowy adres nagrania"

### 9.2 Sprawdzenie uprawnień dostępu

**Komponent:** `VideoPlayerContainer.tsx` (funkcja `canAccessVideo`)

**Warunki:**

```typescript
function canAccessVideo(video: Video, userRole: UserRole | null): AccessCheckResult {
  // 1. Nagranie musi być opublikowane (status = 'published')
  //    Wyjątek: admin widzi wszystkie statusy
  if (video.status !== "published" && userRole !== "admin") {
    return {
      hasAccess: false,
      reason: video.status === "archived" ? "ARCHIVED" : "NOT_PUBLISHED",
    };
  }

  // 2. Jeśli nagranie free → wszyscy mają dostęp
  if (!video.is_premium) {
    return { hasAccess: true };
  }

  // 3. Jeśli nagranie premium → wymagana rola premium lub admin
  if (userRole === "premium" || userRole === "admin") {
    return { hasAccess: true };
  }

  // 4. Brak dostępu do premium content
  return {
    hasAccess: false,
    reason: "PREMIUM_REQUIRED",
    requiredRole: "premium",
  };
}
```

**Wpływ na UI:**

- `hasAccess = true` → renderowanie `VideoPlayer`
- `hasAccess = false` + `reason = 'PREMIUM_REQUIRED'` → renderowanie `PremiumGate`
- `hasAccess = false` + `reason = 'ARCHIVED' | 'NOT_PUBLISHED'` → `VideoPlayerError` z komunikatem "Nagranie niedostępne"

### 9.3 Walidacja URL wideo przed montowaniem playera

**Komponent:** `VideoPlayer.tsx`

**Warunek:** `videoUrl` musi być prawidłowym HTTP(S) URL

**Implementacja:**

```typescript
function isValidVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

useEffect(() => {
  if (!isValidVideoUrl(videoUrl)) {
    onError?.(new Error("Invalid video URL"));
    return;
  }

  // Inicjalizacja Plyr
}, [videoUrl]);
```

**Wpływ na UI:**

- Jeśli URL nieprawidłowy → wywołanie `onError` callback
- Parent component (`VideoPlayerContainer`) wyświetli `VideoPlayerError`

### 9.4 Timeout dla operacji fetch i ładowania wideo

**Komponent:** `useVideoPlayer` hook + `VideoPlayer.tsx`

**Warunek:** Operacje nie mogą trwać dłużej niż 10 sekund

**Implementacja fetch timeout:**

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

fetch(url, { signal: controller.signal })
  .then(...)
  .catch(error => {
    if (error.name === 'AbortError') {
      throw new VideoError('TIMEOUT', 'Request timeout');
    }
  })
  .finally(() => clearTimeout(timeoutId));
```

**Implementacja video loading timeout:**

```typescript
useEffect(() => {
  const player = plyrRef.current;
  const timeoutId = setTimeout(() => {
    if (!player?.playing) {
      onError?.(new Error("Video loading timeout"));
    }
  }, 10000);

  player?.on("playing", () => clearTimeout(timeoutId));

  return () => clearTimeout(timeoutId);
}, []);
```

**Wpływ na UI:**

- Po 10s bez odpowiedzi → `VideoPlayerError` z komunikatem "Sprawdź połączenie internetowe"
- Przycisk retry umożliwia ponowną próbę

### 9.5 Walidacja długości opisu w VideoDescription

**Komponent:** `VideoDescription.tsx`

**Warunek:** Jeśli wysokość contentu > 300px → pokaż przycisk "Rozwiń"

**Implementacja:**

```typescript
const descriptionRef = useRef<HTMLDivElement>(null);
const [showExpandButton, setShowExpandButton] = useState(false);
const [isExpanded, setIsExpanded] = useState(false);

useEffect(() => {
  if (descriptionRef.current) {
    const height = descriptionRef.current.scrollHeight;
    setShowExpandButton(height > 300);
  }
}, [description]);
```

**Wpływ na UI:**

- `height <= 300px` → pełny opis bez przycisku
- `height > 300px` → opis obcięty z gradient fade + przycisk "Rozwiń"
- Po kliknięciu → pełny opis + przycisk "Zwiń"

---

## 10. Obsługa błędów

### 10.1 Nagranie nie znalezione (404)

**Przyczyna:**

- UUID nie istnieje w bazie danych
- Użytkownik nie ma uprawnień (RLS zwraca 404 dla bezpieczeństwa)

**Obsługa:**

```typescript
if (response.status === 404) {
  setState({
    ...initialState,
    isLoading: false,
    error: {
      type: "NOT_FOUND",
      message: "Nagranie nie zostało znalezione lub nie masz do niego dostępu.",
    },
  });
}
```

**UI:**

- Wyświetlenie `VideoPlayerError`
- Komunikat: "Nagranie nie zostało znalezione"
- Przyciski: "Powrót do strony głównej" (primary), "Spróbuj ponownie" (secondary)

### 10.2 Błąd sieci / timeout

**Przyczyna:**

- Brak połączenia internetowego
- Serwer nie odpowiada
- Timeout 10s przekroczony

**Obsługa:**

```typescript
catch (error) {
  if (error.name === 'AbortError') {
    setState({
      ...state,
      isLoading: false,
      error: {
        type: 'TIMEOUT',
        message: 'Nie udało się załadować nagrania. Sprawdź połączenie internetowe.'
      }
    });
  } else {
    setState({
      ...state,
      isLoading: false,
      error: {
        type: 'NETWORK_ERROR',
        message: 'Wystąpił błąd połączenia. Spróbuj ponownie.'
      }
    });
  }
}
```

**UI:**

- Wyświetlenie `VideoPlayerError`
- Komunikat dostosowany do typu błędu
- Przycisk "Spróbuj ponownie" (primary)

### 10.3 Błąd odtwarzania wideo (Plyr error)

**Przyczyna:**

- Plik wideo uszkodzony
- Format nieobsługiwany
- Signed URL wygasł

**Obsługa:**

```typescript
// W VideoPlayer.tsx
useEffect(() => {
  const player = new Plyr(videoRef.current, config);

  player.on("error", (event) => {
    const error = event.detail?.plyr?.error;
    onError?.(new Error(`Video playback error: ${error?.message || "Unknown"}`));
  });

  return () => player.destroy();
}, []);
```

**UI:**

- Wyświetlenie `VideoPlayerError` wewnątrz ramki playera
- Komunikat: "Nie udało się odtworzyć wideo"
- Przyciski: "Spróbuj ponownie", "Zgłoś problem" (mailto link)

### 10.4 Brak dostępu do premium content

**Przyczyna:**

- Użytkownik free próbuje otworzyć premium nagranie
- Użytkownik niezalogowany próbuje otworzyć premium nagranie

**Obsługa:**

```typescript
// Po pobraniu video
const accessResult = canAccessVideo(video, userRole);
if (!accessResult.hasAccess && accessResult.reason === "PREMIUM_REQUIRED") {
  setState({
    ...state,
    video,
    hasAccess: false,
    isLoading: false,
  });
  // Renderowanie PremiumGate zamiast VideoPlayer
}
```

**UI:**

- Wyświetlenie `PremiumGate` overlay
- Komunikat wyjaśniający wymagania
- CTA do kontaktu z adminem
- Możliwość powrotu do strony głównej

### 10.5 Nieprawidłowy UUID w URL

**Przyczyna:**

- Użytkownik wpisał lub zmodyfikował URL ręcznie
- Błędny link zewnętrzny

**Obsługa:**

```typescript
// Przed wykonaniem fetch
if (!isValidUUID(videoId)) {
  setState({
    ...initialState,
    isLoading: false,
    error: {
      type: "INVALID_URL",
      message: "Nieprawidłowy adres nagrania.",
    },
  });
  return; // Nie wykonuj fetch
}
```

**UI:**

- Wyświetlenie `VideoPlayerError`
- Komunikat: "Nieprawidłowy adres nagrania"
- Przycisk: "Powrót do strony głównej"

### 10.6 Signed URL wygasł podczas odtwarzania

**Przyczyna:**

- Użytkownik premium pauzuje wideo na >1h
- Signed URL (3600s) wygasa

**Obsługa:**

```typescript
// W VideoPlayer.tsx - listener na błąd HTTP 403/404 podczas playback
player.on("error", async (event) => {
  const error = event.detail?.plyr?.error;

  // Sprawdź czy to błąd 403/404 (expired URL)
  if (error?.code === 4 || error?.code === 2) {
    // Callback do parent do regeneracji URL
    onUrlExpired?.();
  }
});

// W VideoPlayerContainer
const handleUrlExpired = useCallback(async () => {
  setIsLoadingUrl(true);
  try {
    const newUrl = await generateVideoUrl(video, supabase);
    setVideoUrl(newUrl);
    toast.info("Odświeżono połączenie z nagraniem");
  } catch (error) {
    // Obsługa błędu regeneracji
  } finally {
    setIsLoadingUrl(false);
  }
}, [video]);
```

**UI:**

- Automatyczne odświeżenie URL w tle
- Toast notification: "Odświeżono połączenie"
- Jeśli regeneracja się nie powiedzie → `VideoPlayerError`

---

## 11. Kroki implementacji

### Krok 1: Przygotowanie środowiska i typów

**Zadania:**

1. Zainstaluj Plyr: `npm install plyr`
2. Zainstaluj typy Plyr: `npm install -D @types/plyr`
3. Zainstaluj ikony: `npm install lucide-react`
4. Utwórz plik typów ViewModels: `src/types/video-player.types.ts`
5. Dodaj nowe typy (`VideoPlayerState`, `VideoError`, `FormattedDuration`, `AccessCheckResult`)

**Weryfikacja:**

- TypeScript kompiluje się bez błędów
- Wszystkie importy są dostępne

---

### Krok 2: Implementacja funkcji pomocniczych

**Zadania:**

1. Utwórz `src/lib/utils/video.utils.ts`
2. Zaimplementuj:
   - `isValidUUID(id: string): boolean`
   - `isValidVideoUrl(url: string): boolean`
   - `canAccessVideo(video: Video, userRole: UserRole | null): AccessCheckResult`
   - `formatDuration(seconds: number): FormattedDuration`
3. Dodaj testy jednostkowe (opcjonalnie)

**Weryfikacja:**

- Każda funkcja zwraca poprawne wartości dla różnych input
- Edge cases obsłużone (null, undefined, nieprawidłowe wartości)

---

### Krok 3: Implementacja API client functions

**Zadania:**

1. Utwórz `src/lib/api/videos.ts` (jeśli nie istnieje)
2. Zaimplementuj `fetchVideoById(videoId: string, supabase: SupabaseClient): Promise<Video>`
3. Zaimplementuj `generateVideoUrl(video: Video, supabase: SupabaseClient): Promise<string>`
4. Zaimplementuj `getPublicVideoUrl(video: Video, supabase: SupabaseClient): string`
5. Zaimplementuj `getSignedVideoUrl(video: Video, supabase: SupabaseClient): Promise<string>`

**Weryfikacja:**

- Testowe wywołanie z prawidłowym UUID zwraca dane
- Testowe wywołanie z nieprawidłowym UUID rzuca odpowiedni błąd
- Generowanie URL działa dla zarówno free jak premium content

---

### Krok 4: Implementacja custom hook useVideoPlayer

**Zadania:**

1. Utwórz `src/hooks/useVideoPlayer.ts`
2. Zdefiniuj interfejs hooka
3. Zaimplementuj logikę:
   - Stan początkowy
   - Fetch danych nagrania w `useEffect`
   - Sprawdzenie uprawnień po pobraniu danych
   - Generowanie URL jeśli użytkownik ma dostęp
   - Funkcja `retry()`
4. Obsługa wszystkich typów błędów (walidacja, network, timeout)

**Weryfikacja:**

- Hook zwraca poprawny stan w każdej fazie (loading, success, error)
- Retry działa poprawnie
- Timeout jest respektowany

---

### Krok 5: Implementacja komponentów prezentacyjnych (dump components)

**Zadania:**

1. `BackButton.tsx` - prosty button z ikoną i logiką history.back()
2. `VideoPlayerSkeleton.tsx` - skeleton loader z aspect ratio 16:9
3. `VideoPlayerError.tsx` - komunikat błędu + retry button
4. `VideoHeader.tsx` - tytuł + badges (kategoria, poziom, czas)
5. `VideoDescription.tsx` - opis z opcją expand/collapse

**Weryfikacja:**

- Każdy komponent renderuje się poprawnie w izolacji (Storybook lub test page)
- Stylizacja zgodna z design system (Tailwind)
- Responsywność (mobile + desktop)

---

### Krok 6: Implementacja PremiumGate

**Zadania:**

1. Utwórz `src/components/PremiumGate.tsx`
2. Implementuj layout (fullscreen overlay, centered card)
3. Dodaj rozmytą miniaturkę (blur filter)
4. Dodaj komunikat i CTA buttons
5. Obsługa dismiss (backdrop click, ESC key)

**Weryfikacja:**

- Overlay wyświetla się na pełnym ekranie
- Backdrop blur działa poprawnie
- Kliknięcie CTA otwiera email client
- ESC zamyka overlay

---

### Krok 7: Implementacja VideoPlayer

**Zadania:**

1. Utwórz `src/components/VideoPlayer.tsx`
2. Zainstaluj i skonfiguruj Plyr
3. Konfiguracja controls (play/pause, seek, volume, fullscreen, speed)
4. Polskie tłumaczenia (i18n)
5. Event listeners (ready, error, playing)
6. Cleanup przy unmount (destroy Plyr instance)
7. Loading state (buffering)
8. Error state

**Weryfikacja:**

- Player montuje się poprawnie
- Wszystkie kontrolki działają
- Prędkość zmienia się (0.5x - 2x)
- Fullscreen działa
- Błędy playback są obsługiwane

---

### Krok 8: Implementacja VideoDetails

**Zadania:**

1. Utwórz `src/components/VideoDetails.tsx`
2. Kompozycja: VideoHeader + VideoDescription
3. Stack layout (flex column)
4. Responsywność

**Weryfikacja:**

- Wszystkie metadane wyświetlają się poprawnie
- Opis rozwijany działa jeśli tekst długi
- Layout responsywny

---

### Krok 9: Implementacja VideoPlayerContainer (orchestrator)

**Zadania:**

1. Utwórz `src/components/VideoPlayerContainer.tsx`
2. Użyj hooka `useVideoPlayer(videoId, userRole)`
3. Warunkowe renderowanie:
   - `isLoading` → `VideoPlayerSkeleton`
   - `error` → `VideoPlayerError`
   - `!hasAccess` → `PremiumGate`
   - `hasAccess` → `VideoPlayer`
4. Przekazanie odpowiednich props do każdego komponentu
5. Obsługa retry callback

**Weryfikacja:**

- Wszystkie stany renderują się poprawnie
- Przejścia między stanami są płynne
- Dane przekazywane do subkomponentów są poprawne

---

### Krok 10: Implementacja Astro page

**Zadania:**

1. Utwórz `src/pages/video/[id].astro`
2. Pobierz `id` z `Astro.params`
3. Pobierz dane użytkownika z `Astro.locals` (session, role)
4. Renderuj Layout + Navbar
5. Renderuj `BackButton`
6. Renderuj `VideoPlayerContainer` (z props: videoId, userRole)
7. Renderuj `VideoDetails` (dane przekazane po załadowaniu w komponencie)

**Struktura:**

```astro
---
import Layout from "@/layouts/Layout.astro";
import VideoPlayerContainer from "@/components/VideoPlayerContainer";
import BackButton from "@/components/BackButton";

const { id } = Astro.params;
const session = Astro.locals.session;
const userRole = session?.user?.user_metadata?.role || null;
---

<Layout title="Odtwarzacz wideo">
  <div class="container mx-auto px-4 py-8">
    <BackButton />
    <VideoPlayerContainer videoId={id} userRole={userRole} client:load />
  </div>
</Layout>
```

**Weryfikacja:**

- Strona renderuje się po przejściu na `/video/[id]`
- SSR działa poprawnie
- Client-side hydration działa (React komponenty interaktywne)

---

### Krok 11: Stylizacja i responsywność

**Zadania:**

1. Przejrzyj wszystkie komponenty pod kątem Tailwind classes
2. Sprawdź responsywność na różnych breakpointach (mobile, tablet, desktop)
3. Dostosuj spacing, typography zgodnie z design system
4. Dodaj hover states, focus states (accessibility)
5. Sprawdź dark mode (jeśli dotyczy)

**Weryfikacja:**

- Widok wygląda dobrze na mobile (320px+)
- Widok wygląda dobrze na tablet (768px+)
- Widok wygląda dobrze na desktop (1024px+)
- Wszystkie interaktywne elementy mają wyraźne focus states

---

### Krok 12: Obsługa błędów i edge cases

**Zadania:**

1. Testuj każdy typ błędu:
   - Nieprawidłowy UUID w URL
   - Nagranie nie znalezione (404)
   - Brak dostępu (premium content)
   - Timeout
   - Błąd playback
   - Signed URL wygasł
2. Sprawdź komunikaty błędów (czy są zrozumiałe)
3. Sprawdź czy retry działa dla każdego typu błędu
4. Dodaj logging błędów (console.error lub serwis analytics)

**Weryfikacja:**

- Każdy błąd wyświetla odpowiedni komunikat
- Użytkownik może zawsze wrócić do strony głównej lub spróbować ponownie
- Błędy są logowane dla debugowania

---

### Krok 13: Testy integracyjne

**Zadania:**

1. Test: Załadowanie free content jako niezalogowany użytkownik
2. Test: Załadowanie premium content jako użytkownik premium
3. Test: Próba dostępu do premium content jako użytkownik free
4. Test: Obsługa błędu 404
5. Test: Obsługa timeout
6. Test: Zmiana prędkości odtwarzania
7. Test: Fullscreen mode
8. Test: Powrót do strony głównej

**Weryfikacja:**

- Wszystkie scenariusze przechodzą pomyślnie
- Brak błędów w konsoli
- UX jest płynny i intuicyjny

---

### Krok 14: Accessibility audit

**Zadania:**

1. Sprawdź hierarchię nagłówków (H1 → H2 → H3)
2. Dodaj ARIA labels gdzie potrzebne
3. Sprawdź keyboard navigation (Tab, Enter, Space, Escape)
4. Sprawdź focus management
5. Dodaj alt texts dla obrazków (miniatury)
6. Sprawdź color contrast (tekst na tle)

**Narzędzia:**

- axe DevTools
- Lighthouse (Chrome DevTools)
- Klawiatura (manualne testy)

**Weryfikacja:**

- Lighthouse Accessibility score ≥ 90
- Wszystkie interaktywne elementy dostępne z klawiatury
- Screen reader może nawigować po stronie

---

### Krok 15: Performance optimization

**Zadania:**

1. Lazy loading Plyr (tylko gdy potrzebny)
2. Preload thumbnail w `<link rel="preload">`
3. Optymalizacja obrazków (WebP, lazy loading)
4. Code splitting (React.lazy dla dużych komponentów)
5. Memoization (`useMemo`, `useCallback` gdzie potrzebne)

**Weryfikacja:**

- Lighthouse Performance score ≥ 85
- First Contentful Paint < 2s
- Time to Interactive < 3s
- Bundle size rozsądny (check z Astro build)

---

### Krok 16: Finalizacja i dokumentacja

**Zadania:**

1. Code review (jeśli zespół)
2. Dokumentacja komponentów (JSDoc comments)
3. Update README jeśli potrzebne
4. Sprawdź że wszystkie TODO są usunięte
5. Merge do main branch

**Weryfikacja:**

- Kod jest czytelny i dobrze udokumentowany
- Wszystkie komponenty mają TypeScript types
- Brak warning w konsoli
- Feature jest gotowy do użycia przez użytkowników

---

## 12. Podsumowanie

Ten plan implementacji dostarcza kompletny i szczegółowy przewodnik dla wdrożenia widoku szczegółów nagrania (`/video/[id]`). Wszystkie komponenty są zaprojektowane zgodnie z zasadami:

- **Single Responsibility Principle** - każdy komponent ma jedno zadanie
- **Separation of Concerns** - logika biznesowa oddzielona od prezentacji
- **Type Safety** - pełne wykorzystanie TypeScript
- **Error Handling** - obsługa wszystkich edge cases
- **Accessibility** - zgodność z WCAG 2.1
- **Performance** - optymalizacja ładowania i renderowania

Implementacja powinna zająć doświadczonemu frontendowemu programiście około **15-20 godzin** pracy (zgodnie z timeline PRD dla Week 2, Day 1-2).
