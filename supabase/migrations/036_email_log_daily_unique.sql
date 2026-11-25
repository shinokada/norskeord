-- 036_email_log_daily_unique.sql
-- email_log had UNIQUE (user_id, email_type), so a user's second 'daily_reminder'
-- row was always rejected. The idempotency guard in send-push-reminders never saw
-- anything after a user's first reminder.
--
-- Replace the blanket constraint with:
--   * one row per (user, type) for every type except 'daily_reminder', and
--   * one 'daily_reminder' row per user per UTC day.

alter table public.email_log
  drop constraint if exists email_log_user_id_email_type_key;

create unique index if not exists email_log_once_per_type
  on public.email_log (user_id, email_type)
  where email_type <> 'daily_reminder';

create unique index if not exists email_log_reminder_once_per_day
  on public.email_log (user_id, ((sent_at at time zone 'UTC')::date))
  where email_type = 'daily_reminder';
