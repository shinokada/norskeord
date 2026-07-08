#!/usr/bin/env node
/**
 * remove-a2-draft-dupes.mjs
 *
 * Reads a find_dupes.py report (default: scripts/outputs/find-dupes.txt)
 * and removes every entry from draft/a2/vocab-a2-new.json whose 'norsk'
 * value is flagged as a CROSS-FILE DUPLICATE against the "A2-draft" file
 * (i.e. it already exists in a published vocab file like A1/A2/B1/B2).
 *
 * It does NOT touch "A2-uttrykk-draft" duplicates (those live in a
 * different file: draft/a2/uttrykk-a2-new.json) or duplicates that don't
 * involve A2-draft at all.
 *
 * Usage (run from project root):
 *   node scripts/remove-a2-draft-dupes.mjs
 *   node scripts/remove-a2-draft-dupes.mjs --report scripts/outputs/find-dupes.txt
 *   node scripts/remove-a2-draft-dupes.mjs --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const reportArgIdx = args.indexOf('--report');
const reportPath =
  reportArgIdx !== -1 && args[reportArgIdx + 1]
    ? path.resolve(projectRoot, args[reportArgIdx + 1])
    : path.join(projectRoot, 'scripts', 'outputs', 'find-dupes.txt');

const vocabPath = path.join(projectRoot, 'draft', 'a2', 'vocab-a2-new.json');

if (!fs.existsSync(reportPath)) {
  console.error(`❌ Report file not found: ${reportPath}`);
  console.error(`   Run: python scripts/find_dupes.py > scripts/outputs/find-dupes.txt`);
  process.exit(1);
}

if (!fs.existsSync(vocabPath)) {
  console.error(`❌ Vocab file not found: ${vocabPath}`);
  process.exit(1);
}

const report = fs.readFileSync(reportPath, 'utf-8');

// Only look inside the CROSS-FILE DUPLICATES section
const crossSectionMatch = report.match(/=== CROSS-FILE DUPLICATES[\s\S]*?(?=\n=== |$)/);
if (!crossSectionMatch) {
  console.error('❌ Could not find a "=== CROSS-FILE DUPLICATES ===" section in the report.');
  process.exit(1);
}
const crossSection = crossSectionMatch[0];

// Line format:
//   'norsk value'                                   →  LEVEL1 [cat]  |  LEVEL2 [cat]  |  ...
const lineRe = /^\s*'((?:[^'\\]|\\.)*)'\s+→\s+(.+)$/;

const toRemove = new Set(); // lowercased, trimmed norsk values
const matchedLines = [];

for (const rawLine of crossSection.split('\n')) {
  const m = rawLine.match(lineRe);
  if (!m) continue;
  const norsk = m[1];
  const rest = m[2];

  // Split the level|category pairs on the pipe separator
  const parts = rest.split('|').map((p) => p.trim());
  // A level token looks like: "A2-draft [time]" — extract the level name
  // before the first space or '['.
  const levels = parts.map((p) => (p.match(/^([^\s[]+)/) || [])[1] || '');

  const isA2DraftDupe = levels.includes('A2-draft');
  if (isA2DraftDupe) {
    toRemove.add(norsk.trim().toLowerCase());
    matchedLines.push(rawLine.trim());
  }
}

if (toRemove.size === 0) {
  console.log('No "A2-draft" cross-file duplicates found in the report. Nothing to do.');
  process.exit(0);
}

console.log(`Found ${toRemove.size} 'A2-draft' duplicate norsk value(s) to remove:`);
for (const line of matchedLines) console.log('  ' + line);
console.log('');

const raw = fs.readFileSync(vocabPath, 'utf-8');
const data = JSON.parse(raw);

const removedEntries = [];
const keptEntries = [];
const seenRemovalKeys = new Set();

for (const entry of data) {
  const key = (entry.norsk || '').trim().toLowerCase();
  if (toRemove.has(key)) {
    removedEntries.push(entry);
    seenRemovalKeys.add(key);
  } else {
    keptEntries.push(entry);
  }
}

console.log(`Vocab file entries: ${data.length}`);
console.log(`Entries removed: ${removedEntries.length}`);
console.log(`Entries remaining: ${keptEntries.length}`);

const notFound = [...toRemove].filter((k) => !seenRemovalKeys.has(k));
if (notFound.length > 0) {
  console.log(
    `\n⚠️  ${notFound.length} value(s) from the report were NOT found in ${path.relative(projectRoot, vocabPath)}:`
  );
  for (const k of notFound) console.log('  ' + k);
}

if (removedEntries.length > 0) {
  console.log('\nRemoved entries (id / norsk / category):');
  for (const e of removedEntries) {
    console.log(`  ${e.id ?? '?'}  |  ${e.norsk}  |  ${e.category ?? '?'}`);
  }
}

if (dryRun) {
  console.log('\n--dry-run set: no files were modified.');
  process.exit(0);
}

// Backup original before writing
const backupPath = vocabPath + `.bak-${Date.now()}`;
fs.copyFileSync(vocabPath, backupPath);
console.log(`\nBackup written to: ${path.relative(projectRoot, backupPath)}`);

fs.writeFileSync(vocabPath, JSON.stringify(keptEntries, null, 2) + '\n', 'utf-8');
console.log(`Updated: ${path.relative(projectRoot, vocabPath)}`);
