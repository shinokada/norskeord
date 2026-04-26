You can access /Users/shinichiokada/Svelte/svelte-languages/norske-flashcard.

Please read ad-docs/monetization-focusd-plan.md and monetization-focusd-implementation.md.

- Daily new words should be in the homepage with flash-card.
- Focus on level A/B since C needs a lot more vocab. (See the table below)
- 1m, 6m, 10m, 8d for Again, Hard, Good, Easy. What does 1m, 6m etc. means?
Are they 1 min, 6 min, 10 min and 8 days? It should be more clear.
- /norskproven page doesn't have any value to me. It only has links to vocal list. How can I make the page more useful?
- How to use page for Undo, 1m, 6m, and more.
- /stats page has "All data is stored locally on this device." Shouldn't it be stored DB, otherwise cleaning cache delete data.
- Link protection for Plus member only pages
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




===== Solved =========
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