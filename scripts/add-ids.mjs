#!/usr/bin/env node
/**
 * add-ids.mjs
 * Adds stable IDs to vocab-**.json and uttrykk-**.json files (in-place).
 *
 * Vocab ID format:  v-{level}-{category-slug}-{3-digit-index}
 *   e.g.  v-a1-greetings-001
 *
 * Uttrykk ID format: u-{level}-{3-digit-index}
 *   e.g.  u-a1-001
 *
 * Preview files (uttrykk-**-preview.json) use:  up-{level}-{3-digit-index}
 *   e.g.  up-a1-001
 *
 * Usage:
 *   node scripts/add-ids.mjs                     # dry-run (prints what would change)
 *   node scripts/add-ids.mjs --write             # writes changes to disk
 *   node scripts/add-ids.mjs --write --level a1  # only process a1 files
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __dir = dirname(fileURLToPath(import.meta.url));

// Adjust this path if running the script from a different location
const DATA_DIR = resolve(__dir, '../src/lib/data');

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a category string to a URL-safe slug */
function toSlug(cat) {
  return cat
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function pad3(n) {
  return String(n).padStart(3, '0');
}

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// ID generators
// ---------------------------------------------------------------------------

/**
 * Adds v-{level}-{category-slug}-{3-digit-index} IDs to a vocab array.
 * Index resets per category (sorted for determinism, preserving original order).
 */
function addVocabIds(items, level) {
  // Count per category as we iterate (preserve original order)
  const counters = {};
  return items.map((item) => {
    if (item.id) return item; // already has an id — skip
    const slug = toSlug(item.category ?? 'unknown');
    counters[slug] = (counters[slug] ?? 0) + 1;
    return { id: `v-${level}-${slug}-${pad3(counters[slug])}`, ...item };
  });
}

/**
 * Adds u-{level}-{3-digit-index} IDs to an uttrykk array.
 * prefix: "u" for regular, "up" for preview.
 */
function addUttrykkIds(items, level, prefix = 'u') {
  let counter = 0;
  return items.map((item) => {
    if (item.id) return item;
    counter++;
    return { id: `${prefix}-${level}-${pad3(counter)}`, ...item };
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const levelFilter = args.includes('--level') ? args[args.indexOf('--level') + 1] : null;

if (!WRITE) {
  console.log('🔍 DRY RUN — pass --write to actually save files.\n');
}

const levels = levelFilter ? [levelFilter] : LEVELS;

for (const level of levels) {
  // --- vocab ---
  const vocabPath = `${DATA_DIR}/vocab-${level}.json`;
  const vocab = loadJson(vocabPath);
  if (vocab) {
    const withIds = addVocabIds(vocab, level);
    const alreadyHad = vocab.filter((i) => i.id).length;
    const added = withIds.length - alreadyHad;
    console.log(
      `vocab-${level}.json  — ${withIds.length} items, ${added} IDs added` +
        (alreadyHad ? `, ${alreadyHad} already had IDs` : '')
    );
    if (WRITE) {
      writeFileSync(vocabPath, JSON.stringify(withIds, null, 2) + '\n');
      console.log(`  ✅ written`);
    } else {
      // Show a sample
      console.log(
        `  sample: ${withIds
          .slice(0, 3)
          .map((i) => i.id)
          .join(', ')} …`
      );
    }
  } else {
    console.log(`vocab-${level}.json  — not found, skipping`);
  }

  // --- uttrykk ---
  const uttrykkPath = `${DATA_DIR}/uttrykk-${level}.json`;
  const uttrykk = loadJson(uttrykkPath);
  if (uttrykk) {
    const withIds = addUttrykkIds(uttrykk, level, 'u');
    const alreadyHad = uttrykk.filter((i) => i.id).length;
    const added = withIds.length - alreadyHad;
    console.log(
      `uttrykk-${level}.json — ${withIds.length} items, ${added} IDs added` +
        (alreadyHad ? `, ${alreadyHad} already had IDs` : '')
    );
    if (WRITE) {
      writeFileSync(uttrykkPath, JSON.stringify(withIds, null, 2) + '\n');
      console.log(`  ✅ written`);
    } else {
      console.log(
        `  sample: ${withIds
          .slice(0, 3)
          .map((i) => i.id)
          .join(', ')} …`
      );
    }
  } else {
    console.log(`uttrykk-${level}.json — not found, skipping`);
  }

  // --- uttrykk preview ---
  const previewPath = `${DATA_DIR}/uttrykk-${level}-preview.json`;
  const preview = loadJson(previewPath);
  if (preview) {
    const withIds = addUttrykkIds(preview, level, 'up');
    const alreadyHad = preview.filter((i) => i.id).length;
    const added = withIds.length - alreadyHad;
    console.log(
      `uttrykk-${level}-preview.json — ${withIds.length} items, ${added} IDs added` +
        (alreadyHad ? `, ${alreadyHad} already had IDs` : '')
    );
    if (WRITE) {
      writeFileSync(previewPath, JSON.stringify(withIds, null, 2) + '\n');
      console.log(`  ✅ written`);
    } else {
      console.log(
        `  sample: ${withIds
          .slice(0, 3)
          .map((i) => i.id)
          .join(', ')} …`
      );
    }
  } else {
    console.log(`uttrykk-${level}-preview.json — not found, skipping`);
  }

  console.log();
}

if (!WRITE) {
  console.log('Run with --write to apply changes.');
}
