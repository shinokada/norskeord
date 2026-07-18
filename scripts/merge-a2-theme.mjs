#!/usr/bin/env node
/**
 * merge-a2-theme.mjs
 *
 * Rebuilds src/lib/data/uttrykk-a2.json from the pre-merge backup
 * (uttrykk-a2.json.bak) plus the reviewed triage artifact
 * (ai-docs/implementation/uttrykk-theme-triage-a2.json), matching entries
 * by `id` and adding a `theme` field to each.
 *
 * The previous merge attempt left uttrykk-a2.json truncated/invalid
 * (cut off mid-array after u-a2-158). This script rebuilds it in one pass
 * from the clean backup instead of patching the broken file.
 *
 * Usage: node scripts/merge-a2-theme.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');
const IMPL_DIR = join(__dirname, '../ai-docs/implementation');

const bakPath = join(DATA_DIR, 'uttrykk-a2.json.bak');
const triagePath = join(IMPL_DIR, 'uttrykk-theme-triage-a2.json');
const outPath = join(DATA_DIR, 'uttrykk-a2.json');

for (const p of [bakPath, triagePath]) {
  if (!existsSync(p)) {
    console.error(`❌ Missing required file: ${p}`);
    process.exit(1);
  }
}

const entries = JSON.parse(readFileSync(bakPath, 'utf8'));
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
  console.error(`⚠️  ${missing.length} entries in the backup have no matching triage theme:`);
  console.error('  ' + missing.join(', '));
  console.error('\nAborting write — fix triage coverage first, nothing was written.');
  process.exit(1);
}

writeFileSync(outPath, JSON.stringify(entries, null, 2) + '\n', 'utf8');

console.log(`✅ Wrote ${entries.length} entries with theme → ${outPath}`);
if (unusedTriage.length > 0) {
  console.log(
    `ℹ️  ${unusedTriage.length} triage id(s) had no matching backup entry (likely fine — triage may cover ids not present in this backup):`
  );
  console.log('  ' + unusedTriage.join(', '));
}
