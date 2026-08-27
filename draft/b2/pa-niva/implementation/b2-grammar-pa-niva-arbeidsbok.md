---
title: B2 Grammar På Nivå Arbeidsbok
reference: draft/b2/pa-niva/arbeidsbok-b2.md
data-started: 2026-08-26
data-completed:
---

# Nivå B2 Grammar — "På Nivå" arbeidsbok — Implementation Plan

## Overview

Coverage of `draft/b2/pa-niva/arbeidsbok-b2.md` (author Gølin Kaurin Nilsen, "Grammatikk i Norsk
som andrespråk", CEFR-based) + `draft/b2/pa-niva/arbeidsbok-b2-fasit.md` (answer key) — the same
source book the in-progress vocab/uttrykk project
[`b2-vocab-uttrykk-pa-niva-arbeidsbok.md`] mines for `vocab-b2.json`/`uttrykk-b2.json`. This plan
covers the **grammar** side only.

**Division of labor with the vocab/uttrykk plan:** the vocab plan's §2 already triaged the book
into in-scope (idiom/paraphrase/particle-verb sections — `PARSETNINGER`, `FASTE UTTRYKK`,
`METAFORER`, particle-verb drills, etc.) and out-of-scope (pure grammar mechanics: artikkel/kjønn
drills, entall↔flertall transforms, verb tense drills, aktiv/passiv transforms,
setningsledd/setningsanalyse, ordstilling, komma/stor-liten bokstav, determinativ choice,
adjektiv gradbøyning mechanics, leddsetning/nominale setninger structure). **Those "out of scope"
sections are precisely this plan's target** — the book is unusual in that almost the entire thing
is grammar drills with only a thin seam of extractable vocab/uttrykk, the inverse of "Opp og
fram!"'s structure (which had rich per-chapter vocab tables and comparatively sparse named
grammar topics).

**Language of new content:** Norwegian-only for `prompt`/`hint`/`explanation` (per
`grammar-with-only-norsk.md`, already resolved project-wide).

**Copyright approach (unchanged):** every question is newly written; the textbook is used only to
identify which rule/difficulty to target — never copy or closely paraphrase its sentences or
reuse its characters/names. Invent fresh names/sentences, same convention as every prior grammar
plan.

**Vocab integration:** every question should use real B2-or-below vocabulary, verified against
`vocab-b2.json`/`uttrykk-b2.json` (and lower-level files where the word is more basic), same
mirror-vocab convention used throughout the B1 plans.

**Question types:** existing `'fill' | 'order' | 'transform' | 'minimal-pair' | 'multiple-choice'`
should cover everything here — no schema changes expected.

**Existing B2 grammar landscape:** `grammar.json` already has B2 content from two prior rounds
(~23 topics, ~200+ questions per project notes — `modale-adverb`, `sammensatte-substantiv`,
`hoflig-preteritum`, `kontrast-uttrykk`, `ordfamilie-avledning` extensions, and others). All B2
grammar content is Plus-gated. A validation script already exists:
`check-b2-grammar-vocab.mjs`. Phase 1 triage (below) should check each kapittel/subsection
against this existing topic list before proposing a new topic — same reuse-first approach every
prior grammar plan has followed.

---

## Source structure (from the book's own table of contents)

The book has 4 kapittel, each split into named subsections (page numbers from the TOC, useful for
cross-referencing the print edition, not the markdown line numbers):

- **KAPITTEL 1 ORDKLASSER** (word classes)
  - Substantiv (nouns) · Adjektiv (adjectives) · Determinativer (determiners) · Verb · Adverb ·
    Preposisjoner (prepositions) · Konjunksjoner (conjunctions) · Subjunksjoner (subjunctions)
- **KAPITTEL 2 ORDLAGING** (word formation)
  - Sammensatte ord (compounds) · Avledninger (derivations) · Mer om ord (more about words)
- **KAPITTEL 3 SETNINGER** (sentences)
  - Setningsledd (sentence elements/analysis) · Helsetninger (main clauses) · Leddsetninger
    (subordinate clauses)
- **KAPITTEL 4 TEKSTER OG TEKSTBINDING** (texts and text cohesion)
  - Tekstbinding (text cohesion/connectives) · Tekster (texts — reading/comprehension pieces)

`FASIT` (answer key) is a separate section starting after Kapittel 4, mirrored in
`arbeidsbok-b2-fasit.md` — same parallel-file structure the vocab plan already established a
reading convention for (§1/§3 there: fasit headings mirror the arbeidsbok's heading structure one
level down, matched by section title + exercise number). This grammar plan should reuse that same
parallel-read convention, since the fasit answer is often what reveals which specific rule an
exercise is testing (the arbeidsbok exercise text alone is sometimes just an underline/fill-blank
prompt with no rule name attached).

