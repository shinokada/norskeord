import { expect, test, type Page } from '@playwright/test';

// ai-docs/implementation/cloze-quiz.md, Phase 4: the Sentences mode on /quiz.
//
// Most tests answer a mocked one-question payload for POST /api/quiz-entries, so the
// grading, the writes and the reveal text do not depend on which entry the server picks.
// The server side (plan gate, payload shape) is covered by the unit tests; one test here
// uses the real endpoint to prove the two ends agree.

const ENTRY = {
  id: 'w-e2e-selge',
  norsk: 'å selge',
  english: 'to sell',
  example: 'De selger frukt her.',
  example_english: 'They sell fruit here.',
  level: 'A1',
  category: 'greetings',
  part: 'verb'
};
const ITEM = { before: 'De ', answer: 'selger', after: ' frukt her.' };

const REVEAL_NEXT = /next|see results|neste|se resultater/i;

async function mockSentencePayload(page: Page) {
  await page.route('**/api/quiz-entries', async (route) => {
    const body = route.request().postDataJSON() as { mode?: string };
    if (body.mode !== 'sentences') return route.continue();
    return route.fulfill({
      json: { entries: [ENTRY], cloze: { [ENTRY.id]: ITEM } }
    });
  });
}

async function startSentences(page: Page) {
  await page.goto('/quiz');
  await page.getByTestId('quiz-mode-sentences').click();
  await page.getByRole('button', { name: /greetings/i }).click();
  await page.getByRole('button', { name: /start quiz/i }).click();
  await expect(page.getByTestId('cloze-input')).toBeVisible({ timeout: 10000 });
}

async function readJson(page: Page, key: string): Promise<Record<string, unknown> | null> {
  const raw = await page.evaluate((k) => localStorage.getItem(k), key);
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
}

async function localKeys(page: Page): Promise<string[]> {
  return page.evaluate(() => Object.keys(localStorage));
}

async function answer(page: Page, typed: string) {
  await page.getByTestId('cloze-input').fill(typed);
  await page.getByTestId('cloze-input').press('Enter');
  await expect(page.locator('button.bg-indigo-600').filter({ hasText: REVEAL_NEXT })).toBeVisible();
}

// ===========================================================================
// The mode switch
// ===========================================================================

test('Words is selected by default, and the choice is a radiogroup', async ({ page }) => {
  await page.goto('/quiz');
  const group = page.getByTestId('quiz-mode');
  await expect(group).toHaveAttribute('role', 'radiogroup');
  await expect(page.getByTestId('quiz-mode-words')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('quiz-mode-sentences')).toHaveAttribute('aria-checked', 'false');
});

test('arrow keys move between Words and Sentences, and the choice is remembered', async ({
  page
}) => {
  await page.goto('/quiz');
  await page.getByTestId('quiz-mode-words').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('quiz-mode-sentences')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('quiz-mode-sentences')).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('quiz-mode'))).toBe('sentences');

  await page.reload();
  await expect(page.getByTestId('quiz-mode-sentences')).toHaveAttribute('aria-checked', 'true');

  await page.getByTestId('quiz-mode-sentences').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByTestId('quiz-mode-words')).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => localStorage.getItem('quiz-mode'))).toBe('words');
});

test('?mode=sentences opens in Sentences, and an explicit ?mode= beats the saved choice', async ({
  page
}) => {
  await page.goto('/quiz?mode=sentences');
  await expect(page.getByTestId('quiz-mode-sentences')).toHaveAttribute('aria-checked', 'true');

  await page.evaluate(() => localStorage.setItem('quiz-mode', 'sentences'));
  await page.goto('/quiz?mode=words');
  await expect(page.getByTestId('quiz-mode-words')).toHaveAttribute('aria-checked', 'true');

  // An unknown value means Words.
  await page.goto('/quiz?mode=cloze');
  await expect(page.getByTestId('quiz-mode-words')).toHaveAttribute('aria-checked', 'true');
});

test('a free user in Sentences mode sees the Plus upsell above A1 and cannot start without a category', async ({
  page
}) => {
  await page.goto('/quiz');
  await page.getByTestId('quiz-mode-sentences').click();
  await page.locator('select#quiz-level').selectOption('A2');
  await expect(page.getByRole('link', { name: /with Plus/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /start quiz/i })).toBeDisabled();
});

// ===========================================================================
// A Sentences question
// ===========================================================================

test('a Sentences question shows the sentence with an input, and both hints', async ({ page }) => {
  await mockSentencePayload(page);
  await startSentences(page);

  await expect(page.getByTestId('cloze-sentence')).toContainText('De');
  await expect(page.getByTestId('cloze-sentence')).toContainText('frukt her.');
  await expect(page.getByTestId('cloze-sentence-hint')).toHaveText('They sell fruit here.');
  await expect(page.getByTestId('cloze-word-hint')).toHaveText('to sell');
  // The base form must not be given away.
  await expect(page.getByTestId('cloze-sentence')).not.toContainText('selge');
  await expect(page.getByTestId('cloze-word-hint')).not.toContainText('selge');
});

