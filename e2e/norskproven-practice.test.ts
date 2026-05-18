import { expect, test, type Page } from '@playwright/test';
import { injectPlusPlan } from './helpers.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Answer the first reading MC option and advance to the reveal state. */
async function answerReadingQuestion(page: Page) {
  const optionA = page.getByRole('button', { name: /^A\b/ });
  await expect(optionA).toBeVisible({ timeout: 5000 });
  await optionA.click();
}

/** Click through to the next passage / finish. */
async function advanceReading(page: Page) {
  // Button text: nb='Neste tekst'/'Neste spørsmål'/'Fullfør', en='Next text'/'Finish'
  const btn = page.getByRole('button', {
    name: /neste tekst|neste spørsmål|next text|finish|fullfør/i
  });
  await expect(btn).toBeVisible({ timeout: 3000 });
  await btn.click();
}

/** Complete all reading passages in a session.
 *
 * Drives the session by repeatedly:
 *   1. Answering the current enabled option-A button.
 *   2. Clicking whichever advance button appears (intra-passage "Neste spørsmål"
 *      or inter-passage "Neste tekst" / "Fullfør" / English equivalents).
 * Terminates when the summary heading becomes visible or a safety limit is hit.
 */
async function completeReadingSession(page: Page) {
  const SAFETY = 40; // max clicks before giving up
  for (let clicks = 0; clicks < SAFETY; clicks++) {
    // If the summary is already showing, we're done.
    const done = await page
      .getByText(/økt fullført|session complete/i)
      .isVisible({ timeout: 300 })
      .catch(() => false);
    if (done) return;

    // Click an enabled MC option if one is present.
    const optionA = page
      .getByRole('button', { name: /^A\b/ })
      .and(page.locator(':not([disabled])'));
    const optionVisible = await optionA.isVisible({ timeout: 800 }).catch(() => false);
    if (optionVisible) {
      await optionA.click();
      continue;
    }

    // No option to click — look for any advance button.
    // Match intra-passage ("Neste spørsmål →") separately from inter-passage
    // ("Neste tekst" / "Fullfør" / English) to avoid ambiguity.
    const advance = page.getByRole('button', {
      name: /neste spørsmål|neste tekst|next text|fullfør|finish/i
    });
    const advanceVisible = await advance.isVisible({ timeout: 2000 }).catch(() => false);
    if (advanceVisible) {
      await advance.click();
      continue;
    }

    // Nothing clickable — session may be in a transitional state; wait briefly.
    await page.waitForTimeout(300);
  }
}

// ===========================================================================
// Gate tests
// ===========================================================================

test.describe('Gate — free user redirect', () => {
  test('/norskproven/practice redirects free user to /plus', async ({ page }) => {
    await page.goto('/norskproven/practice');
    await expect(page).toHaveURL(/\/plus/);
  });

  test('/norskproven/practice/reading/a2 redirects free user to /plus', async ({ page }) => {
    await page.goto('/norskproven/practice/reading/a2');
    await expect(page).toHaveURL(/\/plus/);
  });

  test('/norskproven/practice/writing/a2 redirects free user to /plus', async ({ page }) => {
    await page.goto('/norskproven/practice/writing/a2');
    await expect(page).toHaveURL(/\/plus/);
  });

  test('/norskproven/practice/oral/a2 redirects free user to /plus', async ({ page }) => {
    await page.goto('/norskproven/practice/oral/a2');
    await expect(page).toHaveURL(/\/plus/);
  });
});

// ===========================================================================
// Practice landing page
// ===========================================================================

