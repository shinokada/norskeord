import { describe, it, expect } from 'vitest';
import { createEmptyCard } from 'ts-fsrs';
import {
  buildClozeQuestion,
  buildClozeSession,
  clozeCountsAsCorrect,
  clozeRatingToWrite,
  getAlternativeForms,
  getBaseForms,
  getWrongGenderForms,
  gradeClozeAnswer,
  normalizeClozeText,
  type ClozeItem,
  type ClozeMap
} from './cloze';
import type { CardProgress, VocabEntry } from '$lib/types';
import { vocabKey } from '$lib/progress';

// ── Fixtures ──────────────────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<VocabEntry> = {}): VocabEntry {
  const norsk = overrides.norsk ?? 'å selge';
  return {
    id: `w-test-${norsk}`,
    norsk: 'å selge',
    lemma: 'selge',
    english: 'to sell',
    spanish: 'vender',
    ukrainian: 'продавати',
    example: 'De selger frukt her.',
    example_english: 'They sell fruit here.',
    example_spanish: 'Aquí venden fruta.',
    level: 'A2',
    category: 'shopping',
    part: 'verb',
    ...overrides
  };
}

/** A sidecar item for `entry`, blanking `answer` once in its example. */
function itemFor(entry: VocabEntry, answer: string): ClozeItem {
  const i = entry.example.indexOf(answer);
  if (i === -1) throw new Error(`"${answer}" is not in "${entry.example}"`);
  return {
    before: entry.example.slice(0, i),
    answer,
    after: entry.example.slice(i + answer.length)
  };
}

function makeProgress(daysUntilDue: number): CardProgress {
  const due = new Date();
  due.setDate(due.getDate() + daysUntilDue);
  return {
    fsrs: { ...createEmptyCard(), due },
    seenCount: 1,
    lastSeen: new Date().toISOString(),
    level: 'A2',
    category: 'shopping'
  };
}

/** Entries plus their cloze map: each entry blanks the first word of its example. */
function poolOf(entries: VocabEntry[]): { entries: VocabEntry[]; map: ClozeMap } {
  const map: ClozeMap = {};
  for (const e of entries) map[e.id] = itemFor(e, e.example.split(' ')[0]);
  return { entries, map };
}

// ── Grading ───────────────────────────────────────────────────────────────────────────────

