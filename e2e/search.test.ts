import { expect, test } from '@playwright/test';
import { injectPlusPlan, setNorwegianLocale } from './helpers.js';

// ---------------------------------------------------------------------------
// Free user — search icon visible with lock badge, clicking opens upgrade prompt
// ---------------------------------------------------------------------------

test('free user sees search icon with lock badge in nav', async ({ page }) => {
  await setNorwegianLocale(page);
  await page.goto('/');
  const searchBtn = page.getByTestId('search-button');
  await expect(searchBtn).toBeVisible();
  // Lock badge (🔒 span) should be present for free users
  await expect(searchBtn.locator('span[aria-label]')).toBeVisible();
});

test('free user clicking search icon sees upgrade prompt', async ({ page }) => {
  await setNorwegianLocale(page);
  await page.goto('/');
  await page.getByTestId('search-button').click();
  // Modal should open with upgrade prompt
  await expect(page.getByRole('dialog')).toBeVisible();
  // Should have a link to /plus
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('link', { name: /plus|oppgrader/i })).toBeVisible();
  // Should NOT show the search input
  await expect(page.getByRole('searchbox')).not.toBeVisible();
});

test('free user can dismiss upgrade prompt', async ({ page }) => {
  await setNorwegianLocale(page);
  await page.goto('/');
  await page.getByTestId('search-button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  // Close via Escape
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

// ---------------------------------------------------------------------------
// Plus user — modal opens and is functional
// ---------------------------------------------------------------------------

test('Plus user search icon has no lock badge', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/');
  const searchBtn = page.getByTestId('search-button');
  await expect(searchBtn).toBeVisible();
  // Lock badge should NOT be present for Plus users
  await expect(searchBtn.locator('span[aria-label]')).not.toBeVisible();
});

test('Plus user clicking search icon opens modal with search input', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/');
  await page.getByTestId('search-button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('searchbox')).toBeVisible();
});

test('Plus user can open modal with Cmd/Ctrl+K shortcut', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/');
  // Use Meta+K (Cmd on Mac) — Playwright treats Meta as Cmd
  await page.keyboard.press('Meta+k');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('searchbox')).toBeVisible();
});

test('Escape closes the search modal', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/');
  await page.getByTestId('search-button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('clicking backdrop closes the search modal', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/');
  await page.getByTestId('search-button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  // Click the backdrop (outside the panel) — use top-left corner of the overlay
  await page.mouse.click(10, 10);
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('typing a query shows results', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/');
  await page.getByTestId('search-button').click();
  await page.getByRole('searchbox').fill('hei');
  // Wait for debounce + results to render
  await page.waitForTimeout(300);
  await expect(page.getByRole('option').first()).toBeVisible();
});

test('short query (1 char) shows no results', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/');
  await page.getByTestId('search-button').click();
  await page.getByRole('searchbox').fill('h');
  await page.waitForTimeout(300);
  await expect(page.getByRole('option')).toHaveCount(0);
});

test('network request to /data/search-index.json is made on first open', async ({ page }) => {
  await injectPlusPlan(page);

  const indexRequests: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('/data/search-index.json')) {
      indexRequests.push(req.url());
    }
  });

  await page.goto('/');
  await page.getByTestId('search-button').click();
  // Wait for index to load
  await expect(page.getByRole('searchbox')).toBeVisible();
  await page.waitForTimeout(500);

  expect(indexRequests.length).toBeGreaterThan(0);
});

test('second modal open does NOT re-fetch the search index', async ({ page }) => {
  await injectPlusPlan(page);

  let fetchCount = 0;
  page.on('request', (req) => {
    if (req.url().includes('/data/search-index.json')) fetchCount++;
  });

  await page.goto('/');

  // First open — fetches index
  await page.getByTestId('search-button').click();
  await expect(page.getByRole('searchbox')).toBeVisible();
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');

  // Second open — should NOT fetch again
  await page.getByTestId('search-button').click();
  await expect(page.getByRole('searchbox')).toBeVisible();
  await page.waitForTimeout(300);

  expect(fetchCount).toBe(1);
});
