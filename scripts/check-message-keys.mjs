#!/usr/bin/env node
/**
 * check-message-keys.mjs
 *
 * Verifies that every locale file in messages/ (nb.json, uk.json, es.json,
 * de.json, …) has exactly the same set of keys as the source-of-truth
 * messages/en.json — catching keys that were added/removed in English but
 * never propagated to the other languages (and vice versa).
 *
 * This only checks key parity (structure), not translation quality/accuracy.
 * For translation quality, see audit-translations.mjs (vocab/uttrykk data)
 * or do a manual read-through for UI strings.
 *
 * Run from the project root:
 *   node scripts/check-message-keys.mjs
 *
 * Options:
 *   --fix    For each locale missing keys, copy the English value as a
 *            placeholder (prefixed with "[UNTRANSLATED] ") so the app
 *            doesn't break, and flag it for manual translation. Extra keys
 *            (not in en.json) are left untouched — remove those by hand
 *            after confirming they're really stale.
 *
 * Exit code 0 → all locale files match en.json's key set
 * Exit code 1 → one or more locale files have missing or extra keys
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MESSAGES_DIR = resolve(ROOT, 'messages');
const SOURCE_LOCALE = 'en';

const fix = process.argv.includes('--fix');

// ── Load en.json (source of truth) ─────────────────────────────────────────

const sourcePath = resolve(MESSAGES_DIR, `${SOURCE_LOCALE}.json`);
if (!existsSync(sourcePath)) {
  console.error(`❌  Source file not found: ${sourcePath}`);
  process.exit(1);
}
const sourceData = JSON.parse(readFileSync(sourcePath, 'utf8'));
const sourceKeys = new Set(Object.keys(sourceData).filter((k) => !k.startsWith('$')));

// ── Discover target locale files ───────────────────────────────────────────

const targetLocales = readdirSync(MESSAGES_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''))
  .filter((locale) => locale !== SOURCE_LOCALE)
  .sort();

if (targetLocales.length === 0) {
  console.error(`❌  No other locale files found in ${MESSAGES_DIR}`);
  process.exit(1);
}

console.log(`Source of truth: messages/${SOURCE_LOCALE}.json  (${sourceKeys.size} keys)`);
console.log(`Checking locales: ${targetLocales.join(', ')}\n`);

// ── Compare each locale against the source ─────────────────────────────────

let failures = 0;
const fixedFiles = [];

for (const locale of targetLocales) {
  const filePath = resolve(MESSAGES_DIR, `${locale}.json`);
  const label = `messages/${locale}.json`;
  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const keys = new Set(Object.keys(data).filter((k) => !k.startsWith('$')));

  const missing = [...sourceKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !sourceKeys.has(k));

  // Flag values that are empty strings or byte-identical to English — these
  // often indicate a key was added via copy-paste but never actually
  // translated. This is a heuristic, not a hard failure.
  const untranslated = [...keys]
    .filter((k) => sourceKeys.has(k))
    .filter((k) => data[k] === '' || data[k] === sourceData[k]);

  const structuralFailure = missing.length > 0 || extra.length > 0;

  if (!structuralFailure && untranslated.length === 0) {
    console.log(`✅  OK    ${label}`);
    continue;
  }

  if (structuralFailure) {
    failures++;
    console.log(`❌  FAIL  ${label}`);
  } else {
    // Only the heuristic (identical-to-English) check tripped — this is
    // expected for brand names, codes like "A1"/"B2", etc., so it doesn't
    // fail the script, just gets surfaced for a human to sanity-check.
    console.log(`⚠️  NOTE  ${label}`);
  }
  if (missing.length) {
    console.log(
      `         Missing (${missing.length}): ${missing.slice(0, 15).join(', ')}${missing.length > 15 ? ', …' : ''}`
    );
  }
  if (extra.length) {
    console.log(
      `         Extra (${extra.length}, not in en.json): ${extra.slice(0, 15).join(', ')}${extra.length > 15 ? ', …' : ''}`
    );
  }
  if (untranslated.length) {
    console.log(
      `         Same as English / empty (${untranslated.length}) — review, but often expected for brand names/codes: ${untranslated.slice(0, 15).join(', ')}${untranslated.length > 15 ? ', …' : ''}`
    );
  }
  console.log();

  if (fix && missing.length > 0) {
    for (const key of missing) {
      data[key] = `[UNTRANSLATED] ${sourceData[key]}`;
    }
    // Preserve key order: existing keys first, then newly-added ones appended.
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    fixedFiles.push(locale);
  }
}

console.log();
if (fix && fixedFiles.length > 0) {
  console.log(
    `🔧  Added placeholder entries (prefixed "[UNTRANSLATED]") to: ${fixedFiles.join(', ')}`
  );
  console.log(
    `    Search each file for "[UNTRANSLATED]" and translate properly before shipping.\n`
  );
}

if (failures === 0) {
  console.log('All locale files match en.json key set ✅');
  process.exit(0);
} else {
  console.log(`${failures} locale file(s) out of sync ❌`);
  if (!fix) {
    console.log('Run with --fix to auto-insert English placeholders for missing keys.');
  }
  process.exit(1);
}
