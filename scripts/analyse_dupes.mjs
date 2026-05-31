#!/usr/bin/env node
/**
 * analyse_dupes.mjs
 *
 * Scans all vocab-xx.json and uttrykk-xx.json files, finds cross-file
 * duplicates, and asks Claude to decide which copy to keep/delete based on
 * Norwegian CEFR guidelines.
 *
 * Outputs: scripts/dupe_decisions.json
 *   Each decision includes a "fileType" field ("vocab" | "uttrykk") so that
 *   apply_dupe_decisions.mjs knows which set of files to touch.
 *
 * Usage (from project root):
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   node scripts/analyse_dupes.mjs
 *   node scripts/analyse_dupes.mjs --dry-run   # print decisions, don't write
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
const OUT_PATH = path.join(__dirname, 'dupe_decisions.json');
const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 20;

// ── File maps ─────────────────────────────────────────────────────────────────
// Keys are the level labels Claude will use in its response.
// Add any new files here (e.g. vocab-b1-extra.json → 'B1-extra-vocab').

const VOCAB_FILES = {
  A1: 'vocab-a1.json',
  A2: 'vocab-a2.json',
  B1: 'vocab-b1.json',
  'B1-new-vocab': 'vocab-b1-new.json',
  B2: 'vocab-b2.json',
  C1: 'vocab-c1.json',
  C2: 'vocab-c2.json'
};

const UTTRYKK_FILES = {
  A1: 'uttrykk-a1.json',
  A2: 'uttrykk-a2.json',
  B1: 'uttrykk-b1.json',
  'B1-new-uttrykk': 'uttrykk-b1-new.json',
  B2: 'uttrykk-b2.json'
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadJson(filename) {
  const p = path.join(DATA_DIR, filename);
  if (!fs.existsSync(p)) {
    console.warn(`⚠️  Missing file, skipping: ${filename}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function buildIndex(fileMap) {
  // Returns: norsk_lower → [ { levelKey, entry } ]
  const index = {};
  for (const [levelKey, filename] of Object.entries(fileMap)) {
    for (const entry of loadJson(filename)) {
      const key = (entry.norsk || '').trim().toLowerCase();
      if (!key) continue;
      if (!index[key]) index[key] = [];
      index[key].push({ levelKey, entry });
    }
  }
  return index;
}

function findCrossDupes(index) {
  return Object.entries(index)
    .filter(([, hits]) => new Set(hits.map((h) => h.levelKey)).size > 1)
    .map(([key, hits]) => ({ key, hits }));
}

async function askClaude(batch, fileType) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

  const items = batch.map(({ hits }) => ({
    norsk: hits[0].entry.norsk,
    copies: hits.map((h) => ({
      level: h.levelKey,
      category: h.entry.category,
      part: h.entry.part,
      english: h.entry.english,
      example: h.entry.example
    }))
  }));

  const prompt = `You are a Norwegian CEFR vocabulary expert maintaining a flashcard app.

Below is a list of duplicate ${fileType} entries found across multiple CEFR level files.
For each duplicate decide which copy to KEEP and which to DELETE using these rules:

1. Keep the copy at the lowest correct CEFR level for the word's PRIMARY meaning.
2. If both copies are the same CEFR level (e.g. B1 vs B1-new-vocab), keep the
   permanent file version: B1 > B1-new-vocab, B2 > B2-new, uttrykk-b1 > uttrykk-b1-new, etc.
3. If the two copies represent GENUINELY DIFFERENT senses of the same spelling
   (e.g. "å stryke" = to iron vs. to fail an exam), set action to "keep_both".
4. Never move a word UP a level — if it genuinely belongs at A1/A2, keep it there.

File priority order (prefer keeping in earlier files):
  A1 > A2 > B1 > B1-new-vocab > B1-new-uttrykk > B2 > C1 > C2

Respond ONLY with a valid JSON array — no preamble, no markdown fences.
Each element must have exactly:
{
  "norsk": "<norsk field value>",
  "keep_level":   "<levelKey to keep, e.g. \\"A1\\">",
  "delete_level": "<levelKey to delete from, e.g. \\"B1-new-vocab\\">",
  "action": "keep_lower" | "keep_higher" | "keep_both",
  "reason": "<one concise sentence>"
}
For "keep_both" set keep_level and delete_level to null.

Duplicates to analyse:
${JSON.stringify(items, null, 2)}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const text = data.content.map((b) => b.text || '').join('');
  const clean = text
    .replace(/^```json\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    console.error('Failed to parse Claude response:\n', text);
    throw new Error('JSON parse failed');
  }
}

async function processBatches(dupes, fileType, allDecisions) {
  for (let i = 0; i < dupes.length; i += BATCH_SIZE) {
    const batch = dupes.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const total = Math.ceil(dupes.length / BATCH_SIZE);
    console.log(`  ↳ [${fileType}] batch ${batchNum}/${total} (${batch.length} items)…`);

    const decisions = await askClaude(batch, fileType);

    // Stamp each decision with its fileType so the apply script knows which files to touch
    for (const d of decisions) {
      allDecisions.push({ ...d, fileType });
    }

    if (i + BATCH_SIZE < dupes.length) await new Promise((r) => setTimeout(r, 400));
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Scanning files…');
  const vocabDupes = findCrossDupes(buildIndex(VOCAB_FILES));
  const uttrykkDupes = findCrossDupes(buildIndex(UTTRYKK_FILES));
  console.log(
    `   vocab: ${vocabDupes.length} duplicates | uttrykk: ${uttrykkDupes.length} duplicates\n`
  );

  const allDecisions = [];

  if (vocabDupes.length > 0) {
    console.log('📡 Asking Claude about vocab duplicates…');
    await processBatches(vocabDupes, 'vocab', allDecisions);
  }

  if (uttrykkDupes.length > 0) {
    console.log('\n📡 Asking Claude about uttrykk duplicates…');
    await processBatches(uttrykkDupes, 'uttrykk', allDecisions);
  }

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(' DECISIONS');
  console.log('═══════════════════════════════════════════════════════════');
  for (const d of allDecisions) {
    const tag = `[${d.fileType}]`;
    const action =
      d.action === 'keep_both'
        ? '⚠️  KEEP BOTH'
        : `✅ keep ${d.keep_level}  ❌ delete from ${d.delete_level}`;
    console.log(`${tag.padEnd(10)} ${d.norsk.padEnd(35)} ${action}`);
    console.log(`${''.padEnd(10)} ${''.padEnd(35)} → ${d.reason}`);
  }

  const keepBoth = allDecisions.filter((d) => d.action === 'keep_both');
  const toDelete = allDecisions.filter((d) => d.action !== 'keep_both');
  console.log(`\nSummary: ${toDelete.length} to delete, ${keepBoth.length} to keep both`);

  if (DRY_RUN) {
    console.log('\n[dry-run] Decisions not saved.');
    return;
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(allDecisions, null, 2) + '\n', 'utf-8');
  console.log(`\n✅ Saved to: ${OUT_PATH}`);
  console.log('   Next: node scripts/apply_dupe_decisions.mjs --dry-run');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
