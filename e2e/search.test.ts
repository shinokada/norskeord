import { expect, test, type Page } from '@playwright/test';
import { injectPlusPlan, setNorwegianLocale } from './helpers.js';

// ---------------------------------------------------------------------------
// /api/search is Plus-only on the server, but the e2e suite only fakes Plus on
// the client (see injectPlusPlan), so the real endpoint would answer 403.
// These tests mock the endpoint and assert on the requests the modal makes.
// Call mockSearchApi AFTER injectPlusPlan: later page.route handlers win.
// ---------------------------------------------------------------------------

const SEARCH_API = /\/api\/search(\?|$)/;
const OLD_INDEX = /\/data\/search-index\.json/;

type FixtureResult = {
  id: string;
  entryId: string;
  sense?: string;
  norsk: string;
  lemma: string;
  translation: string;
  example: string;
  level: string;
  category: string;
  source: 'vocab' | 'uttrykk';
  href: string;
};

function resultsFor(q: string): FixtureResult[] {
  if (q.startsWith('hei')) {
    return [
      {
        id: 'vocab-a1-00001',
        entryId: 'w-000001',
        norsk: 'hei',
        lemma: 'hei',
        translation: 'hello',
        example: 'Hei! Hvordan g\u00e5r det?',
        level: 'A1',
        category: 'greetings',
        source: 'vocab',
        href: '/a1/greetings'
      }
    ];
  }
  if (q.startsWith('gang')) {
    return [
      {
        id: 'vocab-a2-00010',
        entryId: 'w-000010',
        sense: 'walk',
        norsk: 'gang (en)',
        lemma: 'gang',
        translation: 'walk',
        example: 'Vi tok en gang rundt vannet.',
        level: 'A2',
        category: 'home',
        source: 'vocab',
        href: '/a2/home'
      },
      {
        id: 'vocab-a2-00011',
        entryId: 'w-000011',
        sense: 'time',
        norsk: 'gang (en)',
        lemma: 'gang',
        translation: 'time, occasion',
        example: 'Jeg har v\u00e6rt der \u00e9n gang.',
        level: 'A2',
        category: 'home',
        source: 'vocab',
        href: '/a2/home'
      },
      {
        id: 'vocab-a2-00012',
        entryId: 'w-000012',
        norsk: 'inngang (en)',
        lemma: 'inngang',
        translation: 'entrance',
        example: 'Vi m\u00f8tes ved inngangen.',
        level: 'A2',
        category: 'home',
        source: 'vocab',
        href: '/a2/home'
      }
    ];
  }
  return [];
}

/** Mocks /api/search and returns the list of request URLs it has received. */
async function mockSearchApi(page: Page): Promise<string[]> {
  const calls: string[] = [];
  await page.route(SEARCH_API, async (route) => {
    const url = route.request().url();
    calls.push(url);
    const q = new URL(url).searchParams.get('q') ?? '';
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
      body: JSON.stringify({ results: resultsFor(q) })
    });
  });
  return calls;
}

/** Records any request to the removed public index file. */
function trackOldIndex(page: Page): string[] {
  const hits: string[] = [];
  page.on('request', (req) => {
    if (OLD_INDEX.test(req.url())) hits.push(req.url());
  });
  return hits;
}

// ---------------------------------------------------------------------------
// Free user — search button is NOT visible (Plus-only feature)
// ---------------------------------------------------------------------------

test('free user does NOT see search button in nav', async ({ page }) => {
  await setNorwegianLocale(page);
  await page.goto('/');
  await expect(page.getByTestId('search-button')).not.toBeVisible();
});

