import { expect, test, type Page } from '@playwright/test';

/**
 * ai-docs/implementation/due-only.md — Step 5 (verification).
 *
 * Free/guest path only — localStorage is trivial to seed with
 * page.addInitScript (same pattern as e2e/stats.test.ts). The Plus path
 * (loadProgressMapFromSupabase + the per-category due badges in
 * LevelStatRows.svelte) isn't testable here for the same reason two tests
 * in e2e/flashcard.test.ts are `.fixme`: injectPlusPlan() only patches
 * page.data.plan client-side, there's no seeded Plus account with real
 * card_progress rows to query.
 *
 * The seeded entry below is a real production vocab-a1.json entry
 * ("uthus", id v-a1-home-034, category "home") so /api/review-entries
 * resolves it against actual data rather than a fixture that only exists
 * in the test.
 */
const DUE_ID = 'v-a1-home-034';
const SEED_KEY = `progress-${DUE_ID}`;

function seedValue(due: Date) {
  return JSON.stringify({
    fsrs: {
      due: due.toISOString(),
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
    category: 'home'
  });
}

const DUE_YESTERDAY = seedValue(new Date(Date.now() - 86_400_000));
const DUE_TOMORROW = seedValue(new Date(Date.now() + 86_400_000));

async function seed(page: Page, value: string) {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
    key: SEED_KEY,
    value
  });
}

test.describe('/review', () => {
  test('shows the empty state when nothing is due', async ({ page }) => {
    // No seed at all — a fresh guest has no progress rows, so getDueItems()
    // returns []. ?type=vocab skips the picker so this reaches the empty
    // state directly rather than stopping at the picker screen.
    await page.goto('/review?type=vocab');
    await expect(page.getByText('Nothing due right now')).toBeVisible();
  });

  test('shows the picker when arriving with no ?type= or ?category=', async ({ page }) => {
    // Global and per-level entry points both link here without ?type= —
    // the person picks Vocabulary / Uttrykk / Both before anything loads.
    await page.goto('/review');
    await expect(page.getByRole('heading', { name: 'What do you want to review?' })).toBeVisible();
    await expect(page.getByRole('button', { name: /vocabulary/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /uttrykk/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Both' })).toBeVisible();
  });

  test('resolves and renders a due card end to end', async ({ page }) => {
    await seed(page, DUE_YESTERDAY);
    await page.goto('/review?type=vocab');

    // Exercises getDueItems() -> POST /api/review-entries -> VocabFlashcardPage
    // for real — a 1-card deck built entirely from the seeded progress row.
    await expect(page.getByText(/^\d+\/\d+$/)).toBeVisible({ timeout: 10000 });

    const flipCard = page.getByRole('button', { name: /flashcard showing question/i });
    await expect(flipCard).toBeVisible();
    await flipCard.click({ force: true });
    await expect(page.getByRole('button', { name: /again/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /good/i })).toBeVisible();
  });
});

test.describe('/stats — Study due entry points (Step 4a/4b)', () => {
  test('shows the global "Study due now" banner linking to /review when something is due', async ({
    page
  }) => {
    await seed(page, DUE_YESTERDAY);
    await page.goto('/stats');
    const banner = page.getByRole('link', { name: /study due now/i });
    await expect(banner).toBeVisible();
    await expect(banner).toHaveAttribute('href', '/review');
  });

  test('hides the global banner when nothing is currently due', async ({ page }) => {
    // Due tomorrow, not today — totalSeen > 0 but totalDueToday === 0, so
    // the banner should stay hidden even though there's reviewed content.
    await seed(page, DUE_TOMORROW);
    await page.goto('/stats');
    await expect(page.getByRole('link', { name: /study due now/i })).not.toBeVisible();
  });

  test('shows the per-level "Study due at A1" link scoped to /review?level=a1', async ({
    page
  }) => {
    await seed(page, DUE_YESTERDAY);
    await page.goto('/stats');
    // activeLevel's initial value depends on the CEFR estimate text, which
    // isn't worth pinning down here — select A1 explicitly so the test only
    // depends on what it's actually checking.
    await page.getByRole('tab', { name: 'A1', exact: true }).click();
    const levelBanner = page.getByRole('link', { name: /study due at a1/i });
    await expect(levelBanner).toBeVisible();
    await expect(levelBanner).toHaveAttribute('href', '/review?level=a1');
  });
});
