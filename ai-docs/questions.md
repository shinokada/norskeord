# Questions

I have added the path, /Users/shinichiokada/Svelte/svelte-languages/norskeord to Filesystem so you should be able to access.

Please read ad-docs/monetization-focusd-plan.md and monetization-focusd-implementation.md.

---

## SEO

- SSR on [level]/[category] pages — this is the biggest remaining item. export const ssr = false in +page.ts means Google gets a blank HTML shell for every deck page. Fixing it requires moving the vocab loading into a +page.server.ts so the HTML is pre-rendered. The gating logic needs care — locals.plan is only available server-side, which actually makes this cleaner. This is a meaningful refactor (~50 lines) and worth doing as a dedicated task.
- hreflang tags for en/nb — the layout already links to both locale variants in a hidden <div>, but proper <link rel="alternate" hreflang="..."> tags in <head> would be stronger for bilingual indexing.
- og:image — the layout references metaImg() but it's not clear what image is actually being served. If it resolves to nothing or a placeholder, social shares and Google's image preview will be blank. Worth auditing.

---

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

## Plus related

- Plus stats image for Free vs Plus

===========

## Others

- The Undo button is too far from Again, Hard, Good, Easy buttons.

## QUIZ Open decisions

1. **Session size:** 10 is the default. Should this be configurable (5 / 10 / 20) in the idle/picker state? Probably yes once the feature is live. Leave hardcoded at 10 for the initial build.

2. **Quiz direction:** Fill-in-the-blank and type-the-answer always ask the user to produce Norwegian. Multiple choice could go either direction. The initial build does MC in Norwegian→English (easier, good warm-up). Reverse (English→Norwegian MC) can be a toggle later.

3. **Auto-advance on correct:** After a correct MC answer, auto-advance after 1.5 seconds (highlight green, show example briefly). On incorrect, stay on reveal until Next is tapped. This feels responsive without being jarring. Disable auto-advance if the user has tapped "Slow down" in Profile preferences (future).

4. **`easy` override:** After revealing a correct answer, show a small "Mark as easy" button to issue an `easy` rating instead of `good`. This is a one-tap override for words the user finds trivial. Worth including in the initial build.

5. **C1/C2 in distractor pool:** The current plan loads A1–B2 for the distractor pool. C1/C2 data is available but adds loading weight. Omit from the initial build; add later if B2+ quiz users request it.

## Solved

- In flashcard page, there is All cards/Review due button and "xxx due" badge. This should be removed and the daily new words should be in the homepage with flash-card picking up level from Profile page. This is intetional.
- Adding CTA button for Free forever to the home page
- Add [Free forever to get started] button and link to login in the home page hero section.
- Free users and logged in has no plus button in the top nav as non-logged in user.
- Non-plus user has [xx due] next to the counter. But plus users don't have it. This is intentional.

- Since this app is forcused to A1-B2, I can open more categories for C1 and C2. (5-6 categories open for C1 and C2)
- /about page should be guide?
- CTA button for Free forever to log in page.
- QR code in home and other pages

###/guide FAQ section

1. How can I change the flashcard preferences?
   You can find Preference secion in your Pofile page to change Target level, default interface language, default card direction, card type, pronounciation speed and tone, number of cards per session, number of quations per quiz if you are plus users.

2. add Plus member section or add "If you are a plus user ..." in the answer and add a consice answer to the following question.

- How can I print out my progress?
  You can go to ...
- I have a question, how can I get in touch with you?
  You can find a form ...

### FAQ

### How rating works

Adding simplified following content to explain about the flow:

- New → you've never seen it
- Learning → you've seen it but haven't consolidated it yet (still in the initial learning steps)
- Memorized → FSRS moved it to Review state (you passed the learning steps)
- Forgotten → you rated "Again" on a card that was in Review — it drops back to Relearning

