#!/usr/bin/env node
/**
 * migrate-single-words-from-uttrykk.mjs
 *
 * Finds single-word norsk entries in uttrykk-*.json files and moves them
 * to the corresponding vocab-*.json file with corrected category, part,
 * norsk, and lemma fields (applying vocab formatting rules).
 *
 * Vocab formatting rules:
 *   norsk (display form):
 *     - noun:      "word (gender)"  e.g. "tradisjon (en)"
 *     - verb:      "å word"         e.g. "å ramme"
 *     - others:    bare word        e.g. "glad"
 *   lemma (base form for lookup/sorting):
 *     - all parts: bare word without å or gender, e.g. "ramme", "tradisjon", "glad"
 *
 * Usage (run from project root):
 *   node scripts/migrate-single-words-from-uttrykk.mjs [--dry-run] [--file uttrykk-b2-new.json]
 *
 * Options:
 *   --dry-run   Preview changes without writing any files
 *   --file      Process only a specific uttrykk file (default: all uttrykk-*.json)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = 'src/lib/data';
const DRY_RUN = process.argv.includes('--dry-run');
const FILE_ARG = process.argv.includes('--file')
  ? process.argv[process.argv.indexOf('--file') + 1]
  : null;

// ── Overrides ────────────────────────────────────────────────────────────────
// Map single-word norsk → { category, part, gender? }.
// gender is required for nouns: 'en' | 'et' | 'ei'
// category: value from CATEGORIES_BY_LEVEL in config.ts
// part: PartOfSpeech from types.ts
const OVERRIDES = {
  // ── uttrykk-a1.json ──
  annenhver: { category: 'adjectives', part: 'adjective' },
  savner: { category: 'feelings', part: 'verb' }, // inflected of å savne
  Unnskyld: { category: 'greetings', part: 'interjection' },
  Beklager: { category: 'greetings', part: 'interjection' },
  ses: { category: 'greetings', part: 'verb' }, // å ses
  sikkert: { category: 'adjectives', part: 'adverb' },
  sikker: { category: 'adjectives', part: 'adjective' },
  jammen: { category: 'greetings', part: 'interjection' },
  hele: { category: 'adjectives', part: 'adjective' },
  massevis: { category: 'adjectives', part: 'adverb' },
  fordi: { category: 'classroom', part: 'conjunction' },

  // ── uttrykk-a2.json ──
  stress: { category: 'health', part: 'noun', gender: 'et' }, // et stress
  sur: { category: 'feelings', part: 'adjective' },
  smak: { category: 'food', part: 'noun', gender: 'en' }, // en smak
  smaken: { category: 'food', part: 'noun', gender: 'en' }, // definite → base smak

  // ── uttrykk-b2-new.json ──
  tradisjon: { category: 'culture', part: 'noun', gender: 'en' },
  underveis: { category: 'language', part: 'adverb' },
  skittkasting: { category: 'social-issues', part: 'noun', gender: 'en' },
  ramme: { category: 'advanced-verbs', part: 'verb' },
  nærgående: { category: 'advanced-adjectives', part: 'adjective' },
  uberørt: { category: 'advanced-adjectives', part: 'adjective' },
  prege: { category: 'advanced-verbs', part: 'verb' }
};

// ── Lemma base overrides
// For entries where norsk (display) should differ from the base used in lemma.

// For inflected norsk values, map to the correct base/infinitive form.
// e.g. savner (present tense) → savne (infinitive)
//      smaken (definite)      → smak  (indefinite)
const LEMMA_BASE_OVERRIDES = {
  hele: 'hel',
  savner: 'savne',
  smaken: 'smak'
};
// e.g. hele is encountered as "hele" but the dictionary adjective form is "hel"
const NORSK_DISPLAY_OVERRIDES = {
  hele: 'hele' // keep display as "hele" even though lemma base is "hel"
};

// ── Vocab formatting rules ────────────────────────────────────────────────────
// norsk: display form shown to learners
//   noun  → "word (gender)"  e.g. "tradisjon (en)"
//   verb  → "å word"         e.g. "å ramme"
//   other → bare word        e.g. "glad"
//
// lemma: bare base form for lookup/sorting (no å, no gender)
//   all   → bare word        e.g. "ramme", "tradisjon", "glad"
function formatNorsk(norsk, part, gender) {
  const display = NORSK_DISPLAY_OVERRIDES[norsk] ?? LEMMA_BASE_OVERRIDES[norsk] ?? norsk;
  switch (part) {
    case 'noun':
      return gender ? `${display} (${gender})` : `${display} (GENDER_NEEDED)`;
    case 'verb':
      return display.startsWith('å ') ? display : `å ${display}`;
    default:
      return display;
  }
}

function formatLemma(norsk) {
  const base = LEMMA_BASE_OVERRIDES[norsk] ?? norsk;
  return base.replace(/^å /, '');
}

// ── Fallback PoS inference (only used for words not in OVERRIDES) ─────────────
function inferPartFallback(entry) {
  const lemma = (entry.lemma || '').trim();
  if (lemma.startsWith('å ')) return 'verb';
  if (/\((en|et|ei)\)/.test(lemma)) return 'noun';
  return 'REVIEW_NEEDED';
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function readJSON(p) {
  return JSON.parse(readFileSync(p, 'utf-8'));
}

function writeJSON(p, data) {
  writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function isSingleWord(norsk) {
  return norsk && norsk.trim().split(/\s+/).length === 1;
}

function uttrykkToVocabFilename(f) {
  return f.replace(/^uttrykk-/, 'vocab-');
}

// ── Main ─────────────────────────────────────────────────────────────────────
const allFiles = readdirSync(DATA_DIR)
  .filter((f) => f.startsWith('uttrykk-') && f.endsWith('.json'))
  .sort();

const filesToProcess = FILE_ARG ? [FILE_ARG] : allFiles;

console.log(
  `\n${DRY_RUN ? '🔍  DRY RUN — no files will be written' : '✏️   LIVE RUN — files will be modified'}\n`
);

let totalMoved = 0;
const warnings = [];

for (const uttrykkFile of filesToProcess) {
  const uttrykkPath = join(DATA_DIR, uttrykkFile);
  const vocabFile = uttrykkToVocabFilename(uttrykkFile);
  const vocabPath = join(DATA_DIR, vocabFile);

  let uttrykkEntries;
  try {
    uttrykkEntries = readJSON(uttrykkPath);
  } catch (e) {
    console.warn(`  ⚠️  Could not read ${uttrykkPath}: ${e.message}`);
    continue;
  }

  const singles = uttrykkEntries.filter((e) => isSingleWord(e.norsk));
  if (singles.length === 0) {
    console.log(`✅  ${uttrykkFile}: no single-word entries`);
    continue;
  }

  console.log(`\n📄  ${uttrykkFile}  (${singles.length} single-word entries to migrate)`);
  console.log(`    ─────────────────────────────────────────`);

  const migrated = [];

  for (const entry of singles) {
    const override = OVERRIDES[entry.norsk];
    const newCategory = override?.category ?? 'REVIEW_NEEDED';
    const newPart = override?.part ?? inferPartFallback(entry);
    const gender = override?.gender;
    const newNorsk = formatNorsk(entry.norsk, newPart, gender);
    const newLemma = formatLemma(entry.norsk);

    const transformed = {
      ...entry,
      norsk: newNorsk,
      lemma: newLemma,
      category: newCategory,
      part: newPart
    };
    migrated.push(transformed);

    const needsReview =
      newCategory === 'REVIEW_NEEDED' ||
      newPart === 'REVIEW_NEEDED' ||
      newNorsk.includes('GENDER_NEEDED');
    if (needsReview)
      warnings.push({
        file: uttrykkFile,
        norsk: entry.norsk,
        newCategory,
        newPart,
        newNorsk,
        newLemma
      });

    console.log(
      `    "${entry.norsk}"` +
        `\n      part:     ${entry.part ?? '—'} → ${newPart}` +
        `\n      category: ${entry.category ?? '—'} → ${newCategory}` +
        `\n      norsk:    ${entry.norsk ?? '—'} → ${newNorsk}` +
        `\n      lemma:    ${entry.lemma ?? '—'} → ${newLemma}` +
        (needsReview ? '  ⚠️  REVIEW_NEEDED' : '') +
        '\n'
    );
  }

  const remaining = uttrykkEntries.filter((e) => !isSingleWord(e.norsk));

  let vocabEntries = [];
  if (existsSync(vocabPath)) {
    vocabEntries = readJSON(vocabPath);
  } else {
    console.log(`    ℹ️  ${vocabFile} not found — will be created`);
  }

  const newVocabEntries = [...vocabEntries, ...migrated];

  console.log(`    uttrykk file: ${uttrykkEntries.length} → ${remaining.length} entries`);
  console.log(`    vocab file:   ${vocabEntries.length} → ${newVocabEntries.length} entries`);

  if (!DRY_RUN) {
    writeJSON(uttrykkPath, remaining);
    writeJSON(vocabPath, newVocabEntries);
    console.log(`    ✅  Written`);
  }

  totalMoved += migrated.length;
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Total entries to move: ${totalMoved}`);

if (warnings.length > 0) {
  console.log(`\n⚠️  ${warnings.length} entries need manual review:`);
  for (const w of warnings) {
    console.log(
      `  ${w.file} → "${w.norsk}"  part=${w.newPart}  category=${w.newCategory}  norsk=${w.newNorsk}  lemma=${w.newLemma}`
    );
  }
  console.log('\nFix the OVERRIDES / LEMMA_BASE_OVERRIDES in the script, then re-run.');
}

if (DRY_RUN) {
  console.log('\n(No files were modified. Remove --dry-run to apply changes.)');
}
