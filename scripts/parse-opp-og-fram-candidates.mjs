#!/usr/bin/env node
/**
 * parse-opp-og-fram-candidates.mjs
 *
 * "Step 1" equivalent (see ai-docs/instructions/work-flow.md /
 * image-converter-c.md conventions) for the B1 *Opp og fram!* arbeidsbok
 * pipeline — but instead of reading a photo, it reads the already-decided
 * candidate files from draft/b1/opp-og-fram-arbeidsbok/data/ (see §8/§9 in
 * the plan doc) and converts each raw textbook entry into the same
 * {id, norsk, lemma, definition, level, part, category} shape that
 * enrich-vocab.mjs --level b1 expects as input.
 *
 * Input:
 *   draft/b1/opp-og-fram-arbeidsbok/data/candidates-vocab.json    (811)
 *   draft/b1/opp-og-fram-arbeidsbok/data/candidates-uttrykk.json  (125)
 *
 * Output:
 *   draft/b1/extracted-vocab-b1.json
 *   draft/b1/extracted-uttrykk-b1.json
 *   draft/b1/opp-og-fram-arbeidsbok/data/parse-flags.json  (anything that
 *     needed a fallback/default decision, for manual spot-check)
 *
 * Conventions applied (matching ai-docs/instructions/image-converter-c.md
 * Rules 2/4/5, adapted for this source format):
 *   - Noun gender shorthand -> (en)/(et)/(pl.). Dual m/f-style markers
 *     ("f/m", "m/f", "fm") collapse to (en) — matches production data,
 *     which never stores a dual/ei marker for B1. "m/n" also -> (en).
 *   - Verb shorthand (v1-v4, ureg., reg, s-verb, or a dash-separated
 *     principal-parts form like "bar – har båret") -> part: "verb",
 *     marker stripped, "å " kept exactly as already present in the source
 *     (compound-verb-table entries have no "å" in the source and get one
 *     prepended; vokabular-table verb entries already have it).
 *   - adj./adv./pron. -> adjective/adverb/pronoun, marker stripped, no
 *     replacement marker added (matches how these are stored bare).
 *   - Markdown ** / * wrapping is stripped from raw_term and context.
 *   - context -> definition: strip a leading "her: " prefix, collapse
 *     whitespace. Norwegian « » quotes are left as-is (real punctuation,
 *     not markdown).
 *   - compound-verb-table entries (no marker at all, verb always first
 *     word): "å " is prepended to the whole raw_term. definition is
 *     synthesized from the "fast sammensatt: X" / "løst sammensatt: X"
 *     cross-reference as "Betyr det samme som å X."
 *   - compound-verb-derived-noun entries: gender read off the trailing
 *     marker (defaults to (en) with a flag if missing/unrecognized).
 *     definition synthesized from "avledet av: X / Y" as
 *     "Substantivet av å X."
 *   - Two known cross-file duplicates (same textbook entry landed in both
 *     candidates-vocab.json as a bold-markdown near-duplicate AND in
 *     candidates-uttrykk.json via the §9 review decision) are dropped from
 *     the vocab side: "å bli varm om hjertet", "å ta seg en liten runde"
 *     (both correctly decided "uttrykk" in the plan doc's §9 log).
 *   - candidates-uttrykk.json's stray "part": "verb" values (a leftover
 *     artifact from apply-review-decisions.mjs, present on 75 of the 125
 *     entries) are ignored — every uttrykk entry is written with
 *     part: "phrase", category: "uttrykk", matching production data.
 *
 * This script is pure data transformation — no API calls, deterministic,
 * safe to re-run (it always overwrites its two output files from the
 * current candidate files on disk).
 *
 * Usage:
 *   node scripts/parse-opp-og-fram-candidates.mjs
 *   node scripts/parse-opp-og-fram-candidates.mjs --dry-run
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const dryRun = process.argv.includes('--dry-run');

const paths = {
  candidatesVocab: path.join(
    PROJECT_ROOT,
    'draft/b1/opp-og-fram-arbeidsbok/data/candidates-vocab.json'
  ),
  candidatesUttrykk: path.join(
    PROJECT_ROOT,
    'draft/b1/opp-og-fram-arbeidsbok/data/candidates-uttrykk.json'
  ),
  outVocab: path.join(PROJECT_ROOT, 'draft/b1/extracted-vocab-b1.json'),
  outUttrykk: path.join(PROJECT_ROOT, 'draft/b1/extracted-uttrykk-b1.json'),
  flags: path.join(PROJECT_ROOT, 'draft/b1/opp-og-fram-arbeidsbok/data/parse-flags.json')
};

// Known cross-file duplicates to drop from the vocab side (see header note).
const VOCAB_DUPES_TO_DROP = new Set(['å bli varm om hjertet', 'å ta seg en liten runde']);

const FLAGS = [];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function stripMarkdown(s) {
  return s.replaceAll('**', '').replaceAll('*', '');
}

function cleanDefinition(ctx) {
  let d = stripMarkdown(ctx).trim();
  d = d.replace(/^\s*her:\s*/i, '');
  d = d.replace(/\s+/g, ' ').trim();
  return d;
}

