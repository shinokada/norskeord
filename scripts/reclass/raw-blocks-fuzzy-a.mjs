// Read-only. For the vocab-side deletions of the fuzzy-dupe bucket A pass,
// prints the EXACT text to remove from each vocab-<level>.json so a targeted
// edit_file (oldText = removal, newText = "") matches byte-for-byte:
//   - a block followed by "," -> removal = the block's lines + ",\n"
//   - the last block in the array -> removal = the preceding ",\n" + block
// It also checks the removal text occurs exactly once in the file.
// Two SHOW-ONLY targets (blocks that will be edited, not removed) print raw.
//
// Usage: node scripts/reclass/raw-blocks-fuzzy-a.mjs > scripts/outputs/raw-blocks-fuzzy-a.txt
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './lib.mjs';

const deletions = {
  'vocab-a1.json': ['w-010154'],
  'vocab-a2.json': ['w-001543'],
  'vocab-b1.json': ['w-002940', 'w-002023'],
  'vocab-b2.json': ['w-005615', 'w-005575', 'w-010425', 'w-004904', 'w-005437', 'w-010444'],
  'vocab-c.json': [
    'w-007171',
    'w-007505',
    'w-006860',
    'w-007514',
    'w-007533',
    'w-007079',
    'w-006784',
    'w-007772',
    'w-007735',
    'w-006486',
    'w-006539',
    'w-007178'
  ]
};
const showOnly = {
  'vocab-a2.json': ['w-000844'], // norsk "naturen (en)" -> "natur (en)"
  'uttrykk-b1.json': ['w-008587'] // example typo "bor" -> "bør"
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
