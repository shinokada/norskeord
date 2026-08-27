#!/usr/bin/env node
/**
 * extract-pa-niva-b2.mjs
 *
 * Parallel-parses arbeidsbok-b2.md + arbeidsbok-b2-fasit.md to pull vocab/
 * uttrykk candidates out of the in-scope sections identified in
 * draft/b2/pa-niva/implementation/b2-vocab-uttrykk-pa-niva-arbeidsbok.md §2.
 *
 * Section types implemented:
 *   - "paraphrase": numbered A/B sentence-reconstruction sections
 *     (10 80 PARSETNINGER, 17 PARSETNINGER, 15 PARSETNINGER: MODALE UTTRYKKSMÅTER)
 *   - "faste-uttrykk": lettered fill-in sentences + a matching
 *     "Oversett ... til morsmålet ditt" idiom-template list (12 FASTE UTTRYKK)
 *   - "particle-verb-explain": explanation -> verb list (24 HVILKET PARTIKKELVERB?)
 *   - "particle-verb-table": marked-word sentence + ordklasse/partikkelverb table
 *     (25 ET AVSLAG – Å AVSLÅ)
 *   - "particle-verb-partisipp": verb header + perfektum partisipp forms
 *     (26 PARTIKKEL OG PARTISIPP)
 *   - "particle-verb-correction": fast/løst sammensatt correction pairs
 *     (27 LØST ELLER FAST SAMMENSATT PARTIKKELVERB?) — always needs_review,
 *     since pairing the exact verb pair from the diff needs a human look.
 *   - "particle-verb-nominalization": base verb + derived compound noun
 *     (13 ORDLAGING AV PARTIKKELVERB)
 *
 * `17 SAMMENSATTE VERB` remains excluded — see SKIPPED_SECTIONS below: it
 * drills compound TENSE mechanics (verb1/verb2 auxiliary structure), not
 * lexical particle verbs, despite its name.
 *
 * Usage (from repo root):
 *   node scripts/extract-pa-niva-b2.mjs --dry-run   (print summary only, no output files)
 *   node scripts/extract-pa-niva-b2.mjs             (also writes candidates-raw.json +
 *                                                     sections-skipped.json to
 *                                                     draft/b2/pa-niva/data/)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ARBEIDSBOK = resolve(__dirname, '../draft/b2/pa-niva/arbeidsbok-b2.md');
const FASIT = resolve(__dirname, '../draft/b2/pa-niva/arbeidsbok-b2-fasit.md');
const OUT_DIR = resolve(__dirname, '../draft/b2/pa-niva/data');

const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Section splitting
// ---------------------------------------------------------------------------

function normalizeTitle(t) {
  return t
    .replace(/🎧/g, '')
    .replace(/–/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function splitSections(text) {
  const lines = text.split('\n');
  const sections = [];
  let current = null;
  for (const line of lines) {
    const m = /^(#{1,4})\s+(.*)$/.exec(line);
    if (m) {
      if (current) sections.push(current);
      current = { level: m[1].length, rawTitle: m[2].trim(), title: normalizeTitle(m[2]), lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) sections.push(current);
  return sections;
}

const arbeidsbokSections = splitSections(readFileSync(ARBEIDSBOK, 'utf-8'));
const fasitSections = splitSections(readFileSync(FASIT, 'utf-8'));

function findFasit(title) {
  return fasitSections.find((s) => s.title === title);
}

// Loose match: ignores trailing "?"/"." so arbeidsbok "...?" headings still
// find their fasit counterpart when the fasit heading drops the punctuation
// (happens with §27).
function normalizeForMatch(t) {
  return t.replace(/[?.]+$/, '').trim();
}
function findFasitLoose(title) {
  const target = normalizeForMatch(title);
  return fasitSections.find((s) => normalizeForMatch(s.title) === target);
}

// ---------------------------------------------------------------------------
// In-scope section registry
// ---------------------------------------------------------------------------

const PARAPHRASE_SECTIONS = [
  '15 PARSETNINGER: MODALE UTTRYKKSMÅTER',
  '10 80 PARSETNINGER',
  '17 PARSETNINGER'
];

const FASTE_UTTRYKK_SECTIONS = ['12 FASTE UTTRYKK'];

const PARTICLE_VERB_EXPLAIN_SECTIONS = ['24 HVILKET PARTIKKELVERB?'];
const PARTICLE_VERB_TABLE_SECTIONS = ['25 ET AVSLAG - Å AVSLÅ'];
const PARTICLE_VERB_PARTISIPP_SECTIONS = ['26 PARTIKKEL OG PARTISIPP'];
const PARTICLE_VERB_CORRECTION_SECTIONS = ['27 LØST ELLER FAST SAMMENSATT PARTIKKELVERB?'];
const PARTICLE_VERB_NOMINALIZATION_SECTIONS = ['13 ORDLAGING AV PARTIKKELVERB'];

// Sections named in the plan's §2 as "particle-verb" that stay excluded.
const SKIPPED_SECTIONS = [
  { title: '17 SAMMENSATTE VERB', reason: 'Not a particle-verb section — drills compound tense (verb1/verb2), not lexical particle verbs. Exclude from this plan.' }
];

// ---------------------------------------------------------------------------
// Fasit answer-list parsing (paraphrase / faste-uttrykk)
// ---------------------------------------------------------------------------

// Parses a fasit body into an ordered map: key (number or letter, as string) -> answer text.
// Supports:
//   (a) single-line comma list with markers: "a) i, b) på, etter, c) til"
//       or "1) enn én side, 2) knærne, ..."
//   (b) one-per-line numbered list: "1. nødt til å"
function parseFasitAnswers(fasitSection) {
  const bodyLines = fasitSection.lines.map((l) => l.trim()).filter((l) => l.length > 0);
  const map = new Map();

  // Case (b): every non-empty line starts with "N. "
  if (bodyLines.length > 1 && bodyLines.every((l) => /^\d+\.\s/.test(l))) {
    for (const l of bodyLines) {
      const m = /^(\d+)\.\s*(.*)$/.exec(l);
      if (m) map.set(m[1], m[2].trim());
    }
    return map;
  }

  // Case (a): single (or few) lines containing "marker) text, marker) text, ..."
  const joined = bodyLines.join(' ');
  const markerRe = /(^|,\s*)([a-z]|\d+)\)\s*/g;
  const matches = [...joined.matchAll(markerRe)];
  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const key = matches[i][2];
      const start = matches[i].index + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index : joined.length;
      let val = joined.slice(start, end).trim();
      val = val.replace(/,\s*$/, '');
      map.set(key, val);
    }
    return map;
  }

  return map; // unrecognized format — empty map, caller should flag needs_review
}