test('the exact form is correct, writes progress- and cloze-stats- keys, and not quiz-stats-', async ({
  page
}) => {
  await mockSentencePayload(page);
  await startSentences(page);
  await answer(page, 'selger');

  await expect(page.getByTestId('cloze-highlight')).toHaveText('selger');
  // "Mark as easy" is hidden in Sentences mode.
  await expect(page.getByRole('button', { name: /mark as easy|merk som lett/i })).toHaveCount(0);

  const keys = await localKeys(page);
  expect(keys).toContain(`progress-${ENTRY.id}`);
  expect(keys).toContain(`cloze-stats-${ENTRY.id}`);
  expect(keys.some((k) => k.startsWith('quiz-stats-'))).toBe(false);

  expect(await readJson(page, `cloze-stats-${ENTRY.id}`)).toMatchObject({
    attempts: 1,
    correct: 1
  });
  expect(await readJson(page, `progress-${ENTRY.id}`)).toMatchObject({ lastRating: 'good' });
});

test('the base form is "right word, wrong form": rated hard, counted incorrect', async ({
  page
}) => {
  await mockSentencePayload(page);
  await startSentences(page);
  await answer(page, 'selge');

  await expect(page.getByText(/right word, wrong form|riktig ord, feil form/i)).toBeVisible();
  await expect(page.getByTestId('cloze-answer')).toHaveText('selger');

  expect(await readJson(page, `cloze-stats-${ENTRY.id}`)).toMatchObject({
    attempts: 1,
    correct: 0
  });
  expect(await readJson(page, `progress-${ENTRY.id}`)).toMatchObject({ lastRating: 'hard' });
});

test('a one-letter slip is wrong: rated again, counted incorrect, and the answer is shown', async ({
  page
}) => {
  await mockSentencePayload(page);
  await startSentences(page);
  await answer(page, 'selgr');

  // There is no typo rule: only the exact form counts.
  await expect(page.getByText(/check the spelling|sjekk stavemåten/i)).toHaveCount(0);
  await expect(page.getByTestId('cloze-answer')).toHaveText('selger');

  expect(await readJson(page, `cloze-stats-${ENTRY.id}`)).toMatchObject({
    attempts: 1,
    correct: 0
  });
  expect(await readJson(page, `progress-${ENTRY.id}`)).toMatchObject({ lastRating: 'again' });
});

test('a wrong word is rated again, counted incorrect, and the answer is revealed', async ({
  page
}) => {
  await mockSentencePayload(page);
  await startSentences(page);
  await answer(page, 'kjøper');

  await expect(page.getByTestId('cloze-answer')).toHaveText('selger');
  expect(await readJson(page, `cloze-stats-${ENTRY.id}`)).toMatchObject({
    attempts: 1,
    correct: 0
  });
  expect(await readJson(page, `progress-${ENTRY.id}`)).toMatchObject({ lastRating: 'again' });
});

test('Skip counts as a wrong answer', async ({ page }) => {
  await mockSentencePayload(page);
  await startSentences(page);
  await page.getByRole('button', { name: /skip|hopp over/i }).click();

  await expect(page.getByTestId('cloze-answer')).toHaveText('selger');
  expect(await readJson(page, `cloze-stats-${ENTRY.id}`)).toMatchObject({
    attempts: 1,
    correct: 0
  });
});

test('the summary labels a Sentences answer and links to the Quiz tab', async ({ page }) => {
  await mockSentencePayload(page);
  await startSentences(page);
  await answer(page, 'selger');
  await page.locator('button.bg-indigo-600').filter({ hasText: REVEAL_NEXT }).click();

  await expect(page.getByText(/session complete|økt fullført/i)).toBeVisible();
  await expect(page.getByText(/^\s*sentence\s*$|^\s*setning\s*$/i)).toBeVisible();
  await expect(page.getByTestId('quiz-view-progress')).toHaveAttribute(
    'href',
    '/my-progress?tab=quiz'
  );
  // The picker for the next session still offers the mode switch.
  await expect(page.getByTestId('quiz-mode')).toBeVisible();
});

test('a Sentences answer does not touch the Words stats', async ({ page }) => {
  await mockSentencePayload(page);
  await startSentences(page);
  await answer(page, 'selger');
  expect((await localKeys(page)).filter((k) => k.startsWith('quiz-stats-'))).toEqual([]);
});

// ===========================================================================
// The real endpoint, end to end
// ===========================================================================

test('a free user can complete a Sentences answer against the real endpoint', async ({ page }) => {
  test.setTimeout(30000);
  await page.goto('/quiz');
  await page.getByTestId('quiz-mode-sentences').click();
  await page.getByRole('button', { name: /greetings/i }).click();
  await page.getByRole('button', { name: /start quiz/i }).click();

  await expect(page.getByTestId('cloze-input')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('cloze-word-hint')).not.toBeEmpty();

  // Whatever the question is, a skip must reveal its answer and write both keys.
  await page.getByRole('button', { name: /skip|hopp over/i }).click();
  await expect(page.getByTestId('cloze-answer')).not.toBeEmpty();

  const keys = await localKeys(page);
  expect(keys.some((k) => k.startsWith('progress-'))).toBe(true);
  expect(keys.some((k) => k.startsWith('cloze-stats-'))).toBe(true);
  expect(keys.some((k) => k.startsWith('quiz-stats-'))).toBe(false);
});
