---
title: FSRS update
data-started: 2026-08-17
data-completed: 2026-08-17
---

# FSRS Review Intensity — Implementation Plan

## Background

Flashcard "Hard"/"Good" ratings on new cards currently reappear in ~6–10 minutes because
`ts-fsrs`'s **short-term scheduler** is active by default for cards still in the `Learning`
state. That's fine for a single narrow deck, but this app lets users bounce across many
topics/categories in one sitting, so short-term re-queues from earlier topics pile up against
newer ones and the queue never seems to shrink.

Separately, once cards mature, the pileup complaint shifts from _minutes_ to _days_: FSRS's
default `request_retention` (0.9) schedules fairly frequent reviews, and there's currently no way
for a user to say "show me fewer, longer-spaced reviews" without hand-editing intervals (which
would fight FSRS's whole per-card design — see rejected alternative below).

## Bug found during investigation — `getFsrs()` is dead code

`src/lib/progress.ts` already defines `getFsrs(userId)`, which loads a user's optimised FSRS
`weights` from `user_settings.fsrs_weights` (written by the `optimise-fsrs-weights` Edge Function
after every 1000-review milestone) and builds a per-user `FSRS` instance. **Nothing calls it.**
`saveProgress`, `saveGrammarProgress`, and every `previewIntervals` call site all use the
module-level `DEFAULT_FSRS = new FSRS(generatorParameters())` instead. So the weight-optimisation
feature has never actually affected scheduling — it computes and stores weights that are never
read back into a live scheduling decision.

This plan fixes that as part of the same change, since the new `request_retention` setting would
have the identical problem if bolted onto the same unused code path.

## Rejected alternative: fixed per-rating day intervals

Original idea from the previous session: `Hard = 1 day`, `Good = 4 days`, `Easy = 30 days`,
hardcoded. Rejected — FSRS intervals are supposed to grow with a card's stability as it's
reviewed correctly more times; a card seen 8 times should schedule much further out than a card
seen twice. Fixed per-rating days throw that away and would just recreate the pileup once users
have thousands of mature cards, needing another round of re-tuning later.

## Design decisions

1. **Disable short-term scheduling globally**: `generatorParameters({ enable_short_term: false })`
   for every FSRS instance (default and per-user). This alone kills the minute-scale reappearance
   — a first-time "Hard" becomes roughly a day out, "Good"/"Easy" further, computed by FSRS.
2. **Expose `request_retention` as a 3-preset "review intensity" setting**, not a raw number —
   consistent with the app's existing `session_limit`/`quiz_limit` UX (discrete `SegmentedControl`
   choices, not a free slider).

   | Preset    | `request_retention`    | Effect                           |
   | --------- | ---------------------- | -------------------------------- |
   | Relaxed   | 0.80                   | Fewer reviews, longer gaps       |
   | Standard  | 0.90 (current default) | —                                |
   | Intensive | 0.95                   | More frequent, tighter retention |

3. **Store the setting on `profiles`, not `user_settings`.** `user_settings.fsrs_weights` is only
   ever written by the service-role Edge Function; there's no evidence client-side RLS permits an
   authenticated user to upsert their own `user_settings` row, and I can't inspect existing RLS
   policies from the repo (no `001`/`002` migration files, policies were set up via dashboard).
   `profiles`, by contrast, already has a proven working pattern for exactly this shape of setting
   (`session_limit`, `quiz_limit`: nullable int, `CHECK` against a discrete set, written through
   the existing `updatePreferences` form action). Reusing that path avoids introducing new RLS
   surface area.
4. **Fix the dead-code path**: `getFsrs()` will additionally read `profiles.fsrs_retention` (via a
   param, not a second DB query — the profile is already loaded by callers) and every scheduling
   call site will switch from `DEFAULT_FSRS` to the per-user instance.

## Schema changes

**Migration `023_fsrs_retention.sql`** — add to `profiles`:

