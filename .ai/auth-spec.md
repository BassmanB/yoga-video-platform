# Specyfikacja Techniczna: Moduł Autentykacji

**Projekt:** Platforma do Udostępniania Nagrań Ćwiczeń Fizycznych  
**Wersja:** 1.1 (zaktualizowana po weryfikacji zgodności z PRD)  
**Data:** 22 stycznia 2026  
**Autor:** Full-stack Developer  
**Status:** Zweryfikowana zgodność z PRD - Gotowa do implementacji  

---

## 1. Executive Summary

Niniejsza specyfikacja opisuje szczegółową architekturę modułu autentykacji dla platformy wideo z ćwiczeniami. Moduł realizuje wymagania określone w PRD (US-05, US-06, US-07, FR-09 - FR-13) wykorzystując Supabase Auth zintegrowany z Astro SSR oraz React 19.

### 1.1 Kluczowe Założenia Techniczne

- **Tryb renderowania:** Astro SSR (Node adapter) z React islands
- **Autentykacja:** Supabase Auth (Magic Link jako primary, Google OAuth jako opcja)
- **Zarządzanie sesją:** Server-side session management (Astro cookies) + client-side state (React hooks)
- **Kontrola dostępu:** Role-based (free/premium/admin) z RLS w Supabase
- **Walidacja:** Zod schemas dla wszystkich inputów
- **UI Components:** Shadcn/ui + React 19 + Tailwind 4

### 1.2 Dwa Ścieżki Autentykacji (zgodnie z PRD)

**WAŻNE:** System wspiera dwa różne flow:

1. **INVITE Flow (Nowi użytkownicy - US-05):**
   - Admin wysyła zaproszenie przez Supabase Dashboard
   - User klika link w emailu → konto tworzone automatycznie
   - Auto-login po kliknięciu invite link
   - **Brak self-service registration** - tylko invite-only

2. **Magic Link Flow (Istniejący użytkownicy - US-06):**
   - User idzie na `/auth/login`
   - Wpisuje email → otrzymuje magic link
   - Klika link → login do istniejącego konta
   - Dla convenience (bez hasła)

### 1.3 Istniejąca Implementacja

**Aktualnie zaimplementowane elementy:**
- `src/lib/hooks/useAuth.ts` - React hook do zarządzania stanem autentykacji client-side
- `src/components/AuthButton.tsx` - Komponent UI dla login/logout
- `src/lib/utils/auth.utils.ts` - Utility functions dla server-side auth
- `src/middleware/index.ts` - Podstawowy middleware z supabase client w context.locals
- `src/db/supabase.client.ts` - Klient Supabase dla client-side

**Co wymaga rozbudowy:**
- Brak dedykowanych stron dla auth flow (login, callback, error)
- Brak kompleksowej obsługi **invite callback**
- Brak kompleksowej obsługi magic link callback
- Brak Google OAuth integration
- Middleware nie weryfikuje sesji i nie ustawia user context
- Brak walidacji inputów z Zod
- Brak API endpoints dla auth operations

---

## 2. Architektura Interfejsu Użytkownika

### 2.1 Struktura Stron i Komponentów

#### 2.1.1 Nowe Strony Astro (SSR)

```
src/pages/
├── auth/
│   ├── login.astro              # Strona logowania
│   ├── callback.astro           # Callback po kliknięciu magic link
│   ├── error.astro              # Strona błędu autentykacji
│   └── verify-email.astro       # Potwierdzenie wysłania magic link
```

**A. `/auth/login.astro` - Strona Logowania (Dla Istniejących Użytkowników)**

**Odpowiedzialność:**
- Server-side: 
  - Sprawdzenie czy użytkownik jest już zalogowany (redirect do `/` jeśli tak)
  - Renderowanie Layout z formularzem logowania
- Client-side (React):
  - Renderowanie formularza z walidacją
  - Wywołanie API do wysłania magic link
  - Wyświetlanie komunikatów o sukcesie/błędzie
  - **Informacja dla nowych użytkowników** o konieczności invite

**Struktura:**
```typescript
// auth/login.astro (pseudo-kod struktury)
---
import Layout from "@/layouts/Layout.astro";
import { LoginForm } from "@/components/auth/LoginForm";

// Server-side logic
const supabase = Astro.locals.supabase;
const { data: { session } } = await supabase.auth.getSession();

// Redirect if already logged in
if (session) {
  return Astro.redirect("/");
}

// Optional: Get redirect URL from query params
const redirectTo = Astro.url.searchParams.get("redirect") || "/";
---

<Layout title="Zaloguj się">
  <main class="min-h-screen flex items-center justify-center bg-background px-4">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold">Zaloguj się</h1>
        <p class="text-muted-foreground mt-2">
          Wyślemy Ci link logowania na email
        </p>
      </div>
      
      <LoginForm client:load redirectTo={redirectTo} />
      
      <!-- Info dla nowych użytkowników -->
      <div class="text-center text-sm text-muted-foreground border-t pt-4">
        <p>Nie masz jeszcze konta?</p>
        <p class="mt-1">
          Skontaktuj się z <a href="mailto:admin@example.com" class="text-primary hover:underline">admin@example.com</a> aby otrzymać zaproszenie.
        </p>
      </div>
    </div>
  </main>
</Layout>
```

**Kluczowa różnica vs PRD:**
- Strona informuje nowych użytkowników że potrzebują invite (zgodnie z US-05)
- Self-service registration NIE jest możliwa (zgodnie z PRD)

**B. `/auth/callback.astro` - Magic Link Callback**

**Odpowiedzialność:**
- Server-side:
  - Wyciągnięcie token z URL hash/query params
  - Wymiana token na sesję (Supabase Auth)
  - Ustawienie session cookie
  - Redirect do strony docelowej lub `/`
- Error handling:
  - Redirect do `/auth/error` z odpowiednim kodem błędu

**Struktura:**
```typescript
// auth/callback.astro (pseudo-kod)
---
// Server-side: Exchange token for session
const supabase = Astro.locals.supabase;
const { searchParams } = Astro.url;

// Get params from URL (both invite and magiclink use these)
const token_hash = searchParams.get("token_hash");
const type = searchParams.get("type"); // "invite" | "magiclink"

// Validate params
if (!token_hash || !type) {
  return Astro.redirect("/auth/error?code=invalid_token");
}

// Verify type is supported
if (type !== "magiclink" && type !== "invite") {
  return Astro.redirect("/auth/error?code=invalid_token");
}

// Exchange token for session (works for both invite and magic link)
const { data, error } = await supabase.auth.verifyOtp({
  token_hash,
  type: type as "magiclink" | "invite"
});

if (error || !data.session) {
  console.error("Auth callback error:", error);
  return Astro.redirect("/auth/error?code=verification_failed");
}

// Session is now set in cookies automatically
// For invites: user account was created
// For magic links: existing user logged in

// Redirect to original destination or home
const redirectTo = searchParams.get("redirect") || "/";
return Astro.redirect(redirectTo);
---

<!-- This page should never render - always redirects -->
```

**C. `/auth/verify-email.astro` - Potwierdzenie Wysłania Email**

**Odpowiedzialność:**
- Wyświetlenie informacji o wysłaniu magic link
- Instrukcje dla użytkownika (sprawdź spam, itp.)
- Link do ponownego wysłania

**Struktura:**
```typescript
// auth/verify-email.astro
---
import Layout from "@/layouts/Layout.astro";
import { ResendEmailButton } from "@/components/auth/ResendEmailButton";

const email = Astro.url.searchParams.get("email") || "";
---

<Layout title="Sprawdź swoją skrzynkę">
  <main class="min-h-screen flex items-center justify-center bg-background px-4">
    <div class="max-w-md w-full space-y-6 text-center">
      <div class="space-y-2">
        <h1 class="text-3xl font-bold">Sprawdź swoją skrzynkę email</h1>
        <p class="text-muted-foreground">
          Wysłaliśmy link logowania na adres:
        </p>
        <p class="font-semibold text-lg">{email}</p>
      </div>
      
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Kliknij w link w emailu, aby się zalogować. Link jest ważny przez 60 minut.
        </p>
        
        <div class="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-1">
          <p class="font-semibold">Nie widzisz emaila?</p>
          <ul class="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Sprawdź folder spam/junk</li>
            <li>Upewnij się, że adres email jest poprawny</li>
            <li>Poczekaj kilka minut - czasami email może się opóźnić</li>
          </ul>
        </div>
        
        <ResendEmailButton client:load email={email} />
        
        <a href="/auth/login" class="text-sm text-primary hover:underline inline-block">
          ← Wróć do logowania
        </a>
      </div>
    </div>
  </main>
</Layout>
```

