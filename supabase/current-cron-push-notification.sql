SELECT net.http_post(
  url     := 'https://yyohrwgwoubvwjhwnaec.supabase.co/functions/v1/send-push-reminders',
  headers := '{"Content-Type": "application/json"}'::jsonb,
  body    := '{}'::jsonb
);