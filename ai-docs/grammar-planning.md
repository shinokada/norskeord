# Grammar planning

Q: How can I implement above active learning in grammar questions. I'd like to brainstorm it.

Ans:
Great topic for brainstorming! Looking at these exercises, they're classic **fill-in-the-blank** drills — good for recognition, but passive. Let me think through how to make them actively engaging in a digital format.

## What the exercises are testing

- **Image 1 (Ex. 17):** Word order with negation (_ikke_) — where does _ikke_ sit relative to the verb in main clauses vs. subordinate clauses
- **Image 2 (Ex. 3):** Inserting _det – er – ikke_ in the right order
- **Image 2 (Ex. 4):** Transforming _at/å_-clauses into _det_-sentences

These are all about **Norwegian sentence structure** — the core grammar challenge for learners.

---

## Brainstorm: active learning approaches

### 1. 🃏 Sentence-builder (drag & drop)

Give the words as tiles, the user arranges them in order. More active than typing because the learner has to _construct_ the sentence, not just recognise the gap. Works especially well for Ex. 17 where the word set is small (_liker – ikke_).

**Active learning boost:** No auto-correct until they submit the whole sentence. Forces commitment before feedback.

---

### 2. ✍️ Typed recall (blank input)

Closest to the paper version, but smarter: accept flexible matching (ignore punctuation, minor typos), and on wrong answers show _why_ it's wrong — e.g. "In a subordinate clause, _ikke_ comes **before** the verb."

**Active learning boost:** Typing from memory is stronger than drag-and-drop because there's no visual scaffold.

---

### 3. 🔀 Sentence transformation (Ex. 4 style)

Show the source sentence (_At du kan komme, er fint._) and ask the user to type the _det_-version. This is the most demanding — pure production, no hints.

**Active learning boost:** Highest transfer to real speech and writing.

---

### 4. 💬 Contextual dialogue fill-in (Ex. 3 style)

Embed the blanks inside a realistic mini-conversation rather than isolated sentences. The context gives natural meaning cues. Could show a chat bubble UI.

**Active learning boost:** Connects grammar to real communicative situations.

---

### 5. 🔍 Error-spotting

Show a sentence with the word order **wrong** — user identifies and fixes it. E.g. _"Jeg forstår ikke hvorfor de liker ikke vinteren."_ → spot the error.

**Active learning boost:** Requires deeper processing than filling a blank.

---

### 6. 🎯 Minimal pair judgment

Show two versions of a sentence — one correct, one wrong. User picks the right one and explains _why_. Simple UI, fast to complete, trains intuition.

**Active learning boost:** Forces metalinguistic awareness, not just pattern-matching.

---

## How it fits the paper + digital principle

From the study you read about — the ideal is **not** to just put the paper exercise on a screen. The digital version should do things paper _can't_:

| Paper            | Digital active version                      |
| ---------------- | ------------------------------------------- |
| Write the answer | Instant feedback with rule explanation      |
| Move on          | Spaced repetition — wrong answers come back |
| No context       | Dialogue/story context for each sentence    |
| Static           | Randomised sentence order each attempt      |

---

## My recommendation for a first implementation

Start with **typed recall + immediate rule explanation on errors** (approach 2), applied to the subordinate clause _ikke_-placement pattern — it's the most teachable rule and the most common mistake. Then layer in sentence transformation (approach 3) for Ex. 4-style drills once the basic input flow works.

What direction interests you most? Are you thinking of adding this to the existing Norskeord flashcard flow, or as a separate grammar section?Great topic for brainstorming! Looking at these exercises, they're classic **fill-in-the-blank** drills — good for recognition, but passive. Let me think through how to make them actively engaging in a digital format.

## What the exercises are testing

- **Image 1 (Ex. 17):** Word order with negation (_ikke_) — where does _ikke_ sit relative to the verb in main clauses vs. subordinate clauses
- **Image 2 (Ex. 3):** Inserting _det – er – ikke_ in the right order
- **Image 2 (Ex. 4):** Transforming _at/å_-clauses into _det_-sentences

These are all about **Norwegian sentence structure** — the core grammar challenge for learners.

---

## Brainstorm: active learning approaches

### 1. 🃏 Sentence-builder (drag & drop) - I think this is too mechanical and complex to implement

Give the words as tiles, the user arranges them in order. More active than typing because the learner has to _construct_ the sentence, not just recognise the gap. Works especially well for Ex. 17 where the word set is small (_liker – ikke_).

**Active learning boost:** No auto-correct until they submit the whole sentence. Forces commitment before feedback.

---

### 2. ✍️ Typed recall (blank input)

