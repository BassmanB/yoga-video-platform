# Plan implementacji widoku Strony Głównej

## 1. Przegląd

Strona główna (`/`) jest głównym punktem wejścia do platformy do udostępniania nagrań wideo z ćwiczeniami fizycznymi. Wyświetla wszystkie dostępne nagrania w responsywnym gridzie z możliwością filtrowania po kategoriach (yoga, mobilność, kalistenika) i poziomie trudności (początkujący, średniozaawansowany, zaawansowany). Użytkownicy niezalogowani oraz z rolą free widzą treści premium z efektem blur i oznaką "Premium", co zachęca do upgrade'u. Strona wykorzystuje SSR (Server-Side Rendering) Astro dla początkowego ładowania z progresywnym wzbogacaniem przez React dla interaktywnych elementów (filtry, auth).

**Cele widoku:**

- Wyświetlić wszystkie nagrania dostępne dla danego użytkownika (filtrowane przez RLS)
- Umożliwić szybkie filtrowanie po kategorii i poziomie
- Pokazać wartość premium content poprzez preview z blur
- Zapewnić responsywne, accessible i performant doświadczenie
- Zachęcić do interakcji (kliknięcie wideo → nawigacja do `/video/[id]`)

## 2. Routing widoku

**Ścieżka:** `/` (plik: `src/pages/index.astro`)

**Typ renderowania:** Hybrid

- SSR dla początkowego HTML z danymi wideo
- Client-side hydration dla komponentów React (filtry, auth, grid)

**Query Parameters (opcjonalne):**

- `category` - filtr kategorii (`yoga` | `mobility` | `calisthenics`)
- `level` - filtr poziomu (`beginner` | `intermediate` | `advanced`)

**Przykładowe URL:**

- `/` - wszystkie nagrania
- `/?category=yoga` - tylko yoga
- `/?category=mobility&level=beginner` - mobilność dla początkujących

## 3. Struktura komponentów

```
src/pages/index.astro (SSR Entry Point)
│
├── src/layouts/Layout.astro
│   └── <head>, <body>, global scripts
│
├── src/components/Navbar.astro (Static)
│   └── src/components/AuthButton.tsx (React Client, hydration: load)
│       ├── LoginButton (niezalogowany)
│       └── UserMenu (zalogowany)
│           ├── UserAvatar
│           ├── RoleBadge
│           └── LogoutButton
│
└── <main> (index.astro)
    │
    ├── src/components/FilterBar.tsx (React Client, hydration: load)
    │   ├── CategoryFilter (horizontal scrollable pills)
    │   ├── LevelFilter (Shadcn Select dropdown)
    │   └── ClearFiltersButton (conditional)
    │
    └── src/components/VideoGrid.tsx (React Client, hydration: load)
        ├── SkeletonLoader (loading state - 9 cards)
        ├── EmptyState (no results)
        └── VideoCard[] (array of cards)
            ├── Thumbnail (16:9)
            │   ├── PremiumBadge (conditional)
            │   ├── DurationBadge
            │   └── BlurOverlay (conditional)
            └── CardContent
                ├── Title
                └── MetadataBadges
                    ├── CategoryBadge
                    └── LevelBadge
```

## 4. Szczegóły komponentów

### 4.1 Page Component: `index.astro`

**Opis komponentu:**
Główny entry point widoku strony głównej. Odpowiedzialny za SSR początkowych danych wideo z Supabase, parsowanie query params oraz setup dla React komponentów client-side.

**Główne elementy:**

```astro
---
// Server-side code
import Layout from "../layouts/Layout.astro";
import Navbar from "../components/Navbar.astro";
import FilterBar from "../components/FilterBar";
import VideoGrid from "../components/VideoGrid";
import type { VideoListQueryParams } from "../types";

// Parse query params
const url = new URL(Astro.request.url);
const category = url.searchParams.get("category");
const level = url.searchParams.get("level");

// Fetch initial data server-side (optional for SSR)
const initialParams: VideoListQueryParams = {
  category: category as VideoCategory | undefined,
  level: level as VideoLevel | undefined,
  limit: 50,
  offset: 0,
  sort: "created_at",
  order: "desc",
};
---

<Layout title="Yoga & Fitness - Strona Główna">
  <Navbar />
  <main class="container mx-auto px-4 py-8">
    <FilterBar client:load initialCategory={category} initialLevel={level} />
    <VideoGrid client:load initialParams={initialParams} />
  </main>
</Layout>
```

**Obsługiwane interakcje:**

- Brak bezpośrednich (delegowane do komponentów dzieci)

**Obsługiwana walidacja:**

- Validacja query params (category, level) przed przekazaniem do komponentów
- Ignorowanie nieprawidłowych wartości

**Typy:**

- `VideoListQueryParams` (z `src/types.ts`)
- `VideoCategory` (z `src/types.ts`)
- `VideoLevel` (z `src/types.ts`)

**Propsy:**

- Brak (page component)

---

### 4.2 Component: `Navbar.astro`

**Opis komponentu:**
Statyczna nawigacja górna z logo, linkiem do strony głównej oraz dynamicznym komponentem autentykacji. Mobile-first z responsywnym burger menu.

**Główne elementy:**

```astro
<nav class="bg-slate-900 border-b border-slate-800">
  <div class="container mx-auto px-4 py-4 flex items-center justify-between">
    <!-- Logo -->
    <a href="/" class="text-2xl font-bold text-indigo-500"> YogaFit </a>

    <!-- Desktop Navigation -->
    <div class="hidden md:flex items-center gap-6">
      <AuthButton client:load />
    </div>

    <!-- Mobile Menu Button -->
    <button class="md:hidden" aria-label="Toggle menu">
      <MenuIcon />
    </button>
  </div>
</nav>
```

