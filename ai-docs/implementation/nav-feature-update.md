# Nav & Homepage Feature Update — Implementation Plan

## Goal

Shift norskeord.no from a flashcard-first product to a multi-feature Norwegian learning platform.
The nav and homepage currently spend ~80% of their real estate on vocabulary decks, burying Grammar, Quiz, and Norskprøven. This plan introduces per-level hub pages, simplifies the nav, and restructures the homepage so every major feature is immediately visible.

---

## Status

**✅ ALL STEPS COMPLETE** (as of 2026-06-07)

| Step                               | Status | Notes                                                                     |
| ---------------------------------- | ------ | ------------------------------------------------------------------------- |
| 1. Add i18n keys                   | ✅     | Both `en.json` and `nb.json` updated                                      |
| 2. Fix `dark:bg-rose-700`          | ✅     | Changed to `dark:bg-gray-800`                                             |
| 3. Update `home_hero_body`         | ✅     | Both JSON files updated                                                   |
| 4. Feature showcase section        | ✅     | Four cards in `+page.svelte`                                              |
| 5. Level summary cards             | ✅     | Replaces deck picker in `+page.svelte`                                    |
| 6. `learn/+layout.server.ts`       | ✅     | Created                                                                   |
| 7. `learn/[level]/+page.server.ts` | ✅     | Created with 404 guard, grammar topic filtering                           |
| 8. `learn/[level]/+page.svelte`    | ✅     | Created with all 5 sections                                               |
| 9. `Nav.svelte` restructure        | ✅     | Mega-menus → level links; Prepare dropdown removed; More dropdown slimmed |

---

## Decisions made

| #                           | Decision                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------- |
| Nav structure               | Six direct level links (A1–C2) in nav, each pointing to a hub page — no mega-menu       |
| Flashcard routes            | `/[level]/[category]` stays untouched — no renaming                                     |
| Hub page route              | `/learn/[level]` (e.g. `/learn/b1`) — new route, no conflict with existing routes       |
| Non-logged-in visitors      | Hub pages fully visible; locked items show 🔒 + "Start free →" linking to `/auth/login` |
| Plus badge on feature cards | Hidden for Plus users, shown for free/guest users only                                  |
| i18n                        | Both `en.json` and `nb.json` updated with proper Norwegian translations                 |

---

## 1. New level hub pages (`src/routes/learn/[level]/`)

### Route

`/learn/[level]` — e.g. `/learn/a1`, `/learn/b1`, `/learn/c2`

Valid levels: `a1 a2 b1 b2 c1 c2`. Invalid slugs return a 404 via a guard in `+page.server.ts`.

### Files created

```
src/routes/learn/
  +layout.server.ts      ✅ passes user + plan to all learn/* pages
  [level]/
    +page.server.ts      ✅ loads level data: categories, grammar topics, quiz availability
    +page.svelte         ✅ hub page UI
```

### Page sections (in order)

**Section 1 — Level hero** ✅
**Section 2 — Vocabulary** ✅
**Section 3 — Grammar** ✅
**Section 4 — Quiz** ✅
**Section 5 — Norskprøven** (A2 and B1 only) ✅

---

## 2. Nav restructure (`src/routes/components/Nav.svelte`) ✅

**Done:**

- Replaced all six MegaMenu triggers with `<NavLi href="/learn/{level.toLowerCase()}">` direct links
- Removed the "Prepare" dropdown (Quiz, Grammar, Practice Tests) entirely
- Removed Norskprøven from the "More" dropdown (now discoverable via level hubs)
- "More" now contains: Guide, Resources, Blog
- Removed unused imports: `MegaMenu`, `CATEGORIES_BY_LEVEL`, `isPlusCategory`, `removeHyphensAndCapitalize`, `buildItems`, `menus`

---

## 3. Homepage restructure (`src/routes/+page.svelte`) ✅

All changes complete:

- Fixed `dark:bg-rose-700` → `dark:bg-gray-800`
- Updated hero copy (`home_hero_body`)
- Added feature showcase section (4 cards: Vocabulary, Grammar, Quiz, Norskprøven)
- Replaced deck picker with 6 level summary cards linking to `/learn/[level]`

---

## 4. i18n keys added

All keys in §3e of the original plan added to both `en.json` and `nb.json`.

---

## 5. What was NOT changed

- `/[level]/[category]` flashcard routes — untouched
- Plus gating logic (`isPlusCategory`, `shouldCollapse`) — reused on hub pages, not changed
- `/plus`, `/grammar`, `/quiz`, `/norskproven`, `/blog` route pages — untouched
- SEO structured data on homepage — untouched
- Auth flow, Supabase integration — untouched
