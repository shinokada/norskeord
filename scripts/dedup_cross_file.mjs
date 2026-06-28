#!/usr/bin/env node
/**
 * dedup_cross_file.mjs
 *
 * Removes cross-file duplicate entries (same `norsk` value appearing in different level files).
 * Keeps the entry at the LOWER CEFR level and removes all higher-level duplicates.
 *
 * Level priority (lowest → highest):
 *   A1 < A1-uttrykk < A2 < A2-uttrykk < B1 < B1-uttrykk < B2 < B2-uttrykk < B2-new < B2-new-uttrykk < C
 *
 * Usage (from the scripts/ directory):
 *   node dedup_cross_file.mjs [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../src/lib/data');
const DRY_RUN = process.argv.includes('--dry-run');

// Level priority: lower index = lower level = keep preference
const LEVEL_ORDER = [
  'A1',
  'A1-uttrykk',
  'A2',
  'A2-uttrykk',
  'B1',
  'B1-uttrykk',
  'B2',
  'B2-uttrykk',
  'B2-new',
  'B2-new-uttrykk',
  'C'
];

// Map each file to its level key
const FILE_LEVEL_MAP = {
  'vocab-a1.json': 'A1',
  'uttrykk-a1.json': 'A1-uttrykk',
  'vocab-a2.json': 'A2',
  'uttrykk-a2.json': 'A2-uttrykk',
  'vocab-b1.json': 'B1',
  'uttrykk-b1.json': 'B1-uttrykk',
  'vocab-b2.json': 'B2',
  'uttrykk-b2.json': 'B2-uttrykk',
  'vocab-b2-new.json': 'B2-new',
  'uttrykk-b2-new.json': 'B2-new-uttrykk',
  'vocab-c.json': 'C'
};

function levelRank(levelKey) {
  const idx = LEVEL_ORDER.indexOf(levelKey);
  return idx === -1 ? 999 : idx;
}

// Load all files
const fileData = {}; // filename → { entries: [...], level: string }

for (const [filename, level] of Object.entries(FILE_LEVEL_MAP)) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`  ⚠ File not found, skipping: ${filename}`);
    continue;
  }
  const raw = fs.readFileSync(filepath, 'utf-8');
  try {
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) {
      console.warn(`  ⚠ Not an array, skipping: ${filename}`);
      continue;
    }
    fileData[filename] = { entries, level, raw };
  } catch (e) {
    console.error(`  ✗ Failed to parse ${filename}: ${e.message}`);
  }
}

// Build a map: norsk → array of { filename, index, level, rank }
const norskMap = {};

for (const [filename, { entries, level }] of Object.entries(fileData)) {
  const rank = levelRank(level);
  for (let i = 0; i < entries.length; i++) {
    const norsk = entries[i].norsk;
    if (!norsk) continue;
    if (!norskMap[norsk]) norskMap[norsk] = [];
    norskMap[norsk].push({ filename, index: i, level, rank });
  }
}

// Find cross-file duplicates and decide what to remove
// Structure: filename → Set of indices to remove
const toRemove = {}; // filename → Set<index>

for (const [norsk, occurrences] of Object.entries(norskMap)) {
  // Only care about entries spanning multiple files
  const files = new Set(occurrences.map((o) => o.filename));
  if (files.size < 2) continue;

  // Sort by rank ascending — lowest level first (= keep)
  const sorted = [...occurrences].sort((a, b) => a.rank - b.rank);
  const keep = sorted[0];
  const remove = sorted.slice(1);

  for (const r of remove) {
    console.log(
      `  KEEP "${norsk}" in ${keep.filename} [${keep.level}], ` +
        `REMOVE from ${r.filename} [${r.level}]`
    );
    if (!toRemove[r.filename]) toRemove[r.filename] = new Set();
    toRemove[r.filename].add(r.index);
  }
}

// Apply removals
let totalRemoved = 0;
let filesChanged = 0;

for (const [filename, indices] of Object.entries(toRemove)) {
  const { entries, raw } = fileData[filename];
  const cleaned = entries.filter((_, i) => !indices.has(i));
  totalRemoved += indices.size;
  filesChanged++;

  console.log(
    `\n  → ${filename}: removed ${indices.size} entr${indices.size === 1 ? 'y' : 'ies'} ` +
      `(${entries.length} → ${cleaned.length})`
  );

  if (!DRY_RUN) {
    const filepath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filepath + '.bak3', raw, 'utf-8');
    fs.writeFileSync(filepath, JSON.stringify(cleaned, null, 2) + '\n', 'utf-8');
  }
}

console.log(
  `\n${DRY_RUN ? '[DRY RUN] Would remove' : 'Removed'} ${totalRemoved} duplicate entries across ${filesChanged} files.`
);
if (DRY_RUN) {
  console.log('Run without --dry-run to apply changes (backups saved as *.bak3).');
}
