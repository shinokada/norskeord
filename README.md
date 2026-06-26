# Norskeord

Norwegian vocabulary learning app — [norskeord.no](https://norskeord.no)

Vocabulary flashcards, quiz, grammar practice, and Norskprøven exam prep covering A1–C2. Freemium SaaS with a Plus subscription via Lemon Squeezy.

---

## Tech stack

| Layer             | Tool                                        |
| ----------------- | ------------------------------------------- |
| Framework         | SvelteKit 2 + Svelte 5 (runes)              |
| Language          | TypeScript                                  |
| Styling           | Tailwind CSS v4 + Flowbite Svelte           |
| Database / Auth   | Supabase (Postgres + RLS + Edge Functions)  |
| Deployment        | Vercel (adapter-vercel)                     |
| i18n              | Paraglide JS — EN, NB, ES, UK               |
| Spaced repetition | ts-fsrs                                     |
| Payments          | Lemon Squeezy                               |
| Email             | Resend                                      |
| PWA               | vite-plugin-pwa + Workbox                   |
| Blog / MDX        | mdsvex                                      |
| Testing           | Playwright (e2e) + Vitest + Testing Library |
| Analytics         | runatics (GA4 wrapper)                      |
| Package manager   | pnpm                                        |

---

## Routes

| Route                                         | Description                                       |
| --------------------------------------------- | ------------------------------------------------- |
| `/`                                           | Home — hero + feature overview + level picker     |
| `/[level]`                                    | Level hub — categories grid (A1/A2/B1/B2/C)       |
| `/learn/[level]/[category]`                   | Flashcard deck                                    |
| `/quiz`                                       | Quiz mode (MC / fill / type)                      |
| `/grammar`                                    | Grammar topic picker                              |
| `/norskproven`                                | Norskprøven vocab prep                            |
| `/norskproven/practice/[level]/[test]/[mode]` | Practice tests (reading / writing / oral)         |
| `/stats`                                      | User progress page                                |
| `/guide`                                      | How-to guide + FAQ                                |
| `/plus`                                       | Upgrade / pricing page                            |
| `/blog`                                       | Blog index                                        |
| `/blog/[slug]`                                | Blog post (mdsvex)                                |
| `/my-profile`                                 | Profile, preferences, notifications, subscription |
| `/auth/...`                                   | Sign-in / OTP flow                                |
| `/admin`                                      | Admin dashboard (review-gated)                    |

---

## Data files

Vocabulary and content live in `src/lib/data/` as static JSON — read at build time, never queried from the database.
Files are deviced by Common European Framework of Reference for Languages (CEFR).

```
vocab-a1.json          uttrykk-a1.json
vocab-a2.json          uttrykk-a2.json
vocab-b1.json          uttrykk-b1.json
vocab-b2.json          uttrykk-b2.json
vocab-c.json           uttrykk-c.json
grammar.json           rules.ts
norskproven-*.json
```

**Vocabulary entry shape:**

```json
{
  "id": "abc123",
  "norsk": "å reise",
  "lemma": "reise",
  "english": "to travel",
  "example": "Vi reiser til utlandet hvert år.",
  "example_english": "We travel abroad every year.",
  "spanish": "viajar",
  "ukrainian": "подорожувати",
  "level": "B1",
  "category": "travel",
  "part": "verb"
}
```

> **Critical:** `norsk` is the FSRS progress key in localStorage and Supabase. Never rename or change it for existing entries — it would break all user progress.

---

## Supabase

Source of truth for schema and functions:

- `supabase/current-schema.sql` — all tables, indexes, RLS policies
- `supabase/current-functions.sql` — RPCs and triggers
- `supabase/current-cron-push-notification.sql` — pg_cron jobs
- `supabase/migrations/` — chronological migration history

Always read `current-schema.sql` before writing a migration. Use the exact constraint and column names from there.

Key tables: `profiles`, `card_progress`, `subscriptions`, `push_subscriptions`, `email_log`, `study_days`.

---

## Auth

Email OTP (6-digit code). No passwords, no magic links. The OTP flow is in `/auth/`. Cloudflare Turnstile bot-check on the email step.

iPad PWA note: magic links were replaced with OTP specifically to fix a cookie-jar isolation bug on iOS PWA.

---

## i18n

Paraglide JS. Message files in `messages/` (en.json, nb.json, es.json, uk.json). Compiled output goes to `src/lib/paraglide/` — do not edit those files directly.

To add or update keys, edit the JSON files and run:

```bash
# Paraglide recompiles automatically via the Vite plugin during dev/build.
# For a standalone compile:
pnpm paraglide:compile   # if you have that script, otherwise just run pnpm dev
```

To translate all keys in `en.json` to another locale using the Anthropic API:

```bash
node scripts/translate-messages.mjs --language spanish
node scripts/translate-messages.mjs --language ukrainian --batch 25
```

---

## Free vs Plus

| Feature                    | Free                   | Plus   |
| -------------------------- | ---------------------- | ------ |
| A1 + A2 vocabulary         | ✅ All                 | ✅ All |
| B1–C2 vocabulary           | Preview only           | ✅ All |
| Due today smart deck       | —                      | ✅     |
| Cross-device sync          | —                      | ✅     |
| Quiz mode                  | Top 3 categories/level | ✅ All |
| Grammar topics             | 4 topics               | ✅ All |
| Norskprøven practice tests | Test 1 only            | ✅ All |
| Full-text search           | —                      | ✅     |
| Per-category stats         | —                      | ✅     |
| Daily email reminder       | —                      | ✅     |
| Download progress report   | —                      | ✅     |

Plus is 49 NOK/month or 490 NOK/year via Lemon Squeezy.

---

## Development

```bash
pnpm install
pnpm dev
```

Requires `.env.local` — see `.env.local.example` for the required variables (Supabase URL/anon key, Lemon Squeezy keys, Resend API key, VAPID keys, Turnstile site key, Anthropic API key for scripts).

```bash
pnpm build          # production build
pnpm check          # svelte-check + tsc
pnpm lint           # prettier + eslint
pnpm format         # prettier --write
pnpm test:e2e       # Playwright
pnpm test:unit      # Vitest
```

---

## Scripts

Utility scripts live in `scripts/`. See `scripts/how-to.md` for full usage. Key ones:

| Script                                           | Purpose                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| `translate-messages.mjs`                         | AI-translate `en.json` into another locale                                |
| `add-language-translations.mjs`                  | Add `spanish`/`ukrainian` fields to vocab JSON files                      |
| `build-search-index.ts`                          | Generate `static/data/search-index.json` (runs before every Vercel build) |
| `generate-og.mjs`                                | Generate OG images for decks and blog posts                               |
| `generate-stats.mjs`                             | Print vocab/uttrykk counts per level (`pnpm stats`)                       |
| `analyse_dupes.mjs` + `apply_dupe_decisions.mjs` | Find and resolve duplicate vocabulary entries                             |
| `patch-*.mjs`                                    | One-off bulk patches to message or data files                             |
| `verify-vocab-ids.mjs`                           | Check all vocab entries have unique IDs                                   |
| `cleanup-e2e-users.ts`                           | Remove test accounts created by Playwright runs                           |

---

## Vercel crons

Defined in `vercel.json`:

| Cron                          | Schedule        | Purpose                                   |
| ----------------------------- | --------------- | ----------------------------------------- |
| `/api/publish-scheduled`      | 06:00 UTC daily | Publish blog posts scheduled for that day |
| `/api/email/welcome-sequence` | 08:00 UTC daily | Send onboarding emails to new users       |

Push notification cron is managed by Supabase pg_cron (see `current-cron-push-notification.sql`).

---

## Deployment

Vercel. Every push to `main` deploys automatically. Build command (from `vercel.json`):

```bash
pnpm search:index && pnpm build
```

The search index must be built before SvelteKit so it lands in `static/data/` before the build copies static files.

---

## Changelog

`pnpm ch` — builds the search index, runs `changeset`, then prints stats. Use before committing a release.  
`pnpm cv` — bump versions from pending changesets.

---

## Key docs

| File                               | What it covers                                                 |
| ---------------------------------- | -------------------------------------------------------------- |
| `CLAUDE.md`                        | AI assistant instructions, blog tag taxonomy, Svelte MCP usage |
| `ai-docs/json-structure.md`        | Vocab JSON schema and lemma/token rationale                    |
| `ai-docs/implementation/`          | Feature implementation plans                                   |
| `ai-docs/ideas/`                   | Backlog ideas                                                  |
| `ai-docs/bugs/`                    | Known bug notes                                                |
| `ai-docs/how-to-monitor-and-test/` | Monitoring and test runbooks                                   |
| `scripts/how-to.md`                | Script usage reference                                         |
