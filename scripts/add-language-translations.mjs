#!/usr/bin/env node
/**
 * add-language-translations.mjs
 *
 * Populates `[language]` and `example_[language]` fields for every entry in
 * the specified JSON files (src/lib/data/vocab-*.json, uttrykk-*.json, etc.)
 * using the Anthropic API. See ai-docs/multi-language.md for the field spec.
 *
 * Usage:
 *   node scripts/add-language-translations.mjs --language ukrainian [--files vocab-a1.json] [--batch 25] [--dry-run] [--force]
 *
 * Options:
 *   --language  Target language key (defaults to "ukrainian").
 *               Must be a key in LANGUAGE_CONFIG below.
 *   --files     Comma-separated list of JSON filenames in src/lib/data/ to process.
 *               Defaults to vocab-a1.json (the pilot file).
 *   --batch     Number of entries to send in a single API call (default: 25).
 *   --dry-run   Print what would happen without writing files or calling the API.
 *   --force     Re-process entries that already have the language field (overwrites them).
 *
 * Prerequisites:
 *   ANTHROPIC_API_KEY must be set in your environment (or .env file in project root).
 *
 * The script:
 *   1. Reads the JSON file.
 *   2. Skips entries that already have the `[language]` field (unless --force).
 *   3. Sends batches to claude-sonnet-4-6, asking for:
 *        - `translation`: translation of `norsk` into the target language
 *        - `example_translation`: a natural example sentence at/below the entry's
 *          own CEFR level (its `level` field), translating `example` — or null if
 *          no natural translation exists.
 *   4. Matches responses back to entries by batch position (1-indexed string keys),
 *      not by fuzzy text matching — robust to any script/casing differences.
 *   5. Merges results back, re-applying a canonical field order, and writes the
 *      file in-place (with a .bak backup).
 *   6. Retries failed batches up to 5 times with exponential backoff.
 *   7. Scales inter-batch delay based on vocabulary size (larger files = longer pause).
 *   8. Prints a final summary of any entries still missing a translation.
 *
 * Adding a new language later:
 *   Add a key to LANGUAGE_CONFIG below (keep it in sync with LANGUAGES in
 *   src/lib/types.ts once that exists) and run with --language <key>.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Language config ──────────────────────────────────────────────────────────
// Key order here is the canonical field order used when writing translation/
// example fields back into entries (see buildCanonicalOrder), and matches the
// priority order from ai-docs/ideas/multi-languages.md (Ukrainian first).
// Add new languages as additional keys — keep in sync with LANGUAGES in
// src/lib/types.ts once that exists.

const LANGUAGE_CONFIG = {
  ukrainian: { name: 'Ukrainian', nativeName: 'українська' },
  polish: { name: 'Polish', nativeName: 'polski' },
  spanish: { name: 'Spanish', nativeName: 'español' },
  arabic: { name: 'Arabic (Syrian)', nativeName: 'العربية السورية' }
};

// ── Config ───────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = path.resolve(__dirname, '../src/lib/data');

const DEFAULT_FILES = ['vocab-a1.json'];

const DEFAULT_BATCH = 25;
const MAX_RETRIES = 5;
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

const language = getArg('--language') ?? 'ukrainian';
if (!(language in LANGUAGE_CONFIG)) {
  console.error(
    `❌  Unknown language "${language}". Supported: ${Object.keys(LANGUAGE_CONFIG).join(', ')}\n` +
      `    To add a new one, edit LANGUAGE_CONFIG at the top of this script.`
  );
  process.exit(1);
}
const languageMeta = LANGUAGE_CONFIG[language];
const exampleField = `example_${language}`;

// ── Load API key ─────────────────────────────────────────────────────────────

const envPath = path.resolve(__dirname, '../.env');
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

// ── Canonical field order ────────────────────────────────────────────────────
// Keeps JSON diffs clean and consistent regardless of which order languages
// were generated in. Unknown/future fields are preserved, appended at the end.

function buildCanonicalOrder() {
  const langs = Object.keys(LANGUAGE_CONFIG);
  return [
    'id',
    'norsk',
    'lemma',
    'english',
    ...langs,
    'example',
    'example_english',
    ...langs.map((l) => `example_${l}`),
    'definition',
    'level',
    'category',
    'part'
  ];
}

const CANONICAL_ORDER = buildCanonicalOrder();

function reorderEntry(entry) {
  const result = {};
  for (const key of CANONICAL_ORDER) {
    if (key in entry) result[key] = entry[key];
  }
  for (const key of Object.keys(entry)) {
    if (!(key in result)) result[key] = entry[key];
  }
  return result;
}

// ── Anthropic call ────────────────────────────────────────────────────────────

async function fetchTranslations(batch) {
  const wordList = batch
    .map(
      (e, i) =>
        `${i + 1}. norsk: "${e.norsk}" | english: "${e.english}" | example: "${e.example}" | part: ${e.part ?? 'n/a'} | level: ${e.level ?? 'A1'}`
    )
    .join('\n');

  const systemPrompt = `You are a professional translator producing learner-facing content for Norwegian-language learners whose native language is ${languageMeta.name} (${languageMeta.nativeName}).

For each numbered Norwegian word/phrase below, provide:
1. "translation" — the ${languageMeta.name} translation of the "norsk" value. Use the "english" value and "part" to disambiguate meaning where the Norwegian word is ambiguous. Keep it as a single natural translation a learner would actually use, not a literal gloss.
2. "example_translation" — a natural ${languageMeta.name} sentence that conveys the same meaning as "example", using vocabulary no harder than the item's own CEFR "level" (given per item below) so the sentence itself stays easy to read at that level. Set this to null if no natural, useful translation of the example exists for this item.

Respond ONLY with a JSON object where each key is the item number as a string ("1", "2", ...) and the value is an object with "translation" and "example_translation". No markdown formatting, no preamble, no extra commentary.

Example output format:
{
  "1": { "translation": "привіт", "example_translation": "Привіт! Як справи?" },
  "2": { "translation": "круто", "example_translation": null }
}`;

  const userPrompt = `Please translate these ${batch.length} items into ${languageMeta.name}:\n\n${wordList}`;

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

  const missing = entries.filter((e) => (force ? true : !e[language]));
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

  // Index-based lookup: missing[batchStartIndex + i] is keyed by its original
  // array index, since the same plain object reference can't reliably be used
  // as a Map key after JSON round-tripping and entries are not guaranteed to
  // have unique content (e.g. two entries could share identical norsk/english
  // by coincidence). Indexing into `missing` avoids that ambiguity entirely.
  const resultsByIndex = new Map(); // index into `missing` -> { translation, example_translation }
  const batchDelay = interBatchDelay(entries.length);

  const batches = [];
  for (let i = 0; i < missing.length; i += batchSize) {
    batches.push({ start: i, items: missing.slice(i, i + batchSize) });
  }

  let processed = 0;

  for (let bi = 0; bi < batches.length; bi++) {
    const { start, items: batch } = batches[bi];
    process.stdout.write(`    Batch ${bi + 1}/${batches.length} (${batch.length} items)… `);

    const result = await withRetry(() => fetchTranslations(batch), `${filename} batch ${bi + 1}`);

    let hits = 0;
    for (let i = 0; i < batch.length; i++) {
      const entry = batch[i];
      const item = result[String(i + 1)];
      if (item && typeof item.translation === 'string' && item.translation.trim()) {
        resultsByIndex.set(start + i, item);
        hits++;
      } else {
        console.warn(`\n    ⚠️  No translation returned for "${entry.norsk}" (item ${i + 1})`);
      }
    }
    processed += hits;
    console.log(`✓ (${hits}/${batch.length} matched)`);

    if (bi < batches.length - 1) {
      await new Promise((r) => setTimeout(r, batchDelay));
    }
  }

  // Merge back into entries
  let missingIndex = -1;
  const updated = entries.map((entry) => {
    const isMissing = force ? true : !entry[language];
    if (!isMissing) return entry;
    missingIndex++;

    const item = resultsByIndex.get(missingIndex);
    if (!item) return entry;

    const next = { ...entry, [language]: item.translation };
    if (item.example_translation) {
      next[exampleField] = item.example_translation;
    } else {
      delete next[exampleField];
    }
    return reorderEntry(next);
  });

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  console.log(`    ✅  Done. ${processed}/${missing.length} translations added. File saved.`);

  // ── Final missing-entry report ─────────────────────────────────────────────
  const stillMissing = updated.filter((e) => !e[language]);
  if (stillMissing.length > 0) {
    console.warn(
      `\n    ⚠️  ${stillMissing.length} entries still have no "${language}" translation after processing:`
    );
    for (const e of stillMissing) {
      console.warn(`       • "${e.norsk}"${e.id ? ` (${e.id})` : ''}`);
    }
    console.warn(`    Re-run the script (or use --force) to retry these entries.`);
  } else {
    console.log(`    🎯  All entries in ${filename} now have a "${language}" translation.`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌍  add-language-translations.mjs');
  console.log(`    Language:    ${languageMeta.name} (${language})`);
  console.log(`    Mode:        ${dryRun ? 'DRY RUN' : 'LIVE'}${force ? ' + --force' : ''}`);
  console.log(`    Batch size:  ${batchSize}`);
  console.log(`    Max retries: ${MAX_RETRIES}`);
  console.log(`    Files:       ${filesToProcess.join(', ')}`);
  console.log(`    Data dir:    ${DATA_DIR}`);

  for (const file of filesToProcess) {
    await processFile(file);
  }

  console.log('\n🎉  All done!');
}

main().catch((err) => {
  console.error('\n❌  Fatal error:', err.message);
  process.exit(1);
});
