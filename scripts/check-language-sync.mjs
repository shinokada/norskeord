#!/usr/bin/env node
/**
 * check-language-sync.mjs
 *
 * Verifies that every place in the codebase which hard-codes a list of
 * supported UI locales or flashcard languages is in sync with the canonical
 * source of truth in src/lib/config.ts.
 *
 * Run from the project root:
 *   node scripts/check-language-sync.mjs
 *
 * Exit code 0 → all checks pass
 * Exit code 1 → one or more checks failed (details printed to stdout)
 *
 * ── How it works ──────────────────────────────────────────────────────────
 * 1. Parse LANGUAGES from src/lib/config.ts to derive two canonical sets:
 *      CANONICAL_LOCALES        – UI locale codes,   e.g. ['en', 'nb', 'es', 'uk', 'de']
 *      CANONICAL_FLASHCARD_KEYS – flashcard language keys (all keys except 'norwegian'),
 *                                 e.g. ['english', 'spanish', 'ukrainian', 'german']
 *
 * 2. Run every entry in CHECKS, each of which knows:
 *      file        – path relative to project root
 *      description – shown in output
 *      canonical   – 'locales' | 'flashcardKeys'
 *      extract(src)– receives file contents, returns string[] of found values
 *
 * 3. Compare found values against the canonical set and report missing/extra.
 *
 * ── Adding a new check ────────────────────────────────────────────────────
 * Append an object to the CHECKS array. Use extractArray() for simple
 * JS/TS array literals, or write a custom extract() for other formats.
 * When you add a new language to config.ts and this script flags failures,
 * the output tells you exactly which files need updating.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── 1. Parse canonical sets from config.ts ────────────────────────────────

const configSrc = readFileSync(resolve(ROOT, 'src/lib/config.ts'), 'utf8');

function parseLanguagesFromConfig(src) {
  const blockMatch = src.match(/export const LANGUAGES\s*=\s*(\{[\s\S]*?\})\s*as const/);
  if (!blockMatch) throw new Error('Could not find LANGUAGES in src/lib/config.ts');

  const block = blockMatch[1];
  const result = {};
  const entryRe = /(\w+)\s*:\s*\{[^}]*code\s*:\s*'([^']+)'[^}]*\}/g;
  let m;
  while ((m = entryRe.exec(block)) !== null) {
    result[m[1]] = { code: m[2] };
  }

  if (Object.keys(result).length === 0) {
    throw new Error('LANGUAGES parsed as empty — regex may need updating');
  }
  return result;
}

const LANGUAGES = parseLanguagesFromConfig(configSrc);

const CANONICAL_LOCALES = new Set(Object.values(LANGUAGES).map((l) => l.code));
const CANONICAL_FLASHCARD_KEYS = new Set(Object.keys(LANGUAGES).filter((k) => k !== 'norwegian'));

// ── 2. Shared extract helpers ─────────────────────────────────────────────

/**
 * Extract values from a JS/TS array literal matched by `re`.
 * The regex must capture the array contents in group 1, e.g. /const X = \[([^\]]+)\]/
 */
