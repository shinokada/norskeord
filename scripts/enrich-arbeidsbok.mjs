#!/usr/bin/env node
/**
 * enrich-arbeidsbok.mjs
 *
 * Phase 4 of ai-docs/implementation/c-vocab-uttrykk-i-samme-baat-arbeidsbok.md.
 *
 * Reads scripts/outputs/arbeidsbok-resolved.json (norsk, note, level,
 * reference, definition, verb_type, part, lemma — already correctly
 * formatted from Phases 2/3) and uses the Claude API to add:
 *   - category (from the 37 C-level slugs — vocab AND uttrykk both get a
 *     real category; C has no generic "uttrykk" placeholder)
 *   - english, ukrainian, spanish, german
 *   - example (Norwegian) + example_english/ukrainian/spanish/german
 *
 * Entries with part === 'phrase' go to uttrykk-c-new.json; everything else
 * goes to vocab-c-new.json.
 *
 * Output (appended, not overwritten — flushed to disk after EVERY batch,
 * not just at the end, so a Ctrl+C or crash mid-run only costs the
 * in-flight batch):
 *   draft/c/i-samme-baat-arbeidsbok/vocab-c-new.json
 *   draft/c/i-samme-baat-arbeidsbok/uttrykk-c-new.json
 *
 * Entries whose `lemma` already exists in the output file are skipped by
 * default (resumable) — so you can just re-run the same command until it
 * says "All batches complete."
 *
 * Usage:
 *   node scripts/enrich-arbeidsbok.mjs                # run everything
 *   node scripts/enrich-arbeidsbok.mjs --max-batches 5 # run 5 batches then stop
 *   node scripts/enrich-arbeidsbok.mjs --dry-run
 *   node scripts/enrich-arbeidsbok.mjs --force
 *
 * Needs ANTHROPIC_API_KEY in your .env (already present in this project).
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

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;
const INTER_BATCH_DELAY_MS = 1200;

const C_CATEGORIES = [
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
  'intensifiers-degree',
  'gastronomy',
  'cultural-heritage'
];

// ── CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};

const dryRun = hasFlag('--dry-run');
const force = hasFlag('--force');
const batchSize = parseInt(getArg('--batch') ?? '15', 10);
const maxBatches = getArg('--max-batches') ? parseInt(getArg('--max-batches'), 10) : Infinity;

// ── API key ────────────────────────────────────────────────────────────

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
  console.error('    ANTHROPIC_API_KEY=your-key node scripts/enrich-arbeidsbok.mjs');
  process.exit(1);
}

// ── Paths ───────────────────────────────────────────────────────────────

const paths = {
  input: path.join(PROJECT_ROOT, 'scripts/outputs/arbeidsbok-resolved.json'),
  outVocab: path.join(PROJECT_ROOT, 'draft/c/i-samme-baat-arbeidsbok/vocab-c-new.json'),
  outUttrykk: path.join(PROJECT_ROOT, 'draft/c/i-samme-baat-arbeidsbok/uttrykk-c-new.json'),
  productionVocab: path.join(PROJECT_ROOT, 'src/lib/data/vocab-c.json'),
  productionUttrykk: path.join(PROJECT_ROOT, 'src/lib/data/uttrykk-c.json')
};

// ── Helpers ─────────────────────────────────────────────────────────────

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw);
}

function categoryDistribution() {
  const counts = {};
  for (const cat of C_CATEGORIES) counts[cat] = 0;
  for (const src of [paths.productionVocab, paths.productionUttrykk]) {
    for (const e of readJsonArray(src)) {
      if (e.category && counts[e.category] !== undefined) counts[e.category]++;
    }
  }
  return counts;
}

function alreadyEnriched(entries, existingOutput, forceAll) {
  if (forceAll) return entries;
  const existingLemmas = new Set(existingOutput.map((e) => e.lemma));
  return entries.filter((e) => !existingLemmas.has(e.lemma));
}

// ── Prompt builder ──────────────────────────────────────────────────────

function buildPrompt(batch, catCounts) {
  const distributionText = C_CATEGORIES.map((c) => `  ${c}: ${catCounts[c]}`).join('\n');

  const entries = JSON.stringify(
    batch.map((e) => ({
      lemma: e.lemma,
      norsk: e.norsk,
      definition: e.definition,
      note: e.note || undefined,
      part: e.part,
      level: 'C'
    })),
    null,
    2
  );

  return `You are a Norwegian language expert enriching C1/C2-level vocabulary and expression entries for a language-learning app, sourced from the textbook "I samme båt!" arbeidsbok. These entries already have a correctly-formatted "norsk", "lemma", "definition" (monolingual Norwegian dictionary gloss), and optionally "note" (usage note) field from earlier processing steps.

For each entry below, generate:
1. "english" — English translation, matching the supplied Norwegian "definition" and "norsk" form.
2. "ukrainian" — Ukrainian translation.
3. "spanish" — Spanish translation.
4. "german" — German translation.
5. "category" — exactly one category from this list, using the name exactly as written (this applies to BOTH ordinary vocabulary AND phrase/idiom entries — C-level has no generic "uttrykk" category, every entry gets a real topical category):
${C_CATEGORIES.map((c) => `   - ${c}`).join('\n')}
   Current category distribution across the existing dataset (favor under-represented categories rather than repeating the same few, but only when the entry's actual meaning fits — accuracy always wins over balancing):
${distributionText}
   Weigh "definition" and "note" (if present) together when choosing the category.
6. "example" — write ONE natural Norwegian sentence using the word/expression in an appropriate grammatical form, consistent with the supplied "definition". This must be written in Norwegian (Bokmål) at a C1/C2 level of sophistication — a new sentence you write, not a translation of anything.
7. "example_english" — English translation of the example sentence.
8. "example_ukrainian" — Ukrainian translation of the example sentence.
9. "example_spanish" — Spanish translation of the example sentence.
10. "example_german" — German translation of the example sentence.

Rules:
- Translate naturally, not word-for-word.
- The example sentence should be concise, grammatically correct, natural C1/C2-level Norwegian, and clearly demonstrate the meaning given in "definition".
- Do NOT use typographic quotes (" " „ « ») in your output — use plain ASCII quotes if needed.
- CRITICAL — special characters: never drop or substitute required diacritics/accents. Norwegian needs æ/ø/å (e.g. "nærheten", "bålet", "nøyaktig", "videregående", "ønsker", "år"), German needs ä/ö/ü/ß (e.g. "für", "möchte", "Erklärung", "während", "Übung"), and Spanish needs á/é/í/ó/ú/ñ (e.g. "años", "mañana", "también"). Double-check every word in every language before responding.
- CRITICAL — known recurring error: do not confuse "gå" (infinitive/present, "to go/walk") with "ga" (past tense of "å gi", "to give"). If your Norwegian example needs the past tense of "gi", the correct word is "ga", never "gå". Proofread every Norwegian example for this specific mix-up.
- Norwegian adjective/participle agreement: match the noun's gender exactly — neuter (et-words, and impersonal "det er ...") takes the -t form (e.g. "Det er usunt"), while common gender (en-words) takes the bare form (e.g. "Maten er god", not "godt"). Check agreement on every adjective you use.
- Spanish questions and exclamations must open AND close with the matching mark — "¿...?" and "¡...!" — never just the closing mark alone.
- Match each result to its entry using the "lemma" field as the key.
- Respond ONLY with a valid JSON array (no markdown, no code fences, no commentary). Each element must have: "lemma", "english", "ukrainian", "spanish", "german", "category", "example", "example_english", "example_ukrainian", "example_spanish", "example_german".

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
      max_tokens: 8192,
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

const REQUIRED_GENERATED_FIELDS = [
  'english',
  'ukrainian',
  'spanish',
  'german',
  'category',
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

function correctGeneratedItem(extracted, item) {
  const fixedNotes = [];
  const ambiguousNotes = [];

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

// ── Merge helper ───────────────────────────────────────────────────────

function mergeEntry(extracted, generated) {
  const entry = {
    id: '',
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
    definition: extracted.definition ?? '',
    level: 'C',
    category: generated.category ?? '',
    part: extracted.part
  };
  if (extracted.note) entry.note = extracted.note;
  if (extracted.verb_type) entry.verb_type = extracted.verb_type;
  return entry;
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log('🧩  enrich-arbeidsbok.mjs — Phase 4');
  console.log(`    Mode:        ${dryRun ? 'DRY RUN' : 'LIVE'}${force ? ' + --force' : ''}`);
  console.log(`    Batch size:  ${batchSize}`);
  console.log(`    Max batches: ${maxBatches === Infinity ? 'unlimited' : maxBatches}`);

  const allEntries = readJsonArray(paths.input);
  console.log(`\n📄  Input: ${allEntries.length} entries (${paths.input})`);

  const existingVocab = readJsonArray(paths.outVocab);
  const existingUttrykk = readJsonArray(paths.outUttrykk);

  const toEnrich = alreadyEnriched(allEntries, [...existingVocab, ...existingUttrykk], force);
  console.log(`    Already enriched (skipped): ${allEntries.length - toEnrich.length}`);
  console.log(`    To enrich: ${toEnrich.length}`);

  if (toEnrich.length === 0) {
    console.log('    ✅  Nothing new. (Use --force to re-enrich everything.)');
    return;
  }

  if (dryRun) {
    console.log(`    🔍  DRY RUN — would enrich ${toEnrich.length} entries.`);
    return;
  }

  const catCounts = categoryDistribution();

  const batches = [];
  for (let i = 0; i < toEnrich.length; i += batchSize) {
    batches.push(toEnrich.slice(i, i + batchSize));
  }
  const batchesThisRun = batches.slice(0, maxBatches);

  console.log(
    `    Running ${batchesThisRun.length} of ${batches.length} remaining batch(es) this call.\n`
  );

  let newVocab = [];
  let newUttrykk = [];

  function flush() {
    const combinedVocab = [...existingVocab, ...newVocab];
    const combinedUttrykk = [...existingUttrykk, ...newUttrykk];
    fs.mkdirSync(path.dirname(paths.outVocab), { recursive: true });
    fs.writeFileSync(paths.outVocab, JSON.stringify(combinedVocab, null, 2) + '\n', 'utf8');
    fs.writeFileSync(paths.outUttrykk, JSON.stringify(combinedUttrykk, null, 2) + '\n', 'utf8');
  }

  for (let i = 0; i < batchesThisRun.length; i++) {
    const batch = batchesThisRun[i];
    process.stdout.write(`    Batch ${i + 1}/${batchesThisRun.length} (${batch.length} entries)… `);

    const prompt = buildPrompt(batch, catCounts);
    const generated = await withRetry(() => callClaude(prompt), `batch ${i + 1}`);

    const batchByLemma = new Map(batch.map((e) => [e.lemma, e]));
    let hits = 0;
    let autoFixed = 0;

    for (const item of generated) {
      if (!item.lemma) {
        console.warn(`\n    ⚠️  Result missing "lemma" — skipping`);
        continue;
      }
      const missingFields = missingGeneratedFields(item);
      if (missingFields.length > 0) {
        console.warn(
          `\n    ⚠️  Incomplete result for lemma="${item.lemma}" — missing: ${missingFields.join(', ')}`
        );
        continue;
      }
      if (item.category && !C_CATEGORIES.includes(item.category)) {
        console.warn(`\n    ⚠️  Invalid category "${item.category}" for lemma="${item.lemma}" — skipping`);
        continue;
      }

      const extractedEntry = batchByLemma.get(item.lemma);
      if (!extractedEntry) {
        console.warn(`\n    ⚠️  Result lemma="${item.lemma}" doesn't match any entry in this batch — skipping`);
        continue;
      }

      const {
        item: correctedItem,
        fixedNotes,
        ambiguousNotes
      } = correctGeneratedItem(extractedEntry, item);
      if (fixedNotes.length > 0) {
        autoFixed++;
        console.warn(`\n    🔧  Auto-corrected lemma="${item.lemma}":`);
        for (const note of fixedNotes) console.warn(`       - ${note}`);
      }
      if (ambiguousNotes.length > 0) {
        console.warn(`\n    🟡  lemma="${item.lemma}" needs manual review (not auto-fixed):`);
        for (const note of ambiguousNotes) console.warn(`       - ${note}`);
      }

      const merged = mergeEntry(extractedEntry, correctedItem);
      if (extractedEntry.part === 'phrase') {
        newUttrykk.push(merged);
      } else {
        newVocab.push(merged);
      }
      hits++;

      if (catCounts[correctedItem.category] !== undefined) {
        catCounts[correctedItem.category]++;
      }
    }

    console.log(
      `✓ (${hits}/${batch.length} enriched${autoFixed > 0 ? `, ${autoFixed} auto-corrected` : ''})`
    );

    flush();

    if (i < batchesThisRun.length - 1) {
      await new Promise((r) => setTimeout(r, INTER_BATCH_DELAY_MS));
    }
  }

  console.log(`\n✅  Appended ${newVocab.length} vocab + ${newUttrykk.length} uttrykk entries.`);
  console.log(`    Vocab total now: ${existingVocab.length + newVocab.length} → ${paths.outVocab}`);
  console.log(`    Uttrykk total now: ${existingUttrykk.length + newUttrykk.length} → ${paths.outUttrykk}`);

  const remaining = batches.length - batchesThisRun.length;
  if (remaining > 0) {
    console.log(`\n➡️   ${remaining} batch(es) remaining — run again to continue.`);
  } else {
    console.log('\n🎉  All batches complete.');
  }
}

main().catch((err) => {
  console.error('\n❌  Fatal error:', err.message);
  process.exit(1);
});
