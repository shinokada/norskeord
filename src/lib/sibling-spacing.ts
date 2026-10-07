/**
 * Reorder `items` so that two items with the same key are not adjacent, when a
 * non-sibling is available later in the list.
 *
 * Used for quiz sessions and flashcard decks: two senses of the same word
 * (`gang` "occasion" / `gang` "hallway") or a word and its plural card should
 * not appear back to back.
 *
 * Going left to right, an item whose key equals the previous item's key is
 * swapped with the nearest later item whose key differs. If no such item
 * exists (the rest of the list is all the same key), it is swapped with an
 * earlier item that differs and whose neighbours also differ, so a sibling pair
 * at the end of the list is separated too. If a pair is still adjacent after
 * that and a valid order exists (no key has more than ceil(n / 2) items), the
 * whole list is rebuilt by interleaving the key groups, largest first. If no
 * valid order exists, the greedy result is returned. Returns a new array and
 * never mutates the input; no item is dropped or duplicated.
 */
export function spaceSiblings<T>(items: readonly T[], keyFn: (item: T) => string): T[] {
  const out = [...items];

  for (let i = 1; i < out.length; i++) {
    const prevKey = keyFn(out[i - 1]);
    if (keyFn(out[i]) !== prevKey) continue;

    // out[i] shares its key with out[i - 1], so any later item with a different
    // key is also safe next to out[i - 1].
    let j = i + 1;
    while (j < out.length && keyFn(out[j]) === prevKey) j++;
    if (j < out.length) {
      [out[i], out[j]] = [out[j], out[i]];
      continue;
    }

    // Everything after i has this key, so look backwards. A swap with out[k] is
    // safe when out[k] and both its neighbours differ from prevKey: the sibling
    // lands between non-siblings, and out[k] lands next to out[i - 1] and
    // out[i + 1], which both have prevKey.
    for (let k = i - 2; k >= 0; k--) {
      if (keyFn(out[k]) === prevKey) continue;
      if (k > 0 && keyFn(out[k - 1]) === prevKey) continue;
      if (keyFn(out[k + 1]) === prevKey) continue;
      [out[i], out[k]] = [out[k], out[i]];
      break;
    }
  }

  return hasAdjacentSiblings(out, keyFn) ? interleaveGroups(out, keyFn) : out;
}

function hasAdjacentSiblings<T>(items: readonly T[], keyFn: (item: T) => string): boolean {
  return items.some((item, i) => i > 0 && keyFn(item) === keyFn(items[i - 1]));
}

/**
 * Last resort for a list that still has adjacent siblings after the greedy
 * pass. A valid order exists exactly when the largest key group has at most
 * ceil(n / 2) items. Then: sort the groups by size (largest first, ties keep
 * first-seen order), lay them end to end, and fill positions 0, 2, 4, ... and
 * then 1, 3, 5, ... Returns `items` unchanged when no valid order exists.
 */
function interleaveGroups<T>(items: T[], keyFn: (item: T) => string): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }

  const sorted = [...groups.values()].sort((a, b) => b.length - a.length);
  if (sorted[0].length > Math.ceil(items.length / 2)) return items;

  const flat = sorted.flat();
  const result = new Array<T>(items.length);
  let n = 0;
  for (let pos = 0; pos < items.length; pos += 2) result[pos] = flat[n++];
  for (let pos = 1; pos < items.length; pos += 2) result[pos] = flat[n++];
  return result;
}
