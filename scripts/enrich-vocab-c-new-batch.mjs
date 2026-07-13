#!/usr/bin/env node
/**
 * enrich-vocab-c-new-batch.mjs
 *
 * Adapted one-off variant of scripts/enrich-vocab.mjs for the "vocab bucket"
 * spillover from c-uttrykk-addition.md (Phase 1 triage candidates bucketed
 * "vocab" instead of "uttrykk" — particle/reflexive verbs + 2 nouns with a
 * clear grammatical head).
 *
 * Differs from enrich-vocab.mjs in exactly the three ways that made the
 * stock script unsafe for this batch:
 *   1. Reads directly from draft/c/vocab-c-new.json (already has real ids +
 *      categories assigned via assign-ids.mjs), not from an
 *      extracted-vocab-c.json Step-1 file.
 *   2. NEVER lets the model choose "category" — category is copied straight
 *      through from the input entry, since assign-ids.mjs already baked the
 *      category into each id (v-c-manner-of-motion-025 etc). Letting the
 *      model reassign category would desync the id from the category field.
 *   3. Supplies "definition" per entry from a fixed lookup table (sourced
 *      from c-uttrykk-triage.json's correct_paraphrase, same contextual-
 *      paraphrase style already used for the uttrykk-c definition field)
 *      instead of asking the model to invent one.
 *
 * Batches + writes incrementally to draft/c/vocab-uttrykk/vocab-c-enriched-
 * batch-NN.json (one file per batch, matching the enriched-batch-01..09.json
 * convention from the uttrykk-c pipeline) so progress survives a session
 * ending mid-run. Re-running skips lemmas already present in any existing
 * batch file.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... node scripts/enrich-vocab-c-new-batch.mjs
 *   node scripts/enrich-vocab-c-new-batch.mjs --dry-run
 *   node scripts/enrich-vocab-c-new-batch.mjs --batch 5   (default 5)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  NO_COMMON_WORD_MAP,
  NO_AMBIGUOUS_WORDS,
  degradeNO,
  bareWordNO,
  DE_COMMON_WORD_MAP,
  DE_AMBIGUOUS_WORDS,
  degradeDE,
  ES_COMMON_WORD_MAP,
  ES_AMBIGUOUS_WORDS,
  degradeES,
  bareWordIntl,
  checkLanguage,
  applyFixes,
  findSpanishPunctuationIssues,
  fixSpanishPunctuation
} from './lib/diacritics.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const INPUT_PATH = path.join(PROJECT_ROOT, 'draft/c/vocab-c-new.json');
const BATCH_DIR = path.join(PROJECT_ROOT, 'draft/c/vocab-uttrykk');
const BATCH_PREFIX = 'vocab-c-enriched-batch-';

// Sourced from ai-docs/implementation/c-uttrykk-triage.json's
// correct_paraphrase for these 20 lemmas (bucket: "vocab"). Same contextual-
// paraphrase style already used for uttrykk-c's definition field.
const DEFINITIONS = {
  'fryde seg': 'Hun gleder seg over julen.',
  'røske opp': 'Han river ikke opp døra.',
  'luske inn': 'Karsten lister seg inn på rommet sitt.',
  'komme borti': 'Han støtte borti henne flere ganger.',
  'gå løs på': 'De gjøv løs på hverandre.',
  frossenpinn: 'Du fryser altfor lett.',
  'se seg for': 'Du må se deg omkring før du går.',
  'gjøre av': 'Hvor har du satt veska di?',
  'holde av': 'Jeg er glad i deg.',
  nedkomme: 'Hun har født et barn.',
  'dra på årene': 'Han blir gammel.',
  grinebiter: 'Han er gretten.',
  'bli av': 'Hvor har den lille luringen tatt veien nå, da?',
  'dra kjensel på': 'Hun kjente ham igjen.',
  'dra ut': 'Møtet varte lenge.',
  'drive omkring': 'Ungdommen hang og slang omkring i området.',
  'drive over': 'Det ser ut til at uværet fjerner seg fra oss nå.',
  'falle inn': 'Jeg kom virkelig ikke på at du var redd.',
  'falle for': 'De klarte ikke å stå imot fristelsen i den store butikken.',
  'falle fra': 'Er det sant at hun er en frafallen?'
};

// ── CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const batchIdx = args.indexOf('--batch');
const batchSize = batchIdx !== -1 ? parseInt(args[batchIdx + 1], 10) : 5;

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
  console.error('❌  ANTHROPIC_API_KEY is not set (add to .env or pass on the command line).');
  process.exit(1);
}

// ── Load input + already-done batches ─────────────────────────────────────

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  return raw ? JSON.parse(raw) : [];
}

const inputEntries = readJsonArray(INPUT_PATH);
if (inputEntries.length === 0) {
  console.error(`❌  No entries found at ${INPUT_PATH}`);
  process.exit(1);
}

fs.mkdirSync(BATCH_DIR, { recursive: true });
const existingBatchFiles = fs
  .readdirSync(BATCH_DIR)
  .filter((f) => f.startsWith(BATCH_PREFIX) && f.endsWith('.json'))
  .sort();

const alreadyDoneLemmas = new Set();
for (const f of existingBatchFiles) {
  for (const e of readJsonArray(path.join(BATCH_DIR, f))) alreadyDoneLemmas.add(e.lemma);
}

const todo = inputEntries.filter((e) => !alreadyDoneLemmas.has(e.lemma));

console.log('🧩  enrich-vocab-c-new-batch.mjs');
console.log(`    Input:            ${INPUT_PATH}  (${inputEntries.length} entries)`);
console.log(
  `    Already enriched: ${alreadyDoneLemmas.size}  (${existingBatchFiles.length} batch file(s) found)`
);
console.log(`    Remaining:        ${todo.length}`);
console.log(`    Mode:             ${dryRun ? 'DRY RUN' : 'LIVE'}`);

if (todo.length === 0) {
  console.log('✅  Nothing left to enrich.');
  process.exit(0);
}

if (dryRun) {
  for (const e of todo) console.log(`   • ${e.lemma}  [${e.category}]`);
  process.exit(0);
}

// ── Prompt (words-only, category fixed, definition supplied) ─────────────

function buildPrompt(batch) {
  const entries = JSON.stringify(
    batch.map((e) => ({
      lemma: e.lemma,
      norsk: e.norsk,
      definition: DEFINITIONS[e.lemma] ?? '',
      part: e.part,
      level: e.level
    })),
    null,
    2
  );

  return `You are a Norwegian language expert enriching vocabulary entries for a language-learning app.

For each entry below, generate:
1. "english" — English translation, matching the supplied Norwegian "definition" and "norsk" form.
2. "ukrainian" — Ukrainian translation.
3. "spanish" — Spanish translation.
4. "german" — German translation.
5. "example" — ONE natural Norwegian sentence (Bokmål) using the word/expression in an appropriate grammatical form, consistent in meaning with "definition". This is a new sentence you write, not a translation.
6. "example_english" — English translation of the example sentence.
7. "example_ukrainian" — Ukrainian translation of the example sentence.
8. "example_spanish" — Spanish translation of the example sentence.
9. "example_german" — German translation of the example sentence.

Do NOT generate a "category" — category is already fixed for every entry and must not be changed.

Rules:
- Translate naturally, not word-for-word.
- The example sentence should be concise, grammatically correct, and clearly demonstrate the meaning given in "definition".
- Do NOT use typographic quotes (" " „ « ») — use plain ASCII quotes if needed.
- CRITICAL — special characters: never drop or substitute required diacritics/accents. Norwegian needs æ/ø/å, German needs ä/ö/ü/ß, Spanish needs á/é/í/ó/ú/ñ. Double-check every word in every language before responding.
- CRITICAL — known recurring error: do not confuse "gå" (infinitive/present, "to go/walk") with "ga" (past tense of "å gi", "to give"). Proofread every Norwegian example for this specific mix-up.
- Norwegian adjective/participle agreement: neuter (et-words, and impersonal "det er ...") takes the -t form, common gender (en-words) takes the bare form. Check agreement on every adjective you use.
- Spanish questions and exclamations must open AND close with the matching mark — "¿...?" and "¡...!".
- Match each result to its entry using the "lemma" field as the key.
- Respond ONLY with a valid JSON array (no markdown, no code fences, no commentary). Each element must have: "lemma", "english", "ukrainian", "spanish", "german", "example", "example_english", "example_ukrainian", "example_spanish", "example_german".

Entries:
${entries}`;
}

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
  if (!response.ok) throw new Error(`API error ${response.status}: ${await response.text()}`);
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

const REQUIRED_FIELDS = [
  'english',
  'ukrainian',
  'spanish',
  'german',
  'example',
  'example_english',
  'example_ukrainian',
  'example_spanish',
  'example_german'
];
function missingFields(item) {
  return REQUIRED_FIELDS.filter(
    (f) => item[f] == null || (typeof item[f] === 'string' && item[f].trim() === '')
  );
}

function correctGeneratedItem(extracted, item) {
  const fixedNotes = [];
  const ambiguousNotes = [];

  const no = checkLanguage({
    headword: extracted.norsk || extracted.lemma,
    fields: [{ name: 'example', value: item.example }],
    specialChars: /[æøåÆØÅ]/,
    degrade: degradeNO,
    bareWord: bareWordNO,
    wordMap: NO_COMMON_WORD_MAP,
    ambiguousWords: NO_AMBIGUOUS_WORDS,
    exampleField: 'example',
    exampleValue: item.example
  });
  if (no.issues.length > 0) {
    item.example = applyFixes(item.example, no.headwordFixes, NO_COMMON_WORD_MAP);
    fixedNotes.push(...no.issues.map((i) => i.detail));
  }
  ambiguousNotes.push(...no.ambiguous.map((a) => a.detail));

  const de = checkLanguage({
    headword: item.german,
    fields: [
      { name: 'german', value: item.german },
      { name: 'example_german', value: item.example_german }
    ],
    specialChars: /[üöäßÜÖÄ]/,
    degrade: degradeDE,
    bareWord: bareWordIntl,
    wordMap: DE_COMMON_WORD_MAP,
    ambiguousWords: DE_AMBIGUOUS_WORDS,
    exampleField: 'example_german',
    exampleValue: item.example_german
  });
  if (de.issues.length > 0) {
    item.german = applyFixes(item.german, de.headwordFixes, DE_COMMON_WORD_MAP);
    item.example_german = applyFixes(item.example_german, de.headwordFixes, DE_COMMON_WORD_MAP);
    fixedNotes.push(...de.issues.map((i) => i.detail));
  }
  ambiguousNotes.push(...de.ambiguous.map((a) => a.detail));

  const es = checkLanguage({
    headword: item.spanish,
    fields: [
      { name: 'spanish', value: item.spanish },
      { name: 'example_spanish', value: item.example_spanish }
    ],
    specialChars: /[áéíóúñÁÉÍÓÚÑ¿¡]/,
    degrade: degradeES,
    bareWord: bareWordIntl,
    wordMap: ES_COMMON_WORD_MAP,
    ambiguousWords: ES_AMBIGUOUS_WORDS,
    exampleField: 'example_spanish',
    exampleValue: item.example_spanish
  });
  if (es.issues.length > 0) {
    item.spanish = applyFixes(item.spanish, es.headwordFixes, ES_COMMON_WORD_MAP);
    item.example_spanish = applyFixes(item.example_spanish, es.headwordFixes, ES_COMMON_WORD_MAP);
    fixedNotes.push(...es.issues.map((i) => i.detail));
  }
  ambiguousNotes.push(...es.ambiguous.map((a) => a.detail));

  const punctIssues = findSpanishPunctuationIssues(item.example_spanish);
  if (punctIssues.length > 0) {
    item.example_spanish = fixSpanishPunctuation(item.example_spanish);
    fixedNotes.push(...punctIssues.map((i) => i.detail));
  }

  return { item, fixedNotes, ambiguousNotes };
}

function mergeEntry(extracted, generated) {
  return {
    id: extracted.id,
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
    definition: DEFINITIONS[extracted.lemma] ?? '',
    level: extracted.level,
    category: extracted.category, // never touched by the model
    part: extracted.part
  };
}

async function withRetry(fn, label) {
  const MAX_RETRIES = 5;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const delay = 2000 * attempt;
      console.warn(
        `  ⚠️  ${label} attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms…`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  const batches = [];
  for (let i = 0; i < todo.length; i += batchSize) batches.push(todo.slice(i, i + batchSize));

  let nextBatchNum = existingBatchFiles.length + 1;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    process.stdout.write(`Batch ${i + 1}/${batches.length} (${batch.length} entries)… `);

    const generated = await withRetry(() => callClaude(buildPrompt(batch)), `batch ${i + 1}`);
    const byLemma = new Map(batch.map((e) => [e.lemma, e]));
    const merged = [];

    for (const item of generated) {
      if (!item.lemma) continue;
      const missing = missingFields(item);
      if (missing.length > 0) {
        console.warn(
          `\n  ⚠️  Incomplete result for lemma="${item.lemma}" — missing: ${missing.join(', ')}`
        );
        continue;
      }
      const extracted = byLemma.get(item.lemma);
      if (!extracted) continue;
      const { item: corrected, fixedNotes, ambiguousNotes } = correctGeneratedItem(extracted, item);
      if (fixedNotes.length > 0) {
        console.warn(`\n  🔧  Auto-corrected lemma="${item.lemma}": ${fixedNotes.join('; ')}`);
      }
      if (ambiguousNotes.length > 0) {
        console.warn(
          `\n  🟡  lemma="${item.lemma}" needs manual review: ${ambiguousNotes.join('; ')}`
        );
      }
      merged.push(mergeEntry(extracted, corrected));
    }

    const batchFilename = `${BATCH_PREFIX}${String(nextBatchNum).padStart(2, '0')}.json`;
    const batchPath = path.join(BATCH_DIR, batchFilename);
    fs.writeFileSync(batchPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
    console.log(`✓ wrote ${merged.length}/${batch.length} → ${batchFilename}`);
    nextBatchNum++;

    if (i < batches.length - 1) await new Promise((r) => setTimeout(r, 1200));
  }

  console.log('\n✅  Done. Re-run this script anytime to pick up any remaining/failed entries.');
  console.log('    Next: combine all vocab-c-enriched-batch-*.json files into one,');
  console.log('    same as uttrykk-c-idiom-batch-enriched.json, then Phase 5 verification.');
}

main().catch((err) => {
  console.error('\n❌  Fatal error:', err.message);
  process.exit(1);
});
