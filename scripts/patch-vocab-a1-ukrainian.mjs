#!/usr/bin/env node
/**
 * Patch script: Ukrainian translation improvements for vocab-a1.json
 * Based on native-speaker review (June 2026).
 *
 * Run from repo root:
 *   node patch-vocab-a1-ukrainian.mjs
 *
 * Dry-run (preview changes without writing):
 *   node patch-vocab-a1-ukrainian.mjs --dry-run
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const FILE = resolve("src/lib/data/vocab-a1.json");
const DRY_RUN = process.argv.includes("--dry-run");

// ---------------------------------------------------------------------------
// Patch definitions
// Each entry: { id, field, from, to, note }
// ---------------------------------------------------------------------------
const PATCHES = [
  // --- Recommended translation changes ---
  {
    id: "v-a1-greetings-016",
    field: "ukrainian",
    from: "Як ти?",
    to: "Як справи? / Як ти поживаєш?",
    note: "More natural for 'Hvordan har du det?'",
  },
  {
    id: "v-a1-greetings-016",
    field: "example_ukrainian",
    from: "Привіт! Як ти?",
    to: "Привіт! Як справи?",
    note: "Match updated main translation",
  },
  {
    id: "v-a1-greetings-017",
    field: "ukrainian",
    from: "Я добре",
    to: "У мене все добре / Я почуваюся добре",
    note: "More natural for 'Jeg har det bra'",
  },
  {
    id: "v-a1-greetings-017",
    field: "example_ukrainian",
    from: "Дякую, я добре.",
    to: "Дякую, у мене все добре.",
    note: "Match updated main translation",
  },
  {
    id: "v-a1-family-023",
    field: "ukrainian",
    from: "близнюк",
    to: "близнюк / близнючка",
    note: "Add feminine form for gender completeness",
  },
  {
    id: "v-a1-body-008",
    field: "ukrainian",
    from: "рука",
    to: "рука (від плеча до кисті)",
    note: "Disambiguate arm vs hand (both were 'рука')",
  },
  {
    id: "v-a1-body-009",
    field: "ukrainian",
    from: "долоня / рука",
    to: "кисть руки / долоня",
    note: "More precise for 'hånd' (hand, not arm)",
  },
  {
    id: "v-a1-clothes-006",
    field: "ukrainian",
    from: "черевик",
    to: "взуття / туфля / черевик",
    note: "Broaden to cover all shoe types",
  },
  {
    id: "v-a1-household-items-019",
    field: "ukrainian",
    from: "свічка",
    to: "світло / свічка",
    note: "'et lys' can mean light or candle",
  },
  {
    id: "v-a1-pronouns-and-questions-023",
    field: "ukrainian",
    from: "той / та / те",
    to: "той / та / те / воно (залежить від контексту)",
    note: "Add neuter + context note",
  },

  // --- Example sentence improvements ---
  // "Takk for maten" → more natural Ukrainian
  {
    id: "v-a1-greetings-009",
    field: "example_ukrainian",
    from: "Дякую за їжу.",
    to: "Дякую за обід.",
    note: "'Takk for maten' is idiomatic post-meal thanks; 'обід' sounds more natural",
  },
  // "Vil du ha sukker i kaffen?" → genitive is more idiomatic
  {
    id: "v-a1-food-021",
    field: "example_ukrainian",
    from: "Ти хочеш цукор у каву?",
    to: "Ти хочеш цукру в каву?",
    note: "Genitive 'цукру' is more idiomatic in Ukrainian",
  },

  // --- Minor style / register improvements ---
  // å snakke: "говорити" → "розмовляти" as primary in example
  {
    id: "v-a1-verbs-007",
    field: "example_ukrainian",
    from: "Я трохи говорю норвезькою.",
    to: "Я трохи розмовляю норвезькою.",
    note: "'розмовляти' is slightly more idiomatic for conversational speech",
  },
  // спørsmål: питання → запитання
  {
    id: "v-a1-classroom-020",
    field: "ukrainian",
    from: "питання",
    to: "запитання",
    note: "'запитання' is more idiomatic for a question (vs abstract notion)",
  },
  {
    id: "v-a1-classroom-020",
    field: "example_ukrainian",
    from: "У тебе є питання?",
    to: "У тебе є запитання?",
    note: "Match updated main translation",
  },

  // --- Gender completeness for adjectives ---
  {
    id: "v-a1-adjectives-019",
    field: "ukrainian",
    from: "молодий",
    to: "молодий / молода",
    note: "Add feminine form",
  },
  {
    id: "v-a1-adjectives-009",
    field: "ukrainian",
    from: "щасливий",
    to: "щасливий / щаслива",
    note: "Add feminine form",
  },
  {
    id: "v-a1-adjectives-010",
    field: "ukrainian",
    from: "втомлений",
    to: "втомлений / втомлена",
    note: "Add feminine form",
  },
  {
    id: "v-a1-adjectives-011",
    field: "ukrainian",
    from: "голодний",
    to: "голодний / голодна",
    note: "Add feminine form",
  },
];

// ---------------------------------------------------------------------------
// Apply patches
// ---------------------------------------------------------------------------
const raw = readFileSync(FILE, "utf-8");
const data = JSON.parse(raw);

let changed = 0;
let skipped = 0;
const log = [];

for (const patch of PATCHES) {
  const item = data.find((e) => e.id === patch.id);
  if (!item) {
    log.push(`⚠️  NOT FOUND: ${patch.id}`);
    skipped++;
    continue;
  }
  const current = item[patch.field];
  if (current !== patch.from) {
    log.push(
      `⚠️  SKIP (value changed): ${patch.id}.${patch.field}\n   expected: ${patch.from}\n   found:    ${current}`
    );
    skipped++;
    continue;
  }
  item[patch.field] = patch.to;
  log.push(
    `✅ ${patch.id}.${patch.field}\n   ${patch.from}\n → ${patch.to}\n   (${patch.note})`
  );
  changed++;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
console.log("\n=== vocab-a1.json Ukrainian patch ===\n");
log.forEach((l) => console.log(l + "\n"));
console.log(`\nSummary: ${changed} changed, ${skipped} skipped`);

if (DRY_RUN) {
  console.log("\n[DRY RUN] No file written.");
} else {
  writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`\nWritten → ${FILE}`);
}