Each named subsection above (e.g. "SUBSTANTIV") contains multiple numbered exercises with their
own sub-headers (e.g. "1 PETRAS PARIS") — the real per-topic granularity lives at this level, not
at the kapittel/subsection level. This mirrors the vocab plan's own finding that section titles
alone are too coarse a unit — the actual rule being tested only becomes clear on reading each
numbered exercise (and often its fasit answer).

---

## Cross-checks before writing content

1. **Overlap with the vocab/uttrykk plan** — before treating any exercise as grammar-question
   material, confirm it isn't one of the vocab plan's in-scope idiom/paraphrase/particle-verb
   sections (`PARSETNINGER`, `FASTE UTTRYKK`, `METAFORER`, `KULTURELLE UTTRYKK`, `HOMONYMER`,
   particle-verb drills, `ORDTAK`, etc. — see that plan's §2 for the full list). Those stay that
   plan's territory; this plan should only draft questions for the "pure grammar mechanics"
   sections that plan explicitly marked out of scope.
2. **Overlap with existing B2 grammar topics** — `grammar.json`'s current B2 topics (see Overview
   above) may already cover a given kapittel/subsection's rule. Default to extending an existing
   topic with fresh B2 (or cross-level) questions over inventing a new one, same precedent as the
   B1 plans (`nyanser-uttrykk` spanning B2/C, `ordfamilie-avledning` spanning C/B1/B2, etc.).
3. **Overlap with the B1 "Opp og fram!" grammar plan** (`b1-grammar-opp-og-fram-arbeidsbok.md`) —
   several topic ids there (`passiv-bli-s`, `adj-comparison`, `noun-plurals`,
   `sammensatte-substantiv`, `ordfamilie-avledning`, etc.) already carry both B1 and B2 questions.
   New B2 entries from this book must use fresh example sentences/characters, not duplicate
   either source's existing questions.

---

## Process (mirrors `b1-grammar-opp-og-fram-arbeidsbok.md` / `b1-grammar-stein-paa-stein.md` /
## `c-grammar-preposition.md`)

1. **Phase 0 (this document) — done.** Source structure captured from the book's own table of
   contents; division of labor against the vocab/uttrykk plan established; existing B2 grammar
   landscape and cross-check list noted.
2. **Phase 1 — chapter-by-chapter triage. Not started; this is the next session's starting
   point (see below).** Read each kapittel/subsection's actual exercise content (not just the
   TOC headers) in parallel with `arbeidsbok-b2-fasit.md`, exercise by exercise, and classify
   each into: (a) extend an existing B2 grammar topic, (b) extend an existing topic at a
   different CEFR level (cross-level reuse, same precedent as the B1 plans), (c) a genuinely new
   topic (no existing `GrammarTopic` fits), or (d) skip — already the vocab plan's territory, or
   pure review/reference material with no discrete rule to quiz (same pattern as "Oversikt over
   verbformene" being skipped in the B1 plan). Log findings and a preliminary
   reuse/new-topic table per kapittel, the same way the B1 plan's "Phase 1 confirmed findings"
   sections did, before any question-writing starts.
3. **Phase 2 — content, one topic-touch at a time** (session-limited): build ~8–12 questions per
   topic-touch, batch a few touches per session, mirroring vocab against
   `vocab-b2.json`/`uttrykk-b2.json` (and lower-level files for simpler supporting words). Where a
   topic-touch surfaces a genuine rule-text gap (a nuance the existing `rules.ts` entry doesn't
   mention), extend `explanationEn`/`explanationNb` before writing questions — same convention as
   every B1 topic-touch in the sibling plan.
4. **Validate:** run `check-b2-grammar-vocab.mjs` (already exists) and a JSON-validity +
   duplicate-ID check before applying to the real `grammar.json`.
5. **Track progress** in this doc: mark each topic-touch ✅ Done with its final question count and
   any rule-text-gap notes, same convention as every prior grammar plan's progress log.

---

## Next session starting point

**Phase 1 has not started.** Next session should begin the chapter-by-chapter triage, working
through Kapittel 1 (Ordklasser) first in TOC order — Substantiv → Adjektiv → Determinativer →
Verb → Adverb → Preposisjoner → Konjunksjoner → Subjunksjoner — reading each numbered exercise
against its `arbeidsbok-b2-fasit.md` answer, cross-checking against the existing B2 (and
cross-level) `grammar.json` topic list, and excluding anything already claimed by the vocab
plan's §2 in-scope list. Log a per-subsection findings section in this doc (reuse/new-topic table
+ any skip decisions), the same way `b1-grammar-opp-og-fram-arbeidsbok.md`'s "Phase 1 confirmed
findings" sections did, before moving on to Kapittel 2–4.
