import { expect, test, type Page } from '@playwright/test';
import { injectPlusPlan } from './helpers.js';

// ---------------------------------------------------------------------------
// Helper: answer one grammar question (fill or order) and advance
// ---------------------------------------------------------------------------
async function answerGrammarAndAdvance(page: Page) {
  // Wait for either a question or the summary
  await Promise.race([
    page.getByText(/question \d+ of|spørsmål \d+ av/i).waitFor({ state: 'visible', timeout: 5000 }),
    page.getByText(/session complete|økt fullført/i).waitFor({ state: 'visible', timeout: 5000 })
  ]).catch(() => {});

  if (
    await page
      .getByText(/session complete|økt fullført/i)
      .isVisible({ timeout: 100 })
      .catch(() => false)
  ) {
    return;
  }

  // Fill-blank: type into the text input
  const input = page.getByRole('textbox');
  if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
    await input.fill('ikke');
    await input.press('Enter');
  } else {
    // Order type: click all word chips to build the answer, then submit
    const chips = await page.locator('button[data-chip]').all();
    for (const chip of chips) {
      await chip.click().catch(() => {});
    }
    const submitBtn = page.getByRole('button', { name: /check|sjekk/i });
    if (await submitBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await submitBtn.click();
    } else {
      await page.keyboard.press('Enter');
    }
  }

  // Click Next / See results (scoped to indigo button to avoid accidental matches)
  const next = page.locator('button.bg-indigo-600').filter({
    hasText: /next|see results|neste|se resultater/i
  });
  await next.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (await next.isVisible({ timeout: 500 }).catch(() => false)) {
    await next.click();
    // Wait for the UI to leave the reveal state rather than sleeping unconditionally.
    await Promise.race([
      page
        .getByText(/question \d+ of|spørsmål \d+ av/i)
        .waitFor({ state: 'visible', timeout: 3000 }),
      page.getByText(/session complete|økt fullført/i).waitFor({ state: 'visible', timeout: 3000 })
    ]).catch(() => {});
  }
}

async function completeGrammarSession(page: Page, maxQuestions = 20) {
  const safetyLimit = maxQuestions * 2; // 2× gives ample room for retries
  let iterations = 0;
  while (
    !(await page
      .getByText(/session complete|økt fullført/i)
      .isVisible({ timeout: 100 })
      .catch(() => false))
  ) {
    if (++iterations > safetyLimit) break;
    await answerGrammarAndAdvance(page);
  }
  await page
    .getByText(/session complete|økt fullført/i)
    .waitFor({ state: 'visible', timeout: 10000 })
    .catch(() => {});
}

// ===========================================================================
// Grammar index page (/grammar)
// ===========================================================================

test('grammar index page loads and shows at least one topic card', async ({ page }) => {
  await page.goto('/grammar');
  await expect(page).toHaveURL('/grammar');
  // At least one topic title card is rendered
  await expect(page.getByTestId('topic-title').first()).toBeVisible({ timeout: 8000 });
});

test('free user sees Plus upsell on grammar index when locked topics exist', async ({ page }) => {
  await page.goto('/grammar');
  // Wait for CSR hydration: the free topics grid must be rendered first
  await expect(page.getByTestId('topic-title').first()).toBeVisible({ timeout: 8000 });
  // The upsell banner is a <p> tag with text like "7 more topics with Plus"
  await expect(page.getByText(/\d+ more topics with Plus/i)).toBeVisible({ timeout: 5000 });
});

// ===========================================================================
// Grammar topic page (/grammar/[topic])
// ===========================================================================

test('ikke-placement topic page loads and shows first question', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/grammar/ikke-placement');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 8000 });
  // The session question counter should appear
  await expect(page.getByText(/question \d+ of|spørsmål \d+ av/i)).toBeVisible({ timeout: 8000 });
});

test('back navigation: ?from=b1 shows ← B1 link', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/grammar/ikke-placement?from=b1');
  await expect(page.getByRole('link', { name: /← B1/i })).toBeVisible({ timeout: 5000 });
});

test('back navigation: without ?from shows Grammar topics link', async ({ page }) => {
  await injectPlusPlan(page);
  await page.goto('/grammar/ikke-placement');
  // Scope to <a href="/grammar"> and match the back-link text (EN: "Grammar topics",
  // NB: "Grammatikktemaer"). This avoids colliding with the navbar "Grammatikk" link,
  // which also points to /grammar but uses a shorter label.
  await expect(
    page.locator('a[href="/grammar"]').filter({ hasText: /grammar topics|grammatikktemaer/i })
  ).toBeVisible({ timeout: 5000 });
});

test('free user sees an A1-only session for a topic that also has plusOnly items at other levels (noun-plurals)', async ({
  page
}) => {
  // noun-plurals is free only at A1 per FREE_GRAMMAR_TOPICS (A1-only policy —
  // see ai-docs/gating-rules.md); its A2/B1 content stays Plus-gated even
  // though the topic itself spans A1/A2/B1. Gating is per (topic, cefr), not
  // a fixed count — free users get every non-plusOnly A1 question, capped
  // only by the session's own SESSION_SIZE (10) if the free pool exceeds it.
  // noun-plurals has 8 free A1 questions (none plusOnly), so the free session
  // here is 8 questions, not the full 10-question cap.
  // The lock screen (🔒) only shows when playable.length === 0, i.e. when ALL
  // questions are plusOnly:true, which isn't the case here.
  await page.goto('/grammar/noun-plurals');
  await page.waitForSelector('[data-testid], h1, .bg-amber-50', { timeout: 8000 }).catch(() => {});
  const questionCounter = page.getByText(/question \d+ of|spørsmål \d+ av/i);
  await expect(questionCounter).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/of 8|av 8/i)).toBeVisible({ timeout: 5000 });
});

