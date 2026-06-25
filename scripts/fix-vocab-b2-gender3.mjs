#!/usr/bin/env node
/**
 * fix-vocab-b2-gender3.mjs
 *
 * Third round of gender fixes in src/lib/data/vocab-b2.json,
 * identified from the normalise-norsk-field dry-run output.
 *
 *  1. v-b2-argumentation-014   "en motargument"          → "motargument (et)"       (våpen/argument compounds neuter)
 *  2. v-b2-global-issues-017   "en kjernevåpen"          → "kjernevåpen (et)"       (våpen-compounds are neuter)
 *  3. v-b2-global-issues-020   "en masseødeleggelssvåpen"→ "masseødeleggelsesvåpen (et)" (neuter; also fix norsk typo)
 *  4. v-b2-media-006           "en kommentarfelt"        → REMOVE (duplicate of v-b2-media-032 which has correct gender)
 *  5. v-b2-technology-016      "en programmeringsspråk"  → "programmeringsspråk (et)" (språk-compounds are neuter)
 *  6. v-b2-work-career-011     "en hjemmekontor"         → "hjemmekontor (et)"      (kontor-compounds are neuter)
 *  7. v-b2-work-career-012     "en hybridarbeid"         → "hybridarbeid (et)"      (arbeid-compounds are neuter)
 *  8. v-b2-work-career-016     "en kompetansegap"        → "kompetansegap (et)"     (gap is neuter)
 *
 * Usage (dry-run):   node scripts/fix-vocab-b2-gender3.mjs --dry-run
 * Usage (live):      node scripts/fix-vocab-b2-gender3.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, '../src/lib/data/vocab-b2.json');
const DRY_RUN = process.argv.includes('--dry-run');

const raw = readFileSync(DATA_PATH, 'utf-8');
const entries = JSON.parse(raw);
const originalCount = entries.length;

const patches = [
  {
    id: 'v-b2-argumentation-014',
    desc: 'Fix gender: "en motargument" → "motargument (et)" (neuter)',
    apply(e) {
      e.norsk = 'motargument (et)';
    }
  },
  {
    id: 'v-b2-global-issues-017',
    desc: 'Fix gender: "en kjernevåpen" → "kjernevåpen (et)" (våpen-compounds are neuter)',
    apply(e) {
      e.norsk = 'kjernevåpen (et)';
    }
  },
  {
    id: 'v-b2-global-issues-020',
    desc: 'Fix gender + norsk typo: "en masseødeleggelssvåpen" → "masseødeleggelsesvåpen (et)"',
    apply(e) {
      e.norsk = 'masseødeleggelsesvåpen (et)';
      e.lemma = 'masseødeleggelsesvåpen';
    }
  },
  // v-b2-media-006 is handled separately as a deletion (duplicate of v-b2-media-032)
  {
    id: 'v-b2-technology-016',
    desc: 'Fix gender: "en programmeringsspråk" → "programmeringsspråk (et)" (språk-compounds are neuter)',
    apply(e) {
      e.norsk = 'programmeringsspråk (et)';
    }
  },
  {
    id: 'v-b2-work-career-011',
    desc: 'Fix gender: "en hjemmekontor" → "hjemmekontor (et)" (kontor-compounds are neuter)',
    apply(e) {
      e.norsk = 'hjemmekontor (et)';
    }
  },
  {
    id: 'v-b2-work-career-012',
    desc: 'Fix gender: "en hybridarbeid" → "hybridarbeid (et)" (arbeid-compounds are neuter)',
    apply(e) {
      e.norsk = 'hybridarbeid (et)';
    }
  },
  {
    id: 'v-b2-work-career-016',
    desc: 'Fix gender: "en kompetansegap" → "kompetansegap (et)" (gap is neuter)',
    apply(e) {
      e.norsk = 'kompetansegap (et)';
    }
  }
];

// ---------------------------------------------------------------------------
// Apply patches
// ---------------------------------------------------------------------------
let patched = 0;
let removed = 0;
const log = [];

const byId = new Map(entries.map((e) => [e.id, e]));

for (const patch of patches) {
  const entry = byId.get(patch.id);
  if (!entry) {
    log.push(`⚠️  NOT FOUND: ${patch.id}`);
    continue;
  }
  const before = { norsk: entry.norsk, lemma: entry.lemma };
  const scratch = { norsk: entry.norsk, lemma: entry.lemma };
  patch.apply(scratch);

  log.push(`✅ PATCH  ${patch.id}`);
  log.push(`   ${patch.desc}`);
  log.push(`   norsk : "${before.norsk}" → "${scratch.norsk}"`);
  if (before.lemma !== scratch.lemma) {
    log.push(`   lemma : "${before.lemma}" → "${scratch.lemma}"`);
  }

  if (!DRY_RUN) patch.apply(entry);
  patched++;
}

// Remove v-b2-media-006 (duplicate of v-b2-media-032, which already has correct gender)
const dupId = 'v-b2-media-006';
const dupIdx = entries.findIndex((e) => e.id === dupId);
if (dupIdx !== -1) {
  const dup = entries[dupIdx];
  log.push(`🗑️  REMOVE ${dupId} (duplicate of v-b2-media-032; wrong gender "en kommentarfelt")`);
  log.push(`   norsk: "${dup.norsk}", lemma: "${dup.lemma}"`);
  if (!DRY_RUN) entries.splice(dupIdx, 1);
  removed++;
} else {
  log.push(`⚠️  NOT FOUND for removal: ${dupId}`);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n=== fix-vocab-b2-gender3.mjs ===\n');
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
