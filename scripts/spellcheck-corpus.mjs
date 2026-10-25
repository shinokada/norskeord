#!/usr/bin/env node
/**
 * spellcheck-corpus.mjs
 *
 * Hunspell spell-check (via nspell) of the Norwegian, German and Spanish text in
 * the data files. Unlike corpus-diacritic-scan.mjs it does not need the accented
 * form to appear elsewhere, so it also finds words degraded everywhere.
 *
 * Read-only: writes a Markdown review list, never edits data.
 *
 * Setup (once):
 *   npm i -D nspell dictionary-nb dictionary-de dictionary-es
 *
 * Usage:
 *   node scripts/spellcheck-corpus.mjs
 *   node scripts/spellcheck-corpus.mjs --lang german
 *   node scripts/spellcheck-corpus.mjs --dir src/lib/data
 *
 * Output: scripts/audit/spellcheck-<timestamp>.md
 *
 * Known-valid words (names, loanwords, dialect forms) go in
 * scripts/audit/spellcheck-skip.json:
 *   { "norwegian": ["gølv"], "german": ["Canvas"], "spanish": ["kétchup"] }
 *
 * Sections per language:
 *   diacritic suggestion — restoring accents/umlauts/ß turns the unknown word into a
 *                          word the dictionary knows: most likely a degraded word
 *   rare unknown         — unknown word used at most 2 times, no accent candidate
 *   frequent unknown     — used 3+ times: usually valid vocabulary missing from the
 *                          dictionary (add to the skip list after checking)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const require = createRequire(join(ROOT, 'package.json'));

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const DATA_DIR = opt('--dir', join(ROOT, 'src/lib/data'));
const ONLY_LANG = opt('--lang', 'all');
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c'];
const KINDS = ['vocab', 'uttrykk'];

const LANGUAGES = {
  norwegian: { pkg: 'dictionary-nb', fields: ['norsk', 'lemma', 'example', 'definition'] },
  german: { pkg: 'dictionary-de', fields: ['german', 'example_german'] },
  spanish: { pkg: 'dictionary-es', fields: ['spanish', 'example_spanish'] }
};

// Characters a degraded letter may stand for, per language.
const RESTORE = {
  norwegian: { a: ['å', 'æ'], o: ['ø'], e: ['æ'] },
  german: { a: ['ä'], o: ['ö'], u: ['ü'] },
  spanish: { a: ['á'], e: ['é'], i: ['í'], o: ['ó'], u: ['ú', 'ü'], n: ['ñ'] }
};

/** Candidates formed by restoring up to 3 accented letters (and ss → ß for German). */
function restoreCandidates(word, lang) {
  const map = RESTORE[lang];
  const lower = word.toLowerCase();
  const out = new Set();
  const positions = [];
  for (let i = 0; i < lower.length; i++) if (map[lower[i]]) positions.push(i);
  const walk = (start, chars, changed) => {
    if (changed > 0) out.add(chars.join(''));
    if (changed === 3) return;
    for (let k = start; k < positions.length; k++) {
      const i = positions[k];
      for (const rep of map[lower[i]]) {
        const next = chars.slice();
        next[i] = rep;
        walk(k + 1, next, changed + 1);
      }
    }
  };
  if (positions.length <= 12) walk(0, [...lower], 0);
  if (lang === 'german' && lower.includes('ss')) out.add(lower.replace(/ss/g, '\u00df'));
  return [...out];
}

const MIN_LENGTH = 3;
const RARE_MAX = 2;
const MAX_EXAMPLES = 3;

function loadItems(file) {
  if (!existsSync(file)) return [];
  const data = JSON.parse(readFileSync(file, 'utf8'));
  if (Array.isArray(data)) return data;
  return Object.values(data).find(Array.isArray) || [];
}

/**
 * Some hunspell dictionaries (notably German) list a word twice, e.g.
 * `fahren/BDIVW` and `fahren/Sozm`, the second marked ONLYINCOMPOUND. nspell keeps
 * only the last entry, so `fahren` would be reported as unknown. Merge duplicate
 * entries into one line and drop the ONLYINCOMPOUND flag from the merged entry.
 * Only applies to dictionaries with single-character flags.
 */
function mergeDuplicateEntries(aff, dic) {
  const affText = Buffer.from(aff).toString('utf8');
  if (/^FLAG\s+(long|num|UTF-8)/m.test(affText)) return dic;
  const onlyInCompound = (affText.match(/^ONLYINCOMPOUND\s+(\S)/m) || [])[1];
  const lines = Buffer.from(dic).toString('utf8').split('\n');
  lines.shift(); // entry count, rewritten below
  const merged = new Map();
  const order = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const m = line.match(/^([^/\s]+)(?:\/(\S*))?(.*)$/);
    if (!m) continue;
    const [, word, flags = '', rest] = m;
    const key = word + rest;
    if (!merged.has(key)) {
      merged.set(key, { word, flags, rest, dup: false });
      order.push(key);
    } else {
      const e = merged.get(key);
      e.dup = true;
      for (const f of flags) if (!e.flags.includes(f)) e.flags += f;
    }
  }
  const out = order.map((k) => {
    const e = merged.get(k);
    const flags = onlyInCompound && e.dup ? e.flags.split(onlyInCompound).join('') : e.flags;
    return e.word + (flags ? '/' + flags : '') + e.rest;
  });
  return Buffer.from([String(out.length), ...out].join('\n'), 'utf8');
}

