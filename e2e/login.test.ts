import { expect, test } from '@playwright/test';

// Cloudflare's dummy "always passes" secret key (set for this test run via
// playwright.config.ts) only accepts this exact dummy token string — it does
// NOT accept arbitrary fake tokens. See:
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const DUMMY_TURNSTILE_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

function uniqueEmail() {
  // Supabase enforces a 60s resend cooldown per email address. Each test
  // (and each beforeEach run) needs its own address so they don't collide
  // with each other within that window.
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

// ---------------------------------------------------------------------------
// Mocking the resend (?/login) action response
// ---------------------------------------------------------------------------
//
// handleResend() in +page.svelte issues its POST via a plain browser-side
// `fetch('?/login', ...)` call. Unlike Supabase's own auth/v1 endpoints
// (which the server hits directly, invisible to Playwright's page.route()),
// this particular request IS made by the browser and can be safely
// intercepted. We use that to test both the success and "request failed" UI
// paths deterministically, without fighting Supabase's real 60s per-email
// OTP cooldown — clicking resend immediately after the initial code was
// sent in beforeEach would otherwise hit that cooldown for real.
//
// The response body has to match what SvelteKit's deserialize() (from
// $app/forms) expects: `{ type, status, data }`, where `data` is a
// devalue-encoded string. For plain JSON-safe values (booleans/strings, no
// Dates/Maps/etc.) devalue's flat reference-array encoding is byte-identical
// to a hand-built JSON array, so we don't need the actual `devalue` package
// here — see e.g. https://github.com/sveltejs/devalue.
function mockActionResultBody(
  type: 'success' | 'failure',
  status: number,
  data: Record<string, unknown>
) {
  const keys = Object.keys(data);
  const refs: Record<string, number> = {};
  keys.forEach((key, i) => (refs[key] = i + 1));
  const parts = [refs, ...keys.map((key) => data[key])];
  return JSON.stringify({ type, status, data: JSON.stringify(parts) });
}

// ---------------------------------------------------------------------------
// /auth/login page
// ---------------------------------------------------------------------------

test.describe('/auth/login page', () => {
  test.beforeEach(async ({ page }) => {
    // Stub Cloudflare Turnstile so the widget "completes" instantly without
    // depending on challenges.cloudflare.com being reachable in the test env.
    // The page calls turnstile.render(container, { callback, ... }) in
    // onMount; we immediately invoke the callback with the dummy token.
    await page.addInitScript((token) => {
      (window as unknown as { turnstile: unknown }).turnstile = {
        render: (_container: HTMLElement, options: { callback?: (token: string) => void }) => {
          options.callback?.(token);
          return 'fake-widget-id';
        },
        reset: () => {}
      };
    }, DUMMY_TURNSTILE_TOKEN);
    await page.goto('/auth/login');
  });

  test('page loads with a heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('shows "Free · No credit card required" reassurance text', async ({ page }) => {
    await expect(page.getByText(/no credit card required/i)).toBeVisible();
  });

  test('email input is present', async ({ page }) => {
    await expect(page.getByRole('textbox')).toBeVisible();
  });

  test('submit button is present and enabled', async ({ page }) => {
    const btn = page.getByRole('button', { name: /send code/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('shows error when submitting empty email', async ({ page }) => {
    // Form is now a server action — wait for the POST round-trip to complete.
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/auth/login') && r.request().method() === 'POST',
        { timeout: 15000 }
      ),
      page.getByRole('button', { name: /send code/i }).click()
    ]);
    const error = page.locator('p.text-red-500, p[class*="red"]');
    await expect(error).toBeVisible({ timeout: 8000 });
  });

  test('shows error when submitting invalid email', async ({ page }) => {
    // Strip type="email" so the browser's native validation doesn't block the
    // POST — we want to test the server-side validation path instead.
    await page.locator('#email').evaluate((el) => el.removeAttribute('type'));
    await page.getByRole('textbox').fill('not-an-email');

    // Form is now a server action — wait for the POST round-trip to complete.
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/auth/login') && r.request().method() === 'POST',
        { timeout: 15000 }
      ),
      page.getByRole('button', { name: /send code/i }).click()
    ]);
    const error = page.locator('p.text-red-500, p[class*="red"]');
    await expect(error).toBeVisible({ timeout: 8000 });
  });

  test('shows the no-password subheading', async ({ page }) => {
    // login_no_password_note was removed; the no-password promise now lives
    // in the subheading copy instead.
    await expect(page.getByText(/no password needed/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// OTP step  (skipped — re-enable with test.describe when needed)
// ---------------------------------------------------------------------------
//
// These tests exercise the real signInWithOtp/verifyOtp calls against the
// configured Supabase project (the page.server.ts actions run server-side,
// so page.route() can't intercept them — see playwright.config.ts for how
// Turnstile is made to pass instead of trying to stub the Supabase network
// calls). Each test uses a fresh email to dodge Supabase's per-email OTP
// resend cooldown.
//
// IMPORTANT: shouldCreateUser is true on the login action, so each run
// creates real (unverified) users in the Supabase project. Skipped by
// default to avoid that side-effect. Run manually when you need to verify
// the real Supabase OTP wiring is still working.

test.describe.skip('OTP step', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((token) => {
      (window as unknown as { turnstile: unknown }).turnstile = {
        render: (_container: HTMLElement, options: { callback?: (token: string) => void }) => {
          options.callback?.(token);
          return 'fake-widget-id';
        },
        reset: () => {}
      };
    }, DUMMY_TURNSTILE_TOKEN);
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: /email/i }).fill(uniqueEmail());
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/auth/login') && r.request().method() === 'POST',
        { timeout: 15000 }
      ),
      page.getByRole('button', { name: /send code/i }).click()
    ]);
    await page.waitForSelector('#token', { timeout: 15000 });
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

  test('verify button is disabled until 6 digits are entered', async ({ page }) => {
    const btn = page.getByRole('button', { name: /verify code/i });
    await expect(btn).toBeDisabled();
    await page.locator('#token').fill('123456');
    await expect(btn).toBeEnabled();
  });

  test('shows error when verification fails', async ({ page }) => {
    // No stub needed: '123456' is essentially guaranteed not to match the
    // real code that was just emailed, so Supabase's verifyOtp genuinely
    // rejects it — this exercises the real fail(400) path end to end.
    await page.locator('#token').fill('123456');
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/auth/login') && r.request().method() === 'POST',
        { timeout: 15000 }
      ),
      page.getByRole('button', { name: /verify code/i }).click()
    ]);
    await expect(page.locator('p.text-red-500, p[class*="red"]')).toBeVisible({ timeout: 8000 });
  });

  test('resend button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /resend code/i })).toBeVisible();
  });

  test('resend shows a confirmation', async ({ page }) => {
    await page.route(
      (url) => url.pathname === '/auth/login' && url.searchParams.has('/login'),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: mockActionResultBody('success', 200, {
            success: true,
            email: 'mock@example.com',
            next: '/'
          })
        })
    );
    await page.getByRole('button', { name: /resend code/i }).click();
    await expect(page.getByRole('button', { name: /new code sent/i })).toBeVisible({
      timeout: 8000
    });
  });

  test('resend shows an error when the request fails', async ({ page }) => {
    // Exercises the resend bug fix: handleResend() must check result.type
    // rather than assuming success. Previously this always showed "New code
    // sent" even when the server rejected the request — e.g. a real
    // double-click within Supabase's 60s per-email cooldown would silently
    // lie to the user about an email having been sent.
    await page.route(
      (url) => url.pathname === '/auth/login' && url.searchParams.has('/login'),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: mockActionResultBody('failure', 500, {
            error: 'login_error_generic',
            email: 'mock@example.com',
            next: '/'
          })
        })
    );
    await page.getByRole('button', { name: /resend code/i }).click();
    await expect(page.getByRole('button', { name: /couldn.t resend/i })).toBeVisible({
      timeout: 8000
    });
  });
});
