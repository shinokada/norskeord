#!/usr/bin/env node
/**
 * apply_dupe_decisions.mjs
 *
 * Reads scripts/dupe_decisions.json (produced by analyse_dupes.mjs) and
 * removes the "delete" copy of each duplicate from the correct JSON file.
 *
 * Each decision must include a "fileType" field ("vocab" | "uttrykk") so this
 * script resolves the right file — e.g. delete_level "B2" + fileType "uttrykk"
 * → uttrykk-b2.json, NOT vocab-b2.json.
 *
 * Usage (from project root):
 *   node scripts/apply_dupe_decisions.mjs --dry-run   # preview only
 *   node scripts/apply_dupe_decisions.mjs             # apply for real
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load .env from project root (Node doesn't do this automatically)
const envPath = path.join(PROJECT_ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^\s*([\w]+)\s*=\s*(.*)$/);
    if (match) process.env[match[1]] ??= match[2].replace(/^['"]|['"]$/g, '');
  }
}
const DATA_DIR = path.join(PROJECT_ROOT, 'src', 'lib', 'data');
const DECISIONS_PATH = path.join(__dirname, 'dupe_decisions.json');
const DRY_RUN = process.argv.includes('--dry-run');

// ── File maps: levelKey → filename ────────────────────────────────────────────
// Keep in sync with analyse_dupes.mjs. Add new files here as needed.

const VOCAB_FILE_MAP = {
  A1: 'vocab-a1.json',
  A2: 'vocab-a2.json',
  B1: 'vocab-b1.json',
  'B1-new-vocab': 'vocab-b1-new.json',
  B2: 'vocab-b2.json',
  C1: 'vocab-c1.json',
  C2: 'vocab-c2.json'
};

const UTTRYKK_FILE_MAP = {
  A1: 'uttrykk-a1.json',
  A2: 'uttrykk-a2.json',
  B1: 'uttrykk-b1.json',
  'B1-new-uttrykk': 'uttrykk-b1-new.json',
  B2: 'uttrykk-b2.json'
};

function resolveFile(fileType, levelKey) {
  const map = fileType === 'uttrykk' ? UTTRYKK_FILE_MAP : VOCAB_FILE_MAP;
  const filename = map[levelKey];
  if (!filename) return null;
  return path.join(DATA_DIR, filename);
}

// ── Load decisions ─────────────────────────────────────────────────────────────
if (!fs.existsSync(DECISIONS_PATH)) {
  console.error(`❌ ${DECISIONS_PATH} not found.`);
  console.error('   Run "node scripts/analyse_dupes.mjs" first.');
  process.exit(1);
}

const decisions = JSON.parse(fs.readFileSync(DECISIONS_PATH, 'utf-8'));
console.log(`📂 Loaded ${decisions.length} decisions\n`);

// ── Group deletions by resolved file path ──────────────────────────────────────
// filePath → Set<norsk_lowercase>
const deletionMap = new Map();
const keepBothList = [];
const skippedList = [];

for (const d of decisions) {
  if (d.action === 'keep_both') {
    keepBothList.push(d);
    continue;
  }

  const { norsk, delete_level, fileType } = d;

  if (!norsk || !delete_level || !fileType) {
    skippedList.push({ reason: 'missing norsk/delete_level/fileType', d });
    continue;
  }

  const filePath = resolveFile(fileType, delete_level);

  if (!filePath) {
    skippedList.push({
      reason: `unknown level key "${delete_level}" for fileType "${fileType}"`,
      d
    });
    continue;
  }

  if (!fs.existsSync(filePath)) {
    skippedList.push({ reason: `file not found: ${path.relative(PROJECT_ROOT, filePath)}`, d });
    continue;
  }

  if (!deletionMap.has(filePath)) deletionMap.set(filePath, new Set());
  deletionMap.get(filePath).add(norsk.trim().toLowerCase());
}

// ── Report warnings ────────────────────────────────────────────────────────────
if (keepBothList.length) {
  console.log(`⚠️  KEEP BOTH — no changes for these ${keepBothList.length} entries:`);
  for (const d of keepBothList) console.log(`   [${d.fileType}] ${d.norsk}  → ${d.reason}`);
  console.log();
}

if (skippedList.length) {
  console.log(`⚠️  Skipped ${skippedList.length} decisions:`);
  for (const { reason, d } of skippedList) console.log(`   ${reason}: ${JSON.stringify(d)}`);
  console.log();
}

// ── Apply / preview ────────────────────────────────────────────────────────────
let totalRemoved = 0;

for (const [filePath, toDelete] of deletionMap.entries()) {
  const relPath = path.relative(PROJECT_ROOT, filePath);
  const entries = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const before = entries.length;

  const kept = [];
  const removed = [];

  for (const entry of entries) {
    if (toDelete.has((entry.norsk || '').trim().toLowerCase())) {
      removed.push(entry.norsk);
    } else {
      kept.push(entry);
    }
  }

  const delta = before - kept.length;
  totalRemoved += delta;

  const arrow = DRY_RUN ? '(would remove)' : 'removed';
  console.log(`📄 ${relPath}  ${before} → ${kept.length} entries  (−${delta})`);
  if (removed.length) console.log(`   ${arrow}: ${removed.map((w) => `"${w}"`).join(', ')}`);

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, JSON.stringify(kept, null, 2) + '\n', 'utf-8');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════');
if (DRY_RUN) {
  console.log(`[DRY RUN] Would remove ${totalRemoved} entries across ${deletionMap.size} files.`);
  console.log('Run without --dry-run to apply.');
} else {
  console.log(`✅ Done. Removed ${totalRemoved} entries across ${deletionMap.size} files.`);
}
