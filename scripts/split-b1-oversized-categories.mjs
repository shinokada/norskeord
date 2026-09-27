#!/usr/bin/env node
/**
 * split-b1-oversized-categories.mjs
 *
 * Step 1 (classification) of ai-docs/implementation/b1-new-categories.md —
 * the split-oversized-categories process applied to B1's 4 oversized
 * categories. Split axes below were derived from the full audit dump
 * (scripts/outputs/split-b1-oversized-categories-audit.txt), which broke
 * each category down by part-of-speech × lemma word-count — same process
 * as the C-level passes.
 *
 *   personal-growth (155)     — part-of-speech axis:
 *     - personal-growth-adjectives            part === 'adjective'
 *     - personal-growth-nouns                 part === 'noun'
 *     - personal-growth-verbs-and-expressions everything else (verb, adverb, phrase)
 *
 *   society (151)              — dominant POS (noun) already fits the
 *                                 60–100 target alone, so a straight 2-way
 *                                 split is cleaner than 3:
 *     - society-nouns                         part === 'noun'
 *     - society-verbs-and-adjectives          everything else (verb, adjective, preposition)
 *
 *   expressing-opinions (134)  — part-of-speech axis (adjective alone would
 *                                 fit target range, but the remainder is
 *                                 still 70, so split it too):
 *     - expressing-opinions-adjectives        part === 'adjective'
 *     - expressing-opinions-adverbs           part === 'adverb'
 *     - expressing-opinions-nouns-and-verbs   everything else (noun, verb, pronoun)
 *
 *   communication-skills (131) — dominant POS (verb) already fits the
 *                                 60–100 target alone:
 *     - communication-skills-verbs                 part === 'verb'
 *     - communication-skills-nouns-and-expressions  everything else (noun,
 *                                 adjective, adverb, preposition, interjection)
 *
 * Only the `category` field is touched. Everything else on each entry is
 * left exactly as-is.
 *
 * Usage:
 *   node scripts/split-b1-oversized-categories.mjs --dry-run   ← always try this first
 *   node scripts/split-b1-oversized-categories.mjs
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
const VOCAB_FILE = path.join(DATA_DIR, 'vocab-b1.json');

// ── Classification: personal-growth ─────────────────────────────────────────

function classifyPersonalGrowth(entry) {
  if (entry.part === 'adjective') return 'personal-growth-adjectives';
  if (entry.part === 'noun') return 'personal-growth-nouns';
  return 'personal-growth-verbs-and-expressions';
}

// ── Classification: society ──────────────────────────────────────────────────

function classifySociety(entry) {
  if (entry.part === 'noun') return 'society-nouns';
  return 'society-verbs-and-adjectives';
}

// ── Classification: expressing-opinions ─────────────────────────────────────

function classifyExpressingOpinions(entry) {
  if (entry.part === 'adjective') return 'expressing-opinions-adjectives';
  if (entry.part === 'adverb') return 'expressing-opinions-adverbs';
  return 'expressing-opinions-nouns-and-verbs';
}

// ── Classification: communication-skills ────────────────────────────────────

function classifyCommunicationSkills(entry) {
  if (entry.part === 'verb') return 'communication-skills-verbs';
  return 'communication-skills-nouns-and-expressions';
}

// ── Category registry ────────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  'personal-growth': {
    classify: classifyPersonalGrowth,
    newCategories: [
      'personal-growth-adjectives',
      'personal-growth-nouns',
      'personal-growth-verbs-and-expressions'
    ]
  },
  society: {
    classify: classifySociety,
    newCategories: ['society-nouns', 'society-verbs-and-adjectives']
  },
  'expressing-opinions': {
    classify: classifyExpressingOpinions,
    newCategories: [
      'expressing-opinions-adjectives',
      'expressing-opinions-adverbs',
      'expressing-opinions-nouns-and-verbs'
    ]
  },
  'communication-skills': {
    classify: classifyCommunicationSkills,
    newCategories: ['communication-skills-verbs', 'communication-skills-nouns-and-expressions']
  }
};

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

function writeBackup(filePath) {
  const bakPath = filePath + '.bak';
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
    console.log('\nNothing to do — no entries with any of the 4 target categories found.');
    return;
  }

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete. Review the counts above (and the console output for');
    console.log('   any surprising individual reassignments) before running without --dry-run.\n');
  } else {
    writeBackup(VOCAB_FILE);
    fs.writeFileSync(VOCAB_FILE, JSON.stringify(newData, null, 2) + '\n', 'utf8');
    console.log(`\n✅ Done — reassigned ${total} entries in vocab-b1.json.`);
    console.log('   Backup written as vocab-b1.json.bak\n');
  }
}

main();
