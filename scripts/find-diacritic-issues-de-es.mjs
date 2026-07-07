#!/usr/bin/env node
/**
 * find-diacritic-issues-de-es.mjs
 *
 * Companion to find-diacritic-issues.mjs — same idea, but for the German
 * and Spanish translation fields instead of the Norwegian source fields.
 *
 * Scans draft/{level}/vocab-{level}-new.json and/or
 * draft/{level}/uttrykk-{level}-new.json for German/Spanish text that has
 * lost its special characters — e.g. "fur" instead of "für", "mochte"
 * instead of "möchte", "manana" instead of "mañana", missing ¿/¡.
 *
 * Two kinds of detection per language, restricted to that language's own
 * fields (german/example_german, spanish/example_spanish — never cross-
 * checked against each other or against Norwegian/English):
 *
 *   1. HEADWORD check — if the entry's own `german` (or `spanish`) field
 *      contains a special character (ü/ö/ä/ß or á/é/í/ó/ú/ñ), its
 *      ASCII-degraded form is looked for as a whole word inside
 *      `example_german` (or `example_spanish`). Catches the word being
 *      translated getting mangled in its own example sentence.
 *
 *   2. COMMON-WORD check — a curated list of very common German/Spanish
 *      words that always carry a special character (für, möchte, über,
 *      días, aquí, años, mañana, …) is looked for in degraded form
 *      anywhere in the language's fields. Catches damage to words other
 *      than the one being translated.
 *
 *   3. PUNCTUATION check (Spanish only) — example_spanish ends in "?" or
 *      "!" but doesn't open with the matching "¿" / "¡".
 *
 * Words that are genuinely ambiguous in stripped form (e.g. German "schon"
 * = "already" vs "schön" = "beautiful"; Spanish "que" = "that" vs "qué" =
 * "what") are reported but never auto-fixed, same policy as the Norwegian
 * script's AMBIGUOUS_WORDS.
 *
 *   --fix     Deterministic in-place correction of every non-ambiguous
 *             flagged token. No API calls.
 *   --remove  Deletes flagged entries from the draft file (backed up to
 *             {file}.bak first) so they can be re-picked-up by re-running
 *             add-language-translations.mjs. Only worth it if you suspect
 *             the whole translation (not just the diacritic) is off.
 *
 * With neither flag, the script only reports what it finds.
 *
 * Usage:
 *   node scripts/find-diacritic-issues-de-es.mjs a2
 *   node scripts/find-diacritic-issues-de-es.mjs a2 --kind vocab
 *   node scripts/find-diacritic-issues-de-es.mjs a2 --kind uttrykk
 *   node scripts/find-diacritic-issues-de-es.mjs a2 --lang german
 *   node scripts/find-diacritic-issues-de-es.mjs a2 --lang spanish
 *   node scripts/find-diacritic-issues-de-es.mjs a2 --fix
 *   node scripts/find-diacritic-issues-de-es.mjs a2 --remove
 *
 * Options:
 *   --kind vocab|uttrykk|both   Which draft file(s) to check (default: both)
 *   --lang german|spanish|both Which language(s) to check (default: both)
 *   --fix                        Correct flagged tokens in place (backed up
 *                                to {file}.bak first).
 *   --remove                    Remove flagged entries from the draft file
 *                                (backed up to {file}.bak first).
 *
 * Output:
 *   Console: live list of flagged entries
 *   File:    scripts/outputs/diacritic-issues-de-es-{level}-{timestamp}.txt
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  DE_COMMON_WORD_MAP,
  DE_AMBIGUOUS_WORDS,
  degradeDE,
  ES_COMMON_WORD_MAP,
  ES_AMBIGUOUS_WORDS,
  degradeES,
  tokens,
  bareWordIntl as bareWord,
  splitTranslationAlternatives,
  applyFixes,
  findSpanishPunctuationIssues as findPunctuationIssues,
  fixSpanishPunctuation as fixPunctuation
} from './lib/diacritics.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DRAFT_DIR = join(PROJECT_ROOT, 'draft');
const OUTPUT_DIR = join(__dirname, 'outputs');

// ── CLI args ────────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);
const REMOVE = rawArgs.includes('--remove');
const FIX = rawArgs.includes('--fix');

function argAfter(flag) {
  const i = rawArgs.indexOf(flag);
  return i !== -1 ? rawArgs[i + 1] : null;
}

const KIND = argAfter('--kind') || 'both';
const LANG = argAfter('--lang') || 'both';
const flagValues = new Set([KIND, LANG, '--kind', '--lang', '--fix', '--remove']);
const level = rawArgs.find((a, i) => !a.startsWith('--') && rawArgs[i - 1] !== '--kind' && rawArgs[i - 1] !== '--lang');

if (!['vocab', 'uttrykk', 'both'].includes(KIND)) {
  console.error(`❌  Unknown --kind "${KIND}" — must be "vocab", "uttrykk", or "both"`);
  process.exit(1);
}
if (!['german', 'spanish', 'both'].includes(LANG)) {
  console.error(`❌  Unknown --lang "${LANG}" — must be "german", "spanish", or "both"`);
  process.exit(1);
}
if (FIX && REMOVE) {
  console.error('❌  --fix and --remove are mutually exclusive — pick one.');
  process.exit(1);
}
if (!level) {
  console.error('❌  Level is required. Example:');
  console.error('    node scripts/find-diacritic-issues-de-es.mjs a2');
  process.exit(1);
}

// ── Language configs ──────────────────────────────────────────────────────
//
// Each config says which fields hold the "headword" translation and its
// example, which characters count as "special" for that language, a
// curated common-word map (degraded → correct), and words that are
// genuinely ambiguous when stripped (never auto-fixed).

const SPECIAL_CHARS_DE = /[üöäßÜÖÄ]/;
const SPECIAL_CHARS_ES = /[áéíóúñÁÉÍÓÚÑ¿¡]/;

// COMMON_WORD_MAP_DE/ES, AMBIGUOUS_DE/ES, degradeDE/ES, tokens, bareWord,
// fixText, findPunctuationIssues, and fixPunctuation all come from
// ./lib/diacritics.mjs (imported above) so this script, the Norwegian
// find-diacritic-issues.mjs, and enrich-vocab.mjs stay in sync on a single
// source of truth.

const LANGUAGES = {
  german: {
    label: 'German',
    field: 'german',
    exampleField: 'example_german',
    specialChars: SPECIAL_CHARS_DE,
    commonWordMap: DE_COMMON_WORD_MAP,
    ambiguousWords: DE_AMBIGUOUS_WORDS,
    degrade: degradeDE
  },
  spanish: {
    label: 'Spanish',
    field: 'spanish',
    exampleField: 'example_spanish',
    specialChars: SPECIAL_CHARS_ES,
    commonWordMap: ES_COMMON_WORD_MAP,
    ambiguousWords: ES_AMBIGUOUS_WORDS,
    degrade: degradeES
  }
};

const activeLangs = LANG === 'both' ? ['german', 'spanish'] : [LANG];

// ── Per-entry, per-language issue detection ────────────────────────────────

function findIssuesForLang(entry, langKey) {
  const cfg = LANGUAGES[langKey];
  const issues = [];
  const ambiguous = [];
  const headwordFixes = [];

  const fieldValue = entry[cfg.field];
  const exampleValue = entry[cfg.exampleField];

  // 1. Headword check — translation fields often carry several
  // comma/slash-separated alternatives (e.g. "Gebühr, Abgabe, Steuer"), so
  // check each candidate word on its own rather than degrading the whole
  // string as one "word" (which never matches a single token in the
  // example and silently disabled this check for any multi-value field).
  const exampleTokensLower = new Set(tokens(exampleValue).map((t) => t.toLowerCase()));
  for (const alt of splitTranslationAlternatives(fieldValue)) {
    const word = bareWord(alt);
    if (!word || !cfg.specialChars.test(word)) continue;
    const degradedForms = cfg.degrade(word);
    for (const form of degradedForms) {
      if (exampleTokensLower.has(form)) {
        issues.push({
          kind: 'headword',
          lang: langKey,
          field: cfg.exampleField,
          detail: `"${cfg.field}" contains "${word}" but ${cfg.exampleField} uses degraded form "${form}"`
        });
        headwordFixes.push({ degradedForms: new Set(degradedForms), correct: word });
        break;
      }
    }
  }

  // 2. Common-word check — across both the translation field and its example
  for (const field of [cfg.field, cfg.exampleField]) {
    const text = entry[field];
    if (!text) continue;
    for (const tok of tokens(text).map((t) => t.toLowerCase())) {
      if (Object.prototype.hasOwnProperty.call(cfg.commonWordMap, tok)) {
        issues.push({
          kind: 'common-word',
          lang: langKey,
          field,
          detail: `"${field}" contains "${tok}" (likely degraded "${cfg.commonWordMap[tok].label}")`
        });
      } else if (Object.prototype.hasOwnProperty.call(cfg.ambiguousWords, tok)) {
        ambiguous.push({
          kind: 'ambiguous',
          lang: langKey,
          field,
          detail: `"${field}" contains "${tok}" — ${cfg.ambiguousWords[tok]}`
        });
      }
    }
  }

  // 3. Punctuation check (Spanish only)
  if (langKey === 'spanish') {
    issues.push(...findPunctuationIssues(exampleValue));
  }

  return { issues, ambiguous, headwordFixes };
}

function findIssues(entry) {
  let issues = [];
  let ambiguous = [];
  let headwordFixesByLang = {};

  for (const langKey of activeLangs) {
    const result = findIssuesForLang(entry, langKey);
    issues = issues.concat(result.issues);
    ambiguous = ambiguous.concat(result.ambiguous);
    if (result.headwordFixes.length > 0) headwordFixesByLang[langKey] = result.headwordFixes;
  }

  return { issues, ambiguous, headwordFixesByLang };
}

// ── Process one file ──────────────────────────────────────────────────────

function processFile(filename, draftPath) {
  if (!existsSync(draftPath)) {
    console.log(`  ⏭️   ${filename} not found — skipping`);
    return { filename, flagged: [], ambiguousFlagged: [] };
  }

  const entries = JSON.parse(readFileSync(draftPath, 'utf8'));
  const flagged = [];
  const ambiguousFlagged = [];

  for (const entry of entries) {
    const { issues, ambiguous, headwordFixesByLang } = findIssues(entry);
    if (issues.length > 0) {
      flagged.push({ entry, issues, headwordFixesByLang });
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
    if (entry.example_german) console.log(`       example_german: "${entry.example_german}"`);
    if (entry.example_spanish) console.log(`       example_spanish: "${entry.example_spanish}"`);
    for (const issue of issues) {
      console.log(`       - ${issue.detail}`);
    }
  }

  console.log(`\n  → ${flagged.length} / ${entries.length} entries auto-detected (fixable)`);

  if (ambiguousFlagged.length > 0) {
    console.log(`\n  🟡  ${ambiguousFlagged.length} entries need MANUAL review (ambiguous, not auto-fixed):`);
    for (const { entry, ambiguous } of ambiguousFlagged) {
      console.log(`     [${entry.id || entry.lemma}] "${entry.norsk}"`);
      if (entry.example_german) console.log(`       example_german: "${entry.example_german}"`);
      if (entry.example_spanish) console.log(`       example_spanish: "${entry.example_spanish}"`);
      for (const a of ambiguous) console.log(`       - ${a.detail}`);
    }
  }

  if (FIX && flagged.length > 0) {
    const bakPath = `${draftPath}.bak`;
    copyFileSync(draftPath, bakPath);

    for (const { entry, headwordFixesByLang } of flagged) {
      for (const langKey of activeLangs) {
        const cfg = LANGUAGES[langKey];
        const hfs = headwordFixesByLang[langKey] || [];
        for (const field of [cfg.field, cfg.exampleField]) {
          if (entry[field]) {
            entry[field] = applyFixes(entry[field], hfs, cfg.commonWordMap);
          }
        }
        if (langKey === 'spanish' && entry[cfg.exampleField]) {
          entry[cfg.exampleField] = fixPunctuation(entry[cfg.exampleField]);
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
      `  ↻  Re-run add-language-translations.mjs for this level to regenerate the removed`
      + ` entries' translations.`
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
  const outPath = join(OUTPUT_DIR, `diacritic-issues-de-es-${level}-${ts}.txt`);

  const lines = [];
  lines.push(`Diacritic issue scan (German/Spanish): ${level}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Languages: ${activeLangs.join(', ')}`);
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
      if (entry.example_german) lines.push(`  example_german: "${entry.example_german}"`);
      if (entry.example_spanish) lines.push(`  example_spanish: "${entry.example_spanish}"`);
      for (const issue of issues) lines.push(`  - ${issue.detail}`);
      lines.push('');
    }
    if (ambiguousFlagged.length > 0) {
      lines.push(`--- Manual review needed ---`);
      for (const { entry, ambiguous } of ambiguousFlagged) {
        lines.push(`[${entry.id || entry.lemma}] "${entry.norsk}"`);
        if (entry.example_german) lines.push(`  example_german: "${entry.example_german}"`);
        if (entry.example_spanish) lines.push(`  example_spanish: "${entry.example_spanish}"`);
        for (const a of ambiguous) lines.push(`  - ${a.detail}`);
        lines.push('');
      }
    }
  }

  writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  console.log(`\n📝  Full report written to: ${outPath.replace(PROJECT_ROOT, '.')}`);
}

// ── Main ──────────────────────────────────────────────────────────────────

console.log(`🔍  find-diacritic-issues-de-es.mjs`);
console.log(`    Level: ${level}`);
console.log(`    Kind:  ${KIND}`);
console.log(`    Lang:  ${LANG}`);
console.log(
  `    Mode:  ${FIX ? 'FIX flagged tokens in place' : REMOVE ? 'REMOVE flagged entries' : 'report only'}`
);

const draftDir = join(DRAFT_DIR, level);
const results = [];

if (KIND === 'vocab' || KIND === 'both') {
  results.push(processFile(`vocab-${level}-new.json`, join(draftDir, `vocab-${level}-new.json`)));
}
if (KIND === 'uttrykk' || KIND === 'both') {
  results.push(
    processFile(`uttrykk-${level}-new.json`, join(draftDir, `uttrykk-${level}-new.json`))
  );
}

writeReport(level, results);

const totalFlagged = results.reduce((s, r) => s + r.flagged.length, 0);
console.log(`\n${'═'.repeat(60)}`);
console.log(`📊  Total flagged across ${results.length} file(s): ${totalFlagged}`);
