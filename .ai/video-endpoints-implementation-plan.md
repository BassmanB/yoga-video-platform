# API Endpoints Implementation Plan: Videos & Health Check

**Version:** 1.0  
**Date:** 2026-01-18  
**Status:** Ready for Implementation

---

## 1. Przegląd endpointów

Ten dokument opisuje implementację wszystkich endpointów API dla zasobu `videos` oraz endpoint health check. System wykorzystuje Astro 5 API routes z Supabase jako backend. Bezpieczeństwo jest zapewnione przez Supabase Row Level Security (RLS) policies.

### Endpoints do implementacji:

1. **GET /api/videos** - Lista wideo z filtrowaniem i paginacją
2. **GET /api/videos/:id** - Pojedyncze wideo
3. **POST /api/videos** - Tworzenie wideo (admin only)
4. **PUT /api/videos/:id** - Pełna aktualizacja (admin only)
5. **PATCH /api/videos/:id** - Częściowa aktualizacja (admin only)
6. **DELETE /api/videos/:id** - Usuwanie wideo (admin only)
7. **GET /api/health** - Health check

### Kluczowe założenia:

- **Security First:** RLS policies w Supabase kontrolują dostęp do danych
- **Type Safety:** Pełne typowanie TypeScript z Zod validation
- **Clean Architecture:** Separacja warstw (routes → services → database)
- **Error Handling:** Spójne formatowanie błędów zgodne ze specyfikacją

---

## 2. Struktura plików do utworzenia

```
src/
├── pages/
│   └── api/
│       ├── videos/
│       │   ├── index.ts          # GET /api/videos, POST /api/videos
│       │   └── [id].ts           # GET/PUT/PATCH/DELETE /api/videos/:id
│       └── health.ts             # GET /api/health
├── lib/
│   ├── services/
│   │   ├── video.service.ts      # Business logic dla videos
│   │   └── health.service.ts     # Health check logic
│   ├── validators/
│   │   └── video.validator.ts    # Zod schemas
│   └── utils/
│       ├── error.utils.ts        # Error handling utilities
│       └── auth.utils.ts         # Auth helpers
```

---

## 3. Wykorzystywane typy

### Z `src/types.ts` (już istniejące):

**Enums:**
- `VideoCategory` - yoga | mobility | calisthenics
- `VideoLevel` - beginner | intermediate | advanced
- `VideoStatus` - draft | published | archived
- `UserRole` - free | premium | admin

**Entities:**
- `Video` - główna encja wideo

**Response DTOs:**
- `VideoListResponse` - { data: Video[], meta: PaginationMeta }
- `VideoResponse` - { data: Video }
- `ErrorResponse` - { error: { code, message, details } }
- `PaginationMeta` - { total, limit, offset, count }
- `HealthCheckResponse` - { status, timestamp, services, version }

**Command Models:**
- `CreateVideoRequest` - dla POST
- `UpdateVideoRequest` - dla PUT
- `PartialUpdateVideoRequest` - dla PATCH

**Query Parameters:**
- `VideoListQueryParams` - dla GET /api/videos

**Type Guards:**
- `isVideoCategory()`
- `isVideoLevel()`
- `isVideoStatus()`
- `isUserRole()`

---

## 4. Endpoint 1: GET /api/videos

### 4.1 Przegląd

Pobiera listę wideo z opcjonalnym filtrowaniem, sortowaniem i paginacją. Dostęp kontrolowany przez RLS policies.

### 4.2 Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/videos`
- **Autentykacja:** Opcjonalna (anonymous users widzą tylko free published videos)

**Query Parameters (wszystkie opcjonalne):**

| Parameter | Type | Default | Validation |
|-----------|------|---------|------------|
| `category` | string | - | Enum: yoga, mobility, calisthenics |
| `level` | string | - | Enum: beginner, intermediate, advanced |
| `is_premium` | boolean | - | true/false |
| `status` | string | published | Enum: draft, published, archived (admin only) |
| `limit` | integer | 50 | Range: 1-100 |
| `offset` | integer | 0 | Min: 0 |
| `sort` | string | created_at | Enum: created_at, title, duration |
| `order` | string | desc | Enum: asc, desc |

### 4.3 Szczegóły odpowiedzi

**Success (200 OK):**

```typescript
{
  data: Video[],
  meta: {
    total: number,      // Całkowita liczba wyników
    limit: number,      // Limit na stronę
    offset: number,     // Aktualny offset
    count: number       // Liczba wyników w odpowiedzi
  }
}
```

**Errors:**

- **400 Bad Request:** Nieprawidłowe parametry query
  - Kod: `INVALID_PARAMETER`
  - Przykład: category=pilates
  
- **401 Unauthorized:** Brak autoryzacji (jeśli wymagana)
  - Kod: `UNAUTHORIZED`

- **500 Internal Server Error:** Błąd serwera
  - Kod: `DATABASE_ERROR` lub `INTERNAL_ERROR`

### 4.4 Przepływ danych

```
1. Request → Astro API Route (src/pages/api/videos/index.ts)
   ↓
2. Parse & validate query parameters (Zod schema)
   ↓
3. Get Supabase client from context.locals
   ↓
4. Call video.service.listVideos(params, supabase)
   ↓
5. Service builds Supabase query:
   - Apply filters (category, level, is_premium, status)
   - Apply sorting (sort field + order)
   - Apply pagination (limit, offset)
   - RLS policies automatically filter based on user role
   ↓
6. Execute query with count
   ↓
7. Format response as VideoListResponse
   ↓
8. Return 200 OK with data
```

### 4.5 Względy bezpieczeństwa

**RLS Policy Enforcement:**
- Anonymous/Free users: `is_premium = false AND status = 'published'`
- Premium users: `status = 'published'`
- Admin users: wszystkie wideo

**Query Parameter Validation:**
- Walidacja wszystkich parametrów przez Zod
- Limit max 100 (zapobieganie DoS)
- Enum validation dla category, level, status, sort, order

**Status Filter:**
- Non-admin users mogą filtrować tylko po `status = 'published'`
- Próba filtrowania po draft/archived przez non-admin → ignoruj lub zwróć 403

### 4.6 Obsługa błędów

