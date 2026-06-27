#!/usr/bin/env node
/**
 * check-uttrykk.mjs
 *
 * Validates all uttrykk-{level}.json and uttrykk-{level}-preview.json files
 * in src/lib/data against canonical rules.
 *
 * Rules checked:
 *   1. ID format    — full files:    u-{level}-{NNN}
 *                     preview files: up-{level}-{NNN}  (3-digit zero-padded)
 *   2. ID uniqueness — no duplicates within or across files
 *   3. level field  — must match file's CEFR level (case-insensitive)
 *   4. category     — must be "uttrykk" or "uttrykk-preview"
 *   5. part         — uttrykk entries should be "phrase"
 *   6. norsk field  — must be present and non-empty
 *   7. lemma field  — must be present and non-empty
 *   8. Required fields (norsk, english, example, example_english, level, category, part)
 *   9. Preview cross-check — entries in preview should also exist in full file (by norsk)
 *
 * Usage:
 *   node scripts/check-uttrykk.mjs            # check all uttrykk files
 *   node scripts/check-uttrykk.mjs a1         # check only uttrykk-a1 files
 *   node scripts/check-uttrykk.mjs --strict   # exit 1 if any errors found
 *   node scripts/check-uttrykk.mjs --no-cross # skip preview cross-check
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');

const STRICT = process.argv.includes('--strict');
const NO_CROSS = process.argv.includes('--no-cross');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));

const ALL_LEVELS = ['a1', 'a2', 'b1', 'b2', 'c'];
const TARGET_LEVELS = args.length > 0 ? args.map((a) => a.toLowerCase()) : ALL_LEVELS;

const REQUIRED_FIELDS = [
  'norsk',
  'english',
  'example',
  'example_english',
  'level',
  'category',
  'part'
];
const VALID_CATEGORIES = new Set(['uttrykk', 'uttrykk-preview']);

// ── Validators ────────────────────────────────────────────────────────────────

/** Full file:    u-{level}-{NNN} */
const ID_PATTERN_FULL = /^u-([a-z0-9]+)-(\d{3})$/;
/** Preview file: up-{level}-{NNN} */
const ID_PATTERN_PREVIEW = /^up-([a-z0-9]+)-(\d{3})$/;

function checkIdFormat(id, level, isPreview) {
  const errors = [];
  const pattern = isPreview ? ID_PATTERN_PREVIEW : ID_PATTERN_FULL;
  const expected = isPreview ? 'up-{level}-{NNN}' : 'u-{level}-{NNN}';

  const m = id.match(pattern);
  if (!m) {
    // Give a helpful hint if the prefixes are swapped
    const swapped = isPreview ? ID_PATTERN_FULL.test(id) : ID_PATTERN_PREVIEW.test(id);
    const hint = swapped
      ? ` (looks like ${isPreview ? 'full' : 'preview'} prefix — should be "${isPreview ? 'up' : 'u'}-")`
      : '';
    errors.push(`ID "${id}" does not match ${expected} format${hint}`);
    return errors;
  }
  if (m[1] !== level) {
    errors.push(`ID level segment "${m[1]}" does not match file level "${level}"`);
  }
  return errors;
}

// ── File checker ──────────────────────────────────────────────────────────────