test('Plus user can answer a grammar question and progress is written to localStorage', async ({
  page
}) => {
  await injectPlusPlan(page);
  await page.goto('/grammar/ikke-placement');

  await page.getByText(/question \d+ of|spørsmål \d+ av/i).waitFor({ timeout: 8000 });
  await answerGrammarAndAdvance(page);

  const keys = await page.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith('grammar-'))
  );
  expect(keys.length).toBeGreaterThan(0);
});

test('Plus user can complete a grammar session and see the summary', async ({ page }) => {
  test.setTimeout(90000);
  await injectPlusPlan(page);
  await page.goto('/grammar/ikke-placement');

  await page.getByText(/question \d+ of|spørsmål \d+ av/i).waitFor({ timeout: 8000 });
  await completeGrammarSession(page);

  await expect(page.getByText(/session complete|økt fullført/i)).toBeVisible({ timeout: 15000 });
});

// ===========================================================================
// Segment cards: a topic's free/locked status must not flip with the filter
// (ai-docs/implementation/grammar-fix.md §7 regression tests)
// ===========================================================================

test('picker: a topic free only at A1 shows a free card unfiltered but no free card when filtered to a locked level', async ({
  page
}) => {
  // noun-plurals is free at A1 only (FREE_GRAMMAR_TOPICS) and locked at
  // A2/B1 — it produces two segments: {free, [A1]} and {locked, [A2, B1]}.
  // Before the segment-card fix, the picker rendered one card per topic and
  // that card flipped from free to locked depending on the active CEFR
  // filter. Now each segment is its own fixed-access card, so the free A1
  // segment must stay a free card unfiltered, and must not appear as a free
  // card at all once filtered to B1 (only the locked segment matches).
  await page.goto('/grammar');
  await expect(page.getByTestId('topic-title').first()).toBeVisible({ timeout: 8000 });

  // Unfiltered: the free segment renders as a direct link to the topic. Once
  // a level pill is active, TopicCard forwards it as ?level= (see
  // ai-docs/implementation/grammar-ux-update.md Step 2/3), so match on the
  // path prefix rather than an exact href to cover both the plain link
  // (unfiltered) and the scoped link (filtered to A1 below).
  const freeCard = page.locator('a[href^="/grammar/noun-plurals"]');
  await expect(freeCard).toBeVisible({ timeout: 5000 });
  await expect(freeCard).toHaveAttribute('href', '/grammar/noun-plurals');

  // Filter to B1 — noun-plurals' B1 segment is locked, so the free card
  // (direct link) must disappear. It must not reappear as "free" just
  // because the topic itself has some free content elsewhere (A1).
  await page.getByRole('button', { name: 'B1', exact: true }).click();
  await expect(freeCard).toHaveCount(0);

  // The locked segment for noun-plurals should still be shown, but only as
  // a Plus-gated card (linking to /plus, not straight into the topic).
  const lockedLinks = page.locator('a[href="/plus?ref=grammar-topics"]');
  await expect(lockedLinks.first()).toBeVisible({ timeout: 5000 });

  // And filtering back to A1 restores the free card — now scoped with
  // ?level=A1, since the active pill is forwarded into the link.
  await page.getByRole('button', { name: 'B1', exact: true }).click(); // deselect
  await page.getByRole('button', { name: 'A1', exact: true }).click();
  await expect(freeCard).toBeVisible({ timeout: 5000 });
  await expect(freeCard).toHaveAttribute('href', '/grammar/noun-plurals?level=A1');
});

// ===========================================================================
// Level-scoped topic page: ?level= must gate free users to that level even
// when the topic has free content at a different level
// (ai-docs/implementation/grammar-fix.md §5/§7)
// ===========================================================================

test("free user hitting a locked segment via ?level= sees the paywall, not the topic's free content at another level", async ({
  page
}) => {
  // noun-plurals is free at A1 but Plus-gated at B1. A locked-segment link
  // or a level-hub link that points at ?level=B1 must show the paywall for
  // a free user, instead of silently falling back to the free A1 questions.
  await page.goto('/grammar/noun-plurals?level=B1');
  await expect(page.getByText(/This topic is a Plus feature|Plus-funksjon/i)).toBeVisible({
    timeout: 8000
  });
  // Confirm it's genuinely the lock screen, not a session that happens to
  // also render some text — the question counter must not appear.
  await expect(page.getByText(/question \d+ of|spørsmål \d+ av/i)).toHaveCount(0);
});

test('free user hitting the same topic without ?level= still sees its free A1 content', async ({
  page
}) => {
  // Sanity check for the above: omitting ?level= entirely preserves the
  // pre-existing "any free level" behavior, so old links/bookmarks without
  // the param don't regress.
  await page.goto('/grammar/noun-plurals');
  await expect(page.getByText(/question \d+ of|spørsmål \d+ av/i)).toBeVisible({ timeout: 8000 });
  await expect(page.getByText(/of 8|av 8/i)).toBeVisible({ timeout: 5000 });
});

test('unknown grammar topic shows a 404 error', async ({ page }) => {
  await page.goto('/grammar/this-topic-does-not-exist');
  // ssr:false routes render the 404 client-side (HTTP status is 200 from the shell).
  // SvelteKit renders a level-1 heading containing "404" and a paragraph with the message.
  await expect(page.getByRole('heading', { name: '404', level: 1 })).toBeVisible({ timeout: 8000 });
});
