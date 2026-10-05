#!/usr/bin/env node
/**
 * merge-definitions.mjs
 *
 * Merges reviewed definitions into src/lib/data/vocab-{level}.json
 * (see ai-docs/implementation/add-definition-a1-a2.md, Part 4).
 *
 * Usage:
 *   node scripts/merge-definitions.mjs --level a1 --dry-run
 *   node scripts/merge-definitions.mjs --level a1
 *   node scripts/merge-definitions.mjs --level a1 --force   (overwrite existing definitions)
 *
 * Reads:
 *   draft/definitions/{level}/reviewed.txt                   batch numbers that were reviewed
 *   draft/definitions/{level}/output/batch-NNN.json          definitions
 *   draft/definitions/{level}/output/batch-NNN.redo-K.json   redo rounds, applied in order K=1,2,...
 *   draft/definitions/{level}/rejected/batch-NNN.json        ids still rejected (never merged)
 *
 * Writes (not on --dry-run):
 *   src/lib/data/vocab-{level}.json.bak                      backup of the original
 *   src/lib/data/vocab-{level}.json                          with `definition` inserted before `level`
 *
 * Matches by `id` only. Only the `definition` field is merged; model flags are never written.
 * Exit code is 1 on any error, otherwise 0.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'src', 'lib', 'data');
const WORK_DIR = path.join(ROOT, 'draft', 'definitions');

// ---------- args ----------

function fail(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { level: null, dryRun: false, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--level') args.level = (argv[++i] ?? '').toLowerCase();
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--force') args.force = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else fail(`Unknown argument: ${a}`);
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.level) {
  console.log('Usage: node scripts/merge-definitions.mjs --level a1|a2 [--dry-run] [--force]');
  process.exit(args.help ? 0 : 1);
}
if (!['a1', 'a2'].includes(args.level)) fail('--level must be a1 or a2');

const level = args.level;
const vocabFile = path.join(DATA_DIR, `vocab-${level}.json`);
const levelDir = path.join(WORK_DIR, level);
const outputDir = path.join(levelDir, 'output');
const rejectedDir = path.join(levelDir, 'rejected');
const reviewedFile = path.join(levelDir, 'reviewed.txt');

if (!fs.existsSync(vocabFile)) fail(`Not found: ${vocabFile}`);
if (!fs.existsSync(reviewedFile))
  fail(`Not found: ${reviewedFile} (no batch has been reviewed yet)`);

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

// ---------- reviewed batches ----------

const reviewed = new Set(
  fs
    .readFileSync(reviewedFile, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
);

const allOutputNums = fs.existsSync(outputDir)
  ? fs
      .readdirSync(outputDir)
      .map((f) => /^batch-(\d+)\.json$/.exec(f))
      .filter(Boolean)
      .map((m) => m[1])
      .sort()
  : [];

const unreviewed = allOutputNums.filter((n) => !reviewed.has(n));
const reviewedMissingOutput = [...reviewed].filter((n) => !allOutputNums.includes(n));
if (reviewedMissingOutput.length) {
  fail(`reviewed.txt lists batches without an output file: ${reviewedMissingOutput.join(', ')}`);
}

// ---------- collect definitions ----------

/** id -> { definition, batch } */
const collected = new Map();
const problems = [];

for (const num of allOutputNums.filter((n) => reviewed.has(n))) {
  const name = `batch-${num}`;
  const rows = new Map();

  let main;
  try {
    main = readJson(path.join(outputDir, `${name}.json`));
    if (!Array.isArray(main)) throw new Error('not a JSON array');
  } catch (err) {
    fail(`${name}.json is not valid: ${err.message}`);
  }
  for (const r of main) if (r && typeof r.id === 'string') rows.set(r.id, r);

  // redo rounds in numeric order
  const redoNums = fs
    .readdirSync(outputDir)
    .map((f) => new RegExp(`^${name}\\.redo-(\\d+)\\.json$`).exec(f))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
  for (const k of redoNums) {
    try {
      const redoRows = readJson(path.join(outputDir, `${name}.redo-${k}.json`));
      if (!Array.isArray(redoRows)) throw new Error('not a JSON array');
      for (const r of redoRows) {
        if (r && typeof r.id === 'string') rows.set(r.id, r);
      }
    } catch (err) {
      fail(`${name}.redo-${k}.json is not valid: ${err.message}`);
    }
  }

  // ids still rejected by the validator are never merged
  const rejFile = path.join(rejectedDir, `${name}.json`);
  const stillRejected = new Set();
  if (fs.existsSync(rejFile)) {
    for (const r of readJson(rejFile)) if (r?.id) stillRejected.add(r.id);
  }

  for (const [id, row] of rows) {
    if (stillRejected.has(id)) {
      problems.push(`${id} (${name}): still in rejected/, not merged`);
      continue;
    }
    if (typeof row.definition !== 'string' || row.definition.trim() === '') {
      problems.push(`${id} (${name}): empty definition, not merged`);
      continue;
    }
    if (collected.has(id))
      problems.push(`${id}: appears in ${collected.get(id).batch} and ${name}; using ${name}`);
    collected.set(id, { definition: row.definition.trim(), batch: name });
  }
}

