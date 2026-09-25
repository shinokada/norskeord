// Read-only lookup for fuzzy-duplicate bucket A (see fuzzy-dupes.mjs output).
// For each candidate group it prints, per entry: id, file (= level + type),
// norsk, part, english, the example sentence, plus
//   - legacy keys in id-migration-map.json that point at the id
//     (a deleted id with a legacy key needs a migration remap), and
//   - how many lines in decisions/*.jsonl mention the id (a deleted id that
//     is named there can flip status.mjs to conflict/pending).
// It also prints a PROPOSED KEEP using the agreed rule: lowest level wins;
// on a tie the bare (fewer-word) form wins; then the lower id.
// It changes nothing.
//
// Usage: node scripts/reclass/lookup-fuzzy-a.mjs > scripts/outputs/lookup-fuzzy-a.txt
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, DECISIONS_DIR, loadJSON, normTextIgnoreA } from './lib.mjs';

const groups = [
  ['leve av', 'w-008016', 'w-010154'],
  ['ta med', 'w-008244', 'w-001543'],
  ['heie på', 'w-008152', 'w-005575'],
  ['såre', 'w-002568', 'w-010425'],
  ['finne ut', 'w-002909', 'w-005615'],
  ['melde seg inn', 'w-001520', 'w-002940'],
  ['foreta seg', 'w-005633', 'w-007171'],
  ['klamre seg til', 'w-003789', 'w-006209'],
  ['droppe', 'w-004221', 'w-007618'],
  ['skåne', 'w-005113', 'w-007505'],
  ['gå opp for', 'w-002922', 'w-006860', 'w-007514'],
  ['få nyss om', 'w-007004', 'w-007533'],
  ['ense', 'w-006631', 'w-007079'],
  ['dra kjensel på', 'w-006422', 'w-006784'],
  ['gi seg hen', 'w-006881', 'w-007735', 'w-007808'],
  ['plaffe løs', 'w-007538', 'w-007772'],
  ['gå ut over / utover', 'w-002923', 'w-010444'],
  ['tolk / tolke', 'w-002310', 'w-004904'],
  ['natur / naturen', 'w-002023', 'w-000844'],
  ['ytringsfrihet(en)', 'w-002501', 'w-005437'],
  ['grumset / grumsete', 'w-007363', 'w-006486'],
  ['låne øre til', 'w-009368', 'w-009485'],
  ['ta seg (selv) i nakken', 'w-009547', 'w-009709'],
  ['ta (noe) for god fisk', 'w-008587', 'w-009126'],
  ['lure (noen) trill rundt', 'w-008757', 'w-009289'],
  ['det gikk opp for meg/henne', 'w-008316', 'w-009923'],
  ['komme til bunns i', 'w-010196', 'w-009566'],
  ['holde med', 'w-001524', 'w-009947'],
  ['holde av', 'w-006417', 'w-009948'],
  ['bite seg merke i', 'w-006629', 'w-009734'],
  ['sette fingeren på', 'w-009217', 'w-006539'],
  ['by imot', 'w-009492', 'w-007178'],
  ['stikke til noen noe', 'w-007529', 'w-009382']
];

const LEVEL_RANK = { a1: 1, a2: 2, b1: 3, b2: 4, c: 5 };

// id -> { file, type, level, entry }
const all = new Map();
for (const file of fs.readdirSync(DATA_DIR)) {
  const m = /^(vocab|uttrykk)-(a1|a2|b1|b2|c)\.json$/.exec(file);
  if (!m) continue;
  for (const e of loadJSON(path.join(DATA_DIR, file))) {
    if (e.id) all.set(e.id, { file, type: m[1], level: m[2], entry: e });
  }
}

// legacy key -> id, inverted
const migMap = loadJSON(path.join(DATA_DIR, 'id-migration-map.json'));
const legacyByTarget = new Map();
for (const [k, v] of Object.entries(migMap)) {
  if (!legacyByTarget.has(v)) legacyByTarget.set(v, []);
  legacyByTarget.get(v).push(k);
}

// id -> ["b2.jsonl#batch", ...] from the decision logs
const mentions = new Map();
for (const f of fs.readdirSync(DECISIONS_DIR)) {
  if (!f.endsWith('.jsonl') || f === 'migration-remaps.jsonl') continue;
  const lines = fs.readFileSync(path.join(DECISIONS_DIR, f), 'utf8').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    for (const id of line.match(/w-\d{6}/g) || []) {
      if (!mentions.has(id)) mentions.set(id, []);
      let batch = '';
      try {
        const d = JSON.parse(line);
        batch = `${d.type}${d.batch != null ? ' b' + d.batch : ''}`;
      } catch {
        // Line is not valid JSON; keep an empty batch label.
      }
      mentions.get(id).push(`${f}:${batch}`);
    }
  }
}

const wc = (s) => normTextIgnoreA(s).split(/\s+/).filter(Boolean).length;
const clip = (s, n = 110) => (s && s.length > n ? s.slice(0, n) + '…' : s || '');

let missing = 0;
for (const [label, ...ids] of groups) {
  console.log(`\n=== ${label} ===`);
  const found = [];
  for (const id of ids) {
    const rec = all.get(id);
    if (!rec) {
      console.log(`  ${id}  NOT FOUND ON DISK`);
      missing++;
      continue;
    }
    found.push(rec);
    const e = rec.entry;
    const legacy = legacyByTarget.get(id) || [];
    const ment = mentions.get(id) || [];
    console.log(`  ${id}  [${rec.file}]  "${e.norsk}"  part=${e.part ?? '-'}  ${e.theme ? 'theme=' + e.theme : ''}`);
    console.log(`      en:  ${clip(e.english)}`);
    console.log(`      ex:  ${clip(e.example)}  =>  ${clip(e.example_english)}`);
    console.log(
      `      legacy keys: ${legacy.length ? legacy.join(', ') : '(none)'}   log mentions: ${ment.length ? ment.join('; ') : '(none)'}`
    );
  }
  if (found.length >= 2) {
    const ranked = [...found].sort(
      (a, b) =>
        LEVEL_RANK[a.level] - LEVEL_RANK[b.level] ||
        wc(a.entry.norsk) - wc(b.entry.norsk) ||
        a.entry.id.localeCompare(b.entry.id)
    );
    const keep = ranked[0];
    const types = new Set(found.map((f) => f.type));
    console.log(
      `  -> PROPOSED KEEP ${keep.entry.id}; delete ${ranked
        .slice(1)
        .map((r) => r.entry.id)
        .join(', ')}${types.size > 1 ? '   [CROSS-TYPE: vocab vs uttrykk, judge by hand]' : ''}`
    );
  }
}
console.log(`\nSUMMARY: ${groups.length} groups, ${missing} id(s) not found on disk`);