**Obsługiwane interakcje:**

- Kliknięcie logo → nawigacja do `/`
- Kliknięcie burger menu → toggle mobile menu

**Obsługiwana walidacja:**

- Brak

**Typy:**

- Brak specyficznych

**Propsy:**

- Brak

---

### 4.3 Component: `AuthButton.tsx` (React)

**Opis komponentu:**
Dynamiczny komponent pokazujący stan autentykacji użytkownika. Dla niezalogowanych: przycisk "Zaloguj się". Dla zalogowanych: avatar z dropdown menu (email, rola, logout).

**Główne elementy:**

```tsx
import { useAuth } from "../lib/hooks/useAuth";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";

export function AuthButton() {
  const { user, role, isLoading, signIn, signOut } = useAuth();

  if (isLoading) {
    return <div class="w-24 h-10 bg-slate-800 animate-pulse rounded" />;
  }

  if (!user) {
    return (
      <Button onClick={signIn} variant="default">
        Zaloguj się
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarFallback>{user.email[0].toUpperCase()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
        <DropdownMenuItem>
          <RoleBadge role={role} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>Wyloguj się</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Obsługiwane interakcje:**

- `onClick` przycisku "Zaloguj się" → wywołanie `signIn()` (magic link)
- `onClick` "Wyloguj się" → wywołanie `signOut()`

**Obsługiwana walidacja:**

- Sprawdzenie czy `user` istnieje przed renderowaniem menu
- Sprawdzenie `isLoading` przed pokazaniem zawartości

**Typy:**

- `User` (z Supabase Auth)
- `UserRole` (z `src/types.ts`)

**Propsy:**

```typescript
interface AuthButtonProps {
  // Brak - pobiera dane z useAuth hook
}
```

---

### 4.4 Component: `FilterBar.tsx` (React)

**Opis komponentu:**
Interaktywny pasek filtrów umożliwiający filtrowanie nagrań po kategorii (horizontal scrollable pills) i poziomie (Shadcn Select). Synchronizuje stan z URL query params. Pokazuje przycisk "Wyczyść filtry" gdy jakiekolwiek filtry są aktywne.

**Główne elementy:**

```tsx
import { useFilters } from "../lib/hooks/useFilters";
import type { VideoCategory, VideoLevel } from "../types";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface FilterBarProps {
  initialCategory?: string | null;
  initialLevel?: string | null;
}

export function FilterBar({ initialCategory, initialLevel }: FilterBarProps) {
  const { filters, setCategory, setLevel, clearFilters, hasActiveFilters } = useFilters({
    initialCategory,
    initialLevel,
  });

  const categories: Array<{ value: VideoCategory | null; label: string }> = [
    { value: null, label: "Wszystkie" },
    { value: "yoga", label: "Yoga" },
    { value: "mobility", label: "Mobilność" },
    { value: "calisthenics", label: "Kalistenika" },
  ];

  const levels: Array<{ value: VideoLevel | null; label: string }> = [
    { value: null, label: "Wszystkie poziomy" },
    { value: "beginner", label: "Początkujący" },
    { value: "intermediate", label: "Średniozaawansowany" },
    { value: "advanced", label: "Zaawansowany" },
  ];

  return (
    <div className="mb-8 space-y-4">
      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(({ value, label }) => (
          <Button
            key={value || "all"}
            variant={filters.category === value ? "default" : "outline"}
            onClick={() => setCategory(value)}
            className="whitespace-nowrap"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Level Select + Clear Button */}
      <div className="flex items-center gap-4">
        <Select
          value={filters.level || "all"}
          onValueChange={(val) => setLevel(val === "all" ? null : (val as VideoLevel))}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Wybierz poziom" />
          </SelectTrigger>
          <SelectContent>
            {levels.map(({ value, label }) => (
              <SelectItem key={value || "all"} value={value || "all"}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Wyczyść filtry
          </Button>
        )}
      </div>
    </div>
  );
}
```

**Obsługiwane interakcje:**

- `onClick` category pill → `setCategory(value)`
- `onValueChange` level select → `setLevel(value)`
- `onClick` "Wyczyść filtry" → `clearFilters()`

**Obsługiwana walidacja:**

- Sprawdzenie czy wartość kategorii należy do `VideoCategory` enum
- Sprawdzenie czy wartość poziomu należy do `VideoLevel` enum
- Walidacja wykonywana w `useFilters` hook

**Typy:**

- `VideoCategory` (z `src/types.ts`)
- `VideoLevel` (z `src/types.ts`)
- `FilterState` (z hook)

**Propsy:**

```typescript
interface FilterBarProps {
  initialCategory?: string | null; // Początkowa wartość z URL
  initialLevel?: string | null; // Początkowa wartość z URL
}
```

---

### 4.5 Component: `VideoGrid.tsx` (React)

**Opis komponentu:**
Kontener dla kart wideo. Odpowiedzialny za pobieranie danych z API, zarządzanie stanami loading/error/empty oraz renderowanie grid z VideoCard komponentami. Automatycznie refetchuje dane po zmianie filtrów (przez URL params).

**Główne elementy:**

```tsx
import { useVideos } from "../lib/hooks/useVideos";
import { useAuth } from "../lib/hooks/useAuth";
import type { VideoListQueryParams } from "../types";
import { VideoCard } from "./VideoCard";
import { SkeletonLoader } from "./SkeletonLoader";
import { EmptyState } from "./EmptyState";
import { toast } from "sonner";

interface VideoGridProps {
  initialParams: VideoListQueryParams;
}

export function VideoGrid({ initialParams }: VideoGridProps) {
  const { role } = useAuth();
  const { videos, isLoading, error, refetch } = useVideos(initialParams);

  // Show loading skeleton
  if (isLoading) {
    return <SkeletonLoader count={9} />;
  }

  // Handle error
  if (error) {
    toast.error("Nie udało się załadować nagrań", {
      action: {
        label: "Spróbuj ponownie",
        onClick: () => refetch(),
      },
    });
    return <EmptyState message="Wystąpił błąd podczas ładowania" />;
  }

  // Handle empty state
  if (!videos || videos.length === 0) {
    return <EmptyState message="Nie znaleziono nagrań" />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} userRole={role} />
      ))}
    </div>
  );
}
```

**Obsługiwane interakcje:**

- Refetch po kliknięciu "Spróbuj ponownie" (toast action)

**Obsługiwana walidacja:**

- Sprawdzenie czy `videos` array istnieje przed mapowaniem
- Sprawdzenie `isLoading` i `error` states

**Typy:**

- `Video[]` (z `src/types.ts`)
- `VideoListQueryParams` (z `src/types.ts`)
- `UserRole | null` (z `src/types.ts`)

**Propsy:**

```typescript
interface VideoGridProps {
  initialParams: VideoListQueryParams; // Początkowe parametry query
}
```

---

### 4.6 Component: `VideoCard.tsx` (React)

**Opis komponentu:**
Pojedyncza karta nagrania wideo. Wyświetla miniaturkę (16:9), tytuł, czas trwania, kategorię i poziom. Dla premium content pokazuje badge "Premium" i blur overlay jeśli użytkownik nie ma uprawnień. Kliknięcie karty nawiguje do `/video/[id]`.

**Główne elementy:**

```tsx
import { useState } from "react";
import type { Video, UserRole } from "../types";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { canAccessVideo, formatDuration, getCategoryLabel, getLevelLabel } from "../lib/utils/video.utils";