// ---------- merge ----------

const originalText = fs.readFileSync(vocabFile, 'utf8');
const vocab = JSON.parse(originalText);
if (!Array.isArray(vocab)) fail(`${vocabFile} is not a JSON array`);
const entryCount = vocab.length;

const canonical = JSON.stringify(vocab, null, 2) + '\n';
const reformats = canonical !== originalText;

const vocabIds = new Set(vocab.map((e) => e.id));
const unknownIds = [...collected.keys()].filter((id) => !vocabIds.has(id));

let merged = 0;
let overwritten = 0;
let skipped = 0;

function withDefinition(entry, definition) {
  // Place `definition` right before `level` (after example_german), as in the B1 files.
  const out = {};
  let placed = false;
  for (const [key, value] of Object.entries(entry)) {
    if (key === 'definition') continue;
    if (key === 'level' && !placed) {
      out.definition = definition;
      placed = true;
    }
    out[key] = value;
  }
  if (!placed) out.definition = definition;
  return out;
}

const result = vocab.map((entry) => {
  const hit = collected.get(entry.id);
  if (!hit) return entry;
  const has = typeof entry.definition === 'string' && entry.definition.trim() !== '';
  if (has && !args.force) {
    skipped++;
    return entry;
  }
  if (has) {
    overwritten++;
    // keep the existing key position when overwriting
    return Object.fromEntries(
      Object.entries(entry).map(([k, v]) => [k, k === 'definition' ? hit.definition : v])
    );
  }
  merged++;
  return withDefinition(entry, hit.definition);
});

const missing = result.filter(
  (e) => !(typeof e.definition === 'string' && e.definition.trim() !== '')
);

// ---------- report ----------

console.log(
  `\nMerge definitions: ${level.toUpperCase()}${args.dryRun ? '  (dry run, nothing written)' : ''}\n`
);
console.log(`Reviewed batches : ${[...reviewed].sort().join(' ')}  (${reviewed.size})`);
if (unreviewed.length) {
  console.log(`WARNING: unreviewed batches (not merged): ${unreviewed.join(' ')}`);
}
console.log(`Definitions read : ${collected.size}`);
console.log(`Merged           : ${merged}`);
if (args.force) console.log(`Overwritten      : ${overwritten}`);
console.log(
  `Skipped (had one): ${skipped}${skipped && !args.force ? '  (use --force to overwrite)' : ''}`
);
console.log(`Missing          : ${missing.length}  (entries still without a definition)`);
if (unknownIds.length)
  console.log(
    `Unknown ids      : ${unknownIds.length}  (${unknownIds.slice(0, 5).join(', ')}${unknownIds.length > 5 ? ', ...' : ''})`
  );
if (reformats) {
  console.log(
    '\nNOTE: the file is not in canonical 2-space JSON format, so writing it will reformat other lines too.'
  );
}
if (problems.length) {
  console.log('\nProblems:');
  for (const p of problems) console.log(`  - ${p}`);
}
if (missing.length && missing.length <= 30) {
  console.log('\nEntries without a definition:');
  for (const e of missing) console.log(`  ${e.id}  ${e.norsk}`);
} else if (missing.length) {
  console.log(`\nFirst 30 entries without a definition (of ${missing.length}):`);
  for (const e of missing.slice(0, 30)) console.log(`  ${e.id}  ${e.norsk}`);
}

if (unknownIds.length) fail('Some ids are not in the vocab file; fix the batches first.');

if (args.dryRun) {
  console.log('\nDry run finished. Run again without --dry-run to write the file.\n');
  process.exit(0);
}

// ---------- write ----------

const backup = `${vocabFile}.bak`;
fs.copyFileSync(vocabFile, backup);

// Write to a temp file in the same directory, then rename it over the target, so a crash
// can never leave a truncated vocab file. Any failure restores from the backup.
const tmp = `${vocabFile}.tmp`;
let check;
try {
  fs.writeFileSync(tmp, JSON.stringify(result, null, 2) + '\n');
  fs.renameSync(tmp, vocabFile);

  // verify
  check = readJson(vocabFile);
  if (!Array.isArray(check) || check.length !== entryCount) {
    throw new Error(`entry count ${check?.length} vs ${entryCount}`);
  }
} catch (err) {
  fs.rmSync(tmp, { force: true });
  fs.copyFileSync(backup, vocabFile);
  fail(`Write or verification failed (${err.message}). Restored from backup.`);
}
const withDef = check.filter(
  (e) => typeof e.definition === 'string' && e.definition.trim() !== ''
).length;
console.log(`\nBackup : ${path.relative(ROOT, backup)}`);
console.log(
  `Written: ${path.relative(ROOT, vocabFile)}  (${check.length} entries, ${withDef} with definition)\n`
);
