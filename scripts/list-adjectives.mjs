#!/usr/bin/env node
/**
 * list-adjectives.mjs
 *
 * Lists every entry with part === "adjective" across all vocab-{level}.json
 * files, and flags candidates for the "inflected form stored as lemma"
 * mistake found in v-a2-weather-009 ("klart" instead of "klar") and
 * v-a2-time-003 ("halvt" instead of "halv").
 * 
 * NOTE: use adjective-audit-ignore.json to suppress false positives. 
 * It has two keys:
 * 
 * words → only gates ENDS-T and ENDS-E. It's checked nowhere else in 
 * the script.
 * ids → suppresses all flags for that specific entry (ENDS-T, ENDS-E, 
 * MISMATCH, HAS-ARTICLE, EXAMPLE-DIFFERS — everything).
 * 
 * This is a manual-review aid, not an auto-fixer — Norwegian adjective
 * morphology has enough legitimate exceptions (e.g. "hvit", "stille",
 * "lett") that a purely mechanical rule would produce false positives.
 * Every flagged row still needs a human/dictionary check before editing.
 *
 * Flags:
 *   MISMATCH      norsk !== lemma (per project convention these should be
 *                 identical for adjectives — a difference usually means a
 *                 copy-paste slip between the two fields)
 *   ENDS-T        lemma ends in "t" and isn't in the known-legitimate
 *                 whitelist — could be a neuter form (base+t) miscoded as
 *                 the lemma, as with "klart"
 *   ENDS-E        lemma ends in "e" and isn't in the known-legitimate
 *                 whitelist — could be a plural/definite form (base+e)
 *                 miscoded as the lemma, as with a hypothetical "trange"
 *   EXAMPLE-DIFFERS  the example sentence doesn't contain any word starting
 *                 with the lemma (accounts for regular inflection: -t, -e,
 *                 -ere, -est/-este, and doubled-consonant reduction like
 *                 grønn→grønt) — genuinely worth a glance when it fires
 *   HAS-ARTICLE   norsk or lemma starts with the indefinite article "en ",
 *                 "et ", or "ei " (e.g. "en banebrytende") — adjective
 *                 fields should be bare, article-free forms
 *
 * Manually-reviewed exceptions live in scripts/adjective-audit-ignore.json
 * (not hardcoded here) so you can extend the ignore list without touching
 * this file. See that file's "_readme" key for the format.
 *
 * Usage:
 *   node scripts/list-adjectives.mjs              # all levels, table + flags
 *   node scripts/list-adjectives.mjs a2            # just vocab-a2.json
 *   node scripts/list-adjectives.mjs --flagged     # only rows with flags
 *   node scripts/list-adjectives.mjs --save        # also write report to
 *                                                   # scripts/outputs/list-adjectives.txt
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');
const OUTPUT_FILE = join(__dirname, 'outputs/list-adjectives.txt');

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c'];

// Real Norwegian adjectives whose bare dictionary (masculine/common gender)
// form happens to end in "t" or "e". Extend this list as you find more
// legitimate cases so the audit stays low-noise.
const LEGIT_T_ENDINGS = new Set([
  'hvit', 'lett', 'flott', 'søt', 'kort', 'fast', 'glatt', 'rett', 'trett',
  'sett', 'spent', 'vant', 'tett', 'brett', 'lat', 'flat', 'grønt', 'svart'
]);
const LEGIT_E_ENDINGS = new Set([
  'stille', 'gratis', 'lite',
  // Ordinals and a few indeclinable quantifiers/loanwords — never inflect
  'første', 'andre', 'tredje', 'mange', 'forrige',
  // Loanword colors that don't take gender/number endings
  'oransje', 'beige', 'lilla', 'rosa', 'turkis'
]);
// Present participles (verb stem + "-ende", e.g. "spennende", "ledende")
// are a large, productive, always-indeclinable class in Norwegian — their
// bare dictionary form legitimately ends in "-ende", so whitelist the
// whole suffix instead of listing every one individually.
const PRESENT_PARTICIPLE = /ende$/;

// Adjective fields should be the bare word — no leading indefinite
// article. Catches entries like "en banebrytende" or "en konfidensiell".
const ARTICLE_PREFIX = /^(en|et|ei)\s+/i;

// Unicode-aware "starts with" match: JS's \b only recognizes ASCII
// [A-Za-z0-9_] as word characters, so it breaks on å/æ/ø — a lemma like
// "blå" or "ærlig" would falsely fail to match even when it's literally
// present in the example. Use a \p{L}/\p{N} lookbehind instead so accented
// letters count as word characters too. Matches a *prefix* rather than the
// whole word, since adjectives almost always show up inflected in a real
// sentence (stor → stort/store/større/størst).
function buildExamplePrefixPattern(base) {
  const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}`, 'iu');
}

// ── Manually-reviewed ignore list ───────────────────────────────────────────

const IGNORE_FILE = join(__dirname, 'adjective-audit-ignore.json');
let IGNORE_WORDS = new Set();
let IGNORE_IDS = new Set();
try {
  const ignore = JSON.parse(readFileSync(IGNORE_FILE, 'utf8'));
  IGNORE_WORDS = new Set(Object.keys(ignore.words ?? {}));
  IGNORE_IDS = new Set(Object.keys(ignore.ids ?? {}));
} catch (err) {
  if (err.code !== 'ENOENT') {
    console.error(`⚠️  Could not read ${IGNORE_FILE}: ${err.message}`);
  }
  // Missing file is fine — just means nothing's been reviewed yet.
}

// ── CLI flags ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const ONLY_FLAGGED = process.argv.includes('--flagged');
const SAVE = process.argv.includes('--save');
const targetLevels = args.length > 0 ? args.map((a) => a.toLowerCase()) : LEVELS;

// ── Collect entries ────────────────────────────────────────────────────────────

const rows = [];

for (const level of LEVELS) {
  if (!targetLevels.includes(level)) continue;

  const filename = `vocab-${level}.json`;
  let entries;
  try {
    entries = JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf8'));
  } catch (err) {
    console.error(`❌  Could not read ${filename}: ${err.message}`);
    continue;
  }

  for (const entry of entries) {
    if (entry.part !== 'adjective') continue;

    const flags = [];
    const norsk = entry.norsk ?? '';
    const lemma = entry.lemma ?? '';
    const example = entry.example ?? '';

    if (norsk !== lemma) {
      flags.push('MISMATCH');
    }
    if (
      lemma.endsWith('t') &&
      !LEGIT_T_ENDINGS.has(lemma) &&
      !IGNORE_WORDS.has(lemma)
    ) {
      flags.push('ENDS-T');
    }
    if (
      lemma.endsWith('e') &&
      !LEGIT_E_ENDINGS.has(lemma) &&
      !PRESENT_PARTICIPLE.test(lemma) &&
      !IGNORE_WORDS.has(lemma)
    ) {
      flags.push('ENDS-E');
    }

    if (ARTICLE_PREFIX.test(norsk) || ARTICLE_PREFIX.test(lemma)) {
      flags.push('HAS-ARTICLE');
    }

    // "Starts with lemma" catches regular inflection (stor → stort/store)
    // without needing an ignore-list entry per word. Doubled-final-consonant
    // adjectives drop one consonant before "-t" (grønn → grønt, not
    // grønnt), so also try the lemma with the final letter dropped.
    if (lemma) {
      const candidates = [lemma];
      const lastTwo = lemma.slice(-2);
      if (lastTwo.length === 2 && lastTwo[0] === lastTwo[1]) {
        candidates.push(lemma.slice(0, -1));
      }
      const inflected = candidates.some((c) => buildExamplePrefixPattern(c).test(example));
      if (!inflected) {
        flags.push('EXAMPLE-DIFFERS');
      }
    }

    rows.push({
      level,
      id: entry.id ?? '(missing id)',
      category: entry.category ?? '',
      norsk,
      lemma,
      example,
      flags: IGNORE_IDS.has(entry.id) ? [] : flags
    });
  }
}

// ── Render ──────────────────────────────────────────────────────────────────

const lines = [];
const push = (s = '') => lines.push(s);

push(`Adjective audit — ${rows.length} entries across ${targetLevels.join(', ')}`);
push('='.repeat(70));

let flaggedCount = 0;
let lastLevel = null;

for (const row of rows) {
  if (ONLY_FLAGGED && row.flags.length === 0) continue;
  if (row.flags.length > 0) flaggedCount++;

  if (row.level !== lastLevel) {
    push();
    push(`── ${row.level.toUpperCase()} ${'─'.repeat(60 - row.level.length)}`);
    lastLevel = row.level;
  }

  const flagStr = row.flags.length ? `  [${row.flags.join(', ')}]` : '';
  push(`${row.id}  norsk="${row.norsk}"  lemma="${row.lemma}"${flagStr}`);
  if (row.flags.length > 0) {
    push(`   example: ${row.example}`);
  }
}

push();
push('='.repeat(70));
push(`Total adjectives: ${rows.length}   Flagged for review: ${flaggedCount}`);
push('Flags are heuristics — confirm each against a dictionary before editing.');

const output = lines.join('\n');
console.log(output);

if (SAVE) {
  writeFileSync(OUTPUT_FILE, output + '\n', 'utf8');
  console.log(`\n📝  Report saved to ${OUTPUT_FILE}`);
}
