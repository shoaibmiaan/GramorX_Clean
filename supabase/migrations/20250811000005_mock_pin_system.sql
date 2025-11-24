-- Unified mock PIN + session schema
create table if not exists public.mock_pins (
  id uuid primary key default gen_random_uuid(),
  pin text not null,
  user_id uuid references auth.users(id) on delete cascade,
  module text,
  test_slug text,
  max_uses integer not null default 1,
  usage_count integer not null default 0,
  expires_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create unique index if not exists mock_pins_pin_idx on public.mock_pins(pin);
create index if not exists mock_pins_user_module_idx on public.mock_pins(user_id, module);

alter table public.mock_pins enable row level security;

create policy if not exists "mock_pins admins full access"
  on public.mock_pins
  as permissive
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.is_admin = true
    )
  );

create policy if not exists "mock_pins user read own"
  on public.mock_pins
  as permissive
  for select
  to authenticated
  using (user_id = auth.uid());

create table if not exists public.mock_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pin_id uuid references public.mock_pins(id) on delete set null,
  module text not null,
  test_slug text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create index if not exists mock_sessions_user_idx on public.mock_sessions(user_id, module);
create index if not exists mock_sessions_pin_idx on public.mock_sessions(pin_id);

alter table public.mock_sessions enable row level security;

create policy if not exists "mock_sessions user read own"
  on public.mock_sessions
  as permissive
  for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists "mock_sessions user insert own"
  on public.mock_sessions
  as permissive
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy if not exists "mock_sessions user update own"
  on public.mock_sessions
  as permissive
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table if not exists public.listening_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_slug text not null,
  score integer,
  band numeric(3,1),
  section_scores jsonb,
  session_id uuid references public.mock_sessions(id) on delete set null,
  submitted_at timestamptz not null default now(),
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists listening_attempts_user_idx on public.listening_attempts(user_id, submitted_at desc);
create index if not exists listening_attempts_test_idx on public.listening_attempts(test_slug);

alter table public.listening_attempts enable row level security;

create policy if not exists "listening_attempts user read own"
  on public.listening_attempts
  as permissive
  for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists "listening_attempts user insert own"
  on public.listening_attempts
  as permissive
  for insert
  to authenticated
  with check (user_id = auth.uid());

create table if not exists public.listening_attempt_answers (
  id bigserial primary key,
  attempt_id uuid not null references public.listening_attempts(id) on delete cascade,
  qno integer not null,
  answer text,
  is_correct boolean,
  created_at timestamptz not null default now()
);

create index if not exists listening_answers_attempt_idx on public.listening_attempt_answers(attempt_id);

alter table public.listening_attempt_answers enable row level security;

create policy if not exists "listening_attempt_answers user read own"
  on public.listening_attempt_answers
  as permissive
  for select
  to authenticated
  using (
    exists (
      select 1 from public.listening_attempts a
      where a.id = listening_attempt_answers.attempt_id
        and a.user_id = auth.uid()
    )
  );

create table if not exists public.listening_mock_tests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  audio_url text not null,
  duration_seconds integer not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.listening_mock_questions (
  id bigserial primary key,
  test_id uuid not null references public.listening_mock_tests(id) on delete cascade,
  qno integer not null,
  type text not null,
  prompt text not null,
  options jsonb,
  answer_key jsonb,
  section_order integer
);

create index if not exists listening_mock_questions_test_idx on public.listening_mock_questions(test_id);

alter table public.listening_mock_tests enable row level security;
alter table public.listening_mock_questions enable row level security;

create policy if not exists "listening_mock_tests read published"
  on public.listening_mock_tests
  as permissive
  for select
  to authenticated
  using (is_published = true);

create policy if not exists "listening_mock_questions read via test"
  on public.listening_mock_questions
  as permissive
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.listening_mock_tests t
      where t.id = listening_mock_questions.test_id
        and t.is_published = true
    )
  );

alter table public.profiles
  add column if not exists goal_band numeric(3,1);
