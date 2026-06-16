# Account Info Onboarding

## Motivation

Collecting user profile information will help determine which language to add next to the app, and will allow for more personalised learning experiences in the future.

## Trigger & Flow

- **First login** → show full-screen onboarding slides
- **× clicked** → set `onboarding_snoozed_at = now()`, slide does not re-appear
- **After one week** (if key fields still empty) → red dot on avatar in the nav + highlighted missing fields on `/my-profile`; no more slide overlay
- **All fields completed** (via slide or `/my-profile`) → set `onboarding_done = true`, red dot disappears

Partial answers are saved as the user progresses through the slides, so even a partially completed flow gives useful data.

## Questions

1. **UI language + Display name** — Language selector (sets Paraglide locale for all subsequent slides) + What should we call you? (text input)
2. **First language / mother tongue** — (searchable dropdown, ISO 639-1 language list)
3. **Other languages you speak** — (multi-select, optional; cannot include the same language as #2)
4. **Norwegian level** — A1, A2, B1, B2, C (single select; maps to existing `target_level` field)
5. **What do you want to study?** — Select up to 3: Vocabulary, Grammar, Speaking, Listening, Writing
6. **Country** — Where do you live now? (searchable dropdown, optional; pre-filled from IP geolocation)

---

## Implementation Plan

### 1. Database migration ✅ Done

Add new columns to the `profiles` table:

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS native_language       text,
  ADD COLUMN IF NOT EXISTS other_languages       text[],
  ADD COLUMN IF NOT EXISTS country               text,
  ADD COLUMN IF NOT EXISTS study_goals           text[],
  ADD COLUMN IF NOT EXISTS onboarding_done       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_snoozed_at timestamp with time zone;
```

- `native_language` and `other_languages`: store ISO 639-1 codes (e.g. `'ja'`, `'en'`)
- `country`: ISO 3166-1 alpha-2 code (e.g. `'NO'`, `'JP'`)
- `study_goals`: array of values from `['vocab', 'grammar', 'speaking', 'listening', 'writing']`
- `onboarding_done`: set to `true` only when the user completes the final slide or fills all fields via `/my-profile`
- `onboarding_snoozed_at`: set to `now()` when the user closes via **×**; switches from slide mode to red dot nudge mode

Note: `display_name` and `target_level` already exist in `profiles`.

---

### 2. Trigger logic (in root layout or hooks) ✅ Done

In `src/routes/+layout.svelte` (or `+layout.server.ts`), after a user logs in:

- Show the slide overlay if `onboarding_done` is `false` AND `onboarding_snoozed_at` is null
- Show the red dot nudge if `onboarding_done` is `false` AND `onboarding_snoozed_at` is not null (regardless of how long ago)

---

### 3. Country pre-fill via IP geolocation ✅ Done

In `+layout.server.ts`, read the `x-vercel-ip-country` header that Vercel injects automatically on all plans:

```ts
const country = request.headers.get('x-vercel-ip-country') ?? null;
```

- Returns an ISO 3166-1 alpha-2 code (e.g. `'NO'`, `'JP'`)
- No external API call, no rate limits, no edge function involvement — zero cost
- Returns `null` in local development; default to no prefill in that case
- VPN users may get the wrong country — the dropdown must always remain editable
- Pass `country` to the client as part of the layout data and use it to pre-select slide 6

---

### 4. Component: `OnboardingSlides.svelte` ✅ Done

Location: `src/lib/components/OnboardingSlides.svelte`

- Full-screen overlay (`fixed inset-0 z-50`) with a backdrop; nav bar is hidden behind the overlay to prevent navigation away
- Slide-based navigation: **Back** and **Next** buttons only — no Skip button
- A subtle **×** close button in the top-right corner; closing sets `onboarding_snoozed_at = now()` and switches to red dot nudge mode
- Progress indicator (dots or `1 of 6` counter)
- On each Next, immediately `PATCH` the updated field(s) to the Supabase `profiles` row (partial saves)
- On final slide completion, set `onboarding_done = true`
- All slide copy (questions, button labels, progress text) uses `$lib/paraglide/messages.js` for i18n

Slide order:

1. UI language selector (sets Paraglide locale; all subsequent slides render in the chosen language) + display name input
2. Native language
3. Other languages (optional, multi-select)
4. Norwegian level
5. Study goals (multi-select, max 3)
6. Country (optional, pre-filled from `x-vercel-ip-country`)

---

### 5. Red dot nudge (post-snooze) ✅ Done

Once `onboarding_snoozed_at` is set, the slide never re-appears. Instead:

- Show a small red dot on the avatar/profile icon in the nav bar
- On `/my-profile`, show a "Complete your profile" banner and highlight each empty onboarding field with a subtle red label
- The red dot disappears once `onboarding_done = true`

---

### 6. API endpoint ✅ Done

`src/routes/api/profile/onboarding/+server.ts` — single `PATCH` handler shared by `OnboardingSlides.svelte` and `OnboardingFieldsSection.svelte`.

- Requires an authenticated session (`locals.user`); returns `401` otherwise
- Accepts a JSON body with any combination of: `display_name`, `native_language`, `other_languages`, `target_level`, `study_goals`, `country`, `onboarding_done`, `onboarding_snoozed_at` — only keys present in the body are written (partial updates)
- Validates malformed JSON / non-object bodies (`400`), `display_name` length, `target_level` against the A1–C enum, `study_goals` against the allowed set with a max of 3, array types for `other_languages` / `study_goals`, and `onboarding_snoozed_at` type (`422` on validation failure)
- Writes via `upsert` on `profiles` (`onConflict: 'id'`), so it also works on a brand-new row with no prior profile
- Returns `{ ok: true }` on success, `{ message: string }` with a 4xx/5xx status on error (matches the `body.message` the slide/section components read)

---

### 7. Tests e2e/unit tests

- `src/routes/api/profile/onboarding/server.test.ts` ✅ Done — unit tests for the `PATCH` endpoint (auth guard, malformed/invalid bodies, per-field validation and normalization, multi-field updates, DB error handling)
- Remaining: component/e2e coverage for the onboarding slide flow (`OnboardingSlides.svelte`), the red-dot nudge, and `OnboardingFieldsSection.svelte`

---

### Notes

- Speaking and Listening are data collection only — there are no plans to implement them as features. Display them as regular options in the study goals slide with no special labelling.
- The language dropdown should cover at least the ~30 most common world languages plus any language likely to appear in the user base. Full ISO list is not necessary.
- All fields except `display_name` and `target_level` should be treated as optional — never block access to the app based on incomplete onboarding.
- As more UI languages are added to Paraglide in the future, the language selector on slide 1 will automatically reflect them — no changes to the onboarding component needed.

## Issues
My thoughts on the reply below:
1. target_level is still confusing and should use a better naming.
2. FYI: The code is there but no longer email subscribers will be used. 
3. I don't need to separate but I don't want naming mismatch for future development.
4. I think the current slide 4 is good as it is. I just need to update the variable name and update /my-profile page Preferences title: Target level and subtitle: Used for pace forecasting on your progress page.
5. Since this is involve supabase DB, I need sql to update db.


Q: slide 4 of 6 has "What's your Norwegian level?". And I remember it is used for target_level. But the naming is misleading. Before implementing onboarding slides, there is a profile where you can select user's target level. That's why it used the target_level for slide as well. Now I question:

1. Is the naming appropriate?
2. What does this target_level is used for?
3. Should I separate target_level and current_level? If so, why?
4. etc.etc.
What are your thoughts about this?

Ans: Good question to pause on. Let me look at how `target_level` is actually used before giving you a concrete recommendation.Now let me check where `target_level` is actually consumed in the app logic:Now let me check one more place — how `target_level` feeds into the stats page and email subscribers:Good, now I have a complete picture. Here's my honest assessment:

**1. Is the naming appropriate?**

No, not for the onboarding context. `target_level` was named from the profile perspective — it means "the level you're *aiming* for" — but onboarding slide 4 asks "What's your Norwegian level?", which users naturally interpret as *where they are now*. So the data being collected and the field it's stored in are conceptually mismatched from day one.

**2. What is `target_level` actually used for?**

Looking at the code, it does three things:

- **Stats page**: `profile_prefs_target_level_hint` says "Used for pace forecasting on your progress page." But looking at `stats/+page.svelte`, it's not actually used there — the CEFR estimate is derived from actual card progress, not `target_level`. The hint is aspirational.
- **Email subscribers**: when you opt in to lesson emails, `toggleEmail` writes `profile.target_level` as the subscriber's `level` to `email_subscribers`. This is the most concrete usage.
- **Onboarding completion**: slide 7 uses `targetLevel` to generate the "Start at B1 →" CTA link. This is the most user-visible use.

So in practice `target_level` is used more as a *starting point / self-reported current level* than a genuine aspirational target — which is exactly the naming mismatch.

**3. Should you separate `target_level` and `current_level`?**

Probably yes, but the case for it depends on what you actually want to do with the data. Here's the honest breakdown:

**Argument for separating them:** A user at A2 who wants to reach B1 for Norskprøven has genuinely different values for these two fields. `current_level` would drive defaults (which deck to open, which email lesson level to send), while `target_level` would drive motivation features (pace forecasting on the stats page, a "you're X% of the way to your goal" widget). Right now you have one field trying to serve both roles and succeeding at neither cleanly.

**Argument against separating (yet):** The only real downstream consumer of the field today is email subscriber level, and for that purpose "level I said I'm at" and "level I want to reach" are nearly interchangeable — you'd want to send B1 lesson emails either way. Adding a second field adds DB migration cost, adds a column to the profile type, adds another onboarding slide question or profile preference, and doubles the chance of the two fields being inconsistent (user updates one, forgets the other).

**My recommendation:** Rename the *concept* without adding a field yet. The pragmatic middle path is:

- Rename the onboarding slide 4 question to **"What's your current Norwegian level?"** and update the message key accordingly. This makes the intent honest — you're collecting self-reported current level, not aspiration.
- Keep `target_level` as the DB column name for now (a rename migration is low-value churn).
- Add `current_level` as a separate field only if you build a feature that needs the distinction — e.g. a "your goal" progress tracker or level-gated content recommendations.

The biggest win is just fixing the onboarding slide copy so users aren't confused, without touching the schema at all. Would you like me to update the message keys for slide 4 to reflect "current level" language?