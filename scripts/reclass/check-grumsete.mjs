import path from 'node:path';
import { DATA_DIR, loadJSON } from './lib.mjs';
const vocabC = loadJSON(path.join(DATA_DIR, 'vocab-c.json'));
for (const id of ['w-007363', 'w-006486']) {
  const e = vocabC.find((x) => x.id === id);
  console.log(id, '->', e ? JSON.stringify(e, null, 2) : 'NOT FOUND');
}
