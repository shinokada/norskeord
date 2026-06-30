#!/usr/bin/env node
/**
 * remove-unused-keys.mjs
 *
 * Removes confirmed-unused keys from EVERY messages/*.json locale file at
 * once. Reads the "unused" bucket from the most recent (or an explicitly
 * given) check-unused-keys.mjs report — it never re-derives "unused" itself,
 * so the two scripts can't drift out of sync.
 *
 * ── Locale auto-discovery ─────────────────────────────────────────────
 * Locales are discovered by reading every messages/*.json file at run time
 * (the same readdirSync pattern check-message-keys.mjs already uses), so
 * adding a 6th language later needs zero changes here — the old hardcoded
 * `const LOCALES = ['en','nb','es','uk','de']` version would have silently
 * skipped any newly added locale file.
 *
 * ── Safety model ────────────────────────────────────────────────────────
 *   1. DRY RUN BY DEFAULT. Running with no flags only prints what would be
 *      removed from each locale file — nothing is written.
 *   2. --apply actually writes the changes. Without it, nothing on disk
 *      ever changes.
 *   3. Only operates on the "unused" bucket from the report — never the
 *      "dynamic" bucket (those keys ARE used, just not statically) and
 *      never the "used" bucket. If you want to verify this report is the
 *      one you reviewed, check the `generated` timestamp it prints.
 *   4. Keys are removed from ALL discovered locale files, not just en.json
 *      — a key unused in code is unused in code regardless of language, so
 *      leaving stale translations behind in nb.json/es.json/etc. would
 *      just recreate the kind of drift check-message-keys.mjs flags.
 *
 * Usage (run from project root):
 *   node scripts/remove-unused-keys.mjs                  # dry run, latest report
 *   node scripts/remove-unused-keys.mjs --apply           # actually remove
 *   node scripts/remove-unused-keys.mjs --report path.json --apply
 *   node scripts/remove-unused-keys.mjs --apply --yes     # skip confirmation prompt
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MESSAGES_DIR = resolve(ROOT, 'messages');
const OUTPUT_DIR = resolve(__dirname, 'outputs');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const skipConfirm = args.includes('--yes');
const reportFlagIndex = args.indexOf('--report');
const explicitReportPath = reportFlagIndex !== -1 ? args[reportFlagIndex + 1] : null;

// ── 1. Locate the report ─────────────────────────────────────────────────

function findLatestReport() {
  if (!existsSync(OUTPUT_DIR)) return null;
  const reports = readdirSync(OUTPUT_DIR)
    .filter((f) => /^unused-keys-.*\.json$/.test(f))
    .sort(); // ISO-ish timestamp in filename sorts chronologically
  if (reports.length === 0) return null;
  return resolve(OUTPUT_DIR, reports[reports.length - 1]);
}

const reportPath = explicitReportPath ? resolve(ROOT, explicitReportPath) : findLatestReport();

if (!reportPath || !existsSync(reportPath)) {
  console.error('❌  No unused-keys report found.');
  console.error('    Run `node scripts/check-unused-keys.mjs` first, or pass --report <path>.');
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const unusedKeys = (report.unused || []).slice().sort();

console.log(`Report: ${reportPath.replace(ROOT + '/', '')}`);
console.log(`Generated: ${report.generated || 'unknown'}`);
console.log(`Unused keys in report: ${unusedKeys.length}`);
if (report.dynamicCount != null) {
  console.log(
    `(${report.dynamicCount} dynamically-used key(s) and ${report.usedCount} statically-used key(s) are NOT touched)`
  );
}
console.log();

if (unusedKeys.length === 0) {
  console.log('Nothing to remove ✅');
  process.exit(0);
}

// ── 2. Discover locale files ─────────────────────────────────────────────

const localeFiles = readdirSync(MESSAGES_DIR)
  .filter((f) => f.endsWith('.json'))
  .sort();

if (localeFiles.length === 0) {
  console.error(`❌  No locale files found in ${MESSAGES_DIR}`);
  process.exit(1);
}

console.log(`Locales discovered: ${localeFiles.map((f) => f.replace('.json', '')).join(', ')}\n`);

// ── 3. Compute per-locale diffs (without writing yet) ────────────────────

const plan = [];
for (const file of localeFiles) {
  const filePath = resolve(MESSAGES_DIR, file);
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const presentUnused = unusedKeys.filter((k) => Object.prototype.hasOwnProperty.call(data, k));
  plan.push({ file, filePath, data, presentUnused });
}

console.log('── Planned removals ───────────────────────────────────────────');
for (const { file, presentUnused } of plan) {
  console.log(`  messages/${file}: ${presentUnused.length} key(s) to remove`);
}
console.log();

const totalRemovals = plan.reduce((sum, p) => sum + p.presentUnused.length, 0);
if (totalRemovals === 0) {
  console.log('No matching keys found in any locale file — nothing to do.');
  process.exit(0);
}

// Show the actual key list once (same list across locales, since it's
// driven by en.json structure — but a given key might be missing from a
// locale already, hence "presentUnused" per-file above).
console.log('── Keys ────────────────────────────────────────────────────────');
for (const key of unusedKeys) {
  console.log(`   ${key}`);
}
console.log();

if (!apply) {
  console.log('Dry run only — no files were changed.');
  console.log('Re-run with --apply to actually remove these keys from all locale files.');
  process.exit(0);
}

// ── 4. Confirm before writing ────────────────────────────────────────────

async function confirm(question) {
  if (skipConfirm) return true;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((res) => rl.question(question, res));
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

const ok = await confirm(
  `About to remove ${totalRemovals} key occurrence(s) across ${localeFiles.length} locale file(s). Continue? [y/N] `
);

if (!ok) {
  console.log('Aborted — no files changed.');
  process.exit(0);
}

// ── 5. Apply removals ─────────────────────────────────────────────────────

for (const { file, filePath, data, presentUnused } of plan) {
  if (presentUnused.length === 0) continue;
  for (const key of presentUnused) {
    delete data[key];
  }
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`✅  messages/${file}: removed ${presentUnused.length} key(s)`);
}

console.log(`\nDone. Removed ${totalRemovals} key occurrence(s) total.`);
console.log(
  'Tip: run `node scripts/check-message-keys.mjs` next to confirm all locales still match in structure.'
);