In practice, you won't see orange "Forgotten" bars until you've been using the app long enough that some previously-memorized cards come up for review and you press "Again" on them. Since your data only goes back to May 11, most cards are still in Learning/Review, so Forgotten is likely empty or very small right now. It will appear naturally over time as you review older cards.

From New (never seen):

- Any rating (Again/Hard/Good/Easy) → moves to Learning

From Learning (still consolidating):

- Again / Hard → stays in Learning, resets steps
- Good / Easy → graduates to Review (= "Memorized") once all learning steps are passed

From Review (memorized):

- Again → drops to Relearning (= "Forgotten") 🟠
- Hard / Good / Easy → stays in Review, interval gets longer or shorter depending on rating

From Relearning (forgotten):

- Again / Hard → stays in Relearning
- Good / Easy → graduates back to Review (memorized again)

So in short:
| Legend label | FSRS State | How you get there |
| ------------ | ---------- | -------------------------------------- |
| New | New | Never rated |
| Learning | Learning | Rated at least once, not yet graduated |
| Memorized | Review | Passed learning steps |
| Forgotten | Relearning | Hit "Again" on a memorized card |

The key insight is that only "Again" on a Review card triggers Forgotten. "Again" on a Learning card just keeps it in Learning — it doesn't turn orange.

### /plus

- Add daily streaks push notifications in Free vs Plus table

update content and table

- Norskprøven B1 full preparation is duplicate of Exam practice, not just vocabulary. So replace it with Category stats
- Free vs Plus table
  1. Add category stats and Free: - and Plus: Included
  2. Can you confirm Due today smart deck is only for plus user?
  3. Norskprøven B1 preparation row should be deleted since it is duplicate of Norskprøven practice tests and it is not accurate. We provide A1 and B1
  4. Regarding Priority support, I should add my email to plus user or add a form. Which is easier?
  5. email lesson for plus user but it should Coming soon

### Profile

- Export my data now export PDF

### email service

- postpone until we have enough plus members. So it should mention Coming soon.

### norskproven

For /norskproven/practice page

- shouldn't it norskproven be norskprove? https://prove.hkdir.no/ has https://prove.hkdir.no/norskprove-a1-b2
- all /norskproven/practice pages has no title. Shouldn't they have a title with i18n.
- norskproven/practice/1/oral/b1 or a1 have ` - trykk for å avsløre`. I don't think we need this since clicking doesn't work and there is Next question button at the bottom.
  And it can be good to show modal answer
- Oral page can have example answer like writing page after the given time or showing a button for model answer.
- "Spørsmål" in oral page is not clear. It can be more clear like "Svar på følgende spørsmål"
- Currently Quiz is in the main menu and it has a lock icon for free users. And when you logged in as a plus user you have practice test (/norskproven/practice) under More dropdown. I'm wondering add a new dropdown Prepare with Quiz and Practice tests and for free users link to /plus page and for plus members add actual links. What do you think?
- /plus email lesson for Plus member update for 2-3 times a month for level A/B and A1 and A2 has the same email, B1 and B2 has the same email to reduce manual work. Automate using AI as much as possible.
- Currently there is Plus button for un-logged in user. And this is hidden when you are a plus member. When a plus member want to see /plus page, you need to add /plus to URL. For a better UI, should we change the Plus button to a nav item?
- In the home page, I don't think I need Browse decks button.
- Use a card for each level in two columns
- In /quiz page Category doesn't include Uttrykk
- When I select a correct answer in a multiple question, there is "Mark as easy" button and when I click it nothing happens. It should have action feedback or response telling either Marked as easy / Done / Marked / etc using toast or alert from flowbite-svelte.
- In /quiz multiple choice answer has a phrase and Pronounce. But the Pronounce uses a word not the phrase and it is very confusing.
- In quiz Session complete page it has &#x2717; and &#x2713; like the following:

&#x2713; en anmeldelse — a review / critique
&#x2717; en skulptur — a sculpture

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
