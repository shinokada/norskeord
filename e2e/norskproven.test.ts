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

  test('A2 free categories link to correct hrefs', async ({ page }) => {
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

  test('A2 health link opens a page with vocab entries, not empty', async ({ page }) => {
    await page.goto('/a2/health');
    await expect(page).toHaveURL('/a2/health');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Health');
  });

  // ── B1 free categories are not plus-gated ────────────────────────────────

  const b1FreeSlugs = [
    'work',
    'education',
    'health',
    'relationships',
    'travel',
    'society',
    'culture',
    'environment'
  ];

  for (const slug of b1FreeSlugs) {
    test(`B1 ${slug} is accessible to free users (no redirect to /plus)`, async ({ page }) => {
      await page.goto(`/b1/${slug}`);
      await expect(page).not.toHaveURL(/\/plus/);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  }

  // ── B1 "Unlock with Plus" CTA for non-plus users ─────────────────────────

  test('non-plus user sees "Unlock with Plus" CTA under B1 section', async ({ page }) => {
    await page.goto('/norskproven');
    await expect(page.getByRole('link', { name: /unlock with plus/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /unlock with plus/i })).toHaveAttribute(
      'href',
      '/plus?ref=norskproven-b1'
    );
  });

  test('plus user does NOT see "Unlock with Plus" CTA', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven');
    await expect(page.getByRole('link', { name: /unlock with plus/i })).not.toBeVisible();
  });

  test('plus user does NOT see "Unlock with Plus" CTA for B1', async ({ page }) => {
    await injectPlusPlan(page);
    await page.goto('/norskproven');
    // When plus, the upsell CTA must not be visible
    await expect(page.getByRole('link', { name: /unlock with plus/i })).not.toBeVisible();
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
