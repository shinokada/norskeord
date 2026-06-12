import { expect, test } from '@playwright/test';
import { injectPlusPlan } from './helpers.js';

// ---------------------------------------------------------------------------
// Helper: answer one question regardless of type, then click Next
// ---------------------------------------------------------------------------
async function answerAndAdvance(page: Page) {
  // Wait for either the questioning state OR the summary to be visible.
  // This prevents the helper racing ahead when the UI is transitioning.
  await Promise.race([
    page.getByText(/question \d+ of|spørsmål \d+ av/i).waitFor({ state: 'visible', timeout: 8000 }),
    page.getByText(/session complete|økt fullført/i).waitFor({ state: 'visible', timeout: 8000 })
  ]).catch(() => {});

  // If we already reached the summary, nothing left to do.
  if (
    await page
      .getByText(/session complete|økt fullført/i)
      .isVisible({ timeout: 300 })
      .catch(() => false)
  ) {
    return;
  }

  const optionA = page.getByRole('button', { name: /^A\b/ });
  const input = page.getByRole('textbox');

  if (await optionA.isVisible({ timeout: 3000 }).catch(() => false)) {
    await optionA.click();
  } else if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
    await input.fill('test');
    await input.press('Enter');
  } else {
    // Neither visible — still transitioning; yield and let the loop retry.
    await page.waitForTimeout(500);
    return;
  }

  // After answering, wait for the Next / See results button then click it.
  // Scope to button.bg-indigo-600 to avoid matching the SpeakButton whose
  // aria-label may contain "neste" when a Norwegian word/phrase has that text.
  const next = page.locator('button.bg-indigo-600').filter({
    hasText: /next|see results|neste|se resultater/i
  });
  await next.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
  if (await next.isVisible({ timeout: 1000 }).catch(() => false)) {
    await next.click();
    // Brief pause so the UI leaves the revealing state before the next loop iteration.
    await page.waitForTimeout(300);
  }
}

// ---------------------------------------------------------------------------
// Helper: run a full session until "Session complete!" or the safety guard
// ---------------------------------------------------------------------------
async function completeSession(page: Page, maxQuestions = 20) {
  const safetyLimit = maxQuestions * 4; // 4× gives ample room for retries
  let iterations = 0;
  while (
    !(await page
      .getByText(/session complete|økt fullført/i)
      .isVisible({ timeout: 500 })
      .catch(() => false))
  ) {
    if (++iterations > safetyLimit) break;
    await answerAndAdvance(page);
  }
  // Ensure the summary is actually visible before returning.
  await page
    .getByText(/session complete|økt fullført/i)
    .waitFor({ state: 'visible', timeout: 10000 })
    .catch(() => {});
}

// ===========================================================================
// Gate tests
// ===========================================================================

test('free user can access /quiz and sees free category picker', async ({ page }) => {
  await page.goto('/quiz');
  // Page loads without redirecting
  await expect(page).toHaveURL('/quiz');
  // Level select defaults to A1
  await expect(page.locator('select#quiz-level')).toHaveValue('A1');
  // Free category pills are visible (e.g. Greetings, Numbers, Colors for A1)
  await expect(
    page.getByRole('button', { name: /greetings|numbers|colors/i }).first()
  ).toBeVisible();
  // Upsell link is visible
  await expect(page.getByRole('link', { name: /with Plus/i })).toBeVisible();
});

test('Plus user sees quiz start screen', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/quiz');
  await expect(page.getByRole('button', { name: /start quiz/i })).toBeVisible();
});

// ===========================================================================
// Full session
// ===========================================================================

test('Plus user can complete a quiz session and see summary', async ({ page }) => {
  test.setTimeout(60000);
  await injectPlusPlan(page);
  await page.goto('/quiz');
  await page.getByRole('button', { name: /start quiz/i }).click();

  await completeSession(page);

  await expect(page.getByText(/session complete|økt fullført/i)).toBeVisible();
  await expect(page.getByText(/of \d+ correct|av \d+ riktige/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /try again|prøv igjen/i })).toBeVisible();
});

// ===========================================================================
// FSRS / localStorage
// ===========================================================================

test('answering a question writes progress to localStorage', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/quiz');
  await page.getByRole('button', { name: /start quiz/i }).click();

  await answerAndAdvance(page);

  const keys = await page.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith('progress-'))
  );
  expect(keys.length).toBeGreaterThan(0);
});

// ===========================================================================
// Keyboard shortcuts
// ===========================================================================

