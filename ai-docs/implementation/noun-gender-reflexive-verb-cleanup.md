# Noun-Gender & Reflexive-Verb Lemma Cleanup

Companion to `data-rules/vocab-and-uttrykk.md`. This is the deferred backlog
surfaced by `check-vocab.mjs` during Phase 4 of
`vocab-uttrykk-reclassification-workflow.md` (2026-07-10 run) — pre-existing
data-quality gaps, not caused by that reclassification work, but worth its
own pass since `check-vocab.mjs` should be clean before relying on it as a
gate for future enrichment batches.

Baseline counts (after the reclassification-workflow fixes landed):

```
node scripts/check-vocab.mjs
📊  Total: 83 error(s), 48 warning(s) across 5 file(s)
```

This splits into three independent buckets. They don't depend on each
other — do them in any order, or in parallel.

---

## Bucket A — Reflexive/particle verb lemmas (24 warnings, mechanical)

**Files:** `vocab-a1.json` (2), `vocab-a2.json` (6), `vocab-b1.json` (3),
`vocab-b2.json` (13).

Every flagged entry has `lemma` identical to `norsk` (both keep the `å `
prefix), e.g.:

```json
{ "norsk": "å sette seg", "lemma": "å sette seg" }
```

Per `data-rules/vocab-and-uttrykk.md`, `lemma` for a verb should be the bare
infinitive with no `å`:

```json
{ "norsk": "å sette seg", "lemma": "sette seg" }
```

This is a pure string transform (`lemma = norsk.replace(/^å /, '')`) — no
linguistic judgment needed, safe to script and apply in one pass.

- [ ] Write (or reuse a one-off) `scripts/fix-reflexive-verb-lemmas.mjs`:
      finds every `part: "verb"` entry across all `vocab-*.json` files where
      `lemma === norsk` and `norsk` starts with `"å "`, strips the prefix
      from `lemma` only, writes `.bak` first (same convention as other
      scripts).
- [ ] Dry-run: print the before/after table, confirm exactly the 24 IDs
      below (plus any new ones introduced since this doc was written) are
      touched, nothing else.
- [ ] Run for real.
- [ ] Re-run `node scripts/check-vocab.mjs` — these 48 warning lines
      (24 entries × 2 lines each) should be gone.

**Affected IDs (as of 2026-07-10):**

| File          | ID                      | norsk               |
| ------------- | ----------------------- | ------------------- |
| vocab-a1.json | v-a1-actions-022        | å sette seg         |
| vocab-a1.json | v-a1-actions-023        | å gifte seg         |
| vocab-a2.json | v-a2-social-life-099    | å slå seg ned       |
| vocab-a2.json | v-a2-social-life-100    | å bestemme seg      |
| vocab-a2.json | v-a2-clothing-026       | å pynte seg         |
| vocab-a2.json | v-a2-social-life-101    | å ønske seg         |
| vocab-a2.json | v-a2-social-life-102    | å ordne seg         |
| vocab-a2.json | v-a2-social-life-103    | å melde seg inn     |
| vocab-b1.json | v-b1-health-052         | å komme seg         |
| vocab-b1.json | v-b1-relationships-040  | å forsone seg       |
| vocab-b1.json | v-b1-travel-034         | å orientere seg     |
| vocab-b2.json | v-b2-work-career-054    | å forsørge seg selv |
| vocab-b2.json | v-b2-advanced-verbs-140 | å føre med seg      |
| vocab-b2.json | v-b2-emotions-066       | å glede seg over    |
| vocab-b2.json | v-b2-advanced-verbs-141 | å jukse seg til     |
| vocab-b2.json | v-b2-advanced-verbs-142 | å lønne seg         |
| vocab-b2.json | v-b2-advanced-verbs-143 | å trekke seg unna   |
| vocab-b2.json | v-b2-advanced-verbs-144 | å befinne seg       |
| vocab-b2.json | v-b2-emotions-067       | å grue seg          |
| vocab-b2.json | v-b2-advanced-verbs-145 | å skryte av         |
| vocab-b2.json | v-b2-advanced-verbs-146 | å føre til          |
| vocab-b2.json | v-b2-advanced-verbs-147 | å støtte seg til    |
| vocab-b2.json | v-b2-advanced-verbs-158 | å forberede seg     |
| vocab-b2.json | v-b2-education-053      | å tilegne seg       |

**Note:** `v-b2-advanced-verbs-142` (`å lønne seg`) and `v-b2-advanced-verbs-140`
(`å føre med seg`) also show up in the cross-level vocab/vocab duplicate list
from the reclassification workflow (Type 3, deferred there). Fixing the
lemma here doesn't touch that — leave the duplicate question for whenever
that backlog is picked up separately.

---

## Bucket B — Invalid `part: "determiner"` (1 error, quick manual fix)

**File:** `vocab-a1.json`, `v-a1-pronouns-and-questions-026` (`"hvor mange"`,
"how many").

