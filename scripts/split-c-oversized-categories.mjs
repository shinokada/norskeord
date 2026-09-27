#!/usr/bin/env node
/**
 * split-c-oversized-categories.mjs
 *
 * Step 1 of ai-docs/implementation/c-new-categories.md.
 *
 * Splits C's 3 oversized categories into 9 smaller ones, classified along
 * the axes worked out from the full dry-run dump
 * (scripts/outputs/c-oversized-categories-dryrun.txt):
 *
 *   abstract-concepts (234)      — grammatical axis (like the b2 verb split).
 *                                   First pass lumped everything non-noun/
 *                                   non-adjective into one 150-entry bucket,
 *                                   which blew past the 120 hard ceiling
 *                                   (see Decision 1) — split further by
 *                                   lemma word count:
 *     - abstract-nouns                entry.part === 'noun', single-word lemma
 *     - abstract-adjectives           entry.part === 'adjective', single-word lemma
 *     - abstract-verbs                everything else with a 1- or 2-word lemma
 *                                      (single verbs like "utrette", plus
 *                                      2-word verb+particle combos like
 *                                      "vite av", "dømt til")
 *     - idiomatic-expressions         everything else with a 3+-word lemma
 *                                      (fixed idioms/phrases like "renne ut
 *                                      i sanden", "i bunn og grunn")
 *
 *   Note: a handful of 2-word entries are actually noun phrases (e.g. "rød
 *   tråd", "tilmålt porsjon") rather than verbs, and land in abstract-verbs
 *   anyway since there's no part-of-speech signal for multi-word lemmas to
 *   route on. Acceptable for a study-deck category split; flag if it bothers
 *   you and we can hand-list exceptions.
 *
 *   character-temperament (188)  — grammatical axis:
 *     - personality-traits            entry.part === 'adjective', single-word lemma
 *     - character-types               entry.part === 'noun', single-word lemma
 *     - behavioral-idioms             everything else (single-word verbs like
 *                                      "sky"/"nøle" plus all multi-word phrases)
 *
 *   nature-landscape (176)       — topical axis (grammatical axis doesn't fit;
 *                                   this category is mostly nouns/adjectives
 *                                   already). Curated keyword sets below,
 *                                   built from reading all 176 entries in the
 *                                   dry-run dump:
 *     - weather-and-elements          weather, light, temperature, time-of-day
 *     - flora-and-fauna               plants, animals, growth/decay
 *     - terrain-and-water             landforms, water bodies (default bucket
 *                                      — catches everything not in the two
 *                                      curated sets above)
 *
 * The nature-landscape keyword sets are a first-pass judgment call (same
 * caveat as the b2 script's ACADEMIC_VERBS list) — review the --dry-run
 * output and adjust WEATHER_ELEMENTS / FLORA_FAUNA before running for real
 * if any calls look wrong.
 *
 * Only the `category` field is touched. Everything else on each entry is
 * left exactly as-is.
 *
 * Usage:
 *   node scripts/split-c-oversized-categories.mjs --dry-run   ← always try this first
 *   node scripts/split-c-oversized-categories.mjs
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

// ── Classification: abstract-concepts ───────────────────────────────────────

function classifyAbstractConcepts(entry) {
  const wordCount = entry.lemma.trim().split(/\s+/).length;
  if (wordCount === 1 && entry.part === 'noun') return 'abstract-nouns';
  if (wordCount === 1 && entry.part === 'adjective') return 'abstract-adjectives';
  if (wordCount <= 2) return 'abstract-verbs';
  return 'idiomatic-expressions';
}

// ── Classification: character-temperament ───────────────────────────────────

function classifyCharacterTemperament(entry) {
  const isMultiWord = entry.lemma.trim().split(/\s+/).length > 1;
  if (!isMultiWord && entry.part === 'adjective') return 'personality-traits';
  if (!isMultiWord && entry.part === 'noun') return 'character-types';
  return 'behavioral-idioms';
}

// ── Classification: nature-landscape ─────────────────────────────────────────

// Weather, light, temperature, time-of-day, transient atmospheric phenomena.
const WEATHER_ELEMENTS = new Set([
  'himmelhvelving',
  'blikkstille',
  'blest',
  'kuling',
  'rimkledd',
  'islagt',
  'varmedis',
  'slaps',
  'sludde',
  'lummer',
  'vintersolverv',
  'mørkets frambrudd',
  'tåkete',
  'piskende',
  'dyvåt',
  'sval',
  'islett av regn',
  'knusktørr',
  'grytidlig',
  'sige',
  'gry av dag',
  'lun',
  'solglipe',
  'flodbølge',
  'ildtunge',
  'sot'
]);

// Plants, animals, growth/decay, fishing-and-wildlife vocabulary.
const FLORA_FAUNA = new Set([
  'siv',
  'gresstust',
  'eføy',
  'skogholt',
  'einer',
  'råtne',
  'kristtorn',
  'busk',
  'buskas',
  'villnis',
  'ugress',
  'eik',
  'trekrone',
  'løvverk',
  'mosegrønn',
  'stilk',
  'vannlilje',
  'skogstjerne',
  'lysning',
  'stubbe',
  'kjøter',
  'tam',
  'barskog',
  'gjøk',
  'kråke',
  'dompap',
  'hyene',
  'glassmanet',
  'tispe',
  'gribb',
  'klo',
  'vrimmel',
  'sverme',
  'vrimle',
  'springe ut',
  'vissen',
  'hekk',
  'trestokk',
  'agn',
  'snøre',
  'napp',
  'sveive inn',
  'sværing',
  'surre seg rundt',
  'forvitre',
  'spire',
  'gjødning',
  'forpeste',
  'råte',
  'strå'
]);

function classifyNatureLandscape(entry) {
  if (WEATHER_ELEMENTS.has(entry.lemma)) return 'weather-and-elements';
  if (FLORA_FAUNA.has(entry.lemma)) return 'flora-and-fauna';
  return 'terrain-and-water'; // default/catch-all bucket
}

// ── Category registry ─────────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  'abstract-concepts': {
    classify: classifyAbstractConcepts,
    newCategories: ['abstract-nouns', 'abstract-adjectives', 'abstract-verbs', 'idiomatic-expressions']
  },
  'character-temperament': {
    classify: classifyCharacterTemperament,
    newCategories: ['personality-traits', 'character-types', 'behavioral-idioms']
  },
  'nature-landscape': {
    classify: classifyNatureLandscape,
    newCategories: ['weather-and-elements', 'flora-and-fauna', 'terrain-and-water']
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
      console.log(`    ${newCat.padEnd(32)} ${counts[newCat]}`);
      subtotal += counts[newCat];
    }
    console.log(`    ${'subtotal'.padEnd(32)} ${subtotal}`);
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`\n  grand total: ${total}`);

  if (total === 0) {
    console.log('\nNothing to do — no entries with any of the 3 target categories found.');
    return;
  }

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete. Review the counts above (and the console output for');
    console.log('   any surprising individual reassignments) before running without --dry-run.\n');
  } else {
    writeBackup(VOCAB_FILE);
    fs.writeFileSync(VOCAB_FILE, JSON.stringify(newData, null, 2) + '\n', 'utf8');
    console.log(`\n✅ Done — reassigned ${total} entries in vocab-c.json.`);
    console.log('   Backup written as vocab-c.json.bak\n');
  }
}

main();