async function loadSpell(pkg) {
  let nspellPath, dictPath;
  try {
    nspellPath = require.resolve('nspell');
    dictPath = require.resolve(pkg);
  } catch {
    console.error(`Missing package. Run: npm i -D nspell ${pkg}`);
    return null;
  }
  const nspell = (await import(pathToFileURL(nspellPath).href)).default;
  const dict = (await import(pathToFileURL(dictPath).href)).default;
  return nspell({ aff: dict.aff, dic: mergeDuplicateEntries(dict.aff, dict.dic) });
}

const skipFile = join(__dirname, 'audit', 'spellcheck-skip.json');
const SKIP = existsSync(skipFile) ? JSON.parse(readFileSync(skipFile, 'utf8')) : {};

if (!existsSync(DATA_DIR)) {
  console.error(`Data directory not found: ${DATA_DIR}`);
  process.exit(1);
}

const entries = [];
for (const kind of KINDS) {
  for (const level of LEVELS) {
    const name = `${kind}-${level}`;
    for (const item of loadItems(join(DATA_DIR, `${name}.json`))) entries.push({ item, name });
  }
}

if (entries.length === 0) {
  console.error(
    `No corpus entries loaded from ${DATA_DIR} (expected vocab-*.json / uttrykk-*.json).`
  );
  process.exit(1);
}

const WORD = /\p{L}+/gu;
const report = [];
const summary = [];

for (const [lang, cfg] of Object.entries(LANGUAGES)) {
  if (ONLY_LANG !== 'all' && ONLY_LANG !== lang) continue;
  const spell = await loadSpell(cfg.pkg);
  if (!spell) continue;
  const skip = new Set((SKIP[lang] || []).map((w) => w.toLowerCase()));

  // unknown word (as written) -> { count, rows[] }
  const unknown = new Map();
  for (const { item, name } of entries) {
    for (const field of cfg.fields) {
      const raw = item[field];
      if (typeof raw !== 'string') continue;
      const text = raw.normalize('NFC');
      for (const m of text.matchAll(WORD)) {
        const w = m[0];
        if (w.length < MIN_LENGTH || skip.has(w.toLowerCase())) continue;
        if (spell.correct(w)) continue;
        // a capitalised sentence-initial word may only be known in lower case
        if (spell.correct(w.toLowerCase())) continue;
        let u = unknown.get(w);
        if (!u) unknown.set(w, (u = { count: 0, rows: [] }));
        u.count++;
        if (u.rows.length < MAX_EXAMPLES) {
          const ctx = text.slice(Math.max(0, m.index - 25), m.index + w.length + 25);
          u.rows.push(`${item.id} (${name}) | ${field}: …${ctx}…`);
        }
      }
    }
  }

  const diacritic = [];
  const rare = [];
  const frequent = [];
  for (const [w, u] of [...unknown].sort(([a], [b]) => a.localeCompare(b))) {
    const lowerWord = w.toLowerCase();
    // report the spelling the dictionary accepted (e.g. German noun `Glück`, not `glück`)
    const diac = restoreCandidates(w, lang)
      .filter((c) => c !== lowerWord)
      .map((c) => {
        if (spell.correct(c)) return c;
        const cap = c[0].toUpperCase() + c.slice(1);
        return spell.correct(cap) ? cap : null;
      })
      .filter(Boolean)
      .slice(0, 5);
    const line = `- \`${w}\` (${u.count}x)${diac.length ? ' → ' + diac.map((s) => `\`${s}\``).join(', ') : ''}`;
    const block = [line, ...u.rows.map((r) => `  - ${r}`)].join('\n');
    if (diac.length) diacritic.push(block);
    else if (u.count <= RARE_MAX) rare.push(block);
    else frequent.push(block);
  }

  summary.push(
    `${lang}: ${unknown.size} unknown words — ${diacritic.length} diacritic suggestion, ` +
      `${rare.length} rare, ${frequent.length} frequent`
  );
  const title = lang[0].toUpperCase() + lang.slice(1);
  report.push(`## ${title}: ${unknown.size} unknown words\n`);
  report.push(
    `### Diacritic suggestion (${diacritic.length})\n` + (diacritic.join('\n') || '(none)') + '\n'
  );
  report.push(
    `### Rare unknown, 1–${RARE_MAX} uses (${rare.length})\n` + (rare.join('\n') || '(none)') + '\n'
  );
  report.push(
    `### Frequent unknown, 3+ uses (${frequent.length})\n` +
      (frequent.join('\n') || '(none)') +
      '\n'
  );
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = join(__dirname, 'audit');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `spellcheck-${stamp}.md`);
writeFileSync(
  outFile,
  '# Spell-check of the corpus (nspell + hunspell dictionaries)\n\n' +
    'Words the dictionary does not know. Format: `word` (count) → accent candidates.\n\n' +
    report.join('\n')
);
console.log(summary.join('\n'));
console.log(`\nReport: ${outFile}`);
