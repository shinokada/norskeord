#!/usr/bin/env node
/**
 * renumber-vocab-ids.mjs
 *
 * Closes gaps in the per-category id numbering of a vocab draft file
 * (e.g. draft/a2/vocab-a2-new.json), caused by removing entries after
 * ids were already assigned (see remove-a2-draft-dupes.mjs).
 *
 * For each category, entries are sorted by their current NNN and
 * renumbered contiguously starting from the current minimum NNN in that
 * category (so numbering doesn't collide with anything already in
 * production — it just closes internal gaps, it never renumbers down
 * past where the category already started).
 *
 * Entries whose id doesn't match the expected v-{level}-{category}-{NNN}
 * pattern, or whose category doesn't match the id's category segment, are
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

const ID_RE = /^v-([a-z0-9]+)-(.+)-(\d{3})$/;

function pad3(n) {
  return String(n).padStart(3, '0');
}

const data = JSON.parse(fs.readFileSync(draftPath, 'utf-8'));

// Group entry indices by category, preserving original array order as a
// tiebreaker for entries that (unusually) share the same NNN.
const byCategory = new Map();
const skipped = [];

data.forEach((entry, idx) => {
  const m = (entry.id || '').match(ID_RE);
  if (!m) {
    skipped.push({ idx, reason: 'id does not match v-LEVEL-CATEGORY-NNN pattern', entry });
    return;
  }
  const [, idLevel, idCategory, nnn] = m;
  if (idLevel !== level) {
    skipped.push({ idx, reason: `id level "${idLevel}" != expected "${level}"`, entry });
    return;
  }
  if (idCategory !== entry.category) {
    skipped.push({
      idx,
      reason: `id category "${idCategory}" != entry.category "${entry.category}"`,
      entry
    });
    return;
  }
  if (!byCategory.has(idCategory)) byCategory.set(idCategory, []);
  byCategory.get(idCategory).push({ idx, num: parseInt(nnn, 10), entry });
});

const changes = []; // { oldId, newId }

for (const [category, items] of [...byCategory.entries()].sort()) {
  items.sort((a, b) => a.num - b.num || a.idx - b.idx);
  const minNum = items[0].num;

  // Check whether it's already contiguous
  const isContiguous = items.every((item, i) => item.num === minNum + i);
  if (isContiguous) continue;

  items.forEach((item, i) => {
    const newNum = minNum + i;
    if (newNum === item.num) return; // this one doesn't move
    const oldId = item.entry.id;
    const newId = `v-${level}-${category}-${pad3(newNum)}`;
    item.entry.id = newId;
    changes.push({ oldId, newId, norsk: item.entry.norsk });
  });
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
