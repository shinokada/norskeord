import { expect, test, type Page } from '@playwright/test';

// ai-docs/implementation/cloze-quiz.md, Phase 5: the Sentences section of the Quiz tab on
// /my-progress. Guest/free path only (localStorage): the Plus path reads cloze_progress from
// Supabase and is covered by the unit tests of quiz-stats.ts and cloze-stats.ts.

// w-000001 is "hei", A1 greetings vocab. Ids that resolve nowhere are not counted.
const WORD_ID = 'w-000001';
const CLOZE_KEY = `cloze-stats-${WORD_ID}`;
const WORDS_KEY = `quiz-stats-${WORD_ID}`;
const PROGRESS_KEY = `progress-${WORD_ID}`;

const stat = (attempts: number, correct: number) =>
  JSON.stringify({ attempts, correct, lastAttempt: new Date().toISOString() });

// An FSRS progress entry, only so the page renders past the empty state.
const PROGRESS_VALUE = JSON.stringify({
  fsrs: {
    due: new Date(Date.now() + 86_400_000).toISOString(),
    stability: 1,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 1,
    learning_steps: 0,
    reps: 1,
    lapses: 0,
    state: 2
  },
  seenCount: 1,
  lastSeen: new Date().toISOString(),
  level: 'A1',
  category: 'greetings'
});

async function seed(page: Page, entries: Record<string, string>) {
  await page.addInitScript((items) => {
    for (const [k, v] of Object.entries(items)) localStorage.setItem(k, v);
    // Start on A1 whatever the CEFR estimate says.
    localStorage.setItem('stats-active-level', 'A1');
  }, entries);
}

test.describe('/my-progress — Quiz tab, Sentences section', () => {
  test('shows an empty state, and every A1 bar at zero, when nothing was practised', async ({
    page
  }) => {
    await seed(page, { [PROGRESS_KEY]: PROGRESS_VALUE });
    await page.goto('/my-progress?tab=quiz');

    await expect(page.getByTestId('cloze-stats-empty')).toBeVisible();
    // The Words section keeps its own empty state.
    await expect(page.getByTestId('quiz-stats-empty')).toBeVisible();

    const row = page.getByTestId('cloze-row-vocab-greetings');
    await expect(row).toBeVisible();
    await expect(page.getByTestId('cloze-group-vocab')).toBeVisible();
    await expect(row.getByTestId('cloze-row-count')).toHaveText(/^\s*0 of \d+ sentences\s*$/);
    await expect(row.getByTestId('cloze-bar-mastered')).toHaveCount(0);
    await expect(row.getByTestId('cloze-bar-practiced')).toHaveCount(0);
  });

  test('shows counts and a partial bar after seeded Sentences stats, and leaves Words alone', async ({
    page
  }) => {
    await seed(page, {
      [PROGRESS_KEY]: PROGRESS_VALUE,
      [CLOZE_KEY]: stat(4, 3)
    });
    await page.goto('/my-progress?tab=quiz');

    await expect(page.getByTestId('cloze-stat-answered')).toHaveText('4');
    // Fewer than 10 answers: the accuracy is hidden, as for Words.
    await expect(page.getByTestId('cloze-stat-accuracy')).toHaveText('–');
    await expect(page.getByTestId('cloze-stat-words')).toHaveText('1');

    const row = page.getByTestId('cloze-row-vocab-greetings');
    await expect(row.getByTestId('cloze-row-count')).toHaveText(/^\s*1 of \d+ sentences\s*$/);
    // 3 correct out of 4 is mastered in context, so the bar has a mastered part but is not full.
    const mastered = row.getByTestId('cloze-bar-mastered');
    await expect(mastered).toHaveCount(1);
    await expect(mastered).not.toHaveAttribute('style', /width: 100%/);

    // Sentences answers never show up in the Words figures.
    await expect(page.getByTestId('quiz-stats-empty')).toBeVisible();
    await expect(page.getByTestId('quiz-stat-answered')).toHaveCount(0);
  });

  test('a word with fewer than 3 correct answers is practised, not mastered', async ({ page }) => {
    await seed(page, {
      [PROGRESS_KEY]: PROGRESS_VALUE,
      [CLOZE_KEY]: stat(2, 2)
    });
    await page.goto('/my-progress?tab=quiz');

    const row = page.getByTestId('cloze-row-vocab-greetings');
    await expect(row.getByTestId('cloze-row-count')).toHaveText(/^\s*1 of \d+ sentences\s*$/);
    await expect(row.getByTestId('cloze-bar-practiced')).toHaveCount(1);
    await expect(row.getByTestId('cloze-bar-mastered')).toHaveCount(0);
  });

  test('Words answers never show up in the Sentences section', async ({ page }) => {
    await seed(page, {
      [PROGRESS_KEY]: PROGRESS_VALUE,
      [WORDS_KEY]: stat(12, 9)
    });
    await page.goto('/my-progress?tab=quiz');

    await expect(page.getByTestId('quiz-stat-answered')).toHaveText('12');
    await expect(page.getByTestId('cloze-stats-empty')).toBeVisible();
    await expect(
      page.getByTestId('cloze-row-vocab-greetings').getByTestId('cloze-row-count')
    ).toHaveText(/^\s*0 of \d+ sentences\s*$/);
  });

  test('the practice links carry the mode, the level and the category', async ({ page }) => {
    await seed(page, { [PROGRESS_KEY]: PROGRESS_VALUE });
    await page.goto('/my-progress?tab=quiz');

    await expect(page.getByTestId('cloze-practice-link')).toHaveAttribute(
      'href',
      '/quiz?mode=sentences&level=A1'
    );
    await expect(page.getByTestId('cloze-row-vocab-greetings')).toHaveAttribute(
      'href',
      '/quiz?mode=sentences&level=A1&category=greetings'
    );
  });

  test('a learner who has only practised sentences still gets the tabs, not the empty state', async ({
    page
  }) => {
    await seed(page, { [CLOZE_KEY]: stat(3, 2) });
    await page.goto('/my-progress?tab=quiz');

    await expect(page.locator('#tab-quiz')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('cloze-stat-answered')).toHaveText('3');
  });

  test('a free user sees only free categories above A1, no A2 uttrykk, and the Plus upsell', async ({
    page
  }) => {
    await seed(page, { [PROGRESS_KEY]: PROGRESS_VALUE });
    await page.goto('/my-progress?tab=quiz');

    // A1 is free in full: no upsell.
    await expect(page.getByTestId('cloze-plus-upsell')).toHaveCount(0);

    await page.getByRole('tab', { name: 'A2', exact: true }).click();
    await expect(page.getByTestId('cloze-plus-upsell')).toBeVisible();
    await expect(page.getByTestId('cloze-row-vocab-money')).toBeVisible();
    await expect(page.getByTestId('cloze-row-vocab-animals')).toHaveCount(0);
    await expect(page.getByTestId('cloze-group-uttrykk')).toHaveCount(0);
  });

  test('?tab=quiz still opens the Quiz tab with both sections', async ({ page }) => {
    await seed(page, { [PROGRESS_KEY]: PROGRESS_VALUE });
    await page.goto('/my-progress?tab=quiz');

    await expect(page.locator('#tab-quiz')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('cloze-stats-section')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start quiz' })).toBeVisible();
  });
});
