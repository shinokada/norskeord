# Monetization-Focused Implementation Plan

This document translates the strategy in `monetization-focusd-plan.md` into concrete implementation steps, mapped to the existing codebase.

---

## Status Overview

| Phase | Description                                          | Status         |
| ----- | ---------------------------------------------------- | -------------- |
| 0     | Quick wins (FSRS, /stats, /norskproven, /plus, i18n) | ✅ Complete    |
| 1     | Supabase auth + progress sync                        | ✅ Complete    |
| 2-A–D | Full FSRS UX (session structure, intervals, undo)    | ✅ Complete    |
| 2-E   | FSRS personal weight optimisation (Edge Function)    | ✅ Complete    |
| 3     | Freemium gating + Lemon Squeezy payments             | ⬜ Not started |
| 4     | Growth features (profile, quiz, streaks, SEO)        | ⬜ Not started |
| 5     | Email service                                        | ⬜ Not started |

---

## Phase 0 — Quick Wins ✅ Complete

### 0-A: FSRS rating buttons ✅

Implemented in `src/lib/VocabFlashcardPage.svelte` and `src/lib/progress.ts`.

- Again / Hard / Good / Easy buttons appear after flipping
- Keyboard shortcuts: `1` Again, `2` Hard, `3` Good, `4` Easy
- Per-card FSRS state persisted to `localStorage` with key `progress-{norsk}`
- `FSRSRating` and `CardProgress` types defined in `src/lib/types.ts`

### 0-B: `/stats` route ✅

Implemented in `src/routes/stats/+page.svelte`.

- CEFR estimate hero stat ("You're solidly A2") derived from category coverage per level
- Summary cards: total seen, due today, in review, relearning
- Per-level stacked progress bars (Learning / Review / Relearning)
- Per-category breakdown table, sortable by most due or most new
- Reset all progress button with confirmation step

### 0-C: `/norskproven` route ✅

Implemented in `src/routes/norskproven/+page.svelte`.

- Curated A2 and B1 exam-essential category grids with exam relevance notes
- "What is Norskprøven" fact cards (who, target level, what it tests, registration)
- Study tips section
- CTA linking to `/stats`, A2 health-basic, and B1 work
- No auth required — fully public

### 0-D: `/plus` pricing page ✅

Implemented in `src/routes/plus/+page.svelte` and `src/routes/plus/waitlist/+server.ts`.

- Hero, email waitlist signup form with validation and loading state
- Free vs Plus comparison table
- Four Plus feature highlight cards
- "How smart review works" explainer section
- Waitlist POST endpoint inserts to Supabase `waitlist` table; unique violation handled silently
- `supabase/waitlist.sql` defines the table with open insert RLS

### 0-E: i18n via Paraglide ✅

Paraglide is fully wired up with `en` and `nb` (Norwegian Bokmål).

- Language switcher in `Nav.svelte` — toggles locale, persists to `localStorage`
- All UI strings in `Nav.svelte`, `VocabFlashcardPage.svelte`, `/stats`, `/plus`, `/norskproven`, and auth pages use `* as m from '$lib/paraglide/messages.js'`
- `src/hooks.server.ts` runs the Paraglide middleware to set `lang` and `dir` attributes

---

## Phase 1 — Supabase Auth + Progress Sync ✅ Complete

### 1-A: Supabase project setup ✅

