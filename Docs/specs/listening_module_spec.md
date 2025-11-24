# Listening Module – Functional Spec (v1)

Status: DRAFT → lock when Listening is live  
Scope: Web (desktop + mobile web), integrated with Supabase & GramorX DS

---

## 1. Module Goals

- Train **IELTS Listening** in four modes:
  1. **Learn** – strategy + lessons
  2. **Practice** – flexible, repeatable tests
  3. **Game** – micro-drills, streak, fun but serious
  4. **Mock** – strict exam-mode, close to real CBE

- Use **AI + analytics** to:
  - Track band trajectory over time
  - Expose weak **question types / sections**
  - Nudge users toward the right practice pattern (learn → practice → mock)

---

## 2. User Roles

- **Student (default)**  
  - Access `/listening`, all listening subroutes
  - Can do learn / practice / game / mock
- **Admin / Teacher**
  - Access `/admin/listening/**`
  - Can see **tests**, **question bank**, **attempts**, and (later) analytics

Role detection uses `extractRole` + `AppRole` from `lib/roles`.

---

## 3. Routes & Pages (Listening)

### 3.1 Student routes

- `pages/listening/index.tsx`
  - Module home. Shows:
    - Hero (ListeningModuleHero)
    - Nav tabs (ListeningNavTabs: learn, practice, game, mock)
    - Quick stats / shortcuts
- `pages/listening/learn/index.tsx`
  - Lists lessons from `listening_lessons`.
  - Uses `ListeningLessonCard` cards.
- `pages/listening/learn/[slug].tsx`
  - Renders full lesson content:
    - Title, level, estimated time
    - Main markdown content (from `content`)
    - Optional “question type focus” panel (ListeningQuestionTypeCard)
- `pages/listening/practice/index.tsx`
  - Shows tests where `listening_tests.is_mock = false`.
  - Each card: title, difficulty, duration, question count, band range.
- `pages/listening/practice/[slug].tsx`
  - Practice runner:
    - Uses `useListeningTestRunner({ mode: 'practice' })`
    - Timer is soft (you can still submit after hitting zero, but visually flagged)
- `pages/listening/practice/[slug]/result.tsx`
  - Practice result:
    - band estimate
    - raw score / max score
    - time used
    - `MockAnswerSheet` view of all questions (for now shared component)
- `pages/listening/game/index.tsx`
  - Game hub:
    - Shows local stats (total challenges, best streak)
    - Game modes:
      - `speed`, `spelling`, `noback`
- `pages/listening/game/challenge.tsx`
  - Mini-game page:
    - mode via `?mode=speed|spelling|noback`
    - sample questions local in TS for now (no DB dependency)
    - Timer + score + state machine: `ready | running | finished`
- `pages/listening/game/leaderboard.tsx`
  - Placeholder leaderboard:
    - SSR-protected
    - Static empty list for now
    - Later plug into Supabase view (per-user game stats)

### 3.2 Mock routes (Listening)

Mock pages are **strict-mode** and live under global `/mock`:

- `pages/mock/listening/index.tsx`
  - Lists **mock** tests (`is_mock = true`).
- `pages/mock/listening/overview.tsx`
  - Instructions and rules for selected mock test.
- `pages/mock/listening/run.tsx`
  - Full mock runner:
    - Uses `useListeningTestRunner({ mode: 'mock' })`
    - Creates attempt via `/api/listening/mock/start`
    - Uses `MockTestShell`, `MockTimer`, `MockQuestionRenderer`, `MockQuestionFlag`
    - Autosave via `/api/listening/mock/autosave`
    - On submit → `/api/listening/mock/submit` → redirect to submitted page
- `pages/mock/listening/submitted.tsx`
  - Post-mock result:
    - Overall summary: band, raw, accuracy, time
    - Breakdown via `MockAnswerSheet`
    - Links to:
      - `/listening/analytics`
      - `/listening/practice/[slug]`

