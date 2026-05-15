# 4-D: Daily Streaks + Push Notifications

## Feature

Daily streak tracking — records which days a Plus user reviewed cards, and shows a 🔥 streak counter + a 12-week activity chart on the stats page (like GitHub's contribution graph).
Push reminder at 19:00 UTC — if a Plus user has enabled the toggle and hasn't studied that day, they get a browser/OS notification saying something like "8 cards due today — keep your streak going 🔥". Tapping it opens the app.

The notification goes through the browser's push service (Chrome, Firefox, Safari on supported platforms) — no email involved. The user has to explicitly grant notification permission, and the toggle is Plus-only.

## Design decisions

| Question                  | Decision                                                       |
| ------------------------- | -------------------------------------------------------------- |
| Activity chart visible to | All users (free + Plus) — retention hook                       |
| Streak counter visible to | All users                                                      |
| Push notification toggle  | Plus only — stored in `profiles.daily_reminder`                |
| Chart window              | 12 rolling weeks, Mon/Wed/Fri row layout (matches screenshot)  |
| Colour scale              | 0 / 1–5 / 6–15 / 16–30 / 30+ cards reviewed                    |
| Streak framing            | "🔥 12 days" — no punishment for gaps                          |
| Push message copy         | "8 cards due today" — a real learning cue, not streak pressure |
| Push trigger              | 19:00 local time if zero cards studied that day                |
| Permission prompt timing  | Day 2+ (user has already studied at least once)                |

---

## Phases

### Phase A — Supabase: `study_days` table ✅ Done

New table tracking one row per (user, calendar date). Incremented by `saveProgress`
when a Plus user rates a card. Free users' streaks are computed client-side from
`localStorage` only.

```sql
create table if not exists study_days (
  user_id   uuid references auth.users(id) on delete cascade not null,
  day       date not null,
  cards     int not null default 1,
  primary key (user_id, day)
);
alter table study_days enable row level security;
create policy "Users manage own study days"
  on study_days for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Also add `push_subscription jsonb` column to `profiles` table to store the
Web Push subscription object server-side (Plus only).

**Files:** `supabase/schema.sql`

---

### Phase B — `progress.ts`: streak helpers ✅ Done

Add two pure functions used by both the stats page and `saveProgress`:

- `getStreakFromLocalStorage(): number` — counts consecutive calendar days
  backwards from today using `localStorage` `progress-*` `lastSeen` values.
- `recordStudyDay(userId, date)` — upserts to `study_days` (Plus only,
  called fire-and-forget from `saveProgress`).
- `loadStudyDays(userId): Promise<Record<string, number>>` — fetches all
  `study_days` rows for the user; returns `{ 'YYYY-MM-DD': cardCount }`.
- `buildActivityGrid(studyDays, weeks=12)` — pure function that returns a
  12-week Mon/Wed/Fri grid of `{ date, count, level: 0|1|2|3|4 }` cells.

**Files:** `src/lib/progress.ts`

---

### Phase C — `ActivityChart.svelte` component ✅ Done

SVG-based 12-week rolling activity chart:

- Mon / Wed / Fri rows (3 rows × ~84 columns = 252 cells max)
- 5-level green colour scale matching Tailwind palette
- Tooltip on hover/tap showing date + card count
- Streak badge: `🔥 {n} days` shown above the chart
- Skeleton placeholder while data loads
- Works for free users (localStorage) and Plus users (Supabase)

**Files:** `src/lib/components/ActivityChart.svelte`

---

### Phase D — Stats page: embed chart ✅ Done

Add `ActivityChart` below the CEFR estimate card on `/stats`.
For free users: compute streak + grid from localStorage.
For Plus users: load from Supabase.

**Files:** `src/routes/stats/+page.svelte`

---

### Phase E — Push notifications (Plus only)

Three sub-steps:

**E-1: Service worker** (`src/service-worker.ts`) ✅ Done

- Handle `push` event: show notification with title "Norskeord" and
  body from the push payload (e.g. `"8 cards due today"`)
- Handle `notificationclick`: focus or open the app

**E-2: Client push helper** (`src/lib/push.ts`) ✅ Done

- `subscribeToPush(): Promise<PushSubscription | null>` — requests
  permission, creates a subscription via `serviceWorker.pushManager.subscribe`,
  sends the subscription JSON to `POST /api/push/subscribe`
- `unsubscribeFromPush()` — unsubscribes and calls `DELETE /api/push/subscribe`

**E-3: API routes** ✅ Done

- `src/routes/api/push/subscribe/+server.ts` — saves/deletes
  `push_subscription` in `profiles` (auth required, Plus only)

**E-4: Profile toggle** ✅ Done

- Wire up the existing disabled `daily_reminder` checkbox in
  `SubscriptionSection.svelte` to call `subscribeToPush` / `unsubscribeFromPush`
  and PATCH `profiles.daily_reminder`

**E-5: Supabase Edge Function** (`supabase/functions/send-push-reminders/index.ts`)

- Runs at 19:00 UTC (cron via Supabase scheduler or pg_cron)
- Queries users where `daily_reminder = true` and `push_subscription is not null`
  and no `study_days` row for today
- Sends Web Push via the `web-push` npm package using VAPID keys from env
- Body: `"{n} cards due today — keep your streak going 🔥"`

**Files:** `src/service-worker.ts`, `src/lib/push.ts`,
`src/routes/api/push/subscribe/+server.ts`,
`src/routes/my-profile/SubscriptionSection.svelte`,
`supabase/functions/send-push-reminders/index.ts`,
`vite.config.ts` (add VAPID public key to define)

---

## Implementation order

| Step      | Task                                                      | Effort |
| --------- | --------------------------------------------------------- | ------ |
| A         | `study_days` table + `push_subscription` column in schema | 15 min |
| B         | Streak helpers in `progress.ts`                           | 30 min |
| C         | `ActivityChart.svelte` component                          | 45 min |
| D         | Embed chart in `/stats`                                   | 15 min |
| E-1/2/3/4 | Push subscription plumbing                                | 45 min |
| E-5       | Edge Function for nightly push                            | 30 min |

---

## Files touched

```
supabase/schema.sql                                   (Phase A)
src/lib/progress.ts                                   (Phase B)
src/lib/components/ActivityChart.svelte               (Phase C — new)
src/routes/stats/+page.svelte                         (Phase D)
src/service-worker.ts                                 (Phase E-1 — new)
src/lib/push.ts                                       (Phase E-2 — new)
src/routes/api/push/subscribe/+server.ts              (Phase E-3 — new)
src/routes/my-profile/SubscriptionSection.svelte      (Phase E-4)
supabase/functions/send-push-reminders/index.ts       (Phase E-5 — new)
vite.config.ts                                        (Phase E — VAPID key)
messages/en.json                                      (streak + push strings)
messages/nb.json
```
