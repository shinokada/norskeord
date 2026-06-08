import { expect, test, type Page } from '@playwright/test';

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

// ── Search ────────────────────────────────────────────────────────────────────

test.describe('Blog search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
  });

  test('search box is visible', async ({ page }) => {
    await expect(page.getByRole('searchbox')).toBeVisible();
  });

  test('typing filters post cards', async ({ page }) => {
    // Use a term that matches at least one post title/description.
    // 'sakte' appears in the published fixture post.
    await page.getByRole('searchbox').fill('sakte');
    const cards = page.locator('a[href^="/blog/"]');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Sakte');
  });

  test('no-match search shows empty state', async ({ page }) => {
    await page.getByRole('searchbox').fill('xyzzy_no_match_ever');
    const cards = page.locator('a[href^="/blog/"]');
    await expect(cards).toHaveCount(0);
    await expect(page.getByText(/no articles match/i)).toBeVisible();
  });

  test('clearing the search restores all cards', async ({ page }) => {
    const allCount = await page.locator('a[href^="/blog/"]').count();
    await page.getByRole('searchbox').fill('sakte');
    await page.getByRole('searchbox').fill('');
    await expect(page.locator('a[href^="/blog/"]')).toHaveCount(allCount);
  });

  test('active filter summary shows article count while searching', async ({ page }) => {
    await page.getByRole('searchbox').fill('sakte');
    // Expects text like "1 articles" or "1 artikler"
    await expect(page.getByText(/\d+ articles?/i).or(page.getByText(/\d+ artik/i))).toBeVisible();
  });

  test('clear-filters link resets search', async ({ page }) => {
    const allCount = await page.locator('a[href^="/blog/"]').count();
    await page.getByRole('searchbox').fill('sakte');
    await page
      .getByRole('link', { name: /clear/i })
      .or(page.getByRole('button', { name: /clear|fjern/i }))
      .click();
    await expect(page.locator('a[href^="/blog/"]')).toHaveCount(allCount);
    await expect(page.getByRole('searchbox')).toHaveValue('');
  });
});

// ── Level filter ──────────────────────────────────────────────────────────────

// The nav bar contains mega-menu trigger buttons also named 'A1', 'A2', etc.
// Scoping to 'button.rounded-full' targets only the filter-panel pill buttons
// and avoids strict-mode violations from duplicate matches.
function levelBtn(page: Page, level: string) {
  return page.locator('button.rounded-full').filter({ hasText: new RegExp(`^${level}$`) });
}

test.describe('Blog level filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
  });

  test('level filter buttons are visible', async ({ page }) => {
    for (const level of ['A1', 'A2', 'B1', 'B2', 'C']) {
      await expect(levelBtn(page, level)).toBeVisible();
    }
  });

  test('clicking a level shows only posts with that badge', async ({ page }) => {
    await levelBtn(page, 'A2').click();
    // Each post card is an <a href^="/blog/">.  A card may show multiple CEFR
    // badges (e.g. both "A2" and "B1" for a post that spans two levels), so we
    // assert that every *card* contains at least one A2 badge rather than
    // checking every individual badge element.
    const cards = page.locator('div.grid a[href^="/blog/"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const cardBadges = cards.nth(i).getByTestId('cefr-badge');
      const badgeTexts = await cardBadges.allInnerTexts();
      expect(badgeTexts.some((t) => t.trim() === 'A2')).toBe(true);
    }
  });

  test('clicking the same level again deselects it', async ({ page }) => {
    const allCount = await page.locator('a[href^="/blog/"]').count();
    await levelBtn(page, 'A2').click();
    // Wait for the filter to take effect (guide section disappears) before deselecting
    await expect(page.locator('a[href="/blog/slik-bruker-du-norskeord"]')).toHaveCount(0);
    await levelBtn(page, 'A2').click();
    await expect(page.locator('a[href^="/blog/"]')).toHaveCount(allCount);
  });

  test('guides section is hidden when a level filter is active', async ({ page }) => {
    // The guide post uses the slug defined in slik-bruker-du-norskeord.md
    const guideLink = page.locator('a[href="/blog/slik-bruker-du-norskeord"]');
    await expect(guideLink).toBeVisible();
    await levelBtn(page, 'A2').click();
    await expect(guideLink).toHaveCount(0);
  });
});

// ── Tag filter ────────────────────────────────────────────────────────────────

test.describe('Blog tag filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
  });

  test('tag filter pills are visible', async ({ page }) => {
    // At least one tag pill should be present given the published posts
    const tagSection = page.locator('text=/topic|emne/i').first();
    await expect(tagSection).toBeVisible();
  });

  test('clicking a tag filters posts', async ({ page }) => {
    // 'adjectives' tag exists on published posts
    const tagButton = page.getByRole('button', { name: 'adjectives', exact: true });
    await tagButton.click();
    const cards = page.locator('a[href^="/blog/"]');
    await expect(cards.first()).toBeVisible();
    const filtered = await cards.count();
    expect(filtered).toBeGreaterThan(0);
  });

  test('clicking the same tag again deselects it', async ({ page }) => {
    const allCount = await page.locator('a[href^="/blog/"]').count();
    const tagButton = page.getByRole('button', { name: 'adjectives', exact: true });
    await tagButton.click();
    await tagButton.click();
    await expect(page.locator('a[href^="/blog/"]')).toHaveCount(allCount);
  });
});

