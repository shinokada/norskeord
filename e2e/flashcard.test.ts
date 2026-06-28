import { expect, test } from '@playwright/test';
import { injectPlusPlan } from './helpers.js';

test('home page shows all CEFR level cards linking to hub pages', async ({ page }) => {
  await page.goto('/');
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C']) {
    await expect(
      page
        .getByRole('link', { name: new RegExp(level) })
        .filter({ hasText: level })
        .first()
    ).toBeVisible();
  }
});

test('home page level cards link to /learn/[level]', async ({ page }) => {
  await page.goto('/');
  for (const level of ['a1', 'a2', 'b1', 'b2', 'c']) {
    await expect(
      page
        .getByRole('link', { name: new RegExp(level, 'i') })
        .filter({ hasText: new RegExp(level, 'i') })
        .first()
    ).toHaveAttribute('href', `/learn/${level}`);
  }
});

test('A1 greetings flashcard page loads and shows title', async ({ page }) => {
  await page.goto('/a1/greetings');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Greetings');
});

test('A1 greetings page has mode toggle buttons', async ({ page }) => {
  await page.goto('/a1/greetings');

  // Mode buttons show abbreviated direction labels e.g. "NO → EN" / "EN → NO"
  await expect(page.getByRole('button', { name: /NO → EN/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Word', exact: true })).toBeVisible();

  // Click the "NO → EN" direction button, then switch to phrase mode
  await page.getByRole('button', { name: /NO → EN/i }).click();
  await page.getByRole('button', { name: 'Word', exact: true }).click();
  await page.reload();

  // After reload, the reverse-direction button should be visible
  await expect(page.getByRole('button', { name: /EN → NO/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Phrase', exact: true })).toBeVisible();
});

// 3-A: free users (unauthenticated) do not see a Due mode toggle button
test('free user sees no Due toggle button', async ({ page }) => {
  await page.goto('/a1/greetings');
  await expect(page.getByRole('button', { name: /due/i })).not.toBeVisible();
});

// 3-A: free user sees no upsell banner when no cards are due
// (banner is only shown when dueCount > 0, which is never true on a fresh device)
test('free user sees no upsell banner when no cards are due', async ({ page }) => {
  await page.goto('/a1/greetings');
  await expect(page.getByText('Smart review is a Plus feature')).not.toBeVisible();
});

test('B1 travel flashcard page loads', async ({ page }) => {
  await page.goto('/b1/travel');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Travel');
});

// Plus member: C philosophy page loads with cards and FSRS rating buttons
// Uses c/philosophy which is free-tier accessible (no server-side redirect),
// then injects plan:plus client-side so the due-mode deck rebuilds correctly.
test('Plus member C philosophy flashcard page loads and shows cards', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/c/philosophy');

  // heading shows correct category
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Philosophy');

  // card counter is visible (format: "1/N") — wait for deck to build after onMount
  await expect(page.getByText(/^\d+\/\d+$/)).toBeVisible({ timeout: 10000 });

  // flip the card and confirm FSRS rating buttons appear (en: Again/Good, nb: Igjen/Bra)
  const flipCard = page.getByRole('button', { name: /flashcard showing question/i });
  await expect(flipCard).toBeVisible({ timeout: 10000 });
  await flipCard.click({ force: true });
  await expect(page.getByRole('button', { name: /again|igjen|gjenta/i })).toBeVisible({
    timeout: 10000
  });
  await expect(page.getByRole('button', { name: /good|bra/i })).toBeVisible();
});

// free user is redirected away from a Plus-only C category (linguistics is Plus-only)
test('free user is redirected from C linguistics to /plus', async ({ page }) => {
  await page.goto('/c/linguistics');
  await page.waitForURL(/\/plus/, { timeout: 10000 });
  await expect(page).toHaveURL(/\/plus/);
});

test('about page has expected h1', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Guide to Norskeord');
});
