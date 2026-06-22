# Content Feedback Feature

A lightweight native-speaker feedback system for flagging translation and content issues
on vocab flashcards, grammar questions, and quizzes.

## Motivation

Spanish and Ukrainian translations in norskeord are AI-generated. Native speakers learning
Norwegian are the natural QA layer — they can spot unnatural phrasing, wrong register, or
outright errors that AI cannot. This feature gives them a frictionless way to flag issues
in-context while studying, feeding a review queue that informs future patch scripts.

---

## Scope

**Content types covered:**

- Vocab flashcards (vocab_id → e.g. `v-a1-greetings-005`)
- Grammar questions (question_id → e.g. `grammar-word-order-001`)
- Quiz items (same IDs as vocab/grammar)

**Languages:** `es` (Spanish), `uk` (Ukrainian) — the two AI-translated languages.
English feedback is out of scope for now (translations are human-reviewed).

**Who can flag:** Any authenticated user. The flag button could optionally be hidden
for English UI users since they are less likely to spot ES/UK errors, but this is
a nice-to-have — even English speakers may notice something wrong in the Norwegian.

---

## Supabase Schema

```sql
CREATE TABLE public.content_flags (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL,
  content_type  text        NOT NULL CHECK (content_type = ANY (ARRAY['vocab', 'grammar', 'quiz'])),
  content_id    text        NOT NULL,  -- vocab_id or question_id
  language      text        NOT NULL CHECK (language = ANY (ARRAY['es', 'uk'])),
  reason        text        NOT NULL CHECK (reason = ANY (ARRAY[
                              'wrong_translation',
                              'unnatural_example',
                              'grammar_error',
                              'other'
                            ])),
  note          text,                  -- optional free-text from user (max 500 chars)
  status        text        NOT NULL DEFAULT 'open'
                            CHECK (status = ANY (ARRAY['open', 'resolved', 'dismissed'])),
  created_at    timestamptz NOT NULL DEFAULT now(),
  resolved_at   timestamptz,
  CONSTRAINT content_flags_pkey PRIMARY KEY (id),
  CONSTRAINT content_flags_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- One open flag per user per content item per language
-- (prevents duplicate submissions)
CREATE UNIQUE INDEX content_flags_unique_open
  ON public.content_flags (user_id, content_id, language)
  WHERE status = 'open';

-- RLS
ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

-- Users can insert their own flags
CREATE POLICY "Users can insert own flags"
  ON public.content_flags FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own flags (to show "you flagged this")
CREATE POLICY "Users can read own flags"
  ON public.content_flags FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No user updates or deletes — only admin via service role
```

**Migration file:** `supabase/migrations/YYYYMMDDHHMMSS_add_content_flags.sql`

---

## Data Flow

### Submitting a flag

1. User taps the flag button on a card/question
2. A small inline panel appears (not a modal) with:
   - Reason dropdown: Wrong translation / Unnatural example / Grammar error / Other
   - Optional note textarea (150 chars max in UI)
   - Submit button
3. Client calls a SvelteKit server action (`?/flag`)
4. Server action inserts into `content_flags` with `status = 'open'`
5. On success, the flag button transitions to "flagged" state in the UI

### Re-encountering a flagged item

- When a session loads, fetch all open flags for the current user:
  ```ts
  const { data } = await supabase
    .from('content_flags')
    .select('content_id, language, status')
    .eq('user_id', userId);
  ```
- Store as a `Set<string>` keyed by `content_id` in a session store
- Per-card lookup is O(1), no extra DB round-trip per card

### Flag indicator states on the card

| Flag status | What to show                                                |
| ----------- | ----------------------------------------------------------- |
| `open`      | Small flag icon (muted colour) + "You flagged this" tooltip |
| `resolved`  | Checkmark icon + "Updated — thanks for the feedback!"       |
| `dismissed` | No indicator (silently remove)                              |

---

## Admin Queue (existing admin panel)

Add a `/admin/flags` route showing:

