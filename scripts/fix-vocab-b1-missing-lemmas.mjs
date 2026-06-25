#!/usr/bin/env node
/**
 * fix-vocab-b1-missing-lemmas.mjs
 *
 * Many entries in vocab-b1.json (364 of them) have a missing `lemma` field,
 * which prevents normalise-norsk-field.mjs from processing them.
 * This script derives the lemma from the existing `norsk` field:
 *
 *   noun   "en X" / "et X"  → lemma = X
 *   noun   bare word        → lemma = word (API will resolve gender later)
 *   verb   "å X"            → lemma = X
 *   verb   "å X Y"          → lemma = "X Y" (phrasal verb, kept as-is)
 *   phrase / adjective      → lemma = norsk (already correct form)
 *   special cases fixed manually (see OVERRIDES below)
 *
 * After running this script, re-run:
 *   node scripts/normalise-norsk-field.mjs --files vocab-b1.json --force
 *
 * Usage (dry-run):  node scripts/fix-vocab-b1-missing-lemmas.mjs --dry-run
 * Usage (live):     node scripts/fix-vocab-b1-missing-lemmas.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, '../src/lib/data/vocab-b1.json');
const DRY_RUN = process.argv.includes('--dry-run');

const raw = readFileSync(DATA_PATH, 'utf-8');
const entries = JSON.parse(raw);
const originalCount = entries.length;

// Manual overrides for entries where the auto-derivation would be wrong
const OVERRIDES = {
  // adjective with spurious "en" prefix
  'v-b1-society-021': { lemma: 'gravid', norsk: 'gravid' },
  // noun: "et spørsmål og svar" is a phrase; treat as phrase, not noun
  'v-b1-communication-skills-017': { lemma: 'spørsmål og svar', norsk: 'spørsmål og svar' },
  // noun: "en gate (flyplass)" — lemma should strip the parenthetical
  'v-b1-travel-006': { lemma: 'gate', norsk: 'gate (en)' },
  // noun: "vann (H₂O)" — lemma is just vann
  'v-b1-science-nature-048': { lemma: 'vann', norsk: 'vann (et)' },
  // nouns that are definite forms — need lemma correction
  'v-b1-society-001': { lemma: 'Nav', norsk: 'Nav (en)' }, // proper noun
  'v-b1-society-002': { lemma: 'Stortinget', norsk: 'Stortinget (et)' }, // proper noun
  'v-b1-society-003': { lemma: 'allemannsrett', norsk: 'allemannsrett (en)' },
  'v-b1-society-047': { lemma: 'helsevesen', norsk: 'helsevesen (et)' },
  'v-b1-society-064': { lemma: 'oljefond', norsk: 'oljefond (et)' },
  'v-b1-society-068': { lemma: 'russetid', norsk: 'russetid (en)' },
  'v-b1-society-071': { lemma: 'skattesystem', norsk: 'skattesystem (et)' },
  'v-b1-society-089': { lemma: 'velferdsstat', norsk: 'velferdsstat (en)' },
  'v-b1-personal-growth-022': { lemma: 'fortid', norsk: 'fortid (en)' },
  'v-b1-personal-growth-024': { lemma: 'fremtid', norsk: 'fremtid (en)' },
  'v-b1-travel-016': { lemma: 'vandrehjem', norsk: 'vandrehjem (et)' }, // "vandrerhjemmet" is definite
  'v-b1-travel-019': { lemma: 'flybillett', norsk: 'flybillett (en)' }, // "flybilletten" is definite
  'v-b1-urban-life-010': { lemma: 'utkant', norsk: 'utkant (en)' }, // "utkanten" is definite
  // noun: plural forms
  'v-b1-family-013': { lemma: 'generasjon', norsk: 'generasjon (en)' }, // "generasjoner" is plural
  'v-b1-mental-wellbeing-016': { lemma: 'grense', norsk: 'grense (en)' }, // "grenser" is plural
  'v-b1-fitness-024': { lemma: 'skøyte', norsk: 'skøyte (en)' }, // "skøyter" is plural
  // noun: "psykisk helse" is a phrase, not a single noun
  'v-b1-mental-wellbeing-027': { lemma: 'psykisk helse', norsk: 'psykisk helse' }
};

let fixed = 0;
const log = [];

for (const e of entries) {
  if (e.lemma !== undefined && e.lemma !== '') continue; // already has lemma

  const override = OVERRIDES[e.id];
  if (override) {
    const before = { norsk: e.norsk, lemma: e.lemma };
    log.push(`✅ OVERRIDE ${e.id} (${e.part})`);
    log.push(`   norsk : "${before.norsk}" → "${override.norsk}"`);
    log.push(`   lemma : "${before.lemma ?? ''}" → "${override.lemma}"`);
    if (!DRY_RUN) {
      e.lemma = override.lemma;
      e.norsk = override.norsk;
    }
    fixed++;
    continue;
  }

  // Auto-derive lemma from norsk
  let lemma;
  const n = e.norsk;

  if (e.part === 'noun') {
    const prefixMatch = n.match(/^(en|et|ei)\s+(.+)$/);
    if (prefixMatch) lemma = prefixMatch[2];
    else lemma = n; // bare noun — normalise script will look up gender
  } else if (e.part === 'verb') {
    const verbMatch = n.match(/^å\s+(.+)$/);
    if (verbMatch) lemma = verbMatch[1];
    else lemma = n;
  } else {
    // adjective, phrase, etc — lemma = norsk
    lemma = n;
  }

  if (lemma !== null) {
    log.push(`  AUTO  ${e.id} (${e.part}): lemma = "${lemma}"`);
    if (!DRY_RUN) e.lemma = lemma;
    fixed++;
  }
}

console.log('\n=== fix-vocab-b1-missing-lemmas.mjs ===\n');
console.log(log.join('\n'));
console.log(`\nSummary: ${fixed} lemmas populated`);
console.log(`Entries: ${originalCount} (no additions/removals)`);

if (DRY_RUN) {
  console.log('\n[DRY RUN] No file written. Re-run without --dry-run to apply.\n');
  process.exit(0);
}

writeFileSync(DATA_PATH, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
console.log(`\n✅ Written to ${DATA_PATH}\n`);
