import { expect, test } from '@playwright/test';
import { injectPlusPlan } from './helpers.js';

test('home page shows all CEFR level cards linking to hub pages', async ({ page }) => {
  await page.goto('/');
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C']) {
    await expect(
      page
        .getByRole('link', { name: new RegExp(level) })
        .filter({ hasText: level })
        .first()
    ).toBeVisible();
  }
});

test('home page level cards link to /learn/[level]', async ({ page }) => {
  await page.goto('/');
  for (const level of ['a1', 'a2', 'b1', 'b2', 'c']) {
    await expect(
      page
        .getByRole('link', { name: new RegExp(level, 'i') })
        .filter({ hasText: new RegExp(level, 'i') })
        .first()
    ).toHaveAttribute('href', `/learn/${level}`);
  }
});

test('A1 greetings flashcard page loads and shows title', async ({ page }) => {
  await page.goto('/a1/greetings');
  // Phase 3 (ai-docs/implementation/quiz-i18n-and-categories.md): the h1 is
  // now a fixed Ord/Uttrykk mode label, not the category name — the
  // category name moved to the "Studying: X" breadcrumb above it.
  await expect(page.getByText(/studying:\s*greetings/i)).toBeVisible();
});

test('A1 greetings page has mode toggle buttons', async ({ page }) => {
  await page.goto('/a1/greetings');

  // Mode buttons show abbreviated direction labels e.g. "NO → EN" / "EN → NO"
  await expect(page.getByRole('button', { name: /NO → EN/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Word', exact: true })).toBeVisible();

  // Click the "NO → EN" direction button, then switch to phrase mode
  await page.getByRole('button', { name: /NO → EN/i }).click();
  await page.getByRole('button', { name: 'Word', exact: true }).click();
  await page.reload();

  // After reload, the reverse-direction button should be visible
  await expect(page.getByRole('button', { name: /EN → NO/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Phrase', exact: true })).toBeVisible();
});

// 3-A: free users (unauthenticated) do not see a Due mode toggle button
test('free user sees no Due toggle button', async ({ page }) => {
  await page.goto('/a1/greetings');
  await expect(page.getByRole('button', { name: /due/i })).not.toBeVisible();
});

// 3-A: free user sees no upsell banner when no cards are due
// (banner is only shown when dueCount > 0, which is never true on a fresh device)
test('free user sees no upsell banner when no cards are due', async ({ page }) => {
  await page.goto('/a1/greetings');
  await expect(page.getByText('Smart review is a Plus feature')).not.toBeVisible();
});

test('B1 travel flashcard page loads', async ({ page }) => {
  await page.goto('/b1/travel');
  await expect(page.getByText(/studying:\s*travel/i)).toBeVisible();
});

// Plus member: C philosophy page loads with cards and FSRS rating buttons
// Uses c/philosophy which is free-tier accessible (no server-side redirect),
// then injects plan:plus client-side so the due-mode deck rebuilds correctly.
test('Plus member C philosophy flashcard page loads and shows cards', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/c/philosophy');

  // breadcrumb shows correct category (Phase 3: category name lives here,
  // not in the h1 — see the A1 greetings test above). injectPlusPlan also
  // sets the Norwegian locale cookie (see helpers.ts), so the category label
  // itself renders in Norwegian ("Filosofi"), not English ("Philosophy").
  await expect(page.getByText(/studying:\s*filosofi/i)).toBeVisible();

  // card counter is visible (format: "1/N") — wait for deck to build after onMount
  await expect(page.getByText(/^\d+\/\d+$/)).toBeVisible({ timeout: 10000 });

  // flip the card and confirm FSRS rating buttons appear (en: Again/Good, nb: Igjen/Bra)
  const flipCard = page.getByRole('button', { name: /flashcard showing question/i });
  await expect(flipCard).toBeVisible({ timeout: 10000 });
  await flipCard.click({ force: true });
  await expect(page.getByRole('button', { name: /again|igjen|gjenta/i })).toBeVisible({
    timeout: 10000
  });
  await expect(page.getByRole('button', { name: /good|bra/i })).toBeVisible();
});

// free user is redirected away from a Plus-only C category (linguistics is Plus-only)
test('free user is redirected from C linguistics to /plus', async ({ page }) => {
  await page.goto('/c/linguistics');
  await page.waitForURL(/\/plus/, { timeout: 10000 });
  await expect(page).toHaveURL(/\/plus/);
});

// Phase 9 (ai-docs/implementation/uttrykk-category.md): the virtual
// "study all" deck over every uttrykk-c.json entry. Same Plus-gating
// pattern as any other C category (see the linguistics test above), but
// applied to the whole route rather than a single category slug.
//
// fixme: unlike /c/philosophy above (free-tier-accessible, no server
// redirect), /c/uttrykk has no free slice at all — every request hits the
// real `redirect(302, ...)` in +page.server.ts based on locals.plan, which
// is derived server-side from an actual Supabase subscriptions-table
// lookup (see hooks.server.ts). injectPlusPlan/injectLoggedInUser only
// patch the HTML/__data.json *after* the real server response comes back,
// so they can't prevent this redirect — the fake plan never has a chance
// to matter. No seeded Plus test account exists in this e2e suite
// (playwright.config.ts has no auth setup), so this is untestable today.
// Re-enable once a real Plus test session mechanism exists.
test.fixme('Plus member C uttrykk page loads and shows cards', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/c/uttrykk');

  // Phase 3 (ai-docs/implementation/quiz-i18n-and-categories.md): the h1 is
  // now a fixed Ord/Uttrykk mode label driven by cardType (default 'word',
  // so 'Ord' here), not a static "Uttrykk" title — check the page's own
  // "fixed expressions" breadcrumb instead, which is unaffected by Phase 3.
  await expect(page.getByText(/fixed expressions/i)).toBeVisible();

  // card counter is visible (format: "1/N") — wait for deck to build after onMount
  await expect(page.getByText(/^\d+\/\d+$/)).toBeVisible({ timeout: 10000 });

  // flip the card and confirm FSRS rating buttons appear
  const flipCard = page.getByRole('button', { name: /flashcard showing question/i });
  await expect(flipCard).toBeVisible({ timeout: 10000 });
  await flipCard.click({ force: true });
  await expect(page.getByRole('button', { name: /again|igjen|gjenta/i })).toBeVisible({
    timeout: 10000
  });
});

test('free user is redirected from C uttrykk to /plus', async ({ page }) => {
  await page.goto('/c/uttrykk');
  await page.waitForURL(/\/plus/, { timeout: 10000 });
  await expect(page).toHaveURL(/\/plus/);
});

// fixme: same root cause as the test above — the breadcrumb only renders
// once entries.length > 0, which requires the real Plus gate to pass.
test.fixme('C uttrykk page links back to the /learn/c hub', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/c/uttrykk');
  await expect(page.getByRole('link', { name: /back to uttrykk/i })).toHaveAttribute(
    'href',
    '/learn/c#uttrykk'
  );
});

// /learn/c's Uttrykk section total-count line is a Phase 9 addition — it
// used to be plain, unlinked text (see uttrykk-category.md Phase 8) since
// there was no single C uttrykk deck to link to. Visible for every user
// regardless of plan; only clicking it hits the Plus gate above.
test('learn/c hub links to /c/uttrykk from the Uttrykk section', async ({ page }) => {
  await page.goto('/learn/c');
  await expect(page.getByRole('link', { name: /fixed expressions/i })).toHaveAttribute(
    'href',
    '/c/uttrykk'
  );
});

test('about page has expected h1', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Guide to Norskeord');
});
