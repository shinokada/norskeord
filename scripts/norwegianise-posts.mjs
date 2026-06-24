#!/usr/bin/env node
/**
 * norwegianise-posts.mjs
 *
 * Removes English gloss lines from blog posts so every post is 100% Norwegian.
 *
 * Background
 * ----------
 * Previous script passes (run in an earlier session) already handled:
 *   - TL;DR → Kort sagt
 *   - English h2/h3 section headings → Norwegian
 *   - English → explanations → Norwegian
 *   - Italic error explanations under ❌/⭕ pairs → Norwegian
 *   - Table headers/cells → Norwegian
 *
 * This script handles the final remaining English pattern:
 *
 *   **Bold Norwegian sentence.**
 *   _English gloss._          ← remove this line
 *   → Norwegian explanation.
 *
 * A gloss line is an italic line (_..._) that appears immediately after a
 * bold line (**...**) and contains predominantly Latin/ASCII text. It is NOT
 * the same as an italic error explanation (which follows ❌/⭕ markers).
 *
 * Rationale for full removal (no translation):
 *   - Browser-level translation (Chrome, Safari, Edge) handles entire pages
 *     instantly, covering every reader's language — not just English.
 *   - Every serious Norwegian learning site publishes in Norwegian only.
 *   - Removing the gloss lines makes the posts shorter and cleaner.
 *
 * Usage
 * -----
 *   # Preview what would change (no writes)
 *   node scripts/norwegianise-posts.mjs --dry-run
 *
 *   # Process all posts
 *   node scripts/norwegianise-posts.mjs
 *
 *   # Process a single post
 *   node scripts/norwegianise-posts.mjs god-bra-fin.md
 *
 * After running, review with:
 *   git diff src/lib/posts/
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const POSTS_DIR = new URL('../src/lib/posts/', import.meta.url).pathname;
const DRY_RUN = process.argv.includes('--dry-run');

// A "gloss line" is an italic line that:
//   1. Starts and ends with _ (single underscore, not **)
//   2. Immediately follows a bold line (**...** or **N. ...**)
//   3. Its content is predominantly Latin/ASCII (i.e. it is English, not a
//      Norwegian italic note which would contain Norwegian characters or
//      typical Norwegian words)
//
// We detect "predominantly Latin" as: the line body (stripped of _ and
// punctuation) contains no Norwegian-specific characters (æøå) AND at least
// 60 % of its word characters are ASCII letters. Norwegian italic error
// explanations that survived the previous pass should already be in Norwegian
// and will therefore contain æøå or common Norwegian words.

function isPredominantlyLatin(text) {
  // Strip italic markers and punctuation
  const body = text.replace(/^_|_$/g, '').trim();
  if (/[æøåÆØÅ]/.test(body)) return false;          // has Norwegian characters → not a gloss
  const wordChars = body.replace(/[^a-zA-Z]/g, '');
  const asciiLetters = body.replace(/[^a-zA-Z]/g, '').replace(/[^a-zA-Z]/g, '');
  if (wordChars.length === 0) return false;
  // All remaining word characters are ASCII — treat as English gloss
  return true;
}

function isItalicLine(line) {
  return /^_[^_].+[^_]_\s*$/.test(line.trim()) || /^_[^_]{1,3}_\s*$/.test(line.trim());
}

function isBoldLine(line) {
  // Matches: **Word.** or **1. Sentence.** or **Word er bra.**
  return /^\*\*.+\*\*/.test(line.trim());
}

function removeGlossLines(content) {
  const lines = content.split('\n');
  const result = [];
  let removedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = result.length > 0 ? result[result.length - 1] : '';

    // Check if this is an italic line immediately following a bold line
    if (isItalicLine(line) && isBoldLine(prevLine)) {
      const trimmed = line.trim();
      if (isPredominantlyLatin(trimmed)) {
        // Skip this gloss line
        removedCount++;
        continue;
      }
    }

    result.push(line);
  }

  return { content: result.join('\n'), removedCount };
}

function processFile(filePath) {
  const original = readFileSync(filePath, 'utf8');
  const { content, removedCount } = removeGlossLines(original);

  if (removedCount === 0) {
    return { changed: false, removedCount: 0 };
  }

  if (!DRY_RUN) {
    writeFileSync(filePath, content, 'utf8');
  }

  return { changed: true, removedCount };
}

// Determine which files to process
let files;
const arg = process.argv.find((a) => !a.startsWith('--') && a.endsWith('.md'));

if (arg) {
  // Single file — accept bare filename or full path
  const filePath = arg.includes('/') ? arg : join(POSTS_DIR, arg);
  files = [filePath];
} else {
  files = readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => join(POSTS_DIR, f));
}

// Run
let totalChanged = 0;
let totalRemoved = 0;

for (const filePath of files) {
  const { changed, removedCount } = processFile(filePath);
  if (changed) {
    totalChanged++;
    totalRemoved += removedCount;
    const label = DRY_RUN ? '[dry-run] would update' : 'updated';
    console.log(`${label}: ${basename(filePath)} (${removedCount} gloss line${removedCount !== 1 ? 's' : ''} removed)`);
  }
}

if (totalChanged === 0) {
  console.log('No English gloss lines found — all posts already fully Norwegian.');
} else {
  const action = DRY_RUN ? 'Would remove' : 'Removed';
  console.log(`\n${action} ${totalRemoved} gloss line${totalRemoved !== 1 ? 's' : ''} across ${totalChanged} file${totalChanged !== 1 ? 's' : ''}.`);
}
