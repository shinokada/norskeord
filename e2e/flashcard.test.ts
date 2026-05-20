import { expect, test } from '@playwright/test';
import { injectPlusPlan } from './helpers.js';

test('home page has expected h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Learn Norwegian vocabulary & phrase that actually sticks'
  );
});

test('home page shows all CEFR level headings', async ({ page }) => {
  await page.goto('/');
  for (const label of [
    'A1 — Beginner',
    'A2 — Elementary',
    'B1 — Intermediate',
    'B2 — Upper Intermediate',
    'C1 — Advanced',
    'C2 — Mastery'
  ]) {
    await expect(page.getByRole('heading', { name: label, level: 2 })).toBeVisible();
  }
});

test('home page has category links for A1', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Greetings' })).toHaveAttribute(
    'href',
    '/a1/greetings'
  );
  await expect(page.getByRole('link', { name: 'Animals' })).toHaveAttribute('href', '/a1/animals');
});

test('A1 greetings flashcard page loads and shows title', async ({ page }) => {
  await page.goto('/a1/greetings');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Greetings');
});

test('A1 greetings page has mode toggle buttons', async ({ page }) => {
  await page.goto('/a1/greetings');
  await expect(page.getByRole('button', { name: 'Norsk', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Word', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Norsk', exact: true }).click();
  await page.getByRole('button', { name: 'Word', exact: true }).click();
  await page.reload();

  await expect(page.getByRole('button', { name: 'English', exact: true })).toBeVisible();
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

// Plus member: C1 philosophy page loads with cards and FSRS rating buttons
test('Plus member C1 philosophy flashcard page loads and shows cards', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/c1/philosophy');

  // heading shows correct category
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Philosophy');

  // card counter is visible (format: "1/N")
  await expect(page.getByRole('button', { name: /^\d+\/\d+$/ })).toBeVisible();

  // flip the card and confirm FSRS rating buttons appear (en: Again/Good, nb: Igjen/Bra)
  await page.getByRole('button', { name: /flashcard showing question/i }).click();
  await expect(page.getByRole('button', { name: /again|igjen/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /good|bra/i })).toBeVisible();
});

// free user is redirected away from a Plus-only C1 category (linguistics is Plus-only)
test('free user is redirected from C1 linguistics to /plus', async ({ page }) => {
  await page.goto('/c1/linguistics');
  await page.waitForURL(/\/plus/, { timeout: 10000 });
  await expect(page).toHaveURL(/\/plus/);
});

test('about page has expected h1', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Guide to Norskeord');
});