function normKey(s) {
  let k = s.replaceAll('*', '');
  k = k.replace(/\([^)]*\)/g, '');
  k = k.replace(/\s+/g, ' ').trim().toLowerCase();
  return k;
}

// Classify one parenthetical marker group. Returns [kind, value].
function classifyGroup(raw) {
  const g = raw.trim();
  const low = g.toLowerCase();

  if (low === 'adj.' || low === 'adj') return ['adjective', null];
  if (low === 'adv.' || low === 'adv') return ['adverb', null];
  if (low === 'pron.' || low === 'pron') return ['pronoun', null];
  if (/^v[1-4](\s*,\s*v[1-4])*$/.test(low)) return ['verb', null];
  if (['ureg.', 'ureg', 'reg', 'reg.', 's-verb'].includes(low)) return ['verb', null];
  // Dash-separated principal parts, e.g. "bar – har båret" or
  // "v1, v2 + talte – har talt" — always contains an en-dash "–".
  if (g.includes('–')) return ['verb', null];

  const pluralMatch = low.match(/^(m|n|f)\s*,\s*pl$/);
  if (pluralMatch) return ['noun-plural', 'pl.'];

  const gnorm = low.replace(/\s+/g, '');
  if (['m', 'fm', 'f/m', 'm/f'].includes(gnorm)) return ['noun', 'en'];
  if (gnorm === 'n') return ['noun', 'et'];
  if (['m/n', 'n/m'].includes(gnorm)) return ['noun', 'en'];
  if (gnorm === 'f') return ['noun', 'en'];

  if (low.endsWith('.') && low.length <= 6) return ['abbrev', null];

  return ['unknown', g];
}

/**
 * Parse one vokabular-table-style raw_term (used for both plain vocab
 * entries and every uttrykk entry, which always resolves to phrase).
 */
function parseVokabularEntry(rawTerm, isUttrykk) {
  const text = stripMarkdown(rawTerm);
  const groups = [...text.matchAll(/\(([^)]*)\)/g)].map((m) => classifyGroup(m[1]));

  let noParen = text.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();

  // Drop a stray trailing alt-form after an en-dash outside any parens,
  // e.g. "rot  – røtter" -> "rot" (irregular plural, not stored). Only
  // applied on the vocab side — uttrykk phrases can legitimately contain
  // a dash as punctuation and are left untouched.
  let dashTail = null;
  if (!isUttrykk) {
    const dm = noParen.match(/^(.*?)\s*–\s*(\S.*)$/);
    if (dm) {
      const head = dm[1].trim();
      const tail = dm[2].trim();
      if (head && tail.split(/\s+/).length <= 3) {
        noParen = head;
        dashTail = tail;
      }
    }
  }

  if (isUttrykk) {
    return {
      part: 'phrase',
      norsk: noParen,
      lemma: noParen.replace(/^å /, '')
    };
  }

  const found = new Map();
  for (const [kind, val] of groups) {
    if (!found.has(kind)) found.set(kind, val);
  }

  let part = null;
  let gender = null;

  if (found.has('verb')) {
    part = 'verb';
  } else if (found.has('noun-plural')) {
    part = 'noun';
    gender = 'pl.';
  } else if (found.has('noun')) {
    part = 'noun';
    gender = found.get('noun');
  } else if (found.has('adjective')) {
    part = 'adjective';
  } else if (found.has('adverb')) {
    part = 'adverb';
  } else if (found.has('pronoun')) {
    part = 'pronoun';
  } else if (found.has('unknown')) {
    if (noParen.startsWith('å ')) {
      part = 'verb';
      FLAGS.push({
        raw_term: rawTerm,
        reason: `unrecognized marker "${found.get('unknown')}", defaulted to verb (already å-prefixed)`
      });
    } else {
      FLAGS.push({ raw_term: rawTerm, reason: `unknown marker: ${found.get('unknown')}` });
    }
  } else {
    part = noParen.startsWith('å ') ? 'verb' : 'noun';
  }

  let norsk = noParen;
  let lemma = noParen;
  if (part === 'noun' && gender) {
    norsk = `${noParen} (${gender})`;
    lemma = noParen;
  } else if (part === 'verb') {
    lemma = noParen.replace(/^å /, '');
  }

  if (dashTail) {
    FLAGS.push({ raw_term: rawTerm, reason: `dropped trailing alt-form "${dashTail}"` });
  }
  if (!part) {
    FLAGS.push({ raw_term: rawTerm, reason: 'could not determine part — needs manual review' });
  }

  return { part, norsk, lemma };
}

