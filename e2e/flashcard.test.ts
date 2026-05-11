import { expect, test } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Learn Norwegian vocabulary/phrase that actually sticks'
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
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A1');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Nivå A1 — Greetings');
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

// 3-A: free users (unauthenticated) see the ⭐ All cards upsell link, not the
// orange Due toggle button
test('free user sees upsell link instead of Due toggle', async ({ page }) => {
  await page.goto('/a1/greetings');
  // The Due mode toggle button must NOT be present
  await expect(page.getByRole('button', { name: /due/i })).not.toBeVisible();
  // The upsell link to /plus must be visible
  await expect(page.getByRole('link', { name: /all cards/i })).toBeVisible();
});

// 3-A: clicking the upsell link navigates to /plus
test('free user upsell link points to /plus', async ({ page }) => {
  await page.goto('/a1/greetings');
  await expect(page.getByRole('link', { name: /all cards/i })).toHaveAttribute('href', '/plus');
});

// 3-A: free user does NOT see the upsell banner when no cards are due
// (banner is only shown when dueCount > 0, which is never true on a fresh device)
test('free user sees no upsell banner when no cards are due', async ({ page }) => {
  await page.goto('/a1/greetings');
  await expect(
    page.getByText('Smart review is a Plus feature')
  ).not.toBeVisible();
});

test('B1 travel flashcard page loads', async ({ page }) => {
  await page.goto('/b1/travel');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('B1');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Nivå B1 — Travel');
});

test('C1 philosophy flashcard page loads', async ({ page }) => {
  await page.goto('/c1/philosophy');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('C1');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Nivå C1 — Philosophy');
});

test('about page has expected h1', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ABOUT');
});
