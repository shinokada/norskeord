import { describe, it, expect } from 'vitest';
import {
  removeHyphensAndCapitalize,
  cleanWord,
  randomword,
  getRandomItemFromDictionary,
  randomNumberGenerator,
  getRandomPair
} from './utils';

// ── removeHyphensAndCapitalize ────────────────────────────────────────────────

describe('removeHyphensAndCapitalize', () => {
  it('capitalizes a single word', () => {
    expect(removeHyphensAndCapitalize('greetings')).toBe('Greetings');
  });

  it('removes hyphens and capitalizes each word', () => {
    expect(removeHyphensAndCapitalize('days-months')).toBe('Days Months');
  });

  it('handles multiple hyphens', () => {
    expect(removeHyphensAndCapitalize('food-cooking-advanced')).toBe('Food Cooking Advanced');
  });

  it('capitalizes space-separated words', () => {
    expect(removeHyphensAndCapitalize('basic adjectives')).toBe('Basic Adjectives');
  });

  it('returns an empty string unchanged', () => {
    expect(removeHyphensAndCapitalize('')).toBe('');
  });

  it('returns a falsy value unchanged', () => {
    // The function guards with `if (!str) return str`
    expect(removeHyphensAndCapitalize(null as unknown as string)).toBeNull();
  });
});

// ── cleanWord ─────────────────────────────────────────────────────────────────

describe('cleanWord', () => {
  it('returns a plain word unchanged', () => {
    expect(cleanWord('hei')).toBe('hei');
  });

  it('strips everything after a slash', () => {
    expect(cleanWord('å gå/går')).toBe('å gå');
  });

  it('strips everything after a comma', () => {
    expect(cleanWord('stor, stor')).toBe('stor');
  });

  it('strips everything after " -"', () => {
    expect(cleanWord('snakke - å snakke')).toBe('snakke');
  });

  it('trims leading and trailing whitespace', () => {
    expect(cleanWord('  hei  ')).toBe('hei');
  });

  it('applies slash rule before comma rule', () => {
    // slash is stripped first, so comma inside slash portion is irrelevant
    expect(cleanWord('ord/alt, mer')).toBe('ord');
  });
});

// ── randomword ────────────────────────────────────────────────────────────────

describe('randomword', () => {
  it('throws when given an empty list', () => {
    expect(() => randomword([])).toThrow('wordList must not be empty');
  });

  it('returns the only element from a single-item list', () => {
    expect(randomword(['hei'])).toBe('hei');
  });

  it('always returns a value from the list', () => {
    const list = ['en', 'to', 'tre', 'fire'];
    for (let i = 0; i < 20; i++) {
      expect(list).toContain(randomword(list));
    }
  });
});

// ── getRandomItemFromDictionary ───────────────────────────────────────────────

describe('getRandomItemFromDictionary', () => {
  it('throws when given an empty dictionary', () => {
    expect(() => getRandomItemFromDictionary({})).toThrow('dictionary must not be empty');
  });

  it('returns the only entry from a single-item dictionary', () => {
    const result = getRandomItemFromDictionary({ hei: 'hello' });
    expect(result).toEqual({ hei: 'hello' });
  });

  it('returns exactly one key-value pair', () => {
    const dict = { en: 1, to: 2, tre: 3 };
    const result = getRandomItemFromDictionary(dict);
    expect(Object.keys(result)).toHaveLength(1);
  });

  it('always returns a key that exists in the original dictionary', () => {
    const dict = { en: 1, to: 2, tre: 3 };
    for (let i = 0; i < 20; i++) {
      const [key] = Object.keys(getRandomItemFromDictionary(dict));
      expect(dict).toHaveProperty(key);
    }
  });
});

// ── randomNumberGenerator ─────────────────────────────────────────────────────

describe('randomNumberGenerator', () => {
  it('throws when min > max', () => {
    expect(() => randomNumberGenerator(5, 3, 1)).toThrow('Invalid range');
  });

  it('always returns the only possible value when min === max', () => {
    const gen = randomNumberGenerator(7, 7, 0);
    for (let i = 0; i < 10; i++) {
      expect(gen()).toBe(7);
    }
  });

  it('returns values within [min, max]', () => {
    const gen = randomNumberGenerator(0, 9, 3);
    for (let i = 0; i < 50; i++) {
      const n = gen();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(9);
    }
  });

  it('never repeats the immediately previous value when windowSize >= 1', () => {
    const gen = randomNumberGenerator(0, 9, 1);
    let prev = gen();
    for (let i = 0; i < 50; i++) {
      const curr = gen();
      expect(curr).not.toBe(prev);
      prev = curr;
    }
  });

  it('never repeats any of the last N values when windowSize is N', () => {
    const windowSize = 4;
    const gen = randomNumberGenerator(0, 9, windowSize);
    const history: number[] = [];
    for (let i = 0; i < 100; i++) {
      const curr = gen();
      const window = history.slice(-windowSize);
      expect(window).not.toContain(curr);
      history.push(curr);
    }
  });

  it('clamps windowSize to rangeSize - 1 so it never infinite-loops', () => {
    // Range has 3 values (0,1,2); maxConsecutiveRepeats=100 gets clamped to 2.
    const gen = randomNumberGenerator(0, 2, 100);
    expect(() => {
      for (let i = 0; i < 30; i++) gen();
    }).not.toThrow();
  });
});

// ── getRandomPair ─────────────────────────────────────────────────────────────

describe('getRandomPair', () => {
  const words = [
    { norsk: 'hei', english: 'hello' },
    { norsk: 'takk', english: 'thanks' },
    { norsk: 'ja', english: 'yes' }
  ];

  const wordsWithExplanation = [
    { norsk: 'å løpe', english: 'to run', norskexplanation: 'å bevege seg raskt' },
    { norsk: 'å spise', english: 'to eat', norskexplanation: 'å innta mat' }
  ];

  it('returns norsk as front and english as back in noreng mode', () => {
    const { front, back } = getRandomPair(words, 'noreng');
    const match = words.find((w) => w.norsk === front);
    expect(match).toBeDefined();
    expect(back).toBe(match!.english);
  });

  it('returns english as front and norsk as back in engnor mode', () => {
    const { front, back } = getRandomPair(words, 'engnor');
    const match = words.find((w) => w.english === front);
    expect(match).toBeDefined();
    expect(back).toBe(match!.norsk);
  });

  it('returns norskexplanation as front in nornor explain mode', () => {
    const result = getRandomPair(wordsWithExplanation, 'nornor', true);
    const match = wordsWithExplanation.find((w) => w.norskexplanation === result.front);
    expect(match).toBeDefined();
    expect(result.back).toBe(match!.norsk);
  });

  it('includes norskexplanation in the result when isExplain is true', () => {
    const result = getRandomPair(wordsWithExplanation, 'noreng', true);
    expect(result.norskexplanation).toBeDefined();
  });

  it('does not include norskexplanation when isExplain is false', () => {
    const result = getRandomPair(words, 'noreng', false);
    expect(result).not.toHaveProperty('norskexplanation');
  });
});
