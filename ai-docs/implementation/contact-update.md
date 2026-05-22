# Contact Form Update — Open to Free Users

## What changed

The support contact form on `/my-profile` was previously gated to Plus users only.
It is now available to all logged-in users (free + plus).

## Files changed

### `supabase/migrations/008_contact_messages.sql` (new)
Creates `public.contact_messages` table to persist every message:
- `user_id`, `subject`, `message`, `app_version`
- `ip_address` — grabbed server-side from `x-forwarded-for` / `x-real-ip` (Vercel)
- `user_agent` — from `user-agent` header
- `created_at` — timestamp

RLS is enabled but no user-facing policies are added; inserts go via the service role.
Two indexes: `user_id` (for fast ban/audit) and `(ip_address, created_at)` (for burst detection).

### `supabase/current-schema.sql`
Added the `contact_messages` table definition to keep the context file in sync.

### `src/routes/my-profile/+page.server.ts` — `supportContact` action
- Removed `locals.plan !== 'plus'` guard.
- Added IP extraction: `x-forwarded-for` → `x-real-ip` → `null`.
- Added `user-agent` capture.
- Inserts a row into `contact_messages` via `supabaseAdmin` before sending email. DB failure is non-fatal (logs + continues).
- Email subject is now `[Free Support]` or `[Plus Support]` based on plan.
- Email body includes `Plan:` and `IP:` fields for triage.

### `src/routes/my-profile/ContactSupport.svelte`
- Accepts new `isPlus: boolean` prop.
- Label: **Priority support** (plus) / **Support** (free).
- Subtitle: **Get help directly from the developer** (plus) / **Send a message to the developer** (free).

### `src/routes/my-profile/+page.svelte`
- Imports `ContactSupport`.
- Renders `<ContactSupport isPlus={data.plan === 'plus'} />` for all logged-in users (between SubscriptionSection and DangerZone).

## GDPR note
IP addresses are personal data under GDPR. Collection is justified as **legitimate interest** (abuse prevention). Add a one-liner to your privacy policy:

> We collect your IP address and browser information when you submit a support message, solely for abuse prevention purposes.

## Run in Supabase
```sql
-- Run 008_contact_messages.sql in the Supabase SQL editor or via CLI:
supabase db push
```