**D. `/auth/error.astro` - Strona Błędu Autentykacji**

**Odpowiedzialność:**
- Wyświetlenie użytkownikowi przyjaznego komunikatu błędu
- Różne komunikaty w zależności od kodu błędu
- Link powrotny do logowania

**Struktura:**
```typescript
// auth/error.astro
---
import Layout from "@/layouts/Layout.astro";
import { Button } from "@/components/ui/button";

const errorCode = Astro.url.searchParams.get("code") || "unknown";

const errorMessages: Record<string, { title: string; description: string }> = {
  invalid_token: {
    title: "Nieprawidłowy link",
    description: "Link logowania jest nieprawidłowy lub wygasł. Spróbuj zalogować się ponownie."
  },
  verification_failed: {
    title: "Weryfikacja nie powiodła się",
    description: "Nie udało się zweryfikować Twojego emaila. Link mógł wygasnąć."
  },
  email_not_confirmed: {
    title: "Email niepotwierdzony",
    description: "Musisz najpierw potwierdzić swój adres email."
  },
  access_denied: {
    title: "Brak dostępu",
    description: "Nie masz uprawnień do tej akcji."
  },
  unknown: {
    title: "Wystąpił błąd",
    description: "Coś poszło nie tak. Spróbuj ponownie później."
  }
};

const error = errorMessages[errorCode] || errorMessages.unknown;
---

<Layout title="Błąd logowania">
  <main class="min-h-screen flex items-center justify-center bg-background px-4">
    <div class="max-w-md w-full space-y-6 text-center">
      <div class="space-y-2">
        <div class="text-6xl">⚠️</div>
        <h1 class="text-2xl font-bold">{error.title}</h1>
        <p class="text-muted-foreground">{error.description}</p>
      </div>
      
      <a href="/auth/login">
        <Button>Przejdź do logowania</Button>
      </a>
    </div>
  </main>
</Layout>
```

#### 2.1.2 Nowe Komponenty React

```
src/components/auth/
├── LoginForm.tsx                # Formularz logowania (magic link)
├── GoogleAuthButton.tsx         # Przycisk logowania przez Google
├── ResendEmailButton.tsx        # Przycisk do ponownego wysłania magic link
└── AuthGuard.tsx                # HOC/Wrapper dla protected content
```

**A. `LoginForm.tsx` - Formularz Logowania (Tylko dla Existing Users)**

**Odpowiedzialność:**
- Wyświetlenie pola input dla email
- Walidacja email po stronie klienta (Zod + React Hook Form)
- Wysłanie request do Supabase Auth (magic link dla istniejących użytkowników)
- Obsługa stanów: idle, loading, success, error
- Wyświetlanie komunikatów błędów inline
- Przekierowanie do `/auth/verify-email` po sukcesie
- **Jednolity komunikat sukcesu** niezależnie czy email istnieje (email enumeration prevention)

**Interfejs:**
```typescript
interface LoginFormProps {
  redirectTo?: string;  // URL do przekierowania po zalogowaniu
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Zod schema dla walidacji
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Podaj prawidłowy adres email")
    .max(255, "Email jest za długi")
});

type LoginFormData = z.infer<typeof loginSchema>;
```

**Kluczowe metody:**
```typescript
async function handleSubmit(data: LoginFormData) {
  // 1. Walidacja (React Hook Form + Zod)
  // 2. Call Supabase Auth signInWithOtp
  // 3. Redirect do /auth/verify-email?email={email}
  // 4. Error handling z toast notifications
}
```

**Stany UI:**
- **Idle:** Formularz gotowy do wprowadzenia danych
- **Loading:** Spinner + disabled inputs podczas wysyłania
- **Error:** Wyświetlenie błędu pod inputem lub jako toast
- **Success:** Redirect do verify-email (brak wizualnego stanu, bo redirect)

**B. `GoogleAuthButton.tsx` - Google OAuth**

**Odpowiedzialność:**
- Przycisk "Kontynuuj z Google"
- Wywołanie Supabase Auth signInWithOAuth
- Obsługa błędów OAuth flow

**Interfejs:**
```typescript
interface GoogleAuthButtonProps {
  redirectTo?: string;
  onError?: (error: Error) => void;
}

async function handleGoogleLogin() {
  // Call supabase.auth.signInWithOAuth({ provider: 'google' })
  // Supabase redirects to Google, then back to callback URL
}
```

**C. `ResendEmailButton.tsx` - Ponowne Wysłanie Magic Link**

**Odpowiedzialność:**
- Przycisk z throttling (np. 60s cooldown)
- Ponowne wywołanie signInWithOtp
- Wyświetlenie countdown timera

**Interfejs:**
```typescript
interface ResendEmailButtonProps {
  email: string;
}

// Stan: countdown timer (60s)
// Po kliknięciu: resend + restart timer
```

**D. `AuthGuard.tsx` - Component dla Protected Content**

**Odpowiedzialność:**
- Wrapper component sprawdzający autentykację
- Dla niezalogowanych: wyświetla komunikat lub przekierowuje
- Opcjonalnie: sprawdzenie roli (role-based guard)

**Interfejs:**
```typescript
interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

// Użycie:
<AuthGuard requiredRole="premium">
  <PremiumContent />
</AuthGuard>
```

#### 2.1.3 Rozszerzenie Istniejących Komponentów

**A. Rozszerzenie `src/components/AuthButton.tsx`**

**Aktualne funkcjonalności:**
- Wyświetlanie przycisku "Zaloguj się" dla niezalogowanych
- Avatar + dropdown menu dla zalogowanych
- Badge z rolą użytkownika
- Przycisk "Wyloguj się"

**Wymagane zmiany:**
- Zamienić `prompt()` na redirect do `/auth/login`
- Dodać obsługę loading state podczas wylogowywania
- Dodać toast notification po wylogowaniu
- Opcjonalnie: pokazać menu z linkiem do profilu (future)

**Nowa implementacja metody `signIn`:**
```typescript
const signIn = () => {
  // Zamiast prompt(), redirect do strony logowania
  window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
};
```

**B. Rozszerzenie `src/lib/hooks/useAuth.ts`**

**Aktualne funkcjonalności:**
- Inicjalizacja Supabase client
- Pobranie sesji użytkownika
- Listener na zmiany auth state
- Metody: signIn (prompt), signOut

**Wymagane zmiany:**
- Usunąć prompt() z signIn - to będzie tylko redirect
- Dodać metodę `signInWithMagicLink(email: string)`
- Dodać metodę `signInWithGoogle()`
- Dodać metodę `refreshSession()`
- Poprawić error handling (throw errors zamiast alert)
- Dodać revalidation po powrocie na tab (visibility change)

**Nowy interfejs:**
```typescript
interface UseAuthResult {
  user: SupabaseUser | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithMagicLink: (email: string, redirectTo?: string) => Promise<void>;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

**C. Rozszerzenie `src/components/Navbar.astro`**

**Wymagane zmiany:**
- Brak - navbar już używa AuthButton
- Opcjonalnie: dodać link do profilu w przyszłości

#### 2.1.4 Protected Routes - Modyfikacje Istniejących Stron

**A. Rozszerzenie `/video/[id].astro`**

**Aktualna implementacja:**
- Pobiera sesję na serwerze
- Ekstraktuje rolę z user_metadata
- Przekazuje `userRole` do VideoPlayerContainer

**Wymagane zmiany:**
- Dodać redirect do `/auth/login` dla premium content gdy user nie zalogowany
- Ulepszony error handling
- Breadcrumb z informacją o wymaganej roli

**Nowa logika:**
```typescript
// video/[id].astro (fragment server-side logic)
const supabase = Astro.locals.supabase;

