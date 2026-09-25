// Read-only. Raw text for the two items still pending in the fuzzy-dupe
// bucket A pass:
//   1. komme til bunns i: vocab-b1 w-010196 (removal text + raw block, in case
//      it is moved to uttrykk-b1 as a reverse_move)
//   2. grumset / grumsete: vocab-c w-007363 raw block, to see whether the
//      usage note of the to-be-deleted w-006486 can be copied onto it.
//   Also prints the last block of uttrykk-b1.json (append point).
//
// Usage: node scripts/reclass/raw-blocks-fuzzy-a2.mjs > scripts/outputs/raw-blocks-fuzzy-a2.txt
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './lib.mjs';

function blockBounds(raw, id) {
  const idIdx = raw.indexOf(`"id": "${id}"`);
  if (idIdx === -1) return null;
  const start = raw.lastIndexOf('{', idIdx);
  let depth = 0;
  let end = -1;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === '{') depth++;
    else if (raw[i] === '}' && --depth === 0) {
      end = i + 1;
      break;
    }
  }
  return { lineStart: raw.lastIndexOf('\n', start) + 1, end };
}

const b1 = fs.readFileSync(path.join(DATA_DIR, 'vocab-b1.json'), 'utf8');
const b = blockBounds(b1, 'w-010196');
if (!b) console.log('### vocab-b1 w-010196 NOT FOUND');
else {
  let removal;
  if (b1.slice(b.end, b.end + 2) === ',\n') removal = b1.slice(b.lineStart, b.end + 2);
  else removal = b1.slice(b1.lastIndexOf(',', b.lineStart), b.end);
  const occ = b1.split(removal).length - 1;
  console.log(`### vocab-b1 w-010196 removal text, occurrences=${occ}`);
  console.log(JSON.stringify(removal));
}

const c = fs.readFileSync(path.join(DATA_DIR, 'vocab-c.json'), 'utf8');
const g = blockBounds(c, 'w-007363');
console.log('\n### SHOW-ONLY vocab-c w-007363 (grumset)');
console.log(g ? JSON.stringify(c.slice(g.lineStart, g.end)) : 'NOT FOUND');

const u = fs.readFileSync(path.join(DATA_DIR, 'uttrykk-b1.json'), 'utf8');
console.log('\n### uttrykk-b1.json last 400 chars');
console.log(JSON.stringify(u.slice(-400)));
