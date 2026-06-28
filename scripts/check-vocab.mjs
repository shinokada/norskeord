#!/usr/bin/env node
/**
 * check-vocab.mjs
 *
 * Validates all vocab-{level}.json files in src/lib/data against the
 * canonical rules for VocabEntry IDs and norsk/lemma field formatting.
 *
 * Rules checked:
 *   1. ID format    — must be v-{level}-{category}-{NNN} (3-digit zero-padded)
 *   2. ID uniqueness — no duplicates within or across files
 *   3. level field  — must match file's CEFR level (case-insensitive)
 *   4. category     — must be in CATEGORIES_BY_LEVEL for that level
 *   5. part         — must be a known PartOfSpeech value
 *   6. norsk field  — formatting rules per part of speech:
 *        noun   → "word (en|et|ei)"
 *        verb   → starts with "å "
 *        other  → no "å " prefix, no gender parenthetical
 *   7. lemma field  — must be plain dictionary form (no å prefix, no gender):
 *        verb   → bare infinitive, e.g. "få"  (NOT "å få")
 *        noun   → bare word,       e.g. "hus" (NOT "hus (et)")
 *        other  → bare word,       e.g. "glad"
 *   8. Required fields present (norsk, english, example, example_english, level, category, part)
 *   9. Language consistency — for each translation language present (ukrainian, spanish,
 *      german, romanian, …), the matching example_{lang} field must also be present and
 *      non-empty, and vice-versa.
 *  10. Translation coverage — warns if an entry is missing a language that other entries
 *      in the same file have.
 *
 * NOTE: "numeral" appears in vocab-a1.json (numbers category) but is not in
 * types.ts PartOfSpeech. It is treated as a warning, not an error, so you can
 * decide whether to add it to the type or reclassify those entries.
 *
 * Usage:
 *   node scripts/check-vocab.mjs           # check all vocab files
 *   node scripts/check-vocab.mjs a1        # check only vocab-a1.json
 *   node scripts/check-vocab.mjs a1 a2     # check multiple levels
 *   node scripts/check-vocab.mjs --strict  # exit 1 if any errors found
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../src/lib/data');

// ── Config (mirrors config.ts) ────────────────────────────────────────────────

const CATEGORIES_BY_LEVEL = {
  a1: [
    'greetings',
    'numbers',
    'colors',
    'family',
    'body',
    'food',
    'animals',
    'home',
    'days-months',
    'classroom',
    'adjectives',
    'verbs',
    'pronouns-and-questions',
    'feelings',
    'weather',
    'transportation',
    'household-items',
    'places',
    'clothes',
    'actions',
    'uttrykk',
    'uttrykk-preview'
  ],
  a2: [
    'shopping',
    'transport',
    'clothing',
    'hobbies',
    'directions',
    'occupations',
    'sports',
    'health',
    'weather',
    'time',
    'descriptive-adjectives',
    'cooking',
    'nature',
    'house-chores',
    'communication',
    'body',
    'social-life',
    'technology',
    'environment',
    'money',
    'uttrykk',
    'uttrykk-preview'
  ],
  b1: [
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
    'healthcare',
    'uttrykk',
    'uttrykk-preview'
  ],
  b2: [
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
    'communication',
    'uttrykk',
    'uttrykk-preview'
  ],
  c: [
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
    'existential-abstract'
  ]
};

// Parts declared in types.ts PartOfSpeech
const VALID_PARTS = new Set([
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'numeral',
  'preposition',
  'conjunction',
  'interjection',
  'phrase'
]);

// Parts used in data but NOT yet in types.ts — flagged as warnings
const UNOFFICIAL_PARTS = new Set([]);

const REQUIRED_FIELDS = [
  'norsk',
  'english',
  'example',
  'example_english',
  'level',
  'category',
  'part'
];

// All translation languages the app supports.
const KNOWN_LANGUAGES = [
  'ukrainian',
  'spanish',
  'german',
  'romanian',
  'french',
  'polish',
  'arabic',
  'turkish',
  'dutch',
  'italian'
];

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c'];

// ── Filters from CLI ──────────────────────────────────────────────────────────

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const STRICT = process.argv.includes('--strict');
const targetLevels = args.length > 0 ? args.map((a) => a.toLowerCase()) : LEVELS;

// ── Validators ────────────────────────────────────────────────────────────────

const ID_PATTERN = /^v-([a-z0-9]+)-(.+)-(\d{3})$/;

function checkIdFormat(id, level, category) {
  const errors = [];
  const m = id.match(ID_PATTERN);
  if (!m) {
    errors.push(`ID "${id}" does not match v-{level}-{category}-{NNN} format`);
    return errors;
  }
  if (m[1] !== level) {
    errors.push(`ID level segment "${m[1]}" does not match file level "${level}"`);
  }
  if (m[2] !== category) {
    errors.push(`ID category segment "${m[2]}" does not match entry category "${category}"`);
  }
  return errors;
}

/** Gender parenthetical: (en), (et), (ei), or combinations */
const GENDER_PATTERN = /\s*\((en|et|ei|en\/ei|en\/men)\)$/i;
/** Verb prefix */
const VERB_PREFIX = /^å\s/;

