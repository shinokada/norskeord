#!/usr/bin/env node
/**
 * fill-uttrykk-examples.mjs
 *
 * Fills empty `example`, `example_english`, `example_{lang}`, and `definition`
 * fields in uttrykk-*.json files using the Anthropic API.
 *
 * Usage:
 *   node scripts/fill-uttrykk-examples.mjs --files uttrykk-a1.json uttrykk-a2.json
 *   node scripts/fill-uttrykk-examples.mjs --files uttrykk-a1.json,uttrykk-a2.json
 *   node scripts/fill-uttrykk-examples.mjs --files uttrykk-b2.json --dry-run
 *   node scripts/fill-uttrykk-examples.mjs --files uttrykk-a1.json --force
 *
 * Options:
 *   --files     One or more uttrykk JSON filenames (space- or comma-separated).
 *   --dry-run   Show what would be filled without calling the API or writing files.
 *   --force     Re-generate examples even for entries that already have them.
 *   --batch     Number of entries per API call (default: 10).
 *
 * What it fills:
 *   - example            Norwegian example sentence using the phrase naturally
 *   - example_english    English translation of the example
 *   - example_{lang}     Translation of the example for each language present
 *                        on the entry (ukrainian, spanish, german, romanian, etc.)
 *   - definition         Norwegian definition/explanation (if missing)
 *
 * The script detects which language fields are present on each entry and only
 * generates example translations for those languages.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Config ────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../src/lib/data');

const DEFAULT_BATCH = 10;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;
const INTER_BATCH_DELAY_MS = 1200;

// Language code → full name mapping for the prompt
const LANG_NAMES = {
  ukrainian: 'Ukrainian',
  spanish: 'Spanish',
  german: 'German',
  romanian: 'Romanian',
  french: 'French',
  polish: 'Polish',
  arabic: 'Arabic',
  turkish: 'Turkish',
  dutch: 'Dutch',
  italian: 'Italian'
};

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};

const dryRun = hasFlag('--dry-run');
const force = hasFlag('--force');
const batchSize = parseInt(getArg('--batch') ?? String(DEFAULT_BATCH), 10);

// Accept --files with space-separated or comma-separated filenames
const filesIdx = args.indexOf('--files');
let filesToProcess = [];
if (filesIdx !== -1) {
  for (let i = filesIdx + 1; i < args.length; i++) {
    if (args[i].startsWith('--')) break;
    filesToProcess.push(
      ...args[i]
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean)
    );
  }
}

if (filesToProcess.length === 0) {
  console.error('❌  --files is required. Example:');
  console.error(
    '    node scripts/fill-uttrykk-examples.mjs --files uttrykk-a1.json uttrykk-a2.json'
  );
  process.exit(1);
}

// ── Load API key ──────────────────────────────────────────────────────────────

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length)
      process.env[k.trim()] = rest
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '');
  }
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY && !dryRun) {
  console.error('❌  ANTHROPIC_API_KEY is not set. Export it or add it to .env');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function needsFilling(entry) {
  if (force) return true;
  return (
    !entry.example ||
    !entry.example.trim() ||
    !entry.example_english ||
    !entry.example_english.trim()
  );
}

function detectLanguages(entry) {
  return Object.keys(LANG_NAMES).filter((lang) => lang in entry);
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(batch) {
  // Detect the union of languages present across this batch
  const allLangs = [...new Set(batch.flatMap(detectLanguages))];
  const langList = allLangs.map((l) => `${l} (${LANG_NAMES[l]})`).join(', ');

  const entries = batch
    .map((e) => {
      const langs = detectLanguages(e);
      const translations = langs.map((l) => `  "${l}": ${JSON.stringify(e[l])}`).join(',\n');
      const needsDef = !e.definition || !e.definition.trim();
      return `{
  "id": ${JSON.stringify(e.id)},
  "norsk": ${JSON.stringify(e.norsk)},
  "english": ${JSON.stringify(e.english)},
${translations}${needsDef ? ',\n  "_need_definition": true' : ''}
}`;
    })
    .join(',\n');

  return `You are a Norwegian language expert generating example sentences and definitions for a Norwegian language-learning app.

For each entry below, generate:
1. "example" — A natural Norwegian sentence that uses the expression in context. The sentence should be simple, realistic, and appropriate for the CEFR level implied by the expression. Do NOT just repeat the expression in isolation — show it used naturally.
2. "example_english" — An accurate English translation of that Norwegian example sentence.
3. "example_{lang}" — A natural translation of the same example sentence into each language listed: ${langList || 'none'}.
4. "definition" — ONLY if "_need_definition" is true: a concise Norwegian definition/explanation of the expression (1-2 sentences). Do not include a definition if "_need_definition" is not present.

Rules:
- The Norwegian example must use the exact phrase from "norsk" naturally (it may be inflected if grammatically required).
- Keep examples short: 1 sentence, 8-15 words.
- Do NOT use typographic quotes (" " „ « ») in your output — use plain ASCII single quotes (') if needed.
- Respond ONLY with a JSON array. Each element must have: "id", "example", "example_english", plus "example_{lang}" for each language in that entry. Include "definition" only when "_need_definition" was true.
- No markdown, no code fences, no commentary.

Entries:
[
${entries}
]`;
}

// ── API call ──────────────────────────────────────────────────────────────────

async function fetchExamples(batch) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: buildPrompt(batch) }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.content.map((b) => b.text ?? '').join('');
  const clean = text
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    // Sanitise typographic quotes that break JSON parsing
    .replace(/[„\u201C\u201D\u00AB\u00BB\u2018\u2019]/g, "'")
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error(`Failed to parse JSON response:\n${text}`);
  }
}

// ── Retry ─────────────────────────────────────────────────────────────────────

async function withRetry(fn, label) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const delay = RETRY_DELAY_MS * attempt;
      console.warn(
        `  ⚠️  ${label} attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms…`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ── Process one file ──────────────────────────────────────────────────────────

async function processFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  File not found: ${filePath} — skipping`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const toFill = data.filter(needsFilling);

  console.log(`\n📄  ${filename}  (${data.length} entries)`);
  console.log(`    Need filling: ${toFill.length}`);

  if (toFill.length === 0) {
    console.log('    ✅  Nothing to fill.');
    return;
  }

  if (dryRun) {
    console.log(
      `    🔍  DRY RUN — would fill ${toFill.length} entries in ${Math.ceil(toFill.length / batchSize)} batch(es).`
    );
    for (const e of toFill) {
      console.log(`       • ${e.id}: ${e.norsk} (${e.english})`);
    }
    return;
  }

  // Backup
  fs.copyFileSync(filePath, filePath + '.bak');
  console.log(`    💾  Backup saved to ${filename}.bak`);

  // Build batches
  const batches = [];
  for (let i = 0; i < toFill.length; i += batchSize) {
    batches.push(toFill.slice(i, i + batchSize));
  }

  // Map id → result for merging
  const results = new Map();

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    process.stdout.write(`    Batch ${bi + 1}/${batches.length} (${batch.length} entries)… `);

    const filled = await withRetry(() => fetchExamples(batch), `batch ${bi + 1}`);

    let hits = 0;
    for (const item of filled) {
      if (item.id && item.example && item.example_english) {
        results.set(item.id, item);
        hits++;
      } else {
        console.warn(`\n    ⚠️  Incomplete result for id=${item.id}`);
      }
    }
    console.log(`✓ (${hits}/${batch.length} filled)`);

    if (bi < batches.length - 1) {
      await new Promise((r) => setTimeout(r, INTER_BATCH_DELAY_MS));
    }
  }

  // Merge results back into data array
  let totalFilled = 0;
  for (const entry of data) {
    const result = results.get(entry.id);
    if (!result) continue;

    entry.example = result.example;
    entry.example_english = result.example_english;

    // Fill translated examples for each language present on the entry
    for (const lang of detectLanguages(entry)) {
      const key = `example_${lang}`;
      if (result[key]) {
        entry[key] = result[key];
      }
    }

    // Fill definition if it was missing and the model returned one
    if ((!entry.definition || !entry.definition.trim()) && result.definition) {
      entry.definition = result.definition;
    }

    totalFilled++;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`    ✅  Done. ${totalFilled}/${toFill.length} entries filled. File saved.`);

  // Report any still-missing
  const stillMissing = data.filter(needsFilling);
  if (stillMissing.length > 0) {
    console.warn(
      `    ⚠️  ${stillMissing.length} entries still missing examples — re-run to retry:`
    );
    for (const e of stillMissing) console.warn(`       • ${e.id}: ${e.norsk}`);
  } else {
    console.log(`    🎯  All entries in ${filename} now have examples.`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('✏️   fill-uttrykk-examples.mjs');
  console.log(`    Mode:       ${dryRun ? 'DRY RUN' : 'LIVE'}${force ? ' + --force' : ''}`);
  console.log(`    Batch size: ${batchSize}`);
  console.log(`    Files:      ${filesToProcess.join(', ')}`);
  console.log(`    Data dir:   ${DATA_DIR}`);

  for (const filename of filesToProcess) {
    await processFile(filename);
  }

  console.log('\n✅  All files processed.');
}

main().catch((err) => {
  console.error('\n❌  Fatal error:', err.message);
  process.exit(1);
});
