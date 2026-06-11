# Admin — Grammar Question Editor — Implementation Plan

## Overview

A password-protected admin UI at `/admin` that lets a non-technical editor **create, read, update, and delete grammar questions** in `src/lib/data/grammar.json` — without touching a file or writing JSON.

Because the app is deployed on Vercel (serverless, read-only filesystem), changes cannot be written to disk at runtime. Instead, a server endpoint reads and writes the file **via the GitHub Contents API**, which commits the change directly to the repo and triggers an automatic Vercel redeploy. Changes are live within ~60 seconds.

The editor works in a **draft-then-publish** model: all adds, edits, and deletes happen locally in memory (instant, no delay), and a single **Publish** button commits everything to GitHub in one batch — one commit, one redeploy. This is much better than saving after every individual change, which would trigger a redeploy per question and make bulk editing painful.

Access is gated behind the existing Supabase auth, restricted to a single admin email checked server-side.

---

## Architecture overview

The admin is designed to grow into a full content management hub. Phase 1 builds the grammar editor; later phases add blog, vocab, and uttrykk editors using the exact same foundation.

```
/admin
  /grammar     ← Phase 1 (this plan)
  /blog        ← Phase 3
  /vocab       ← Phase 4
  /uttrykk     ← Phase 4
```

All editors share:

- The same auth guard (`+layout.server.ts`) — one admin email, checked server-side
- The same GitHub API helper (`src/lib/admin/github.ts`) — just a different `FILE_PATH` per content type
- The same draft-then-publish model — local edits, one Publish button, one commit, one redeploy
- Their own `+page.svelte` and `+server.ts` — different data shapes and UX per content type

```
Browser (Admin UI)
  └─▶ /admin/grammar/+page.svelte      ← question table + add/edit/delete modals
  └─▶ /admin/blog/+page.svelte         ← post list + frontmatter/body editor (Phase 3)
  └─▶ /admin/vocab/+page.svelte        ← vocab table + editor (Phase 4)
  └─▶ /admin/uttrykk/+page.svelte      ← uttrykk table + editor (Phase 4)
        │
        │  all editors: local edits only until Publish
        │
        └─▶ /admin/*/api/+server.ts    ← GET (load) + PUT (publish)
                  │
                  └─▶ src/lib/admin/github.ts   ← shared GitHub Contents API helper
                            │
                            └─▶ GitHub Contents API
                                    └─▶ Vercel redeploy (~60s)
```

No new database tables. All content files stay in the repo as JSON or markdown. The admin API routes are the only new backend surface.

---

## Draft-then-publish model

All edits (add, edit, delete) are applied immediately to a local `draft` array in the browser — no network calls, no delay. The Publish button is the only action that talks to GitHub.

```
Load page
  └─▶ GET /admin/grammar/api  →  questions[] stored in memory as `draft`

Editor adds / edits / deletes questions
  └─▶ local mutations only, instant
      draft is marked dirty, Publish button becomes active

Editor clicks Publish
  └─▶ PUT /admin/grammar/api  →  full draft[] sent to GitHub as one commit
        ├─ success: "Published! Live in ~60s" banner, draft marked clean
        └─ failure: error shown, draft unchanged, editor can retry
```

This means:

- She can add 15 questions, fix a typo on question 3, delete one she changed her mind about — all instant
- One Publish at the end triggers one GitHub commit and one Vercel redeploy
- If she closes the tab without publishing, her unpublished changes are lost (warn her with a browser `beforeunload` dialog if the draft is dirty)

---

## GitHub Contents API — how it works

Both operations follow the same pattern:

**Read (GET):**

1. `GET /repos/{owner}/{repo}/contents/{path}?ref={branch}` — fetches the file content (base64-encoded) **and its SHA** (required for writes).
2. Decode → parse JSON → return to the UI.

**Write (PUT / Publish):**

1. Read the current file to get the latest SHA (prevents conflicts).
2. Encode the updated questions array as base64.
3. `PUT /repos/{owner}/{repo}/contents/{path}` — sends the new content + SHA. GitHub commits the change.

The API requires a **Personal Access Token** (PAT) with `Contents: write` permission on the repo. Store it in Vercel env vars and locally in `.env.local`. Never expose it to the browser.

### SHA conflict handling

A SHA conflict (HTTP 409) happens when the file was changed on GitHub between when the editor loaded the page and when she hits Publish. This can happen if:

- You deployed a code change that touched `grammar.json`
- She had two admin tabs open and published from both

