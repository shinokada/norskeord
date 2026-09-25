import { collectAllEntries } from './lib.mjs';
const all = collectAllEntries();
for (const id of ['w-009382','w-009566','w-010196']) {
  const e = all.get(id);
  console.log(id, '->', e ? `FOUND in ${e.file} (norsk: "${e.norsk}")` : 'NOT FOUND (deleted, as expected for w-009382/w-009566/w-010196-in-vocab)');
}
