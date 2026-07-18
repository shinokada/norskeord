#!/usr/bin/env node
/**
 * merge-uttrykk-theme.mjs
 *
 * Merges reviewed `theme` values from a triage artifact
 * (ai-docs/implementation/uttrykk-theme-triage-{level}.json) into
 * src/lib/data/uttrykk-{level}.json, matching entries by `id`.
 *
 * Reads directly from the current uttrykk-{level}.json (not a .bak) — safe
 * to run repeatedly since it only ever adds/overwrites the `theme` field.
 * Aborts and writes nothing if any entry in the data file has no matching
 * triage row, so it can never produce a partially-themed file.
 *
 * Usage: node scripts/merge-uttrykk-theme.mjs <level>
 *   e.g. node scripts/merge-uttrykk-theme.mjs b1
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');
const IMPL_DIR = join(__dirname, '../ai-docs/implementation');

const level = (process.argv[2] || '').toLowerCase();
if (!['a1', 'a2', 'b1', 'b2'].includes(level)) {
  console.error('Usage: node scripts/merge-uttrykk-theme.mjs <a1|a2|b1|b2>');
  process.exit(1);
}

const dataPath = join(DATA_DIR, `uttrykk-${level}.json`);
const triagePath = join(IMPL_DIR, `uttrykk-theme-triage-${level}.json`);

for (const p of [dataPath, triagePath]) {
  if (!existsSync(p)) {
    console.error(`❌ Missing required file: ${p}`);
    process.exit(1);
  }
}

const entries = JSON.parse(readFileSync(dataPath, 'utf8'));
const triage = JSON.parse(readFileSync(triagePath, 'utf8'));

const themeMap = new Map(triage.map((t) => [t.id, t.proposed_theme]));

const missing = [];
const usedTriageIds = new Set();

for (const entry of entries) {
  const theme = themeMap.get(entry.id);
  if (!theme) {
    missing.push(entry.id);
    continue;
  }
  entry.theme = theme;
  usedTriageIds.add(entry.id);
}

const unusedTriage = [...themeMap.keys()].filter((id) => !usedTriageIds.has(id));

if (missing.length > 0) {
  console.error(
    `⚠️  ${missing.length} entries in uttrykk-${level}.json have no matching triage theme:`
  );
  console.error('  ' + missing.join(', '));
  console.error('\nAborting write — fix triage coverage first, nothing was written.');
  process.exit(1);
}

writeFileSync(dataPath, JSON.stringify(entries, null, 2) + '\n', 'utf8');

console.log(`✅ Wrote ${entries.length} entries with theme → ${dataPath}`);
if (unusedTriage.length > 0) {
  console.log(
    `ℹ️  ${unusedTriage.length} triage id(s) had no matching data entry (likely fine \u2014 stale coverage of removed/renumbered ids):`
  );
  console.log('  ' + unusedTriage.join(', '));
}
