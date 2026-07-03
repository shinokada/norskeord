#!/usr/bin/env node
/**
 * assign-ids.mjs
 *
 * Step 4 of ai-docs/instructions/work-flow.md — assigns real `id` values to
 * validated draft entries, after Step 3B (check-vocab.mjs / check-uttrykk.mjs)
 * has passed with 0 errors.
 *
 * Neither Step 1 nor Step 2 of the pipeline assigns real `id` values — every
 * new entry is left with `id: ""`. This script fills them in:
 *
 *   vocab:   v-{level}-{category}-{NNN}   (NNN is per-category, per data-rules/vocab-and-uttrykk.md)
 *   uttrykk: u-{level}-{NNN}              (NNN is per-level, no category segment)
 *
 * It reads the current production file (src/lib/data/vocab-{level}.json /
 * uttrykk-{level}.json) to find the highest NNN already in use (per category
 * for vocab, per level for uttrykk), then assigns the next sequential NNN to
 * each draft entry whose id is still "". Entries that already have an id are
 * left untouched. Production files are never modified.
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

function pad3(n) {
  return String(n).padStart(3, '0');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// ── Vocab: v-{level}-{category}-{NNN} ────────────────────────────────────────

const VOCAB_ID_PATTERN = /^v-([a-z0-9]+)-(.+)-(\d{3})$/;

function assignVocabIds(level) {
  const prodPath = join(DATA_DIR, `vocab-${level}.json`);
  const draftFilename = `vocab-${level}-new.json`;
  const draftPath = join(DRAFT_DIR, level, draftFilename);

  if (!existsSync(draftPath)) {
    console.log(`  ⏭️   ${draftFilename} not found — skipping`);
    return;
  }

  const prodEntries = existsSync(prodPath) ? readJson(prodPath) : [];
  const draftEntries = readJson(draftPath);

  // Max NNN per category, from production, and the full set of production IDs
  // (used to catch a draft entry accidentally reusing a production ID).
  const maxByCategory = new Map();
  const prodIds = new Set();
  for (const entry of prodEntries) {
    if (!entry.id) continue;
    prodIds.add(entry.id);
    const m = entry.id.match(VOCAB_ID_PATTERN);
    if (!m || m[1] !== level) continue;
    const [, , category, nnn] = m;
    const num = parseInt(nnn, 10);
    if (!maxByCategory.has(category) || num > maxByCategory.get(category)) {
      maxByCategory.set(category, num);
    }
  }

  let assigned = 0;
  let alreadyHadId = 0;
  let skippedNoCategory = 0;
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
      skippedNoCategory++;
      continue;
    }
    const category = entry.category;
    const nextNum = (maxByCategory.get(category) ?? 0) + 1;
    const newId = `v-${level}-${category}-${pad3(nextNum)}`;
    if (prodIds.has(newId)) {
      console.log(
        `  ❌  Computed ID "${newId}" already exists in production — skipping this entry, check for a data problem`
      );
      skippedNoCategory++;
      continue;
    }
    maxByCategory.set(category, nextNum);
    entry.id = newId;
    assignments.push(`${newId}  norsk="${entry.norsk}"`);
    assigned++;
  }

  console.log(`\n📄  ${draftFilename}  (${draftEntries.length} entries)`);
  for (const line of assignments) console.log(`  ✅  ${line}`);
  console.log(
    `  \u2192 ${assigned} assigned, ${alreadyHadId} already had an id, ${skippedNoCategory} skipped`
  );

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

// ── Uttrykk: u-{level}-{NNN} ──────────────────────────────────────────────────

const UTTRYKK_ID_PATTERN = /^u-([a-z0-9]+)-(\d{3})$/;

function assignUttrykkIds(level) {
  const prodPath = join(DATA_DIR, `uttrykk-${level}.json`);
  const draftFilename = `uttrykk-${level}-new.json`;
  const draftPath = join(DRAFT_DIR, level, draftFilename);

  if (!existsSync(draftPath)) {
    console.log(`  ⏭️   ${draftFilename} not found — skipping`);
    return;
  }

  const prodEntries = existsSync(prodPath) ? readJson(prodPath) : [];
  const draftEntries = readJson(draftPath);

  let maxNum = 0;
  const prodIds = new Set();
  for (const entry of prodEntries) {
    if (!entry.id) continue;
    prodIds.add(entry.id);
    const m = entry.id.match(UTTRYKK_ID_PATTERN);
    if (!m || m[1] !== level) continue;
    const num = parseInt(m[2], 10);
    if (num > maxNum) maxNum = num;
  }

  let assigned = 0;
  let alreadyHadId = 0;
  let skipped = 0;
  const assignments = [];

  for (const entry of draftEntries) {
    if (entry.id) {
      alreadyHadId++;
      continue;
    }
    const nextNum = maxNum + 1;
    const newId = `u-${level}-${pad3(nextNum)}`;
    if (prodIds.has(newId)) {
      console.log(
        `  ❌  Computed ID "${newId}" already exists in production — skipping this entry, check for a data problem`
      );
      skipped++;
      continue;
    }
    maxNum = nextNum;
    entry.id = newId;
    assignments.push(`${newId}  norsk="${entry.norsk}"`);
    assigned++;
  }

  console.log(`\n📄  ${draftFilename}  (${draftEntries.length} entries)`);
  for (const line of assignments) console.log(`  ✅  ${line}`);
  console.log(
    `  \u2192 ${assigned} assigned, ${alreadyHadId} already had an id, ${skipped} skipped`
  );

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
