#!/usr/bin/env node
/**
 * fix-audit-issues.mjs
 *
 * Closes the loop on audit-translations.mjs. That script only ever reports
 * problems (JSON/txt under scripts/outputs/) — it never writes back to the
 * draft/production data. This script reads one or more of those audit
 * reports, sends each flagged entry + the auditor's comment to Claude, and
 * writes the corrected field(s) back into the actual vocab-* / uttrykk-*
 * file in place.
 *
 * Unlike the diacritic fixers (find-diacritic-issues*.mjs, deterministic
 * word-map substitution), most audit findings are NOT mechanical character
 * swaps — wrong tense ("wurde"→"würde"), wrong word ("gå" used for "ga"),
 * grammatical agreement, wrong headword spelling, unnatural phrasing, etc.
 * Fixing these needs judgment, so this script asks Claude to correct only
 * the exact fields flagged, using the audit comment as the instruction —
 * the same approach as enrich-vocab.mjs, but repair instead of generation.
 *
 * Two field categories are handled differently:
 *   - Translation/example/headword fields (spanish, example_german, norsk,
 *     …) → sent to Claude for correction, one batch of entries per API call.
 *   - "level" and "part" (CEFR level / part-of-speech reclassification) →
 *     skipped by default. These are editorial judgment calls, not text
 *     fixes — override with --include-level / --include-part if you want
 *     Claude's opinion applied automatically anyway.
 *
 * The audit's own field names are occasionally inconsistent (Claude, when
 * auditing, sometimes writes "example (norsk)" or "example_norsk" instead
 * of the real field name "example") — normalizeFieldName() below maps known
 * variants back to the actual JSON key. Anything it can't confidently map
 * is skipped and listed under "skipped-unmapped-field" in the output
 * report rather than silently creating a bogus new key on the entry.
 *
 * After writing corrected fields, every touched entry is re-run through the
 * same Norwegian/German/Spanish diacritic safety net used by
 * enrich-vocab.mjs (scripts/lib/diacritics.mjs), in case Claude's fix
 * reintroduces a degraded character.
 *
 * Usage:
 *   node scripts/fix-audit-issues.mjs --reports scripts/outputs/audit-vocab-a2-draft-2026-07-05T14-28-53.json,scripts/outputs/audit-uttrykk-a2-draft-2026-07-05T14-28-53.json --draft
 *   node scripts/fix-audit-issues.mjs --reports <path> --draft --dry-run
 *   node scripts/fix-audit-issues.mjs --reports <path> --draft --severity error,warning
 *   node scripts/fix-audit-issues.mjs --reports <path> --draft --batch 10
 *   node scripts/fix-audit-issues.mjs --reports <path> --draft --include-level --include-part
 *
 * Options:
 *   --reports         Comma-separated paths to audit-*.json report files (required)
 *   --draft           Target draft/{level}/{kind}-{level}-new.json instead of
 *                      src/lib/data/{kind}-{level}.json. Match whatever --draft
 *                      setting was used for the audit-translations.mjs run that
 *                      produced the report.
 *   --severity        Comma-separated subset of error|warning|info to act on
 *                      (default: error,warning,info — i.e. everything)
 *   --skip-fields     Comma-separated field names to never touch
 *                      (default: level,part)
 *   --include-level   Shorthand for removing "level" from --skip-fields
 *   --include-part    Shorthand for removing "part" from --skip-fields
 *   --batch           Entries per API call (default: 10)
 *   --dry-run         Show what would be sent/changed without calling the
 *                      API or writing files
 *
 * Output:
 *   In place:  the corrected draft/production file (backed up to {file}.bak
 *              first, once per file, before any writes)
 *   Console:   live progress + every applied/skipped change
 *   File:      scripts/outputs/fix-audit-issues-{ts}.json  (full report)
 *   File:      scripts/outputs/fix-audit-issues-{ts}.txt   (human-readable)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  NO_COMMON_WORD_MAP,
  NO_AMBIGUOUS_WORDS,
  degradeNO,
  bareWordNO,
  DE_COMMON_WORD_MAP,
  DE_AMBIGUOUS_WORDS,
  degradeDE,
  ES_COMMON_WORD_MAP,
  ES_AMBIGUOUS_WORDS,
  degradeES,
  bareWordIntl,
  checkLanguage,
  applyFixes,
  findSpanishPunctuationIssues,
  fixSpanishPunctuation
} from './lib/diacritics.mjs';

// NOTE on "ga"/"gå", "fuhren"/"führen", "konnte"/"könnte", "mochte"/"möchte":
// these ASCII forms are genuine, correctly-spelled words in their own
// right (Norwegian/German simple past tenses), not just degraded versions
// of their diacritic'd counterparts. They used to be auto-"fixed" by
// NO_COMMON_WORD_MAP / DE_COMMON_WORD_MAP, which meant this script's
// safety net would silently revert a correct audit fix (e.g. wrong
// "führen" → correct "fuhren") right back to the wrong word, with no
// visible error. They're now excluded at the source in diacritics.mjs
// (moved to NO_AMBIGUOUS_WORDS / DE_AMBIGUOUS_WORDS — reported, never
// auto-fixed), so no local workaround is needed here anymore.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src/lib/data');
const DRAFT_DIR = path.join(PROJECT_ROOT, 'draft');
const OUTPUT_DIR = path.join(__dirname, 'outputs');

const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 2000;
const INTER_BATCH_DELAY_MS = 1200;

// ── CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const hasFlag = (flag) => args.includes(flag);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const reportsArg = getArg('--reports');
const draft = hasFlag('--draft');
const dryRun = hasFlag('--dry-run');
const batchSize = parseInt(getArg('--batch') ?? '10', 10);
const includeLevel = hasFlag('--include-level');
const includePart = hasFlag('--include-part');

const severityArg = getArg('--severity');
const activeSeverities = new Set(
  (severityArg ? severityArg.split(',') : ['error', 'warning', 'info']).map((s) => s.trim())
);

const skipFieldsArg = getArg('--skip-fields');
const skipFields = new Set(
  (skipFieldsArg ? skipFieldsArg.split(',') : ['level', 'part']).map((s) => s.trim())
);
if (includeLevel) skipFields.delete('level');
if (includePart) skipFields.delete('part');

if (!reportsArg) {
  console.error('❌  --reports is required. Example:');
  console.error(
    '    node scripts/fix-audit-issues.mjs --reports scripts/outputs/audit-vocab-a2-draft-....json --draft'
  );
  process.exit(1);
}
const reportPaths = reportsArg.split(',').map((s) => s.trim());

// ── Load API key ──────────────────────────────────────────────────────────

const envPath = path.resolve(PROJECT_ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length)
      process.env[k.trim()] = rest
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '');
  }
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY && !dryRun) {
  console.error('❌  ANTHROPIC_API_KEY is not set.');
  process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── File path resolution (mirrors audit-translations.mjs) ─────────────────

const FILENAME_PATTERN = /^(vocab|uttrykk)-([a-z0-9]+)\.json$/;

function resolveDataFilePath(filename) {
  const m = filename.match(FILENAME_PATTERN);
  if (!m) {
    throw new Error(`Can't resolve data file for report filename "${filename}"`);
  }
  const [, kind, level] = m;
  return draft
    ? path.join(DRAFT_DIR, level, `${kind}-${level}-new.json`)
    : path.join(DATA_DIR, `${kind}-${level}.json`);
}

// ── Field-name normalization ────────────────────────────────────────────
//
// audit-translations.mjs's prompt asks the auditing model to use "the exact
// field name from the entry", but in practice it sometimes invents a
// variant for the Norwegian example sentence — "example (norsk)",
// "example_norsk", "example_norwegian" — instead of the real field name
// "example". Rather than silently failing to apply those fixes (or worse,
// writing a bogus new key onto the entry), map known variants back to the
// real key and leave anything else unmapped (reported, not applied).

function normalizeFieldName(rawField, validFields) {
  const trimmed = (rawField || '').trim();
  if (validFields.has(trimmed)) return trimmed;

  const lower = trimmed.toLowerCase().replace(/[()]/g, '').trim();
  if (
    /^example[\s_-]*(norsk|norwegian)$/.test(lower) ||
    /^(norsk|norwegian)[\s_-]*example$/.test(lower)
  ) {
    return validFields.has('example') ? 'example' : null;
  }
  return null;
}

// ── Load audit reports ─────────────────────────────────────────────────

function loadReport(reportPath) {
  if (!fs.existsSync(reportPath)) {
    console.error(`❌  Report not found: ${reportPath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
}

// ── Claude API ──────────────────────────────────────────────────────────

async function callClaude(systemPrompt, userPrompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) throw new Error(`API error ${response.status}: ${await response.text()}`);

  const data = await response.json();
  const text = data.content.map((b) => b.text ?? '').join('');
  const clean = text
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .replace(/[„\u201C\u201D\u00AB\u00BB\u2018\u2019]/g, "'")
    .trim();
  try {
    return JSON.parse(clean);
  } catch {
    throw new Error(`Failed to parse JSON response:\n${text}`);
  }
}

async function withRetry(fn, label) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const delayMs = RETRY_DELAY_MS * attempt;
      console.warn(
        `  ⚠️  ${label} attempt ${attempt} failed: ${err.message}. Retry in ${delayMs}ms…`
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

// ── Prompt ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert Norwegian linguist and translator repairing flagged errors in learner-facing vocabulary data.

For each entry you will receive its current field values (for context) and a list of fields that a previous audit pass flagged as containing an error, each with the auditor's comment explaining the specific problem.

For every flagged field, produce the corrected value. Rules:
- Fix ONLY the exact problem described in the comment for that field. Do not rewrite the field beyond what's necessary to fix the described error.
- Do not change any field that isn't listed as flagged for that entry, even if you notice something else wrong with it.
- Preserve the original meaning, register, and approximate length/style of the field unless the comment explicitly calls for a rewrite.
- Diacritics — never drop or substitute required special characters: Norwegian needs æ/ø/å, German needs ä/ö/ü/ß, Spanish needs á/é/í/ó/ú/ñ and correctly PAIRED ¿...? and ¡...! (never just the closing mark). Double-check every corrected value before responding.
- Known recurring error: do not confuse Norwegian "gå" (infinitive/present, "to go/walk") with "ga" (past tense of "å gi", "to give").
- Do NOT use typographic quotes (" " „ « ») — use plain ASCII quotes if a quote is needed.
- If you cannot confidently fix a flagged field from the comment alone, set its value to null so it can be reviewed manually instead of guessing.

Respond ONLY with a JSON object. Each key is the entry id exactly as given. Each value is an object mapping ONLY the flagged field names (exactly as given) to either the corrected string, or null if you can't confidently fix it.
No markdown, no preamble, no extra text outside the JSON object.

Example output:
{
  "v-a2-money-014": { "german": "Gebühr", "example_german": "Ich musste eine Gebühr bezahlen." },
  "v-a2-communication-035": { "norsk": null }
}`;

function buildUserPrompt(items) {
  const blocks = items.map(({ entry, issues }) => {
    const lines = [
      `id: "${entry.id}"`,
      `norsk: "${entry.norsk}"`,
      `level: ${entry.level}`,
      `part: ${entry.part}`
    ];
    // Give full context (every language field present) so corrections stay
    // consistent with sibling fields even though only some are flagged.
    for (const [key, value] of Object.entries(entry)) {
      if (['id', 'norsk', 'level', 'part', 'category', 'lemma'].includes(key)) continue;
      if (value == null) continue;
      lines.push(`${key}: "${value}"`);
    }
    lines.push('Flagged fields to fix:');
    for (const issue of issues) {
      lines.push(`  - field: "${issue.field}" (severity: ${issue.severity}) — ${issue.comment}`);
    }
    return lines.join('\n');
  });
  return `Fix the flagged fields for these ${items.length} entries:\n\n${blocks.join('\n\n---\n\n')}`;
}

// ── Diacritic safety net (same lists/logic as enrich-vocab.mjs) ──────────

function runDiacriticSafetyNet(entry, touchedFields) {
  const notes = [];

  const touchedNo = touchedFields.has('norsk') || touchedFields.has('example');
  const touchedDe = touchedFields.has('german') || touchedFields.has('example_german');
  const touchedEs = touchedFields.has('spanish') || touchedFields.has('example_spanish');

  if (touchedNo) {
    const no = checkLanguage({
      headword: entry.norsk,
      fields: [{ name: 'example', value: entry.example }],
      specialChars: /[æøåÆØÅ]/,
      degrade: degradeNO,
      bareWord: bareWordNO,
      wordMap: NO_COMMON_WORD_MAP,
      ambiguousWords: NO_AMBIGUOUS_WORDS,
      exampleField: 'example',
      exampleValue: entry.example
    });
    if (no.issues.length > 0) {
      entry.example = applyFixes(entry.example, no.headwordFixes, NO_COMMON_WORD_MAP);
      notes.push(...no.issues.map((i) => `[safety-net] ${i.detail}`));
    }
  }

  if (touchedDe) {
    const de = checkLanguage({
      headword: entry.german,
      fields: [
        { name: 'german', value: entry.german },
        { name: 'example_german', value: entry.example_german }
      ],
      specialChars: /[üöäßÜÖÄ]/,
      degrade: degradeDE,
      bareWord: bareWordIntl,
      wordMap: DE_COMMON_WORD_MAP,
      ambiguousWords: DE_AMBIGUOUS_WORDS,
      exampleField: 'example_german',
      exampleValue: entry.example_german
    });
    if (de.issues.length > 0) {
      entry.german = applyFixes(entry.german, de.headwordFixes, DE_COMMON_WORD_MAP);
      entry.example_german = applyFixes(entry.example_german, de.headwordFixes, DE_COMMON_WORD_MAP);
      notes.push(...de.issues.map((i) => `[safety-net] ${i.detail}`));
    }
  }

  if (touchedEs) {
    const es = checkLanguage({
      headword: entry.spanish,
      fields: [
        { name: 'spanish', value: entry.spanish },
        { name: 'example_spanish', value: entry.example_spanish }
      ],
      specialChars: /[áéíóúñÁÉÍÓÚÑ¿¡]/,
      degrade: degradeES,
      bareWord: bareWordIntl,
      wordMap: ES_COMMON_WORD_MAP,
      ambiguousWords: ES_AMBIGUOUS_WORDS,
      exampleField: 'example_spanish',
      exampleValue: entry.example_spanish
    });
    if (es.issues.length > 0) {
      entry.spanish = applyFixes(entry.spanish, es.headwordFixes, ES_COMMON_WORD_MAP);
      entry.example_spanish = applyFixes(
        entry.example_spanish,
        es.headwordFixes,
        ES_COMMON_WORD_MAP
      );
      notes.push(...es.issues.map((i) => `[safety-net] ${i.detail}`));
    }
    const punctIssues = findSpanishPunctuationIssues(entry.example_spanish);
    if (punctIssues.length > 0) {
      entry.example_spanish = fixSpanishPunctuation(entry.example_spanish);
      notes.push(...punctIssues.map((i) => `[safety-net] ${i.detail}`));
    }
  }

  return notes;
}

// ── Group issues by target data file, normalize/filter fields ───────────

function groupIssuesForFile(entries, issuesForFile, filename, changeLog) {
  const entryById = new Map(entries.map((e) => [e.id, e]));
  const validFields = new Set();
  for (const e of entries) for (const k of Object.keys(e)) validFields.add(k);

  const byId = new Map(); // id -> [{ field, severity, comment }]
  const counts = { skippedSeverity: 0, skippedField: 0, skippedUnmapped: 0, skippedNoEntry: 0 };

  for (const issue of issuesForFile) {
    if (!activeSeverities.has(issue.severity)) {
      counts.skippedSeverity++;
      continue;
    }
    if (!entryById.has(issue.id)) {
      counts.skippedNoEntry++;
      changeLog.push({
        id: issue.id,
        norsk: issue.norsk,
        file: filename,
        field: issue.field,
        status: 'skipped-no-entry',
        comment: issue.comment
      });
      continue;
    }
    const normalized = normalizeFieldName(issue.field, validFields);
    if (!normalized) {
      counts.skippedUnmapped++;
      changeLog.push({
        id: issue.id,
        norsk: issue.norsk,
        file: filename,
        field: issue.field,
        status: 'skipped-unmapped-field',
        comment: issue.comment
      });
      continue;
    }
    if (skipFields.has(normalized)) {
      counts.skippedField++;
      changeLog.push({
        id: issue.id,
        norsk: issue.norsk,
        file: filename,
        field: normalized,
        status: 'skipped-field-excluded',
        comment: issue.comment
      });
      continue;
    }
    if (!byId.has(issue.id)) byId.set(issue.id, []);
    const list = byId.get(issue.id);
    if (!list.some((x) => x.field === normalized)) {
      list.push({ field: normalized, severity: issue.severity, comment: issue.comment });
    }
  }

  return { entryById, byId, counts };
}

// ── Process one data file ─────────────────────────────────────────────────
// Reads the file once, mutates its entries in place as corrections come
// back from Claude, then (LIVE mode only) backs up the untouched original
// and writes the mutated version back to the same path.

async function processDataFile(dataFilePath, filename, issuesForFile, changeLog) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📄  ${filename}  →  ${dataFilePath.replace(PROJECT_ROOT, '.')}`);
  console.log(`${'─'.repeat(60)}`);

  if (!fs.existsSync(dataFilePath)) {
    console.error(`  ❌  File not found — skipping`);
    return;
  }

  const originalRaw = fs.readFileSync(dataFilePath, 'utf8');
  const entries = JSON.parse(originalRaw);

  const { entryById, byId, counts } = groupIssuesForFile(
    entries,
    issuesForFile,
    filename,
    changeLog
  );

  console.log(`    Entries with actionable fixes: ${byId.size}`);
  console.log(
    `    Skipped — severity filtered: ${counts.skippedSeverity}, excluded field: ${counts.skippedField}, unmapped field: ${counts.skippedUnmapped}, no matching entry: ${counts.skippedNoEntry}`
  );

  if (byId.size === 0) return;

  const items = [...byId.entries()].map(([id, issues]) => ({ entry: entryById.get(id), issues }));

  if (dryRun) {
    console.log(`    🔍  DRY RUN — would send ${items.length} entries to Claude:`);
    for (const { entry, issues } of items) {
      console.log(
        `       • [${entry.id}] "${entry.norsk}" — ${issues.map((i) => i.field).join(', ')}`
      );
    }
    return;
  }

  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) batches.push(items.slice(i, i + batchSize));

  let fileChanged = false;

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    process.stdout.write(`    Batch ${bi + 1}/${batches.length} (${batch.length} entries)… `);

    const userPrompt = buildUserPrompt(batch);
    const result = await withRetry(
      () => callClaude(SYSTEM_PROMPT, userPrompt),
      `${filename} batch ${bi + 1}`
    );

    let applied = 0;
    let nulled = 0;
    for (const { entry, issues } of batch) {
      const corrections = result[entry.id];
      if (!corrections) {
        console.warn(`\n    ⚠️  No correction returned for [${entry.id}] — skipping`);
        for (const issue of issues) {
          changeLog.push({
            id: entry.id,
            norsk: entry.norsk,
            file: filename,
            field: issue.field,
            status: 'no-response',
            comment: issue.comment
          });
        }
        continue;
      }

      const touchedFields = new Set();
      for (const issue of issues) {
        const newValue = corrections[issue.field];
        if (newValue == null) {
          nulled++;
          changeLog.push({
            id: entry.id,
            norsk: entry.norsk,
            file: filename,
            field: issue.field,
            status: 'unresolved-by-model',
            comment: issue.comment
          });
          continue;
        }
        const oldValue = entry[issue.field];
        if (newValue === oldValue) {
          changeLog.push({
            id: entry.id,
            norsk: entry.norsk,
            file: filename,
            field: issue.field,
            status: 'no-change',
            comment: issue.comment,
            before: oldValue
          });
          continue;
        }
        entry[issue.field] = newValue;
        touchedFields.add(issue.field);
        applied++;
        fileChanged = true;
        changeLog.push({
          id: entry.id,
          norsk: entry.norsk,
          file: filename,
          field: issue.field,
          status: 'applied',
          comment: issue.comment,
          before: oldValue,
          after: newValue
        });
      }

      if (touchedFields.size > 0) {
        const safetyNotes = runDiacriticSafetyNet(entry, touchedFields);
        for (const note of safetyNotes) {
          changeLog.push({
            id: entry.id,
            norsk: entry.norsk,
            file: filename,
            field: '(safety-net)',
            status: 'applied',
            comment: note
          });
        }
      }
    }

    console.log(`✓ (${applied} field(s) fixed, ${nulled} left unresolved)`);

    if (bi < batches.length - 1) await new Promise((r) => setTimeout(r, INTER_BATCH_DELAY_MS));
  }

  if (fileChanged) {
    const bakPath = `${dataFilePath}.bak`;
    fs.writeFileSync(bakPath, originalRaw, 'utf8'); // back up the untouched original bytes
    fs.writeFileSync(dataFilePath, JSON.stringify(entries, null, 2) + '\n', 'utf8');
    console.log(`  💾  Backed up original to ${bakPath.replace(PROJECT_ROOT, '.')}`);
    console.log(`  ✅  Wrote corrections to ${dataFilePath.replace(PROJECT_ROOT, '.')}`);
  } else {
    console.log(`  (no changes to write)`);
  }
}

// ── Report ──────────────────────────────────────────────────────────────

function writeReport(changeLog) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const jsonPath = path.join(OUTPUT_DIR, `fix-audit-issues-${ts}.json`);
  const txtPath = path.join(OUTPUT_DIR, `fix-audit-issues-${ts}.txt`);

  fs.writeFileSync(jsonPath, JSON.stringify(changeLog, null, 2) + '\n', 'utf8');

  const byStatus = {};
  for (const c of changeLog) byStatus[c.status] = (byStatus[c.status] || 0) + 1;

  const lines = [
    `Fix-audit-issues report`,
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}${draft ? ' + DRAFT' : ''}`,
    '',
    'Summary by status:',
    ...Object.entries(byStatus).map(([status, n]) => `  ${status}: ${n}`),
    '',
    '─'.repeat(70)
  ];

  for (const status of [
    'applied',
    'unresolved-by-model',
    'no-response',
    'no-change',
    'skipped-unmapped-field',
    'skipped-field-excluded',
    'skipped-no-entry'
  ]) {
    const group = changeLog.filter((c) => c.status === status);
    if (group.length === 0) continue;
    lines.push(`\n${status.toUpperCase()} (${group.length})`);
    lines.push('─'.repeat(40));
    for (const c of group) {
      lines.push(`  [${c.id}] ${c.norsk || ''} (${c.file})`);
      lines.push(`    field:   ${c.field}`);
      lines.push(`    comment: ${c.comment}`);
      if (c.before !== undefined) lines.push(`    before:  ${JSON.stringify(c.before)}`);
      if (c.after !== undefined) lines.push(`    after:   ${JSON.stringify(c.after)}`);
      lines.push('');
    }
  }

  fs.writeFileSync(txtPath, lines.join('\n') + '\n', 'utf8');
  console.log(`\n📝  Reports saved:`);
  console.log(`     ${jsonPath}`);
  console.log(`     ${txtPath}`);
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔧  fix-audit-issues.mjs');
  console.log(`    Mode:        ${dryRun ? 'DRY RUN' : 'LIVE'}${draft ? ' + DRAFT' : ''}`);
  console.log(`    Reports:     ${reportPaths.join(', ')}`);
  console.log(`    Severities:  ${[...activeSeverities].join(', ')}`);
  console.log(`    Skip fields: ${[...skipFields].join(', ') || '(none)'}`);
  console.log(`    Batch size:  ${batchSize}`);

  if (!ANTHROPIC_API_KEY && !dryRun) {
    console.error('❌  ANTHROPIC_API_KEY is not set.');
    process.exit(1);
  }

  // Group all issues, from all reports, by their target data file — so a
  // vocab report and an uttrykk report in the same --reports list are each
  // routed to their own file, and duplicate reports for the same file are
  // safely merged rather than processed twice.
  const issuesByFile = new Map(); // dataFilePath -> { filename, issues: [] }

  for (const reportPath of reportPaths) {
    const report = loadReport(reportPath);
    const dataFilePath = resolveDataFilePath(report.filename);
    if (!issuesByFile.has(dataFilePath)) {
      issuesByFile.set(dataFilePath, { filename: report.filename, issues: [] });
    }
    issuesByFile.get(dataFilePath).issues.push(...report.issues);
    console.log(
      `\n  Loaded ${report.issues.length} issue(s) from ${reportPath.replace(PROJECT_ROOT, '.')}`
    );
  }

  const changeLog = [];

  for (const [dataFilePath, { filename, issues }] of issuesByFile) {
    await processDataFile(dataFilePath, filename, issues, changeLog);
  }

  writeReport(changeLog);

  const applied = changeLog.filter(
    (c) => c.status === 'applied' && c.field !== '(safety-net)'
  ).length;
  const safetyNet = changeLog.filter((c) => c.field === '(safety-net)').length;
  const unresolved = changeLog.filter((c) => c.status === 'unresolved-by-model').length;
  console.log(`\n${'═'.repeat(60)}`);
  console.log(
    `🏁  Done. ${applied} field(s) corrected, ${safetyNet} safety-net correction(s), ${unresolved} left unresolved (needs manual review).`
  );
}

main().catch((err) => {
  console.error('\n❌  Fatal:', err.message);
  process.exit(1);
});
