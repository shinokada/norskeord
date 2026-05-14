# Phase 3-A: Profile Page (`/my-profile`)

> **Route:** `/my-profile` (directory already exists at `src/routes/my-profile/`)
> **Depends on:** Phase 1-A (Supabase Auth) and Phase 2-B (Lemon Squeezy payment integration) for the Subscription section. Account and Preferences sections can be built independently.

---

## Goals

The profile page serves two purposes:

1. **Personal settings** — display preferences, target level, interface language
2. **Subscription status** — current plan, renewal date, billing management

Split into four sections: Account, Preferences, Subscription, Danger Zone.

---

## Files to create / modify

```
src/routes/my-profile/
  +page.svelte          ← replace stub; main page shell
  +page.server.ts       ← load user profile from Supabase; handle form actions
src/lib/server/
  profile.ts            ← server-side helpers (getProfile, updateProfile, deleteAccount)
src/lib/components/
  profile/
    AccountSection.svelte
    PreferencesSection.svelte
    SubscriptionSection.svelte
    DangerZone.svelte
```

---

## Database

Add a `profiles` table in Supabase (one row per user, keyed on `auth.users.id`):

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  target_level text check (target_level in ('A1','A2','B1','B2','C1','C2')) default 'B1',
  ui_language text check (ui_language in ('en','nb')) default 'en',
  card_direction text check (card_direction in ('no_en','en_no')) default 'no_en',
  include_phrases boolean default true,
  daily_reminder boolean default false,
  email_lesson boolean default false,
  -- Lemon Squeezy subscription fields (written by webhook, read-only from client)
  ls_customer_id text,
  ls_subscription_id text,
  ls_status text,          -- 'active' | 'paused' | 'cancelled' | 'expired' | null
  ls_renews_at timestamptz,
  ls_ends_at timestamptz,
  updated_at timestamptz default now()
);

-- RLS: users can only read/update their own row
alter table profiles enable row level security;
create policy "own profile" on profiles
  for all using (auth.uid() = id);
```

The `ls_*` fields are written only by the Lemon Squeezy webhook handler (a Supabase Edge Function), never directly by the client.

---

## Section: Account

Fields:

- **Display name** — free text, max 40 chars
- **Email** — read-only (managed by Supabase Auth; link to "Change email" magic-link flow if needed later)
- **Avatar** — upload to Supabase Storage bucket `avatars`; fallback to initials rendered in CSS

Implementation notes:

- Use SvelteKit `form actions` (`?/updateAccount`) for the save; no client-side fetch needed.
- Avatar upload: POST to `/api/avatar` which pipes to Supabase Storage and returns the public URL, then saves it to `profiles.avatar_url`.
- Keep avatar upload as a future task if storage setup is out of scope for the initial milestone.

---

## Section: Preferences

Fields:

- **Target CEFR level** — dropdown A1–B2 (drives pace forecast on `/stats`)
- **Interface language** — toggle English / Norsk Bokmål (moves this out of Nav; saves to `profiles.ui_language` and also to `localStorage` for the Paraglide language switcher)
- **Card direction** — radio: Norwegian → English | English → Norwegian
- **Include phrases** — checkbox (words only vs. words + phrases)

Implementation notes:

- All four fields save via `?/updatePreferences` form action.
- When `ui_language` changes, after the server roundtrip redirect to the correct Paraglide URL prefix (`/` vs `/nb/my-profile`).

---

## Section: Subscription

Requires Lemon Squeezy integration (Phase 2-B) to be live. Build the UI shell before 2-B; gate the data behind a feature flag or show a placeholder until 2-B is complete.

**Free user view:**

```
Plan:   Free
        [Upgrade to Plus — 49 NOK/month →]
```

**Plus user view:**

```
Plan:   Plus
Renews: 14 June 2025
Card:   Visa ···· 4242

