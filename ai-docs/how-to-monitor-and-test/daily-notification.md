# To check send-push-reminders that send Web push and email notification

```
curl -L -X POST 'https://yyohrwgwoubvwjhwnaec.supabase.co/functions/v1/send-push-reminders' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b2hyd2d3b3VidndqaHduYWVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0MDMyOCwiZXhwIjoyMDkyMDE2MzI4fQ.vDS16wIGOLkGnFqt6wmpO-e5D09nQxU6GH_aujdK7mo' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b2hyd2d3b3VidndqaHduYWVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0MDMyOCwiZXhwIjoyMDkyMDE2MzI4fQ.vDS16wIGOLkGnFqt6wmpO-e5D09nQxU6GH_aujdK7mo' \
  -H 'Content-Type: application/json' \
  --data '{"name":"Functions"}'
```

This should return:

```
{"ok":true,"push_sent":1,"push_failed":0,"email_sent":1,"email_failed":0,"skipped":0,"stale_cleaned":0}%
```