**Important rule**:  
**PIN gate** lives on a **global `/mock` layer only**, NOT on module-level pages:
- `/mock/**` may be gated by `MockPinGate` or `mock_pins`
- `/listening/**` is **never** PIN-gated

---

## 4. APIs

All API routes:
- Typed with `zod`
- Use `getServerClient` + `supabase.auth.getUser()`
- Return `401` if unauthenticated
- Respect `mode` (`practice | mock`) on attempts

### 4.1 Public Listening APIs (student)

Base: `pages/api/listening/**`

1. `GET /api/listening/tests/list`
   - Returns list of tests (filters: mode/practice/mock optional).
2. `GET /api/listening/tests/detail?slug=...`
   - Returns full `ListeningTest` (sections + questions) for given slug **without** answers.
3. `POST /api/listening/practice/start`
   - Body: `{ slug: string }`
   - Creates `attempts_listening` row with `mode = 'practice'`, `status = 'in_progress'`.
4. `POST /api/listening/practice/submit`
   - Body: `{ attemptId: string }`
   - Validates answers, calculates raw score + band, marks attempt `submitted`.
5. `GET /api/listening/analytics/summary`
   - Returns:
     - band trend
     - attempts count
     - average accuracy, etc.
6. `GET /api/listening/analytics/by-question-type`
   - Aggregation by:
     - `type` and maybe tags (later).
7. `GET /api/listening/analytics/attempts`
   - List recent attempts (for Listening analytics page).
8. `GET /api/listening/analytics/attempt-detail?attemptId=...`
   - Full breakdown for a single attempt.

### 4.2 Mock-only APIs

Base: `pages/api/listening/mock/**`

1. `GET /api/listening/mock/tests`
   - List mock tests only (`is_mock = true`).
2. `POST /api/listening/mock/start`
   - Body: `{ slug: string }`
   - Creates mock attempt (`mode = 'mock'`).
3. `POST /api/listening/mock/autosave`
   - Body: `{ attemptId: string; answers: ListeningAttemptAnswer[] }`
   - Saves partial answers periodically.
4. `POST /api/listening/mock/submit`
   - Body: `{ attemptId: string }`
   - Strict scoring, band calculation, finalization.

### 4.3 Admin Listening APIs

Base: `pages/api/admin/listening/**`  
Protected by `withPlan('master', handler, { allowRoles: ['admin', 'teacher'] })`.

1. `POST /api/admin/listening/tests/upsert`
   - Create or update test metadata:
     - `slug`, `title`, `difficulty`, `isMock`, `durationSeconds`, `totalQuestions`, `audioStorageKey`, `estimatedBandMin/Max`
2. `POST /api/admin/listening/tests/delete`
   - Soft/hard delete test (implementation decision in DB).

---

## 5. Data Model (DB)

Tables (canonical for Listening):

### 5.1 `listening_tests`

- `id: uuid`
- `slug: text unique`
- `title: text`
- `description: text`
- `difficulty: text` (`beginner|intermediate|advanced|mixed`)
- `is_mock: boolean`
- `total_questions: int`
- `total_score: int`
- `duration_seconds: int`
- `audio_storage_key: text` (Supabase Storage key)
- `estimated_band_min: numeric`
- `estimated_band_max: numeric`
- timestamps…

### 5.2 `listening_sections`

- `id: uuid`
- `test_id: uuid -> listening_tests.id`
- `section_number: int` (1–4)
- `title: text`
- `description: text`

### 5.3 `listening_questions`

- `id: uuid`
- `test_id: uuid`
- `section_id: uuid`
- `question_number: int` (1–40)
- `section_number: int`
- `type: text` (for v1: `'short_answer'`)
- `prompt: text`
- `context: text`
- `correct_answers: text[]`
- `max_score: int`
- Optional future: `options jsonb`, `audio_start_ms`, `audio_end_ms`

### 5.4 `attempts_listening`

