#!/usr/bin/env node
/**
 * classify-vocab-phrases.mjs
 *
 * Reads all vocab-xx.json files, extracts entries with part === "phrase",
 * and uses the Claude API to classify each as:
 *   type_a  – fixed expression / idiom / construction → should move to uttrykk
 *   type_b  – compound concept / named term → stays in vocab
 *   borderline – needs human review
 *
 * Outputs:
 *   scripts/output/phrase-classification.json   (machine-readable)
 *   scripts/output/phrase-classification.md     (human-readable report)
 *
 * Usage:
 *   node scripts/classify-vocab-phrases.mjs
 *   node scripts/classify-vocab-phrases.mjs --batch-size 10   (default 20)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src/lib/data');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'scripts/output');

const VOCAB_FILES = [
  'vocab-a1.json',
  'vocab-a2.json',
  'vocab-b1.json',
  'vocab-b2.json',
  'vocab-c.json',
];

const BATCH_SIZE = parseInt(
  process.argv.find((a) => a.startsWith('--batch-size='))?.split('=')[1] ?? '20'
);

// ── Load API key from .env if present ────────────────────────────────────
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length) {
      process.env[k.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY is not set.');
  console.error('   Add it to your .env file or run:');
  console.error('   ANTHROPIC_API_KEY=your-key node scripts/classify-vocab-phrases.mjs');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. Collect all phrase entries
// ---------------------------------------------------------------------------

function collectPhraseEntries() {
  const results = [];
  for (const file of VOCAB_FILES) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ Not found, skipping: ${file}`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const level = file.replace('vocab-', '').replace('.json', '');
    for (const entry of data) {
      if (entry.part === 'phrase') {
        results.push({ ...entry, _level: level, _sourceFile: file });
      }
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// 2. Claude API call — classify a batch
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a Norwegian language pedagogy expert helping classify vocabulary entries.

Each entry has: id, norsk (the phrase), english (translation), category, and level.

Classify each entry as exactly one of:
- "type_a": Fixed expressions, idioms, discourse markers, greeting formulas, constructions, collocations where the meaning is partly non-compositional or the phrase is learned as a formulaic chunk. Examples: "tusen takk", "det regner", "holde kontakten", "kort sagt", "si unnskyld", "ta et bilde". These belong in an expressions/uttrykk file.
- "type_b": Compound noun concepts or named terms where the meaning is fully compositional and the phrase names a concept. Typically adjective+noun or noun+noun combinations that function as a single lexical item. Examples: "biologisk mangfold", "fornybar energi", "kunstig intelligens", "kritisk tenkning". These belong in a vocabulary file.
- "borderline": Cases where reasonable people could disagree, or where more context about the app's pedagogy is needed.

Respond ONLY with a valid JSON array (no markdown, no explanation) with one object per entry:
{
  "id": "<entry id>",
  "classification": "type_a" | "type_b" | "borderline",
  "reason": "<one concise sentence explaining why>"
}`;

async function classifyBatch(entries) {
  const userContent = JSON.stringify(
    entries.map((e) => ({
      id: e.id,
      norsk: e.norsk,
      english: e.english,
      category: e.category,
      level: e._level,
    })),
    null,
    2
  );

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content.map((b) => b.text || '').join('');

  try {
    return JSON.parse(text);
  } catch {
    // Strip any accidental markdown fences
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }
}

// ---------------------------------------------------------------------------
// 3. Generate markdown report
// ---------------------------------------------------------------------------

function generateMarkdown(allEntries, classifications) {
  const byId = Object.fromEntries(classifications.map((c) => [c.id, c]));

  const typeA = allEntries.filter((e) => byId[e.id]?.classification === 'type_a');
  const typeB = allEntries.filter((e) => byId[e.id]?.classification === 'type_b');
  const borderline = allEntries.filter((e) => byId[e.id]?.classification === 'borderline');
  const failed = allEntries.filter((e) => !byId[e.id]);

  const row = (e) => {
    const c = byId[e.id];
    return `| ${e.id} | ${e.norsk} | ${e.english} | ${e._level} | ${e.category} | ${c?.reason ?? '—'} |`;
  };

  const table = (entries) =>
    entries.length === 0
      ? '_None_\n'
      : `| ID | Norsk | English | Level | Category | Reason |\n|---|---|---|---|---|---|\n${entries.map(row).join('\n')}\n`;

  return `# Vocab Phrase Classification Report

Generated: ${new Date().toISOString()}

## Summary

| Type | Count | Action |
|------|-------|--------|
| Type A (Fixed expressions) | ${typeA.length} | → Move to uttrykk-xx.json |
| Type B (Compound concepts) | ${typeB.length} | → Keep in vocab-xx.json |
| Borderline | ${borderline.length} | → Needs manual review |
| Failed to classify | ${failed.length} | → Check logs |
| **Total** | **${allEntries.length}** | |

---

## Type A — Fixed Expressions (recommend moving to uttrykk)

${table(typeA)}

---

## Type B — Compound Concepts (keep in vocab)

${table(typeB)}

---

## Borderline — Needs Manual Review

${table(borderline)}

${failed.length > 0 ? `---\n\n## Failed to Classify\n\n${failed.map((e) => `- ${e.id}: ${e.norsk}`).join('\n')}\n` : ''}
---

_Next step: review Type A entries above, then run \`migrate-type-a-to-uttrykk.mjs\` with the JSON output._
`;
}

// ---------------------------------------------------------------------------
// 4. Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('📂 Collecting phrase entries from vocab files…');
  const allEntries = collectPhraseEntries();
  console.log(`   Found ${allEntries.length} entries with part === "phrase"\n`);

  if (allEntries.length === 0) {
    console.log('Nothing to classify. Exiting.');
    return;
  }

  // Split into batches
  const batches = [];
  for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
    batches.push(allEntries.slice(i, i + BATCH_SIZE));
  }

  console.log(`🤖 Classifying in ${batches.length} batch(es) of up to ${BATCH_SIZE}…\n`);

  const allClassifications = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    process.stdout.write(`   Batch ${i + 1}/${batches.length} (${batch.length} entries)… `);
    try {
      const results = await classifyBatch(batch);
      allClassifications.push(...results);
      console.log(`✓ (${results.length} classified)`);
    } catch (err) {
      console.log(`✗ ERROR: ${err.message}`);
      console.error('   Entries in failed batch:', batch.map((e) => e.id).join(', '));
    }

    // Small delay between batches to be kind to rate limits
    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Merge classification data back into entries
  const byId = Object.fromEntries(allClassifications.map((c) => [c.id, c]));
  const enriched = allEntries.map((e) => ({
    ...e,
    classification: byId[e.id]?.classification ?? null,
    reason: byId[e.id]?.reason ?? null,
  }));

  // Output
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const jsonPath = path.join(OUTPUT_DIR, 'phrase-classification.json');
  fs.writeFileSync(jsonPath, JSON.stringify(enriched, null, 2), 'utf8');

  const mdPath = path.join(OUTPUT_DIR, 'phrase-classification.md');
  fs.writeFileSync(mdPath, generateMarkdown(allEntries, allClassifications), 'utf8');

  // Console summary
  const counts = { type_a: 0, type_b: 0, borderline: 0, null: 0 };
  for (const c of allClassifications) counts[c.classification] = (counts[c.classification] ?? 0) + 1;

  console.log(`
✅ Done!

   Type A (move to uttrykk): ${counts.type_a}
   Type B (keep in vocab):   ${counts.type_b}
   Borderline:               ${counts.borderline}
   Failed:                   ${allEntries.length - allClassifications.length}

   Output files:
   → ${jsonPath}
   → ${mdPath}
`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
