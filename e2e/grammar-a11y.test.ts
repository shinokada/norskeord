import { expect, test } from '@playwright/test';

/**
 * Accessibility pass on the grammar pages (grammar-update.md, Phase 8):
 * keyboard-operable tabs, an announced filter count, and real headings.
 *
 * Free/guest path only. The tab key mapping itself is unit-tested
 * (tabForKey in src/lib/grammar/topic-page.test.ts); these tests check the wiring.
 */
test.describe('topic tabs (keyboard)', () => {
  test('arrow keys move between Regel and Øv and keep one tab stop', async ({ page }) => {
    await page.goto('/grammar/personlige-pronomen?tab=rule');
    const rule = page.getByTestId('topic-tab-rule');
    const practice = page.getByTestId('topic-tab-practice');

    await expect(rule).toHaveAttribute('aria-selected', 'true', { timeout: 8000 });
    // Roving tabindex: only the selected tab is reachable with Tab.
    await expect(rule).toHaveAttribute('tabindex', '0');
    await expect(practice).toHaveAttribute('tabindex', '-1');

    await rule.focus();
    await page.keyboard.press('ArrowRight');
    await expect(practice).toHaveAttribute('aria-selected', 'true');
    await expect(practice).toBeFocused();
    await expect(practice).toHaveAttribute('tabindex', '0');
    await expect(rule).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('ArrowLeft');
    await expect(rule).toHaveAttribute('aria-selected', 'true');
    await expect(rule).toBeFocused();
  });

  test('Home and End jump to the first and last tab', async ({ page }) => {
    await page.goto('/grammar/personlige-pronomen?tab=rule');
    const rule = page.getByTestId('topic-tab-rule');
    await rule.focus();
    await page.keyboard.press('End');
    await expect(page.getByTestId('topic-tab-practice')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(rule).toBeFocused();
  });
});

test.describe('/grammar filters and headings', () => {
  test('the filter count is read out by a live region', async ({ page }) => {
    await page.goto('/grammar');
    const status = page.getByTestId('grammar-filter-status');
    await expect(status).toHaveAttribute('role', 'status', { timeout: 8000 });
    await expect(status).toHaveText('');

    await page.locator('input[type="search"]').fill('pronomen');
    await expect(status).toHaveText(/\d/);

    await page.getByRole('button', { name: 'A2', exact: true }).click();
    await expect(status).toHaveText(/\d/);
  });

  test('chapters are h3 headings under their Part h2, with a single h1', async ({ page }) => {
    await page.goto('/grammar');
    await expect(page.getByTestId('chapter-card').first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

    const titles = page.getByTestId('chapter-title');
    expect(await titles.count()).toBeGreaterThan(0);
    const tags = await titles.evaluateAll((els) => els.map((el) => el.tagName));
    expect(new Set(tags)).toEqual(new Set(['H3']));
  });

  test('search results are h2 headings (no heading level is skipped)', async ({ page }) => {
    await page.goto('/grammar');
    await page.locator('input[type="search"]').fill('pronomen');
    const titles = page.getByTestId('topic-title');
    await expect(titles.first()).toBeVisible({ timeout: 8000 });
    const tags = await titles.evaluateAll((els) => els.map((el) => el.tagName));
    expect(new Set(tags)).toEqual(new Set(['H2']));
  });

  test('topics on a chapter page are h3 headings under the section h2', async ({ page }) => {
    await page.goto('/grammar/chapter/pronomen');
    const titles = page.getByTestId('topic-title');
    await expect(titles.first()).toBeVisible({ timeout: 8000 });
    const tags = await titles.evaluateAll((els) => els.map((el) => el.tagName));
    expect(new Set(tags)).toEqual(new Set(['H3']));
  });
});
