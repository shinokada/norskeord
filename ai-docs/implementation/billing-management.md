# Annual Subscription Plan — Implementation Plan

## Overview

Add a **NOK 490/year** annual plan alongside the existing NOK 49/month plan.
The i18n key `plus_checkout_cta_annual` already exists in `en.json` with
"Upgrade to Plus — 399 NOK/year" — this will need updating to 490 NOK once the
price is confirmed in LemonSqueezy.

The work breaks into five areas: LemonSqueezy setup, environment variables,
checkout API, UI (plus page + profile page), and i18n.

---

## Step 1 — LemonSqueezy: add an annual variant ✅ Done

In the LS dashboard, open the existing **Norskeord Plus** product and add a
second variant:

- **Name:** Norskeord Plus — Annual
- **Billing interval:** Yearly
- **Price:** NOK 490
- **Variant ID:** note this down — you'll need it for the env var

No new product is needed. Both monthly and annual variants live under the same
product, so webhooks arrive at the same endpoint with the same shape. The only
difference is `attributes.billing_interval` will be `"year"` instead of
`"month"`.

---

## Step 2 — Environment variables ✅ Done

Add `LEMONSQUEEZY_VARIANT_ID_ANNUAL` alongside the existing
`LEMONSQUEEZY_VARIANT_ID` everywhere env vars live:

**`.env` (local)**

```
LEMONSQUEEZY_VARIANT_ID=<existing monthly variant id>
LEMONSQUEEZY_VARIANT_ID_ANNUAL=<new annual variant id>
```

**`.env.example`** — add the new key so it's documented:

```
LEMONSQUEEZY_VARIANT_ID=
LEMONSQUEEZY_VARIANT_ID_ANNUAL=
```

**Vercel** — Settings → Environment Variables → add
`LEMONSQUEEZY_VARIANT_ID_ANNUAL` for Production (and Preview).

---

## Step 3 — Checkout API (`/api/lemon/checkout/+server.ts`)

The checkout endpoint currently always uses `LEMONSQUEEZY_VARIANT_ID`. Extend
it to accept an optional `interval` body parameter and route to the correct
variant.

```ts
// src/routes/api/lemon/checkout/+server.ts

import {
  LEMONSQUEEZY_API_KEY,
  LEMONSQUEEZY_STORE_ID,
  LEMONSQUEEZY_VARIANT_ID,
  LEMONSQUEEZY_VARIANT_ID_ANNUAL // add this import
} from '$env/static/private';

export const POST: RequestHandler = async ({ request, locals, url }) => {
  if (!locals.user) return json({ error: 'login_required' }, { status: 401 });

  // Read optional interval from request body (default: 'month')
  let interval: 'month' | 'year' = 'month';
  try {
    const body = await request.json();
    if (body?.interval === 'year') interval = 'year';
  } catch {
    // no body or non-JSON — fall back to monthly
  }

  const variantId = interval === 'year' ? LEMONSQUEEZY_VARIANT_ID_ANNUAL : LEMONSQUEEZY_VARIANT_ID;

  // ... rest of the function unchanged, but use `variantId` variable
  // instead of the hardcoded LEMONSQUEEZY_VARIANT_ID in the relationships block
};
```

---

## Step 4 — Subscriptions table: store billing interval

The `subscriptions` table already has a `billing_interval` column (written by
the webhook). No schema change needed. The webhook handler already writes
`attrs.billing_interval` on `subscription_created` / `subscription_updated` /
`subscription_activated`. ✓

---

## Step 5 — Plus page (`/plus/+page.svelte`)

Replace the single hardcoded "49 NOK / month" block with a plan toggle that
lets the user pick Monthly or Annual before hitting checkout.

### Svelte state to add

```svelte
<script lang="ts">
  // ... existing imports and state ...

  let billingInterval = $state<'month' | 'year'>('month');

  async function handleCheckout() {
    checkoutError = '';
    checkoutLoading = true;
    try {
      const res = await fetch('/api/lemon/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interval: billingInterval })
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.error === 'login_required') {
          window.location.href = '/auth/login?next=/plus';
          return;
        }
        checkoutError = m.checkout_error_generic();
        return;
      }
      window.location.href = result.checkoutUrl;
    } catch {
      checkoutError = m.checkout_error_generic();
    } finally {
      checkoutLoading = false;
    }
  }
</script>
```

### Pricing block UI (replace the existing `<p>49 NOK / month</p>` block)

```svelte
<!-- Plan toggle -->
<div class="mb-5 inline-flex rounded-lg border border-indigo-200 dark:border-indigo-700 p-1">
  <button
    type="button"
    onclick={() => (billingInterval = 'month')}
    class={billingInterval === 'month'
      ? 'rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white'
      : 'px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}
  >
    Monthly
  </button>
  <button
    type="button"
    onclick={() => (billingInterval = 'year')}
    class={billingInterval === 'year'
      ? 'rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white'
      : 'px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}
  >
    Annual <span class="ml-1 text-xs font-medium text-green-600 dark:text-green-400"
      >2 months free</span
    >
  </button>
</div>

<!-- Price display -->
{#if billingInterval === 'month'}
  <p class="mb-1 text-2xl font-bold text-indigo-800 dark:text-indigo-200">49 NOK / month</p>
  <p class="mb-5 text-sm text-gray-500 dark:text-gray-400">Cancel any time.</p>
{:else}
  <p class="mb-1 text-2xl font-bold text-indigo-800 dark:text-indigo-200">
    490 NOK / year
    <span class="ml-2 text-base font-normal text-gray-400 line-through">588 NOK</span>
  </p>
  <p class="mb-5 text-sm text-gray-500 dark:text-gray-400">
    Equivalent to 40.8 NOK/month. Save 98 NOK.
  </p>
{/if}

<!-- CTA button — same for both, label switches -->
{#if data.isLoggedIn}
  <button
    type="button"
    onclick={handleCheckout}
    disabled={checkoutLoading}
    class="rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
  >
    {checkoutLoading
      ? m.plus_activating()
      : billingInterval === 'year'
        ? m.plus_checkout_cta_annual()
        : m.plus_checkout_cta()}
  </button>
{:else}
  <a href={loginHref} ...>
    {m.plus_sign_in_to_upgrade()}
  </a>
{/if}
```