// Fetch video metadata (potrzebne przed auth check)
const { data: video } = await supabase
  .from("videos")
  .select("*")
  .eq("id", id)
  .single();

if (!video) {
  return Astro.redirect("/404");
}

// Check auth only for premium content
if (video.is_premium) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(`/video/${id}`);
    return Astro.redirect(`/auth/login?redirect=${returnUrl}`);
  }
  
  // Check role
  const userRole = session.user.user_metadata?.role || "free";
  
  if (userRole !== "premium" && userRole !== "admin") {
    // Show premium gate (already implemented in VideoPlayerContainer)
    // No redirect - show gate UI
  }
}
```

### 2.2 Walidacja i Komunikaty Błędów

#### 2.2.1 Walidacja Client-Side (React Hook Form + Zod)

**Email Validation Schema:**
```typescript
// src/lib/validators/auth.validator.ts

export const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Podaj prawidłowy adres email")
    .max(255, "Email jest za długi")
    .toLowerCase()
    .trim()
});

export const loginSchema = emailSchema;

// Future: password reset schema
export const resetPasswordSchema = z.object({
  email: emailSchema.shape.email
});
```

**React Hook Form Integration:**
```typescript
// W LoginForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting }
} = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema)
});
```

#### 2.2.2 Komunikaty Błędów

**Kategorie błędów:**

1. **Błędy walidacji (client-side):**
   - Email pusty: "Email jest wymagany"
   - Email nieprawidłowy: "Podaj prawidłowy adres email"
   - Email za długi: "Email jest za długi"

2. **Błędy autentykacji (Supabase):**
   - Email nie istnieje: **"Link wysłany na podany adres email"** (jednolity komunikat - email enumeration prevention)
   - Link wygasł: "Link logowania wygasł. Spróbuj zalogować się ponownie."
   - Token nieprawidłowy: "Link logowania jest nieprawidłowy."
   - Rate limit: "Za dużo prób logowania. Spróbuj ponownie za kilka minut."
   - Brak zaproszenia: "Nie masz jeszcze konta. Skontaktuj się z administratorem, aby otrzymać zaproszenie."

3. **Błędy systemowe:**
   - Brak połączenia: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
   - Błąd serwera: "Wystąpił błąd serwera. Spróbuj ponownie później."
   - Supabase nie skonfigurowany: "⚠️ Supabase nie jest skonfigurowany. Zobacz ENV_SETUP.md."

**Prezentacja błędów:**
- Błędy walidacji: Inline pod inputem (czerwony text)
- Błędy auth/systemowe: Toast notification (Sonner)
- Błędy strony: Dedykowana strona `/auth/error`

**Poziomy severity:**
- **Error (czerwony):** Błędy blokujące akcję
- **Warning (żółty):** Ostrzeżenia (np. email może trafić do spam)
- **Info (niebieski):** Informacje (np. "Link wysłany")
- **Success (zielony):** Sukces operacji

#### 2.2.3 Loading States

**Rodzaje loading states:**

1. **Form submission:**
   - Spinner w przycisku submit
   - Disabled inputs
   - Text przycisku: "Wysyłanie..." zamiast "Wyślij link"

2. **Auth state initialization:**
   - Skeleton loader w AuthButton (już zaimplementowane)
   - Opcjonalnie: Full-page loader dla protected routes

3. **OAuth redirect:**
   - Loading overlay z komunikatem "Przekierowywanie do Google..."

4. **Session refresh:**
   - Cichy refresh w tle (bez UI)
   - Tylko error toast jeśli nie powiedzie się

### 2.3 Obsługa Kluczowych Scenariuszy

#### Scenariusz 1: Nowy Użytkownik - Invite Flow (Zgodnie z US-05)

**Flow (zgodnie z PRD sekcja 7.1):**
1. User wchodzi na `/` (niezalogowany)
2. Ogląda darmowe treści, próbuje otworzyć premium content
3. Widzi komunikat w PremiumGate: "Skontaktuj się z [email] aby uzyskać dostęp"
4. User kontaktuje się z adminem (email/social media)
5. **Admin wysyła zaproszenie przez Supabase Dashboard:**
   - Authentication → Users → Invite user
   - Wpisuje email + ustawia user_metadata (role: "premium" lub "free")
6. User otrzymuje "Invite User Email" z linkiem
7. Klika link → Redirect do `/auth/callback?token_hash=...&type=invite`
8. Server wykrywa `type=invite`:
   - Tworzy konto użytkownika automatycznie
   - Ustawia sesję
   - Ustawia rolę z metadata
9. → Redirect do `/` z zalogowaną sesją
10. Navbar pokazuje avatar + rolę (premium/free)
11. User ma dostęp zgodny ze swoją rolą

**Error paths:**
- Link wygasł → Redirect do `/auth/error?code=invalid_token`
- Email już istnieje → Supabase obsługuje (może użyć magic link zamiast)
- Brak metadanych role → Default do "free"

**Ważne:**
- Nowi użytkownicy **NIE MOGĄ** sami się rejestrować
- Jedyna droga: zaproszenie od admina (US-05)
- Zabezpiecza przed spam/unwanted users

#### Scenariusz 2: Powracający Użytkownik - Magic Link Login (US-06)

**Flow (dla istniejących użytkowników):**
1. User wchodzi na `/` (niezalogowany, ale ma już konto w systemie)
2. Klika "Zaloguj się" w navbar
3. → Redirect do `/auth/login`
4. Wpisuje email w formularz
5. Kliknięcie "Wyślij link" → POST do Supabase Auth (signInWithOtp)
6. → Redirect do `/auth/verify-email?email=user@example.com`
7. User otwiera email, klika "Magic Link"
8. → Redirect do `/auth/callback?token_hash=...&type=magiclink`
9. Server wykrywa `type=magiclink`:
   - Weryfikuje token
   - Ustawia sesję
10. → Redirect do `/` (lub original `redirect` param)
11. Navbar pokazuje avatar + rolę

**Error paths:**
- Email nie istnieje w bazie → **Jednolity komunikat** "Link wysłany" (email enumeration prevention)
  - W rzeczywistości: email nie zostaje wysłany, ale user tego nie wie (security)
- Link wygasł → Redirect do `/auth/error?code=invalid_token`
- Supabase down → Toast: "Wystąpił błąd serwera..."

**Optymalizacja:**
- Jeśli user ma valid session cookie, auto-login (bez potrzeby logowania)
- Session refresh na visibility change (user wraca na tab)

**Uwaga bezpieczeństwa:**
- Strona `/auth/login` pokazuje ten sam komunikat sukcesu niezależnie czy email istnieje
- Zapobiega to Email Enumeration Attack (sprawdzaniu czy email ma konto)

#### Scenariusz 3: Logowanie przez Google OAuth

**Flow:**
1. User na `/auth/login`
2. Klika "Kontynuuj z Google"
3. → Supabase redirect do Google OAuth
4. Google authorization screen
5. User akceptuje
6. → Google redirect do `/auth/callback` z OAuth params
7. Supabase wymienia OAuth token na session
8. → Redirect do `/`

**Error paths:**
- User odmawia w Google → Redirect do `/auth/error?code=access_denied`
- Google OAuth error → Error page z komunikatem

#### Scenariusz 4: Dostęp do Premium Content - Niezalogowany

**Flow:**
1. User (niezalogowany) wchodzi na `/video/{premium-id}`
2. Server sprawdza `video.is_premium === true`
3. Server sprawdza `session === null`
4. → Redirect do `/auth/login?redirect=/video/{premium-id}`
5. User loguje się
6. → Po callback redirect do `/video/{premium-id}`
7. Teraz user widzi content (jeśli ma rolę premium/admin)

#### Scenariusz 5: Dostęp do Premium Content - Free User

**Flow:**
1. User (zalogowany, rola: free) wchodzi na `/video/{premium-id}`
2. Server sprawdza `session.user.user_metadata.role === "free"`
3. Strona renderuje się, ale VideoPlayerContainer pokazuje `<PremiumGate />`
4. User widzi komunikat: "Ta treść jest dostępna tylko dla użytkowników premium. Skontaktuj się z [email], aby uzyskać dostęp."

**Już zaimplementowane w:**
- `src/components/video-player/PremiumGate.tsx`
- `src/components/video-player/VideoPlayerContainer.tsx`

**Uwaga:**
- PremiumGate powinien zawierać kontaktowy email admina
- User może poprosić admina o upgrade roli free → premium
- Admin zmienia rolę w Supabase Dashboard (sekcja 4.3.2)

#### Scenariusz 6: Wylogowanie

**Flow:**
1. User (zalogowany) klika avatar w navbar
2. Dropdown menu → "Wyloguj się"
3. Call `supabase.auth.signOut()`
4. Session cleared (cookies)
5. Auth state updated → navbar shows "Zaloguj się"
6. Toast: "Wylogowano pomyślnie"
7. User pozostaje na tej samej stronie (lub redirect do `/`)

#### Scenariusz 7: Session Expiry - Auto Refresh

**Flow:**
1. User jest zalogowany, session wygasa po 1h (Supabase default)
2. `useAuth` hook wykrywa expired session
3. Automatyczny refresh przez `supabase.auth.refreshSession()`
4. Jeśli sukces → session odnowiona, user pozostaje zalogowany
5. Jeśli fail → user wylogowany, redirect do `/auth/login`

**Implementacja:**
- `useAuth` hook z `useEffect` na visibility change
- Refresh token jest valid przez 30 dni

#### Scenariusz 8: Ponowne Wysłanie Magic Link

**Flow:**
1. User na `/auth/verify-email`
2. Kliknięcie "Wyślij link ponownie"
3. Throttling check (60s)
4. Jeśli OK → POST do Supabase Auth
5. Toast: "Link wysłany ponownie"
6. Countdown timer restart (60s)

#### Scenariusz 9: Upgrade Roli Free → Premium (Manual by Admin)

**Flow (zgodnie z PRD - brak płatności online):**
1. User (zalogowany, rola: free) chce dostęp do premium content
2. Widzi komunikat w PremiumGate z kontaktowym emailem
3. User kontaktuje się z adminem (email/social)
4. Admin weryfikuje request
5. **Admin aktualizuje rolę w Supabase Dashboard:**
   - Authentication → Users → Wybór użytkownika
   - User Metadata → Edit JSON:
     ```json
     {
       "role": "premium",
       "display_name": "User Name"
     }
     ```
6. User **NIE musi** się ponownie logować
7. Przy następnym request/refresh session - nowa rola jest aktywna
8. User ma natychmiastowy dostęp do premium content

**Automatyczna propagacja nowej roli:**
- Supabase JWT zawiera user_metadata
- Przy następnym auth check (middleware) - nowa rola jest wykrywana
- Dla natychmiastowej zmiany: user może odświeżyć stronę lub poczekać na auto session refresh

---

## 3. Logika Backendowa

### 3.1 API Endpoints

Większość operacji auth jest obsługiwana przez **Supabase Auth** (managed service). Własne endpointy są potrzebne tylko dla custom logic.

#### 3.1.1 Supabase Auth Endpoints (Managed - Nie Wymagają Implementacji)

Supabase dostarcza gotowe endpointy poprzez SDK:

```typescript
// Magic Link
await supabase.auth.signInWithOtp({ email })

