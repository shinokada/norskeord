import { expect, test, type Page } from '@playwright/test';

/**
 * The A1 «Start here» path on /grammar (grammar-update.md, Phase 8).
 *
 * Free/guest path only: localStorage is seeded with page.addInitScript, the same
 * pattern as e2e/my-progress-grammar.test.ts. The path itself is curated in
 * src/lib/grammar/start-path.ts; the order below must match START_HERE_A1.
 *
 * The seeded question is a real production A1 grammar question:
 *   gq-perspron-001  topic personlige-pronomen (the first step)
 */
const PATH = [
  'personlige-pronomen',
  'presens-verb',
  'fortellende-setninger',
  'sporresetninger',
  'noun-articles',
  'substantiv-bestemt-form',
  'adj-agreement',
  'preteritum-a1'
];

const GRAMMAR_ID = 'gq-perspron-001';

function seedValue() {
  return JSON.stringify({
    fsrs: {
      due: new Date(Date.now() + 86_400_000).toISOString(),
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
    category: 'personlige-pronomen'
  });
}

async function seed(page: Page) {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
    key: `grammar-${GRAMMAR_ID}`,
    value: seedValue()
  });
}

test.describe('/grammar «Start here»', () => {
  test('shows the A1 path in teaching order for a new learner', async ({ page }) => {
    await page.goto('/grammar');
    const steps = page.getByTestId('grammar-start-step');
    await expect(steps).toHaveCount(PATH.length, { timeout: 8000 });

    const hrefs = await steps.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    expect(hrefs).toEqual(PATH.map((topic) => `/grammar/${topic}?level=A1`));

    await expect(steps.first()).toHaveAttribute('data-state', 'next');
    await expect(steps.nth(1)).toHaveAttribute('data-state', 'todo');
    await expect(page.getByTestId('grammar-start-summary')).toContainText('0 of 8');
  });

  test('shows practised A1 questions on the step that has them', async ({ page }) => {
    await seed(page);
    await page.goto('/grammar');
    const first = page.getByTestId('grammar-start-step').first();
    await expect(first).toContainText('1 of 8', { timeout: 8000 });
    // One question is not enough to finish the step.
    await expect(first).toHaveAttribute('data-state', 'next');
  });

  test('shows the English gloss under each step in the English UI', async ({ page }) => {
    await page.goto('/grammar');
    const glosses = page.getByTestId('grammar-start-gloss');
    await expect(glosses).toHaveCount(PATH.length, { timeout: 8000 });
    await expect(glosses.first()).toContainText('Personal pronouns');
  });

  test('shows the English gloss on topic cards of a chapter page', async ({ page }) => {
    await page.goto('/grammar/chapter/pronomen');
    await expect(page.getByTestId('topic-gloss').first()).toBeVisible({ timeout: 8000 });
    await expect(
      page.getByTestId('topic-title').filter({ hasText: 'Personlige pronomen' }).first()
    ).toBeVisible();
  });

  test('a step opens its topic page scoped to A1', async ({ page }) => {
    await page.goto('/grammar');
    await page.getByTestId('grammar-start-step').first().click();
    await expect(page).toHaveURL(/\/grammar\/personlige-pronomen\?level=A1/);
  });

  test('is hidden while a level chip is active', async ({ page }) => {
    await page.goto('/grammar');
    await expect(page.getByTestId('grammar-start-here')).toBeVisible({ timeout: 8000 });
    await page.getByRole('button', { name: 'A2', exact: true }).click();
    await expect(page.getByTestId('grammar-start-here')).toHaveCount(0);
    // Switching the chip off brings it back.
    await page.getByRole('button', { name: 'A2', exact: true }).click();
    await expect(page.getByTestId('grammar-start-here')).toBeVisible();
  });

  test('is hidden while searching', async ({ page }) => {
    await page.goto('/grammar');
    await expect(page.getByTestId('grammar-start-here')).toBeVisible({ timeout: 8000 });
    await page.locator('input[type="search"]').fill('pronomen');
    await expect(page.getByTestId('grammar-start-here')).toHaveCount(0);
  });
});
