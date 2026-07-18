#!/usr/bin/env node
/**
 * merge-uttrykk-c-category.mjs
 *
 * Phase 4 (ai-docs/implementation/uttrykk-category.md) merge step.
 *
 * Folds every entry in src/lib/data/uttrykk-c.json into
 * src/lib/data/vocab-c.json, using the reviewed `proposed_category` from
 * ai-docs/implementation/uttrykk-c-category-triage.json, matched by `id`.
 *
 * Per entry:
 *   - category  → triage's proposed_category (one of the 37 CATEGORIES_BY_LEVEL.C slugs)
 *   - part      → "phrase"
 *   - id        → new sequential v-c-{category}-{NNN}, continuing from the
 *                 highest existing number already in that category in vocab-c.json
 *   - norsk/lemma/definition/example*/translations → copied as-is (no
 *     reformatting — unlike migrate-to-vocab.mjs, these are idioms/phrases,
 *     not verbs needing an "å " prefix)
 *
 * By default this is a MOVE, not a copy: merged entries are removed from
 * uttrykk-c.json once appended to vocab-c.json, matching the doc's Phase 4
 * decision to fold C's uttrykk entirely into the per-category vocab file
 * rather than keep a second, now-redundant copy sitting in an unused file.
 * Pass --keep-source to leave uttrykk-c.json untouched instead.
 *
 * Aborts and writes nothing if:
 *   - any uttrykk-c.json entry has no matching triage row
 *   - any triage proposed_category isn't one of the 37 valid C category slugs
 *   - any triage id is duplicated
 *
 * Usage:
 *   node scripts/merge-uttrykk-c-category.mjs --dry-run   ← always try this first
 *   node scripts/merge-uttrykk-c-category.mjs
 *   node scripts/merge-uttrykk-c-category.mjs --keep-source
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');
const IMPL_DIR = join(__dirname, '../ai-docs/implementation');

const UTTRYKK_PATH = join(DATA_DIR, 'uttrykk-c.json');
const VOCAB_PATH = join(DATA_DIR, 'vocab-c.json');
const TRIAGE_PATH = join(IMPL_DIR, 'uttrykk-c-category-triage.json');

const DRY_RUN = process.argv.includes('--dry-run');
const KEEP_SOURCE = process.argv.includes('--keep-source');

// Must match CATEGORIES_BY_LEVEL.C in src/lib/config.ts exactly.
const VALID_C_CATEGORIES = new Set([
  'philosophy',
  'academic',
  'formal-writing',
  'rhetoric',
  'complex-emotions',
  'professional',
  'abstract-concepts',
  'politics-democracy',
  'linguistics',
  'media-journalism',
  'architecture-design',
  'diplomacy-international',
  'finance-economics',
  'medicine-healthcare',
  'psychology-advanced',
  'literary',
  'archaic',
  'proverbs',
  'highly-formal',
  'technical',
  'advanced-law-justice',
  'neuroscience-cognition',
  'climate-environment-policy',
  'sociology-anthropology',
  'advanced-business-strategy',
  'existential-abstract',
  'nature-landscape',
  'sensory-sound',
  'physical-appearance',
  'everyday-objects',
  'character-temperament',
  'embodied-emotion',
  'manner-of-motion',
  'interpersonal-conflict',
  'intensifiers-degree',
  'gastronomy',
  'cultural-heritage'
]);

// Field order used by vocab-c.json (differs slightly from uttrykk-c.json's
// order — id first, definition near the end, category/part last).
const VOCAB_FIELD_ORDER = [
  'id',
  'norsk',
  'lemma',
  'english',
  'ukrainian',
  'spanish',
  'german',
  'example',
  'example_english',
  'example_ukrainian',
  'example_spanish',
  'example_german',
  'definition',
  'level',
  'category',
  'part'
];

function pad3(n) {
  return String(n).padStart(3, '0');
}

for (const p of [UTTRYKK_PATH, VOCAB_PATH, TRIAGE_PATH]) {
  if (!existsSync(p)) {
    console.error(`❌ Missing required file: ${p}`);
    process.exit(1);
  }
}

const uttrykEntries = JSON.parse(readFileSync(UTTRYKK_PATH, 'utf8'));
const vocabEntries = JSON.parse(readFileSync(VOCAB_PATH, 'utf8'));
const triage = JSON.parse(readFileSync(TRIAGE_PATH, 'utf8'));

// ── Validate triage ──────────────────────────────────────────────────────

