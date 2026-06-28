#!/usr/bin/env node
/**
 * migrate-type-a-to-uttrykk.mjs
 *
 * Reads scripts/output/phrase-classification.json (produced by classify-vocab-phrases.mjs),
 * takes all entries classified as "type_a", removes them from their source vocab-xx.json
 * file, and appends them to the matching uttrykk-xx.json file with proper uttrykk IDs.
 *
 * What it does per migrated entry:
 *   - Removes entry from vocab-xx.json
 *   - Assigns a new sequential ID:  u-<level>-<NNN>  (e.g. u-a2-142)
 *   - Sets  category: "uttrykk"  and  part: "phrase"
 *   - Copies norsk, lemma, english from the vocab entry
 *   - Preserves existing translation fields (ukrainian, spanish, german) if present
 *   - Leaves example fields empty (for manual/future enrichment)
 *   - Writes a .bak backup of each modified file before touching it
 *
 * Usage:
 *   node scripts/migrate-type-a-to-uttrykk.mjs --dry-run   ← always try this first
 *   node scripts/migrate-type-a-to-uttrykk.mjs
 *
 * Options:
 *   --dry-run   Print what would happen without writing any files (default: false)
 *   --ids       Comma-separated list of vocab IDs to migrate (overrides type_a filter)
 *               e.g. --ids v-a1-greetings-004,v-a2-weather-001
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src/lib/data');
const CLASSIFICATION_FILE = path.join(PROJECT_ROOT, 'scripts/output/phrase-classification.json');

// ── Manual overrides ──────────────────────────────────────────────────────────

// type_a entries to skip (keep in vocab — reclassified after dry-run review)
const SKIP_IDS = new Set([
  'v-a1-pronouns-and-questions-026', // hvor mange — question determiner, better as vocab
  'v-a2-time-004', // neste uke — transparent time adverbial
  'v-a2-time-005', // forrige uke — transparent time adverbial
  'v-a2-time-006', // neste år — transparent time adverbial
  'v-a2-time-011', // noen ganger — frequency adverb
  'v-a2-house-chores-020', // hver dag — frequency adverb
  'v-a2-directions-007' // langt unna — adverbial phrase
]);

// vocab IDs to delete entirely (duplicates or otherwise unwanted)
const DELETE_IDS = new Set([
  'v-a2-communication-018' // "Jeg forstår ikke." — duplicate of v-a1-greetings-012
]);

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const idsArg = args.find((a) => a.startsWith('--ids='))?.split('=')[1];
const FILTER_IDS = idsArg ? new Set(idsArg.split(',').map((s) => s.trim())) : null;

// ── Level helpers ─────────────────────────────────────────────────────────────

const LEVEL_MAP = {
  a1: { vocabFile: 'vocab-a1.json', uttrykFile: 'uttrykk-a1.json', levelField: 'A1' },
  a2: { vocabFile: 'vocab-a2.json', uttrykFile: 'uttrykk-a2.json', levelField: 'A2' },
  b1: { vocabFile: 'vocab-b1.json', uttrykFile: 'uttrykk-b1.json', levelField: 'B1' },
  b2: { vocabFile: 'vocab-b2.json', uttrykFile: 'uttrykk-b2.json', levelField: 'B2' },
  c: { vocabFile: 'vocab-c.json', uttrykFile: 'uttrykk-c.json', levelField: 'C' }
};

// Translation + example fields per level (based on existing uttrykk file structure)
const UTTRYKK_FIELDS = {
  a1: {
    translations: ['ukrainian', 'spanish', 'german'],
    exampleLangs: ['ukrainian', 'spanish', 'german']
  },
  a2: {
    translations: ['ukrainian', 'spanish', 'german'],
    exampleLangs: ['ukrainian', 'spanish', 'german']
  },
  b1: {
    translations: ['ukrainian', 'spanish', 'german'],
    exampleLangs: ['ukrainian', 'spanish', 'german']
  },
  b2: { translations: ['german'], exampleLangs: ['german'] },
  c: { translations: ['german'], exampleLangs: ['german'] }
};

function formatId(level, num) {
  return `u-${level}-${String(num).padStart(3, '0')}`;
}

function buildUttrykEntry(vocabEntry, level, newId) {
  const levelField = LEVEL_MAP[level].levelField;
  const { translations, exampleLangs } = UTTRYKK_FIELDS[level];

  const entry = {
    id: newId,
    norsk: vocabEntry.norsk,
    lemma: vocabEntry.lemma,
    english: vocabEntry.english
  };

  // Copy translation fields that exist on the vocab entry; blank if missing
  for (const field of translations) {
    entry[field] = vocabEntry[field] ?? '';
  }

  // Example fields — blank, to be enriched later
  entry.example = '';
  entry.example_english = '';
  for (const lang of exampleLangs) {
    entry[`example_${lang}`] = '';
  }

  entry.level = levelField;
  entry.category = 'uttrykk';
  entry.part = 'phrase';

  return entry;
}

function writeBackup(filePath) {
  const bakPath = filePath + '.bak';
  fs.copyFileSync(filePath, bakPath);
  return bakPath;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  if (DRY_RUN) console.log('🔍 DRY RUN — no files will be modified\n');

  // Load classification results
  if (!fs.existsSync(CLASSIFICATION_FILE)) {
    console.error(`❌ Classification file not found: ${CLASSIFICATION_FILE}`);
    console.error('   Run classify-vocab-phrases.mjs first.');
    process.exit(1);
  }
  const classified = JSON.parse(fs.readFileSync(CLASSIFICATION_FILE, 'utf8'));

  // Filter to type_a only (or --ids override), excluding manual skips
  const toMigrate = (
    FILTER_IDS
      ? classified.filter((e) => FILTER_IDS.has(e.id))
      : classified.filter((e) => e.classification === 'type_a')
  ).filter((e) => !SKIP_IDS.has(e.id) && !DELETE_IDS.has(e.id));

  // Collect delete targets by level
  const toDelete = classified.filter((e) => DELETE_IDS.has(e.id));
  const deleteByLevel = {};
  for (const entry of toDelete) {
    if (!deleteByLevel[entry._level]) deleteByLevel[entry._level] = [];
    deleteByLevel[entry._level].push(entry);
  }

  if (toMigrate.length === 0 && toDelete.length === 0) {
    console.log('Nothing to migrate or delete.');
    return;
  }

  // Group by level
  const byLevel = {};
  for (const entry of toMigrate) {
    const level = entry._level;
    if (!LEVEL_MAP[level]) {
      console.warn(`  ⚠ Unknown level "${level}" for ${entry.id} — skipping`);
      continue;
    }
    if (!byLevel[level]) byLevel[level] = [];
    byLevel[level].push(entry);
  }

  console.log(`📋 Entries to migrate: ${toMigrate.length}`);
  if (toDelete.length > 0) {
    console.log(`🗑  Entries to delete:  ${toDelete.length}`);
    for (const e of toDelete) console.log(`    ${e.id}  |  ${e.norsk}  (${e._level})`);
  }
  console.log('');

  const migrations = []; // for dry-run summary

  for (const [level, entries] of Object.entries(byLevel)) {
    const { vocabFile, uttrykFile, levelField } = LEVEL_MAP[level];
    const vocabPath = path.join(DATA_DIR, vocabFile);
    const uttrykPath = path.join(DATA_DIR, uttrykFile);

    if (!fs.existsSync(vocabPath)) {
      console.error(`  ❌ Missing vocab file: ${vocabFile}`);
      continue;
    }
    if (!fs.existsSync(uttrykPath)) {
      console.error(`  ❌ Missing uttrykk file: ${uttrykFile}`);
      continue;
    }

    const vocabData = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
    const uttrykData = JSON.parse(fs.readFileSync(uttrykPath, 'utf8'));

    const deleteIds = new Set((deleteByLevel[level] ?? []).map((e) => e.id));
    const removeIds = new Set([...entries.map((e) => e.id), ...deleteIds]);
    const newUttrykEntries = [];

    // Build new uttrykk entries, assigning sequential IDs
    let currentMax =
      uttrykData.length > 0
        ? Math.max(...uttrykData.map((e) => parseInt(e.id.split('-').pop(), 10)))
        : 0;

    for (const entry of entries) {
      currentMax += 1;
      const newId = formatId(level, currentMax);
      const uttrykEntry = buildUttrykEntry(entry, level, newId);
      newUttrykEntries.push(uttrykEntry);
      migrations.push({ from: entry.id, to: newId, norsk: entry.norsk, level });
    }

    // Print plan for this level
    console.log(`  ${levelField} — ${vocabFile} → ${uttrykFile}`);
    for (const m of migrations.filter((m) => m.level === level)) {
      console.log(`    ${m.from}  →  ${m.to}  |  ${m.norsk}`);
    }

    if (!DRY_RUN) {
      // Backup both files
      writeBackup(vocabPath);
      writeBackup(uttrykPath);

      // Remove entries from vocab
      const newVocabData = vocabData.filter((e) => !removeIds.has(e.id));
      fs.writeFileSync(vocabPath, JSON.stringify(newVocabData, null, 2) + '\n', 'utf8');

      // Append to uttrykk
      const newUttrykData = [...uttrykData, ...newUttrykEntries];
      fs.writeFileSync(uttrykPath, JSON.stringify(newUttrykData, null, 2) + '\n', 'utf8');

      console.log(
        `    ✓ Removed ${entries.length} from ${vocabFile}, appended ${newUttrykEntries.length} to ${uttrykFile}`
      );
    }

    console.log('');
  }

  if (DRY_RUN) {
    console.log(`\n✅ Dry run complete — ${migrations.length} entries would be migrated.`);
    console.log('   Run without --dry-run to apply.\n');
  } else {
    console.log(`\n✅ Done — migrated ${migrations.length} entries.`);
    console.log('   Backups written as .bak files.\n');
  }
}

main();