// ---------------------------------------------------------------------------
// Type A: paraphrase (numbered A/B sentence reconstruction)
// ---------------------------------------------------------------------------

function extractParaphrase(section, fasitSection) {
  const candidates = [];
  const answers = fasitSection ? parseFasitAnswers(fasitSection) : new Map();

  const lines = section.lines.map((l) => l.trim());
  let i = 0;
  while (i < lines.length) {
    const aMatch = /^(\d+)\)?\s+A\s+(.+)$/.exec(lines[i]);
    if (aMatch) {
      const number = aMatch[1];
      const sentenceA = aMatch[2].trim();
      // scan forward (skipping blank lines) for the matching "B ..." line
      let j = i + 1;
      while (j < lines.length && lines[j] === '') j++;
      const bMatch = j < lines.length ? /^B\s+(.+)$/.exec(lines[j]) : null;
      if (bMatch) {
        const sentenceB = bMatch[1].trim();
        const blankCount = (sentenceB.match(/_{3,}/g) || []).length;
        const answer = answers.get(number) ?? null;
        const sentenceBFilled = answer ? sentenceB.replace(/_{3,}/, answer) : null;
        candidates.push({
          section: section.rawTitle,
          type: 'paraphrase',
          number,
          sentenceA,
          sentenceB_raw: sentenceB,
          fasit_answer: answer,
          sentenceB_filled: sentenceBFilled,
          raw_term: answer,
          needs_review: !answer || blankCount > 1
        });
        i = j + 1;
        continue;
      }
    }
    i++;
  }
  return candidates;
}

// ---------------------------------------------------------------------------
// Type B: faste uttrykk (lettered sentences + Oversett idiom-template list)
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'å', 'man', 'seg', 'noe', 'noen', 'jeg', 'du', 'meg', 'er', 'det', 'den', 'de',
  'være', 'var', 'har', 'ha', 'kan', 'må', 'vil', 'skal', 'en', 'ei', 'et',
  'som', 'på', 'til', 'av', 'om', 'i', 'for', 'med', 'og', 'så', 'ikke', 'du'
]);