function checkFile(filename, level, expectedCategory, isPreview, globalIds) {
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(filepath)) {
    console.log(`  ⏭️   ${filename} not found — skipping`);
    return { errors: 0, warnings: 0, entries: [] };
  }

  let entries;
  try {
    entries = JSON.parse(readFileSync(filepath, 'utf8'));
  } catch (err) {
    console.error(`  ❌  Could not parse ${filename}: ${err.message}`);
    return { errors: 1, warnings: 0, entries: [] };
  }

  let fileErrors = 0;
  let fileWarnings = 0;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📄  ${filename}  (${entries.length} entries)`);
  console.log(`${'─'.repeat(60)}`);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const loc = `[${i}] id=${entry.id ?? '(missing)'}`;
    const errs = [];
    const warns = [];

    // Required fields
    for (const field of REQUIRED_FIELDS) {
      if (entry[field] == null || entry[field] === '') {
        errs.push(`missing required field "${field}"`);
      }
    }

    // ID format
    if (entry.id) {
      errs.push(...checkIdFormat(entry.id, level, isPreview));
      // Global uniqueness
      if (globalIds.has(entry.id)) {
        errs.push(`duplicate ID — also in ${globalIds.get(entry.id)}`);
      } else {
        globalIds.set(entry.id, filename);
      }
    } else {
      errs.push('missing id field');
    }

    // level field
    if (entry.level && entry.level.toLowerCase() !== level) {
      errs.push(`level field "${entry.level}" does not match file level "${level.toUpperCase()}"`);
    }

    // category
    if (entry.category) {
      if (!VALID_CATEGORIES.has(entry.category)) {
        errs.push(`category "${entry.category}" is not "uttrykk" or "uttrykk-preview"`);
      } else if (entry.category !== expectedCategory) {
        warns.push(`category "${entry.category}" — expected "${expectedCategory}" for this file`);
      }
    }

    // part — uttrykk entries should be "phrase"
    if (entry.part && entry.part !== 'phrase') {
      warns.push(`part is "${entry.part}" — uttrykk entries are typically "phrase"`);
    }

    // lemma
    if (!entry.lemma || entry.lemma === '') {
      warns.push(`lemma field is missing or empty`);
    }

    if (errs.length > 0) {
      fileErrors += errs.length;
      for (const e of errs) console.log(`  ❌  ${loc}: ${e}`);
    }
    if (warns.length > 0) {
      fileWarnings += warns.length;
      for (const w of warns) console.log(`  ⚠️   ${loc}: ${w}`);
    }
  }

  const status = fileErrors === 0 ? '✅' : '❌';
  console.log(`\n${status}  ${filename}: ${fileErrors} error(s), ${fileWarnings} warning(s)`);

  return { errors: fileErrors, warnings: fileWarnings, entries };
}

// ── Preview cross-check ───────────────────────────────────────────────────────

function crossCheckPreview(previewEntries, fullEntries, level) {
  if (NO_CROSS || previewEntries.length === 0 || fullEntries.length === 0) return 0;

  const fullNorsk = new Set(fullEntries.map((e) => e.norsk));
  const orphans = previewEntries.filter((e) => !fullNorsk.has(e.norsk));

  if (orphans.length === 0) {
    console.log(`  ✅  All preview entries exist in uttrykk-${level}.json`);
    return 0;
  }

  console.log(
    `\n  ⚠️   Preview cross-check: ${orphans.length} entry(ies) not found in uttrykk-${level}.json:`
  );
  for (const e of orphans) {
    console.log(`    id=${e.id}  norsk="${e.norsk}"`);
  }
  return orphans.length;
}

// ── Main ──────────────────────────────────────────────────────────────────────

let totalErrors = 0;
let totalWarnings = 0;
const globalIds = new Map();

for (const level of ALL_LEVELS) {
  if (!TARGET_LEVELS.includes(level)) continue;

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🔍  Level: ${level.toUpperCase()}`);
  console.log(`${'═'.repeat(60)}`);

  const {
    errors: e1,
    warnings: w1,
    entries: fullEntries
  } = checkFile(`uttrykk-${level}.json`, level, 'uttrykk', false, globalIds);

  const {
    errors: e2,
    warnings: w2,
    entries: previewEntries
  } = checkFile(`uttrykk-${level}-preview.json`, level, 'uttrykk-preview', true, globalIds);

  // Preview cross-check
  let crossErrors = 0;
  if (!NO_CROSS && previewEntries.length > 0) {
    console.log(`\n  🔗  Cross-checking preview vs full:`);
    crossErrors = crossCheckPreview(previewEntries, fullEntries, level);
  }

  totalErrors += e1 + e2 + crossErrors;
  totalWarnings += w1 + w2;
}

console.log(`\n${'═'.repeat(60)}`);
console.log(
  `📊  Total: ${totalErrors} error(s), ${totalWarnings} warning(s) across ${TARGET_LEVELS.length} level(s)`
);

if (STRICT && totalErrors > 0) {
  process.exit(1);
}