| Scenariusz | Status | Error Code | Details |
|------------|--------|------------|---------|
| Nieprawidłowy category | 400 | INVALID_PARAMETER | parameter: category, allowed_values |
| Nieprawidłowy level | 400 | INVALID_PARAMETER | parameter: level, allowed_values |
| Limit > 100 | 400 | INVALID_PARAMETER | parameter: limit, max: 100 |
| Offset < 0 | 400 | INVALID_PARAMETER | parameter: offset, min: 0 |
| Nieprawidłowy sort | 400 | INVALID_PARAMETER | parameter: sort, allowed_values |
| Nieprawidłowy order | 400 | INVALID_PARAMETER | parameter: order, allowed_values |
| Non-admin filtruje po draft | 403 | FORBIDDEN | required_role: admin |
| Błąd bazy danych | 500 | DATABASE_ERROR | - |

### 4.7 Rozważania dotyczące wydajności

**Optymalizacje:**
- Używanie composite index: `idx_videos_category_premium_status`
- Limit domyślny 50, max 100
- Count query może być kosztowny - rozważyć cache

**Expected Performance:**
- Response time: < 100ms dla typowych zapytań
- Database queries: 2 (count + select)

### 4.8 Kroki implementacji

1. Utworzyć `src/lib/validators/video.validator.ts` z Zod schema dla query params
2. Utworzyć `src/lib/services/video.service.ts` z funkcją `listVideos()`
3. Utworzyć `src/pages/api/videos/index.ts` z handlerem GET
4. Zaimplementować parsowanie query parameters
5. Zaimplementować walidację Zod
6. Zaimplementować wywołanie service
7. Zaimplementować formatowanie odpowiedzi
8. Zaimplementować error handling
9. Dodać testy jednostkowe dla service
10. Dodać testy integracyjne dla endpoint

---

## 5. Endpoint 2: GET /api/videos/:id

### 5.1 Przegląd

Pobiera szczegółowe informacje o pojedynczym wideo. Dostęp kontrolowany przez RLS.

### 5.2 Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/videos/:id`
- **Autentykacja:** Opcjonalna (wymagana dla premium content)

**URL Parameters:**

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| `id` | UUID | Yes | Valid UUID format |

### 5.3 Szczegóły odpowiedzi

**Success (200 OK):**

```typescript
{
  data: Video
}
```

**Errors:**

- **400 Bad Request:** Nieprawidłowy format UUID
  - Kod: `INVALID_PARAMETER`
  
- **403 Forbidden:** Brak uprawnień do premium content
  - Kod: `FORBIDDEN`
  - Details: required_role, current_role, video_id
  
- **404 Not Found:** Video nie istnieje lub brak uprawnień
  - Kod: `NOT_FOUND`
  - Note: Security best practice - nie ujawniamy czy video istnieje

- **500 Internal Server Error:** Błąd serwera
  - Kod: `DATABASE_ERROR` lub `INTERNAL_ERROR`

### 5.4 Przepływ danych

```
1. Request → Astro API Route (src/pages/api/videos/[id].ts)
   ↓
2. Extract & validate :id parameter (UUID format)
   ↓
3. Get Supabase client from context.locals
   ↓
4. Call video.service.getVideoById(id, supabase)
   ↓
5. Service executes:
   - SELECT * FROM videos WHERE id = :id
   - RLS policy automatically checks access
   ↓
6. If no result → 404 (może być brak video lub brak uprawnień)
   ↓
7. If result → format as VideoResponse
   ↓
8. Return 200 OK with data
```

### 5.5 Względy bezpieczeństwa

**RLS Policy Enforcement:**
- Free users nie mogą dostać się do `is_premium = true`
- Non-admin nie mogą dostać się do `status != 'published'`
- RLS zwraca empty result → API zwraca 404

**UUID Validation:**
- Walidacja formatu UUID przez Zod
- Zapobiega SQL injection (choć Supabase i tak używa parametryzowanych zapytań)

**Security Best Practice:**
- Zwracanie 404 zamiast 403 gdy video nie istnieje
- Nie ujawniamy czy video istnieje, jeśli user nie ma dostępu

### 5.6 Obsługa błędów

| Scenariusz | Status | Error Code | Details |
|------------|--------|------------|---------|
| Nieprawidłowy UUID format | 400 | INVALID_PARAMETER | parameter: id, value |
| Free user → premium video | 404 | NOT_FOUND | video_id (nie ujawniamy że istnieje) |
| User → draft video | 404 | NOT_FOUND | video_id |
| Video nie istnieje | 404 | NOT_FOUND | video_id |
| Błąd bazy danych | 500 | DATABASE_ERROR | - |

**Note:** Możemy zwrócić 403 z szczegółami dla lepszego UX, ale 404 jest bezpieczniejsze.

### 5.7 Rozważania dotyczące wydajności

**Optymalizacje:**
- Query po primary key (id) - bardzo szybkie
- Single row fetch

**Expected Performance:**
- Response time: < 50ms
- Database queries: 1 (select by id)

### 5.8 Kroki implementacji

1. Dodać Zod schema dla UUID validation do `video.validator.ts`
2. Dodać funkcję `getVideoById()` do `video.service.ts`
3. Utworzyć `src/pages/api/videos/[id].ts` z handlerem GET
4. Zaimplementować parsowanie :id parameter
5. Zaimplementować walidację UUID
6. Zaimplementować wywołanie service
7. Zaimplementować formatowanie odpowiedzi
8. Zaimplementować error handling (404 dla empty result)
9. Dodać testy jednostkowe
10. Dodać testy integracyjne z różnymi rolami użytkowników

---

## 6. Endpoint 3: POST /api/videos

### 6.1 Przegląd

Tworzy nowy rekord wideo. Dostępne tylko dla administratorów.

### 6.2 Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/videos`
- **Autentykacja:** Wymagana (admin role)
- **Content-Type:** application/json

**Request Body (CreateVideoRequest):**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | Yes | 1-255 chars |
| `description` | string | No | Max 5000 chars |
| `category` | VideoCategory | Yes | Enum: yoga, mobility, calisthenics |
| `level` | VideoLevel | Yes | Enum: beginner, intermediate, advanced |
| `duration` | integer | Yes | Range: 1-7200 |
| `video_url` | string | Yes | Regex: `^videos-(free\|premium)/[^/]+\.mp4$` |
| `thumbnail_url` | string | Yes | Regex: `^thumbnails/[^/]+\.(jpg\|png\|webp)$` |
| `is_premium` | boolean | No | Default: false |
| `status` | VideoStatus | No | Enum: draft, published, archived. Default: draft |