- `@supabase/supabase-js` and `@supabase/ssr` installed
- `src/lib/supabase.ts` — browser-side client using `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `src/lib/server/supabase.ts` — server-side `createSupabaseServerClient(cookies)` factory
- `supabase/schema.sql` defines:
  - `card_progress` table mirroring all `ts-fsrs` `Card` fields plus `seen_count` and `last_seen`, with RLS scoped to `auth.uid() = user_id`
  - `subscriptions` table with `plan` (`free` | `pro`), `billing_interval`, and `valid_until` — populated by Lemon Squeezy webhooks in Phase 3

### 1-B: SvelteKit auth integration ✅

- `src/hooks.server.ts` — validates the Supabase JWT on every request, sets `locals.user` (User or null) and `locals.plan` (hardcoded `'free'` until Phase 3)
- `src/routes/+layout.server.ts` — passes `user` and `plan` down to all routes via `$page.data`
- Auth routes:
  - `src/routes/auth/login/+page.svelte` — magic link (OTP) flow with email validation
  - `src/routes/auth/callback/+server.ts` — exchanges the OTP code for a session, redirects to `/auth/sync`
  - `src/routes/auth/logout/+server.ts` — POST endpoint that signs the user out and redirects home
  - `src/routes/auth/sync/+page.svelte` — runs `syncProgressOnLogin` client-side after login, then redirects to `next`
- `Nav.svelte` shows email + Log out when authenticated, Log in when not

### 1-C: Progress sync on login ✅

Implemented in `src/lib/progress.ts` as `syncProgressOnLogin(userId)`.

- Upserts all `localStorage` entries to `card_progress` in Supabase (local wins on conflict)
- Pulls any remote rows not in `localStorage` and writes them locally (covers multi-device use)
- `saveProgress()` dual-writes: always writes to `localStorage` first, then fires-and-forgets to Supabase when a `userId` is available
- Called by `src/routes/auth/sync/+page.svelte` immediately after login

---

## Phase 2 — Full FSRS UX

### 2-A: ts-fsrs wiring ✅

`saveProgress()` in `src/lib/progress.ts` fully implements FSRS scheduling:

- Looks up or creates a `ts-fsrs` `Card` via `createEmptyCard()`
- Calls `fsrs.next(card, now, grade)` for the updated card state and due date
- Writes to `localStorage` and dual-writes to Supabase when logged in

### 2-B: Structured due session ✅

`VocabFlashcardPage.svelte` implements the full due-mode session:

- `deckMode` state: `'all'` (random shuffle) or `'due'` (structured session)
- **New card cap:** `NEW_CARD_SESSION_LIMIT = 15` per session; `sessionNewCardCount` tracked in state; cap notice shown in UI
- **Due deck order:** overdue cards first (shuffled), then new cards (shuffled, capped)
- **Requeue on Again:** in due mode, rating Again pushes a fresh copy of the card to the end of the deck via `requeueCard()`
- Deck mode persisted to `localStorage` as `vocab-flashcard-deck-mode`
- Due count badge shown in the counter row when cards are due

### 2-C: Interval preview before rating ✅

`previewIntervals()` in `src/lib/progress.ts` speculatively computes all four FSRS next-due intervals (pure math, no I/O). Called in `VocabFlashcardPage.svelte` when `showCardBack` becomes `true`. Intervals displayed as small labels beneath each rating button (e.g. `10m`, `2d`, `8d`).

### 2-D: Undo last rating ✅

- `UndoSnapshot` stores: `entry`, `previousProgress` (null if card was new), `previousMap`, `previousIndex`, `timer`, `countdown`
- After each rating, `startUndoTimer()` arms a 5-second countdown with `setInterval`
- Undo button shown in the counter row with live countdown; pressing it restores `progressMap` and `localStorage`, steps back to the rated card
- `clearUndo()` called on deck rebuild and when the next card is rated
- Keyboard shortcut: `Z`

### 2-E: FSRS personal weight optimisation

**Goal:** After ~1,000 reviews, a Supabase Edge Function runs `fsrs.optimizer` on the user's review history and stores personalised weights. Subsequent sessions initialise `new FSRS({ w: userWeights })`.

**Supabase schema addition needed:**

```sql
create table if not exists user_settings (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  fsrs_weights numeric[] default null,
  updated_at   timestamptz default now()
);
```

Add policies:

```sql
alter table user_settings enable row level security;

create policy "Users can read own settings"
  on user_settings for select
  using (auth.uid() = user_id);

create policy "Users can upsert own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on user_settings for update
  using (auth.uid() = user_id);
