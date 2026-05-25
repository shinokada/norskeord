# Email Reminder Notifications

## Feature

A daily study reminder sent by email to Plus users who have the toggle enabled, if they have not studied that day. Complements the existing Web Push reminder (Phase E in `daily-streaks-push-notifications.md`). Email reaches users on iOS without the PWA installed, users who have denied browser notification permission, and lapsed users who haven't opened the app in a while.

This is **not** the lesson email service from Phase 5 (`email-service.md`). That is a curated Norwegian lesson delivered bi-weekly. This is a single short transactional nudge: _"You have 8 cards due today."_

---

## Design Decisions

| Question            | Decision                                                             |
| ------------------- | -------------------------------------------------------------------- |
| Who can enable it?  | Plus users only — stored in `profiles.email_reminder`                |
| Send time           | 19:00 UTC (same as push — they share the same Edge Function trigger) |
| Condition           | Only sent if no `study_days` row exists for today for that user      |
| Subject line        | `"Your Norwegian cards are waiting 🇳🇴"`                               |
| Body copy           | `"{n} cards due today — keep your momentum going."` with CTA to app  |
| Unsubscribe         | One-click signed URL — legally required (GDPR/CAN-SPAM)              |
| Email provider      | Resend — already planned for Phase 5, introduce it here first        |
| Toggle location     | `SubscriptionSection.svelte`, beneath the existing push toggle       |
| Free users          | Toggle not shown; copy reads _"Email reminders are a Plus feature"_  |
| Combined with push? | Yes — a user can have both, either, or neither enabled               |

---

## Phases

### Phase A — Supabase: add `email_reminder` column to `profiles` ✅ Done

Add a single boolean column. No new table needed — reminder preference lives alongside `daily_reminder` (push) in `profiles`.

```sql
alter table profiles
  add column if not exists email_reminder boolean not null default false;
```

Migration file: `supabase/migrations/010_add_email_reminder.sql`

Update `current-schema.sql` to reflect the new column.

**Files:** `supabase/migrations/`, `supabase/current-schema.sql`

---

### Phase B — Server type: add `email_reminder` to `Profile` ✅ Done

Add the new field to the `Profile` type and the server profile loader so it flows through to the page.

**Files:** `src/lib/server/profile.ts`

Check the `updatePreferences` form action in `+page.server.ts` — if `email_reminder` is saved via a separate PATCH (like the push toggle), no form change is needed. If it goes through the preferences form, add it there.

---

### Phase C — UI toggle in `SubscriptionSection.svelte` ✅ Done

Add a second checkbox directly beneath the existing _Daily study reminder (push)_ toggle.

```
☐  Daily push reminder          (existing)
☐  Daily email reminder         (new)
```

Behaviour:

