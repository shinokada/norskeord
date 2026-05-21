# Blog Implementation Plan

## Overview

A file-based blog using markdown with frontmatter. No database, no CRUD admin.
Posts are `.md` files committed to the repo. Deploying a new post = writing a file and pushing.

The blog index at `/blog` shows a clean card list grouped by CEFR level — no images needed.
Each card shows title, one-line description, CEFR badge, and date.
Clicking a card goes to `/blog/[slug]` which renders the article.

---

## Dependencies to install

You need one package:

```bash
pnpm add -D mdsvex
```

- **mdsvex** — preprocessor that lets SvelteKit render `.md` files as routes and also parse
  markdown in Svelte components. Required to use `import.meta.glob` on `.md` files with metadata.
  It also exposes frontmatter as `mod.metadata` automatically, so no separate frontmatter parser is needed.

---

## svelte.config.js changes

Add `mdsvex` as a preprocessor:

```js
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md'],
  preprocess: [vitePreprocess(), mdsvex({ extensions: ['.md'] })],
  kit: {
    adapter: adapter()
  }
};

export default config;
```

---

## File structure

```
src/
  lib/
    posts/                          ← all markdown blog posts live here
      sakte-vs-langsomt.md
      denne-vs-dette.md
      bytte-vs-skifte.md
  routes/
    blog/
      +page.svelte                  ← blog index (list of all posts)
      +page.ts                      ← loads all posts metadata via import.meta.glob
      [slug]/
        +page.svelte                ← individual post renderer
        +page.ts                    ← loads one post by slug
```

---

## Frontmatter schema

Every `.md` file in `src/lib/posts/` must have this frontmatter:

```yaml
---
title: 'Sakte vs Langsomt — Hva er forskjellen?'
description: "Both mean 'slowly' — but one sounds more natural in everyday speech."
slug: sakte-vs-langsomt
cefr: A2
publishedAt: 2026-05-21
tags: [adverbs, speed, comparison]
---
```

| Field         | Type     | Purpose                                     |
| ------------- | -------- | ------------------------------------------- |
| `title`       | string   | H1 on the article, og:title, card title     |
| `description` | string   | One-line summary shown on index card + meta |
| `slug`        | string   | URL: `/blog/sakte-vs-langsomt`              |
| `cefr`        | string   | Badge on card and article (`A1`–`C2`)       |
| `publishedAt` | date     | ISO date string, shown on card              |
| `tags`        | string[] | Optional. For future filtering              |

---

## Blog index — `src/routes/blog/+page.ts`

Loads all post metadata at build time using `import.meta.glob`.
Does NOT load full post content — only frontmatter, so the index is lightweight.

```ts
import type { PageLoad } from './$types';

export interface PostMeta {
  title: string;
  description: string;
  slug: string;
  cefr: string;
  publishedAt: string;
  tags?: string[];
}

export const load: PageLoad = async () => {
  // Eagerly import all .md files — metadata only via frontmatter
  const modules = import.meta.glob('/src/lib/posts/*.md', { eager: true });

  const posts: PostMeta[] = Object.values(modules)
    .map((mod: any) => mod.metadata as PostMeta)
    .filter(Boolean)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return { posts };
};
```

---

## Blog index — `src/routes/blog/+page.svelte`

Clean card list, grouped by CEFR level. Uses existing Flowbite `Badge` component.
No images. CEFR badge adds more value than a stock photo would.

