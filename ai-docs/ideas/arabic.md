# Arabic content
Yes, it's absolutely possible — major sites (Google, Facebook, Wikipedia) handle this routinely. Here's what you'd need to think about for norskeord:

**Yes, RTL + LTR on the same page works fine.** The key is `dir="rtl"` on the Arabic element, not on `<html>`. You never flip the whole page — just the Arabic text containers.

---

## What needs changing in norskeord

**1. Vocabulary card / flashcard display**

The Arabic translation field needs `dir="rtl"` and a suitable font. Something like:

```svelte
{#if entry.arabic}
  <p dir="rtl" lang="ar" class="font-arabic text-right text-xl">
    {entry.arabic}
  </p>
{/if}
```

**2. Example sentences**

Same treatment — `dir="rtl" lang="ar"` on the `example_arabic` paragraph. The `lang="ar"` attribute also helps browsers pick the right font automatically.

**3. Font**

Arabic needs a dedicated web font. Tailwind doesn't include one by default. Good free options:
- **Noto Sans Arabic** (Google Fonts) — clean, familiar for learners
- **Cairo** — slightly more modern feel

Add to `app.html` or `+layout.svelte`:
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600&display=swap" rel="stylesheet">
```

Then in `tailwind.config.js`:
```js
fontFamily: {
  arabic: ['"Noto Sans Arabic"', 'sans-serif'],
}
```

**4. UI language selector / flag**

If you have a language picker showing available translations, add Arabic there. No RTL concern here since it's just a button/label.

**5. Blog posts (if you ever write Arabic content)**

If blog posts are ever in Arabic, `+page.svelte` would need `<article dir="rtl">`. But for norskeord this is unlikely — Arabic is a *learner* language, not the UI language.

**6. Paraglide i18n**

Your UI is in Norwegian/English, not Arabic, so `en.json`/`nb.json` don't need Arabic strings. No Paraglide changes needed.

---

## What you do NOT need to change

- Page layout / nav / sidebar — stays LTR
- Tailwind grid/flex layout — unaffected since RTL is scoped to the text element
- SvelteKit routing — no changes
- The `<html>` tag — keep `dir="ltr"` (or none)

---

## The core principle

Scope `dir="rtl"` as tightly as possible — just the element containing Arabic text, not a parent wrapper. Arabic script is self-contained; it doesn't bleed into surrounding LTR content as long as you don't set RTL on a shared ancestor.

So the change surface is actually small: a component or two that renders translation fields, plus a font import. Since you already have a `ukrainian` field pattern, Arabic slots in the same way with just the extra `dir="rtl"` attribute.

## No flagAR عربي


**On the flag:** I'd suggest avoiding the Syrian flag for Arabic. Syrian Arabic is the *dialect*, but many of your users speaking it may be refugees or people with complicated feelings about the current Syrian state and its flag. It could feel alienating or politically loaded.

Better options:

- 🌍 A generic globe/language icon — neutral and common (used by many apps for Arabic)
- No flag at all — just the abbreviation and native script

---

**On the abbreviation:** There's no single ISO 639 code for Syrian Arabic specifically. The options are:

| Code    | Meaning                                              | Notes                                        |
| ------- | ---------------------------------------------------- | -------------------------------------------- |
| `AR`    | Arabic (generic)                                     | Most recognisable, but implies MSA           |
| `SYR`   | Could be confused with Syriac (a different language) | Avoid                                        |
| `ARB`   | Informal "Arabic dialect" shorthand                  | Not standard                                 |
| `AR-SY` | BCP 47 tag for Syrian Arabic                         | Technically correct but long for a UI button |

**My recommendation: `AR` with the native script next to it.**

Something like:

```
🌍 AR  عربي
```

or just:

```
AR  عربي
```

This mirrors your current pattern (`NO` + "norsk", `EN` + "English") while making clear through the native script that it's the colloquial/Syrian variety rather than formal MSA. Most Syrian users will recognise immediately from the vocabulary choices that it's their dialect, regardless of what the button says.

If you really want to distinguish it from generic Arabic, a subtle parenthetical in the dropdown — *Arabic (Syrian)* — works better than a flag for that purpose.