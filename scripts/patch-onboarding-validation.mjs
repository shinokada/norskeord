#!/usr/bin/env node
/**
 * Patch script: server-side validation improvements for
 * src/routes/api/profile/onboarding/+server.ts
 *
 * Run from repo root:
 *   node scripts/patch-onboarding-validation.mjs
 *
 * Dry-run (preview diff without writing):
 *   node scripts/patch-onboarding-validation.mjs --dry-run
 */

import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { resolve } from 'path';

const FILE = resolve('src/routes/api/profile/onboarding/+server.ts');
const DRY_RUN = process.argv.includes('--dry-run');

const raw = readFileSync(FILE, 'utf-8');

// ---------------------------------------------------------------------------
// Patch 1 — insert helpers + allowlists after the VALID_LEVELS const
// ---------------------------------------------------------------------------

const AFTER_VALID_LEVELS = `const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C'];`;

const HELPERS = `
// ---------------------------------------------------------------------------
// Sanitisation helper — strips control characters and HTML-like content from
// free-text fields before they are stored. Svelte escapes on render so this
// won't prevent XSS on the site itself, but it keeps the DB clean.
// ---------------------------------------------------------------------------
function sanitizeText(val: string): string {
  return val
    .replace(/[\\u0000-\\u001F\\u007F]/g, '') // control characters
    .replace(/[<>]/g, '')                      // no HTML angle brackets
    .trim();
}

// Allowlists mirror the LANGUAGES / COUNTRIES arrays in OnboardingSlides.svelte.
// Kept here (rather than imported) so the API stays self-contained and can
// validate requests that bypass the UI entirely.

const VALID_LANG_CODES = new Set([
  'sq', 'am', 'ar', 'zh', 'da', 'nl', 'en', 'fi', 'fr', 'de', 'el',
  'hi', 'id', 'it', 'ja', 'kk', 'ko', 'ku', 'lv', 'lt', 'ms', 'ne',
  'nb', 'fa', 'pl', 'pt', 'ro', 'ru', 'si', 'so', 'es', 'sv', 'sw',
  'tl', 'ta', 'th', 'ti', 'tr', 'uk', 'ur', 'vi',
]);

const VALID_COUNTRY_CODES = new Set([
  'AF', 'AL', 'DZ', 'AR', 'AU', 'AT', 'BD', 'BE', 'BR', 'CA', 'CL', 'CN',
  'CO', 'HR', 'CZ', 'DK', 'EG', 'ER', 'ET', 'FI', 'FR', 'DE', 'GH', 'GR',
  'HU', 'IN', 'ID', 'IQ', 'IR', 'IE', 'IT', 'JP', 'KE', 'KR', 'LT', 'LV',
  'MX', 'MA', 'NL', 'NZ', 'NG', 'NO', 'PK', 'PH', 'PL', 'PT', 'RO', 'RU',
  'SA', 'SO', 'ZA', 'ES', 'LK', 'SE', 'CH', 'SY', 'TH', 'TR', 'UA', 'GB',
  'US', 'VN',
]);`;

// ---------------------------------------------------------------------------
// Patch 2 — display_name: add sanitizeText call
// ---------------------------------------------------------------------------

const OLD_DISPLAY_NAME = `  if ('display_name' in body) {
    const name = (body.display_name as string | null)?.trim() ?? null;
    if (name && name.length > 40) error(422, { message: 'Display name too long.' });
    update.display_name = name;
  }`;

const NEW_DISPLAY_NAME = `  if ('display_name' in body) {
    const rawName = (body.display_name as string | null) ?? null;
    const name = rawName ? sanitizeText(rawName) : null;
    if (name && name.length > 40) error(422, { message: 'Display name too long.' });
    update.display_name = name || null;
  }`;

// ---------------------------------------------------------------------------
// Patch 3 — native_language: allowlist ISO codes; sanitize free-text "Other"
// ---------------------------------------------------------------------------

