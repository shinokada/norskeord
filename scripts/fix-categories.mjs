#!/usr/bin/env node
/**
 * fix-categories.mjs
 * Normalizes "category" fields in B2 JSON files:
 *   - lowercase first letter
 *   - replace spaces with hyphens
 * Run from project root:
 *   node scripts/fix-categories.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FILES = [
  path.resolve(__dirname, '../draft/flashcard/uttrykk-b2.json'),
  path.resolve(__dirname, '../draft/flashcard/vocab-b2.json'),
];

function fixCategory(cat) {
  if (!cat) return cat;
  // lowercase first character
  cat = cat.charAt(0).toLowerCase() + cat.slice(1);
  // replace spaces with hyphens
  cat = cat.replace(/ /g, '-');
  return cat;
}

for (const filePath of FILES) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
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
  console.log(`✅  ${path.basename(filePath)}: ${changed} categories updated`);
}

console.log('Done.');
