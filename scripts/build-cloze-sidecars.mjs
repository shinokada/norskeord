#!/usr/bin/env node
/**
 * build-cloze-sidecars.mjs
 *
 * Phase 0 of ai-docs/implementation/cloze-quiz.md (norskeord-private).
 *
 * For every vocab and uttrykk entry, finds the word (or short phrase) in its `example`
 * sentence that the Sentences quiz should blank, and writes it down so the app never
 * has to guess at runtime.
 *
 * Reads:
 *   - src/lib/data/{vocab,uttrykk}-{a1,a2,b1,b2,c}.json     (single source of truth)
 *   - src/lib/data/cloze-overrides.json                     (optional, hand-kept)
 *
 * Writes (all deterministic, no timestamps, so a re-run leaves them unchanged):
 *   - src/lib/data/cloze-{vocab,uttrykk}-<level>.json
 *       { [id]: { before, answer, after } }   with before + answer + after === example
 *   - src/lib/data/cloze-counts.json
 *       [{ level, category, vocab, uttrykk }]  (the QuizCategoryCount shape, no content)
 *   - scripts/outputs/cloze-report.md
 *       counts, suffix histogram, a 100-item sample to check by eye, and every entry
 *       that was NOT accepted, with the reason
 *
 * Rules, in order (see the plan, Phase 0):
 *   1. vocab, single word: whole-word, case-insensitive match of the lemma
 *   2. vocab, single word: lemma plus 1-4 letters as one whole word, unless that word is
 *      itself the lemma of another entry (blocks bil -> bilde)
 *   3. vocab, single-word verb: stem (final "e" dropped) plus er|et|te|de|a|t|e, same
 *      other-entry check
 *   4. uttrykk, and vocab of more than one word: no ? ! . in the entry (leading "å"
 *      dropped), at most 4 words, the whole phrase appears verbatim in the example.
 *      (The plan first sent multi-word vocab to review; its own 7,600 estimate counted
 *      verbatim phrases, so they are accepted here. Set MAX_PHRASE_WORDS or add skip
 *      overrides to narrow it.)
 *   5. everything else (no match, inflected multi-word verbs like "stå opp" -> "står opp")
 *      goes to the report, excluded unless
 *      cloze-overrides.json says otherwise
 * Also excluded: entries that fail isQuizableEntry, an answer of 2 letters or fewer, and
 * an entry that matches more than once in its sentence (ambiguous blank).
 *
 * cloze-overrides.json, keyed by id:
 *   { "w-000123": { "answer": "viste fram" } }   force the blanked substring of the example
 *   { "w-000123": { "answer": "er", "nth": 1 } } nth = 0-based occurrence (default 0)
 *   { "w-000123": { "skip": true } }              never quiz this entry
 *   "note" is allowed for your own comments.
 *
 * Safety checks: exits non-zero, and writes nothing, when a data file cannot be read, an
 * id is missing or duplicated, or an override is stale (unknown id, answer not found in
 * the example, unknown key).
 *
 * Usage (from project root):
 *   pnpm cloze:build
 *   node scripts/build-cloze-sidecars.mjs
 *
 * Not part of `pnpm dev` / `pnpm build`: run it after editing examples or overrides.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(process.env.CLOZE_DATA_DIR ?? resolve(__dirname, '../src/lib/data'));
const OUT_DIR = resolve(process.env.CLOZE_OUT_DIR ?? DATA_DIR);
const REPORT_DIR = resolve(process.env.CLOZE_REPORT_DIR ?? resolve(__dirname, 'outputs'));
const REPORT_FILE = resolve(REPORT_DIR, 'cloze-report.md');
const OVERRIDES_FILE = resolve(DATA_DIR, 'cloze-overrides.json');

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C'];
const TYPES = ['vocab', 'uttrykk'];
const MAX_PHRASE_WORDS = 4;
const MIN_ANSWER_LETTERS = 3;
const SAMPLE_SIZE = 100;
const VERB_SUFFIXES = ['er', 'et', 'te', 'de', 'a', 't', 'e'];
const OVERRIDE_KEYS = new Set(['answer', 'nth', 'skip', 'note']);

// ── Helpers (kept in step with src/lib/quiz.ts and quiz-gate.ts) ─────────────────────────

/** Same as bareLemma in src/lib/quiz.ts. */
function bareLemma(norsk) {
  return norsk
    .replace(/^å\s+/i, '')
    .replace(/\s*\((en|ei|et)(\s*\/\s*(en|ei|et))*\)\s*$/i, '')
    .trim();
}

