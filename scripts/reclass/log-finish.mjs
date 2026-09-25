import { appendDecision } from './lib.mjs';

appendDecision('b1', {
  level: 'b1',
  batch: 11,
  phase: 'fuzzy-dupes-a',
  type: 'reverse_move',
  bucket: 'stays_uttrykk',
  source: { norsk: 'å komme til bunns i', id: 'w-010196' },
  uttrykk: { id: 'w-010196', theme: 'idioms' },
  reason:
    'same komme til + noun idiom family as komme til orde / komme til uttrykk / komme til skade (b2 batch 24), all in uttrykk; twin uttrykk-c w-009566 (komme til bunns i noe) deleted as duplicate (c batch 39), lower level (B1) kept under this id. Definition copied from the deleted twin (vocab entry had none). No legacy migration key pointed at this id'
});

appendDecision('c', {
  level: 'c',
  batch: 39,
  phase: 'fuzzy-dupes-a',
  type: 'delete',
  bucket: 'fuzzy_duplicate',
  source: { norsk: 'å komme til bunns i noe', id: 'w-009566' },
  reason:
    'same idiom as vocab-b1 w-010196 (å komme til bunns i), reverse-moved to uttrykk-b1 under the same id (b1 batch 11, idiom family with komme til skade); lower level kept. No legacy migration key pointed at this id'
});

console.log('logged: b1 batch 11 (reverse_move), c batch 39 (delete)');
