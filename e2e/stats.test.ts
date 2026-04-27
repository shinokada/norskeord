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
    await page.addInitScript(
      ({ key, value }) => localStorage.setItem(key, value),
      { key: SEED_KEY, value: SEED_VALUE }
    );
    await page.goto('/stats');
  });

  // 3-A: free users never see the category table
  test('does not show per-category breakdown table', async ({ page }) => {
    await expect(page.getByRole('table')).not.toBeVisible();
  });

  // 3-A: free users see the Plus upsell card instead
  test('shows Plus upsell card with link to /plus', async ({ page }) => {
    await expect(
      page.getByText('Per-category breakdown is a Plus feature')
    ).toBeVisible();
    const upgradeLink = page.getByRole('link', { name: /upgrade to plus/i });
    await expect(upgradeLink).toBeVisible();
    await expect(upgradeLink).toHaveAttribute('href', '/plus');
  });

  // CEFR estimate is free for all users — must still be visible
  test('shows CEFR estimate section for free user', async ({ page }) => {
    await expect(page.getByText('Estimated CEFR Level')).toBeVisible();
  });
});
