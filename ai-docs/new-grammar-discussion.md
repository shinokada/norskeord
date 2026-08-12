ME: I am wondering about grammar questions. I am thinking to add something like c-adjective or c-verb, c-noun for different forms/bøyning questions using from src/lib/data/vocab-c.json and for b2, b1, etc. What do you think?

CLAUDE: Quick take, based on what's actually in `vocab-c.json`: it has a `part` field (noun/verb/adjective/adverb/...), so a systematic per-word-class generator is technically doable — counts at C are noun 833, verb 725, adjective 586.

A few concerns before going that route:

1. **Scale mismatch** — generating bøyning questions for all 833 C-level nouns etc. is a different kind of project than the workbook mining we've been doing (10–20 items per chapter). Worth deciding: full coverage, or a curated subset?
2. **Naming clashes with existing convention** — current topics are narrow-and-specific (`adj-comparison`, `adj-definite`, `sterke-verb-c`, `ordfamilie-avledning`), not broad per-word-class buckets. A flat `c-adjective`/`c-verb`/`c-noun` topic would mix comparison, bestemt form, irregular forms, etc. into one bucket — could hurt if the app filters/serves practice by topic for focused drilling.
3. **Overlap** — `adj-comparison`/`adj-definite` (A2/B1) and `sterke-verb-c` already exist; a new `c-adjective`/`c-verb` scheme would need to either subsume or coexist with these.

One clarifying question before I go further

Is this vocab-driven bøyning idea meant to replace the workbook-based Batch D (adjective) plan, or is it a separate, bigger initiative we'd plan after finishing the current workbook batches?
Separate/bigger — park it, keep going with Phase 0 + Batches A-E as planned
