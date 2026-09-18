#!/usr/bin/env node
// Usage: node scripts/reclass/apply-deletions.mjs --level a2 [--write]
//
// Idempotent: only acts on decisions whose source entry is still
// present. Re-running after a partial/interrupted run is always safe —
// it just does nothing to entries already gone.

import { levelDataPaths, loadJSON, saveJSON, loadDecisions, findEntry } from './lib.mjs';

const args = process.argv.slice(2);
const level = args.includes('--level') ? args[args.indexOf('--level') + 1] : null;
const write = args.includes('--write');
if (!level) {
  console.error('Usage: node apply-deletions.mjs --level <a1|a2|b1|b2|c> [--write]');
  process.exit(1);
}

const { uttrykk: uttrykkPath } = levelDataPaths(level);
const uttrykkList = loadJSON(uttrykkPath);
const decisions = loadDecisions(level).filter((d) => d.type === 'delete' || d.type === 'move');

const toRemove = [];
for (const d of decisions) {
  const entry = findEntry(uttrykkList, d.source || {});
  if (entry) toRemove.push({ decision: d, entry });
}

if (toRemove.length === 0) {
  console.log(`Nothing to delete for ${level} — all logged deletions already applied or absent.`);
  process.exit(0);
}

console.log(
  `${write ? 'APPLYING' : 'DRY RUN'} — ${toRemove.length} deletion(s) from uttrykk-${level}.json:\n`
);
for (const { decision, entry } of toRemove) {
  console.log(
    `  - remove ${entry.id}  "${entry.norsk}"  (${decision.bucket ?? decision.type}: ${decision.reason ?? ''})`
  );
}

if (!write) {
  console.log('\nRe-run with --write to apply.');
  process.exit(0);
}

const removeIds = new Set(toRemove.map((r) => r.entry.id));
const before = uttrykkList.length;
const after = uttrykkList.filter((e) => !removeIds.has(e.id));
saveJSON(uttrykkPath, after);

console.log(`\nWrote uttrykk-${level}.json: ${before} -> ${after.length} entries.`);

// Immediate read-back verification — don't trust the write call's
// return value, re-read from disk.
const verify = loadJSON(uttrykkPath);
const stillPresent = [...removeIds].filter((id) => verify.some((e) => e.id === id));
if (verify.length !== after.length || stillPresent.length > 0) {
  console.error(
    'VERIFICATION FAILED — disk state does not match intended write. Investigate before continuing.'
  );
  process.exit(1);
}
console.log(
  `Verified via fresh read-back: ${verify.length} entries, all ${removeIds.size} targets confirmed absent.`
);
