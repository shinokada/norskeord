#!/usr/bin/env node
/**
 * translate-messages.mjs
 *
 * Translates messages/en.json (the inlang base locale) into another locale
 * file in the same directory, using the Anthropic API.
 *
 * Usage:
 *   node scripts/translate-messages.mjs --language spanish
 *   node scripts/translate-messages.mjs --language ukrainian --batch 25
 *   node scripts/translate-messages.mjs --language spanish --dry-run
 *   node scripts/translate-messages.mjs --language spanish --force
 *
 * Options:
 *   --language  Target language key (required). Must be a key in
 *               LANGUAGE_CONFIG below — e.g. "spanish", "ukrainian".
 *   --batch     Number of message keys per API call (default: 20).
 *   --dry-run   Print what would happen without calling the API or writing files.
 *   --force     Re-translate keys that already exist in the target file (overwrites them).
 *
 * Prerequisites:
 *   ANTHROPIC_API_KEY must be set in your environment (or .env file in project root).
 *
 * The script:
 *   1. Reads messages/en.json (the source of truth for UI strings).
 *   2. Reads messages/<code>.json if it already exists, so it only translates
 *      keys that are missing or still identical to the English source
 *      (unless --force, which re-translates everything).
 *   3. Sends batches of {key, text} pairs to claude-sonnet-4-6, instructing it
 *      to preserve ICU placeholders ({count}, {level}, ...), inline HTML tags
 *      (<strong>, <em>), emoji/arrows, and brand names (Norskeord, Norskprøven, Plus).
 *   4. Matches responses back to entries by message key — keys are already
 *      unique, so there's no positional/fuzzy matching to get wrong.
 *   5. Merges new translations into the existing target file (if any),
 *      re-applies en.json's key order (with $schema first) for clean diffs,
 *      and writes the file (with a .bak backup if it already existed).
 *   6. Retries failed batches up to 5 times with exponential backoff.
 *   7. Prints a final summary of any keys that still need a translation.
 *
 * Adding a new language later:
 *   Add a key to LANGUAGE_CONFIG below. The `code` must match a locale you
 *   add to the `locales` array in project.inlang/settings.json (this script
 *   only writes the message file — add the locale to inlang's settings.json
 *   yourself, it's a one-line edit). Then run with --language <key>.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Language config ──────────────────────────────────────────────────────
// `code` is the locale code used for the output filename (messages/<code>.json)
// and must match project.inlang/settings.json's `locales` array.
const LANGUAGE_CONFIG = {
  spanish: { code: 'es', name: 'Spanish', nativeName: 'español' },
  ukrainian: { code: 'uk', name: 'Ukrainian', nativeName: 'українська' },
  polish: { code: 'pl', name: 'Polish', nativeName: 'polski' },
  arabic: { code: 'ar', name: 'Arabic (Syrian)', nativeName: 'العربية السورية' },
  german: { code: 'de', name: 'German', nativeName: 'Deutsch' },
  romanian: { code: 'ro', name: 'Romanian', nativeName: 'română' },
  dari: { code: 'prs', name: 'Dari', nativeName: 'دری' },
  italian: { code: 'it', name: 'Italian', nativeName: 'italiano' },
  urdu: { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  french: { code: 'fr', name: 'French', nativeName: 'français' },
  turkish: { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  dutch: { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  portuguese: { code: 'pt', name: 'Portuguese', nativeName: 'português' }
};

// ── Config ───────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = path.resolve(__dirname, '../messages');
const SOURCE_FILE = 'en.json';
const SCHEMA_KEY = '$schema';

const DEFAULT_BATCH = 20;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

// Inter-batch delay scales with how many keys need translating.
function interBatchDelay(totalKeys) {
  if (totalKeys >= 300) return 1500;
  if (totalKeys >= 100) return 800;
  return 400;
}

// ── CLI args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const dryRun = hasFlag('--dry-run');
const force = hasFlag('--force');
const batchSize = parseInt(getArg('--batch') ?? DEFAULT_BATCH, 10);

const language = getArg('--language');
if (!language) {
  console.error(
    `❌  Missing --language. Supported: ${Object.keys(LANGUAGE_CONFIG).join(', ')}\n` +
      `    Usage: node scripts/translate-messages.mjs --language spanish`
  );
  process.exit(1);
}
if (!(language in LANGUAGE_CONFIG)) {
  console.error(
    `❌  Unknown language "${language}". Supported: ${Object.keys(LANGUAGE_CONFIG).join(', ')}\n` +
      `    To add a new one, edit LANGUAGE_CONFIG at the top of this script.`
  );
  process.exit(1);
}
const languageMeta = LANGUAGE_CONFIG[language];
const targetFile = `${languageMeta.code}.json`;

// ── Load API key ─────────────────────────────────────────────────────────

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length) {
      process.env[k.trim()] = rest
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  }
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY && !dryRun) {
  console.error('❌  ANTHROPIC_API_KEY is not set. Export it or add it to .env');
  process.exit(1);
}

// ── Anthropic call ───────────────────────────────────────────────────────

async function fetchTranslations(batchPairs) {
  // batchPairs: array of [key, englishText]
  const itemsBlock = batchPairs
    .map(([key, text]) => `"${key}": ${JSON.stringify(text)}`)
    .join('\n');

  const systemPrompt = `You are a professional UI translator producing interface strings for a Norwegian-learning app called Norskeord, translating from English into ${languageMeta.name} (${languageMeta.nativeName}).

Rules:
- Translate the VALUE of each key naturally and idiomatically. These are UI labels, buttons, and short sentences — keep them concise, not literary.
- NEVER translate or alter placeholders in curly braces, e.g. {count}, {level}, {name}, {email} — copy them through exactly, same spelling and case, same position relative to surrounding words where natural.
- NEVER translate or remove HTML-like inline tags, e.g. <strong>, </strong>, <em>, </em> — keep the tags exactly, wrapped around the corresponding translated text.
- Keep emoji, arrows (→, ←), and standalone symbols as-is unless the target language conventionally uses a different mark for that purpose.
- Do NOT translate brand/product names or proper nouns: "Norskeord", "Norskprøven", "Plus", "Norsktrening", "Folkeuniversitetet".
- Match the register of the English source: casual, friendly app copy — not formal or stiff.
- Respond ONLY with a single JSON object mapping each input key to its translated string. No markdown formatting, no preamble, no extra commentary, and no missing or extra keys.`;

  const userPrompt = `Translate these ${batchPairs.length} UI strings into ${languageMeta.name}:\n\n{\n${itemsBlock}\n}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

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

// ── Retry helper ─────────────────────────────────────────────────────────

async function withRetry(fn, label) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const delay = RETRY_DELAY_MS * attempt;
      console.warn(
        `  ⚠️  ${label} — attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms…`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌍  translate-messages.mjs');
  console.log(`    Language:     ${languageMeta.name} (${language} → messages/${targetFile})`);
  console.log(`    Mode:         ${dryRun ? 'DRY RUN' : 'LIVE'}${force ? ' + --force' : ''}`);
  console.log(`    Batch size:   ${batchSize}`);
  console.log(`    Messages dir: ${MESSAGES_DIR}`);

  const sourcePath = path.join(MESSAGES_DIR, SOURCE_FILE);
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌  Source file not found: ${sourcePath}`);
    process.exit(1);
  }
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

  const targetPath = path.join(MESSAGES_DIR, targetFile);
  const existing = fs.existsSync(targetPath) ? JSON.parse(fs.readFileSync(targetPath, 'utf8')) : {};

  const sourceKeys = Object.keys(source).filter((k) => k !== SCHEMA_KEY);

  // A key needs (re-)translation if: --force was passed, it's missing from
  // the target file, or it's still byte-identical to the English source
  // (which happens for keys that previously failed and fell back to English —
  // this makes re-running the script self-healing without --force).
  const keysToTranslate = sourceKeys.filter(
    (k) => force || !(k in existing) || existing[k] === source[k]
  );

  console.log(
    `    Total keys:   ${sourceKeys.length} | Already translated: ${sourceKeys.length - keysToTranslate.length} | To translate: ${keysToTranslate.length}`
  );

  if (keysToTranslate.length === 0) {
    console.log('    ✅  Nothing to do.');
    return;
  }

  if (dryRun) {
    console.log(
      `    🔍  DRY RUN — would translate ${keysToTranslate.length} keys in ${Math.ceil(keysToTranslate.length / batchSize)} batches.`
    );
    return;
  }

  if (fs.existsSync(targetPath)) {
    fs.copyFileSync(targetPath, targetPath + '.bak');
    console.log(`    💾  Backup saved to ${targetFile}.bak`);
  }

  const results = { ...existing };
  const batchDelay = interBatchDelay(keysToTranslate.length);

  const batches = [];
  for (let i = 0; i < keysToTranslate.length; i += batchSize) {
    batches.push(keysToTranslate.slice(i, i + batchSize));
  }

  let processed = 0;

  for (let bi = 0; bi < batches.length; bi++) {
    const batchKeys = batches[bi];
    const batchPairs = batchKeys.map((k) => [k, source[k]]);
    process.stdout.write(`    Batch ${bi + 1}/${batches.length} (${batchPairs.length} keys)… `);

    const result = await withRetry(() => fetchTranslations(batchPairs), `batch ${bi + 1}`);

    let hits = 0;
    for (const key of batchKeys) {
      const translated = result[key];
      if (typeof translated === 'string' && translated.trim()) {
        results[key] = translated;
        hits++;
      } else {
        console.warn(`\n    ⚠️  No translation returned for key "${key}"`);
      }
    }
    processed += hits;
    console.log(`✓ (${hits}/${batchPairs.length} matched)`);

    if (bi < batches.length - 1) {
      await new Promise((r) => setTimeout(r, batchDelay));
    }
  }

  // Re-apply en.json's key order ($schema first) for clean, stable diffs.
  const ordered = { [SCHEMA_KEY]: source[SCHEMA_KEY] };
  for (const key of sourceKeys) {
    ordered[key] = key in results ? results[key] : source[key];
  }

  fs.writeFileSync(targetPath, JSON.stringify(ordered, null, 2) + '\n', 'utf8');
  console.log(
    `    ✅  Done. ${processed}/${keysToTranslate.length} translations written. File saved to messages/${targetFile}`
  );

  const stillMissing = sourceKeys.filter((k) => !(k in results) || results[k] === source[k]);
  if (stillMissing.length > 0) {
    console.warn(
      `\n    ⚠️  ${stillMissing.length} keys still untranslated (fell back to English):`
    );
    for (const k of stillMissing) console.warn(`       • ${k}`);
    console.warn(`    Re-run the script to retry these keys (no --force needed).`);
  } else {
    console.log(
      `    🎯  All keys in messages/${targetFile} now have a ${languageMeta.name} translation.`
    );
  }
}

main().catch((err) => {
  console.error('\n❌  Fatal error:', err.message);
  process.exit(1);
});
