# Questions

I have added the path, /Users/shinichiokada/Svelte to Filesystem so you should be able to access /Users/shinichiokada/Svelte/svelte-languages/norskeord.

You can find db schema in supabase/current-schema.sql, current-functions.sql and current-cron-push-notification.sql. You can find all the db migration files in supabase/migrations directory.

The Filesystem tool can read it but str_replace can't find it. You need to read it fully and rewrite it. In this case, if the file is big and the rewrite is just adding lines or simple replacement, please output it with instruction or create a downloadable file or write Python or mjs script so that I can do it. Because your Write File operation has to rewrite whole file and it takes time to complete.

---

- For sidebar menu only, keeping links a1, a2, etc but menu title should be Nivå A1, etc and create A1, A2, B1, B2 svg icons using Svelte Awesome Icons.

- The review key becomes `id` instead of `level:norsk`, which is much cleaner. It also future-proofs things if you ever move FSRS progress for vocab to Supabase per-entry (currently it uses `norsk` as the key in `card_progress` — worth knowing).

One thing to be aware of: `card_progress` uses `norsk` as the lookup key, not an id. The vocab id would be a new field only for admin review tracking for now — it wouldn't replace `norsk` as the FSRS key without a migration.
Is it a good idea to migrate using `id` in `card_progress` as the lookup key? Any other place using `norsk`?

- Should I add id to vocab and uttrykk since most of norsk field have multiple words with norwegian characters, ø, æ, å. What do you think? If it is a good idea can you write a python or mjs script so that I can copy/paste/download and r
- Do I need to add new e2e/unit tests?

- I think from B1 or B2 there should be only norwegian. This means using norwegian definition and no english. What do you think? Which level is good to start using only Norwegian?
- domain names: norsknote.no, norskklasse.no, learnnorsk.no ($16.99), norsly.no ($16.99), norgeapp.no ($16.99), norskpath.no ($16.99), NorskVeien.no ($17.99), NorwegianPath ($17.99), NorwegianHub ($17.99), NorwegianClassroom ($17.99), Norskeproven.no ($17.99), KlarForNorsk.no, PassNorskeproven, NorskBee, EverydayNorsk,

norsksol, norskbie, norskugle, norskrev, norskhav, norskelg, norskmus, norskulv, norskravn

- How about Start free button rather than login?

- Grammtikk section for B2/C1
  This is different from Quiz.
  Quiz has one question by one question. For grammer questions, I'd like to show all the questions at once and user type or select answers.

- I also want to order src/lib/vocab-b2.json according to category field and merge vocab-b2-new.json to vocab-b2.json file according to category field.

## Solved

---

## Others

- The Undo button is too far from Again, Hard, Good, Easy buttons.

## QUIZ Open decisions

1. **Session size:** 10 is the default. Should this be configurable (5 / 10 / 20) in the idle/picker state? Probably yes once the feature is live. Leave hardcoded at 10 for the initial build.

2. **Quiz direction:** Fill-in-the-blank and type-the-answer always ask the user to produce Norwegian. Multiple choice could go either direction. The initial build does MC in Norwegian→English (easier, good warm-up). Reverse (English→Norwegian MC) can be a toggle later.

3. **Auto-advance on correct:** After a correct MC answer, auto-advance after 1.5 seconds (highlight green, show example briefly). On incorrect, stay on reveal until Next is tapped. This feels responsive without being jarring. Disable auto-advance if the user has tapped "Slow down" in Profile preferences (future).

4. **`easy` override:** After revealing a correct answer, show a small "Mark as easy" button to issue an `easy` rating instead of `good`. This is a one-tap override for words the user finds trivial. Worth including in the initial build.

5. **C1/C2 in distractor pool:** The current plan loads A1–B2 for the distractor pool. C1/C2 data is available but adds loading weight. Omit from the initial build; add later if B2+ quiz users request it.
