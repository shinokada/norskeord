import { expect, test } from '@playwright/test';

// ── Blog index (/blog) ────────────────────────────────────────────────────────

test.describe('Blog index', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
  });

  test('has expected h1', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Norwegian Language Blog');
  });

  test('has expected meta title', async ({ page }) => {
    await expect(page).toHaveTitle('Norwegian Language Blog — Norskeord');
  });

  test('has expected meta description', async ({ page }) => {
    const meta = page.locator('meta[name="description"]').last();
    await expect(meta).toHaveAttribute(
      'content',
      'Short, practical articles about Norwegian vocabulary and grammar — with real examples.'
    );
  });

  test('shows at least one post card', async ({ page }) => {
    const cards = page.locator('a[href^="/blog/"]');
    await expect(cards.first()).toBeVisible();
  });

  test('post cards link to /blog/[slug]', async ({ page }) => {
    const firstCard = page.locator('a[href^="/blog/"]').first();
    const href = await firstCard.getAttribute('href');
    expect(href).toMatch(/^\/blog\/.+/);
  });

  test('post cards show a CEFR badge', async ({ page }) => {
    const badge = page.locator('a[href^="/blog/"]').first().getByTestId('cefr-badge');
    await expect(badge).toBeVisible();
  });

  test('clicking a post card navigates to the article', async ({ page }) => {
    const firstCard = page.locator('a[href^="/blog/"]').first();
    const href = await firstCard.getAttribute('href');
    await firstCard.click();
    await expect(page).toHaveURL(href!);
  });
});

// ── Individual post (/blog/sakte-vs-langsomt) ─────────────────────────────────

test.describe('Blog post — sakte-vs-langsomt', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog/sakte-vs-langsomt');
  });

  test('has expected h1', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sakte vs Langsomt');
  });

  test('has expected meta title', async ({ page }) => {
    await expect(page).toHaveTitle('Sakte vs Langsomt — Norskeord');
  });

  test('has expected meta description', async ({ page }) => {
    const meta = page.locator('meta[name="description"]').last();
    await expect(meta).toHaveAttribute(
      'content',
      "Both mean 'slowly' — but one sounds more natural in everyday speech."
    );
  });

  test('has expected og:title', async ({ page }) => {
    const og = page.locator('meta[property="og:title"]').last();
    await expect(og).toHaveAttribute('content', 'Sakte vs Langsomt');
  });

  test('has expected og:description', async ({ page }) => {
    const og = page.locator('meta[property="og:description"]').last();
    await expect(og).toHaveAttribute(
      'content',
      "Both mean 'slowly' — but one sounds more natural in everyday speech."
    );
  });

  test('shows a CEFR badge', async ({ page }) => {
    await expect(page.getByTestId('cefr-badge')).toBeVisible();
  });

  test('shows a back link to /blog', async ({ page }) => {
    const backLink = page.locator('a[href="/blog"]');
    await expect(backLink).toBeVisible();
  });

  test('back link navigates to blog index', async ({ page }) => {
    await page.locator('a[href="/blog"]').click();
    await expect(page).toHaveURL('/blog');
  });

  test('renders article content', async ({ page }) => {
    const prose = page.locator('.prose');
    await expect(prose).not.toBeEmpty();
  });
});
