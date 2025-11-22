-- supabase/seed/listening_practice_tests_seed.sql
-- Additional practice tests for IELTS Listening.

insert into public.listening_tests (
  slug,
  title,
  description,
  difficulty,
  is_mock,
  total_questions,
  total_score,
  duration_seconds,
  audio_storage_key,
  estimated_band_min,
  estimated_band_max
)
values
  (
    'ielts-listening-practice-2',
    'IELTS Listening Practice Test 2',
    'Practice test with mixed question types, slightly easier pacing.',
    'beginner',
    false,
    20,
    20,
    20 * 60,
    'audio/listening/practice-2.mp3',
    4.5,
    7.0
  ),
  (
    'ielts-listening-practice-3',
    'IELTS Listening Practice Test 3',
    'Practice test focusing on MCQs and form completion combos.',
    'intermediate',
    false,
    20,
    20,
    20 * 60,
    'audio/listening/practice-3.mp3',
    5.0,
    7.5
  )
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  difficulty = excluded.difficulty,
  is_mock = excluded.is_mock,
  total_questions = excluded.total_questions,
  total_score = excluded.total_score,
  duration_seconds = excluded.duration_seconds,
  audio_storage_key = excluded.audio_storage_key,
  estimated_band_min = excluded.estimated_band_min,
  estimated_band_max = excluded.estimated_band_max;
