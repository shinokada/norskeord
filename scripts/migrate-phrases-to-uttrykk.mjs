/**
 * migrate-phrases-to-uttrykk.mjs
 *
 * Migrates selected vocab entries (part: "phrase") to the corresponding uttrykk file.
 * For each migrated entry:
 *   - id       → u-{level}-{NNN}  (sequential, continuing from last existing uttrykk id)
 *   - category → "uttrykk"
 *   - part     → "phrase"  (already phrase, kept for clarity)
 *   - all other fields copied as-is
 *
 * INPUT:  scripts/migrate-ids.txt
 *   One vocab entry ID per line (copy from phrase-review.tsv).
 *   Lines starting with # are treated as comments.
 *   Example:
 *     # greetings to move
 *     v-a1-greetings-003
 *     v-a1-greetings-004
 *
 * FLAGS:
 *   --dry-run   Print what would change without writing any files.
 *
 * Usage:
 *   node scripts/migrate-phrases-to-uttrykk.mjs --dry-run
 *   node scripts/migrate-phrases-to-uttrykk.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const dataDir = join(projectRoot, 'src/lib/data');

const DRY_RUN = process.argv.includes('--dry-run');

// ---------- Helpers ----------

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/** Returns the highest numeric suffix in an array of u-{level}-{NNN} ids */
function maxUttrykId(entries) {
  let max = 0;
  for (const e of entries) {
    const m = e.id?.match(/^u-\w+-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

/** Zero-pad to 3 digits */
function pad3(n) {
  return String(n).padStart(3, '0');
}

/** Level string → file-level key  e.g. "A1" → "a1" */
function levelKey(level) {
  return level.toLowerCase();
}

// ---------- Load migration list ----------

const migrationListPath = join(__dirname, 'migrate-ids.txt');
if (!existsSync(migrationListPath)) {
  console.error(`ERROR: ${migrationListPath} not found.`);
  console.error('Create it with one vocab ID per line (see script header for format).');
  process.exit(1);
}

const migrateIds = new Set(
  readFileSync(migrationListPath, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
);

if (migrateIds.size === 0) {
  console.error('ERROR: migrate-ids.txt is empty or contains only comments.');
  process.exit(1);
}

console.log(`\nIDs to migrate: ${migrateIds.size}`);
if (DRY_RUN) console.log('DRY RUN — no files will be written.\n');

// ---------- Load all vocab files ----------

const VOCAB_FILES = [
  'vocab-a1.json',
  'vocab-a2.json',
  'vocab-b1.json',
  'vocab-b2.json',
  'vocab-c.json'
];

// Map: level key → { vocabPath, vocabEntries, uttrykPath, uttrykEntries }
const fileData = {};

for (const filename of VOCAB_FILES) {
  const vocabPath = join(dataDir, filename);
  const entries = readJson(vocabPath);
  // Determine level from first entry
  const level = entries[0]?.level;
  if (!level) continue;
  const lk = levelKey(level);
  const uttrykPath = join(dataDir, `uttrykk-${lk}.json`);
  const uttrykEntries = existsSync(uttrykPath) ? readJson(uttrykPath) : [];
  fileData[lk] = { vocabPath, vocabEntries: entries, uttrykPath, uttrykEntries };
}

// ---------- Process migrations ----------

// Track which IDs we actually found
const found = new Set();
const notFound = [];

// Collect migrations grouped by level
const migrations = {}; // lk → array of transformed entries

for (const [lk, { vocabEntries }] of Object.entries(fileData)) {
  for (const entry of vocabEntries) {
    if (migrateIds.has(entry.id)) {
      found.add(entry.id);
      if (!migrations[lk]) migrations[lk] = [];
      migrations[lk].push(entry);
    }
  }
}

for (const id of migrateIds) {
  if (!found.has(id)) notFound.push(id);
}

if (notFound.length > 0) {
  console.warn('\nWARNING: The following IDs were not found in any vocab file:');
  notFound.forEach((id) => console.warn('  ' + id));
}

// ---------- Apply & report ----------

let totalMoved = 0;

for (const [lk, entriesToMove] of Object.entries(migrations)) {
  const { vocabPath, vocabEntries, uttrykPath, uttrykEntries } = fileData[lk];

  // Determine starting ID counter (after current max)
  let counter = maxUttrykId(uttrykEntries) + 1;

  const transformed = entriesToMove.map((entry) => {
    const newEntry = { ...entry };
    newEntry.id = `u-${lk}-${pad3(counter++)}`;
    newEntry.category = 'uttrykk';
    newEntry.part = 'phrase';
    return newEntry;
  });

  const newVocabEntries = vocabEntries.filter((e) => !migrateIds.has(e.id));
  const newUttrykEntries = [...uttrykEntries, ...transformed];

  console.log(`\n[${lk.toUpperCase()}] ${entriesToMove.length} entries to migrate`);
  console.log(`  vocab:   ${vocabEntries.length} → ${newVocabEntries.length} entries`);
  console.log(`  uttrykk: ${uttrykEntries.length} → ${newUttrykEntries.length} entries`);

  for (const [orig, xformed] of entriesToMove.map((e, i) => [e, transformed[i]])) {
    console.log(`    ${orig.id}  →  ${xformed.id}  "${orig.norsk}"`);
  }

  if (!DRY_RUN) {
    writeJson(vocabPath, newVocabEntries);
    writeJson(uttrykPath, newUttrykEntries);
    console.log(`  ✓ Written: ${vocabPath}`);
    console.log(`  ✓ Written: ${uttrykPath}`);
  }

  totalMoved += entriesToMove.length;
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Total migrated: ${totalMoved} entries`);
if (DRY_RUN) {
  console.log('DRY RUN complete — run without --dry-run to apply changes.');
} else {
  console.log('Migration complete.');
  console.log('\nNOTE: uttrykk-*-preview.json files are NOT updated by this script.');
  console.log('If preview files are maintained separately, update them manually or');
  console.log('re-run whatever script generates them.');
}