- `id: uuid`
- `user_id: uuid`
- `test_id: uuid`
- `mode: text` (`practice|mock`)
- `status: text` (`in_progress|submitted|abandoned`)
- `raw_score: int`
- `band_score: numeric`
- `total_questions: int`
- `time_spent_seconds: int`
- `created_at`, `submitted_at`

### 5.5 `attempts_listening_answers`

- `id: uuid`
- `attempt_id: uuid`
- `question_id: uuid`
- `value: text | text[]` (Supabase `jsonb` or `text[]`)
- `is_correct: boolean`
- `created_at`

### 5.6 `listening_lessons`

- `id: uuid`
- `slug: text unique`
- `title: text`
- `level: text` (`beginner|intermediate|advanced`)
- `estimated_minutes: int`
- `lesson_type: text` (`strategy|question_type|drill|other`)
- `is_published: boolean`
- `is_popular: boolean`
- `order_index: int`
- `tags: text[]`
- `content: text` (markdown)

---

## 6. Scoring & Band Calculation

### 6.1 Raw scoring

- Each question:
  - `max_score` default = 1.
  - `is_correct = true` if user answer matches any `correct_answers` (case-insensitive, trimmed).
- Raw score:
  - `raw_score = sum(max_score for all correct answers)`
  - `total_questions` equals number of questions in `test`.

### 6.2 Band mapping (simple v1)

For v1, use an approximate map (40-mark scale):

- 39–40 → 9.0  
- 37–38 → 8.5  
- 35–36 → 8.0  
- 32–34 → 7.5  
- 30–31 → 7.0  
- 26–29 → 6.5  
- 23–25 → 6.0  
- 18–22 → 5.5  
- 16–17 → 5.0  
- 13–15 → 4.5  
- etc. (extend table explicitly in code)

For tests with `total_score != 40`, scale proportionally to a 40-mark system first, then map.

---

## 7. Behaviour – Practice vs Mock

### 7.1 Practice mode

- Can restart test.
- Timer is **soft** – if time passes, still allow submission but UI should mark “overtime”.
- Navigation:
  - Free navigation across questions/sections.
- Result:
  - Show band, detailed breakdown, highlight weak question types.

### 7.2 Mock mode

- Attempt creation is explicit via `/api/listening/mock/start`.
- Timer is **hard conceptually**:
  - When timer hits 0, `submit()` should be forced or auto-called.
- Navigation:
  - Stricter: future versions may restrict to current section; for v1:
    - Allowed movement but clearly labelled “strict mode” (no replays).
- Result:
  - Uses `MockReviewSummary` + `MockAnswerSheet`.
  - Marked as `mode='mock'`, used in analytics.

---

## 8. Analytics (Listening)

- Band over time (per user, per mode).
- Attempts count:
  - `practice` vs `mock`.
- Accuracy by:
  - section
  - question type

APIs under `/api/listening/analytics/**`.  
UI later as `/listening/analytics` + admin dashboards.

---

## 9. Admin Listening

Admin routes:

- `/admin/listening` – overview & stats
- `/admin/listening/tests` – CRUD-ish for `listening_tests` (mock vs practice toggle)
- `/admin/listening/attempts` – list attempts (for debugging)
- `/admin/listening/question-bank` – view questions + metadata
- `/admin/listening/analytics` – (future) charts & deep analytics

All admin routes:
- Require auth
- Behind role check: `admin` or `teacher` (and/or `withPlan` master tier).

---

## 10. Non-Functional

- **Performance**:  
  - SSR with minimal props
  - Use Supabase views for heavy aggregations later
- **Accessibility**:
  - All interactive items keyboard-accessible
  - Focus styles via DS tokens
- **Security**:
  - RLS on all listening tables by `user_id` where needed
  - No user can see other user’s attempts via public routes
- **Observability**:
  - Error logging for start/submit/analytics APIs
  - Attempt logs are source-of-truth, don’t log raw answers outside DB
