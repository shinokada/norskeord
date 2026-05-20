import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  console.log(`Running ${test.info().title}`);
  await page.goto('/guide');
});

test('Guide page has expected h1, meta title', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Guide' })).toBeVisible();
});

test('Guide page has expected meta title', async ({ page }) => {
  await expect(page).toHaveTitle('How to Use Norskeord — Guide & FAQ');
});

test('Guide page has expected meta description', async ({ page }) => {
  const metaDescription = page.locator('meta[name="description"]');
  await expect(metaDescription).toHaveAttribute(
    'content',
    'Learn how smart scheduling works, what the flashcard ratings mean, and get answers to common questions about Norskeord — the free Norwegian vocabulary app.'
  );
});

test('Guide page has expected meta og', async ({ page }) => {
  const metaOgTitle = page.locator('meta[property="og:title"]');
  await expect(metaOgTitle).toHaveAttribute('content', 'How to Use Norskeord — Guide & FAQ');
  const metaOgDescription = page.locator('meta[property="og:description"]');
  await expect(metaOgDescription).toHaveAttribute(
    'content',
    'Learn how smart scheduling works, what the flashcard ratings mean, and get answers to common questions about Norskeord — the free Norwegian vocabulary app.'
  );
  const metaOgUrl = page.locator('meta[property="og:url"]');
  await expect(metaOgUrl).toHaveAttribute('content', 'https://norskeord.no/guide');
  const metaOgImage = page.locator('meta[property="og:image"]');
  await expect(metaOgImage).toHaveAttribute(
    'content',
    'https://open-graph-vercel.vercel.app/api/norskeord?title=Guide'
  );
});

test('Guide page has expected meta twitter', async ({ page }) => {
  const metaTwitterTitle = page.locator('meta[name="twitter:title"]');
  await expect(metaTwitterTitle).toHaveAttribute('content', 'How to Use Norskeord — Guide & FAQ');
  const metaTwitterDescription = page.locator('meta[name="twitter:description"]');
  await expect(metaTwitterDescription).toHaveAttribute(
    'content',
    'Learn how smart scheduling works, what the flashcard ratings mean, and get answers to common questions about Norskeord — the free Norwegian vocabulary app.'
  );
  const metaTwitterImage = page.locator('meta[name="twitter:image"]');
  await expect(metaTwitterImage).toHaveAttribute(
    'content',
    'https://open-graph-vercel.vercel.app/api/norskeord?title=Guide'
  );
});
