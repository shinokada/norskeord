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

  test('shows all four Plus feature cards', async ({ page }) => {
    for (const title of [
      'Study only what you need today',
      'Full B1 to C2 access',
      'Cross-device sync',
      'Per-category progress breakdown'
    ]) {
      await expect(page.getByRole('heading', { name: title, level: 3 })).toBeVisible();
    }
  });

  test('shows smart review section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'How smart review works' })).toBeVisible();
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
