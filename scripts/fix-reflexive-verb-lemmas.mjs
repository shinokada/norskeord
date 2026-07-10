#!/usr/bin/env node
/**
 * fix-reflexive-verb-lemmas.mjs
 *
 * Fixes the "verb lemma should be bare infinitive" warning from check-vocab.mjs.
 *
 * Finds every part: "verb" entry across all vocab-xx.json files where `lemma`
 * is identical to `norsk` and `norsk` starts with "å " (e.g. norsk/lemma both
 * "å sette seg"), and strips the "å " prefix from `lemma` only — norsk is left
 * untouched. This is a pure string transform, no linguistic judgment involved.
 *
 * Does NOT touch any other field — norsk, english, examples, category, level,
 * id, part all stay exactly as they are. Only `lemma` changes, and only when
 * it exactly matches the "identical to norsk, starts with å " pattern.
 *
 * Usage:
 *   node scripts/fix-reflexive-verb-lemmas.mjs --dry-run   ← always try this first
 *   node scripts/fix-reflexive-verb-lemmas.mjs
 *
 * Options:
 *   --dry-run   Print what would happen without writing any files (default: false)
 *   --files     Comma-separated list of vocab-xx.json filenames to restrict to
 *               e.g. --files=vocab-b2.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src/lib/data');

const ALL_VOCAB_FILES = [
  'vocab-a1.json',
  'vocab-a2.json',
  'vocab-b1.json',
  'vocab-b2.json',
  'vocab-c.json'
];

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const filesArg = args.find((a) => a.startsWith('--files='))?.split('=')[1];
const TARGET_FILES = filesArg ? filesArg.split(',').map((s) => s.trim()) : ALL_VOCAB_FILES;

function writeBackup(filePath) {
  const bakPath = filePath + '.bak';
  fs.copyFileSync(filePath, bakPath);
  return bakPath;
}

function needsFix(entry) {
  return (
    entry.part === 'verb' &&
    typeof entry.norsk === 'string' &&
    typeof entry.lemma === 'string' &&
    entry.norsk.startsWith('å ') &&
    entry.lemma === entry.norsk
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  if (DRY_RUN) console.log('🔍 DRY RUN — no files will be modified\n');

  let totalFixed = 0;

  for (const file of TARGET_FILES) {
    const filePath = path.join(DATA_DIR, file);

    if (!fs.existsSync(filePath)) {
      console.error(`  ❌ Missing file: ${file}`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let changedInFile = 0;

    const newData = data.map((entry) => {
      if (!needsFix(entry)) return entry;

      const newLemma = entry.norsk.replace(/^å /, '');
      console.log(
        `    ${entry.id}  |  norsk="${entry.norsk}"  |  lemma "${entry.lemma}" → "${newLemma}"`
      );
      changedInFile += 1;
      return { ...entry, lemma: newLemma };
    });

    if (changedInFile > 0) {
      console.log(`  ${file}`);
      if (!DRY_RUN) {
        writeBackup(filePath);
        fs.writeFileSync(filePath, JSON.stringify(newData, null, 2) + '\n', 'utf8');
        console.log(`    ✓ Fixed ${changedInFile} entries in ${file}`);
      }
      console.log('');
    }

    totalFixed += changedInFile;
  }

  if (totalFixed === 0) {
    console.log('Nothing to fix — no matching entries found.');
    return;
  }

  if (DRY_RUN) {
    console.log(`\n✅ Dry run complete — ${totalFixed} entries would be fixed.`);
    console.log('   Run without --dry-run to apply.\n');
  } else {
    console.log(`\n✅ Done — fixed ${totalFixed} entries.`);
    console.log('   Backups written as .bak files.\n');
  }
}

main();