[Manage billing →]   (opens Lemon Squeezy customer portal)
```

**Cancelled / grace period view:**

```
Plan:   Plus (cancels 14 June 2025)
        Your Plus access continues until the end of the current period.

[Reactivate →]   [Manage billing →]
```

**Expired view:**

```
Plan:   Free (Plus expired)
        [Upgrade to Plus →]
```

Implementation notes:

- `ls_status`, `ls_renews_at`, `ls_ends_at` are loaded in `+page.server.ts` from the `profiles` row.
- The "Manage billing" URL is a **pre-signed Lemon Squeezy customer portal link**, fetched server-side on each page load (valid for 24 hours). Do not store it in the database. Fetch it via:
  ```
  GET https://api.lemonsqueezy.com/v1/subscriptions/{ls_subscription_id}
  → attributes.urls.customer_portal
  ```
  Pass this URL to the page as `data.billingPortalUrl`.
- Clicking "Manage billing" opens the portal in a new tab (or via Lemon.js overlay).
- **Plus-only notification toggles** (daily reminder, email lesson) appear in this section only when `ls_status === 'active'`. Show a locked state with "Available with Plus" for free users.

---

## Section: Danger Zone

- **Export my data** — download a JSON file of all card progress (reads from `card_progress` table, streams as a file download from `/api/export`)
- **Delete account** — two-step confirm dialog; calls `?/deleteAccount` action which:
  1. Cancels the Lemon Squeezy subscription if active (`PATCH /v1/subscriptions/{id}` with `cancelled: true`)
  2. Deletes the Supabase user (`supabase.auth.admin.deleteUser(userId)`)
  3. The `profiles` row is cascade-deleted via the FK

---

## `+page.server.ts` sketch

```typescript
import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { getProfile, updateProfile, deleteAccount } from '$lib/server/profile';
import { getLemonSqueezyPortalUrl } from '$lib/server/lemonsqueezy';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(302, '/auth/login');

  const profile = await getProfile(locals.user.id);
  const billingPortalUrl = profile?.ls_subscription_id
    ? await getLemonSqueezyPortalUrl(profile.ls_subscription_id)
    : null;

  return { profile, billingPortalUrl, user: locals.user, plan: locals.plan };
};

export const actions: Actions = {
  updateAccount: async ({ request, locals }) => {
    /* ... */
  },
  updatePreferences: async ({ request, locals }) => {
    /* ... */
  },
  deleteAccount: async ({ locals }) => {
    /* ... */
  }
};
```

---

## Navigation

Add `/my-profile` to the Nav authenticated state (already shows after login). Icon: `UserCircle` from `flowbite-svelte-icons`. Label: "Profile" (i18n key `nav_profile`).

---

## i18n keys to add

```
profile_account_section = "Account"
profile_preferences_section = "Preferences"
profile_subscription_section = "Subscription"
profile_danger_zone = "Danger Zone"
profile_display_name = "Display name"
profile_target_level = "Target level"
profile_card_direction = "Card direction"
profile_include_phrases = "Include phrases"
profile_save = "Save changes"
profile_plan_free = "Free"
profile_plan_plus = "Plus"
profile_renews = "Renews"
profile_manage_billing = "Manage billing"
profile_upgrade = "Upgrade to Plus"
profile_export_data = "Export my data"
profile_delete_account = "Delete account"
nav_profile = "Profile"
```

---

## Implementation order

1. **DB migration** — create `profiles` table + RLS in Supabase dashboard
2. **`src/lib/server/profile.ts`** — `getProfile` / `updateProfile` / `deleteAccount`
3. **`+page.server.ts`** — `load` + form actions (account + preferences first; subscription later)
4. **Page shell + AccountSection + PreferencesSection** — functional with form actions
5. **SubscriptionSection shell** — UI only, hardcode `plan: 'free'` until 2-B is live
6. **DangerZone** — export endpoint + delete action
7. **After Phase 2-B** — wire up `billingPortalUrl`, live `ls_status`, notification toggles
