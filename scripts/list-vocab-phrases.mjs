/**
 * list-vocab-phrases.mjs
 *
 * Lists all entries with "part": "phrase" from vocab-*.json files.
 * Auto-classifies each as:
 *   keep   — compound noun/adj concept, transparent meaning (Type B)
 *   move   — fixed expression, greeting formula, discourse marker (Type A)
 *   review — ambiguous, needs manual decision
 *
 * Output: scripts/phrase-review.tsv  (also prints to console)
 *
 * Usage:
 *   node scripts/list-vocab-phrases.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const dataDir = join(projectRoot, 'src/lib/data');

const VOCAB_FILES = [
  'vocab-a1.json',
  'vocab-a2.json',
  'vocab-b1.json',
  'vocab-b2.json',
  'vocab-c.json'
];

// ---------- Classification heuristics ----------

// Greetings / farewells / fixed social formulas (often start with "god", "ha det", etc.)
const GREETING_PREFIXES = [
  'god ',
  'ha det',
  'på gjensyn',
  'takk for',
  'unnskyld',
  'vær så',
  'velkommen',
  'lykke til',
  'gratulerer',
  'god jul',
  'godt nytt',
  'til lykke'
];

// Discourse markers & connective phrases (typically adverbial chunks)
const DISCOURSE_MARKERS = [
  'på den ene siden',
  'på den andre siden',
  'etter min mening',
  'for eksempel',
  'det vil si',
  'med andre ord',
  'i tillegg',
  'på grunn av',
  'til tross for',
  'i stedet for',
  'på en måte',
  'alt i alt',
  'når det gjelder',
  'med tanke på',
  'i forhold til',
  'forutsatt at',
  'i lys av',
  'med utgangspunkt i',
  'i forbindelse med',
  'på bakgrunn av',
  'sett i sammenheng'
];

// Words that strongly signal a transparent compound concept (Type B)
const COMPOUND_CONCEPT_SIGNALS = [
  'energi',
  'mangfold',
  'oppvarming',
  'infrastruktur',
  'økonomi',
  'politikk',
  'diskurs',
  'metode',
  'rammeverk',
  'intelligens',
  'nettverk',
  'marked',
  'utvikling',
  'forskning',
  'rettighet',
  'system',
  'modell',
  'prosess',
  'analyse',
  'strategi',
  'prinsipp',
  'ressurs',
  'teknologi'
];

// Preposition + noun patterns that are idiomatic fixed expressions
const FIXED_PREP_PATTERNS = /^(til|på|i|for|av|med|uten|ved|fra|om)\s/i;

// Infinitive marker — phrase contains a verb in infinitive → likely fixed expression
const CONTAINS_INFINITIVE = /\bå\s+\w+/;

function classify(entry) {
  const norsk = entry.norsk.toLowerCase().trim();
  const words = norsk.split(/\s+/);

  // Full sentence (contains question mark, exclamation, or is very long)
  if (norsk.includes('?') || norsk.includes('!') || words.length > 6) {
    return { suggestion: 'move', reason: 'full sentence or very long phrase' };
  }

  // Greeting / farewell formula
  if (GREETING_PREFIXES.some((p) => norsk.startsWith(p))) {
    return { suggestion: 'move', reason: 'greeting/farewell formula' };
  }

  // Known discourse marker
  if (DISCOURSE_MARKERS.some((m) => norsk === m || norsk.startsWith(m))) {
    return { suggestion: 'move', reason: 'discourse marker / connective' };
  }

  // Contains å + verb → fixed expression with infinitive
  if (CONTAINS_INFINITIVE.test(norsk)) {
    return { suggestion: 'move', reason: 'contains infinitive (fixed expression)' };
  }

  // Short preposition phrase (til fots, for alltid, i tide…) → idiomatic
  if (FIXED_PREP_PATTERNS.test(norsk) && words.length <= 3) {
    return { suggestion: 'move', reason: 'short prepositional fixed expression' };
  }

  // Compound concept signal word present
  if (COMPOUND_CONCEPT_SIGNALS.some((s) => norsk.includes(s))) {
    return { suggestion: 'keep', reason: 'compound noun/adj concept (transparent)' };
  }

  // Short (≤3 words), no verb, no prep start → likely compound concept
  if (words.length <= 3 && !FIXED_PREP_PATTERNS.test(norsk) && !CONTAINS_INFINITIVE.test(norsk)) {
    return { suggestion: 'keep', reason: 'short compound, no verb, no prep' };
  }

  // Longer prepositional phrase (4-6 words) — ambiguous
  return { suggestion: 'review', reason: 'ambiguous — check manually' };
}

// ---------- Main ----------

const rows = [];
let totalPhrases = 0;
const counts = { keep: 0, move: 0, review: 0 };

for (const filename of VOCAB_FILES) {
  const filepath = join(dataDir, filename);
  let entries;
  try {
    entries = JSON.parse(readFileSync(filepath, 'utf-8'));
  } catch (e) {
    console.error(`Failed to read ${filename}: ${e.message}`);
    continue;
  }

  const phrases = entries.filter((e) => e.part === 'phrase');
  totalPhrases += phrases.length;

  for (const entry of phrases) {
    const { suggestion, reason } = classify(entry);
    counts[suggestion]++;
    rows.push({
      file: filename,
      id: entry.id,
      norsk: entry.norsk,
      english: entry.english,
      level: entry.level,
      category: entry.category,
      suggestion,
      reason
    });
  }
}

// ---------- TSV output ----------

const header = ['file', 'id', 'norsk', 'english', 'level', 'category', 'suggestion', 'reason'];
const tsvLines = [
  header.join('\t'),
  ...rows.map((r) => header.map((h) => (r[h] ?? '').toString().replace(/\t/g, ' ')).join('\t'))
];
const tsvPath = join(__dirname, 'phrase-review.tsv');
writeFileSync(tsvPath, tsvLines.join('\n'), 'utf-8');

// ---------- Console summary ----------

console.log('\n=== Vocab phrase entries ===\n');
console.log(`Total phrase entries: ${totalPhrases}`);
console.log(`  keep   (Type B compound): ${counts.keep}`);
console.log(`  move   (Type A expression): ${counts.move}`);
console.log(`  review (ambiguous): ${counts.review}`);
console.log(`\nFull list written to: scripts/phrase-review.tsv\n`);

// Print move + review to console for quick scan
const toCheck = rows.filter((r) => r.suggestion !== 'keep');
if (toCheck.length > 0) {
  console.log('--- Entries to move or review ---');
  const pad = (s, n) => s.padEnd(n);
  console.log(
    pad('SUGGESTION', 10) + pad('FILE', 16) + pad('ID', 32) + pad('NORSK', 40) + 'REASON'
  );
  console.log('-'.repeat(120));
  for (const r of toCheck) {
    console.log(
      pad(r.suggestion.toUpperCase(), 10) +
        pad(r.file, 16) +
        pad(r.id, 32) +
        pad(r.norsk, 40) +
        r.reason
    );
  }
}
