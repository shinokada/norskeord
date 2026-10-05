import { expect, test } from '@playwright/test';

// Seed one progress entry so the stats page renders past the empty state.
// The exact FSRS shape doesn't matter — we only need totalSeen > 0.
const SEED_KEY = 'progress-hei';
const SEED_VALUE = JSON.stringify({
  fsrs: {
    due: new Date(Date.now() + 86_400_000).toISOString(), // due tomorrow
    stability: 1,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 1,
    learning_steps: 0,
    reps: 1,
    lapses: 0,
    state: 2 // Review
  },
  seenCount: 1,
  lastSeen: new Date().toISOString(),
  level: 'A1',
  category: 'greetings'
});

test.describe('/my-progress page — free user (unauthenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Write the seed entry before the page loads so onMount picks it up
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
      key: SEED_KEY,
      value: SEED_VALUE
    });
    await page.goto('/my-progress');
  });

  // 3-A: free users never see the category table
  test('does not show per-category breakdown table', async ({ page }) => {
    await expect(page.getByRole('table')).not.toBeVisible();
  });

  // 3-A: free users see the Plus upsell cards instead — one for
  // Vocabulary's "By Category" breakdown, one for Uttrykk's "By Theme"
  // breakdown (stats-page-improvement.md Phase 6 split the page into these
  // two sections after this test was originally written for a single
  // blended card — both reuse the same "Upgrade to Plus →" label, so a free
  // user legitimately sees two matching links, not one).
  test('shows Plus upsell cards with links to /plus', async ({ page }) => {
    // my-progress-update.md: one panel at a time, so each upsell shows on its own tab.
    await expect(page.getByText('Per-category breakdown is a Plus feature')).toBeVisible();
    await expect(page.getByRole('link', { name: /upgrade to plus/i })).toHaveCount(1);
    await page.goto('/my-progress?tab=uttrykk');
    await expect(page.getByText('Per-theme breakdown is a Plus feature')).toBeVisible();
    const upgradeLinks = page.getByRole('link', { name: /upgrade to plus/i });
    await expect(upgradeLinks).toHaveCount(1);
    const hrefs = await upgradeLinks.evaluateAll((links) =>
      links.map((l) => l.getAttribute('href'))
    );
    expect(hrefs).toEqual(['/plus']);
  });

  // CEFR estimate is free for all users — must still be visible
  test('shows CEFR estimate section for free user', async ({ page }) => {
    await expect(page.getByText('Estimated CEFR Level')).toBeVisible();
  });
});

// my-progress-update.md: the three hub cards are the content-type tabs. Other
// tests open a tab through ?tab=; these click the cards, so the click handler,
// the URL update (replaceState) and the localStorage write/restore are covered.
// Cards only render after onMount, so a click can't land before hydration.
test.describe('/my-progress page — content-type tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
      key: SEED_KEY,
      value: SEED_VALUE
    });
  });

  test('clicking a card switches the panel, updates the URL and survives a reload', async ({
    page
  }) => {
    await page.goto('/my-progress');
    const vocabTab = page.locator('#tab-vocab');
    const grammarTab = page.locator('#tab-grammar');
    // The "All grammar topics" link is only in the panel header on the Grammar tab.
    const grammarLink = page.locator('a[href="/my-progress/grammar"]');

    await expect(vocabTab).toHaveAttribute('aria-selected', 'true');
    await expect(grammarLink).toHaveCount(0);

    await grammarTab.click();
    await expect(grammarTab).toHaveAttribute('aria-selected', 'true');
    await expect(vocabTab).toHaveAttribute('aria-selected', 'false');
    await expect(grammarLink).toBeVisible();
    await expect(page).toHaveURL(/[?&]tab=grammar(&|$)/);

    // Reload keeps the tab through the ?tab= param.
    await page.reload();
    await expect(page.locator('#tab-grammar')).toHaveAttribute('aria-selected', 'true');
    await expect(grammarLink).toBeVisible();
  });

  test('falls back to the last-used tab from localStorage when the URL has no ?tab=', async ({
    page
  }) => {
    await page.goto('/my-progress');
    await page.locator('#tab-uttrykk').click();
    await expect(page.locator('#tab-uttrykk')).toHaveAttribute('aria-selected', 'true');

    // A fresh visit with no ?tab= param restores the tab saved by the click.
    await page.goto('/my-progress');
    await expect(page.locator('#tab-uttrykk')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#tab-vocab')).toHaveAttribute('aria-selected', 'false');
  });

  test('exposes a labelled tablist with a roving tabindex', async ({ page }) => {
    await page.goto('/my-progress');
    await expect(page.getByRole('tablist', { name: 'Content type' })).toBeVisible();
    // Only the active tab is a Tab stop (ARIA tabs pattern).
    await expect(page.locator('#tab-vocab')).toHaveAttribute('tabindex', '0');
    await expect(page.locator('#tab-uttrykk')).toHaveAttribute('tabindex', '-1');
    await expect(page.locator('#tab-grammar')).toHaveAttribute('tabindex', '-1');
  });

  test('arrow keys, Home and End move selection and focus between the cards', async ({ page }) => {
    await page.goto('/my-progress');
    const vocab = page.locator('#tab-vocab');
    const uttrykk = page.locator('#tab-uttrykk');
    const grammar = page.locator('#tab-grammar');

    await vocab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(uttrykk).toBeFocused();
    await expect(uttrykk).toHaveAttribute('aria-selected', 'true');
    await expect(uttrykk).toHaveAttribute('tabindex', '0');
    await expect(vocab).toHaveAttribute('tabindex', '-1');

    await page.keyboard.press('End');
    await expect(grammar).toBeFocused();
    await expect(grammar).toHaveAttribute('aria-selected', 'true');
    // The panel followed the selection: the grammar-only link is now shown.
    await expect(page.locator('a[href="/my-progress/grammar"]')).toBeVisible();

    // Right wraps from the last tab to the first, Left wraps back.
    await page.keyboard.press('ArrowRight');
    await expect(vocab).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(grammar).toBeFocused();

    await page.keyboard.press('Home');
    await expect(vocab).toBeFocused();
    await expect(vocab).toHaveAttribute('aria-selected', 'true');
  });

  test('ignores an invalid ?tab= and uses the default', async ({ page }) => {
    await page.goto('/my-progress?tab=foo');
    await expect(page.locator('#tab-vocab')).toHaveAttribute('aria-selected', 'true');
  });
});
