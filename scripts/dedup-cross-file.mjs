#!/usr/bin/env node
/**
 * dedup-cross-file.mjs
 *
 * Removes cross-file duplicate `norsk` entries across vocab-*.json files.
 *
 * STRATEGY:
 *   - When the same `norsk` value appears in two different level files,
 *     keep the entry in the LOWER level file and remove it from the HIGHER.
 *   - Level order: A1 < A2 < B1 < B2 < C
 *   - Before removing the higher-level entry, any fields it has that the
 *     lower-level entry is MISSING are copied across (e.g. `definition`,
 *     `example_ukrainian`, `example_spanish`). This preserves richer content.
 *
 * Usage (from repo root):
 *   node scripts/dedup-cross-file.mjs
 *   node scripts/dedup-cross-file.mjs --dry-run
 *   node scripts/dedup-cross-file.mjs --no-patch    (skip field merging)
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = resolve(__dirname, "../src/lib/data");

const args     = process.argv.slice(2);
const DRY_RUN  = args.includes("--dry-run");
const NO_PATCH = args.includes("--no-patch");

// Level order: lower index = lower level = wins
const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C"];

const levelOf = (entry) => entry.level?.toUpperCase() ?? "B2";
const levelRank = (entry) => LEVEL_ORDER.indexOf(levelOf(entry));

// Load all vocab files
const vocabFiles = readdirSync(DATA_DIR)
  .filter(f => f.match(/^vocab-[a-z0-9]+\.json$/))
  .sort(); // A1 → A2 → B1 → B2 → C

const fileData = {}; // filename → entries[]
for (const f of vocabFiles) {
  fileData[f] = JSON.parse(readFileSync(resolve(DATA_DIR, f), "utf-8"));
}

// Build a global index: norsk_lower → [{file, index, entry}]
const globalIndex = {}; // norsk_lower → [{file, idx, entry}]
for (const [file, entries] of Object.entries(fileData)) {
  for (let i = 0; i < entries.length; i++) {
    const key = entries[i].norsk?.trim().toLowerCase();
    if (!key) continue;
    (globalIndex[key] ??= []).push({ file, idx: i, entry: entries[i] });
  }
}

// Find cross-file duplicates (same norsk, different files)
const toRemove = {}; // file → Set<index>
const patches  = {}; // file → { index → {fields to add} }
const decisions = [];

for (const [key, hits] of Object.entries(globalIndex)) {
  // Only interested in hits across multiple files
  const files = [...new Set(hits.map(h => h.file))];
  if (files.length < 2) continue;

  // Sort by level rank: lowest level first = winner
  const sorted = [...hits].sort((a, b) => levelRank(a.entry) - levelRank(b.entry) || 0);
  const winner = sorted[0];
  const losers = sorted.slice(1).filter(h => h.file !== winner.file);

  // Deduplicate losers (same file may appear multiple times if 3+ files had it)
  const seen = new Set();
  for (const loser of losers) {
    const loserKey = `${loser.file}:${loser.idx}`;
    if (seen.has(loserKey)) continue;
    seen.add(loserKey);

    // Fields the winner is missing that the loser has
    const missingFields = {};
    if (!NO_PATCH) {
      for (const [field, val] of Object.entries(loser.entry)) {
        if (field === "id" || field === "level" || field === "category") continue;
        if (winner.entry[field] === undefined || winner.entry[field] === null || winner.entry[field] === "") {
          missingFields[field] = val;
        }
      }
    }

    // Register removal
    (toRemove[loser.file] ??= new Set()).add(loser.idx);

    // Register patch on winner
    if (Object.keys(missingFields).length > 0) {
      (patches[winner.file] ??= {})[winner.idx] = {
        ...(patches[winner.file]?.[winner.idx] ?? {}),
        ...missingFields,
      };
    }

    decisions.push({
      norsk: winner.entry.norsk,
      keepFile: winner.file,
      keepId: winner.entry.id,
      keepLevel: levelOf(winner.entry),
      keepCat: winner.entry.category,
      removeFile: loser.file,
      removeId: loser.entry.id,
      removeLevel: levelOf(loser.entry),
      removeCat: loser.entry.category,
      patchedFields: Object.keys(missingFields),
    });
  }
}

// --- Print summary ----------------------------------------------------------
const totalRemoved = Object.values(toRemove).reduce((s, set) => s + set.size, 0);
const totalPatched = Object.values(patches).reduce((s, p) => s + Object.keys(p).length, 0);

console.log(`Cross-file duplicates found : ${decisions.length}`);
console.log(`Entries to remove           : ${totalRemoved}`);
console.log(`Entries to patch (add fields): ${totalPatched}`);
console.log();

// Group decisions by file pair for readability
decisions.sort((a, b) => a.norsk.localeCompare(b.norsk));

let currentPair = "";
for (const d of decisions) {
  const pair = `${d.keepFile} ← ${d.removeFile}`;
  if (pair !== currentPair) {
    console.log(`\n  [Keep ${d.keepLevel} / Remove ${d.removeLevel}]  ${d.keepFile} ← ${d.removeFile}`);
    currentPair = pair;
  }
  const patch = d.patchedFields.length ? `  +patch[${d.patchedFields.join(",")}]` : "";
  console.log(`    "${d.norsk}"  keep:${d.keepId}[${d.keepCat}]  remove:${d.removeId}[${d.removeCat}]${patch}`);
}

if (DRY_RUN) {
  console.log(`\n[DRY RUN] No files written.`);
  process.exit(0);
}

// --- Apply changes ----------------------------------------------------------
let filesWritten = 0;

for (const [file, entries] of Object.entries(fileData)) {
  const removeSet = toRemove[file] ?? new Set();
  const patchMap  = patches[file]  ?? {};
  if (removeSet.size === 0 && Object.keys(patchMap).length === 0) continue;

  // Apply patches first
  for (const [idxStr, fields] of Object.entries(patchMap)) {
    Object.assign(entries[Number(idxStr)], fields);
  }

  // Filter out removed entries
  const cleaned = entries.filter((_, i) => !removeSet.has(i));

  writeFileSync(resolve(DATA_DIR, file), JSON.stringify(cleaned, null, 2) + "\n", "utf-8");
  console.log(`\nWrote ${file}: ${entries.length} → ${cleaned.length} entries` +
    (Object.keys(patchMap).length ? ` (${Object.keys(patchMap).length} patched)` : ""));
  filesWritten++;
}

console.log(`\nDone. ${filesWritten} file(s) written.`);
