I have added the path, /Users/shinichiokada/Svelte to Filesystem so you should be able to access /Users/shinichiokada/Svelte/svelte-languages/norskeord.

You can find db schema in supabase/current-schema.sql, current-functions.sql and current-cron-push-notification.sql. You can find all the db migration files in supabase/migrations directory.

vocab files should follow data-rules/VOCAB.md
Done src/lib/data/vocab-a1.json, vocab-b1.json, vocab-b2.json.
To Be Done:
vocab-a2.json, vocab-c.json

I run:
```
norskeord git:(fix/no-english-posts) ✗ node scripts/normalise-norsk-field.mjs --dry-run --files vocab-a2.json > output-vocab-a2.txt
norskeord git:(fix/no-english-posts) ✗ node scripts/normalise-norsk-field.mjs --dry-run --files vocab-c.json > output-vocab-c.txt
```
Please check /output-vocab-a1.txt and /output-vocab-c.txt.
All the data files are in the src/lib/data directory.
