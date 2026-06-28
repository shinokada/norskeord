#!/usr/bin/env node
/**
 * shorten-faq-answers-i18n.mjs
 *
 * Translates the three shortened FAQ answers from en.json into de.json,
 * uk.json, and es.json using the Anthropic API.
 *
 * These keys were shortened by shorten-faq-answers.mjs (English only):
 *   - guide_faq_norskproven_a
 *   - guide_faq_prefs_a
 *   - guide_faq_freeplus_a_v2
 *
 * Usage (from project root):
 *   node scripts/shorten-faq-answers-i18n.mjs
 *   node scripts/shorten-faq-answers-i18n.mjs --dry-run
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = resolve(__dirname, '../messages');

// ── Load .env ────────────────────────────────────────────────────────────

const envPath = resolve(__dirname, '../.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
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
if (!ANTHROPIC_API_KEY) {
  console.error('❌  ANTHROPIC_API_KEY is not set. Add it to .env or your environment.');
  process.exit(1);
}

// ── Config ────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run');

// The keys that were shortened in en.json
const KEYS_TO_UPDATE = ['guide_faq_norskproven_a', 'guide_faq_prefs_a', 'guide_faq_freeplus_a_v2'];

// Target locales
const LOCALES = [
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'українська' },
  { code: 'es', name: 'Spanish', nativeName: 'español' }
];

// ── Read source values from en.json ──────────────────────────────────────

const enPath = resolve(messagesDir, 'en.json');
const enData = JSON.parse(readFileSync(enPath, 'utf8'));

const sourceEntries = KEYS_TO_UPDATE.map((key) => {
  if (!(key in enData)) {
    console.error(`❌  Key "${key}" not found in en.json`);
    process.exit(1);
  }
  return { key, text: enData[key] };
});

console.log('\n📋 Keys to translate:');
for (const { key, text } of sourceEntries) {
  console.log(`  ${key}:\n    "${text}"\n`);
}

if (DRY_RUN) {
  console.log('🔍 Dry run — no API calls or file writes.');
  process.exit(0);
}

// ── Call Anthropic API ────────────────────────────────────────────────────

async function translateEntries(entries, langName, nativeName) {
  const payload = entries.map(({ key, text }) => ({ key, text }));

  const systemPrompt = `You are a professional translator. Translate UI strings from English into ${langName} (${nativeName}).

Rules:
- Preserve ICU placeholders exactly: {count}, {level}, {email}, etc.
- Preserve inline HTML tags: <strong>, <em>, <br>
- Preserve emoji and arrows (→, ←, ✓, 🎉, etc.)
- Keep brand names unchanged: Norskeord, Norskprøven, Plus, CEFR, FSRS
- Keep URLs and email addresses unchanged
- Match the tone and register of a friendly, professional language-learning app
- Return ONLY valid JSON — an array of objects with "key" and "translation" fields
- No markdown fences, no preamble, no explanation`;

  const userPrompt = `Translate each entry into ${langName}. Return a JSON array.

Input:
${JSON.stringify(payload, null, 2)}

Return format:
[
  { "key": "...", "translation": "..." },
  ...
]`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw = data.content.find((b) => b.type === 'text')?.text ?? '';

  // Strip any accidental markdown fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse API response as JSON:\n${raw}`);
  }

  // Build key → translation map
  const map = {};
  for (const item of parsed) {
    if (item.key && item.translation) {
      map[item.key] = item.translation;
    }
  }
  return map;
}

// ── Main ──────────────────────────────────────────────────────────────────

for (const locale of LOCALES) {
  const filePath = resolve(messagesDir, `${locale.code}.json`);

  if (!existsSync(filePath)) {
    console.log(`⚠️  ${locale.code}.json not found — skipping.`);
    continue;
  }

  console.log(`\n🌐 Translating into ${locale.name} (${locale.code}.json)…`);

  let translations;
  try {
    translations = await translateEntries(sourceEntries, locale.name, locale.nativeName);
  } catch (err) {
    console.error(`  ❌  API call failed: ${err.message}`);
    continue;
  }

  const data = JSON.parse(readFileSync(filePath, 'utf8'));

  let updated = 0;
  for (const key of KEYS_TO_UPDATE) {
    const translation = translations[key];
    if (!translation) {
      console.log(`  ⚠️  No translation returned for "${key}"`);
      continue;
    }

    const before = data[key] ?? '(missing)';
    data[key] = translation;
    updated++;

    console.log(`  ✓ ${key}:`);
    console.log(`      before: ${before}`);
    console.log(`      after:  ${translation}`);
  }

  if (updated > 0) {
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log(
      `  💾 Saved ${locale.code}.json (${updated} key${updated !== 1 ? 's' : ''} updated)`
    );
  } else {
    console.log(`  ℹ️  Nothing to write.`);
  }
}

console.log('\n✅  Done.');
