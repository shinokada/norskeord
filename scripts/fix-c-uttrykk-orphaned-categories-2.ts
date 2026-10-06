#!/usr/bin/env tsx
/**
 * fix-c-uttrykk-orphaned-categories-2.ts
 *
 * Second pass of the C uttrykk orphan fix (the first pass,
 * scripts/fix-c-uttrykk-orphaned-categories.mjs, repaired 6 other slugs).
 *
 * `uttrykk-c.json` still has 82 entries whose `category` is not in
 * `CATEGORIES_BY_LEVEL.C` (found by scripts/check-uttrykk.ts, 2026-10-06):
 *   character-temperament (63), nature-landscape (13), physical-appearance (6).
 * C uttrykk is merged into the c/{category} pages by `e.category === category`, so
 * these entries are currently shown on no page. This script reassigns them to real
 * C slugs. Only the `category` field is touched.
 *
 * Mapping (proposal, review the dry run before writing):
 *   character-temperament -> behavioral-idioms
 *       (45 vocab + 63 = 108; personality-traits would reach 182, over the ~120 ceiling)
 *   nature-landscape      -> terrain-and-water
 *       (100 vocab + 13 = 113), except w-009479 (midt på svarte vinteren) ->
 *       weather-and-elements
 *   physical-appearance   -> physical-appearance-verbs-and-expressions (13 + 6 = 19)
 * A few entries fit their bucket loosely; they are listed under "worth a look" so you
 * can add an override in OVERRIDES before writing.
 * Overrides so far: w-009479 -> weather-and-elements, w-009408 (oppsatt kveld) ->
 * idiomatic-expressions (decided 2026-10-06).
 *
 * Usage (dry run is the DEFAULT here; nothing is written without --write):
 *   npx tsx scripts/fix-c-uttrykk-orphaned-categories-2.ts           # report only
 *   npx tsx scripts/fix-c-uttrykk-orphaned-categories-2.ts --write   # apply
 *
 * --write keeps the first pre-run snapshot as uttrykk-c.json.bak2 (never overwritten),
 * refuses to write if any entry would still have an invalid C category, and is safe to
 * re-run (a second run finds nothing to do).
 */

import { readFileSync, writeFileSync, copyFileSync, constants } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CATEGORIES_BY_LEVEL } from '../src/lib/config.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');
const UTTRYKK_FILE = join(DATA_DIR, 'uttrykk-c.json');
const VOCAB_FILE = join(DATA_DIR, 'vocab-c.json');
const WRITE = process.argv.includes('--write');

/** Soft per-category ceiling used by the earlier C category splits. */
const CEILING = 120;

const DEFAULT_TARGET: Record<string, string> = {
  'character-temperament': 'behavioral-idioms',
  'nature-landscape': 'terrain-and-water',
  'physical-appearance': 'physical-appearance-verbs-and-expressions'
};

/** Per-entry exceptions to DEFAULT_TARGET, by id. */
const OVERRIDES: Record<string, string> = {
  'w-009479': 'weather-and-elements', // midt på svarte vinteren
  'w-009408': 'idiomatic-expressions' // oppsatt kveld (an event, not behaviour)
};

/** Entries that fit their bucket loosely (reported only, not changed). */
const WORTH_A_LOOK = new Set([
  'w-009408', // oppsatt kveld (a scheduled evening event)
  'w-009928', // gå for å være noe (reputation)
  'w-009929', // ha rykte på seg (reputation)
  'w-009930', // gå under et navn (reputation)
  'w-009320', // skyte i været (to shoot up)
  'w-009906', // ligge fint til (to be well located)
  'w-010013' // gjøre seg til herre over naturen
]);

interface Entry {
  id: string;
  lemma: string;
  english: string;
  category: string;
}

const validC = new Set<string>(CATEGORIES_BY_LEVEL.C as readonly string[]);
const uttrykk: Entry[] = JSON.parse(readFileSync(UTTRYKK_FILE, 'utf8'));
const vocab: Entry[] = JSON.parse(readFileSync(VOCAB_FILE, 'utf8'));