test.describe('Practice landing page', () => {
  test('Plus user sees A2 and B1 columns with all three type cards', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice');

    // Both level headings
    await expect(page.getByRole('heading', { name: 'A2' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'B1' })).toBeVisible();

    // All three type labels visible (pills replace card links)
    // Label text is translated: en=Reading/Writing/Oral, nb=Lesing/Skriving/Muntlig
    await expect(page.getByText(/reading|lesing/i).first()).toBeVisible();
    await expect(page.getByText(/writing|skriving/i).first()).toBeVisible();
    await expect(page.getByText(/oral|muntlig/i).first()).toBeVisible();
  });

  test('A2 reading Test 1 pill links to /norskproven/practice/1/reading/a2', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice');

    // First Test 1 pill in the A2 reading card
    const pill = page.getByRole('link', { name: 'Test 1' }).first();
    await expect(pill).toHaveAttribute('href', '/norskproven/practice/1/reading/a2');
  });

  test('B1 writing Test 2 pill links to /norskproven/practice/2/writing/b1', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice');

    // Writing Test 2 pills — last() hits B1 column
    const pills = page.getByRole('link', { name: 'Test 2' });
    // Pills render: A2 reading, A2 writing, A2 oral, B1 reading, B1 writing, B1 oral
    // B1 writing Test 2 is the 5th pill (index 4)
    await expect(pills.nth(4)).toHaveAttribute('href', '/norskproven/practice/2/writing/b1');
  });
});

// ===========================================================================
// Reading practice
// ===========================================================================

test.describe('Reading practice', () => {
  test('A2 reading page shows first passage and question', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/reading/a2');

    // Progress counter
    await expect(page.getByText(/tekst 1 av/i)).toBeVisible();

    // A passage title and text should be present
    await expect(page.locator('h2').first()).toBeVisible();

    // Multiple-choice options
    await expect(page.getByRole('button', { name: /^A\b/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^B\b/ })).toBeVisible();
  });

  test('correct option is highlighted green after answering', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/reading/a2');

    // Find the correct option before clicking
    const correctId = await page.evaluate(() => {
      // The correct answer is stored as correctId in the DOM's data, but we can
      // infer it by checking which button gets the green class after any click.
      return null;
    });
    void correctId;

    // Click option A
    await page.getByRole('button', { name: /^A\b/ }).click();

    // After reveal, one button must have a green border class
    const greenButton = page.locator('button').filter({ hasText: /✓/ });
    await expect(greenButton).toBeVisible();
  });

  test('wrong option is highlighted red and correct is green', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/reading/a2');

    // Click option D (likely wrong for the first question)
    await page.getByRole('button', { name: /^D\b/ }).click();

    // The green checkmark (correct) and red cross (selected wrong) must both show
    await expect(page.locator('button').filter({ hasText: '✓' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '✗' })).toBeVisible();
  });

  test('feedback text is shown after answering', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/reading/a2');

    await page.getByRole('button', { name: /^A\b/ }).click();

    // Either "Riktig!" or "Feil. Riktig svar:" must appear
    const feedback = page.getByText(/riktig!|feil\. riktig svar/i);
    await expect(feedback).toBeVisible();
  });

  test('keyboard shortcut A selects first option', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/reading/a2');

    // Wait for the question to be visible, then click the page body to ensure
    // the window has focus so svelte:window onkeydown receives the event.
    await expect(page.getByRole('button', { name: /^A\b/ })).toBeVisible();
    await page.locator('body').click();
    await page.keyboard.press('a');

    // After keyboard selection, the Next / Finish button must appear
    // In Norwegian: 'Neste spørsmål →', 'Neste tekst', 'Fullfør'; in English: 'Next text', 'Finish'
    const next = page.getByRole('button', { name: /neste|fullfør|next text|finish/i });
    await expect(next).toBeVisible();
  });

  test('progress counter advances after moving to next passage', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/reading/a2');

    await expect(page.getByText(/tekst 1 av/i)).toBeVisible();

    // Answer all questions on passage 1 and advance
    await answerReadingQuestion(page);
    await advanceReading(page);

    // Some passages have 2 questions, so answer again if still on passage 1
    const stillOnOne = await page
      .getByText(/tekst 1 av/i)
      .isVisible({ timeout: 500 })
      .catch(() => false);
    if (stillOnOne) {
      await answerReadingQuestion(page);
      await advanceReading(page);
    }

    await expect(page.getByText(/tekst 2 av/i)).toBeVisible();
  });

  test('summary screen shown after completing all passages', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/reading/a2');

    await completeReadingSession(page);

    await expect(page.getByText(/økt fullført|session complete/i)).toBeVisible();
    // Score: nb='X av Y riktige', en='X of Y correct'
    await expect(page.getByText(/av \d+ riktige|of \d+ correct/i)).toBeVisible();
  });

  test('summary has Prøv igjen and back to practice links', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/reading/a2');

    await completeReadingSession(page);

    await expect(page.getByRole('button', { name: /prøv igjen/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /tilbake til øving/i })).toBeVisible();
  });

  test('B1 reading page loads and shows progress counter', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/reading/b1');

    await expect(page.getByText(/tekst 1 av/i)).toBeVisible();
    // Scope to the page heading to avoid matching multiple B1 elements
    await expect(page.locator('section').getByRole('heading', { name: /B1/ })).toBeVisible();
  });
});

