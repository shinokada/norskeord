#!/usr/bin/env node
/**
 * fix-c-uttrykk-orphaned-categories.mjs
 *
 * Step 1 (classification) of
 * ai-docs/implementation/c-uttrykk-abstract-concepts-fix.md.
 *
 * `uttrykk-c.json` carries 6 category slugs that no longer exist in
 * `CATEGORIES_BY_LEVEL.C` — orphaned when `vocab-c.json`'s matching
 * categories were split in `c-new-categories.md` (pass 1) and
 * `c-new-categories-2.md` (pass 2), but `uttrykk-c.json` was never updated
 * to match. This script reassigns all 333 affected entries onto real
 * `CATEGORIES_BY_LEVEL.C` slugs. Only the `category` field is touched.
 *
 * Two fix shapes (see the doc's Decision 2):
 *
 *  MERGE — fold into an existing successor sibling, comfortably under the
 *  120 ceiling once combined:
 *    complex-emotions (43)   → complex-emotions-verbs-and-expressions (41→84)
 *    embodied-emotion (42)   → embodied-emotion-idiomatic-expressions (47→89)
 *    manner-of-motion (8)    → manner-of-motion-idiomatic-expressions (56→64)
 *    everyday-objects (11)   → everyday-objects-verbs (38→49) — confirmed.
 *
 *  NEW SLUG — merging would blow past the ceiling, needs a genuinely new
 *  CATEGORIES_BY_LEVEL.C member:
 *    interpersonal-conflict (94) → interpersonal-conflict-expressions — confirmed.
 *    abstract-concepts (135)     → split in two along a verb-first /
 *                                  non-verb-first axis (see
 *                                  classifyAbstractConcept below) — the
 *                                  --dry-run breakdown came out 98 / 37,
 *                                  both comfortably sized. Slug names
 *                                  abstract-action-idioms /
 *                                  abstract-circumstance-expressions — confirmed.
 *
 * All slug names below are confirmed (sign-off received) — ready to run
 * for real after a final --dry-run sanity check.
 *
 * Usage:
 *   node scripts/fix-c-uttrykk-orphaned-categories.mjs --dry-run   ← always try this first
 *   node scripts/fix-c-uttrykk-orphaned-categories.mjs
 *
 * Options:
 *   --dry-run   Print counts, breakdowns and samples; write nothing.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src/lib/data');
const UTTRYKK_FILE = path.join(DATA_DIR, 'uttrykk-c.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

// ── Confirmed new slug names (sign-off received) ────────────────────────────
const INTERPERSONAL_CONFLICT_NEW_SLUG = 'interpersonal-conflict-expressions'; // confirmed — 94 entries
const ABSTRACT_ACTION_SLUG = 'abstract-action-idioms'; // confirmed — verb-first, ~98 entries
const ABSTRACT_CIRCUMSTANCE_SLUG = 'abstract-circumstance-expressions'; // confirmed — non-verb-first, ~37 entries

// ── Merge targets (existing CATEGORIES_BY_LEVEL.C slugs — do not rename) ───
const MERGE_TARGETS = {
  'complex-emotions': 'complex-emotions-verbs-and-expressions',
  'embodied-emotion': 'embodied-emotion-idiomatic-expressions',
  'manner-of-motion': 'manner-of-motion-idiomatic-expressions',
  'everyday-objects': 'everyday-objects-verbs' // confirmed — 38→49
};

const STALE_CATEGORIES = [
  'abstract-concepts',
  'interpersonal-conflict',
  'complex-emotions',
  'embodied-emotion',
  'everyday-objects',
  'manner-of-motion'
];

// ── Classification: abstract-concepts (verb-first / non-verb-first axis) ───
// All 135 entries are part: "phrase" with a 3+-word lemma — no POS field to
// split on (same constraint as B2's `idioms`). Grouping by whether the
// lemma's first word is itself a bare-infinitive verb separates "you DO
// this" idioms (ta affære, gå i stå, sette kronen på verket) from fixed
// circumstantial/descriptive phrases (i samme åndedrag, grov feil, under
// fire øyne). NON_VERB_FIRST_WORDS is a first-word denylist, not a
// whitelist — anything not listed here is assumed verb-first. Review the
// --dry-run sample list and adjust before running for real.
const NON_VERB_FIRST_WORDS = new Set([
  'det',
  'i',
  'med',
  'som',
  'fra',
  'under',
  'en',
  'uten',
  'hver',
  'like',
  'lett',
  'snart',
  'grov',
  'stummende',
  'bordet',
  'saken',
  'propellen',
  'prikken',
  'uforrettet',
  'ikke'
]);

function classifyAbstractConcept(entry) {
  const firstWord = entry.lemma.trim().split(/\s+/)[0].toLowerCase();
  return NON_VERB_FIRST_WORDS.has(firstWord) ? ABSTRACT_CIRCUMSTANCE_SLUG : ABSTRACT_ACTION_SLUG;
}

function newCategoryFor(entry) {
  if (MERGE_TARGETS[entry.category]) return MERGE_TARGETS[entry.category];
  if (entry.category === 'interpersonal-conflict') return INTERPERSONAL_CONFLICT_NEW_SLUG;
  if (entry.category === 'abstract-concepts') return classifyAbstractConcept(entry);
  return entry.category;
}

function printSample(label, entries, limit = 8) {
  console.log(`\n── ${label} (${entries.length}) ──`);
  for (const e of entries.slice(0, limit)) {
    console.log(`  ${e.id}  |  ${e.lemma.padEnd(35)}  |  ${e.english}`);
  }
  if (entries.length > limit) console.log(`  … (${entries.length - limit} more)`);
}

function main() {
  if (!fs.existsSync(UTTRYKK_FILE)) {
    console.error(`❌ Missing file: ${UTTRYKK_FILE}`);
    process.exit(1);
  }
  if (DRY_RUN) console.log('🔍 DRY RUN — no files will be modified\n');

  const data = JSON.parse(fs.readFileSync(UTTRYKK_FILE, 'utf8'));

  const staleCounts = {};
  for (const cat of STALE_CATEGORIES) staleCounts[cat] = 0;
  for (const e of data) if (staleCounts[e.category] !== undefined) staleCounts[e.category] += 1;

  console.log('Stale category counts (expect 135/94/43/42/11/8):');
  for (const cat of STALE_CATEGORIES) console.log(`  ${cat.padEnd(24)} ${staleCounts[cat]}`);
  const totalStale = Object.values(staleCounts).reduce((a, b) => a + b, 0);
  console.log(`  ${'total'.padEnd(24)} ${totalStale}`);

  // ── Merge candidates: sample entries to sanity-check the fit ──────────
  for (const [oldCat, newCat] of Object.entries(MERGE_TARGETS)) {
    const entries = data.filter((e) => e.category === oldCat);
    printSample(`Merge candidate: ${oldCat} → ${newCat}`, entries);
  }

  // ── interpersonal-conflict: new slug, sample entries ───────────────────
  printSample(
    `New slug: interpersonal-conflict → ${INTERPERSONAL_CONFLICT_NEW_SLUG}`,
    data.filter((e) => e.category === 'interpersonal-conflict')
  );

  // ── abstract-concepts: verb-first / non-verb-first breakdown ──────────
  {
    const entries = data.filter((e) => e.category === 'abstract-concepts');
    const buckets = {};
    for (const e of entries) (buckets[classifyAbstractConcept(e)] ??= []).push(e);
    console.log(`\n── abstract-concepts (${entries.length}) — verb-first / non-verb-first split ──`);
    for (const [slug, list] of Object.entries(buckets)) {
      printSample(slug, list, 10);
    }
  }

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete — no files written.');
    console.log(
      '   Confirm the 3 new-slug names (marked TODO at the top of this file) and sanity-check'
    );
    console.log(
      '   the abstract-concepts split above before running without --dry-run.\n'
    );
    return;
  }

  // ── Apply ────────────────────────────────────────────────────────────
  const bakPath = UTTRYKK_FILE + '.bak';
  fs.copyFileSync(UTTRYKK_FILE, bakPath);

  const newData = data.map((e) => {
    const newCategory = newCategoryFor(e);
    return newCategory === e.category ? e : { ...e, category: newCategory };
  });

  const remaining = newData.filter((e) => STALE_CATEGORIES.includes(e.category));
  if (remaining.length > 0) {
    console.error(
      `❌ ${remaining.length} entries still carry a stale category after reassignment — aborting write.`
    );
    process.exit(1);
  }

  fs.writeFileSync(UTTRYKK_FILE, JSON.stringify(newData, null, 2) + '\n', 'utf8');
  console.log(`\n✅ Done — reassigned ${totalStale} entries in uttrykk-c.json.`);
  console.log(`   Backup written as ${bakPath}`);
}

main();
