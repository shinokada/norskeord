#!/usr/bin/env node
/**
 * patch-add-b2-fields.mjs
 * Updates the CATEGORIES array in add-b2-fields.mjs to use lowercase + hyphenated values.
 * Run once from scripts/ or project root, then delete this file.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(__dirname, 'add-b2-fields.mjs');

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

let content = fs.readFileSync(target, 'utf8');
if (!content.includes(oldBlock)) {
  console.error('❌  Could not find the CATEGORIES block to replace. Already patched?');
  process.exit(1);
}
content = content.replace(oldBlock, newBlock);
fs.writeFileSync(target, content, 'utf8');
console.log('✅  CATEGORIES in add-b2-fields.mjs updated to lowercase+hyphenated values.');
console.log('    You can delete scripts/patch-add-b2-fields.mjs now.');