### 6.3 Szczegóły odpowiedzi

**Success (201 Created):**

```typescript
{
  data: Video  // Zawiera auto-generated: id, created_at, updated_at
}
```

**Errors:**

- **400 Bad Request:** Nieprawidłowe dane wejściowe
  - Kod: `VALIDATION_ERROR`
  - Details: errors[] z field-specific messages
  
- **401 Unauthorized:** Brak tokenu autoryzacji
  - Kod: `UNAUTHORIZED`

- **403 Forbidden:** User nie jest adminem
  - Kod: `FORBIDDEN`
  - Details: required_role: admin, current_role
  
- **409 Conflict:** Video z takim tytułem już istnieje (jeśli unique constraint)
  - Kod: `CONFLICT`
  - Details: field: title, value

- **500 Internal Server Error:** Błąd serwera
  - Kod: `DATABASE_ERROR` lub `INTERNAL_ERROR`

### 6.4 Przepływ danych

```
1. Request → Astro API Route (src/pages/api/videos/index.ts)
   ↓
2. Check authentication (token present)
   ↓
3. Get user role from Supabase Auth metadata
   ↓
4. Check if user is admin → if not, return 403
   ↓
5. Parse & validate request body (Zod schema)
   ↓
6. Get Supabase client from context.locals
   ↓
7. Call video.service.createVideo(data, supabase)
   ↓
8. Service executes:
   - INSERT INTO videos (...) VALUES (...)
   - RLS policy checks admin role
   - Database auto-generates: id, created_at, updated_at
   ↓
9. Return inserted row
   ↓
10. Format response as VideoResponse
   ↓
11. Return 201 Created with data
```

### 6.5 Względy bezpieczeństwa

**Admin-Only Access:**
- Sprawdzenie roli przed wykonaniem operacji
- RLS policy jako backup (defense in depth)

**Input Validation:**
- Zod schema waliduje wszystkie pola
- Regex dla video_url i thumbnail_url zapobiega path traversal
- Duration constraint zapobiega nieprawidłowym wartościom

**Path Traversal Prevention:**
- video_url nie może zawierać "../"
- Musi zaczynać się od "videos-free/" lub "videos-premium/"
- thumbnail_url musi zaczynać się od "thumbnails/"

**XSS Prevention:**
- Description może zawierać HTML - sanityzacja na frontendzie
- Backend nie sanityzuje (przechowuje raw data)

### 6.6 Obsługa błędów

| Scenariusz | Status | Error Code | Details |
|------------|--------|------------|---------|
| Brak tokenu | 401 | UNAUTHORIZED | - |
| Non-admin user | 403 | FORBIDDEN | required_role: admin, current_role |
| Title pusty | 400 | VALIDATION_ERROR | field: title, message |
| Title > 255 chars | 400 | VALIDATION_ERROR | field: title, message |
| Description > 5000 chars | 400 | VALIDATION_ERROR | field: description, message |
| Nieprawidłowy category | 400 | VALIDATION_ERROR | field: category, allowed_values |
| Nieprawidłowy level | 400 | VALIDATION_ERROR | field: level, allowed_values |
| Duration < 1 lub > 7200 | 400 | VALIDATION_ERROR | field: duration, message |
| Nieprawidłowy video_url format | 400 | VALIDATION_ERROR | field: video_url, message |
| Nieprawidłowy thumbnail_url format | 400 | VALIDATION_ERROR | field: thumbnail_url, message |
| Nieprawidłowy status | 400 | VALIDATION_ERROR | field: status, allowed_values |
| Duplicate title (unique constraint) | 409 | CONFLICT | field: title, value |
| Błąd bazy danych | 500 | DATABASE_ERROR | - |

### 6.7 Rozważania dotyczące wydajności

**Optymalizacje:**
- Single INSERT query
- Auto-generated fields przez database (id, timestamps)

**Expected Performance:**
- Response time: < 200ms
- Database queries: 1 (insert + returning)

**Note:** Video i thumbnail files muszą być już uploadowane do Supabase Storage przed utworzeniem rekordu.

### 6.8 Kroki implementacji

1. Dodać Zod schema dla CreateVideoRequest do `video.validator.ts`
2. Dodać funkcję `createVideo()` do `video.service.ts`
3. Utworzyć `src/lib/utils/auth.utils.ts` z `getUserRole()` i `requireAdmin()`
4. W `src/pages/api/videos/index.ts` dodać handler POST
5. Zaimplementować sprawdzenie autentykacji
6. Zaimplementować sprawdzenie roli admin
7. Zaimplementować parsowanie request body
8. Zaimplementować walidację Zod
9. Zaimplementować wywołanie service
10. Zaimplementować formatowanie odpowiedzi (201 Created)
11. Zaimplementować error handling
12. Dodać testy jednostkowe
13. Dodać testy integracyjne (admin vs non-admin)

---

## 7. Endpoint 4: PUT /api/videos/:id

### 7.1 Przegląd

Aktualizuje wszystkie pola istniejącego wideo (full replacement). Dostępne tylko dla administratorów.

### 7.2 Szczegóły żądania

- **Metoda HTTP:** PUT
- **Struktura URL:** `/api/videos/:id`
- **Autentykacja:** Wymagana (admin role)
- **Content-Type:** application/json

**URL Parameters:**

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| `id` | UUID | Yes | Valid UUID format |

**Request Body (UpdateVideoRequest):**

Wszystkie pola takie same jak w POST (wszystkie wymagane dla PUT semantics).

### 7.3 Szczegóły odpowiedzi

**Success (200 OK):**

```typescript
{
  data: Video  // Z zaktualizowanym updated_at
}
```

**Errors:**

- **400 Bad Request:** Nieprawidłowe dane wejściowe
- **401 Unauthorized:** Brak tokenu
- **403 Forbidden:** User nie jest adminem
- **404 Not Found:** Video nie istnieje
- **500 Internal Server Error:** Błąd serwera

### 7.4 Przepływ danych

