import { expect, test } from '@playwright/test';
import { injectPlusPlan } from './helpers.js';

// ---------------------------------------------------------------------------
// /norskproven page
// ---------------------------------------------------------------------------

test.describe('/norskproven page', () => {
  test('page loads with expected h1', async ({ page }) => {
    await page.goto('/norskproven');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('shows A2 and B1 section headings', async ({ page }) => {
    await page.goto('/norskproven');
    await expect(page.getByRole('heading', { name: 'A2', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'B1', level: 2 })).toBeVisible();
  });

  // ── A2 category links are all free ────────────────────────────────────────

  test('A2 category links keep their hrefs (some are locked for free users)', async ({ page }) => {
    await page.goto('/norskproven');
    const freeSlugs = [
      'shopping',
      'transport',
      'health',
      'occupations',
      'directions',
      'time',
      'communication',
      'hobbies'
    ];
    for (const slug of freeSlugs) {
      await expect(page.getByRole('link', { name: new RegExp(slug, 'i') }).first()).toHaveAttribute(
        'href',
        `/a2/${slug}`
      );
    }
  });

  test('A2 clothing link opens a page with vocab entries, not empty', async ({ page }) => {
    // clothing is one of the 3 free A2 categories (money, clothing, weather);
    // health is Plus-only since the free-tier simplification.
    await page.goto('/a2/clothing');
    await expect(page).toHaveURL('/a2/clothing');
    // Phase 3 (ai-docs/implementation/quiz-i18n-and-categories.md): the h1 is
    // now a fixed Ord/Uttrykk mode label, not the category name — the
    // category name moved to the "Studying: X" breadcrumb above it (see the
    // equivalent fix in e2e/flashcard.test.ts).
    await expect(page.getByText(/studying:\s*clothing/i)).toBeVisible();
  });

  test('free user sees a lock on Plus categories and none on free ones', async ({ page }) => {
    await page.goto('/norskproven');
    // shopping is Plus at A2; travel is one of the 3 free B1 categories.
    await expect(page.getByRole('link', { name: /shopping/i }).first()).toContainText('🔒');
    await expect(page.getByRole('link', { name: /^travel$/i }).first()).not.toContainText('🔒');
  });

  test('B1 society link points at a real category', async ({ page }) => {
    await page.goto('/norskproven');
    await expect(page.getByRole('link', { name: /society/i }).first()).toHaveAttribute(
      'href',
      '/b1/society-nouns'
    );
  });

  test('A2 health is Plus-only and redirects free users to /plus', async ({ page }) => {
    await page.goto('/a2/health');
    await page.waitForURL(/\/plus/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/plus/);
  });

  // ── B1 free categories are not plus-gated ────────────────────────────────

  // B1: 3 free categories (FREE_VOCAB_CATEGORIES.B1); the rest are Plus.
  const b1FreeSlugs = ['travel', 'environment', 'technology'];

  for (const slug of b1FreeSlugs) {
    test(`B1 ${slug} is accessible to free users (no redirect to /plus)`, async ({ page }) => {
      await page.goto(`/b1/${slug}`);
      await expect(page).not.toHaveURL(/\/plus/);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  }

  // These were free before the free-tier simplification.
  const b1PlusSlugs = ['work', 'education', 'health', 'relationships', 'culture'];

  for (const slug of b1PlusSlugs) {
    test(`B1 ${slug} is Plus-only and redirects free users to /plus`, async ({ page }) => {
      await page.goto(`/b1/${slug}`);
      await page.waitForURL(/\/plus/, { timeout: 10000 });
      await expect(page).toHaveURL(/\/plus/);
    });
  }

  // ── B1 "Unlock with Plus" CTA for non-plus users ─────────────────────────

  test('non-plus user sees "Unlock with Plus" CTA under the B1 and A2 sections', async ({
    page
  }) => {
    await page.goto('/norskproven');
    await expect(page.locator('a[href="/plus?ref=norskproven-b1"]')).toBeVisible();
    await expect(page.locator('a[href="/plus?ref=norskproven-a2"]')).toBeVisible();
    await expect(page.locator('a[href="/plus?ref=norskproven-b1"]')).toHaveText(
      /unlock with plus/i
    );
  });

  test('plus user does NOT see "Unlock with Plus" CTA', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven');
    await expect(page.getByRole('link', { name: /unlock with plus/i })).toHaveCount(0);
  });

  // ── Browse all links ─────────────────────────────────────────────────────

  test('A2 section has a "browse all" link to /learn/a2', async ({ page }) => {
    await page.goto('/norskproven');
    await expect(page.getByRole('link', { name: /browse all a2|a2 categories/i })).toHaveAttribute(
      'href',
      '/learn/a2'
    );
  });
});
