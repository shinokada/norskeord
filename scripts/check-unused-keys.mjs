#!/usr/bin/env node
/**
 * check-unused-keys.mjs
 *
 * Scans src/ for usages of messages/en.json keys and reports which keys
 * appear to be unused. This is a DRY-RUN reporting tool only — it never
 * deletes anything. Always eyeball the "dynamic" and "unused" buckets
 * before removing a key by hand (or with remove-unused-keys.mjs).
 *
 * ── Why this isn't a trivial grep ───────────────────────────────────────
 * Most keys are referenced statically, e.g. `m.stats_title()` or even just
 * `m.stats_title` (no call, e.g. inside an object literal lookup table).
 * But some keys are referenced *dynamically*, built from a template literal
 * and used to index into `m`, e.g. (learn/[level]/+page.svelte):
 *
 *   const key = `category_${level}_${slug.replace(/-/g, '_')}` as keyof typeof m;
 *   const fn = m[key];
 *
 * A naive "search for m.KEY_NAME(" scanner would flag every single
 * category_a1_*, category_a2_*, etc. key as unused — which is wrong.
 *
 * IMPORTANT — precision of the dynamic-key detection: this script only
 * treats a template literal as a "dynamic key candidate" when it is
 * ACTUALLY used to index `m` — either directly (`m[\`...\`]`) or via a
 * variable that is later used as `m[varName]`. An earlier version of this
 * script flagged *any* key-shaped template literal anywhere in the source,
 * which produced false prefixes like "example_" from
 * `entry[\`example_${language}\`]` in vocab-helpers.ts — that's indexing a
 * VocabEntry data object, not the messages object, and has nothing to do
 * with i18n. Tying the detection to actual `m[...]` usage eliminates that
 * class of false positive.
 *
 * Note: en.json keys may contain literal hyphens (e.g.
 * "category_a1_days-months") because paraglide sanitizes hyphens to
 * underscores when generating JS function/property names. This script
 * normalizes hyphens → underscores on both sides before comparing.
 *
 * ── Output buckets ─────────────────────────────────────────────────────
 *   USED      — referenced statically as m.KEY_NAME (call or bare reference)
 *   DYNAMIC   — not referenced statically, but matches a discovered dynamic
 *               key-prefix pattern actually tied to m[...] indexing (e.g.
 *               category_*). Listed for a human sanity-check, not a problem.
 *   UNUSED    — no static reference, no matching dynamic prefix. Real
 *               candidates for removal — but double-check before deleting
 *               (this only scans src/**, not e.g. scripts/ or supabase/
 *               edge functions, if those ever reference message keys too).
 *
 * Run from the project root:
 *   node scripts/check-unused-keys.mjs
 *
 * Options:
 *   --verbose   Print the full unused list even if very long (default caps
 *               console output at 60 entries; the report file in
 *               scripts/outputs/ always has the full list).
 */

import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC_DIR = resolve(ROOT, 'src');
const MESSAGES_PATH = resolve(ROOT, 'messages/en.json');
const OUTPUT_DIR = resolve(__dirname, 'outputs');

const verbose = process.argv.includes('--verbose');

const SCAN_EXTENSIONS = new Set(['.svelte', '.ts', '.js', '.mjs']);
const SKIP_DIRS = new Set([
  'node_modules',
  '.svelte-kit',
  '.git',
  'dist',
  'build',
  'paraglide' // generated output — not a place keys are *used*, only defined
]);

// ── 1. Load en.json ─────────────────────────────────────────────────────

if (!existsSync(MESSAGES_PATH)) {
  console.error(`❌  Not found: ${MESSAGES_PATH}`);
  process.exit(1);
}
const messages = JSON.parse(readFileSync(MESSAGES_PATH, 'utf8'));
const allKeys = Object.keys(messages).filter((k) => !k.startsWith('$'));

