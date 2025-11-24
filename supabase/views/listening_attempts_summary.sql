-- supabase/views/listening_attempts_summary.sql
-- Creates a summary view over attempts_listening for analytics.

create or replace view public.v_listening_attempts_summary as
select
  a.user_id,
  t.id as test_id,
  t.slug as test_slug,
  t.title as test_title,
  t.is_mock,
  count(*) as total_attempts,
  count(*) filter (where a.mode = 'practice') as practice_attempts,
  count(*) filter (where a.mode = 'mock') as mock_attempts,
  count(*) filter (where a.status = 'submitted') as submitted_attempts,
  avg(a.band_score) filter (where a.status = 'submitted') as avg_band_overall,
  avg(a.band_score) filter (where a.status = 'submitted' and a.mode = 'practice') as avg_band_practice,
  avg(a.band_score) filter (where a.status = 'submitted' and a.mode = 'mock') as avg_band_mock,
  min(a.created_at) as first_attempt_at,
  max(a.created_at) as last_attempt_at
from public.attempts_listening a
join public.listening_tests t on t.id = a.test_id
group by a.user_id, t.id, t.slug, t.title, t.is_mock;