```sql
alter table profiles
  add column if not exists fsrs_retention numeric
  check (fsrs_retention is null or fsrs_retention = any (array[0.80, 0.90, 0.95]));

comment on column profiles.fsrs_retention is
  'FSRS request_retention preset: 0.80 = Relaxed, 0.90 = Standard (default when null), '
  '0.95 = Intensive. Controls how far out reviews are scheduled — lower is fewer/longer-spaced.';
```

`null` means "use the default (0.90)", same convention as `session_limit`/`quiz_limit`.

## Code changes

### `src/lib/server/profile.ts`

- Add `fsrs_retention: number | null` to the `Profile` interface.
- Add `'fsrs_retention'` to the `ProfileUpdate` `Pick<...>` list.

### `src/routes/my-profile/+page.server.ts` (`updatePreferences` action)

- Parse `fsrs_retention` from the form (`'0.8' | '0.9' | '0.95' | 'default'` like the existing
  `quiz_limit` pattern), validate against `[0.8, 0.9, 0.95, null]`, include in `update`.

### `src/routes/my-profile/PreferencesSection.svelte`

- New `fsrsRetention` `$state`, seeded from `profile?.fsrs_retention`, default `'0.9'`.
- New `SegmentedControl` "Review intensity" (Relaxed / Standard / Intensive) next to the existing
  session/quiz limit controls, wired into `applyToLocalStorage`/`savePreferences`/the `$effect`
  autosave dependency list the same way the other fields are.
- Add a short hint string (new `m.profile_prefs_review_intensity_hint()` message) explaining the
  trade-off in one line.

### `src/lib/progress.ts`

- `DEFAULT_FSRS` keeps `enable_short_term: false` added to its `generatorParameters()` call.
- `getFsrs(userId, retention?)`: accept an optional `retention` param; build
  `generatorParameters({ enable_short_term: false, request_retention: retention ?? 0.9, ...(weights && { w: weights }) })`.
  Cache key stays `userId` (retention/weights are loaded together per session, cache invalidated
  the same way `invalidateFsrsCache` already works).
- `saveProgress(entry, rating, progressMap, userId, retention?)` and
  `saveGrammarProgress(question, rating, progressMap, userId, retention?)`: replace the hardcoded
  `DEFAULT_FSRS.next(...)` call with `(await getFsrs(userId, retention)).next(...)`.
- `previewIntervals(existing, now, fsrsInstance?)`: unchanged signature (already accepts an
  optional instance) — callers now need to actually pass one.

### Call sites that need the per-user instance threaded through

- `VocabFlashcardPage.svelte`: `rate()` needs the resolved retention preset (from
  `page.data` — extend the profile/layout load path the same way `showExample`/`sessionLimit`
  already surface profile fields) to pass into `saveProgress`; the `intervals = $derived.by(...)`
  block needs an `fsrsInstance` resolved once (e.g. via `onMount` + `getFsrs`) rather than
  recomputed on every preview.
- Grammar session component (equivalent flashcard component under `src/routes/grammar/`) — same
  two changes for `saveGrammarProgress` + its interval preview, mirroring the vocab path.
- `+layout.server.ts` (or wherever `showExample`/`sessionLimit` are currently exposed to
  `page.data`): add `fsrsRetention` alongside them, sourced from the same profile row.

## Testing

1. `progress.test.ts`: unit test `getFsrs` builds the right `generatorParameters` for each preset
   and for `null`/default; test that `enable_short_term: false` is always present regardless of
   preset.
