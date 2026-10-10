import { expect, test } from '@playwright/test';

test.describe('/plus page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plus');
  });

  // ── Meta ──────────────────────────────────────────────────────────────────

  test('has expected page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Norskeord Plus/i);
  });

  test('has expected meta description', async ({ page }) => {
    const meta = page.locator('meta[name="description"]');
    await expect(meta).toHaveAttribute('content', /smart review/i);
  });

  // ── Content ───────────────────────────────────────────────────────────────

  test('shows hero heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Norskeord Plus/i, level: 1 })).toBeVisible();
  });

  test('shows Free vs Plus comparison table', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Free vs Plus', level: 2 })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Free' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Plus/i })).toBeVisible();
  });

  test('shows all Plus feature cards', async ({ page }) => {
    for (const title of [
      'Full A2 to C access',
      'Cross-device sync',
      'Per-category progress breakdown',
      'Quiz yourself, not just flip',
      'Exam practice, not just vocabulary'
    ]) {
      await expect(page.getByRole('heading', { name: title, level: 3 })).toBeVisible();
    }
  });

  test('bottom CTA links to home and norskproven', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Browse free categories' })).toHaveAttribute(
      'href',
      '/'
    );
    await expect(page.getByRole('link', { name: /Norskprøven prep/i })).toHaveAttribute(
      'href',
      '/norskproven'
    );
  });

  // ── Checkout CTA ──────────────────────────────────────────────────────────

  test('shows sign in to upgrade button for logged-out users', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sign in to upgrade/i })).toBeVisible();
  });

  test('sign in link points to login with checkout intent', async ({ page }) => {
    const link = page.getByRole('link', { name: /sign in to upgrade/i });
    await expect(link).toHaveAttribute('href', /\/auth\/login.*checkout/);
  });
});

test.describe('/plus/success logged out', () => {
  test('redirects to login with the success path and the original next kept', async ({ page }) => {
    // No session: the load function redirects (303) to /auth/login. `commit` stops at
    // the final response, so the test does not wait for the login page's third-party
    // scripts. The login URL's own `next` must bring the visitor back here, still
    // carrying the page they came from.
    await page.goto('/plus/success?next=%2Fa2%2Ftransport', { waitUntil: 'commit' });

    const url = new URL(page.url());
    expect(url.pathname).toBe('/auth/login');
    expect(url.searchParams.get('next')).toBe('/plus/success?next=%2Fa2%2Ftransport');
  });
});