// ===========================================================================
// Writing practice
// ===========================================================================

test.describe('Writing practice', () => {
  test('A2 writing page shows situation, task and textarea', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/writing/a2');

    await expect(page.getByText(/situasjon/i)).toBeVisible();
    await expect(page.getByText(/oppgave 1 av/i)).toBeVisible();
    await expect(page.getByRole('textbox')).toBeVisible();
  });

  test('live word count updates as user types', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/writing/a2');

    const textarea = page.getByRole('textbox');
    await textarea.fill('ett to tre fire fem');

    await expect(page.getByText(/5 ord/i)).toBeVisible();
  });

  test('model answer button is hidden before minimum word count', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/writing/a2');

    // With 0 words typed the button should be disabled
    const revealBtn = page.getByRole('button', { name: /vis eksempelsvar/i });
    await expect(revealBtn).toBeVisible();
    await expect(revealBtn).toBeDisabled();
  });

  test('model answer is not visible before clicking reveal', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/writing/a2');

    await expect(page.getByText(/eksempelsvar/i)).not.toBeVisible();
  });

  test('model answer is revealed after reaching minimum word count and clicking', async ({
    page
  }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/writing/a2');

    // Type enough words to reach the A2 minimum (40)
    const words = Array(40).fill('test').join(' ');
    await page.getByRole('textbox').fill(words);

    const revealBtn = page.getByRole('button', { name: /vis eksempelsvar/i });
    await expect(revealBtn).toBeEnabled();
    await revealBtn.click();

    await expect(page.getByText(/eksempelsvar/i)).toBeVisible();
  });

  test('textarea is disabled after model answer is revealed', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/writing/a2');

    const words = Array(40).fill('test').join(' ');
    await page.getByRole('textbox').fill(words);
    await page.getByRole('button', { name: /vis eksempelsvar/i }).click();

    await expect(page.getByRole('textbox')).toBeDisabled();
  });

  test('next prompt button advances to prompt 2', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/writing/a2');

    const words = Array(40).fill('test').join(' ');
    await page.getByRole('textbox').fill(words);
    await page.getByRole('button', { name: /vis eksempelsvar/i }).click();
    await page.getByRole('button', { name: /neste oppgave/i }).click();

    await expect(page.getByText(/oppgave 2 av/i)).toBeVisible();
  });

  test('B1 writing page loads and shows higher word count range', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/writing/b1');

    await expect(page.getByText(/oppgave 1 av/i)).toBeVisible();
    // B1 prompts require 80–120 words
    await expect(
      page
        .locator('span')
        .filter({ hasText: /80.120 ord/i })
        .first()
    ).toBeVisible();
  });
});

// ===========================================================================
// Oral practice
// ===========================================================================

