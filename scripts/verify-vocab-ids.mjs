#!/usr/bin/env node
/**
 * scripts/verify-vocab-ids.mjs
 *
 * Pre-migration check: confirms every vocab and uttrykk entry has a stable `id`,
 * and that no id is duplicated across files.
 *
 * Run from the project root:
 *   node scripts/verify-vocab-ids.mjs
 *
 * Exit code 0 = safe to migrate. Exit code 1 = problems found, do not migrate.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../src/lib/data');

const FILES = [
  'vocab-a1.json',
  'vocab-a2.json',
  'vocab-b1.json',
  'vocab-b2.json',
  'vocab-c.json',
  'uttrykk-a1.json',
  'uttrykk-a1-preview.json',
  'uttrykk-a2.json',
  'uttrykk-a2-preview.json',
  'uttrykk-b1.json',
  'uttrykk-b1-preview.json',
  'uttrykk-b2.json',
  'uttrykk-b2-preview.json'
];

let totalEntries = 0;
let totalMissing = 0;
const idMap = new Map(); // id -> first file that defined it

const problems = [];

for (const file of FILES) {
  const entries = JSON.parse(readFileSync(join(DATA, file), 'utf8'));
  const missing = entries.filter((e) => !e.id).map((e) => e.norsk);
  totalEntries += entries.length;
  totalMissing += missing.length;

  if (missing.length > 0) {
    problems.push(
      `${file}: ${missing.length} entries missing id (${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''})`
    );
  }

  for (const entry of entries) {
    if (!entry.id) continue;
    if (idMap.has(entry.id)) {
      problems.push(`DUPLICATE id "${entry.id}" in ${file} (first seen in ${idMap.get(entry.id)})`);
    } else {
      idMap.set(entry.id, file);
    }
  }
}

console.log(`\nVerifying ${FILES.length} files, ${totalEntries} total entries`);
console.log(`Unique ids found: ${idMap.size}`);
console.log(`Missing ids:      ${totalMissing}`);

if (problems.length === 0) {
  console.log('\n✅ All clear — safe to run migrations 016 and 017.\n');
  process.exit(0);
} else {
  console.log('\n❌ Problems found — fix these before migrating:\n');
  for (const p of problems) console.log('  •', p);
  console.log('');
  process.exit(1);
}
