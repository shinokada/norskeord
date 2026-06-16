Good context to work with — here's what I found and what I think.

**What the codebase already does**

`definition` (a monolingual Norwegian definition) already exists as an optional field on `VocabEntry`, populated for B1, B2, and C, but not A1/A2. The flashcard UI already exposes it as a third mode (`defnor`, "Norwegian definition → Norwegian word"), gated behind `hasDefinitions`, alongside `noreng` and `engnor`. So the infrastructure for "Norwegian-only" already exists from B1 onward — the question is really about _defaults and emphasis_, not new schema work.

Worth noting too: your Norskprøven B1 reading passages, questions, and answer options are already 100% Norwegian — no English anywhere. So there's already a precedent in your own content that B1 learners are expected to operate in Norwegian for comprehension tasks.

**My take on B1 vs B2**

I'd split it like this:

- **A1–A2**: keep fully bilingual. No argument here — vocabulary is too sparse for Norwegian definitions to be self-supporting (you'd be defining unknown words with other unknown words).

- **B1**: this is the _transition_ level, not the cutover level. CEFR describes B1 as the "threshold" — learners can follow the gist of standard input but still lean heavily on L1 for abstract or low-frequency words. I'd make Norwegian definitions the **primary/default** mode at B1 (since you already have them), but I wouldn't strip English out of the data. Keep `english`/`example_english` as a one-tap fallback. The reason is practical, not just pedagogical: many B1 learners arrive having just scraped through A2, and a hard "no English" wall on _new vocabulary_ (as opposed to reading practice, where context carries you) can cause frustration and churn — which matters a lot for a paid product's retention.

- **B2**: this is where I'd actually feel comfortable going Norwegian-first by default with English demoted to optional/hidden-by-default. CEFR B2 = "independent user" — can handle abstract topics and complex text without translation support. By B2, a learner who still needs English for every word is arguably not really at B2 yet, and your `definition` field becomes genuinely useful rather than a nice-to-have.

- **C**: Norwegian-only by default, full stop. Keep English in the data for flexibility (cheap), but it shouldn't be a prominent mode.

**The thing I'd actually worry about**

The real risk isn't _which level_ — it's whether your B1 `definition` strings are written with a controlled "defining vocabulary." If a B1 definition uses B2/C-level words to explain a B1 word, it's circular and useless to the learner (this is the classic problem with monolingual learner dictionaries — Cobuild/Longman solve it with a fixed ~2000-word defining vocabulary). I'd spot-check a sample of your B1 `definition` fields against your own A1–B1 vocab lists and see how many words in the definitions fall outside that range. If it's a lot, that's a bigger blocker to "B1 = Norwegian only" than the UI question is.

**Practical suggestion**

Rather than removing English from the data (one-way, expensive, hard to undo), I'd:

1. Make `defnor` the default mode for B1+ based on `profile.target_level` (cheap, reversible, A/B-testable).
2. Audit B1 definitions for defining-vocabulary creep before pushing it as default at B1.
3. At B2, consider de-emphasizing the `engnor` toggle in the UI (move it one tap further away) rather than deleting `english` from the JSON.

So: **B1 = Norwegian-first with English as a safety net, B2 = Norwegian by default with English optional.** That's the split I'd ship.
