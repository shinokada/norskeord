#!/usr/bin/env node
/**
 * add-example-explanations.mjs
 *
 * Populates `definition` for every VocabEntry in the specified JSON
 * files using the Anthropic API.
 *
 * Usage:
 *   node add-example-explanations.mjs [--files vocab-b1.json,vocab-b2.json] [--batch 20] [--dry-run] [--force]
 *
 * Options:
 *   --files   Comma-separated list of JSON filenames in src/lib/data/ to process.
 *             Defaults to all vocab-*.json files.
 *   --batch   Number of words to send in a single API call (default: 20).
 *   --dry-run Print what would happen without writing files or calling the API.
 *   --force   Re-process entries that already have a definition (overwrites them).
 *
 * Prerequisites:
 *   ANTHROPIC_API_KEY must be set in your environment (or .env file).
 *
 * The script:
 *   1. Reads the JSON file.
 *   2. Skips entries that already have a definition (unless --force).
 *   3. Sends batches to claude-sonnet-4-6, asking for Norwegian definitions
 *      using vocabulary appropriate to the CEFR level below the target words
 *      (B2 entries → up to B1; C1/C2 entries → up to B1/B2).
 *   4. Uses fuzzy key matching to handle minor capitalisation/spacing differences
 *      between the norsk key and what the API returns.
 *   5. Merges the results back and writes the file in-place (with a .bak backup).
 *   6. Retries failed batches up to 5 times with exponential backoff.
 *   7. Scales inter-batch delay based on vocabulary size (larger files = longer pause).
 *   8. Prints a final summary of any entries still missing a definition.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Config ───────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = path.resolve(__dirname, 'src/lib/data');

const DEFAULT_FILES = [
  // 'vocab-b1.json',
  'vocab-b2.json',
  'vocab-c1.json',
  'vocab-c2.json'
  // Uncomment to include A1/A2:
  // 'vocab-a1.json',
  // 'vocab-a2.json',
];

const DEFAULT_BATCH = 20;
const MAX_RETRIES = 5; // increased from 3 — large C1/C2 files need more headroom
const RETRY_DELAY_MS = 2000;

// Inter-batch delay scales with vocabulary size:
//   < 100 entries  → 500 ms
//   100–499        → 1 000 ms
//   500+           → 2 000 ms
function interBatchDelay(totalEntries) {
  if (totalEntries >= 500) return 2000;
  if (totalEntries >= 100) return 1000;
  return 500;
}

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const dryRun = hasFlag('--dry-run');
const force = hasFlag('--force');
const batchSize = parseInt(getArg('--batch') ?? DEFAULT_BATCH, 10);
const filesArg = getArg('--files');
const filesToProcess = filesArg ? filesArg.split(',').map((f) => f.trim()) : DEFAULT_FILES;

// ── Load API key ─────────────────────────────────────────────────────────────

const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length) {
      process.env[k.trim()] = rest
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  }
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY && !dryRun) {
  console.error('❌  ANTHROPIC_API_KEY is not set. Export it or add it to .env');
  process.exit(1);
}

// ── Fuzzy key normalisation ──────────────────────────────────────────────────
// Normalise a norsk key for loose matching: lowercase + collapse whitespace.
// This handles cases where the API returns "Miljøet" instead of "miljøet",
// or has a trailing space, etc.

function normaliseKey(str) {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Build a lookup map from the raw API result object that supports fuzzy matching.
 * Returns a function: (norskValue: string) => string | undefined
 */
function buildLookup(result) {
  // Exact map first
  const exact = new Map(Object.entries(result));

  // Normalised fallback map: normKey → original value
  const fuzzy = new Map();
  for (const [k, v] of exact) {
    fuzzy.set(normaliseKey(k), v);
  }

  return (norsk) => {
    // 1. Exact match
    if (exact.has(norsk)) return exact.get(norsk);
    // 2. Normalised match
    const norm = normaliseKey(norsk);
    if (fuzzy.has(norm)) return fuzzy.get(norm);
    return undefined;
  };
}

// ── Anthropic call ────────────────────────────────────────────────────────────

async function fetchExplanations(batch, fileLevel) {
  const wordList = batch
    .map(
      (e, i) =>
        `${i + 1}. norsk: "${e.norsk}" | english: "${e.english}" | example: "${e.example}" | part: ${e.part} | level: ${e.level}`
    )
    .join('\n');

  const vocabGuidance =
    fileLevel === 'B2'
      ? 'Uses only B1-level Norwegian vocabulary or simpler (everyday words a B1 student knows); avoid the target word itself'
      : 'Uses only B1/B2-level Norwegian vocabulary or simpler (no C-level words); avoid the target word itself';

  const audienceNote =
    fileLevel === 'B2'
      ? 'like a friendly teacher explaining to a solid B1 student'
      : 'like a knowledgeable teacher explaining to a B2 student';

  const systemPrompt = `You are a Norwegian language teacher writing a monolingual learner's dictionary for CEFR B1–C2 students.

For each word given, write a SHORT Norwegian explanation (1–2 sentences, max ~20 words) that:
- ${vocabGuidance}
- Explains the meaning or concept, not the grammar
- Is natural and helpful, ${audienceNote}
- Does NOT start with the word itself or repeat it
- Does NOT use English
- Is appropriate for the CEFR level of the word

Respond ONLY with a JSON object where each key is the exact "norsk" value and the value is the explanation string. No markdown, no preamble, no extra keys.

Example output format:
{
  "miljøet": "Det store systemet av natur rundt oss — luft, vann, jord og alle levende ting.",
  "å resirkulere": "Å bruke gamle ting på nytt eller lage nye produkter av dem, for å ikke kaste dem."
}`;

  const userPrompt = `Please write Norwegian explanations for these ${batch.length} words:\n\n${wordList}`;

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
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
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
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error(`Failed to parse JSON response:\n${text}`);
  }
}

