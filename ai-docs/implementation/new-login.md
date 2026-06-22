# OTP Login Implementation Plan

## Problem

The magic-link login flow breaks on iPad PWA. When a user taps the sign-in email on
iOS, the link opens in Safari (the system browser), not the installed PWA. The session
cookie Safari sets lives in a separate cookie jar from the PWA's WKWebView, so the user
ends up back at `/auth/login?error=auth_callback_failed`.

This affects all iOS PWA installs. macOS is unaffected because clicking a link in Mail
opens the default browser, which is also where the PWA runs.

## Solution

Replace the magic-link flow with a **6-digit email OTP** flow. This works identically
across all devices, browsers, and platforms (desktop browser, mobile browser, iOS PWA,
Android PWA):

1. Enter email → server reads locale cookie → calls `supabase.auth.signInWithOtp` with `data.locale`
2. Supabase sends a localised email with a 6-digit code (not a link)
3. User opens their email app or webmail, reads the code, and returns to the login page
4. User enters the code → server calls `supabase.auth.verifyOtp`
5. Session cookie is set, redirect to `/auth/sync?next=…` as before

No URL is ever opened from the email. On desktop this is simply a better UX than a
magic link (no tab switching required — the login page stays open). On iOS PWA it fixes
the bug entirely, since no link is tapped and Safari is never involved.

---

## Localised OTP Email

### Why it's needed

The app supports 4 UI languages (English, Norwegian, Spanish, Ukrainian). When Supabase
sends the OTP email it should match the language the user is already reading the UI in.

### How locale is known at login time

Paraglide stores the user's chosen language in a cookie named `PARAGLIDE_LOCALE`. This
is set client-side whenever the user switches language (e.g. via the nav switcher) and
is confirmed by the e2e test helpers which explicitly set `PARAGLIDE_LOCALE` to `'nb'`
to test Norwegian UI. At login time no user session exists yet, so this cookie is the
only reliable locale signal available server-side.

Fallback chain in `+page.server.ts`:

```
PARAGLIDE_LOCALE cookie → 'en' (base locale)
```

### Implementation approach — Go template conditionals in the Supabase OTP email template

Supabase email templates support Go templating. The `options.data` payload passed to
`signInWithOtp` is available inside the template as `{{ .Data }}` (confirmed against
the "Template variables" list in the Supabase dashboard's email template editor —
there is no `.UserMetaData` variable). We pass `locale` there and use `{{ if eq }}`
blocks to render the correct language inline — no Edge Function, no external email
provider required.

**Code change in `+page.server.ts`:**

```ts
const locale = (cookies.get('PARAGLIDE_LOCALE') ?? 'en') as 'en' | 'nb' | 'es' | 'uk';

const { error: authError } = await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: true,
    data: { locale } // available in the template as {{ .UserMetaData.locale }}
  }
});
```

**Supabase dashboard → Authentication → Email Templates → OTP template** (manual step):

```
Subject:
{{ if eq .Data.locale "nb" }}Din engangskode for Norskeord
{{ else if eq .Data.locale "es" }}Tu código de acceso para Norskeord
{{ else if eq .Data.locale "uk" }}Ваш код входу для Norskeord
{{ else }}Your sign-in code for Norskeord{{ end }}

Body:
{{ if eq .Data.locale "nb" }}
  <p>Din engangskode er:</p>
  <h2>{{ .Token }}</h2>
  <p>Koden er gyldig i 10 minutter. Ikke del den med noen.</p>
{{ else if eq .Data.locale "es" }}
  <p>Tu código de un solo uso es:</p>
  <h2>{{ .Token }}</h2>
  <p>El código es válido durante 10 minutos. No lo compartas con nadie.</p>
{{ else if eq .Data.locale "uk" }}
  <p>Ваш одноразовий код:</p>
  <h2>{{ .Token }}</h2>
  <p>Код дійсний 10 хвилин. Не передавайте його нікому.</p>
{{ else }}
  <p>Your one-time sign-in code is:</p>
  <h2>{{ .Token }}</h2>
  <p>Valid for 10 minutes. Do not share it with anyone.</p>
{{ end }}
```

This is a one-time manual update in the Supabase dashboard. The template covers all 4
locales with a safe English fallback.

---

## Files Changed

### Modified

| File                                    | Change                                                                                                         |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `src/routes/auth/login/+page.server.ts` | Read `PARAGLIDE_LOCALE` cookie; pass `locale` in `options.data`; add `verify` action; remove `emailRedirectTo` |
| `src/routes/auth/login/+page.svelte`    | Add OTP input step; update i18n keys; update submit/verify handlers                                            |
| `messages/en.json`                      | Add new OTP i18n keys; update existing copy                                                                    |
| `messages/nb.json`                      | Add new OTP i18n keys (Norwegian)                                                                              |
| `messages/es.json`                      | Add new OTP i18n keys (Spanish)                                                                                |
| `messages/uk.json`                      | Add new OTP i18n keys (Ukrainian)                                                                              |
| `e2e/login.test.ts`                     | Update existing tests; add OTP step tests                                                                      |

