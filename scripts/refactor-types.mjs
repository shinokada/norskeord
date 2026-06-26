#!/usr/bin/env node
/**
 * refactor-types.mjs
 *
 * Splits runtime code out of src/lib/types.ts into three new files:
 *   src/lib/config.ts         — pure constants (CATEGORIES_BY_LEVEL, LANGUAGES, etc.)
 *   src/lib/access.ts         — access-control logic (isPlusCategory, isFreeGrammarTopic, etc.)
 *   src/lib/vocab-helpers.ts  — vocab/grammar utility functions (getTranslation, topicLevels, etc.)
 *
 * Then patches all import statements across the codebase to point to the right
 * new file, and strips the moved exports from types.ts.
 *
 * Run from the project root:
 *   node scripts/refactor-types.mjs
 *
 * The script is idempotent — running it twice is safe (it checks whether new
 * files already exist before writing them).
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const LIB = path.join(SRC, 'lib');

// ── New file contents ────────────────────────────────────────────────────────

const CONFIG_TS = `// src/lib/config.ts
// Pure constants derived from the domain model.
// No runtime logic — safe to import anywhere including SSR and service workers.

import type { CEFRLevel } from '$lib/types';

export const CATEGORIES_BY_LEVEL = {
  A1: [
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
  A2: [
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
  B1: [
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
  B2: [
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
  C: [
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
} as const satisfies Record<CEFRLevel, readonly string[]>;

export const LANGUAGES = {
  english:   { name: 'English',   flag: '🇬🇧' },
  spanish:   { name: 'Spanish',   flag: '🇪🇸' },
  ukrainian: { name: 'Ukrainian', flag: '🇺🇦' }
} as const;

/**
 * Categories that require a Plus subscription.
 * Free users can see these in the picker but cannot open them.
 */
export const PLUS_CATEGORIES = new Set<string>([
  // B1 — plus-only (22)
  'b1/city-life', 'b1/traditions', 'b1/expressing-opinions', 'b1/cooking',
  'b1/accommodation', 'b1/finance', 'b1/personal-growth', 'b1/reasoning',
  'b1/communication-skills', 'b1/urban-life', 'b1/mental-wellbeing', 'b1/fitness',
  'b1/arts-culture', 'b1/economics', 'b1/sustainability', 'b1/science-nature',
  'b1/journalism', 'b1/workplace', 'b1/family', 'b1/politics',
  'b1/language-learning', 'b1/healthcare',
  // B2 — plus-only (28 vocab + full uttrykk)
  'b2/arts', 'b2/emotions', 'b2/history', 'b2/law', 'b2/literature',
  'b2/advanced-adjectives', 'b2/philosophy', 'b2/medicine', 'b2/psychology',
  'b2/business', 'b2/religion', 'b2/environment', 'b2/technology', 'b2/media',
  'b2/education', 'b2/language', 'b2/argumentation', 'b2/abstract-nouns',
  'b2/advanced-verbs', 'b2/geography', 'b2/culture', 'b2/global-issues',
  'b2/academic-language', 'b2/discourse-markers', 'b2/work-career',
  'b2/relationships', 'b2/communication', 'b2/uttrykk',
  // uttrykk — full decks are Plus-only; preview is free
  'a1/uttrykk', 'a2/uttrykk', 'b1/uttrykk',
  // C — first 5 free; rest plus-only
  'c/professional', 'c/abstract-concepts', 'c/politics-democracy', 'c/linguistics',
  'c/media-journalism', 'c/architecture-design', 'c/diplomacy-international',
  'c/finance-economics', 'c/medicine-healthcare', 'c/psychology-advanced',
  'c/technical', 'c/advanced-law-justice', 'c/neuroscience-cognition',
  'c/climate-environment-policy', 'c/sociology-anthropology',
  'c/advanced-business-strategy', 'c/existential-abstract'
]);

/**
 * Top 3 categories per level available to free users in the Quiz.
 */
