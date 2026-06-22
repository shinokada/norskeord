#!/usr/bin/env node
/**
 * Patch script: Spanish & Ukrainian improvements for vocab-a1.json
 * Based on two native-speaker reviews (June 2026).
 *
 * Run from repo root:
 *   node scripts/patch-vocab-a1-review.mjs
 *
 * Dry-run (preview changes without writing):
 *   node scripts/patch-vocab-a1-review.mjs --dry-run
 *
 * Review sources:
 *   ai-docs/translation-review/vocab-a1.md
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const FILE = resolve('src/lib/data/vocab-a1.json');
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Patch definitions
// Each entry: { id, field, from, to, note }
// ---------------------------------------------------------------------------
const PATCHES = [
  // =========================================================================
  // SPANISH — Definite issues (Review 1)
  // =========================================================================

  // 1. Pen example — "¿Puedo prestarte tu bolígrafo?" is grammatically odd.
  //    "prestarte" implies you are lending TO the listener, not borrowing FROM them.
  //    The Norwegian "Kan jeg låne pennen din?" means "Can I borrow your pen?"
  {
    id: 'v-a1-classroom-006',
    field: 'example_spanish',
    from: '¿Puedo prestarte tu bolígrafo?',
    to: '¿Me prestas tu bolígrafo?',
    note: "Review 1: 'prestarte' reverses the borrowing direction. '¿Me prestas...?' is correct and natural."
  },

  // 2. Bad weather — "El tiempo está malo" is grammatically acceptable but unnatural.
  //    Native speakers say "Hace mal tiempo" or "El tiempo está feo".
  {
    id: 'v-a1-adjectives-006',
    field: 'example_spanish',
    from: 'El tiempo está malo hoy.',
    to: 'Hace mal tiempo hoy.',
    note: "Review 1: 'El tiempo está malo' is unnatural. 'Hace mal tiempo' is the idiomatic form."
  },

  // 3. Wool hat — "caliente" describes physical heat (e.g. a hot drink), not warmth
  //    as a material property. For clothing, "cálido" (warm/cozy) is correct.
  {
    id: 'v-a1-clothes-016',
    field: 'example_spanish',
    from: 'El gorro es caliente y suave.',
    to: 'El gorro es cálido y suave.',
    note: "Review 1: 'caliente' = physically hot (liquid/object). 'cálido' = warm (material property)."
  },

  // 4. Belt example — "mantiene los pantalones arriba" is a literal word-for-word
  //    translation that sounds unnatural. "en su sitio" or "sostiene" is idiomatic.
  {
    id: 'v-a1-clothes-014',
    field: 'example_spanish',
    from: 'El cinturón mantiene los pantalones arriba.',
    to: 'El cinturón mantiene los pantalones en su sitio.',
    note: "Review 1: '...arriba' is an unnatural literal translation. 'en su sitio' is idiomatic."
  },

  // 5. Road — "camino" means path/trail/way, not road in the vehicle sense.
  //    The Norwegian "vei" is closer to "carretera" (paved road).
  //    NOTE: The spanish field already has "una carretera / un camino", so only
  //    the example is patched to match the preferred term.
  {
    id: 'v-a1-transportation-018',
    field: 'example_spanish',
    from: 'El camino es largo.',
    to: 'La carretera es larga.',
    note: "Review 1: 'camino' = path/trail. 'carretera' better matches Norwegian 'vei' (paved road)."
  },

  // =========================================================================
  // SPANISH — Definite issues (Review 2)
  // =========================================================================

  // 6. god kveld vs god natt — both are currently "buenas noches" in the spanish
  //    field, which erases the evening/night distinction important for A1 learners.
  //    "god kveld" (good evening) → "buenas tardes" is more pedagogically distinct.
  {
    id: 'v-a1-greetings-005',
    field: 'spanish',
    from: 'buenas noches',
    to: 'buenas tardes',
    note: "Review 2: 'god kveld' = good evening; 'god natt' = good night. Both mapping to 'buenas noches' removes the distinction. 'Buenas tardes' covers evening in Spanish."
  },
  {
    id: 'v-a1-greetings-005',
    field: 'example_spanish',
    from: '¡Buenas noches! Pasa, entra.',
    to: '¡Buenas tardes! Pasa, entra.',
    note: 'Match updated spanish field for god kveld.'
  },

  // 7. på gjensyn — "hasta la vista" is pop-culture (Terminator) and not used
  //    in standard language teaching. "Hasta la próxima" is the correct formal equivalent.
  {
    id: 'v-a1-greetings-023',
    field: 'spanish',
    from: 'hasta la vista (formal)',
    to: 'hasta la próxima',
    note: "Review 2: 'hasta la vista' is pop-culture slang. 'Hasta la próxima' (until next time) is the natural equivalent of 'på gjensyn'."
  },
  {
    id: 'v-a1-greetings-023',
    field: 'example_spanish',
    from: 'Gracias por hoy. ¡Hasta la vista!',
    to: 'Gracias por hoy. ¡Hasta la próxima!',
    note: 'Match updated spanish field.'
  },

  // 8. oransje example — adjective must agree with plural subject.
  //    "Las zanahorias son naranja" → "Las zanahorias son naranjas" (plural agreement).
  {
    id: 'v-a1-colors-010',
    field: 'example_spanish',
    from: 'Las zanahorias son naranja.',
    to: 'Las zanahorias son naranjas.',
    note: "Review 2: Adjective 'naranja' must agree in number with plural subject 'zanahorias' → 'naranjas'."
  },

  // =========================================================================
  // UKRAINIAN — Definite issues (Review 2)
  // =========================================================================

  // 9. beklager — "вибачаюся" (reflexive) is considered stylistically flawed in
  //    modern Ukrainian. "вибачте" (imperative, polite) is the correct form.
  {
    id: 'v-a1-greetings-013',
    field: 'ukrainian',
    from: 'вибачаюся / мені шкода',
    to: 'вибачте / мені шкода',
    note: "Review 2: 'вибачаюся' (reflexive 'I excuse myself') is considered incorrect in modern Ukrainian. 'Вибачте' is the standard polite apology."
  },
  {
    id: 'v-a1-greetings-013',
    field: 'example_ukrainian',
    from: 'Вибачаюся, я запізнився.',
    to: 'Вибачте, я запізнився.',
    note: 'Match updated ukrainian field.'
  }

  // 10. to (number two) — "два кота" has a case error. After the numeral "два"
  //     (two), animate masculine nouns take the genitive singular: "два кота" is
  //     actually already correct in Ukrainian (genitive sg of "кіт" = "кота").
  //     However, the example_ukrainian uses "є два кота" which is natural.
  //     Review 2 flagged this — after re-checking, "два кота" IS the correct
  //     genitive singular in Ukrainian, so no change needed for the noun form.
  //     The review contained a minor error on this point; we skip this patch.

  // =========================================================================
  // SPANISH — Stylistic improvements worth applying (Review 1)
  // =========================================================================

  // 11. å snakke example — "Hablo un poco de noruego" is standard but slightly
  //     awkward with the preposition "de". "Hablo un poco noruego" is also accepted
  //     and arguably more natural in many Spanish-speaking regions.
  //     Given this is A1 level, we keep "de" as both are correct and "de" is
  //     more commonly taught. SKIPPING — borderline stylistic choice.

  // 12. tommel opp — "Ella muestra el pulgar hacia arriba" is descriptive but wordy.
  //     "Ella levanta el pulgar" is more natural. However the current phrasing is
  //     understandable for A1. SKIPPING — minor stylistic preference.
];

// ---------------------------------------------------------------------------
// Apply patches
// ---------------------------------------------------------------------------
const raw = readFileSync(FILE, 'utf-8');
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
  log.push(`✅ ${patch.id}.${patch.field}\n   ${patch.from}\n → ${patch.to}\n   (${patch.note})`);
  changed++;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------
console.log('\n=== vocab-a1.json review patch (Spanish + Ukrainian) ===\n');
log.forEach((l) => console.log(l + '\n'));
console.log(`\nSummary: ${changed} changed, ${skipped} skipped`);

if (DRY_RUN) {
  console.log('\n[DRY RUN] No file written.');
} else {
  writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`\nWritten → ${FILE}`);
}