```svelte
<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // CEFR display order
  const cefrOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const cefrColors: Record<string, 'green' | 'blue' | 'indigo' | 'purple' | 'pink' | 'yellow'> = {
    A1: 'green',
    A2: 'green',
    B1: 'blue',
    B2: 'indigo',
    C1: 'purple',
    C2: 'pink'
  };

  // Group posts by CEFR level
  const grouped = cefrOrder
    .map((level) => ({
      level,
      posts: data.posts.filter((p) => p.cefr === level)
    }))
    .filter((g) => g.posts.length > 0);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' });
  }
</script>

<svelte:head>
  <title>Norwegian Language Blog — Norskeord</title>
  <meta
    name="description"
    content="Short, practical articles about Norwegian vocabulary and grammar — with real examples."
  />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-12">
  <h1 class="mb-2 text-3xl font-bold dark:text-white">Norwegian Language Blog</h1>
  <p class="mb-10 text-gray-500 dark:text-gray-400">
    Short, practical articles about Norwegian vocabulary and grammar.
  </p>

  {#each grouped as group}
    <section class="mb-10">
      <h2
        class="mb-4 text-sm font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500"
      >
        Level {group.level}
      </h2>

      <div class="space-y-3">
        {#each group.posts as post (post.slug)}
          <a
            href="/blog/{post.slug}"
            class="hover:border-primary-400 dark:hover:border-primary-500 block rounded-xl border border-gray-200 px-5 py-4 transition hover:shadow-sm dark:border-gray-700"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="font-semibold text-gray-900 dark:text-white">{post.title}</p>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{post.description}</p>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-2">
                <Badge color={cefrColors[post.cefr] ?? 'blue'}>{post.cefr}</Badge>
                <span class="text-xs text-gray-400 dark:text-gray-500"
                  >{formatDate(post.publishedAt)}</span
                >
              </div>
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/each}
</div>
```

---

## Individual post loader — `src/routes/blog/[slug]/+page.ts`

```ts
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const modules = import.meta.glob('/src/lib/posts/*.md');

  // Find the module whose metadata.slug matches the URL param
  for (const [path, resolver] of Object.entries(modules)) {
    const mod: any = await resolver();
    if (mod.metadata?.slug === params.slug) {
      return {
        content: mod.default, // Svelte component (the rendered markdown)
        meta: mod.metadata
      };
    }
  }

  throw error(404, `Post not found: ${params.slug}`);
};
```

---

## Individual post — `src/routes/blog/[slug]/+page.svelte`

```svelte
<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const cefrColors: Record<string, 'green' | 'blue' | 'indigo' | 'purple' | 'pink' | 'yellow'> = {
    A1: 'green',
    A2: 'green',
    B1: 'blue',
    B2: 'indigo',
    C1: 'purple',
    C2: 'pink'
  };

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>{data.meta.title} — Norskeord</title>
  <meta name="description" content={data.meta.description} />
  <meta property="og:title" content={data.meta.title} />
  <meta property="og:description" content={data.meta.description} />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-12">
  <!-- Header -->
  <div class="mb-8">
    <a
      href="/blog"
      class="mb-6 inline-block text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
    >
      ← All posts
    </a>
    <h1 class="mb-3 text-3xl font-bold dark:text-white">{data.meta.title}</h1>
    <div class="flex items-center gap-3">
      <Badge color={cefrColors[data.meta.cefr] ?? 'blue'}>{data.meta.cefr}</Badge>
      <span class="text-sm text-gray-400">{formatDate(data.meta.publishedAt)}</span>
    </div>
  </div>

  <!-- Rendered markdown -->
  <div class="prose prose-gray dark:prose-invert max-w-none">
    <data.content />
  </div>
</div>
```

The `prose` class from `@tailwindcss/typography` handles all markdown styling — headings,
tables, code blocks, etc. See the Tailwind Typography section below.

---

## Tailwind Typography (prose styling)

The `prose` class requires `@tailwindcss/typography`. Install it:

```bash
pnpm add -D @tailwindcss/typography
```

Then add to your CSS (in `app.css`):

```css
@plugin '@tailwindcss/typography';
```

This is all you need with Tailwind v4. No `tailwind.config.js` changes required.

---

## Example markdown post — `src/lib/posts/sakte-vs-langsomt.md`

