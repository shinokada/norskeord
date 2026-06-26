#!/usr/bin/env node
/**
 * add-b2-fields.mjs
 *
 * Enriches vocab/uttrykk JSON files with:
 *   english, example, example_english, definition, level, category, part
 *
 * Usage (from project root):
 *   node scripts/add-b2-fields.mjs --files ./draft/flashcard/vocab-b2.json
 *
 * Usage (from scripts/ directory):
 *   node add-b2-fields.mjs --files vocab-b2-combined.json
 *
 * Options:
 *   --files    Comma-separated list of JSON files to process.
 *              Paths containing / or \ are resolved relative to cwd (project root).
 *              Plain filenames (no slash) are resolved relative to this script's directory.
 *              Defaults to vocab-b2-combined.json and uttrykk-b2-combined.json (next to script).
 *   --batch    Number of words per API call (default: 15). Keep ≤20 for reliability.
 *   --dry-run  Print what would happen without calling the API or writing files.
 *   --force    Re-process entries that already have all fields (overwrites them).
 *
 * Prerequisites:
 *   ANTHROPIC_API_KEY must be set in your environment (or .env file in the project root).
 *
 * After this script, you can optionally run add-example-explanations.mjs to
 * refresh/improve the `definition` field independently.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Config ────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_FILES = ['vocab-b2-combined.json', 'uttrykk-b2-combined.json'];

const DEFAULT_BATCH = 15;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

const CATEGORIES = [
  'politics',
  'economics',
  'social-issues',
  'arts',
  'science',
  'emotions',
  'history',
  'law',
  'literature',
  'advanced-adjectives',
  'philosophy',
  'medicine',
  'psychology',
  'business',
  'religion',
  'environment',
  'technology',
  'media',
  'education',
  'language',
  'argumentation',
  'abstract-nouns',
  'advanced-verbs',
  'geography',
  'culture',
  'global-issues',
  'academic-language',
  'discourse-markers',
  'work-career',
  'relationships',
  'communication'
  // 'uttrykk',
];

function interBatchDelay(totalEntries) {
  if (totalEntries >= 500) return 2500;
  if (totalEntries >= 100) return 1500;
  return 800;
}

// ── CLI args ──────────────────────────────────────────────────────────────────

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

// ── Load API key ──────────────────────────────────────────────────────────────
// Look for .env in project root (one level up from scripts/), then fall back
// to the same directory as this script.

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return false;
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
  return true;
}

const rootEnv = path.resolve(__dirname, '..', '.env');
const localEnv = path.resolve(__dirname, '.env');

if (loadEnv(rootEnv)) {
  console.log(`    Loaded .env from project root`);
} else if (loadEnv(localEnv)) {
  console.log(`    Loaded .env from scripts/`);
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY && !dryRun) {
  console.error(
    '❌  ANTHROPIC_API_KEY is not set. Export it or add it to .env in the project root.'
  );
  process.exit(1);
}

// ── Check if entry is complete ────────────────────────────────────────────────

const REQUIRED_FIELDS = [
  'english',
  'example',
  'example_english',
  'definition',
  'level',
  'category',
  'part'
];

function isComplete(entry) {
  return REQUIRED_FIELDS.every((f) => entry[f] && String(entry[f]).trim().length > 0);
}

// ── Fuzzy key matching ────────────────────────────────────────────────────────

function normaliseKey(str) {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

function buildLookup(resultArray) {
  const exact = new Map();
  const fuzzy = new Map();

  for (const item of resultArray) {
    if (item.norsk) {
      exact.set(item.norsk, item);
      fuzzy.set(normaliseKey(item.norsk), item);
    }
  }

  return (norsk) => {
    if (exact.has(norsk)) return exact.get(norsk);
    const norm = normaliseKey(norsk);
    if (fuzzy.has(norm)) return fuzzy.get(norm);
    return undefined;
  };
}

// ── Anthropic API call ────────────────────────────────────────────────────────

async function fetchFields(batch) {
  const wordList = batch
    .map((e, i) => `${i + 1}. norsk: "${e.norsk}" | lemma: "${e.lemma}"`)
    .join('\n');

  const categoryList = CATEGORIES.join(', ');

  const systemPrompt = `You are a Norwegian language expert creating a CEFR B2 learner's vocabulary dictionary.

For each Norwegian word or phrase given, return a JSON array where each element has these exact fields:
- "norsk": the exact input "norsk" value (copy it unchanged)
- "english": English translation (include article for nouns, e.g. "an ideology", "the environment"; infinitive with "to" for verbs)
- "example": A natural Norwegian example sentence at B2 level using the word
- "example_english": English translation of the example sentence
- "definition": A short Norwegian explanation (1–2 sentences, max ~20 words) using only B1-level vocabulary. Do NOT use the target word itself. Do NOT use English.
- "level": always "B2"
- "category": Pick the single best category from this list: ${categoryList}
- "part": grammatical part of speech — one of: noun, verb, adjective, adverb, phrase, expression, conjunction, preposition, interjection

Rules for "norsk" field entries:
- Norwegian nouns often come with /en, /et, /n suffix indicating gender — treat them as nouns
- Entries with «...» (guillemets) are informal expressions
- Entries with " – " (e.g. "angå – angikk – angått") are verb conjugation forms — treat as verb
- Multi-word entries with spaces are usually phrases/expressions — use "phrase" or "expression" for part

Important:
- Respond ONLY with a valid JSON array, no markdown, no preamble, no extra text
- Copy the "norsk" value exactly as given — do not modify it
- Each object must have all 8 fields listed above`;

  const userPrompt = `Enrich these ${batch.length} Norwegian B2 vocabulary entries:\n\n${wordList}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
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
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed)) throw new Error('Response is not a JSON array');
    return parsed;
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
  // Paths containing / or \ are resolved relative to cwd (so you can run from
  // the project root with e.g. --files ./draft/flashcard/vocab-b2.json).
  // Plain filenames with no slash are resolved next to this script.
  const filePath =
    filename.includes('/') || filename.includes('\\')
      ? path.resolve(process.cwd(), filename)
      : path.join(__dirname, filename);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filePath} — skipping`);
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const entries = JSON.parse(raw);

  const toProcess = force ? entries : entries.filter((e) => !isComplete(e));
  const already = entries.length - toProcess.length;

  console.log(`\n📄  ${filePath}`);
  console.log(
    `    Total: ${entries.length} | Already complete: ${already} | To process: ${toProcess.length}${force ? ' (--force)' : ''}`
  );

  if (toProcess.length === 0) {
    console.log('    ✅  Nothing to do.');
    return;
  }

  if (dryRun) {
    console.log(
      `    🔍  DRY RUN — would process ${toProcess.length} entries in ${Math.ceil(toProcess.length / batchSize)} batches of ${batchSize}.`
    );
    return;
  }

  // Backup
  const backupPath = filePath + '.bak';
  fs.copyFileSync(filePath, backupPath);
  console.log(`    💾  Backup saved to ${path.basename(backupPath)}`);

  // Map from norsk → enriched data
  const enriched = new Map();
  for (const e of entries) {
    if (isComplete(e)) enriched.set(e.norsk, e);
  }

  const batchDelay = interBatchDelay(entries.length);
  const batches = [];
  for (let i = 0; i < toProcess.length; i += batchSize) {
    batches.push(toProcess.slice(i, i + batchSize));
  }

  let totalProcessed = 0;
  let fuzzyMatches = 0;

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    process.stdout.write(`    Batch ${bi + 1}/${batches.length} (${batch.length} words)… `);

    const results = await withRetry(() => fetchFields(batch), `batch ${bi + 1}`);

    const lookup = buildLookup(results);
    let hits = 0;

    for (const entry of batch) {
      const data = lookup(entry.norsk);
      if (data) {
        enriched.set(entry.norsk, {
          norsk: entry.norsk,
          lemma: entry.lemma,
          english: data.english,
          example: data.example,
          example_english: data.example_english,
          definition: data.definition,
          level: 'B2',
          category: data.category,
          part: data.part
        });
        hits++;
        if (!results.find((r) => r.norsk === entry.norsk)) {
          fuzzyMatches++;
          console.warn(`\n    🔀  Fuzzy match used for "${entry.norsk}"`);
        }
      } else {
        console.warn(`\n    ⚠️  No data returned for "${entry.norsk}"`);
      }
    }

    totalProcessed += hits;
    console.log(`✓ (${hits}/${batch.length} matched)`);

    if (bi < batches.length - 1) {
      await new Promise((r) => setTimeout(r, batchDelay));
    }
  }

  // Rebuild array preserving original order
  const updated = entries.map((entry) => enriched.get(entry.norsk) ?? entry);

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log(`    ✅  Done. ${totalProcessed}/${toProcess.length} entries enriched. File saved.`);

  if (fuzzyMatches > 0) {
    console.log(`    🔀  ${fuzzyMatches} entries used fuzzy key matching.`);
  }

  // Final missing report
  const stillMissing = updated.filter((e) => !isComplete(e));
  if (stillMissing.length > 0) {
    console.warn(`\n    ⚠️  ${stillMissing.length} entries still incomplete:`);
    for (const e of stillMissing) {
      const missing = REQUIRED_FIELDS.filter((f) => !e[f] || !String(e[f]).trim());
      console.warn(`       • "${e.norsk}" — missing: ${missing.join(', ')}`);
    }
    console.warn(`    Re-run the script to retry these entries.`);
  } else {
    console.log(`    🎯  All entries in ${path.basename(filePath)} are now complete.`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🇳🇴  add-b2-fields.mjs');
  console.log(`    Mode:        ${dryRun ? 'DRY RUN' : 'LIVE'}${force ? ' + --force' : ''}`);
  console.log(`    Batch size:  ${batchSize}`);
  console.log(`    Max retries: ${MAX_RETRIES}`);
  console.log(`    Files:       ${filesToProcess.join(', ')}`);
  console.log(`    Script dir:  ${__dirname}`);
  console.log(`    cwd:         ${process.cwd()}`);

  for (const file of filesToProcess) {
    await processFile(file);
  }

  console.log('\n🎉  All done!');
  console.log('\n💡  Tip: Run add-example-explanations.mjs afterwards to refine definitions.');
}

main().catch((err) => {
  console.error('\n❌  Fatal error:', err.message);
  process.exit(1);
});