test.describe('Oral practice', () => {
  test('A2 oral page shows scenario card and practice button in prep mode', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/oral/a2');

    await expect(page.getByText(/scenario 1 av/i)).toBeVisible();
    // Use a scoped locator to avoid matching the navbar 'Øv' menu item
    // The practice button has text 'Øv →' (nb) or 'Practice →' (en)
    await expect(page.getByRole('button', { name: /^øv →$|^practice →$/i })).toBeVisible();

    // Questions should NOT be visible yet
    await expect(page.getByText(/spørsmål \(/i)).not.toBeVisible();
  });

  test('clicking Øv enters practice mode and reveals first question', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/oral/a2');

    await page.getByRole('button', { name: /^øv →$|^practice →$/i }).click();

    // Question count indicator appears
    await expect(page.getByText(/spørsmål \(1 av/i)).toBeVisible();

    // The first question card is shown
    const questionCards = page
      .locator('div')
      .filter({ has: page.locator('span').filter({ hasText: '1' }) });
    await expect(questionCards.first()).toBeVisible();
  });

  test('questions are revealed one by one', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/oral/a2');

    await page.getByRole('button', { name: /^øv →$|^practice →$/i }).click();

    // Initially 1 revealed
    await expect(page.getByText(/spørsmål \(1 av/i)).toBeVisible();

    // Click "Neste spørsmål" to reveal question 2
    await page.getByRole('button', { name: /neste spørsmål/i }).click();
    await expect(page.getByText(/spørsmål \(2 av/i)).toBeVisible();
  });

  test('tips section is shown when tips are present', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/oral/a2');

    await expect(page.getByText(/tips/i)).toBeVisible();
  });

  test('timer button appears in practice mode', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/oral/a2');

    await page.getByRole('button', { name: /^øv →$|^practice →$/i }).click();

    await expect(page.getByRole('button', { name: /start tidtaker/i })).toBeVisible();
  });

  test('timer counts down after clicking start', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/oral/a2');

    await page.getByRole('button', { name: /^øv →$|^practice →$/i }).click();
    await page.getByRole('button', { name: /start tidtaker/i }).click();

    // Timer display should appear showing 2:00 or just under
    await expect(page.getByText(/2:0[0-9]|1:5[0-9]/)).toBeVisible();
  });

  test('next scenario advances to scenario 2', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/oral/a2');

    await expect(page.getByText(/scenario 1 av/i)).toBeVisible();

    // Enter practice, reveal all questions, then advance
    await page.getByRole('button', { name: /^øv →$|^practice →$/i }).click();

    // Reveal all questions by clicking Next until the Neste spørsmål button disappears
    for (let i = 0; i < 10; i++) {
      const revealBtn = page.getByRole('button', { name: /neste spørsmål/i });
      const visible = await revealBtn.isVisible({ timeout: 500 }).catch(() => false);
      if (!visible) break;
      await revealBtn.click();
    }

    await page.getByRole('button', { name: /neste scenario/i }).click();
    await expect(page.getByText(/scenario 2 av/i)).toBeVisible();
  });

  test('B1 oral page loads with correct level label', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven/practice/oral/b1');

    await expect(page.getByText(/scenario 1 av/i)).toBeVisible();
    // Scope to the page heading to avoid matching multiple B1 elements
    await expect(page.locator('section').getByRole('heading', { name: /B1/ })).toBeVisible();
  });
});

// ===========================================================================
// /plus page — table row and feature card
// ===========================================================================

test.describe('/plus page updates', () => {
  test('comparison table includes Norskprøven practice tests row', async ({ page }) => {
    await page.goto('/plus');
    await expect(
      page.getByRole('cell', { name: /norskprøven practice tests|norskprøven øvingsprøver/i })
    ).toBeVisible();
  });

  test('practice tests row shows correct Plus value', async ({ page }) => {
    await page.goto('/plus');
    await expect(
      page.getByRole('cell', { name: /reading, writing & oral|lesing, skriving og muntlig/i })
    ).toBeVisible();
  });

  test('feature card for exam practice is present', async ({ page }) => {
    await page.goto('/plus');
    await expect(
      page.getByText(/exam practice, not just vocabulary|eksamensøving, ikke bare ordforråd/i)
    ).toBeVisible();
  });
});

// ===========================================================================
// /norskproven — hero CTA for Plus users
// ===========================================================================

test.describe('/norskproven hero CTA', () => {
  test('Plus user sees practice tests link in hero', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven');

    const practiceLink = page.getByRole('link', { name: /start →|start ->/i });
    await expect(practiceLink).toBeVisible();
    await expect(practiceLink).toHaveAttribute('href', '/norskproven/practice');
  });

  test('guest sees Plus upsell link in hero', async ({ page }) => {
    await page.goto('/norskproven');

    // Should NOT have the practice link
    await expect(page.getByRole('link', { name: /norskproven\/practice/ })).not.toBeVisible();

    // Should have a /plus link
    await expect(page.getByRole('link', { name: /plus/i }).first()).toBeVisible();
  });
});
