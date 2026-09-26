// One-off lookup: given a list of {id?, norsk?} targets, find each in
// vocab-b2.json (using the same findEntry matching status.mjs uses),
// then print the *raw* on-disk text of that JSON object (including one
// line of context before/after, so a following edit_file oldText/newText
// pair can safely delete it) plus a JSON.stringify'd copy for reuse
// when re-inserting into uttrykk-b2.json.
//
// Usage: node scripts/reclass/lookup-vocab-b2.mjs
import fs from 'node:fs';
import { levelDataPaths, findEntry } from './lib.mjs';

const targets = [
  { id: 'w-010454', norsk: 'å få noen til å gjøre noe' },
  { id: 'w-010466', norsk: 'å nyte godt av' },
  { norsk: 'å bære galt av sted' },
  { norsk: 'å blåne seg' },
  { id: 'w-010423', norsk: 'å få det til' },
  { id: 'w-010470', norsk: 'å snu opp ned på noe' }
];

const { vocab: vocabPath } = levelDataPaths('b2');
const raw = fs.readFileSync(vocabPath, 'utf8');
const parsed = JSON.parse(raw);

for (const t of targets) {
  const entry = findEntry(parsed, t);
  if (!entry) {
    console.log(`\n=== NOT FOUND: ${JSON.stringify(t)} ===`);
    continue;
  }
  console.log(`\n=== ${entry.id} | ${entry.norsk} ===`);
  console.log('--- parsed fields ---');
  console.log(JSON.stringify(entry, null, 2));

  // Locate the raw text block for this object in the file by its id line.
  const idNeedle = `"id": "${entry.id}"`;
  const idIdx = raw.indexOf(idNeedle);
  if (idIdx === -1) {
    console.log('(raw block not found by id text search)');
    continue;
  }
  // scan back to the enclosing '{'
  let start = raw.lastIndexOf('{', idIdx);
  // scan forward, brace-counting, to the matching '}'
  let depth = 0;
  let end = -1;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === '{') depth++;
    else if (raw[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  // include a bit of context: the line before start, and whether a
  // trailing comma follows end
  const beforeCtx = raw.slice(Math.max(0, start - 5), start);
  const afterCtx = raw.slice(end + 1, end + 5);
  console.log('--- raw block (with tiny context before/after) ---');
  console.log(JSON.stringify({ beforeCtx, afterCtx }));
  console.log('--- raw block text ---');
  console.log(raw.slice(start, end + 1));
}