describe('gradeClozeAnswer', () => {
  const base = ['selge'];

  it('accepts the exact sentence form', () => {
    expect(gradeClozeAnswer('selger', 'selger', base)).toBe('correct');
  });

  it('ignores case and surrounding or repeated whitespace', () => {
    expect(gradeClozeAnswer('  SELGER ', 'selger', base)).toBe('correct');
    expect(gradeClozeAnswer('Kaninen', 'kaninen', ['kanin'])).toBe('correct');
    expect(gradeClozeAnswer('står  opp', 'står opp', ['stå opp'])).toBe('correct');
  });

  it('keeps æ, ø and å significant', () => {
    expect(gradeClozeAnswer('føtter', 'føtter', ['fot'])).toBe('correct');
    // one letter off is wrong: only the exact form counts
    expect(gradeClozeAnswer('fotter', 'føtter', ['fot'])).toBe('wrong');
  });

  it('treats a decomposed å like a composed å', () => {
    const decomposed = 'a\u030Ar'; // "år" typed as a + combining ring + r
    expect(gradeClozeAnswer(decomposed, 'år', [])).toBe('correct');
  });

  it('grades the base form as the wrong form, not as a typo', () => {
    // "selge" is one edit away from "selger": the base form must win
    expect(gradeClozeAnswer('selge', 'selger', base)).toBe('wrongForm');
  });

  it('matches a base form given by lemma as well as by norsk', () => {
    expect(gradeClozeAnswer('gifte seg', 'giftet seg', ['gifte seg', 'gifte'])).toBe('wrongForm');
    expect(gradeClozeAnswer('gifte', 'giftet seg', ['gifte seg', 'gifte'])).toBe('wrongForm');
  });

  it('rejects a one-letter slip: there is no typo rule (substitution, insertion, deletion)', () => {
    expect(gradeClozeAnswer('selber', 'selger', base)).toBe('wrong');
    expect(gradeClozeAnswer('selgerr', 'selger', base)).toBe('wrong');
    expect(gradeClozeAnswer('selge r', 'selger', base)).toBe('wrong');
    expect(gradeClozeAnswer('selger'.slice(0, 5), 'selger', ['sel'])).toBe('wrong');
    // the case from manual testing: munten for munnen
    expect(gradeClozeAnswer('munten', 'munnen', ['munn'])).toBe('wrong');
  });

  it('rejects two edits and unrelated words', () => {
    expect(gradeClozeAnswer('selbar', 'selger', base)).toBe('wrong');
    expect(gradeClozeAnswer('kjøper', 'selger', base)).toBe('wrong');
  });

  it('accepts an alternative spelling as correct, ahead of the typo and wrong-form rules', () => {
    expect(gradeClozeAnswer('kuen', 'Kua', ['ku'], ['kuen'])).toBe('correct');
    expect(gradeClozeAnswer(' KUEN ', 'Kua', ['ku'], ['kuen'])).toBe('correct');
    // without the alternative, "kuen" is two edits from "kua"
    expect(gradeClozeAnswer('kuen', 'Kua', ['ku'])).toBe('wrong');
    // the base form is still a wrong form
    expect(gradeClozeAnswer('ku', 'Kua', ['ku'], ['kuen'])).toBe('wrongForm');
  });

  it('rejects empty and whitespace-only input', () => {
    expect(gradeClozeAnswer('', 'selger', base)).toBe('wrong');
    expect(gradeClozeAnswer('   ', 'selger', base)).toBe('wrong');
  });

  it("grades the other gender's definite as the wrong form", () => {
    // "beinen" is one edit from "beinet": with the wrong-gender list it is a wrong form
    // (rated hard); without it, it is just wrong (rated again)
    expect(gradeClozeAnswer('beinen', 'beinet', ['bein'])).toBe('wrong');
    expect(gradeClozeAnswer('beinen', 'beinet', ['bein'], [], ['beinen'])).toBe('wrongForm');
    expect(gradeClozeAnswer(' BEINEN ', 'beinet', ['bein'], [], ['beinen'])).toBe('wrongForm');
    // other slips are wrong
    expect(gradeClozeAnswer('beiet', 'beinet', ['bein'], [], ['beinen'])).toBe('wrong');
    expect(gradeClozeAnswer('beinte', 'beinet', ['bein'], [], ['beinen'])).toBe('wrong');
    // the exact form stays correct
    expect(gradeClozeAnswer('beinet', 'beinet', ['bein'], [], ['beinen'])).toBe('correct');
  });

  it('is correct when the answer equals its base form', () => {
    expect(gradeClozeAnswer('pris', 'pris', ['pris'])).toBe('correct');
  });

  it('handles multi-word answers (uttrykk and phrasal verbs)', () => {
    expect(gradeClozeAnswer('med andre ord', 'Med andre ord', ['med andre ord'])).toBe('correct');
    expect(gradeClozeAnswer('stå opp', 'står opp', ['stå opp'])).toBe('wrongForm');
    expect(gradeClozeAnswer('står op', 'står opp', ['stå opp'])).toBe('wrong');
    expect(gradeClozeAnswer('står', 'står opp', ['stå opp'])).toBe('wrong');
  });
});

describe('getAlternativeForms', () => {
  it('accepts -en for a definite in -a (kua / kuen, døra / døren)', () => {
    expect(getAlternativeForms({ norsk: 'ku (en/ei)', lemma: 'ku', part: 'noun' }, 'Kua')).toEqual([
      'kuen'
    ]);
    expect(
      getAlternativeForms({ norsk: 'dør (en/ei)', lemma: 'dør', part: 'noun' }, 'døra')
    ).toEqual(['døren']);
  });

  it('accepts -a for a definite in -en, only when the entry is marked ei', () => {
    expect(
      getAlternativeForms({ norsk: 'stue (en/ei)', lemma: 'stue', part: 'noun' }, 'stuen')
    ).toEqual(['stua']);
    // a masculine noun never accepts -a
    expect(getAlternativeForms({ norsk: 'bil (en)', lemma: 'bil', part: 'noun' }, 'bilen')).toEqual(
      []
    );
  });

  it('handles lemmas in -e (høne: høna / hønen)', () => {
    expect(
      getAlternativeForms({ norsk: 'høne (en)', lemma: 'høne', part: 'noun' }, 'høna')
    ).toEqual(['hønen']);
  });

  it('has none for non-nouns or for other forms of the word', () => {
    expect(getAlternativeForms({ norsk: 'å ku', lemma: 'ku', part: 'verb' }, 'kua')).toEqual([]);
    expect(getAlternativeForms({ norsk: 'ku (en/ei)', lemma: 'ku', part: 'noun' }, 'kuer')).toEqual(
      []
    );
  });
});