// Word match: exact, or a >=4-char prefix match (crude stemming for inflected
// forms, e.g. template "glede" vs sentence "gleder").
function wordsMatch(a, b) {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  return false;
}

function wordOverlapScore(templateNoBlanks, sentence) {
  const norm = (s) =>
    s
      .toLowerCase()
      .replace(/[.,!?«»]/g, '')
      .split(/\s+/)
      .filter((w) => w && !STOPWORDS.has(w));
  const tWords = norm(templateNoBlanks);
  const sWords = norm(sentence);
  let overlap = 0;
  for (const tw of tWords) {
    if (sWords.some((sw) => wordsMatch(tw, sw))) overlap++;
  }
  return overlap;
}

function extractFasteUttrykk(section, fasitSection) {
  const candidates = [];
  const answers = fasitSection ? parseFasitAnswers(fasitSection) : new Map();

  const lines = section.lines.map((l) => l.trim());

  // 1. lettered sentences: "a) ...text with blank(s)..."
  const letteredSentences = [];
  for (const l of lines) {
    const m = /^([a-z])\)\s+(.+)$/.exec(l);
    if (m) letteredSentences.push({ letter: m[1], sentence: m[2] });
  }

  // 2. "Oversett ... = ___" template lines (norsk template before "=")
  const templates = [];
  for (const l of lines) {
    if (!l.includes('=')) continue;
    if (!/_{3,}/.test(l)) continue;
    const [beforeEq] = l.split('=');
    const template = beforeEq.trim();
    if (template) templates.push(template);
  }

  const usedLetters = new Set();
  for (const template of templates) {
    const blankCount = (template.match(/_{3,}/g) || []).length;
    const templateNoBlanks = template.replace(/_{3,}/g, '');
    // find best-matching lettered sentence by word overlap (each letter used at most once)
    let best = null;
    let bestScore = -1;
    for (const ls of letteredSentences) {
      if (usedLetters.has(ls.letter)) continue;
      const score = wordOverlapScore(templateNoBlanks, ls.sentence);
      if (score > bestScore) {
        bestScore = score;
        best = ls;
      }
    }
    if (best && bestScore > 0) usedLetters.add(best.letter);
    let filled = null;
    let answerUsed = null;
    if (best && bestScore > 0) {
      const ans = answers.get(best.letter);
      if (ans) {
        answerUsed = ans;
        const parts = ans.split(',').map((p) => p.trim());
        let filledStr = template;
        for (let k = 0; k < blankCount; k++) {
          filledStr = filledStr.replace(/_{3,}/, parts[k] ?? parts[parts.length - 1]);
        }
        filled = filledStr;
      }
    }
    candidates.push({
      section: section.rawTitle,
      type: 'faste-uttrykk',
      template,
      matched_letter: best ? best.letter : null,
      match_score: bestScore,
      matched_sentence: best ? best.sentence : null,
      fasit_answer: answerUsed,
      raw_term: filled,
      needs_review: !filled || bestScore <= 0
    });
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// Markdown table parsing helper (shared by particle-verb table sections)
// ---------------------------------------------------------------------------

function parseMarkdownTable(lines) {
  const tableLines = lines.map((l) => l.trim()).filter((l) => l.startsWith('|'));
  if (tableLines.length < 2) return null;
  const rows = tableLines.map((l) =>
    l.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
  );
  const header = rows[0];
  // rows[1] is the "---" separator row
  const data = rows.slice(2);
  return { header, data };
}

function letterKey(cell) {
  const m = /^([a-z])\)/.exec((cell || '').trim());
  return m ? m[1] : (cell || '').trim();
}

function extractBold(text) {
  const m = /\*\*(.+?)\*\*/.exec(text || '');
  return m ? m[1] : null;
}

// Splits a fasit "partikkelverb" cell like "å gå på (å pågå = å skje, ...)"
// into the bare base phrase and any parenthetical usage note.
function stripPartikkelverb(raw) {
  if (!raw) return { base: null, note: null };
  const noteMatch = /\(([^)]+)\)/.exec(raw);
  const note = noteMatch ? noteMatch[1] : null;
  let base = raw.replace(/\([^)]*\)/g, '').trim();
  base = base.replace(/^å\s+/, '');
  return { base, note };
}