```markdown
---
title: 'Sakte vs Langsomt — Hva er forskjellen?'
description: "Both mean 'slowly' — but one sounds more natural in everyday speech."
slug: sakte-vs-langsomt
cefr: A2
publishedAt: 2026-05-21
tags: [adverbs, comparison]
---

## Kort forklaring

Både **sakte** og **langsomt** betyr "slowly" på engelsk.

Men:

- **sakte** brukes mest i dagligtale
- **langsomt** høres ofte litt mer formelt ut

_In English:_ Both mean "slowly" — but **sakte** is more common in conversation,
while **langsomt** can sound slightly more formal or descriptive.

---

## Eksempler

**1. Snakk sakte, vær så snill.**
_Speak slowly, please._
→ Most natural in conversation.

**2. Trafikken går langsomt i dag.**
_Traffic is moving slowly today._
→ Langsomt fits well when describing a situation or process.

**3. Han går sakte hjemover.**
_He walks slowly home._
→ Very common in spoken Norwegian.

---

## Sammenligningstabell

|                | sakte           | langsomt             |
| -------------- | --------------- | -------------------- |
| Meaning        | slowly          | slowly               |
| Register       | everyday speech | slightly formal      |
| Most common in | conversation    | descriptions/writing |

---

## Vanlige feil

❌ Han snakker langsomt til meg
⭕ Han snakker sakte til meg

_Langsomt is not grammatically wrong here, but sakte sounds much more natural in conversation._

---

## Husk dette

- **sakte** → everyday speech
- **langsomt** → slightly more formal or descriptive

---

## Relaterte ord

fort · raskt · hurtig · treg
```

---

## SEO notes

- `og:title` and `og:description` are set per post in `+page.svelte`
- The `slug` field in frontmatter controls the URL — keep it lowercase, hyphenated
- Posts are statically generated at build time (SvelteKit prerendering), so they are fully
  indexable by search engines with no JavaScript required
- Add `export const prerender = true;` to both `+page.ts` files for guaranteed static output

---

## Adding prerendering (recommended)

In `src/routes/blog/+page.ts` and `src/routes/blog/[slug]/+page.ts`, add:

```ts
export const prerender = true;
```

This ensures all blog posts are rendered to static HTML at build time —
fast, SEO-friendly, and no server overhead.

---

## Implementation checklist

- [x] `pnpm add -D mdsvex @tailwindcss/typography`
- [ ] Update `svelte.config.js` to add mdsvex preprocessor
- [ ] Add `@plugin "@tailwindcss/typography"` to `app.css`
- [ ] Create `src/lib/posts/` directory
- [ ] Create `src/routes/blog/+page.ts` and `+page.svelte`
- [ ] Create `src/routes/blog/[slug]/+page.ts` and `+page.svelte`
- [ ] Write first post: `src/lib/posts/sakte-vs-langsomt.md`
- [ ] Test locally with `pnpm dev`
- [ ] Add `/blog` link to your main nav
- [ ] Write unit tests: `src/lib/blog.test.ts`
- [ ] Write e2e tests: `e2e/blog.test.ts`

---

## Tests

### Unit tests — `src/lib/blog.test.ts`

The blog loader logic has two pure functions worth unit testing:

- `parsePosts` — sorts and filters post metadata from glob results
- `findPostBySlug` — finds a matching post or returns null

Extract these from `+page.ts` into a shared `src/lib/blog.ts` helper so they can be imported by tests.

**`src/lib/blog.ts`** (extract from loaders):

```ts
export interface PostMeta {
  title: string;
  description: string;
  slug: string;
  cefr: string;
  publishedAt: string;
  tags?: string[];
}

/** Sort posts newest-first, filter out any with missing required fields. */
export function parsePosts(modules: Record<string, any>): PostMeta[] {
  return Object.values(modules)
    .map((mod: any) => mod.metadata as PostMeta)
    .filter((m) => m?.title && m?.slug && m?.publishedAt)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

/** Find a post by slug. Returns null if not found. */
export function findPostBySlug(
  modules: Record<string, any>,
  slug: string
): { meta: PostMeta; content: any } | null {
  for (const mod of Object.values(modules)) {
    if ((mod as any).metadata?.slug === slug) {
      return { meta: (mod as any).metadata, content: (mod as any).default };
    }
  }
  return null;
}
```

**`src/lib/blog.test.ts`**:

