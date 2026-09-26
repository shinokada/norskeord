// Read-only fuzzy duplicate scan across ALL vocab-*.json and uttrykk-*.json.
// Complements the exact-lemma scan (normTextIgnoreA equality) that produced
// the 12 cross-level deletions: this finds VARIANTS the exact scan cannot see.
// It never writes data. Review the output, then decide per group.
//
// Tiers:
//   1  same key after normalisation, but different exact text
//      ("å stole på noen" vs "å stole på", "sandaler (pl.)" vs "sandal",
//       "en slikk og ingenting" vs "slikk og ingenting (en)")
//   2  containment: the shorter entry's words are a leading prefix of the
//      longer one, longer has at most 2 extra words, shorter has >= 2 words
//      ("ta del" vs "ta del i", "gå på" vs "gå på jobb")
//   3  single-word inflection: one word equals the other plus a common
//      Norwegian ending (e, er, r, en, et, ene, a), same part if both set
//      ("støvel" vs "støvler")
//
// Usage: node scripts/reclass/fuzzy-dupes.mjs > scripts/outputs/fuzzy-dupes.txt
import { levelDataPaths, loadJSON, normTextIgnoreA } from './lib.mjs';
import fs from 'node:fs';

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c'];
const PLACEHOLDERS = new Set([
  'noen',
  'noe',
  'seg',
  'selv',
  'hverandre',
  'deg',
  'meg',
  'ham',
  'henne',
  'dem',
  'oss',
  'man',
  'ens',
  'sin',
  'sitt',
  'sine'
]);
const SUFFIXES = ['e', 'er', 'r', 'en', 'et', 'ene', 'a'];

function tokensOf(e) {
  let t = normTextIgnoreA(e.norsk)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[/,;]/g, ' ');
  if (e.part === 'noun' || !e.part) t = t.replace(/^\s*(en|et|ei)\s+/, '');
  const all = t.split(/\s+/).filter(Boolean);
  const kept = all.filter((x) => !PLACEHOLDERS.has(x));
  return kept.length ? kept : all;
}

const entries = [];
for (const level of LEVELS) {
  const p = levelDataPaths(level);
  for (const kind of ['vocab', 'uttrykk']) {
    if (!fs.existsSync(p[kind])) continue;
    for (const e of loadJSON(p[kind])) {
      if (!e || !e.norsk) continue;
      const tokens = tokensOf(e);
      entries.push({
        file: `${kind}-${level}`,
        id: e.id,
        norsk: e.norsk,
        part: e.part || '',
        english: (e.english || '').slice(0, 60),
        exact: normTextIgnoreA(e.norsk),
        tokens,
        key: tokens.join(' ')
      });
    }
  }
}

const fmt = (e) =>
  `  ${e.file.padEnd(11)} ${String(e.id).padEnd(9)} ${e.part.padEnd(7)} "${e.norsk}"  -- ${e.english}`;

// Tier 1
const byKey = new Map();
for (const e of entries) {
  if (!byKey.has(e.key)) byKey.set(e.key, []);
  byKey.get(e.key).push(e);
}
const tier1 = [];
const tier1Keys = new Set();
for (const [key, list] of byKey) {
  if (list.length < 2) continue;
  if (new Set(list.map((e) => e.exact)).size < 2) continue; // exact twins: already handled
  tier1.push({ key, list });
  tier1Keys.add(key);
}

// Tier 2
const byFirst = new Map();
for (const e of entries) {
  if (!e.tokens.length) continue;
  const f = e.tokens[0];
  if (!byFirst.has(f)) byFirst.set(f, []);
  byFirst.get(f).push(e);
}
const tier2 = [];
const seen2 = new Set();
for (const list of byFirst.values()) {
  for (const a of list) {
    if (a.tokens.length < 2) continue;
    for (const b of list) {
      if (a === b) continue;
      const extra = b.tokens.length - a.tokens.length;
      if (extra < 1 || extra > 2) continue;
      if (!a.tokens.every((t, i) => t === b.tokens[i])) continue;
      if (a.key === b.key) continue;
      const id = `${a.id}|${b.id}`;
      if (seen2.has(id)) continue;
      seen2.add(id);
      tier2.push([a, b]);
    }
  }
}

// Tier 3
const single = new Map();
for (const e of entries) {
  if (e.tokens.length !== 1 || e.key.length < 4) continue;
  if (!single.has(e.key)) single.set(e.key, []);
  single.get(e.key).push(e);
}
const tier3 = [];
for (const [k, list] of single) {
  for (const s of SUFFIXES) {
    const other = single.get(k + s);
    if (!other) continue;
    for (const a of list)
      for (const b of other) {
        if (a.part && b.part && a.part !== b.part) continue;
        tier3.push([a, b]);
      }
  }
}

console.log(`Scanned ${entries.length} entries across ${LEVELS.length} levels (vocab + uttrykk).`);
console.log(
  'Exact-text twins are excluded (already handled). Every hit is a CANDIDATE; different senses are expected.\n'
);

console.log(
  `=== TIER 1: same key after normalisation, different text (${tier1.length} groups) ===`
);
for (const g of tier1) {
  console.log(`\n[${g.key}]`);
  g.list.forEach((e) => console.log(fmt(e)));
}

console.log(`\n\n=== TIER 2: containment, shorter is prefix of longer (${tier2.length} pairs) ===`);
for (const [a, b] of tier2) {
  console.log(`\n[${a.key}]  ->  [${b.key}]`);
  console.log(fmt(a));
  console.log(fmt(b));
}

console.log(`\n\n=== TIER 3: single-word inflection (${tier3.length} pairs) ===`);
for (const [a, b] of tier3) {
  console.log(`\n[${a.key}]  ->  [${b.key}]`);
  console.log(fmt(a));
  console.log(fmt(b));
}

console.log(
  `\n\nSUMMARY: tier1 ${tier1.length} groups, tier2 ${tier2.length} pairs, tier3 ${tier3.length} pairs`
);