```

**Edge Function:** `supabase/functions/optimise-fsrs-weights/index.ts`

- Triggered when `saveProgress` detects `reps % 1000 === 0 && reps >= 1000`
- Pulls user's full review history from `card_progress`
- Runs `fsrs.optimizer` from `ts-fsrs`
- Upserts result to `user_settings.fsrs_weights`

**Optimisation schedule:**

| Reviews                    | Action                   |
| -------------------------- | ------------------------ |
| 0–999                      | Default FSRS weights     |
| 1,000                      | First optimisation       |
| Every +1,000 (up to 5,000) | Re-optimise              |
| 5,000+                     | Re-optimise every +5,000 |

---

## Phase 3 — Freemium Gating + Payments ⬜ - Completed

### 3-A: Feature flags by plan

`locals.plan` is already threaded through to `$page.data.plan` in every route. The `subscriptions` table is defined in `supabase/schema.sql`. The remaining work is:

1. **Read plan from Supabase** in `src/hooks.server.ts` — replace the hardcoded `'free'` with a lookup against the `subscriptions` table using the authenticated `user.id`.
2. **Gate FSRS features** in `VocabFlashcardPage.svelte` — hide the "Due" deck mode toggle and rating buttons for free users; show a focused upsell instead: _"FSRS scheduling is a Norskeord Plus feature."_ Link to `/plus`.
3. **Gate detailed stats** in `/stats` — the CEFR estimate is always free (it's the hook); the per-category breakdown and pace forecast are Plus-only.
4. **Gate progress sync** — free users use `localStorage` only; Plus users get the dual-write to Supabase.

Note: the `subscriptions` table uses `plan: 'free' | 'pro'` — this should be changed to `'free' | 'plus'` to match the updated branding before Phase 3 goes live.

### 3-B: Lemon Squeezy integration

**New files needed:**

- `src/routes/api/lemon/webhook/+server.ts` — receives `subscription_created`, `subscription_updated`, `subscription_cancelled` events; verifies signature; updates `subscriptions` table
- `src/routes/api/lemon/checkout/+server.ts` — creates a Lemon Squeezy checkout URL for the authenticated user and returns it
- `src/lib/server/lemonsqueezy.ts` — webhook signature verification helper

**Checkout flow:**

1. User clicks "Upgrade to Norskeord Plus" on `/plus`
2. Frontend calls `POST /api/lemon/checkout`
3. Server creates Lemon Squeezy checkout URL via their REST API and redirects
4. On payment, Lemon Squeezy fires webhook → `subscription_created` → server sets `plan = 'plus'` in `subscriptions`

### Phase 3-C: Change for plus member

## Please see 3c-change-for-plus.md for more detailed implementation. DONE

## Phase 4 — Growth Features ⬜ Not started

### 4-A: Profile page (`/profile`)

Four sections:

**Account**

- Display name and email (editable via Supabase Auth `updateUser`)
- Avatar (upload to Supabase Storage, or initials fallback)
- Target CEFR level selector (A1–B2) — persisted to `user_settings`, drives the pace forecast on `/stats`
- Interface language toggle (English / Norsk) — move here from Nav to reduce Nav clutter
- Flashcard display preferences (Norwegian→English or reverse; words or phrases) — currently in `localStorage` as `vocab-flashcard-mode` and `vocab-flashcard-card-type`; for Plus users, persist to `user_settings`

**Subscription**

- Current plan (Free / Plus Monthly / Plus Annual) with renewal date from `subscriptions.valid_until`
- Upgrade / manage billing button (Lemon Squeezy customer portal link)

**Notifications (Plus only)**

- Daily study reminder toggle (default: off) — PWA web push at 7 pm local time if no cards studied that day; framed as "8 cards due today", not a streak reminder
- Email lesson service toggle (default: off at signup)

**Danger zone**

- Export my data — JSON download of all `card_progress` rows for the user
- Delete account — calls Supabase Admin API to delete the user and cascades to all their data

### 4-B: Quiz mode

**New route:** `src/routes/quiz/+page.svelte`

Three sub-modes:

- Multiple choice (4 options, 1 correct) — needs a `getDistractors(entry, allEntries, n=3)` helper picking wrong answers from the same CEFR level
- Fill-in-the-blank (type the Norwegian word given the English)
- Type-the-answer (full translation)

Reuses `VocabEntry[]` from existing JSON data. Quiz ratings feed back into FSRS via `saveProgress()` just like flashcard mode. Quiz mode is a natural Plus feature gate.

### 4-C: Daily streaks + push notifications

- Add `streak` and `last_study_date` to a `user_stats` table in Supabase; increment when the user rates at least one card per calendar day
- Display streak count on `/stats` or in Nav
- Web push (PWA already set up): prompt for permission on day 2; send a reminder at 7 pm local time if the user hasn't studied that day
- Framed as "8 cards due today" — a real learning cue, not a streak to protect
- Toggle controlled from the Profile page (default: off)

### 4-D: SEO content pages

Beyond `/norskproven`, additional SSR pages targeting organic search:

- `/norwegian-a1-vocabulary` — renders vocabulary list from existing JSON data files, indexable by search engines
- `/norwegian-b1-vocabulary` — targets job interview and university prep searches
- `/learn-norwegian-online` — general landing page

These are `+page.server.ts` pages that pull from the existing CEFR JSON data — no new data work needed.

---

## Phase 5 — Email Service ⬜ Not started

Full design decisions are documented in [`ai-docs/email-service.md`](./email-service.md). Summary below.

### 5-A: Infrastructure

**Stack addition:** `pnpm add resend`

**Supabase schema additions:**

```sql
create table email_subscribers (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  level         text not null check (level in ('A1','A2','B1','B2','C1','C2')),
  subscribed_at timestamptz default now(),
  active        boolean default true
);

