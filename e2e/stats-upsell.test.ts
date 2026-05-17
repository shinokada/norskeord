import { expect, test } from '@playwright/test';
import { injectPlusPlan } from './helpers.js';

test.describe('/stats page — sync upsell banner', () => {
  test('free user (no localStorage) sees upsell banner with link to /plus', async ({ page }) => {
    await page.goto('/stats');
    const banner = page.getByText(/only saved on this device/i);
    await expect(banner).toBeVisible();
    const link = page.getByRole('link', { name: /get plus/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/plus');
  });

  test('Plus user does not see upsell banner', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/stats');
    await expect(page.getByText(/only saved on this device/i)).not.toBeVisible();
    await expect(page.getByRole('link', { name: /get plus/i })).not.toBeVisible();
  });
});
