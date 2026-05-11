import { expect, test } from '@playwright/test';

test.describe('/plus page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plus');
  });

  // ── Meta ──────────────────────────────────────────────────────────────────

  test('has expected page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Norske Flashcard Plus/i);
  });

  test('has expected meta description', async ({ page }) => {
    const meta = page.locator('meta[name="description"]');
    await expect(meta).toHaveAttribute('content', /smart review/i);
  });

  // ── Content ───────────────────────────────────────────────────────────────

  test('shows "Soon" badge in comparison table header', async ({ page }) => {
    await expect(page.getByText('Soon', { exact: true })).toBeVisible();
  });

  test('shows hero heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Norske Flashcard Plus/i, level: 1 })
    ).toBeVisible();
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
      'Norskprøven B1 full preparation'
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

  // ── Email signup form ─────────────────────────────────────────────────────

  test('shows email input and notify button', async ({ page }) => {
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Notify me' })).toBeVisible();
  });

  test('shows error when submitting empty email', async ({ page }) => {
    await page.getByRole('button', { name: 'Notify me' }).click();
    await expect(page.getByText(/enter your email/i)).toBeVisible();
  });

  test('shows error for malformed email', async ({ page }) => {
    await page.getByPlaceholder('your@email.com').fill('not-an-email');
    await page.getByRole('button', { name: 'Notify me' }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('shows success state after valid email submission', async ({ page }) => {
    await page.route('/plus/waitlist', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Success' })
      });
    });

    await page.getByPlaceholder('your@email.com').fill('test@example.com');
    await page.getByRole('button', { name: 'Notify me' }).click();

    await expect(page.getByText('You are on the list!')).toBeVisible();
    await expect(page.getByText('test@example.com')).toBeVisible();
  });

  test('shows error message on server failure', async ({ page }) => {
    await page.route('/plus/waitlist', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Something went wrong. Please try again.' })
      });
    });

    await page.getByPlaceholder('your@email.com').fill('test@example.com');
    await page.getByRole('button', { name: 'Notify me' }).click();

    await expect(page.getByText(/something went wrong/i)).toBeVisible();
  });

  test('button is disabled and shows "Saving…" while submitting', async ({ page }) => {
    await page.route('/plus/waitlist', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Success' })
      });
    });

    await page.getByPlaceholder('your@email.com').fill('test@example.com');
    await page.getByRole('button', { name: 'Notify me' }).click();

    await expect(page.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  });
});