// OAuth
await supabase.auth.signInWithOAuth({ provider: 'google' })

// Sign Out
await supabase.auth.signOut()

// Get Session
await supabase.auth.getSession()

// Refresh Session
await supabase.auth.refreshSession()

// Get User
await supabase.auth.getUser()
```

**Callback URL Configuration (Supabase Dashboard):**
- **Site URL:** `https://yourdomain.com`
- **Redirect URLs:**
  - `https://yourdomain.com/auth/callback`
  - `http://localhost:3000/auth/callback` (dev)

#### 3.1.2 Custom API Endpoints (Opcjonalne - Future)

```
src/pages/api/auth/
├── session.ts               # GET - Sprawdzenie aktywnej sesji
└── verify-email.ts          # POST - Resend magic link (z rate limiting)
```

**A. `GET /api/auth/session`**

**Cel:** Endpoint do sprawdzenia czy użytkownik ma aktywną sesję (dla client-side checks)

**Request:**
```typescript
GET /api/auth/session
Headers:
  Cookie: sb-access-token=...
```

**Response (Success):**
```typescript
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "premium"
  }
}
```

**Response (Unauthenticated):**
```typescript
{
  "authenticated": false,
  "user": null
}
```

**Implementacja:**
```typescript
// src/pages/api/auth/session.ts
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return new Response(
      JSON.stringify({ authenticated: false, user: null }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
  
  return new Response(
    JSON.stringify({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || "free"
      }
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

export const prerender = false;
```

**B. `POST /api/auth/verify-email` (Resend Magic Link)**

**Cel:** Endpoint z rate limiting do ponownego wysłania magic link

**Request:**
```typescript
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (Success):**
```typescript
{
  "success": true,
  "message": "Link wysłany ponownie"
}
```

**Response (Rate Limited):**
```typescript
{
  "success": false,
  "error": "Rate limit exceeded. Spróbuj ponownie za 45 sekund."
}
```

**Implementacja:**
```typescript
// src/pages/api/auth/verify-email.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { emailSchema } from "@/lib/validators/auth.validator";

// In-memory rate limiting (production: use Redis)
const rateLimitStore = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 60 seconds

export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;
  
  try {
    // Parse and validate request body
    const body = await request.json();
    const { email } = emailSchema.parse(body);
    
    // Rate limiting check
    const lastRequest = rateLimitStore.get(email);
    const now = Date.now();
    
    if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW) {
      const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (now - lastRequest)) / 1000);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Rate limit exceeded. Spróbuj ponownie za ${waitTime} sekund.`
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Send magic link
    const { error } = await supabase.auth.signInWithOtp({ email });
    
    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Update rate limit store
    rateLimitStore.set(email, now);
    
    return new Response(
      JSON.stringify({ success: true, message: "Link wysłany ponownie" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ success: false, error: error.errors[0].message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const prerender = false;
```

### 3.2 Middleware - Session Management

#### 3.2.1 Rozszerzenie `src/middleware/index.ts`

**Aktualna implementacja:**
- Dodaje `supabaseClient` do `context.locals.supabase`

**Wymagane rozszerzenie:**
- Weryfikacja sesji dla każdego request
- Ustawienie user context w locals
- Refresh expired sessions (jeśli możliwe)
- Logowanie auth events (opcjonalnie)

**Nowa implementacja:**
```typescript
// src/middleware/index.ts
import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with request context (for session cookies)
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Use cookies for session persistence
      storage: {
        getItem: (key) => {
          return context.cookies.get(key)?.value || null;
        },
        setItem: (key, value) => {
          context.cookies.set(key, value, {
            path: "/",
            httpOnly: true,
            secure: import.meta.env.PROD,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30 // 30 days
          });
        },
        removeItem: (key) => {
          context.cookies.delete(key);
        }
      }
    }
  });
  
  // Attach supabase to locals
  context.locals.supabase = supabase;
  
  // Get session (this also refreshes if needed)
  const { data: { session } } = await supabase.auth.getSession();
  
  // Attach user to locals for easy access in routes
  context.locals.user = session?.user || null;
  context.locals.userRole = session?.user?.user_metadata?.role || null;
  
  // Continue to next middleware/route
  return next();
});
```

**Typy dla locals (src/env.d.ts):**
```typescript
// src/env.d.ts
/// <reference types="astro/client" />

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";
import type { UserRole } from "./types";

declare namespace App {
  interface Locals {
    supabase: SupabaseClient<Database>;
    user: User | null;
    userRole: UserRole | null;
  }
}
```

### 3.3 Server-Side Route Guards

#### 3.3.1 Helper Functions dla Protected Routes