Closest to the paper version, but smarter: accept flexible matching (ignore punctuation, minor typos), and on wrong answers show _why_ it's wrong — e.g. "In a subordinate clause, _ikke_ comes **before** the verb."

**Active learning boost:** Typing from memory is stronger than drag-and-drop because there's no visual scaffold.

---

### 3. 🔀 Sentence transformation (Ex. 4 style)

Show the source sentence (_At du kan komme, er fint._) and ask the user to type the _det_-version. This is the most demanding — pure production, no hints.

**Active learning boost:** Highest transfer to real speech and writing.

---

### 4. 💬 Contextual dialogue fill-in (Ex. 3 style)

Embed the blanks inside a realistic mini-conversation rather than isolated sentences. The context gives natural meaning cues. Could show a chat bubble UI.

**Active learning boost:** Connects grammar to real communicative situations.

---

### 5. 🔍 Error-spotting

Show a sentence with the word order **wrong** — user identifies and fixes it. E.g. _"Jeg forstår ikke hvorfor de liker ikke vinteren."_ → spot the error.

**Active learning boost:** Requires deeper processing than filling a blank.

---

### 6. 🎯 Minimal pair judgment

Show two versions of a sentence — one correct, one wrong. User picks the right one and explains _why_. Simple UI, fast to complete, trains intuition.

**Active learning boost:** Forces metalinguistic awareness, not just pattern-matching.

---

## How it fits the paper + digital principle

From the study you read about — the ideal is **not** to just put the paper exercise on a screen. The digital version should do things paper _can't_:

| Paper            | Digital active version                      |
| ---------------- | ------------------------------------------- |
| Write the answer | Instant feedback with rule explanation      |
| Move on          | Spaced repetition — wrong answers come back |
| No context       | Dialogue/story context for each sentence    |
| Static           | Randomised sentence order each attempt      |

---

## My recommendation for a first implementation

Start with **typed recall + immediate rule explanation on errors** (approach 2), applied to the subordinate clause _ikke_-placement pattern — it's the most teachable rule and the most common mistake. Then layer in sentence transformation (approach 3) for Ex. 4-style drills once the basic input flow works.

What direction interests you most? Are you thinking of adding this to the existing Norskeord flashcard flow, or as a separate grammar section?

Q: Under Prepare there are Quiz and Practice tests. I'm thinking to add Grammar section. What do you think?

Ans:
Let me look at the existing structure first.Now let me look at the nav layout and the norskproven section to understand how "Prepare" is structured.Now I have the full picture. Let me check the messages files and the norskproven practice route quickly to understand conventions.Now I have a thorough understanding of the whole system. Here's my considered take:

---

## Yes — and here's how to think it through

A Grammar section under **Prepare** makes excellent sense. Here's why it fits, and what to think about before building it.

### Why it belongs under Prepare

Quiz and Practice Tests are both **active retrieval tools** — you know something or you don't, you get immediate feedback. Grammar exercises are the same contract. It's not passive reading like Blog or Guide. The user is _doing something_ and getting checked. Prepare is the right home.

### What's already there to learn from

Looking at the codebase, the Quiz route is very well-built — it has a state machine (`idle → questioning → revealing → summary`), three question types (MC, fill-in-blank, typed), and a feedback cycle. Grammar questions can **reuse this same pattern** rather than inventing a new one. The question types map almost perfectly:

| Paper exercise (from your images) | Digital equivalent already in quiz               |
| --------------------------------- | ------------------------------------------------ |
| Fill in _liker / ikke_            | `FillBlankQuestion` — already exists             |
| Word-order reconstruction         | New: **tile drag-and-drop** (sentence builder)   |
| _At…_ → _Det er…_ transformation  | `TypeAnswerQuestion` — already exists            |
| _det – er – ikke_ ordering        | New: **token ordering** (small variant of above) |

So the new route `/grammar` would share most of its UI shell with `/quiz`, but add 1–2 new question types.

### The key architectural question

**Where does grammar content live?** Vocab lives in structured JSON per level/category. Grammar needs a different data shape — sentences with slots, rules, explanations. You'd likely want a new `src/lib/grammar/` folder with either:

- Markdown files with YAML frontmatter (consistent with your blog posts)
- Or typed JSON/TS objects (consistent with vocab data)

The JSON approach is probably better here since the data is highly structured (sentence + blank position + correct answer + rule explanation).

### What I'd suggest _not_ doing (yet)

Drag-and-drop tile ordering is satisfying but complex to build and tricky on mobile. For a first version, **typed fill-in-blank with rule explanations on wrong answers** covers the most important exercises from your images and can be built quickly reusing the existing quiz components.

### The nav change itself is minimal

