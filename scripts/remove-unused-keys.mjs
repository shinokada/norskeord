#!/usr/bin/env node
/**
 * remove-unused-keys.mjs
 *
 * Removes the plus_unlocked_*_teaser keys from all locale files.
 * Safe to re-run — skips keys that are already absent.
 *
 * Usage (from project root):
 *   node scripts/remove-unused-keys.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = resolve(__dirname, '../messages');

const KEYS_TO_REMOVE = [
  'plus_unlocked_a1_teaser',
  'plus_unlocked_a2_teaser',
  'plus_unlocked_b1_teaser',
  'plus_unlocked_b2_teaser',
  'plus_unlocked_c_teaser',
  'home_features_vocab_body',
  'home_features_grammar_body',
  'home_features_quiz_body',
  'home_features_norskproven_body',
  'home_hero_badge',
  'home_hero_body',
  'home_features_vocab'
];

const LOCALES = ['en', 'nb', 'es', 'uk', 'de'];

for (const locale of LOCALES) {
  const path = resolve(messagesDir, `${locale}.json`);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const removed = KEYS_TO_REMOVE.filter(k => k in data);
  removed.forEach(k => delete data[k]);
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  console.log(`${locale}.json — removed: ${removed.join(', ') || 'nothing to remove'}`);
}
