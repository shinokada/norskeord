// One-off helper for the B2 idiom re-scan (follow-up §9b, batches 1-2 + 9-18).
// Lists every `move` decision in decisions/b2.jsonl whose batch is in
// scope, then reports which of those are NOT currently present in
// vocab-b2.json (by id when the decision carries one, else by norsk/lemma
// text via findEntry — same matching status.mjs uses). A decision that's
// `superseded_by` is skipped: it's already accounted for as reverse-moved.
//
// Usage: node scripts/reclass/find-rescan-missing.mjs
import { loadJSON, levelDataPaths, loadDecisions, findEntry } from './lib.mjs';

const SCOPE_BATCHES = new Set([1, 2, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);

const { vocab: vocabPath } = levelDataPaths('b2');
const vocab = loadJSON(vocabPath);
const decisions = loadDecisions('b2');

const moves = decisions.filter(
  (d) => d.type === 'move' && d.bucket === 'move_to_vocab' && SCOPE_BATCHES.has(d.batch)
);

console.log(`In-scope moves (batches 1-2, 9-18): ${moves.length}`);

const missing = [];
const superseded = [];
const found = [];

for (const d of moves) {
  if (d.superseded_by) {
    superseded.push(d);
    continue;
  }
  const v = d.vocab || {};
  const entry = findEntry(vocab, { id: v.id, norsk: v.norsk, lemma: v.lemma });
  if (entry) {
    found.push(d);
  } else {
    missing.push(d);
  }
}

console.log(`Found in vocab-b2.json: ${found.length}`);
console.log(`Marked superseded_by (already accounted for): ${superseded.length}`);
console.log(`MISSING (need explaining): ${missing.length}\n`);

for (const d of missing) {
  console.log(
    `batch ${d.batch} | source: "${d.source?.norsk}" (${d.source?.id || 'no id'}) | vocab target: "${d.vocab?.norsk}" (${d.vocab?.id || 'no id'})`
  );
}
