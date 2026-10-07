#!/usr/bin/env tsx
/**
 * check-ids.ts
 *
 * Cross-file id check for the shared `w-{NNNNNN}` counter.
 *
 * `check-vocab.ts` and `check-uttrykk.ts` each keep their own id map, so neither
 * can see a vocab id that is reused by an uttrykk entry (or the other way round).
 * Progress is keyed by `vocabKey(entry)` = `entry.id`, so such a clash would merge
 * two unrelated cards' progress. This script loads all production vocab AND
 * uttrykk files together and reports:
 *   - an entry with a missing id or an id that is not `w-{NNNNNN}`
 *   - the same id used twice, within one file or across files (vocab <-> uttrykk)
 *
 * Not checked: `norske_metaforiske_uttrykk_B1_B2.json` (no ids) and `*-preview`
 * files (dead `up-` format, see check-uttrykk.ts).
 *
 * Usage:
 *   npx tsx scripts/check-ids.ts            # report; always exit 0
 *   npx tsx scripts/check-ids.ts --strict   # exit 1 if any problem is found
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');
const STRICT = process.argv.includes('--strict');

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c'];
const FILES = LEVELS.flatMap((level) => [`vocab-${level}.json`, `uttrykk-${level}.json`]);
const ID_PATTERN = /^w-\d{6,}$/;

interface Row {
  id?: string;
  norsk?: string;
}

const seen = new Map<string, string>(); // id -> "file[index]"
let checked = 0;
let problems = 0;

for (const filename of FILES) {
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(filepath)) {
    console.log(`⏭️   ${filename} not found — skipping`);
    continue;
  }

  let entries: Row[];
  try {
    entries = JSON.parse(readFileSync(filepath, 'utf8'));
  } catch (err) {
    console.log(`❌  Could not parse ${filename}: ${(err as Error).message}`);
    problems++;
    continue;
  }

  entries.forEach((entry, i) => {
    checked++;
    const where = `${filename}[${i}]`;
    if (!entry.id) {
      console.log(`❌  ${where}: missing id (norsk="${entry.norsk ?? ''}")`);
      problems++;
      return;
    }
    if (!ID_PATTERN.test(entry.id)) {
      console.log(`❌  ${where}: id "${entry.id}" does not match w-{NNNNNN}`);
      problems++;
    }
    const first = seen.get(entry.id);
    if (first) {
      console.log(`❌  ${where}: duplicate id ${entry.id} — first seen at ${first}`);
      problems++;
    } else {
      seen.set(entry.id, where);
    }
  });
}

console.log(
  problems === 0
    ? `✅  ${checked} entries across vocab + uttrykk: all ids present, well-formed and unique`
    : `📊  ${checked} entries checked, ${problems} problem(s)`
);

if (STRICT && problems > 0) process.exit(1);