```
1. Request → Astro API Route (src/pages/api/videos/[id].ts)
   ↓
2. Check authentication & admin role
   ↓
3. Extract & validate :id parameter
   ↓
4. Parse & validate request body (full UpdateVideoRequest)
   ↓
5. Get Supabase client from context.locals
   ↓
6. Call video.service.updateVideo(id, data, supabase)
   ↓
7. Service executes:
   - UPDATE videos SET ... WHERE id = :id
   - RLS policy checks admin role
   - Database trigger updates updated_at
   ↓
8. If no rows affected → 404
   ↓
9. Return updated row
   ↓
10. Format response as VideoResponse
   ↓
11. Return 200 OK with data
```

### 7.5 Względy bezpieczeństwa

**Admin-Only Access:**
- Identyczne zabezpieczenia jak POST

**Input Validation:**
- Wszystkie pola wymagane (PUT semantics)
- Identyczna walidacja jak POST

**Audit Trail:**
- updated_at automatycznie aktualizowany przez database trigger
- created_at pozostaje niezmieniony

### 7.6 Obsługa błędów

Identyczne jak POST + dodatkowo:

| Scenariusz | Status | Error Code | Details |
|------------|--------|------------|---------|
| Nieprawidłowy UUID | 400 | INVALID_PARAMETER | parameter: id |
| Video nie istnieje | 404 | NOT_FOUND | video_id |

### 7.7 Rozważania dotyczące wydajności

**Expected Performance:**
- Response time: < 200ms
- Database queries: 1 (update + returning)

### 7.8 Kroki implementacji

1. Dodać funkcję `updateVideo()` do `video.service.ts`
2. W `src/pages/api/videos/[id].ts` dodać handler PUT
3. Zaimplementować sprawdzenie autentykacji i roli
4. Zaimplementować walidację :id i request body
5. Zaimplementować wywołanie service
6. Zaimplementować obsługę 404 (no rows affected)
7. Zaimplementować formatowanie odpowiedzi
8. Dodać testy

---

## 8. Endpoint 5: PATCH /api/videos/:id

### 8.1 Przegląd

Aktualizuje wybrane pola istniejącego wideo (partial update). Dostępne tylko dla administratorów.

### 8.2 Szczegóły żądania

- **Metoda HTTP:** PATCH
- **Struktura URL:** `/api/videos/:id`
- **Autentykacja:** Wymagana (admin role)
- **Content-Type:** application/json

**URL Parameters:**

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| `id` | UUID | Yes | Valid UUID format |

**Request Body (PartialUpdateVideoRequest):**

Dowolny podzbiór pól z CreateVideoRequest (wszystkie opcjonalne).

**Common Use Cases:**
- Publish draft: `{ "status": "published" }`
- Archive video: `{ "status": "archived" }`
- Toggle premium: `{ "is_premium": true }`
- Update metadata: `{ "title": "...", "description": "..." }`

### 8.3 Szczegóły odpowiedzi

**Success (200 OK):**

```typescript
{
  data: Video  // Z zaktualizowanymi polami i updated_at
}
```

**Errors:**

Identyczne jak PUT.

### 8.4 Przepływ danych

```
1. Request → Astro API Route (src/pages/api/videos/[id].ts)
   ↓
2. Check authentication & admin role
   ↓
3. Extract & validate :id parameter
   ↓
4. Parse & validate request body (partial schema)
   ↓
5. Get Supabase client from context.locals
   ↓
6. Call video.service.partialUpdateVideo(id, data, supabase)
   ↓
7. Service executes:
   - UPDATE videos SET <only provided fields> WHERE id = :id
   - RLS policy checks admin role
   - Database trigger updates updated_at
   ↓
8. If no rows affected → 404
   ↓
9. Return updated row
   ↓
10. Format response as VideoResponse
   ↓
11. Return 200 OK with data
```

### 8.5 Względy bezpieczeństwa

**Partial Validation:**
- Walidacja tylko dla dostarczonych pól
- Nie można aktualizować id, created_at, updated_at (nie są w schema)

**Mass Assignment Protection:**
- Używanie typowanego DTO
- Tylko pola z PartialUpdateVideoRequest mogą być aktualizowane

### 8.6 Obsługa błędów

Identyczne jak PUT, ale walidacja tylko dla dostarczonych pól.

### 8.7 Rozważania dotyczące wydajności

**Expected Performance:**
- Response time: < 200ms
- Database queries: 1 (update + returning)

### 8.8 Kroki implementacji

1. Dodać Zod schema dla PartialUpdateVideoRequest (partial z CreateVideoRequest)
2. Dodać funkcję `partialUpdateVideo()` do `video.service.ts`
3. W `src/pages/api/videos/[id].ts` dodać handler PATCH
4. Zaimplementować sprawdzenie autentykacji i roli
5. Zaimplementować walidację :id i request body
6. Zaimplementować wywołanie service (tylko dostarczone pola)
7. Zaimplementować obsługę 404
8. Dodać testy (szczególnie dla partial updates)

---

## 9. Endpoint 6: DELETE /api/videos/:id

### 9.1 Przegląd

Trwale usuwa rekord wideo z bazy danych. Dostępne tylko dla administratorów.

**UWAGA:** Nie usuwa plików z Supabase Storage - muszą być usunięte osobno.

### 9.2 Szczegóły żądania

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/videos/:id`
- **Autentykacja:** Wymagana (admin role)

**URL Parameters:**

| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| `id` | UUID | Yes | Valid UUID format |

### 9.3 Szczegóły odpowiedzi

**Success (204 No Content):**

Brak body w odpowiedzi.

**Errors:**

- **400 Bad Request:** Nieprawidłowy UUID
- **401 Unauthorized:** Brak tokenu
- **403 Forbidden:** User nie jest adminem
- **404 Not Found:** Video nie istnieje
- **500 Internal Server Error:** Błąd serwera

### 9.4 Przepływ danych

```
1. Request → Astro API Route (src/pages/api/videos/[id].ts)
   ↓
2. Check authentication & admin role
   ↓
3. Extract & validate :id parameter
   ↓
4. Get Supabase client from context.locals
   ↓
5. Call video.service.deleteVideo(id, supabase)
   ↓
6. Service executes:
   - DELETE FROM videos WHERE id = :id
   - RLS policy checks admin role
   ↓
7. If no rows affected → 404
   ↓
