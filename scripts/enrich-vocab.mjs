#!/usr/bin/env node
/**
 * enrich-vocab.mjs
 *
 * Method 2, Step 2 (see ai-docs/instructions/image-converter.md and
 * ai-docs/instructions/work-flow.md).
 *
 * Reads Step 1 extraction output (id, norsk, lemma, level, part, and
 * category="uttrykk" for expressions — plus definition on WORDS ONLY, and
 * only for b1/b2/c, per json-structure.md) and uses the Claude API to add:
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

// ── Config ──────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src/lib/data');
const DRAFT_ROOT = path.join(PROJECT_ROOT, 'draft');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;
const INTER_BATCH_DELAY_MS = 1200;

// Mirrors CATEGORIES_BY_LEVEL in src/lib/config.ts (word categories only —
// "uttrykk" / "uttrykk-preview" are excluded since expressions always get
// category "uttrykk" directly, never chosen from this list).
const CATEGORIES_BY_LEVEL = {
  a1: [
    'greetings', 'numbers', 'colors', 'family', 'body', 'food', 'animals',
    'home', 'days-months', 'classroom', 'adjectives', 'verbs',
    'pronouns-and-questions', 'feelings', 'weather', 'transportation',
    'household-items', 'places', 'clothes', 'actions'
  ],
  a2: [
    'shopping', 'transport', 'clothing', 'hobbies', 'directions',
    'occupations', 'sports', 'health', 'weather', 'time',
    'descriptive-adjectives', 'cooking', 'nature', 'house-chores',
    'communication', 'body', 'social-life', 'technology', 'environment',
    'money'
  ],
  b1: [
    'travel', 'environment', 'media', 'culture', 'technology',
    'relationships', 'education', 'work', 'city-life', 'traditions',
    'expressing-opinions', 'cooking', 'accommodation', 'health', 'finance',
    'personal-growth', 'reasoning', 'society', 'communication-skills',
    'urban-life', 'mental-wellbeing', 'fitness', 'arts-culture', 'economics',
    'sustainability', 'science-nature', 'journalism', 'workplace', 'family',
    'politics', 'language-learning', 'healthcare'
  ],
  b2: [
    'politics', 'economics', 'social-issues', 'arts', 'science', 'emotions',
    'history', 'law', 'literature', 'advanced-adjectives', 'philosophy',
    'medicine', 'psychology', 'business', 'religion', 'environment',
    'technology', 'media', 'education', 'language', 'argumentation',
    'abstract-nouns', 'advanced-verbs', 'geography', 'culture',
    'global-issues', 'academic-language', 'discourse-markers', 'work-career',
    'relationships', 'communication'
  ],
  c: [
    'philosophy', 'academic', 'formal-writing', 'rhetoric',
    'complex-emotions', 'professional', 'abstract-concepts',
    'politics-democracy', 'linguistics', 'media-journalism',
    'architecture-design', 'diplomacy-international', 'finance-economics',
    'medicine-healthcare', 'psychology-advanced', 'literary', 'archaic',
    'proverbs', 'highly-formal', 'technical', 'advanced-law-justice',
    'neuroscience-cognition', 'climate-environment-policy',
    'sociology-anthropology', 'advanced-business-strategy',
    'existential-abstract', 'nature-landscape', 'sensory-sound',
    'physical-appearance', 'everyday-objects', 'character-temperament',
    'embodied-emotion', 'manner-of-motion', 'interpersonal-conflict',
    'intensifiers-degree'
  ]
};

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

if (!CATEGORIES_BY_LEVEL[level]) {
  console.error(`❌  Unknown --level "${level}". Valid levels: ${Object.keys(CATEGORIES_BY_LEVEL).join(', ')}`);
  process.exit(1);
}

// Word categories for this level (expressions always use "uttrykk" directly).
const CATEGORIES = CATEGORIES_BY_LEVEL[level];

// `definition` (a monolingual Bokmål gloss) only exists in the production
// vocab-{level}.json data, and only for B1+ — see json-structure.md. It
// comes from Method 1's dictionary-style source images (image-converter.md),
// used for B1/B2/C. It is NEVER present on expressions/uttrykk at any level
// (uttrykk-{level}.json never carries this field), and Method 2's textbook-
// glossary images (image-converter-2.md, used for A1/A2) never produce it
// for words either. So it must only be requested/written for WORDS at
// b1/b2/c — never for expressions, never for a1/a2.
const LEVELS_WITH_DEFINITION = new Set(['b1', 'b2', 'c']);
const usesDefinition = LEVELS_WITH_DEFINITION.has(level);

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
      ...(usesDefinition ? { definition: e.definition } : {}),
      part: e.part,
      level: e.level
    })),
    null,
    2
  );

  const englishRule = usesDefinition
    ? '1. "english" — English translation, matching the supplied Norwegian "definition" and "norsk" form.'
    : '1. "english" — English translation of the "norsk" form (no "definition" is supplied at this level — translate from "norsk" alone).';

  return `You are a Norwegian language expert enriching vocabulary entries for a language-learning app (Method 2, Step 2 — see ai-docs/instructions/image-converter.md and image-converter-2.md).

For each entry below, generate:
${englishRule}
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
- CRITICAL — special characters: never drop or substitute required diacritics/accents. Norwegian needs æ/ø/å (e.g. "nærheten", "bålet", "Fårikål", "nøyaktig", "videregående", "ønsker", "år", "Påsken"), German needs ä/ö/ü/ß (e.g. "für", "möchte", "Erklärung", "während", "Übung"), and Spanish needs á/é/í/ó/ú/ñ (e.g. "años", "mañana", "también"). Double-check every word in every language before responding.
- CRITICAL — known recurring error: do not confuse "gå" (infinitive/present, "to go/walk") with "ga" (past tense of "å gi", "to give"). If your Norwegian example needs the past tense of "gi" (e.g. "the teacher gave...", "the doctor gave..."), the correct word is "ga", never "gå". Proofread every Norwegian example for this specific mix-up.
- Norwegian adjective/participle agreement: match the noun's gender exactly — neuter (et-words, and impersonal "det er ...") takes the -t form (e.g. "Det er usunt", "Godt renhold", "Det er varmt"), while common gender (en-words) takes the bare form (e.g. "Maten er god", not "godt"). Check agreement on every adjective you use.
- Spanish questions and exclamations must open AND close with the matching mark — "¿...?" and "¡...!" — never just the closing mark alone.
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
      part: e.part,
      level: e.level
    })),
    null,
    2
  );

  return `You are a Norwegian language expert enriching expression entries for a language-learning app (Method 2, Step 2 — see ai-docs/instructions/image-converter.md and image-converter-2.md).

For each entry below, generate:
1. "english" — English translation of the "norsk" form. Expressions never carry a "definition" field — translate from "norsk" alone.
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
- CRITICAL — special characters: never drop or substitute required diacritics/accents. Norwegian needs æ/ø/å (e.g. "nærheten", "bålet", "Fårikål", "nøyaktig", "videregående", "ønsker", "år", "Påsken"), German needs ä/ö/ü/ß (e.g. "für", "möchte", "Erklärung", "während", "Übung"), and Spanish needs á/é/í/ó/ú/ñ (e.g. "años", "mañana", "también"). Double-check every word in every language before responding.
- CRITICAL — known recurring error: do not confuse "gå" (infinitive/present, "to go/walk") with "ga" (past tense of "å gi", "to give"). If your Norwegian example needs the past tense of "gi" (e.g. "the teacher gave...", "the doctor gave..."), the correct word is "ga", never "gå". Proofread every Norwegian example for this specific mix-up.
- Norwegian adjective/participle agreement: match the noun's gender exactly — neuter (et-words, and impersonal "det er ...") takes the -t form (e.g. "Det er usunt", "Godt renhold", "Det er varmt"), while common gender (en-words) takes the bare form (e.g. "Maten er god", not "godt"). Check agreement on every adjective you use.
- Spanish questions and exclamations must open AND close with the matching mark — "¿...?" and "¡...!" — never just the closing mark alone.
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

// Generated-field completeness check — a batch item can come back with
// lemma/english/example present (enough to look like a "hit") while silently
// missing one of the translation or example_* fields for a given language.
// Treating that as a success would merge empty strings straight into
// production data (see check-vocab.mjs "missing translation" warnings), so
// every one of these fields must be a non-empty string before we accept it.
const REQUIRED_GENERATED_FIELDS = [
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

function missingGeneratedFields(item) {
  return REQUIRED_GENERATED_FIELDS.filter(
    (field) => item[field] == null || (typeof item[field] === 'string' && item[field].trim() === '')
  );
}

// Deterministic post-generation correction — catches the mechanical class
// of bugs found auditing a2 output (missing NO/DE/ES diacritics, mangled
// Spanish ¿/¡) and fixes them in place before the entry is ever written to
// the draft file, using the exact same word lists/logic as
// find-diacritic-issues.mjs and find-diacritic-issues-de-es.mjs. This is a
// safety net UNDER the prompt rules above, not a replacement for them —
// non-mechanical issues (verb-form mix-ups, grammatical agreement,
// one-off typos) aren't dictionary-detectable and rely on the model
// getting it right the first time.
function correctGeneratedItem(extracted, item) {
  const fixedNotes = [];
  const ambiguousNotes = [];

  // Norwegian: check the entry's own norsk/lemma against the generated
  // example, plus the closed-class common-word list.
  const noHeadword = extracted.norsk || extracted.lemma;
  const no = checkLanguage({
    headword: noHeadword,
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

  // German: check item.german against item.example_german, plus common words.
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

  // Spanish: check item.spanish against item.example_spanish, common words,
  // and the mangled-¿/¡ punctuation pattern.
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
    // `definition` only exists for WORDS at B1/B2/C (see json-structure.md
    // and the usesDefinition note above) — omitted entirely for expressions
    // at any level, and for A1/A2 words, even if the extracted entry
    // happened to carry a stray value.
    ...(usesDefinition && !isExpression ? { definition: extracted.definition } : {}),
    level: extracted.level,
    category: isExpression ? 'uttrykk' : (generated.category ?? ''),
    part: extracted.part
  };
}

// ── Process one set (words or expressions) ───────────────────────────────

async function processSet({ label, extractedPath, outPath, isExpression, buildPrompt, catCounts }) {
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

    const batchByLemma = new Map(batch.map((e) => [e.lemma, e]));
    let hits = 0;
    let autoFixed = 0;
    for (const item of generated) {
      if (!item.lemma) {
        console.warn(`\n    ⚠️  Result missing "lemma" — cannot match to an entry, skipping`);
        continue;
      }
      const missingFields = missingGeneratedFields(item);
      if (missingFields.length > 0) {
        console.warn(
          `\n    ⚠️  Incomplete result for lemma="${item.lemma}" — missing: ${missingFields.join(', ')}`
        );
        continue;
      }

      const extractedEntry = batchByLemma.get(item.lemma);
      const { item: correctedItem, fixedNotes, ambiguousNotes } = correctGeneratedItem(
        extractedEntry ?? {},
        item
      );
      if (fixedNotes.length > 0) {
        autoFixed++;
        console.warn(`\n    🔧  Auto-corrected lemma="${item.lemma}":`);
        for (const note of fixedNotes) console.warn(`       - ${note}`);
      }
      if (ambiguousNotes.length > 0) {
        console.warn(`\n    🟡  lemma="${item.lemma}" needs manual review (not auto-fixed):`);
        for (const note of ambiguousNotes) console.warn(`       - ${note}`);
      }

      results.set(item.lemma, correctedItem);
      hits++;
    }
    console.log(`✓ (${hits}/${batch.length} enriched${autoFixed > 0 ? `, ${autoFixed} auto-corrected` : ''})`);

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