```ts
import { describe, it, expect } from 'vitest';
import { parsePosts, findPostBySlug } from './blog';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeMod(
  overrides: Partial<{
    title: string;
    slug: string;
    cefr: string;
    publishedAt: string;
    description: string;
  }> = {}
) {
  return {
    metadata: {
      title: 'Test Post',
      slug: 'test-post',
      cefr: 'A2',
      publishedAt: '2026-01-01',
      description: 'A test post.',
      ...overrides
    },
    default: {} // Svelte component placeholder
  };
}

// ── parsePosts ────────────────────────────────────────────────────────────────

describe('parsePosts', () => {
  it('returns an empty array for an empty module map', () => {
    expect(parsePosts({})).toEqual([]);
  });

  it('returns one post for a single valid module', () => {
    const result = parsePosts({ 'a.md': makeMod() });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('test-post');
  });

  it('sorts posts newest-first by publishedAt', () => {
    const modules = {
      'old.md': makeMod({ slug: 'old', publishedAt: '2025-01-01' }),
      'new.md': makeMod({ slug: 'new', publishedAt: '2026-05-01' }),
      'mid.md': makeMod({ slug: 'mid', publishedAt: '2025-06-01' })
    };
    const result = parsePosts(modules);
    expect(result[0].slug).toBe('new');
    expect(result[1].slug).toBe('mid');
    expect(result[2].slug).toBe('old');
  });

  it('filters out posts missing a title', () => {
    const modules = {
      'valid.md': makeMod({ slug: 'valid' }),
      'notitle.md': { metadata: { slug: 'no-title', publishedAt: '2026-01-01' }, default: {} }
    };
    const result = parsePosts(modules);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('valid');
  });

  it('filters out posts missing a slug', () => {
    const modules = {
      'valid.md': makeMod({ slug: 'valid' }),
      'noslug.md': { metadata: { title: 'No Slug', publishedAt: '2026-01-01' }, default: {} }
    };
    const result = parsePosts(modules);
    expect(result).toHaveLength(1);
  });

  it('filters out posts missing publishedAt', () => {
    const modules = {
      'valid.md': makeMod(),
      'nodate.md': { metadata: { title: 'No Date', slug: 'no-date' }, default: {} }
    };
    const result = parsePosts(modules);
    expect(result).toHaveLength(1);
  });

  it('filters out modules with no metadata at all', () => {
    const modules = {
      'valid.md': makeMod(),
      'bad.md': { default: {} }
    };
    const result = parsePosts(modules);
    expect(result).toHaveLength(1);
  });

  it('preserves all frontmatter fields', () => {
    const result = parsePosts({ 'a.md': makeMod({ cefr: 'B1' }) });
    expect(result[0].cefr).toBe('B1');
    expect(result[0].description).toBe('A test post.');
  });
});

// ── findPostBySlug ────────────────────────────────────────────────────────────

describe('findPostBySlug', () => {
  const modules = {
    'sakte.md': makeMod({ slug: 'sakte-vs-langsomt', title: 'Sakte vs Langsomt' }),
    'denne.md': makeMod({ slug: 'denne-vs-dette', title: 'Denne vs Dette' })
  };

  it('returns the matching post when slug exists', () => {
    const result = findPostBySlug(modules, 'sakte-vs-langsomt');
    expect(result).not.toBeNull();
    expect(result!.meta.title).toBe('Sakte vs Langsomt');
  });

  it('returns null for an unknown slug', () => {
    expect(findPostBySlug(modules, 'does-not-exist')).toBeNull();
  });

  it('returns null for an empty module map', () => {
    expect(findPostBySlug({}, 'sakte-vs-langsomt')).toBeNull();
  });

  it('returns the content (Svelte component) alongside meta', () => {
    const result = findPostBySlug(modules, 'denne-vs-dette');
    expect(result).toHaveProperty('content');
  });

  it('is case-sensitive — slug must match exactly', () => {
    expect(findPostBySlug(modules, 'Sakte-vs-langsomt')).toBeNull();
    expect(findPostBySlug(modules, 'SAKTE-VS-LANGSOMT')).toBeNull();
  });

  it('matches the second post correctly', () => {
    const result = findPostBySlug(modules, 'denne-vs-dette');
    expect(result!.meta.title).toBe('Denne vs Dette');
  });
});
```

Run with:

```bash
pnpm test:unit
```

---

### E2E tests — `e2e/blog.test.ts`

Follows the same pattern as `guide.test.ts` — `test.beforeEach` navigates to the page,
each test asserts one thing. Two `describe` blocks: blog index and individual post.

