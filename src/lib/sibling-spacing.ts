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
 * at the end of the list is separated too. If neither exists, the order is left
 * as it is. Returns a new array and never mutates the input; no item is
 * dropped or duplicated.
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

  return out;
}
