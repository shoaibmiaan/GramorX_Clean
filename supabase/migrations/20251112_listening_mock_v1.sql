-- Listening schema v1 (finalized)
-- Creates core tables, question types, attempts, and answer storage for the Listening module.

-- Question types (canonical list)
create table if not exists public.listening_question_types (
  key text primary key,
  label text not null,
  description text
);

insert into public.listening_question_types (key, label, description) values
  ('mcq', 'Multiple Choice', 'Choose the correct option from A/B/C/D.'),
  ('table_completion', 'Form / Table / Note Completion', 'Fill missing words in forms, tables, notes, or flowcharts.'),
  ('sentence_completion', 'Sentence Completion', 'Complete the sentence with 1–3 words from the recording.'),
  ('map_labeling', 'Map / Diagram Labeling', 'Label places or parts on a map or diagram using the recording.'),
  ('matching', 'Matching', 'Match speakers, items, or features to the correct list options.'),
  ('summary_completion', 'Summary Completion', 'Fill a short summary with missing words based on the audio.')
  on conflict (key) do update set
    label = excluded.label,
    description = excluded.description;

-- Tests
create table if not exists public.listening_tests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  audio_url text,
  duration_minutes integer default 40,
  questions integer default 40,
  is_mock boolean default true,
  is_published boolean default false,
  transcript text,
  level text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_timestamp on public.listening_tests;
create trigger set_timestamp
  before update on public.listening_tests
  for each row
  execute procedure public.set_updated_at();

-- Sections
create table if not exists public.listening_sections (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references public.listening_tests(id) on delete cascade,
  test_slug text references public.listening_tests(slug) on delete cascade,
  order_no integer not null,
  audio_url text,
  start_ms integer default 0,
  end_ms integer default 0,
  start_sec integer,
  end_sec integer,
  title text,
  transcript text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listening_sections_order_unique unique (test_slug, order_no)
);

drop trigger if exists set_timestamp on public.listening_sections;
create trigger set_timestamp
  before update on public.listening_sections
  for each row
  execute procedure public.set_updated_at();

-- Questions
create table if not exists public.listening_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references public.listening_tests(id) on delete cascade,
  test_slug text references public.listening_tests(slug) on delete cascade,
  section_id uuid references public.listening_sections(id) on delete set null,
  section_no integer not null,
  question_number integer not null,
  qno integer,
  question_type text references public.listening_question_types(key),
  type text,
  prompt text,
  question_text text,
  options jsonb,
  correct_answer jsonb,
  answer_key jsonb,
  match_left jsonb,
  match_right jsonb,
  explanation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listening_questions_qno_unique unique (test_slug, question_number)
);

drop trigger if exists set_timestamp on public.listening_questions;
create trigger set_timestamp
  before update on public.listening_questions
  for each row
  execute procedure public.set_updated_at();

-- Attempts
create table if not exists public.listening_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid references public.listening_tests(id) on delete cascade,
  test_slug text,
  raw_score integer,
  score integer,
  total_questions integer,
  questions integer,
  band_score numeric(4,1),
  band numeric(4,1),
  duration_seconds integer,
  status text,
  section_scores jsonb,
  meta jsonb,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_timestamp on public.listening_attempts;
create trigger set_timestamp
  before update on public.listening_attempts
  for each row
  execute procedure public.set_updated_at();

-- Attempt answers (canonical storage)
create table if not exists public.listening_user_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.listening_attempts(id) on delete cascade,
  question_id uuid references public.listening_questions(id) on delete set null,
  qno integer not null,
  question_number integer,
  section integer,
  answer jsonb,
  user_answer text,
  normalized_answer text,
  correct_answer text,
  is_correct boolean,
  created_at timestamptz not null default now()
);

