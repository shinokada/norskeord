# Cloud Data Persistence — Supabase-primary for Plus users

## Goal

Replace the dual-source (localStorage + Supabase) architecture for Plus users with
Supabase as the single source of truth. Guest and free users continue to use
localStorage exactly as today.

## Motivation

The current design treats localStorage as the primary store and Supabase as a
background sync target. This causes:

- **Reset inconsistency**: resetting on device A wipes Supabase but device B still
  has localStorage, and the next `syncProgressOnLogin` re-uploads stale data,
  undoing the reset.
- **Merge complexity**: `syncProgressOnLogin` has a "local wins" merge strategy that
  is hard to reason about and will only grow more complex over time.
- **Two sources of truth**: any discrepancy between localStorage and Supabase is
  silently resolved in favour of local, which is not always correct.

Plus users must be online to log in anyway, so the offline-first justification for
localStorage does not apply to them.

## Architecture after this change

| User type        | Progress storage  | Notes                            |
| ---------------- | ----------------- | -------------------------------- |
| Guest            | localStorage only | No change                        |
| Free (logged in) | localStorage only | No change                        |
| Plus             | Supabase only     | localStorage not read or written |

## Files to change

### `src/lib/progress.ts`

**Remove / retire** (Plus users no longer need these):

- `syncProgressOnLogin` — entire function deleted
- `clearAnonymousProgress` — no longer needed post-login
- `lsPrefix` — still needed for guest/free users; keep but simplify comments
- `loadProgressMap` — keep for guest/free; Plus path reads from Supabase instead
- `saveProgress` — for Plus users, write directly to Supabase and return updated
  map from the Supabase response; skip localStorage entirely
- `pushRowToSupabase` — merge into `saveProgress` for Plus path; no longer fire-and-forget
- `clearUserProgress` — still called on logout for free users; keep

**Add**:

- `loadProgressMapFromSupabase(userId): Promise<Record<string, CardProgress>>` —
  fetches all `card_progress` rows for the user, returns the same shape as
  `loadProgressMap`. Called on mount in flashcard, quiz, and stats pages for Plus users.
- `saveProgressToSupabase(userId, entry, rating, progressMap): Promise<Record<string, CardProgress>>` —
  upserts a single row, returns the updated map. Used in `saveProgress` for Plus path.

**Modify**:

- `saveProgress` — branch on `userId`:
  - Plus (`userId` present): call `saveProgressToSupabase`, skip localStorage
  - Guest/free (`userId` null): existing localStorage path unchanged
- `resetProgressInSupabase` — already correct; no change needed

### `src/lib/VocabFlashcardPage.svelte`

**`onMount`**:

- Current: `progressMap = loadProgressMap(page.data.user?.id ?? null)`
- New:
  ```ts
  if (isPlus && userId) {
    progressMap = await loadProgressMapFromSupabase(userId);
  } else {
    progressMap = loadProgressMap(null); // guest/free: localStorage
  }
  ```

**`rate()` function**:

- Current: `progressMap = saveProgress(entry, rating, progressMap, userId)`
- New: same call signature — `saveProgress` handles the branch internally.
  The function must become `async` to await the Supabase write for Plus users.
  Use optimistic update: update `progressMap` locally first, then await Supabase.

**`undo()` function**:

- Current: writes directly to localStorage to restore previous progress.
- New: for Plus users, call `saveProgressToSupabase` (or delete the row if
  `previousProgress` was null). Keep localStorage path for guest/free.

### `src/routes/quiz/+page.svelte`

**`onMount`**:

- Same pattern as VocabFlashcardPage: branch on `isPlus` to load from Supabase
  vs localStorage.

**`submitAnswer()` function**:

- Same pattern: `saveProgress` call unchanged; the branch is internal to `progress.ts`.

### `src/routes/stats/+page.svelte`

**`onMount`**:

- Current: `progressMap = loadProgressMap()` (localStorage)
- New: branch on `isPlus`:
  ```ts
  if (isPlus && userId) {
    progressMap = await loadProgressMapFromSupabase(userId);
  } else {
    progressMap = loadProgressMap(null);
  }
  ```
- Activity chart for Plus users already reads from `study_days` via Supabase — no change.

**`handleReset`**:

- `clearLocalProgress()` helper can be simplified: for Plus users it is a no-op
  (nothing in localStorage to clear). Just call `resetProgressInSupabase(userId)`.
- For guest/free users the existing localStorage clear is unchanged.

### `src/routes/auth/` (login callback)

- Remove the call to `syncProgressOnLogin` — no longer needed.
- Remove the call to `clearAnonymousProgress` — no longer needed.

> Check the exact file: likely `src/routes/auth/callback/+page.svelte` or similar.

## Supabase schema — no migration needed

The `card_progress` and `study_days` tables are already correct. No new columns
or tables are required.

