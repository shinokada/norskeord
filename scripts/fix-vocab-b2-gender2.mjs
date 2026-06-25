#!/usr/bin/env node
/**
 * fix-vocab-b2-gender2.mjs
 *
 * Second round of gender/lemma fixes in src/lib/data/vocab-b2.json,
 * identified from the normalise-norsk-field dry-run output.
 *
 *  1. v-b2-environment-024    "en utslipp"          → "utslipp (et)"       (neuter)
 *  2. v-b2-geography-029      "et grenselinje"       → "grenselinje (en)"   (common; also fix lemma "grense" → "grenselinje")
 *  3. v-b2-geography-030      "et kystlinje"         → "kystlinje (en)"     (common gender)
 *  4. v-b2-geography-032      "et ørken"             → "ørken (en)"         (common gender)
 *  5. v-b2-literature-017     "et dramaturgi"        → "dramaturgi (en)"    (common gender)
 *  6. v-b2-literature-018     "et epilog"            → "epilog (en)"        (common gender)
 *  7. v-b2-literature-021     "et prolog"            → "prolog (en)"        (common gender)
 *  8. v-b2-relationships-004  "en brudd"             → "brudd (et)"         (neuter)
 *  9. v-b2-relationships-012  "en kjæresteforhold"   → "kjæresteforhold (et)" (neuter; forhold-compounds)
 * 10. v-b2-relationships-014  "en kjærlighetsspråk"  → "kjærlighetsspråk (et)" (neuter; språk-compounds)
 *
 * Usage (dry-run):   node scripts/fix-vocab-b2-gender2.mjs --dry-run
 * Usage (live):      node scripts/fix-vocab-b2-gender2.mjs
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
    id: 'v-b2-environment-024',
    desc: 'Fix gender: "en utslipp" → "utslipp (et)" (utslipp is neuter)',
    apply(e) {
      e.norsk = 'utslipp (et)';
    }
  },
  {
    id: 'v-b2-geography-029',
    desc: 'Fix lemma + gender: "et grenselinje", lemma "grense" → "grenselinje (en)" (common gender; restore full lemma)',
    apply(e) {
      e.norsk = 'grenselinje (en)';
      e.lemma = 'grenselinje';
    }
  },
  {
    id: 'v-b2-geography-030',
    desc: 'Fix gender: "et kystlinje" → "kystlinje (en)" (common gender)',
    apply(e) {
      e.norsk = 'kystlinje (en)';
    }
  },
  {
    id: 'v-b2-geography-032',
    desc: 'Fix gender: "et ørken" → "ørken (en)" (common gender)',
    apply(e) {
      e.norsk = 'ørken (en)';
    }
  },
  {
    id: 'v-b2-literature-017',
    desc: 'Fix gender: "et dramaturgi" → "dramaturgi (en)" (common gender)',
    apply(e) {
      e.norsk = 'dramaturgi (en)';
    }
  },
  {
    id: 'v-b2-literature-018',
    desc: 'Fix gender: "et epilog" → "epilog (en)" (common gender)',
    apply(e) {
      e.norsk = 'epilog (en)';
    }
  },
  {
    id: 'v-b2-literature-021',
    desc: 'Fix gender: "et prolog" → "prolog (en)" (common gender)',
    apply(e) {
      e.norsk = 'prolog (en)';
    }
  },
  {
    id: 'v-b2-relationships-004',
    desc: 'Fix gender: "en brudd" → "brudd (et)" (brudd is neuter)',
    apply(e) {
      e.norsk = 'brudd (et)';
    }
  },
  {
    id: 'v-b2-relationships-012',
    desc: 'Fix gender: "en kjæresteforhold" → "kjæresteforhold (et)" (forhold-compounds are neuter)',
    apply(e) {
      e.norsk = 'kjæresteforhold (et)';
    }
  },
  {
    id: 'v-b2-relationships-014',
    desc: 'Fix gender: "en kjærlighetsspråk" → "kjærlighetsspråk (et)" (språk-compounds are neuter)',
    apply(e) {
      e.norsk = 'kjærlighetsspråk (et)';
    }
  }
];

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------
let patched = 0;
const log = [];

const byId = new Map(entries.map((e) => [e.id, e]));

for (const patch of patches) {
  const entry = byId.get(patch.id);
  if (!entry) {
    log.push(`⚠️  NOT FOUND: ${patch.id}`);
    continue;
  }
  // Capture before state
  const before = { norsk: entry.norsk, lemma: entry.lemma };
  // Apply to a scratch copy to get the after values for display
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

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n=== fix-vocab-b2-gender2.mjs ===\n');
console.log(log.join('\n'));
console.log(`\nSummary: ${patched} patched`);
console.log(`Entries: ${originalCount} → ${originalCount} (no removals)`);

if (DRY_RUN) {
  console.log('\n[DRY RUN] No file written. Re-run without --dry-run to apply.\n');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
writeFileSync(DATA_PATH, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
console.log(`\n✅ Written to ${DATA_PATH}\n`);