8. Return 204 No Content (no body)
```

### 9.5 Względy bezpieczeństwa

**Admin-Only Access:**
- Identyczne zabezpieczenia jak POST/PUT/PATCH

**Permanent Operation:**
- Operacja nieodwracalna
- Rozważyć soft delete (archiving) zamiast hard delete
- Rekomendacja: użyć `PATCH { "status": "archived" }` zamiast DELETE

**Storage Files:**
- Pliki wideo i thumbnail NIE są automatycznie usuwane
- Admin musi usunąć je osobno z Supabase Storage
- Możliwe orphaned files

### 9.6 Obsługa błędów

| Scenariusz | Status | Error Code | Details |
|------------|--------|------------|---------|
| Brak tokenu | 401 | UNAUTHORIZED | - |
| Non-admin user | 403 | FORBIDDEN | required_role: admin |
| Nieprawidłowy UUID | 400 | INVALID_PARAMETER | parameter: id |
| Video nie istnieje | 404 | NOT_FOUND | video_id |
| Błąd bazy danych | 500 | DATABASE_ERROR | - |

### 9.7 Rozważania dotyczące wydajności

**Expected Performance:**
- Response time: < 200ms
- Database queries: 1 (delete)

### 9.8 Kroki implementacji

1. Dodać funkcję `deleteVideo()` do `video.service.ts`
2. W `src/pages/api/videos/[id].ts` dodać handler DELETE
3. Zaimplementować sprawdzenie autentykacji i roli
4. Zaimplementować walidację :id
5. Zaimplementować wywołanie service
6. Zaimplementować obsługę 404 (no rows affected)
7. Zwrócić 204 No Content (bez body)
8. Dodać testy
9. Dodać dokumentację o konieczności ręcznego usuwania plików

---

## 10. Endpoint 7: GET /api/health

### 10.1 Przegląd

Sprawdza stan API, bazy danych i storage. Używane do monitoringu i health checks.

### 10.2 Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/health`
- **Autentykacja:** Brak

### 10.3 Szczegóły odpowiedzi

**Success (200 OK):**

```typescript
{
  status: "healthy",
  timestamp: "2026-01-18T16:30:00Z",
  services: {
    api: "up",
    database: "up",
    storage: "up"
  },
  version: "1.0.0"
}
```

**Partial Failure (503 Service Unavailable):**

```typescript
{
  status: "unhealthy",
  timestamp: "2026-01-18T16:30:00Z",
  services: {
    api: "up",
    database: "down",  // ← problem
    storage: "up"
  },
  version: "1.0.0"
}
```

### 10.4 Przepływ danych

```
1. Request → Astro API Route (src/pages/api/health.ts)
   ↓
2. Get Supabase client
   ↓
3. Call health.service.checkHealth(supabase)
   ↓
4. Service checks:
   - API: always "up" (jeśli dotarliśmy tu)
   - Database: wykonaj prosty SELECT 1 query
   - Storage: sprawdź dostępność buckets (opcjonalnie)
   ↓
5. Aggregate results
   ↓
6. Determine overall status:
   - "healthy" jeśli wszystkie "up"
   - "unhealthy" jeśli cokolwiek "down"
   ↓
7. Format response as HealthCheckResponse
   ↓
8. Return 200 (healthy) lub 503 (unhealthy)
```

### 10.5 Względy bezpieczeństwa

**Public Endpoint:**
- Brak autentykacji
- Nie ujawnia wrażliwych informacji
- Tylko status up/down

**Rate Limiting:**
- Rozważyć rate limiting (może być używany do DoS)
- Prosty endpoint, ale częste wywołania mogą obciążać DB

### 10.6 Obsługa błędów

| Scenariusz | Status | Response |
|------------|--------|----------|
| Wszystkie serwisy działają | 200 | status: healthy, all services: up |
| Database down | 503 | status: unhealthy, database: down |
| Storage down | 503 | status: unhealthy, storage: down |
| Wiele serwisów down | 503 | status: unhealthy, multiple: down |
| Błąd podczas check | 503 | status: unhealthy |

### 10.7 Rozważania dotyczące wydajności

**Lightweight Checks:**
- Database: `SELECT 1` (bardzo szybkie)
- Storage: opcjonalnie sprawdzić listę buckets (może być wolniejsze)

**Expected Performance:**
- Response time: < 100ms
- Database queries: 1 (select 1)

**Caching:**
- Rozważyć cache wyników (np. 10 sekund)
- Zmniejsza obciążenie przy częstych health checks

### 10.8 Kroki implementacji

1. Utworzyć `src/lib/services/health.service.ts`
2. Zaimplementować `checkHealth(supabase)`:
   - Check database: `SELECT 1`
   - Check storage: list buckets (opcjonalnie)
   - Aggregate results
3. Utworzyć `src/pages/api/health.ts` z handlerem GET
4. Wywołać health.service.checkHealth()
5. Formatować odpowiedź jako HealthCheckResponse
6. Zwrócić 200 (healthy) lub 503 (unhealthy)
7. Dodać testy
8. Dodać dokumentację dla DevOps (jak używać do monitoringu)

---

## 11. Implementacja wspólnych komponentów

### 11.1 Error Utilities (`src/lib/utils/error.utils.ts`)

**Funkcje do utworzenia:**

```typescript
// Fabryka ErrorResponse
export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ErrorResponse

// Mapowanie błędów Supabase na ErrorResponse
export function handleSupabaseError(error: PostgrestError): ErrorResponse

// Helper dla validation errors (Zod)
export function formatValidationErrors(zodError: ZodError): ErrorResponse

// Helper dla common errors
export function notFoundError(resource: string, id: string): ErrorResponse
export function unauthorizedError(): ErrorResponse
export function forbiddenError(requiredRole: string, currentRole: string): ErrorResponse
```

**Przykład implementacji:**

```typescript
export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    error: {
      code,
      message,
      ...(details && { details })
    }
  }
}

export function notFoundError(resource: string, id: string): ErrorResponse {
  return createErrorResponse(
    'NOT_FOUND',
    `${resource} not found or you don't have permission to access it.`,
    { [`${resource.toLowerCase()}_id`]: id }
  )
}
```

### 11.2 Auth Utilities (`src/lib/utils/auth.utils.ts`)

**Funkcje do utworzenia:**

```typescript
// Pobierz rolę użytkownika z Supabase Auth metadata
export async function getUserRole(supabase: SupabaseClient): Promise<UserRole | null>

