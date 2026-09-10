#!/usr/bin/env node
/**
 * renumber-vocab-ids.mjs
 *
 * Closes gaps in the id numbering of a vocab draft file
 * (e.g. draft/a2/vocab-a2-new.json), caused by removing entries after
 * ids were already assigned (see remove-a2-draft-dupes.mjs).
 *
 * Entries are sorted by their current NNNN and renumbered contiguously
 * starting from the current minimum NNNN in the file (so numbering doesn't
 * collide with anything already in production — it just closes internal
 * gaps, it never renumbers down past where the file already started).
 * Numbering is a single sequence per level — category no longer affects
 * numbering (see ai-docs/implementation/id-new-format.md).
 *
 * Entries whose id doesn't match the expected v-{level}-{NNNN} pattern are
 * left untouched and reported as skipped (shouldn't normally happen —
 * investigate before re-running if you see any).
 *
 * Usage (run from project root):
 *   node scripts/renumber-vocab-ids.mjs <level>
 *   node scripts/renumber-vocab-ids.mjs a2
 *   node scripts/renumber-vocab-ids.mjs a2 --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const level = args.find((a) => !a.startsWith('--'));

if (!level) {
  console.error('❌ Usage: node scripts/renumber-vocab-ids.mjs <level> [--dry-run]');
  process.exit(1);
}

const draftPath = path.join(projectRoot, 'draft', level, `vocab-${level}-new.json`);

if (!fs.existsSync(draftPath)) {
  console.error(`❌ Draft file not found: ${draftPath}`);
  process.exit(1);
}

const ID_RE = /^v-([a-z0-9]+)-(\d{4,})$/;

function pad4(n) {
  return String(n).padStart(4, '0');
}

const data = JSON.parse(fs.readFileSync(draftPath, 'utf-8'));

// Single sequence for the whole level file, preserving original array order
// as a tiebreaker for entries that (unusually) share the same NNNN.
const items = [];
const skipped = [];

data.forEach((entry, idx) => {
  const m = (entry.id || '').match(ID_RE);
  if (!m) {
    skipped.push({ idx, reason: 'id does not match v-LEVEL-NNNN pattern', entry });
    return;
  }
  const [, idLevel, nnnn] = m;
  if (idLevel !== level) {
    skipped.push({ idx, reason: `id level "${idLevel}" != expected "${level}"`, entry });
    return;
  }
  items.push({ idx, num: parseInt(nnnn, 10), entry });
});

const changes = []; // { oldId, newId }

if (items.length > 0) {
  items.sort((a, b) => a.num - b.num || a.idx - b.idx);
  const minNum = items[0].num;

  // Check whether it's already contiguous
  const isContiguous = items.every((item, i) => item.num === minNum + i);

  if (!isContiguous) {
    items.forEach((item, i) => {
      const newNum = minNum + i;
      if (newNum === item.num) return; // this one doesn't move
      const oldId = item.entry.id;
      const newId = `v-${level}-${pad4(newNum)}`;
      item.entry.id = newId;
      changes.push({ oldId, newId, norsk: item.entry.norsk });
    });
  }
}

console.log(`Draft file: ${path.relative(projectRoot, draftPath)}  (${data.length} entries)`);

if (skipped.length > 0) {
  console.log(`\n⚠️  ${skipped.length} entries skipped (not touched):`);
  for (const s of skipped) {
    console.log(`  idx ${s.idx}  id="${s.entry.id}"  norsk="${s.entry.norsk}"  — ${s.reason}`);
  }
}

if (changes.length === 0) {
  console.log('\nNo gaps found — every category is already contiguous. Nothing to do.');
  process.exit(0);
}

console.log(`\n${changes.length} id(s) renumbered:`);
for (const c of changes) {
  console.log(`  ${c.oldId}  →  ${c.newId}   (norsk="${c.norsk}")`);
}

if (dryRun) {
  console.log('\n--dry-run set: no files were modified.');
  process.exit(0);
}

const backupPath = draftPath + `.bak-${Date.now()}`;
fs.copyFileSync(draftPath, backupPath);
console.log(`\nBackup written to: ${path.relative(projectRoot, backupPath)}`);

fs.writeFileSync(draftPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log(`Updated: ${path.relative(projectRoot, draftPath)}`);
