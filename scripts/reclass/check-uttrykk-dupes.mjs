// Safety check: confirm none of the 6 reverse-move targets already has
// a duplicate entry sitting in uttrykk-b2.json (the "komme til orde"
// case, where the old uttrykk id had to be reused instead of reinserting
// under the vocab id).
import { levelDataPaths, loadJSON, normTextIgnoreA } from './lib.mjs';

const targets = [
  'å få noen til å gjøre noe',
  'å nyte godt av',
  'å bære galt av sted',
  'å blåne seg',
  'å få det til',
  'å snu opp ned på noe'
];

const { uttrykk: uttrykkPath } = levelDataPaths('b2');
const uttrykk = loadJSON(uttrykkPath);

for (const t of targets) {
  const norm = normTextIgnoreA(t);
  const match = uttrykk.find(
    (e) => normTextIgnoreA(e.norsk) === norm || normTextIgnoreA(e.lemma) === norm
  );
  console.log(
    `${t}: ${match ? `FOUND existing uttrykk entry ${match.id}` : 'no existing uttrykk entry'}`
  );
}
