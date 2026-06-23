# Contact Page Implementation Plan

## Overview

Replace the buried contact form in `/my-profile` with a dedicated public `/contact` route that is easy to find via the top nav (Help dropdown), mobile sidebar, and footer. Spam is handled by Cloudflare Turnstile (already in the project) and a honeypot field — no login required.

Logged-in users get their email pre-filled and receive a "Priority support" label on the form. Logged-out users provide their own email in the form and get a standard response time.

---

## Architecture decisions

| Decision                  | Choice                                  | Rationale                                                             |
| ------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| Auth required?            | No                                      | Turnstile + honeypot is sufficient; login wall adds too much friction |
| Spam protection           | Turnstile + honeypot                    | Already used on login page; no new dependencies                       |
| Email pre-fill            | Yes, for logged-in users                | Convenience; server reads `locals.user`                               |
| Priority label            | Based on Plus plan                      | Mirrors current behaviour                                             |
| Server action             | `/contact` route's own `?/send` action  | Clean separation from my-profile                                      |
| DB storage                | Reuse existing `contact_messages` table | No migration needed                                                   |
| Remove from `/my-profile` | Yes                                     | Single source of truth                                                |
| i18n                      | Yes — all 4 locales (en, nb, es, uk)    | Consistent with the rest of the app                                   |
| Turnstile on `/contact`   | Yes, same pattern as login page         | Re-use existing `verifyTurnstileToken`                                |

---

## Step-by-step implementation

### Step 1 — Add i18n message keys

**Files:** `messages/en.json`, `messages/nb.json`, `messages/es.json`, `messages/uk.json`

Add the following keys to all four locale files (translated appropriately):

```
contact_page_title          "Contact"
contact_heading             "Contact support"
contact_subheading          "Send a message and we'll reply to your email."
contact_subheading_plus     "As a Plus member you get priority support — we'll reply within 1 business day."
contact_email_label         "Your email"
contact_email_placeholder   "your@email.com"
contact_subject_label       "Subject"
contact_subject_placeholder "Select a topic…"
contact_message_label       "Message"
contact_message_placeholder "Describe your issue or question…"
contact_submit              "Send message"
contact_sending             "Sending…"
contact_sent_heading        "Message sent!"
contact_sent_body           "We'll reply to {email} within 1–2 business days."
contact_sent_body_plus      "We'll reply to {email} within 1 business day."
contact_error_email         "Please enter a valid email address."
contact_error_subject       "Please select a subject."
contact_error_message       "Please enter a message (at least 10 characters)."
contact_error_generic       "Failed to send. Please try again."
contact_error_bot_check     "Bot check failed. Please try again."
contact_privacy_note        "Your IP address and browser info are collected with this message for abuse prevention."
contact_back_to_profile     "← Back to Profile"
nav_contact                 "Contact"
footer_contact              "Contact"
guide_faq_contact_a_v2      "Use the Contact page — or find it in the Help menu at the top."
```

After editing the JSON files, run the Paraglide compile step (or let the dev server pick it up automatically) so the generated files under `src/paraglide/messages/` are updated.

---

### Step 2 — Create `src/routes/contact/+page.server.ts`

This file handles both load (pre-filling user data for logged-in users) and the `send` action.

Key responsibilities:

