import { expect, test } from '@playwright/test';
import { injectPlusPlan } from './helpers.js';

test.describe('/my-progress page — sync upsell banner', () => {
  test('free user (no localStorage) sees upsell banner with link to /plus', async ({ page }) => {
    await page.goto('/my-progress');
    const banner = page.getByText(/all A2 to C vocabulary, uttrykk and grammar/i);
    await expect(banner).toBeVisible();
    const link = page.getByRole('link', { name: /see plus pricing/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/plus');
  });

  test('Plus user does not see upsell banner', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/my-progress');
    await expect(page.getByText(/all A2 to C vocabulary, uttrykk and grammar/i)).not.toBeVisible();
    await expect(page.getByRole('link', { name: /see plus pricing/i })).not.toBeVisible();
  });
});