`"determiner"` isn't in the validator's `VALID_PARTS` set — the closest
existing convention for question words like this in the data is `pronoun`.

- [ ] Change `"part": "determiner"` → `"part": "pronoun"` for this one entry.
- [ ] Skim `vocab-a1.json`'s other `pronouns-and-questions` entries to
      confirm `pronoun` is consistent with how similar question words
      (`hvor`, `hva`, `hvilken`) are already tagged — adjust the target part
      if a better precedent turns up.
- [ ] Re-run `check-vocab.mjs` — the "unknown part" error should be gone.

---

## Bucket C — Missing noun gender/plural marker (82 errors, needs review)

**Files:** `vocab-b1.json` (17), `vocab-b2.json` (61), `vocab-c.json` (4).

Every flagged entry is a multi-word noun phrase (`part: "noun"`) whose
`norsk` field has no gender marker, e.g.:

```json
{ "norsk": "kunstig intelligens", "part": "noun" }
```

Per `data-rules/vocab-and-uttrykk.md`, a `noun` entry's `norsk` must end
with `(en)` / `(et)`, a plural marker (`(pl.)` / `(b.pl.)`), or `(ubøy.)`
if genuinely indeclinable per NAOB/Bokmålsordboka. This looks like
overflow from the Phase 2 `retag-vocab-parts.mjs` batch mentioned in
`vocab-uttrykk-reclassification-workflow.md` — that session found and
hand-fixed 15 similar cases, but evidently missed a larger tail (this list
is separate from and larger than that original 15).

