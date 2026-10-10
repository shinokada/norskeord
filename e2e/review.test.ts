import { expect, test, type Page } from '@playwright/test';
import { setNorwegianLocale } from './helpers';

/**
 * ai-docs/implementation/due-only.md — Step 5 (verification).
 *
 * Free/guest path only — localStorage is trivial to seed with
 * page.addInitScript (same pattern as e2e/my-progress.test.ts). The Plus path
 * (loadProgressMapFromSupabase + the per-category due badges in
 * LevelStatRows.svelte) isn't testable here for the same reason two tests
 * in e2e/flashcard.test.ts are `.fixme`: injectPlusPlan() only patches
 * page.data.plan client-side, there's no seeded Plus account with real
 * card_progress rows to query.
 *
 * The seeded entry below is a real production vocab-a1.json entry
 * ("uthus", category "home") — DUE_ID intentionally uses its *original*
 * pre-migration id (v-a1-home-034, format v-{level}-{category}-{NNN}) as
 * the seeded localStorage key. Since ai-docs/implementation/id-new-format.md's
 * migrations (Rounds 1–3), this id no longer exists in production data —
 * it's now w-000572, per src/lib/data/id-migration-map.json (a single-hop
 * mapping straight from this original shape to the final shared
 * w-{NNNNNN} format, flattened through the intermediate Round 1/2 shapes
 * during the Round 3 migration) — so this test doubles as an end-to-end
 * regression check for the runtime fallback in progress.ts: loadProgressMap()
 * must remap this stale key to the current id before /api/review-entries
 * can resolve it, or the seeded card silently fails to appear and this
 * test fails.
 */
const DUE_ID = 'v-a1-home-034';
const SEED_KEY = `progress-${DUE_ID}`;

function seedValue(due: Date) {
  return JSON.stringify({
    fsrs: {
      due: due.toISOString(),
      stability: 1,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 1,
      learning_steps: 0,
      reps: 1,
      lapses: 0,
      state: 2 // Review
    },
    seenCount: 1,
    lastSeen: new Date().toISOString(),
    level: 'A1',
    category: 'home'
  });
}

const DUE_YESTERDAY = seedValue(new Date(Date.now() - 86_400_000));
const DUE_TOMORROW = seedValue(new Date(Date.now() + 86_400_000));

async function seed(page: Page, value: string) {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
    key: SEED_KEY,
    value
  });
}

/**
 * A real production A1 Uttrykk entry (uttrykk-a1.json, "Hvor kommer du fra? ...",
 * category "greetings"). Seeded alongside the vocab card so the level-tab due
 * count has to sum *both* content types — a regression that dropped Uttrykk
 * would otherwise still pass. The stored level/category in seedValue() are
 * just a snapshot; my-progress buckets by the live resolveEntry() location.
 */
const UTTRYKK_DUE_ID = 'w-007931';

async function seedUttrykk(page: Page, value: string) {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
    key: `progress-${UTTRYKK_DUE_ID}`,
    value
  });
}

