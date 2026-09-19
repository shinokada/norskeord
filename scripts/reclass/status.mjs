#!/usr/bin/env node
// Usage: node scripts/reclass/status.mjs --level a2
//
// Never trusts a stored "done" flag. Recomputes each decision's real
// state from the actual files on disk, every time. This is the fix for
// the fictional-log failure mode: status is derived, not remembered.

import {
  levelDataPaths,
  loadJSON,
  loadDecisions,
  findEntry,
  collectAllEntries,
  normText
} from './lib.mjs';

const level = process.argv.includes('--level')
  ? process.argv[process.argv.indexOf('--level') + 1]
  : null;
if (!level) {
  console.error('Usage: node status.mjs --level <a1|a2|b1|b2|c>');
  process.exit(1);
}

const { uttrykk: uttrykkPath, vocab: vocabPath } = levelDataPaths(level);
const uttrykkList = loadJSON(uttrykkPath);
const vocabList = loadJSON(vocabPath);
const allEntries = collectAllEntries(); // id -> {file, norsk, lemma}
const decisions = loadDecisions(level);

if (decisions.length === 0) {
  console.log(
    `No decisions logged yet for level ${level} (scripts/reclass/decisions/${level}.jsonl missing or empty).`
  );
  process.exit(0);
}

let pending = 0,
  applied = 0,
  partial = 0,
  conflict = 0;

// A later `fix` decision for the same id supersedes earlier ones (the
// earlier line stays in the file as audit trail, but only the latest fix
// describes what should be on disk now).
const latestFixById = new Map();
decisions.forEach((d, i) => {
  if (d.type === 'fix' && d.source?.id) latestFixById.set(d.source.id, i);
});

for (const [i, d] of decisions.entries()) {
  const label = `[batch ${d.batch ?? '?'}] ${d.bucket ?? d.type}: "${d.source?.norsk ?? d.vocab?.norsk}"`;
  const sourceGone = d.type === 'add_vocab' ? true : !findEntry(uttrykkList, d.source || {});

  let vocabState = 'n/a';
  if (d.vocab) {
    const inTarget = findEntry(vocabList, d.vocab);
    if (inTarget) {
      vocabState = 'present';
    } else {
      // Check every other level's vocab file for the same norsk/lemma —
      // this is the "en stund"/"en feil" duplicate class from batch 1.
      const dupElsewhere = [...allEntries.values()].find(
        (e) =>
          e.file !== `vocab-${level}.json` &&
          ((d.vocab.norsk && e.norsk === d.vocab.norsk) ||
            (d.vocab.lemma && e.lemma === d.vocab.lemma))
      );
      vocabState = dupElsewhere ? `DUPLICATE in ${dupElsewhere.file}` : 'missing';
    }
  }

  let state;
  if (d.type === 'delete') {
    state = sourceGone ? 'applied' : 'pending';
  } else if (d.type === 'move') {
    if (sourceGone && vocabState === 'present') state = 'applied';
    else if (sourceGone && vocabState.startsWith('DUPLICATE'))
      state = d.resolution === 'skip' ? 'applied' : 'conflict';
    else if (sourceGone && vocabState === 'missing')
      state = 'PARTIAL (source deleted, vocab never added)';
    else if (!sourceGone && vocabState === 'present')
      state = 'PARTIAL (vocab added, source never deleted)';
    else state = 'pending';
  } else if (d.type === 'add_vocab') {
    if (vocabState === 'present') state = 'applied';
    else if (vocabState.startsWith('DUPLICATE'))
      state = d.resolution === 'skip' ? 'applied' : 'conflict';
    else state = 'pending';
  } else if (d.type === 'fix') {
    // In-place field correction: the entry stays in uttrykk, so verify by
    // id that the corrected text is what's actually on disk now.
    const target = findEntry(uttrykkList, { id: d.source?.id });
    if (d.source?.id && latestFixById.get(d.source.id) !== i) state = 'applied'; // superseded by a later fix
    else if (!target) state = 'MISSING (fix target gone from file)';
    else state = normText(target.norsk) === normText(d.fix?.norsk) ? 'applied' : 'pending';
  } else {
    // Never leave state undefined — an unrecognised type used to crash
    // the summary loop instead of reporting itself.
    state = `UNKNOWN type "${d.type}"`;
  }

  if (state === 'applied') applied++;
  else if (state.startsWith('PARTIAL')) partial++;
  else if (state === 'conflict') conflict++;
  else pending++;

  if (state !== 'applied') {
    console.log(`${state.padEnd(10)} ${label}${d.vocab ? `  [vocab: ${vocabState}]` : ''}`);
  }
}

console.log('---');
console.log(
  `${level}: ${decisions.length} decisions — applied ${applied}, pending ${pending}, partial ${partial}, conflict ${conflict}`
);
console.log(`uttrykk-${level}.json: ${uttrykkList.length} entries on disk`);
console.log(`vocab-${level}.json: ${vocabList.length} entries on disk`);
