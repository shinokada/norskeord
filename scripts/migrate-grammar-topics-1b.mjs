#!/usr/bin/env node
/**
 * migrate-grammar-topics-1b.mjs
 *
 * One-off data migration for Phase 1b of
 * ai-docs/implementation/grammar-update.md. Edits src/lib/data/grammar.json:
 *
 *   1. Splits topic `helsetninger` (42 questions) by prompt:
 *        "Fortellende setning …"                          -> fortellende-setninger  (4)
 *        "Spørresetning …" / "Lag et spørsmål …" /
 *        "Du vil vite …"                                  -> sporresetninger        (21)
 *        "Helsetning med ikke …"                          -> ikke-placement         (5)
 *        "Setning med det som subjekt …" /
 *        "Velg riktig setning med presenterende …"        -> vaer-det-subjekt       (12)
 *   2. Merges `uttrykk-gjenkjenning-c-1/2/3` and `-detgaarbra-c` (224
 *      questions) into `uttrykk` and labels them in sets of 25 with the new
 *      optional `set` field ("uttrykk-1" … "uttrykk-9"), in the original
 *      order (c-1, c-2, c-3, detgaarbra-c).
 *
 * Question ids and every other field are left untouched (progress is keyed
 * by question id). The file is edited line by line, NOT re-serialised, so the
 * Prettier formatting of grammar.json is preserved and the git diff only
 * shows `"topic"` lines (plus the new `"set"` lines).
 *
 * Safe by construction:
 *   - Re-parses the result and checks every question against the plan
 *     before writing anything; aborts without writing on any mismatch.
 *   - Idempotent: if nothing is left to migrate it says so and exits 0.
 *
 * Usage (from project root):
 *   node scripts/migrate-grammar-topics-1b.mjs --dry-run   # report only
 *   node scripts/migrate-grammar-topics-1b.mjs             # apply
 *   pnpm grammar:split                                     # then regenerate the per-level files
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_FILE = resolve(__dirname, '../src/lib/data/grammar.json');
const DRY_RUN = process.argv.includes('--dry-run');

const HELSETNINGER_GROUPS = [
  [/^Fortellende setning/, 'fortellende-setninger'],
  [/^Spørresetning/, 'sporresetninger'],
  [/^Lag et spørsmål/, 'sporresetninger'],
  [/^Du vil vite/, 'sporresetninger'],
  [/^Helsetning med ikke/, 'ikke-placement'],
  [/^Setning med det som subjekt/, 'vaer-det-subjekt'],
  [/^Velg riktig setning med presenterende/, 'vaer-det-subjekt']
];
const EXPECTED_HELSETNINGER = {
  'fortellende-setninger': 4,
  sporresetninger: 21,
  'ikke-placement': 5,
  'vaer-det-subjekt': 12
};

const UTTRYKK_OLD = [
  'uttrykk-gjenkjenning-c-1',
  'uttrykk-gjenkjenning-c-2',
  'uttrykk-gjenkjenning-c-3',
  'uttrykk-gjenkjenning-detgaarbra-c'
];
const UTTRYKK_EXPECTED_TOTAL = 224;
const SET_SIZE = 25;

function fail(msg) {
  console.error(`\n❌  ${msg}\nNothing was written.`);
  process.exit(1);
}

/** Key-order-independent deep serialisation, for comparing question objects. */
function canon(value) {
  if (Array.isArray(value)) return `[${value.map(canon).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canon(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

const raw = readFileSync(SRC_FILE, 'utf-8');
const questions = JSON.parse(raw);
if (!Array.isArray(questions)) fail('grammar.json did not parse to an array');

// ---------------------------------------------------------------------------
// 1. Build the plan: question id -> { topic, set? }
// ---------------------------------------------------------------------------
const plan = new Map();

const helsetninger = questions.filter((q) => q.topic === 'helsetninger');
const helsetningerCounts = {};
for (const q of helsetninger) {
  const prompt = q.prompt ?? '';
  const group = HELSETNINGER_GROUPS.find(([re]) => re.test(prompt));
  if (!group)
    fail(`helsetninger question ${q.id} has an unrecognised prompt: ${JSON.stringify(prompt)}`);
  plan.set(q.id, { topic: group[1] });
  helsetningerCounts[group[1]] = (helsetningerCounts[group[1]] ?? 0) + 1;
}

const uttrykk = UTTRYKK_OLD.flatMap((topic) => questions.filter((q) => q.topic === topic));
uttrykk.forEach((q, i) => {
  plan.set(q.id, { topic: 'uttrykk', set: `uttrykk-${Math.floor(i / SET_SIZE) + 1}` });
});

if (plan.size === 0) {
  const alreadyDone = questions.some((q) => q.topic === 'uttrykk' && q.set);
  console.log(
    alreadyDone
      ? '✅  Nothing to migrate: grammar.json is already on the Phase 1b topics.'
      : '⚠️  No old topics found, but no `uttrykk` sets either. Check grammar.json.'
  );
  process.exit(alreadyDone ? 0 : 1);
}

// Pre-flight checks against what the audit found.
if (helsetninger.length !== 0) {
  for (const [topic, expected] of Object.entries(EXPECTED_HELSETNINGER)) {
    if (helsetningerCounts[topic] !== expected) {
      fail(
        `Expected ${expected} helsetninger question(s) to go to ${topic}, found ${helsetningerCounts[topic] ?? 0}. ` +
          'The data changed since the audit; review before migrating.'
      );
    }
  }
}
if (uttrykk.length !== 0 && uttrykk.length !== UTTRYKK_EXPECTED_TOTAL) {
  fail(
    `Expected ${UTTRYKK_EXPECTED_TOTAL} uttrykk-gjenkjenning questions, found ${uttrykk.length}.`
  );
}

// ---------------------------------------------------------------------------
// 2. Apply with line-level edits (preserves Prettier formatting)
// ---------------------------------------------------------------------------
const ID_RE = /^( {4})"id": "([^"]+)",$/;
const TOPIC_RE = /^( {4})"topic": "([^"]+)",$/;

const lines = raw.split('\n');
const out = [];
let currentId = null;
let edited = 0;
const touched = new Set();

for (const line of lines) {
  const idMatch = ID_RE.exec(line);
  if (idMatch) {
    currentId = idMatch[2];
    out.push(line);
    continue;
  }
  const topicMatch = TOPIC_RE.exec(line);
  if (topicMatch && currentId && plan.has(currentId) && !touched.has(currentId)) {
    const { topic, set } = plan.get(currentId);
    out.push(`${topicMatch[1]}"topic": "${topic}",`);
    if (set) out.push(`${topicMatch[1]}"set": "${set}",`);
    touched.add(currentId);
    edited++;
    continue;
  }
  out.push(line);
}

if (touched.size !== plan.size) {
  fail(`Planned ${plan.size} edits but only found ${touched.size} matching "topic" lines.`);
}

const next = out.join('\n');

// ---------------------------------------------------------------------------
// 3. Verify the result against the plan before writing
// ---------------------------------------------------------------------------
let after;
try {
  after = JSON.parse(next);
} catch (e) {
  fail(`Result is not valid JSON: ${e.message}`);
}
if (after.length !== questions.length) fail('Question count changed.');

for (let i = 0; i < questions.length; i++) {
  const before = questions[i];
  const expected = { ...before };
  const change = plan.get(before.id);
  if (change) {
    expected.topic = change.topic;
    if (change.set) expected.set = change.set;
  }
  if (after[i].id !== before.id) fail(`Question order/id changed at index ${i}.`);
  if (canon(after[i]) !== canon(expected)) {
    fail(`Question ${before.id} differs from the plan beyond topic/set.`);
  }
}

const left = after.filter((q) => q.topic === 'helsetninger' || UTTRYKK_OLD.includes(q.topic));
if (left.length > 0) fail(`${left.length} question(s) still use an old topic.`);

// ---------------------------------------------------------------------------
// 4. Report and write
// ---------------------------------------------------------------------------
const setCounts = {};
for (const { set } of plan.values()) if (set) setCounts[set] = (setCounts[set] ?? 0) + 1;

console.log('Plan:');
for (const [topic, n] of Object.entries(helsetningerCounts)) {
  console.log(`  helsetninger -> ${topic}: ${n}`);
}
console.log(
  `  uttrykk-gjenkjenning-* -> uttrykk: ${uttrykk.length} in ${Object.keys(setCounts).length} sets`
);
console.log(`  set sizes: ${Object.values(setCounts).join(', ')}`);
console.log(`  question lines edited: ${edited}`);

if (DRY_RUN) {
  console.log('\n(dry run) Nothing was written.');
  process.exit(0);
}

writeFileSync(SRC_FILE, next, 'utf-8');
console.log('\n✅  grammar.json migrated. Now run: pnpm grammar:split');
