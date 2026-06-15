import { expect, test } from '@playwright/test';
import { injectLoggedInUser } from './helpers';

test.describe('nav auth state', () => {
  test('logged-in user sees avatar, not Login/Plus buttons on homepage', async ({ page }) => {
    await injectLoggedInUser(page);
    await page.goto('/');
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    await expect(page.getByRole('link', { name: /log in/i })).not.toBeVisible();
  });

  test('logged-in user sees avatar on /blog', async ({ page }) => {
    await injectLoggedInUser(page);
    await page.goto('/blog');
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });

  test('logged-in user sees avatar on /resources', async ({ page }) => {
    await injectLoggedInUser(page);
    await page.goto('/resources');
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });

  test('logged-in user sees avatar on /guide', async ({ page }) => {
    await injectLoggedInUser(page);
    await page.goto('/guide');
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });

  test('logged-in user sees avatar on /learn/a1', async ({ page }) => {
    await injectLoggedInUser(page);
    await page.goto('/learn/a1');
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });
});
