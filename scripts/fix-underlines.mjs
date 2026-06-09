#!/usr/bin/env node
/**
 * fix-underlines.mjs
 *
 * Prettier mangles fill-in-the-blank underscores (e.g. ____) in Markdown
 * by wrapping them with escaped star sequences. This script reverses that.
 *
 * Examples of what gets fixed:
 *   **\_\_\_\_**                    →  ____
 *   \***\*\*\*\*\***\_\_\***\*\*\*\*\***    →  __
 *   **\*\*\*\***\_\_**\*\*\*\***           →  __
 *
 * Usage:
 *   node fix-underlines.mjs                  # fixes draft/a2-b1/*.md
 *   node fix-underlines.mjs path/to/dir      # fixes all *.md in that dir
 *   node fix-underlines.mjs path/to/file.md  # fixes a single file
 *   node fix-underlines.mjs --dry-run        # preview only, no writes
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { resolve, extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const targetArgs = args.filter((a) => a !== '--dry-run');

const projectRoot = resolve(__dirname, '..');
const defaultTarget = join(projectRoot, 'draft', 'a2-b1');
const target = targetArgs[0] ? resolve(targetArgs[0]) : defaultTarget;

/**
 * Fix a single line.
 *
 * The pattern to match is any contiguous sequence consisting only of
 * backslashes, asterisks, and underscores — provided it contains at
 * least one underscore AND at least one star or backslash (i.e. it's
 * actually mangled, not already clean).
 *
 * The replacement keeps only the underscores, unescaped.
 */
function fixLine(line) {
  return line.replace(/(?:[\\*]+)(?:\\?_)+(?:[\\*]+)/g, (match) => {
    // Strip all backslashes and asterisks, keep only underscores
    return match.replace(/[\\*]/g, '');
  });
}

function fixContent(content) {
  return content.split('\n').map(fixLine).join('\n');
}

function processFile(filePath) {
  const original = readFileSync(filePath, 'utf8');
  const fixed = fixContent(original);

  if (original === fixed) {
    console.log(`  ✓ unchanged  ${filePath}`);
    return false;
  }

  if (dryRun) {
    console.log(`  ~ would fix  ${filePath}`);
    const origLines = original.split('\n');
    const fixedLines = fixed.split('\n');
    for (let i = 0; i < origLines.length; i++) {
      if (origLines[i] !== fixedLines[i]) {
        console.log(`    line ${i + 1}:`);
        console.log(`      before: ${origLines[i]}`);
        console.log(`      after:  ${fixedLines[i]}`);
      }
    }
    return true;
  }

  writeFileSync(filePath, fixed, 'utf8');
  console.log(`  ✎ fixed      ${filePath}`);
  return true;
}

function processTarget(t) {
  const stat = statSync(t);
  if (stat.isFile()) {
    processFile(t);
    return;
  }
  if (stat.isDirectory()) {
    const files = readdirSync(t)
      .filter((f) => extname(f) === '.md')
      .sort();
    if (files.length === 0) {
      console.log(`No .md files found in ${t}`);
      return;
    }
    let fixedCount = 0;
    for (const f of files) {
      if (processFile(join(t, f))) fixedCount++;
    }
    console.log(
      `\nDone. ${fixedCount}/${files.length} file(s) ${dryRun ? 'would be ' : ''}modified.`
    );
  }
}

console.log(`fix-underlines.mjs${dryRun ? ' [DRY RUN]' : ''}`);
console.log(`Target: ${target}\n`);
processTarget(target);