// ── 2. Walk src/ and collect files ───────────────────────────────────────

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else if (SCAN_EXTENSIONS.has(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(SRC_DIR);

// ── 3. Static usage scan: m.KEY_NAME (call or bare reference) ───────────

const usedKeys = new Set();
const STATIC_RE = /\bm\.([A-Za-z_][A-Za-z0-9_]*)\b/g;
const BRACKET_STRING_RE = /\bm\[\s*['"]([A-Za-z_][A-Za-z0-9_]*)['"]\s*\]/g;

// ── 4. Dynamic-key scan: templates ACTUALLY used to index `m` ───────────
//
// Two cases:
//   (a) m[`literal_${...}`]                         — direct
//   (b) const key = `literal_${...}`; ... m[key]     — via a variable
//
// A "key-shaped" template: every static (non-interpolated) segment
// contains only word characters/underscores, and there's at least one
// ${...} interpolation. Message keys never contain hyphens in their
// identifier form, so this naturally excludes things like
// `pill-${level}-${type.key}-${test}` (an HTML id, not a message key).

const M_INDEX_VAR_RE = /\bm\[\s*([A-Za-z_][A-Za-z0-9_]*)\s*\]/g;
const M_INDEX_TEMPLATE_RE = /\bm\[\s*`([^`]*)`\s*\]/g;
const TEMPLATE_ASSIGN_RE =
  /\b(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::[^=]+)?=\s*`([^`]*)`/g;

const dynamicPrefixes = new Map(); // prefix -> [{file, snippet}]

function isKeyShapedTemplate(raw) {
  if (!raw.includes('${')) return false;
  const staticParts = raw.split(/\$\{[^}]*\}/g);
  return staticParts.every((part) => /^[A-Za-z0-9_]*$/.test(part));
}

function recordPrefix(template, relFile) {
  if (!isKeyShapedTemplate(template)) return;
  const prefix = template.split('${')[0];
  if (prefix.length < 2) return; // too generic to be a useful filter
  if (!dynamicPrefixes.has(prefix)) dynamicPrefixes.set(prefix, []);
  dynamicPrefixes.get(prefix).push({ file: relFile, snippet: template });
}

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const relFile = file.replace(ROOT + '/', '');

  // Static usage
  let m;
  STATIC_RE.lastIndex = 0;
  while ((m = STATIC_RE.exec(src))) usedKeys.add(m[1]);

  BRACKET_STRING_RE.lastIndex = 0;
  while ((m = BRACKET_STRING_RE.exec(src))) usedKeys.add(m[1]);

  // Dynamic case (a): m[`...`] directly
  M_INDEX_TEMPLATE_RE.lastIndex = 0;
  while ((m = M_INDEX_TEMPLATE_RE.exec(src))) recordPrefix(m[1], relFile);

  // Dynamic case (b): variable assigned from a template, then used as m[var]
  const localAssignments = new Map();
  let am;
  TEMPLATE_ASSIGN_RE.lastIndex = 0;
  while ((am = TEMPLATE_ASSIGN_RE.exec(src))) {
    localAssignments.set(am[1], am[2]);
  }

  let vm;
  M_INDEX_VAR_RE.lastIndex = 0;
  while ((vm = M_INDEX_VAR_RE.exec(src))) {
    const template = localAssignments.get(vm[1]);
    if (template) recordPrefix(template, relFile);
  }
}

const sortedPrefixes = [...dynamicPrefixes.keys()].sort((a, b) => b.length - a.length);

// ── 5. Classify every en.json key ────────────────────────────────────────

const used = [];
const dynamic = [];
const unused = [];

for (const key of allKeys) {
  const normalized = key.replace(/-/g, '_');

  if (usedKeys.has(normalized) || usedKeys.has(key)) {
    used.push(key);
    continue;
  }

  const matchedPrefix = sortedPrefixes.find((p) => normalized.startsWith(p));
  if (matchedPrefix) {
    dynamic.push({ key, prefix: matchedPrefix });
    continue;
  }

  unused.push(key);
}

// ── 6. Report ─────────────────────────────────────────────────────────────

console.log(`Source: messages/en.json  (${allKeys.length} keys)`);
console.log(`Scanned ${files.length} files under src/\n`);

console.log(`✅  Used statically:  ${used.length}`);
console.log(
  `🔀  Used dynamically: ${dynamic.length}  (matched ${sortedPrefixes.length} discovered prefix pattern(s): ${sortedPrefixes.join(', ') || 'none'})`
);
console.log(`❓  Possibly unused:  ${unused.length}\n`);

if (dynamic.length > 0) {
  console.log('── Dynamic prefixes discovered ──────────────────────────────');
  for (const prefix of sortedPrefixes) {
    const occurrences = dynamicPrefixes.get(prefix);
    const count = dynamic.filter((d) => d.prefix === prefix).length;
    console.log(`  "${prefix}*"  →  ${count} key(s) matched`);
    for (const occ of occurrences.slice(0, 2)) {
      console.log(`      found in ${occ.file}: \`${occ.snippet}\``);
    }
  }
  console.log();
}

if (unused.length > 0) {
  console.log('── Possibly unused keys ─────────────────────────────────────');
  console.log('   (no static m.KEY reference, no matching dynamic prefix —');
  console.log('    double-check manually before deleting; this only scans src/)\n');
  const toShow = verbose ? unused : unused.slice(0, 60);
  for (const key of toShow) {
    console.log(`   ${key}`);
  }
  if (!verbose && unused.length > 60) {
    console.log(`   … and ${unused.length - 60} more (run with --verbose, or see the report file)`);
  }
  console.log();
}

// ── 7. Write full report to scripts/outputs/ ────────────────────────────

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const reportPath = resolve(OUTPUT_DIR, `unused-keys-${ts}.json`);
writeFileSync(
  reportPath,
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      totalKeys: allKeys.length,
      usedCount: used.length,
      dynamicCount: dynamic.length,
      unusedCount: unused.length,
      dynamicPrefixesFound: sortedPrefixes,
      dynamic,
      unused
    },
    null,
    2
  ) + '\n',
  'utf8'
);
console.log(`📝  Full report saved: ${reportPath.replace(ROOT + '/', '')}`);

if (unused.length === 0) {
  console.log('\nNo unused keys found ✅');
  process.exit(0);
} else {
  console.log(`\n${unused.length} possibly-unused key(s) found — review before removing.`);
  process.exit(0);
}
