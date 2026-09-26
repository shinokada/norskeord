// Reference lookup: print the full raw+parsed entries for a couple of
// already-completed reverse_move examples in uttrykk-b2.json, so new
// reverse_moves can match the exact field shape/order used there.
import fs from 'node:fs';
import { levelDataPaths, findEntry } from './lib.mjs';

const targets = [{ id: 'w-010441' }, { id: 'w-010458' }, { id: 'w-010336' }];

const { uttrykk: uttrykkPath } = levelDataPaths('b2');
const raw = fs.readFileSync(uttrykkPath, 'utf8');
const parsed = JSON.parse(raw);

for (const t of targets) {
  const entry = findEntry(parsed, t);
  if (!entry) {
    console.log(`\n=== NOT FOUND: ${JSON.stringify(t)} ===`);
    continue;
  }
  console.log(`\n=== ${entry.id} | ${entry.norsk} ===`);
  console.log(JSON.stringify(entry, null, 2));
}
