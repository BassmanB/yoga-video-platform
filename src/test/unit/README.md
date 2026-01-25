# Unit Tests Documentation

## video.utils.test.ts

Kompletny zestaw testów jednostkowych dla funkcji z `src/lib/utils/video.utils.ts`.

### Coverage: 86 testów

#### ✅ Validation Utilities (23 testy)

##### `isValidUUID()` - 11 testów
- **Valid cases**: UUID v4 (lowercase, uppercase, mixed case, różne warianty bitów)
- **Invalid cases**: empty string, non-string types, format bez hyphens, złe wersje UUID (v1/v2/v3/v5), nieprawidłowe znaki, złe variant bits
- **Security**: Walidacja tylko UUID v4 zgodnie ze standardem RFC 4122

##### `isValidVideoUrl()` - 12 testów
- **Valid cases**: HTTP/HTTPS URLs, porty, query params, fragmenty, zagnieżdżone ścieżki
- **Invalid cases**: empty string, non-string types, relative URLs, złe protokoły (ftp, file, data)
- **Security**: Blokowanie `javascript:` URLs jako atak XSS

---

#### ✅ Access Control - Business Rules (18 testów)

##### `canAccessVideo()` - Krytyczna logika biznesowa

**Admin Access (4 testy)**
- ✅ Admin widzi wszystkie statusy: published, draft, archived
- ✅ Admin widzi zarówno free jak i premium content
- 🎯 **Reguła biznesowa**: Admin omija wszystkie inne sprawdzenia

**Status-based Access (6 testów)**
- ✅ Draft content zablokowany dla free/premium/null users
- ✅ Archived content zablokowany dla free/premium users
- 🎯 **Reguła biznesowa**: Tylko published content jest dostępny dla non-admin

**Free Content (3 testy)**
- ✅ Published free content dostępne dla wszystkich (nawet niezalogowanych)
- 🎯 **Reguła biznesowa**: Free content jest publicznie dostępny

**Premium Content (3 testy)**
- ✅ Premium content wymaga roli 'premium' lub 'admin'
- ✅ Blokada dla unauthenticated i free users
- 🎯 **Reguła biznesowa**: Premium content tylko dla płacących

**Edge Cases (2 testy)**
- ✅ Priorytet sprawdzeń: Admin > Status > Premium
- ✅ Premium user nie widzi draft/archived content

---

#### ✅ Formatting Utilities (36 testów)

##### `formatDuration()` - 18 testów

**Edge Cases (4 testy)**
- ✅ Zero, ujemne liczby → "0:00"
- ✅ null/undefined/NaN → "0:00"
- 🎯 **Defensive programming**: Graceful handling nieprawidłowych danych

**Short Durations < 1h (8 testów)**
- ✅ Format M:SS (bez godzin)
- ✅ Seconds z leading zero (1:05, nie 1:5)
- ✅ Minutes bez leading zero (9:00, nie 09:00)
- ✅ Zakres: 1s → 59min 59s

**Long Durations >= 1h (5 testów)**
- ✅ Format H:MM:SS (z godziną)
- ✅ Minutes z leading zero (1:05:00)
- ✅ Seconds z leading zero (1:00:05)
- ✅ Zakres: 1h → długie nagrania (3h+)

**Decimal Handling (1 test)**
- ✅ Floor (nie round) dla sekund dziesiętnych

##### `getCategoryLabel()` - 4 testy
- ✅ Mapowanie yoga/mobility/calisthenics → polskie nazwy
- ✅ Fallback dla nieznanych kategorii

##### `getLevelLabel()` - 4 testy
- ✅ Mapowanie beginner/intermediate/advanced → polskie nazwy
- ✅ Fallback dla nieznanych poziomów

##### `getCategoryColor()` - 4 testy
- ✅ Mapowanie kategorii → kolory Tailwind (purple/blue/orange)
- ✅ Struktura: bg-*/text-*/border-* classes
- ✅ Fallback do slate dla unknown

##### `getLevelColor()` - 4 testy
- ✅ Mapowanie poziomów → kolory Tailwind (green/yellow/red)
- ✅ Struktura: bg-*/text-*/border-* classes
- ✅ Fallback do slate dla unknown

---

#### ✅ Error Utilities (9 testów)

##### `getErrorMessage()` - 9 testów
- ✅ Mapowanie error codes → user-friendly messages (PL)
- ✅ Obsługa: NOT_FOUND, NETWORK_ERROR, TIMEOUT, PLAYBACK_ERROR, INVALID_URL, UNKNOWN
- ✅ Fallback do UNKNOWN dla nierozpoznanych błędów
- 🎯 **UX**: Wszystkie komunikaty w języku polskim

---

## Kluczowe Reguły Biznesowe Pokryte Testami

### 1. Model Dostępu (Access Control Matrix)

| User Role | Draft | Archived | Published Free | Published Premium |
|-----------|-------|----------|----------------|-------------------|
| null      | ❌    | ❌       | ✅             | ❌                |
| free      | ❌    | ❌       | ✅             | ❌                |
| premium   | ❌    | ❌       | ✅             | ✅                |
| admin     | ✅    | ✅       | ✅             | ✅                |

### 2. Hierarchia Sprawdzeń

```
1. Admin? → Dostęp do wszystkiego
2. Status = published? → Nie → Brak dostępu
3. is_premium? → Nie → Dostęp dla wszystkich
4. UserRole = premium|admin? → Tak → Dostęp
5. Brak dostępu (PREMIUM_REQUIRED)
```

### 3. Formatowanie Czasu

- **< 1 godzina**: M:SS (bez leading zero na minutach)
- **>= 1 godzina**: H:MM:SS (z leading zeros)
- **Invalid input**: Zawsze zwraca "0:00"

### 4. Bezpieczeństwo

- **UUID**: Tylko v4 (RFC 4122)
- **URL**: Tylko http/https (blokada javascript:, file:, etc.)
- **Error handling**: Defensive programming z fallbacks

---

## Uruchamianie Testów

```bash
# Wszystkie testy dla video.utils
npm run test -- video.utils.test.ts

# Watch mode
npm run test:watch -- video.utils.test.ts

# Coverage
npm run test:coverage -- video.utils.test.ts

# UI mode
npm run test:ui
```

---

## Statystyki

- **Total Tests**: 86
- **Passed**: 86 ✅
- **Failed**: 0
- **Duration**: ~70ms
- **Coverage**: 100% funkcji z video.utils.ts

---

## Best Practices Zastosowane

✅ **Vitest Guidelines**
- `describe` blocks dla logicznej organizacji
- Descriptive test names (BDD style)
- Arrange-Act-Assert pattern
- Edge cases i negative tests

✅ **Business Logic Focus**
- Testy odzwierciedlają rzeczywiste use cases
- Coverage krytycznych ścieżek dostępu
- Walidacja wszystkich kombinacji ról użytkownika

✅ **Maintainability**
- Jasna struktura testów
- Komentarze dla reguł biznesowych
- Type safety (TypeScript)
- Inline assertions bez external fixtures

---

## Następne Kroki

Polecane testy do napisania w kolejności:

1. **error.utils.test.ts** - `createErrorResponse`, `formatValidationErrors`, etc.
2. **video.validator.test.ts** - Zod schemas validation
3. **auth.validator.test.ts** - Email/OAuth validation
4. **types.test.ts** - Type guards (isVideoCategory, isUserRole, etc.)
5. **storage.utils.test.ts** - URL generation (requires Supabase mocks)
6. **useFilters.test.ts** - React hook (requires @testing-library/react)
