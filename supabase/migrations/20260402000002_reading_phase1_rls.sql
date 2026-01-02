-- Phase 1: Reading RLS hardening + attempt locking

-- Ensure reading_passages view uses invoker permissions
ALTER VIEW IF EXISTS public.reading_passages SET (security_invoker = true);

-- Content tables: enable RLS
ALTER TABLE IF EXISTS public.reading_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reading_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reading_daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reading_weekly_challenges ENABLE ROW LEVEL SECURITY;

-- Attempts: enable RLS
ALTER TABLE IF EXISTS public.reading_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reading_drill_attempts ENABLE ROW LEVEL SECURITY;

-- Content table policies (public read, teacher/admin write)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_tests' AND policyname = 'Public read reading_tests'
  ) THEN
    CREATE POLICY "Public read reading_tests"
      ON public.reading_tests
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_questions' AND policyname = 'Public read reading_questions'
  ) THEN
    CREATE POLICY "Public read reading_questions"
      ON public.reading_questions
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_tests' AND policyname = 'Teachers manage reading tests'
  ) THEN
    CREATE POLICY "Teachers manage reading tests"
      ON public.reading_tests
      FOR ALL
      USING (auth.jwt()->>'role' IN ('teacher','admin'))
      WITH CHECK (auth.jwt()->>'role' IN ('teacher','admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_questions' AND policyname = 'Teachers manage reading questions'
  ) THEN
    CREATE POLICY "Teachers manage reading questions"
      ON public.reading_questions
      FOR ALL
      USING (auth.jwt()->>'role' IN ('teacher','admin'))
      WITH CHECK (auth.jwt()->>'role' IN ('teacher','admin'));
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_daily_challenges' AND policyname = 'Public read reading_daily_challenges'
  ) THEN
    CREATE POLICY "Public read reading_daily_challenges"
      ON public.reading_daily_challenges
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_weekly_challenges' AND policyname = 'Public read reading_weekly_challenges'
  ) THEN
    CREATE POLICY "Public read reading_weekly_challenges"
      ON public.reading_weekly_challenges
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_daily_challenges' AND policyname = 'Teachers manage reading_daily_challenges'
  ) THEN
    CREATE POLICY "Teachers manage reading_daily_challenges"
      ON public.reading_daily_challenges
      FOR ALL
      USING (auth.jwt()->>'role' IN ('teacher','admin'))
      WITH CHECK (auth.jwt()->>'role' IN ('teacher','admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_weekly_challenges' AND policyname = 'Teachers manage reading_weekly_challenges'
  ) THEN
    CREATE POLICY "Teachers manage reading_weekly_challenges"
      ON public.reading_weekly_challenges
      FOR ALL
      USING (auth.jwt()->>'role' IN ('teacher','admin'))
      WITH CHECK (auth.jwt()->>'role' IN ('teacher','admin'));
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Attempt policies (owner-only write, admin read, lock after submit)
DO $$
BEGIN
  BEGIN DROP POLICY IF EXISTS "Students manage own reading_attempts" ON public.reading_attempts; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DROP POLICY IF EXISTS "Admins manage reading_attempts" ON public.reading_attempts; EXCEPTION WHEN undefined_table THEN NULL; END;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_attempts' AND policyname = 'reading_attempts_owner_select'
  ) THEN
    CREATE POLICY "reading_attempts_owner_select"
      ON public.reading_attempts
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_attempts' AND policyname = 'reading_attempts_owner_insert'
  ) THEN
    CREATE POLICY "reading_attempts_owner_insert"
      ON public.reading_attempts
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_attempts' AND policyname = 'reading_attempts_owner_update'
  ) THEN
    CREATE POLICY "reading_attempts_owner_update"
      ON public.reading_attempts
      FOR UPDATE
      USING (auth.uid() = user_id AND submitted_at IS NULL)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_attempts' AND policyname = 'reading_attempts_owner_delete'
  ) THEN
    CREATE POLICY "reading_attempts_owner_delete"
      ON public.reading_attempts
      FOR DELETE
      USING (auth.uid() = user_id AND submitted_at IS NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_attempts' AND policyname = 'reading_attempts_admin_read'
  ) THEN
    CREATE POLICY "reading_attempts_admin_read"
      ON public.reading_attempts
      FOR SELECT
      USING (auth.jwt()->>'role' = 'admin');
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_drill_attempts' AND policyname = 'reading_drill_attempts_owner_select'
  ) THEN
    CREATE POLICY "reading_drill_attempts_owner_select"
      ON public.reading_drill_attempts
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_drill_attempts' AND policyname = 'reading_drill_attempts_owner_insert'
  ) THEN
    CREATE POLICY "reading_drill_attempts_owner_insert"
      ON public.reading_drill_attempts
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_drill_attempts' AND policyname = 'reading_drill_attempts_owner_update'
  ) THEN
    CREATE POLICY "reading_drill_attempts_owner_update"
      ON public.reading_drill_attempts
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_drill_attempts' AND policyname = 'reading_drill_attempts_owner_delete'
  ) THEN
    CREATE POLICY "reading_drill_attempts_owner_delete"
      ON public.reading_drill_attempts
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reading_drill_attempts' AND policyname = 'reading_drill_attempts_admin_read'
  ) THEN
    CREATE POLICY "reading_drill_attempts_admin_read"
      ON public.reading_drill_attempts
      FOR SELECT
      USING (auth.jwt()->>'role' = 'admin');
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;
