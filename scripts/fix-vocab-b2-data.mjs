#!/usr/bin/env node
/**
 * fix-vocab-b2-data.mjs
 *
 * Fixes specific data-quality issues in src/lib/data/vocab-b2.json
 * that were identified during the normalise-norsk-field dry-run:
 *
 *  1. v-b2-abstract-nouns-019  norsk/lemma use the definite plural "konsekvensene"
 *  2. v-b2-argumentation-007   norsk has wrong form "en dobbelmoralsk" (lemma is correct)
 *  3. v-b2-education-008       "en emne" — emne is neuter (et), not common gender
 *  4. v-b2-education-023       exact duplicate of v-b2-education-043 → remove
 *  5. v-b2-language-018        "en morsmål" — morsmål is neuter (et), not common gender
 *  6. v-b2-work-career-029     "en yrkesrettet" — adjective; strip the spurious "en" prefix
 *
 * Usage (dry-run):   node scripts/fix-vocab-b2-data.mjs --dry-run
 * Usage (live):      node scripts/fix-vocab-b2-data.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, '../src/lib/data/vocab-b2.json');
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------
const raw = readFileSync(DATA_PATH, 'utf-8');
const entries = JSON.parse(raw);
const originalCount = entries.length;

// ---------------------------------------------------------------------------
// Patch definitions
// Each patch targets one entry by id and describes what changes.
// ---------------------------------------------------------------------------
const patches = [
  {
    id: 'v-b2-abstract-nouns-019',
    desc: 'Fix norsk/lemma: definite plural "konsekvensene" → lemma "konsekvens (en)"',
    apply(e) {
      e.norsk = 'konsekvens (en)';
      e.lemma = 'konsekvens';
    }
  },
  {
    id: 'v-b2-argumentation-007',
    desc: 'Fix norsk: "en dobbelmoralsk" → "dobbeltmoral (en)" (lemma already correct)',
    apply(e) {
      e.norsk = 'dobbeltmoral (en)';
      // lemma is already "dobbeltmoral" — leave it
    }
  },
  {
    id: 'v-b2-education-008',
    desc: 'Fix gender: "en emne" → "emne (et)" (emne is neuter)',
    apply(e) {
      e.norsk = 'emne (et)';
    }
  },
  // v-b2-education-023 is handled separately as a deletion (duplicate of -043)
  {
    id: 'v-b2-language-018',
    desc: 'Fix gender: "en morsmål" → "morsmål (et)" (morsmål is neuter)',
    apply(e) {
      e.norsk = 'morsmål (et)';
    }
  },
  {
    id: 'v-b2-work-career-029',
    desc: 'Fix norsk: strip spurious "en" prefix from adjective "en yrkesrettet" → "yrkesrettet"',
    apply(e) {
      e.norsk = 'yrkesrettet';
    }
  }
];

// ---------------------------------------------------------------------------
// Apply patches
// ---------------------------------------------------------------------------
let patched = 0;
let removed = 0;
const log = [];

// Build a map for fast lookup
const byId = new Map(entries.map((e) => [e.id, e]));

for (const patch of patches) {
  const entry = byId.get(patch.id);
  if (!entry) {
    log.push(`⚠️  NOT FOUND: ${patch.id}`);
    continue;
  }
  const before = { norsk: entry.norsk, lemma: entry.lemma };
  patch.apply(entry);
  const after = { norsk: entry.norsk, lemma: entry.lemma };
  log.push(`✅ PATCH  ${patch.id}`);
  log.push(`   ${patch.desc}`);
  log.push(`   norsk : "${before.norsk}" → "${after.norsk}"`);
  if (before.lemma !== after.lemma) {
    log.push(`   lemma : "${before.lemma}" → "${after.lemma}"`);
  }
  patched++;
}

// Remove duplicate v-b2-education-023
const dupId = 'v-b2-education-023';
const dupIdx = entries.findIndex((e) => e.id === dupId);
if (dupIdx !== -1) {
  const dup = entries[dupIdx];
  log.push(`🗑️  REMOVE ${dupId} (duplicate of v-b2-education-043)`);
  log.push(`   norsk: "${dup.norsk}", lemma: "${dup.lemma}"`);
  if (!DRY_RUN) entries.splice(dupIdx, 1);
  removed++;
} else {
  log.push(`⚠️  NOT FOUND for removal: ${dupId}`);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n=== fix-vocab-b2-data.mjs ===\n');
console.log(log.join('\n'));
console.log(`\nSummary: ${patched} patched, ${removed} removed`);
const finalCount = DRY_RUN ? originalCount - removed : entries.length;
console.log(`Entries: ${originalCount} → ${finalCount}`);

if (DRY_RUN) {
  console.log('\n[DRY RUN] No file written. Re-run without --dry-run to apply.\n');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
writeFileSync(DATA_PATH, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
console.log(`\n✅ Written to ${DATA_PATH}\n`);
