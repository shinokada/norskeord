#!/usr/bin/env node
/**
 * validate-definition-batches.mjs
 *
 * Validates the definitions Claude Desktop wrote (see
 * ai-docs/implementation/add-definition-a1-a2.md, Part 3).
 *
 * Usage:
 *   node scripts/validate-definition-batches.mjs --level a1 [--batch 003]
 *
 * Reads:
 *   src/lib/data/vocab-{level}.json
 *   draft/definitions/{level}/input/batch-NNN.json          (expected ids)
 *   draft/definitions/{level}/output/batch-NNN.json         (Claude Desktop output)
 *   draft/definitions/{level}/output/batch-NNN.redo-K.json  (redo rounds, applied in order K=1,2,...)
 *
 * Writes:
 *   draft/definitions/{level}/rejected/batch-NNN.json   entries to redo (removed when none)
 *   draft/definitions/report-{level}.md                 full report
 *
 * Hard checks reject an entry. Warnings never reject; they are for human review.
 * Exit code is 1 when any entry is rejected, otherwise 0.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'src', 'lib', 'data');
const WORK_DIR = path.join(ROOT, 'draft', 'definitions');
const FIELDS = ['id', 'norsk', 'english', 'example', 'part', 'category'];

// aim = guidance in instructions.md, warn = report only, max = hard reject
const LIMITS = {
  a1: { aim: 8, warn: 12, max: 15 },
  a2: { aim: 12, warn: 16, max: 20 }
};
const UNKNOWN_RATIO_WARN = 0.4;

// Function words that never count as "headword" content in multi-word headwords.
const HEAD_FUNCTION_WORDS = new Set([
  'å',
  'av',
  'til',
  'på',
  'i',
  'ut',
  'opp',
  'ned',
  'inn',
  'med',
  'om',
  'for',
  'seg',
  'en',
  'et',
  'ei',
  'ha',
  'som',
  'den',
  'det'
]);

// English words that should never appear in a Norwegian definition.
// (Words that are also Norwegian, such as "is", "to", "and", "be", "for", "a", are left out.)
const ENGLISH_WORDS = new Set([
  'the',
  'are',
  'when',
  'that',
  'which',
  'used',
  'of',
  'with',
  'you',
  'your',
  'someone',
  'something',
  'people',
  'this',
  'from',
  'they',
  'have',
  'what',
  'who'
]);

// Very common words and the sentence frames from instructions.md; never "unknown".
const ALLOWED_WORDS = new Set(
  `og eller men som man noe ting det den de en et ei å at til for med på av i fra om ikke er har kan vil
	skal ble blir var være ha så ved seg deg meg dere du jeg vi han hun dette denne alle annen andre mer
	mye lite mange flere hver hvor når hvis fordi hva hvem før etter mellom under over ord brukes sier
	tallet nummer rekke eksempel ofte noen noe ganger ennå helt veldig gjerne også bare ned opp ut inn
	da der her dit nå ja nei gjøre gjør gjort får få fikk går gå kommer komme ser se tar ta gir gi`
    .split(/\s+/)
    .filter(Boolean)
);

// Openers by part of speech (warning only).
const WORD_OPENER = /^(Et ord|Ord)\s/;
const OPENERS = {
  // En/Et/Ei preferred; Noe (rule 11), time words (rule 12) and kinship (rule 11) are allowed.
  noun: /^(En|Et|Ei|Den|Det|De|Noe|Dagen|Måneden|Tiden|Moren|Faren|Sønnen|Datteren|Broren|Søsteren|Barnet)\s/,
  verb: /^Å\s/,
  adjective: /^(Som|Nummer)\s/,
  adverb: WORD_OPENER,
  preposition: WORD_OPENER,
  conjunction: WORD_OPENER,
  pronoun: WORD_OPENER,
  interjection: WORD_OPENER,
  numeral: /^(Tallet|Nummer)\s/
};

// ---------- args ----------

function parseArgs(argv) {
  const args = { level: null, batch: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--level') args.level = (argv[++i] ?? '').toLowerCase();
    else if (a === '--batch') args.batch = String(argv[++i] ?? '').padStart(3, '0');
    else if (a === '--help' || a === '-h') args.help = true;
    else fail(`Unknown argument: ${a}`);
  }
  return args;
}

function fail(msg) {
  console.error(`Error: ${msg}`);
  process.exit(2);
}

// ---------- helpers ----------

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const tokens = (s) =>
  String(s)
    .toLowerCase()
    .match(/\p{L}+/gu) ?? [];
const wordCount = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

function headTokens(norsk) {
  const t = tokens(String(norsk).replace(/\([^)]*\)/g, ' '));
  const content = t.filter((w) => !HEAD_FUNCTION_WORDS.has(w));
  if (content.length) return content;
  // All words are function words (e.g. "å ha"): drop only the infinitive marker "å",
  // otherwise every definition containing "å" is wrongly rejected as circular.
  const withoutInfinitive = t.filter((w) => w !== 'å');
  return withoutInfinitive.length ? withoutInfinitive : t;
}

function isFamily(a, b) {
  const min = Math.min(a.length, b.length);
  return min >= 4 && Math.abs(a.length - b.length) <= 3 && (a.startsWith(b) || b.startsWith(a));
}

function buildKnownWords(levels) {
  const known = new Set();
  for (const lv of levels) {
    const file = path.join(DATA_DIR, `vocab-${lv}.json`);
    if (!fs.existsSync(file)) continue;
    for (const e of readJson(file)) {
      for (const t of tokens(String(e.norsk ?? '').replace(/\([^)]*\)/g, ' '))) known.add(t);
      for (const t of tokens(e.example ?? '')) known.add(t);
      if (e.lemma) for (const t of tokens(e.lemma)) known.add(t);
    }
  }
  const longKnown = [...known].filter((k) => k.length >= 4);
  return (t) =>
    known.has(t) ||
    ALLOWED_WORDS.has(t) ||
    /^\d+$/.test(t) ||
    (t.length >= 4 && longKnown.some((k) => isFamily(t, k)));
}

function listBatchNumbers(dir, re) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((f) => re.exec(f))
    .filter(Boolean)
    .map((m) => m[1]);
}

// ---------- validation of one definition ----------

function validateRow(row, entry, limits, isKnown) {
  const rejects = [];
  const warns = [];
  const def = row.definition;

  if (typeof def !== 'string' || def.trim() === '') {
    return { rejects: ['definition is empty or not a string'], warns };
  }
  const d = def.trim();

  if (!/^\p{Lu}/u.test(d)) rejects.push('does not start with a capital letter');
  if (!d.endsWith('.')) rejects.push('does not end with a period');
  if (/["“”«»()[\]{}]/.test(d)) rejects.push('contains quotes or brackets');

  const n = wordCount(d);
  if (n > limits.max) rejects.push(`too long: ${n} words (hard ceiling ${limits.max})`);
  else if (n > limits.warn) warns.push(`long: ${n} words (warning above ${limits.warn})`);

  const defTokens = tokens(d);
  const heads = headTokens(entry.norsk);

  const exact = heads.filter((h) => defTokens.includes(h));
  if (exact.length) rejects.push(`circular: uses headword "${exact.join('", "')}"`);
  else {
    const fam = [];
    for (const h of heads) for (const t of defTokens) if (isFamily(h, t)) fam.push(`${t}~${h}`);
    if (fam.length) warns.push(`possible same-word-family: ${[...new Set(fam)].join(', ')}`);
  }

  const english = defTokens.filter((t) => ENGLISH_WORDS.has(t));
  if (english.length) rejects.push(`English words: ${[...new Set(english)].join(', ')}`);

  const ex = String(entry.example ?? '')
    .trim()
    .toLowerCase();
  if (ex && (d.toLowerCase() === ex || d.toLowerCase().includes(ex.replace(/[.!?]+$/, '')))) {
    rejects.push('copies the example sentence');
  }

  // warnings
  const sentenceBreaks = d.slice(0, -1).match(/[.!?]\s/g);
  if (sentenceBreaks) warns.push('more than one sentence');

  const opener = OPENERS[entry.part];
  if (opener && !opener.test(d))
    warns.push(`opener unusual for ${entry.part}: "${d.split(' ').slice(0, 2).join(' ')}…"`);

  const unknown = defTokens.filter((t) => !isKnown(t));
  if (defTokens.length && unknown.length / defTokens.length > UNKNOWN_RATIO_WARN) {
    warns.push(`hard vocabulary? unknown words: ${[...new Set(unknown)].join(', ')}`);
  }

  if (row.flag) warns.push(`model flag: ${row.flag}`);
  const extra = Object.keys(row).filter((k) => !['id', 'definition', 'flag'].includes(k));
  if (extra.length) warns.push(`unexpected fields: ${extra.join(', ')}`);

  return { rejects, warns };
}

// ---------- main ----------

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.level) {
  console.log('Usage: node scripts/validate-definition-batches.mjs --level a1|a2 [--batch 003]');
  process.exit(args.help ? 0 : 2);
}
if (!LIMITS[args.level]) fail('--level must be a1 or a2');

const level = args.level;
const limits = LIMITS[level];
const vocabFile = path.join(DATA_DIR, `vocab-${level}.json`);
if (!fs.existsSync(vocabFile)) fail(`Not found: ${vocabFile}`);

const vocab = readJson(vocabFile);
const byId = new Map(vocab.map((e) => [e.id, e]));
const isKnown = buildKnownWords(level === 'a1' ? ['a1'] : ['a1', 'a2']);

const levelDir = path.join(WORK_DIR, level);
const inputDir = path.join(levelDir, 'input');
const outputDir = path.join(levelDir, 'output');
const rejectedDir = path.join(levelDir, 'rejected');
fs.mkdirSync(rejectedDir, { recursive: true });

const outputNums = listBatchNumbers(outputDir, /^batch-(\d+)\.json$/);
const inputNums = listBatchNumbers(inputDir, /^batch-(\d+)\.json$/);
let batchNums = [...new Set([...outputNums, ...inputNums])].sort();
if (args.batch) batchNums = batchNums.filter((n) => n === args.batch);
if (!batchNums.length) fail('No matching batches found.');

const report = [];
const summary = [];
let totalRejected = 0;
let totalWarned = 0;
const lengths = [];

for (const num of batchNums) {
  const name = `batch-${num}`;
  const outFile = path.join(outputDir, `${name}.json`);
  const inFile = path.join(inputDir, `${name}.json`);

  if (!fs.existsSync(outFile)) {
    summary.push({
      batch: name,
      status: 'pending (no output yet)',
      entries: '',
      rejected: '',
      warnings: ''
    });
    continue;
  }

  // Effective rows: main output, overridden by redo rounds in numeric order.
  const rows = new Map();
  const problems = [];
  let outputRows;
  try {
    outputRows = readJson(outFile);
    if (!Array.isArray(outputRows)) throw new Error('not a JSON array');
  } catch (err) {
    summary.push({
      batch: name,
      status: `INVALID JSON: ${err.message}`,
      entries: '',
      rejected: '',
      warnings: ''
    });
    totalRejected++;
    continue;
  }
  const seen = new Set();
  for (const r of outputRows) {
    if (!r || typeof r !== 'object' || typeof r.id !== 'string') {
      problems.push('output contains a row without a string id');
      continue;
    }
    if (seen.has(r.id)) problems.push(`duplicate id ${r.id}`);
    seen.add(r.id);
    rows.set(r.id, r);
  }
  const redoNums = listBatchNumbers(outputDir, new RegExp(`^${name}\\.redo-(\\d+)\\.json$`))
    .map(Number)
    .sort((a, b) => a - b);
  for (const k of redoNums) {
    try {
      for (const r of readJson(path.join(outputDir, `${name}.redo-${k}.json`))) {
        if (r && typeof r.id === 'string') rows.set(r.id, r);
      }
    } catch (err) {
      problems.push(`redo-${k} is not valid JSON: ${err.message}`);
    }
  }

  // Expected ids: input batch if present; otherwise (e.g. the chat pilot) the ids in the output.
  let expected;
  if (fs.existsSync(inFile)) {
    try {
      const inputEntries = readJson(inFile);
      if (!Array.isArray(inputEntries)) throw new Error('not a JSON array');
      expected = inputEntries.map((e) => e.id);
    } catch (err) {
      summary.push({
        batch: name,
        status: `INVALID INPUT: ${err.message}`,
        entries: '',
        rejected: '',
        warnings: ''
      });
      totalRejected++;
      continue;
    }
  } else {
    expected = [...rows.keys()];
  }
  const expectedSet = new Set(expected);
  const unknownIds = [...rows.keys()].filter((id) => !expectedSet.has(id));
  for (const id of unknownIds) problems.push(`unknown id ${id}`);

  const rejected = [];
  let warned = 0;
  const detail = [];

  for (const id of expected) {
    const entry = byId.get(id);
    const row = rows.get(id);
    if (!entry) {
      rejected.push({ id, problem: 'id not found in vocab file' });
      continue;
    }
    if (!row) {
      rejected.push({ id, problem: 'missing from output', entry });
      detail.push({ entry, def: '', rejects: ['missing from output'], warns: [] });
      continue;
    }
    const { rejects, warns } = validateRow(row, entry, limits, isKnown);
    if (typeof row.definition === 'string') lengths.push(wordCount(row.definition));
    if (rejects.length) rejected.push({ id, problem: rejects.join('; '), entry });
    if (warns.length) warned++;
    if (rejects.length || warns.length)
      detail.push({ entry, def: row.definition ?? '', rejects, warns });
  }

  // rejected/batch-NNN.json (input format + problem), or removed when clean.
  const rejFile = path.join(rejectedDir, `${name}.json`);
  const rejRows = rejected
    .filter((r) => r.entry)
    .map((r) => ({
      ...Object.fromEntries(FIELDS.map((k) => [k, r.entry[k] ?? ''])),
      problem: r.problem
    }));
  if (rejRows.length) fs.writeFileSync(rejFile, JSON.stringify(rejRows, null, 2) + '\n');
  else if (fs.existsSync(rejFile)) fs.unlinkSync(rejFile);

  totalRejected += rejected.length + (problems.length ? 1 : 0);
  totalWarned += warned;
  summary.push({
    batch: name,
    status: rejected.length || problems.length ? 'needs redo' : 'ok',
    entries: expected.length,
    rejected: rejected.length,
    warnings: warned
  });

  if (detail.length || problems.length) {
    report.push(`### ${name}\n`);
    for (const p of problems) report.push(`- **File problem:** ${p}`);
    for (const d of detail) {
      report.push(
        `- \`${d.entry.id}\` **${d.entry.norsk}** (${d.entry.english}): ${d.def || '_none_'}`
      );
      for (const r of d.rejects) report.push(`  - REJECT: ${r}`);
      for (const w of d.warns) report.push(`  - warn: ${w}`);
    }
    report.push('');
  }

  if (rejRows.length) {
    const next = (redoNums.length ? Math.max(...redoNums) : 0) + 1;
    summary[summary.length - 1].redo =
      `Read draft/definitions/instructions.md, then read draft/definitions/${level}/rejected/${name}.json.\n` +
      `Each entry has a "problem" field: write a new definition that fixes it.\n` +
      `Save the result as draft/definitions/${level}/output/${name}.redo-${next}.json.\n` +
      `Do not modify any other file. When finished, say only "done" and the entry count.`;
  }
}

// ---------- output ----------

console.log(
  `\nLevel ${level.toUpperCase()}  (aim ~${limits.aim}, warn >${limits.warn}, reject >${limits.max} words)\n`
);
console.table(
  summary.map((s) => {
    const row = { ...s };
    delete row.redo;
    return row;
  })
);

if (lengths.length) {
  const sorted = [...lengths].sort((a, b) => a - b);
  const avg = (lengths.reduce((a, b) => a + b, 0) / lengths.length).toFixed(1);
  const over = (n) => lengths.filter((l) => l > n).length;
  console.log(
    `Length: ${lengths.length} definitions, avg ${avg}, median ${sorted[Math.floor(sorted.length / 2)]}, max ${sorted[sorted.length - 1]}; ` +
      `over aim ${over(limits.aim)}, over warn ${over(limits.warn)}, over max ${over(limits.max)}`
  );
}
console.log(`Rejected: ${totalRejected}   Entries with warnings: ${totalWarned}\n`);

const md = [
  `# Definition validation report: ${level.toUpperCase()}`,
  '',
  `Generated ${new Date().toISOString()}`,
  '',
  '| batch | status | entries | rejected | warnings |',
  '| --- | --- | --- | --- | --- |',
  ...summary.map(
    (s) => `| ${s.batch} | ${s.status} | ${s.entries} | ${s.rejected} | ${s.warnings} |`
  ),
  '',
  report.length ? '## Details\n' : 'No rejects or warnings.\n',
  ...report
].join('\n');
fs.mkdirSync(WORK_DIR, { recursive: true });
const reportFile = path.join(WORK_DIR, `report-${level}.md`);
fs.writeFileSync(reportFile, md + '\n');
console.log(`Report: ${path.relative(ROOT, reportFile)}`);

for (const s of summary) {
  if (s.redo) console.log(`\nRedo prompt for ${s.batch}:\n\n${s.redo}`);
}

process.exit(totalRejected ? 1 : 0);