function buildUttrykk(candidates) {
  return candidates.map((e) => {
    const parsed = parseVokabularEntry(e.raw_term, true);
    return {
      id: '',
      norsk: parsed.norsk,
      lemma: parsed.lemma,
      definition: cleanDefinition(e.context),
      level: 'B1',
      category: 'uttrykk',
      part: 'phrase'
    };
  });
}

function buildVocab(candidates) {
  const out = [];
  const skipped = [];

  for (const e of candidates) {
    const key = normKey(e.raw_term);
    if (VOCAB_DUPES_TO_DROP.has(key)) {
      skipped.push(e.raw_term);
      continue;
    }

    if (e.source === 'compound-verb-table') {
      const base = e.raw_term.trim();
      const norsk = `å ${base}`;
      const lemma = base;
      const m = e.context.match(/(fast|løst) sammensatt:\s*([^;]+);/);
      let definition = '';
      if (m) {
        const partner = m[2].trim();
        const partnerAa = partner.startsWith('å ') ? partner : `å ${partner}`;
        definition = `Betyr det samme som ${partnerAa}.`;
      } else {
        FLAGS.push({ raw_term: e.raw_term, reason: 'could not parse compound-verb-table context' });
      }
      out.push({ id: '', norsk, lemma, definition, level: 'B1', part: 'verb' });
      continue;
    }

    if (e.source === 'compound-verb-derived-noun') {
      const raw = e.raw_term;
      const gm = raw.match(/\(([^)]*)\)\s*$/);
      const base = raw.replace(/\s*\([^)]*\)\s*$/, '').trim();
      let gender = 'en';
      if (gm) {
        const [kind, val] = classifyGroup(gm[1]);
        if (kind === 'noun' || kind === 'noun-plural') {
          gender = val;
        } else {
          FLAGS.push({
            raw_term: raw,
            reason: `unrecognized derived-noun gender marker "${gm[1]}", defaulted to en`
          });
        }
      } else {
        FLAGS.push({ raw_term: raw, reason: 'derived-noun missing gender marker, defaulted to en' });
      }
      const norsk = `${base} (${gender})`;
      const lemma = base;
      const m = e.context.match(/avledet av:\s*([^/]+)\s*\/\s*(.+)/);
      let definition = '';
      if (m) {
        const verb1 = m[1].trim();
        const verb1Aa = verb1.startsWith('å ') ? verb1 : `å ${verb1}`;
        definition = `Substantivet av ${verb1Aa}.`;
      } else {
        FLAGS.push({ raw_term: raw, reason: 'could not parse derived-noun context' });
      }
      out.push({ id: '', norsk, lemma, definition, level: 'B1', part: 'noun' });
      continue;
    }

    // vokabular-table (default case)
    const parsed = parseVokabularEntry(e.raw_term, false);
    out.push({
      id: '',
      norsk: parsed.norsk,
      lemma: parsed.lemma,
      definition: cleanDefinition(e.context),
      level: 'B1',
      part: parsed.part
    });
  }

  return { out, skipped };
}

function main() {
  console.log('🧩  parse-opp-og-fram-candidates.mjs');
  console.log(`    Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);

  const candidatesVocab = readJson(paths.candidatesVocab);
  const candidatesUttrykk = readJson(paths.candidatesUttrykk);

  const uttrykk = buildUttrykk(candidatesUttrykk);
  const { out: vocab, skipped } = buildVocab(candidatesVocab);

  console.log(`\n📄  candidates-vocab.json:   ${candidatesVocab.length} in -> ${vocab.length} out`);
  if (skipped.length) {
    console.log(`    Dropped as cross-file duplicates (see header note):`);
    for (const s of skipped) console.log(`      - ${s}`);
  }
  console.log(`📄  candidates-uttrykk.json: ${candidatesUttrykk.length} in -> ${uttrykk.length} out`);

  if (FLAGS.length) {
    console.log(`\n🟡  ${FLAGS.length} entries flagged for manual spot-check:`);
    for (const f of FLAGS) console.log(`    - ${f.raw_term}  —  ${f.reason}`);
  }

  if (dryRun) {
    console.log('\n🔍  DRY RUN — no files written.');
    return;
  }

  fs.writeFileSync(paths.outVocab, JSON.stringify(vocab, null, 2) + '\n', 'utf8');
  fs.writeFileSync(paths.outUttrykk, JSON.stringify(uttrykk, null, 2) + '\n', 'utf8');
  fs.writeFileSync(paths.flags, JSON.stringify(FLAGS, null, 2) + '\n', 'utf8');

  console.log(`\n✅  Wrote ${vocab.length} entries -> ${path.relative(PROJECT_ROOT, paths.outVocab)}`);
  console.log(`✅  Wrote ${uttrykk.length} entries -> ${path.relative(PROJECT_ROOT, paths.outUttrykk)}`);
  console.log(`✅  Wrote ${FLAGS.length} flags -> ${path.relative(PROJECT_ROOT, paths.flags)}`);
  console.log('\nNext: node scripts/enrich-vocab.mjs --level b1');
}

main();
