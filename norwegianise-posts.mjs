#!/usr/bin/env node
/**
 * norwegianise-posts.mjs
 *
 * Second-pass script: translates remaining English text in blog post bodies
 * to Norwegian (Bokmål), while carefully preserving:
 *
 *   KEEP (teaching content — do not translate):
 *   - Italic English glosses on example sentences: _The cake is good._
 *   - English words/phrases quoted as translation equivalents in the
 *     Norwegian prose: «give up», "quickly", stop / give in
 *   - Norwegian example sentences themselves (bold lines like **Kaken er god.**)
 *   - Code, slugs, URLs, tag values
 *   - CEFR labels (A1, A2, B1, B2, C)
 *   - The brand name "Norskeord"
 *
 *   TRANSLATE to Norwegian:
 *   - > **TL;DR:** ...  →  > **Kort sagt:** ...
 *   - H2/H3 headings that are in English or mixed
 *   - → arrow explanations after examples
 *   - Italic _explanation_ lines under ❌/⭕ error pairs
 *   - ## Husk dette bullet descriptions
 *   - ## Kort forklaring bullet descriptions
 *   - Standalone English prose sentences in body sections
 *   - Table cells in the Meaning / Typical use columns
 *
 * Usage:
 *   node norwegianise-posts.mjs              # all posts
 *   node norwegianise-posts.mjs --dry-run    # preview without writing
 *   node norwegianise-posts.mjs hallo.md     # single file
 *
 * Requirements:
 *   - Node 18+
 *   - ANTHROPIC_API_KEY in environment or .env file
 *   - Run from the project root
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Config ────────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.resolve(__dirname, 'src/lib/posts');
const DRY_RUN = process.argv.includes('--dry-run');
const SINGLE_FILE = process.argv.find(a => a.endsWith('.md') && !a.includes('/'));

function loadApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return;
  try {
    const env = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8');
    for (const line of env.split('\n')) {
      const m = line.match(/^ANTHROPIC_API_KEY\s*=\s*(.+)$/);
      if (m) { process.env.ANTHROPIC_API_KEY = m[1].trim().replace(/^['"]|['"]$/g, ''); return; }
    }
  } catch { /* no .env */ }
}

loadApiKey();
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY is not set.');
  process.exit(1);
}

// ── Frontmatter parsing ───────────────────────────────────────────────────────

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  return { raw: m[1], body: m[2] };
}

// ── Claude API ────────────────────────────────────────────────────────────────

