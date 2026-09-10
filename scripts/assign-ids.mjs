#!/usr/bin/env node
/**
 * assign-ids.mjs
 * USE renumber-vocab-ids.mjs to renumber existing ids in a draft file, this script only assigns new ids to entries that don't have one yet.
 *
 * Step 4 of ai-docs/instructions/work-flow.md — assigns real `id` values to
 * validated draft entries, after Step 3B (check-vocab.mjs / check-uttrykk.mjs)
 * has passed with 0 errors.
 *
 * Neither Step 1 nor Step 2 of the pipeline assigns real `id` values — every
 * new entry is left with `id: ""`. This script fills them in:
 *
 *   vocab & uttrykk:   w-{NNNNNN}   (NNNNNN is global, 6-digit, ONE shared
 *                                    sequence across all levels AND across
 *                                    both vocab and uttrykk — no level or
 *                                    category segment, and no separate
 *                                    per-type counter either; see
 *                                    ai-docs/implementation/id-new-format.md,
 *                                    Round 3)
 *
 * `level` and `category` (and, for type itself, `category`/`part`) live only
 * in their own entry fields now — the id carries none of them. Moving an
 * entry between vocab and uttrykk no longer implies an id change either.
 *
 * It scans every production file, vocab AND uttrykk, across all 5 levels
 * (src/lib/data/vocab-{level}.json, src/lib/data/uttrykk-{level}.json) to
 * find the highest NNNNNN already in use in that single shared space, then
 * assigns the next sequential number to each draft entry whose id is still
 * "" — regardless of level or type, since one counter covers both. Entries
 * that already have an id are left untouched. Production files are never
 * modified.
 *
 * Before writing, the draft file is backed up to draft/{level}/{file}.bak
 * (matches the project's existing .bak convention), unless --dry-run is set.
 *
 * Usage:
 *   node scripts/assign-ids.mjs <level> [level2 ...]  [options]
 *   node scripts/assign-ids.mjs                        # all levels (a1, a2, b1, b2, c)
 *
 * Options:
 *   --type vocab|uttrykk|both   Which draft file(s) to process (default: both)
 *   --dry-run                   Report what would be assigned, write nothing
 *
 * Examples:
 *   node scripts/assign-ids.mjs c
 *   node scripts/assign-ids.mjs c --type vocab
 *   node scripts/assign-ids.mjs c --dry-run
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');
const DRAFT_DIR = join(__dirname, '../draft');

const ALL_LEVELS = ['a1', 'a2', 'b1', 'b2', 'c'];

const rawArgs = process.argv.slice(2);
const DRY_RUN = rawArgs.includes('--dry-run');
const typeIdx = rawArgs.indexOf('--type');
const TYPE = typeIdx !== -1 ? rawArgs[typeIdx + 1] : 'both';

if (!['vocab', 'uttrykk', 'both'].includes(TYPE)) {
  console.error(`❌  Unknown --type "${TYPE}" — must be "vocab", "uttrykk", or "both"`);
  process.exit(1);
}

const levelArgs = rawArgs.filter((a, i) => !a.startsWith('--') && rawArgs[i - 1] !== '--type');
const targetLevels = levelArgs.length > 0 ? levelArgs.map((a) => a.toLowerCase()) : ALL_LEVELS;

for (const lvl of targetLevels) {
  if (!ALL_LEVELS.includes(lvl)) {
    console.error(`❌  Unknown level "${lvl}" — must be one of ${ALL_LEVELS.join(', ')}`);
    process.exit(1);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad6(n) {
  return String(n).padStart(6, '0');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// ── Shared id state: w-{NNNNNN}, ONE global counter across vocab AND uttrykk,
// across all 5 levels of each ─────────────────────────────────────────────────

const ID_PATTERN = /^w-(\d{6,})$/;

// Scanned once per script run (not per level, not per type) since the
// counter is shared across everything.
function computeIdState() {
  let maxNum = 0;
  const prodIds = new Set();
  for (const lvl of ALL_LEVELS) {
    for (const prefix of ['vocab', 'uttrykk']) {
      const prodPath = join(DATA_DIR, `${prefix}-${lvl}.json`);
      if (!existsSync(prodPath)) continue;
      for (const entry of readJson(prodPath)) {
        if (!entry.id) continue;
        prodIds.add(entry.id);
        const m = entry.id.match(ID_PATTERN);
        if (!m) continue;
        const num = parseInt(m[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }
  return { maxNum, prodIds };
}

const idState = computeIdState();

function nextId() {
  const nextNum = idState.maxNum + 1;
  const newId = `w-${pad6(nextNum)}`;
  if (idState.prodIds.has(newId)) return null; // caller reports + skips
  idState.maxNum = nextNum;
  return newId;
}

function assignVocabIds(level) {
  const draftFilename = `vocab-${level}-new.json`;
  const draftPath = join(DRAFT_DIR, level, draftFilename);

  if (!existsSync(draftPath)) {
    console.log(`  ⏭️   ${draftFilename} not found — skipping`);
    return;
  }

  const draftEntries = readJson(draftPath);

  let assigned = 0;
  let alreadyHadId = 0;
  let skipped = 0;
  const assignments = [];

  for (const entry of draftEntries) {
    if (entry.id) {
      alreadyHadId++;
      continue;
    }
    if (!entry.category) {
      console.log(
        `  ❌  Skipping entry with norsk="${entry.norsk ?? '(unknown)'}" — no category set, run Step 3B validation first`
      );
      skipped++;
      continue;
    }
    const newId = nextId();
    if (!newId) {
      console.log(
        `  ❌  Computed ID already exists in production — skipping this entry, check for a data problem`
      );
      skipped++;
      continue;
    }
    entry.id = newId;
    assignments.push(`${newId}  norsk="${entry.norsk}"`);
    assigned++;
  }

  console.log(`\n📄  ${draftFilename}  (${draftEntries.length} entries)`);
  for (const line of assignments) console.log(`  ✅  ${line}`);
  console.log(`  → ${assigned} assigned, ${alreadyHadId} already had an id, ${skipped} skipped`);

  if (assigned === 0) {
    console.log(`  (nothing to write)`);
    return;
  }

  if (DRY_RUN) {
    console.log(`  🧪  --dry-run: not writing changes`);
    return;
  }

  const bakPath = `${draftPath}.bak`;
  copyFileSync(draftPath, bakPath);
  writeJson(draftPath, draftEntries);
  console.log(
    `  💾  Backed up to ${bakPath.replace(DRAFT_DIR, 'draft')} and wrote ${assigned} new id(s)`
  );
}

// Preview files (uttrykk-{level}-preview.json, up-{level}-{NNN} ids) are a
// separate, dead format — confirmed out of scope in id-new-format.md Round 2.
// Not touched here.
function assignUttrykkIds(level) {
  const draftFilename = `uttrykk-${level}-new.json`;
  const draftPath = join(DRAFT_DIR, level, draftFilename);

  if (!existsSync(draftPath)) {
    console.log(`  ⏭️   ${draftFilename} not found — skipping`);
    return;
  }

  const draftEntries = readJson(draftPath);

  let assigned = 0;
  let alreadyHadId = 0;
  let skipped = 0;
  const assignments = [];

  for (const entry of draftEntries) {
    if (entry.id) {
      alreadyHadId++;
      continue;
    }
    const newId = nextId();
    if (!newId) {
      console.log(
        `  ❌  Computed ID already exists in production — skipping this entry, check for a data problem`
      );
      skipped++;
      continue;
    }
    entry.id = newId;
    assignments.push(`${newId}  norsk="${entry.norsk}"`);
    assigned++;
  }

  console.log(`\n📄  ${draftFilename}  (${draftEntries.length} entries)`);
  for (const line of assignments) console.log(`  ✅  ${line}`);
  console.log(`  → ${assigned} assigned, ${alreadyHadId} already had an id, ${skipped} skipped`);

  if (assigned === 0) {
    console.log(`  (nothing to write)`);
    return;
  }

  if (DRY_RUN) {
    console.log(`  🧪  --dry-run: not writing changes`);
    return;
  }

  const bakPath = `${draftPath}.bak`;
  copyFileSync(draftPath, bakPath);
  writeJson(draftPath, draftEntries);
  console.log(
    `  💾  Backed up to ${bakPath.replace(DRAFT_DIR, 'draft')} and wrote ${assigned} new id(s)`
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

for (const level of targetLevels) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🔍  Level: ${level.toUpperCase()}${DRY_RUN ? '  (dry run)' : ''}`);
  console.log(`${'═'.repeat(60)}`);

  if (TYPE === 'vocab' || TYPE === 'both') assignVocabIds(level);
  if (TYPE === 'uttrykk' || TYPE === 'both') assignUttrykkIds(level);
}

console.log(`\n${'═'.repeat(60)}`);
console.log(DRY_RUN ? '🧪  Dry run complete — no files were changed.' : '✅  Done.');
