#!/usr/bin/env tsx
/**
 * check-spelling.ts
 *
 * Spell-checks the Norwegian text fields (norsk, lemma, example, definition, note)
 * in vocab-{level}.json and uttrykk-{level}.json against a Norwegian Bokmål
 * (nb) Hunspell dictionary. Catches typos like "folge" (→ følge), "kjorer"
 * (→ kjører), missing æ/ø/å, etc.
 *
 * This is a heuristic tool, not a strict validator: modern loanwords and
 * compounds (e.g. "smarttelefon", "podcast") are legitimately absent from
 * the dictionary and will be flagged as false positives. Add words you've
 * confirmed are correct to scripts/spelling-allowlist.txt (one per line,
 * case-insensitive, '#' for comments) to silence them on future runs.
 *
 * Usage:
 *   npx tsx scripts/check-spelling.ts                  # check everything
 *   npx tsx scripts/check-spelling.ts a1 a2             # only these levels
 *   npx tsx scripts/check-spelling.ts --vocab           # vocab files only
 *   npx tsx scripts/check-spelling.ts --uttrykk         # uttrykk files only
 *   npx tsx scripts/check-spelling.ts --strict          # exit 1 if anything flagged
 *   npx tsx scripts/check-spelling.ts c --uttrykk        # combine filters
 *
 * At the end, prints a deduplicated list of flagged words with occurrence
 * counts — the fastest way to review and bulk-add to the allowlist.
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// @ts-expect-error — no bundled types for dictionary-nb / nspell
import dictionary from 'dictionary-nb';
// @ts-expect-error — no bundled types for nspell
import nspell from 'nspell';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');
const ALLOWLIST_PATH = join(__dirname, 'spelling-allowlist.txt');

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c'];

// Norwegian-only text fields worth spell-checking (skips english/spanish/etc.)
const NORSK_FIELDS = ['norsk', 'lemma', 'example', 'definition', 'note'];

// Markers that legitimately appear in norsk/lemma but aren't Norwegian words —
// stripped before tokenizing so they don't need to live in the allowlist.
const MARKER_PATTERN = /\((en\/ei\/et|en\/ei|en\/et|en\/men|en|et|ei|b\.pl\.|pl\.|ubøy\.)\)/gi;

// ── CLI args ──────────────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);
const STRICT = rawArgs.includes('--strict');
const VOCAB_ONLY = rawArgs.includes('--vocab');
const UTTRYKK_ONLY = rawArgs.includes('--uttrykk');
const levelArgs = rawArgs.filter((a) => !a.startsWith('--')).map((a) => a.toLowerCase());
const targetLevels = levelArgs.length > 0 ? levelArgs : LEVELS;
const checkVocab = !UTTRYKK_ONLY;
const checkUttrykk = !VOCAB_ONLY;

// ── Allowlist ─────────────────────────────────────────────────────────────────

function loadAllowlist(): Set<string> {
  if (!existsSync(ALLOWLIST_PATH)) return new Set();
  const lines = readFileSync(ALLOWLIST_PATH, 'utf8').split('\n');
  const words = new Set<string>();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    words.add(trimmed.toLowerCase());
  }
  return words;
}

const allowlist = loadAllowlist();

// ── Spell checker ─────────────────────────────────────────────────────────────

const spell = nspell(dictionary);

function tokenize(text: string): string[] {
  const stripped = text.replace(MARKER_PATTERN, ' ');
  return stripped.match(/\p{L}+/gu) ?? [];
}

function isFlagged(word: string): boolean {
  if (word.length <= 1) return false; // single letters (e.g. "A", "e" as in list items)
  if (allowlist.has(word.toLowerCase())) return false;
  return !spell.correct(word);
}

// ── Main ──────────────────────────────────────────────────────────────────────

type Occurrence = { file: string; id: string; field: string; word: string; context: string };

const occurrences: Occurrence[] = [];
const wordCounts = new Map<string, number>();

function checkFile(filename: string) {
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(filepath)) {
    console.log(`\n⏭️   ${filename} not found — skipping`);
    return;
  }

  let entries: Record<string, string>[];
  try {
    entries = JSON.parse(readFileSync(filepath, 'utf8'));
  } catch (err) {
    console.error(`❌  Could not parse ${filename}: ${(err as Error).message}`);
    return;
  }

  let fileFlagCount = 0;

  for (const entry of entries) {
    const id = entry.id ?? '(missing id)';
    for (const field of NORSK_FIELDS) {
      const val = entry[field];
      if (!val) continue;
      for (const word of tokenize(val)) {
        if (!isFlagged(word)) continue;
        fileFlagCount++;
        occurrences.push({ file: filename, id, field, word, context: val });
        const key = word.toLowerCase();
        wordCounts.set(key, (wordCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const status = fileFlagCount === 0 ? '✅' : '⚠️ ';
  console.log(
    `${status}  ${filename}  (${entries.length} entries) — ${fileFlagCount} flagged word(s)`
  );
}

console.log('Norwegian spelling check (nb Hunspell dictionary)');
console.log(`Allowlist: ${allowlist.size} word(s) loaded from ${ALLOWLIST_PATH.split('/').pop()}`);
console.log(`${'─'.repeat(60)}`);

for (const level of LEVELS) {
  if (!targetLevels.includes(level)) continue;
  if (checkVocab) checkFile(`vocab-${level}.json`);
  if (checkUttrykk) checkFile(`uttrykk-${level}.json`);
}

console.log(`\n${'─'.repeat(60)}`);
console.log(`📋  Flagged occurrences (${occurrences.length} total):\n`);

for (const occ of occurrences) {
  const suggestions = spell.suggest(occ.word).slice(0, 3);
  const hint = suggestions.length > 0 ? ` → suggest: ${suggestions.join(', ')}` : '';
  console.log(`  ⚠️   ${occ.file} [${occ.id}] ${occ.field}: "${occ.word}"${hint}`);
  console.log(`       ${occ.context}`);
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`📊  ${occurrences.length} occurrence(s), ${wordCounts.size} unique flagged word(s)`);

if (wordCounts.size > 0) {
  console.log(`\nUnique words by frequency (add real words to spelling-allowlist.txt):`);
  const sorted = [...wordCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [word, count] of sorted) {
    console.log(`  ${String(count).padStart(3)}×  ${word}`);
  }
}

if (STRICT && occurrences.length > 0) {
  process.exit(1);
}