-- Back-compat: surface answers via a view with friendlier columns
create or replace view public.listening_attempt_answers as
select
  lua.id,
  lua.attempt_id,
  coalesce(lua.question_id, q.id) as question_id,
  coalesce(lua.question_number, lua.qno) as question_number,
  coalesce(lua.section, q.section_no) as section,
  coalesce(
    lua.user_answer,
    case
      when jsonb_typeof(lua.answer) = 'string' then lua.answer #>> '{}'
      else lua.answer::text
    end
  ) as user_answer,
  coalesce(
    lua.correct_answer,
    case
      when q.correct_answer is null then null
      when jsonb_typeof(q.correct_answer) = 'string' then q.correct_answer #>> '{}'
      else q.correct_answer::text
    end
  ) as correct_answer,
  lua.is_correct,
  lua.created_at
from public.listening_user_answers lua
left join public.listening_attempts la on la.id = lua.attempt_id
left join public.listening_questions q
  on q.test_slug = la.test_slug
  and q.question_number = coalesce(lua.question_number, lua.qno);

-- Legacy compatibility for older policies
create table if not exists public.listening_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_slug text references public.listening_tests(slug) on delete cascade,
  score integer,
  total_questions integer,
  accuracy numeric(5,2),
  band numeric(3,1),
  meta jsonb,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_timestamp on public.listening_responses;
create trigger set_timestamp
  before update on public.listening_responses
  for each row
  execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.listening_question_types enable row level security;
alter table public.listening_tests enable row level security;
alter table public.listening_sections enable row level security;
alter table public.listening_questions enable row level security;
alter table public.listening_attempts enable row level security;
alter table public.listening_user_answers enable row level security;
alter table public.listening_responses enable row level security;

drop policy if exists "Public read listening_question_types" on public.listening_question_types;
create policy "Public read listening_question_types"
  on public.listening_question_types
  for select to authenticated
  using (true);

drop policy if exists "Public read listening_tests" on public.listening_tests;
create policy "Public read listening_tests"
  on public.listening_tests
  for select to authenticated
  using (coalesce(is_published, true));

drop policy if exists "Public read listening_sections" on public.listening_sections;
create policy "Public read listening_sections"
  on public.listening_sections
  for select to authenticated
  using (true);

drop policy if exists "Public read listening_questions" on public.listening_questions;
create policy "Public read listening_questions"
  on public.listening_questions
  for select to authenticated
  using (true);

-- Attempt-level ownership
drop policy if exists "listening_attempts_self_read" on public.listening_attempts;
create policy "listening_attempts_self_read"
  on public.listening_attempts
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "listening_attempts_self_write" on public.listening_attempts;
create policy "listening_attempts_self_write"
  on public.listening_attempts
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "listening_attempts_self_update" on public.listening_attempts;
create policy "listening_attempts_self_update"
  on public.listening_attempts
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "listening_user_answers_self_read" on public.listening_user_answers;
create policy "listening_user_answers_self_read"
  on public.listening_user_answers
  for select to authenticated
  using (
    exists (
      select 1 from public.listening_attempts la
      where la.id = listening_user_answers.attempt_id
        and la.user_id = auth.uid()
    )
  );

drop policy if exists "listening_user_answers_self_write" on public.listening_user_answers;
create policy "listening_user_answers_self_write"
  on public.listening_user_answers
  for insert to authenticated
  with check (
    exists (
      select 1 from public.listening_attempts la
      where la.id = listening_user_answers.attempt_id
        and la.user_id = auth.uid()
    )
  );

drop policy if exists "listening_user_answers_self_update" on public.listening_user_answers;
create policy "listening_user_answers_self_update"
  on public.listening_user_answers
  for update to authenticated
  using (
    exists (
      select 1 from public.listening_attempts la
      where la.id = listening_user_answers.attempt_id
        and la.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listening_attempts la
      where la.id = listening_user_answers.attempt_id
        and la.user_id = auth.uid()
    )
  );

drop policy if exists "Students manage own listening_responses" on public.listening_responses;
create policy "Students manage own listening_responses"
  on public.listening_responses
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