const OLD_NATIVE_LANG = `  if ('native_language' in body) {
    const lang = body.native_language as string | null;
    update.native_language = lang || null;
  }`;

const NEW_NATIVE_LANG = `  if ('native_language' in body) {
    const lang = body.native_language as string | null;
    if (!lang) {
      update.native_language = null;
    } else if (VALID_LANG_CODES.has(lang)) {
      // Known ISO 639-1 code — accept as-is
      update.native_language = lang;
    } else {
      // Free-text "Other" path — sanitize and cap length
      const cleaned = sanitizeText(lang);
      if (cleaned.length > 60) error(422, { message: 'Language name too long.' });
      update.native_language = cleaned || null;
    }
  }`;

// ---------------------------------------------------------------------------
// Patch 4 — other_languages: filter to known ISO codes only
// ---------------------------------------------------------------------------

const OLD_OTHER_LANGS = `  if ('other_languages' in body) {
    const langs = body.other_languages;
    if (!Array.isArray(langs)) error(422, { message: 'other_languages must be an array.' });
    update.other_languages = langs.filter((l: unknown) => typeof l === 'string');
  }`;

const NEW_OTHER_LANGS = `  if ('other_languages' in body) {
    const langs = body.other_languages;
    if (!Array.isArray(langs)) error(422, { message: 'other_languages must be an array.' });
    // Only accept known ISO codes — no free-text in the multi-select
    update.other_languages = (langs as unknown[]).filter(
      (l): l is string => typeof l === 'string' && VALID_LANG_CODES.has(l),
    );
  }`;

// ---------------------------------------------------------------------------
// Patch 5 — country: validate against allowlist
// ---------------------------------------------------------------------------

const OLD_COUNTRY = `  if ('country' in body) {
    const c = body.country as string | null;
    update.country = c || null;
  }`;

const NEW_COUNTRY = `  if ('country' in body) {
    const c = body.country as string | null;
    if (c && !VALID_COUNTRY_CODES.has(c)) error(422, { message: 'Invalid country.' });
    update.country = c || null;
  }`;

// ---------------------------------------------------------------------------
// Apply patches
// ---------------------------------------------------------------------------

const patches = [
  {
    label: 'Insert sanitizeText helper + VALID_LANG_CODES + VALID_COUNTRY_CODES',
    from: AFTER_VALID_LEVELS,
    to: AFTER_VALID_LEVELS + HELPERS
  },
  {
    label: 'display_name — add sanitizeText',
    from: OLD_DISPLAY_NAME,
    to: NEW_DISPLAY_NAME
  },
  {
    label: 'native_language — allowlist ISO codes, sanitize free-text Other',
    from: OLD_NATIVE_LANG,
    to: NEW_NATIVE_LANG
  },
  {
    label: 'other_languages — filter to known ISO codes only',
    from: OLD_OTHER_LANGS,
    to: NEW_OTHER_LANGS
  },
  {
    label: 'country — validate against VALID_COUNTRY_CODES',
    from: OLD_COUNTRY,
    to: NEW_COUNTRY
  }
];

let result = raw;
let changed = 0;
let skipped = 0;
const log = [];

for (const patch of patches) {
  if (!result.includes(patch.from)) {
    log.push(`⚠️  SKIP (not found): ${patch.label}`);
    skipped++;
    continue;
  }
  result = result.replace(patch.from, patch.to);
  log.push(`✅ ${patch.label}`);
  changed++;
}

console.log('\n=== onboarding +server.ts validation patch ===\n');
log.forEach((l) => console.log(l));
console.log(`\nSummary: ${changed} applied, ${skipped} skipped`);

if (DRY_RUN) {
  console.log('\n[DRY RUN] No file written.');
} else if (changed > 0) {
  copyFileSync(FILE, FILE + '.bak');
  console.log(`\nBackup saved → ${FILE}.bak`);
  writeFileSync(FILE, result, 'utf-8');
  console.log(`Written → ${FILE}`);
} else {
  console.log('\nNothing to write.');
}
