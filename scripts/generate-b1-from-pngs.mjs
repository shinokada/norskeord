#!/usr/bin/env node
/**
 * generate-b1-from-pngs.mjs
 *
 * Reads Norwegian B1 ordliste PNG images (scanned alphabetical index pages),
 * sends each image to Claude vision to extract Norwegian words/phrases,
 * then enriches each entry with English translation, examples, and metadata.
 * Generates vocab-b1-new.json (single words) and uttrykk-b1-new.json
 * (multi-word expressions).
 *
 * Usage:
 *   node scripts/generate-b1-from-pngs.mjs [--png-dir vocab/b1] [--batch 15] [--dry-run]
 *
 * Options:
 *   --png-dir       Directory containing b1-*.png files (default: vocab/b1)
 *   --batch         Words per API call for enrichment step (default: 15)
 *   --dry-run       Extract words and print them, don't write output files
 *   --skip-extract  Skip image extraction, load from words-b1-raw.json checkpoint
 *
 * Prerequisites:
 *   ANTHROPIC_API_KEY must be set in your environment (or .env file).
 *
 * Pipeline:
 *   1. Read each PNG file as base64.
 *   2. Send each image to Claude vision to extract Norwegian words/phrases
 *      (the source images are alphabetical indexes with NO English translations).
 *   3. Deduplicate and split: single words → vocab, multi-word → uttrykk.
 *   4. Enrich each entry: Claude generates English translation, example,
 *      definition, category, and part-of-speech.
 *   5. Write src/lib/data/vocab-b1-new.json and uttrykk-b1-new.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Paths ─────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(ROOT, 'src/lib/data');
const CHECKPOINT_PATH = path.resolve(ROOT, 'vocab/b1/words-b1-raw.json');

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const dryRun = hasFlag('--dry-run');
const skipExtract = hasFlag('--skip-extract');
const batchSize = parseInt(getArg('--batch') ?? '15', 10);
const pngDirArg = getArg('--png-dir') ?? 'vocab/b1';
const PNG_DIR = path.resolve(ROOT, pngDirArg);

// ── Load API key ──────────────────────────────────────────────────────────────

const envPath = path.resolve(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
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
  console.error('❌  ANTHROPIC_API_KEY is not set.');
  process.exit(1);
}

// ── B1 categories ─────────────────────────────────────────────────────────────

const B1_CATEGORIES = [
  'travel',
  'environment',
  'media',
  'culture',
  'technology',
  'relationships',
  'education',
  'work',
  'city-life',
  'traditions',
  'expressing-opinions',
  'cooking',
  'accommodation',
  'health',
  'finance',
  'personal-growth',
  'reasoning',
  'society',
  'communication-skills',
  'urban-life',
  'mental-wellbeing',
  'fitness',
  'arts-culture',
  'economics',
  'sustainability',
  'science-nature',
  'journalism',
  'workplace',
  'family',
  'politics',
  'language-learning',
  'healthcare'
];

// ── Retry helper ──────────────────────────────────────────────────────────────

async function withRetry(fn, label, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = 2000 * attempt;
      console.warn(
        `  ⚠️  ${label} — attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms…`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ── Step 1: Read PNG files as base64 ─────────────────────────────────────────

function loadPngs() {
  const pngFiles = fs
    .readdirSync(PNG_DIR)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .sort()
    .map((f) => path.join(PNG_DIR, f));

  if (pngFiles.length === 0) {
    console.error(`❌  No PNG files found in ${PNG_DIR}`);
    process.exit(1);
  }

  console.log(
    `🖼️   Found ${pngFiles.length} PNG files: ${pngFiles.map((f) => path.basename(f)).join(', ')}`
  );

  const result = {};
  for (const filepath of pngFiles) {
    const data = fs.readFileSync(filepath);
    result[filepath] = data.toString('base64');
  }

  return result; // { filepath: base64string, ... }
}

// ── Step 2: Extract words from page image via Claude vision ───────────────────

async function extractWordsFromImage(filename, base64Image) {
  const systemPrompt = `You are extracting a vocabulary list from a scanned Norwegian B1 alphabetical word index ("alfabetisk ordliste").
The page shows Norwegian words/phrases followed by chapter/section numbers (e.g. "abonnement 5(2)", "aksje 14(OU)"). There are NO English translations on the page.

Rules:
- Extract EVERY Norwegian word or phrase visible — read all columns fully
- Strip the chapter/section numbers (everything after the last letter/space before digits or parentheses)
- Keep multi-word entries as-is (e.g. "av og til", "bryte loven", "bygge opp", "bare; ikke bare bare")
- For entries with semicolons like "borte; bli borte", extract each as a separate entry
- Keep the Norwegian word exactly as written (no capitalisation changes)
- Ignore page numbers, headers, letters (A, B, C...) used as section dividers

Respond ONLY with a JSON array of strings — just the Norwegian words/phrases.
Example: ["abonnement", "absolutt", "av og til", "bygge opp"]
No preamble, no explanation, no markdown fences — just the raw JSON array.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/png', data: base64Image }
            },
            {
              type: 'text',
              text: `Extract all Norwegian words/phrases from this page of ${path.basename(filename)}.`
            }
          ]
        }
      ]
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
    const words = JSON.parse(clean);
    // Convert string array to {norsk} objects
    return words.map((w) => ({ norsk: w.trim() }));
  } catch {
    throw new Error(`Failed to parse JSON:\n${text.slice(0, 300)}`);
  }
}

// ── Step 3: Deduplicate ───────────────────────────────────────────────────────

function deduplicateWords(allWords) {
  const seen = new Set();
  const unique = [];
  for (const w of allWords) {
    const key = w.norsk.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(w);
    }
  }
  return unique;
}

// ── Step 4: Split vocab vs uttrykk ───────────────────────────────────────────

function isMultiWord(norsk) {
  const stripped = norsk.replace(/^å\s+/, '').trim();
  return stripped.includes(' ');
}

// ── Step 5: Enrich entries ────────────────────────────────────────────────────

async function enrichBatch(batch, isUttrykk) {
  const wordList = batch.map((w, i) => `${i + 1}. "${w.norsk}"`).join('\n');

  const systemPrompt = `You are a Norwegian language expert creating a B1-level vocabulary dataset.

For each Norwegian word/phrase, generate ALL of the following fields:
- "norsk": exact value given (do not change)
- "lemma": base/dictionary form (e.g. "huset" → "hus", "administrere" stays, phrases stay as-is)
- "english": accurate English translation
- "example": a natural Norwegian B1-level example sentence using the word
- "example_english": English translation of the example
- "definition": 1-2 sentence Norwegian explanation using only A2/B1 vocabulary, do NOT use the word itself
- "level": "B1"
- "category": best-fit category from this list — ${B1_CATEGORIES.join(', ')}
- "part": one of: noun, verb, adjective, adverb, phrase, conjunction, preposition, pronoun, interjection

Respond ONLY with a JSON array of objects — no markdown, no preamble.`;

  const userPrompt = `Enrich these ${batch.length} Norwegian B1 ${isUttrykk ? 'phrases' : 'words'}:\n\n${wordList}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
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
    throw new Error(`Failed to parse JSON:\n${text.slice(0, 300)}`);
  }
}

// ── Merge enriched ────────────────────────────────────────────────────────────

function mergeEnriched(originals, enriched) {
  const lookup = new Map();
  for (const e of enriched) {
    if (e && e.norsk) lookup.set(e.norsk.toLowerCase().trim(), e);
  }

  return originals
    .map((orig) => {
      const found = lookup.get(orig.norsk.toLowerCase().trim());
      if (!found) {
        console.warn(`  ⚠️  No enrichment returned for "${orig.norsk}"`);
        return null;
      }
      return {
        norsk: found.norsk ?? orig.norsk,
        lemma: found.lemma ?? orig.norsk,
        english: found.english ?? '',
        example: found.example ?? '',
        example_english: found.example_english ?? '',
        definition: found.definition ?? '',
        level: 'B1',
        category: found.category ?? 'culture',
        part: found.part ?? 'noun'
      };
    })
    .filter(Boolean);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🇳🇴  generate-b1-from-pngs.mjs');
  console.log(`    Mode:      ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`    Batch:     ${batchSize}`);
  console.log(`    PNG dir:   ${PNG_DIR}`);
  console.log(`    Data dir:  ${DATA_DIR}`);
  console.log();

  // ── Extract ───────────────────────────────────────────────────────────────

  let allWords;

  if (skipExtract && fs.existsSync(CHECKPOINT_PATH)) {
    console.log(`⏭️   --skip-extract: loading checkpoint from ${CHECKPOINT_PATH}`);
    allWords = JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf8'));
    console.log(`    Loaded ${allWords.length} words from checkpoint.`);
  } else {
    console.log('📖  Step 1: Loading PNG files…');
    const pngImages = loadPngs(); // { filepath: base64string, ... }

    console.log('\n🔍  Step 2: Extracting words from images…');
    const parsedAll = [];

    for (const [filepath, base64] of Object.entries(pngImages)) {
      const fname = path.basename(filepath);
      process.stdout.write(`  ${fname}… `);

      const words = await withRetry(() => extractWordsFromImage(filepath, base64), fname);
      console.log(`✓ ${words.length} entries`);
      parsedAll.push(...words);

      await new Promise((r) => setTimeout(r, 1000));
    }

    allWords = deduplicateWords(parsedAll);
    console.log(`\n    Total unique entries: ${allWords.length}`);

    fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(allWords, null, 2) + '\n');
    console.log(`    💾  Checkpoint saved to ${CHECKPOINT_PATH}`);
  }

  // ── Split ─────────────────────────────────────────────────────────────────

  const vocabRaw = allWords.filter((w) => !isMultiWord(w.norsk));
  const uttrykkRaw = allWords.filter((w) => isMultiWord(w.norsk));

  console.log(
    `\n📊  Split: ${vocabRaw.length} single words, ${uttrykkRaw.length} multi-word phrases`
  );

  if (dryRun) {
    console.log('\n🔍  DRY RUN — sample words:');
    console.log(
      '  Vocab:   ',
      vocabRaw
        .slice(0, 10)
        .map((w) => w.norsk)
        .join(', ')
    );
    console.log(
      '  Uttrykk: ',
      uttrykkRaw
        .slice(0, 10)
        .map((w) => w.norsk)
        .join(', ')
    );
    console.log('\n✅  DRY RUN complete — no files written.');
    return;
  }

  // ── Enrich vocab ──────────────────────────────────────────────────────────

  console.log('\n✨  Step 3: Enriching vocab entries…');
  const vocabEnriched = [];

  for (let i = 0; i < vocabRaw.length; i += batchSize) {
    const batch = vocabRaw.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(vocabRaw.length / batchSize);
    process.stdout.write(`    Batch ${batchNum}/${totalBatches} (${batch.length} words)… `);

    const enriched = await withRetry(() => enrichBatch(batch, false), `vocab batch ${batchNum}`);
    const merged = mergeEnriched(batch, Array.isArray(enriched) ? enriched : []);
    vocabEnriched.push(...merged);
    console.log(`✓ (${merged.length}/${batch.length})`);

    if (i + batchSize < vocabRaw.length) await new Promise((r) => setTimeout(r, 1500));
  }

  // ── Enrich uttrykk ────────────────────────────────────────────────────────

  console.log('\n✨  Step 4: Enriching uttrykk entries…');
  const uttrykkEnriched = [];

  for (let i = 0; i < uttrykkRaw.length; i += batchSize) {
    const batch = uttrykkRaw.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(uttrykkRaw.length / batchSize);
    process.stdout.write(`    Batch ${batchNum}/${totalBatches} (${batch.length} phrases)… `);

    const enriched = await withRetry(() => enrichBatch(batch, true), `uttrykk batch ${batchNum}`);
    const merged = mergeEnriched(batch, Array.isArray(enriched) ? enriched : []);
    uttrykkEnriched.push(...merged);
    console.log(`✓ (${merged.length}/${batch.length})`);

    if (i + batchSize < uttrykkRaw.length) await new Promise((r) => setTimeout(r, 1500));
  }

  // ── Write output ──────────────────────────────────────────────────────────

  const vocabOut = path.join(DATA_DIR, 'vocab-b1-new.json');
  const uttrykkOut = path.join(DATA_DIR, 'uttrykk-b1-new.json');

  if (fs.existsSync(vocabOut)) fs.copyFileSync(vocabOut, vocabOut + '.bak');
  if (fs.existsSync(uttrykkOut)) fs.copyFileSync(uttrykkOut, uttrykkOut + '.bak');

  fs.writeFileSync(vocabOut, JSON.stringify(vocabEnriched, null, 2) + '\n', 'utf8');
  fs.writeFileSync(uttrykkOut, JSON.stringify(uttrykkEnriched, null, 2) + '\n', 'utf8');

  console.log('\n🎉  Done!');
  console.log(`    📝  vocab-b1-new.json    — ${vocabEnriched.length} entries`);
  console.log(`    📝  uttrykk-b1-new.json  — ${uttrykkEnriched.length} entries`);
  console.log(`    📁  Saved to ${DATA_DIR}`);
  console.log('\n💡  Next steps:');
  console.log('    • Review the output files for quality');
  console.log(
    '    • Run add-example-explanations.mjs --files vocab-b1-new.json if any definitions are missing'
  );
  console.log('    • Rename to vocab-b1.json / uttrykk-b1.json when satisfied');
}

main().catch((err) => {
  console.error('\n❌  Fatal error:', err.message);
  process.exit(1);
});
