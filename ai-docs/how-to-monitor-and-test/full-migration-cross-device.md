# Full Migration & Cross-Device Test

## Prerequisites

- Test user exists and is currently **free**
- Two separate browsers or browser profiles (A and B) to simulate two devices

---

## Phase 1 — Build free user progress on both "devices"

1. **Device A**: log in as the test user, study some cards, verify `progress-*` keys in DevTools → Application → Local Storage
2. **Device B**: log in as the same test user, study some **different** cards, verify different `progress-*` keys in localStorage

---

## Phase 2 — Upgrade to Plus (on Device A)

Flip the subscription in Supabase SQL Editor:

```sql
UPDATE subscriptions
SET plan = 'plus', status = 'active'
WHERE user_id = '<your-test-user-id>';
```

Then log out and back in on **Device A** to trigger `/auth/sync`.

**Verify Device A (migration branch):**

- Supabase: `SELECT * FROM card_progress WHERE user_id = '<id>'` → should have Device A's progress
- localStorage: all `progress-*` keys gone, settings keys (`vocab-flashcard-mode`, `locale`, etc.) still present

---

## Phase 3 — Log in on Device B

Log out and back in on **Device B** (still has its own stale `progress-*` keys in localStorage).

**Verify Device B (clear branch):**

- localStorage: all `progress-*` keys gone
- Supabase: unchanged — still only Device A's rows, nothing from Device B was merged or lost

---

## Phase 4 — Confirm Plus behaviour going forward

Study a new card on either device.

**Verify:**

- New row appears in `card_progress` in Supabase
- No new `progress-*` keys appear in localStorage on either device
