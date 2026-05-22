# Monetization-Focused Plan

## Tiers

| Feature                                | Free | Plus         |
| -------------------------------------- | ---- | ------------ |
| All vocabulary (A1–C2)                 | ✅   | ✅           |
| FSRS rating buttons                    | ✅   | ✅           |
| Basic CEFR estimate                    | ✅   | ✅           |
| Due today smart deck                   | ✅   | ✅           |
| Per-category breakdown + pace forecast | ❌   | ✅           |
| Progress sync across devices           | ❌   | ✅           |
| Email lesson service                   | ❌   | ✅           |
| Full Norskprøven exam questions        | ❌   | ✅           |
| FSRS weight optimisation               | ❌   | ✅           |
| Price                                  | Free | 49 NOK/month |

**Why a feature gate, not a content gate:** The competition (Anki, Duolingo) is free on content. Gating vocabulary categories loses users before they are hooked. The differentiator is the _system_ — FSRS scheduling and honest progress tracking — not the word lists.

---

## Competitive Positioning

**Duolingo** gamifies avoidance — streaks train users to protect their streak rather than actually learn. Vocabulary selection is arbitrary with no CEFR structure. It won't tell you your level and stops being useful past A2 for anyone with a specific goal.

**Anki** has brutal setup friction: downloading decks, configuring the scheduler, understanding card types. Community Norwegian decks are inconsistent and lack example sentences or audio.

**Norskeord's differentiators:**

- CEFR-structured vocabulary (A1–C2) with part-of-speech, example sentences, and TTS
- Full FSRS scheduling — measurably better than SM-2, and "powered by the algorithm behind Anki" is a real marketing hook for serious learners
- Honest CEFR progress tracking: _"You know 81% of A2 words and 23% of B1 — you're solidly A2"_ — an answer Duolingo never gives
- Pace forecast: _"At your current pace, you'll reach B1 in approximately 4 months"_
- Norskprøven exam prep with AI-generated practice questions

The winning strategy is **narrow + deep**: be the best tool for the person studying for Norskprøven, not a mediocre tool for everyone.

---

## Phase 1 — Foundation

The biggest gap right now is that everything lives in `localStorage`. There is no concept of a user, so you cannot persist progress, gate features, or bill anyone.

### 1-A. User accounts

Email/password auth via Supabase Auth. Without this, there is no user to attach a subscription to.

### 1-B. Progress tracking

Track which cards a user has seen, how they rated them, and when they are due. This is the core value of a flashcard app vs. a list of words.

### 1-C. Full FSRS implementation

Currently cards are shuffled randomly. A proper FSRS experience requires:

1. **Structured sessions** — daily new card limit (15/session), intra-session requeuing for Learning cards (Again = 10 min, Hard = 30 min), Review cards shown once per session.
2. **Interval preview before rating** — after flipping, show all four scheduled intervals beneath the buttons (e.g. Again — 10 min / Hard — 30 min / Good — 2 days / Easy — 7 days).
3. **Undo** — one-step undo for 5 seconds after rating; accidental taps corrupt the schedule.
4. **Honest stats** — CEFR estimate front and centre ("You're solidly A2") + pace forecast ("B1 in ~4 months"). This is the emotional hook that converts free users to Plus. Use an attractive chart library such as `@flowbite-svelte-plugins/chart`.
5. **Personal weight optimisation** — after approximately 1,000 review logs, a Supabase Edge Function runs `fsrs.optimizer` and updates the user's personal weights, making the scheduler improve over time.

**Optimisation schedule:**

| Reviews                    | Action                   |
| -------------------------- | ------------------------ |
| 0–999                      | Default FSRS weights     |
| 1,000                      | First optimisation       |
| Every +1,000 (up to 5,000) | Re-optimise              |
| 5,000+                     | Re-optimise every +5,000 |

---

## Phase 2 — Monetization

With accounts and FSRS in place, the freemium model is ready to activate.

### 2-A. Pricing page (`/plus`)

Publish the pricing page before payments are live to create a mental anchor and collect emails from interested users.

### 2-B. Payment integration

**Lemon Squeezy** handles EU/Norwegian VAT automatically as Merchant of Record. No need to register for VAT in Norway yourself.

---

## Phase 3 — Growth Features

### 3-A. Profile page (`/profile`)

The profile page serves two purposes: personal settings and subscription status. Suggested sections:

**Account**

- Display name and email (editable)
- Avatar (upload or initials fallback)
- Target CEFR level selector (A1–B2) — drives the pace forecast on the stats page
- Interface language toggle (English / Norsk Bokmål) — moved here from Nav to reduce clutter
- Flashcard display preferences: Norwegian→English or English→Norwegian; words only or include phrases

**Subscription**
How can Lemon Squeezy do recuring monthly payment?

