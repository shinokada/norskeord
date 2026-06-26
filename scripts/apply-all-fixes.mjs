#!/usr/bin/env node
/**
 * apply-all-fixes.mjs
 * Run this once from project root:
 *   node scripts/apply-all-fixes.mjs
 *
 * It will:
 * 1. Fix category fields in uttrykk-b2.json and vocab-b2.json
 * 2. Patch the CATEGORIES array in add-b2-fields.mjs
 * Then delete itself.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── 1. Fix JSON category fields ───────────────────────────────────────────────

const JSON_FILES = [
  path.resolve(__dirname, '../draft/flashcard/uttrykk-b2.json'),
  path.resolve(__dirname, '../draft/flashcard/vocab-b2.json')
];

function fixCategory(cat) {
  if (!cat) return cat;
  cat = cat.charAt(0).toLowerCase() + cat.slice(1);
  cat = cat.replace(/ /g, '-');
  return cat;
}

for (const filePath of JSON_FILES) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filePath}`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = 0;
  for (const entry of data) {
    if (entry.category) {
      const fixed = fixCategory(entry.category);
      if (fixed !== entry.category) {
        entry.category = fixed;
        changed++;
      }
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`✅  ${path.basename(filePath)}: ${changed} categories fixed`);
}

// ── 2. Patch CATEGORIES array in add-b2-fields.mjs ───────────────────────────

const scriptPath = path.join(__dirname, 'add-b2-fields.mjs');
const oldBlock = `const CATEGORIES = [
  'Politics',
  'Economics',
  'Social Issues',
  'Arts',
  'Science',
  'Emotions',
  'History',
  'Law',
  'Literature',
  'Advanced Adjectives',
  'Philosophy',
  'Medicine',
  'Psychology',
  'Business',
  'Religion',
  'Environment',
  'Technology',
  'Media',
  'Education',
  'Language',
  'Argumentation',
  'Abstract Nouns',
  'Advanced Verbs',
  'Geography',
  'Culture',
  'Global Issues',
  'Academic Language',
  'Discourse Markers',
  'Work Career',
  'Relationships',
  'Communication',
  'Uttrykk',
];`;

const newBlock = `const CATEGORIES = [
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
];`;

let scriptContent = fs.readFileSync(scriptPath, 'utf8');
if (scriptContent.includes(oldBlock)) {
  scriptContent = scriptContent.replace(oldBlock, newBlock);
  fs.writeFileSync(scriptPath, scriptContent, 'utf8');
  console.log('✅  add-b2-fields.mjs: CATEGORIES updated to lowercase+hyphenated values');
} else {
  console.log('ℹ️   add-b2-fields.mjs: CATEGORIES already up-to-date (skipped)');
}

console.log('\n🎉  All done! You can delete scripts/apply-all-fixes.mjs now.');
