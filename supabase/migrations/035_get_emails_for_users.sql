-- 035_get_emails_for_users.sql
-- Recipient lookup for send-push-reminders: email address, account age and last
-- study day for a set of users, in one call. Replaces auth.admin.listUsers(),
-- which loads every user and stops at 1000.
--
-- last_study_day is NULL for users who have never studied.
-- Service role only: the function reads auth.users.

create or replace function public.get_emails_for_users(p_ids uuid[])
returns table (id uuid, email text, created_at timestamptz, last_study_day date)
language sql
security definer
set search_path = ''
as $$
  select
    u.id,
    u.email::text,
    u.created_at,
    (select max(sd.day) from public.study_days sd where sd.user_id = u.id)
  from auth.users u
  where u.id = any(p_ids)
    and u.email is not null;
$$;

revoke execute on function public.get_emails_for_users(uuid[]) from public, anon, authenticated;
grant execute on function public.get_emails_for_users(uuid[]) to service_role;
