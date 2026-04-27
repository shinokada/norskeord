-- Update the plan check constraint to use 'plus' instead of 'pro'
-- to match the Norskeord Plus branding.
alter table subscriptions drop constraint subscriptions_plan_check;

alter table subscriptions add constraint subscriptions_plan_check
  check (plan in ('free', 'plus'));