const targetFor = (e: Entry): string => OVERRIDES[e.id] ?? DEFAULT_TARGET[e.category] ?? e.category;

// Every target must be a real C category, otherwise the fix would just move the problem.
const badTargets = new Set(
  [...Object.values(DEFAULT_TARGET), ...Object.values(OVERRIDES)].filter((t) => !validC.has(t))
);
if (badTargets.size > 0) {
  console.error(
    `\u274c Target slug(s) not in CATEGORIES_BY_LEVEL.C: ${[...badTargets].join(', ')}`
  );
  process.exit(1);
}

const orphans = uttrykk.filter((e) => e.category in DEFAULT_TARGET);
console.log(
  WRITE
    ? '\u270f\ufe0f  WRITE mode\n'
    : '\ud83d\udd0d DRY RUN \u2014 nothing will be written (use --write to apply)\n'
);
console.log(`Orphaned entries found: ${orphans.length} (expect 82 = 63 + 13 + 6)`);
for (const slug of Object.keys(DEFAULT_TARGET)) {
  console.log(`  ${slug.padEnd(24)} ${orphans.filter((e) => e.category === slug).length}`);
}

// Projected size of each target category (vocab-c + uttrykk-c entries on its page).
const size = new Map<string, number>();
for (const e of [...vocab, ...uttrykk]) size.set(e.category, (size.get(e.category) ?? 0) + 1);
const incoming = new Map<string, Entry[]>();
for (const e of orphans) {
  const t = targetFor(e);
  if (!incoming.has(t)) incoming.set(t, []);
  incoming.get(t)!.push(e);
}

console.log('\nProjected category sizes (vocab-c + uttrykk-c):');
for (const [target, list] of incoming) {
  const before = size.get(target) ?? 0;
  const after = before + list.length;
  const flag = after > CEILING ? `  \u26a0\ufe0f over the ~${CEILING} ceiling` : '';
  console.log(`  ${target.padEnd(44)} ${before} -> ${after}  (+${list.length})${flag}`);
}

const looks = orphans.filter((e) => WORTH_A_LOOK.has(e.id));
console.log(`\nWorth a look (fit their bucket loosely, ${looks.length}):`);
for (const e of looks) {
  console.log(`  ${e.id}  ${e.lemma.padEnd(36)} ${e.category} -> ${targetFor(e)}`);
}

for (const [target, list] of incoming) {
  console.log(`\n\u2500\u2500 ${target} (+${list.length}) \u2500\u2500`);
  for (const e of list.slice(0, 8)) {
    console.log(`  ${e.id}  ${e.lemma.slice(0, 36).padEnd(36)} ${e.english.slice(0, 50)}`);
  }
  if (list.length > 8) console.log(`  \u2026 (${list.length - 8} more)`);
}

if (!WRITE) {
  console.log('\n\u2705 Dry run complete \u2014 no files written.');
  process.exit(0);
}

if (orphans.length === 0) {
  console.log('\n\u2705 Nothing to do \u2014 no orphaned categories found.');
  process.exit(0);
}

try {
  copyFileSync(UTTRYKK_FILE, UTTRYKK_FILE + '.bak2', constants.COPYFILE_EXCL);
  console.log(`\nBackup written as ${UTTRYKK_FILE}.bak2`);
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
  console.log(
    `\n\u2139\ufe0f  Backup already exists at ${UTTRYKK_FILE}.bak2 \u2014 not overwriting.`
  );
}

const updated = uttrykk.map((e) =>
  e.category in DEFAULT_TARGET ? { ...e, category: targetFor(e) } : e
);
const stillInvalid = updated.filter((e) => !validC.has(e.category));
if (stillInvalid.length > 0) {
  console.error(
    `\u274c ${stillInvalid.length} entries would still have an invalid C category \u2014 aborting write.`
  );
  process.exit(1);
}

writeFileSync(UTTRYKK_FILE, JSON.stringify(updated, null, 2) + '\n', 'utf8');
console.log(`\u2705 Done \u2014 reassigned ${orphans.length} entries in uttrykk-c.json.`);
