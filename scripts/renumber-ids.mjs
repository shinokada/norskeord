/**
 * renumber-ids.mjs
 *
 * Renumbers all entries in vocab-*.json and uttrykk-*.json so that IDs are
 * sequential with no gaps.
 *
 * Format: w-{NNNNNN}   e.g. w-000001  (6-digit, ONE global counter shared
 *                       across vocab AND uttrykk, across all 5 levels of
 *                       each — no level, category, or type segment; see
 *                       ai-docs/implementation/id-new-format.md, "Round 3")
 *
 * All ten files (5 vocab + 5 uttrykk) are numbered as a single sequence, in
 * file order (vocab a1 → a2 → b1 → b2 → c, then uttrykk a1 → a2 → b1 → b2 →
 * c) then array order within each file. `level`, `category`, and `part` are
 * plain data fields, not part of the id — moving an entry between vocab and
 * uttrykk is now a pure data edit with no id implication.
 *
 * This script fully regenerates every id from scratch on every run. That's
 * fine as a one-time migration engine (which is what --emit-mapping below is
 * for), but now that ids are global and shared across types, it is NOT meant
 * to be used as ongoing tooling after the migration — inserting/deleting/
 * moving any single entry would cascade-renumber everything after it.
 * Ongoing id assignment should go through assign-ids.mjs's append-only
 * shared counter instead.
 *
 * --emit-mapping: this is also the script that performs the one-time
 * production migration to the shared global id (Phase 10 of
 * ai-docs/implementation/id-new-format.md, "Round 3"). Pass this flag to
 * additionally write a **flattened, single-generation** { oldId: newId }
 * mapping to src/lib/data/id-migration-map.json — consumed at runtime as a
 * fallback for guests whose localStorage still has a stale id (Phase 3/7/11).
 *
 * Flattening: for vocab, "oldId" is the pre-Round-1 v-{level}-{category}-{NNN}
 * id — the shape every real current guest actually has, since neither Round 1
 * nor Round 2 has shipped to production. That id is recovered from each
 * vocab file's Round-1 .bak (vocab-{level}.json.bak, written by an earlier
 * run of this same script and still present locally, not committed),
 * matched to the current file by array order (Round 1 preserved order, only
 * changing `id`). Before touching any file, --emit-mapping runs a pre-flight
 * check across all 5 vocab .bak files: each must exist AND its ids must
 * still match the original v-{level}-{category}-{NNN} shape. Both matter —
 * this script's own backup-before-write step overwrites {file}.bak with
 * whatever the file held *before that run*, so a .bak can exist but hold an
 * already-migrated (intermediate) shape if a previous --emit-mapping run
 * already consumed the true original. Either failure aborts the whole run
 * before any file is written, rather than silently emitting a mapping keyed
 * by the wrong shape. For uttrykk, neither Round 1 nor Round 2 ever touched
 * production, so the current on-disk id (u-{level}-{NNN}) already IS the
 * original — no .bak lookup needed. Either way the mapping written is a
 * single old→new hop, no chained resolution needed at runtime.
 *
 * A file is backed up to {file}.bak before being overwritten, but only if
 * it actually has changes to write.
 *
 * Usage:
 *   node scripts/renumber-ids.mjs --dry-run
 *   node scripts/renumber-ids.mjs
 *   node scripts/renumber-ids.mjs --emit-mapping --dry-run   # preview the Phase 10 migration
 *   node scripts/renumber-ids.mjs --emit-mapping             # apply it + write the mapping file
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '../src/lib/data');

const DRY_RUN = process.argv.includes('--dry-run');
const EMIT_MAPPING = process.argv.includes('--emit-mapping');

function pad6(n) {
  return String(n).padStart(6, '0');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

console.log(
  DRY_RUN ? '\n=== DRY RUN — no files will be written ===\n' : '\n=== Renumbering IDs ===\n'
);

// The true pre-Round-1 original shape: v-{level}-{category}-{NNN}. Used as a
// pre-flight guard below — a .bak file that EXISTS but holds a different
// (already-migrated, intermediate) shape is just as dangerous as a missing
// one: this script's own backup-before-write step overwrites {file}.bak
// with whatever the file held *before this run*, so a .bak surviving from
// an earlier --emit-mapping run (or from Round 1's Phase 2 migration, once
// clobbered by a later run) can silently hold the wrong generation. Reading
// it without checking its shape would build a mapping keyed by an
// intermediate id no real guest has, exactly the failure mode `.bak`
// existence alone can't catch.
const ORIGINAL_VOCAB_ID_RE = /^v-[a-z0-9]+-.+-\d{3}$/;

if (EMIT_MAPPING) {
  const problems = [];
  for (const file of VOCAB_FILES) {
    const bakPath = join(dataDir, file) + '.bak';
    if (!existsSync(bakPath)) {
      problems.push(`${file}.bak is missing`);
      continue;
    }
    const bakEntries = readJson(bakPath);
    const sample = bakEntries.slice(0, 20);
    const wrongShape = sample.some((e) => e.id && !ORIGINAL_VOCAB_ID_RE.test(e.id));
    if (wrongShape) {
      problems.push(
        `${file}.bak exists but doesn't look like the original v-{level}-{category}-{NNN} shape — likely clobbered by an earlier renumber-ids.mjs run`
      );
    }
  }
  if (problems.length > 0) {
    console.error(
      `\n❌  --emit-mapping pre-flight check failed:\n` +
        problems.map((p) => `   - ${p}`).join('\n') +
        `\n\n   Aborting before touching any files — rebuilding id-migration-map.json needs the` +
        `\n   true original ids, and a wrong or missing .bak would silently produce a mapping` +
        `\n   keyed by the wrong shape. This script is a one-time migration engine (see header` +
        `\n   comment) — if you're seeing this after the Round 3 migration already completed` +
        `\n   successfully, id-migration-map.json is very likely already correct and this run` +
        `\n   isn't needed.`
    );
    process.exit(1);
  }
}

// One shared counter across everything below — vocab and uttrykk, all levels.
let sharedCounter = 0;
let totalChanged = 0;
const idMap = {}; // oldId -> newId (flattened, single generation), only populated when --emit-mapping is set

// ── Vocab files ───────────────────────────────────────────────────────────────
// Processed first, in level order, feeding the shared counter.

const VOCAB_FILES = [
  'vocab-a1.json',
  'vocab-a2.json',
  'vocab-b1.json',
  'vocab-b2.json',
  'vocab-c.json'
];

for (const file of VOCAB_FILES) {
  const path = join(dataDir, file);
  const entries = readJson(path);

  // Recover the pre-Round-1 id for each entry (by array order) from the
  // Round-1 .bak. When --emit-mapping is set, the pre-flight check above
  // already confirmed this file exists and holds the correct original
  // shape — so a plain existsSync is enough here.
  const bakPath = `${path}.bak`;
  const origEntries = existsSync(bakPath) ? readJson(bakPath) : null;

  let changed = 0;

  const renumbered = entries.map((entry, i) => {
    sharedCounter++;
    const newId = `w-${pad6(sharedCounter)}`;
    if (newId !== entry.id) {
      changed++;
      if (EMIT_MAPPING) {
        const oldId = origEntries?.[i]?.id || entry.id;
        if (oldId) idMap[oldId] = newId;
      }
    }
    return { ...entry, id: newId };
  });

  totalChanged += changed;
  console.log(`${file}: ${entries.length} entries, ${changed} IDs changed`);

  if (!DRY_RUN && changed > 0) {
    copyFileSync(path, bakPath);
    writeJson(path, renumbered);
    console.log(`  💾  Backed up to ${file}.bak and wrote ${changed} new id(s)`);
  } else if (!DRY_RUN) {
    writeJson(path, renumbered);
  }
}

// ── Uttrykk files ─────────────────────────────────────────────────────────────
// Processed second, continuing the SAME shared counter (not reset to 0).
// (Preview files, up-{level}-{NNN}, are a separate dead format — confirmed
// out of scope, not touched by this script.)

const UTTRYKK_FILES = [
  'uttrykk-a1.json',
  'uttrykk-a2.json',
  'uttrykk-b1.json',
  'uttrykk-b2.json',
  'uttrykk-c.json'
];

for (const file of UTTRYKK_FILES) {
  const path = join(dataDir, file);
  const entries = readJson(path);

  let changed = 0;
  const renumbered = entries.map((entry) => {
    sharedCounter++;
    const newId = `w-${pad6(sharedCounter)}`;
    if (newId !== entry.id) {
      changed++;
      // Uttrykk was never touched by Round 1 or 2, so the current on-disk id
      // is already the original — no .bak lookup needed for flattening.
      if (EMIT_MAPPING && entry.id) idMap[entry.id] = newId;
    }
    return { ...entry, id: newId };
  });

  totalChanged += changed;
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

console.log(`\nTotal IDs changed: ${totalChanged}`);

if (EMIT_MAPPING) {
  const mapPath = join(dataDir, 'id-migration-map.json');
  const mapEntryCount = Object.keys(idMap).length;
  if (DRY_RUN) {
    console.log(`\n🧪  --dry-run: would write ${mapEntryCount} entries to id-migration-map.json`);
  } else {
    // Merge onto any existing map rather than overwriting it — a repeat
    // --emit-mapping run (e.g. once every id is already migrated) only
    // produces changed-id entries, which can be far fewer than what's
    // already on disk (or even {} if nothing changed this run). Old
    // mappings must stay available for loadProgressMap()'s stale-key
    // runtime fallback, so this is always an additive merge, never a
    // wholesale replace.
    const existingMap = existsSync(mapPath) ? readJson(mapPath) : {};
    const mergedMap = { ...existingMap, ...idMap };
    writeJson(mapPath, mergedMap);
    console.log(
      `\n💾  Wrote ${Object.keys(mergedMap).length} entries to src/lib/data/id-migration-map.json (${mapEntryCount} new/changed this run, merged onto ${Object.keys(existingMap).length} existing)`
    );
  }
}

if (DRY_RUN) {
  console.log('\nDry run complete — run without --dry-run to apply.');
} else {
  console.log('\nDone. All IDs are now sequential.');
  console.log('NOTE: uttrykk-*-preview.json files are not updated by this script.');
}
