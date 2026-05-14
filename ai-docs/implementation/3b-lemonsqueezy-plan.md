# Phase 3-B: Lemon Squeezy Integration - DONE

## Status: ⬜ Not started

---

## Pre-flight checklist

Before writing any code, confirm these values and add them to `.env`:

```
LEMONSQUEEZY_API_KEY=           # from LS dashboard → API → Personal access tokens
LEMONSQUEEZY_STORE_ID=          # from LS dashboard → Stores → your store ID
LEMONSQUEEZY_VARIANT_ID=        # from LS Products → your Plus product → variant ID
LEMONSQUEEZY_WEBHOOK_SECRET=    # set when creating the webhook in LS dashboard
```

Also needed in `.env`:

```
SUPABASE_SERVICE_ROLE_KEY=      # already set for Phase 1 — confirm it is there
```

---

## Schema fix required first

`supabase/schema.sql` has `plan check (plan in ('free', 'pro'))` but the app uses `'plus'`.
Fix before implementing webhooks:

```sql
-- Run in Supabase SQL editor (or add a migration file)
alter table subscriptions
  drop constraint subscriptions_plan_check;

alter table subscriptions
  add constraint subscriptions_plan_check
  check (plan in ('free', 'plus'));

-- Also add missing columns the webhook needs
alter table subscriptions
  add column if not exists lemon_squeezy_customer_id text,
  add column if not exists lemon_squeezy_subscription_id text,
  add column if not exists lemon_squeezy_order_id text,
  add column if not exists status text default 'inactive'
    check (status in ('active', 'cancelled', 'expired', 'inactive', 'past_due'));
```

Add a migration file: `supabase/migrations/003_subscriptions_plus.sql`

---

## Files to create

```
src/lib/server/lemonsqueezy.ts              — signature verification + shared types
src/routes/api/lemon/checkout/+server.ts    — creates checkout URL, redirects user
src/routes/api/lemon/webhook/+server.ts     — receives LS events, updates subscriptions
supabase/migrations/003_subscriptions_plus.sql
```

## Files to modify

```
src/routes/plus/+page.svelte                — replace waitlist form with real checkout CTA
src/routes/plus/+page.server.ts             — (create) pass checkout URL or logged-in state
messages/en.json                            — add 3-B i18n keys
messages/nb.json                            — Norwegian translations
```

---

## Implementation order

### Step 1 — `src/lib/server/lemonsqueezy.ts`

Shared helper. No external dependencies beyond `$env/static/private`.

```ts
// Verify the X-Signature header on incoming webhooks.
// LS signs with HMAC-SHA256 using the raw request body.
export async function verifyLemonSqueezyWebhook(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean>;

// Type for the webhook payload (only the fields we use)
export interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string; // e.g. 'subscription_created'
    custom_data?: { user_id?: string };
  };
  data: {
    id: string; // subscription_id
    attributes: {
      order_id: number;
      customer_id: number;
      variant_id: number;
      status: string; // 'active' | 'cancelled' | 'expired' | 'past_due' | 'on_trial'
      ends_at: string | null;
      billing_anchor: number;
      first_subscription_item: {
        billing_cycle_anchor: string;
      };
    };
  };
}
```

No API calls here — pure verification logic.

---

### Step 2 — `src/routes/api/lemon/checkout/+server.ts`

POST endpoint. Called from the `/plus` page when a logged-in user clicks "Upgrade".

**Request:** `POST /api/lemon/checkout` with JSON body `{ variantId?: string }`

**Response:** JSON `{ checkoutUrl: string }` or error

**Logic:**

1. Require auth — return 401 if `locals.user` is null with body `{ error: 'login_required' }` (client redirects to `/auth/login?next=/plus`)
2. Call Lemon Squeezy `POST /v1/checkouts` with:
   - `store_id`, `variant_id` from env
   - `checkout_data.custom.user_id = locals.user.id` — this is how the webhook knows which Supabase user to update
   - `checkout_data.email = locals.user.email` — pre-fills the LS checkout form
   - `product_options.redirect_url = '{origin}/plus/success'`
3. Return `{ checkoutUrl }` to the client
4. Client does `window.location.href = checkoutUrl` (or use LS overlay JS — see note below)

**Lemon Squeezy API call:**

