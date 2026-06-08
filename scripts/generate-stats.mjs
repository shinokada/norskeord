#!/usr/bin/env node
/**
 * generate-stats.mjs
 *
 * Counts entries in each vocab/uttrykk JSON file and writes the
 * result to src/lib/data/stats.json for the frontend to consume.
 *
 * Usage (from project root):
 *   pnpm stats                  — summary table (same as before)
 *   pnpm stats --detail         — summary + per-category breakdown per level
 *   node scripts/generate-stats.mjs --detail
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/lib/data');
const OUT_FILE = resolve(DATA_DIR, 'stats.json');

const DETAIL = process.argv.includes('--detail');

const FILES = [
  { level: 'A1', type: 'vocab', file: 'vocab-a1.json' },
  { level: 'A2', type: 'vocab', file: 'vocab-a2.json' },
  { level: 'B1', type: 'vocab', file: 'vocab-b1.json' },
  { level: 'B2', type: 'vocab', file: 'vocab-b2.json' },
  { level: 'C', type: 'vocab', file: 'vocab-c.json' },
  { level: 'A1', type: 'uttrykk', file: 'uttrykk-a1.json' },
  { level: 'A2', type: 'uttrykk', file: 'uttrykk-a2.json' },
  { level: 'B1', type: 'uttrykk', file: 'uttrykk-b1.json' },
  { level: 'B2', type: 'uttrykk', file: 'uttrykk-b2.json' }
];

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C'];

// Build per-level counts + optional category breakdown
const byLevel = {};
for (const level of LEVELS) {
  byLevel[level] = { vocab: 0, uttrykk: 0, total: 0 };
}

// categoryByLevel[level][category] = count  (vocab only — uttrykk has no category)
const categoryByLevel = {};

for (const { level, type, file } of FILES) {
  try {
    const data = JSON.parse(readFileSync(resolve(DATA_DIR, file), 'utf-8'));
    const count = data.length;
    byLevel[level][type] = count;
    byLevel[level].total += count;

    if (type === 'vocab') {
      if (!categoryByLevel[level]) categoryByLevel[level] = {};
      for (const entry of data) {
        const cat = entry.category ?? '(none)';
        categoryByLevel[level][cat] = (categoryByLevel[level][cat] ?? 0) + 1;
      }
    }
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

// ── Summary table (always printed) ──────────────────────────────────────────
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

// ── Per-category breakdown (only with --detail) ──────────────────────────────
if (DETAIL) {
  // Find the longest category name for alignment
  const allCats = [
    ...new Set(Object.values(categoryByLevel).flatMap((cats) => Object.keys(cats)))
  ].sort();
  const colW = Math.max(...allCats.map((c) => c.length), 'Category'.length);

  for (const level of LEVELS) {
    const cats = categoryByLevel[level];
    if (!cats) continue;

    const sorted = Object.entries(cats).sort(([a], [b]) => a.localeCompare(b));
    const levelTotal = sorted.reduce((s, [, n]) => s + n, 0);

    console.log(`\n  ${level} — vocab by category`);
    console.log('  ' + '─'.repeat(colW + 8));
    for (const [cat, count] of sorted) {
      console.log(`  ${cat.padEnd(colW)}  ${String(count).padStart(5)}`);
    }
    console.log('  ' + '─'.repeat(colW + 8));
    console.log(`  ${'TOTAL'.padEnd(colW)}  ${String(levelTotal).padStart(5)}`);
  }
}
