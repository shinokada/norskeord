#!/usr/bin/env node
/**
 * fix-vocab-b2-gender.mjs
 *
 * Fixes gender errors and definite-form lemmas in src/lib/data/vocab-b2.json
 * identified during the normalise-norsk-field dry-run.
 *
 *  1. v-b2-abstract-nouns-010   "en formål"               → "formål (et)"       (neuter)
 *  2. v-b2-abstract-nouns-061   "tomrom/met"              → "tomrom (et)"       (neuter; /met is definite hint)
 *  3. v-b2-academic-language-028 "et kildehenvisning"     → "kildehenvisning (en)" (common gender)
 *  4. v-b2-argumentation-006    "en bevis"                → "bevis (et)"        (neuter)
 *  5. v-b2-argumentation-025    "et kjensgjerning"        → "kjensgjerning (en)" (common gender)
 *  6. v-b2-argumentation-027    "et syllogisme"           → "syllogisme (en)"   (common gender)
 *  7. v-b2-arts-019             "et regi"                 → "regi (en)"         (common gender)
 *  8. v-b2-culture-039          "janteloven" (definite)   → "jantelov (en)"     + fix lemma
 *  9. v-b2-economics-003        "arbeidsstyrken/n" (def.) → "arbeidsstyrke (en)" + fix lemma
 * 10. v-b2-history-013          "et arkeologi"            → "arkeologi (en)"    (common gender)
 * 11. v-b2-work-career-031      "et arbeidsledighetstrygd" → "arbeidsledighetstrygd (en)" (common gender)
 * 12. v-b2-work-career-035      "et kompetanse"           → "kompetanse (en)"   (common gender)
 *
 * Usage (dry-run):   node scripts/fix-vocab-b2-gender.mjs --dry-run
 * Usage (live):      node scripts/fix-vocab-b2-gender.mjs
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
    id: 'v-b2-abstract-nouns-010',
    desc: 'Fix gender: "en formål" → "formål (et)" (formål is neuter)',
    apply(e) {
      e.norsk = 'formål (et)';
    }
  },
  {
    id: 'v-b2-abstract-nouns-061',
    desc: 'Fix format+gender: "tomrom/met" → "tomrom (et)" (neuter; /met is definite)',
    apply(e) {
      e.norsk = 'tomrom (et)';
    }
  },
  {
    id: 'v-b2-academic-language-028',
    desc: 'Fix gender: "et kildehenvisning" → "kildehenvisning (en)" (common gender)',
    apply(e) {
      e.norsk = 'kildehenvisning (en)';
    }
  },
  {
    id: 'v-b2-argumentation-006',
    desc: 'Fix gender: "en bevis" → "bevis (et)" (bevis is neuter)',
    apply(e) {
      e.norsk = 'bevis (et)';
    }
  },
  {
    id: 'v-b2-argumentation-025',
    desc: 'Fix gender: "et kjensgjerning" → "kjensgjerning (en)" (common gender)',
    apply(e) {
      e.norsk = 'kjensgjerning (en)';
    }
  },
  {
    id: 'v-b2-argumentation-027',
    desc: 'Fix gender: "et syllogisme" → "syllogisme (en)" (common gender)',
    apply(e) {
      e.norsk = 'syllogisme (en)';
    }
  },
  {
    id: 'v-b2-arts-019',
    desc: 'Fix gender: "et regi" → "regi (en)" (regi is common gender)',
    apply(e) {
      e.norsk = 'regi (en)';
    }
  },
  {
    id: 'v-b2-culture-039',
    desc: 'Fix definite lemma + format: "janteloven" → "jantelov (en)"',
    apply(e) {
      e.norsk = 'jantelov (en)';
      e.lemma = 'jantelov';
    }
  },
  {
    id: 'v-b2-economics-003',
    desc: 'Fix definite lemma + slash format: "arbeidsstyrken/n" → "arbeidsstyrke (en)"',
    apply(e) {
      e.norsk = 'arbeidsstyrke (en)';
      e.lemma = 'arbeidsstyrke';
    }
  },
  {
    id: 'v-b2-history-013',
    desc: 'Fix gender: "et arkeologi" → "arkeologi (en)" (common gender)',
    apply(e) {
      e.norsk = 'arkeologi (en)';
    }
  },
  {
    id: 'v-b2-work-career-031',
    desc: 'Fix gender: "et arbeidsledighetstrygd" → "arbeidsledighetstrygd (en)" (trygd compounds are common gender)',
    apply(e) {
      e.norsk = 'arbeidsledighetstrygd (en)';
    }
  },
  {
    id: 'v-b2-work-career-035',
    desc: 'Fix gender: "et kompetanse" → "kompetanse (en)" (common gender)',
    apply(e) {
      e.norsk = 'kompetanse (en)';
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
  const before = { norsk: entry.norsk, lemma: entry.lemma };
  if (!DRY_RUN) patch.apply(entry);
  else patch.apply({ ...entry }); // apply to a clone so we can show what would change
  // Re-apply to get after values for display
  const scratch = { norsk: before.norsk, lemma: before.lemma };
  patch.apply(scratch);

  log.push(`✅ PATCH  ${patch.id}`);
  log.push(`   ${patch.desc}`);
  log.push(`   norsk : "${before.norsk}" → "${scratch.norsk}"`);
  if (before.lemma !== scratch.lemma) {
    log.push(`   lemma : "${before.lemma}" → "${scratch.lemma}"`);
  }
  patched++;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n=== fix-vocab-b2-gender.mjs ===\n');
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
// Re-apply all patches to the real entries (dry-run used scratch objects)
for (const patch of patches) {
  const entry = byId.get(patch.id);
  if (entry) patch.apply(entry);
}

writeFileSync(DATA_PATH, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
console.log(`\n✅ Written to ${DATA_PATH}\n`);
