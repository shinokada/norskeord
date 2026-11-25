SELECT net.http_post(
  url     := 'https://yyohrwgwoubvwjhwnaec.supabase.co/functions/v1/send-push-reminders?send=1',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', '<CRON_SECRET>'
  ),
  body    := '{}'::jsonb
);

-- Replace <CRON_SECRET> with the value of the CRON_SECRET Edge Function secret
-- when you paste this into Supabase → Integrations → Cron → Push Notifications.
-- Never commit the real value.
--
-- ?send=1 is required to actually send. Without it the function only reports
-- what it would do (dry run).
