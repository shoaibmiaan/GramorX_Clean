# Audit and mobile app

## Listening module
- Schema: ✅ Listening tables, RLS, and ownership rules finalized for attempts and answers.
- Seeds: ✅ Two full listening mocks (40 questions each) seeded with stable question types.
- Exam room: ✅ Strict listening exam room wired to SSR data and scoring.
- Result page: ✅ Completed attempts redirect to per-attempt result pages with band and raw scores.
- Review page: ✅ Detailed review grouped by section with answer correctness and question-type tags.
- History: ✅ Authenticated history view shows only the signed-in user’s attempts with quick review/result links.
- Analytics: ✅ Section and question-type accuracy plus band trend charts powered by attempt data.
- RLS/security: ✅ Authenticated users can read public metadata; attempts/answers restricted to owners.

## Tradeoffs and TODOs
- Future enhancement: expand analytics with per-question timestamps and audio playback events for deeper insights.
- Future enhancement: add mobile-friendly refinements to the strict exam layout (e.g., sticky audio controls, larger tap targets).
- Mock themes: mock portal now supports persistent themes (`default`, `gradient`, `solid`, `dark`, `focus`, `paper`) stored in
  localStorage with DS-aligned background tokens for the `/mock` surface.