```ts
import { expect, test } from '@playwright/test';

// ── Blog index (/blog) ────────────────────────────────────────────────────────

test.describe('Blog index', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
  });

  test('has expected h1', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Norwegian Language Blog');
  });

  test('has expected meta title', async ({ page }) => {
    await expect(page).toHaveTitle('Norwegian Language Blog — Norskeord');
  });

  test('has expected meta description', async ({ page }) => {
    const meta = page.locator('meta[name="description"]');
    await expect(meta).toHaveAttribute(
      'content',
      'Short, practical articles about Norwegian vocabulary and grammar — with real examples.'
    );
  });

  test('shows at least one post card', async ({ page }) => {
    // There must be at least one published post for this to pass
    const cards = page.locator('a[href^="/blog/"]');
    await expect(cards.first()).toBeVisible();
  });

  test('post cards link to /blog/[slug]', async ({ page }) => {
    const firstCard = page.locator('a[href^="/blog/"]').first();
    const href = await firstCard.getAttribute('href');
    expect(href).toMatch(/^\/blog\/.+/);
  });

  test('post cards show a CEFR badge', async ({ page }) => {
    // Flowbite Badge renders as a <span> — look for known CEFR values
    const badge = page
      .locator('a[href^="/blog/"]')
      .first()
      .locator('span', {
        hasText: /^(A1|A2|B1|B2|C1|C2)$/
      });
    await expect(badge).toBeVisible();
  });

  test('clicking a post card navigates to the article', async ({ page }) => {
    const firstCard = page.locator('a[href^="/blog/"]').first();
    const href = await firstCard.getAttribute('href');
    await firstCard.click();
    await expect(page).toHaveURL(href!);
  });
});

// ── Individual post (/blog/sakte-vs-langsomt) ─────────────────────────────────
// These tests assume the example post 'sakte-vs-langsomt.md' exists.

test.describe('Blog post — sakte-vs-langsomt', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/blog/sakte-vs-langsomt');
  });

  test('has expected h1', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sakte vs Langsomt');
  });

  test('has expected meta title', async ({ page }) => {
    await expect(page).toHaveTitle('Sakte vs Langsomt — Hva er forskjellen? — Norskeord');
  });

  test('has expected meta description', async ({ page }) => {
    const meta = page.locator('meta[name="description"]');
    await expect(meta).toHaveAttribute(
      'content',
      "Both mean 'slowly' — but one sounds more natural in everyday speech."
    );
  });

  test('has expected og:title', async ({ page }) => {
    const og = page.locator('meta[property="og:title"]');
    await expect(og).toHaveAttribute('content', 'Sakte vs Langsomt — Hva er forskjellen?');
  });

  test('has expected og:description', async ({ page }) => {
    const og = page.locator('meta[property="og:description"]');
    await expect(og).toHaveAttribute(
      'content',
      "Both mean 'slowly' — but one sounds more natural in everyday speech."
    );
  });

  test('shows a CEFR badge', async ({ page }) => {
    const badge = page.locator('span', { hasText: /^(A1|A2|B1|B2|C1|C2)$/ }).first();
    await expect(badge).toBeVisible();
  });

  test('shows a back link to /blog', async ({ page }) => {
    const backLink = page.locator('a[href="/blog"]');
    await expect(backLink).toBeVisible();
  });

  test('back link navigates to blog index', async ({ page }) => {
    await page.locator('a[href="/blog"]').click();
    await expect(page).toHaveURL('/blog');
  });

  test('renders article content', async ({ page }) => {
    // The prose div should have actual content from the markdown
    const prose = page.locator('.prose');
    await expect(prose).not.toBeEmpty();
  });

  test('/blog/unknown-slug returns 404', async ({ page }) => {
    const response = await page.goto('/blog/this-slug-does-not-exist');
    expect(response?.status()).toBe(404);
  });
});
```

Run with:

```bash
pnpm test:e2e
```

### Notes on the test approach

- **Unit tests** cover the two pure functions extracted into `src/lib/blog.ts`. They run fast
  with no browser needed and catch regressions in sorting, filtering, and slug matching.
- **E2E tests** cover what actually renders in the browser — heading, meta tags, badges,
  navigation, and 404 handling. They depend on the example post existing, so write
  `sakte-vs-langsomt.md` before running them.
- No `injectPlusPlan` or locale helpers are needed — the blog is public and language-agnostic.
- The 404 test is placed in the post describe block (not index) since it's testing route
  behaviour, and it uses a fresh `page.goto` rather than the `beforeEach` URL.
