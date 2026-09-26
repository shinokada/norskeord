import { appendDecision } from './lib.mjs';

appendDecision('c', {
  level: 'c',
  batch: 40,
  phase: 'fuzzy-dupes-a',
  type: 'no_action',
  bucket: 'distinct_senses',
  source: { norsk: 'grumset', id: 'w-007363' },
  related: { norsk: 'grumsete', id: 'w-006486' },
  reason:
    'flagged as a spelling/inflection variant pair by the fuzzy scan, but on inspection they cover different senses: grumset (nature-landscape) is the literal murky-water sense, grumsete (abstract-concepts) is the figurative murky/unclear-motives sense with its own note on the idiom "grumsete forhold" (shady circumstances). Kept both, no deletion.'
});

console.log('logged: c batch 40 (no_action, grumset/grumsete kept)');