- Current plan (Free / Plus) with renewal date
- Upgrade / manage billing button (Lemon Squeezy customer portal link)

**Notifications (Plus only)**

- Daily study reminder toggle (default: off) — shown as "8 cards due today" at 7 pm local time, not a streak reminder
- Email lesson service toggle

**Danger zone**

- Export my data (JSON download of all card progress)
- Delete account

### 3-B. Quiz mode

Multiple choice ("which word means X?"), fill-in-the-blank, and type-the-answer. These are separate study modes from flashcards and natural Plus features. Ratings feed back into FSRS just like flashcard mode.

### 3-C. Daily streaks + push notifications

The PWA setup is already in place, so web push is within reach. Frame reminders as _"8 cards due today"_ — a real learning cue — rather than a streak to protect. Send at 7 pm local time if the user hasn't studied that day. Streak display is optional and off by default. Controlled from the Profile page.

### 3-D. Norskprøven exam prep (`/norskproven`)

The Norwegian language proficiency test is mandatory for citizenship and many visa renewals. Tens of thousands of immigrants take it every year — people with a real deadline and high motivation to pay.

- AI-generated practice questions for A1–A2, A2–B1, and B1–B2
- One free sample set for A1–A2; full access requires Plus
- Upsell framing: _"You're studying for B1. Sign up for Norskeord Plus to unlock complete practice sets, FSRS scheduling, and progress tracking."_

**SEO targets:** "Norskprøven ordforråd", "Norskprøven A2 ord", "Norskprøven B1 gloser", "lære norsk statsborgerskap", "norsk B1 gloser", "norskprøven forberedelse"

### 3-E. SEO content pages

Pages such as "Norwegian A1 vocabulary list" and "CEFR B2 Norwegian words" capture organic search traffic. The highest-value target is Norskprøven exam prep (see 3-D above).

---

## Phase 4 — i18n

**Why it matters:** The primary acquisition channel is Norskprøven candidates — immigrants preparing for a citizenship test. Many have intermediate Norwegian but limited English. A Norwegian UI is a direct trust signal: _this app was made for you_.

### Tool: Paraglide via the SvelteKit CLI

Paraglide is SvelteKit's official i18n integration. It compiles message files into tree-shakable typed functions — no runtime overhead, no async waterfalls, and message keys become TypeScript compile errors if misspelled.

```
npx sv add paraglide
```

**Initial language pair:** `en` (default, no URL prefix) + `nb` (Norwegian Bokmål, served at `/nb/...`). Bokmål covers ~85% of Norwegian written usage. This keeps existing URLs stable and avoids breaking SEO.

**Priority pages for Norwegian translation (in order):**

1. `/norskproven` — primary SEO landing page; highest impact
2. `/plus` — conversion page
3. Auth pages (`/auth/login`) — friction at login kills conversion
4. `Nav.svelte` and `Footer.svelte` — persistent chrome that sets the tone
5. `VocabFlashcardPage.svelte` — the core study experience

**Language switcher:** A toggle in the Nav (🇬🇧 / 🇳🇴) that updates the URL prefix. Preference stored in `localStorage`.

**Future languages:** Based on SSB data, the largest immigrant communities after English speakers are Polish (~110k), Ukrainian (~66k), Arabic-speaking (~60k+), Somali (~28k), and Vietnamese (~19k). Arabic and Somali require RTL layout support, which Paraglide handles via the `text-direction` attribute in `app.html`. Suggested order after `nb` is validated: `pl` → `lt` → `so` → `ur` → `ar` → `es`. Treat these as Phase 5+ once translation resources are available.

---

## Phase 5 — Email Service NO MORE DOING THIS

A recurring email service for Plus users delivering short Norwegian texts with one language focus, 5–8 vocabulary items in context, and 1–3 micro-exercises per email. Exercises link to `/daily/[date]` on the site for audio and interactivity.

**Send schedule:**

| Level   | Days | Emails/week |
| ------- | ---- | ----------- |
| A1 / A2 | Fri  | 1           |
| B1 / B2 | Fri  | 1           |

**Stack:** Resend (free tier: 3k/month) + Supabase Edge Functions + `pg_cron`. No Mailchimp or Mailgun needed.

Full details in [`ai-docs/email-service.md`](./email-service.md).

---

## Quick Wins (no backend required)

These can be done immediately, before any infrastructure work:

- Add **Again / Hard / Good / Easy** rating buttons to `VocabFlashcardPage.svelte` (visible after flipping) — even persisting to `localStorage` is immediately useful and seeds the FSRS data model
- Add a `/plus` pricing page before payments are live — creates the mental anchor and lets you collect emails
- Add a `/norskproven` route — captures search traffic immediately, costs nothing to build
- Fill in the `/about` page
- Add i18n via Paraglide (see Phase 4) — many target users are more comfortable reading Norwegian than English; this removes friction on the pages that matter most