async function norwegianiseBody(body, slug) {
  const prompt = `You are a Norwegian language expert editing blog posts for "Norskeord," a Norwegian vocabulary and grammar learning app.

Your task: translate all remaining English text in the post body to natural Norwegian (Bokmål).

## STRICT RULES — read carefully

### Always KEEP in English (do not translate):
1. **Italic English glosses** on example sentences — lines that start with underscore immediately after a bold Norwegian sentence:
   \`_The cake is good._\`  →  keep as-is
   \`_He runs fast._\`  →  keep as-is
2. **Short English equivalents** quoted inline in Norwegian prose, inside quotes or parentheses:
   \`«give up»\`, \`"quickly"\`, \`stop / give in\`, \`(too hard)\`  →  keep as-is
3. **Bold Norwegian example sentences**: \`**Kaken er god.**\`  →  keep as-is
4. **All YAML frontmatter** (between --- delimiters) — do not touch
5. **URLs, slugs, tag values, CEFR labels** (A1, A2, B1, B2, C)
6. **"Norskeord"** brand name

### Always TRANSLATE to Norwegian:
1. \`> **TL;DR:**\`  →  \`> **Kort sagt:**\`
2. **H2/H3 headings** that are in English or mixed (e.g. \`## God — quality, taste, warmth\`  →  \`## God — kvalitet, smak og varme\`)
3. **Arrow explanations** after examples (lines starting with \`→\` that are in English):
   \`→ Describing the speed of an action — the most typical use.\`  →  Norwegian
4. **Italic error explanations** under ❌/⭕ pairs (lines like \`_Fort is an adverb — use rask to describe a noun._\`):
   translate to Norwegian, keep the italic underscore formatting
5. **## Husk dette** bullet descriptions in English:
   \`- **fort** → quickly (informal / spoken) + soon\`  →  Norwegian description
6. **## Kort forklaring** bullet descriptions in English:
   \`- **fort** → more common in spoken Norwegian; also means "soon"\`  →  Norwegian
7. **Standalone English prose sentences** anywhere in the body
8. **Table cells** — translate English content in Meaning/Typical-use columns; keep Norwegian words as-is

## Output format
Return ONLY the translated body text — no commentary, no markdown fences, no explanation. The output must be ready to write directly back to the file. Preserve all blank lines, all markdown formatting (bold, italic, tables, blockquotes, horizontal rules), and all structure exactly.

Slug (context only): ${slug}

---
${body}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const text = (data.content?.[0]?.text ?? '').trim();

  // Strip accidental markdown fences if the model wraps the output
  return text.replace(/^```(?:markdown)?\n?/, '').replace(/\n?```$/, '').trim();
}

// ── Detection: does this body need work? ─────────────────────────────────────

function hasRemainingEnglish(body) {
  // Quick heuristic — if any of these patterns exist, send to the API
  const patterns = [
    /^>\s+\*\*TL;DR:/m,                          // TL;DR blockquote
    /^##+ [A-Z][a-z]+ —\s+[a-z]/m,              // English h2/h3 subtitle
    /^→ [A-Z]/m,                                  // English arrow explanation
    /^_[A-Z][^_]{10,}_\.?$/m,                    // English italic explanation (not a gloss)
    /\|\s+[A-Z][a-z]+ \(/,                       // English table cell like "good (quality)"
    /^- \*\*\w+\*\* → [a-z]{4}/m,               // English Husk dette bullet
  ];
  return patterns.some(p => p.test(body));
}

// ── Per-file processing ───────────────────────────────────────────────────────

async function processFile(filePath) {
  const filename = path.basename(filePath);
  const original = fs.readFileSync(filePath, 'utf8');
  const parsed = parseFrontmatter(original);

  if (!parsed) {
    console.log(`  SKIP  no frontmatter`);
    return;
  }

  const { raw, body } = parsed;

  if (!hasRemainingEnglish(body)) {
    console.log(`  (no remaining English detected — skipping)`);
    return;
  }

  if (DRY_RUN) {
    console.log(`  [dry-run] would norwegianise body`);
    return;
  }

  const slug = (() => {
    for (const line of raw.split('\n')) {
      if (line.startsWith('slug:')) return line.slice(5).trim().replace(/^['"]|['"]$/g, '');
    }
    return filename.replace('.md', '');
  })();

  let newBody;
  try {
    newBody = await norwegianiseBody(body, slug);
  } catch (err) {
    console.error(`  ERROR: ${err.message}`);
    return;
  }

  // Sanity check: output should be roughly the same length (±40%)
  const ratio = newBody.length / body.length;
  if (ratio < 0.6 || ratio > 1.4) {
    console.warn(`  WARNING: output length ratio ${ratio.toFixed(2)} looks suspicious — skipping write`);
    console.warn(`  Original: ${body.length} chars, New: ${newBody.length} chars`);
    // Write to a .review file for manual inspection instead
    const reviewPath = filePath + '.review';
    fs.writeFileSync(reviewPath, `---\n${raw}\n---\n${newBody}\n`, 'utf8');
    console.warn(`  Saved for review: ${reviewPath}`);
    return;
  }

  const newContent = `---\n${raw}\n---\n${newBody}\n`;

  if (newContent === original) {
    console.log(`  (no changes after translation)`);
    return;
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`  ✓ saved`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  if (DRY_RUN) console.log('DRY RUN — no files will be written\n');

  let files;
  if (SINGLE_FILE) {
    files = [path.join(POSTS_DIR, SINGLE_FILE)];
  } else {
    files = fs.readdirSync(POSTS_DIR)
      .filter(f => f.endsWith('.md'))
      .sort()
      .map(f => path.join(POSTS_DIR, f));
  }

  console.log(`Processing ${files.length} file(s) in ${POSTS_DIR}\n`);

  for (const file of files) {
    console.log(`→ ${path.basename(file)}`);
    await processFile(file);
    console.log();
    if (!DRY_RUN) await new Promise(r => setTimeout(r, 500));
  }

  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
