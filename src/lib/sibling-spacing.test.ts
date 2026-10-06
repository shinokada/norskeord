import { describe, it, expect } from 'vitest';
import { spaceSiblings } from './sibling-spacing';

// Items are strings like 'a1'; the key is the first character, so 'a1' and 'a2'
// are siblings.
const key = (s: string) => s[0];

function hasAdjacentSiblings(items: string[]) {
  return items.some((item, i) => i > 0 && key(item) === key(items[i - 1]));
}

describe('spaceSiblings', () => {
  it('leaves a list with no adjacent siblings unchanged', () => {
    expect(spaceSiblings(['a1', 'b1', 'a2'], key)).toEqual(['a1', 'b1', 'a2']);
  });

  it('swaps an adjacent sibling with the next non-sibling', () => {
    expect(spaceSiblings(['a1', 'a2', 'b1'], key)).toEqual(['a1', 'b1', 'a2']);
  });

  it('separates two sibling pairs', () => {
    expect(spaceSiblings(['a1', 'a2', 'b1', 'b2'], key)).toEqual(['a1', 'b1', 'a2', 'b2']);
  });

  it('spaces three siblings as far as one non-sibling allows', () => {
    // Only one non-sibling exists, so the last two siblings stay adjacent.
    expect(spaceSiblings(['a1', 'a2', 'a3', 'b1'], key)).toEqual(['a1', 'b1', 'a3', 'a2']);
  });

  it('leaves the order as is when no non-sibling exists later', () => {
    expect(spaceSiblings(['a1', 'a2', 'a3'], key)).toEqual(['a1', 'a2', 'a3']);
    expect(spaceSiblings(['b1', 'a1', 'a2', 'a3'], key)).toEqual(['b1', 'a1', 'a2', 'a3']);
  });

  it('handles an empty list and a single item', () => {
    expect(spaceSiblings([], key)).toEqual([]);
    expect(spaceSiblings(['a1'], key)).toEqual(['a1']);
  });

  it('does not mutate the input array', () => {
    const input = ['a1', 'a2', 'b1'];
    const copy = [...input];
    spaceSiblings(input, key);
    expect(input).toEqual(copy);
  });

  it('keeps every item exactly once', () => {
    const input = ['a1', 'a2', 'a3', 'b1', 'b2', 'c1', 'a4'];
    const out = spaceSiblings(input, key);
    expect([...out].sort()).toEqual([...input].sort());
  });

  it('leaves no adjacent siblings when enough non-siblings exist', () => {
    const input = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'a3'];
    expect(hasAdjacentSiblings(spaceSiblings(input, key))).toBe(false);
  });

  it('works with a custom key function on objects', () => {
    const items = [
      { id: 'w-1', lemma: 'gang' },
      { id: 'w-2', lemma: 'gang' },
      { id: 'w-3', lemma: 'hus' }
    ];
    const out = spaceSiblings(items, (e) => e.lemma);
    expect(out.map((e) => e.id)).toEqual(['w-1', 'w-3', 'w-2']);
  });
});