**This bucket needs linguistic judgment, not just a script** — the gender
attaches to the phrase's head noun (e.g. `kommunikasjon` in `aktiv
kommunikasjon`), and has to be checked against a dictionary rather than
guessed. Recommended approach, mirroring the B1/B2 diacritic-remediation
pattern from earlier work:

- [ ] Generate a worksheet from the current `check-vocab.mjs` output:
      ID, file, `norsk`, head noun (last word, usually — verify per entry).
- [ ] **Group by head noun before doing lookups** — several head nouns
      repeat across multiple entries and only need checking once: - `kommunikasjon` (9×: diplomatisk, aktiv, muntlig, skriftlig,
      toveis, formell, nonverbal, uformell, interkulturell) - `metode` (kvalitativ, kvantitativ, vitenskapelig) - `utvikling` (personlig, faglig) - `energi` (fornybar, ren, grønn — some may be `økonomi` instead,
      double check) - `tenkning` (kritisk, abstrakt) - `intelligens` (kunstig, emosjonell) - and others that turn up once the full list is grouped.
      Confirming one gender per head noun and reusing it across all
      matching rows cuts the actual dictionary-lookup work well below 82.
- [ ] For each unique head noun, check NAOB or Bokmålsordboka for its
      grammatical gender. Most of these are abstract/mass nouns that read
      naturally without an indefinite article in the example sentence —
      per the existing `(ubøy.)` rule, **that alone doesn't qualify them as
      indeclinable**; only mark `(ubøy.)` if the dictionary explicitly
      labels the word `ubøyelig`. Expect the large majority to resolve to
      an ordinary `(en)` or `(et)`.
- [ ] Watch for a few entries that may not be simple "add a gender marker"
      fixes: - `v-b2-psychology-005` (`"det ubevisste"`) — this is a substantivized
      adjective (nominalized via `det` + adjective), which doesn't take
      a normal gender marker the way `hus (et)` does. Decide whether this
      needs a different convention or should be reclassified. - `v-b2-argumentation-003` (`"ad hominem"`) and
      `v-b2-argumentation-020` (`"slippery slope"`) — borrowed
      Latin/English terms used as fixed rhetorical labels. Check whether
      Norwegian academic usage assigns these a conventional gender at
      all, or whether `(ubøy.)` or a reclassification to `phrase`
      (→ uttrykk) fits better. - `v-b2-technology-021` (`"tingenes internett"`) — already genitive
      possessive construction (lit. "the internet of things"); the head
      noun `internett` is what needs the gender marker, not `tingenes`.
- [ ] Apply fixes file by file (`vocab-b1.json` → `vocab-b2.json` →
      `vocab-c.json`), writing `.bak` backups as usual.
- [ ] Re-run `node scripts/check-vocab.mjs` after each file — confirm the
      error count drops by the expected amount before moving to the next
      file, rather than batching all three and validating once at the end.

**Full list of affected IDs (as of 2026-07-10):**

<details>
<summary>vocab-b1.json (17)</summary>

```
v-b1-arts-culture-015     klassisk musikk
v-b1-education-030        livslang læring
v-b1-environment-003      biologisk mangfold
v-b1-environment-014      fornybar energi
v-b1-environment-019      global oppvarming
v-b1-family-009           enslig forsørger
v-b1-health-026           mental helse
v-b1-journalism-005       digital plattform
v-b1-media-015            falske nyheter
v-b1-mental-wellbeing-024 mental styrke
v-b1-personal-growth-031  personlig utvikling
v-b1-science-nature-044   vitenskapelig metode
v-b1-society-063          sosialt sikkerhetsnett
v-b1-sustainability-013   fossilt brensel
v-b1-sustainability-020   ren energi
v-b1-technology-014       kunstig intelligens
v-b1-urban-life-011       vann og avløp
```

</details>

<details>
<summary>vocab-b2.json (61)</summary>

```
v-b2-academic-language-003  akademisk diskurs
v-b2-academic-language-011  kvalitativ metode
v-b2-academic-language-012  kvantitativ metode
v-b2-academic-language-023  teoretisk rammeverk
v-b2-argumentation-003      ad hominem
v-b2-argumentation-020      slippery slope
v-b2-argumentation-021      åpen drøfting
v-b2-argumentation-023      falskt dilemma
v-b2-arts-023               visuelle virkemidler
v-b2-communication-001      aktiv lytting
v-b2-communication-003      diplomatisk kommunikasjon
v-b2-communication-004      aktiv kommunikasjon
v-b2-communication-008      emosjonell intelligens
v-b2-communication-009      ironisk undertone
v-b2-communication-015      muntlig kommunikasjon
v-b2-communication-017      skriftlig kommunikasjon
v-b2-communication-019      toveis kommunikasjon
v-b2-communication-025      formell kommunikasjon
v-b2-communication-028      nonverbal kommunikasjon
v-b2-communication-036      uformell kommunikasjon
v-b2-culture-012            kulturell hegemoni
v-b2-culture-013            kulturell kapital
v-b2-culture-030            kulturelt mangfold
v-b2-culture-032            multikulturelt samfunn
v-b2-culture-035            interkulturell kommunikasjon
v-b2-education-001          akademisk integritet
v-b2-education-024          videregående skole
v-b2-education-032          kritisk tenkning
v-b2-environment-017        sirkulær økonomi
v-b2-environment-019        utrydningstruet art
v-b2-global-issues-005      digitalt autoritarisme
v-b2-global-issues-008      fredsbevarende styrke
v-b2-global-issues-009      geopolitisk rivalisering
v-b2-global-issues-010      globale helseproblemer
v-b2-global-issues-012      humanitær krise
v-b2-global-issues-013      internasjonal organisasjon
v-b2-global-issues-014      internasjonal rettssak
v-b2-global-issues-015      internasjonal solidaritet
v-b2-global-issues-026      statsstøttet terrorisme
v-b2-global-issues-027      sårbar stat
v-b2-global-issues-033      global styring
v-b2-global-issues-034      global ulikhet
v-b2-global-issues-036      grønn økonomi
v-b2-global-issues-041      nordlig halvkule
v-b2-media-001              brukergenerert innhold
v-b2-media-003              digitalt innhold
v-b2-medicine-011           palliativ omsorg
v-b2-philosophy-001         abstrakt tenkning
v-b2-psychology-005         det ubevisste
v-b2-religion-017           religiøs toleranse
v-b2-social-issues-041      sosial mobilitet
v-b2-technology-005         digital infrastruktur
v-b2-technology-006         digital transformasjon
v-b2-technology-007         digital tvilling
v-b2-technology-008         digitale skillet
v-b2-technology-021         tingenes internett
v-b2-technology-022         virtuell virkelighet
v-b2-technology-040         utvidet virkelighet
v-b2-technology-044         åpen kildekode
v-b2-work-career-009        faglig utvikling
v-b2-work-career-017        likestilling i arbeidslivet
```

</details>

<details>
<summary>vocab-c.json (4)</summary>

```
v-c-complex-emotions-001  sjelelig uro
v-c-complex-emotions-003  eksistensielt tomrom
v-c-complex-emotions-004  empatisk resonans
v-c-complex-emotions-020  eksistensiell ensomhet
```

</details>

---

## Order of work

1. Bucket A (mechanical, ~5 minutes once scripted)
2. Bucket B (one entry, ~2 minutes)
3. Bucket C (the real work — budget for a genuine review session, not a
   quick pass; grouping by head noun should keep the dictionary-lookup
   count well under 82)

## Done when

```bash
node scripts/check-vocab.mjs
```

reports `0 error(s), 0 warning(s)` across all files — or, if any rows in
Bucket C turn out to be genuine judgment calls with no clean fix (e.g. the
`ad hominem` / `slippery slope` borrowed-term cases), those are explicitly
noted rather than silently left as validator noise.

This doc doesn't cover the other backlog identified during the
reclassification workflow's Phase 4 (the deferred cross-file/within-file
duplicates, the two entries with empty `example` fields, or the pending
`renumber-ids.mjs` decision) — those are tracked separately in
`vocab-uttrykk-reclassification-workflow.md`.
