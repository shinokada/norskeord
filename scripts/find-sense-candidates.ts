#!/usr/bin/env tsx
/**
 * find-sense-candidates.ts
 *
 * READ-ONLY report of vocab entries that may need splitting into separate
 * senses (see ai-docs/implementation/vocab-multiple-senses.md, Phase 1b).
 * It never edits data and is deliberately NOT part of check-vocab.ts: a noisy
 * heuristic inside a validator trains people to ignore the validator.
 *
 * The classification lives in src/lib/sense-candidates.ts (unit-tested); this
 * script only loads the data, applies the level/tier filters and writes the report.
 *
 * Tiers (ranked):
 *   1. Identical `norsk` without a distinct `sense` on every member (certain).
 *      Never hidden by a review decision — the rule applies regardless.
 *   2. `english` that looks multi-sense: `;`, `/` or `,` outside parentheses
 *      (probable, NOISY — "to work, to function" is not a split). A reading
 *      list, not a to-do list.
 *   3. Same lemma + same part, different `norsk` (low priority: card fronts
 *      already differ). Plural cards (`(pl.)`, `(b.pl.)`) are excluded.
 *
 * Review decisions: data-rules/sense-review.json — ids and decisions only (the
 * repo is public, the vocab is private content), e.g.
 *   { "w-001724": "split", "w-000300": "keep" }
 *   keep  = reviewed, deliberately one card: hidden from tiers 2 and 3.
 *   split = decided to split: listed under "Queued" until the entry has a `sense`.
 * Ids in the file that no longer exist in the data are reported as warnings.
 *
 * Usage (from project root):
 *   npx tsx scripts/find-sense-candidates.ts                 # all levels -> sense-candidates-all.txt
 *   npx tsx scripts/find-sense-candidates.ts --level a2      # groups touching A2 -> sense-candidates-a2.txt
 *   npx tsx scripts/find-sense-candidates.ts --tier 2        # one tier only
 *
 * Options for a throwaway fixture run (smoke test):
 *   --data-dir <dir>   directory holding vocab-{level}.json   (default src/lib/data)
 *   --review <file>    review decisions file                  (default data-rules/sense-review.json)
 *   --out-dir <dir>    where the report is written            (default scripts/outputs, gitignored)
 *
 * Output is written to scripts/outputs/ (gitignored) and regenerated on every run.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import {
  LEVELS,
  buildReport,
  levelIndex,
  type Review,
  type SenseEntry,
  type SenseReport
} from '../src/lib/sense-candidates.ts';

// ── I/O ───────────────────────────────────────────────────────────────────────

function loadEntries(dataDir: string): SenseEntry[] {
  const all: SenseEntry[] = [];
  for (const level of LEVELS) {
    const file = join(dataDir, `vocab-${level}.json`);
    if (!existsSync(file)) {
      console.warn(`  Warning: ${file} not found — skipped`);
      continue;
    }
    all.push(...(JSON.parse(readFileSync(file, 'utf8')) as SenseEntry[]));
  }
  return all;
}

function loadReview(file: string): Review {
  if (!existsSync(file)) return {};
  const raw = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  const review: Review = {};
  for (const [id, decision] of Object.entries(raw)) {
    if (decision === 'split' || decision === 'keep') review[id] = decision;
    else
      console.warn(`  Warning: ${id} has invalid decision ${JSON.stringify(decision)} — ignored`);
  }
  return review;
}

// ── Formatting ────────────────────────────────────────────────────────────────

const fmt = (e: SenseEntry): string =>
  `${e.id ?? '(no id)'}  ${e.level}/${e.category}  ${e.norsk} — ${e.english ?? ''}${e.sense ? ` [${e.sense}]` : ''}`;

const touchesLevel = (group: SenseEntry[], level: string): boolean =>
  group.some((e) => e.level.toLowerCase() === level);

/** A group is listed under the lowest level among its members. */
const primaryLevel = (group: SenseEntry[]): string =>
  LEVELS[Math.max(0, Math.min(...group.map(levelIndex)))];

function section(title: string, note: string, body: string[]): string[] {
  return ['', '═'.repeat(70), title, note, '═'.repeat(70), ...(body.length ? body : ['  (none)'])];
}

function groupLines(groups: SenseEntry[][]): string[] {
  return groups.flatMap((g, i) => [
    `  ${i + 1}. ${g.length} entries`,
    ...g.map((e) => `       ${fmt(e)}`)
  ]);
}