test('keyboard shortcut A selects first MC option', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/quiz');
  await page.getByRole('button', { name: /start quiz/i }).click();

  // The first question (index 0, mod 4 === 0) is always MC
  const optionA = page.getByRole('button', { name: /^A\b/ });
  if (await optionA.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.keyboard.press('a');
    // Scope to button.bg-indigo-600 to avoid matching the SpeakButton whose
    // aria-label may contain "neste" when the current entry contains that text.
    await expect(
      page.locator('button.bg-indigo-600').filter({ hasText: /next|neste/i })
    ).toBeVisible();
  }
});

test('Space advances from reveal to next question', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/quiz');
  await page.getByRole('button', { name: /start quiz/i }).click();

  // Answer the first question to reach reveal state
  const optionA = page.getByRole('button', { name: /^A\b/ });
  const input = page.getByRole('textbox');
  if (await optionA.isVisible({ timeout: 2000 }).catch(() => false)) {
    await optionA.click();
  } else if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
    await input.fill('test');
    await input.press('Enter');
  }

  // Now in reveal state — press Space to advance.
  // Target the indigo navigation button specifically to avoid matching the
  // pronounce button whose aria-label also contains "neste" (nb).
  const nextBtn = page.locator('button.bg-indigo-600', { hasText: /next|neste/i });
  await expect(nextBtn).toBeVisible();
  await page.keyboard.press('Space');

  // Should now be on question 2 (en: 'Question 2 of', nb: 'Spørsmål 2 av')
  await expect(page.getByText(/question 2 of|spørsmål 2 av/i)).toBeVisible();
});

// ===========================================================================
// Restart from summary
// ===========================================================================

test('Try again from summary resets the session', async ({ page }) => {
  test.setTimeout(60000);
  await injectPlusPlan(page);
  await page.goto('/quiz');

  // Limit the session to 3 questions to keep this test fast — we're only
  // verifying the "Try again" reset behavior, not the full 10-question flow.
  await page.evaluate(() => localStorage.setItem('vocab-quiz-limit', '3'));
  await injectPlusPlan(page);
  await page.reload();

  await page.getByRole('button', { name: /start quiz/i }).click();

  await completeSession(page, 5);

  await expect(page.getByText(/session complete|økt fullført/i)).toBeVisible();
  await page.getByRole('button', { name: /try again|prøv igjen/i }).click();

  // Should be back in the questioning state (en: 'Question 1 of', nb: 'Spørsmål 1 av')
  await expect(page.getByText(/question 1 of|spørsmål 1 av/i)).toBeVisible();
  await expect(page.getByText(/session complete|økt fullført/i)).not.toBeVisible();
});

// ===========================================================================
// Quiz session limit preference
// ===========================================================================

test('quiz respects vocab-quiz-limit from localStorage', async ({ page }) => {
  test.setTimeout(60000);
  await injectPlusPlan(page);
  await page.goto('/quiz');

  // Set quiz limit to 5 via localStorage, then re-inject Plus plan (reload clears the cookie/flag)
  await page.evaluate(() => localStorage.setItem('vocab-quiz-limit', '5'));
  await injectPlusPlan(page);
  await page.reload();

  await page.getByRole('button', { name: /start quiz/i }).click();

  // The question counter should show "of 5" (en) or "av 5" (nb)
  await expect(page.getByText(/of 5|av 5/i)).toBeVisible();

  await completeSession(page, 10);
  await expect(page.getByText(/session complete|økt fullført/i)).toBeVisible({ timeout: 15000 });
  // Score should be out of 5 (en: 'of 5 correct', nb: 'av 5 riktige')
  await expect(page.getByText(/of 5 correct|av 5 riktige/i)).toBeVisible({ timeout: 5000 });
});

test('quiz uses 10 questions by default (no localStorage key)', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/quiz');

  // Ensure no limit is set
  await page.evaluate(() => localStorage.removeItem('vocab-quiz-limit'));
  await page.reload();

  await page.getByRole('button', { name: /start quiz/i }).click();
  // en: 'Question 1 of 10', nb: 'Spørsmål 1 av 10'
  await expect(page.getByText(/of 10|av 10/i)).toBeVisible();
});

// ===========================================================================
// Plus page — quiz row visible in comparison table
// ===========================================================================

test('/plus page includes quiz mode in the feature table', async ({ page }) => {
  await page.goto('/plus');
  await expect(page.getByRole('cell', { name: /quiz mode/i })).toBeVisible();
});

test('/plus page includes quiz feature card', async ({ page }) => {
  await page.goto('/plus');
  await expect(page.getByText(/quiz yourself, not just flip/i)).toBeVisible();
});