function checkNorsk(norsk, part) {
  const errors = [];
  switch (part) {
    case 'noun':
      if (!GENDER_PATTERN.test(norsk)) {
        errors.push(`noun norsk "${norsk}" should end with gender, e.g. "hus (et)"`);
      }
      break;
    case 'verb':
      if (!VERB_PREFIX.test(norsk)) {
        errors.push(`verb norsk "${norsk}" should start with "å ", e.g. "å få"`);
      }
      break;
    default:
      // adjective, adverb, phrase, numeral, etc. — no prefix or gender expected
      if (VERB_PREFIX.test(norsk)) {
        errors.push(`${part} norsk "${norsk}" should not start with "å " (only verbs use this)`);
      }
      if (GENDER_PATTERN.test(norsk) && part !== 'phrase') {
        errors.push(`${part} norsk "${norsk}" has gender parenthetical — is the part wrong?`);
      }
      break;
  }
  return errors;
}

/**
 * lemma must be plain dictionary form — no "å" prefix, no gender marker.
 * verb  → bare infinitive e.g. "få"   (NOT "å få")
 * noun  → bare word       e.g. "hus"  (NOT "hus (et)")
 * other → bare word       e.g. "glad"
 */
function checkLemma(entry) {
  const warnings = [];
  if (!entry.lemma) {
    warnings.push(`lemma field is missing`);
    return warnings;
  }
  // Verb lemma must NOT have "å "
  if (entry.part === 'verb' && VERB_PREFIX.test(entry.lemma)) {
    warnings.push(
      `verb lemma "${entry.lemma}" should be bare infinitive without "å", e.g. "${entry.lemma.replace(/^å\s+/, '')}"`
    );
  }
  // Noun lemma must NOT have gender
  if (entry.part === 'noun' && GENDER_PATTERN.test(entry.lemma)) {
    warnings.push(
      `noun lemma "${entry.lemma}" should be bare word without gender, e.g. "${entry.lemma.replace(GENDER_PATTERN, '').trim()}"`
    );
  }
  // Lemma should not be identical to norsk (which includes å/gender) — likely copy-paste error
  if (
    entry.lemma === entry.norsk &&
    (VERB_PREFIX.test(entry.norsk) || GENDER_PATTERN.test(entry.norsk))
  ) {
    warnings.push(
      `lemma "${entry.lemma}" is identical to norsk — lemma should be the bare dictionary form`
    );
  }
  return warnings;
}

// ── Main ──────────────────────────────────────────────────────────────────────

let totalErrors = 0;
let totalWarnings = 0;
const globalIds = new Map(); // id → filename

