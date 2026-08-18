#!/usr/bin/env node
/**
 * build-vocab-candidates.mjs
 *
 * Step 3 (vocab side) of the Opp og fram! arbeidsbok extraction plan.
 * See draft/b1/opp-og-fram-arbeidsbok/implementation/b1-vocab-uttrykk-opp-og-fram-arbeidsbok.md
 *
 * Assembles `candidates-vocab.json` from pieces already classified/reviewed:
 *
 *   candidates-new.json (855)              base pool, before classification
 *     minus candidates-uttrykk.json (50)     -> already split out as uttrykk
 *     minus candidates-review-idiom-verbs.json (139)  -> pulled for manual review
 *     minus candidates-excluded.json (4)     -> proper nouns / curriculum jargon
 *   = 673 base vocab candidates
 *
 *   plus 12 approved "keep" items from candidates-near-duplicate.json
 *     (distinct senses from their matched existing entry — see plan doc section 5)
 *
 *   plus new derived-noun candidates extracted fresh from the two
 *   "Fast og løst sammensatte verb" tables in the source markdown
 *     (e.g. "avblomstring (f/m)" derived from "avblomstre" / "blomstre av"),
 *     deduped against every vocab-*.json / uttrykk-*.json (all levels).
 *
 * Any raw_term collision between the base pool and the derived-noun set
 * (same word reached two ways) is resolved by keeping the base pool's
 * version (usually richer chapter context) and dropping the derived-noun copy.
 *
 * Usage (from repo root):
 *   node scripts/build-vocab-candidates.mjs
 *   node scripts/build-vocab-candidates.mjs --dry-run
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/lib/data');
const SOURCE_MD = resolve(__dirname, '../draft/b1/opp-og-fram-arbeidsbok/content/opp-og-fram.md');
const OUT_DIR = resolve(__dirname, '../draft/b1/opp-og-fram-arbeidsbok/data');

const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Normalization (same rules as dedup-textbook-source.mjs — keep in sync)
// ---------------------------------------------------------------------------
function normalize(term) {
  if (!term) return '';
  let t = term;
  t = t.replace(/\*\*/g, '').replace(/\*/g, '');
  t = t.replace(/^\d+\.\s*/, '');
  t = t.replace(/\s*\([^)]*\)\s*$/g, '');
  t = t.replace(/\s*\([^)]*\)\s*$/g, '');
  t = t.replace(/^å\s+/i, '');
  t = t.replace(/\s+/g, ' ').trim().toLowerCase();
  return t;
}

function loadJSON(name) {
  return JSON.parse(readFileSync(resolve(OUT_DIR, name), 'utf-8'));
}

// ---------------------------------------------------------------------------
// 1. Base pool = candidates-new.json minus uttrykk/review/excluded
// ---------------------------------------------------------------------------
const neu = loadJSON('candidates-new.json');
const uttrykk = loadJSON('candidates-uttrykk.json');
const review = loadJSON('candidates-review-idiom-verbs.json');
const excluded = loadJSON('candidates-excluded.json');
const nearDup = loadJSON('candidates-near-duplicate.json');

const key = (c) => `${c.chapter}||${c.raw_term}`;
const removeKeys = new Set([...uttrykk, ...review, ...excluded].map(key));
const base = neu.filter((c) => !removeKeys.has(key(c)));

// ---------------------------------------------------------------------------
// 2. The 12 approved "keep" near-duplicates (distinct senses — see plan doc §5)
// ---------------------------------------------------------------------------
const KEEP_TERMS = [
  'komme til verden',
  'sette i',
  'løse seg',
  'smyge seg av gårde',
  'få seg',
  'slå på tråden',
  'kle seg ut',
  'føle seg satt ut',
  'legge seg opp i',
  'legge til side',
  'gå på',
  'stå på'
];
const nearDupByNorm = new Map(nearDup.map((c) => [normalize(c.raw_term), c]));
const keptNearDup = [];
const missingKeepTerms = [];
for (const t of KEEP_TERMS) {
  const found = nearDupByNorm.get(t);
  if (found) {
    keptNearDup.push({
      chapter: found.chapter,
      chapterTitle: found.chapterTitle,
      source: found.source,
      raw_term: found.raw_term,
      context: found.context,
      note: `kept near-duplicate (distinct sense from existing "${found.matchedExisting}")`
    });
  } else {
    missingKeepTerms.push(t);
  }
}

