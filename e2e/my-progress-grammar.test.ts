import { expect, test, type Page } from '@playwright/test';

/**
 * /my-progress/grammar and /review/grammar?chapter= (grammar-update.md, Phase 7).
 *
 * Free/guest path only: localStorage is seeded with page.addInitScript, the same
 * pattern as e2e/review.test.ts. The Plus path (Supabase) can't be seeded here.
 *
 * The seeded question is a real production A1 grammar question:
 *   gq-perspron-001  topic personlige-pronomen  chapter 8 "Pronomen" (slug pronomen)
 */
const GRAMMAR_ID = 'gq-perspron-001';
const SEED_KEY = `grammar-${GRAMMAR_ID}`;

function seedValue(due: Date, lapses = 0) {
  return JSON.stringify({
    fsrs: {
      due: due.toISOString(),
      stability: 1,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 1,
      learning_steps: 0,
      reps: 1,
      lapses,
      state: 2 // Review
    },
    seenCount: 1,
    lastSeen: new Date().toISOString(),
    level: 'A1',
    category: 'personlige-pronomen'
  });
}

const DUE_YESTERDAY = seedValue(new Date(Date.now() - 86_400_000));
const DUE_TOMORROW = seedValue(new Date(Date.now() + 86_400_000));
const DUE_YESTERDAY_WITH_LAPSES = seedValue(new Date(Date.now() - 86_400_000), 2);

async function seed(page: Page, value: string) {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
    key: SEED_KEY,
    value
  });
}

test.describe('/my-progress/grammar', () => {
  test('shows the empty state for a learner who has not practised grammar', async ({ page }) => {
    await page.goto('/my-progress/grammar');
    const empty = page.getByTestId('grammar-progress-empty');
    await expect(empty).toBeVisible({ timeout: 8000 });
    await expect(empty.locator('a[href="/grammar"]')).toBeVisible();
    await expect(page.getByTestId('grammar-progress-review')).toHaveCount(0);
  });

  test('links back to /my-progress', async ({ page }) => {
    await page.goto('/my-progress/grammar');
    await expect(page.getByTestId('grammar-progress-back')).toHaveAttribute(
      'href',
      '/my-progress',
      { timeout: 8000 }
    );
  });

  test('shows a review button and due counts per chapter', async ({ page }) => {
    await seed(page, DUE_YESTERDAY);
    await page.goto('/my-progress/grammar');

    await expect(page.getByTestId('grammar-progress-review')).toHaveAttribute(
      'href',
      '/review/grammar',
      { timeout: 8000 }
    );
    const chapters = page.getByTestId('grammar-progress-due-chapter');
    await expect(chapters).toHaveCount(1);
    await expect(chapters.first()).toHaveAttribute('href', '/review/grammar?chapter=pronomen');
    await expect(chapters.first()).toContainText('Pronomen');
  });

  test('hides the review button and says so when nothing is due', async ({ page }) => {
    await seed(page, DUE_TOMORROW);
    await page.goto('/my-progress/grammar');
    await expect(page.getByTestId('grammar-progress-nothing-due')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('grammar-progress-review')).toHaveCount(0);
    await expect(page.getByTestId('grammar-progress-due-chapter')).toHaveCount(0);
  });

  test('says there is not enough practice to estimate a level yet', async ({ page }) => {
    await seed(page, DUE_YESTERDAY);
    await page.goto('/my-progress/grammar');
    await expect(page.getByTestId('grammar-progress-estimate')).toContainText(
      /not enough practice|ikke nok øving/i,
      { timeout: 8000 }
    );
    // A1 has questions, so it gets a row.
    await expect(
      page.getByTestId('grammar-progress-level-row').filter({ hasText: 'A1' })
    ).toBeVisible();
  });

  test('lists a topic with lapses as a weak spot, with a review link when it is due', async ({
    page
  }) => {
    await seed(page, DUE_YESTERDAY_WITH_LAPSES);
    await page.goto('/my-progress/grammar');
    const weak = page.getByTestId('grammar-progress-weak');
    await expect(weak.getByTestId('grammar-progress-weak-topic')).toHaveAttribute(
      'href',
      '/grammar/personlige-pronomen',
      { timeout: 8000 }
    );
    await expect(weak.locator('a[href="/review/grammar?topic=personlige-pronomen"]')).toBeVisible();
  });

  test('has no weak spots for a topic without lapses', async ({ page }) => {
    await seed(page, DUE_YESTERDAY);
    await page.goto('/my-progress/grammar');
    await expect(page.getByTestId('grammar-progress-weak')).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('grammar-progress-weak-topic')).toHaveCount(0);
  });

  test('shows progress by chapter in book order and links each topic to its rule', async ({
    page
  }) => {
    await seed(page, DUE_YESTERDAY);
    await page.goto('/my-progress/grammar');

    const book = page.getByTestId('grammar-progress-book');
    await expect(book).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('grammar-progress-part').first()).toBeVisible();

    // The chapter that holds the seeded topic; its topic rows are inside a
    // collapsed <details>, so open it first.
    const chapter = page.getByTestId('grammar-progress-chapter').filter({
      has: page.locator('a[href="/grammar/personlige-pronomen"]')
    });
    await chapter.locator('summary').first().click();
    await expect(chapter.locator('a[href="/grammar/personlige-pronomen"]')).toBeVisible();
  });

  test('is linked from the Grammar card on /my-progress', async ({ page }) => {
    await seed(page, DUE_YESTERDAY);
    await page.goto('/my-progress');
    await expect(page.locator('a[href="/my-progress/grammar"]')).toBeVisible({ timeout: 8000 });
  });
});

test.describe('/review/grammar?chapter=', () => {
  test('reviews only the due cards in that chapter', async ({ page }) => {
    await seed(page, DUE_YESTERDAY);
    await page.goto('/review/grammar?chapter=pronomen');
    await expect(page.getByText('Question 1 of 1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Petter bor i Bergen.')).toBeVisible();
  });

  test('shows the empty state when nothing is due in that chapter', async ({ page }) => {
    await seed(page, DUE_YESTERDAY);
    // The seeded question belongs to chapter 8 (pronomen), not chapter 7 (substantiv).
    await page.goto('/review/grammar?chapter=substantiv');
    await expect(page.getByText('No questions available for this topic yet.')).toBeVisible({
      timeout: 10000
    });
  });

  test('shows the empty state for an unknown chapter instead of reviewing everything', async ({
    page
  }) => {
    await seed(page, DUE_YESTERDAY);
    await page.goto('/review/grammar?chapter=does-not-exist');
    await expect(page.getByText('No questions available for this topic yet.')).toBeVisible({
      timeout: 10000
    });
  });

  test('combines with ?level=', async ({ page }) => {
    await seed(page, DUE_YESTERDAY);
    // Right chapter, wrong level: the seeded question is A1.
    await page.goto('/review/grammar?chapter=pronomen&level=a2');
    await expect(page.getByText('No questions available for this topic yet.')).toBeVisible({
      timeout: 10000
    });
  });
});