```ts
const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${LEMONSQUEEZY_API_KEY}`,
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json'
  },
  body: JSON.stringify({
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          custom: { user_id: locals.user.id },
          email: locals.user.email
        },
        product_options: {
          redirect_url: `${origin}/plus/success`
        }
      },
      relationships: {
        store: { data: { type: 'stores', id: LEMONSQUEEZY_STORE_ID } },
        variant: { data: { type: 'variants', id: LEMONSQUEEZY_VARIANT_ID } }
      }
    }
  })
});
```

**Note on LS overlay vs redirect:**

- Overlay: add `<script src="https://app.lemonsqueezy.com/js/lemon.js"></script>` to layout, checkout URL gets class `lemonsqueezy-button` — no redirect, modal pops up inline. Nicer UX.
- Redirect: simpler, no extra script. Recommended for first pass.

Start with redirect. Overlay can be added in Phase 4.

---

### Step 3 — `src/routes/api/lemon/webhook/+server.ts`

The most critical file. Must be correct before going live.

**Endpoint:** `POST /api/lemon/webhook`
Register this URL in LS dashboard → Webhooks → Add webhook.
Select events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`.

**Logic:**

```
1. Read raw body as text (BEFORE parsing JSON — signature is over raw bytes)
2. Verify X-Signature header using verifyLemonSqueezyWebhook()
   → return 401 if invalid
3. Parse body as JSON → LemonSqueezyWebhookPayload
4. Extract user_id from meta.custom_data.user_id
   → return 400 if missing (misconfigured checkout)
5. Switch on meta.event_name:
   - subscription_created / subscription_updated / subscription_activated:
       upsert subscriptions row: plan='plus', status='active', billing_interval, valid_until, IDs
   - subscription_cancelled:
       update status='cancelled', keep plan='plus' until valid_until
       (user keeps Plus until period end — LS standard behaviour)
   - subscription_expired:
       update plan='free', status='expired', valid_until=null
   - subscription_paused / subscription_resumed: update status accordingly
6. Return 200 with empty body
```

**Use the Supabase service role client** (not the user client) — webhooks arrive without a user cookie:

```ts
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

**Idempotency:** Lemon Squeezy may retry webhooks. The `upsert` on `user_id` primary key is naturally idempotent for `subscription_created`. For `subscription_updated`, always overwrite — LS sends the full current state each time.

**`valid_until` mapping:**

- Monthly: `attributes.ends_at` is the current period end
- Annual: same field
- On cancellation: `ends_at` is when access should end — keep `plan='plus'` until then

**SvelteKit raw body note:**
SvelteKit parses the body automatically. To get raw bytes for signature verification, read `request.text()` before calling `request.json()` — or use a single `await request.text()` and `JSON.parse()` it yourself.

---

### Step 4 — `/plus/success` route

Simple SSR page shown after successful payment.

```
src/routes/plus/success/+page.svelte
src/routes/plus/success/+page.server.ts   — redirects to /stats if not logged in
```

Content:

- "You're now a Plus member 🎉" heading
- "Your Due Today deck is ready" body
- CTA: "Start studying →" → `/a1/greetings` (or user's last level)
- Note: "It may take a few seconds for your plan to activate."

The plan may not be `'plus'` yet when this page loads (webhook is async). Don't gate this page on `plan`. Just show a friendly confirmation.

---

### Step 5 — `/plus/+page.svelte` update

Replace the waitlist email form with a real checkout CTA once LS is wired up.

**Logged-in user:**

```
[Upgrade to Plus — €X/month]  ← calls POST /api/lemon/checkout
```

**Logged-out user:**

```
[Sign in to upgrade]  ← href="/auth/login?next=/plus"
```

**Already Plus:**

```
[Manage subscription]  ← href from LS customer portal API (Phase 4-A)
```

Keep the waitlist form visible below the CTA during the transition period so people who don't want to pay yet can still join the list.

Add a `+page.server.ts` to pass `isLoggedIn` and `isPlus` to the page:

```ts
export const load = ({ locals }) => ({
  isLoggedIn: locals.user !== null,
  isPlus: locals.plan === 'plus'
});
```

---

### Step 6 — i18n keys to add

`messages/en.json`:

```json
"plus_checkout_cta": "Upgrade to Plus — €{price}/month",
"plus_checkout_cta_annual": "Upgrade to Plus — €{price}/year",
"plus_manage_subscription": "Manage subscription →",
"plus_sign_in_to_upgrade": "Sign in to upgrade",
"plus_activating": "Activating your plan…",
"plus_success_heading": "You're now a Plus member 🎉",
"plus_success_body": "Your personalised Due Today deck is ready. It may take a few seconds to activate.",
"plus_success_cta": "Start studying →",
"checkout_error_generic": "Could not start checkout. Please try again.",
"checkout_error_login_required": "Please sign in to upgrade."
```

---

## Testing the webhook locally

1. Install Lemon Squeezy CLI or use ngrok to expose localhost
2. `ngrok http 5173` → copy the HTTPS URL
3. In LS dashboard → Webhooks → set URL to `https://<ngrok>/api/lemon/webhook`
4. Use LS "Send test event" for each event type
5. Verify the `subscriptions` table updates correctly in Supabase Studio