for (const level of LEVELS) {
  if (!targetLevels.includes(level)) continue;

  const filename = `vocab-${level}.json`;
  let entries;
  try {
    entries = JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf8'));
  } catch (err) {
    console.error(`❌  Could not read ${filename}: ${err.message}`);
    totalErrors++;
    continue;
  }

  const validCats = new Set(CATEGORIES_BY_LEVEL[level]);
  let fileErrors = 0;
  let fileWarnings = 0;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📄  ${filename}  (${entries.length} entries)`);
  console.log(`${'─'.repeat(60)}`);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const loc = `[${i}] id=${entry.id ?? '(missing)'}`;
    const errs = [];
    const warns = [];

    // Required fields
    for (const field of REQUIRED_FIELDS) {
      if (!entry[field]) errs.push(`missing required field "${field}"`);
    }

    // ID format
    if (entry.id) {
      errs.push(...checkIdFormat(entry.id, level, entry.category));
      // Global uniqueness
      if (globalIds.has(entry.id)) {
        errs.push(`duplicate ID — also in ${globalIds.get(entry.id)}`);
      } else {
        globalIds.set(entry.id, filename);
      }
    } else {
      errs.push('missing id field');
    }

    // level field
    if (entry.level && entry.level.toLowerCase() !== level) {
      errs.push(`level field "${entry.level}" does not match file level "${level.toUpperCase()}"`);
    }

    // category
    if (entry.category && !validCats.has(entry.category)) {
      errs.push(`category "${entry.category}" not in CATEGORIES_BY_LEVEL[${level.toUpperCase()}]`);
    }

    // part of speech
    if (entry.part) {
      if (UNOFFICIAL_PARTS.has(entry.part)) {
        warns.push(
          `part "${entry.part}" is used in data but not declared in types.ts PartOfSpeech — consider adding it or reclassifying`
        );
      } else if (!VALID_PARTS.has(entry.part)) {
        errs.push(`unknown part "${entry.part}"`);
      }
    }

    // norsk formatting (skip for unofficial parts like numeral)
    if (entry.norsk && entry.part && !UNOFFICIAL_PARTS.has(entry.part)) {
      errs.push(...checkNorsk(entry.norsk, entry.part));
    }

    // lemma
    if (entry.part && !UNOFFICIAL_PARTS.has(entry.part)) {
      warns.push(...checkLemma(entry));
    }

    // Language consistency: translation field and its example_{lang} must both be present
    for (const lang of KNOWN_LANGUAGES) {
      const hasTranslation = entry[lang] != null && entry[lang] !== '';
      const hasExample = entry[`example_${lang}`] != null && entry[`example_${lang}`] !== '';
      if (hasTranslation && !hasExample) {
        errs.push(`has "${lang}" translation but missing "example_${lang}"`);
      }
      if (!hasTranslation && hasExample) {
        warns.push(`has "example_${lang}" but missing "${lang}" translation`);
      }
    }

    if (errs.length > 0) {
      fileErrors += errs.length;
      for (const e of errs) console.log(`  ❌  ${loc}: ${e}`);
    }
    if (warns.length > 0) {
      fileWarnings += warns.length;
      for (const w of warns) console.log(`  ⚠️   ${loc}: ${w}`);
    }
  }

  // Translation coverage: warn for entries missing a language the file otherwise has
  const langsInFile = new Set();
  for (const e of entries) {
    for (const lang of KNOWN_LANGUAGES) {
      if (e[lang] != null && e[lang] !== '') langsInFile.add(lang);
    }
  }
  if (langsInFile.size > 0) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const loc = `[${i}] id=${entry.id ?? '(missing)'}`;
      for (const lang of langsInFile) {
        if (!entry[lang] || entry[lang] === '') {
          fileWarnings++;
          console.log(
            `  ⚠️   ${loc}: missing "${lang}" translation (other entries in this file have it)`
          );
        }
      }
    }
  }

  const status = fileErrors === 0 ? '✅' : '❌';
  console.log(`\n${status}  ${filename}: ${fileErrors} error(s), ${fileWarnings} warning(s)`);
  totalErrors += fileErrors;
  totalWarnings += fileWarnings;
}

console.log(`\n${'═'.repeat(60)}`);
console.log(
  `📊  Total: ${totalErrors} error(s), ${totalWarnings} warning(s) across ${targetLevels.length} file(s)`
);

if (STRICT && totalErrors > 0) {
  process.exit(1);
}