The handler auto-retries once: re-fetch the latest SHA, re-apply the draft on top of the freshest file, and retry the write. She never sees the conflict. If the retry also fails, show a clear error: _"Conflict — please reload the page and re-apply your changes."_

To prevent double-publish, disable the Publish button for 90 seconds after a successful publish, with a visible countdown ("Next publish available in 45s").

---

## Branch strategy

### Option A — Commit directly to `main` (recommended for your setup) I choose this one

```
editor publishes
  └─▶ commits grammar.json to main
        └─▶ Vercel redeploys production (~60s)
```

- Simplest setup — `GITHUB_BRANCH=main`, nothing else changes
- Her grammar changes are live in ~60s automatically, no action needed from you
- Works well because it's one trusted editor making low-risk content changes (not code)
- **Recommended unless you want to review her changes before they go live**

The one thing to be aware of: if she publishes at the same moment you push a code change, both commits land on `main` and Vercel runs two redeploys in quick succession — harmless, just slightly redundant.

### Option B — Dedicated `content` branch (if you want review before publish)

```
editor publishes
  └─▶ commits grammar.json to `content` branch
        └─▶ NOT deployed yet

you review and merge content → main
  └─▶ Vercel redeploys production (~60s)
```

- `main` stays your production branch (no Vercel config change needed)
- `content` is just a holding branch — Vercel ignores it
- You merge `content` → `main` whenever her changes are ready, either on their own or bundled with a code deploy
- **Tradeoff:** her changes aren't live until you merge — could be hours or days depending on your workflow
- Worth it only if you want to review grammar questions before they go live, or if you're coordinating her content releases with your code releases

To switch between options, change one env var: `GITHUB_BRANCH=main` or `GITHUB_BRANCH=content`. No code changes needed.

---

## Environment variables

```env
# .env.local (never committed)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx   # PAT with Contents:write on the repo
GITHUB_OWNER=shinichiokada              # GitHub username / org
GITHUB_REPO=norskeord                   # repo name
GITHUB_BRANCH=main                      # 'main' for Option A, 'content' for Option B
GRAMMAR_FILE_PATH=src/lib/data/grammar.json

ADMIN_EMAIL=editor@example.com          # the only email allowed into /admin
```

Add the same five vars to Vercel → Project → Settings → Environment Variables.

---

## Auth — admin guard

`/admin` and all `/admin/*/api` routes must reject anyone who is not the designated admin.

**Page-level guard — `src/routes/admin/+layout.server.ts`:**

```ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = await locals.supabase.auth.getSession();
  const email = session.data.session?.user?.email;
  if (email !== process.env.ADMIN_EMAIL) {
    throw redirect(303, '/auth/login');
  }
  return {};
};
```

**API-level guard — checked at the top of every handler:**

```ts
const session = await locals.supabase.auth.getSession();
if (session.data.session?.user?.email !== process.env.ADMIN_EMAIL) {
  return new Response('Forbidden', { status: 403 });
}
```

---

## File structure

```
src/routes/admin/
  +layout.server.ts              ← admin auth guard (shared by all sub-routes)
  +page.svelte                   ← admin home: links to grammar, blog, vocab, uttrykk
  grammar/
    +page.svelte                 ← question table + add/edit/delete + Publish
    api/
      +server.ts                 ← GET (load) + PUT (publish)
  blog/                          ← Phase 3
  vocab/                         ← Phase 4
  uttrykk/                       ← Phase 4

src/lib/admin/
  github.ts                      ← shared GitHub Contents API helpers (read, write)
  questionUtils.ts               ← generateId(), validateQuestion(), blankQuestion()
```

---

## GitHub API helper — `src/lib/admin/github.ts`

```ts
const BASE = 'https://api.github.com';
const HEADERS = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
};

const owner = process.env.GITHUB_OWNER!;
const repo = process.env.GITHUB_REPO!;
const branch = process.env.GITHUB_BRANCH ?? 'main';

/** Fetch a JSON file from the repo. Returns { data, sha }. */
export async function readJsonFile<T>(path: string): Promise<{ data: T; sha: string }> {
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: HEADERS
  });
  if (!res.ok) throw new Error(`GitHub read failed: ${res.status}`);
  const file = await res.json();
  const data: T = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
  return { data, sha: file.sha };
}

/** Write a JSON file back to the repo as a single commit. */
export async function writeJsonFile(
  path: string,
  data: unknown,
  sha: string,
  message: string
): Promise<void> {
  const content = Buffer.from(JSON.stringify(data, null, 2) + '\n').toString('base64');
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content, sha, branch })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub write failed: ${res.status} ${text}`);
  }
}
```

Note: the helper is now generic (`readJsonFile<T>`) so it works for grammar, vocab, uttrykk, and any other JSON file without changes.

---

## API route — `src/routes/admin/grammar/api/+server.ts`

```ts
import { json, error } from '@sveltejs/kit';
import { readJsonFile, writeJsonFile } from '$lib/admin/github';
import { validateQuestion } from '$lib/admin/questionUtils';
import type { RequestHandler } from './$types';
import type { GrammarQuestion } from '$lib/types';

