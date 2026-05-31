#!/usr/bin/env node
/**
 * generate-stats.mjs
 *
 * Counts entries in each vocab/uttrykk JSON file and writes the
 * result to src/lib/data/stats.json for the frontend to consume.
 *
 * Usage (from project root):
 *   pnpm stats
 *   node scripts/generate-stats.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/lib/data');
const OUT_FILE = resolve(DATA_DIR, 'stats.json');

const FILES = [
  { level: 'A1', type: 'vocab', file: 'vocab-a1.json' },
  { level: 'A2', type: 'vocab', file: 'vocab-a2.json' },
  { level: 'B1', type: 'vocab', file: 'vocab-b1.json' },
  { level: 'B2', type: 'vocab', file: 'vocab-b2.json' },
  { level: 'C1', type: 'vocab', file: 'vocab-c1.json' },
  { level: 'C2', type: 'vocab', file: 'vocab-c2.json' },
  { level: 'A1', type: 'uttrykk', file: 'uttrykk-a1.json' },
  { level: 'A2', type: 'uttrykk', file: 'uttrykk-a2.json' },
  { level: 'B1', type: 'uttrykk', file: 'uttrykk-b1.json' },
  { level: 'B2', type: 'uttrykk', file: 'uttrykk-b2.json' }
];

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// Build per-level counts
const byLevel = {};
for (const level of LEVELS) {
  byLevel[level] = { vocab: 0, uttrykk: 0, total: 0 };
}

for (const { level, type, file } of FILES) {
  try {
    const data = JSON.parse(readFileSync(resolve(DATA_DIR, file), 'utf-8'));
    const count = data.length;
    byLevel[level][type] = count;
    byLevel[level].total += count;
  } catch {
    console.warn(`  Warning: could not read ${file}`);
  }
}

// Grand total
const grandTotal = Object.values(byLevel).reduce((sum, l) => sum + l.total, 0);

const stats = {
  generatedAt: new Date().toISOString(),
  grandTotal,
  byLevel
};

writeFileSync(OUT_FILE, JSON.stringify(stats, null, 2) + '\n');

// Pretty print to console
console.log('\nLevel       Vocab  Uttrykk    Total');
console.log('─'.repeat(38));
for (const level of LEVELS) {
  const { vocab, uttrykk, total } = byLevel[level];
  console.log(
    `${level.padEnd(8)} ${String(vocab).padStart(7)} ${String(uttrykk).padStart(8)} ${String(total).padStart(8)}`
  );
}
console.log('─'.repeat(38));
console.log(`${'TOTAL'.padEnd(8)} ${' '.repeat(16)} ${String(grandTotal).padStart(8)}`);
console.log(`\nWritten to: ${OUT_FILE}`);