describe('getWrongGenderForms', () => {
  it('gives -en for a neuter noun whose answer is the -et definite (bein / beinet)', () => {
    expect(
      getWrongGenderForms({ norsk: 'bein (et)', lemma: 'bein', part: 'noun' }, 'beinet')
    ).toEqual(['beinen']);
    // lemma in -e: eple / eplet, wrong form eplen
    expect(
      getWrongGenderForms({ norsk: 'eple (et)', lemma: 'eple', part: 'noun' }, 'eplet')
    ).toEqual(['eplen']);
  });

  it('gives -et for an en or en/ei noun whose answer is the -en definite', () => {
    expect(getWrongGenderForms({ norsk: 'bil (en)', lemma: 'bil', part: 'noun' }, 'bilen')).toEqual(
      ['bilet']
    );
    expect(
      getWrongGenderForms({ norsk: 'stue (en/ei)', lemma: 'stue', part: 'noun' }, 'stuen')
    ).toEqual(['stuet']);
  });

  it('has none for other forms of the word, other parts of speech or unmarked entries', () => {
    // plural, indefinite and base form are not the definite singular
    expect(
      getWrongGenderForms({ norsk: 'bein (et)', lemma: 'bein', part: 'noun' }, 'bein')
    ).toEqual([]);
    expect(
      getWrongGenderForms({ norsk: 'bein (et)', lemma: 'bein', part: 'noun' }, 'beina')
    ).toEqual([]);
    expect(getWrongGenderForms({ norsk: 'å bein', lemma: 'bein', part: 'verb' }, 'beinet')).toEqual(
      []
    );
    expect(getWrongGenderForms({ norsk: 'bein', lemma: 'bein', part: 'noun' }, 'beinet')).toEqual(
      []
    );
  });

  it('has none when the entry is marked for both gender classes', () => {
    expect(
      getWrongGenderForms({ norsk: 'gate (en/et)', lemma: 'gate', part: 'noun' }, 'gaten')
    ).toEqual([]);
  });
});

describe('normalizeClozeText', () => {
  it('trims, collapses spaces, lowercases and keeps æøå', () => {
    expect(normalizeClozeText('  Å  GÅ  ')).toBe('å gå');
  });
});

describe('clozeRatingToWrite and clozeCountsAsCorrect', () => {
  it('maps every outcome to an FSRS rating', () => {
    expect(clozeRatingToWrite('correct')).toBe('good');
    expect(clozeRatingToWrite('wrongForm')).toBe('hard');
    expect(clozeRatingToWrite('wrong')).toBe('again');
  });

  it('counts only a correct answer as correct, not a wrong form', () => {
    expect(clozeCountsAsCorrect('correct')).toBe(true);
    expect(clozeCountsAsCorrect('wrongForm')).toBe(false);
    expect(clozeCountsAsCorrect('wrong')).toBe(false);
  });
});

describe('getBaseForms', () => {
  it('strips å and gender articles and adds lemma', () => {
    expect(getBaseForms({ norsk: 'å selge', lemma: 'selge' })).toEqual(['selge']);
    expect(getBaseForms({ norsk: 'pris (en)', lemma: 'pris' })).toEqual(['pris']);
    expect(getBaseForms({ norsk: 'å gifte seg', lemma: 'gifte' })).toEqual(['gifte seg', 'gifte']);
  });

  it('works without a lemma', () => {
    expect(getBaseForms({ norsk: 'tann (en/ei)' })).toEqual(['tann']);
  });
});

// ── Question ──────────────────────────────────────────────────────────────────────────────

