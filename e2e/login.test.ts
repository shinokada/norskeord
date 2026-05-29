import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// /auth/login page
// ---------------------------------------------------------------------------

test.describe('/auth/login page', () => {
  test.beforeEach(async ({ page }) => {
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
    const btn = page.getByRole('button', { name: /send sign-in link/i });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('shows error when submitting empty email', async ({ page }) => {
    // Form is now a server action — wait for the POST round-trip to complete.
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/login') && r.request().method() === 'POST'),
      page.getByRole('button', { name: /send sign-in link/i }).click()
    ]);
    const error = page.locator('p.text-red-500, p[class*="red"]');
    await expect(error).toBeVisible({ timeout: 8000 });
  });

  test('shows error when submitting invalid email', async ({ page }) => {
    await page.getByRole('textbox').fill('not-an-email');
    // Form is now a server action — wait for the POST round-trip to complete.
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/auth/login') && r.request().method() === 'POST'),
      page.getByRole('button', { name: /send sign-in link/i }).click()
    ]);
    const error = page.locator('p.text-red-500, p[class*="red"]');
    await expect(error).toBeVisible({ timeout: 8000 });
  });

  test('no password note is visible', async ({ page }) => {
    // Use the more specific bottom note (below the form) rather than the subheading
    await expect(
      page.getByText('No password needed. Your email is only used for authentication.')
    ).toBeVisible();
  });
});