In `Nav.svelte`, it's literally one new `<DropdownItem>` under the Prepare dropdown pointing to `/grammar`. You'd also add `nav_grammar` to both `messages/en.json` and `messages/nb.json`.

---

**Bottom line:** Yes, add it. The infrastructure is nearly all there. The interesting design decision is the data format for grammar questions — that's worth settling before writing any Svelte. Want to dig into that next, or start sketching the data structure?

Q: You wrote:

```
The interesting design decision is the data format for grammar questions — that's worth settling before writing any Svelte.
```

Can you find out what do you think?

Ans:
Let me look at the existing data structures carefully before forming an opinion.Now I have a complete picture. Let me look at one more thing — the `v2-regelen.md` post since it's the most grammar-focused blog post and may hint at the rule structure.Now I have everything I need. Here's my concrete recommendation:

---

## My recommendation: typed JSON, purpose-built for grammar

### What I found in the codebase

There are three data shapes already in the project:

- **`vocab-a1.json`** — flat array of word objects, one record per entry
- **`norskproven-a2-1.json`** — grouped by type (`reading`, `writing`, `oral`), each with nested questions
- **`types.ts`** — all interfaces defined centrally, everything is strongly typed

Grammar questions don't map cleanly onto either existing shape. They need their own type. But the _pattern_ to follow is clearly `norskproven` — it's structured JSON with nested questions, typed in `types.ts`, and the data lives in `src/lib/data/`.

---

### The proposed shape

A grammar question has three layers that vocab questions don't have:

**1. The rule** — what grammatical principle is being tested (e.g. V2, _ikke_-placement, _det_-sentences). This is the thing to explain on a wrong answer.

**2. The exercise** — one sentence with a blank, or a source sentence to transform.

**3. The answer** — the correct fill, plus optionally an explanation of _why_.

Here's what I'd put in `types.ts`:

```typescript
export type GrammarTopic =
  | 'ikke-placement' // where ikke sits in main vs subordinate clauses
  | 'v2-word-order' // inversion after fronted adverbials
  | 'det-sentence' // At X er Y → Det er Y at X
  | 'det-er-ikke' // ordering det / er / ikke
  | 'modal-verb-order'; // position of modal + infinitive

export interface GrammarRule {
  id: string; // e.g. 'ikke-placement'
  title: string; // e.g. 'Ikke-placement'
  explanation: string; // short rule, shown on wrong answer
  explanationNb: string; // Norwegian version
}

export interface GrammarQuestion {
  id: string; // e.g. 'gq-ikke-001'
  topic: GrammarTopic;
  cefr: CEFRLevel;
  type: 'fill' | 'transform';
  // fill: show `sentence` with a blank, user types the missing word(s)
  sentence?: string; // e.g. "Jeg forstår ikke hvorfor de _____ vinteren."
  words?: string[]; // the word set to use, e.g. ["liker", "ikke liker"]
  // transform: show `source`, user types the transformed version
  source?: string; // e.g. "At du kan komme, er fint."
  answer: string; // the correct answer
  alternates?: string[]; // other accepted forms
  hint?: string; // optional nudge, e.g. "subordinate clause"
}
```

And the data file would be `src/lib/data/grammar.json` — a flat array of `GrammarQuestion` objects, grouped loosely by topic. No separate per-level files like vocab, because grammar rules cut across levels (V2 applies from A2 through C2).

---

### Why not markdown?

The blog posts (`v2-regelen.md`, etc.) are already doing the job of _explaining_ rules in prose. Grammar questions are the _practice_ layer on top of that. They're highly structured data — a sentence, an answer, an alternate, a topic tag. Markdown frontmatter would fight that structure rather than serve it. JSON keeps it machine-readable, queryable by topic/level, and consistent with how `norskproven` data is already handled.

### Why not extend the existing Quiz types?

The existing `QuizQuestion` types are tightly coupled to `VocabEntry` — every question carries a `entry: VocabEntry` reference that drives the feedback card (norsk word, example sentence, pronounce button). Grammar questions don't have a vocab entry — they have a _rule_. Mixing them would bloat the quiz types and require branching all over the quiz UI. Keeping grammar as a separate `GrammarQuestion` type in its own route is cleaner.

### The one open question

Do you want the grammar questions to feed into the FSRS spaced-repetition system (the same `saveProgress` / `progressMap` logic that vocab and quiz use)? That would be the strongest active-learning outcome — wrong answers come back sooner. It's doable since FSRS just needs a string key, but it means `GrammarQuestion` needs a stable `id` used as that key. That's already in the shape above (`gq-ikke-001` etc.), so it's ready if you want it.

Yes, I think we need to use the FSRS spaced-repetition system.
I created a empty file, ai-docs/implementation/grammar.md. Can you write your implementation plan?