test.describe('/review', () => {
  test('shows the empty state when nothing is due', async ({ page }) => {
    // No seed at all — a fresh guest has no progress rows, so getDueItems()
    // returns []. ?type=vocab skips the picker so this reaches the empty
    // state directly rather than stopping at the picker screen.
    await page.goto('/review?type=vocab');
    await expect(page.getByText('Nothing due right now')).toBeVisible();
  });

  test('shows the picker when arriving with no ?type= or ?category=', async ({ page }) => {
    // Global and per-level entry points both link here without ?type= —
    // the person picks Vocabulary / Uttrykk / Both before anything loads.
    await page.goto('/review');
    await expect(page.getByRole('heading', { name: 'What do you want to review?' })).toBeVisible();
    await expect(page.getByRole('button', { name: /vocabulary/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /uttrykk/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Both' })).toBeVisible();
  });

  test('resolves and renders a due card end to end', async ({ page }) => {
    await seed(page, DUE_YESTERDAY);
    await page.goto('/review?type=vocab');

    // Exercises getDueItems() -> POST /api/review-entries -> VocabFlashcardPage
    // for real — a 1-card deck built entirely from the seeded progress row.
    await expect(page.getByText(/^\d+\/\d+$/)).toBeVisible({ timeout: 10000 });

    const flipCard = page.getByRole('button', { name: /flashcard showing question/i });
    await expect(flipCard).toBeVisible();
    await flipCard.click({ force: true });
    await expect(page.getByRole('button', { name: /again/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /good/i })).toBeVisible();
  });
});

test.describe('/my-progress — Study due entry points (Step 4a/4b)', () => {
  test('shows a "Study due now" button on the Vocabulary card linking to /review?type=vocab', async ({
    page
  }) => {
    // my-progress-update.md: one "Study due now" button in the panel header,
    // for the selected tab only. Vocab is the default tab and the only type
    // due here, so exactly one such link renders.
    await seed(page, DUE_YESTERDAY);
    await page.goto('/my-progress');
    const button = page.getByRole('link', { name: /study due now/i });
    await expect(button).toHaveCount(1);
    // "Study due now" studies the selected level (A1 is the default tab here).
    await expect(button).toHaveAttribute('href', '/review?type=vocab&level=A1');
  });

  test('shows a "Study due now" button on the Uttrykk card linking to /review?type=uttrykk', async ({
    page
  }) => {
    await seedUttrykk(page, DUE_YESTERDAY);
    await page.goto('/my-progress?tab=uttrykk');
    const button = page.getByRole('link', { name: /study due now/i });
    await expect(button).toHaveCount(1);
    await expect(button).toHaveAttribute('href', '/review?type=uttrykk&level=A1');
  });

  test('hides every "Study due now" button when nothing is currently due', async ({ page }) => {
    // Due tomorrow, not today — totalSeen > 0 but nothing is due, so no card
    // renders a button.
    await seed(page, DUE_TOMORROW);
    await page.goto('/my-progress');
    await expect(page.getByRole('link', { name: /study due now/i })).toHaveCount(0);
  });

  test('shows the active tab\'s due count on the A1 level tab, with no per-level "Study due at" link', async ({
    page
  }) => {
    // The old per-level "Study due at A1" row was replaced by a count badge on
    // each level tab (ai-docs/implementation/due-number-update.md). The tab's
    // accessible name carries the count ("A1, 1 due") for screen readers.
    // my-progress-update.md: the badge counts only the active content tab, so
    // 1 vocab + 1 uttrykk card due gives 1 on each tab, not 2.
    await seed(page, DUE_YESTERDAY);
    await seedUttrykk(page, DUE_YESTERDAY);
    await page.goto('/my-progress?tab=vocab');
    await expect(page.getByRole('tab', { name: 'A1, 1 due', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /study due at/i })).toHaveCount(0);
    await page.goto('/my-progress?tab=uttrykk');
    await expect(page.getByRole('tab', { name: 'A1, 1 due', exact: true })).toBeVisible();
  });

  test('localizes the level tab accessible name (nb)', async ({ page }) => {
    // Norwegian: the count suffix comes from paraglide (stats_level_tab_due_aria),
    // not a hardcoded English "due".
    await setNorwegianLocale(page);
    await seed(page, DUE_YESTERDAY);
    await seedUttrykk(page, DUE_YESTERDAY);
    await page.goto('/my-progress');
    await expect(page.getByRole('tab', { name: 'A1, 1 forfaller', exact: true })).toBeVisible();
  });

  test('shows no due count on a level tab when nothing is due there', async ({ page }) => {
    // Due tomorrow, not today — the tab keeps its plain name (no ", N due").
    await seed(page, DUE_TOMORROW);
    await page.goto('/my-progress');
    await expect(page.getByRole('tab', { name: 'A1', exact: true })).toBeVisible();
  });
});

// ── /review/grammar (Fix 3, due-only-review-update.md) ───────────────────

/**
 * Real production A1 grammar question (topic personlige-pronomen, free per
 * FREE_GRAMMAR_TOPICS in config.ts) so /api/review-grammar-entries resolves
 * it against actual grammar-a1.json data — same reasoning as the vocab seed
 * above (DUE_ID / v-a1-home-034). "transform" type: TransformQuestion.svelte
 * quotes `question.source` verbatim, which the tests below assert on.
 */
const GRAMMAR_DUE_ID = 'gq-perspron-001';
const GRAMMAR_SOURCE_TEXT = 'Petter bor i Bergen.';
const GRAMMAR_ANSWER_TEXT = 'Han bor i Bergen.';
const GRAMMAR_SEED_KEY = `grammar-${GRAMMAR_DUE_ID}`;

function grammarSeedValue(due: Date) {
  return JSON.stringify({
    fsrs: {
      due: due.toISOString(),
      stability: 1,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 1,
      learning_steps: 0,
      reps: 1,
      lapses: 0,
      state: 2 // Review
    },
    seenCount: 1,
    lastSeen: new Date().toISOString(),
    level: 'A1',
    category: 'personlige-pronomen'
  });
}

const GRAMMAR_DUE_YESTERDAY = grammarSeedValue(new Date(Date.now() - 86_400_000));

async function seedGrammar(page: Page, value: string) {
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
    key: GRAMMAR_SEED_KEY,
    value
  });
}

test.describe('/review/grammar', () => {
  test('shows the empty state when nothing is due', async ({ page }) => {
    // No seed at all — a fresh guest has no grammar progress rows, so
    // getDueGrammarItems() returns []. Unlike /review, there's no picker
    // step here (grammar is entered only from topic-specific due badges —
    // see the Decisions section in due-only-review-update.md), so this
    // goes straight to the empty state.
    await page.goto('/review/grammar');
    await expect(page.getByText('No questions available for this topic yet.')).toBeVisible();
  });

  test('resolves and renders a due grammar question end to end', async ({ page }) => {
    await seedGrammar(page, GRAMMAR_DUE_YESTERDAY);
    await page.goto('/review/grammar');

    // Exercises getDueGrammarItems() -> POST /api/review-grammar-entries ->
    // the due-only renderer for real — a 1-question deck built entirely
    // from the seeded progress row.
    await expect(page.getByText('Question 1 of 1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(GRAMMAR_SOURCE_TEXT)).toBeVisible();

    const input = page.getByPlaceholder('Skriv svaret ditt…');
    await input.fill(GRAMMAR_ANSWER_TEXT);
    await page.getByRole('button', { name: 'Sjekk' }).click();

    // AnswerReveal shows a correct/incorrect verdict after grading — an
    // exact-match answer (modulo case/punctuation) grades correct.
    await expect(page.getByText('Riktig!')).toBeVisible();
  });

  test('scopes to one CEFR level via ?level=', async ({ page }) => {
    await seedGrammar(page, GRAMMAR_DUE_YESTERDAY);
    // The seeded question is A1 — an A2-scoped session should find nothing
    // due, proving getDueGrammarItems()'s level filter is actually applied.
    await page.goto('/review/grammar?level=a2');
    await expect(page.getByText('No questions available for this topic yet.')).toBeVisible();
  });

  test('scopes to one topic via ?topic=', async ({ page }) => {
    await seedGrammar(page, GRAMMAR_DUE_YESTERDAY);
    // Right level, wrong topic — the seeded question belongs to
    // personlige-pronomen, not sterke-verb.
    await page.goto('/review/grammar?level=a1&topic=sterke-verb');
    await expect(page.getByText('No questions available for this topic yet.')).toBeVisible();
  });
});

test.describe('/my-progress — Grammar due badge (Fix 3)', () => {
  test('shows a "Study due now" button on the Grammar card linking to /review/grammar', async ({
    page
  }) => {
    await seedGrammar(page, GRAMMAR_DUE_YESTERDAY);
    await page.goto('/my-progress?tab=grammar');
    const button = page.getByRole('link', { name: /study due now/i });
    await expect(button).toHaveCount(1);
    await expect(button).toHaveAttribute('href', '/review/grammar?level=A1');
  });

  test('shows a clickable grammar due badge linking to /review/grammar', async ({ page }) => {
    await seedGrammar(page, GRAMMAR_DUE_YESTERDAY);
    await page.goto('/my-progress?tab=grammar');
    // Grammar topic-level progress is free for every plan (not gated by
    // isPlus — see the comment above the Grammar section in
    // my-progress/+page.svelte), so this works for the default guest session,
    // same as the rest of this file. The tab's name may carry a ", N due"
    // suffix, so match the level prefix rather than the exact name.
    await page.getByRole('tab', { name: /^A1\b/ }).click();
    const badge = page.getByRole('link', { name: /1 due/i });
    await expect(badge).toBeVisible();
    await expect(badge).toHaveAttribute(
      'href',
      '/review/grammar?level=a1&topic=personlige-pronomen'
    );
  });
});