/** Break groups into per-level sub-sections. */
function byLevelSections(groups: SenseEntry[][]): string[] {
  const out: string[] = [];
  for (const level of LEVELS) {
    const inLevel = groups.filter((g) => primaryLevel(g) === level);
    if (inLevel.length === 0) continue;
    out.push(`  — ${level.toUpperCase()} (${inLevel.length})`, ...groupLines(inLevel));
  }
  return out;
}

function formatReport(
  report: SenseReport,
  levelFilter: string | null,
  tier: number | null
): string {
  const keepLevel = (e: SenseEntry) => !levelFilter || e.level.toLowerCase() === levelFilter;
  const keepGroup = (g: SenseEntry[]) => !levelFilter || touchesLevel(g, levelFilter);
  const want = (n: number) => tier === null || tier === n;

  const tier1 = report.tier1.filter(keepGroup);
  const tier2 = report.tier2.filter((h) => keepLevel(h.entry));
  const tier3 = report.tier3.filter(keepGroup);
  const queued = report.queued.filter(keepLevel);

  const lines: string[] = [
    `Sense candidates — ${levelFilter ? levelFilter.toUpperCase() : 'all levels'} — ${new Date().toISOString()}`,
    `Tier 1: ${tier1.length} group(s) | Tier 2: ${tier2.length} entr${tier2.length === 1 ? 'y' : 'ies'} | Tier 3: ${tier3.length} group(s) | Queued: ${queued.length}`
  ];

  if (report.unknownReviewIds.length > 0) {
    lines.push(
      '',
      `WARNING: ${report.unknownReviewIds.length} id(s) in sense-review.json not found in the data:`,
      ...report.unknownReviewIds.map((id) => `  ${id}`)
    );
  }

  if (want(1)) {
    lines.push(
      ...section(
        'TIER 1 — identical norsk without a distinct sense (certain)',
        'Each member needs a distinct `sense` (or one is a real duplicate). Not hideable.',
        byLevelSections(tier1)
      )
    );
  }
  if (want(2)) {
    lines.push(
      ...section(
        'TIER 2 — english looks multi-sense (probable, noisy)',
        'Reading list. Mark each id in data-rules/sense-review.json as "split" or "keep".',
        tier2.map((h) => `  [${h.count} × "${h.sep}"]  ${fmt(h.entry)}`)
      )
    );
  }
  if (want(3)) {
    lines.push(
      ...section(
        'TIER 3 — same lemma + part, different norsk (low priority)',
        'Card fronts already differ; usually no sense needed.',
        byLevelSections(tier3)
      )
    );
  }
  lines.push(
    ...section(
      'QUEUED — decided "split", no sense yet',
      'Drops out of this list once the entry has a `sense`.',
      queued.map((e) => `  ${fmt(e)}`)
    )
  );
  return lines.join('\n') + '\n';
}

// ── CLI ───────────────────────────────────────────────────────────────────────

function optionValue(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);

const levelArg = optionValue(argv, '--level')?.toLowerCase() ?? null;
if (levelArg && !(LEVELS as readonly string[]).includes(levelArg)) {
  console.error(`Unknown level "${levelArg}" (expected one of ${LEVELS.join(', ')})`);
  process.exit(1);
}
const tierArg = optionValue(argv, '--tier');
const tier = tierArg ? Number(tierArg) : null;
if (tier !== null && ![1, 2, 3].includes(tier)) {
  console.error('--tier must be 1, 2 or 3');
  process.exit(1);
}

const dataDir = resolve(optionValue(argv, '--data-dir') ?? join(__dirname, '../src/lib/data'));
const reviewFile = resolve(
  optionValue(argv, '--review') ?? join(__dirname, '../data-rules/sense-review.json')
);
const outDir = resolve(optionValue(argv, '--out-dir') ?? join(__dirname, 'outputs'));

const report = buildReport(loadEntries(dataDir), loadReview(reviewFile));
const text = formatReport(report, levelArg, tier);

mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `sense-candidates-${levelArg ?? 'all'}.txt`);
writeFileSync(outFile, text);

console.log(text.split('\n').slice(0, 2).join('\n'));
if (report.unknownReviewIds.length > 0) {
  console.log(`WARNING: ${report.unknownReviewIds.length} unknown id(s) in the review file`);
}
console.log(`\nWritten to: ${outFile}`);
