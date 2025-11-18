-- 20250201090000_notifications_enhancements.sql
-- Ensure notifications table has modern columns for title/type/metadata support.

alter table if exists public.notifications
  add column if not exists title text,
  add column if not exists type text,
  add column if not exists metadata jsonb,
  add column if not exists body text;
