#!/usr/bin/env tsx
/**
 * check-category-keys.ts
 *
 * Targeted completeness check for the one place in this codebase where a
 * missing messages/en.json key can ship silently: the dynamic category
 * label lookup in src/routes/learn/[level]/+page.svelte:
 *
 *   const key = `category_${level}_${slug.replace(/-/g, '_')}` as keyof typeof m;
 *   const fn = m[key];
 *
 * That `as keyof typeof m` assertion is an explicit "trust me" to
 * TypeScript — svelte-check (which is just tsc + the Svelte compiler under
 * the hood) cannot catch a missing key here, because the assertion is
 * exactly what tells the type checker to skip verifying it. If someone adds
 * a new category to CATEGORIES_BY_LEVEL in config.ts but forgets the
 * matching key in en.json, nothing fails at build time — categoryLabel()
 * just silently falls back to removeHyphensAndCapitalize(slug) and the
 * badge shows an untranslated, hyphen-stripped slug instead of a real label.
 *
 * This script is the only thing that actually verifies the two stay in
 * sync — cross-referencing CATEGORIES_BY_LEVEL (the data source) against
 * messages/en.json (the i18n source) in both directions:
 *
 *   MISSING  — a category exists in config.ts but has no matching
 *              category_<level>_<slug> key in en.json. Real bug: ship this
 *              and the label silently degrades to a raw slug.
 *   ORPHANED — a category_<level>_<slug> key exists in en.json but no
 *              category in config.ts produces it anymore (e.g. a category
 *              was renamed or removed). Not dangerous, but stale — and
 *              check-unused-keys.mjs's dynamic-prefix detection means these
 *              never show up in that report (they look "used" because the
 *              category_ prefix itself is dynamic), so this is the only
 *              place that surfaces them.
 *
 * Run from the project root:
 *   npx tsx scripts/check-category-keys.ts
 *
 * Exit code 0 → every category has a matching key, no orphans
 * Exit code 1 → at least one MISSING key (orphans alone do not fail the
 *               script — they're a cleanup candidate, not a live bug)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CATEGORIES_BY_LEVEL } from '../src/lib/config.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MESSAGES_PATH = resolve(ROOT, 'messages/en.json');

const messages = JSON.parse(readFileSync(MESSAGES_PATH, 'utf8')) as Record<string, string>;
const messageKeys = new Set(Object.keys(messages).filter((k) => !k.startsWith('$')));

// ── 1. Build the expected key set from CATEGORIES_BY_LEVEL ──────────────
//
// Mirrors the exact transform used at runtime in
// src/routes/learn/[level]/+page.svelte's categoryLabel():
//   `category_${level}_${slug.replace(/-/g, '_')}`
// where `level` is the lowercased CEFR level (e.g. "a1", "c").

type Expected = { level: string; slug: string; key: string };

const expected: Expected[] = [];
for (const [level, slugs] of Object.entries(CATEGORIES_BY_LEVEL)) {
  const levelLower = level.toLowerCase();
  for (const slug of slugs) {
    const key = `category_${levelLower}_${slug.replace(/-/g, '_')}`;
    expected.push({ level: levelLower, slug, key });
  }
}

// ── 2. MISSING — expected key not present in en.json ────────────────────

const missing = expected.filter((e) => !messageKeys.has(e.key));

// ── 3. ORPHANED — en.json has a category_* key no config entry produces ──

const expectedKeySet = new Set(expected.map((e) => e.key));
const CATEGORY_KEY_RE = /^category_([a-z0-9]+)_/;
const orphaned = [...messageKeys].filter((k) => CATEGORY_KEY_RE.test(k) && !expectedKeySet.has(k));

// ── 4. Report ─────────────────────────────────────────────────────────────

const totalExpected = expected.length;
console.log(
  `Categories in config.ts: ${totalExpected} (across ${Object.keys(CATEGORIES_BY_LEVEL).length} levels)`
);
console.log(
  `category_* keys in en.json: ${[...messageKeys].filter((k) => CATEGORY_KEY_RE.test(k)).length}\n`
);

if (missing.length > 0) {
  console.log(`❌  MISSING (${missing.length}) — in config.ts but no matching key in en.json:`);
  for (const m of missing) {
    console.log(`   ${m.key}   (CATEGORIES_BY_LEVEL.${m.level.toUpperCase()} → "${m.slug}")`);
  }
  console.log();
} else {
  console.log(
    '✅  No missing category keys — every config.ts category has a matching en.json key.\n'
  );
}

if (orphaned.length > 0) {
  console.log(
    `⚠️  ORPHANED (${orphaned.length}) — in en.json but no config.ts category produces this key:`
  );
  for (const key of orphaned) {
    console.log(`   ${key}`);
  }
  console.log('   (Not a live bug — categoryLabel() just never looks these up. Likely a renamed/');
  console.log('    removed category. Safe to clean up, but double-check before deleting: this is');
  console.log('    purely a name-shape check, not a usage check.)\n');
} else {
  console.log('✅  No orphaned category_* keys.\n');
}

if (missing.length === 0) {
  console.log('Category completeness check passed ✅');
  process.exit(0);
} else {
  console.log(
    `${missing.length} missing categor${missing.length === 1 ? 'y' : 'ies'} key(s) — add these to messages/en.json (and other locales) before shipping.`
  );
  process.exit(1);
}
