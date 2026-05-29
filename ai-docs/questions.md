# Questions

I have added the path, /Users/shinichiokada/Svelte to Filesystem so you should be able to access /Users/shinichiokada/Svelte/svelte-languages/norskeord.

You can find db schema in supabase/current-schema.sql, current-functions.sql and current-cron-push-notification.sql. You can find all the db migration files in supabase/migrations directory.

==========
## Solved

## How to test 1

ai-docs/implementation/email-service-implementation.md
Done up to Step 6.
I tested and it worked:

```
curl -X POST https://yyohrwgwoubvwjhwnaec.supabase.co/functions/v1/send-lesson-email \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b2hyd2d3b3VidndqaHduYWVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0MDMyOCwiZXhwIjoyMDkyMDE2MzI4fQ.vDS16wIGOLkGnFqt6wmpO-e5D09nQxU6GH_aujdK7mo"
{"ok":true,"skipped":true,"reason":"not a send day","date":"2026-05-16"}%
```

1. Test manually — trigger it via curl or the Supabase dashboard Functions tab. Since today isn't a 1st/3rd Friday it'll return { skipped: true, reason: "not a send day" }, which confirms it's deployed and running. To do a real send test, you can temporarily add a subscriber row for yourself in Supabase and trigger it on a send day, or we can add a ?force=true override for testing — let me know if you want that.
2. Schedule the cron job — Supabase Dashboard → Database → Cron Jobs → New job:

Name: send-lesson-email
Schedule: 0 8 \* \* 5
Command: SELECT net.http_post(url := 'https://<project-ref>.supabase.co/functions/v1/send-lesson-email', headers := '{"Authorization": "Bearer <anon-key>"}'::jsonb);
====

## Others

- The Undo button is too far from Again, Hard, Good, Easy buttons.

## QUIZ Open decisions

1. **Session size:** 10 is the default. Should this be configurable (5 / 10 / 20) in the idle/picker state? Probably yes once the feature is live. Leave hardcoded at 10 for the initial build.

2. **Quiz direction:** Fill-in-the-blank and type-the-answer always ask the user to produce Norwegian. Multiple choice could go either direction. The initial build does MC in Norwegian→English (easier, good warm-up). Reverse (English→Norwegian MC) can be a toggle later.

3. **Auto-advance on correct:** After a correct MC answer, auto-advance after 1.5 seconds (highlight green, show example briefly). On incorrect, stay on reveal until Next is tapped. This feels responsive without being jarring. Disable auto-advance if the user has tapped "Slow down" in Profile preferences (future).

4. **`easy` override:** After revealing a correct answer, show a small "Mark as easy" button to issue an `easy` rating instead of `good`. This is a one-tap override for words the user finds trivial. Worth including in the initial build.

5. **C1/C2 in distractor pool:** The current plan loads A1–B2 for the distractor pool. C1/C2 data is available but adds loading weight. Omit from the initial build; add later if B2+ quiz users request it.