const FILE_PATH = process.env.GRAMMAR_FILE_PATH!;

async function assertAdmin(locals: App.Locals) {
  const session = await locals.supabase.auth.getSession();
  if (session.data.session?.user?.email !== process.env.ADMIN_EMAIL) {
    throw error(403, 'Forbidden');
  }
}

// GET — load all questions into the editor
export const GET: RequestHandler = async ({ locals }) => {
  await assertAdmin(locals);
  const { data } = await readJsonFile<GrammarQuestion[]>(FILE_PATH);
  return json(data);
};

// PUT — publish the full draft (all questions) in one commit
// Auto-retries once on SHA conflict (409)
export const PUT: RequestHandler = async ({ locals, request }) => {
  await assertAdmin(locals);
  const questions: GrammarQuestion[] = await request.json();

  // Validate all questions before touching GitHub
  for (const q of questions) {
    const issues = validateQuestion(q);
    if (issues.length) throw error(400, `Question ${q.id}: ${issues.join('; ')}`);
  }

  const added = questions.filter((q) => (q as any)._status === 'added').length;
  const edited = questions.filter((q) => (q as any)._status === 'edited').length;
  const message = buildCommitMessage(added, edited);

  // Strip internal _status flags before writing
  const clean = questions.map(({ ...q }) => {
    delete (q as any)._status;
    return q;
  });

  // Attempt write with auto-retry on SHA conflict
  const attempt = async (retry = false): Promise<void> => {
    const { sha } = await readJsonFile<GrammarQuestion[]>(FILE_PATH);
    try {
      await writeJsonFile(FILE_PATH, clean, sha, message);
    } catch (e: any) {
      if (!retry && e.message.includes('409')) return attempt(true);
      throw error(500, e.message);
    }
  };

  await attempt();
  return json({ ok: true, message });
};

function buildCommitMessage(added: number, edited: number): string {
  const parts = [];
  if (added) parts.push(`add ${added} question${added > 1 ? 's' : ''}`);
  if (edited) parts.push(`edit ${edited} question${edited > 1 ? 's' : ''}`);
  return `admin: ${parts.length ? parts.join(', ') : 'update grammar questions'}`;
}
```

---

## Question utilities — `src/lib/admin/questionUtils.ts`

```ts
import type { GrammarQuestion } from '$lib/types';