```typescript
// src/lib/utils/auth.server.ts (nowy plik)

import type { AstroGlobal } from "astro";
import type { UserRole } from "@/types";

/**
 * Redirect to login if user is not authenticated
 * Returns true if authenticated, false if redirected
 */
export async function requireAuth(Astro: AstroGlobal): Promise<boolean> {
  const user = Astro.locals.user;
  
  if (!user) {
    const returnUrl = encodeURIComponent(Astro.url.pathname + Astro.url.search);
    return Astro.redirect(`/auth/login?redirect=${returnUrl}`) as never;
  }
  
  return true;
}

/**
 * Redirect to login or error page if user doesn't have required role
 */
export async function requireRole(
  Astro: AstroGlobal,
  requiredRoles: UserRole | UserRole[]
): Promise<boolean> {
  // First check auth
  await requireAuth(Astro);
  
  const userRole = Astro.locals.userRole || "free";
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  if (!roles.includes(userRole)) {
    // User is authenticated but doesn't have required role
    return Astro.redirect("/auth/error?code=access_denied") as never;
  }
  
  return true;
}

/**
 * Check if user has role without redirecting
 */
export function hasRole(Astro: AstroGlobal, role: UserRole | UserRole[]): boolean {
  const userRole = Astro.locals.userRole;
  if (!userRole) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(userRole);
}
```

**Użycie w protected routes:**
```typescript
// Example: /admin/dashboard.astro
---
import { requireRole } from "@/lib/utils/auth.server";

// Require admin role
await requireRole(Astro, "admin");

// Route code continues only if user is admin...
---
```

### 3.4 Walidacja Danych Wejściowych (Zod)

#### 3.4.1 Auth Validators

```typescript
// src/lib/validators/auth.validator.ts

import { z } from "zod";

/**
 * Email validation schema
 */
export const emailSchema = z.object({
  email: z
    .string({ required_error: "Email jest wymagany" })
    .min(1, "Email jest wymagany")
    .max(255, "Email jest za długi")
    .email("Podaj prawidłowy adres email")
    .toLowerCase()
    .trim()
});

/**
 * Login form schema (magic link)
 */
export const loginSchema = emailSchema.extend({
  redirectTo: z.string().url().optional()
});

/**
 * OAuth redirect schema
 */
export const oauthSchema = z.object({
  provider: z.enum(["google"], {
    errorMap: () => ({ message: "Nieobsługiwany provider" })
  }),
  redirectTo: z.string().url().optional()
});

/**
 * Callback query params schema
 */
export const callbackSchema = z.object({
  token_hash: z.string().min(1, "Token is required"),
  type: z.enum(["magiclink", "recovery", "invite"]),
  redirect: z.string().optional()
});

// Export types
export type EmailInput = z.infer<typeof emailSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OAuthInput = z.infer<typeof oauthSchema>;
export type CallbackParams = z.infer<typeof callbackSchema>;
```

### 3.5 Error Handling

#### 3.5.1 Auth Error Types

```typescript
// src/lib/utils/auth-errors.ts

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

// Error code mappings dla Supabase errors
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "invalid_credentials": "Nieprawidłowy email lub hasło",
  "email_not_confirmed": "Email nie został potwierdzony",
  "user_not_found": "Nie znaleziono użytkownika z tym adresem email",
  "invalid_grant": "Link logowania wygasł lub jest nieprawidłowy",
  "over_email_send_rate_limit": "Za dużo prób logowania. Spróbuj ponownie za kilka minut.",
  "provider_email_needs_verification": "Email wymaga weryfikacji"
};

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check if it's a Supabase error with code
    const supabaseError = error as { code?: string };
    if (supabaseError.code && AUTH_ERROR_MESSAGES[supabaseError.code]) {
      return AUTH_ERROR_MESSAGES[supabaseError.code];
    }
    return error.message;
  }
  return "Wystąpił nieznany błąd";
}
```

#### 3.5.2 Error Response Helpers

```typescript
// src/lib/utils/response.utils.ts (rozszerzenie istniejącego)

import type { ErrorResponse } from "@/types";

export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: Record<string, unknown>
): Response {
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      details
    }
  };
  
  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: { "Content-Type": "application/json" }
  });
}

export function createSuccessResponse<T>(data: T, statusCode: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: { "Content-Type": "application/json" }
  });
}
```

### 3.6 Logging i Monitoring (Opcjonalne)

```typescript
// src/lib/utils/auth-logger.ts

interface AuthEvent {
  event: "login" | "logout" | "signup" | "session_refresh" | "auth_error";
  userId?: string;
  email?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function logAuthEvent(event: AuthEvent): void {
  if (import.meta.env.DEV) {
    console.log("[Auth Event]", event);
  }
  
  // Production: Send to analytics/monitoring service
  // e.g., Sentry, LogRocket, Supabase Analytics
}
```

---

## 4. System Autentykacji - Supabase Integration

### 4.1 Konfiguracja Supabase Auth

#### 4.1.1 Environment Variables

```bash
# .env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional for server-side admin operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 4.1.2 Supabase Dashboard Configuration

**Authentication Settings:**

1. **Email Auth:**
   - Enable Email provider ✅
   - Confirm email: **Disabled** (zgodnie z PRD - tylko invite-based registration)
     - **Powód:** Nowi użytkownicy są zapraszani przez admina (US-05)
     - Invite link automatycznie potwierdza email i tworzy konto
     - Istniejący użytkownicy używają magic link (już zweryfikowani)
   - Secure email change: Enabled
   - Email OTP length: 6 digits (default)
   - Email OTP expiry: 60 minutes (default)

2. **OAuth Providers:**
   - Google OAuth: **Enabled** (optional)
   - Authorized redirect URLs:
     - `https://yourdomain.com/auth/callback`
     - `http://localhost:3000/auth/callback`

3. **URL Configuration:**
   - Site URL: `https://yourdomain.com`
   - Redirect URLs:
     - `https://yourdomain.com/auth/callback`
     - `http://localhost:3000/auth/callback`

4. **Email Templates:**
   - **Magic Link Email:**
     ```html
     <h2>Zaloguj się do YogaFit</h2>
     <p>Kliknij poniższy link, aby się zalogować:</p>
     <p><a href="{{ .ConfirmationURL }}">Zaloguj się</a></p>
     <p>Link jest ważny przez 60 minut.</p>
     <p>Jeśli nie prosiłeś o ten email, zignoruj go.</p>
     ```

   - **Invite User Email:**
     ```html
     <h2>Zaproszenie do YogaFit</h2>
     <p>Zostałeś zaproszony do platformy YogaFit!</p>
     <p>Kliknij poniższy link, aby utworzyć konto:</p>
     <p><a href="{{ .ConfirmationURL }}">Utwórz konto</a></p>
     ```

### 4.2 Supabase Client Configuration

#### 4.2.1 Server-Side Client (dla Astro routes/middleware)

```typescript
// src/db/supabase.server.ts (nowy plik)

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

/**
 * Server-side Supabase client
 * Use this in Astro pages/API routes via context.locals.supabase
 */
export function createServerClient(
  cookieGetter: (key: string) => string | null,
  cookieSetter: (key: string, value: string) => void,
  cookieRemover: (key: string) => void
) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: cookieGetter,
        setItem: cookieSetter,
        removeItem: cookieRemover
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}
```

#### 4.2.2 Client-Side Client (dla React components)

```typescript
// src/db/supabase.client.ts (aktualizacja istniejącego)

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ Supabase environment variables are not set");
}

/**
 * Client-side Supabase client
 * Used in React components and hooks
 */
export const supabaseClient = createClient<Database>(
  supabaseUrl || "",
  supabaseAnonKey || "",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window?.localStorage // Use localStorage for client-side
    }
  }
);

// Type export for use in components
export type SupabaseClient = typeof supabaseClient;
```

### 4.3 User Metadata Schema

#### 4.3.1 User Metadata Structure

Supabase przechowuje dodatkowe dane użytkownika w `user_metadata`:

```typescript
interface UserMetadata {
  role: "free" | "premium" | "admin";
  display_name?: string;
  // Future fields:
  // avatar_url?: string;
  // preferences?: {
  //   email_notifications: boolean;
  // };
}
```

#### 4.3.2 Ustawianie Roli Użytkownika (Admin Task)

**Przez Supabase Dashboard:**
1. Authentication → Users
2. Wybierz użytkownika
3. User Metadata → Raw JSON:
```json
{
  "role": "premium",
  "display_name": "Jan Kowalski"
}
```