function extractArray(src, re) {
  const m = src.match(re);
  if (!m) return null;
  return [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
}

/**
 * Extract values from a TypeScript union type matched by `re`.
 * The regex must capture the union string in group 1, e.g. /'en' | 'nb' | 'de'/
 */
function extractUnion(src, re) {
  const m = src.match(re);
  if (!m) return null;
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

/**
 * Extract values from a Postgres ARRAY[...] literal matched by `re`.
 * Handles the `'value'::text` cast syntax used in migrations.
 */
function extractSqlArray(src, re) {
  const m = src.match(re);
  if (!m) return null;
  return [...m[1].matchAll(/'([^':]+)'(?:::text)?/g)].map((x) => x[1]);
}

// ── 3. Check runner ───────────────────────────────────────────────────────

let failures = 0;

function check({ description, file, canonical, extract }) {
  const absPath = resolve(ROOT, file);
  const label = `[${file}]\n         ${description}`;

  if (!existsSync(absPath)) {
    console.log(`⚠️  SKIP  ${label}\n         File not found\n`);
    return;
  }

  const src = readFileSync(absPath, 'utf8');
  const found = extract(src);

  if (found === null) {
    console.log(`⚠️  SKIP  ${label}\n         Pattern not found in file\n`);
    return;
  }

  const canonicalSet = canonical === 'locales' ? CANONICAL_LOCALES : CANONICAL_FLASHCARD_KEYS;
  const foundSet = new Set(found);
  const missing = [...canonicalSet].filter((v) => !foundSet.has(v));
  const extra = [...foundSet].filter((v) => !canonicalSet.has(v));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅  OK    ${label}`);
  } else {
    failures++;
    console.log(`❌  FAIL  ${label}`);
    if (missing.length) console.log(`         Missing: ${missing.map((v) => `'${v}'`).join(', ')}`);
    if (extra.length) console.log(`         Extra:   ${extra.map((v) => `'${v}'`).join(', ')}`);
  }
  console.log();
}

// ── 4. Special checks (not easily table-driven) ───────────────────────────

function checkInlangSettings() {
  const file = 'project.inlang/settings.json';
  const description = 'locales array';
  const label = `[${file}]\n         ${description}`;
  const absPath = resolve(ROOT, file);

  if (!existsSync(absPath)) {
    console.log(`⚠️  SKIP  ${label}\n         File not found\n`);
    return;
  }

  const settings = JSON.parse(readFileSync(absPath, 'utf8'));
  const foundSet = new Set(settings.locales ?? []);
  const missing = [...CANONICAL_LOCALES].filter((v) => !foundSet.has(v));
  const extra = [...foundSet].filter((v) => !CANONICAL_LOCALES.has(v));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅  OK    ${label}`);
  } else {
    failures++;
    console.log(`❌  FAIL  ${label}`);
    if (missing.length) console.log(`         Missing: ${missing.map((v) => `'${v}'`).join(', ')}`);
    if (extra.length) console.log(`         Extra:   ${extra.map((v) => `'${v}'`).join(', ')}`);
  }
  console.log();
}