### Deleted

| File                                  | Reason                                                    |
| ------------------------------------- | --------------------------------------------------------- |
| `src/routes/auth/callback/+server.ts` | Only needed for magic-link code exchange. No longer used. |

---

## Step-by-step Implementation

### Step 1 — Add i18n keys to all message files

Add/update in `messages/en.json`:

```json
"login_subheading": "Enter your email — we'll send a 6-digit code, no password needed.",
"login_submit": "Send code",
"login_success_body": "We sent a 6-digit code to {email}. Enter it below.",
"login_otp_label": "6-digit code",
"login_otp_placeholder": "123456",
"login_otp_submit": "Verify code",
"login_otp_verifying": "Verifying…",
"login_error_otp_invalid": "Invalid or expired code. Please request a new one.",
"login_resend": "Resend code",
"login_resending": "Resending…",
"login_resend_sent": "New code sent."
```

Keys being **updated** (already exist, copy changes): `login_subheading`, `login_submit`,
`login_success_body`.

Keys being **added** (new): `login_otp_label`, `login_otp_placeholder`, `login_otp_submit`,
`login_otp_verifying`, `login_error_otp_invalid`, `login_resend`, `login_resending`,
`login_resend_sent`.

Keys being **removed**: `login_no_password_note` (replaced by updated subheading copy).

Mirror all changes in `nb.json`, `es.json`, and `uk.json` with appropriate translations.

---

### Step 2 — Update `+page.server.ts`

**2a. `login` action — read locale cookie, remove `emailRedirectTo`**

```ts
// BEFORE
const origin = request.headers.get('origin') ?? '';
const { error: authError } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`
  }
});
return { success: true, email };

// AFTER
const locale = (cookies.get('PARAGLIDE_LOCALE') ?? 'en') as 'en' | 'nb' | 'es' | 'uk';
const { error: authError } = await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: true,
    data: { locale }
  }
});
return { success: true, email, next };
```

`next` is now included in the success payload so Step 2 can forward it to `verify`.

**2b. New `verify` action**

```ts
verify: async ({ request, cookies }) => {
  const data = await request.formData();
  const email = (data.get('email') as string | null)?.trim() ?? '';
  const token = (data.get('token') as string | null)?.trim() ?? '';
  const next = (data.get('next') as string | null) ?? '/';

  if (!token || !/^\d{6}$/.test(token)) {
    return fail(400, { error: 'login_error_otp_invalid', email, next, step: 'verify' });
  }

  const supabase = createSupabaseServerClient(cookies);
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });

  if (error) {
    return fail(400, { error: 'login_error_otp_invalid', email, next, step: 'verify' });
  }

  throw redirect(303, `/auth/sync?next=${encodeURIComponent(next)}`);
};
```

No Turnstile check on `verify` — bot protection already ran on `login`. The OTP itself
is single-use and short-lived (Supabase default: 1 hour), which is sufficient.

---

### Step 3 — Update `+page.svelte`

The page has two visual states:

- **Step 1 (email):** existing form — email input + Turnstile widget + "Send code" button
- **Step 2 (OTP):** new form — read-only email display + 6-digit code input + "Verify
  code" button + "Resend code" link

**3a. Derive current step from form data**

```ts
let step = $derived(
  (form && 'step' in form && form.step === 'verify') ||
    (form !== null && 'success' in form && form.success === true)
    ? 'verify'
    : 'email'
);
```

**3b. OTP input — auto-focus and numeric keyboard**

```svelte
<input
  id="token"
  name="token"
  type="text"
  inputmode="numeric"
  pattern="\d{6}"
  maxlength="6"
  autocomplete="one-time-code"
  placeholder={m.login_otp_placeholder()}
  autofocus
  ...
/>
```

`autocomplete="one-time-code"` enables iOS/Android/desktop browser auto-fill from the
email. `inputmode="numeric"` shows the numeric keyboard on mobile.

**3c. Resend link**

The resend link submits a new `?/login` POST with the stored email, reusing the existing
Turnstile token (valid until expiry). Shows a transient "New code sent" confirmation —
no page navigation.

```ts
let resendStatus = $state<'idle' | 'sending' | 'sent'>('idle');

