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
      'Full B1 to C access',
      'Cross-device sync',
      'Per-category progress breakdown',
      'Quiz yourself, not just flip',
      'Exam practice, not just vocabulary'
    ]) {
      await expect(page.getByRole('heading', { name: title, level: 3 })).toBeVisible();
    }
  });

  test('shows smart review section with all three steps', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'How smart review works' })).toBeVisible();
    for (const title of ['Rate each card', 'Timing adjusts automatically', 'Your Due today deck']) {
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