**Przez SQL (zaawansowane):**
```sql
-- Update user metadata via SQL
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "premium"}'::jsonb
WHERE email = 'user@example.com';
```

**Przez Supabase Dashboard (Primary Method - zgodnie z US-05):**
1. Authentication → Users → Invite user
2. Wpisz email nowego użytkownika
3. W sekcji User Metadata dodaj:
   ```json
   {
     "role": "premium",
     "display_name": "Jan Kowalski"
   }
   ```
4. Kliknij "Invite user"
5. User otrzyma "Invite User Email"
6. Po kliknięciu linku - konto utworzone z przypisaną rolą

**Przez Supabase Admin API (automated invite system - future):**
```typescript
// Example: Automated invite with role assignment
const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
  "newuser@example.com",
  {
    data: {
      role: "premium",
      display_name: "New User"
    },
    redirectTo: "https://yourdomain.com/auth/callback"
  }
);
```

**Uwaga:**
- **ZAWSZE** ustawiaj rolę podczas invite (default: "free" jeśli brak)
- Rola jest dostępna w `auth.jwt() -> 'user_metadata' ->> 'role'` w RLS policies

### 4.4 Row Level Security (RLS) Policies

#### 4.4.1 Videos Table Policies (aktualizacja z PRD)

```sql
-- Enable RLS on videos table
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Policy 1: Public videos viewable by everyone
CREATE POLICY "Public videos are viewable by everyone"
ON videos FOR SELECT
USING (is_premium = false AND status = 'published');

-- Policy 2: Premium videos for authenticated premium/admin users
CREATE POLICY "Premium videos for authenticated premium/admin users"
ON videos FOR SELECT
USING (
  is_premium = true
  AND status = 'published'
  AND auth.uid() IS NOT NULL
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'premium'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
);

-- Policy 3: Admins can see all videos (including drafts)
CREATE POLICY "Admins can see all videos"
ON videos FOR SELECT
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Policy 4: Only admins can insert videos
CREATE POLICY "Only admins can insert videos"
ON videos FOR INSERT
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Policy 5: Only admins can update videos
CREATE POLICY "Only admins can update videos"
ON videos FOR UPDATE
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Policy 6: Only admins can delete videos
CREATE POLICY "Only admins can delete videos"
ON videos FOR DELETE
USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
```

#### 4.4.2 Storage Policies

```sql
-- Bucket: videos
-- Policy: Public read for free content, authenticated read for premium

CREATE POLICY "Public videos are publicly accessible"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] = 'public'
);

CREATE POLICY "Premium videos require authentication"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] = 'premium'
  AND auth.uid() IS NOT NULL
  AND (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'premium'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
);

-- Only admins can upload
CREATE POLICY "Only admins can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos'
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);
```

### 4.5 Session Management

#### 4.5.1 Session Lifecycle

**Session Duration:**
- Access token expiry: **1 hour** (Supabase default)
- Refresh token expiry: **30 days** (Supabase default)

**Refresh Strategy:**
1. **Automatic refresh (Supabase SDK):**
   - SDK automatycznie odnawia session przed wygaśnięciem
   - Używa refresh token przechowywanego w cookie/localStorage

2. **Manual refresh (w useAuth hook):**
```typescript
// W useAuth hook - refresh on visibility change
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      supabase.auth.refreshSession();
    }
  };
  
  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, []);
```

3. **Session verification na server-side:**
```typescript
// W middleware - session jest weryfikowana przy każdym request
const { data: { session } } = await supabase.auth.getSession();
```

#### 4.5.2 Cookie Configuration

**Cookies ustawiane przez Supabase:**
- `sb-access-token` - JWT access token
- `sb-refresh-token` - Refresh token

**Parametry (ustawiane w middleware):**
```typescript
{
  path: "/",
  httpOnly: true,           // Ochrona przed XSS
  secure: true,             // Tylko HTTPS (production)
  sameSite: "lax",          // CSRF protection
  maxAge: 60 * 60 * 24 * 30 // 30 days
}
```

### 4.6 Security Best Practices

#### 4.6.1 Checklist Bezpieczeństwa

- ✅ **HTTPS Only** - Wymuszenie HTTPS w production
- ✅ **HttpOnly Cookies** - Session tokens w httpOnly cookies
- ✅ **SameSite Cookies** - CSRF protection
- ✅ **RLS Policies** - Database-level access control
- ✅ **Input Validation** - Zod schemas dla wszystkich inputów
- ✅ **Rate Limiting** - Throttling dla magic link resend
- ✅ **Email Verification** - Magic links z expiry (60 min)
- ✅ **Role Validation** - Server-side role checks

#### 4.6.2 Potencjalne Zagrożenia i Mitigacje

| Zagrożenie | Opis | Mitigacja |
|------------|------|-----------|
| **XSS (Cross-Site Scripting)** | Injection złośliwego JS | HttpOnly cookies, CSP headers, input sanitization |
| **CSRF (Cross-Site Request Forgery)** | Nieautoryzowane requesty | SameSite cookies, origin checks |
| **Session Hijacking** | Kradzież session token | HTTPS only, short token expiry, IP validation (optional) |
| **Brute Force Login** | Wielokrotne próby logowania | Rate limiting na email endpoint |
| **Email Enumeration** | Sprawdzanie czy email istnieje | Jednolite komunikaty błędów ("Link wysłany" nawet jeśli email nie istnieje) |
| **Token Replay** | Ponowne użycie starego tokenu | Token jednorazowy (Supabase default) |

---

## 5. Integracja z Istniejącą Funkcjonalnością

### 5.1 Zmiany w Istniejących Komponentach

#### 5.1.1 VideoPlayerContainer

**Aktualna logika:**
- Przyjmuje `userRole` jako prop
- Jeśli video premium i user free → pokazuje `<PremiumGate />`

**Wymagane zmiany:**
- Brak - komponent już obsługuje premium gating poprawnie
- Opcjonalnie: dodać retry logic jeśli failed auth check

#### 5.1.2 Navbar

**Aktualna implementacja:**
- Używa `<AuthButton client:load />`

**Wymagane zmiany:**
- Brak - navbar już korzysta z komponentu AuthButton
- Future: Dodać dropdown links (Profile, Settings)

#### 5.1.3 Protected API Routes

**Przykład: `/api/videos/[id].ts`**

**Dodanie auth check:**
```typescript
// src/pages/api/videos/[id].ts (fragment)
import { requireAuth, getUserRole } from "@/lib/utils/auth.utils";

export const GET: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;
  const { id } = params;
  
  // Fetch video
  const { data: video, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error || !video) {
    return createErrorResponse("VIDEO_NOT_FOUND", "Video not found", 404);
  }
  
  // Auth check for premium content
  if (video.is_premium) {
    try {
      await requireAuth(supabase);
      const role = await getUserRole(supabase);
      
      if (role !== "premium" && role !== "admin") {
        return createErrorResponse("FORBIDDEN", "Premium access required", 403);
      }
    } catch (error) {
      return createErrorResponse("UNAUTHORIZED", "Authentication required", 401);
    }
  }
  
  // Return video...
};
```

### 5.2 Database Migrations (Jeśli potrzebne)

**Aktualna struktura `videos` table:**
- Zawiera już pole `is_premium`
- RLS policies muszą być zaktualizowane (patrz sekcja 4.4.1)

**Brak potrzeby migracji struktur tabel** - wszystko już istnieje zgodnie z PRD.

### 5.3 Environment Setup

**Nowe zmienne środowiskowe:**
```bash
# .env (production)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Optional

# Optional: Google OAuth (if implemented)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Validation przy starcie:**
```typescript
// src/lib/utils/env-check.ts (rozszerzenie istniejącego)

