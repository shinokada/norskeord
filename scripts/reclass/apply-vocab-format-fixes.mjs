#!/usr/bin/env node
// Usage: node scripts/reclass/apply-vocab-format-fixes.mjs [--level a2|b1|b2] [--write]
//
// Applies decisions/vocab-format-fixes.json (id -> fields to set) to
// vocab-<level>.json. Fixes the check-vocab.ts errors for category,
// noun gender/plural markers, verb "å " prefixes and verb lemma "å ".
//
// Idempotent: an entry whose fields already equal the target values is
// reported as "already applied" and left alone, so re-running after a
// partial run (or after --write) is always safe. Dry run by default.
//
// Safety: refuses to write a file unless JSON.parse -> saveJSON of the
// untouched data reproduces the file byte-for-byte (so only the fixed
// fields can change).

import fs from 'node:fs';
import path from 'node:path';
import { levelDataPaths, loadJSON, saveJSON, DECISIONS_DIR } from './lib.mjs';

const args = process.argv.slice(2);
const write = args.includes('--write');
const only = args.includes('--level') ? args[args.indexOf('--level') + 1] : null;

const fixes = JSON.parse(
  fs.readFileSync(path.join(DECISIONS_DIR, 'vocab-format-fixes.json'), 'utf8')
);
const levels = only ? [only] : Object.keys(fixes);

let totalChanged = 0;
let totalConflicts = 0;

for (const level of levels) {
  const levelFixes = fixes[level];
  if (!levelFixes) {
    console.error(`No fixes defined for level "${level}"`);
    process.exit(1);
  }
  const { vocab: vocabPath } = levelDataPaths(level);
  const raw = fs.readFileSync(vocabPath, 'utf8');
  const data = JSON.parse(raw);

  // Round-trip guard (before touching anything).
  const roundTrip = JSON.stringify(data, null, 2) + '\n';
  if (roundTrip !== raw) {
    console.error(
      `ABORT ${level}: vocab-${level}.json does not round-trip byte-for-byte; ` +
        `refusing to rewrite it.`
    );
    process.exit(1);
  }

  const byId = new Map(data.map((e) => [e.id, e]));
  let changed = 0;
  let already = 0;
  const missing = [];

  console.log(`\n${write ? 'APPLYING' : 'DRY RUN'} — vocab-${level}.json`);
  for (const [id, to] of Object.entries(levelFixes)) {
    const entry = byId.get(id);
    if (!entry) {
      missing.push(id);
      continue;
    }
    const diffs = Object.entries(to).filter(([k, v]) => entry[k] !== v);
    if (diffs.length === 0) {
      already++;
      continue;
    }
    for (const [k, v] of diffs) {
      console.log(`  ${id}  ${k}: ${JSON.stringify(entry[k])} -> ${JSON.stringify(v)}`);
      entry[k] = v;
    }
    changed++;
  }

  if (missing.length) {
    console.log(`  MISSING (id not in file): ${missing.join(', ')}`);
    totalConflicts += missing.length;
  }
  console.log(
    `  ${level}: ${changed} to change, ${already} already applied, ${missing.length} missing`
  );

  if (write && changed > 0) {
    saveJSON(vocabPath, data);
    console.log(`  wrote vocab-${level}.json`);
  }
  totalChanged += changed;
}

console.log(
  `\n${write ? 'Applied' : 'Would apply'} ${totalChanged} entr${totalChanged === 1 ? 'y' : 'ies'}` +
    (totalConflicts ? `; ${totalConflicts} missing id(s) — investigate` : '.')
);
if (!write && totalChanged > 0) console.log('Re-run with --write to apply.');
