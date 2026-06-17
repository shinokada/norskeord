#!/usr/bin/env node
/**
 * add-brand-to-i18n.mjs
 *
 * Patches messages/en.json and messages/nb.json to add "Norskeord" into
 * visible, crawlable homepage and landing-page text so Google can associate
 * the brand name with the site.
 *
 * Run from the project root:
 *   node scripts/add-brand-to-i18n.mjs
 *
 * Or from the scripts directory:
 *   node add-brand-to-i18n.mjs
 *
 * Prints a before/after diff for every key it touches. Safe to re-run —
 * skips keys that already contain the target value.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Patches ───────────────────────────────────────────────────────────────────
// Each entry: { file, key, value }
// `value` is what the key should be set to after patching.

const PATCHES = [
  // ── en.json ─────────────────────────────────────────────────────────────────

  // H1: "Learn Norwegian with Norskeord" (split across two keys)
  {
    file: 'messages/en.json',
    key: 'home_hero_heading',
    value: 'Learn Norwegian with'
  },
  {
    file: 'messages/en.json',
    key: 'home_hero_heading_highlight',
    value: 'Norskeord'
  },

  // First paragraph under H1
  {
    file: 'messages/en.json',
    key: 'home_hero_body',
    value:
      'Norskeord gives you vocabulary flashcards, grammar practice, quizzes, and Norskprøven preparation — all in one place, from A1 to C.'
  },

  // Badge pill above the H1
  {
    file: 'messages/en.json',
    key: 'home_hero_badge',
    value: 'Norskeord — Norwegian learning from A1 to C'
  },

  // Features section heading
  {
    file: 'messages/en.json',
    key: 'home_features_heading',
    value: 'Everything Norskeord offers'
  },

  // Guide subtitle — already has "Norskeord" in the title; add to subtitle too
  {
    file: 'messages/en.json',
    key: 'guide_page_subtitle',
    value: 'Norskeord is a vocabulary app built for serious Norwegian learners.'
  },

  // Login page — currently has zero brand signal
  {
    file: 'messages/en.json',
    key: 'login_subheading',
    value: "Sign in to Norskeord — we'll send a link to your email, no password needed."
  },

  // ── nb.json ─────────────────────────────────────────────────────────────────

  // H1 in Norwegian
  {
    file: 'messages/nb.json',
    key: 'home_hero_heading',
    value: 'Lær norsk med'
  },
  {
    file: 'messages/nb.json',
    key: 'home_hero_heading_highlight',
    value: 'Norskeord'
  },

  // First paragraph under H1
  {
    file: 'messages/nb.json',
    key: 'home_hero_body',
    value:
      'Norskeord gir deg vokabular-flashkort, grammatikkøvelser, quiz og Norskprøven-forberedelse — alt på ett sted, fra A1 til C.'
  },

  // Badge pill
  {
    file: 'messages/nb.json',
    key: 'home_hero_badge',
    value: 'Norskeord — norsk ordforråd fra A1 til C'
  },

  // Features section heading
  {
    file: 'messages/nb.json',
    key: 'home_features_heading',
    value: 'Alt Norskeord tilbyr'
  },

  // Guide subtitle
  {
    file: 'messages/nb.json',
    key: 'guide_page_subtitle',
    value: 'Norskeord er en vokabularapp for seriøse norskinnlærere.'
  },

  // Login page
  {
    file: 'messages/nb.json',
    key: 'login_subheading',
    value: 'Logg inn på Norskeord — vi sender en lenke til e-posten din, ingen passord nødvendig.'
  }
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadJson(relPath) {
  const abs = resolve(ROOT, relPath);
  return { abs, data: JSON.parse(readFileSync(abs, 'utf8')) };
}

function saveJson(abs, data) {
  writeFileSync(abs, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// ── Main ──────────────────────────────────────────────────────────────────────

// Group patches by file so we only read/write each file once
const byFile = {};
for (const patch of PATCHES) {
  (byFile[patch.file] ??= []).push(patch);
}

let totalChanged = 0;
let totalSkipped = 0;

for (const [relPath, patches] of Object.entries(byFile)) {
  console.log(`\n📄  ${relPath}`);
  console.log('─'.repeat(60));

  const { abs, data } = loadJson(relPath);
  let fileChanged = false;

  for (const { key, value } of patches) {
    const current = data[key];

    if (current === undefined) {
      console.log(`  ⚠️  Key not found: "${key}" — skipping`);
      totalSkipped++;
      continue;
    }

    if (current === value) {
      console.log(`  ✓  Already up to date: "${key}"`);
      totalSkipped++;
      continue;
    }

    console.log(`  ✏️  "${key}"`);
    console.log(`     Before: ${current}`);
    console.log(`     After:  ${value}`);

    data[key] = value;
    fileChanged = true;
    totalChanged++;
  }

  if (fileChanged) {
    saveJson(abs, data);
    console.log(`\n  💾  Saved ${relPath}`);
  } else {
    console.log(`\n  — No changes needed.`);
  }
}

console.log('\n' + '═'.repeat(60));
console.log(`  Done. ${totalChanged} key(s) updated, ${totalSkipped} skipped.`);
console.log('═'.repeat(60) + '\n');
