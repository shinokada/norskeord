#!/usr/bin/env node
/**
 * retag-vocab-parts.mjs
 *
 * Reads scripts/output/phrase-classification.json (produced by classify-vocab-phrases.mjs),
 * takes all entries classified as "type_b" whose suggested_part differs from their
 * current part (almost always "phrase" → "noun", occasionally "verb"/"preposition"/etc.),
 * and retags the `part` field in place in the matching vocab-xx.json file.
 *
 * This does NOT move entries between files and does NOT touch any other field —
 * norsk, lemma, english, examples, category, level, id all stay exactly as they are.
 * Only `part` changes.
 *
 * Usage:
 *   node scripts/retag-vocab-parts.mjs --dry-run   ← always try this first
 *   node scripts/retag-vocab-parts.mjs
 *
 * Options:
 *   --dry-run   Print what would happen without writing any files (default: false)
 *   --ids       Comma-separated list of vocab IDs to retag (overrides type_b filter)
 *               e.g. --ids v-b1-arts-culture-015,v-b1-environment-003
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src/lib/data');
const CLASSIFICATION_FILE = path.join(PROJECT_ROOT, 'scripts/output/phrase-classification.json');

// ── Manual overrides ──────────────────────────────────────────────────────────

// type_b entries to skip (leave as "phrase" — reclassified after dry-run review)
const SKIP_IDS = new Set([
  // e.g. 'v-b1-education-030', // livslang læring — disagree with suggested_part, keep as phrase
]);

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const idsArg = args.find((a) => a.startsWith('--ids='))?.split('=')[1];
const FILTER_IDS = idsArg ? new Set(idsArg.split(',').map((s) => s.trim())) : null;

// ── Level → file map ──────────────────────────────────────────────────────────

const VOCAB_FILE_BY_LEVEL = {
  a1: 'vocab-a1.json',
  a2: 'vocab-a2.json',
  b1: 'vocab-b1.json',
  b2: 'vocab-b2.json',
  c: 'vocab-c.json'
};

function writeBackup(filePath) {
  const bakPath = filePath + '.bak';
  fs.copyFileSync(filePath, bakPath);
  return bakPath;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  if (DRY_RUN) console.log('🔍 DRY RUN — no files will be modified\n');

  if (!fs.existsSync(CLASSIFICATION_FILE)) {
    console.error(`❌ Classification file not found: ${CLASSIFICATION_FILE}`);
    console.error('   Run classify-vocab-phrases.mjs first.');
    process.exit(1);
  }
  const classified = JSON.parse(fs.readFileSync(CLASSIFICATION_FILE, 'utf8'));

  // Filter to type_b entries with a real, different suggested_part (or --ids override),
  // excluding manual skips.
  const toRetag = (
    FILTER_IDS
      ? classified.filter((e) => FILTER_IDS.has(e.id))
      : classified.filter(
          (e) => e.classification === 'type_b' && e.suggested_part && e.suggested_part !== e.part
        )
  ).filter((e) => !SKIP_IDS.has(e.id));

  if (toRetag.length === 0) {
    console.log('Nothing to retag.');
    return;
  }

  // Group by level so we only open/write each vocab file once
  const byLevel = {};
  for (const entry of toRetag) {
    const level = entry._level;
    if (!VOCAB_FILE_BY_LEVEL[level]) {
      console.warn(`  ⚠ Unknown level "${level}" for ${entry.id} — skipping`);
      continue;
    }
    if (!byLevel[level]) byLevel[level] = [];
    byLevel[level].push(entry);
  }

  console.log(`📋 Entries to retag: ${toRetag.length}\n`);

  let totalRetagged = 0;

  for (const [level, entries] of Object.entries(byLevel)) {
    const vocabFile = VOCAB_FILE_BY_LEVEL[level];
    const vocabPath = path.join(DATA_DIR, vocabFile);

    if (!fs.existsSync(vocabPath)) {
      console.error(`  ❌ Missing vocab file: ${vocabFile}`);
      continue;
    }

    const vocabData = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
    const byId = new Map(entries.map((e) => [e.id, e]));

    console.log(`  ${level.toUpperCase()} — ${vocabFile}`);

    let changedInFile = 0;
    const newVocabData = vocabData.map((v) => {
      const change = byId.get(v.id);
      if (!change) return v;

      console.log(`    ${v.id}  |  ${v.norsk}  |  "${v.part}" → "${change.suggested_part}"`);

      if (byId.get(v.id).suggested_part !== v.part) {
        changedInFile += 1;
      }

      return { ...v, part: change.suggested_part };
    });

    // Warn about any requested IDs that weren't found in this file
    for (const id of byId.keys()) {
      if (!vocabData.some((v) => v.id === id)) {
        console.warn(`    ⚠ ${id} not found in ${vocabFile} — skipped`);
      }
    }

    if (!DRY_RUN && changedInFile > 0) {
      writeBackup(vocabPath);
      fs.writeFileSync(vocabPath, JSON.stringify(newVocabData, null, 2) + '\n', 'utf8');
      console.log(`    ✓ Retagged ${changedInFile} entries in ${vocabFile}`);
    }

    totalRetagged += changedInFile;
    console.log('');
  }

  if (DRY_RUN) {
    console.log(`\n✅ Dry run complete — ${toRetag.length} entries would be retagged.`);
    console.log('   Run without --dry-run to apply.\n');
  } else {
    console.log(`\n✅ Done — retagged ${totalRetagged} entries.`);
    console.log('   Backups written as .bak files.\n');
  }
}

main();
