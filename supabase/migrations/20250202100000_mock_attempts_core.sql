-- supabase/migrations/20250202100000_mock_attempts_core.sql
-- Shared mock attempts table powering unified IELTS modules.

create table if not exists public.mock_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('listening','reading','writing','speaking')),
  mock_id text not null,
  status text not null default 'in_progress',
  answers jsonb,
  score jsonb,
  duration_seconds integer,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mock_attempts_user_idx on public.mock_attempts(user_id, created_at desc);
create index if not exists mock_attempts_module_idx on public.mock_attempts(module, mock_id);

create trigger set_mock_attempts_updated_at
before update on public.mock_attempts
for each row
execute procedure public.set_updated_at();

alter table public.mock_attempts enable row level security;

create policy if not exists "mock_attempts_read_own"
  on public.mock_attempts
  for select
  using (auth.uid() = user_id);

create policy if not exists "mock_attempts_insert_own"
  on public.mock_attempts
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "mock_attempts_update_own"
  on public.mock_attempts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
