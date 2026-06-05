Now I have a thorough picture of the project. Let me check the analytics setup and blog structure quickly.Good — I now have a comprehensive view of the project. Here's a thorough breakdown of what to do next for both discoverability and analytics.

---

## Discoverability for Norwegian Language Learners

### 1. Submit to Google Search Console (if not done yet) ✅ Done

Your sitemap at `https://norskeord.no/sitemap.xml` is correctly wired up via `super-sitemap` and referenced in `robots.txt`. The next step is to:

- Verify ownership of `norskeord.no` in [Google Search Console](https://search.google.com/search-console)
- Submit the sitemap URL manually
- Check for crawl errors, especially for the `[level]/[category]` routes

### 2. Add Structured Data to Blog Posts ✅ Done

Your homepage has `WebSite` and `LearningResource` schemas — great. But your blog posts at `/blog/[slug]` don't appear to have per-page structured data. Each post should include an `Article` schema with `author`, `datePublished`, `dateModified`, and `inLanguage: "nb"`. This helps Google surface individual blog posts in search results with rich snippets.

In `src/routes/blog/[slug]/+page.ts` (or a corresponding server file), add:

```ts
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  description: post.description,
  datePublished: post.date,
  dateModified: post.updated ?? post.date,
  inLanguage: 'nb',
  author: { '@type': 'Person', name: 'Shinichi Okada' },
  publisher: { '@type': 'Organization', name: 'Norskeord', url: 'https://norskeord.no' }
};
```

### 3. Add Structured Data to Flashcard Pages ✅ Done

Each `[level]/[category]` page is a goldmine for SEO but currently has no JSON-LD beyond the meta tags. Add a `Course` or `LearningResource` schema per page. The `pageMetaTags` object is already being built in `+page.server.ts` — add the schema JSON alongside it and render it in the page's `<svelte:head>`.

### 4. Improve hreflang Coverage ✅ Done

You already emit `hreflang` links in `+layout.svelte` using `paraglide`. Confirm that:

- All locales returned by `locales` are valid BCP-47 codes (e.g. `en`, `nb`, not `no`)
- The `x-default` points to the English URL (already done)
- The sitemap also includes `<xhtml:link>` alternate tags for multilingual URLs — `super-sitemap` supports this via its `additionalPaths` or `alternateRefs` option

### 5. Expand Keyword Targeting in Page Meta ✅ Done

The layout-level `KEYWORDS` in `+layout.server.ts` is decent but generic. For individual flashcard pages, the `pageDescription` pattern is good (`Learn Norwegian ${categoryName} words with audio flashcards at ${levelUpper} level`), but you could also add per-page `keywords` that include the category slug and level. Norwegian learners search very specifically — e.g. "Norwegian A2 shopping vocabulary" or "norskprøven B2 words".

### 6. Add an OpenGraph Image for Each Blog Post ✅ Done

Blog slugs currently fall back to the layout's `metaImg`. Setting a per-post OG image (even a generated one like you use for vocab pages via `open-graph-vercel`) would significantly improve click-through rates when posts are shared on social media.

### 7. Internal Linking from Blog Posts to Flashcard Decks

If your blog posts discuss vocabulary topics (e.g. "How to use Norwegian verbs") they should link to the corresponding `/b1/verbs` or similar deck. This passes link equity to your flashcard pages and keeps users engaged. It doesn't look like this is systematically done yet.

### 8. Consider a `/resources` Page Optimised for "learn Norwegian" Queries

You have a `/resources` route — make sure it's in the sitemap (it currently doesn't appear to be excluded, which is good) and that it has strong keyword-rich content targeting "free Norwegian learning resources", "Norskprøven preparation", etc.

---

## Analytics

### What You Have

You're using **Runatics** (`<Runatics {analyticsId} />`), a privacy-friendly analytics tool. The `ANALYTICS_ID_LANGUAGE_APP` is loaded from a private env var and passed through the layout server load — that's a clean, correct setup.

### What to Check and Add

**Verify the analytics ID is set in production.** In Vercel, confirm `ANALYTICS_ID_LANGUAGE_APP` is set as an environment variable for the Production environment. If it's missing, `<Runatics>` will silently not fire.

**Track key conversion events.** Runatics supports custom events. You should instrument:

- Signup / login (`/auth/login` completions)
- Plus upgrade clicks (`/plus` visits + checkout initiations)
- Deck started (when a user opens a `[level]/[category]` page)
- Flashcard reviewed (when a card is flipped or graded)
- Norskprøven practice started

These can be fired with `runatics.event('event-name')` or however the Runatics API exposes it — check their docs for the exact call.

**Add Google Search Console as a secondary signal.** GSC gives you keyword impression data (what search queries bring people to your site) that Runatics can't provide. It's not analytics per se, but it's the most important tool for understanding SEO performance.

**Consider adding Vercel Analytics** (free tier) alongside Runatics. It gives you Web Vitals (LCP, CLS, FID) per route, which matters for Core Web Vitals rankings. It's one line in `vite.config.ts` via `@vercel/analytics`.

---

### Quick Priority List

| Priority  | Action                                                           |
| --------- | ---------------------------------------------------------------- |
| 🔴 High   | Submit sitemap to Google Search Console                          |
| 🔴 High   | Verify `ANALYTICS_ID_LANGUAGE_APP` is set in Vercel prod         |
| 🟠 Medium | Add `Article` JSON-LD to blog post pages                         |
| 🟠 Medium | Add `LearningResource` JSON-LD to each `[level]/[category]` page |
| 🟠 Medium | Instrument key events in Runatics                                |
| 🟡 Low    | Add OG images to blog posts                                      |
| 🟡 Low    | Add Vercel Analytics for Web Vitals                              |
| 🟡 Low    | Internal links from blog posts → flashcard decks                 |
