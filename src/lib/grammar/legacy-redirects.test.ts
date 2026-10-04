// src/lib/grammar/legacy-redirects.test.ts
import { describe, it, expect } from 'vitest';
import { GRAMMAR_RULES } from './rules';
import { LEGACY_GRAMMAR_TOPIC_REDIRECTS, legacyGrammarRedirect } from './legacy-redirects';

describe('legacyGrammarRedirect', () => {
  it('redirects the split helsetninger topic', () => {
    expect(legacyGrammarRedirect('/grammar/helsetninger')).toBe('/grammar/sporresetninger');
  });

  it('redirects every uttrykk-gjenkjenning-* topic to the merged uttrykk topic', () => {
    for (const old of [
      'uttrykk-gjenkjenning-c-1',
      'uttrykk-gjenkjenning-c-2',
      'uttrykk-gjenkjenning-c-3',
      'uttrykk-gjenkjenning-detgaarbra-c'
    ]) {
      expect(legacyGrammarRedirect(`/grammar/${old}`)).toBe('/grammar/uttrykk');
    }
  });

  it('accepts a trailing slash', () => {
    expect(legacyGrammarRedirect('/grammar/helsetninger/')).toBe('/grammar/sporresetninger');
  });

  it('returns null for current topics, the index page and unrelated paths', () => {
    expect(legacyGrammarRedirect('/grammar')).toBeNull();
    expect(legacyGrammarRedirect('/grammar/')).toBeNull();
    expect(legacyGrammarRedirect('/grammar/noun-plurals')).toBeNull();
    expect(legacyGrammarRedirect('/grammar/uttrykk')).toBeNull();
    expect(legacyGrammarRedirect('/grammar/helsetninger/extra')).toBeNull();
    expect(legacyGrammarRedirect('/blog/helsetninger')).toBeNull();
    expect(legacyGrammarRedirect('/')).toBeNull();
  });

  it('does not match inherited object keys', () => {
    expect(legacyGrammarRedirect('/grammar/constructor')).toBeNull();
    expect(legacyGrammarRedirect('/grammar/__proto__')).toBeNull();
    expect(legacyGrammarRedirect('/grammar/toString')).toBeNull();
  });
});

describe('LEGACY_GRAMMAR_TOPIC_REDIRECTS integrity', () => {
  it('every target is a live topic with a rule', () => {
    const dead = Object.values(LEGACY_GRAMMAR_TOPIC_REDIRECTS).filter((t) => !GRAMMAR_RULES[t]);
    expect(dead).toEqual([]);
  });

  it('no old id is still a live topic (a redirect would shadow real content)', () => {
    const live = Object.keys(LEGACY_GRAMMAR_TOPIC_REDIRECTS).filter((t) => GRAMMAR_RULES[t]);
    expect(live).toEqual([]);
  });
});