export const FREE_QUIZ_CATEGORIES = new Set<string>([
  'a1/greetings', 'a1/numbers', 'a1/colors',
  'a2/shopping',  'a2/transport', 'a2/clothing',
  'b1/travel',    'b1/environment', 'b1/media',
  'b2/politics',  'b2/economics', 'b2/social-issues',
  'c/philosophy', 'c/academic', 'c/formal-writing'
]);

/**
 * Grammar topics available to free users. Everything else requires Plus.
 */
export const FREE_GRAMMAR_TOPICS = new Set<import('$lib/types').GrammarTopic>([
  'ikke-placement',
  'v2-word-order',
  'det-er-ikke',
  'modal-verb-order'
]);

/**
 * How many grammar questions are free per topic (total, across all CEFR levels).
 */
export const FREE_GRAMMAR_PER_TOPIC = 3;
`;

const ACCESS_TS = `// src/lib/access.ts
// Access-control predicates — determines what's free vs Plus-gated.
// All functions are pure and side-effect free.

import type { GrammarTopic, GrammarQuestion } from '$lib/types';
import {
  PLUS_CATEGORIES,
  FREE_QUIZ_CATEGORIES,
  FREE_GRAMMAR_TOPICS,
  FREE_GRAMMAR_PER_TOPIC
} from '$lib/config';