/** Auto-generate the next id for a topic, e.g. gq-ikke-013 */
export function generateId(topic: string, existing: GrammarQuestion[]): string {
  const prefix = topicPrefix(topic);
  const nums = existing
    .filter((q) => q.id.startsWith(`gq-${prefix}-`))
    .map((q) => parseInt(q.id.split('-').pop() ?? '0', 10))
    .filter((n) => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `gq-${prefix}-${String(next).padStart(3, '0')}`;
}

const TOPIC_PREFIXES: Record<string, string> = {
  'ikke-placement': 'ikke',
  'det-sentence': 'det',
  'det-er-ikke': 'dei',
  'v2-word-order': 'v2',
  'modal-verb-order': 'mod',
  'subordinate-order': 'sub',
  'relative-som': 'rel',
  'svar-ja-jo-nei': 'svar',
  setningsadverbial: 'setadv',
  'adverbial-fronting': 'advfr',
  'noun-articles': 'noun-art',
  'noun-plurals': 'noun-pl',
  'noun-possessives': 'noun-pos',
  'adj-agreement': 'adj',
  'adj-definite': 'adj',
  'adj-comparison': 'adj'
};

function topicPrefix(topic: string): string {
  return TOPIC_PREFIXES[topic] ?? topic.slice(0, 6);
}

/** Return a list of validation error messages. Empty = valid. */
export function validateQuestion(q: Partial<GrammarQuestion>): string[] {
  const errors: string[] = [];
  if (!q.topic) errors.push('topic is required');
  if (!q.cefr) errors.push('cefr is required');
  if (!q.type) errors.push('type is required');
  if (!q.answer) errors.push('answer is required');
  if (q.type === 'fill' && !q.sentence) errors.push('sentence is required for fill');
  if (q.type === 'order' && !q.tokens?.length) errors.push('tokens are required for order');
  if (q.type === 'transform' && !q.source) errors.push('source is required for transform');
  if (q.type === 'minimal-pair' && (!q.optionA || !q.optionB)) {
    errors.push('optionA and optionB are required for minimal-pair');
  }
  return errors;
}

/** Return a blank question skeleton for the add form. */
export function blankQuestion(
  type: GrammarQuestion['type'] = 'transform'
): Partial<GrammarQuestion> {
  return {
    type,
    cefr: 'A2',
    topic: 'ikke-placement',
    answer: '',
    alternates: [],
    plusOnly: false
  };
}
```

---

## Admin UI — `src/routes/admin/grammar/+page.svelte`

### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Admin                                                          │
│  Grammar Questions                                                │
│                                                                   │
│  ● 3 unpublished changes              [Discard]  [Publish ▶]     │
│  (Publish disabled for 45s after publish — countdown shown)       │
│                                                                   │
│  Filter: [topic ▾]  [CEFR ▾]  [type ▾]  [search…]   [+ Add]    │
│                                                                   │
│  ID             Topic        CEFR  Type       Status   Actions   │
│  gq-ikke-001    ikke-place…  A2    transform           ✏ 🗑       │
│  gq-ikke-013    ikke-place…  B1    order      + new    ✏ 🗑       │
│  gq-det-011     det-sent…    A2    fill       edited   ✏ 🗑       │
│  …                                                                │
└──────────────────────────────────────────────────────────────────┘
```

Unpublished changes (new, edited, deleted) are highlighted in the table so the editor can review before publishing. Deleted questions are shown struck-through until published.

### Question form modal

Opens for both Add and Edit. Fields adapt to `type`:

| Field       | All types | `fill` | `order` | `transform` | `minimal-pair` |
| ----------- | :-------: | :----: | :-----: | :---------: | :------------: |
| topic       |     ✓     |        |         |             |                |
| cefr        |     ✓     |        |         |             |                |
| type        |     ✓     |        |         |             |                |
| prompt      |     ✓     |        |         |             |                |
| answer      |     ✓     |        |         |             |                |
| alternates  |     ✓     |        |         |             |                |
| hint        |     ✓     |        |         |             |                |
| plusOnly    |     ✓     |        |         |             |                |
| sentence    |           |   ✓    |         |             |                |
| words       |           |   ✓    |         |             |                |
| tokens      |           |        |    ✓    |             |                |
| source      |           |        |         |      ✓      |                |
| optionA/B   |           |        |         |             |       ✓        |
| explanation |           |        |         |             |       ✓        |

**Multi-value inputs** (`tokens`, `words`, `alternates`) use a tag-style chip input: type a word and press Enter or comma to add it; click × to remove.

### State

```ts
let published = $state<GrammarQuestion[]>([]); // what's on GitHub right now
let draft = $state<DraftQuestion[]>([]); // local working copy
let loading = $state(true);
let publishing = $state(false);
let cooldown = $state(0); // seconds until Publish re-enables
let error = $state<string | null>(null);

// A DraftQuestion extends GrammarQuestion with an internal status flag
type DraftQuestion = GrammarQuestion & { _status?: 'added' | 'edited' | 'deleted' };

let isDirty = $derived(draft.some((q) => q._status));
let filterTopic = $state('');
let filterCefr = $state('');
let filterType = $state('');
let searchQuery = $state('');
let modal = $state<{ mode: 'add' | 'edit'; question: Partial<DraftQuestion> } | null>(null);
```

### Key behaviours

- **Dirty guard** — browser `beforeunload` warns if `isDirty` is true and the editor tries to close the tab.
- **Discard** — resets `draft` back to `published`, clearing all unpublished changes (with a confirm dialog).
- **Publish cooldown** — after a successful publish, the button is disabled for 90 seconds with a visible countdown. Prevents double-publish within the Vercel redeploy window.
- **Deploy banner** — after publish, show: _"Published! Changes will be live in ~60 seconds."_
- **Conflict auto-retry** — handled server-side (see API route). The editor never sees a SHA conflict.
- **Validation before publish** — the Publish button runs `validateQuestion` on every draft item before sending. If any fail, the modal opens on the first invalid question.

---

## Implementation phases

### Phase 1 — Grammar editor backend

- [ ] Add env vars to `.env.local` and Vercel project settings
- [ ] Create `src/lib/admin/github.ts` (generic `readJsonFile`, `writeJsonFile`)
- [ ] Create `src/lib/admin/questionUtils.ts` (generateId, validateQuestion, blankQuestion)
- [ ] Create `src/routes/admin/+layout.server.ts` (auth guard, shared by all sub-routes)
- [ ] Create `src/routes/admin/+page.svelte` (admin home with links to each editor)
- [ ] Create `src/routes/admin/grammar/api/+server.ts` (GET + PUT with auto-retry)
- [ ] Smoke-test GET and PUT with a REST client (e.g. Bruno or curl)

### Phase 2 — Grammar editor UI

- [ ] Create `src/routes/admin/grammar/+page.svelte` with question table and filters
- [ ] Build draft state management (local add / edit / delete with `_status` flags)
- [ ] Build the question form modal with adaptive fields per type
- [ ] Build the tag-chip input component for `tokens`, `words`, `alternates`
- [ ] Publish button with cooldown countdown
- [ ] Dirty guard (`beforeunload`) and Discard button
- [ ] Deploy-pending banner after successful publish

### Phase 3 — Blog editor

Reuses `github.ts` unchanged. New additions:

- [ ] `src/routes/admin/blog/api/+server.ts` — GET lists all posts (reads each `.md` file's frontmatter), PUT writes a single post back (frontmatter + body)
- [ ] `src/routes/admin/blog/+page.svelte` — post list table (title, CEFR, publishedAt, status)
- [ ] Edit modal: frontmatter fields (title, description, cefr, publishedAt, tags) + markdown body textarea with live preview
- [ ] New post: generates a slug from the title, creates a new `.md` file via GitHub API
- [ ] Same draft-then-publish model: edits are local, one Publish commits all changed files

### Phase 4 — Vocab and uttrykk editors

Reuses `github.ts` unchanged. Add `VOCAB_FILE_PATH` and `UTTRYKK_FILE_PATH` env vars.

- [ ] `src/routes/admin/vocab/api/+server.ts` and `+page.svelte`
- [ ] `src/routes/admin/uttrykk/api/+server.ts` and `+page.svelte`
- [ ] Field shapes to be designed once grammar editor is complete and in use

### Phase 5 — Polish

- [ ] Question preview panel in the grammar modal (renders the question as the learner sees it)
- [ ] Markdown preview in the blog editor (live, side-by-side)
- [ ] Keyboard shortcuts: `Escape` closes modal, `Ctrl+S` triggers publish

---

## Testing

### Unit tests — `src/lib/admin/questionUtils.test.ts`

```ts
describe('generateId', () => {
  it('generates gq-ikke-001 for an empty list');
  it('increments from the highest existing number');
  it('pads numbers to 3 digits');
  it('uses the fallback prefix for unknown topics');
});

describe('validateQuestion', () => {
  it('returns no errors for a valid transform question');
  it('requires sentence for fill type');
  it('requires tokens for order type');
  it('requires source for transform type');
  it('requires optionA and optionB for minimal-pair type');
  it('returns multiple errors at once');
});
```

### E2E tests — `e2e/admin.test.ts`

All tests use a test admin account. GitHub API calls are mocked via Playwright's `page.route()` to avoid real commits during tests.

```ts
describe('Admin — auth guard', () => {
  it('redirects unauthenticated users to /auth/login');
  it('redirects non-admin users to /auth/login');
  it('shows the admin home page for the admin user');
});

describe('Admin — question table', () => {
  it('loads and displays questions');
  it('filters by topic');
  it('filters by CEFR level');
  it('searches by answer text');
});

describe('Admin — draft editing', () => {
  it('marks a new question as "added" in the table');
  it('marks an edited question as "edited" in the table');
  it('shows deleted questions as struck-through');
  it('Discard resets all draft changes');
  it('warns before closing the tab with unsaved changes');
});

describe('Admin — publish', () => {
  it('Publish button is disabled when draft is clean');
  it('Publish button is disabled during cooldown after publish');
  it('shows cooldown countdown after successful publish');
  it('shows deploy banner after successful publish');
  it('shows validation errors for invalid questions before publishing');
  it('shows an error message when GitHub API fails');
});
```

---

## Open questions

- **Blog post editor scope** — edit frontmatter only, or also the full markdown body? Recommend: frontmatter + body textarea in Phase 3, rich markdown editor (if needed) as a later addition.
- **Vocab / uttrykk field shapes** — to be designed once the grammar editor is in use and the data shape surprises are known. Same GitHub API pattern applies.
- **Branch strategy** — default recommendation is `GITHUB_BRANCH=main` (Option A). Switch to a `content` branch (Option B) only if you want to review changes before they go live.
