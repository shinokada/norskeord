// Read-only. Prints raw blocks to use as formatting templates:
//   - an existing uttrykk-b1.json entry with theme "idioms" (field order)
//   - the "komme til skade" reverse_move precedent in uttrykk-b2.json
//   - trailing-comma check for vocab-b1.json w-010196 (is it the last
//     array element, or does a comma follow it?)
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, loadJSON } from './lib.mjs';

const b1 = loadJSON(path.join(DATA_DIR, 'uttrykk-b1.json'));
const idiomSample = b1.find((e) => e.theme === 'idioms');
console.log('### uttrykk-b1.json sample entry with theme=idioms (field order)');
console.log(JSON.stringify(idiomSample, null, 2));

console.log('\n### uttrykk-b2.json w-010462 (komme til skade, reverse_move precedent)');
const b2 = loadJSON(path.join(DATA_DIR, 'uttrykk-b2.json'));
console.log(JSON.stringify(b2.find((e) => e.id === 'w-010462'), null, 2));

console.log('\n### vocab-b1.json w-010196 trailing context');
const raw = fs.readFileSync(path.join(DATA_DIR, 'vocab-b1.json'), 'utf8');
const idIdx = raw.indexOf('"id": "w-010196"');
const start = raw.lastIndexOf('{', idIdx);
let depth = 0, end = -1;
for (let i = start; i < raw.length; i++) {
  if (raw[i] === '{') depth++;
  else if (raw[i] === '}' && --depth === 0) { end = i + 1; break; }
}
console.log('next 5 chars after block:', JSON.stringify(raw.slice(end, end + 5)));
const lineStart = raw.lastIndexOf('\n', start) + 1;
console.log('prev char before block (trimmed):', JSON.stringify(raw.slice(lineStart - 5, lineStart)));