2. `progress.test.ts`: test `saveProgress`/`saveGrammarProgress` call `getFsrs` with the passed
   retention (mock `getFsrs`, assert the instance's `.next` was invoked rather than
   `DEFAULT_FSRS`'s).
3. Manual pass: set Relaxed vs Intensive in `/my-profile`, rate a new card "Good" in the flashcard
   page, confirm the previewed/actual interval changes (days scale, not just short-term minutes)
   and that a brand-new card no longer reschedules to a same-session minute value under any
   preset.

## Implementation phases

### Phase 1 — Core scheduling fix (no new setting yet) ✅ Done

1. Added `enable_short_term: false` to `DEFAULT_FSRS`'s `generatorParameters()`, and to the
   per-user branch inside `getFsrs`.
2. `getFsrs` is now actually called: `saveProgress` and `saveGrammarProgress` both resolve
   `await getFsrs(userId)` instead of using the module-level `DEFAULT_FSRS` directly — this is
   also what makes the (previously dead) weight-optimisation feature live for the first time.
   No `retention` param added yet (Phase 2) — `getFsrs` still just returns default
   `request_retention: 0.9` via `generatorParameters()`'s own default.
3. `previewIntervals`'s existing `fsrsInstance?` param is now actually used: added a
   `fsrsInstance` `$state` in `VocabFlashcardPage.svelte`, resolved once via `getFsrs(...)` in
   `onMount`, and passed into the `intervals = $derived.by(...)` call. Grammar's
   `GrammarSession.svelte` doesn't render an interval preview, so no change needed there.
4. Tests updated in `progress.test.ts`: the old `'again' formats as minutes'` assertion no
   longer holds under `enable_short_term: false` (an all-default-weights "again" on a new card
   now schedules on a day/hour scale, not always <60min) — rewritten to assert a day-scale-or-
   shorter format instead of hardcoding minutes. Added a small `getFsrs` describe block
   (guest/no-userId path only — a real userId would hit the live Supabase client, which isn't
   mocked in this suite).

**Not run**: I don't have a way to execute `npm test`/`vitest` from here (no shell access to
this repo's tooling) — please run the suite locally to confirm before moving to Phase 2.

### Phase 2 — Review intensity setting ✅ Done

1. Migration `023_fsrs_retention.sql` — already present, matches plan exactly. `current-schema.sql`
   already reflects the new `fsrs_retention` column.
2. `profile.ts` — already had `fsrs_retention: number | null` on `Profile` and in the
   `ProfileUpdate` `Pick<...>` list.
3. `updatePreferences` action (`+page.server.ts`) — already parsed/validated `fsrs_retention`
   (`validRetentions = [0.8, 0.9, 0.95, null]`) and included it in the upsert.
4. `PreferencesSection.svelte` — already had the "Review intensity" `SegmentedControl`
   (Relaxed/Standard/Intensive), wired into the autosave `$effect` and `savePreferences()`
   FormData body. Locale messages (`profile_prefs_review_intensity*`) already present in all 5
   `messages/*.json` files.
5. **Newly wired this session** — items 1–4 above were already done in a previous session (not
   reflected in this doc); the remaining gap was that `fsrs_retention` was saved to the DB but
   never read back into scheduling decisions. Fixed:
   - `src/routes/+layout.server.ts`: added `fsrs_retention` to the profile `select(...)` and
     exposed it as `fsrsRetention` in the load return, alongside `sessionLimit`/`showExample`.
   - `src/lib/progress.ts`: `getFsrs(userId, retention?)` now accepts and applies the retention
     value (passed as `request_retention` to `generatorParameters`), with the in-memory cache
     keyed by `` `${userId}:${retention}` `` (previously just `userId`) so switching presets
     mid-session doesn't serve a stale instance. `invalidateFsrsCache` updated to sweep all
     cache entries for a user regardless of retention suffix. `saveProgress` and
     `saveGrammarProgress` both gained an optional `retention` param threaded straight into
     `getFsrs`.
   - `src/lib/VocabFlashcardPage.svelte`: added a `fsrsRetention` `$derived` from
     `page.data.fsrsRetention`; passed into the `onMount` `getFsrs(...)` call (so the interval
     preview reflects the user's preset) and into every `saveProgress(...)` call site
     (`rate()` and `undo()`).
   - `src/lib/components/grammar/GrammarSession.svelte`: imported `page` from `$app/state`,
     added the same `fsrsRetention` `$derived`, and passed it into the `saveGrammarProgress(...)`
     call in `submit()`.
6. `src/lib/progress.test.ts`: added a test confirming the guest (no-userId) path ignores the
   retention argument and always returns the shared `DEFAULT_FSRS` instance, matching the
   existing guest-path test style (no live Supabase call).

**Not run**: same limitation as Phase 1 — no shell access to this repo's `npm test`/`vitest`
from here. Please run the suite locally to confirm before considering this fully verified.

## Remaining manual verification

- End-to-end pass per the **Testing** section above: set Relaxed vs Intensive in `/my-profile`
  as a Plus user, rate a new card "Good" in the flashcard page, confirm the previewed/actual
  interval changes and that no card reschedules to a same-session minute value under any preset.
- Confirm the grammar session (`/grammar/[topic]`) also respects the preset — it has no on-screen
  interval preview, so this is only verifiable via the actual `due` timestamp written to
  `grammar_progress` (or by inspecting network calls / DB rows).

### Phase 3 — Initial-stability weight tuning ✅ Done (2026-08-17, follow-up)

**Problem**: with ts-fsrs's stock initial-stability weights, a brand-new card's first rating
under Standard (0.90) scheduled Hard=2d / Good=3d / Easy=8d — the Good→Easy jump (2.67x) felt
too aggressive; "Easy" disappeared from the deck disproportionately longer than "Good" did.

**Fix**: added `BASE_W` in `progress.ts` — a copy of ts-fsrs's default 19-value weight array
with only indices 1–3 (hard/good/easy initial stability) overridden to `3, 5, 8`. Index 0
("again") is left alone since it already floors at 1 day regardless of the weight value.
Verified against the actual ts-fsrs 5.4.1 package (installed in a scratch dir, not this repo)
by calling `fsrs.next()` on `createEmptyCard()` for all four ratings:

| Preset                     | Hard   | Good   | Easy   |
| -------------------------- | ------ | ------ | ------ |
| Relaxed (0.80)             | 10d    | 17d    | 27d    |
| **Standard (0.90 / null)** | **3d** | **5d** | **8d** |
| Intensive (0.95)           | 2d     | 3d     | 4d     |

Good→Easy ratio at Standard is now 1.6x instead of 2.67x. Relaxed/Intensive fall out
automatically from the existing `request_retention` scaling — no extra per-preset tuning
needed, confirming the answer to the "should Relaxed/Intensive scale from the new baseline"
question: yes, and no additional code was needed for it.

**Scope**: `BASE_W` only changes `DEFAULT_FSRS`'s and `getFsrs()`'s _initial_-stability weights
(a brand-new card's very first rating). It's used as the fallback whenever a user has no
personal optimised weights yet (`loadFsrsWeights` returns `null`) — once a user crosses the
1,000-review threshold and gets `user_settings.fsrs_weights` populated by the
`optimise-fsrs-weights` Edge Function, their own trained weights take over entirely (including
indices 1–3), same as before. Growth on subsequent reviews (stability/difficulty accumulated
from real ratings) is untouched — this is not the fixed-per-rating-days idea that was rejected
earlier; only the starting point moved.

**Data**: `card_progress` was truncated by the user before this change (no paid/Plus users had
accumulated review history yet), so no migration or backfill was needed.

**Not run**: same limitation as Phases 1–2 — verified the math with a standalone `ts-fsrs`
script, not by running this repo's test suite. Please run `npm test` locally to confirm nothing
else broke (e.g. `progress.test.ts`'s "interval ordering" and "formats days correctly for a
well-reviewed card" tests, which assert relative orderings rather than exact day counts, so
they should still pass, but worth confirming).

## Open questions

- Confirm `user_settings` RLS before ever considering moving `fsrs_retention` there instead of
  `profiles` — out of scope for this plan, noted here so it isn't silently assumed later.
