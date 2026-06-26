#!/usr/bin/env node
/**
 * fix-lemma-norsk-swap.mjs
 *
 * Fixes vocab-*.json entries where `norsk` and `lemma` are swapped
 * according to the vocab rules:
 *
 *   norsk  → display form with annotation, e.g. "hus (et)", "å få", "glad"
 *   lemma  → bare dictionary form, e.g. "hus", "få", "glad"
 *
 * Detects two wrong patterns and fixes them:
 *
 *   PATTERN A — lemma has gender marker, norsk is bare:
 *     norsk: "funksjonshemning"   lemma: "funksjonshemning (en)"
 *     → fix: swap them
 *
 *   PATTERN B — lemma has "å " prefix, norsk doesn't:
 *     norsk: "spise"   lemma: "å spise"
 *     → fix: swap them
 *
 * Also catches mixed cases, e.g. lemma: "å spise (en)" (unlikely but handled).
 *
 * Usage (from repo root):
 *   node scripts/fix-lemma-norsk-swap.mjs
 *   node scripts/fix-lemma-norsk-swap.mjs --dry-run
 *   node scripts/fix-lemma-norsk-swap.mjs --file vocab-b2.json   (single file)
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = resolve(__dirname, "../src/lib/data");

const args    = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const getArg  = (flag) => { const i = args.indexOf(flag); return i !== -1 && args[i+1] ? args[i+1] : null; };

// Which files to process
const singleFile = getArg("--file");
const files = singleFile
  ? [resolve(DATA_DIR, singleFile)]
  : readdirSync(DATA_DIR)
      .filter(f => f.match(/^vocab-[a-z0-9]+\.json$/))
      .map(f => resolve(DATA_DIR, f));

// Regex: a gender/article suffix like " (en)", " (et)", " (ei)"
const GENDER_RE = /\s+\((en|et|ei)\)$/i;
// Verb prefix
const AA_RE = /^å\s+/;

let totalFixed = 0;

for (const filePath of files) {
  const fileName = basename(filePath);
  const entries  = JSON.parse(readFileSync(filePath, "utf-8"));
  const fixes    = [];

  for (const entry of entries) {
    const { norsk, lemma } = entry;
    if (!norsk || !lemma) continue;

    const lemmaNoun = GENDER_RE.test(lemma);
    const norskNoun = GENDER_RE.test(norsk);
    const lemmaVerb = AA_RE.test(lemma);
    const norskVerb = AA_RE.test(norsk);

    let fixType = null;

    // PATTERN A: lemma has gender, norsk doesn't (and norsk is bare base of lemma)
    if (lemmaNoun && !norskNoun) {
      // Verify norsk looks like the bare form of lemma (ignore case)
      const bareFromLemma = lemma.replace(GENDER_RE, "").trim();
      if (norsk.toLowerCase() === bareFromLemma.toLowerCase()) {
        fixType = "gender-swap";
      }
    }

    // PATTERN B: lemma has å, norsk doesn't
    if (!fixType && lemmaVerb && !norskVerb) {
      const bareFromLemma = lemma.replace(AA_RE, "").trim();
      if (norsk.toLowerCase() === bareFromLemma.toLowerCase()) {
        fixType = "verb-swap";
      }
    }

    if (fixType) {
      fixes.push({ id: entry.id, fixType, oldNorsk: norsk, oldLemma: lemma });
      // Swap
      entry.norsk  = lemma;
      entry.lemma  = norsk;
    }
  }

  if (fixes.length === 0) {
    console.log(`${fileName}: no fixes needed`);
    continue;
  }

  totalFixed += fixes.length;
  console.log(`\n${fileName}: ${fixes.length} fix(es)`);
  for (const f of fixes) {
    console.log(`  [${f.fixType}] ${f.id}`);
    console.log(`    norsk : "${f.oldNorsk}" → "${f.id ? entries.find(e => e.id === f.id)?.norsk : ""}" `);
    console.log(`    lemma : "${f.oldLemma}" → "${f.id ? entries.find(e => e.id === f.id)?.lemma : ""}"`);
  }

  if (!DRY_RUN) {
    writeFileSync(filePath, JSON.stringify(entries, null, 2) + "\n", "utf-8");
    console.log(`  → written`);
  }
}

console.log(`\n${DRY_RUN ? "[DRY RUN] " : ""}Total fixed: ${totalFixed} entries across ${files.length} file(s)`);
if (DRY_RUN) console.log("No files written.");
