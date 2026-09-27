#!/usr/bin/env node
/**
 * split-c-oversized-categories-2.mjs
 *
 * Step 1 (classification) of ai-docs/implementation/c-new-categories-2.md —
 * pass 2 of the C-level oversized-category split. Split axes below were
 * derived from the full audit dump
 * (scripts/outputs/split-c-oversized-categories-2-audit.txt), which broke
 * each category down by part-of-speech × lemma word-count — same process
 * as pass 1, applied straight from real data this time (no guess-then-
 * revise needed, since the audit already showed each category's shape
 * cleanly before any classify() was written).
 *
 *   embodied-emotion (175)        — part-of-speech axis:
 *     - embodied-emotion-adjectives         part === 'adjective' (any word count)
 *     - embodied-emotion-nouns              part === 'noun' (any word count)
 *     - embodied-emotion-verbs              part === 'verb', 1–2 word lemma
 *     - embodied-emotion-idiomatic-expressions   everything else (3+-word
 *                                            verb phrases, plus the handful
 *                                            of preposition/adverb entries)
 *
 *   interpersonal-conflict (171)  — same axis as embodied-emotion:
 *     - interpersonal-conflict-nouns
 *     - interpersonal-conflict-adjectives
 *     - interpersonal-conflict-verbs             verb, 1–2 word
 *     - interpersonal-conflict-idiomatic-expressions  verb 3+-word + interjection/adverb
 *
 *   manner-of-motion (159)        — ~86% verbs, so split by word count
 *                                    instead of POS:
 *     - manner-of-motion-verbs               verb, 1-word lemma
 *     - manner-of-motion-verb-phrases        verb, 2-word lemma
 *     - manner-of-motion-idiomatic-expressions   verb 3+-word, plus all
 *                                            adjective/noun/adverb/
 *                                            preposition entries (too few
 *                                            of each to warrant their own
 *                                            bucket — mostly descriptive
 *                                            phrases about gait/manner)
 *
 *   everyday-objects (140)        — part-of-speech axis, no word-count
 *                                    split needed (POS alone lands every
 *                                    bucket comfortably under ceiling):
 *     - everyday-objects-nouns
 *     - everyday-objects-verbs
 *     - everyday-objects-descriptors         adjective + adverb
 *
 *   complex-emotions (139)        — part-of-speech axis:
 *     - complex-emotions-adjectives
 *     - complex-emotions-nouns
 *     - complex-emotions-verbs-and-expressions   verb + adverb
 *
 *   physical-appearance (120)     — part-of-speech axis:
 *     - physical-appearance-adjectives
 *     - physical-appearance-nouns
 *     - physical-appearance-verbs-and-expressions   verb + adverb
 *
 * Only the `category` field is touched. Everything else on each entry is
 * left exactly as-is.
 *
 * Usage:
 *   node scripts/split-c-oversized-categories-2.mjs --dry-run   ← always try this first
 *   node scripts/split-c-oversized-categories-2.mjs
 *
 * Options:
 *   --dry-run   Print a before/after table and resulting counts per new
 *               category, without writing any files (default: false)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src/lib/data');
const VOCAB_FILE = path.join(DATA_DIR, 'vocab-c.json');

function wordCount(lemma) {
  return lemma.trim().split(/\s+/).length;
}

// ── Classification: embodied-emotion ────────────────────────────────────────

function classifyEmbodiedEmotion(entry) {
  if (entry.part === 'adjective') return 'embodied-emotion-adjectives';
  if (entry.part === 'noun') return 'embodied-emotion-nouns';
  if (entry.part === 'verb' && wordCount(entry.lemma) <= 2) return 'embodied-emotion-verbs';
  return 'embodied-emotion-idiomatic-expressions';
}

// ── Classification: interpersonal-conflict ──────────────────────────────────

function classifyInterpersonalConflict(entry) {
  if (entry.part === 'noun') return 'interpersonal-conflict-nouns';
  if (entry.part === 'adjective') return 'interpersonal-conflict-adjectives';
  if (entry.part === 'verb' && wordCount(entry.lemma) <= 2) return 'interpersonal-conflict-verbs';
  return 'interpersonal-conflict-idiomatic-expressions';
}

// ── Classification: manner-of-motion ────────────────────────────────────────

function classifyMannerOfMotion(entry) {
  const wc = wordCount(entry.lemma);
  if (entry.part === 'verb' && wc === 1) return 'manner-of-motion-verbs';
  if (entry.part === 'verb' && wc === 2) return 'manner-of-motion-verb-phrases';
  return 'manner-of-motion-idiomatic-expressions';
}

// ── Classification: everyday-objects ────────────────────────────────────────

function classifyEverydayObjects(entry) {
  if (entry.part === 'noun') return 'everyday-objects-nouns';
  if (entry.part === 'verb') return 'everyday-objects-verbs';
  return 'everyday-objects-descriptors';
}

// ── Classification: complex-emotions ────────────────────────────────────────

function classifyComplexEmotions(entry) {
  if (entry.part === 'adjective') return 'complex-emotions-adjectives';
  if (entry.part === 'noun') return 'complex-emotions-nouns';
  return 'complex-emotions-verbs-and-expressions';
}

// ── Classification: physical-appearance ─────────────────────────────────────

function classifyPhysicalAppearance(entry) {
  if (entry.part === 'adjective') return 'physical-appearance-adjectives';
  if (entry.part === 'noun') return 'physical-appearance-nouns';
  return 'physical-appearance-verbs-and-expressions';
}

// ── Category registry ────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  'embodied-emotion': {
    classify: classifyEmbodiedEmotion,
    newCategories: [
      'embodied-emotion-adjectives',
      'embodied-emotion-nouns',
      'embodied-emotion-verbs',
      'embodied-emotion-idiomatic-expressions'
    ]
  },
  'interpersonal-conflict': {
    classify: classifyInterpersonalConflict,
    newCategories: [
      'interpersonal-conflict-nouns',
      'interpersonal-conflict-adjectives',
      'interpersonal-conflict-verbs',
      'interpersonal-conflict-idiomatic-expressions'
    ]
  },
  'manner-of-motion': {
    classify: classifyMannerOfMotion,
    newCategories: [
      'manner-of-motion-verbs',
      'manner-of-motion-verb-phrases',
      'manner-of-motion-idiomatic-expressions'
    ]
  },
  'everyday-objects': {
    classify: classifyEverydayObjects,
    newCategories: [
      'everyday-objects-nouns',
      'everyday-objects-verbs',
      'everyday-objects-descriptors'
    ]
  },
  'complex-emotions': {
    classify: classifyComplexEmotions,
    newCategories: [
      'complex-emotions-adjectives',
      'complex-emotions-nouns',
      'complex-emotions-verbs-and-expressions'
    ]
  },
  'physical-appearance': {
    classify: classifyPhysicalAppearance,
    newCategories: [
      'physical-appearance-adjectives',
      'physical-appearance-nouns',
      'physical-appearance-verbs-and-expressions'
    ]
  }
};

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

function writeBackup(filePath) {
  const bakPath = filePath + '.bak2';
  fs.copyFileSync(filePath, bakPath);
  return bakPath;
}

function main() {
  if (DRY_RUN) console.log('🔍 DRY RUN — no files will be modified\n');

  if (!fs.existsSync(VOCAB_FILE)) {
    console.error(`  ❌ Missing file: ${VOCAB_FILE}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(VOCAB_FILE, 'utf8'));

  const counts = {};
  for (const cfg of Object.values(CATEGORY_CONFIG)) {
    for (const newCat of cfg.newCategories) counts[newCat] = 0;
  }

  const newData = data.map((entry) => {
    const cfg = CATEGORY_CONFIG[entry.category];
    if (!cfg) return entry;

    const newCategory = cfg.classify(entry);
    counts[newCategory] += 1;

    console.log(
      `    ${entry.id}  |  ${entry.lemma.padEnd(30)}  |  ${entry.category} → ${newCategory}`
    );

    return { ...entry, category: newCategory };
  });

  console.log('\nResulting counts:');
  for (const [oldCat, cfg] of Object.entries(CATEGORY_CONFIG)) {
    console.log(`\n  ${oldCat}:`);
    let subtotal = 0;
    for (const newCat of cfg.newCategories) {
      console.log(`    ${newCat.padEnd(42)} ${counts[newCat]}`);
      subtotal += counts[newCat];
    }
    console.log(`    ${'subtotal'.padEnd(42)} ${subtotal}`);
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`\n  grand total: ${total}`);

  if (total === 0) {
    console.log('\nNothing to do — no entries with any of the 6 target categories found.');
    return;
  }

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete. Review the counts above (and the console output for');
    console.log('   any surprising individual reassignments) before running without --dry-run.\n');
  } else {
    writeBackup(VOCAB_FILE);
    fs.writeFileSync(VOCAB_FILE, JSON.stringify(newData, null, 2) + '\n', 'utf8');
    console.log(`\n✅ Done — reassigned ${total} entries in vocab-c.json.`);
    console.log('   Backup written as vocab-c.json.bak2\n');
  }
}

main();
