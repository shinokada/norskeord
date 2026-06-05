# Questions

I have added the path, /Users/shinichiokada/Svelte to Filesystem so you should be able to access /Users/shinichiokada/Svelte/svelte-languages/norskeord.

You can find db schema in supabase/current-schema.sql, current-functions.sql and current-cron-push-notification.sql. You can find all the db migration files in supabase/migrations directory.

---

---

- Grammtikk section for B2/C1
  This is different from Quiz.
  Quiz has one question by one question. For grammer questions, I'd like to show all the questions at once and user type or select answers.

- https://edition.cnn.com/2026/06/01/health/screens-in-school-education-tech-wellness
  Study after study [shows](https://www.sciencedirect.com/science/article/pii/S1747938X18300101?via%3Dihub) that students’ comprehension is better when they read printed material, rather than content on screens. Similarly, they comprehend more when they [write notes by hand](https://www.tandfonline.com/doi/abs/10.1080/02568543.2020.1781307) rather than typing them.
  Technology won't help you unless you engage yourself actively. Generally techonology has negative effect on learning unless engage yourself actively.
  I need to tell how to engage yourself really learning Norwegian using norskeord. Write on paper, listen and repeat, etc.

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
