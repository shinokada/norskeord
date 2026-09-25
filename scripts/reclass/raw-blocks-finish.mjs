// Read-only. Prints exact removal/raw-block text for:
//   (a) the 9 fuzzy-dupes-a deletions that status.mjs reports pending
//       (never actually applied to uttrykk-b2.json / uttrykk-c.json)
//   (b) the komme til bunns i move: raw block of vocab-b1 w-010196
//       (source, to remove after copying into uttrykk-b1) and the
//       removal text for uttrykk-c w-009566 (twin to delete)
// Same block-bounds / occurrence-check logic as raw-blocks-fuzzy-a.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './lib.mjs';

const deletions = {
  'uttrykk-b2.json': ['w-009126'],
  'uttrykk-c.json': [
    'w-009485', 'w-009547', 'w-009289', 'w-009923',
    'w-009947', 'w-009948', 'w-009734', 'w-009382',
    'w-009566'
  ]
};
const showOnly = {
  'vocab-b1.json': ['w-010196']
};

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
  const lineStart = raw.lastIndexOf('\n', start) + 1;
  return { lineStart, end };
}

let problems = 0;
for (const [file, ids] of Object.entries(deletions)) {
  const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  for (const id of ids) {
    const b = blockBounds(raw, id);
    if (!b) {
      console.log(`\n### ${file} ${id}  NOT FOUND`);
      problems++;
      continue;
    }
    let kind, removal;
    if (raw.slice(b.end, b.end + 2) === ',\n') {
      kind = 'block+trailing-comma';
      removal = raw.slice(b.lineStart, b.end + 2);
    } else {
      kind = 'LAST block: leading-comma+block';
      const pc = raw.lastIndexOf(',', b.lineStart);
      removal = raw.slice(pc, b.end);
      if (raw.slice(pc, b.lineStart) !== ',\n') kind += ' (UNEXPECTED SHAPE)';
    }
    const occ = raw.split(removal).length - 1;
    if (occ !== 1) problems++;
    console.log(`\n### ${file} ${id}  [${kind}]  occurrences=${occ}`);
    console.log(JSON.stringify(removal));
  }
}
for (const [file, ids] of Object.entries(showOnly)) {
  const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  for (const id of ids) {
    const b = blockBounds(raw, id);
    console.log(`\n### SHOW-ONLY ${file} ${id}`);
    console.log(b ? JSON.stringify(raw.slice(b.lineStart, b.end)) : 'NOT FOUND');
  }
}
console.log(`\nSUMMARY: ${problems} problem(s)`);