export function checkAuthEnvVariables(): boolean {
  const required = [
    "PUBLIC_SUPABASE_URL",
    "PUBLIC_SUPABASE_ANON_KEY"
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing auth environment variables: ${missing.join(", ")}`);
    return false;
  }
  
  return true;
}
```

---

## 6. Testing Strategy

### 6.1 Manual Testing Checklist

**Invite Flow Tests (US-05):**
- [ ] Admin wysyła invite przez Supabase Dashboard
- [ ] User otrzymuje "Invite User Email"
- [ ] Kliknięcie invite link → konto utworzone automatycznie
- [ ] Auto-login po invite
- [ ] Rola ustawiona poprawnie (z metadata)
- [ ] Invite link wygasł - error page

**Magic Link Flow Tests (US-06):**
- [ ] Wysłanie magic link - sukces (existing user)
- [ ] Wysłanie magic link - email nie istnieje (jednolity komunikat sukcesu)
- [ ] Kliknięcie magic link - auto login
- [ ] Magic link wygasł - error page
- [ ] Ponowne wysłanie magic link - throttling działa

**OAuth Flow Tests (FR-12 - Optional):**
- [ ] Google OAuth - sukces
- [ ] Google OAuth - user cancels

**Session Management Tests:**
- [ ] Wylogowanie - session cleared
- [ ] Session refresh - auto refresh po 55 min
- [ ] Multiple tabs - session sync

**Access Control Tests:**
- [ ] Free user - dostęp do free content ✅
- [ ] Free user - próba dostępu do premium → gate UI (PremiumGate)
- [ ] Premium user - dostęp do premium content ✅
- [ ] Niezalogowany - redirect do login dla premium content
- [ ] Admin - dostęp do wszystkich treści ✅

**Role Management Tests (US-15):**
- [ ] Admin zmienia rolę free → premium przez Dashboard
- [ ] Nowa rola propaguje się w kolejnym request
- [ ] User z nową rolą premium ma dostęp do premium content
- [ ] Admin zmienia rolę premium → free
- [ ] User z rolą free traci dostęp do premium content

**Edge Cases:**
- [ ] User już zalogowany - redirect z /auth/login do /
- [ ] Multiple tabs - session sync
- [ ] Browser back button po logout
- [ ] Expired session podczas oglądania wideo
- [ ] Network error podczas logowania

### 6.2 Automated Testing (Future - Optional)

**Playwright E2E Tests:**
```typescript
// tests/auth.spec.ts (przykład)

test.describe("Authentication", () => {
  test("should send magic link on login", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.click('button[type="submit"]');
    
    // Verify redirect to verify-email page
    await expect(page).toHaveURL(/\/auth\/verify-email/);
    await expect(page.locator("text=Sprawdź swoją skrzynkę")).toBeVisible();
  });
  
  test("should redirect logged-in user from login page", async ({ page }) => {
    // Login first
    await loginUser(page, "premium@example.com");
    
    // Try to access login page
    await page.goto("/auth/login");
    
    // Should redirect to home
    await expect(page).toHaveURL("/");
  });
});
```

---

## 7. Deployment Considerations

### 7.1 Production Checklist

**Supabase Configuration:**
- [ ] Email templates customized and tested
- [ ] Redirect URLs configured for production domain
- [ ] RLS policies enabled on all tables
- [ ] Storage policies configured
- [ ] Google OAuth credentials (if used)

**Environment:**
- [ ] Environment variables set in hosting platform
- [ ] HTTPS enforced
- [ ] CSP headers configured (optional but recommended)

**Monitoring:**
- [ ] Error tracking setup (Sentry, Supabase Dashboard)
- [ ] Auth event logging
- [ ] Rate limiting monitoring

### 7.2 Rollback Plan

W przypadku krytycznych błędów w module auth:

1. **Szybki rollback frontend:**
   - Revert do poprzedniej wersji aplikacji
   - AuthButton nadal działa w podstawowym trybie (prompt)

2. **Supabase rollback:**
   - RLS policies mogą być disabled/modified w dashboard
   - Email templates mogą być przywrócone

3. **Database rollback:**
   - Brak zmian strukturalnych - brak potrzeby migracji wstecz

---

## 8. Future Enhancements (Out of Scope for MVP)

Następujące funkcjonalności NIE są częścią obecnej specyfikacji, ale mogą być dodane w przyszłości:

- ❌ **Password-based authentication** - tylko magic link w MVP
- ❌ **Two-factor authentication (2FA)** - bezpieczeństwo premium
- ❌ **User profile page** - edycja display_name, avatar
- ❌ **Email change flow** - wymaga weryfikacji obu adresów
- ❌ **Account deletion** - self-service GDPR compliance
- ❌ **Remember me** - extended session duration
- ❌ **Social login (Facebook, Apple)** - dodatkowi providerzy
- ❌ **Admin panel** - UI do zarządzania użytkownikami
- ❌ **Invite system** - automated invites z custom email
- ❌ **Session management UI** - lista aktywnych sesji, logout all

---

## 9. Implementation Roadmap

### Phase 1: Core Auth (Tydzień 1)
- [ ] Setup Supabase Auth configuration
- [ ] Configure Email Templates (Magic Link + **Invite**)
- [ ] Update middleware with session management
- [ ] Create `/auth/login.astro` page (dla existing users)
- [ ] Create `LoginForm.tsx` component
- [ ] Create `/auth/callback.astro` handler (**obsługa invite + magiclink**)
- [ ] Create `/auth/verify-email.astro` page
- [ ] Create `/auth/error.astro` page
- [ ] Update `useAuth` hook (remove prompt, add proper methods)
- [ ] Update `AuthButton` (redirect instead of prompt)
- [ ] **Test invite flow end-to-end (US-05)**
- [ ] Test magic link flow end-to-end (US-06)

### Phase 2: Access Control (Tydzień 1-2)
- [ ] Update RLS policies in Supabase
- [ ] Add auth checks to `/video/[id].astro`
- [ ] Create `auth.server.ts` utilities (requireAuth, requireRole)
- [ ] Test premium content access (free/premium/admin roles)
- [ ] Test redirect flows for unauthorized access

### Phase 3: Validators & Error Handling (Tydzień 2)
- [ ] Create `auth.validator.ts` with Zod schemas
- [ ] Integrate validation in LoginForm
- [ ] Create error utility functions
- [ ] Improve error messages (user-friendly)
- [ ] Add toast notifications for auth events

### Phase 4: OAuth & Polish (Tydzień 2)
- [ ] Setup Google OAuth in Supabase Dashboard
- [ ] Create `GoogleAuthButton.tsx` component
- [ ] Add Google login to `/auth/login`
- [ ] Test OAuth flow
- [ ] Create `ResendEmailButton.tsx` with rate limiting
- [ ] Final testing of all flows

### Phase 5: Optional Enhancements (Tydzień 3 - jeśli czas pozwala)
- [ ] Create `/api/auth/session` endpoint
- [ ] Create `/api/auth/verify-email` endpoint with rate limiting
- [ ] Add session refresh on visibility change
- [ ] Add auth event logging
- [ ] Performance optimization

---

## 10. Success Criteria

### 10.1 Functional Requirements ✅

Moduł autentykacji uznaje się za ukończony, gdy:

- ✅ **Nowy user otrzymuje zaproszenie email od admina (US-05)**
- ✅ **Invite link tworzy konto i loguje automatycznie (US-05)**
- ✅ **Existing user może zalogować się przez magic link (US-06)**
- ✅ User otrzymuje email z linkiem w < 5s
- ✅ Kliknięcie magic link/invite → auto login + redirect
- ✅ **Zalogowany user widzi swój email i rolę w navbar (US-07)**
- ✅ User może się wylogować jednym kliknięciem
- ✅ Free user nie ma dostępu do premium content (gate UI)
- ✅ Premium user ma pełny dostęp do premium content
- ✅ Niezalogowany user jest redirectowany do `/auth/login` dla premium content
- ✅ Session automatycznie się odświeża przed expiry
- ✅ Admin może zarządzać rolami przez Supabase Dashboard (US-15)
- ✅ Google OAuth działa jako alternatywa (opcjonalnie - FR-12)

### 10.2 Non-Functional Requirements ✅

- ✅ Magic link delivery < 5s (99% przypadków)
- ✅ Auth check < 100ms (server-side)
- ✅ Session refresh transparent dla użytkownika
- ✅ Brak błędów 500 w auth flow (graceful error handling)
- ✅ Mobile responsive (wszystkie auth strony)
- ✅ Accessibility - keyboard navigation, screen readers

### 10.3 Security Requirements ✅

- ✅ Session tokens w httpOnly cookies
- ✅ HTTPS only w production
- ✅ RLS policies enabled i przetestowane
- ✅ Rate limiting na resend email
- ✅ Input validation (Zod) na wszystkich formularzach
- ✅ CSRF protection (SameSite cookies)

---

## 11. Appendix

### 11.1 File Structure Summary

Pełna lista nowych i zmodyfikowanych plików:

```
src/
├── pages/
│   ├── auth/
│   │   ├── login.astro              # ✨ NEW
│   │   ├── callback.astro           # ✨ NEW
│   │   ├── verify-email.astro       # ✨ NEW
│   │   └── error.astro              # ✨ NEW
│   ├── api/
│   │   └── auth/
│   │       ├── session.ts           # ✨ NEW (optional)
│   │       └── verify-email.ts      # ✨ NEW (optional)
│   └── video/
│       └── [id].astro               # 🔄 MODIFIED (add auth checks)
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx            # ✨ NEW
│   │   ├── GoogleAuthButton.tsx    # ✨ NEW (optional)
│   │   ├── ResendEmailButton.tsx   # ✨ NEW
│   │   └── AuthGuard.tsx           # ✨ NEW (optional)
│   ├── AuthButton.tsx               # 🔄 MODIFIED (remove prompt)
│   └── Navbar.astro                 # ✅ NO CHANGE
├── lib/
│   ├── hooks/
│   │   └── useAuth.ts               # 🔄 MODIFIED (add methods)
│   ├── utils/
│   │   ├── auth.utils.ts            # 🔄 MODIFIED (expand)
│   │   ├── auth.server.ts           # ✨ NEW (server-side guards)
│   │   ├── auth-errors.ts           # ✨ NEW
│   │   └── auth-logger.ts           # ✨ NEW (optional)
│   └── validators/
│       └── auth.validator.ts        # ✨ NEW
├── middleware/
│   └── index.ts                     # 🔄 MODIFIED (session mgmt)
├── db/
│   ├── supabase.client.ts           # 🔄 MODIFIED (auth config)
│   └── supabase.server.ts           # ✨ NEW
└── env.d.ts                         # 🔄 MODIFIED (locals types)
```

### 11.2 Tech Stack Summary

- **Frontend Framework:** Astro 5 (SSR, Node adapter)
- **UI Framework:** React 19 (client-side islands)
- **Styling:** Tailwind CSS 4 + Shadcn/ui
- **Auth Provider:** Supabase Auth
- **Session Storage:** Cookies (server-side) + localStorage (client-side sync)
- **Validation:** Zod 3.x + React Hook Form
- **TypeScript:** 5.x
- **Form Management:** React Hook Form
- **Notifications:** Sonner (toast library)

### 11.3 Key Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "zod": "^3.22.4",
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.3"
  }
}
```

### 11.4 Useful Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Astro SSR Guide](https://docs.astro.build/en/guides/server-side-rendering/)
- [React Hook Form with Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

---

## 12. Podsumowanie Zmian w Specyfikacji (Weryfikacja zgodności z PRD)

### 12.1 Główne Korekty Po Porównaniu z PRD

**Wersja:** 1.1 (aktualizacja po weryfikacji zgodności z PRD)

### 12.2 Zidentyfikowane i Naprawione Sprzeczności

#### ✅ POPRAWIONE: Flow dla Nowych Użytkowników

**Problem:**
- Oryginalna wersja auth-spec.md opisywała "Nowego Użytkownika" jako osobę, która idzie na `/auth/login` i wpisuje email
- To było SPRZECZNE z PRD sekcja 7.1, która wyraźnie mówi: "Admin wysyła zaproszenie przez Supabase"

**Rozwiązanie:**
- Dodano wyraźne rozróżnienie między **INVITE Flow** (nowi użytkownicy) a **Magic Link Flow** (istniejący użytkownicy)
- Scenariusz 1 zmieniony na "Invite Flow" zgodnie z US-05
- Scenariusz 2 wyraźnie oznaczony jako "dla istniejących użytkowników" zgodnie z US-06

#### ✅ POPRAWIONE: Callback Handler

**Problem:**
- Oryginalny callback obsługiwał tylko `type: "magiclink"`
- Nie obsługiwał `type: "invite"` wymaganego przez PRD

**Rozwiązanie:**
- Callback handler aktualizowany do obsługi obu typów: `invite` i `magiclink`
- Dodano walidację typu
- Dodano wyjaśnienie że dla invite - konto jest tworzone automatycznie

#### ✅ POPRAWIONE: Email Enumeration Prevention

**Problem:**
- Oryginalny error message "Nie znaleziono użytkownika..." ujawniał czy email istnieje w systemie

**Rozwiązanie:**
- Zmieniono na jednolity komunikat "Link wysłany na podany adres email"
- Zapobiega Email Enumeration Attack
- Zgodne z security best practices

#### ✅ DODANE: Invite Flow w Email Templates

**Problem:**
- Brak szczegółowego opisu jak admin wysyła invite

**Rozwiązanie:**
- Dodano szczegółowe instrukcje w sekcji 4.3.2
- Opisano proces invite przez Supabase Dashboard
- Dodano przykład ustawiania user_metadata podczas invite

#### ✅ DODANE: Role Upgrade Scenario

**Problem:**
- Brak opisu jak free user może zostać upgraded do premium

**Rozwiązanie:**
- Dodano Scenariusz 9: "Upgrade Roli Free → Premium"
- Opisano manual process przez Supabase Dashboard (zgodnie z PRD - bez płatności online)
- Wyjaśniono automatyczną propagację nowej roli

#### ✅ DODANE: Informacja dla Nowych Użytkowników na /auth/login

**Problem:**
- Strona `/auth/login` nie informowała że nowi użytkownicy potrzebują invite

**Rozwiązanie:**
- Dodano sekcję z informacją: "Nie masz jeszcze konta? Skontaktuj się z admin@example.com"
- Wyraźnie komunikuje że self-service registration nie jest możliwa

### 12.3 Zweryfikowane User Stories - Pełna Zgodność

| User Story | Implementacja w auth-spec.md | Status |
|------------|------------------------------|--------|
| **US-05**: Zaproszenie email | ✅ Scenariusz 1: Invite Flow, sekcja 4.3.2 | **ZWERYFIKOWANE** |
| **US-06**: Magic link login | ✅ Scenariusz 2: Magic Link Flow | **ZWERYFIKOWANE** |
| **US-07**: Status w navbar | ✅ AuthButton component, Navbar | **ZWERYFIKOWANE** |
| **US-15**: Zarządzanie rolami | ✅ Sekcja 4.3.2, Scenariusz 9 | **ZWERYFIKOWANE** |
| **FR-09**: System zaproszeń | ✅ Sekcja 4.3.2, Email Templates | **ZWERYFIKOWANE** |
| **FR-10**: Magic link | ✅ LoginForm, Scenariusz 2 | **ZWERYFIKOWANE** |
| **FR-11**: Auto login + redirect | ✅ Callback handler | **ZWERYFIKOWANE** |
| **FR-12**: Google OAuth (optional) | ✅ Phase 4, GoogleAuthButton | **ZWERYFIKOWANE** |
| **FR-13**: Minimalne dane użytkownika | ✅ User Metadata Schema (sekcja 4.3.1) | **ZWERYFIKOWANE** |

### 12.4 Kluczowe Założenia Potwierdzone z PRD

1. ✅ **Invite-Only Registration** - Brak self-service rejestracji
2. ✅ **Admin zarządza rolami** - Manual przez Supabase Dashboard
3. ✅ **Brak płatności online** - Role upgrade manual (sekcja 12 PRD - Out of Scope)
4. ✅ **Email confirmation disabled** - Invite automatycznie potwierdza email
5. ✅ **Freemium model** - Role: free/premium/admin
6. ✅ **RLS policies** - Database-level access control

### 12.5 Brak Nadmiarowych Założeń

Wszystkie opisane funkcjonalności są wymagane przez PRD lub są oznaczone jako "opcjonalne" (np. Google OAuth, custom API endpoints).

---

**Koniec specyfikacji technicznej** - Wersja 1.1 (2026-01-22 - zaktualizowana po weryfikacji z PRD)
