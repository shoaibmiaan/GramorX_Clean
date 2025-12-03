# Audit and mobile app

## Listening module checklist
- [x] Schema aligned with published listening tables and published test guardrails.
- [x] Exam room SSR fetch via Supabase server client to keep single source of truth for tests/sections/questions.
- [x] Mock home shows personalized listening snapshot from `attempts_listening` when signed in.
- [ ] Full analytics parity (per-section breakdown charts) — pending dedicated UI wiring.
- [ ] Mobile smoke test for the updated listening exam room.

Document owners should extend this list when additional listening flows ship (results, review deep links, AI analysis).
