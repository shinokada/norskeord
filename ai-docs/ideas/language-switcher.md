# Language switcher for multiple languages

Good timing to rethink this — the toggle pattern breaks completely beyond 2 languages.

A few options, roughly in order of complexity:

---

### Option 1: Dropdown menu

Click a button → dropdown shows all available languages. Most familiar pattern, scales to any number of languages.

```
[ 🌍 EN ▾ ]
  ✓ English
    Norsk
    Українська
    عربي
```

**Pros:** Simple, universally understood, works at 2 or 20 languages  
**Cons:** One extra click vs the current toggle

---

### Option 2: Inline pill row

All languages visible as pills, active one highlighted. No click to open.

```
[ NO ]  [ EN ]  [ UK ]  [ AR ]
```

**Pros:** Zero clicks, all options always visible  
**Cons:** Gets crowded beyond ~5 languages, tricky on mobile

---

### Option 3: Dropdown with flag/script preview

Like Option 1 but richer — shows native script alongside the code.

```
[ 🌍 EN ▾ ]
  ✓ EN  English
    NO  Norsk
    UK  Українська
    AR  عربي
```

This is what most modern language-learning apps do (Duolingo, Babbel).

---

### My recommendation

**Option 3 (dropdown with native script)** — for these reasons:

- Scales to unlimited languages without layout changes
- Native script helps users self-identify their language instantly, important for Arabic/Ukrainian learners who may not read "English" labels well
- Flowbite Svelte already has a `Dropdown` component so minimal custom work
- Matches the pattern users expect from apps they already use

The only thing I'd add: show the **currently selected translation language** in the button itself (native script + code), not just a generic globe. So if a user picks Arabic the button shows `AR عربي` — they can always see what's active at a glance.

---

### What about the NO/EN switcher?

That's your **UI language** (Paraglide), separate from the **translation language** shown on flashcards. Worth keeping them visually distinct — perhaps the UI language toggle stays in the nav header (small, top-right), while the translation language picker sits closer to the flashcard content itself where it's more contextually obvious what it controls.
