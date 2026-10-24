#!/usr/bin/env node
/**
 * corpus-diacritic-scan.mjs
 *
 * Finds words written WITHOUT their accent/umlaut/ß whose accented form
 * appears elsewhere in the same language's text across A1–C (vocab + uttrykk).
 * This is the gap the word maps cannot see: a degraded word that is not (yet)
 * in the maps.
 *
 * Read-only: it never edits data. It writes a Markdown review list.
 *
 * Usage:
 *   node scripts/corpus-diacritic-scan.mjs
 *   node scripts/corpus-diacritic-scan.mjs --lang german
 *   node scripts/corpus-diacritic-scan.mjs --dir src/lib/data
 *
 * Output:
 *   scripts/audit/corpus-diacritic-scan-<timestamp>.md
 *
 * Skip list (words that are valid unaccented, e.g. German `fordern`, Spanish
 * `papa`, Norwegian `mal`): scripts/audit/corpus-scan-skip.json
 *   { "german": ["fordern", "Wahlen"], "spanish": ["papa"], "norwegian": ["mal"] }
 * Entries are case-sensitive: a lowercase entry skips the word in any casing, a
 * capitalised entry (a German noun such as "Wahlen") skips only that exact token.
 *
 * Classification:
 *   likely  — the accented form is at least 5x as frequent as the bare form
 *   look    — otherwise (the bare form may be a valid word; check in context)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const DATA_DIR = opt('--dir', join(ROOT, 'src/lib/data'));
const ONLY_LANG = opt('--lang', 'all');
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c'];
const KINDS = ['vocab', 'uttrykk'];

// Which entry fields hold which language, and how a word degrades.
const LANGUAGES = {
  norwegian: {
    fields: ['norsk', 'lemma', 'example', 'definition'],
    degrade: (w) =>
      w.replace(/å/g, 'a').replace(/ø/g, 'o').replace(/æ/g, 'ae')
  },
  german: {
    fields: ['german', 'example_german'],
    degrade: (w) =>
      w.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
  },
  spanish: {
    fields: ['spanish', 'example_spanish'],
    degrade: (w) =>
      w.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }
};

const MIN_LENGTH = 3;
const LIKELY_RATIO = 5;
// A bare word used more than this many times is almost certainly a valid word
// (`for`, `han`, `bare`), so it is not listed under "need a look".
const LOOK_MAX_BARE = 5;
// Fields holding decomposed Unicode (a + combining mark) instead of one character.
const decomposed = [];

function loadItems(file) {
  // A missing configured corpus file must fail the scan (readFileSync throws),
  // not silently count as an empty corpus and produce a false "all clean".
  const data = JSON.parse(readFileSync(file, 'utf8'));
  if (Array.isArray(data)) return data;
  const arr = Object.values(data).find(Array.isArray);
  return arr || [];
}

const skipFile = join(__dirname, 'audit', 'corpus-scan-skip.json');
const SKIP = existsSync(skipFile) ? JSON.parse(readFileSync(skipFile, 'utf8')) : {};

const entries = [];
for (const kind of KINDS) {
  for (const level of LEVELS) {
    const file = join(DATA_DIR, `${kind}-${level}.json`);
    for (const item of loadItems(file)) entries.push({ item, file: `${kind}-${level}` });
  }
}

const WORD = /\p{L}+/gu;
const report = [];
const summary = [];

for (const [lang, cfg] of Object.entries(LANGUAGES)) {
  if (ONLY_LANG !== 'all' && ONLY_LANG !== lang) continue;
  // Entries are case-sensitive: "fordern" skips every casing of the word, while a
  // capitalised entry such as "Wahlen" skips only that capitalised token (the noun)
  // and still lets lowercase "wahlen" (a degraded "wählen") through.
  const skip = new Set(SKIP[lang] || []);

  // Pass 1: count every token (lowercased), find which accented forms exist.
  const counts = new Map();
  const occurrences = [];
  for (const { item, file } of entries) {
    for (const field of cfg.fields) {
      const raw = item[field];
      if (typeof raw !== 'string') continue;
      if (/\p{M}/u.test(raw)) decomposed.push(`${item.id} (${file}) | ${field}: ${raw.slice(0, 70)}`);
      const text = raw.normalize('NFC');
      for (const m of text.matchAll(WORD)) {
        const w = m[0].toLowerCase();
        counts.set(w, (counts.get(w) || 0) + 1);
        occurrences.push({ w, orig: m[0], id: item.id, file, field, text, index: m.index });
      }
    }
  }

  // bare key -> accented forms that degrade to it
  const accentedByBare = new Map();
  for (const w of counts.keys()) {
    const bare = cfg.degrade(w);
    if (bare !== w) {
      if (!accentedByBare.has(bare)) accentedByBare.set(bare, []);
      accentedByBare.get(bare).push(w);
    }
  }

  // Pass 2: bare tokens that have an accented twin.
  const found = new Map(); // bare word -> { twins, rows[] }
  for (const o of occurrences) {
    if (o.w.length < MIN_LENGTH || skip.has(o.w) || skip.has(o.orig)) continue;
    const twins = accentedByBare.get(o.w);
    if (!twins || cfg.degrade(o.w) !== o.w) continue;
    if (!found.has(o.w)) found.set(o.w, { twins, rows: [] });
    const ctx = o.text.slice(Math.max(0, o.index - 25), o.index + o.w.length + 25);
    found.get(o.w).rows.push(`${o.id} (${o.file}) | ${o.field}: …${ctx}…`);
  }

  const likely = [];
  const look = [];
  let frequent = 0;
  for (const [w, { twins, rows }] of [...found].sort(([a], [b]) => a.localeCompare(b))) {
    const bareCount = counts.get(w);
    const accCount = twins.reduce((s, t) => s + counts.get(t), 0);
    const line = `- \`${w}\` (${bareCount}x) → ${twins.map((t) => `\`${t}\` (${counts.get(t)}x)`).join(', ')}`;
    const block = [line, ...rows.slice(0, 5).map((r) => `  - ${r}`)];
    if (rows.length > 5) block.push(`  - … ${rows.length - 5} more`);
    if (accCount >= LIKELY_RATIO * bareCount) likely.push(block.join('\n'));
    else if (bareCount <= LOOK_MAX_BARE) look.push(block.join('\n'));
    else frequent++;
  }

  summary.push(`${lang}: ${likely.length} likely, ${look.length} to look at (${frequent} frequent bare words ignored)`);
  report.push(`## ${lang[0].toUpperCase() + lang.slice(1)}: ${likely.length} likely errors, ${look.length} need a look\n`);
  report.push('### Likely errors\n' + (likely.join('\n') || '(none)') + '\n');
  report.push('### Need a look\n' + (look.join('\n') || '(none)') + '\n');
}

if (decomposed.length) {
  summary.push(`decomposed Unicode: ${decomposed.length} fields`);
  report.push(
    `## Decomposed Unicode (NFD): ${decomposed.length} fields\n\n` +
      'These look correct on screen but store the letter as base + combining mark. ' +
      'Normalize to NFC.\n\n' +
      decomposed.map((d) => `- ${d}`).join('\n') + '\n'
  );
}

// Milliseconds keep back-to-back scans (e.g. one per --lang) from sharing a filename;
// the 'wx' flag below makes any remaining collision fail instead of overwriting.
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 23);
const outDir = join(__dirname, 'audit');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `corpus-diacritic-scan-${stamp}.md`);
const header =
  '# Corpus-based diacritic scan\n\n' +
  'Bare words whose accented form appears elsewhere in the data (A1–C, vocab + uttrykk).\n' +
  'Format: `word` (count) → accented form(s) (count)\n\n';
writeFileSync(outFile, header + report.join('\n'), { flag: 'wx' });

console.log(summary.join('\n'));
console.log(`\nReport: ${outFile}`);
