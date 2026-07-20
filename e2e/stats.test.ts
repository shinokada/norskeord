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

test.describe('/stats page — free user (unauthenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Write the seed entry before the page loads so onMount picks it up
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
      key: SEED_KEY,
      value: SEED_VALUE
    });
    await page.goto('/stats');
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
    await expect(page.getByText('Per-category breakdown is a Plus feature')).toBeVisible();
    await expect(page.getByText('Per-theme breakdown is a Plus feature')).toBeVisible();
    const upgradeLinks = page.getByRole('link', { name: /upgrade to plus/i });
    await expect(upgradeLinks).toHaveCount(2);
    const hrefs = await upgradeLinks.evaluateAll((links) =>
      links.map((l) => l.getAttribute('href'))
    );
    expect(hrefs).toEqual(['/plus', '/plus']);
  });

  // CEFR estimate is free for all users — must still be visible
  test('shows CEFR estimate section for free user', async ({ page }) => {
    await expect(page.getByText('Estimated CEFR Level')).toBeVisible();
  });
});
