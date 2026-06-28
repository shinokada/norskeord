/**
 * renumber-ids.mjs
 *
 * Renumbers all entries in vocab-*.json and uttrykk-*.json so that IDs are
 * sequential with no gaps.
 *
 * Vocab format:   v-{level}-{category}-{NNN}   e.g. v-a1-greetings-001
 * Uttrykk format: u-{level}-{NNN}              e.g. u-a1-001
 *
 * Within each file, entries are grouped by category (vocab) or treated as a
 * single sequence (uttrykk), and numbered from 001 within each group.
 *
 * Usage:
 *   node scripts/renumber-ids.mjs --dry-run
 *   node scripts/renumber-ids.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../src/lib/data');

const DRY_RUN = process.argv.includes('--dry-run');

function pad3(n) {
  return String(n).padStart(3, '0');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// ── Vocab files ───────────────────────────────────────────────────────────────
// ID format: v-{level}-{category}-{NNN}
// Numbered per category group, starting at 001.

const VOCAB_FILES = [
  { file: 'vocab-a1.json', level: 'a1' },
  { file: 'vocab-a2.json', level: 'a2' },
  { file: 'vocab-b1.json', level: 'b1' },
  { file: 'vocab-b2.json', level: 'b2' },
  { file: 'vocab-c.json', level: 'c' }
];

console.log(
  DRY_RUN ? '\n=== DRY RUN — no files will be written ===\n' : '\n=== Renumbering IDs ===\n'
);

let totalVocabChanged = 0;

for (const { file, level } of VOCAB_FILES) {
  const path = join(dataDir, file);
  const entries = readJson(path);

  // Count per category (preserve insertion order)
  const counters = {};
  let changed = 0;

  const renumbered = entries.map((entry) => {
    const cat = entry.category;
    counters[cat] = (counters[cat] ?? 0) + 1;
    const newId = `v-${level}-${cat}-${pad3(counters[cat])}`;
    if (newId !== entry.id) {
      changed++;
    }
    return { ...entry, id: newId };
  });

  totalVocabChanged += changed;
  console.log(`${file}: ${entries.length} entries, ${changed} IDs changed`);

  if (!DRY_RUN) {
    writeJson(path, renumbered);
  }
}

// ── Uttrykk files ─────────────────────────────────────────────────────────────
// ID format: u-{level}-{NNN}
// Single sequence per file, starting at 001.

const UTTRYKK_FILES = [
  { file: 'uttrykk-a1.json', level: 'a1' },
  { file: 'uttrykk-a2.json', level: 'a2' },
  { file: 'uttrykk-b1.json', level: 'b1' },
  { file: 'uttrykk-b2.json', level: 'b2' },
  { file: 'uttrykk-c.json', level: 'c' }
];

let totalUttrykChanged = 0;

for (const { file, level } of UTTRYKK_FILES) {
  const path = join(dataDir, file);
  const entries = readJson(path);

  let changed = 0;
  const renumbered = entries.map((entry, i) => {
    const newId = `u-${level}-${pad3(i + 1)}`;
    if (newId !== entry.id) changed++;
    return { ...entry, id: newId };
  });

  totalUttrykChanged += changed;
  console.log(`${file}: ${entries.length} entries, ${changed} IDs changed`);

  if (!DRY_RUN) {
    writeJson(path, renumbered);
  }
}

console.log(`\nVocab IDs changed:   ${totalVocabChanged}`);
console.log(`Uttrykk IDs changed: ${totalUttrykChanged}`);
console.log(`Total:               ${totalVocabChanged + totalUttrykChanged}`);

if (DRY_RUN) {
  console.log('\nDry run complete — run without --dry-run to apply.');
} else {
  console.log('\nDone. All IDs are now sequential.');
  console.log('NOTE: uttrykk-*-preview.json files are not updated by this script.');
}
