import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  console.log(`Running ${test.info().title}`);
  await page.goto('/');
});

test('index page has expected h1', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Learn Norwegian vocabulary & phrase that actually sticks'
  );
});

test('index page has expected meta title', async ({ page }) => {
  await expect(page).toHaveTitle('Norske Flashcard');
});

test('index page has expected meta description', async ({ page }) => {
  const metaDescription = page.locator('meta[name="description"]');
  await expect(metaDescription).toHaveAttribute(
    'content',
    'Free Norwegian flashcards from A1 to C2. 90+ vocabulary categories with audio, spaced repetition, and Norskprøven preparation. No credit card required.'
  );
});

test('index page has expected meta keywords', async ({ page }) => {
  const metaKeywords = page.locator('meta[name="keywords"]');
  await expect(metaKeywords).toHaveAttribute(
    'content',
    'Norwegian vocabulary, learn Norwegian, flashcards, Norskprøven, CEFR, A1 A2 B1 B2 C1 C2, spaced repetition, Norwegian words'
  );
});

test('index page has expected meta og', async ({ page }) => {
  const metaOgTitle = page.locator('meta[property="og:title"]');
  await expect(metaOgTitle).toHaveAttribute('content', 'Norske Flashcard');
  const metaOgDescription = page.locator('meta[property="og:description"]');
  await expect(metaOgDescription).toHaveAttribute(
    'content',
    'Free Norwegian flashcards from A1 to C2. 90+ vocabulary categories with audio, spaced repetition, and Norskprøven preparation. No credit card required.'
  );
  const metaOgUrl = page.locator('meta[property="og:url"]');
  await expect(metaOgUrl).toHaveAttribute('content', 'https://norskeord.no/');
  const metaOgImage = page.locator('meta[property="og:image"]');
  await expect(metaOgImage).toHaveAttribute(
    'content',
    'https://open-graph-vercel.vercel.app/api/norske-flashcard'
  );
});

test('index page has expected meta twitter', async ({ page }) => {
  const metaTwitterTitle = page.locator('meta[name="twitter:title"]');
  await expect(metaTwitterTitle).toHaveAttribute('content', 'Norske Flashcard');
  const metaTwitterDescription = page.locator('meta[name="twitter:description"]');
  await expect(metaTwitterDescription).toHaveAttribute(
    'content',
    'Free Norwegian flashcards from A1 to C2. 90+ vocabulary categories with audio, spaced repetition, and Norskprøven preparation. No credit card required.'
  );
  const metaTwitterImage = page.locator('meta[name="twitter:image"]');
  await expect(metaTwitterImage).toHaveAttribute(
    'content',
    'https://open-graph-vercel.vercel.app/api/norske-flashcard'
  );
});
