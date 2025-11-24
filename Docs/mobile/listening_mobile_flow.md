# Listening Module – Mobile Flow & UX (v1)

Target: Mobile web (phone) for Listening Learn / Practice / Game / Mock.  
Constraint: We are **not** promising offline mode in v1.

---

## 1. General Mobile Principles

- Single column layouts.
- No tiny tap targets – minimum around 40px height for buttons.
- Timer and key controls **must** stay visible without awkward scrolling during tests.
- Avoid heavy modals. Prefer full-screen pages or simple drawers.

---

## 2. Navigation on Mobile

### 2.1 Entry & Tabs

- `/listening`:
  - Top: compact hero.
  - Below: **ListeningNavTabs** horizontally, scrollable if needed.
  - Below: core content (cards, stats).

**Nav rules:**
- Tabs should be obviously tappable:
  - `Learn`, `Practice`, `Game`, `Mock`.
- Active tab has clear visual state.
- No bottom nav added here (use global site nav only if consistent with rest of app).

---

## 3. Learn – Mobile UX

### 3.1 Lessons list `/listening/learn`

- Layout:
  - Single column list of `ListeningLessonCard`.
- Card contents:
  - Title
  - Level chip (beginner/intermediate/advanced)
  - Estimated minutes
- Interaction:
  - Whole card is tappable.
  - No tiny “View” links.

### 3.2 Lesson detail `/listening/learn/[slug]`

- Top:
  - Back link → `/listening/learn`.
  - Title, level chip, estimated time.
- Body:
  - Markdown content rendered as text with proper spacing.
  - Avoid extreme nesting (no deep bullet pyramids).
- At the bottom:
  - CTA suggestion:
    - “Next step: run a practice test” with link to `/listening/practice`.

---

## 4. Practice – Mobile UX

### 4.1 Test list `/listening/practice`

- Single column cards.
- Each card:
  - Title + difficulty
  - `X questions · Y min · band range`
  - “Start practice” button full-width on mobile.

### 4.2 Practice runner `/listening/practice/[slug]`

**Layout priorities on mobile:**

1. Timer and basic test info at top.
2. Question text + context.
3. Answer input.
4. Navigation controls at bottom (Prev/Next, Submit).

**Timer:**
- Visible at top within the viewport on first load.
- If the page scrolls, aim to keep timer near top, not hidden behind other junk.

**Question:**
- Prompt text:
  - Reasonable max width (no insane line length).
  - Use DS body text tokens.
- Context:
  - Smaller, muted text above or below prompt.

**Answer input:**
- For v1: single text field.
- Use DS input with proper tappable height.

**Buttons:**
- Bottom area:
  - Prev (outline)
  - Next (outline)
  - Submit (primary)
- On very narrow screens, stack if needed:
  - First row: Prev + Next
  - Second row: Submit full-width

**Behaviour:**
- Timer hitting 0:
  - Practice mode: visually show “Time up (practice only)” but still allow submit.
- On leaving page:
  - Autosave optional, but no broken state when user comes back.

---

## 5. Game – Mobile UX

### 5.1 Game hub `/listening/game`

- Cards for each game mode stacked vertically.
- Stats (challenges played, best streak) in small metric cards near top.
- Each game mode card:
  - Chip (Speed round, Spelling sniper, No-back mode)
  - Short description
  - Full-width “Play” button.

### 5.2 Game challenge `/listening/game/challenge`

**Layout:**

- Top:
  - Back to hub
  - Mode chip
- Under that:
  - Small info banner: “Sprint, not marathon”.
- Metrics:
  - Row of small cards:
    - Time left
    - Correct answers
    - State (ready/running/finished)
- Game area:
  - Question number, prompt, optional hint.
  - Single input field.
  - Buttons: End early / Submit answer.

**Interaction:**

- `ready`:
  - “Start challenge” button visible -> start timer.
- `running`:
  - Timer updates each second (don’t jank mobile).
- `finished`:
  - Show score and list of answers vs correct.

**No crazy animations** in v1. Keep it smooth on mid-range phones.

---

## 6. Mock – Mobile UX

Mock is the most sensitive. It must feel like a legit exam, not a broken mobile site.

### 6.1 Mock list `/mock/listening`

- Same pattern as practice list, but clearly labelled as **Strict mock**.
- Each card:
  - Strict label chip (e.g. “Strict IELTS mock”)
  - Start / instructions buttons.

### 6.2 Overview `/mock/listening/overview?slug=...`

- Strong warning banner near top:
  - “Strict exam rules. Timer, no resets, etc.”
- Sections:
  - “Before you start”
  - “Test summary”
  - “Behaviour during the test”
- Bottom:
  - Back button
  - “Start mock now” button (full-width on mobile).

### 6.3 Mock runner `/mock/listening/run?slug=...`

**Critical layout**:

- Top:
  - Test name, section info.
  - Strict warning (short).
- Timer:
  - Prominent; visible on first paint.
- Question content:
  - `MockQuestionRenderer` inside `MockTestShell`.

**Navigation pane:**

- On desktop:
  - Can use side navigation.
- On mobile:
  - Section/question navigation should not eat the whole screen.
  - Acceptable v1: nav sits above / collapses into a small panel.

**Interactions:**

- “Start mock”:
  - Only after attempt is created (no ghost attempts).
- During mock:
  - `Prev` / `Next` accessible.
  - “Submit mock” clearly labelled and not accidental.
- Submit:
  - Confirmation dialog before final lock:
    - “Submit this mock and lock your answers?”
- If connection drops briefly:
  - Autosave either:
    - silently fails but doesn’t break UI, or
    - retries.

---

## 7. Audio – Mobile Rules

- Audio should **only start after a user gesture** (tap).
- Controls:
  - Play / pause
  - Basic timeline, if possible.
- UX rules:
  - Don’t blast max volume automatically.
  - Don’t keep playing audio if user navigates away from the test route.
- Headphones expectations:
  - Somewhere in UI, remind user to use headphones for best experience.

---

## 8. Errors & Edge Cases on Mobile

- Bad slug:
  - `/listening/practice/[slug]` or `/mock/listening/run?slug=bad` should:
    - Show 404 or friendly “Test not found” state. No white screen.
- Auth expired mid-test:
  - On API 401:
    - Show a clear message and route user to login.
    - Try not to silently lose attempt data (mock). At minimum, explain.

---

## 9. QA Script for Mobile

Use this as a mini test plan:

1. Sign up / log in from phone.
2. Go to `/listening`.
3. Open:
   - Learn → one lesson
   - Back to list.
4. Start a practice test:
   - Answer 3–4 questions.
   - Let timer run a bit.
   - Submit.
   - View result.
5. Start a game challenge:
   - Play for 20–30 seconds.
   - Submit.
6. Open mock overview:
   - Read rules.
   - Start mock.
   - Answer 3 questions, then submit.
   - Check result.
7. Rotate device (if supported) once or twice:
   - Ensure layout doesn’t explode.

If any of these steps feels janky on mobile, fix before calling Listening “done”.

