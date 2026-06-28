#!/usr/bin/env node
/**
 * count-entries.mjs
 *
 * Prints a table of entry counts per category for each vocab level.
 * Also covers uttrykk files (excludes -preview variants).
 *
 * Usage (from project root):
 *   node scripts/count-entries.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../src/lib/data');

const VOCAB_FILES = [
  { level: 'A1', file: 'vocab-a1.json' },
  { level: 'A2', file: 'vocab-a2.json' },
  { level: 'B1', file: 'vocab-b1.json' },
  { level: 'B2', file: 'vocab-b2.json' },
  { level: 'C', file: 'vocab-c.json' }
];

const UTTRYKK_FILES = [
  { level: 'A1', file: 'uttrykk-a1.json' },
  { level: 'A2', file: 'uttrykk-a2.json' },
  { level: 'B1', file: 'uttrykk-b1.json' },
  { level: 'B2', file: 'uttrykk-b2.json' },
  { level: 'C', file: 'uttrykk-c.json' }
];

function loadJson(file) {
  return JSON.parse(readFileSync(resolve(dataDir, file), 'utf8'));
}

function countByCategory(entries) {
  const map = {};
  for (const e of entries) {
    map[e.category] = (map[e.category] ?? 0) + 1;
  }
  return map;
}

function printTable(label, files) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  ${label}`);
  console.log('─'.repeat(50));

  let grandTotal = 0;

  for (const { level, file } of files) {
    const entries = loadJson(file);
    const counts = countByCategory(entries);
    const categories = Object.keys(counts).sort();
    const levelTotal = entries.length;
    grandTotal += levelTotal;

    console.log(`\n  ${level}  (${levelTotal} total)`);
    for (const cat of categories) {
      const count = counts[cat];
      console.log(`    ${cat.padEnd(30)} ${String(count).padStart(4)}`);
    }
  }

  console.log(`\n  ${'─'.repeat(46)}`);
  console.log(`  Grand total: ${grandTotal}`);
}

printTable('VOCAB', VOCAB_FILES);
printTable('UTTRYKK', UTTRYKK_FILES);
console.log();
