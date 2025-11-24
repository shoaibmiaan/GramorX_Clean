-- supabase/seed/listening_tests_seed.sql
-- Seed data for IELTS Listening tests, sections, and questions.
-- Safe to run multiple times if you use ON CONFLICT on slug.

-- -------------------------------------------------------------------
-- 1) LISTENING TESTS
-- -------------------------------------------------------------------

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
    'ielts-listening-practice-1',
    'IELTS Listening Practice Test 1',
    'General training-style practice test with mixed question types. Use this to warm up and test strategies before burning a full mock.',
    'mixed',
    false,
    10,
    10,
    20 * 60,
    'audio/listening/practice-1.mp3',
    5.0,
    7.0
  ),
  (
    'ielts-listening-mock-1',
    'IELTS Listening Mock Test 1',
    'Strict computer-based IELTS Listening mock with 4 sections compressed into a single audio file.',
    'mixed',
    10,
    10,
    30 * 60,
    'audio/listening/mock-1.mp3',
    5.5,
    8.0
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

-- -------------------------------------------------------------------
-- 2) FETCH TEST IDS
-- -------------------------------------------------------------------

with practice_test as (
  select id
  from public.listening_tests
  where slug = 'ielts-listening-practice-1'
  limit 1
),
mock_test as (
  select id
  from public.listening_tests
  where slug = 'ielts-listening-mock-1'
  limit 1
),

-- -------------------------------------------------------------------
-- 3) PRACTICE TEST SECTIONS
-- -------------------------------------------------------------------
practice_sections as (
  insert into public.listening_sections (
    test_id,
    section_number,
    title,
    description
  )
  select
    p.id,
    s.section_number,
    s.title,
    s.description
  from practice_test p
  cross join (
    values
      (1, 'Section 1 – Everyday conversation', 'Short conversation about a basic admin task (e.g. booking, registration).'),
      (2, 'Section 2 – Informational talk', 'Single speaker explaining a service, facility, or event.')
  ) as s(section_number, title, description)
  returning id, test_id, section_number
),

-- -------------------------------------------------------------------
-- 4) MOCK TEST SECTIONS
-- -------------------------------------------------------------------
mock_sections as (
  insert into public.listening_sections (
    test_id,
    section_number,
    title,
    description
  )
  select
    m.id,
    s.section_number,
    s.title,
    s.description
  from mock_test m
  cross join (
    values
      (1, 'Section 1 – Everyday conversation', 'Dialogue about a simple service scenario.'),
      (2, 'Section 2 – Campus or facility talk', 'Monologue about a campus, museum, or facility layout.')
  ) as s(section_number, title, description)
  returning id, test_id, section_number
)

-- -------------------------------------------------------------------
-- 5) QUESTIONS FOR PRACTICE TEST
-- -------------------------------------------------------------------
insert into public.listening_questions (
  test_id,
  section_id,
  question_number,
  section_number,
  type,
  prompt,
  context,
  correct_answers,
  max_score
)
select
  ps.test_id,
  ps.id as section_id,
  q.question_number,
  ps.section_number,
  q.type,
  q.prompt,
  q.context,
  q.correct_answers,
  q.max_score