// Sprawdź czy użytkownik jest zalogowany
export async function isAuthenticated(supabase: SupabaseClient): Promise<boolean>

// Sprawdź czy użytkownik jest adminem
export async function isAdmin(supabase: SupabaseClient): Promise<boolean>

// Middleware: wymagaj autentykacji
export async function requireAuth(supabase: SupabaseClient): Promise<void>

// Middleware: wymagaj roli admin
export async function requireAdmin(supabase: SupabaseClient): Promise<void>
```

**Przykład implementacji:**

```typescript
export async function getUserRole(supabase: SupabaseClient): Promise<UserRole | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const role = user.user_metadata?.role as string | undefined
  
  if (role && isUserRole(role)) {
    return role
  }
  
  return 'free' // Default role
}

export async function requireAdmin(supabase: SupabaseClient): Promise<void> {
  const role = await getUserRole(supabase)
  
  if (role !== 'admin') {
    throw new Error('FORBIDDEN')
  }
}
```

### 11.3 Video Validators (`src/lib/validators/video.validator.ts`)

**Schematy Zod do utworzenia:**

```typescript
import { z } from 'zod'

// Schema dla query parameters (GET /api/videos)
export const videoListQueryParamsSchema = z.object({
  category: z.enum(['yoga', 'mobility', 'calisthenics']).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  is_premium: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
  sort: z.enum(['created_at', 'title', 'duration']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc')
})

// Schema dla UUID
export const uuidSchema = z.string().uuid()

// Schema dla video_url (path traversal prevention)
export const videoUrlSchema = z.string().regex(
  /^videos-(free|premium)\/[^/]+\.mp4$/,
  'Invalid video URL format. Must be: videos-free/file.mp4 or videos-premium/file.mp4'
)

// Schema dla thumbnail_url
export const thumbnailUrlSchema = z.string().regex(
  /^thumbnails\/[^/]+\.(jpg|png|webp)$/,
  'Invalid thumbnail URL format. Must be: thumbnails/file.jpg'
)

// Schema dla CreateVideoRequest (POST)
export const createVideoRequestSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional().nullable(),
  category: z.enum(['yoga', 'mobility', 'calisthenics']),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  duration: z.number().int().min(1).max(7200),
  video_url: videoUrlSchema,
  thumbnail_url: thumbnailUrlSchema,
  is_premium: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft')
})

// Schema dla UpdateVideoRequest (PUT) - identyczny jak create
export const updateVideoRequestSchema = createVideoRequestSchema

// Schema dla PartialUpdateVideoRequest (PATCH) - partial
export const partialUpdateVideoRequestSchema = createVideoRequestSchema.partial()
```

### 11.4 Video Service (`src/lib/services/video.service.ts`)

**Funkcje do utworzenia:**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { 
  Video, 
  VideoListQueryParams, 
  VideoListResponse,
  CreateVideoRequest,
  UpdateVideoRequest,
  PartialUpdateVideoRequest
} from '../../types'

// Lista wideo z filtrowaniem
export async function listVideos(
  params: VideoListQueryParams,
  supabase: SupabaseClient
): Promise<VideoListResponse>

// Pojedyncze wideo po ID
export async function getVideoById(
  id: string,
  supabase: SupabaseClient
): Promise<Video | null>

// Tworzenie wideo
export async function createVideo(
  data: CreateVideoRequest,
  supabase: SupabaseClient
): Promise<Video>

// Pełna aktualizacja wideo
export async function updateVideo(
  id: string,
  data: UpdateVideoRequest,
  supabase: SupabaseClient
): Promise<Video | null>

// Częściowa aktualizacja wideo
export async function partialUpdateVideo(
  id: string,
  data: PartialUpdateVideoRequest,
  supabase: SupabaseClient
): Promise<Video | null>

// Usuwanie wideo
export async function deleteVideo(
  id: string,
  supabase: SupabaseClient
): Promise<boolean>
```

**Przykład implementacji listVideos:**

```typescript
export async function listVideos(
  params: VideoListQueryParams,
  supabase: SupabaseClient
): Promise<VideoListResponse> {
  const {
    category,
    level,
    is_premium,
    status,
    limit = 50,
    offset = 0,
    sort = 'created_at',
    order = 'desc'
  } = params

  // Build query
  let query = supabase
    .from('videos')
    .select('*', { count: 'exact' })

  // Apply filters
  if (category) {
    query = query.eq('category', category)
  }
  if (level) {
    query = query.eq('level', level)
  }
  if (is_premium !== undefined) {
    query = query.eq('is_premium', is_premium)
  }
  if (status) {
    query = query.eq('status', status)
  }

  // Apply sorting
  query = query.order(sort, { ascending: order === 'asc' })

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  // Execute query
  const { data, error, count } = await query

  if (error) {
    throw error
  }

  return {
    data: data as Video[],
    meta: {
      total: count ?? 0,
      limit,
      offset,
      count: data?.length ?? 0
    }
  }
}
```

### 11.5 Health Service (`src/lib/services/health.service.ts`)

**Funkcje do utworzenia:**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { HealthCheckResponse } from '../../types'

export async function checkHealth(
  supabase: SupabaseClient
): Promise<HealthCheckResponse>
```

**Przykład implementacji:**

```typescript
export async function checkHealth(
  supabase: SupabaseClient
): Promise<HealthCheckResponse> {
  const services = {
    api: 'up' as const,
    database: 'up' as const,
    storage: 'up' as const
  }

  // Check database
  try {
    const { error } = await supabase.from('videos').select('id').limit(1)
    if (error) {
      services.database = 'down'
    }
  } catch {
    services.database = 'down'
  }

  // Check storage (optional - może być wolne)
  try {
    const { data, error } = await supabase.storage.listBuckets()
    if (error || !data) {
      services.storage = 'down'
    }
  } catch {
    services.storage = 'down'
  }

  const status = Object.values(services).every(s => s === 'up') 
    ? 'healthy' 
    : 'unhealthy'

  return {
    status,
    timestamp: new Date().toISOString(),
    services,
    version: '1.0.0'
  }
}
```

---

## 12. Implementacja Astro API Routes

### 12.1 Route: GET/POST /api/videos (`src/pages/api/videos/index.ts`)

```typescript
import type { APIRoute } from 'astro'
import { videoListQueryParamsSchema, createVideoRequestSchema } from '../../../lib/validators/video.validator'
import { listVideos, createVideo } from '../../../lib/services/video.service'
import { requireAdmin } from '../../../lib/utils/auth.utils'
import { createErrorResponse, formatValidationErrors, handleSupabaseError } from '../../../lib/utils/error.utils'