// ---------------------------------------------------------------------------
// 3. Derived-noun candidates from the two compound-verb tables in the source MD
// ---------------------------------------------------------------------------
function loadExistingKeys() {
  const files = readdirSync(DATA_DIR).filter(
    (f) =>
      /^vocab-[a-z0-9]+\.json$/.test(f) ||
      /^uttrykk-[a-z0-9]+(-preview)?\.json$/.test(f) ||
      f === 'norske_metaforiske_uttrykk_B1_B2.json'
  );
  const keys = new Set();
  for (const f of files) {
    const entries = JSON.parse(readFileSync(resolve(DATA_DIR, f), 'utf-8'));
    for (const e of entries) {
      for (const field of ['lemma', 'norsk']) {
        if (!e[field]) continue;
        const k = normalize(e[field]);
        if (k) keys.add(k);
      }
    }
  }
  return keys;
}

function splitTableRow(line) {
  const t = line.trim();
  if (!t.startsWith('|')) return null;
  return t
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());
}
function isSeparatorRow(cells) {
  return cells.every((c) => /^:?-+:?$/.test(c) || c === '');
}
function isHeaderRow(cells) {
  const RE = /^(fast sammensatt|løst sammensatt|avledete? substantiv|substantiv)$/i;
  return cells.some((c) => RE.test(c.toLowerCase()));
}

function extractDerivedNouns(md, existingKeys) {
  const lines = md.split('\n');
  let inLister = false;
  let inTable = false;
  const raw = [];
  for (const line of lines) {
    if (/^# Lister\b/.test(line)) {
      inLister = true;
      continue;
    }
    if (!inLister) continue;
    if (/^## Fast og løst sammensatte verb/.test(line)) {
      inTable = true;
      continue;
    }
    if (/^## /.test(line) && !/^## Fast og løst sammensatte verb/.test(line)) inTable = false;
    if (inTable) {
      const cells = splitTableRow(line);
      if (cells && cells.length === 3) {
        if (isSeparatorRow(cells) || isHeaderRow(cells)) continue;
        const [fastRaw, lost, derivedCell] = cells;
        const fast = fastRaw.replace(/^\d+\.\s*/, '');
        if (derivedCell && derivedCell !== '–' && derivedCell !== '-') {
          for (const noun of derivedCell
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)) {
            raw.push({ fast, lost, noun });
          }
        }
      }
    }
  }
  const seen = new Set();
  const fresh = [];
  for (const d of raw) {
    const k = normalize(d.noun);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    if (!existingKeys.has(k)) fresh.push(d);
  }
  return fresh;
}

const existingKeys = loadExistingKeys();
const md = readFileSync(SOURCE_MD, 'utf-8');
const derivedNew = extractDerivedNouns(md, existingKeys);
const derivedCandidates = derivedNew.map((d) => ({
  chapter: null,
  chapterTitle: 'Fast og løst sammensatte verb',
  source: 'compound-verb-derived-noun',
  raw_term: d.noun,
  context: `avledet av: ${d.fast} / ${d.lost}`
}));

// ---------------------------------------------------------------------------
// 4. Merge + drop any raw_term collision (keep base pool's version)
// ---------------------------------------------------------------------------
const merged = [...base, ...keptNearDup];
const mergedTerms = new Set(merged.map((c) => c.raw_term));
const dedupedDerived = derivedCandidates.filter((c) => {
  if (mergedTerms.has(c.raw_term)) return false;
  mergedTerms.add(c.raw_term);
  return true;
});
const vocabFinal = [...merged, ...dedupedDerived];

// ---------------------------------------------------------------------------
// 5. Report + write
// ---------------------------------------------------------------------------
console.log(`Base pool (855 - uttrykk - review - excluded) : ${base.length}`);
console.log(`Kept near-duplicates                          : ${keptNearDup.length}`);
if (missingKeepTerms.length)
  console.log(`  WARNING - keep terms not found: ${missingKeepTerms.join(', ')}`);
console.log(`New derived-noun candidates (deduped vs DB)   : ${derivedNew.length}`);
console.log(
  `  (dropped as raw_term collision with base)   : ${derivedCandidates.length - dedupedDerived.length}`
);
console.log(`FINAL vocab candidate count                   : ${vocabFinal.length}`);

if (DRY_RUN) {
  console.log('\n[DRY RUN] No output file written.');
  process.exit(0);
}

writeFileSync(
  resolve(OUT_DIR, 'candidates-vocab.json'),
  JSON.stringify(vocabFinal, null, 2) + '\n',
  'utf-8'
);
console.log(`\nWrote ${OUT_DIR}/candidates-vocab.json (${vocabFinal.length} entries)`);
