#!/usr/bin/env node
/**
 * dedup-textbook-source.mjs
 *
 * Extracts candidate vocab/uttrykk terms from a textbook markdown source
 * (Vokabular tables per chapter + the "Fast og løst sammensatte verb" tables),
 * and filters out anything that already exists anywhere in src/lib/data —
 * every vocab-*.json and uttrykk-*.json file (all levels: A1, A2, B1, B2, C,
 * plus the -preview files), and norske_metaforiske_uttrykk_B1_B2.json.
 *
 * Unlike dedup_cross_file.mjs / dedup_vocab.mjs (which dedup *within* the JSON
 * data files on an exact `norsk` match), this script compares free-form
 * textbook text against the JSON data. The textbook uses different gender/
 * word-class notation than the JSON (`(f/m)` vs `(en)`), so a plain string
 * match would miss real duplicates — matching here is done on a normalized
 * key (markup stripped, gender/class tags stripped, "å " prefix stripped,
 * lowercased) compared against normalized `lemma` and `norsk` values.
 *
 * A word already covered at a DIFFERENT level (e.g. "bitter" at C, "ensom"
 * at A1) still counts as a duplicate here — the goal is "is this word new
 * to the site at all", not "is it new to B1".
 *
 * This script does NOT write to any vocab-*.json / uttrykk-*.json file. It
 * only reads them plus the textbook, and writes candidate output files for
 * review.
 *
 * Usage (from repo root):
 *   node scripts/dedup-textbook-source.mjs
 *   node scripts/dedup-textbook-source.mjs --dry-run   (print summary only, no output files)
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/lib/data');
const SOURCE_MD = resolve(__dirname, '../draft/b1/opp-og-fram-arbeidsbok/content/opp-og-fram.md');
const OUTPUT_DIR = resolve(__dirname, '../draft/b1/opp-og-fram-arbeidsbok/data');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

// ---------------------------------------------------------------------------
// 1. Normalization (matching key only — never used for storage/display)
// ---------------------------------------------------------------------------

function normalize(term) {
  if (!term) return '';
  let t = term;
  t = t.replace(/\*\*/g, '').replace(/\*/g, ''); // bold/italic markdown
  t = t.replace(/^\d+\.\s*/, ''); // leading list numbering ("24. ")
  t = t.replace(/\s*\([^)]*\)\s*$/g, ''); // trailing (...) tags, repeatable
  t = t.replace(/\s*\([^)]*\)\s*$/g, ''); // run twice for stacked "(m) (ureg.)" cases
  t = t.replace(/^å\s+/i, ''); // infinitive marker
  t = t.replace(/\s+/g, ' ').trim().toLowerCase();
  return t;
}

// ---------------------------------------------------------------------------
// 2. Load every vocab-*.json / uttrykk-*.json (all levels) → normalized match set
// ---------------------------------------------------------------------------

function loadExistingKeys() {
  const keysSet = new Set();
  const keysList = []; // ordered list, needed for the near-duplicate prefix scan
  // Match every level, not just B1 — a word already covered at A1/A2/B2/C
  // is still a duplicate for our purposes, just at a different level.
  const files = readdirSync(DATA_DIR).filter(
    (f) =>
      /^vocab-[a-z0-9]+\.json$/.test(f) ||
      /^uttrykk-[a-z0-9]+(-preview)?\.json$/.test(f) ||
      f === 'norske_metaforiske_uttrykk_B1_B2.json'
  );
  console.log(`Loading existing terms from ${files.length} files:`);
  for (const f of files) console.log(`  - ${f}`);
  console.log();
  for (const file of files) {
    const entries = JSON.parse(readFileSync(resolve(DATA_DIR, file), 'utf-8'));
    for (const e of entries) {
      for (const field of ['lemma', 'norsk']) {
        if (!e[field]) continue;
        const k = normalize(e[field]);
        if (!k || keysSet.has(k)) continue;
        keysSet.add(k);
        keysList.push(k);
      }
    }
  }
  return { keysSet, keysList };
}

// ---------------------------------------------------------------------------
// 3. Parse the textbook markdown
// ---------------------------------------------------------------------------

const HEADER_CELL_RE =
  /^(ord i teksten:?|forklaring på norsk:?|oversatt til ditt språk:?|fast sammensatt|løst sammensatt|avledete? substantiv|substantiv)$/i;

function splitTableRow(line) {
  // "| a | b | c |" -> ["a","b","c"]; tolerate missing leading/trailing pipe
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return null;
  const parts = trimmed
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());
  return parts;
}

