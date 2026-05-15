You can access /Users/shinichiokada/Svelte/svelte-languages/norskeord.

Please read ad-docs/monetization-focusd-plan.md and monetization-focusd-implementation.md.

- /plus page link in Plus member
- /plus card should have Quiz and Uttrykk?
- /plus Free vs Plus should have Quiz included for Plus member
- /plus Weekly email lesson for Plus member
- /about page should be guide?

- What does Stats: CEFR estimate + pace forecast Basic/Full in ai-docs/monetization-focusd-plan.md mean?
- In flashcard page, there is All cards/Review due button and "xxx due" badge. This should be removed and the daily new words should be in the homepage with flash-card picking up level from Profile page.
- 1m, 6m, 10m, 8d for Again, Hard, Good, Easy.
  They should be 1 min, 6 min, 10 min and 8 days to be more clear.
- The Undo button is too far from Again, Hard, Good, Easy buttons.

## QUIZ Open decisions

1. **Session size:** 10 is the default. Should this be configurable (5 / 10 / 20) in the idle/picker state? Probably yes once the feature is live. Leave hardcoded at 10 for the initial build.

2. **Quiz direction:** Fill-in-the-blank and type-the-answer always ask the user to produce Norwegian. Multiple choice could go either direction. The initial build does MC in Norwegian→English (easier, good warm-up). Reverse (English→Norwegian MC) can be a toggle later.

3. **Auto-advance on correct:** After a correct MC answer, auto-advance after 1.5 seconds (highlight green, show example briefly). On incorrect, stay on reveal until Next is tapped. This feels responsive without being jarring. Disable auto-advance if the user has tapped "Slow down" in Profile preferences (future).

4. **`easy` override:** After revealing a correct answer, show a small "Mark as easy" button to issue an `easy` rating instead of `good`. This is a one-tap override for words the user finds trivial. Worth including in the initial build.

5. **C1/C2 in distractor pool:** The current plan loads A1–B2 for the distractor pool. C1/C2 data is available but adds loading weight. Omit from the initial build; add later if B2+ quiz users request it.

===== Solved =========

1. Problem: After finishing a quiz and want to go back to Quiz home to select level and category require going to another page and click top nav Quiz. Clicking the top nav Quiz should go back to selection page.

Solution: The current ← Back to flashcards link goes to / which is wrong post-quiz — the user wants to pick a new quiz, not leave. The fix is two-pronged: in the summary add for "Level" / "Category(optional)" selects as in /quiz home and a button "Try again" and make the top nav Quiz link always reset state to idle when already on /quiz. The cleanest approach for the nav is to just ensure clicking Quiz while on /quiz resets state to 'idle' — we can do this by watching navigation or by exposing a goToIdle function and calling it via afterNavigate.

2. Problem: Quiz level should auto fill Preferences Target level.
   Solution: The profile target_level is already available server-side but the quiz +page.ts only reads URL params — it never consults the profile. The fix: pass target_level from the layout's profile load down to the quiz page, and use it as the default selectedLevel when no URL param is set. Since target_level is on the profile (not in +layout.server.ts), the cleanest way is to fetch it in the quiz's own +page.ts via parent() — but parent() only has plan and user. So we fetch the profile directly in +page.ts.
   However in the summary, the level should keep the same level as the selected level in the Quiz home page.

- When I answer multiple choice quiz, `Mark as easy` and when I hover an underline shows. Is it a link or button to mark as easy?
- Multiple choice shows anwer after answering a question. But to be consistent with other quiz, there shouldn't be any feedback. What do you think?
- When Card type is Phrase, noun/adjective etc is under the flashcard and Word . It should be hidden. And when it is visible, it should use i18n.
- Quiz is in the dropdown. Shouldn't it be in the top menu with a lock icon for non-plus-member?
- Move Voice Settings Speed and Tone to Profile page. Remove the modal from the page. Since there is only one voice, I don't need Voice selection.
- Since we have Preferences Interface languages, should we remove the navigation language button? If not, changing the language using this button should change the Preference as well.
- Plus member and logged in (registered) needs to be explained the differences in about page.
- /stats page has "Your Progress Progress is saved to this device. Sign in to sync across devices." Even I signed in (not plus member) it still has it.
- /stats page has "All data is stored locally on this device." Is this correct? Shouldn't it be stored DB, otherwise cleaning cache delete data.
- Focus on level A/B since C needs a lot more vocab. (See the table below)
- Currently each level has around 15 categories and each category contain 25 word. This means each level (A/B/C) has round 375 words. And I think this is not enough to master foreign language. Either increase words within categoies or add new categories. Which one is better? May be I can adopt both?
  Accouding to the table below, A1 needs 500 and we have only 375.

**How Many Words You Should Know (for Every Language Level)**

| Language Level | Number of Base Words Needed |
| -------------- | --------------------------- |
| A1             | 500                         |
| A2             | 1000                        |
| B1             | 2000                        |
| B2             | 4000                        |
| C1             | 8000                        |
| C2             | 16000                       |

| Language Level | Number of Categories | Number of Vocab in Category | Total | Goal |
| -------------- | -------------------- | --------------------------- | ----- | ---- |
| A1             | 20                   | 25                          | 500   | 500  |
| A2             | 20                   | 25                          | 500   | 500  |
| B1             | 30                   | 30                          | 900   | 1000 |
| B2             | 40                   | 50                          | 2000  | 2000 |
| C1             | 80                   | 50                          | 4000  | 4000 |
| C2             | 100                  | 80                          | 8000  | 8000 |

- daily email pages. Can it be dynamic rather than creating each page?
  URL like /daily/a/2026-04-23, /daily/b/2026-01-25, /daily/c/2026-02-27 will pick up data from DB and displayed. Do not show future pages. YES **SvelteKit route:** `src/routes/daily/[level]/[date]/+page.svelte` — one file, two params.
- The name of Plus sounds fit for this

==============

- Confirmation email has Supabase Auth <noreply@mail.app.supabase.io>.
- Dropdown for personal related items with avatar
- Explain again/hard/good/easy
  Again: I forgot this. Use when: you couldn’t recall it at all, or got it clearly wrong
  Hard: I barely remembered. Use when: you struggled a lot, hesitated, or were unsure.
  Good: I remembered correctly with normal effort. Use when: you got it right without major struggle.
  Easy: This was very easy / obvious. Use when: instant recall, no hesitation.
- Sentence cards (I already have), Expression cards (lei seg/sad (used with “å være”)), Minimal pairs (great for confusion) seinere vs senere, Pattern cards (Hvordan kan det ha seg at… / How can it be that…)

- 0-E: i18n via Paraglide in monetization-focusd-implementation.md

1. Error playwright test. Solved
2. Clicking a flag doesn't change languages. Solved
3. Use American flag for British flag. Solved
4. Add unit tests. Not worth

==============
