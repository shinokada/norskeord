#!/usr/bin/env node
/**
 * shorten-faq-answers.mjs
 *
 * Shortens three verbose FAQ answers in all locale files.
 * Only updates the English (en.json) values — other locales
 * are left unchanged since they have their own translations.
 *
 * Usage (from project root):
 *   node scripts/shorten-faq-answers.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = resolve(__dirname, '../messages');

const UPDATES = {
  guide_faq_norskproven_a:
    'The official Norwegian exam required for residency and citizenship. The prep section covers vocabulary and practice tests at A2 and B1.',

  guide_faq_prefs_a:
    'Go to Profile → Preferences. You can set your level, interface language, flashcard direction, card type, pronunciation speed, and cards per session.',

  guide_faq_freeplus_a_v2:
    'Free covers all A1 and A2 vocabulary, a preview of B1/B2, 3 quiz categories per level, and 4 grammar topics. Plus unlocks everything: all levels, smart scheduling, cross-device sync, all quiz and grammar topics, Norskprøven practice tests, and full-text search. See the full comparison:'
};

// Only update en.json — other locales have their own translations
const path = resolve(messagesDir, 'en.json');
const data = JSON.parse(readFileSync(path, 'utf8'));

for (const [key, value] of Object.entries(UPDATES)) {
  if (key in data) {
    console.log(`\n${key}:\n  before: ${data[key]}\n  after:  ${value}`);
    data[key] = value;
  } else {
    console.log(`SKIP ${key} — not found in en.json`);
  }
}

writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
console.log('\nen.json updated.');
