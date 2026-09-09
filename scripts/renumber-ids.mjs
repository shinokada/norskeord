/**
 * renumber-ids.mjs
 *
 * Renumbers all entries in vocab-*.json and uttrykk-*.json so that IDs are
 * sequential with no gaps.
 *
 * Vocab format:   v-{level}-{NNNN}   e.g. v-a1-0001  (4-digit, no category segment)
 * Uttrykk format: u-{level}-{NNN}    e.g. u-a1-001
 *
 * Within each file, entries are numbered as a single sequence per level file
 * (category no longer affects numbering — it's a plain data field, not part
 * of the id; see ai-docs/implementation/id-new-format.md).
 *
 * --emit-mapping: this is also the script that performs the one-time
 * category-in-id → v-{level}-{NNNN} production migration (Phase 2 of
 * ai-docs/implementation/id-new-format.md). Pass this flag to additionally
 * write every changed vocab {oldId: newId} pair to
 * src/lib/data/id-migration-map.json — consumed at runtime as a fallback
 * for guests whose localStorage still has stale ids (Phase 3). Uttrykk ids
 * are never included (their format didn't change). A vocab file is backed
 * up to {file}.bak before being overwritten, but only if it actually has
 * changes to write.
 *
 * Usage:
 *   node scripts/renumber-ids.mjs --dry-run
 *   node scripts/renumber-ids.mjs
 *   node scripts/renumber-ids.mjs --emit-mapping --dry-run   # preview the Phase 2 migration
 *   node scripts/renumber-ids.mjs --emit-mapping             # apply it + write the mapping file
 */

import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../src/lib/data');

const DRY_RUN = process.argv.includes('--dry-run');
const EMIT_MAPPING = process.argv.includes('--emit-mapping');

function pad3(n) {
  return String(n).padStart(3, '0');
}

function pad4(n) {
  return String(n).padStart(4, '0');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

// ── Vocab files ───────────────────────────────────────────────────────────────
// ID format: v-{level}-{NNNN}
// Numbered as a single sequence per level file, starting at 0001.

const VOCAB_FILES = [
  { file: 'vocab-a1.json', level: 'a1' },
  { file: 'vocab-a2.json', level: 'a2' },
  { file: 'vocab-b1.json', level: 'b1' },
  { file: 'vocab-b2.json', level: 'b2' },
  { file: 'vocab-c.json', level: 'c' }
];

console.log(
  DRY_RUN ? '\n=== DRY RUN — no files will be written ===\n' : '\n=== Renumbering IDs ===\n'
);

let totalVocabChanged = 0;
const idMap = {}; // oldId -> newId, only populated when --emit-mapping is set

for (const { file, level } of VOCAB_FILES) {
  const path = join(dataDir, file);
  const entries = readJson(path);

  // Single counter per level file (mirrors the uttrykk loop below).
  let counter = 0;
  let changed = 0;

  const renumbered = entries.map((entry) => {
    counter++;
    const newId = `v-${level}-${pad4(counter)}`;
    if (newId !== entry.id) {
      changed++;
      if (EMIT_MAPPING && entry.id) {
        idMap[entry.id] = newId;
      }
    }
    return { ...entry, id: newId };
  });

  totalVocabChanged += changed;
  console.log(`${file}: ${entries.length} entries, ${changed} IDs changed`);

  if (!DRY_RUN && changed > 0) {
    const bakPath = `${path}.bak`;
    copyFileSync(path, bakPath);
    writeJson(path, renumbered);
    console.log(`  💾  Backed up to ${file}.bak and wrote ${changed} new id(s)`);
  } else if (!DRY_RUN) {
    writeJson(path, renumbered);
  }
}

// ── Uttrykk files ─────────────────────────────────────────────────────────────
// ID format: u-{level}-{NNN}
// Single sequence per file, starting at 001.

const UTTRYKK_FILES = [
  { file: 'uttrykk-a1.json', level: 'a1' },
  { file: 'uttrykk-a2.json', level: 'a2' },
  { file: 'uttrykk-b1.json', level: 'b1' },
  { file: 'uttrykk-b2.json', level: 'b2' },
  { file: 'uttrykk-c.json', level: 'c' }
];

let totalUttrykChanged = 0;

for (const { file, level } of UTTRYKK_FILES) {
  const path = join(dataDir, file);
  const entries = readJson(path);

  let changed = 0;
  const renumbered = entries.map((entry, i) => {
    const newId = `u-${level}-${pad3(i + 1)}`;
    if (newId !== entry.id) changed++;
    return { ...entry, id: newId };
  });

  totalUttrykChanged += changed;
  console.log(`${file}: ${entries.length} entries, ${changed} IDs changed`);

  if (!DRY_RUN) {
    writeJson(path, renumbered);
  }
}

console.log(`\nVocab IDs changed:   ${totalVocabChanged}`);
console.log(`Uttrykk IDs changed: ${totalUttrykChanged}`);
console.log(`Total:               ${totalVocabChanged + totalUttrykChanged}`);

if (EMIT_MAPPING) {
  const mapPath = join(dataDir, 'id-migration-map.json');
  const mapEntryCount = Object.keys(idMap).length;
  if (DRY_RUN) {
    console.log(`\n🧪  --dry-run: would write ${mapEntryCount} entries to id-migration-map.json`);
  } else {
    writeJson(mapPath, idMap);
    console.log(`\n💾  Wrote ${mapEntryCount} entries to src/lib/data/id-migration-map.json`);
  }
}

if (DRY_RUN) {
  console.log('\nDry run complete — run without --dry-run to apply.');
} else {
  console.log('\nDone. All IDs are now sequential.');
  console.log('NOTE: uttrykk-*-preview.json files are not updated by this script.');
}