RLS policies must allow SELECT, INSERT, UPDATE, DELETE where `user_id = auth.uid()`.
Verify these exist before implementing — a missing DELETE policy will silently fail
on reset (already flagged in a previous session).

## Implementation order

1. **`progress.ts`** — add `loadProgressMapFromSupabase`, modify `saveProgress`,
   remove `syncProgressOnLogin` and `clearAnonymousProgress`.
2. **`VocabFlashcardPage.svelte`** — swap `onMount` load + make `rate()` async.
3. **`quiz/+page.svelte`** — same pattern as flashcard.
4. **`stats/+page.svelte`** — swap `onMount` load + simplify `handleReset`.
5. **Auth callback** — remove `syncProgressOnLogin` call.
6. **Manual reset** — as the only Plus user, manually clear your own localStorage
   (`progress-<uuid>-*` keys) and Supabase `card_progress` rows after deploy,
   then start fresh with the new architecture.
7. **E2e tests** — update any tests that rely on `progress-*` localStorage keys
   for Plus users; they should instead mock/intercept Supabase calls or use a
   guest flow for localStorage assertions.

## What can be deleted after this change

- `syncProgressOnLogin` (entire function)
- `clearAnonymousProgress` (entire function)
- `pushRowToSupabase` (merged into `saveProgress`)
- The `lsPrefix` user-namespacing logic — guest/free users always use the bare
  `progress-` prefix; Plus users never touch localStorage. The UUID-namespaced
  key format (`progress-<uuid>-<norsk>`) becomes unused.

## Checkpoint tracking

- [x] Step 1: `progress.ts` updated
- [x] Step 2: `VocabFlashcardPage.svelte` updated
- [x] Step 3: `quiz/+page.svelte` updated
- [x] Step 4: `stats/+page.svelte` updated
- [x] Step 5: auth callback updated
- [x] Step 6: manual data reset done
- [ ] Step 7: e2e tests updated

## Free → Plus migration

On first Plus login, `auth/sync/+page.svelte` checks whether Supabase has zero
rows for the user. If so, it calls `migrateLocalProgressToSupabase`, which bulk-
upserts all `progress-*` localStorage keys into `card_progress` and then clears
localStorage. This runs once per device and is skipped on all subsequent logins
(Supabase will already have rows). If the upsert fails, localStorage is left
intact so the migration retries on the next login.

## How to delete data

Let me also check the schema to make sure I reference the right column names.Now I have everything I need. Here's how to do Step 6:

---

## Step 6: Manual Data Reset

### 1. Clear Supabase rows (SQL Editor)

Run these two statements in your Supabase project's **SQL Editor** one at a time (or together). They're scoped to your own user ID via `auth.uid()` so they won't touch any other user's data:

```sql
-- Clear all card progress for your account
DELETE FROM card_progress
WHERE user_id = auth.uid();

-- Clear all study day records for your account
DELETE FROM study_days
WHERE user_id = auth.uid();
```

> Make sure you're logged in to the Supabase dashboard with the same account that owns the data, so `auth.uid()` resolves correctly. If you want to double-check before deleting, run a `SELECT` first:
>
> ```sql
> SELECT * FROM card_progress WHERE user_id = auth.uid();
> SELECT * FROM study_days   WHERE user_id = auth.uid();
> ```

---

### 2. Clear old localStorage keys (Browser DevTools)

Open your app in the browser, open DevTools → **Console**, and run:

```js
// Preview what will be removed
Object.keys(localStorage).filter((k) => k.startsWith('progress-'));
```

If the list looks right, delete them:

```js
Object.keys(localStorage)
  .filter((k) => k.startsWith('progress-'))
  .forEach((k) => localStorage.removeItem(k));
```

This cleans up any `progress-<norsk>` keys (guest/free format) and the old UUID-namespaced `progress-<uuid>-<norsk>` keys that the previous architecture wrote.

---

Once both are clear, reload the app and start rating cards as your Plus user — all writes will go straight to Supabase from a clean slate.

On your **Mac** (where the dev server runs), open Terminal and run:

```bash
ipconfig getifaddr en0
```

That prints your local Wi-Fi IP, e.g. `192.168.1.42`. Then access your app on mobile at `http://192.168.1.42:5173`.

`en0` is Wi-Fi on most Macs. If it returns nothing, try `en1` (sometimes Wi-Fi is on en1), or run this to see all interfaces at once:

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

That lists every active interface's IP — pick the one starting with `192.168.` or `10.`.

---

One extra thing: Vite by default only listens on `localhost`, so mobile devices can't reach it even with the right IP. Make sure your dev server is started with:

```bash
vite dev --host
```

Or add this to `vite.config.ts` so you don't have to remember the flag:

```ts
server: {
  host: true;
}
```
