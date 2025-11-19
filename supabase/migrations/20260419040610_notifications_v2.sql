-- 20260419040610_notifications_v2.sql
-- Align notification tables with unified schema

-- notifications table upgrades -------------------------------------------------
alter table if exists public.notifications
  add column if not exists type text,
  add column if not exists title text,
  add column if not exists body text,
  add column if not exists channel text,
  add column if not exists meta jsonb default '{}'::jsonb,
  add column if not exists read_at timestamptz,
  add column if not exists sent_at timestamptz,
  add column if not exists template_id uuid;

-- notification_templates schema ------------------------------------------------
alter table if exists public.notification_templates
  add column if not exists event_key text,
  add column if not exists channel text,
  add column if not exists title_template text,
  add column if not exists body_template text,
  add column if not exists default_enabled boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists notification_templates_event_key_channel_idx
  on public.notification_templates (event_key, channel);

-- notification_events schema ---------------------------------------------------
alter table if exists public.notification_events
  add column if not exists user_id uuid,
  add column if not exists event_key text,
  add column if not exists payload jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();

-- notification_deliveries schema ----------------------------------------------
alter table if exists public.notification_deliveries
  add column if not exists notification_id uuid,
  add column if not exists channel text,
  add column if not exists status text,
  add column if not exists error text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists sent_at timestamptz;

-- notifications_opt_in + consent events ---------------------------------------
alter table if exists public.notifications_opt_in
  add column if not exists user_id uuid,
  add column if not exists channel text,
  add column if not exists enabled boolean default true,
  add column if not exists updated_at timestamptz default now();

alter table if exists public.notification_consent_events
  add column if not exists user_id uuid,
  add column if not exists channel text,
  add column if not exists action text,
  add column if not exists source text,
  add column if not exists meta jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();