create table daily_lessons (
  id            uuid primary key default gen_random_uuid(),
  level         text not null,
  lesson_date   date not null,
  focus_topic   text not null,
  main_text     text not null,
  vocabulary    jsonb not null,   -- [{norsk, english, example}]
  exercises     jsonb not null,   -- [{type, prompt, answer}]
  unique (level, lesson_date)
);
```

**Supabase Edge Function** (`supabase/functions/send-daily-email/index.ts`):

- Triggered by `pg_cron` each weekday at 07:00 Oslo time
- Checks which levels are scheduled for that day of week
- Fetches the matching `daily_lessons` row
- Queries active `email_subscribers` for each applicable level
- Sends via Resend

**Send schedule:**
Only level A1-B2 and Friday only.

```ts
const SEND_DAYS: Record<string, number[]> = {
  // Fri only
  A1: [5],
  A2: [5],
  B1: [5],
  B2: [5]
};
```

### 5-B: Content generation

Lessons are pre-generated using the Claude API and stored in `daily_lessons` before the send date. Aim for 4–6 weeks banked per level before launch. Each lesson has one grammar/vocabulary focus, a 5–10 sentence realistic text, 5–8 vocabulary items with examples, and 1–3 micro-exercises. Human review before publishing is strongly recommended.

### 5-C: `/daily/[level]/[date]` exercise route

**New route:** `src/routes/daily/[level]/[date]/+page.svelte`

Exercises are links to this page rather than embedded in the email. Shows the day's text, vocabulary, and interactive exercises with audio via `SpeakButton`. Requires auth — Plus users only.

### 5-D: Level-change screen update

When a user changes their CEFR level in the Profile page, the confirmation screen must state the new send schedule:

> _"You've moved to B1. You'll now receive emails Monday through Friday."_

No separate notification email is sent.

---

## Implementation Order Summary

| Step  | Task                                                        | Status | Effort  |
| ----- | ----------------------------------------------------------- | ------ | ------- |
| 0-A   | FSRS rating buttons                                         | ✅     | —       |
| 0-B   | `/stats` with CEFR estimate                                 | ✅     | —       |
| 0-C   | `/norskproven` route                                        | ✅     | —       |
| 0-D   | `/plus` pricing + waitlist                                  | ✅     | —       |
| 0-E   | i18n via Paraglide (en + nb)                                | ✅     | —       |
| 1-A/B | Supabase auth + server hooks                                | ✅     | —       |
| 1-C   | localStorage → Supabase sync                                | ✅     | —       |
| 2-A   | ts-fsrs full wiring                                         | ✅     | —       |
| 2-B   | Due session: new cap + requeue                              | ✅     | —       |
| 2-C   | Rating preview (interval display)                           | ✅     | —       |
| 2-D   | Undo last rating                                            | ✅     | —       |
| 2-E   | FSRS weight optimisation (Edge Function)                    | ✅     | —       |
| 3-A   | Feature gating (read plan from Supabase, gate FSRS + stats) | ⬜     | 3h      |
| 3-B   | Lemon Squeezy payments                                      | ⬜     | 1 day   |
| 4-A   | Profile page                                                | ⬜     | 1 day   |
| 4-B   | Quiz mode                                                   | ⬜     | 2 days  |
| 4-C   | Daily streaks + push                                        | ⬜     | 1 day   |
| 4-D   | SEO content pages                                           | ⬜     | 2–3h    |
| 5-A   | Email service (Resend + pg_cron)                            | ⬜     | 2 days  |
| 5-B   | Daily lesson content generation                             | ⬜     | ongoing |
| 5-C   | `/daily/[level]/[date]` exercise page                       | ⬜     | 1 day   |

---

## Files Reference

### Completed files

```
src/lib/types.ts                                (FSRSRating, CardProgress)
src/lib/progress.ts                             (saveProgress, loadProgressMap, syncProgressOnLogin, previewIntervals)
src/lib/supabase.ts                             (browser Supabase client)
src/lib/server/supabase.ts                      (server Supabase client factory)
src/lib/VocabFlashcardPage.svelte               (rating buttons, due session, interval preview, undo)
src/hooks.server.ts                             (auth validation + Paraglide middleware)
src/routes/+layout.server.ts                    (passes user + plan to all routes)
src/routes/auth/login/+page.svelte              (magic link flow)
src/routes/auth/callback/+server.ts             (OTP exchange → /auth/sync)
src/routes/auth/logout/+server.ts               (sign out)
src/routes/auth/sync/+page.svelte               (runs syncProgressOnLogin, redirects)
src/routes/stats/+page.svelte                   (CEFR estimate, level/category breakdown)
src/routes/norskproven/+page.svelte             (exam prep landing page)
src/routes/plus/+page.svelte                    (pricing page + waitlist)
src/routes/plus/waitlist/+server.ts             (waitlist POST endpoint)
src/routes/components/Nav.svelte                (auth state, language switcher)
supabase/schema.sql                             (card_progress, subscriptions)
supabase/waitlist.sql                           (waitlist table)
messages/en.json                                (all UI strings)
messages/nb.json                                (Norwegian Bokmål translations)
```

### Files to create

```
supabase/functions/optimise-fsrs-weights/       (Phase 2-E)
src/routes/api/lemon/webhook/+server.ts         (Phase 3-B)
src/routes/api/lemon/checkout/+server.ts        (Phase 3-B)
src/lib/server/lemonsqueezy.ts                  (Phase 3-B)
src/routes/profile/+page.svelte                 (Phase 4-A)
src/routes/quiz/+page.svelte                    (Phase 4-B)
src/routes/daily/[level]/[date]/+page.svelte    (Phase 5-C)
supabase/functions/send-daily-email/index.ts    (Phase 5-A)
```

### Files to modify (upcoming phases)

```
src/hooks.server.ts                             (Phase 3-A: read plan from subscriptions table)
src/lib/VocabFlashcardPage.svelte               (Phase 3-A: gate due mode + rating buttons)
src/routes/stats/+page.svelte                   (Phase 3-A: gate per-category detail)
supabase/schema.sql                             (Phase 2-E: user_settings; Phase 5: email tables)
```

NorskordNorskordNorskordNorskordNorskordNorskordNorskordNorskeordNorskeordNorskeordNorskeordNorskeordNorskeordNorskeord
