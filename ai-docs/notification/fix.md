Using command from https://supabase.com/dashboard/project/yyohrwgwoubvwjhwnaec/functions/send-push-reminders/details

```
curl -L -X POST 'https://yyohrwgwoubvwjhwnaec.supabase.co/functions/v1/send-push-reminders' \
  -H 'Authorization: Bearer sb_publishable_f6b8y73zu6hPPz5dQyXnpg_nN_joRHa' \
  -H 'apikey: sb_publishable_f6b8y73zu6hPPz5dQyXnpg_nN_joRHa' \
  -H 'Content-Type: application/json' \
  --data '{"name":"Functions"}'
{"ok":true,"sent":1,"failed":0,"skipped":0,"stale_cleaned":0}%  
```

This `sent:1` means the push notification was successfully delivered to your browser/device. 