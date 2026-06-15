import { expect, test } from '@playwright/test';
import { injectLoggedInUser } from './helpers';

test.describe('nav auth state', () => {
  test('nav renders avatar when user is authenticated', async ({ page }) => {
    await injectLoggedInUser(page);
    await page.goto('/');
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    await expect(page.getByRole('link', { name: /log in/i })).not.toBeVisible();
  });

  test('nav renders avatar on /blog when user is authenticated',  async ({ page }) => {
    await injectLoggedInUser(page);
    await page.goto('/blog');
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });

  test('nav renders avatar on /resources when user is authenticated', async ({ page }) => {
    await injectLoggedInUser(page);
    await page.goto('/resources');
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });

  test('nav renders avatar on /guide when user is authenticated', async ({ page }) => {
    await injectLoggedInUser(page);
    await page.goto('/guide');
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });

  test('nav renders avatar on /learn/a1 when user is authenticated', async ({ page }) => {
    await injectLoggedInUser(page);
    await page.goto('/learn/a1');
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
  });
});
