#!/usr/bin/env node
/**
 * split-b2-uttrykk-idioms.mjs
 *
 * Step 1 (classification) of
 * ai-docs/implementation/b2-uttrykk-idioms-split.md.
 *
 * `uttrykk-b2.json`'s `idioms` theme has 326 entries — 2.7x the 120
 * guideline ceiling, and all `part: "phrase"` (no POS axis, same
 * constraint the C `abstract-concepts` fix had). Since the content
 * doesn't cluster topically (no dominant subject-matter groups like C's
 * `nature-landscape`), this splits on grammatical/functional shape
 * instead — the same kind of axis, just a different one:
 *
 *   1. STATE   (65) — være/bli + complement: state, passive, change of
 *      state ("være bevisst på", "bli utsatt for")
 *   2. LIGHT   (65) — ha/få/gi/gjøre/ta/holde/legge/slå/sette + noun:
 *      light-verb collocations ("ha kjennskap til", "få klarhet i")
 *   3. FIGURATIVE (93) — everything else verb-first, plus a handful of
 *      noun/adjective-first genuinely figurative phrases not caught by
 *      the NON_VERB_FIRST denylist below ("treffe spikeren på hodet",
 *      "gå mot strømmen", "balsam for sjelen")
 *   4. FIXED   (103) — non-verb-first: quantity/degree/time/frequency
 *      fixed phrases and discourse exclamations ("i verste fall", "til
 *      enhver tid", "Sist, men ikke minst")
 *
 * NON_VERB_FIRST_WORDS is a first-word denylist, not a whitelist —
 * anything not listed here, and not a state/light verb, is assumed
 * verb-first and falls into FIGURATIVE. Review the --dry-run sample
 * list and adjust before running for real (same convention as the C
 * abstract-concepts fix's classifyAbstractConcept denylist).
 *
 * `idioms` itself is NOT removed from UTTRYKK_FUNCTIONAL_THEMES —
 * uttrykk-a2.json still has its own `idioms`-tagged entries, free there.
 * This script only ever touches uttrykk-b2.json.
 *
 * All 4 *_SLUG constants below are first-draft proposals, not settled
 * names — confirm/rename before running without --dry-run.
 *
 * Usage:
 *   node scripts/split-b2-uttrykk-idioms.mjs --dry-run   ← always try this first
 *   node scripts/split-b2-uttrykk-idioms.mjs
 *
 * Options:
 *   --dry-run   Print counts and samples; write nothing.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src/lib/data');
const UTTRYKK_FILE = path.join(DATA_DIR, 'uttrykk-b2.json');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

// ── First-draft new theme slug names — CONFIRM before running for real ─────
const STATE_SLUG = 'state-idioms'; // CONFIRMED — være/bli, ~65 entries
const LIGHT_SLUG = 'light-verb-idioms'; // CONFIRMED — ha/få/gi/..., ~65 entries
const FIGURATIVE_SLUG = 'figurative-idioms'; // CONFIRMED — ~93 entries
const FIXED_SLUG = 'general-fixed-expressions'; // CONFIRMED — ~103 entries

const STATE_VERBS = new Set(['være', 'bli']);
const LIGHT_VERBS = new Set([
  'ha',
  'få',
  'gi',
  'gjøre',
  'ta',
  'holde',
  'legge',
  'slå',
  'sette'
]);

// First-word denylist for "definitely not verb-first" — pronouns,
// prepositions, determiners, adverbs, and a handful of adjective/particle
// openers found by inspecting the actual 326 entries. Anything NOT in this
// set (and not a STATE_VERB/LIGHT_VERB) is assumed verb-first → FIGURATIVE.
const NON_VERB_FIRST_WORDS = new Set([
  'det',
  'i',
  'på',
  'en',
  'et',
  'til',
  'som',
  'når',
  'ikke',
  'litt',
  'hvert',
  'for',
  'alt',
  'all',
  'langt',
  'nåde',
  'søren',
  'du',
  'jeg',
  'nei',
  'men',
  'sist',
  'fleip',
  'frie',
  'frisk',
  'komfortabel',
  'ideelt',
  'relativt',
  'skikkelig',
  'godt',
  'uvurderlig',
  'yrende',
  'anstendige',
  'lovløse',
  'steil',
  'halvannet',
  'krumme',
  'øynene',
  'hjertet',
  'tut',
  'dels',
  'rett',
  'hele',
  'før',
  'stadig',
  'midt',
  'nederst',
  'neimen'
]);

function classify(entry) {
  const firstWord = entry.lemma.trim().split(/\s+/)[0].toLowerCase();
  if (STATE_VERBS.has(firstWord)) return STATE_SLUG;
  if (LIGHT_VERBS.has(firstWord)) return LIGHT_SLUG;
  if (NON_VERB_FIRST_WORDS.has(firstWord)) return FIXED_SLUG;
  return FIGURATIVE_SLUG;
}

function printSample(label, entries, limit = 10) {
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

  const idioms = data.filter((e) => e.category === 'idioms');
  console.log(`Total 'idioms' entries (expect 326): ${idioms.length}`);

  const buckets = { [STATE_SLUG]: [], [LIGHT_SLUG]: [], [FIGURATIVE_SLUG]: [], [FIXED_SLUG]: [] };
  for (const e of idioms) buckets[classify(e)].push(e);

  console.log('\nBucket sizes:');
  for (const [slug, list] of Object.entries(buckets)) {
    console.log(`  ${slug.padEnd(28)} ${list.length}`);
  }

  for (const [slug, list] of Object.entries(buckets)) {
    printSample(slug, list);
  }

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete — no files written.');
    console.log('   Confirm the 4 slug names (marked TODO at the top of this file) and');
    console.log('   sanity-check the bucket samples above before running without --dry-run.\n');
    return;
  }

  const bakPath = UTTRYKK_FILE + '.bak';
  fs.copyFileSync(UTTRYKK_FILE, bakPath);

  const newData = data.map((e) => {
    if (e.category !== 'idioms') return e;
    const newCategory = classify(e);
    return { ...e, category: newCategory };
  });

  const remaining = newData.filter((e) => e.category === 'idioms');
  if (remaining.length > 0) {
    console.error(
      `❌ ${remaining.length} entries still carry 'idioms' after reassignment — aborting write.`
    );
    process.exit(1);
  }

  fs.writeFileSync(UTTRYKK_FILE, JSON.stringify(newData, null, 2) + '\n', 'utf8');
  console.log(`\n✅ Done — reassigned ${idioms.length} entries in uttrykk-b2.json.`);
  console.log(`   Backup written as ${bakPath}`);
}

main();
