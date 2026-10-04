#!/usr/bin/env node
/**
 * prepare-definition-batches.mjs
 *
 * Splits the vocab entries that still need a `definition` into small input
 * batches for Claude Desktop (see ai-docs/implementation/add-definition-a1-a2.md).
 *
 * Usage:
 *   node scripts/prepare-definition-batches.mjs --level a1 [--size 50] [--dry-run] [--force]
 *
 * Reads:   src/lib/data/vocab-{level}.json
 * Writes:  draft/definitions/{level}/input/batch-NNN.json
 *
 * Idempotent: ids that already appear in an existing input batch or in an
 * existing output batch (e.g. the chat pilot) are skipped, and new batches are
 * numbered after the highest existing batch number. Re-running never touches
 * work in progress.
 *
 *   --force  delete input batches that have no matching output yet and
 *            regenerate them (batches with an output file are never deleted).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'src', 'lib', 'data');
const WORK_DIR = path.join(ROOT, 'draft', 'definitions');
const FIELDS = ['id', 'norsk', 'english', 'example', 'part', 'category'];
const LEVELS = ['a1', 'a2'];

// ---------- args ----------

function parseArgs(argv) {
	const args = { level: null, size: 50, dryRun: false, force: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--level') args.level = (argv[++i] ?? '').toLowerCase();
		else if (a === '--size') args.size = Number(argv[++i]);
		else if (a === '--dry-run') args.dryRun = true;
		else if (a === '--force') args.force = true;
		else if (a === '--help' || a === '-h') args.help = true;
		else fail(`Unknown argument: ${a}`);
	}
	return args;
}

function fail(msg) {
	console.error(`Error: ${msg}`);
	process.exit(1);
}

function usage() {
	console.log(
		'Usage: node scripts/prepare-definition-batches.mjs --level a1|a2 [--size 50] [--dry-run] [--force]'
	);
}

// ---------- helpers ----------

const batchName = (n) => `batch-${String(n).padStart(3, '0')}.json`;
const batchNumber = (file) => {
	const m = /^batch-(\d+)\.json$/.exec(file);
	return m ? Number(m[1]) : null;
};

function listBatches(dir) {
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((f) => batchNumber(f) !== null)
		.sort();
}

function readJson(file) {
	return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function hasDefinition(entry) {
	return typeof entry.definition === 'string' && entry.definition.trim() !== '';
}

// ---------- main ----------

const args = parseArgs(process.argv.slice(2));
if (args.help) {
	usage();
	process.exit(0);
}
if (!LEVELS.includes(args.level)) {
	usage();
	fail(`--level must be one of: ${LEVELS.join(', ')}`);
}
if (!Number.isInteger(args.size) || args.size < 1) fail('--size must be a positive integer');

const { level } = args;
const sourceFile = path.join(DATA_DIR, `vocab-${level}.json`);
if (!fs.existsSync(sourceFile)) fail(`Not found: ${sourceFile}`);

const entries = readJson(sourceFile);
if (!Array.isArray(entries)) fail(`${sourceFile} is not a JSON array`);

const levelDir = path.join(WORK_DIR, level);
const inputDir = path.join(levelDir, 'input');
const outputDir = path.join(levelDir, 'output');
const rejectedDir = path.join(levelDir, 'rejected');

// Output batches: ids that already have a definition from earlier work.
const outputFiles = listBatches(outputDir);
const outputNumbers = new Set(outputFiles.map(batchNumber));
const doneIds = new Set();
for (const f of outputFiles) {
	try {
		const rows = readJson(path.join(outputDir, f));
		if (!Array.isArray(rows)) throw new Error('not a JSON array');
		for (const r of rows) if (r && r.id) doneIds.add(r.id);
	} catch (err) {
		fail(`Could not read output/${f} (${err.message}); fix it before preparing new batches.`);
	}
}

// Input batches: with --force, drop those without output so they are rebuilt.
let inputFiles = listBatches(inputDir);
const removable = args.force ? inputFiles.filter((f) => !outputNumbers.has(batchNumber(f))) : [];
if (removable.length && !args.dryRun) {
	for (const f of removable) fs.unlinkSync(path.join(inputDir, f));
}
if (removable.length) {
	console.log(
		`${args.dryRun ? '[dry-run] would remove' : 'Removed'} ${removable.length} input batch(es) without output: ${removable.join(', ')}`
	);
}
inputFiles = inputFiles.filter((f) => !removable.includes(f));

const queuedIds = new Set();
for (const f of inputFiles) {
	try {
		const rows = readJson(path.join(inputDir, f));
		if (!Array.isArray(rows)) throw new Error('not a JSON array');
		for (const r of rows) if (r && r.id) queuedIds.add(r.id);
	} catch (err) {
		fail(`Could not read input/${f} (${err.message}); fix it before preparing new batches.`);
	}
}

// Select what still needs work.
const missingDef = entries.filter((e) => !hasDefinition(e));
const pending = missingDef.filter((e) => !doneIds.has(e.id) && !queuedIds.has(e.id));

// Entries with no id cannot be matched later, so stop early.
const noId = entries.filter((e) => !e.id);
if (noId.length) fail(`${noId.length} entries in vocab-${level}.json have no id`);

const existingNumbers = [
	...inputFiles.map(batchNumber),
	...outputFiles.map(batchNumber)
].filter((n) => n !== null);
const firstNew = (existingNumbers.length ? Math.max(...existingNumbers) : 0) + 1;

const batches = [];
for (let i = 0; i < pending.length; i += args.size) {
	batches.push(pending.slice(i, i + args.size));
}

// ---------- report ----------

console.log(`\nLevel ${level.toUpperCase()}`);
console.log(`  entries in file:            ${entries.length}`);
console.log(`  already have definition:    ${entries.length - missingDef.length}`);
console.log(`  covered by output batches:  ${missingDef.filter((e) => doneIds.has(e.id)).length}`);
console.log(`  already in input batches:   ${missingDef.filter((e) => queuedIds.has(e.id)).length}`);
console.log(`  to prepare now:             ${pending.length}`);
console.log(`  new batches (size ${args.size}):     ${batches.length}\n`);

if (!batches.length) {
	console.log('Nothing to prepare.');
	process.exit(0);
}

const rows = batches.map((batch, i) => {
	const n = firstNew + i;
	return {
		batch: batchName(n),
		entries: batch.length,
		first: batch[0].id,
		last: batch[batch.length - 1].id
	};
});
console.table(rows);

if (args.dryRun) {
	console.log('\n[dry-run] nothing written.');
	process.exit(0);
}

// ---------- write ----------

for (const dir of [inputDir, outputDir, rejectedDir]) fs.mkdirSync(dir, { recursive: true });

batches.forEach((batch, i) => {
	const file = path.join(inputDir, batchName(firstNew + i));
	const slim = batch.map((e) => Object.fromEntries(FIELDS.map((k) => [k, e[k] ?? ''])));
	fs.writeFileSync(file, JSON.stringify(slim, null, 2) + '\n');
});

console.log(`\nWrote ${batches.length} batch file(s) to ${path.relative(ROOT, inputDir)}/`);
console.log(`\nNext: in Claude Desktop, use this prompt for the first new batch:\n`);
console.log(
	`Read draft/definitions/instructions.md, then read draft/definitions/${level}/input/${batchName(firstNew)}.\n` +
		`Write definitions for every entry and save the result as draft/definitions/${level}/output/${batchName(firstNew)}.\n` +
		`Do not modify any other file. When finished, say only "done" and the entry count.`
);