describe('buildClozeQuestion', () => {
  const entry = makeEntry();
  const item = itemFor(entry, 'selger');

  it('copies the blank and the base forms, never the base form into the hints', () => {
    const q = buildClozeQuestion(entry, item);
    expect(q).toMatchObject({
      type: 'cloze',
      before: 'De ',
      answer: 'selger',
      after: ' frukt her.',
      baseForms: ['selge']
    });
    expect(q.wordHint).not.toContain('selge');
    expect(q.sentenceHint).not.toContain('selge');
  });

  it('lists alternative spellings for a feminine noun, and none for a verb', () => {
    const ku = makeEntry({
      norsk: 'ku (en/ei)',
      lemma: 'ku',
      part: 'noun',
      level: 'A1',
      example: 'Kua er på jordet.'
    });
    expect(buildClozeQuestion(ku, itemFor(ku, 'Kua')).alternatives).toEqual(['kuen']);
    expect(buildClozeQuestion(entry, item).alternatives).toEqual([]);
  });

  it('lists the wrong-gender definite for a noun answered in its definite form', () => {
    const bein = makeEntry({
      norsk: 'bein (et)',
      lemma: 'bein',
      part: 'noun',
      level: 'A1',
      example: 'Han brakk beinet sitt.'
    });
    const q = buildClozeQuestion(bein, itemFor(bein, 'beinet'));
    expect(q.wrongGenderForms).toEqual(['beinen']);
    expect(
      gradeClozeAnswer('beinen', q.answer, q.baseForms, q.alternatives, q.wrongGenderForms)
    ).toBe('wrongForm');
    expect(buildClozeQuestion(entry, item).wrongGenderForms).toEqual([]);
  });

  it('uses translations at A1 to B1: the sentence and the word, in the chosen language', () => {
    const en = buildClozeQuestion(entry, item, 'english');
    expect(en.sentenceHint).toBe('They sell fruit here.');
    expect(en.wordHint).toBe('to sell');
    expect(en.hintIsDefinition).toBe(false);

    const es = buildClozeQuestion(entry, item, 'spanish');
    expect(es.sentenceHint).toBe('Aquí venden fruta.');
    expect(es.wordHint).toBe('vender');
  });

  it('falls back to English when the sentence translation is missing', () => {
    const q = buildClozeQuestion(entry, item, 'german');
    expect(q.sentenceHint).toBe('They sell fruit here.');
    expect(q.wordHint).toBe('to sell'); // getTranslation falls back to English too
  });

  it('shows only the Norwegian definition at B2 and C', () => {
    for (const level of ['B2', 'C'] as const) {
      const e = makeEntry({ level, definition: 'Å gi noe til en som betaler for det.' });
      const q = buildClozeQuestion(e, itemFor(e, 'selger'), 'spanish');
      expect(q.hintIsDefinition).toBe(true);
      expect(q.wordHint).toBe('Å gi noe til en som betaler for det.');
      expect(q.sentenceHint).toBeNull();
    }
  });

  it('shows only the definition for an eligible B1 entry (monolingualOverride)', () => {
    const e = makeEntry({ level: 'B1', definition: 'Å gi noe til en som betaler for det.' });
    const q = buildClozeQuestion(e, itemFor(e, 'selger'), 'english', true);
    expect(q.hintIsDefinition).toBe(true);
    expect(q.sentenceHint).toBeNull();
  });

  it('uses translations for a B1 entry that is not eligible', () => {
    const e = makeEntry({ level: 'B1', definition: 'Å gi noe til en som betaler for det.' });
    const q = buildClozeQuestion(e, itemFor(e, 'selger'), 'english', false);
    expect(q.hintIsDefinition).toBe(false);
    expect(q.wordHint).toBe('to sell');
    expect(q.sentenceHint).toBe('They sell fruit here.');
  });
});

// ── Session ───────────────────────────────────────────────────────────────────────────────

