#!/usr/bin/env node
/**
 * split-grammar-rules.mjs
 *
 * One-off refactor for Phase 2 of ai-docs/implementation/grammar-update.md.
 * Splits src/lib/grammar/rules.ts into one file per taxonomy chapter:
 *
 *   src/lib/grammar/rules/<chapter-slug>.ts   (one `<SLUG>_RULES` object each)
 *   src/lib/grammar/rules/index.ts            (merged GRAMMAR_RULES + GRAMMAR_RULE_LIST,
 *                                              keeps the explanationNb formatting header)
 *
 * and deletes rules.ts, so `$lib/grammar/rules` keeps resolving (now to
 * rules/index.ts) and every existing import works untouched.
 *
 * Each rule is moved as an untouched block of text (only the trailing comma is
 * re-applied). A comment directly above a rule (no blank line) travels with it;
 * the level banner comments ("Nivå A1 topics ...") are dropped because rules are
 * now grouped by chapter, not level.
 *
 * Safe by construction: everything is computed and verified in memory first
 * (every rule placed exactly once, every block byte-identical when re-read from
 * the new files). Nothing is written or deleted unless all checks pass.
 *
 * Usage (project root):
 *   node scripts/split-grammar-rules.mjs --dry-run   # report only
 *   node scripts/split-grammar-rules.mjs             # apply
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  unlinkSync,
  existsSync,
  readdirSync,
  statSync
} from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = resolve(ROOT, 'src/lib/grammar');
const RULES_FILE = resolve(DIR, 'rules.ts');
const OUT_DIR = resolve(DIR, 'rules');
const DRY_RUN = process.argv.includes('--dry-run');

const fail = (m) => {
  console.error(`\n❌  ${m}\nNothing was written.`);
  process.exit(1);
};

if (!existsSync(RULES_FILE)) {
  console.log(
    existsSync(OUT_DIR)
      ? '✅  Nothing to do: rules.ts is already split.'
      : '❌  rules.ts not found.'
  );
  process.exit(existsSync(OUT_DIR) ? 0 : 1);
}

// ---------------------------------------------------------------------------
// 1. Parse rules.ts into: header comment + entries (key, leading comment, block)
// ---------------------------------------------------------------------------
const lines = readFileSync(RULES_FILE, 'utf-8').split('\n');

const objStart = lines.findIndex((l) => l.startsWith('export const GRAMMAR_RULES'));
if (objStart < 0) fail('Could not find `export const GRAMMAR_RULES`.');
const objEnd = lines.findIndex((l, i) => i > objStart && l === '};');
if (objEnd < 0) fail('Could not find the closing `};` of GRAMMAR_RULES.');
const tail = lines
  .slice(objEnd + 1)
  .join('\n')
  .trim();
if (tail !== 'export const GRAMMAR_RULE_LIST: GrammarRule[] = Object.values(GRAMMAR_RULES);') {
  fail(`Unexpected content after GRAMMAR_RULES: ${JSON.stringify(tail.slice(0, 120))}`);
}

// Header: the JSDoc block between the import and the export.
const headerStart = lines.findIndex((l) => l.startsWith('/**'));
const headerEnd = lines.findIndex((l, i) => i > headerStart && l.startsWith(' */'));
if (headerStart < 0 || headerEnd < 0 || headerEnd > objStart)
  fail('Could not find the header JSDoc.');
const header = lines.slice(headerStart, headerEnd + 1).join('\n');

