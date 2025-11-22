-- supabase/seed/listening_mock_tests_seed.sql
-- Additional/explicit mock tests for IELTS Listening.

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
    'ielts-listening-mock-2',
    'IELTS Listening Mock Test 2',
    'Full-length strict mock test with four sections and realistic audio pacing.',
    'mixed',
    true,
    40,
    40,
    30 * 60,
    'audio/listening/mock-2.mp3',
    5.5,
    8.5
  ),
  (
    'ielts-listening-mock-3',
    'IELTS Listening Mock Test 3',
    'Higher-difficulty mock with heavier Section 3 and Section 4 focus.',
    'advanced',
    true,
    40,
    40,
    30 * 60,
    'audio/listening/mock-3.mp3',
    6.0,
    8.5
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