from practice_sections ps
cross join lateral (
  -- Section 1 questions (1–5)
  select *
  from (
    values
      (
        1,
        'short_answer',
        'What time is the appointment scheduled for?',
        'The conversation is between a receptionist and a student booking an appointment.',
        array['10:30'],
        1
      ),
      (
        2,
        'short_answer',
        'What is the booking reference number?',
        'Listen for the code the receptionist repeats back to confirm the booking.',
        array['B742'],
        1
      ),
      (
        3,
        'short_answer',
        'Which day of the week is the appointment on?',
        'The student and receptionist confirm the day clearly once.',
        array['Tuesday'],
        1
      ),
      (
        4,
        'short_answer',
        'Which room will the student go to?',
        'The receptionist mentions a room number in the main building.',
        array['Room 204'],
        1
      ),
      (
        5,
        'short_answer',
        'What item must the student bring to the appointment?',
        'Listen for what the receptionist says the student “must bring with you”.',
        array['Student ID card', 'ID card'],
        1
      )
  ) as q1(question_number, type, prompt, context, correct_answers, max_score)

  union all

  -- Section 2 questions (6–10)
  select *
  from (
    values
      (
        6,
        'short_answer',
        'What is the name of the sports centre?',
        'The speaker introduces the facility at the beginning of the talk.',
        array['Riverside Sports Centre', 'Riverside Sports Center'],
        1
      ),
      (
        7,
        'short_answer',
        'How much does a monthly membership cost?',
        'Listen for the price for a standard monthly membership.',
        array['£25', '25'],
        1
      ),
      (
        8,
        'short_answer',
        'On which days is the swimming pool closed?',
        'The speaker mentions two days when the pool is not available.',
        array['Monday and Friday', 'Friday and Monday'],
        1
      ),
      (
        9,
        'short_answer',
        'What should visitors do before using the gym equipment?',
        'The speaker gives a safety instruction about using the gym.',
        array['complete an induction', 'do an induction'],
        1
      ),
      (
        10,
        'short_answer',
        'Where can visitors leave their valuables?',
        'Listen for where the speaker says valuables should be stored.',
        array['in the lockers', 'lockers'],
        1
      )
  ) as q2(question_number, type, prompt, context, correct_answers, max_score)
) as q
where ps.section_number in (1, 2)
on conflict (test_id, section_id, question_number) do update
set
  type = excluded.type,
  prompt = excluded.prompt,
  context = excluded.context,
  correct_answers = excluded.correct_answers,
  max_score = excluded.max_score;

-- -------------------------------------------------------------------
-- 6) QUESTIONS FOR MOCK TEST
-- -------------------------------------------------------------------

insert into public.listening_questions (
  test_id,
  section_id,
  question_number,
  section_number,
  type,
  prompt,
  context,
  correct_answers,
  max_score
)
select
  ms.test_id,
  ms.id as section_id,
  q.question_number,
  ms.section_number,
  q.type,
  q.prompt,
  q.context,
  q.correct_answers,
  q.max_score
from mock_sections ms
cross join lateral (
  -- Section 1 questions (1–5)
  select *
  from (
    values
      (
        1,
        'short_answer',
        'What is the caller’s surname?',
        'The receptionist asks the caller to spell their surname.',
        array['Harper'],
        1
      ),
      (
        2,
        'short_answer',
        'What is the caller’s contact number?',
        'Listen carefully for the sequence of numbers.',
        array['07946 258 314', '07946258314'],
        1
      ),
      (
        3,
        'short_answer',
        'Which course does the caller want to join?',
        'The caller mentions the specific course title once.',
        array['Evening English course'],
        1
      ),
      (
        4,
        'short_answer',
        'Which month does the course begin?',
        'Listen for the starting month discussed.',
        array['September'],
        1
      ),
      (
        5,
        'short_answer',
        'What is the fee for the course?',
        'The receptionist confirms the fee after checking the details.',
        array['£180', '180'],
        1
      )
  ) as q1(question_number, type, prompt, context, correct_answers, max_score)

  union all

  -- Section 2 questions (6–10)
  select *
  from (
    values
      (
        6,
        'short_answer',
        'Where should students meet for the campus tour?',
        'The speaker gives a specific meeting point at the start.',
        array['outside the main library', 'at the main library'],
        1
      ),
      (
        7,
        'short_answer',
        'How long will the tour take?',
        'Listen for the approximate duration mentioned.',
        array['about 45 minutes', '45 minutes'],
        1
      ),
      (
        8,
        'short_answer',
        'What colour badge will the guide be wearing?',
        'The speaker mentions a badge to help students identify the guide.',
        array['red', 'a red badge'],
        1
      ),
      (
        9,
        'short_answer',
        'Which building will students visit first?',
        'The speaker outlines the first stop of the tour.',
        array['science building', 'science block'],
        1
      ),
      (
        10,
        'short_answer',
        'What will students receive at the end of the tour?',
        'The speaker mentions something students will be given after the tour.',
        array['an information pack', 'a welcome pack'],
        1
      )
  ) as q2(question_number, type, prompt, context, correct_answers, max_score)
) as q
where ms.section_number in (1, 2)
on conflict (test_id, section_id, question_number) do update
set
  type = excluded.type,
  prompt = excluded.prompt,
  context = excluded.context,
  correct_answers = excluded.correct_answers,
  max_score = excluded.max_score;