// ---------------------------------------------------------------------------
// Type C: particle-verb explain-list (24 HVILKET PARTIKKELVERB?)
// ---------------------------------------------------------------------------

function extractParticleVerbExplain(section, fasitSection) {
  const candidates = [];
  const lines = fasitSection.lines.map((l) => l.trim()).filter((l) => l.length > 0);
  for (const l of lines) {
    const idx = l.lastIndexOf(':');
    if (idx === -1) continue;
    const explanation = l.slice(0, idx).trim();
    const verb = l.slice(idx + 1).trim();
    candidates.push({
      section: section.rawTitle,
      type: 'particle-verb-explain',
      explanation,
      raw_term: verb,
      needs_review: !verb
    });
  }
  return candidates;
}

// ---------------------------------------------------------------------------
// Type D: particle-verb table (25 ET AVSLAG – Å AVSLÅ)
// ---------------------------------------------------------------------------

function extractParticleVerbTable(section, fasitSection) {
  const candidates = [];
  const arbeidsTable = parseMarkdownTable(section.lines);
  const fasitTable = parseMarkdownTable(fasitSection.lines);
  if (!arbeidsTable || !fasitTable) return candidates;

  const sentenceByLetter = new Map();
  for (const row of arbeidsTable.data) {
    sentenceByLetter.set(letterKey(row[0]), row[1]);
  }

  for (const row of fasitTable.data) {
    const letter = letterKey(row[0]);
    const ordklasse = row[1];
    const partikkelverbRaw = row[2];
    const { base, note } = stripPartikkelverb(partikkelverbRaw);
    const sentence = sentenceByLetter.get(letter) || null;
    candidates.push({
      section: section.rawTitle,
      type: 'particle-verb-table',
      letter,
      sentence,
      marked_word: extractBold(sentence),
      ordklasse,
      partikkelverb_raw: partikkelverbRaw,
      raw_term: base,
      note,
      needs_review: !base
    });
  }
  return candidates;
}

// ---------------------------------------------------------------------------
// Type E: particle-verb partisipp (26 PARTIKKEL OG PARTISIPP)
// ---------------------------------------------------------------------------

function extractParticleVerbPartisipp(section, fasitSection) {
  const candidates = [];
  const headers = [];
  for (const raw of section.lines) {
    const l = raw.trim();
    const m = /^\*\*(å .+?)\*\*$/.exec(l);
    if (m) headers.push(m[1].trim());
  }

  const fasitLines = fasitSection.lines.map((l) => l.trim()).filter((l) => l.length > 0);
  const formsByVerb = new Map();
  for (const l of fasitLines) {
    const idx = l.indexOf(':');
    if (idx === -1) continue;
    const verb = l.slice(0, idx).trim();
    const forms = l.slice(idx + 1).trim();
    formsByVerb.set(verb, forms);
  }

  for (const verbRaw of headers) {
    const formsStr = formsByVerb.get(verbRaw) || null;
    candidates.push({
      section: section.rawTitle,
      type: 'particle-verb-partisipp',
      verb_raw: verbRaw,
      raw_term: verbRaw.replace(/^å\s+/, ''),
      partisipp_forms: formsStr ? formsStr.split(',').map((s) => s.trim()) : [],
      needs_review: !formsStr
    });
  }
  return candidates;
}

// ---------------------------------------------------------------------------
// Type F: particle-verb correction pairs (27 LØST ELLER FAST SAMMENSATT PARTIKKELVERB?)
// ---------------------------------------------------------------------------
// Always needs_review: identifying and isolating the exact fast/løst verb
// pair from the sentence diff is left for manual/LLM review rather than
// guessed here.