- Checked state reads from `profile.email_reminder`.
- Toggle fires a `PATCH /api/profile/email-reminder` endpoint (same pattern as the push toggle's `PATCH` to `daily_reminder`).
- No permission flow needed — email is always available, no browser API involved.
- Show a brief _"Saved"_ confirmation identical to the push toggle's loading/error pattern.
- For free users, render the email toggle as disabled with the copy `m.profile_sub_email_reminder_plus_only()`.

Add i18n keys to `messages/en.json` and `messages/nb.json`:

- `profile_sub_email_reminder` — `"Daily email reminder"`
- `profile_sub_email_reminder_hint` — `"Get an email at 7 pm if you haven't studied that day."`
- `profile_sub_email_reminder_plus_only` — `"Email reminders are a Plus feature."`

**Files:** `src/routes/my-profile/SubscriptionSection.svelte`, `messages/en.json`, `messages/nb.json`

---

### Phase D — API route: `PATCH /api/profile/email-reminder` ✅ Done

New endpoint that saves `email_reminder` to `profiles` for the authenticated user. Mirrors the existing push subscribe endpoint's auth guard and Plus check pattern.

```
src/routes/api/profile/email-reminder/+server.ts
```

Logic:

1. Require auth — return 401 if no session.
2. Require Plus — return 403 if `plan !== 'plus'`.
3. Accept `{ enabled: boolean }` JSON body.
4. Upsert `profiles.email_reminder = enabled` for `user_id`.
5. Return `{ ok: true }`.

**Files:** `src/routes/api/profile/email-reminder/+server.ts`

---

### Phase E — Resend setup ✅ Done

Install Resend (will also be used by the Phase 5 lesson email service, so this is the first-time setup).

```
pnpm add resend
```

Add to `.env`:

```
RESEND_API_KEY=re_...
EMAIL_FROM=norskeord@yourdomain.com
```

Domain verification in Resend dashboard: add DNS records for the sending domain (SPF, DKIM, DMARC). Required for deliverability — do this before testing sends.

**Files:** `.env`, `.env.example`

---

### Phase F — Supabase Edge Function: extend `send-push-reminders` ✅ Done

The existing `send-push-reminders` Edge Function already:

- Runs at 19:00 UTC via Supabase pg_cron.
- Queries `profiles` for `daily_reminder = true` + `push_subscription IS NOT NULL`.
- Checks no `study_days` row for today.
- Sends Web Push.

Extend this same function to also send emails, so the _"no study today"_ query runs only once. Rename the function conceptually to a _"send daily reminders"_ function (the file name can stay the same to avoid re-deploying the cron).

**New logic to add:**

```ts
// After the existing push send loop, add:

const { data: emailUsers } = await supabase
  .from('profiles')
  .select('id, email_reminder')
  // Also join auth.users to get the email address:
  // Use supabase admin client — auth.users is not accessible via normal RLS
  .eq('email_reminder', true);
// Exclude users who already studied today (same study_days anti-join as push)

for (const user of emailUsers) {
  const dueCount = await getDueCount(user.id); // reuse existing helper
  await resend.emails.send({
    from: Deno.env.get('EMAIL_FROM'),
    to: user.email,
    subject: 'Your Norwegian cards are waiting 🇳🇴',
    html: buildReminderEmail(dueCount)
  });
}
```

Note on getting the user's email: `profiles` does not store email — it is in `auth.users`. Use the Supabase **service role** client (already available inside Edge Functions via `SUPABASE_SERVICE_ROLE_KEY`) to call `supabase.auth.admin.listUsers()` or join via a DB function. The cleaner option is a small Postgres function:

```sql
create or replace function get_email_reminder_users_due_today()
returns table(user_id uuid, email text) as $
  select p.id, u.email
  from profiles p
  join auth.users u on u.id = p.id
  where p.email_reminder = true
    and not exists (
      select 1 from study_days sd
      where sd.user_id = p.id
        and sd.day = current_date
    )
$ language sql security definer;
```

This keeps the Edge Function simple and avoids pulling all users into memory.

Email HTML: inline-CSS HTML, no external dependencies needed for a short transactional email. Keep it minimal — subject, one sentence, one button. A `buildReminderEmail(dueCount: number): string` helper in the Edge Function file is sufficient.

**Files:** `supabase/functions/send-push-reminders/index.ts`

---

### Phase G — Unsubscribe link ✅ Done

Required by GDPR and CAN-SPAM. Every reminder email must include a one-click unsubscribe link.

**Approach:** sign a JWT containing `{ user_id, action: 'unsubscribe_reminder' }` with `SUPABASE_JWT_SECRET`, embed as a query param in the email:

```
https://norskeord.com/api/unsubscribe?token=<signed-jwt>
```

New endpoint `src/routes/api/unsubscribe/+server.ts`:

1. Verify the JWT.
2. Set `profiles.email_reminder = false` for the `user_id`.
3. Return a plain HTML confirmation page: _"You've been unsubscribed from daily email reminders."_

No auth session required — the signed token is the credential.

**Files:** `src/routes/api/unsubscribe/+server.ts`

---

## Implementation Order

| Phase | Task                                                            | Effort |
| ----- | --------------------------------------------------------------- | ------ |
| A     | Add `email_reminder` column — migration + schema update         | 10 min |
| B     | Add `email_reminder` to `Profile` type + server loader          | 10 min |
| C     | UI toggle in `SubscriptionSection.svelte` + i18n strings        | 20 min |
| D     | `PATCH /api/profile/email-reminder` endpoint                    | 20 min |
| E     | Install Resend, add env vars, verify sending domain             | 30 min |
| D     | Unit test for the endpoint                                      | 15 min |
| F     | Extend `send-push-reminders` Edge Function + DB helper function | 45 min |
| G     | Unsubscribe endpoint + link in email                            | 20 min |

**Total: ~2.75 hours**

---

## Files Touched

```
supabase/migrations/010_add_email_reminder.sql   (Phase A — new)
supabase/current-schema.sql                              (Phase A — update)
src/lib/server/profile.ts                               (Phase B)
src/routes/my-profile/SubscriptionSection.svelte        (Phase C)
messages/en.json                                        (Phase C)
messages/nb.json                                        (Phase C)
src/routes/api/profile/email-reminder/+server.ts        (Phase D — new)
.env / .env.example                                     (Phase E)
supabase/functions/send-push-reminders/index.ts         (Phase F)
src/routes/api/unsubscribe/+server.ts                   (Phase G — new)
```

---

## Testing

### Unit test — `PATCH /api/profile/email-reminder` (Phase D)

Add `src/routes/api/profile/email-reminder/server.test.ts` using the same
vitest + Supabase mock pattern as `src/routes/plus/waitlist/server.test.ts`.

Cases to cover:

| Case                                                 | Expected           |
| ---------------------------------------------------- | ------------------ |
| No session (`locals.user` is null)                   | 401                |
| Authenticated but free plan                          | 403                |
| Body is not valid JSON                               | 400                |
| Body is missing `enabled` / `enabled` is not boolean | 400                |
| Valid `{ enabled: true }`, DB succeeds               | 200 `{ ok: true }` |
| Valid `{ enabled: false }`, DB succeeds              | 200 `{ ok: true }` |
| DB update returns an error                           | 500                |

**Effort:** ~15 min.

### E2e test — `SubscriptionSection` toggle (Phase C)

Skip for now. The existing e2e tests all cover public unauthenticated pages;
adding a proper authenticated Plus session fixture is out of scope for this
feature. Add a test when auth fixtures are introduced project-wide.

### Edge Function (Phase F)

No unit test. The Deno/Supabase Edge Function runtime is not testable in the
local Vitest setup without significant scaffolding. Manual curl testing (same
approach as the existing `send-push-reminders` curl in the doc) is sufficient.

---

## Relation to Phase 5 Email Service

This feature deliberately reuses the same infrastructure that Phase 5 will need:

- **Resend** installed here becomes the email provider for lesson emails too.
- The **`get_email_reminder_users_due_today` DB function** pattern can be replicated for fetching lesson subscribers.
- The **unsubscribe endpoint** can be extended with an `action` param to handle lesson-email unsubscribes as well.

Implementing email reminders now de-risks Phase 5 — you'll have Resend wired up, domain verified, and a working send/unsubscribe loop before tackling the more complex lesson pipeline.

## Manual test

There are three things to test independently:

---

**1. The UI toggle (Phase C)** ✅ Done

Open `/my-profile` as a Plus user, scroll to Notifications, and check the "Daily email reminder" checkbox. You should see "Saving…" briefly then "✓ Saved". Uncheck it and verify the same. If it shows an error, check the browser console — the `PATCH /api/profile/email-reminder` response will tell you what went wrong.

Verify it actually saved in Supabase Dashboard → Table Editor → `profiles` — find your row and confirm `email_reminder` flipped to `true`/`false`.

---

**2. The API endpoint (Phase D)**

You can test it directly with curl (replace the cookie with a real session token from your browser's DevTools → Application → Cookies → `sb-*`):

```bash
# Should return { "ok": true }
curl -X PATCH https://norskeord.no/api/profile/email-reminder \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-yyohrwgwoubvwjhwnaec-auth-token=<your-session-token>" \
  -d '{"enabled": true}'

# Should return 401
curl -X PATCH https://norskeord.no/api/profile/email-reminder \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

Or easier — just use the browser toggle and watch the Network tab in DevTools.

### Result from Network tab

```
Request URL
http://localhost:5173/api/profile/email-reminder
Request Method
PATCH
Status Code
200 OK
Remote Address
[::1]:5173
Referrer Policy
strict-origin-when-cross-origin
```

---

**3. The Edge Function (Phase F) — the actual email send**

First, make sure `email_reminder = true` is set for your user in the `profiles` table, and that you have **no** `study_days` row for today (so you're not excluded). You can delete today's row temporarily:

```sql
DELETE FROM study_days
WHERE user_id = '<your-user-id>'
  AND day = current_date;
```

Then trigger the function manually with curl — same as you already do for push:

```bash
curl -L -X POST 'https://yyohrwgwoubvwjhwnaec.supabase.co/functions/v1/send-push-reminders' \
  -H 'Authorization: Bearer <PUBLIC_SUPABASE_PUBLISHABLE_KEY>' \
  -H 'apikey: <PUBLIC_SUPABASE_PUBLISHABLE_KEY>' \
  -H 'Content-Type: application/json' \
  --data '{}'
```

A successful response now looks like:

```json
{
  "ok": true,
  "push_sent": 1,
  "push_failed": 0,
  "email_sent": 1,
  "email_failed": 0,
  "skipped": 0,
  "stale_cleaned": 0
}
```

Check your inbox. If `email_sent` is 1 but no email arrives, check the Resend dashboard → Logs for delivery status.

### Result ✅ Done

**Issue 1 — JWT error:** The first attempt returned `
Check https://supabase.com/dashboard/project/yyohrwgwoubvwjhwnaec/functions/send-push-reminders/details if `Verify JWT with legacy secret` is off.
{"code":"UNAUTHORIZED_INVALID_JWT_FORMAT","message":"Invalid JWT"}` because the function was configured to verify JWTs using the legacy secret, but the publishable key is not a user JWT. Fixed by disabling **"Verify JWT with legacy secret"** in the Supabase Dashboard → Functions → send-push-reminders → Details.

**Issue 2 — Wrong `EMAIL_FROM` secret:** After fixing the JWT, the response was `email_sent:0, email_failed:1`. The Edge Function log showed:

```
[send-reminders] email failed for user=...: The gmail.com domain is not verified.
Please, add and verify your domain on https://resend.com/domains
```

The `EMAIL_FROM` secret in Supabase had been set to a Gmail address. Fixed by re-setting it to match `.env` exactly:

```
EMAIL_FROM=Norskeord <no-reply@norskeord.no>
```

Note: you do **not** need a real inbox at `no-reply@norskeord.no` — Resend only requires DNS verification that you control the domain. Add the SPF/DKIM records Resend provides at [resend.com/domains](https://resend.com/domains).

**Final result:**

```
norskeord git:(feat/email-notification) ✗ curl -L -X POST 'https://yyohrwgwoubvwjhwnaec.supabase.co/functions/v1/send-push-reminders' \
  -H 'Authorization: Bearer sb_publishable_xxxxx' \
  -H 'apikey: sb_publishable_xxxxx' \
  -H 'Content-Type: application/json' \
  --data '{"name":"Functions"}'
{"ok":true,"push_sent":1,"push_failed":0,"email_sent":1,"email_failed":0,"skipped":0,"stale_cleaned":0}%
```

## Email confirmed delivered to inbox. ✅

**4. The unsubscribe link (Phase G)**

Once you receive the test email, click the "Unsubscribe" link at the bottom. It should open a plain HTML page saying "You have been unsubscribed" and set `profiles.email_reminder = false` in the DB — verify in Table Editor.

You can also construct the URL manually to test without receiving an email. Run this in a SvelteKit server context or Node REPL to generate a valid token:

```ts
import { createHmac } from 'crypto';
const token = createHmac('sha256', '<your-UNSUBSCRIBE_SECRET>')
  .update('<your-user-id>')
  .digest('hex');
console.log(
  `https://norskeord.no/api/email/unsubscribe?uid=<your-user-id>&token=${token}&action=reminder`
);
```

Then open that URL in a browser and verify the confirmation page appears and `email_reminder` is set to `false`.

---

**Don't forget to deploy the Edge Function first** — none of step 3 will work until you run:

```bash
npx supabase functions deploy send-push-reminders
```

This is done:

```
norskeord git:(feat/email-notification) ✗ npx supabase functions deploy send-push-reminders
Need to install the following packages:
supabase@2.101.0
Ok to proceed? (y) y

WARNING: Docker is not running
Uploading asset (send-push-reminders): supabase/functions/send-push-reminders/index.ts
Deployed Functions on project yyohrwgwoubvwjhwnaec: send-push-reminders
You can inspect your deployment in the Dashboard: https://supabase.com/dashboard/project/yyohrwgwoubvwjhwnaec/functions
➜  norskeord git:(feat/email-notification)
```
