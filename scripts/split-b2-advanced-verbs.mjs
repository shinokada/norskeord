#!/usr/bin/env node
/**
 * split-b2-advanced-verbs.mjs
 *
 * Step 1 of ai-docs/implementation/b2-new-categories.md.
 *
 * Splits B2's oversized `advanced-verbs` category (220 entries) into 4
 * smaller categories, classified by grammatical/lexical shape (see Decision 2
 * in the doc):
 *
 *   - reflexive-verbs (37)  — lemma contains "seg" as a separate word
 *   - phrasal-verbs   (89)  — lemma is multi-word (particle/preposition verb),
 *                             checked after the seg test so seg-phrases like
 *                             "sette seg inn i" land in reflexive-verbs, not here
 *   - academic-verbs  (45)  — single-word, on the curated ACADEMIC_VERBS list
 *                             below (formal/Latinate analytical verbs)
 *   - everyday-verbs  (49)  — single-word, everything else
 *
 * The ACADEMIC_VERBS list is a judgment call (same as the original doc's
 * classification), not a mechanical rule — review it before running for
 * real. It was built to reproduce the doc's target split (89/45/37/49)
 * exactly; if you rename/move entries the counts will shift accordingly.
 *
 * Only the `category` field is touched. `id`, `norsk`, `lemma`, translations,
 * examples, `definition`, `level`, `part` are all left exactly as they are.
 *
 * Usage:
 *   node scripts/split-b2-advanced-verbs.mjs --dry-run   ← always try this first
 *   node scripts/split-b2-advanced-verbs.mjs
 *
 * Options:
 *   --dry-run   Print a before/after table and the 4 resulting counts,
 *               without writing any files (default: false)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src/lib/data');
const VOCAB_FILE = path.join(DATA_DIR, 'vocab-b2.json');

const OLD_CATEGORY = 'advanced-verbs';

// ── Classification ──────────────────────────────────────────────────────────

// Single-word verbs judged formal/Latinate/analytical in register (the kind
// you'd see in a report or essay rather than everyday speech). Everything
// else single-word falls through to `everyday-verbs`. Adjust this list and
// re-run --dry-run if any of these calls look wrong to you.
const ACADEMIC_VERBS = new Set([
  'abstrahere',
  'anvende',
  'avlede',
  'avveie',
  'destillere',
  'differensiere',
  'eksplisere',
  'evaluere',
  'fasilitere',
  'generalisere',
  'identifisere',
  'ignorere',
  'implementere',
  'initialisere',
  'integrere',
  'iverksette',
  'konfrontere',
  'koordinere',
  'kvantifisere',
  'modifisere',
  'opprettholde',
  'tilrettelegge',
  'undergrave',
  'validere',
  'supplere',
  'briljere',
  'anse',
  'bedømme',
  'undervurdere',
  'spekulere',
  'foreta',
  'styrke',
  'motvirke',
  'muliggjøre',
  'fremheve',
  'gjenkjenne',
  'gjenspeile',
  'utgjøre',
  'ivareta',
  'utforme',
  'hindre',
  'forvente',
  'skille',
  'misbruke',
  'underskrive'
]);

function classify(entry) {
  const words = entry.lemma.split(' ');
  if (words.includes('seg')) return 'reflexive-verbs';
  if (words.length > 1) return 'phrasal-verbs';
  if (ACADEMIC_VERBS.has(entry.lemma)) return 'academic-verbs';
  return 'everyday-verbs';
}

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

  const counts = {
    'phrasal-verbs': 0,
    'academic-verbs': 0,
    'reflexive-verbs': 0,
    'everyday-verbs': 0
  };

  const newData = data.map((entry) => {
    if (entry.category !== OLD_CATEGORY) return entry;

    const newCategory = classify(entry);
    counts[newCategory] += 1;

    console.log(
      `    ${entry.id}  |  ${entry.lemma.padEnd(28)}  |  ${OLD_CATEGORY} → ${newCategory}`
    );

    return { ...entry, category: newCategory };
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  console.log('\nResulting counts:');
  for (const [cat, n] of Object.entries(counts)) {
    console.log(`    ${cat.padEnd(18)} ${n}`);
  }
  console.log(`    ${'total'.padEnd(18)} ${total}`);

  if (total === 0) {
    console.log(`\nNothing to do — no entries with category "${OLD_CATEGORY}" found.`);
    return;
  }

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete. Run without --dry-run to apply.\n');
  } else {
    writeBackup(VOCAB_FILE);
    fs.writeFileSync(VOCAB_FILE, JSON.stringify(newData, null, 2) + '\n', 'utf8');
    console.log(`\n✅ Done — reassigned ${total} entries in vocab-b2.json.`);
    console.log('   Backup written as vocab-b2.json.bak\n');
  }
}

main();