function extractParticleVerbCorrection(section, fasitSection) {
  const candidates = [];
  const original = [];
  for (const raw of section.lines) {
    const l = raw.trim();
    const m = /^☐\s+(.+)$/.exec(l);
    if (m) original.push(m[1].trim());
  }

  const fasitLines = fasitSection.lines.map((l) => l.trim());
  const riktigIdx = fasitLines.findIndex((l) => /^\*\*Riktig:\*\*$/i.test(l));
  const rettingerIdx = fasitLines.findIndex((l) => /^\*\*Rettinger:\*\*$/i.test(l));

  const riktig = new Set(
    fasitLines
      .slice(riktigIdx + 1, rettingerIdx === -1 ? undefined : rettingerIdx)
      .filter((l) => l.length > 0)
  );
  const rettinger = fasitLines.slice(rettingerIdx + 1).filter((l) => l.length > 0);

  const wrong = original.filter((s) => !riktig.has(s));

  wrong.forEach((orig, i) => {
    candidates.push({
      section: section.rawTitle,
      type: 'particle-verb-correction',
      original_sentence: orig,
      corrected_sentence: rettinger[i] || null,
      raw_term: null,
      needs_review: true
    });
  });
  return candidates;
}

// ---------------------------------------------------------------------------
// Type G: particle-verb nominalization (13 ORDLAGING AV PARTIKKELVERB)
// ---------------------------------------------------------------------------

function extractParticleVerbNominalization(section, fasitSection) {
  const candidates = [];
  const baseVerbByNr = new Map();
  for (const raw of section.lines) {
    const l = raw.trim();
    const m = /^(\d+)\)\s+(.+)$/.exec(l);
    if (m) baseVerbByNr.set(m[1], m[2].trim());
  }

  const fasitTable = parseMarkdownTable(fasitSection.lines);
  if (!fasitTable) return candidates;

  for (const row of fasitTable.data) {
    const letter = letterKey(row[0]);
    const nr = row[1];
    const ord = row[2];
    const forklaring = row[3];
    candidates.push({
      section: section.rawTitle,
      type: 'particle-verb-nominalization',
      letter,
      base_verb_nr: nr,
      base_verb: baseVerbByNr.get(nr) || null,
      raw_term: ord,
      explanation: forklaring,
      needs_review: !ord || !baseVerbByNr.get(nr)
    });
  }
  return candidates;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const allCandidates = [];
const sectionReport = [];

function runRegistry(titles, extractFn, { loose = false } = {}) {
  for (const title of titles) {
    const section = arbeidsbokSections.find((s) => s.title === title);
    if (!section) {
      sectionReport.push({ title, status: 'NOT FOUND in arbeidsbok' });
      continue;
    }
    const fasitSection = loose ? findFasitLoose(title) : findFasit(title);
    if (!fasitSection) {
      sectionReport.push({ title, status: 'NOT FOUND in fasit' });
      continue;
    }
    const cands = extractFn(section, fasitSection);
    allCandidates.push(...cands);
    sectionReport.push({
      title,
      status: 'OK',
      count: cands.length,
      needsReview: cands.filter((c) => c.needs_review).length
    });
  }
}

runRegistry(PARAPHRASE_SECTIONS, extractParaphrase);
runRegistry(FASTE_UTTRYKK_SECTIONS, extractFasteUttrykk);
runRegistry(PARTICLE_VERB_EXPLAIN_SECTIONS, extractParticleVerbExplain);
runRegistry(PARTICLE_VERB_TABLE_SECTIONS, extractParticleVerbTable);
runRegistry(PARTICLE_VERB_PARTISIPP_SECTIONS, extractParticleVerbPartisipp);
runRegistry(PARTICLE_VERB_CORRECTION_SECTIONS, extractParticleVerbCorrection, { loose: true });
runRegistry(PARTICLE_VERB_NOMINALIZATION_SECTIONS, extractParticleVerbNominalization);

console.log('Section report:');
for (const r of sectionReport) console.log(' ', JSON.stringify(r));
console.log();
console.log(`Total candidates: ${allCandidates.length}`);
console.log(`Needing review  : ${allCandidates.filter((c) => c.needs_review).length}`);
console.log();
console.log('Skipped sections (not particle verbs / not implemented):');
for (const s of SKIPPED_SECTIONS) console.log(`  - ${s.title}: ${s.reason}`);

if (!DRY_RUN) {
  writeFileSync(resolve(OUT_DIR, 'candidates-raw.json'), JSON.stringify(allCandidates, null, 2) + '\n');
  writeFileSync(resolve(OUT_DIR, 'sections-skipped.json'), JSON.stringify(SKIPPED_SECTIONS, null, 2) + '\n');
  console.log('\nWrote candidates-raw.json and sections-skipped.json');
}
