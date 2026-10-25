#!/usr/bin/env node
/**
 * Merge the unknown words of ONE language from a spellcheck report into
 * scripts/audit/spellcheck-skip.json.
 *
 * Use it only after the report's words were reviewed and the real errors were
 * fixed in the data, and the spell-check was re-run so the report no longer lists them.
 *
 * Usage (from the repo root):
 *   node scripts/spellcheck-skip-from-report.mjs <report.md> <language> [--exclude=a,b,c] [--dry]
 *
 * Example:
 *   node scripts/spellcheck-skip-from-report.mjs scripts/audit/spellcheck-2026-10-25T04-00-00.md german --exclude=kappetes
 *
 * Words in --exclude stay out of the skip list, so they keep showing up in the next report.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const [reportPath, language] = args.filter((a) => !a.startsWith('--'));
const dry = flags.includes('--dry');
const excludeFlag = flags.find((f) => f.startsWith('--exclude='));
const exclude = new Set(
  excludeFlag ? excludeFlag.slice('--exclude='.length).split(',').filter(Boolean) : []
);

if (!reportPath || !language) {
  console.error(
    'Usage: node scripts/spellcheck-skip-from-report.mjs <report.md> <language> [--exclude=a,b] [--dry]'
  );
  process.exit(1);
}

const skipPath = path.join('scripts', 'audit', 'spellcheck-skip.json');
const heading = '## ' + language[0].toUpperCase() + language.slice(1);

const report = fs.readFileSync(reportPath, 'utf8');
const start = report.indexOf(heading);
if (start === -1) {
  console.error(`Section "${heading}" not found in ${reportPath}`);
  process.exit(1);
}
const next = report.indexOf('\n## ', start + heading.length);
const section = report.slice(start, next === -1 ? undefined : next);

const found = [...section.matchAll(/^- `([^`]+)` \(\d+x\)/gm)].map((m) => m[1]);
const skip = JSON.parse(fs.readFileSync(skipPath, 'utf8'));
const current = new Set(skip[language] ?? []);

const added = [];
for (const word of found) {
  if (exclude.has(word) || current.has(word)) continue;
  current.add(word);
  added.push(word);
}

const sorted = [...current].sort(
  (a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }) || a.localeCompare(b)
);
skip[language] = sorted;

console.log(
  `${language}: ${found.length} words in report, ${exclude.size} excluded, ${added.length} added, ${sorted.length} in skip list now`
);

if (dry) {
  console.log('Dry run, nothing written.');
} else {
  const body = Object.entries(skip)
    .map(
      ([lang, words]) =>
        `  ${JSON.stringify(lang)}: [${words.map((w) => JSON.stringify(w)).join(', ')}]`
    )
    .join(',\n');
  fs.writeFileSync(skipPath, `{\n${body}\n}\n`);
  console.log(`Wrote ${skipPath}`);
}