async function handleResend() {
  if (resendStatus !== 'idle') return;
  resendStatus = 'sending';
  const formData = new FormData();
  formData.set('email', storedEmail);
  formData.set('next', storedNext);
  formData.set('cf-turnstile-response', turnstileToken);
  await fetch('?/login', { method: 'POST', body: formData });
  resendStatus = 'sent';
  setTimeout(() => (resendStatus = 'idle'), 4000);
}
```

**3d. Remove the success "Check your inbox" card**

The existing `{#if submitted}` green card becomes the OTP step instead. Remove the card
markup and the `submitted` / `submittedEmail` derived values.

**3e. Turnstile — no changes needed**

Turnstile remains on Step 1 only. The existing explicit-render logic is unchanged.

---

### Step 4 — Delete `src/routes/auth/callback/+server.ts`

This file handled the PKCE code exchange for magic links. With OTP no callback URL is
ever visited. Delete the file.

Verify no remaining references first:

```bash
grep -r "auth/callback" src/
```

Expected: zero results (the only reference was `emailRedirectTo`, removed in Step 2).

---

### Step 5 — Update Supabase email template (manual)

In the Supabase dashboard → Authentication → Email Templates → **OTP**:

1. Update the subject line with the localised `{{ if eq }}` template shown above.
2. Update the body with the localised code block shown above.
3. Save and send a test email to confirm all 4 language branches render correctly.

This is a one-time manual step — no code change required.

---

## Code to Remove

| Location                              | What to remove                                       |
| ------------------------------------- | ---------------------------------------------------- |
| `+page.server.ts`                     | `const origin = request.headers.get('origin') ?? ''` |
| `+page.server.ts`                     | `emailRedirectTo` option in `signInWithOtp`          |
| `+page.svelte`                        | `submitted` and `submittedEmail` derived values      |
| `+page.svelte`                        | The `{#if submitted}` green inbox card block         |
| `src/routes/auth/callback/+server.ts` | Entire file                                          |
| `messages/*.json`                     | `login_no_password_note` key                         |

---

## Tests

### Unit tests (Vitest)

No new Vitest unit tests required. The `verify` action logic is thin (format check +
Supabase call). If a unit test suite is added later, mock `createSupabaseServerClient`
and assert the redirect on success and `fail(400)` on a bad token.

### E2E tests — `e2e/login.test.ts`

**Update existing tests:**

- `'submit button is present and enabled'` — button label changes from "Send sign-in
  link" to "Send code"; update the `getByRole` name.
- `'no password note is visible'` — `login_no_password_note` key is removed; replace
  with a check for the new subheading text.
- `'shows "Free · No credit card required" reassurance text'` — unchanged, keep as-is.

**Add new `test.describe('OTP step')`:**

```ts
test.describe('OTP step', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { turnstile: unknown }).turnstile = {
        render: (_container: HTMLElement, options: { callback?: (token: string) => void }) => {
          options.callback?.('test-token');
          return 'fake-widget-id';
        },
        reset: () => {}
      };
    });
    // Stub the Supabase OTP request so no real email is sent.
    await page.route('**/auth/v1/otp**', (route) => route.fulfill({ status: 200, body: '{}' }));
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: /email/i }).fill('test@example.com');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/auth/login') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /send code/i }).click()
    ]);
    await page.waitForSelector('#token');
  });

  test('OTP input is visible', async ({ page }) => {
    await expect(page.locator('#token')).toBeVisible();
  });

  test('OTP input has correct attributes for mobile autofill', async ({ page }) => {
    const input = page.locator('#token');
    await expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    await expect(input).toHaveAttribute('inputmode', 'numeric');
    await expect(input).toHaveAttribute('maxlength', '6');
  });

  test('shows error for invalid code format', async ({ page }) => {
    await page.locator('#token').evaluate((el) => el.removeAttribute('pattern'));
    await page.locator('#token').fill('abc123');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/auth/login') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /verify code/i }).click()
    ]);
    await expect(page.locator('p.text-red-500, p[class*="red"]')).toBeVisible({ timeout: 8000 });
  });

  test('resend button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /resend code/i })).toBeVisible();
  });
});
```

---

## Rollout Checklist

- [x] Step 1: Add/update i18n keys in all 4 message files
- [x] Step 2: Update `+page.server.ts` (locale cookie read + `data.locale` + `verify` action)
- [x] Step 3: Update `+page.svelte` (two-step UI)
- [ ] Step 4: Delete `src/routes/auth/callback/+server.ts` (no remaining references found — ready to `git rm`)
- [ ] Step 5: Update Supabase OTP email template with localised Go template
- [ ] Run `pnpm check` — no TypeScript errors
- [ ] Run existing e2e suite — all login tests pass
- [ ] Manual test: desktop browser (macOS/Windows) — full OTP flow works end-to-end
- [ ] Manual test: mobile browser (iOS Safari, Android Chrome) — full OTP flow works end-to-end
- [ ] Manual test: iOS PWA — full OTP flow works end-to-end (original bug fixed)
- [ ] Verify OTP email arrives in correct language for each of the 4 locales
- [ ] Deploy to Vercel
