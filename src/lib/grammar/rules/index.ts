// src/lib/grammar/rules/index.ts
// Merged grammar rules. One file per taxonomy chapter (see taxonomy.ts); this file
// re-exports them so `import { GRAMMAR_RULES } from '$lib/grammar/rules'` keeps working.
// Keys must stay unique across chapters: a duplicate would silently override another rule.
import type { GrammarRule } from '$lib/types';
import { SETNINGSLEDD_RULES } from './setningsledd';
import { HELSETNINGER_RULES } from './helsetninger';
import { SVAR_RULES } from './svar';
import { LEDDSETNINGER_RULES } from './leddsetninger';
import { DET_SETNINGER_RULES } from './det-setninger';
import { SUBSTANTIV_RULES } from './substantiv';
import { PRONOMEN_RULES } from './pronomen';
import { ADJEKTIV_RULES } from './adjektiv';
import { BESTEMMERORD_RULES } from './bestemmerord';
import { VERB_RULES } from './verb';
import { ADVERB_RULES } from './adverb';
import { PARTISIPPER_RULES } from './partisipper';
import { PREPOSISJONER_RULES } from './preposisjoner';
import { KONJUNKSJONER_OG_SUBJUNKSJONER_RULES } from './konjunksjoner-og-subjunksjoner';
import { SAMMENBINDING_AV_SETNINGER_RULES } from './sammenbinding-av-setninger';
import { ORDLAGING_RULES } from './ordlaging';
import { ORDBRUK_OG_NYANSER_RULES } from './ordbruk-og-nyanser';
import { UTTRYKK_OG_IDIOMER_RULES } from './uttrykk-og-idiomer';
import { SKRIVING_RULES } from './skriving';

/**
 * Grammar rule definitions for the Grammar feature.
 * These are stored as a TS module (not JSON) because they contain
 * bilingual prose explanations that don't belong in the Paraglide catalogue.
 *
 * `titleEn`/`explanationEn` are unused at runtime everywhere (not just for
 * Nivå C) — grammar questions are Norwegian-only at every level as of
 * ai-docs/implementation/grammar-with-only-norsk.md. Kept only as a
 * possible future fallback; no schema change, smallest possible diff.
 *
 * `explanationNb` formatting (see ExplanationText.svelte + ai-docs/
 * implementation/grammar-explanation-update.md, "Problem A"):
 * - A blank line ("\n\n") starts a new paragraph.
 * - A line starting with "• " is a bullet item; consecutive bullet lines
 *   become one list. Not every rule needs this — plain single-paragraph
 *   strings still render fine as-is, so migrate rules opportunistically.
 * - "**text**" anywhere renders bold — use to label a term/pattern (e.g.
 *   a suffix), not for general emphasis.
 * - More than 2 blocks auto-collapses behind a "Vis mer" toggle, showing
 *   only the intro paragraph by default.
 */
export const GRAMMAR_RULES: Record<string, GrammarRule> = {
  ...SETNINGSLEDD_RULES,
  ...HELSETNINGER_RULES,
  ...SVAR_RULES,
  ...LEDDSETNINGER_RULES,
  ...DET_SETNINGER_RULES,
  ...SUBSTANTIV_RULES,
  ...PRONOMEN_RULES,
  ...ADJEKTIV_RULES,
  ...BESTEMMERORD_RULES,
  ...VERB_RULES,
  ...ADVERB_RULES,
  ...PARTISIPPER_RULES,
  ...PREPOSISJONER_RULES,
  ...KONJUNKSJONER_OG_SUBJUNKSJONER_RULES,
  ...SAMMENBINDING_AV_SETNINGER_RULES,
  ...ORDLAGING_RULES,
  ...ORDBRUK_OG_NYANSER_RULES,
  ...UTTRYKK_OG_IDIOMER_RULES,
  ...SKRIVING_RULES
};

export const GRAMMAR_RULE_LIST: GrammarRule[] = Object.values(GRAMMAR_RULES);
