import { expect, test } from '@playwright/test';
import { injectPlusPlan, setNorwegianLocale } from './helpers.js';

// ---------------------------------------------------------------------------
// Free user — search button is NOT visible (Plus-only feature)
// ---------------------------------------------------------------------------

test('free user does NOT see search button in nav', async ({ page }) => {
  await setNorwegianLocale(page);
  await page.goto('/');
  await expect(page.getByTestId('search-button')).not.toBeVisible();
});

test('free user Cmd/Ctrl+K does not open search modal', async ({ page }) => {
  await setNorwegianLocale(page);
  await page.goto('/');
  await page.keyboard.press('Meta+k');
  // Modal must not appear for free users
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

// ---------------------------------------------------------------------------
// Plus user — modal opens and is functional
// ---------------------------------------------------------------------------

test('Plus user sees search button in nav', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/');
  // Wait for onMount to fetch /api/plan and update clientIsPlus
  await expect(page.getByTestId('search-button')).toBeVisible({ timeout: 3000 });
});

test('Plus user clicking search icon opens modal with search input', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/');
  await page.getByTestId('search-button').waitFor();
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
  await page.getByRole('searchbox').pressSequentially('hei');
  // Wait for debounce (150 ms) + results to render
  await page.waitForTimeout(500);
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
  // Wait long enough for the fetch to complete and cached to be set
  await page.waitForTimeout(1000);
  await page.keyboard.press('Escape');

  // Second open — should NOT fetch again
  await page.getByTestId('search-button').click();
  await expect(page.getByRole('searchbox')).toBeVisible();
  await page.waitForTimeout(300);

  expect(fetchCount).toBe(1);
});
