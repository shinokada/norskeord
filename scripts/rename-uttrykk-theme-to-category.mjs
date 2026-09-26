#!/usr/bin/env node
/**
 * rename-uttrykk-theme-to-category.mjs
 *
 * Phase 1, ai-docs/implementation/uttrykk-theme-category-unification.md.
 *
 * A1–B2 uttrykk entries currently carry two fields where every other
 * content type (vocab at every level, C-level uttrykk) carries one:
 *   - category: always the literal sentinel 'uttrykk'
 *   - theme: the real sub-grouping ('greetings', 'idioms', ...)
 *
 * This rewrites `src/lib/data/uttrykk-{a1,a2,b1,b2}.json` in place so each
 * entry has `category` set to its real former-theme value, with `theme`
 * removed entirely — matching C's shape (which already uses real category
 * slugs directly, no theme field).
 *
 * `entry.category = entry.theme; delete entry.theme;` deliberately keeps
 * `category` at its original position in the object (JS preserves key
 * order on reassignment) rather than deleting-then-re-adding it, so the
 * only diff per entry is: `theme` line gone, `category`'s value changed —
 * not a full key reordering.
 *
 * Refuses to write (per file) if any entry is missing `theme`, or already
 * has a real (non-'uttrykk') category — both would mean this script is
 * running against data it doesn't understand, and guessing would risk
 * silently corrupting entries.
 *
 * Usage: node scripts/rename-uttrykk-theme-to-category.mjs [level ...]
 *   No args → all four levels.
 *   e.g. node scripts/rename-uttrykk-theme-to-category.mjs b1 b2
 *
 * Safe to re-run: a file where every entry already has a real category and
 * no theme field is reported as already-done and left untouched.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');

const ALL_LEVELS = ['a1', 'a2', 'b1', 'b2'];
const requested = process.argv.slice(2).map((s) => s.toLowerCase());
const levels = requested.length > 0 ? requested : ALL_LEVELS;

for (const level of levels) {
  if (!ALL_LEVELS.includes(level)) {
    console.error(`Unknown level "${level}" — expected one of ${ALL_LEVELS.join(', ')}`);
    process.exit(1);
  }
}

let anyFailed = false;

for (const level of levels) {
  const dataPath = join(DATA_DIR, `uttrykk-${level}.json`);

  if (!existsSync(dataPath)) {
    console.error(`❌ Missing file: ${dataPath}`);
    anyFailed = true;
    continue;
  }

  const entries = JSON.parse(readFileSync(dataPath, 'utf8'));

  const alreadyDone = entries.every((e) => e.category !== 'uttrykk' && e.theme === undefined);
  if (alreadyDone) {
    console.log(`⏭  uttrykk-${level}.json: already renamed, skipping.`);
    continue;
  }

  const missingTheme = [];
  const unexpectedCategory = [];

  for (const e of entries) {
    if (e.category === 'uttrykk' && e.theme === undefined) missingTheme.push(e.id ?? e.norsk);
    if (e.category !== 'uttrykk' && e.theme !== undefined) unexpectedCategory.push(e.id ?? e.norsk);
  }

  if (missingTheme.length > 0 || unexpectedCategory.length > 0) {
    console.error(`❌ uttrykk-${level}.json: data doesn't match the expected shape, aborting.`);
    if (missingTheme.length > 0) {
      console.error(`   ${missingTheme.length} entr(y/ies) have category:'uttrykk' but no theme:`);
      console.error('   ' + missingTheme.join(', '));
    }
    if (unexpectedCategory.length > 0) {
      console.error(
        `   ${unexpectedCategory.length} entr(y/ies) have a theme but category is already something other than 'uttrykk':`
      );
      console.error('   ' + unexpectedCategory.join(', '));
    }
    console.error('   Nothing was written for this file.');
    anyFailed = true;
    continue;
  }

  let renamed = 0;
  for (const e of entries) {
    if (e.category === 'uttrykk' && e.theme !== undefined) {
      e.category = e.theme;
      delete e.theme;
      renamed++;
    }
  }

  writeFileSync(dataPath, JSON.stringify(entries, null, 2) + '\n', 'utf8');
  console.log(`✅ uttrykk-${level}.json: renamed theme → category on ${renamed} entries.`);
}

if (anyFailed) {
  console.error('\nOne or more files failed — see above. Fix the data, then re-run.');
  process.exit(1);
}

console.log("\nDone. Next: run the app's test suite, then update the code that read `theme`");
console.log('(see uttrykk-theme-category-unification.md Phase 2 for the file list).');
