Q: I have added the path, /Users/shinichiokada/Svelte to Filesystem so you should be able to access /Users/shinichiokada/Svelte/svelte-languages/norskeord.

You can find db schema in supabase/current-schema.sql, current-functions.sql and current-cron-push-notification.sql. You can find all the db migration files in supabase/migrations directory.

This project started with flashcard however over the time, I added Quiz, Grammar, [Norskprøven](http://localhost:5173/norskproven) , blog and I feel the /guide is outdated.
Can you give some suggestions how to improve and update /guide page?

ANS:
Now let me look at the current routes to understand the full feature set:Good — now I have a clear picture. Here are my suggestions for improving the `/guide` page:

---

## What's currently there (and the problem)

The page is entirely flashcard-focused — FSRS scheduling, rating buttons (Again/Hard/Good/Easy), card states (New/Learning/Memorized/Forgotten), and FAQ items almost exclusively about flashcards and push notifications. Someone arriving at `/guide` after using Quiz, Grammar, or Norskprøven would find almost nothing relevant to their experience.

---

## Suggestions

**1. Restructure into feature sections, not just flashcard depth**

The page should become a proper "How to use Norskeord" guide covering all four main learning modes. Each section can be brief — users don't need full docs, just orientation:

- **Flashcards** — keep the existing FSRS/scheduling/rating content, it's good
- **Quiz** — explain the multiple-choice format, how categories are unlocked (free top 3, Plus full access), how to use it for level practice
- **Grammar** — explain the question types (fill-in-blank, word order, error-spot, etc.), how topics map to CEFR levels
- **Norskprøven** — explain what it is (exam prep), free vs Plus access (Practice Test 1 free, higher tests Plus-only), and who should use it (learners targeting A2/B1/B2 certification)

**2. Update the FAQ to match current reality**

The FAQ FAQ entry about Free vs Plus says: _"Plus unlocks all levels (B1–C2), smart Due today scheduling, cross-device sync, quiz mode, and lesson emails."_ — but Quiz is now partially free (top 3 categories per level). That claim is inaccurate and should be fixed. Similarly, there's no mention of Grammar or Norskprøven in the Free/Plus breakdown.

**3. Add a "Where to start" section at the top**

A short decision-tree or quick-start blurb helps new users orient before diving in. Something like:

> New to Norwegian? → Start with A1 flashcards  
> Preparing for Norskprøven? → Go to Norskprøven exam prep  
> Want to test what you know? → Try the Quiz

This is especially valuable since the app has grown and the homepage doesn't surface all features prominently.

**4. Update the meta description and FAQ schema**

The `description` in `+page.server.ts` still says _"the free Norwegian vocabulary app"_ — it's much more than that now. Same for the FAQ JSON-LD schema: it has 8 entries, none about Quiz, Grammar, or Norskprøven.

**5. Add a "Learning path by goal" section**

Since you've expanded to Spanish and Ukrainian too, a short section explaining flashcard language choice (what `flashcard_language` means vs the UI language) would reduce confusion for non-Norwegian users.

**6. Consider a tabbed or anchored layout**

Once you add sections for 4 features + FAQ, the page gets long. Simple anchor links at the top (`#flashcards`, `#quiz`, `#grammar`, `#norskproven`, `#faq`) would let users jump directly to what they need. This also improves the FAQ schema's utility for SEO (each section becomes independently linkable).

---

## Priority order

If you want to tackle this incrementally:

1. **Fix the inaccurate FAQ entry** (Free vs Plus, quiz access) — takes 5 minutes and fixes a trust issue
2. **Add Quiz + Grammar + Norskprøven sections** — the biggest gap
3. **Add "Where to start" intro** — high value for new users
4. **Update meta + FAQ schema** — SEO benefit
5. **Anchor nav** — polish

Want me to draft the updated page (Svelte + i18n keys), or would you prefer to start with just the new FAQ entries?

Q: Shouldn't it be fully i18n for Spanish and Ukrainian?
