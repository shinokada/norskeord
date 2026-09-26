import path from 'node:path';
import { DATA_DIR, loadJSON, loadDecisions } from './lib.mjs';

const decisions = loadDecisions('a2');
const line = decisions.find((d) =>
  (d.vocab?.norsk || d.source?.norsk || '').toLowerCase().includes('bunns')
);
console.log('### a2.jsonl batch 2 decision line');
console.log(JSON.stringify(line, null, 2));

const uttrykkA2 = loadJSON(path.join(DATA_DIR, 'uttrykk-a2.json'));
const vocabA2 = loadJSON(path.join(DATA_DIR, 'vocab-a2.json'));
console.log('\n### uttrykk-a2.json entries matching "bunns"');
console.log(
  JSON.stringify(
    uttrykkA2.filter((e) => (e.norsk || '').includes('bunns') || (e.lemma || '').includes('bunns')),
    null,
    2
  )
);
console.log('\n### vocab-a2.json entries matching "bunns"');
console.log(
  JSON.stringify(
    vocabA2.filter((e) => (e.norsk || '').includes('bunns') || (e.lemma || '').includes('bunns')),
    null,
    2
  )
);
