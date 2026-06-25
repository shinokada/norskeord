#!/usr/bin/env node
/**
 * fix-vocab-b2-empty-lemmas.mjs
 *
 * Fixes three entries in vocab-b2.json that have empty lemma fields
 * and raw guillemet-quoted norsk values that the normalise script skipped.
 *
 *  1. v-b2-advanced-adjectives-076  «gærent»  → norsk: "gæren", lemma: "gæren"  (adjective)
 *  2. v-b2-media-043                «memes»   → norsk: "meme (et)", lemma: "meme" (neuter noun)
 *  3. v-b2-relationships-041        «småttis/en» → norsk: "småttis (en)", lemma: "småttis"
 *
 * Usage (dry-run):   node scripts/fix-vocab-b2-empty-lemmas.mjs --dry-run
 * Usage (live):      node scripts/fix-vocab-b2-empty-lemmas.mjs
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
    id: 'v-b2-advanced-adjectives-076',
    desc: 'Fix empty lemma + guillemet norsk: «gærent» → norsk: "gæren", lemma: "gæren" (adjective base form)',
    apply(e) {
      e.norsk = 'gæren';
      e.lemma = 'gæren';
    }
  },
  {
    id: 'v-b2-media-043',
    desc: 'Fix empty lemma + guillemet norsk: «memes» → norsk: "meme (et)", lemma: "meme" (neuter noun)',
    apply(e) {
      e.norsk = 'meme (et)';
      e.lemma = 'meme';
    }
  },
  {
    id: 'v-b2-relationships-041',
    desc: 'Fix empty lemma + guillemet norsk: «småttis/en» → norsk: "småttis (en)", lemma: "småttis"',
    apply(e) {
      e.norsk = 'småttis (en)';
      e.lemma = 'småttis';
    }
  }
];

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
  const scratch = { norsk: entry.norsk, lemma: entry.lemma };
  patch.apply(scratch);
  log.push(`✅ PATCH  ${patch.id}`);
  log.push(`   ${patch.desc}`);
  log.push(`   norsk : "${before.norsk}" → "${scratch.norsk}"`);
  if (before.lemma !== scratch.lemma) log.push(`   lemma : "${before.lemma}" → "${scratch.lemma}"`);
  if (!DRY_RUN) patch.apply(entry);
  patched++;
}

console.log('\n=== fix-vocab-b2-empty-lemmas.mjs ===\n');
console.log(log.join('\n'));
console.log(`\nSummary: ${patched} patched`);
console.log(`Entries: ${originalCount} → ${originalCount}`);

if (DRY_RUN) {
  console.log('\n[DRY RUN] No file written. Re-run without --dry-run to apply.\n');
  process.exit(0);
}

writeFileSync(DATA_PATH, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
console.log(`\n✅ Written to ${DATA_PATH}\n`);