function isSeparatorRow(cells) {
  return cells.every((c) => /^:?-+:?$/.test(c) || c === '');
}

function isHeaderRow(cells) {
  return cells.some((c) => HEADER_CELL_RE.test(c.toLowerCase()));
}

function parseTextbook(md) {
  const lines = md.split('\n');
  const candidates = []; // { chapter, chapterTitle, source, raw_term, context }

  let currentChapter = null;
  let currentChapterTitle = '';
  let inVokabularBlock = false;
  let inListerSection = false; // appendix section at end of file
  let inCompoundVerbTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Chapter heading: "# 12 Title" or "# 12. Title" (single leading '#')
    const chapterMatch = /^# (\d+)\.?\s+(.*)$/.exec(line);
    if (chapterMatch) {
      currentChapter = Number(chapterMatch[1]);
      currentChapterTitle = chapterMatch[2].trim();
      inVokabularBlock = false;
      continue;
    }

    // Appendix "# Lister" section start (h1, mixed content — only the two
    // compound-verb tables inside it are in scope). Not to be confused with
    // the "## Lister" bullet heading that appears in the front-matter table
    // of contents.
    if (/^# Lister\b/.test(line)) {
      inListerSection = true;
      inVokabularBlock = false;
      continue;
    }

    if (inListerSection) {
      if (/^## Fast og løst sammensatte verb/.test(line)) {
        inCompoundVerbTable = true;
        continue;
      }
      // Any other "## " heading inside the appendix that isn't a compound-verb
      // table (uregelrett verb/substantiv lists, adjektiv gradbøyning) → skip.
      if (/^## /.test(line) && !/^## Fast og løst sammensatte verb/.test(line)) {
        inCompoundVerbTable = false;
      }

      if (inCompoundVerbTable) {
        const cells = splitTableRow(line);
        if (cells && cells.length === 3) {
          if (isSeparatorRow(cells) || isHeaderRow(cells)) continue;
          const [fastRaw, lost, derived] = cells;
          const fast = fastRaw.replace(/^\d+\.\s*/, '');
          if (fast) {
            candidates.push({
              chapter: null,
              chapterTitle: 'Fast og løst sammensatte verb',
              source: 'compound-verb-table',
              raw_term: fast,
              context: `løst sammensatt: ${lost}; avledet substantiv: ${derived}`
            });
          }
          if (lost) {
            candidates.push({
              chapter: null,
              chapterTitle: 'Fast og løst sammensatte verb',
              source: 'compound-verb-table',
              raw_term: lost,
              context: `fast sammensatt: ${fast}; avledet substantiv: ${derived}`
            });
          }
        }
      }
      continue;
    }

    // Vokabular block start/continuation (level 2 or 3 heading)
    if (/^#{2,3}\s*Vokabular/.test(line)) {
      inVokabularBlock = true;
      continue;
    }
    // Any other heading ends the Vokabular block (exercises "a)", next chapter, etc.)
    if (inVokabularBlock && /^#{1,3}\s/.test(line) && !/^#{2,3}\s*Vokabular/.test(line)) {
      inVokabularBlock = false;
      continue;
    }

    if (inVokabularBlock) {
      const cells = splitTableRow(line);
      // Vokabular tables are 2 columns (term, definition) or 3 columns
      // (term, definition, empty translation column) depending on chapter.
      if (cells && (cells.length === 2 || cells.length === 3)) {
        if (isSeparatorRow(cells) || isHeaderRow(cells)) continue;
        const [term, definition] = cells;
        if (term) {
          candidates.push({
            chapter: currentChapter,
            chapterTitle: currentChapterTitle,
            source: 'vokabular-table',
            raw_term: term,
            context: definition || ''
          });
        }
      }
    }
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// 3b. Near-duplicate detection (pass 3)
// ---------------------------------------------------------------------------
// Catches cases the exact normalized match misses: same expression, but with
// an extra/missing trailing word (e.g. candidate "holde opp med" vs. existing
// "holde opp", or existing "gå løs på" vs. candidate "gå løs på noen").
// Heuristic: one key is the other key + 1-2 extra trailing words, AND the
// shorter key has at least 2 words. The 2-word-minimum guard is required —
// without it, generic single-word entries like "bli", "ha", "i", "på" would
// "prefix-match" almost every longer phrase that happens to start with them
// (tested: dropped a heuristic from 246 false-positive-heavy hits down to 35
// precise ones by adding this guard). Even at 2+ words this is not always a
// true duplicate — e.g. "gå på" (generic) vs. "gå på veggen" (idiom, distinct
// meaning) — so these are flagged for manual review, never auto-dropped.
function wordCount(s) {
  return s.split(' ').filter(Boolean).length;
}

function findNearDuplicate(key, existingKeysList) {
  const keyWords = wordCount(key);
  for (const ek of existingKeysList) {
    if (key === ek) continue;
    const ekWords = wordCount(ek);
    let shorterWords, longer;
    if (key.startsWith(ek + ' ')) {
      shorterWords = ekWords;
      longer = key;
    } else if (ek.startsWith(key + ' ')) {
      shorterWords = keyWords;
      longer = ek;
    } else {
      continue;
    }
    if (shorterWords < 2) continue; // skip single-word roots — too generic
    const extraWords = wordCount(longer) - shorterWords;
    if (extraWords > 2) continue; // not a near-miss anymore, too different
    return ek;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 4. Run
// ---------------------------------------------------------------------------

const md = readFileSync(SOURCE_MD, 'utf-8');
const { keysSet: existingKeys, keysList: existingKeysList } = loadExistingKeys();
const candidates = parseTextbook(md);

// De-dupe candidates against each other first (same term can appear in
// multiple chapters, e.g. re-used words), keeping the first occurrence.
const seenWithinCandidates = new Set();
const uniqueCandidates = [];
for (const c of candidates) {
  const key = normalize(c.raw_term);
  if (!key) continue;
  if (seenWithinCandidates.has(key)) continue;
  seenWithinCandidates.add(key);
  uniqueCandidates.push({ ...c, _key: key });
}

const newCandidates = [];
const duplicateCandidates = [];
const nearDuplicateCandidates = [];
for (const c of uniqueCandidates) {
  if (existingKeys.has(c._key)) {
    duplicateCandidates.push(c);
    continue;
  }
  const nearMatch = findNearDuplicate(c._key, existingKeysList);
  if (nearMatch) {
    nearDuplicateCandidates.push({ ...c, _matchedExisting: nearMatch });
  } else {
    newCandidates.push(c);
  }
}

// ---------------------------------------------------------------------------
// 5. Report + output
// ---------------------------------------------------------------------------

console.log(`Parsed candidates (raw)         : ${candidates.length}`);
console.log(`Unique candidates (by norm key) : ${uniqueCandidates.length}`);
console.log(`Already in vocab/uttrykk (dup)  : ${duplicateCandidates.length}`);
console.log(`Near-duplicate (needs review)   : ${nearDuplicateCandidates.length}`);
console.log(`New candidates                  : ${newCandidates.length}`);
console.log();

const byChapter = {};
for (const c of newCandidates) {
  const key = c.chapter != null ? `${c.chapter} ${c.chapterTitle}` : c.chapterTitle;
  (byChapter[key] ??= []).push(c.raw_term);
}
console.log('New candidates per chapter/source:');
for (const [ch, terms] of Object.entries(byChapter)) {
  console.log(`  ${ch}: ${terms.length}`);
}

if (DRY_RUN) {
  console.log('\n[DRY RUN] No output files written.');
  process.exit(0);
}

const strip = (c) => ({
  chapter: c.chapter,
  chapterTitle: c.chapterTitle,
  source: c.source,
  raw_term: c.raw_term,
  context: c.context
});

writeFileSync(
  resolve(OUTPUT_DIR, 'candidates-new.json'),
  JSON.stringify(newCandidates.map(strip), null, 2) + '\n',
  'utf-8'
);
writeFileSync(
  resolve(OUTPUT_DIR, 'candidates-duplicate.json'),
  JSON.stringify(duplicateCandidates.map(strip), null, 2) + '\n',
  'utf-8'
);
writeFileSync(
  resolve(OUTPUT_DIR, 'candidates-near-duplicate.json'),
  JSON.stringify(
    nearDuplicateCandidates.map((c) => ({ ...strip(c), matchedExisting: c._matchedExisting })),
    null,
    2
  ) + '\n',
  'utf-8'
);

console.log(`\nWrote ${OUTPUT_DIR}/candidates-new.json (${newCandidates.length} entries)`);
console.log(
  `Wrote ${OUTPUT_DIR}/candidates-duplicate.json (${duplicateCandidates.length} entries)`
);
console.log(
  `Wrote ${OUTPUT_DIR}/candidates-near-duplicate.json (${nearDuplicateCandidates.length} entries)`
);
