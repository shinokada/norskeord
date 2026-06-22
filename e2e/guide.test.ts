import { expect, test } from '@playwright/test';

const title = 'How to Use Norskeord — Flashcards, Quiz, Grammar & Norskprøven Guide';
const description =
  'Learn how to use every feature in Norskeord — vocabulary flashcards, quiz mode, grammar practice, and Norskprøven exam preparation. Plus: smart scheduling explained and FAQ.';

test.beforeEach(async ({ page }) => {
  console.log(`Running ${test.info().title}`);
  await page.goto('/guide');
});

test('Guide page has expected h1, meta title', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Guide' })).toBeVisible();
});

test('Guide page has expected meta title', async ({ page }) => {
  await expect(page).toHaveTitle(title);
});

test('Guide page has expected meta description', async ({ page }) => {
  const metaDescription = page.locator('meta[name="description"]');
  await expect(metaDescription).toHaveAttribute('content', description);
});

test('Guide page has expected meta og', async ({ page }) => {
  const metaOgTitle = page.locator('meta[property="og:title"]');
  await expect(metaOgTitle).toHaveAttribute('content', title);
  const metaOgDescription = page.locator('meta[property="og:description"]');
  await expect(metaOgDescription).toHaveAttribute('content', description);
  const metaOgUrl = page.locator('meta[property="og:url"]');
  await expect(metaOgUrl).toHaveAttribute('content', 'https://norskeord.no/guide');
  const metaOgImage = page.locator('meta[property="og:image"]');
  await expect(metaOgImage).toHaveAttribute('content', 'https://norskeord.no/og/default.png');
});

test('Guide page has expected meta twitter', async ({ page }) => {
  const metaTwitterTitle = page.locator('meta[name="twitter:title"]');
  await expect(metaTwitterTitle).toHaveAttribute('content', title);
  const metaTwitterDescription = page.locator('meta[name="twitter:description"]');
  await expect(metaTwitterDescription).toHaveAttribute('content', description);
  const metaTwitterImage = page.locator('meta[name="twitter:image"]');
  await expect(metaTwitterImage).toHaveAttribute('content', 'https://norskeord.no/og/default.png');
});
