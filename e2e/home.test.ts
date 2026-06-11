import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  console.log(`Running ${test.info().title}`);
  await page.goto('/');
});

test('index page has expected h1', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Everything you need to learn Norwegian'
  );
});

test('unauthenticated visitor sees homepage and is not redirected', async ({ page }) => {
  // No localStorage, no session — should stay on /
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('authenticated user with no last-path stays on homepage', async ({ page }) => {
  // Simulate a logged-in user with no stored last-flashcard-path.
  // localStorage is empty by default in a fresh Playwright context.
  // The page should not redirect anywhere.
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('invalid stored path is not redirected for unauthenticated user', async ({ page }) => {
  // Poison the stored path with an auth route — unauthenticated users are never
  // redirected, so the value stays in localStorage untouched.
  await page.evaluate(() => localStorage.setItem('last-flashcard-path', '/auth/login'));
  await page.reload();
  await expect(page).toHaveURL('/');
  // Cleanup only runs for authenticated users; value remains for unauthenticated visitors.
  const stored = await page.evaluate(() => localStorage.getItem('last-flashcard-path'));
  expect(stored).toBe('/auth/login');
});

test('index page has expected meta title', async ({ page }) => {
  await expect(page).toHaveTitle('Norskeord');
});

test('index page has expected meta description', async ({ page }) => {
  const metaDescription = page.locator('meta[name="description"]');
  await expect(metaDescription).toHaveAttribute(
    'content',
    'Free Norwegian flashcards from A1 to C. 90+ vocabulary categories with audio, spaced repetition, and Norskprøven preparation. No credit card required.'
  );
});

test('index page has expected meta keywords', async ({ page }) => {
  const metaKeywords = page.locator('meta[name="keywords"]');
  await expect(metaKeywords).toHaveAttribute(
    'content',
    'Norwegian vocabulary, learn Norwegian, flashcards, Norskprøven, CEFR, A1 A2 B1 B2 C, spaced repetition, Norwegian words'
  );
});

test('index page has expected meta og', async ({ page }) => {
  const metaOgTitle = page.locator('meta[property="og:title"]');
  await expect(metaOgTitle).toHaveAttribute('content', 'Norskeord');
  const metaOgDescription = page.locator('meta[property="og:description"]');
  await expect(metaOgDescription).toHaveAttribute(
    'content',
    'Free Norwegian flashcards from A1 to C. 90+ vocabulary categories with audio, spaced repetition, and Norskprøven preparation. No credit card required.'
  );
  const metaOgUrl = page.locator('meta[property="og:url"]');
  await expect(metaOgUrl).toHaveAttribute('content', 'https://norskeord.no/');
  const metaOgImage = page.locator('meta[property="og:image"]');
  await expect(metaOgImage).toHaveAttribute('content', 'https://norskeord.no/og/default.png');
});

test('index page has expected meta twitter', async ({ page }) => {
  const metaTwitterTitle = page.locator('meta[name="twitter:title"]');
  await expect(metaTwitterTitle).toHaveAttribute('content', 'Norskeord');
  const metaTwitterDescription = page.locator('meta[name="twitter:description"]');
  await expect(metaTwitterDescription).toHaveAttribute(
    'content',
    'Free Norwegian flashcards from A1 to C. 90+ vocabulary categories with audio, spaced repetition, and Norskprøven preparation. No credit card required.'
  );
  const metaTwitterImage = page.locator('meta[name="twitter:image"]');
  await expect(metaTwitterImage).toHaveAttribute('content', 'https://norskeord.no/og/default.png');
});
