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
  // Wait for onMount's async /api/plan fetch to resolve (authStore.init()),
  // which is what flips effectiveIsPlus — and therefore Search's `isPlus`
  // prop — to true. Without this, Meta+k can fire while isPlus is still
  // false and the shortcut handler's `else if (isPlus) open = true` branch
  // never runs. Mirrors the wait already used before the click-based test
  // above.
  await page.getByTestId('search-button').waitFor();
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
  // Wait for debounce (150 ms) + results to render. Use an assertion-level
  // timeout instead of a fixed sleep so this doesn't flake under load when
  // run alongside the full suite (parallel workers sharing one server).
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 10000 });
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

// ---------------------------------------------------------------------------
// Deep link: result click carries the exact entry id (vocab-multiple-senses,
// Phase 2b). Works against real data.
// ---------------------------------------------------------------------------

test('clicking a search result navigates with id=w-NNNNNN and word= in the URL', async ({
  page
}) => {
  await injectPlusPlan(page);
  await page.goto('/');
  await page.getByTestId('search-button').click();
  await page.getByRole('searchbox').pressSequentially('hei');
  // A1 rows are free-tier, so the redirect to /plus can't interfere.
  const row = page.getByRole('option').filter({ hasText: 'A1' }).first();
  await expect(row).toBeVisible({ timeout: 10000 });
  await row.click();
  await page.waitForURL(/[?&]id=w-\d{6}/, { timeout: 10000 });
  expect(page.url()).toMatch(/[?&]word=/);
  // The deck built for the deep link is not empty.
  await expect(page.getByText(/^\d+\/\d+$/)).toBeVisible({ timeout: 10000 });
});

test('the two senses of `gang (en)` are separate results with different ids', async ({ page }) => {
  test.setTimeout(60000);
  const ids = new Set<string>();
  await injectPlusPlan(page);

  for (const index of [0, 1]) {
    await page.goto('/');
    await page.getByTestId('search-button').click();
    await page.getByRole('searchbox').pressSequentially('gang');
    // Anchor to the start of the row: a plain substring would also match
    // compounds such as `inngang (en)` / `utgang (en)`.
    const rows = page.getByRole('option').filter({ hasText: /^\s*gang \(en\)/ });
    await expect(rows).toHaveCount(2, { timeout: 10000 });
    await rows.nth(index).click();
    await page.waitForURL(/[?&]id=w-\d{6}/, { timeout: 10000 });
    ids.add(new URL(page.url()).searchParams.get('id') ?? '');
  }

  expect(ids.size).toBe(2);
});
