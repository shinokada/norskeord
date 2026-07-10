#!/usr/bin/env node
/**
 * delete-ids-by-id.mjs
 *
 * Deletes entries with specific 'id' values from every *.json file
 * (excluding .bak files) in src/lib/data.
 *
 * Usage (run from project root):
 *   node scripts/delete-ids-by-id.mjs
 *   node scripts/delete-ids-by-id.mjs --dry-run
 *   node scripts/delete-ids-by-id.mjs --ids u-b2-350,u-b2-351
 */

import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, 'src', 'lib', 'data');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const idsArgIdx = args.indexOf('--ids');

const DEFAULT_IDS = [
  'u-b2-350',
  'u-b2-351',
  'u-b2-352',
  'u-b2-367',
  'u-b2-372',
  'u-b2-381',
  'u-b2-388',
  'u-b2-409',
  'u-b2-410',
  'u-b2-416',
  'u-b2-422',
  'u-b2-429',
  'u-b2-437',
  'u-b2-456',
  'u-b2-462',
  'v-b1-language-learning-018',
  'v-b1-personal-growth-069',
  'v-b2-advanced-verbs-142',
  'v-b2-advanced-verbs-119',
  'v-b1-traditions-030',
  'v-b1-personal-growth-075',
  'v-b1-city-life-028',
  'v-c-everyday-objects-034',
  'v-a2-communication-035'
];

const idsToDelete =
  idsArgIdx !== -1 && args[idsArgIdx + 1]
    ? args[idsArgIdx + 1]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : DEFAULT_IDS;

const idSet = new Set(idsToDelete);

if (!fs.existsSync(dataDir)) {
  console.error(`❌ Data directory not found: ${dataDir}`);
  console.error('   Make sure you run this script from the project root.');
  process.exit(1);
}

console.log(`Looking to delete ${idSet.size} id(s):`);
for (const id of idSet) console.log('  ' + id);
console.log('');

const files = fs
  .readdirSync(dataDir)
  .filter((f) => f.endsWith('.json') && !f.endsWith('.json.bak'));

const foundIds = new Set();
const removedByFile = {};
let totalRemoved = 0;

for (const file of files) {
  const filePath = path.join(dataDir, file);
  const raw = fs.readFileSync(filePath, 'utf-8');

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.warn(`⚠️  Skipping ${file}: not valid JSON (${err.message})`);
    continue;
  }

  if (!Array.isArray(data)) {
    // Not an array of entries (e.g. stats.json) — skip.
    continue;
  }

  const kept = [];
  const removed = [];

  for (const entry of data) {
    if (entry && typeof entry === 'object' && idSet.has(entry.id)) {
      removed.push(entry);
      foundIds.add(entry.id);
    } else {
      kept.push(entry);
    }
  }

  if (removed.length > 0) {
    removedByFile[file] = removed;
    totalRemoved += removed.length;

    console.log(`${file}: removing ${removed.length} entr${removed.length === 1 ? 'y' : 'ies'}`);
    for (const e of removed) {
      console.log(`  ${e.id}  |  ${e.norsk ?? '?'}`);
    }

    if (!dryRun) {
      const backupPath = filePath + `.bak-${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
      fs.writeFileSync(filePath, JSON.stringify(kept, null, 2) + '\n', 'utf-8');
      console.log(`  ✅ Updated ${file} (backup: ${path.basename(backupPath)})`);
    }
    console.log('');
  }
}

const notFound = [...idSet].filter((id) => !foundIds.has(id));

console.log('--- Summary ---');
console.log(`Files scanned: ${files.length}`);
console.log(`Files modified: ${Object.keys(removedByFile).length}`);
console.log(`Total entries removed: ${totalRemoved}`);

if (notFound.length > 0) {
  console.log(`\n⚠️  ${notFound.length} id(s) were NOT found in any file:`);
  for (const id of notFound) console.log('  ' + id);
}

if (dryRun) {
  console.log('\n--dry-run set: no files were modified.');
}
