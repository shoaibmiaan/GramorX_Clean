# Writing seeds (Academic + General)

This folder contains SQL seed files for IELTS-style Writing mocks. Each file inserts a test row into `public.writing_tests` and two associated rows into `public.writing_tasks` (task 1 and task 2). Slugs follow the pattern `writing-academic-0x` and `writing-general-0x`.

## How to run
1) Open the Supabase SQL editor (or any PostgreSQL client connected to your project).
2) Run the files in any order; each uses `ON CONFLICT` upserts on `slug` and `(test_id, task_number)` so re-running is safe.
3) Paths:
   - Academic: `sql/seed/writing/academic/academic_test_04.sql` … `_06.sql`
   - General: `sql/seed/writing/general/general_test_04.sql` … `_06.sql`

If your schema uses additional NOT NULL columns, set sensible defaults in the `INSERT` statements before running.
