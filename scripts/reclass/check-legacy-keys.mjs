import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './lib.mjs';

const map = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'id-migration-map.json'), 'utf8'));
const targets = new Set([
  'w-010196', 'w-009566', // komme til bunns i pair
  'w-009126', 'w-009485', 'w-009547', 'w-009289', 'w-009923',
  'w-009947', 'w-009948', 'w-009734', 'w-009382' // the 9 pending
]);
const entries = Array.isArray(map) ? map : Object.entries(map);
let hits = 0;
for (const [key, val] of Object.entries(map)) {
  const to = typeof val === 'string' ? val : val?.id || val?.to || JSON.stringify(val);
  if (targets.has(to)) {
    console.log(key, '->', to);
    hits++;
  }
}
console.log(`\n${hits} legacy key(s) point at these ids.`);