Alternatively, write a small script that POSTs a fake webhook payload with a valid HMAC signature to `localhost:5173/api/lemon/webhook` — faster for unit-testing the handler logic without ngrok.

---

## Error handling summary

| Scenario                           | Behaviour                                                 |
| ---------------------------------- | --------------------------------------------------------- |
| Webhook signature invalid          | Return 401, log warning                                   |
| `user_id` missing from custom_data | Return 400, log error (checkout was misconfigured)        |
| Supabase upsert fails              | Return 500, LS will retry                                 |
| Checkout API call fails            | Return 500 JSON `{ error }` to client                     |
| User not logged in at checkout     | Return 401 JSON `{ error: 'login_required' }`             |
| User already Plus                  | Checkout endpoint still works — LS handles duplicate subs |

---

## Sequence diagram

```
User (browser)          /plus page        /api/lemon/checkout      Lemon Squeezy         /api/lemon/webhook       Supabase
     │                      │                      │                      │                       │                   │
     │  click Upgrade        │                      │                      │                       │                   │
     │──────────────────────>│                      │                      │                       │                   │
     │                       │  POST /checkout      │                      │                       │                   │
     │                       │─────────────────────>│                      │                       │                   │
     │                       │                      │  POST /v1/checkouts  │                       │                   │
     │                       │                      │─────────────────────>│                       │                   │
     │                       │                      │  { checkoutUrl }     │                       │                   │
     │                       │                      │<─────────────────────│                       │                   │
     │                       │  { checkoutUrl }     │                      │                       │                   │
     │                       │<─────────────────────│                      │                       │                   │
     │  redirect to LS       │                      │                      │                       │                   │
     │<──────────────────────│                      │                      │                       │                   │
     │                                                                     │                       │                   │
     │  (user pays on LS checkout page)                                    │                       │                   │
     │                                                                     │                       │                   │
     │                                              subscription_created ──┼──────────────────────>│                   │
     │                                                                     │                       │  upsert plan=plus │
     │                                                                     │                       │──────────────────>│
     │                                                                     │                       │  200 OK           │
     │                                                                     │                       │<──────────────────│
     │  redirect to /plus/success                                          │                       │                   │
     │<────────────────────────────────────────────────────────────────────│                       │                   │
```

---

## Open decisions (resolve before coding)

1. **Monthly only or monthly + annual?** — annual needs two variant IDs and a billing_interval toggle on `/plus`
2. **Price point** — needs to be in i18n strings and on the page; 49 NOK/mo for small indie apps
3. **LS overlay vs redirect checkout** — overlay is nicer UX; redirect is simpler to implement first
4. **Waitlist form** — keep it during launch or remove once payments are live?
5. **Cancellation grace period display** — show "Your Plus access continues until {date}" banner when `status='cancelled'`?

---

## What to do in the next session

1. Confirm env vars are set (see pre-flight checklist)
2. Run the schema migration (`003_subscriptions_plus.sql`)
3. Implement in order: `lemonsqueezy.ts` → webhook handler → checkout endpoint → `/plus/success` → `/plus` page update
4. Test webhook locally with ngrok or a manual POST script
5. Update `monetization-focusd-implementation.md` status for 3-A (mark complete) and 3-B (mark in progress)
