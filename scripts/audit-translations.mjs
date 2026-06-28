#!/usr/bin/env node
/**
 * audit-translations.mjs
 *
 * Uses the Claude API to audit translation quality for any languages present
 * (english, spanish, ukrainian, german, romanian, …) in vocab-*.json and
 * uttrykk-*.json files. Languages are detected automatically from the data —
 * no configuration needed when new languages are added.
 *
 * For each entry Claude checks:
 *   - Is `english` an accurate, natural translation of `norsk`?
 *   - Is `example_english` an accurate translation of `example`?
 *   - Is `spanish` an accurate, natural translation of `norsk`?
 *   - Is `example_spanish` an accurate translation of `example`?
 *   - Is `ukrainian` an accurate, natural translation of `norsk`?
 *   - Is `example_ukrainian` an accurate translation of `example`?
 *   - Are translations appropriate for the CEFR `level`?
 *
 * Output:
 *   - Console: live progress + issues as they are found
 *   - File:    scripts/outputs/audit-{filename}-{timestamp}.json  (full report)
 *   - File:    scripts/outputs/audit-{filename}-{timestamp}.txt   (human-readable)
 *
 * Usage:
 *   node scripts/audit-translations.mjs --files vocab-b2.json
 *   node scripts/audit-translations.mjs --files vocab-b2.json,uttrykk-b2.json
 *   node scripts/audit-translations.mjs --files vocab-b2.json --batch 20
 *   node scripts/audit-translations.mjs --files vocab-b2.json --only-with-translations
 *   node scripts/audit-translations.mjs --files vocab-b2.json --dry-run
 *
 * Options:
 *   --files                    Comma-separated filenames in src/lib/data/
 *   --batch                    Entries per API call (default: 20)
 *   --only-with-translations   Skip entries that only have english (default: false)
 *   --dry-run                  Show plan without calling the API
 *   --languages                Comma-separated subset to check, e.g. "english,spanish"
 *                              Default: all present (english always checked)
 * Languages are auto-detected from whatever fields are present in the data, so no --language flag needed — it'll pick up german, ukrainian, spanish, etc. automatically.
 * --only-with-translations skips entries that only have english (i.e. no Spanish/Ukrainian/German etc.), which is what you want after running add-language-translations.mjs.
 * --languages german lets you narrow the audit to just one language if you want to check german translations specifically after this run.
 * Output reports go to scripts/outputs/audit-{filename}-{timestamp}.json/.txt.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../src/lib/data');
const OUTPUT_DIR = path.resolve(__dirname, 'outputs');

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const dryRun = hasFlag('--dry-run');
const onlyWithTranslations = hasFlag('--only-with-translations');
const batchSize = parseInt(getArg('--batch') ?? '20', 10);
const filesArg = getArg('--files');
const langsArg = getArg('--languages');
const langFilter = langsArg ? new Set(langsArg.split(',').map((s) => s.trim())) : null;

if (!filesArg) {
  console.error('❌  --files is required. Example: --files vocab-b2.json');
  process.exit(1);
}
const filesToProcess = filesArg.split(',').map((s) => s.trim());

// ── Load API key ──────────────────────────────────────────────────────────────

const envPath = path.resolve(__dirname, '../.env');
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

// ── Issue severity ────────────────────────────────────────────────────────────
// Each issue returned by Claude has a severity:
//   error   — clearly wrong translation or example
//   warning — awkward, unnatural, or slightly off
//   info    — minor style/CEFR-level note

// ── Prompt ────────────────────────────────────────────────────────────────────

function buildSystemPrompt(langs) {
  const langList = langs.join(', ');
  return `You are an expert Norwegian linguist and translator auditing learner-facing vocabulary data.

For each numbered entry you will receive the Norwegian word/phrase and its translations into: ${langList}.
You must check each translation field for:
  1. Accuracy      — does the translation correctly convey the Norwegian meaning?
  2. Naturalness   — is it what a native speaker would actually say/write?
  3. CEFR level    — are the example sentences appropriate for the stated level?
  4. Consistency   — do the translation and its example sentence match each other?

Respond ONLY with a JSON object. Each key is the item number as a string ("1", "2", …).
The value is either:
  - null  — if the entry has NO issues at all
  - an array of issue objects, each with:
      { "field": "<fieldname>", "severity": "error"|"warning"|"info", "comment": "<short explanation>" }

Field names to use: the exact field name from the entry (e.g. "english", "example_english", "spanish", "example_spanish", "german", "example_german", "ukrainian", "example_ukrainian", etc.).

Keep comments concise (max 15 words). Only report genuine problems — do not invent issues.
No markdown, no preamble, no extra text outside the JSON object.

Example output:
{
  "1": null,
  "2": [
    { "field": "example_spanish", "severity": "warning", "comment": "Unnatural phrasing; a native speaker would say 'Se me olvidó'" },
    { "field": "ukrainian", "severity": "error", "comment": "Wrong word; 'спогад' means 'memory/recollection', not 'reminder'" }
  ],
  "3": null
}`;
}

function buildUserPrompt(batch, langs) {
  const lines = batch.map((e, i) => {
    const parts = [
      `${i + 1}. norsk: "${e.norsk}"`,
      `   level: ${e.level}`,
      `   part: ${e.part}`,
      `   example (norsk): "${e.example}"`
    ];
    for (const lang of langs) {
      const transField = lang; // english, spanish, german, …
      const exField = `example_${lang}`; // example_english, example_german, …
      if (e[transField] != null) parts.push(`   ${transField}: "${e[transField]}"`);
      if (e[exField] != null) parts.push(`   ${exField}: "${e[exField]}"`);
    }
    return parts.join('\n');
  });
  return `Audit these ${batch.length} entries:\n\n${lines.join('\n\n')}`;
}

// ── API call ──────────────────────────────────────────────────────────────────

async function fetchAudit(batch, langs) {
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
      system: buildSystemPrompt(langs),
      messages: [{ role: 'user', content: buildUserPrompt(batch, langs) }]
    })
  });

  if (!response.ok) throw new Error(`API error ${response.status}: ${await response.text()}`);

  const data = await response.json();
  const text = data.content.map((b) => b.text ?? '').join('');
  const clean = text
    .replace(/^```(?:json)?\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim();
  try {
    return JSON.parse(clean);
  } catch {
    throw new Error(`Failed to parse JSON response:\n${text}`);
  }
}

// ── Retry ─────────────────────────────────────────────────────────────────────

async function withRetry(fn, label, maxRetries = 4) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = 2000 * attempt;
      console.warn(
        `  ⚠️  ${label} attempt ${attempt} failed: ${err.message}. Retry in ${delay}ms…`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ── Detect which languages are present in a file ──────────────────────────────

// Known translation languages — the field name IS the language name (english,
// spanish, ukrainian, german, romanian, …). We discover them dynamically from
// the data rather than maintaining a hardcoded list, so new languages added by
// add-language-translations.mjs are picked up automatically.
function detectLanguages(entries) {
  // Collect every field that appears in at least one entry
  const allFields = new Set(entries.flatMap((e) => Object.keys(e)));
  // A language field looks like a plain word (no underscore) that is NOT one
  // of the structural fields. example_* fields tell us the language too.
  const structural = new Set([
    'id',
    'norsk',
    'lemma',
    'example',
    'definition',
    'level',
    'category',
    'part'
  ]);
  const langs = new Set();
  for (const field of allFields) {
    if (structural.has(field)) continue;
    if (field.startsWith('example_')) {
      langs.add(field.slice('example_'.length)); // e.g. example_german → german
    } else if (!field.includes('_')) {
      langs.add(field); // e.g. english, german, ukrainian
    }
  }
  // Always put english first for readability
  const sorted = ['english', ...[...langs].filter((l) => l !== 'english').sort()];
  return sorted.filter((l) => langs.has(l));
}

// ── Process one file ──────────────────────────────────────────────────────────

async function processFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Not found: ${filePath} — skipping`);
    return null;
  }

  const entries = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Filter entries: if --only-with-translations, skip entries that only have english
  const toAudit = onlyWithTranslations
    ? entries.filter((e) =>
        Object.keys(e).some(
          (k) =>
            k !== 'english' &&
            !k.startsWith('example_') &&
            ![
              'id',
              'norsk',
              'lemma',
              'example',
              'definition',
              'level',
              'category',
              'part'
            ].includes(k) &&
            e[k] != null
        )
      )
    : entries;

  // Detect languages present
  const detectedLangs = detectLanguages(toAudit);
  const langs = langFilter ? detectedLangs.filter((l) => langFilter.has(l)) : detectedLangs;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📄  ${filename}  (${entries.length} total, ${toAudit.length} to audit)`);
  console.log(`    Languages: ${langs.join(', ')}`);
  console.log(`${'─'.repeat(60)}`);

  if (toAudit.length === 0) {
    console.log('    Nothing to audit.');
    return null;
  }

  if (dryRun) {
    const batches = Math.ceil(toAudit.length / batchSize);
    console.log(`    🔍  DRY RUN — ${toAudit.length} entries, ${batches} batches`);
    return null;
  }

  // Audit in batches
  const allIssues = []; // { id, norsk, level, field, severity, comment }
  const batches = [];
  for (let i = 0; i < toAudit.length; i += batchSize) {
    batches.push(toAudit.slice(i, i + batchSize));
  }

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    process.stdout.write(`    Batch ${bi + 1}/${batches.length} (${batch.length} items)… `);

    const result = await withRetry(() => fetchAudit(batch, langs), `${filename} batch ${bi + 1}`);

    let batchIssues = 0;
    for (let i = 0; i < batch.length; i++) {
      const entry = batch[i];
      const issues = result[String(i + 1)];
      if (Array.isArray(issues) && issues.length > 0) {
        for (const issue of issues) {
          allIssues.push({ id: entry.id, norsk: entry.norsk, level: entry.level, ...issue });
          batchIssues++;
        }
      }
    }

    const marker = batchIssues > 0 ? `⚠️  ${batchIssues} issue(s)` : '✅ clean';
    console.log(marker);

    // Print issues immediately so you can monitor live

    const batchEntryIssues = allIssues.slice(allIssues.length - batchIssues);
    for (const iss of batchEntryIssues) {
      const sev = iss.severity === 'error' ? '❌' : iss.severity === 'warning' ? '⚠️ ' : 'ℹ️ ';
      console.log(`      ${sev} [${iss.id}] ${iss.norsk} — ${iss.field}: ${iss.comment}`);
    }

    if (bi < batches.length - 1) await new Promise((r) => setTimeout(r, 1500));
  }

  // Summarise
  const errors = allIssues.filter((i) => i.severity === 'error').length;
  const warnings = allIssues.filter((i) => i.severity === 'warning').length;
  const infos = allIssues.filter((i) => i.severity === 'info').length;
  console.log(
    `\n    📊  ${errors} error(s), ${warnings} warning(s), ${infos} info(s) across ${toAudit.length} entries`
  );

  return { filename, audited: toAudit.length, errors, warnings, infos, issues: allIssues };
}

// ── Write reports ─────────────────────────────────────────────────────────────

function writeReports(results) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  for (const r of results) {
    if (!r) continue;
    const base = r.filename.replace('.json', '');
    const jsonPath = path.join(OUTPUT_DIR, `audit-${base}-${ts}.json`);
    const txtPath = path.join(OUTPUT_DIR, `audit-${base}-${ts}.txt`);

    fs.writeFileSync(jsonPath, JSON.stringify(r, null, 2) + '\n', 'utf8');

    // Human-readable text report
    const lines = [
      `Audit report: ${r.filename}`,
      `Generated:    ${new Date().toISOString()}`,
      `Audited:      ${r.audited} entries`,
      `Results:      ${r.errors} error(s), ${r.warnings} warning(s), ${r.infos} info(s)`,
      '',
      '─'.repeat(70)
    ];

    if (r.issues.length === 0) {
      lines.push('✅  No issues found.');
    } else {
      // Group by severity
      for (const severity of ['error', 'warning', 'info']) {
        const group = r.issues.filter((i) => i.severity === severity);
        if (group.length === 0) continue;
        const label =
          severity === 'error'
            ? '❌  ERRORS'
            : severity === 'warning'
              ? '⚠️   WARNINGS'
              : 'ℹ️   INFO';
        lines.push(`\n${label} (${group.length})`);
        lines.push('─'.repeat(40));
        for (const iss of group) {
          lines.push(`  [${iss.id}] ${iss.norsk} (${iss.level})`);
          lines.push(`    field:   ${iss.field}`);
          lines.push(`    comment: ${iss.comment}`);
          lines.push('');
        }
      }
    }

    fs.writeFileSync(txtPath, lines.join('\n') + '\n', 'utf8');
    console.log(`\n  📝  Reports saved:`);
    console.log(`       ${jsonPath}`);
    console.log(`       ${txtPath}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍  audit-translations.mjs');
  console.log(`    Mode:       ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`    Batch size: ${batchSize}`);
  console.log(`    Files:      ${filesToProcess.join(', ')}`);
  if (langFilter) console.log(`    Languages:  ${[...langFilter].join(', ')} (filtered)`);
  if (onlyWithTranslations) console.log(`    Scope:      entries with spanish/ukrainian only`);

  const results = [];
  for (const file of filesToProcess) {
    results.push(await processFile(file));
  }

  if (!dryRun) writeReports(results.filter(Boolean));

  // Overall summary
  const total = results.filter(Boolean);
  if (total.length > 0) {
    const totErr = total.reduce((s, r) => s + r.errors, 0);
    const totWarn = total.reduce((s, r) => s + r.warnings, 0);
    console.log(`\n${'═'.repeat(60)}`);
    console.log(
      `🏁  Done. ${totErr} error(s), ${totWarn} warning(s) across ${total.length} file(s)`
    );
  }
}

main().catch((err) => {
  console.error('\n❌  Fatal:', err.message);
  process.exit(1);
});
