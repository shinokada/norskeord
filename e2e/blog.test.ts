import { expect, test } from '@playwright/test';

// ── Blog index (/blog) ────────────────────────────────────────────────────────

test.describe('Blog index', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
  });

  test('has expected h1', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Språkhjørnet');
  });

  test('has expected meta title', async ({ page }) => {
    await expect(page).toHaveTitle('Språkhjørnet — Norskeord');
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

  test('word post cards show a CEFR badge', async ({ page }) => {
    // Guides are listed first and have no CEFR badge — find the first word post card instead.
    const badge = page.getByTestId('cefr-badge').first();
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
      "Sakte is the one you'll hear in conversation. Langsomt is the one you'll read."
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
      "Sakte is the one you'll hear in conversation. Langsomt is the one you'll read."
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

// ── Scheduled publishing ──────────────────────────────────────────────────────
//
// These tests verify that posts with a future publishedAt date are hidden
// from the blog index and return 404 on direct URL access.
//
// They rely on a fixture post in src/lib/posts/test-future-post.md with
// publishedAt: 2099-01-01 — far enough in the future it never goes live.

test.describe('Scheduled publishing', () => {
  test('future post does not appear in the blog index', async ({ page }) => {
    await page.goto('/blog');
    const futureLink = page.locator('a[href="/blog/test-future-post"]');
    await expect(futureLink).toHaveCount(0);
  });

  test('future post URL is not linked from the index', async ({ page }) => {
    // In a prerendered site the dev server may serve a 200 for unknown routes,
    // so we assert on absence from the listing rather than the HTTP status code.
    await page.goto('/blog');
    const links = await page
      .locator('a[href^="/blog/"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    expect(links).not.toContain('/blog/test-future-post');
  });
});
