import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { injectLoggedInFreeUser } from './helpers.js';

// ---------------------------------------------------------------------------
// Locked-page teaser (ai-docs/implementation/locked-teaser-social-login.md,
// Phases 3, 5 and 6).
//
// A free visitor on a Plus-only deck gets the first card's front and a blurred
// placeholder. The blur is cosmetic, so the leak test below is the real guard:
// the server must send the first word and a count, and nothing else.
//
// There is no real Plus session in this suite (injectPlusPlan only patches the
// response after the server decided), so "a Plus user sees the full deck" stays
// a fixme, like the other Plus-only deck tests.
// ---------------------------------------------------------------------------

type Entry = Record<string, unknown> & { norsk: string; category: string };

const A2_TRANSPORT = '/a2/transport';

function loadCategory(file: string, category: string): Entry[] {
  const path = resolve(process.cwd(), 'src/lib/data', file);
  const all = JSON.parse(readFileSync(path, 'utf8')) as Entry[];
  return all.filter((e) => e.category === category);
}

/** A string is safe to look for verbatim in serialised page data. */
function isSearchable(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 8 && !/[<>&"'\\]/.test(value);
}

/**
 * The content fields of an entry that make up the "back" of its card: translations,
 * examples and the definition. An allow-list on purpose: `category`, `level`, `part`
 * and `id` are metadata that legitimately appear in the page URL and data (the word
 * "transport" is in the path of /a2/transport), so they are not a leak.
 */
function isContentKey(key: string): boolean {
  return (
    ['english', 'ukrainian', 'spanish', 'german', 'definition'].includes(key) ||
    key.startsWith('example')
  );
}

/** The long content fields of an entry: examples, translations, definition. */
function longValues(entry: Entry): string[] {
  return Object.entries(entry)
    .filter(([key]) => isContentKey(key))
    .map(([, value]) => value)
    .filter(isSearchable);
}

/**
 * Everything about the deck that must not be in `body`: every long field of the
 * first entry (its "back"), and for every other entry both its long fields and
 * its Norwegian word (as a quoted value, so a word inside prose does not count).
 */
function findLeaks(body: string, entries: Entry[]): string[] {
  const [first, ...others] = entries;
  const leaks: string[] = [];

  for (const value of longValues(first)) {
    if (body.includes(value)) leaks.push(`first card back: ${value}`);
  }
  for (const entry of others) {
    for (const value of longValues(entry)) {
      if (body.includes(value)) leaks.push(`card ${entry.norsk}: ${value}`);
    }
    // The first card's own word is allowed; another card sharing it is not a leak.
    if (entry.norsk !== first.norsk && body.includes(`"${entry.norsk}"`)) {
      leaks.push(`card word: ${entry.norsk}`);
    }
  }
  return leaks;
}

// ---------------------------------------------------------------------------
// Leak test (most important)
// ---------------------------------------------------------------------------

test.describe('locked teaser does not leak the deck', () => {
  const entries = loadCategory('vocab-a2.json', 'transport');

  test('fixture sanity: the A2 transport deck has several entries to leak', () => {
    expect(entries.length).toBeGreaterThan(2);
    expect(longValues(entries[0]).length).toBeGreaterThan(0);
  });

  test('logged-out HTML has the first word, no back and no other card', async ({ request }) => {
    const response = await request.get(A2_TRANSPORT);
    expect(response.status()).toBe(200);
    const body = await response.text();

    // The first card's front is on the page...
    expect(body).toContain(entries[0].norsk);
    // ...and nothing else about the deck is.
    expect(findLeaks(body, entries)).toEqual([]);
  });

  test('logged-out __data.json has no back and no other card', async ({ request }) => {
    const response = await request.get(`${A2_TRANSPORT}/__data.json`);
    expect(response.status()).toBe(200);
    const body = await response.text();

    expect(findLeaks(body, entries)).toEqual([]);
  });

  test('the locked page is never publicly cacheable', async ({ request }) => {
    const response = await request.get(A2_TRANSPORT);
    const cacheControl = response.headers()['cache-control'] ?? '';
    expect(cacheControl).toContain('no-store');
    expect(cacheControl).not.toContain('public');
  });

  test('uttrykk teaser (A2, whole deck) has no back and no other card', async ({ request }) => {
    const uttrykk = JSON.parse(
      readFileSync(resolve(process.cwd(), 'src/lib/data/uttrykk-a2.json'), 'utf8')
    ) as Entry[];
    const response = await request.get('/a2/uttrykk');
    expect(response.status()).toBe(200);
    const body = await response.text();

    expect(body).toContain(uttrykk[0].norsk);
    expect(findLeaks(body, uttrykk)).toEqual([]);
  });

  test('logged-out /api/search answers 403', async ({ request }) => {
    const response = await request.get('/api/search?q=sen');
    expect(response.status()).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// What the visitor sees
// ---------------------------------------------------------------------------

test.describe('locked teaser UI', () => {
  test('logged out: both buttons, each carrying next', async ({ page }) => {
    await page.goto(A2_TRANSPORT);
    await expect(page).toHaveURL(A2_TRANSPORT);

    const next = encodeURIComponent(A2_TRANSPORT);
    await expect(page.locator('a[href^="/plus?ref=teaser-vocab"]')).toHaveAttribute(
      'href',
      `/plus?ref=teaser-vocab&next=${next}`
    );
    await expect(page.getByRole('link', { name: /already plus\?/i })).toHaveAttribute(
      'href',
      `/auth/login?next=${next}`
    );
    await expect(page.getByText(/signed in as/i)).toHaveCount(0);
  });

  test('logged out: shows the first card front, not a redirect', async ({ page }) => {
    const [first] = loadCategory('vocab-a2.json', 'transport');
    await page.goto(A2_TRANSPORT);
    await expect(page.getByRole('img', { name: /preview of the first card/i })).toBeVisible();
    await expect(page.getByText(first.norsk, { exact: true }).first()).toBeVisible();
  });

  test('logged in, free: Get Plus only, with "Signed in as" and "Not you?"', async ({ page }) => {
    await injectLoggedInFreeUser(page);
    await page.goto(A2_TRANSPORT);

    await expect(page.locator('a[href^="/plus?ref=teaser-vocab"]')).toBeVisible();
    await expect(page.getByRole('link', { name: /already plus\?/i })).toHaveCount(0);
    await expect(page.getByText(/signed in as test@example\.com/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /not you\?/i })).toBeVisible();
  });

  test('uttrykk teaser uses its own ref and keeps the path in next', async ({ page }) => {
    await page.goto('/a2/uttrykk');
    await expect(page.locator('a[href^="/plus?ref=teaser-uttrykk"]')).toHaveAttribute(
      'href',
      `/plus?ref=teaser-uttrykk&next=${encodeURIComponent('/a2/uttrykk')}`
    );
  });

  test('uttrykk theme teaser keeps the theme and the hub ref in next', async ({ page }) => {
    await page.goto('/a2/uttrykk?theme=idioms&ref=hub-uttrykk-theme');
    await expect(page.getByRole('img', { name: /preview of the first card/i })).toBeVisible();
    await expect(page.locator('a[href^="/plus?ref=teaser-uttrykk"]')).toHaveAttribute(
      'href',
      `/plus?ref=teaser-uttrykk&next=${encodeURIComponent('/a2/uttrykk?theme=idioms&ref=hub-uttrykk-theme')}`
    );
  });

  test('A1 vocab and uttrykk are fully open: no teaser', async ({ page }) => {
    for (const path of ['/a1/greetings', '/a1/uttrykk']) {
      await page.goto(path);
      await expect(page.getByRole('img', { name: /preview of the first card/i })).toHaveCount(0);
    }
  });

  test('a free category above A1 is not a teaser', async ({ page }) => {
    await page.goto('/a2/clothing');
    await expect(page.getByRole('img', { name: /preview of the first card/i })).toHaveCount(0);
    await expect(page.getByText(/studying:\s*clothing/i)).toBeVisible();
  });

  // fixme: needs a real Plus session (see the note at the top of this file).
  test.fixme('Plus member sees the full deck on a locked category', async () => {});
});

// ---------------------------------------------------------------------------
// Hub pills lead to the teaser, with their ref kept
// ---------------------------------------------------------------------------

test.describe('hub pills for locked decks', () => {
  test('locked vocab pill links to the category page, not /plus', async ({ page }) => {
    await page.goto('/learn/a2');
    const pill = page.locator('a[href="/a2/transport?ref=hub-vocab-badge"]');
    await expect(pill).toBeVisible();
    await expect(pill).toContainText('🔒');
  });

  test('locked uttrykk theme pills link to the uttrykk page with the theme', async ({ page }) => {
    await page.goto('/learn/a2');
    const pills = page.locator('#uttrykk a[href*="ref=hub-uttrykk-theme"]');
    await expect(pills.first()).toBeVisible();
    await expect(pills.first()).toHaveAttribute('href', /^\/a2\/uttrykk\?theme=[^&]+&ref=/);
  });
});