test('free user Cmd/Ctrl+K does not open search modal', async ({ page }) => {
  await setNorwegianLocale(page);
  await page.goto('/');
  await page.keyboard.press('Meta+k');
  // Modal must not appear for free users
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('free user never requests /api/search or the old search index', async ({ page }) => {
  await setNorwegianLocale(page);
  const searchCalls: string[] = [];
  page.on('request', (req) => {
    if (SEARCH_API.test(req.url())) searchCalls.push(req.url());
  });
  const oldIndexHits = trackOldIndex(page);

  await page.goto('/');
  await page.keyboard.press('Meta+k');
  await page.waitForTimeout(500);

  expect(searchCalls).toHaveLength(0);
  expect(oldIndexHits).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// Plus user — modal opens and is functional
// ---------------------------------------------------------------------------

test('Plus user sees search button in nav', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/');
  // Wait for onMount to fetch /api/plan and update clientIsPlus
  await expect(page.getByTestId('search-button')).toBeVisible({ timeout: 3000 });
});

test('Plus user clicking search icon opens modal with search input', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/');
  await page.getByTestId('search-button').waitFor();
  await page.getByTestId('search-button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('searchbox')).toBeVisible();
});

test('Plus user can open modal with Cmd/Ctrl+K shortcut', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/');
  // Wait for onMount's async /api/plan fetch to resolve (authStore.init()),
  // which is what flips effectiveIsPlus — and therefore Search's `isPlus`
  // prop — to true. Without this, Meta+k can fire while isPlus is still
  // false and the shortcut handler's `else if (isPlus) open = true` branch
  // never runs. Mirrors the wait already used before the click-based test
  // above.
  await page.getByTestId('search-button').waitFor();
  // Use Meta+K (Cmd on Mac) — Playwright treats Meta as Cmd
  await page.keyboard.press('Meta+k');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('searchbox')).toBeVisible();
});

test('Escape closes the search modal', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/');
  await page.getByTestId('search-button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('clicking backdrop closes the search modal', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/');
  await page.getByTestId('search-button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  // Click the backdrop (outside the panel) — use top-left corner of the overlay
  await page.mouse.click(10, 10);
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('typing a query shows results', async ({ page }) => {
  await injectPlusPlan(page);
  await mockSearchApi(page);
  await page.goto('/');
  await page.getByTestId('search-button').click();
  await page.getByRole('searchbox').pressSequentially('hei');
  // Wait for debounce (250 ms) + the response. Use an assertion-level
  // timeout instead of a fixed sleep so this doesn't flake under load.
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 10000 });
});

test('short query (1 char) makes no request and shows no results', async ({ page }) => {
  await injectPlusPlan(page);
  const calls = await mockSearchApi(page);
  await page.goto('/');
  await page.getByTestId('search-button').click();
  await page.getByRole('searchbox').fill('h');
  await page.waitForTimeout(500);
  await expect(page.getByRole('option')).toHaveCount(0);
  expect(calls).toHaveLength(0);
});

test('searches go to /api/search with q, source, level and locale, never the old index', async ({
  page
}) => {
  await injectPlusPlan(page);
  const calls = await mockSearchApi(page);
  const oldIndexHits = trackOldIndex(page);

  await page.goto('/');
  await page.getByTestId('search-button').click();
  await page.getByRole('searchbox').pressSequentially('hei');
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 10000 });

  expect(calls.length).toBeGreaterThan(0);
  const params = new URL(calls[calls.length - 1]).searchParams;
  expect(params.get('q')).toBe('hei');
  expect(params.get('source')).toBe('all');
  expect(params.get('level')).toBe('all');
  expect(params.get('locale')).toBe('nb');
  expect(oldIndexHits).toHaveLength(0);
});

test('a level filter click re-searches with that level', async ({ page }) => {
  await injectPlusPlan(page);
  const calls = await mockSearchApi(page);
  await page.goto('/');
  await page.getByTestId('search-button').click();
  await page.getByRole('searchbox').pressSequentially('hei');
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: 'B1', exact: true }).click();
  await expect
    .poll(() => calls.some((u) => new URL(u).searchParams.get('level') === 'B1'))
    .toBe(true);
});

test('a 429 shows the rate-limit message', async ({ page }) => {
  await injectPlusPlan(page);
  await page.route(SEARCH_API, (route) =>
    route.fulfill({
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '30' },
      body: JSON.stringify({ error: 'rate_limited' })
    })
  );
  await page.goto('/');
  await page.getByTestId('search-button').click();
  await page.getByRole('searchbox').pressSequentially('hei');
  await expect(page.getByText('For mange s\u00f8k')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('option')).toHaveCount(0);
});

// ---------------------------------------------------------------------------
// Deep link: result click carries the exact entry id (vocab-multiple-senses,
// Phase 2b). Results come from the mocked endpoint above.
// ---------------------------------------------------------------------------

test('clicking a search result navigates with id=w-NNNNNN and word= in the URL', async ({
  page
}) => {
  await injectPlusPlan(page);
  await mockSearchApi(page);
  await page.goto('/');
  await page.getByTestId('search-button').click();
  await page.getByRole('searchbox').pressSequentially('hei');
  // A1 rows are free-tier, so the redirect to /plus can't interfere.
  const row = page.getByRole('option').filter({ hasText: 'A1' }).first();
  await expect(row).toBeVisible({ timeout: 10000 });
  await row.click();
  await page.waitForURL(/[?&]id=w-\d{6}/, { timeout: 10000 });
  expect(page.url()).toMatch(/[?&]word=/);
  // The deck built for the deep link is not empty.
  await expect(page.getByText(/^\d+\/\d+$/)).toBeVisible({ timeout: 10000 });
});

test('the two senses of `gang (en)` are separate results with different ids', async ({ page }) => {
  test.setTimeout(60000);
  const ids = new Set<string>();
  await injectPlusPlan(page);
  await mockSearchApi(page);

  for (const index of [0, 1]) {
    await page.goto('/');
    await page.getByTestId('search-button').click();
    await page.getByRole('searchbox').pressSequentially('gang');
    // Anchor to the start of the row: a plain substring would also match
    // compounds such as `inngang (en)` / `utgang (en)`.
    const rows = page.getByRole('option').filter({ hasText: /^\s*gang \(en\)/ });
    await expect(rows).toHaveCount(2, { timeout: 10000 });
    // The result links to /a2/home?id=..., which is Plus-only for a free session
    // (the e2e suite has no real Plus session), so the page redirects to /plus.
    // The id is still present in the navigation or its __data.json request, so
    // read it from the request instead of waiting for the final URL.
    const [request] = await Promise.all([
      page.waitForRequest((req) => /[?&]id=w-\d{6}/.test(req.url()), { timeout: 10000 }),
      rows.nth(index).click()
    ]);
    ids.add(new URL(request.url()).searchParams.get('id') ?? '');
  }

  expect(ids.size).toBe(2);
});