const dupTriageIds = [];
const seenTriageIds = new Set();
for (const t of triage) {
  if (seenTriageIds.has(t.id)) dupTriageIds.push(t.id);
  seenTriageIds.add(t.id);
}
if (dupTriageIds.length > 0) {
  console.error(`❌ Duplicate ids in triage file: ${dupTriageIds.join(', ')}`);
  process.exit(1);
}

const invalidCategoryRows = triage.filter((t) => !VALID_C_CATEGORIES.has(t.proposed_category));
if (invalidCategoryRows.length > 0) {
  console.error(`❌ ${invalidCategoryRows.length} triage row(s) have an invalid proposed_category:`);
  for (const t of invalidCategoryRows) {
    console.error(`   ${t.id}  |  "${t.proposed_category}"`);
  }
  process.exit(1);
}

const categoryMap = new Map(triage.map((t) => [t.id, t.proposed_category]));

const missing = uttrykEntries.filter((e) => !categoryMap.has(e.id)).map((e) => e.id);
if (missing.length > 0) {
  console.error(`⚠️  ${missing.length} uttrykk-c.json entries have no matching triage row:`);
  console.error('  ' + missing.join(', '));
  console.error('\nAborting — nothing was written.');
  process.exit(1);
}

// ── Build new vocab entries ─────────────────────────────────────────────

// Seed per-category counters from the highest existing v-c-{category}-NNN
// id already in vocab-c.json.
const categoryCounters = {};
for (const e of vocabEntries) {
  const m = e.id?.match(/^v-c-([a-z-]+)-(\d+)$/);
  if (!m) continue;
  const [, cat, num] = m;
  categoryCounters[cat] = Math.max(categoryCounters[cat] ?? 0, parseInt(num, 10));
}

const newVocabEntries = [];
const perCategoryAdded = {};

for (const entry of uttrykEntries) {
  const category = categoryMap.get(entry.id);
  categoryCounters[category] = (categoryCounters[category] ?? 0) + 1;
  perCategoryAdded[category] = (perCategoryAdded[category] ?? 0) + 1;
  const newId = `v-c-${category}-${pad3(categoryCounters[category])}`;

  const built = { ...entry, category, part: 'phrase', id: newId };
  const ordered = {};
  for (const field of VOCAB_FIELD_ORDER) {
    if (built[field] !== undefined) ordered[field] = built[field];
  }
  // Preserve any unexpected extra fields at the end rather than silently dropping them.
  for (const [k, v] of Object.entries(built)) {
    if (!(k in ordered)) ordered[k] = v;
  }

  newVocabEntries.push(ordered);
}

// ── Report ───────────────────────────────────────────────────────────────

console.log(`${DRY_RUN ? '🔍 DRY RUN — ' : ''}Merging ${newVocabEntries.length} uttrykk-c entries into vocab-c.json\n`);
console.log('Per-category counts:');
for (const [cat, count] of Object.entries(perCategoryAdded).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat.padEnd(28)} +${count}`);
}
console.log(`\nTotal categories touched: ${Object.keys(perCategoryAdded).length}`);
console.log(`vocab-c.json: ${vocabEntries.length} → ${vocabEntries.length + newVocabEntries.length} entries`);
console.log(
  `uttrykk-c.json: ${uttrykEntries.length} → ${KEEP_SOURCE ? uttrykEntries.length : 0} entries` +
    (KEEP_SOURCE ? ' (--keep-source: left untouched)' : '')
);

if (DRY_RUN) {
  console.log('\n✅ Dry run complete — no files written. Run without --dry-run to apply.');
  process.exit(0);
}

// ── Write ────────────────────────────────────────────────────────────────

copyFileSync(VOCAB_PATH, VOCAB_PATH + '.bak');
if (!KEEP_SOURCE) copyFileSync(UTTRYKK_PATH, UTTRYKK_PATH + '.bak');

const combinedVocab = [...vocabEntries, ...newVocabEntries];
writeFileSync(VOCAB_PATH, JSON.stringify(combinedVocab, null, 2) + '\n', 'utf8');

if (!KEEP_SOURCE) {
  writeFileSync(UTTRYKK_PATH, JSON.stringify([], null, 2) + '\n', 'utf8');
}

console.log(`\n✅ Wrote ${combinedVocab.length} entries → ${VOCAB_PATH}`);
console.log(`   Backup: ${VOCAB_PATH}.bak`);
if (!KEEP_SOURCE) {
  console.log(`✅ Emptied uttrykk-c.json (entries folded into vocab-c.json)`);
  console.log(`   Backup: ${UTTRYKK_PATH}.bak`);
} else {
  console.log(`ℹ️  uttrykk-c.json left untouched (--keep-source)`);
}
console.log('\nNext: run scripts/check-vocab.mjs and update stats.json C counts.');
