// Read-only. Pulls full entries (all fields) for every bucket-B pair
// from the fuzzy-dupes triage, searching across all vocab/uttrykk files
// by norsk/lemma text (ids weren't recorded for these at triage time).
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './lib.mjs';

const files = fs.readdirSync(DATA_DIR).filter((f) => /^(vocab|uttrykk)-(a1|a2|b1|b2|c)\.json$/.test(f));
const all = [];
for (const f of files) {
  const list = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
  for (const e of list) all.push({ ...e, file: f });
}

function norm(s) {
  return (s || '').toLowerCase().replace(/^å\s+/, '').trim();
}

function find(term) {
  const t = norm(term);
  return all.filter((e) => norm(e.norsk) === t || norm(e.lemma) === t);
}

const groups = [
  ['føle', 'føle seg'],
  ['bevege', 'bevege seg'],
  ['strekke', 'strekke seg'],
  ['spre', 'spre seg'],
  ['folde ut', 'folde seg ut'],
  ['melde inn', 'melde seg inn'],
  ['ta for gitt', 'ta noen for gitt'],
  ['la være', 'la noe være'],
  ['støtte', 'støtte noen'],
  ['vende tilbake', 'vende tilbake til'],
  ['følge med', 'følge med på'],
  ['si fra', 'si fra om noe'],
  ['henge etter', 'henge etter med noe'],
  ['være takknemlig', 'være takknemlig for'],
  ['bli oppmuntret', 'bli oppmuntret til'],
  ['tilbringe tid', 'tilbringe tid med'],
  ['nyhet', 'nyheter'],
  ['grad', 'grader'],
  ['ritual', 'rituale']
];

for (const [a, b] of groups) {
  console.log(`\n=== ${a}  /  ${b} ===`);
  for (const term of [a, b]) {
    const hits = find(term);
    if (hits.length === 0) console.log(`  "${term}": NOT FOUND`);
    for (const h of hits) {
      console.log(
        `  "${term}" -> ${h.file} id=${h.id} norsk="${h.norsk}" lemma="${h.lemma}" part=${h.part} category=${h.category || h.theme || ''} english="${h.english}"`
      );
    }
  }
}