/** Same rule as isQuizableEntry in src/lib/quiz-gate.ts (B2 and C need a definition). */
function isQuizableEntry(entry) {
  const monolingual = entry.level === 'B2' || entry.level === 'C';
  return !monolingual || !!entry.definition;
}

const isWordChar = (ch) => /[\p{L}\p{N}-]/u.test(ch);
const isSingleWord = (s) => /^[\p{L}\p{N}-]+$/u.test(s);

/** Words of a sentence with their positions. Hyphen/apostrophe inside a word stays in it. */
function tokenise(text) {
  const out = [];
  const re = /[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/** All whole-word, case-insensitive occurrences of `phrase` in `text`. */
function findPhrase(text, phrase) {
  const hay = text.toLowerCase();
  const needle = phrase.toLowerCase();
  if (!needle || hay.length !== text.length) return [];
  const out = [];
  let from = 0;
  for (;;) {
    const i = hay.indexOf(needle, from);
    if (i === -1) break;
    const end = i + needle.length;
    const beforeOk = i === 0 || !isWordChar(text[i - 1]);
    const afterOk = end === text.length || !isWordChar(text[end]);
    if (beforeOk && afterOk) out.push({ start: i, end });
    from = i + 1;
  }
  return out;
}

const letterCount = (s) => (s.match(/[\p{L}\p{N}]/gu) ?? []).length;
const lc = (s) => s.trim().toLowerCase();

/** Lowercased, de-duplicated single-word forms of an entry: bareLemma(norsk) and lemma. */
function singleWordForms(entry) {
  const forms = [bareLemma(entry.norsk), entry.lemma ?? ''].map(lc).filter(Boolean);
  return [...new Set(forms.filter(isSingleWord))];
}

// ── Load ────────────────────────────────────────────────────────────────────────────────

const errors = [];
const warnings = [];
const sources = []; // { level, type, file, entries }
const entryById = new Map(); // id -> { entry, type, file }

for (const level of LEVELS) {
  for (const type of TYPES) {
    const file = `${type}-${level.toLowerCase()}.json`;
    let entries;
    try {
      entries = JSON.parse(readFileSync(resolve(DATA_DIR, file), 'utf-8'));
    } catch (err) {
      errors.push(
        `${file}: cannot read or parse (${err.message}). ` +
          'Is the src/lib/data submodule checked out? (git submodule update --init)'
      );
      continue;
    }
    if (!Array.isArray(entries)) {
      errors.push(`${file} did not parse to an array (got ${typeof entries})`);
      continue;
    }
    for (const e of entries) {
      if (typeof e?.id !== 'string' || e.id === '') {
        errors.push(`${file}: an entry has no id (norsk: ${JSON.stringify(e?.norsk)})`);
        continue;
      }
      if (typeof e.norsk !== 'string' || typeof e.example !== 'string') {
        errors.push(`${file}: ${e.id} has no norsk or no example`);
        continue;
      }
      if (entryById.has(e.id)) {
        errors.push(`duplicate id ${e.id}: in ${entryById.get(e.id).file} and ${file}`);
        continue;
      }
      entryById.set(e.id, { entry: e, type, file });
    }
    sources.push({ level, type, file, entries });
  }
}

// Which entry ids own each single-word lemma. Used to block rule 2/3 false positives.
const lemmaOwners = new Map();
for (const { entry, type } of entryById.values()) {
  if (type !== 'vocab') continue;
  for (const form of singleWordForms(entry)) {
    if (!lemmaOwners.has(form)) lemmaOwners.set(form, new Set());
    lemmaOwners.get(form).add(entry.id);
  }
}
const isOtherEntrysLemma = (word, id) => {
  const owners = lemmaOwners.get(word);
  if (!owners) return false;
  for (const o of owners) if (o !== id) return true;
  return false;
};

// Overrides
let overrides = {};
if (existsSync(OVERRIDES_FILE)) {
  try {
    overrides = JSON.parse(readFileSync(OVERRIDES_FILE, 'utf-8'));
  } catch (err) {
    errors.push(`cloze-overrides.json: cannot parse (${err.message})`);
  }
}
for (const [id, o] of Object.entries(overrides)) {
  if (!entryById.has(id)) errors.push(`cloze-overrides.json: unknown id ${id}`);
  if (o === null || typeof o !== 'object' || Array.isArray(o)) {
    errors.push(`cloze-overrides.json: ${id} must be an object`);
    continue;
  }
  for (const k of Object.keys(o)) {
    if (!OVERRIDE_KEYS.has(k)) errors.push(`cloze-overrides.json: ${id} has unknown key "${k}"`);
  }
  if (o.skip === undefined && typeof o.answer !== 'string') {
    errors.push(`cloze-overrides.json: ${id} needs "answer" (string) or "skip": true`);
  }
}

// ── Match ───────────────────────────────────────────────────────────────────────────────

/**
 * Hits for a single-word vocab entry: [{ start, end, rule }]. One entry per token that
 * passes rule 1, 2 or 3 (lowest rule number wins for that token).
 */
function vocabHits(entry) {
  const forms = singleWordForms(entry);
  if (forms.length === 0) return [];
  const isVerb = entry.part === 'verb';
  const hits = [];
  for (const tok of tokenise(entry.example)) {
    const t = tok.text.toLowerCase();
    let rule = 0;
    if (forms.includes(t)) {
      rule = 1;
    } else if (
      forms.some((f) => t.startsWith(f) && t.length - f.length >= 1 && t.length - f.length <= 4)
    ) {
      if (!isOtherEntrysLemma(t, entry.id)) rule = 2;
    }
    if (rule === 0 && isVerb) {
      for (const f of forms) {
        if (!f.endsWith('e') || f.length < 3) continue;
        const stem = f.slice(0, -1);
        if (VERB_SUFFIXES.some((s) => t === stem + s) && !isOtherEntrysLemma(t, entry.id)) {
          rule = 3;
          break;
        }
      }
    }
    if (rule) hits.push({ start: tok.start, end: tok.end, rule });
  }
  return hits;
}

/** Result of matching one entry: { item } when accepted, else { reason, suggestion? }. */
function matchEntry(entry, type) {
  const example = entry.example;
  const ov = overrides[entry.id];

  if (ov?.skip) return { reason: 'skip-override' };
  if (ov && typeof ov.answer === 'string') {
    const nth = Number.isInteger(ov.nth) ? ov.nth : 0;
    const positions = [];
    let from = 0;
    for (;;) {
      const i = example.indexOf(ov.answer, from);
      if (i === -1) break;
      positions.push(i);
      from = i + 1;
    }
    if (positions.length <= nth) {
      errors.push(
        `cloze-overrides.json: ${entry.id} answer ${JSON.stringify(ov.answer)} ` +
          `(nth ${nth}) not found in example ${JSON.stringify(example)}`
      );
      return { reason: 'bad-override' };
    }
    const start = positions[nth];
    return accept(example, start, start + ov.answer.length, 'override');
  }

  // Rule 4: a whole phrase that appears verbatim in the example. All uttrykk, and vocab
  // entries that are more than one word (phrasal and reflexive verbs, fixed phrases).
  // The leading "å" is dropped (bareLemma), so "å ta imot" matches "... ta imot ...".
  const base = bareLemma(entry.norsk);
  if (type === 'uttrykk' || !isSingleWord(lc(base))) {
    const prefix = type === 'uttrykk' ? 'uttrykk' : 'multi-word';
    if (/[?!.]/.test(base)) return { reason: `${prefix}-punctuation` };
    if (base.split(/\s+/).length > MAX_PHRASE_WORDS) return { reason: `${prefix}-too-long` };
    const found = findPhrase(example, base);
    if (found.length === 0) return { reason: `${prefix}-not-verbatim` };
    if (found.length > 1) return { reason: 'ambiguous' };
    return accept(example, found[0].start, found[0].end, 4);
  }

  // vocab, single word
  const hits = vocabHits(entry);
  if (hits.length === 0) return { reason: 'no-match' };
  if (hits.length > 1) return { reason: 'ambiguous' };
  return accept(example, hits[0].start, hits[0].end, hits[0].rule);
}

function accept(example, start, end, rule) {
  const answer = example.slice(start, end);
  if (letterCount(answer) < MIN_ANSWER_LETTERS) return { reason: 'too-short' };
  return {
    item: { before: example.slice(0, start), answer, after: example.slice(end) },
    rule
  };
}

// ── Run ─────────────────────────────────────────────────────────────────────────────────

const REASONS = [
  'no-match',
  'ambiguous',
  'too-short',
  'multi-word-not-verbatim',
  'multi-word-too-long',
  'multi-word-punctuation',
  'uttrykk-punctuation',
  'uttrykk-too-long',
  'uttrykk-not-verbatim'
];

const stats = {}; // `${level}|${type}` -> counters
const sidecars = {}; // file name -> { id: item }
const accepted = []; // { id, level, type, category, rule, entry, item }
const review = {}; // reason -> [{ entry, level, type, suggestion }]
for (const r of REASONS) review[r] = [];
const countsByKey = new Map();

for (const { level, type, entries } of sources) {
  const s = (stats[`${level}|${type}`] = {
    entries: entries.length,
    notQuizable: 0,
    skipped: 0,
    accepted: 0,
    rules: { 1: 0, 2: 0, 3: 0, 4: 0, override: 0 },
    review: Object.fromEntries(REASONS.map((r) => [r, 0]))
  });
  const sidecar = {};
  for (const entry of entries) {
    if (!entry?.id || !entryById.has(entry.id)) continue;
    if (!isQuizableEntry(entry)) {
      s.notQuizable++;
      if (overrides[entry.id]) {
        warnings.push(`override for ${entry.id} ignored: entry is not quizable (no definition)`);
      }
      continue;
    }
    const res = matchEntry(entry, type);
    if (res.reason === 'skip-override') {
      s.skipped++;
      continue;
    }
    if (res.reason === 'bad-override') continue;
    if (res.item) {
      sidecar[entry.id] = res.item;
      s.accepted++;
      s.rules[res.rule]++;
      accepted.push({ id: entry.id, level, type, rule: res.rule, entry, item: res.item });
      const key = `${level}|${entry.category}`;
      let row = countsByKey.get(key);
      if (!row) {
        row = { level, category: entry.category, vocab: 0, uttrykk: 0 };
        countsByKey.set(key, row);
      }
      row[type]++;
    } else {
      s.review[res.reason]++;
      review[res.reason].push({ entry, level, type, suggestion: res.suggestion ?? '' });
    }
  }
  sidecars[`cloze-${type}-${level.toLowerCase()}.json`] = sidecar;
}

// Sanity: every accepted item rebuilds its example exactly.
for (const a of accepted) {
  if (a.item.before + a.item.answer + a.item.after !== a.entry.example) {
    errors.push(`${a.id}: before + answer + after does not equal the example`);
  }
}

if (errors.length > 0) {
  console.error(`Cloze sidecars not written, ${errors.length} problem(s):`);
  for (const e of errors.slice(0, 30)) console.error(`  ${e}`);
  if (errors.length > 30) console.error(`  ...and ${errors.length - 30} more`);
  process.exit(1);
}

// ── Serialise ───────────────────────────────────────────────────────────────────────────

function serializeSidecar(obj) {
  const lines = Object.entries(obj).map(
    ([id, item]) => `  ${JSON.stringify(id)}: ${JSON.stringify(item)}`
  );
  return lines.length > 0 ? `{\n${lines.join(',\n')}\n}\n` : '{}\n';
}

const LEVEL_ORDER = Object.fromEntries(LEVELS.map((l, i) => [l, i]));
const counts = [...countsByKey.values()].sort(
  (a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.category.localeCompare(b.category)
);
const serializeCounts = (rows) =>
  rows.length > 0 ? `[\n${rows.map((r) => `  ${JSON.stringify(r)}`).join(',\n')}\n]\n` : '[]\n';

// ── Report ──────────────────────────────────────────────────────────────────────────────

const cell = (s) =>
  String(s ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\s+/g, ' ')
    .trim();
/** Like cell, but keeps leading and trailing spaces (the parts around the bold answer). */
const cellKeep = (s) =>
  String(s ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\s+/g, ' ');
const pct = (n, d) => (d === 0 ? '–' : `${((n / d) * 100).toFixed(1)}%`);

function buildReport() {
  const out = [];
  out.push('# Cloze sidecar report', '');
  out.push(
    'Written by `scripts/build-cloze-sidecars.mjs` (ai-docs/implementation/cloze-quiz.md, Phase 0).',
    'Deterministic: re-running without changes gives the same file.',
    ''
  );

  out.push('## Coverage', '');
  out.push(
    '| Level | Type | Entries | Not quizable | Skipped | Accepted | Rule 1 | Rule 2 | Rule 3 | Rule 4 | Override | Review | Coverage |',
    '| ----- | ---- | ------: | -----------: | ------: | -------: | -----: | -----: | -----: | -----: | -------: | -----: | -------: |'
  );
  const total = {
    entries: 0,
    notQuizable: 0,
    skipped: 0,
    accepted: 0,
    r1: 0,
    r2: 0,
    r3: 0,
    r4: 0,
    ov: 0,
    review: 0
  };
  const perType = {
    vocab: { quizable: 0, accepted: 0 },
    uttrykk: { quizable: 0, accepted: 0 }
  };
  for (const level of LEVELS) {
    for (const type of TYPES) {
      const s = stats[`${level}|${type}`];
      if (!s) continue;
      const reviewN = Object.values(s.review).reduce((a, b) => a + b, 0);
      const quizable = s.entries - s.notQuizable - s.skipped;
      out.push(
        `| ${level} | ${type} | ${s.entries} | ${s.notQuizable} | ${s.skipped} | ${s.accepted} | ` +
          `${s.rules[1]} | ${s.rules[2]} | ${s.rules[3]} | ${s.rules[4]} | ${s.rules.override} | ` +
          `${reviewN} | ${pct(s.accepted, quizable)} |`
      );
      total.entries += s.entries;
      total.notQuizable += s.notQuizable;
      total.skipped += s.skipped;
      total.accepted += s.accepted;
      total.r1 += s.rules[1];
      total.r2 += s.rules[2];
      total.r3 += s.rules[3];
      total.r4 += s.rules[4];
      total.ov += s.rules.override;
      total.review += reviewN;
      perType[type].quizable += quizable;
      perType[type].accepted += s.accepted;
    }
  }
  out.push(
    `| **Total** | | ${total.entries} | ${total.notQuizable} | ${total.skipped} | ${total.accepted} | ` +
      `${total.r1} | ${total.r2} | ${total.r3} | ${total.r4} | ${total.ov} | ${total.review} | ` +
      `${pct(total.accepted, total.entries - total.notQuizable - total.skipped)} |`,
    ''
  );
  out.push(
    `Vocab: ${perType.vocab.accepted} of ${perType.vocab.quizable} quizable entries ` +
      `(${pct(perType.vocab.accepted, perType.vocab.quizable)}). ` +
      `Uttrykk: ${perType.uttrykk.accepted} of ${perType.uttrykk.quizable} ` +
      `(${pct(perType.uttrykk.accepted, perType.uttrykk.quizable)}).`,
    ''
  );

  out.push('## Not accepted, by reason', '');
  out.push('| Reason | Entries |', '| ------ | ------: |');
  for (const r of REASONS) out.push(`| ${r} | ${review[r].length} |`);
  out.push('');

  // Suffix histogram for rule 2 and 3: a quick way to spot a bad ending.
  const suffixes = new Map();
  for (const a of accepted) {
    if (a.rule !== 2 && a.rule !== 3) continue;
    const forms = singleWordForms(a.entry);
    const ans = a.item.answer.toLowerCase();
    let suffix;
    if (a.rule === 2) {
      const f = forms.find((x) => ans.startsWith(x));
      suffix = f ? `+${ans.slice(f.length)}` : '?';
    } else {
      const f = forms.find((x) => x.endsWith('e') && ans.startsWith(x.slice(0, -1)));
      suffix = f ? `-e+${ans.slice(f.length - 1)}` : '?';
    }
    suffixes.set(suffix, (suffixes.get(suffix) ?? 0) + 1);
  }
  out.push('## Endings accepted by rules 2 and 3', '');
  out.push('A suffix that is mostly wrong should become a rule fix or `skip` overrides.', '');
  out.push('| Ending | Items |', '| ------ | ----: |');
  [...suffixes.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .forEach(([s, n]) => out.push(`| ${s} | ${n} |`));
  out.push('');

  // Deterministic sample of auto-accepted rule 2/3 items.
  const pool = accepted
    .filter((a) => a.rule === 2 || a.rule === 3)
    .sort((a, b) => a.id.localeCompare(b.id));
  const step = Math.max(1, Math.floor(pool.length / SAMPLE_SIZE));
  const sample = pool.filter((_, i) => i % step === 0).slice(0, SAMPLE_SIZE);
  out.push(`## Sample of ${sample.length} auto-accepted items (rules 2 and 3)`, '');
  out.push(
    `Every ${step}th item by id, ${pool.length} candidates. Check each by eye.`,
    '',
    '| Id | Level | Rule | Entry | Answer | Example |',
    '| -- | ----- | ---: | ----- | ------ | ------- |'
  );
  for (const a of sample) {
    out.push(
      `| ${a.id} | ${a.level} | ${a.rule} | ${cell(a.entry.norsk)} | ${cell(a.item.answer)} | ` +
        `${cellKeep(a.item.before)}**${cell(a.item.answer)}**${cellKeep(a.item.after)} |`
    );
  }
  out.push('');

  out.push('## Entries not accepted (review list)', '');
  out.push(
    'To include one, add an override in `src/lib/data/cloze-overrides.json`, for example ' +
      '`{ "w-000123": { "answer": "viste fram" } }`. `answer` must be a substring of the example.',
    ''
  );
  for (const r of REASONS) {
    const rows = review[r];
    if (rows.length === 0) continue;
    out.push(`### ${r} (${rows.length})`, '');
    out.push('| Id | Level | Type | Entry | Example | Suggestion |');
    out.push('| -- | ----- | ---- | ----- | ------- | ---------- |');
    for (const row of rows) {
      out.push(
        `| ${row.entry.id} | ${row.level} | ${row.type} | ${cell(row.entry.norsk)} | ` +
          `${cell(row.entry.example)} | ${cell(row.suggestion)} |`
      );
    }
    out.push('');
  }

  if (warnings.length > 0) {
    out.push('## Warnings', '');
    for (const w of warnings) out.push(`- ${w}`);
    out.push('');
  }
  return out.join('\n');
}

// ── Write ───────────────────────────────────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(REPORT_DIR, { recursive: true });
for (const [file, obj] of Object.entries(sidecars)) {
  writeFileSync(resolve(OUT_DIR, file), serializeSidecar(obj), 'utf-8');
}
writeFileSync(resolve(OUT_DIR, 'cloze-counts.json'), serializeCounts(counts), 'utf-8');
writeFileSync(REPORT_FILE, buildReport(), 'utf-8');

const acceptedTotal = accepted.length;
const quizableTotal = [...Object.values(stats)].reduce(
  (n, s) => n + s.entries - s.notQuizable - s.skipped,
  0
);
for (const type of TYPES) {
  const n = accepted.filter((a) => a.type === type).length;
  console.log(`   ${type}: ${n} items`);
}
console.log(
  `✅  cloze sidecars: ${acceptedTotal} of ${quizableTotal} quizable entries ` +
    `(${pct(acceptedTotal, quizableTotal)}), ${counts.length} level/category rows`
);
if (warnings.length > 0) console.log(`⚠️   ${warnings.length} warning(s), see the report`);
console.log(`    report: ${REPORT_FILE}`);
