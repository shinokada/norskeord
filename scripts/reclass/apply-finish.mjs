// Applies the last few fuzzy-dupes-a / komme-til-bunns-i edits via exact
// byte-splice (same blockBounds technique as raw-blocks-fuzzy-a.mjs), not
// JSON.stringify — so untouched entries in each file are byte-identical
// and only the targeted block changes. Avoids hand-retyping Cyrillic/
// accented text through a chat tool call, which already produced two
// mismatches (w-009485, w-009382).
//
// Usage:
//   node scripts/reclass/apply-finish.mjs            # dry run
//   node scripts/reclass/apply-finish.mjs --write
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, loadJSON } from './lib.mjs';

const WRITE = process.argv.includes('--write');

function blockBounds(raw, id) {
  const idIdx = raw.indexOf(`"id": "${id}"`);
  if (idIdx === -1) return null;
  const start = raw.lastIndexOf('{', idIdx);
  let depth = 0, end = -1;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === '{') depth++;
    else if (raw[i] === '}' && --depth === 0) { end = i + 1; break; }
  }
  const lineStart = raw.lastIndexOf('\n', start) + 1;
  return { lineStart, end };
}

function removalText(raw, id) {
  const b = blockBounds(raw, id);
  if (!b) return null;
  if (raw.slice(b.end, b.end + 2) === ',\n') {
    return { removal: raw.slice(b.lineStart, b.end + 2), block: raw.slice(b.lineStart, b.end) };
  }
  const pc = raw.lastIndexOf(',', b.lineStart);
  return { removal: raw.slice(pc, b.end), block: raw.slice(b.lineStart, b.end) };
}

function deleteById(file, id) {
  const p = path.join(DATA_DIR, file);
  const raw = fs.readFileSync(p, 'utf8');
  const r = removalText(raw, id);
  if (!r) {
    console.log(`  ${file} ${id}: NOT FOUND`);
    return false;
  }
  const occ = raw.split(r.removal).length - 1;
  if (occ !== 1) {
    console.log(`  ${file} ${id}: FOUND but occurrences=${occ} (expected 1) — SKIPPED`);
    return false;
  }
  console.log(`  ${file} ${id}: OK (will remove ${r.removal.length} bytes)`);
  if (WRITE) {
    const updated = raw.replace(r.removal, '');
    fs.writeFileSync(p, updated, 'utf8');
  }
  return true;
}

console.log(`--- ${WRITE ? 'WRITE' : 'DRY RUN'} ---`);

console.log('\n1. Delete uttrykk-c.json w-009382 (stikke noe til noen, cross-type twin)');
deleteById('uttrykk-c.json', 'w-009382');

console.log('\n2. Delete uttrykk-c.json w-009566 (komme til bunns i noe, twin of vocab-b1 w-010196)');
deleteById('uttrykk-c.json', 'w-009566');

console.log('\n3. Add komme til bunns i to uttrykk-b1.json, then delete vocab-b1.json w-010196');
{
  const vocabPath = path.join(DATA_DIR, 'vocab-b1.json');
  const vocabList = loadJSON(vocabPath);
  const src = vocabList.find((e) => e.id === 'w-010196');
  if (!src) {
    console.log('  vocab-b1.json w-010196: NOT FOUND — aborting step 3');
  } else {
    const newEntry = {
      id: src.id,
      // Not src.norsk: the vocab-format-fixes correction for this id
      // (norsk -> 'å komme til bunns i') may not have run yet, and we
      // must not carry a stale headword into the new uttrykk entry.
      norsk: 'å komme til bunns i',
      lemma: src.lemma,
      english: src.english,
      ukrainian: src.ukrainian,
      spanish: src.spanish,
      german: src.german,
      example: src.example,
      example_english: src.example_english,
      example_ukrainian: src.example_ukrainian,
      example_spanish: src.example_spanish,
      example_german: src.example_german,
      definition: 'Å finne ut den fulle sannheten om noe.',
      level: src.level,
      category: 'uttrykk',
      part: 'phrase',
      theme: 'idioms'
    };
    const entryText =
      JSON.stringify(newEntry, null, 2)
        .split('\n')
        .map((l) => '  ' + l)
        .join('\n') + '\n';

    const b1Path = path.join(DATA_DIR, 'uttrykk-b1.json');
    const b1Raw = fs.readFileSync(b1Path, 'utf8');
    const closeIdx = b1Raw.lastIndexOf('  }\n]');
    if (closeIdx === -1) {
      console.log('  uttrykk-b1.json: could not find array-closing anchor — SKIPPED add');
      console.log('  vocab-b1.json w-010196: NOT deleted (insertion did not run)');
    } else {
      console.log('  uttrykk-b1.json: will insert new entry before closing ]');
      console.log(entryText);
      if (WRITE) {
        const insertAt = closeIdx + '  }\n'.length;
        const updated = b1Raw.slice(0, closeIdx) + '  },\n' + entryText + b1Raw.slice(insertAt);
        fs.writeFileSync(b1Path, updated, 'utf8');
      }
      // Only delete the vocab source once the uttrykk insertion succeeded
      // (or would have, in dry run) — never delete on a skipped add.
      deleteById('vocab-b1.json', 'w-010196');
    }
  }
}

console.log(`\n--- done (${WRITE ? 'written' : 'dry run only, pass --write to apply'}) ---`);