export function isPlusCategory(level: string, category: string): boolean {
  return PLUS_CATEGORIES.has(\`\${level.toLowerCase()}/\${category}\`);
}

export function isFreeQuizCategory(level: string, category: string): boolean {
  return FREE_QUIZ_CATEGORIES.has(\`\${level.toLowerCase()}/\${category}\`);
}

export function isFreeGrammarTopic(topic: GrammarTopic): boolean {
  return FREE_GRAMMAR_TOPICS.has(topic);
}

/**
 * Practice test number 1 is always free; all higher numbers require Plus.
 */
export function isFreeTest(test: number): boolean {
  return test === 1;
}

/**
 * Given the full grammar question list, returns the set of question ids that
 * are free for guest/free users: within each topic, the first
 * FREE_GRAMMAR_PER_TOPIC non-plusOnly questions in file order.
 */
export function freeGrammarQuestionIds(questions: GrammarQuestion[]): Set<string> {
  const seenPerTopic: Record<string, number> = {};
  const free = new Set<string>();
  for (const q of questions) {
    if (q.plusOnly) continue;
    const seen = seenPerTopic[q.topic] ?? 0;
    if (seen < FREE_GRAMMAR_PER_TOPIC) {
      free.add(q.id);
      seenPerTopic[q.topic] = seen + 1;
    }
  }
  return free;
}
`;

const VOCAB_HELPERS_TS = `// src/lib/vocab-helpers.ts
// Utility functions for VocabEntry and GrammarQuestion.
// Kept separate from types.ts so types.ts stays declaration-only.

import type { VocabEntry, Language, GrammarQuestion, CEFRLevel } from '$lib/types';

// ── Vocab ────────────────────────────────────────────────────────────────────

/**
 * Type-safe helper for dynamic field access — centralises type assertions
 * so they don't need to be scattered across components.
 */
export function getTranslation(entry: VocabEntry, language: Language): string {
  return entry[language as keyof VocabEntry] as string;
}

export function getExampleTranslation(entry: VocabEntry, language: Language): string | undefined {
  return entry[\`example_\${language}\` as keyof VocabEntry] as string | undefined;
}

// ── Grammar ──────────────────────────────────────────────────────────────────

const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C'];

/** The CEFR levels a question is tagged with — its \`levels\` array, or \`[cefr]\`. */
export function questionLevels(q: GrammarQuestion): CEFRLevel[] {
  return q.levels && q.levels.length ? q.levels : [q.cefr];
}

/**
 * The sorted, de-duplicated set of CEFR levels covered by a list of questions.
 * Used to show level badges on a topic card.
 */
export function topicLevels(questions: GrammarQuestion[]): CEFRLevel[] {
  const set = new Set<CEFRLevel>();
  for (const q of questions) for (const l of questionLevels(q)) set.add(l);
  return CEFR_ORDER.filter((l) => set.has(l));
}
`;

// ── What moves where ─────────────────────────────────────────────────────────
//
// Maps each exported name to which new module it lives in.
// Used both to rewrite imports and to strip the right blocks from types.ts.

const MOVED_TO_CONFIG = new Set([
  'CATEGORIES_BY_LEVEL',
  'LANGUAGES',
  'PLUS_CATEGORIES',
  'FREE_QUIZ_CATEGORIES',
  'FREE_GRAMMAR_TOPICS',
  'FREE_GRAMMAR_PER_TOPIC'
]);

const MOVED_TO_ACCESS = new Set([
  'isPlusCategory',
  'isFreeQuizCategory',
  'isFreeGrammarTopic',
  'isFreeTest',
  'freeGrammarQuestionIds'
]);

const MOVED_TO_VOCAB_HELPERS = new Set([
  'getTranslation',
  'getExampleTranslation',
  'questionLevels',
  'topicLevels'
]);

const ALL_MOVED = new Set([...MOVED_TO_CONFIG, ...MOVED_TO_ACCESS, ...MOVED_TO_VOCAB_HELPERS]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.svelte-kit', '.git', 'dist', 'build'].includes(entry.name)) continue;
      files.push(...walk(full));
    } else if (/\.(ts|svelte)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Given the source text of a file that imports from '$lib/types', rewrite the
 * imports so that moved names come from their new homes, and only true types
 * stay in '$lib/types'.
 *
 * Handles both:
 *   import { Foo, Bar } from '$lib/types'
 *   import type { Foo } from '$lib/types'
 */
function rewriteImports(src) {
  // Match any import statement (possibly multi-line) from '$lib/types'
  // We handle two patterns:
  //   import { ... } from '$lib/types';
  //   import type { ... } from '$lib/types';
  // Both single-line and multi-line (joined by a pre-pass).

  // Normalise multi-line imports from '$lib/types' onto a single line first
  let text = src.replace(
    /import\s+(type\s+)?\{([^}]*)\}\s+from\s+'(\$lib\/types)'([^;]*);/gs,
    (_, isType, names, specifier) => {
      const flat = names.replace(/\s+/g, ' ').trim();
      return `import ${isType || ''}{ ${flat} } from '${specifier}';`;
    }
  );

  // Now process each single-line import from '$lib/types'
  text = text.replace(
    /^(import\s+(type\s+)?\{\s*)([^}]+)(\s*\}\s*from\s*'\$lib\/types'\s*;)/gm,
    (match, prefix, isType, rawNames) => {
      const isTypeImport = Boolean(isType);
      const names = rawNames
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // Bucket each name
      const inConfig = names.filter((n) => MOVED_TO_CONFIG.has(n));
      const inAccess = names.filter((n) => MOVED_TO_ACCESS.has(n));
      const inVocabHelpers = names.filter((n) => MOVED_TO_VOCAB_HELPERS.has(n));
      const stillInTypes = names.filter((n) => !ALL_MOVED.has(n));

      const lines = [];

      if (inConfig.length) {
        lines.push(`import { ${inConfig.join(', ')} } from '$lib/config';`);
      }
      if (inAccess.length) {
        lines.push(`import { ${inAccess.join(', ')} } from '$lib/access';`);
      }
      if (inVocabHelpers.length) {
        lines.push(`import { ${inVocabHelpers.join(', ')} } from '$lib/vocab-helpers';`);
      }
      if (stillInTypes.length) {
        const keyword = isTypeImport ? 'import type' : 'import';
        lines.push(`${keyword} { ${stillInTypes.join(', ')} } from '$lib/types';`);
      }

      return lines.join('\n');
    }
  );

  return text;
}

// ── Blocks to remove from types.ts ───────────────────────────────────────────
//
// We identify the exact text blocks in types.ts to delete. Rather than a
// fragile regex on the whole file, we collect a set of "start markers" —
// unique lines that open each block — and remove from there to the block end.
//
// Block types handled:
//   • export const FOO = ...;           (single-expression const)
//   • export const FOO = new Set(...)   (multi-line Set)
//   • export const FOO = { ... }        (multi-line object)
//   • export function foo(...) { ... }  (function declaration)
//
// Approach: we remove lines between (and including) the export declaration
// line and the closing line for that block.

function stripMovedExports(src) {
  const lines = src.split('\n');
  const result = [];
  let skip = 0; // brace depth counter when inside a block to skip
  let inSkipBlock = false;
  // let skipComment = false; // whether to also strip the preceding JSDoc comment

  // Lookahead: collect JSDoc comment lines immediately before a to-skip export
  // so we can strip them too.
  let pendingCommentLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Accumulate JSDoc / single-line comments so we can drop them if the next
    // export is a moved one.
    if (
      trimmed.startsWith('/**') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('*/') ||
      trimmed.startsWith('//')
    ) {
      pendingCommentLines.push(line);
      continue;
    }

    if (inSkipBlock) {
      // Count braces to find the end of the block
      for (const ch of line) {
        if (ch === '{' || ch === '(') skip++;
        if (ch === '}' || ch === ')') skip--;
      }
      if (skip <= 0) {
        inSkipBlock = false;
        skip = 0;
      }
      // Drop this line
      pendingCommentLines = [];
      continue;
    }

    // Check if this line is an export of a moved symbol
    const exportMatch = trimmed.match(/^export\s+(const|function|type)\s+(\w+)/);
    if (exportMatch) {
      const name = exportMatch[2];
      if (ALL_MOVED.has(name)) {
        // Drop accumulated comments too
        pendingCommentLines = [];

        // Determine if this is a multi-line block (has unclosed braces/parens)
        let depth = 0;
        for (const ch of line) {
          if (ch === '{' || ch === '(') depth++;
          if (ch === '}' || ch === ')') depth--;
        }
        if (depth > 0) {
          inSkipBlock = true;
          skip = depth;
        }
        // Single-line: just drop this line
        continue;
      }
    }

    // Not skipping — flush pending comments and keep the line
    result.push(...pendingCommentLines);
    pendingCommentLines = [];
    result.push(line);
  }

  // Flush any trailing comment lines
  result.push(...pendingCommentLines);

  return result.join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('🔍  Scanning src/…');

  // 1. Write new files (skip if already present)
  const newFiles = [
    { file: path.join(LIB, 'config.ts'), content: CONFIG_TS },
    { file: path.join(LIB, 'access.ts'), content: ACCESS_TS },
    { file: path.join(LIB, 'vocab-helpers.ts'), content: VOCAB_HELPERS_TS }
  ];

  for (const { file, content } of newFiles) {
    if (fs.existsSync(file)) {
      console.log(`⏭   ${path.relative(ROOT, file)} already exists — skipping write`);
    } else {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅  Created ${path.relative(ROOT, file)}`);
    }
  }

  // 2. Rewrite imports in all .ts / .svelte files
  const files = walk(SRC);
  let patchedCount = 0;

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    if (!src.includes("'$lib/types'") && !src.includes('"$lib/types"')) continue;

    const patched = rewriteImports(src);
    if (patched !== src) {
      fs.writeFileSync(file, patched, 'utf8');
      console.log(`📝  Patched imports: ${path.relative(ROOT, file)}`);
      patchedCount++;
    }
  }

  // 3. Strip moved exports from types.ts
  const typesPath = path.join(LIB, 'types.ts');
  const typesSrc = fs.readFileSync(typesPath, 'utf8');
  const typesPatched = stripMovedExports(typesSrc);
  if (typesPatched !== typesSrc) {
    fs.writeFileSync(typesPath, typesPatched, 'utf8');
    console.log(`🧹  Stripped moved exports from ${path.relative(ROOT, typesPath)}`);
  }

  console.log(`\n✨  Done. ${patchedCount} file(s) had imports updated.`);
  console.log('\nNext steps:');
  console.log('  1. Run: npx tsc --noEmit   (check for type errors)');
  console.log('  2. Run: npx vitest run     (run the test suite)');
  console.log('  3. Review the diff in types.ts to confirm the strips look correct');
  console.log('  4. Review config.ts, access.ts, vocab-helpers.ts for any tweaks needed');
}

main();