interface VideoCardProps {
  video: Video;
  userRole: UserRole | null;
}

export function VideoCard({ video, userRole }: VideoCardProps) {
  const [imageError, setImageError] = useState(false);
  const hasAccess = canAccessVideo(video, userRole);

  const handleClick = () => {
    window.location.href = `/video/${video.id}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      className="group cursor-pointer transition-transform hover:scale-105 focus-within:ring-2 focus-within:ring-indigo-500"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`${video.title} - ${formatDuration(video.duration)}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-slate-800">
        <img
          src={imageError ? "/placeholder-thumbnail.jpg" : video.thumbnail_url}
          alt={video.title}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover ${!hasAccess ? "blur-md" : ""}`}
        />

        {/* Premium Badge */}
        {video.is_premium && (
          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-purple-600 to-indigo-600">Premium</Badge>
        )}

        {/* Duration Badge */}
        <Badge variant="secondary" className="absolute bottom-2 right-2 bg-black/70 text-white">
          {formatDuration(video.duration)}
        </Badge>

        {/* Blur Overlay for inaccessible premium */}
        {!hasAccess && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <p className="text-white text-sm font-medium">Tylko Premium</p>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-slate-100 line-clamp-2 mb-2">{video.title}</h3>
        <div className="flex gap-2">
          <Badge variant="outline">{getCategoryLabel(video.category)}</Badge>
          <Badge variant="outline">{getLevelLabel(video.level)}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Obsługiwane interakcje:**

- `onClick` karty → nawigacja do `/video/${video.id}`
- `onKeyDown` (Enter/Space) → nawigacja (accessibility)
- `onError` obrazka → fallback do placeholder

**Obsługiwana walidacja:**

- Sprawdzenie uprawnień dostępu przez `canAccessVideo(video, userRole)`
- Walidacja czy video ma wymagane pola (title, thumbnail_url, etc.)

**Typy:**

- `Video` (z `src/types.ts`)
- `UserRole | null` (z `src/types.ts`)

**Propsy:**

```typescript
interface VideoCardProps {
  video: Video; // Pełny obiekt video
  userRole: UserRole | null; // Rola użytkownika dla kontroli dostępu
}
```

---

### 4.7 Component: `SkeletonLoader.tsx` (React)

**Opis komponentu:**
Komponent szkieletowy wyświetlany podczas ładowania danych. Pokazuje animowane placeholder cards w tym samym gridzie co rzeczywiste VideoCard komponenty.

**Główne elementy:**

```tsx
import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

interface SkeletonLoaderProps {
  count?: number;
}

export function SkeletonLoader({ count = 9 }: SkeletonLoaderProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <Skeleton className="aspect-video rounded-t-lg" />
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Obsługiwane interakcje:**

- Brak (tylko wyświetlanie)

**Obsługiwana walidacja:**

- Brak

**Typy:**

- Brak specyficznych

**Propsy:**

```typescript
interface SkeletonLoaderProps {
  count?: number; // Liczba skeleton cards (domyślnie 9)
}
```

---

### 4.8 Component: `EmptyState.tsx` (React)

**Opis komponentu:**
Wyświetlany gdy brak wyników (pusta tablica videos) lub wystąpił błąd. Pokazuje ikonę, komunikat i opcjonalnie akcję (np. wyczyść filtry).

**Główne elementy:**

```tsx
import { Button } from "./ui/button";

interface EmptyStateProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-slate-400">
        <svg className="w-24 h-24" /* ... icon ... */ />
      </div>
      <h3 className="text-xl font-semibold text-slate-300 mb-2">{message}</h3>
      {action && (
        <Button onClick={action.onClick} variant="outline" className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

**Obsługiwane interakcje:**

- `onClick` action button (jeśli provided)

**Obsługiwana walidacja:**

- Sprawdzenie czy `action` istnieje przed renderowaniem

**Typy:**

- Brak specyficznych

**Propsy:**

```typescript
interface EmptyStateProps {
  message: string; // Komunikat do wyświetlenia
  action?: {
    // Opcjonalna akcja (np. clear filters)
    label: string;
    onClick: () => void;
  };
}
```

## 5. Typy

### 5.1 Istniejące typy (z `src/types.ts`)

```typescript
// Enums - Domain Value Objects
export type VideoCategory = "yoga" | "mobility" | "calisthenics";
export type VideoLevel = "beginner" | "intermediate" | "advanced";
export type VideoStatus = "draft" | "published" | "archived";
export type UserRole = "free" | "premium" | "admin";

// Video Entity
export interface Video {
  id: string;
  title: string;
  description: string | null;
  category: VideoCategory;
  level: VideoLevel;
  duration: number;
  video_url: string;
  thumbnail_url: string;
  is_premium: boolean;
  status: VideoStatus;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface VideoListResponse {
  data: Video[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  count: number;
}

// Query Parameters
export interface VideoListQueryParams {
  category?: VideoCategory;
  level?: VideoLevel;
  is_premium?: boolean;
  status?: VideoStatus;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "title" | "duration";
  order?: "asc" | "desc";
}
```

### 5.2 Nowe typy dla widoku (do dodania w `src/lib/types/view-models.ts`)

```typescript
/**
 * Filter state for FilterBar component
 * Represents current active filters in the UI
 */
export interface FilterState {
  category: VideoCategory | null;
  level: VideoLevel | null;
}

/**
 * Props for VideoCard component
 */
export interface VideoCardProps {
  video: Video;
  userRole: UserRole | null;
}

/**
 * Props for VideoGrid component
 */
export interface VideoGridProps {
  initialParams: VideoListQueryParams;
}

/**
 * Props for FilterBar component
 */
export interface FilterBarProps {
  initialCategory?: string | null;
  initialLevel?: string | null;
}

/**
 * Return type for useVideos hook
 */
export interface UseVideosResult {
  videos: Video[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  meta: PaginationMeta | null;
}

/**
 * Return type for useFilters hook
 */
export interface UseFiltersResult {
  filters: FilterState;
  setCategory: (category: VideoCategory | null) => void;
  setLevel: (level: VideoLevel | null) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Return type for useAuth hook
 */
export interface UseAuthResult {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Supabase User type (from @supabase/supabase-js)
 * Extending for type safety
 */
export interface User {
  id: string;
  email: string;
  user_metadata: {
    role?: UserRole;
    display_name?: string;
  };
}
```

## 6. Zarządzanie stanem

### 6.1 Hook: `useVideos`

**Lokalizacja:** `src/lib/hooks/useVideos.ts`

**Cel:** Pobieranie listy nagrań z API z filtrowaniem, sortowaniem i paginacją. Automatyczne refetch po zmianie query params.

**State:**

```typescript
const [videos, setVideos] = useState<Video[]>([]);
const [isLoading, setIsLoading] = useState<boolean>(true);
const [error, setError] = useState<Error | null>(null);
const [meta, setMeta] = useState<PaginationMeta | null>(null);
```

**Implementacja:**

```typescript
import { useState, useEffect } from "react";
import type { Video, VideoListResponse, VideoListQueryParams } from "../../types";

export function useVideos(params: VideoListQueryParams) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query string
      const queryParams = new URLSearchParams();
      if (params.category) queryParams.set("category", params.category);
      if (params.level) queryParams.set("level", params.level);
      if (params.limit) queryParams.set("limit", params.limit.toString());
      if (params.offset) queryParams.set("offset", params.offset.toString());
      if (params.sort) queryParams.set("sort", params.sort);
      if (params.order) queryParams.set("order", params.order);

      const response = await fetch(`/api/videos?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.statusText}`);
      }

      const data: VideoListResponse = await response.json();
      setVideos(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [params.category, params.level, params.limit, params.offset, params.sort, params.order]);

  return {
    videos,
    isLoading,
    error,
    meta,
    refetch: fetchVideos,
  };
}
```

**Zależności:**

- URL query params (category, level, etc.)
- Zmiana któregokolwiek trigggeruje refetch

---

### 6.2 Hook: `useFilters`

**Lokalizacja:** `src/lib/hooks/useFilters.ts`

**Cel:** Zarządzanie stanem filtrów i synchronizacja z URL query params. Używa history API do update URL bez pełnego reload.

**State:**

```typescript
const [filters, setFilters] = useState<FilterState>({
  category: null,
  level: null,
});
```

**Implementacja:**

```typescript
import { useState, useEffect, useCallback } from "react";
import type { VideoCategory, VideoLevel } from "../../types";
import type { FilterState } from "../types/view-models";
import { isVideoCategory, isVideoLevel } from "../../types";

interface UseFiltersOptions {
  initialCategory?: string | null;
  initialLevel?: string | null;
}

export function useFilters(options: UseFiltersOptions = {}) {
  const [filters, setFilters] = useState<FilterState>({
    category: isVideoCategory(options.initialCategory || "") ? (options.initialCategory as VideoCategory) : null,
    level: isVideoLevel(options.initialLevel || "") ? (options.initialLevel as VideoLevel) : null,
  });

  // Update URL when filters change
  const updateURL = useCallback((newFilters: FilterState) => {
    const url = new URL(window.location.href);

    if (newFilters.category) {
      url.searchParams.set("category", newFilters.category);
    } else {
      url.searchParams.delete("category");
    }

    if (newFilters.level) {
      url.searchParams.set("level", newFilters.level);
    } else {
      url.searchParams.delete("level");
    }

    window.history.pushState({}, "", url);
  }, []);

  const setCategory = useCallback(
    (category: VideoCategory | null) => {
      const newFilters = { ...filters, category };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const setLevel = useCallback(
    (level: VideoLevel | null) => {
      const newFilters = { ...filters, level };
      setFilters(newFilters);
      updateURL(newFilters);
    },
    [filters, updateURL]
  );

  const clearFilters = useCallback(() => {
    const newFilters = { category: null, level: null };
    setFilters(newFilters);
    updateURL(newFilters);
  }, [updateURL]);

  const hasActiveFilters = filters.category !== null || filters.level !== null;

  return {
    filters,
    setCategory,
    setLevel,
    clearFilters,
    hasActiveFilters,
  };
}
```

---

### 6.3 Hook: `useAuth`

**Lokalizacja:** `src/lib/hooks/useAuth.ts`

**Cel:** Zarządzanie stanem autentykacji użytkownika. Pobiera current user z Supabase, ekstraktuje rolę z user_metadata.

**State:**

```typescript
const [user, setUser] = useState<User | null>(null);
const [isLoading, setIsLoading] = useState(true);
```

**Implementacja:**

```typescript
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { UserRole } from "../../types";

const supabase = createClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY);

export function useAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const role: UserRole | null = user?.user_metadata?.role || "free";

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email: prompt("Podaj swój email:") || "",
    });
    if (error) console.error("Error signing in:", error);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error);
  };

  return {
    user,
    role,
    isLoading,
    signIn,
    signOut,
  };
}
```

## 7. Integracja API

### 7.1 Endpoint: GET /api/videos

**Typ żądania:** `VideoListQueryParams` (query string)

```typescript
interface VideoListQueryParams {
  category?: VideoCategory;
  level?: VideoLevel;
  is_premium?: boolean;
  status?: VideoStatus;
  limit?: number; // Default: 50, Max: 100
  offset?: number; // Default: 0
  sort?: "created_at" | "title" | "duration"; // Default: 'created_at'
  order?: "asc" | "desc"; // Default: 'desc'
}
```

**Typ odpowiedzi:** `VideoListResponse`

```typescript
interface VideoListResponse {
  data: Video[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    count: number;
  };
}
```

**Użycie w komponencie:**

```typescript
// W useVideos hook
const queryParams = new URLSearchParams();
if (params.category) queryParams.set("category", params.category);
if (params.level) queryParams.set("level", params.level);
queryParams.set("limit", (params.limit || 50).toString());
queryParams.set("offset", (params.offset || 0).toString());
queryParams.set("sort", params.sort || "created_at");
queryParams.set("order", params.order || "desc");

const response = await fetch(`/api/videos?${queryParams.toString()}`);
const data: VideoListResponse = await response.json();
```

**Obsługa błędów:**

```typescript
if (!response.ok) {
  if (response.status === 400) {
    // Invalid query parameters
    const errorData: ErrorResponse = await response.json();
    throw new Error(errorData.error.message);
  } else if (response.status === 500) {
    // Server error
    throw new Error("Wystąpił błąd serwera. Spróbuj ponownie później.");
  } else {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}
```

**Warunki biznesowe:**

- RLS automatycznie filtruje wyniki na podstawie roli użytkownika
- Użytkownicy anonimowi/free widzą tylko: `is_premium = false AND status = 'published'`
- Użytkownicy premium widzą wszystkie: `status = 'published'`
- Admini widzą wszystkie nagrania niezależnie od statusu

## 8. Interakcje użytkownika

### 8.1 Filtrowanie po kategorii

**Akcja użytkownika:** Kliknięcie przycisku kategorii (pill)

**Flow:**

1. Użytkownik klika przycisk "Yoga"
2. `FilterBar` wywołuje `setCategory('yoga')`
3. `useFilters` aktualizuje state filters: `{ category: 'yoga', level: null }`
4. `useFilters` aktualizuje URL: `/?category=yoga`
5. `useVideos` wykrywa zmianę params (useEffect dependency)
6. `useVideos` wykonuje nowy fetch: `GET /api/videos?category=yoga`
7. `VideoGrid` otrzymuje nowe videos i re-renderuje

**Feedback wizualny:**

- Aktywny przycisk: `variant="default"` (filled indigo)
- Nieaktywny: `variant="outline"` (slate outline)
- Loading: `SkeletonLoader` pokazany podczas fetch

---

### 8.2 Filtrowanie po poziomie

**Akcja użytkownika:** Wybór poziomu z dropdown (Select)

**Flow:**

1. Użytkownik otwiera Select i wybiera "Początkujący"
2. `FilterBar` wywołuje `setLevel('beginner')`
3. `useFilters` aktualizuje state i URL
4. `useVideos` refetch z nowym parametrem
5. Grid aktualizuje się

**Feedback wizualny:**

- Selected value w Select trigger
- Loading skeleton podczas fetch

---

### 8.3 Czyszczenie filtrów

**Akcja użytkownika:** Kliknięcie "Wyczyść filtry"

**Flow:**

1. Użytkownik klika przycisk "Wyczyść filtry"
2. `FilterBar` wywołuje `clearFilters()`
3. `useFilters` resetuje state: `{ category: null, level: null }`
4. URL aktualizuje się do `/`
5. `useVideos` fetchuje wszystkie nagrania
6. Przycisk "Wyczyść filtry" znika (`hasActiveFilters = false`)

---

### 8.4 Kliknięcie karty wideo

**Akcja użytkownika:** Kliknięcie VideoCard

**Flow:**

1. Użytkownik klika kartę nagrania
2. `VideoCard` wywołuje `onClick` handler
3. Nawigacja do `/video/${video.id}` przez `window.location.href`
4. Astro route `/video/[id].astro` ładuje się

**Uwaga:** Dla lepszej UX można użyć client-side routing (np. Astro View Transitions)

---

### 8.5 Logowanie użytkownika

**Akcja użytkownika:** Kliknięcie "Zaloguj się"

**Flow:**

1. Użytkownik klika "Zaloguj się" w `AuthButton`
2. `signIn()` funkcja z `useAuth` wywołana
3. Prompt dla email (lub redirect do login page)
4. Supabase wysyła magic link
5. Użytkownik klika link w email
6. Auto-login → redirect do `/`
7. `useAuth` wykrywa nową sesję
8. `AuthButton` pokazuje UserMenu zamiast Login
9. `VideoGrid` automatycznie refetchuje (useEffect w `useVideos` może być triggered przez role change)

**Feedback wizualny:**

- Toast notification: "Sprawdź swoją skrzynkę email"
- Po login: Toast "Zalogowano pomyślnie"

---

### 8.6 Wylogowanie użytkownika

**Akcja użytkownika:** Kliknięcie "Wyloguj się" w dropdown

**Flow:**

1. Użytkownik klika "Wyloguj się"
2. `signOut()` z `useAuth` wywołane
3. Supabase sesja usunięta
4. `useAuth` aktualizuje state: `user = null, role = null`
5. `AuthButton` pokazuje "Zaloguj się"
6. `VideoGrid` może refetchować (premium content stanie się blur)

**Feedback wizualny:**

- Toast: "Wylogowano pomyślnie"

## 9. Warunki i walidacja

### 9.1 Walidacja query params (index.astro)

**Komponenty:** `index.astro`, `useFilters`

**Warunki:**

- `category` musi być jednym z: `'yoga'`, `'mobility'`, `'calisthenics'` lub `null`
- `level` musi być jednym z: `'beginner'`, `'intermediate'`, `'advanced'` lub `null`

**Implementacja:**

```typescript
import { isVideoCategory, isVideoLevel } from "../types";

// W index.astro
const category = url.searchParams.get("category");
const level = url.searchParams.get("level");

const validCategory = category && isVideoCategory(category) ? category : null;
const validLevel = level && isVideoLevel(level) ? level : null;

// W useFilters
const initialCategory = isVideoCategory(options.initialCategory || "")
  ? (options.initialCategory as VideoCategory)
  : null;
```

**Wpływ na UI:**

- Nieprawidłowe wartości są ignorowane (fallback do null)
- Brak error message dla użytkownika (silent fail)

---

### 9.2 Walidacja dostępu do premium content (VideoCard)

**Komponenty:** `VideoCard`

**Warunki:**

```typescript
function canAccessVideo(video: Video, userRole: UserRole | null): boolean {
  // Published check
  if (video.status !== "published" && userRole !== "admin") {
    return false;
  }

  // Premium check
  if (video.is_premium) {
    return userRole === "premium" || userRole === "admin";
  }

  // Free content accessible to all
  return true;
}
```

**Wpływ na UI:**

- `hasAccess = false` → blur na thumbnail + overlay "Tylko Premium"
- `hasAccess = true` → normalny wygląd, klikalne

---

### 9.3 Walidacja obrazka (VideoCard)

**Komponenty:** `VideoCard`

**Warunki:**

- Jeśli thumbnail nie załaduje się (404, network error), pokazać placeholder

**Implementacja:**

```typescript
const [imageError, setImageError] = useState(false);

<img
  src={imageError ? '/placeholder-thumbnail.jpg' : video.thumbnail_url}
  onError={() => setImageError(true)}
/>
```

**Wpływ na UI:**

- Pokazanie placeholder image zamiast broken image icon

---

### 9.4 Walidacja pustej listy (VideoGrid)

**Komponenty:** `VideoGrid`

**Warunki:**

- `videos.length === 0` → pokazać EmptyState

**Implementacja:**

```typescript
if (!videos || videos.length === 0) {
  return <EmptyState message="Nie znaleziono nagrań" />;
}
```

**Wpływ na UI:**

- EmptyState component zamiast pustego grida

## 10. Obsługa błędów

### 10.1 Błąd API (500 Internal Server Error)

**Scenariusz:** Supabase database down, network error

**Obsługa:**

```typescript
// W useVideos hook
catch (err) {
  setError(err instanceof Error ? err : new Error('Unknown error'));
}

// W VideoGrid
if (error) {
  toast.error('Nie udało się załadować nagrań', {
    action: {
      label: 'Spróbuj ponownie',
      onClick: () => refetch(),
    },
  });
  return <EmptyState message="Wystąpił błąd podczas ładowania" />;
}
```

**Feedback użytkownika:**

- Toast notification z akcją "Spróbuj ponownie"
- EmptyState z komunikatem błędu

---

### 10.2 Błąd walidacji (400 Bad Request)

**Scenariusz:** Nieprawidłowe query params wysłane do API

**Obsługa:**

```typescript
if (!response.ok) {
  if (response.status === 400) {
    const errorData: ErrorResponse = await response.json();
    throw new Error(errorData.error.message);
  }
}
```

**Feedback użytkownika:**

- Toast z szczegółowym komunikatem błędu
- Fallback do domyślnych params (brak filtrów)

---

### 10.3 Brak wyników po filtrowaniu

**Scenariusz:** Użytkownik wybrał filtry, które nie mają wyników (np. "Yoga" + "Zaawansowany" ale brak takich nagrań)

**Obsługa:**

```typescript
if (videos.length === 0 && hasActiveFilters) {
  return (
    <EmptyState
      message="Nie znaleziono nagrań spełniających kryteria"
      action={{
        label: 'Wyczyść filtry',
        onClick: clearFilters,
      }}
    />
  );
}
```

**Feedback użytkownika:**

- EmptyState z przyciskiem "Wyczyść filtry"

---

### 10.4 Wolne połączenie (loading > 3s)

**Scenariusz:** Użytkownik ma słabe połączenie, fetch trwa > 3s

**Obsługa:**

```typescript
const [showSlowConnectionWarning, setShowSlowConnectionWarning] = useState(false);

useEffect(() => {
  if (isLoading) {
    const timer = setTimeout(() => {
      setShowSlowConnectionWarning(true);
    }, 3000);
    return () => clearTimeout(timer);
  } else {
    setShowSlowConnectionWarning(false);
  }
}, [isLoading]);

// W render
{showSlowConnectionWarning && (
  <p className="text-sm text-slate-400 text-center">
    Wolne połączenie... Ładowanie może potrwać dłużej
  </p>
)}
```

**Feedback użytkownika:**

- Komunikat po 3s ładowania
- Skeleton loader pozostaje widoczny

---

### 10.5 Offline mode

**Scenariusz:** Użytkownik stracił połączenie z internetem

**Obsługa:**

```typescript
// W useVideos
catch (err) {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    setError(new Error('Brak połączenia z internetem'));
  } else {
    setError(err instanceof Error ? err : new Error('Unknown error'));
  }
}

// W VideoGrid
if (error?.message.includes('Brak połączenia')) {
  toast.error('Sprawdź połączenie z internetem');
}
```

**Feedback użytkownika:**

- Toast: "Sprawdź połączenie z internetem"
- EmptyState z komunikatem

---

### 10.6 Błąd autentykacji (401 Unauthorized)

**Scenariusz:** Token wygasł podczas przeglądania

**Obsługa:**

```typescript
if (response.status === 401) {
  toast.error("Sesja wygasła. Zaloguj się ponownie.", {
    action: {
      label: "Zaloguj się",
      onClick: signIn,
    },
  });
}
```

**Feedback użytkownika:**

- Toast z przyciskiem "Zaloguj się"

## 11. Kroki implementacji

### Krok 1: Setup struktury projektu (30 min)

1.1. Utworzyć folder `src/lib/hooks/`
1.2. Utworzyć folder `src/lib/types/`
1.3. Utworzyć folder `src/lib/utils/`
1.4. Zainstalować zależności:

```bash
npm install @supabase/supabase-js
npm install sonner  # Toast notifications
npm install @radix-ui/react-select @radix-ui/react-dropdown-menu  # Shadcn deps
```

---

### Krok 2: Implementacja utility functions (1h)

2.1. Utworzyć `src/lib/utils/video.utils.ts`:

```typescript
export function canAccessVideo(video: Video, userRole: UserRole | null): boolean {
  if (video.status !== "published" && userRole !== "admin") return false;
  if (video.is_premium) return userRole === "premium" || userRole === "admin";
  return true;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getCategoryLabel(category: VideoCategory): string {
  const labels = {
    yoga: "Yoga",
    mobility: "Mobilność",
    calisthenics: "Kalistenika",
  };
  return labels[category];
}

export function getLevelLabel(level: VideoLevel): string {
  const labels = {
    beginner: "Początkujący",
    intermediate: "Średniozaawansowany",
    advanced: "Zaawansowany",
  };
  return labels[level];
}
```

2.2. Utworzyć `src/lib/types/view-models.ts` z typami z sekcji 5.2

---

### Krok 3: Implementacja custom hooks (2h)

3.1. Utworzyć `src/lib/hooks/useAuth.ts` (implementacja z sekcji 6.3)
3.2. Utworzyć `src/lib/hooks/useFilters.ts` (implementacja z sekcji 6.2)
3.3. Utworzyć `src/lib/hooks/useVideos.ts` (implementacja z sekcji 6.1)
3.4. Przetestować każdy hook osobno (console.log states)

---

### Krok 4: Implementacja UI components (Shadcn) (1h)

4.1. Zainstalować Shadcn components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add skeleton
```

4.2. Skonfigurować Tailwind theme w `tailwind.config.mjs`
4.3. Dodać global styles w `src/styles/global.css`

---

### Krok 5: Implementacja podstawowych komponentów (2h)

5.1. Utworzyć `src/components/SkeletonLoader.tsx` (sekcja 4.7)
5.2. Utworzyć `src/components/EmptyState.tsx` (sekcja 4.8)
5.3. Przetestować komponenty w isolation (Storybook lub osobna strona)

---

### Krok 6: Implementacja VideoCard (1.5h)

6.1. Utworzyć `src/components/VideoCard.tsx` (sekcja 4.6)
6.2. Dodać placeholder image w `public/placeholder-thumbnail.jpg`
6.3. Przetestować różne states:

- Free video, logged out → normalne wyświetlanie
- Premium video, logged out → blur + overlay
- Premium video, premium user → normalne wyświetlanie
- Error loading image → placeholder

---

### Krok 7: Implementacja VideoGrid (1h)

7.1. Utworzyć `src/components/VideoGrid.tsx` (sekcja 4.5)
7.2. Podłączyć `useVideos` hook
7.3. Przetestować states:

- Loading → SkeletonLoader
- Error → EmptyState + toast
- Empty array → EmptyState
- Success → grid z VideoCard

---

### Krok 8: Implementacja FilterBar (1.5h)

8.1. Utworzyć `src/components/FilterBar.tsx` (sekcja 4.4)
8.2. Podłączyć `useFilters` hook
8.3. Przetestować:

- Kliknięcie kategorii → update URL
- Wybór poziomu → update URL
- Clear filters → reset URL
- Przycisk "Wyczyść filtry" pokazany tylko gdy filtry aktywne

---

### Krok 9: Implementacja AuthButton (1.5h)

9.1. Utworzyć `src/components/AuthButton.tsx` (sekcja 4.3)
9.2. Podłączyć `useAuth` hook
9.3. Przetestować:

- Loading state → skeleton
- Logged out → "Zaloguj się" button
- Logged in → UserMenu dropdown z email, rolą, logout
- Sign in flow → magic link
- Sign out flow → logout

---

### Krok 10: Implementacja Navbar (0.5h)

10.1. Utworzyć `src/components/Navbar.astro` (sekcja 4.2)
10.2. Osadzić `<AuthButton client:load />`
10.3. Dodać responsive mobile menu (opcjonalne dla MVP)

---

### Krok 11: Implementacja strony głównej (1h)

11.1. Utworzyć `src/pages/index.astro` (sekcja 4.1)
11.2. Zaimportować wszystkie komponenty
11.3. Przekazać props z query params
11.4. Przetestować pełny flow:

- Load strony → SSR HTML
- Client-side hydration → React components interaktywne
- Zmiana filtrów → update URL → refetch

---

### Krok 12: Styling i responsive design (2h)

12.1. Dodać responsive breakpoints w gridzie:

- Mobile: 1 kolumna
- Tablet: 2 kolumny
- Desktop: 3 kolumny
- Large desktop: 4 kolumny

  12.2. Przetestować na różnych rozdzielczościach:

- Mobile (375px)
- Tablet (768px)
- Desktop (1440px)

  12.3. Dodać smooth transitions i hover effects

---

### Krok 13: Accessibility (1h)

13.1. Dodać ARIA labels:

- VideoCard: `role="article"`, `aria-label`
- Filtry: `aria-label` dla przycisków
- Select: built-in Radix UI accessibility

  13.2. Przetestować keyboard navigation:

- Tab przez wszystkie interaktywne elementy
- Enter/Space na VideoCard → nawigacja
- Escape na dropdown → zamknięcie

  13.3. Sprawdzić focus indicators (ring-2 ring-indigo-500)

---

### Krok 14: Error handling i edge cases (1.5h)

14.1. Dodać error boundaries (React 19)
14.2. Przetestować wszystkie scenariusze błędów z sekcji 10:

- API error → toast + retry
- Network error → offline message
- Validation error → ignore + default
- Empty results → EmptyState
- Slow connection → warning message

  14.3. Dodać toast notifications (Sonner) w `Layout.astro`:

```astro
<Toaster position="bottom-right" />
```

---

### Krok 15: Performance optimization (1h)

15.1. Dodać lazy loading dla obrazków:

```tsx
<img loading="lazy" ... />
```

15.2. Optymalizować obrazki (WebP format)

15.3. Dodać debounce dla filter changes (opcjonalne)

15.4. Przetestować Lighthouse:

- Performance > 90
- Accessibility > 95
- Best Practices > 90

---

### Krok 16: Testing (2h)

16.1. Testy manualne:

- ✅ Użytkownik niezalogowany widzi free videos
- ✅ Użytkownik niezalogowany widzi premium blur
- ✅ Użytkownik free widzi tylko free content
- ✅ Użytkownik premium widzi wszystko
- ✅ Filtrowanie po kategorii działa
- ✅ Filtrowanie po poziomie działa
- ✅ Clear filters działa
- ✅ Login flow działa
- ✅ Logout flow działa
- ✅ Kliknięcie video → nawigacja

  16.2. Cross-browser testing:

- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅

  16.3. Mobile testing:

- iOS Safari ✅
- Android Chrome ✅

---

### Krok 17: Final polish (1h)

17.1. Code review i refactoring
17.2. Usunięcie console.logs
17.3. Dodanie komentarzy do skomplikowanych funkcji
17.4. Update dokumentacji (README)
17.5. Commit i push do repo

---

**Całkowity szacowany czas:** ~20-22 godzin

**Podział na sesje:**

- Sesja 1 (3h): Kroki 1-3 (setup + hooks)
- Sesja 2 (3h): Kroki 4-6 (UI components + VideoCard)
- Sesja 3 (3h): Kroki 7-9 (VideoGrid + FilterBar + AuthButton)
- Sesja 4 (2h): Kroki 10-11 (Navbar + index.astro)
- Sesja 5 (3h): Kroki 12-13 (Styling + Accessibility)
- Sesja 6 (2.5h): Krok 14 (Error handling)
- Sesja 7 (3h): Kroki 15-17 (Performance + Testing + Polish)

---

**Checkpoints po każdej sesji:**

- [ ] Wszystkie komponenty z sesji zaimplementowane
- [ ] Brak błędów TypeScript
- [ ] Brak błędów linter
- [ ] Visual regression test (screenshot comparison)
- [ ] Commit z opisowym message

---

**Koniec planu implementacji**