export const prerender = false

// GET /api/videos
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Parse query parameters
    const params = Object.fromEntries(url.searchParams)
    
    // Convert string values to appropriate types
    if (params.is_premium) {
      params.is_premium = params.is_premium === 'true'
    }
    if (params.limit) {
      params.limit = parseInt(params.limit)
    }
    if (params.offset) {
      params.offset = parseInt(params.offset)
    }

    // Validate query parameters
    const validatedParams = videoListQueryParamsSchema.parse(params)

    // Get Supabase client from locals
    const supabase = locals.supabase

    // Call service
    const result = await listVideos(validatedParams, supabase)

    // Return success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorResponse = formatValidationErrors(error)
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Handle Supabase errors
    if (error instanceof Error && 'code' in error) {
      const errorResponse = handleSupabaseError(error)
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Handle unexpected errors
    const errorResponse = createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred'
    )
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// POST /api/videos
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Get Supabase client
    const supabase = locals.supabase

    // Check admin role
    await requireAdmin(supabase)

    // Parse request body
    const body = await request.json()

    // Validate request body
    const validatedData = createVideoRequestSchema.parse(body)

    // Call service
    const video = await createVideo(validatedData, supabase)

    // Return success response
    return new Response(JSON.stringify({ data: video }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    // Handle FORBIDDEN error from requireAdmin
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      const errorResponse = forbiddenError('admin', 'unknown')
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorResponse = formatValidationErrors(error)
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Handle Supabase errors
    if (error instanceof Error && 'code' in error) {
      const errorResponse = handleSupabaseError(error)
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Handle unexpected errors
    const errorResponse = createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred'
    )
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

### 12.2 Route: GET/PUT/PATCH/DELETE /api/videos/:id (`src/pages/api/videos/[id].ts`)

```typescript
import type { APIRoute } from 'astro'
import { uuidSchema, updateVideoRequestSchema, partialUpdateVideoRequestSchema } from '../../../lib/validators/video.validator'
import { getVideoById, updateVideo, partialUpdateVideo, deleteVideo } from '../../../lib/services/video.service'
import { requireAdmin } from '../../../lib/utils/auth.utils'
import { createErrorResponse, formatValidationErrors, handleSupabaseError, notFoundError } from '../../../lib/utils/error.utils'

export const prerender = false

// GET /api/videos/:id
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Validate UUID
    const id = uuidSchema.parse(params.id)

    // Get Supabase client
    const supabase = locals.supabase

    // Call service
    const video = await getVideoById(id, supabase)

    // Handle not found
    if (!video) {
      const errorResponse = notFoundError('Video', id)
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Return success response
    return new Response(JSON.stringify({ data: video }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const errorResponse = formatValidationErrors(error)
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Handle unexpected errors
    const errorResponse = createErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred'
    )
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// PUT /api/videos/:id
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // Validate UUID
    const id = uuidSchema.parse(params.id)

    // Get Supabase client
    const supabase = locals.supabase

    // Check admin role
    await requireAdmin(supabase)

    // Parse request body
    const body = await request.json()

    // Validate request body
    const validatedData = updateVideoRequestSchema.parse(body)

    // Call service
    const video = await updateVideo(id, validatedData, supabase)

    // Handle not found
    if (!video) {
      const errorResponse = notFoundError('Video', id)
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Return success response
    return new Response(JSON.stringify({ data: video }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    // Similar error handling as POST...
  }
}

// PATCH /api/videos/:id
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Validate UUID
    const id = uuidSchema.parse(params.id)

    // Get Supabase client
    const supabase = locals.supabase

    // Check admin role
    await requireAdmin(supabase)

    // Parse request body
    const body = await request.json()

    // Validate request body (partial)
    const validatedData = partialUpdateVideoRequestSchema.parse(body)

    // Call service
    const video = await partialUpdateVideo(id, validatedData, supabase)

    // Handle not found
    if (!video) {
      const errorResponse = notFoundError('Video', id)
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Return success response
    return new Response(JSON.stringify({ data: video }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    // Similar error handling...
  }
}

// DELETE /api/videos/:id
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Validate UUID
    const id = uuidSchema.parse(params.id)

    // Get Supabase client
    const supabase = locals.supabase

    // Check admin role
    await requireAdmin(supabase)

    // Call service
    const deleted = await deleteVideo(id, supabase)

    // Handle not found
    if (!deleted) {
      const errorResponse = notFoundError('Video', id)
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Return success response (no content)
    return new Response(null, {
      status: 204
    })
  } catch (error) {
    // Similar error handling...
  }
}
```

### 12.3 Route: GET /api/health (`src/pages/api/health.ts`)

```typescript
import type { APIRoute } from 'astro'
import { checkHealth } from '../../lib/services/health.service'

export const prerender = false

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase client
    const supabase = locals.supabase

    // Call service
    const healthStatus = await checkHealth(supabase)

    // Return appropriate status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503

    return new Response(JSON.stringify(healthStatus), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    // Even if health check fails, return structured response
    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'up',
        database: 'down',
        storage: 'down'
      },
      version: '1.0.0'
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 503,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
```

---

## 13. Middleware Configuration

### 13.1 Supabase Client Setup w Middleware

W `src/middleware/index.ts` należy upewnić się, że Supabase client jest dostępny w `context.locals`:

```typescript
import { defineMiddleware } from 'astro:middleware'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../db/database.types'

export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with user's session
  const supabase = createClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: context.request.headers.get('Authorization') || ''
        }
      }
    }
  )

  // Attach to context.locals
  context.locals.supabase = supabase

  return next()
})
```

### 13.2 TypeScript Types dla Locals

W `src/env.d.ts` dodać typy dla `locals`:

```typescript
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import('./db/supabase.client').SupabaseClient
  }
}
```

---

## 14. Testing Strategy

### 14.1 Unit Tests

**Testy dla Services:**
- Mock Supabase client
- Test każdej funkcji service osobno
- Test edge cases (empty results, errors)

**Testy dla Validators:**
- Test valid inputs
- Test invalid inputs
- Test edge cases (boundary values)

**Testy dla Utils:**
- Test error formatting
- Test auth helpers

### 14.2 Integration Tests

**Testy dla API Routes:**
- Test z rzeczywistym Supabase (test database)
- Test różnych ról użytkowników (anonymous, free, premium, admin)
- Test RLS policies
- Test wszystkich scenariuszy błędów

**Test Scenarios:**

```typescript
// GET /api/videos
- ✅ Anonymous user lists free published videos
- ✅ Free user lists free published videos
- ✅ Premium user lists all published videos
- ✅ Admin user lists all videos (including drafts)
- ❌ Invalid category parameter → 400
- ❌ Limit > 100 → 400

// GET /api/videos/:id
- ✅ Free user gets free video
- ❌ Free user gets premium video → 404
- ✅ Premium user gets premium video
- ✅ Admin gets draft video
- ❌ User gets non-existent video → 404
- ❌ Invalid UUID → 400

// POST /api/videos
- ✅ Admin creates video → 201
- ❌ Non-admin creates video → 403
- ❌ Invalid data → 400
- ❌ Missing required fields → 400

// PUT /api/videos/:id
- ✅ Admin updates video → 200
- ❌ Non-admin updates video → 403
- ❌ Invalid data → 400
- ❌ Non-existent video → 404

// PATCH /api/videos/:id
- ✅ Admin partially updates video → 200
- ✅ Admin publishes draft → 200
- ❌ Non-admin updates video → 403
- ❌ Invalid data → 400

// DELETE /api/videos/:id
- ✅ Admin deletes video → 204
- ❌ Non-admin deletes video → 403
- ❌ Non-existent video → 404

// GET /api/health
- ✅ All services up → 200 healthy
- ❌ Database down → 503 unhealthy
```

---

## 15. Deployment Checklist

### 15.1 Environment Variables

```bash
# Supabase
PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Server-side only

# API Configuration (optional)
API_VERSION=1.0.0
```

### 15.2 Pre-Deployment Steps

1. ✅ Wszystkie testy przechodzą
2. ✅ Linter bez błędów
3. ✅ TypeScript kompiluje się bez błędów
4. ✅ Environment variables skonfigurowane
5. ✅ Supabase migrations wykonane
6. ✅ RLS policies włączone
7. ✅ Storage buckets utworzone
8. ✅ Storage RLS policies włączone
9. ✅ Health check endpoint działa
10. ✅ Dokumentacja API zaktualizowana

### 15.3 Post-Deployment Verification

1. ✅ Health check zwraca 200 OK
2. ✅ GET /api/videos działa
3. ✅ Authentication działa
4. ✅ RLS policies działają poprawnie
5. ✅ Admin może tworzyć/edytować/usuwać wideo
6. ✅ Non-admin nie może wykonywać operacji admin-only
7. ✅ Premium content jest chroniony
8. ✅ Error responses są poprawnie formatowane

---

## 16. Monitoring & Logging

### 16.1 Logging Strategy

**Log Levels:**
- `ERROR`: Failed requests, exceptions
- `WARN`: Authorization failures, validation errors
- `INFO`: Successful requests, user actions
- `DEBUG`: Detailed request/response data (dev only)

**Log Format:**

```typescript
{
  timestamp: "2026-01-18T16:30:00Z",
  level: "INFO",
  method: "GET",
  path: "/api/videos",
  status: 200,
  duration_ms: 45,
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  user_role: "premium",
  ip: "192.168.1.1"
}
```

### 16.2 Metrics to Track

- Request count by endpoint
- Response time (p50, p95, p99)
- Error rate by status code
- Authentication success/failure rate
- Premium content access attempts
- Storage bandwidth usage

### 16.3 Alerts

- Error rate > 5%
- Response time p95 > 500ms
- Storage quota > 80%
- Bandwidth quota > 80%
- Failed auth attempts > 100/hour (potential attack)

---

## 17. Future Enhancements (Post-MVP)

### 17.1 Rate Limiting

Implementacja rate limiting w middleware:
- Anonymous: 100 requests/hour
- Authenticated: 1000 requests/hour
- Admin: 5000 requests/hour

### 17.2 Caching

- Cache video list responses (5-10 minutes)
- Cache individual video metadata (1 hour)
- Invalidate cache on video updates
- Use Supabase Realtime for cache invalidation

### 17.3 Pagination Improvements

- Cursor-based pagination (bardziej wydajne niż offset)
- Include `next` and `prev` URLs w response

### 17.4 Search Endpoint

```
GET /api/videos/search?q=yoga+flow
```

Full-text search across title and description.

### 17.5 Analytics Endpoints

```
GET /api/videos/:id/analytics
GET /api/analytics/overview
```

Track video views, watch time, popular content.

---

## 18. Summary

Ten plan implementacji obejmuje wszystkie 7 endpointów API dla platformy wideo yoga:

1. **GET /api/videos** - Lista z filtrowaniem
2. **GET /api/videos/:id** - Pojedyncze wideo
3. **POST /api/videos** - Tworzenie (admin)
4. **PUT /api/videos/:id** - Pełna aktualizacja (admin)
5. **PATCH /api/videos/:id** - Częściowa aktualizacja (admin)
6. **DELETE /api/videos/:id** - Usuwanie (admin)
7. **GET /api/health** - Health check

### Kluczowe zasady implementacji:

- **Security First:** RLS policies + middleware auth checks
- **Type Safety:** TypeScript + Zod validation
- **Clean Architecture:** Routes → Services → Database
- **Error Handling:** Spójne formatowanie błędów
- **Performance:** Optymalizowane zapytania, indexy
- **Testing:** Unit + integration tests
- **Monitoring:** Logging + metrics + alerts

### Kolejność implementacji:

1. **Phase 1:** Utilities (error, auth, validators)
2. **Phase 2:** Services (video, health)
3. **Phase 3:** Routes (GET endpoints)
4. **Phase 4:** Routes (POST/PUT/PATCH/DELETE endpoints)
5. **Phase 5:** Testing
6. **Phase 6:** Documentation
7. **Phase 7:** Deployment

---

**End of Implementation Plan**