const ENTRY_START = /^ {2}('?)([\w-]+)\1: \{$/;
const body = lines.slice(objStart + 1, objEnd);
const entries = []; // { key, comment: string[], block: string }
let pendingComment = [];
let droppedBanners = [];
for (let i = 0; i < body.length;) {
  const line = body[i];
  const m = ENTRY_START.exec(line);
  if (m) {
    let j = i + 1;
    while (j < body.length && !/^ {2}\},?$/.test(body[j])) j++;
    if (j >= body.length) fail(`Unterminated entry "${m[2]}".`);
    const blockLines = body.slice(i, j + 1);
    blockLines[blockLines.length - 1] = '  }'; // normalise trailing comma
    entries.push({ key: m[2], comment: pendingComment, block: blockLines.join('\n') });
    pendingComment = [];
    i = j + 1;
  } else if (line.trim() === '') {
    // blank line: a comment run above it is a banner, not a rule comment
    if (pendingComment.length) droppedBanners.push(pendingComment[0].trim());
    pendingComment = [];
    i++;
  } else if (/^ {2}\/\//.test(line)) {
    pendingComment.push(line);
    i++;
  } else {
    fail(
      `Unexpected line inside GRAMMAR_RULES at body line ${i + 1}: ${JSON.stringify(line.slice(0, 80))}`
    );
  }
}
if (pendingComment.length) fail('Dangling comment at end of GRAMMAR_RULES.');

const byKey = new Map();
for (const e of entries) {
  if (byKey.has(e.key)) fail(`Duplicate rule key "${e.key}" in rules.ts.`);
  byKey.set(e.key, e);
}