- `load`: read `locals.user`, `locals.plan`, and optionally `getProfile` for display_name. Return `{ userEmail, isPlus, displayName }`.
- `send` action:
  - Read `email`, `subject`, `message`, `app_version`, `website` (honeypot), `cf-turnstile-response` from FormData.
  - Honeypot check (silent success on hit).
  - Turnstile verification via `verifyTurnstileToken` — fail with `contact_error_bot_check`.
  - Basic validation: email format, subject present, message 10–2000 chars.
  - Insert into `contact_messages` via Supabase admin client (same as current `supportContact` action — service role bypasses RLS).
  - Send email via Resend (same logic as current action, pulling `ADMIN_USER_ID`'s email).
  - Return `{ success: true, email }` on success.

Move the Resend + DB logic from `my-profile/+page.server.ts` `supportContact` action into a shared helper at `src/lib/server/contact.ts` so both routes can call it (during transition; remove from my-profile in Step 6).

---

### Step 3 — Create `src/routes/contact/+page.svelte`

A standalone page (not a modal/accordion like the current one).

Structure:

- `<svelte:head>` with `contact_page_title`.
- Centred card layout (`max-w-lg`) matching the login page style.
- **If `sent` is true**: show success state (heading + body with email, `← Back` link).
- **If not sent**: show the form.

Form fields:

1. **Email** — `<input type="email">`. Pre-filled and `readonly` for logged-in users (show a small hint "Logged in as …"). Editable for logged-out users.
2. **Subject** — `<select>` with the same 5 options as currently.
3. **Message** — `<textarea>` with character counter.
4. **Turnstile widget** — rendered explicitly (same `onMount` polling pattern from `auth/login/+page.svelte`). Only shown for logged-out users, or always — decide: always show for consistency and because logged-in users can still be bots.
5. Honeypot hidden input (`name="website"`).
6. Privacy note.
7. Submit button.

State management using `$state` / `$derived` runes (Svelte 5). Use `fetch` + `deserialize` + `applyAction` pattern (same as login, avoids `<form use:enhance>` Turnstile timing issues).

---

### Step 4 — Update `Nav.svelte` (Help dropdown + mobile sidebar)

**Help dropdown** (desktop `NavUl`): Add a `DropdownItem` for Contact inside the existing Help dropdown, below "Free resources":

```svelte
<DropdownItem class="dark:hover:bg-blue-900" href="/contact" onclick={closeMoreDropdown}>
  {m.nav_contact()}
</DropdownItem>
```

**Mobile sidebar** (`Sidebar` section): Add a `SidebarItem` for Contact in the third `SidebarGroup` (alongside Blog, Guide, Free resources). Use `EnvelopeOutline` from `flowbite-svelte-icons`.

```svelte
<SidebarItem label={m.nav_contact()} href="/contact">
  {#snippet icon()}
    <EnvelopeOutline class="h-5 w-5 ..." />
  {/snippet}
</SidebarItem>
```

---

### Step 5 — Update `Footer.svelte`

Add Contact to the `resourcesPages` array in the `<script module>` block:

```js
const resourcesPages = [
  { name: () => m.nav_blog(), link: '/blog' },
  { name: () => m.nav_my_stats(), link: '/stats' },
  { name: () => m.nav_plus(), link: '/plus' },
  { name: () => m.nav_guide(), link: '/guide' },
  { name: () => m.footer_contact(), link: '/contact' } // ← add
];
```

---

### Step 6 — Remove `ContactSupport` from `/my-profile`

- Delete `src/routes/my-profile/ContactSupport.svelte`.
- Remove `import ContactSupport` and `<ContactSupport ...>` from `my-profile/+page.svelte`.
- Remove the `supportContact` action from `my-profile/+page.server.ts` (it now lives in `src/lib/server/contact.ts` called by `/contact/+page.server.ts`).
- Remove `isPlus` prop passed down to `ContactSupport` (no longer needed).
- Update `contact-honeypot.test.ts` — either delete it or move/rename it to test the new shared helper at `src/lib/server/contact.ts`.

---

### Step 7 — Update the Guide FAQ

In `messages/en.json` (and other locales), update `guide_faq_contact_a` (and add `guide_faq_contact_a_v2` as a replacement key if needed):

```json
"guide_faq_contact_a": "Use the Contact page — accessible from the Help menu at the top or the footer. Plus members get priority replies within 1 business day."
```

Then update the relevant section in `src/routes/guide/+page.svelte` to use the updated key (or the `_v2` key, following the existing pattern used for `guide_faq_freeplus_a_v2`).

---

### Step 8 — (Optional) Redirect `/my-profile#contact` → `/contact`

If there are any deep links or emails pointing to the old contact section, add a note here. For now, the old anchor no longer exists so no redirect is strictly needed.

---

## File change summary

| File                                             | Action                                                 |
| ------------------------------------------------ | ------------------------------------------------------ |
| `messages/en.json`                               | Add ~15 new keys                                       |
| `messages/nb.json`                               | Add ~15 new keys (Norwegian)                           |
| `messages/es.json`                               | Add ~15 new keys (Spanish)                             |
| `messages/uk.json`                               | Add ~15 new keys (Ukrainian)                           |
| `src/lib/server/contact.ts`                      | **New** — shared send logic (DB insert + Resend email) |
| `src/routes/contact/+page.server.ts`             | **New** — load + send action                           |
| `src/routes/contact/+page.svelte`                | **New** — contact form page                            |
| `src/routes/components/Nav.svelte`               | Add Contact to Help dropdown + mobile sidebar          |
| `src/routes/components/Footer.svelte`            | Add Contact to resourcesPages                          |
| `src/routes/my-profile/+page.svelte`             | Remove `<ContactSupport>`                              |
| `src/routes/my-profile/+page.server.ts`          | Remove `supportContact` action                         |
| `src/routes/my-profile/ContactSupport.svelte`    | **Delete**                                             |
| `src/routes/my-profile/contact-honeypot.test.ts` | Move/update to test `src/lib/server/contact.ts`        |

---

## Implementation order

1. Step 1 (i18n keys) — unblocks everything else.
2. Step 2 + 3 (new route) — gets the page working end-to-end.
3. Step 4 + 5 (nav + footer) — makes it discoverable.
4. Step 6 (remove from my-profile) — clean up.
5. Step 7 (guide update) — polish.

---

## Notes / caveats

- `PUBLIC_TURNSTILE_SITE_KEY` is already available; no new env vars needed.
- The `contact_messages` table already exists (created when `supportContact` was built); no DB migration required.
- `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_USER_ID`, and `SUPABASE_SERVICE_ROLE_KEY` are all already in the private env — no new secrets.
- The Turnstile widget on `/contact` should use the same explicit render approach (`render=explicit`, `onMount` polling) to avoid the Safari/iPad timing bug.
- For logged-in users, the email field should be `readonly` + visually distinct (greyed out), but the value should still be submitted via a hidden input so the server can trust it from `locals.user.email` rather than the form field. The visible readonly field is just UX sugar — the server ignores the submitted email field for logged-in users and uses `locals.user.email` directly.
- The `app_version` hidden field (`__VERSION__`) should be included on the contact page as well, same as the current form.