// ── Retry helper ──────────────────────────────────────────────────────────────

async function withRetry(fn, label) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const delay = RETRY_DELAY_MS * attempt;
      console.warn(
        `  ⚠️  ${label} — attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms…`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ── Process one file ──────────────────────────────────────────────────────────

async function processFile(filename) {
  const filePath = path.join(DATA_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filePath} — skipping`);
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const entries = JSON.parse(raw);

  // Derive CEFR level from filename (e.g. vocab-b2.json → 'B2')
  const levelMatch = filename.match(/vocab-([abc]\d)/i);
  const fileLevel = levelMatch ? levelMatch[1].toUpperCase() : 'B2';

  const missing = entries.filter((e) => (force ? true : !e.definition));
  const already = entries.length - missing.length;

  console.log(`\n📄  ${filename}`);
  console.log(
    `    Total: ${entries.length} | Already done: ${already} | To process: ${missing.length}${force ? ' (--force: re-processing all)' : ''}`
  );

  if (missing.length === 0) {
    console.log('    ✅  Nothing to do.');
    return;
  }

  if (dryRun) {
    console.log(
      `    🔍  DRY RUN — would process ${missing.length} entries in ${Math.ceil(missing.length / batchSize)} batches.`
    );
    return;
  }

  // Backup the original file
  const backupPath = filePath + '.bak';
  fs.copyFileSync(filePath, backupPath);
  console.log(`    💾  Backup saved to ${path.basename(backupPath)}`);

  const explanationMap = {};
  const batchDelay = interBatchDelay(entries.length);

  const batches = [];
  for (let i = 0; i < missing.length; i += batchSize) {
    batches.push(missing.slice(i, i + batchSize));
  }

  let processed = 0;
  let fuzzyMatches = 0;

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    process.stdout.write(`    Batch ${bi + 1}/${batches.length} (${batch.length} words)… `);

    const result = await withRetry(
      () => fetchExplanations(batch, fileLevel),
      `${filename} batch ${bi + 1}`
    );

    const lookup = buildLookup(result);
    let hits = 0;

    for (const entry of batch) {
      const explanation = lookup(entry.norsk);
      if (explanation !== undefined) {
        explanationMap[entry.norsk] = explanation;
        hits++;
        // Detect if a fuzzy (non-exact) match was used
        if (!result[entry.norsk]) {
          fuzzyMatches++;
          console.warn(`\n    🔀  Fuzzy match used for "${entry.norsk}"`);
        }
      } else {
        console.warn(`\n    ⚠️  No explanation returned for "${entry.norsk}"`);
      }
    }
    processed += hits;
    console.log(`✓ (${hits}/${batch.length} matched)`);

    if (bi < batches.length - 1) {
      await new Promise((r) => setTimeout(r, batchDelay));
    }
  }

  // Merge back into entries, inserting definition after example_english
  const updated = entries.map((entry) => {
    if (explanationMap[entry.norsk]) {
      const { norsk, lemma, english, example, example_english, level, category, part, ...rest } =
        entry;
      // Remove any pre-existing definition from rest to avoid duplication
      delete rest.definition;
      return {
        norsk,
        ...(lemma !== undefined ? { lemma } : {}),
        english,
        example,
        example_english,
        definition: explanationMap[entry.norsk],
        level,
        category,
        part,
        ...rest
      };
    }
    return entry;
  });

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log(`    ✅  Done. ${processed}/${missing.length} explanations added. File saved.`);

  if (fuzzyMatches > 0) {
    console.log(
      `    🔀  ${fuzzyMatches} entries matched via fuzzy normalisation (check warnings above).`
    );
  }

  // ── Final missing-entry report ─────────────────────────────────────────────
  const stillMissing = updated.filter((e) => !e.definition);
  if (stillMissing.length > 0) {
    console.warn(
      `\n    ⚠️  ${stillMissing.length} entries still have no definition after processing:`
    );
    for (const e of stillMissing) {
      console.warn(`       • "${e.norsk}"`);
    }
    console.warn(`    Re-run the script (or use --force) to retry these entries.`);
  } else {
    console.log(`    🎯  All entries in ${filename} now have a definition.`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🇳🇴  add-example-explanations.mjs');
  console.log(`    Mode:       ${dryRun ? 'DRY RUN' : 'LIVE'}${force ? ' + --force' : ''}`);
  console.log(`    Batch size: ${batchSize}`);
  console.log(`    Max retries: ${MAX_RETRIES}`);
  console.log(`    Files:      ${filesToProcess.join(', ')}`);
  console.log(`    Data dir:   ${DATA_DIR}`);

  for (const file of filesToProcess) {
    await processFile(file);
  }

  console.log('\n🎉  All done!');
}

main().catch((err) => {
  console.error('\n❌  Fatal error:', err.message);
  process.exit(1);
});