describe('buildClozeSession', () => {
  const NOW = new Date('2026-10-30T12:00:00Z');
  const rng = () => 0.5;

  const dueEntry = makeEntry({ norsk: 'å kjøpe', lemma: 'kjøpe', example: 'Vi kjøper brød.' });
  const newEntry = makeEntry({ norsk: 'å spise', lemma: 'spise', example: 'Vi spiser lunsj.' });
  const laterEntry = makeEntry({ norsk: 'å drikke', lemma: 'drikke', example: 'Vi drikker te.' });
  const soonEntry = makeEntry({ norsk: 'å lese', lemma: 'lese', example: 'Vi leser bøker.' });

  function dueIn(days: number): CardProgress {
    const p = makeProgress(days);
    p.fsrs.due = new Date(NOW.getTime() + days * 86_400_000);
    return p;
  }

  it('puts due cards first, then new cards, then not-yet-due by soonest due date', () => {
    const { entries, map } = poolOf([laterEntry, newEntry, soonEntry, dueEntry]);
    const progress: Record<string, CardProgress> = {
      [vocabKey(dueEntry)]: dueIn(-1),
      [vocabKey(laterEntry)]: dueIn(9),
      [vocabKey(soonEntry)]: dueIn(2)
    };
    const session = buildClozeSession(entries, map, progress, 10, 'english', rng, NOW);
    expect(session.map((q) => q.entry.norsk)).toEqual([
      'å kjøpe', // due
      'å spise', // new
      'å lese', // not yet due, soonest
      'å drikke' // not yet due, later
    ]);
  });

  it('stops at `count`, keeping the priority order', () => {
    const { entries, map } = poolOf([laterEntry, newEntry, soonEntry, dueEntry]);
    const progress = {
      [vocabKey(dueEntry)]: dueIn(-1),
      [vocabKey(laterEntry)]: dueIn(9),
      [vocabKey(soonEntry)]: dueIn(2)
    };
    const session = buildClozeSession(entries, map, progress, 2, 'english', rng, NOW);
    expect(session.map((q) => q.entry.norsk)).toEqual(['å kjøpe', 'å spise']);
  });

  it('tops up with not-yet-due cards so a session is not short', () => {
    const { entries, map } = poolOf([laterEntry, soonEntry]);
    const progress = { [vocabKey(laterEntry)]: dueIn(9), [vocabKey(soonEntry)]: dueIn(2) };
    const session = buildClozeSession(entries, map, progress, 5, 'english', rng, NOW);
    expect(session).toHaveLength(2);
    expect(session[0].entry.norsk).toBe('å lese');
  });

  it('returns fewer than `count` when fewer entries are eligible, and nothing for an empty pool', () => {
    const { entries, map } = poolOf([newEntry]);
    expect(buildClozeSession(entries, map, {}, 10, 'english', rng, NOW)).toHaveLength(1);
    expect(buildClozeSession([], {}, {}, 10, 'english', rng, NOW)).toEqual([]);
  });

  it('skips an entry with no cloze item', () => {
    const { entries, map } = poolOf([newEntry, soonEntry]);
    delete map[soonEntry.id];
    const session = buildClozeSession(entries, map, {}, 10, 'english', rng, NOW);
    expect(session.map((q) => q.entry.norsk)).toEqual(['å spise']);
  });

  it('skips a stale item whose parts no longer rebuild the example', () => {
    const { entries, map } = poolOf([newEntry, soonEntry]);
    map[soonEntry.id] = { before: 'Vi ', answer: 'leste', after: ' bøker.' };
    const session = buildClozeSession(entries, map, {}, 10, 'english', rng, NOW);
    expect(session.map((q) => q.entry.norsk)).toEqual(['å spise']);
  });

  it('skips a B2 or C entry that has no definition', () => {
    const noDef = makeEntry({
      norsk: 'å vedta',
      lemma: 'vedta',
      level: 'B2',
      example: 'De vedtar loven.'
    });
    const withDef = makeEntry({
      norsk: 'å anta',
      lemma: 'anta',
      level: 'B2',
      example: 'Jeg antar det.',
      definition: 'Å tro at noe er slik.'
    });
    const { entries, map } = poolOf([noDef, withDef]);
    const session = buildClozeSession(entries, map, {}, 10, 'english', rng, NOW);
    expect(session.map((q) => q.entry.norsk)).toEqual(['å anta']);
  });

  it('keeps two senses of the same word apart', () => {
    const a = makeEntry({
      id: 'w-gang-1',
      norsk: 'gang (en)',
      lemma: 'gang',
      example: 'Gangen er smal.'
    });
    const b = makeEntry({
      id: 'w-gang-2',
      norsk: 'gang (en)',
      lemma: 'gang',
      example: 'Tre ganger i uka.'
    });
    const { entries, map } = poolOf([a, b, newEntry, soonEntry]);
    const session = buildClozeSession(entries, map, {}, 4, 'english', rng, NOW);
    expect(session).toHaveLength(4);
    for (let i = 1; i < session.length; i++) {
      expect(session[i].entry.lemma).not.toBe(session[i - 1].entry.lemma);
    }
  });

  it('uses a Norwegian definition for an eligible B1 entry and translations otherwise', () => {
    const withDef = makeEntry({
      norsk: 'å anta',
      lemma: 'anta',
      level: 'B1',
      example: 'Jeg antar det.',
      definition: 'Å tro at noe er slik.'
    });
    const noDef = makeEntry({
      norsk: 'å lese',
      lemma: 'lese',
      level: 'B1',
      example: 'Vi leser bøker.'
    });
    const { entries, map } = poolOf([withDef, noDef]);
    const session = buildClozeSession(entries, map, {}, 10, 'english', rng, NOW);
    const byNorsk = Object.fromEntries(session.map((q) => [q.entry.norsk, q]));
    expect(byNorsk['å anta'].hintIsDefinition).toBe(true);
    expect(byNorsk['å lese'].hintIsDefinition).toBe(false);
  });

  it('does not mutate its inputs', () => {
    const { entries, map } = poolOf([laterEntry, newEntry, dueEntry]);
    const progress = { [vocabKey(dueEntry)]: dueIn(-1) };
    const entriesBefore = [...entries];
    const mapBefore = JSON.stringify(map);
    buildClozeSession(entries, map, progress, 10, 'english', rng, NOW);
    expect(entries).toEqual(entriesBefore);
    expect(JSON.stringify(map)).toBe(mapBefore);
  });
});
