#!/usr/bin/env node
// One-off: locate the 9 ids that status.mjs reports pending for the
// fuzzy-dupes-a batch (b2 batch 25, c batch 38), to tell apart
// "never actually deleted from disk" from "logged against the wrong
// list (missing from:vocab)". Read-only.

import { collectAllEntries } from './lib.mjs';

const ids = [
  'w-009126', // b2 batch 25 "ta noe for god fisk"
  'w-009485', // c batch 38 "å låne øre til noen"
  'w-009547', // c batch 38 "å ta seg selv i nakken"
  'w-009289', // c batch 38 "å lure noen trill rundt"
  'w-009923', // c batch 38 "det gikk opp for henne"
  'w-009947', // c batch 38 "å holde med noen"
  'w-009948', // c batch 38 "å holde av noen"
  'w-009734', // c batch 38 "å bite seg merke i noe"
  'w-009382'  // c batch 38 "å stikke noe til noen"
];

const all = collectAllEntries();
for (const id of ids) {
  const e = all.get(id);
  console.log(id, '->', e ? `FOUND in ${e.file} (norsk: "${e.norsk}")` : 'NOT FOUND anywhere');
}
