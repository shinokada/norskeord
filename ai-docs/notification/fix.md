Using command from https://supabase.com/dashboard/project/yyohrwgwoubvwjhwnaec/functions/send-push-reminders/details

```
curl -L -X POST 'https://yyohrwgwoubvwjhwnaec.supabase.co/functions/v1/send-push-reminders' \
  -H 'Authorization: Bearer <USE PUBLIC_SUPABASE_PUBLISHABLE_KEY from .env>' \
  -H 'apikey: <USE PUBLIC_SUPABASE_PUBLISHABLE_KEY from .env>' \
  -H 'Content-Type: application/json' \
  --data '{"name":"Functions"}'
{"ok":true,"sent":1,"failed":0,"skipped":0,"stale_cleaned":0}%  
```

This `sent:1` means the push notification was successfully delivered to your browser/device. 