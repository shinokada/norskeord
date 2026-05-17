import { expect, test } from '@playwright/test';
import { injectPlusPlan } from './helpers.js';

// ---------------------------------------------------------------------------
// Helper: answer one question regardless of type, then click Next
// ---------------------------------------------------------------------------
async function answerAndAdvance(page: Page) {
  const optionA = page.getByRole('button', { name: /^A\b/ });
  const input = page.getByRole('textbox');

  if (await optionA.isVisible({ timeout: 2000 }).catch(() => false)) {
    await optionA.click();
  } else if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
    await input.fill('test');
    await input.press('Enter');
  }

  // After answering, the Next / See results button should appear
  const next = page.getByRole('button', { name: /next|see results/i });
  if (await next.isVisible({ timeout: 3000 }).catch(() => false)) {
    await next.click();
  }
}

// ---------------------------------------------------------------------------
// Helper: run a full session until "Session complete!" or the safety guard
// ---------------------------------------------------------------------------
async function completeSession(page: Page, maxQuestions = 20) {
  let answered = 0;
  while (
    !(await page
      .getByText(/session complete/i)
      .isVisible({ timeout: 500 })
      .catch(() => false))
  ) {
    await answerAndAdvance(page);
    if (++answered > maxQuestions + 5) break; // safety guard with slack
  }
}

// ===========================================================================
// Gate tests
// ===========================================================================

test('free user is redirected from /quiz to /plus', async ({ page }) => {
  await page.goto('/quiz');
  await expect(page).toHaveURL(/\/plus/);
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
  await injectPlusPlan(page);
  await page.goto('/quiz');
  await page.getByRole('button', { name: /start quiz/i }).click();

  await completeSession(page);

  await expect(page.getByText(/session complete/i)).toBeVisible();
  await expect(page.getByText(/of \d+ correct/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
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
    // After selecting via keyboard, the Next button should appear
    await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
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

  // Now in reveal state — press Space to advance
  await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
  await page.keyboard.press('Space');

  // Should now be on question 2 (Next button gone, new question showing)
  await expect(page.getByText(/question 2 of/i)).toBeVisible();
});

// ===========================================================================
// Restart from summary
// ===========================================================================

test('Try again from summary resets the session', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/quiz');
  await page.getByRole('button', { name: /start quiz/i }).click();

  await completeSession(page);

  await expect(page.getByText(/session complete/i)).toBeVisible();
  await page.getByRole('button', { name: /try again/i }).click();

  // Should be back in the questioning state (first question visible, not idle/summary)
  await expect(page.getByText(/question 1 of/i)).toBeVisible();
  await expect(page.getByText(/session complete/i)).not.toBeVisible();
});

// ===========================================================================
// Quiz session limit preference
// ===========================================================================

test('quiz respects vocab-quiz-limit from localStorage', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/quiz');

  // Set quiz limit to 5 via localStorage before starting
  await page.evaluate(() => localStorage.setItem('vocab-quiz-limit', '5'));
  await page.reload();

  await page.getByRole('button', { name: /start quiz/i }).click();

  // The question counter should show "of 5"
  await expect(page.getByText(/of 5/i)).toBeVisible();

  await completeSession(page, 5);
  await expect(page.getByText(/session complete/i)).toBeVisible();
  // Score should be out of 5
  await expect(page.getByText(/of 5 correct/i)).toBeVisible();
});

test('quiz uses 10 questions by default (no localStorage key)', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/quiz');

  // Ensure no limit is set
  await page.evaluate(() => localStorage.removeItem('vocab-quiz-limit'));
  await page.reload();

  await page.getByRole('button', { name: /start quiz/i }).click();
  await expect(page.getByText(/of 10/i)).toBeVisible();
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
