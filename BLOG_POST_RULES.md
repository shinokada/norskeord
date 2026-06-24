# Blog post rules

Posts live in `src/lib/posts/` as Markdown files with YAML frontmatter.

---

## Frontmatter

```yaml
---
title: 'Hallo — når nordmenn faktisk bruker det'
description: 'Hallo er ikke det samme som «hello» på engelsk. Det brukes når man svarer i telefonen eller vil få noens oppmerksomhet – ikke som en vanlig hilsen ansikt til ansikt.'
slug: hallo
cefr: A2                      # or an array: [A1, A2]
publishedAt: 2026-10-21       # future dates are hidden until that date
type: guide                   # optional — omit for standard word/expression posts
tags: [greetings, vocabulary]
decks:                        # optional — links to flashcard decks at the bottom
  - level: a1
    category: greetings
    label: A1 Greetings
---
```

- **`title` and `description` must be in Norwegian (Bokmål).**
- Use Norwegian quotation marks `«»` in descriptions, not `""`.
- `slug` determines the URL (`/blog/slug`) and must be unique. The filename should match for clarity, but the router resolves posts by slug, not filename.
- **Slugs use only `[a-z0-9-]`** — lowercase ASCII, digits, hyphens. Transliterate Norwegian characters: `å → a`, `ø → o`, `æ → ae`. Examples: `trøtt → trett`, `på → pa`, `være → vaere`, `lærer → laerer`.
- `type: guide` is for how-to and study-tips posts. Omit for vocabulary/grammar posts.
- Posts with a future `publishedAt` are not shown in the blog listing or accessible by URL.

---

## Language

**Write entirely in Norwegian (Bokmål).** No English anywhere in the post body — not in headings, explanations, glosses, table cells, or bullet descriptions.

This is an intentional choice: browser-level translation (Chrome, Safari, Edge) covers any reader's language instantly. Norwegian content is also itself a learning feature — learners are expected to read and engage with it.

**Do not add inline English glosses** after example sentences. The previous pattern of `_The cake is good._` under a bold Norwegian line has been removed from all posts.

**Do not add `_In English:_ …` paragraphs.** These were a legacy pattern and have been removed.

**`> **Kort sagt:**`** is the standard blockquote label. Never use `> **TL;DR:**`.

---

## Structure

Posts follow a consistent section order. Not every section is required for every post, but the order should be respected when sections are present.

```
> **TL;DR:** …

## Kort forklaring
Short Norwegian summary of the core concept (3–6 lines).

## [Main sections]
One h2 per word, rule, or concept being compared.
Each section: brief Norwegian explanation + numbered examples.

## Sammenligningstabell
Comparison table. Use when contrasting 2+ words or forms.

## Vanlige feil
Common mistakes. Format:
  ❌ Wrong example
  ⭕ Correct example
  _Short explanation in italics._

## Husk dette
Bullet-point summary. Keep to 4–6 points.

## Vanlige uttrykk
Common fixed phrases using the word(s), separated by · (middle dot).

## Relaterte ord
Related vocabulary, separated by · (middle dot).

_→ Cross-link to related posts._
```

---

## Example formatting

Numbered examples follow this pattern:

```markdown
**1. Han løper fort.**
→ Forklaring på norsk av hva dette eksempelet viser.
```

- Bold the Norwegian sentence.
- Use `→` for the Norwegian explanation immediately after, kept to one line where possible.
- **No English gloss line** between the bold sentence and the `→` line.
- Number examples within a section when there are more than one.

---

## Tables

Use Markdown pipe tables. All column headers and cell content in Norwegian.

```markdown
| Norsk   | Betydning                   | Typisk bruk          |
| ------- | --------------------------- | -------------------- |
| **god** | god (kvalitet, smak)        | mat · person         |
| **bra** | god (generelt, hverdagslig) | film · «det går bra» |
```

---

## Cross-links

End posts with italic cross-links to related posts:

```markdown
_→ Vil du lære om X? Les: [Tittel på post](/blog/slug)_
```

---

## What to avoid

- No English anywhere in the post body — no glosses, no headings, no table cells, no bullet descriptions, no inline notes.
- No `_In English:_ …` callout paragraphs.
- No duplicate English sections (`## In English` or `## **In English**`) at the end of a file.
- No English `title` or `description` in frontmatter.
- No `> **TL;DR:**` — use `> **Kort sagt:**` instead.
- No hard-coded UI strings — button labels, nav text, and section chrome belong in `src/lib/paraglide/messages/`, not in post content.
- No italic English gloss lines after bold Norwegian example sentences (`_He runs fast._` pattern).