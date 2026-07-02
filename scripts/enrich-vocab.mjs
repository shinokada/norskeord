#!/usr/bin/env node
/**
 * enrich-vocab.mjs
 *
 * Method 2, Step 2 (see ai-docs/instructions/image-converter.md and
 * ai-docs/instructions/work-flow.md).
 *
 * Reads Step 1 extraction output (id, norsk, lemma, definition, level, part,
 * and category="uttrykk" for expressions) and uses the Claude API to add:
 *   - english, ukrainian, spanish, german
 *   - example (Norwegian), example_english, example_ukrainian,
 *     example_spanish, example_german
 *   - category (words only — expressions keep "uttrykk" from Step 1)
 *
 * Input:
 *   draft/{level}/extracted-vocab-{level}.json
 *   draft/{level}/extracted-uttrykk-{level}.json
 *
 * Output (appended, not overwritten):
 *   draft/{level}/vocab-{level}-new.json
 *   draft/{level}/uttrykk-{level}-new.json
 *
 * Entries whose `lemma` already exists in the output file are skipped by
 * default, so re-running this script after appending new extractions is
 * safe — use --force to re-enrich everything anyway.
 *
 * Usage:
 *   node scripts/enrich-vocab.mjs --level c
 *   node scripts/enrich-vocab.mjs --level c --dry-run
 *   node scripts/enrich-vocab.mjs --level c --force
 *   node scripts/enrich-vocab.mjs --level c --batch 15
 *
 * Options:
 *   --level     CEFR level: a1 | a2 | b1 | b2 | c   (required)
 *   --dry-run   Show what would be enriched without calling the API or writing files.
 *   --force     Re-enrich entries even if their lemma already exists in the output file.
 *   --batch     Number of entries per API call (default: 10).
 *
 * After this step, run find_dupes.py / find_uttrykk_dupes.py on the output
 * before Step 3 validation (check-vocab.mjs / check-uttrykk.mjs), per
 * work-flow.md.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Config ──────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src/lib/data');
const DRAFT_ROOT = path.join(PROJECT_ROOT, 'draft');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;
const INTER_BATCH_DELAY_MS = 1200;

const CATEGORIES = [
  'philosophy',
  'academic',
  'formal-writing',
  'rhetoric',
  'complex-emotions',
  'professional',
  'abstract-concepts',
  'politics-democracy',
  'linguistics',
  'media-journalism',
  'architecture-design',
  'diplomacy-international',
  'finance-economics',
  'medicine-healthcare',
  'psychology-advanced',
  'literary',
  'archaic',
  'proverbs',
  'highly-formal',
  'technical',
  'advanced-law-justice',
  'neuroscience-cognition',
  'climate-environment-policy',
  'sociology-anthropology',
  'advanced-business-strategy',
  'existential-abstract',
  'nature-landscape',
  'sensory-sound',
  'physical-appearance',
  'everyday-objects',
  'character-temperament',
  'embodied-emotion',
  'manner-of-motion',
  'interpersonal-conflict',
  'intensifiers-degree'
];

// ── CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};

const level = getArg('--level');
const dryRun = hasFlag('--dry-run');
const force = hasFlag('--force');
const batchSize = parseInt(getArg('--batch') ?? '10', 10);

if (!level) {
  console.error('❌  --level is required. Example:');
  console.error('    node scripts/enrich-vocab.mjs --level c');
  process.exit(1);
}

// ── Load API key from .env if present ──────────────────────────────────

const envPath = path.resolve(PROJECT_ROOT, '.env');
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

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY && !dryRun) {
  console.error('❌  ANTHROPIC_API_KEY is not set.');
  console.error('    Add it to your .env file or run:');
  console.error('    ANTHROPIC_API_KEY=your-key node scripts/enrich-vocab.mjs --level ' + level);
  process.exit(1);
}

// ── Paths ───────────────────────────────────────────────────────────────

const draftDir = path.join(DRAFT_ROOT, level);
const paths = {
  extractedVocab: path.join(draftDir, `extracted-vocab-${level}.json`),
  extractedUttrykk: path.join(draftDir, `extracted-uttrykk-${level}.json`),
  outVocab: path.join(draftDir, `vocab-${level}-new.json`),
  outUttrykk: path.join(draftDir, `uttrykk-${level}-new.json`),
  productionVocab: path.join(DATA_DIR, `vocab-${level}.json`)
};

// ── Helpers ─────────────────────────────────────────────────────────────

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw);
}

function categoryDistribution(entries) {
  const counts = {};
  for (const cat of CATEGORIES) counts[cat] = 0;
  for (const e of entries) {
    if (e.category && counts[e.category] !== undefined) counts[e.category]++;
  }
  return counts;
}

function alreadyEnriched(extractedEntries, existingOutput, forceAll) {
  if (forceAll) return extractedEntries;
  const existingLemmas = new Set(existingOutput.map((e) => e.lemma));
  return extractedEntries.filter((e) => !existingLemmas.has(e.lemma));
}

// ── Prompt builders ─────────────────────────────────────────────────────

function buildWordsPrompt(batch, catCounts) {
  const distributionText = CATEGORIES.map((c) => `  ${c}: ${catCounts[c]}`).join('\n');

  const entries = JSON.stringify(
    batch.map((e) => ({
      lemma: e.lemma,
      norsk: e.norsk,
      definition: e.definition,
      part: e.part,
      level: e.level
    })),
    null,
    2
  );

  return `You are a Norwegian language expert enriching vocabulary entries for a language-learning app (Method 2, Step 2 — see ai-docs/instructions/image-converter.md).

For each entry below, generate:
1. "english" — English translation, matching the supplied Norwegian "definition" and "norsk" form.
2. "ukrainian" — Ukrainian translation.
3. "spanish" — Spanish translation.
4. "german" — German translation.
5. "category" — exactly one category from this list, using the name exactly as written:
${CATEGORIES.map((c) => `   - ${c}`).join('\n')}
   Current category distribution across the existing dataset (favor under-represented categories rather than repeating the same few):
${distributionText}
6. "example" — ONE natural Norwegian sentence using the word/expression in an appropriate grammatical form. This must be written in Norwegian (Bokmål), NOT translated — it is a new sentence you write, not a translation of anything.
7. "example_english" — English translation of the example sentence.
8. "example_ukrainian" — Ukrainian translation of the example sentence.
9. "example_spanish" — Spanish translation of the example sentence.
10. "example_german" — German translation of the example sentence.

Rules:
- Translate naturally, not word-for-word.
- The example sentence should be concise, grammatically correct, and clearly demonstrate the meaning.
- Do NOT use typographic quotes (" " „ « ») in your output — use plain ASCII quotes if needed.
- Match each result to its entry using the "lemma" field as the key.
- Respond ONLY with a valid JSON array (no markdown, no code fences, no commentary). Each element must have: "lemma", "english", "ukrainian", "spanish", "german", "category", "example", "example_english", "example_ukrainian", "example_spanish", "example_german".

Entries:
${entries}`;
}

function buildExpressionsPrompt(batch) {
  const entries = JSON.stringify(
    batch.map((e) => ({
      lemma: e.lemma,
      norsk: e.norsk,
      definition: e.definition,
      part: e.part,
      level: e.level
    })),
    null,
    2
  );

  return `You are a Norwegian language expert enriching expression entries for a language-learning app (Method 2, Step 2 — see ai-docs/instructions/image-converter.md).

For each entry below, generate:
1. "english" — English translation, matching the supplied Norwegian "definition" and "norsk" form.
2. "ukrainian" — Ukrainian translation.
3. "spanish" — Spanish translation.
4. "german" — German translation.
5. "example" — ONE natural Norwegian sentence using the expression in context. This must be written in Norwegian (Bokmål), NOT translated — it is a new sentence you write, not a translation of anything.
6. "example_english" — English translation of the example sentence.
7. "example_ukrainian" — Ukrainian translation of the example sentence.
8. "example_spanish" — Spanish translation of the example sentence.
9. "example_german" — German translation of the example sentence.

Do not generate a "category" — expressions always use "uttrykk", already set.

Rules:
- Translate naturally, not word-for-word.
- The example sentence should be concise, grammatically correct, and clearly demonstrate the meaning.
- Do NOT use typographic quotes (" " „ « ») in your output — use plain ASCII quotes if needed.
- Match each result to its entry using the "lemma" field as the key.
- Respond ONLY with a valid JSON array (no markdown, no code fences, no commentary). Each element must have: "lemma", "english", "ukrainian", "spanish", "german", "example", "example_english", "example_ukrainian", "example_spanish", "example_german".

Entries:
${entries}`;
}

// ── API call ────────────────────────────────────────────────────────────

async function callClaude(prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
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
    .replace(/[„\u201C\u201D\u00AB\u00BB\u2018\u2019]/g, "'")
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error(`Failed to parse JSON response:\n${text}`);
  }
}

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

// ── Merge helper — builds final object in production field order ────────

function mergeEntry(extracted, generated, isExpression) {
  return {
    id: extracted.id ?? '',
    norsk: extracted.norsk,
    lemma: extracted.lemma,
    english: generated.english ?? '',
    ukrainian: generated.ukrainian ?? '',
    spanish: generated.spanish ?? '',
    german: generated.german ?? '',
    example: generated.example ?? '',
    example_english: generated.example_english ?? '',
    example_ukrainian: generated.example_ukrainian ?? '',
    example_spanish: generated.example_spanish ?? '',
    example_german: generated.example_german ?? '',
    definition: extracted.definition,
    level: extracted.level,
    category: isExpression ? 'uttrykk' : (generated.category ?? ''),
    part: extracted.part
  };
}

// ── Process one set (words or expressions) ───────────────────────────────

async function processSet({
  label,
  extractedPath,
  outPath,
  isExpression,
  buildPrompt,
  catCounts
}) {
  console.log(`\n📄  ${label}`);

  const extracted = readJsonArray(extractedPath);
  console.log(`    Extracted entries: ${extracted.length}  (${extractedPath})`);

  if (extracted.length === 0) {
    console.log('    Nothing to enrich.');
    return;
  }

  const existingOutput = readJsonArray(outPath);
  const toEnrich = alreadyEnriched(extracted, existingOutput, force);

  console.log(`    Already enriched (skipped): ${extracted.length - toEnrich.length}`);
  console.log(`    To enrich: ${toEnrich.length}`);

  if (toEnrich.length === 0) {
    console.log('    ✅  Nothing new. (Use --force to re-enrich everything.)');
    return;
  }

  if (dryRun) {
    console.log(`    🔍  DRY RUN — would enrich ${toEnrich.length} entries:`);
    for (const e of toEnrich) console.log(`       • ${e.lemma}`);
    return;
  }

  const batches = [];
  for (let i = 0; i < toEnrich.length; i += batchSize) {
    batches.push(toEnrich.slice(i, i + batchSize));
  }

  const results = new Map();

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    process.stdout.write(`    Batch ${i + 1}/${batches.length} (${batch.length} entries)… `);

    const prompt = isExpression ? buildPrompt(batch) : buildPrompt(batch, catCounts);
    const generated = await withRetry(() => callClaude(prompt), `batch ${i + 1}`);

    let hits = 0;
    for (const item of generated) {
      if (item.lemma && item.english && item.example) {
        results.set(item.lemma, item);
        hits++;
      } else {
        console.warn(`\n    ⚠️  Incomplete result for lemma="${item.lemma}"`);
      }
    }
    console.log(`✓ (${hits}/${batch.length} enriched)`);

    // Update running category counts so later batches in the same run
    // still favor under-represented categories.
    if (!isExpression) {
      for (const item of generated) {
        if (item.category && catCounts[item.category] !== undefined) {
          catCounts[item.category]++;
        }
      }
    }

    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, INTER_BATCH_DELAY_MS));
    }
  }

  const merged = [];
  const missing = [];
  for (const e of toEnrich) {
    const generated = results.get(e.lemma);
    if (!generated) {
      missing.push(e.lemma);
      continue;
    }
    merged.push(mergeEntry(e, generated, isExpression));
  }

  const combined = [...existingOutput, ...merged];
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(combined, null, 2) + '\n', 'utf8');

  console.log(`    ✅  Appended ${merged.length} entries. Total in file now: ${combined.length}.`);
  console.log(`    → ${outPath}`);

  if (missing.length > 0) {
    console.warn(`    ⚠️  ${missing.length} entries failed to enrich — re-run to retry:`);
    for (const l of missing) console.warn(`       • ${l}`);
  }
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log('🧩  enrich-vocab.mjs — Method 2, Step 2');
  console.log(`    Level:      ${level}`);
  console.log(`    Mode:       ${dryRun ? 'DRY RUN' : 'LIVE'}${force ? ' + --force' : ''}`);
  console.log(`    Batch size: ${batchSize}`);

  const productionVocab = readJsonArray(paths.productionVocab);
  const catCounts = categoryDistribution(productionVocab);

  await processSet({
    label: `Words (vocab-${level})`,
    extractedPath: paths.extractedVocab,
    outPath: paths.outVocab,
    isExpression: false,
    buildPrompt: buildWordsPrompt,
    catCounts
  });

  await processSet({
    label: `Expressions (uttrykk-${level})`,
    extractedPath: paths.extractedUttrykk,
    outPath: paths.outUttrykk,
    isExpression: true,
    buildPrompt: buildExpressionsPrompt
  });

  console.log('\n✅  Done.');
  console.log('    Next: run find_dupes.py and find_uttrykk_dupes.py on the output,');
  console.log('    then check-vocab.mjs / check-uttrykk.mjs (Step 3 in work-flow.md).');
}

main().catch((err) => {
  console.error('\n❌  Fatal error:', err.message);
  process.exit(1);
});