// ---------------------------------------------------------------------------
// 2. Chapter -> topics, read from taxonomy.ts (regex; verified below)
// ---------------------------------------------------------------------------
const tax = readFileSync(resolve(DIR, 'taxonomy.ts'), 'utf-8');
const taxBody = tax.slice(
  tax.indexOf('export const GRAMMAR_TAXONOMY'),
  tax.indexOf('export const ALSO_IN')
);
const chapters = []; // { no, slug, titleNb, titleEn, part, topics[] }
let part = 0;
for (const raw of taxBody.split('\n')) {
  const pm = /^\s{4}no: (\d),$/.exec(raw);
  if (pm) part = Number(pm[1]);
  const cm = /^\s{6}ch\((\d+), '([\w-]+)', '((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)', \[$/.exec(raw);
  if (cm) {
    chapters.push({
      no: Number(cm[1]),
      slug: cm[2],
      titleNb: cm[3],
      titleEn: cm[4],
      part,
      topics: []
    });
    continue;
  }
  if (!chapters.length) continue;
  for (const t of raw.matchAll(/'([\w-]+)'/g)) chapters.at(-1).topics.push(t[1]);
}
// Collect every quoted word, then keep only real rule keys (section ids and titles
// never match a rule key), once each, in order.
for (const c of chapters) c.topics = [...new Set(c.topics.filter((t) => byKey.has(t)))];

const placed = new Map();
for (const c of chapters)
  for (const t of c.topics) {
    if (placed.has(t)) fail(`Topic "${t}" is placed in both chapter ${placed.get(t)} and ${c.no}.`);
    placed.set(t, c.no);
  }
const unplaced = [...byKey.keys()].filter((k) => !placed.has(k));
if (unplaced.length) fail(`Rules with no chapter in taxonomy.ts: ${unplaced.join(', ')}`);
if (chapters.length < 10)
  fail(`Parsed only ${chapters.length} chapters from taxonomy.ts; parser out of date.`);

// ---------------------------------------------------------------------------
// 3. Build the new files in memory
// ---------------------------------------------------------------------------
const constName = (slug) => `${slug.toUpperCase().replace(/-/g, '_')}_RULES`;
const files = new Map(); // path -> content
const used = chapters.filter((c) => c.topics.length > 0);

for (const c of used) {
  const parts = c.topics.map((t) => {
    const e = byKey.get(t);
    return [...e.comment, e.block].join('\n');
  });
  const content =
    `// src/lib/grammar/rules/${c.slug}.ts\n` +
    `// Rules for chapter ${c.no} · ${c.titleNb} (Part ${c.part}). Order follows taxonomy.ts.\n` +
    `// Formatting of \`explanationNb\`: see the header comment in ./index.ts.\n` +
    `import type { GrammarRule } from '$lib/types';\n\n` +
    `export const ${constName(c.slug)}: Record<string, GrammarRule> = {\n` +
    parts.join(',\n\n') +
    `\n};\n`;
  files.set(join(OUT_DIR, `${c.slug}.ts`), content);
}

const slugs = used.map((c) => c.slug);
if (new Set(slugs).size !== slugs.length) fail('Duplicate chapter slugs in taxonomy.ts.');

const index =
  `// src/lib/grammar/rules/index.ts\n` +
  `// Merged grammar rules. One file per taxonomy chapter (see taxonomy.ts); this file\n` +
  `// re-exports them so \`import { GRAMMAR_RULES } from '$lib/grammar/rules'\` keeps working.\n` +
  `// Keys must stay unique across chapters: a duplicate would silently override another rule.\n` +
  `import type { GrammarRule } from '$lib/types';\n` +
  used.map((c) => `import { ${constName(c.slug)} } from './${c.slug}';`).join('\n') +
  `\n\n${header}\n` +
  `export const GRAMMAR_RULES: Record<string, GrammarRule> = {\n` +
  used.map((c) => `  ...${constName(c.slug)}`).join(',\n') +
  `\n};\n\n` +
  `export const GRAMMAR_RULE_LIST: GrammarRule[] = Object.values(GRAMMAR_RULES);\n`;
files.set(join(OUT_DIR, 'index.ts'), index);

// ---------------------------------------------------------------------------
// 4. Verify in memory: every block comes back byte-identical, once
// ---------------------------------------------------------------------------
const seen = new Set();
for (const [path, content] of files) {
  if (path.endsWith('index.ts')) continue;
  const got = [...content.matchAll(/^ {2}('?)([\w-]+)\1: \{\n[\s\S]*?\n {2}\}(?=,?\n)/gm)];
  for (const g of got) {
    const key = g[2];
    if (!byKey.has(key)) fail(`${path}: unknown rule "${key}" after rebuild.`);
    if (g[0] !== byKey.get(key).block) fail(`${path}: block for "${key}" is not byte-identical.`);
    if (seen.has(key)) fail(`Rule "${key}" written twice.`);
    seen.add(key);
  }
}
if (seen.size !== byKey.size) {
  fail(`Rebuilt ${seen.size} rules but rules.ts has ${byKey.size}.`);
}

// ---------------------------------------------------------------------------
// 5. Report, write, and warn about text-readers of rules.ts
// ---------------------------------------------------------------------------
console.log(`Parsed ${byKey.size} rules → ${used.length} chapter files + index.ts`);
for (const c of used) console.log(`  rules/${c.slug}.ts  (ch ${c.no}, ${c.topics.length} rules)`);
const empty = chapters.filter((c) => c.topics.length === 0).map((c) => `${c.no} ${c.slug}`);
if (empty.length) console.log(`No rules yet (no file created): ${empty.join(', ')}`);
console.log(`Dropped ${droppedBanners.length} level banner comment(s):`);
for (const b of droppedBanners) console.log(`  ${b.slice(0, 90)}`);

if (DRY_RUN) {
  console.log('\n(dry run) Nothing was written.');
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const [path, content] of files) writeFileSync(path, content, 'utf-8');
unlinkSync(RULES_FILE);
console.log(`\n✅  Wrote ${files.size} files and removed src/lib/grammar/rules.ts.`);

// Anything that reads the old file path as text would now break silently.
const hits = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', '.svelte-kit', 'build', '.vercel'].includes(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (
      /\.(m?[jt]s|json|ya?ml|svelte|md|sh|py)$/.test(name) &&
      !p.includes('/ai-docs/') &&
      p !== fileURLToPath(import.meta.url)
    ) {
      const txt = readFileSync(p, 'utf-8');
      if (/grammar\/rules\.ts|rules\.ts['"`]/.test(txt)) hits.push(p.replace(ROOT + '/', ''));
    }
  }
};
for (const d of ['scripts', 'e2e', 'src', '.github'])
  if (existsSync(join(ROOT, d))) walk(join(ROOT, d));
if (existsSync(join(ROOT, 'package.json')))
  hits.push(
    ...(/rules\.ts/.test(readFileSync(join(ROOT, 'package.json'), 'utf-8')) ? ['package.json'] : [])
  );
if (hits.length) {
  console.log('\n⚠️  These files mention rules.ts by path; check they still work:');
  for (const h of hits) console.log(`  ${h}`);
}
console.log('Next: pnpm check && pnpm test');
