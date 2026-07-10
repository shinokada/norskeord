#!/usr/bin/env node
/**
 * find-cross-type-duplicates.mjs
 *
 * The gap none of the existing dedup scripts cover: dedup-cross-file.mjs,
 * dedup_cross_file.mjs, dedup_vocab.mjs, and dedup-within-file.mjs all
 * compare lemmas *within* vocab files or *within* uttrykk files — none of
 * them ever compares a vocab file against an uttrykk file. That's how
 * "ved siden av" ended up duplicated across the boundary undetected.
 *
 * This script compares every vocab-xx.json lemma against every
 * uttrykk-xx.json lemma, across ALL levels (not just matching levels,
 * since a concept could legitimately be taught at one level in vocab and
 * referenced at another in uttrykk). No API calls — pure structural check.
 *
 * Match rule: normalized lemma equality (lowercase, trimmed, collapsed
 * whitespace). Also flags near-matches where the uttrykk `norsk` field
 * *starts with* a vocab lemma followed by a word boundary, since uttrykk
 * entries are sometimes stored as a longer example built around a vocab
 * lemma rather than the bare lemma itself.
 *
 * Outputs:
 *   scripts/output/cross-type-duplicates.json
 *   scripts/output/cross-type-duplicates.md
 *
 * Usage:
 *   node scripts/find-cross-type-duplicates.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src/lib/data');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'scripts/output');

const VOCAB_FILES = [
  'vocab-a1.json',
  'vocab-a2.json',
  'vocab-b1.json',
  'vocab-b2.json',
  'vocab-c.json'
];

const UTTRYKK_FILES = [
  'uttrykk-a1.json',
  'uttrykk-a2.json',
  'uttrykk-b1.json',
  'uttrykk-b2.json',
  'uttrykk-c.json'
];

function normalize(s) {
  return (s ?? '').toLowerCase().normalize('NFC').replace(/[.?!]/g, '').replace(/\s+/g, ' ').trim();
}

function loadEntries(files, prefix) {
  const out = [];
  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ Not found, skipping: ${file}`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const level = file.replace(prefix, '').replace('.json', '');
    for (const entry of data) {
      out.push({ ...entry, _level: level, _sourceFile: file });
    }
  }
  return out;
}

function main() {
  console.log('📂 Loading vocab and uttrykk entries…');
  const vocabEntries = loadEntries(VOCAB_FILES, 'vocab-');
  const uttrykkEntries = loadEntries(UTTRYKK_FILES, 'uttrykk-');
  console.log(
    `   vocab: ${vocabEntries.length} entries, uttrykk: ${uttrykkEntries.length} entries\n`
  );

  // Index uttrykk by normalized lemma for O(1) exact-match lookup
  const uttrykkByLemma = new Map();
  for (const u of uttrykkEntries) {
    const key = normalize(u.lemma);
    if (!uttrykkByLemma.has(key)) uttrykkByLemma.set(key, []);
    uttrykkByLemma.get(key).push(u);
  }

  const exactMatches = [];
  const prefixMatches = [];

  for (const v of vocabEntries) {
    const vKey = normalize(v.lemma);
    if (vKey.length === 0) continue;

    // Exact lemma match
    const exact = uttrykkByLemma.get(vKey);
    if (exact) {
      for (const u of exact) {
        exactMatches.push({ vocab: v, uttrykk: u });
      }
    }
  }

  // Prefix match: uttrykk norsk starts with vocab lemma + word boundary,
  // and isn't already an exact match (avoid double-reporting)
  const exactPairKeys = new Set(exactMatches.map((m) => `${m.vocab.id}::${m.uttrykk.id}`));

  for (const v of vocabEntries) {
    const vKey = normalize(v.lemma);
    if (vKey.length < 3) continue; // skip trivially short lemmas (noisy prefix matches)
    for (const u of uttrykkEntries) {
      const uNorsk = normalize(u.norsk);
      if (uNorsk === vKey) continue; // already caught as exact lemma match above
      if (uNorsk.startsWith(vKey + ' ')) {
        const pairKey = `${v.id}::${u.id}`;
        if (!exactPairKeys.has(pairKey)) {
          prefixMatches.push({ vocab: v, uttrykk: u });
        }
      }
    }
  }

  // ---------------------------------------------------------------------
  // Output
  // ---------------------------------------------------------------------

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const jsonOut = {
    generated: new Date().toISOString(),
    exactMatches: exactMatches.map((m) => ({
      vocabId: m.vocab.id,
      vocabLevel: m.vocab._level,
      vocabLemma: m.vocab.lemma,
      vocabPart: m.vocab.part,
      uttrykkId: m.uttrykk.id,
      uttrykkLevel: m.uttrykk._level,
      uttrykkNorsk: m.uttrykk.norsk
    })),
    prefixMatches: prefixMatches.map((m) => ({
      vocabId: m.vocab.id,
      vocabLevel: m.vocab._level,
      vocabLemma: m.vocab.lemma,
      vocabPart: m.vocab.part,
      uttrykkId: m.uttrykk.id,
      uttrykkLevel: m.uttrykk._level,
      uttrykkNorsk: m.uttrykk.norsk
    }))
  };

  const jsonPath = path.join(OUTPUT_DIR, 'cross-type-duplicates.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonOut, null, 2), 'utf8');

  const row = (m) =>
    `| ${m.vocab.id} (${m.vocab._level}) | ${m.vocab.lemma} | ${m.vocab.part} | ${m.uttrykk.id} (${m.uttrykk._level}) | ${m.uttrykk.norsk} |`;

  const table = (matches) =>
    matches.length === 0
      ? '_None_\n'
      : `| Vocab ID | Vocab lemma | Vocab part | Uttrykk ID | Uttrykk norsk |\n|---|---|---|---|---|\n${matches.map(row).join('\n')}\n`;

  const md = `# Cross-Type Duplicates Report (vocab ↔ uttrykk)

Generated: ${new Date().toISOString()}

Compares every vocab-xx.json lemma against every uttrykk-xx.json lemma,
across all levels — the check no existing dedup script performs.

## Summary

| Match type | Count | Likely action |
|---|---|---|
| Exact lemma match | ${exactMatches.length} | Same concept exists in both files — decide which one to keep, per the vocab-vs-uttrykk decision rule |
| Prefix match (uttrykk built around a vocab lemma) | ${prefixMatches.length} | Usually fine (uttrykk entry is a longer formula containing the vocab word) — review for near-duplicates |
| **Total flagged** | **${exactMatches.length + prefixMatches.length}** | |

---

## Exact Lemma Matches

These are the highest-confidence duplicates — the same lemma appears as
both a standalone vocab entry and a standalone uttrykk entry. For each,
apply the decision rule in \`data-rules/vocab-and-uttrykk.md\`: does it
function as a lexical item (→ keep vocab, remove uttrykk) or a fixed
chunk (→ keep uttrykk, remove vocab)?

${table(exactMatches)}

---

## Prefix Matches (lower confidence — review before acting)

${table(prefixMatches)}

---

_This report only flags candidates. No files are modified — review manually,
then delete the losing entry directly or add it to a migration list._
`;

  const mdPath = path.join(OUTPUT_DIR, 'cross-type-duplicates.md');
  fs.writeFileSync(mdPath, md, 'utf8');

  console.log('✅ Done!\n');
  console.log(`   Exact lemma matches:  ${exactMatches.length}`);
  console.log(`   Prefix matches:       ${prefixMatches.length}`);
  console.log(`\n   Output files:`);
  console.log(`   → ${jsonPath}`);
  console.log(`   → ${mdPath}\n`);
}

main();