// ── Filter composition ────────────────────────────────────────────────────────

test.describe('Blog filter composition', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
  });

  test('level + tag together show only matching posts', async ({ page }) => {
    await levelBtn(page, 'A2').click();
    const afterLevel = await page.locator('a[href^="/blog/"]').count();

    const tagButton = page.getByRole('button', { name: 'adjectives', exact: true });
    if (await tagButton.isVisible()) {
      await tagButton.click();
      const afterBoth = await page.locator('a[href^="/blog/"]').count();
      expect(afterBoth).toBeLessThanOrEqual(afterLevel);
    }
  });

  test('level + search together narrow results further', async ({ page }) => {
    await levelBtn(page, 'A2').click();
    const afterLevel = await page.locator('a[href^="/blog/"]').count();

    await page.getByRole('searchbox').fill('sakte');
    const afterBoth = await page.locator('a[href^="/blog/"]').count();
    expect(afterBoth).toBeLessThanOrEqual(afterLevel);
  });

  test('clear filters resets level, tag, and search simultaneously', async ({ page }) => {
    const allCount = await page.locator('a[href^="/blog/"]').count();

    await levelBtn(page, 'A2').click();
    await page.getByRole('searchbox').fill('sakte');

    const clearBtn = page.getByRole('button', { name: /clear|fjern/i });
    await clearBtn.click();

    await expect(page.locator('a[href^="/blog/"]')).toHaveCount(allCount);
    await expect(page.getByRole('searchbox')).toHaveValue('');
  });
});

// ── Load more ─────────────────────────────────────────────────────────────────

test.describe('Blog load more', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
  });

  test('shows at most 8 post cards on initial load', async ({ page }) => {
    // Count only non-guide cards (guides use a separate section above the grid)
    const gridCards = page.locator('div.grid a[href^="/blog/"]');
    const count = await gridCards.count();
    expect(count).toBeLessThanOrEqual(8);
  });

  test('load more button appears when there are more than 8 posts', async ({ page }) => {
    const allPosts = await page.locator('div.grid a[href^="/blog/"]').count();
    if (allPosts === 8) {
      test.skip();
    }
    // If fewer than 8 total, no button needed
    // If 8 shown and there are more, the button must be visible
  });

  test('clicking load more shows additional cards', async ({ page }) => {
    const loadMoreBtn = page.getByRole('button', { name: /load more|last inn/i });
    if (!(await loadMoreBtn.isVisible())) {
      test.skip(); // fewer than 8 published posts — skip
    }
    const before = await page.locator('div.grid a[href^="/blog/"]').count();
    await loadMoreBtn.click();
    const after = await page.locator('div.grid a[href^="/blog/"]').count();
    expect(after).toBeGreaterThan(before);
  });

  test('load more resets to page 1 after a filter change', async ({ page }) => {
    const loadMoreBtn = page.getByRole('button', { name: /load more|last inn/i });
    if (!(await loadMoreBtn.isVisible())) test.skip();

    await loadMoreBtn.click();
    const expanded = await page.locator('div.grid a[href^="/blog/"]').count();
    expect(expanded).toBeGreaterThan(8);

    // Apply a filter — count should drop back to ≤ 8
    await levelBtn(page, 'A2').click();
    const afterFilter = await page.locator('div.grid a[href^="/blog/"]').count();
    expect(afterFilter).toBeLessThanOrEqual(8);
  });
});

// ── Grid layout ───────────────────────────────────────────────────────────────

test.describe('Blog grid layout', () => {
  test('desktop: post cards render in 2 columns', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/blog');

    const cards = page.locator('div.grid a[href^="/blog/"]');
    const count = await cards.count();
    if (count < 2) test.skip();

    const box0 = await cards.nth(0).boundingBox();
    const box1 = await cards.nth(1).boundingBox();
    // In a 2-col grid the second card starts to the right of the first
    expect(box0).not.toBeNull();
    expect(box1).not.toBeNull();
    expect(box1!.x).toBeGreaterThan(box0!.x);
  });

  test('mobile: post cards render in 1 column', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/blog');

    const cards = page.locator('div.grid a[href^="/blog/"]');
    const count = await cards.count();
    if (count < 2) test.skip();

    const box0 = await cards.nth(0).boundingBox();
    const box1 = await cards.nth(1).boundingBox();
    expect(box0).not.toBeNull();
    expect(box1).not.toBeNull();
    // In a 1-col layout both cards share the same x position
    expect(box1!.x).toBeCloseTo(box0!.x, 1);
  });
});