function checkParaglideRuntime() {
  const file = 'src/lib/paraglide/runtime.js';
  const description = 'locales array (generated — run vite dev to regenerate)';
  const label = `[${file}]\n         ${description}`;
  const absPath = resolve(ROOT, file);

  if (!existsSync(absPath)) {
    console.log(`⚠️  SKIP  ${label}\n         File not found\n`);
    return;
  }

  const src = readFileSync(absPath, 'utf8');
  // e.g. export const locales = /** @type {const} */ (["en","nb","es","uk","de"]);
  const found = extractArray(src, /export const locales\s*=[\s\S]*?\((\[[^\]]+\])\)/);

  if (found === null) {
    console.log(`⚠️  SKIP  ${label}\n         Pattern not found\n`);
    return;
  }

  const foundSet = new Set(found);
  const missing = [...CANONICAL_LOCALES].filter((v) => !foundSet.has(v));
  const extra = [...foundSet].filter((v) => !CANONICAL_LOCALES.has(v));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅  OK    ${label}`);
  } else {
    failures++;
    console.log(`❌  FAIL  ${label}`);
    if (missing.length) console.log(`         Missing: ${missing.map((v) => `'${v}'`).join(', ')}`);
    if (extra.length) console.log(`         Extra:   ${extra.map((v) => `'${v}'`).join(', ')}`);
  }
  console.log();
}

function checkMessagesDirectory() {
  const description = 'messages/ has a JSON file for each locale';
  const label = `[messages/]\n         ${description}`;

  const present = [];
  const missing = [];
  for (const code of CANONICAL_LOCALES) {
    const p = resolve(ROOT, `messages/${code}.json`);
    if (existsSync(p)) present.push(code);
    else missing.push(code);
  }

  if (missing.length === 0) {
    console.log(`✅  OK    ${label}`);
  } else {
    failures++;
    console.log(`❌  FAIL  ${label}`);
    console.log(`         Missing files: ${missing.map((v) => `messages/${v}.json`).join(', ')}`);
  }
  console.log();
}

// ── 5. Declarative checks table ───────────────────────────────────────────

const CHECKS = [
  // ── Server-side API route allowlists ─────────────────────────────────────

  {
    description: 'VALID_FLASHCARD_LANGUAGES Set',
    file: 'src/routes/api/profile/onboarding/+server.ts',
    canonical: 'flashcardKeys',
    extract: (src) => extractArray(src, /VALID_FLASHCARD_LANGUAGES\s*=\s*new Set\(\[([^\]]+)\]\)/)
  },

  {
    description: 'validLanguages array (updatePreferences action)',
    file: 'src/routes/my-profile/+page.server.ts',
    canonical: 'locales',
    extract: (src) => extractArray(src, /const validLanguages\s*=\s*\[([^\]]+)\]/)
  },

  {
    description: 'validFlashcardLanguages array (updatePreferences action)',
    file: 'src/routes/my-profile/+page.server.ts',
    canonical: 'flashcardKeys',
    extract: (src) => extractArray(src, /const validFlashcardLanguages\s*=\s*\[([^\]]+)\]/)
  },

  // ── TypeScript types ──────────────────────────────────────────────────────

  {
    description: 'Profile.ui_language union type',
    file: 'src/lib/server/profile.ts',
    canonical: 'locales',
    extract: (src) => extractUnion(src, /ui_language\s*:\s*((?:'[^']*'\s*\|\s*)*'[^']*')\s*;/)
  },

  {
    description: 'Profile.flashcard_language union type',
    file: 'src/lib/server/profile.ts',
    canonical: 'flashcardKeys',
    extract: (src) =>
      extractUnion(src, /flashcard_language\s*:\s*((?:'[^']*'\s*\|\s*)*'[^']*')\s*;/)
  },

  // ── Database migration ────────────────────────────────────────────────────
  // Update this path when you create a new migration that redefines these
  // constraints (the old migration file becomes history — only the latest matters).

  {
    description: 'profiles_ui_language_check ARRAY constraint',
    file: 'supabase/migrations/022_add_german_language.sql',
    canonical: 'locales',
    extract: (src) => extractSqlArray(src, /profiles_ui_language_check[\s\S]*?ARRAY\[([^\]]+)\]/)
  },

  {
    description: 'profiles_flashcard_language_check ARRAY constraint',
    file: 'supabase/migrations/022_add_german_language.sql',
    canonical: 'flashcardKeys',
    extract: (src) =>
      extractSqlArray(src, /profiles_flashcard_language_check[\s\S]*?ARRAY\[([^\]]+)\]/)
  }
];

// ── 6. Run ────────────────────────────────────────────────────────────────

console.log('Source of truth: src/lib/config.ts → LANGUAGES');
console.log(`  UI locale codes:     ${[...CANONICAL_LOCALES].join(', ')}`);
console.log(`  Flashcard lang keys: ${[...CANONICAL_FLASHCARD_KEYS].join(', ')}`);
console.log();

checkInlangSettings();
checkParaglideRuntime();
checkMessagesDirectory();

for (const chk of CHECKS) {
  check(chk);
}

// ── 7. Summary ────────────────────────────────────────────────────────────

if (failures === 0) {
  console.log('All checks passed ✅');
  process.exit(0);
} else {
  console.log(`${failures} check(s) failed ❌`);
  console.log();
  console.log('When you add a new language to LANGUAGES in src/lib/config.ts:');
  console.log('  1. Update every failing location listed above.');
  console.log('  2. Add a messages/{code}.json translation file.');
  console.log('  3. Create a new DB migration to extend the check constraints.');
  console.log('  4. Update the migration file path in CHECKS (step "Database migration").');
  console.log('  5. Re-run this script — it should pass before you open a PR.');
  process.exit(1);
}
