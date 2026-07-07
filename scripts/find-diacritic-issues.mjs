#!/usr/bin/env node
/**
 * find-diacritic-issues.mjs
 *
 * Scans draft/{level}/vocab-{level}-new.json and/or
 * draft/{level}/uttrykk-{level}-new.json (output of enrich-vocab.mjs) for
 * Norwegian text that has lost its æ/ø/å characters — e.g. "pa" instead of
 * "på", "a arbeide" instead of "å arbeide", "naar" instead of "når".
 *
 * Two kinds of detection, both restricted to the Norwegian-language fields
 * (norsk, lemma, example, definition) — translation fields (english,
 * ukrainian, spanish, german, example_*) are never checked, since they're
 * not Norwegian and legitimately have no æ/ø/å:
 *
 *   1. HEADWORD check — if the entry's own norsk/lemma contains æ/ø/å, its
 *      ASCII-degraded form (å→a, æ→ae, ø→o/oe) is looked for as a whole
 *      word inside "example". This catches the most important case: the
 *      word being taught is itself misspelled in its own example sentence.
 *
 *   2. COMMON-WORD check — a curated list of very common closed-class
 *      Norwegian words that always carry æ/ø/å (på, må, når, gå, får, så,
 *      små, etc.) is looked for in degraded form anywhere in the text.
 *      This catches damage to words *other* than the one being taught.
 *
 * This detects two kinds of fixable issues (see below) and can act on them
 * two different ways:
 *
 *   --fix     Deterministic in-place correction: every flagged token is a
 *             case handled by findIssues(), which already knows the exact
 *             correct replacement (either from COMMON_WORD_MAP, or derived
 *             from the entry's own correctly-spelled norsk/lemma for the
 *             headword check). No API calls, no risk of the regenerated
 *             text having the same problem again. This is the recommended
 *             default — the corruption is a narrow, well-understood
 *             substitution, not a sign the whole entry is untrustworthy.
 *
 *   --remove  Deletes flagged entries from the draft file (backed up to
 *             {file}.bak first) so they can be picked up fresh by
 *             re-running enrich-vocab.mjs. Slower (API calls) and not
 *             guaranteed to fix anything, since a systemic quirk in
 *             generation could just reproduce the same kind of mistake in
 *             a new sentence. Only worth it if you suspect an entry has
 *             other problems beyond the diacritics (e.g. a genuinely wrong
 *             example) and want a full re-generation rather than a patch.
 *
 * With neither flag, the script only reports what it finds.
 *
 * Usage:
 *   node scripts/find-diacritic-issues.mjs a2
 *   node scripts/find-diacritic-issues.mjs a2 --type vocab
 *   node scripts/find-diacritic-issues.mjs a2 --type uttrykk
 *   node scripts/find-diacritic-issues.mjs a2 --fix
 *   node scripts/find-diacritic-issues.mjs a2 --remove
 *
 * Options:
 *   --type vocab|uttrykk|both   Which draft file(s) to check (default: both)
 *   --fix                        Correct flagged tokens in place (backed up
 *                                to {file}.bak first).
 *   --remove                    Remove flagged entries from the draft file
 *                                (backed up to {file}.bak first) so they can
 *                                be picked up fresh by re-running
 *                                enrich-vocab.mjs (which skips lemmas
 *                                already present in the output file).
 *
 * Output:
 *   Console: live list of flagged entries
 *   File:    scripts/outputs/diacritic-issues-{level}-{timestamp}.txt
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  NO_COMMON_WORD_MAP as COMMON_WORD_MAP,
  NO_AMBIGUOUS_WORDS as AMBIGUOUS_WORDS,
  degradeNO as degrade,
  bareWordNO as bareWord,
  tokens as norwegianTokens,
  applyFixes
} from './lib/diacritics.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DRAFT_DIR = join(PROJECT_ROOT, 'draft');
const OUTPUT_DIR = join(__dirname, 'outputs');

// ── CLI args ────────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);
const REMOVE = rawArgs.includes('--remove');
const FIX = rawArgs.includes('--fix');
const typeIdx = rawArgs.indexOf('--type');
const TYPE = typeIdx !== -1 ? rawArgs[typeIdx + 1] : 'both';
const level = rawArgs.find((a) => !a.startsWith('--') && rawArgs[rawArgs.indexOf(a) - 1] !== '--type');

if (!['vocab', 'uttrykk', 'both'].includes(TYPE)) {
  console.error(`❌  Unknown --type "${TYPE}" — must be "vocab", "uttrykk", or "both"`);
  process.exit(1);
}

if (FIX && REMOVE) {
  console.error('❌  --fix and --remove are mutually exclusive — pick one.');
  process.exit(1);
}

if (!level) {
  console.error('❌  Level is required. Example:');
  console.error('    node scripts/find-diacritic-issues.mjs a2');
  process.exit(1);
}

// COMMON_WORD_MAP, AMBIGUOUS_WORDS, norwegianTokens (tokens), degrade,
// bareWord, and fixText (sharedFixText) all come from ./lib/diacritics.mjs
// (imported above) so this script, find-diacritic-issues-de-es.mjs, and
// enrich-vocab.mjs stay in sync on a single source of truth.

function findIssues(entry) {
  const issues = [];
  const headwordFixes = []; // { degradedForms: Set, correct: string } — for --fix
  const example = entry.example || '';
  const exampleTokensLower = new Set(norwegianTokens(example).map((t) => t.toLowerCase()));

  // 1. Headword check — does the entry's own word appear in degraded form?
  for (const field of ['norsk', 'lemma']) {
    const word = bareWord(entry[field]);
    if (!word || !/[æøåÆØÅ]/.test(word)) continue;
    const degradedForms = degrade(word);
    for (const form of degradedForms) {
      if (exampleTokensLower.has(form)) {
        issues.push({
          kind: 'headword',
          field: 'example',
          detail: `"${field}" is "${entry[field]}" but example uses degraded form "${form}"`
        });
        headwordFixes.push({ degradedForms: new Set(degradedForms), correct: word });
        break;
      }
    }
  }

  // 2. Common-word check — across norsk, lemma, example, definition
  const ambiguous = [];
  for (const field of ['norsk', 'lemma', 'example', 'definition']) {
    const text = entry[field];
    if (!text) continue;
    const toks = norwegianTokens(text).map((t) => t.toLowerCase());
    for (const tok of toks) {
      if (Object.prototype.hasOwnProperty.call(COMMON_WORD_MAP, tok)) {
        issues.push({
          kind: 'common-word',
          field,
          detail: `"${field}" contains "${tok}" (likely degraded "${COMMON_WORD_MAP[tok].label}")`
        });
      } else if (Object.prototype.hasOwnProperty.call(AMBIGUOUS_WORDS, tok)) {
        ambiguous.push({
          kind: 'ambiguous',
          field,
          detail: `"${field}" contains "${tok}" — ${AMBIGUOUS_WORDS[tok]} (NOT auto-fixed)`
        });
      }
    }
  }

  return { issues, headwordFixes, ambiguous };
}

// ── Process one file ──────────────────────────────────────────────────────

function processFile(filename, draftPath) {
  if (!existsSync(draftPath)) {
    console.log(`  ⏭️   ${filename} not found — skipping`);
    return { filename, flagged: [] };
  }

  const entries = JSON.parse(readFileSync(draftPath, 'utf8'));
  const flagged = [];
  const ambiguousFlagged = [];

  for (const entry of entries) {
    const { issues, headwordFixes, ambiguous } = findIssues(entry);
    if (issues.length > 0) {
      flagged.push({ entry, issues, headwordFixes });
    }
    if (ambiguous.length > 0) {
      ambiguousFlagged.push({ entry, ambiguous });
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📄  ${filename}  (${entries.length} entries)`);
  console.log(`${'─'.repeat(60)}`);

  for (const { entry, issues } of flagged) {
    console.log(`  ⚠️   [${entry.id || entry.lemma}] "${entry.norsk}"`);
    console.log(`       example: "${entry.example}"`);
    for (const issue of issues) {
      console.log(`       - ${issue.detail}`);
    }
  }

  console.log(`\n  → ${flagged.length} / ${entries.length} entries auto-detected (fixable)`);

  if (ambiguousFlagged.length > 0) {
    console.log(`\n  🟡  ${ambiguousFlagged.length} entries need MANUAL review (ambiguous, not auto-fixed):`);
    for (const { entry, ambiguous } of ambiguousFlagged) {
      console.log(`     [${entry.id || entry.lemma}] "${entry.norsk}" — example: "${entry.example}"`);
      for (const a of ambiguous) console.log(`       - ${a.detail}`);
    }
  }

  if (FIX && flagged.length > 0) {
    const bakPath = `${draftPath}.bak`;
    copyFileSync(draftPath, bakPath);

    for (const { entry, headwordFixes } of flagged) {
      // Apply each headword-fix rule in turn (usually one, occasionally two
      // if both norsk and lemma independently flagged a degraded form) —
      // applyFixes runs them sequentially instead of merging them into one
      // rule, which used to let the last fix silently overwrite the others.
      for (const field of ['example', 'definition']) {
        if (entry[field]) {
          entry[field] = applyFixes(entry[field], headwordFixes, COMMON_WORD_MAP);
        }
      }
    }

    writeFileSync(draftPath, JSON.stringify(entries, null, 2) + '\n', 'utf8');
    console.log(`  💾  Backed up to ${bakPath.replace(PROJECT_ROOT, '.')}`);
    console.log(`  ✅  Fixed ${flagged.length} entries in place in ${filename}`);
  } else if (FIX) {
    console.log(`  (nothing to fix)`);
  }

  if (REMOVE && flagged.length > 0) {
    const flaggedLemmas = new Set(flagged.map(({ entry }) => entry.lemma));
    const remaining = entries.filter((e) => !flaggedLemmas.has(e.lemma));

    const bakPath = `${draftPath}.bak`;
    copyFileSync(draftPath, bakPath);
    writeFileSync(draftPath, JSON.stringify(remaining, null, 2) + '\n', 'utf8');

    console.log(`  💾  Backed up to ${bakPath.replace(PROJECT_ROOT, '.')}`);
    console.log(
      `  🗑️   Removed ${flagged.length} flagged entries — ${remaining.length} remain in ${filename}`
    );
    console.log(
      `  ↻  Re-run enrich-vocab.mjs for this level to regenerate the removed entries`
      + ` (they're still present in the extracted-*.json input and enrich-vocab.mjs`
      + ` only skips lemmas that already exist in the output file).`
    );
  } else if (REMOVE) {
    console.log(`  (nothing to remove)`);
  }

  return { filename, flagged, ambiguousFlagged };
}

// ── Report ──────────────────────────────────────────────────────────────

function writeReport(level, results) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = join(OUTPUT_DIR, `diacritic-issues-${level}-${ts}.txt`);

  const lines = [];
  lines.push(`Diacritic issue scan: ${level}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(
    `Mode: ${
      FIX
        ? 'FIX (flagged tokens corrected in place)'
        : REMOVE
          ? 'REMOVE (flagged entries stripped from draft files)'
          : 'REPORT ONLY'
    }`
  );
  lines.push('');

  for (const { filename, flagged, ambiguousFlagged } of results) {
    lines.push(`=== ${filename} ===`);
    lines.push(`Auto-detected (fixable): ${flagged.length}`);
    lines.push(`Needs manual review (ambiguous): ${ambiguousFlagged.length}`);
    lines.push('');
    for (const { entry, issues } of flagged) {
      lines.push(`[${entry.id || entry.lemma}] "${entry.norsk}"`);
      lines.push(`  example: "${entry.example}"`);
      for (const issue of issues) lines.push(`  - ${issue.detail}`);
      lines.push('');
    }
    if (ambiguousFlagged.length > 0) {
      lines.push(`--- Manual review needed ---`);
      for (const { entry, ambiguous } of ambiguousFlagged) {
        lines.push(`[${entry.id || entry.lemma}] "${entry.norsk}"`);
        lines.push(`  example: "${entry.example}"`);
        for (const a of ambiguous) lines.push(`  - ${a.detail}`);
        lines.push('');
      }
    }
  }

  writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  console.log(`\n📝  Full report written to: ${outPath.replace(PROJECT_ROOT, '.')}`);
}

// ── Main ──────────────────────────────────────────────────────────────────

console.log(`🔍  find-diacritic-issues.mjs`);
console.log(`    Level: ${level}`);
console.log(`    Type:  ${TYPE}`);
console.log(
  `    Mode:  ${FIX ? 'FIX flagged tokens in place' : REMOVE ? 'REMOVE flagged entries' : 'report only'}`
);

const draftDir = join(DRAFT_DIR, level);
const results = [];

if (TYPE === 'vocab' || TYPE === 'both') {
  results.push(processFile(`vocab-${level}-new.json`, join(draftDir, `vocab-${level}-new.json`)));
}
if (TYPE === 'uttrykk' || TYPE === 'both') {
  results.push(
    processFile(`uttrykk-${level}-new.json`, join(draftDir, `uttrykk-${level}-new.json`))
  );
}

writeReport(level, results);

const totalFlagged = results.reduce((s, r) => s + r.flagged.length, 0);
console.log(`\n${'═'.repeat(60)}`);
console.log(`📊  Total flagged across ${results.length} file(s): ${totalFlagged}`);