---

## Step 6 — Profile page (`SubscriptionSection.svelte`)

Show the billing interval next to the plan label so Plus users can see whether
they're on monthly or annual. The `subscriptions.billing_interval` is already
written by the webhook, but it is not currently passed to the profile load.

### Load function change (`+page.server.ts`)

In the `load` function, also fetch `billing_interval` from the `subscriptions`
table and return it:

```ts
let billingInterval: string | null = null;
if (isPlus) {
  const { data: sub } = await locals.supabase
    .from('subscriptions')
    .select('lemon_squeezy_subscription_id, billing_interval') // add billing_interval
    .eq('user_id', locals.user.id)
    .maybeSingle();
  billingInterval = sub?.billing_interval ?? null;
  // ... existing portal URL fetch ...
}

return {
  profile,
  billingPortalUrl,
  billingInterval, // add this
  user: locals.user,
  plan: locals.plan
};
```

### Page component (`+page.svelte`)

Pass `billingInterval` down to `SubscriptionSection`:

```svelte
<SubscriptionSection
  profile={data.profile}
  plan={data.plan}
  billingPortalUrl={data.billingPortalUrl}
  billingInterval={data.billingInterval}
/>
```

### `SubscriptionSection.svelte`

Add `billingInterval` to props and display it:

```svelte
let {
  profile,
  plan,
  billingPortalUrl,
  billingInterval      // add
}: {
  ...
  billingInterval: string | null;
} = $props();

<!-- In the active Plus block, after the Plan: Plus line -->
{#if billingInterval === 'year'}
  <p class="text-sm text-gray-500 dark:text-gray-400">Billed annually</p>
{:else if billingInterval === 'month'}
  <p class="text-sm text-gray-500 dark:text-gray-400">Billed monthly</p>
{/if}
```

---

## Step 7 — i18n

### `messages/en.json`

Update `plus_checkout_cta_annual` to match the chosen price (currently says 399,
should be 490 once confirmed):

```json
"plus_checkout_cta_annual": "Upgrade to Plus — 490 NOK/year",
```

Add new keys for the billing interval display and toggle labels:

```json
"profile_sub_billed_monthly": "Billed monthly",
"profile_sub_billed_annually": "Billed annually",
"plus_plan_toggle_monthly": "Monthly",
"plus_plan_toggle_annual": "Annual",
"plus_plan_save_badge": "2 months free",
"plus_price_monthly": "49 NOK / month",
"plus_price_annual": "490 NOK / year",
"plus_price_annual_equiv": "Equivalent to 40.8 NOK/month. Save 98 NOK."
```

### `messages/nb.json`

Add corresponding Norwegian translations for all new keys above.

---

## Step 8 — `?checkout=1` auto-trigger on plus page

The plus page already auto-triggers checkout when redirected from login with
`?checkout=1`. This still works for monthly. If you later want to preserve the
annual intent through the login redirect, you can extend it to
`?checkout=1&interval=year` and read the param in `onMount`:

```svelte
onMount(() => {
  if (page.url.searchParams.get('checkout') === '1' && data.isLoggedIn && !data.isPlus) {
    const interval = page.url.searchParams.get('interval');
    if (interval === 'year') billingInterval = 'year';
    handleCheckout();
  }
});
```

And update `loginHref` to carry the interval:

```svelte
const loginHref = $derived.by(() => {
  const next = encodeURIComponent(`/plus?checkout=1&interval=${billingInterval}`);
  return `/auth/login?next=${next}`;
});
```

---

## Files Changed Summary

| File                                               | Change                                                      |
| -------------------------------------------------- | ----------------------------------------------------------- |
| `.env` / `.env.example`                            | Add `LEMONSQUEEZY_VARIANT_ID_ANNUAL`                        |
| `src/routes/api/lemon/checkout/+server.ts`         | Accept `interval` body param, route to correct variant ID   |
| `src/routes/plus/+page.svelte`                     | Monthly/annual toggle UI, pass `interval` to checkout fetch |
| `src/routes/my-profile/+page.server.ts`            | Fetch and return `billing_interval` from subscriptions      |
| `src/routes/my-profile/+page.svelte`               | Pass `billingInterval` prop to `SubscriptionSection`        |
| `src/routes/my-profile/SubscriptionSection.svelte` | Accept and display `billingInterval` prop                   |
| `messages/en.json`                                 | Update annual CTA price, add new i18n keys                  |
| `messages/nb.json`                                 | Add Norwegian translations for new keys                     |
| Vercel env vars                                    | Add `LEMONSQUEEZY_VARIANT_ID_ANNUAL`                        |

No database schema changes required.

---

## Suggested Implementation Order

1. Create the annual variant in LemonSqueezy and note the variant ID.
2. Add env vars locally and in Vercel.
3. Update the checkout API endpoint (Step 3) — self-contained, easy to test.
4. Update the plus page UI (Step 5) — visible immediately, no backend dependency.
5. Update the profile page to show billing interval (Steps 6).
6. Add i18n strings (Step 7) — do this alongside Steps 4–6.
7. Test the full flow end-to-end in a preview deployment before merging to main.
