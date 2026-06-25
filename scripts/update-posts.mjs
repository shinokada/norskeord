#!/usr/bin/env node
/**
 * update-posts.mjs
 *
 * Run from the project root to update all blog posts in src/lib/posts.
 * Updates markdown blog posts in src/lib/posts:
 *  1. Translates title + description frontmatter to Norwegian via Claude API
 *  2. Removes "_In English:_ ..." italic callout paragraphs from the body
 *  3. Removes full "## **In English**" duplicate sections (always at end of file)
 *
 * Usage:
 *   node update-posts.mjs              # process all posts
 *   node update-posts.mjs --dry-run    # preview changes without writing files
 *   node update-posts.mjs hallo.md     # process a single file
 *
 * Requirements:
 *   - Node 18+  (built-in fetch, no extra dependencies)
 *   - ANTHROPIC_API_KEY in environment or in a .env file at project root
 *   - Run from the project root (where src/ lives)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Config ────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.resolve(__dirname, 'src/lib/posts');
const DRY_RUN = process.argv.includes('--dry-run');
const SINGLE_FILE = process.argv.find((a) => a.endsWith('.md') && !a.includes('/'));

// Load API key from env or .env file
function loadApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return;
  try {
    const envContent = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8');
    for (const line of envContent.split('\n')) {
      const m = line.match(/^ANTHROPIC_API_KEY\s*=\s*(.+)$/);
      if (m) {
        process.env.ANTHROPIC_API_KEY = m[1].trim().replace(/^['"]|['"]$/g, '');
        return;
      }
    }
  } catch {
    /* no .env — that's fine */
  }
}

loadApiKey();

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY is not set.');
  console.error('  export ANTHROPIC_API_KEY=sk-ant-...');
  process.exit(1);
}

// ── Frontmatter helpers ───────────────────────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  return { raw: match[1], body: match[2] };
}

function extractField(raw, field) {
  for (const line of raw.split('\n')) {
    if (!line.startsWith(`${field}:`)) continue;
    let value = line.slice(field.length + 1).trim();
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      return value.slice(1, -1);
    }
    return value;
  }
  return null;
}

function setField(raw, field, newValue) {
  const lines = raw.split('\n');
  return lines
    .map((line) => {
      if (!line.startsWith(`${field}:`)) return line;
      // Escape backslashes then single quotes for YAML single-quoted scalar
      const safe = newValue.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `${field}: '${safe}'`;
    })
    .join('\n');
}

// ── Body transformations ──────────────────────────────────────────────────────

/**
 * Remove any paragraph containing "_In English:_" or "_In English —_".
 * A paragraph is a run of non-blank lines separated by blank lines.
 */
function removeInEnglishCallouts(body) {
  const paragraphs = body.split(/\n{2,}/);
  return paragraphs
    .filter((p) => !/_In English[:\s—]/i.test(p.replace(/^>\s*/gm, '')))
    .join('\n\n');
}

/**
 * Remove a "## **In English**" or "## In English" section and everything after it.
 * These are always at the end of the file, after a --- divider.
 */
function removeInEnglishSection(body) {
  return body.replace(/\n---\n\n## \*?\*?In English\*?\*?[\s\S]*$/i, '');
}

/** Collapse 3+ consecutive blank lines down to 2. */
function normaliseBlankLines(text) {
  return text.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

// ── Claude API ────────────────────────────────────────────────────────────────

async function translateFrontmatter(title, description, slug) {
  const prompt = `You are a Norwegian language expert. Translate the following English blog post title and description into natural, clear Norwegian (Bokmål).

Context: The blog is "Norskeord" — it helps people learn Norwegian. Posts cover vocabulary, grammar, and expressions. Readers are Norwegian learners, so the Norwegian should be clear and accessible, not overly formal.

Rules:
- Keep Norwegian words/terms unchanged (e.g. "hei", "fort", "gi deg", "leddsetninger")
- Keep CEFR level labels unchanged (A1, A2, B1, B2)
- Keep brand name "Norskeord" unchanged
- Title: concise and natural in Norwegian, roughly the same length as the English
- Description: 1–2 sentences, informative, plain Bokmål — suitable as a meta description
- If the title/description is already fully in Norwegian, return it unchanged
- Return ONLY valid JSON — no markdown fences, no preamble:
  {"title": "...", "description": "..."}

Slug (context only): ${slug}
Title: ${title}
Description: ${description}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const text = (data.content?.[0]?.text ?? '').replace(/```json\n?|```/g, '').trim();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Could not parse JSON from API response:\n${text}`);
  }
}

// ── Per-file processing ───────────────────────────────────────────────────────

async function processFile(filePath) {
  const filename = path.basename(filePath);
  const original = fs.readFileSync(filePath, 'utf8');
  const parsed = parseFrontmatter(original);

  if (!parsed) {
    console.warn(`  SKIP  no frontmatter — ${filename}`);
    return;
  }

  const { raw, body } = parsed;
  const title = extractField(raw, 'title');
  const description = extractField(raw, 'description');
  const slug = extractField(raw, 'slug') ?? filename.replace('.md', '');

  if (!title || !description) {
    console.warn(`  SKIP  missing title or description — ${filename}`);
    return;
  }

  // 1. Translate frontmatter
  let newRaw = raw;
  if (!DRY_RUN) {
    let translated;
    try {
      translated = await translateFrontmatter(title, description, slug);
    } catch (err) {
      console.error(`  ERROR ${filename}: ${err.message}`);
      return;
    }
    if (translated.title && translated.title !== title) {
      newRaw = setField(newRaw, 'title', translated.title);
      console.log(`  title:  ${translated.title}`);
    } else {
      console.log(`  title:  (unchanged)`);
    }
    if (translated.description && translated.description !== description) {
      newRaw = setField(newRaw, 'description', translated.description);
      console.log(`  desc:   ${translated.description.slice(0, 72)}…`);
    } else {
      console.log(`  desc:   (unchanged)`);
    }
  } else {
    console.log(`  [dry-run] would translate title + description`);
  }

  // 2. Clean body
  let newBody = body;
  const calloutCount = (body.match(/_In English[:\s—]/gi) ?? []).length;
  const hasSection = /## \*?\*?In English/i.test(body);

  newBody = removeInEnglishCallouts(newBody);
  newBody = removeInEnglishSection(newBody);
  newBody = normaliseBlankLines(newBody);

  if (calloutCount) console.log(`  removed ${calloutCount} _In English:_ callout(s)`);
  if (hasSection) console.log(`  removed ## In English section`);

  const newContent = `---\n${newRaw}\n---\n${newBody}`;

  if (newContent === original && newRaw === raw) {
    console.log(`  (no changes)`);
    return;
  }

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`  ✓ saved`);
  } else {
    console.log(`  [dry-run] would write ${filePath}`);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  if (DRY_RUN) console.log('DRY RUN — no files will be written\n');

  let files;
  if (SINGLE_FILE) {
    files = [path.join(POSTS_DIR, SINGLE_FILE)];
  } else {
    files = fs
      .readdirSync(POSTS_DIR)
      .filter((f) => f.endsWith('.md'))
      .sort()
      .map((f) => path.join(POSTS_DIR, f));
  }

  console.log(`Processing ${files.length} file(s) in ${POSTS_DIR}\n`);

  for (const file of files) {
    console.log(`→ ${path.basename(file)}`);
    await processFile(file);
    console.log();
    // Polite pause between API calls
    if (!DRY_RUN) await new Promise((r) => setTimeout(r, 350));
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