- Table of open flags grouped by `content_id`
- Columns: content_id, language, reason, note, user count, first seen
- Actions per row: **Mark resolved** / **Dismiss**
- Marking resolved sets `status = 'resolved'` and `resolved_at = now()` via service role

No automated patch — resolution still goes through the manual patch script workflow
(flag queue → native speaker review → patch `.mjs` script → dry-run → apply).
This keeps the data quality bar high.

---

## UI Components

### Flag button

- Lives in the card footer, same row as the existing "show example" toggle or rating buttons
- Icon: a small flag (e.g. `lucide-flag`) or a `⚑` symbol
- Only rendered when `flashcard_language` is `es` or `uk` (profile setting)
  — English users see nothing, since we're not collecting English feedback yet
- Unflagged: muted/ghost style
- Flagged (open): accent colour, tooltip "You flagged this"
- Flagged (resolved): green checkmark, tooltip "Updated — thanks!"

### Inline flag panel

- Slides in below the card (not a modal — avoids disrupting study flow)
- Closes automatically on submit or on tapping outside
- Fields:
  - `reason` — `<select>` with 4 options
  - `note` — `<textarea>` optional, 150-char limit shown live
  - Submit / Cancel buttons
- On submit: optimistic UI update (button goes to flagged state immediately)

---

## SvelteKit Implementation Sketch

### Store

```ts
// src/lib/stores/flagStore.ts
import { writable } from 'svelte/store';

// Map of content_id → { status, language }
export const userFlags = writable<Map<string, { status: string; language: string }>>(new Map());

export function initFlags(flags: { content_id: string; status: string; language: string }[]) {
  userFlags.set(new Map(flags.map((f) => [f.content_id, f])));
}

export function setFlag(contentId: string, language: string) {
  userFlags.update((m) => {
    m.set(contentId, { status: 'open', language });
    return m;
  });
}
```

### Server action

```ts
// src/routes/flashcards/+page.server.ts (or shared actions file)
export const actions = {
  flag: async ({ request, locals }) => {
    const { session } = await locals.safeGetSession();
    if (!session) return fail(401);

    const data = await request.formData();
    const content_id = data.get('content_id') as string;
    const content_type = data.get('content_type') as string;
    const language = data.get('language') as string;
    const reason = data.get('reason') as string;
    const note = (data.get('note') as string | null)?.slice(0, 500) ?? null;

    const { error } = await locals.supabase
      .from('content_flags')
      .insert({ user_id: session.user.id, content_id, content_type, language, reason, note });

    if (error) return fail(500, { message: error.message });
    return { success: true };
  }
};
```

### Loading flags at session start

```ts
// src/routes/flashcards/+page.server.ts load()
const { data: flags } = await supabase
  .from('content_flags')
  .select('content_id, status, language')
  .eq('user_id', session.user.id);

return { flags: flags ?? [] };
```

---

## What to skip for now

- **No public flag counts** — don't show "3 users flagged this" on the card. That's
  complexity and potential negativity for learners.
- **No email notifications** — you'll check the admin queue on your own schedule.
- **No anonymous flags** — requires auth; reduces noise significantly.
- **No English feedback** — English translations are human-reviewed; not the pain point.
- **No upvoting** — a flat list is enough at this scale.

---

## Implementation Order

1. **Migration** — create `content_flags` table with RLS policies
2. **Flag store** — `src/lib/stores/flagStore.ts`
3. **Load flags** — add to flashcard page `load()`, initialise store in `+layout.svelte` or page
4. **Server action** — `flag` action in flashcard/grammar/quiz page server files
5. **Flag button component** — `src/lib/components/FlagButton.svelte`
6. **Inline panel component** — `src/lib/components/FlagPanel.svelte`
7. **Wire into FlashCard** — render button + panel, show status indicator
8. **Wire into Grammar + Quiz** — same components, different `content_type` value
9. **Admin route** — `/admin/flags` with status update actions
10. **Update `current-schema.sql`** — reflect new table after migration is applied
