# AI-Powered Audio Implementation Plan

High-quality Norwegian TTS using ElevenLabs, pre-generated and served from Supabase Storage.
Replaces the Web Speech API for consistent, natural-sounding pronunciation across all devices.

---

## Background

The current `SpeakButton.svelte` uses the browser Web Speech API (`SpeechSynthesisUtterance`).
Quality varies significantly by OS and device — particularly poor on Android (Samsung Galaxy A04)
where the `nb-NO` voice is robotic and the API silently ignores pitch/rate settings.

VG.no solves this by using ElevenLabs to pre-generate audio server-side, storing MP3 files, and
serving them on demand. The same approach works well for a flashcard app where the full vocabulary
corpus is known ahead of time.

---

## Cost Estimate

### Corpus size

| Source                     | Est. entries | Audio content              |
| -------------------------- | ------------ | -------------------------- |
| vocab-a1 to vocab-c2       | ~3,500       | word + example sentence    |
| uttrykk-a1 to uttrykk-b2   | ~400         | full phrase                |
| norskprøven (reading texts) | ~200         | full sentence (optional)   |
| **Total**                  | **~4,100**   |                            |

One MP3 per entry (word + example combined): ~4,100 files × ~40 KB avg = **~164 MB total**.

### Supabase Storage

| Resource           | Free tier allowance | Our usage  | Cost      |
| ------------------ | ------------------- | ---------- | --------- |
| Storage            | 1 GB                | ~164 MB    | **Free**  |
| Egress (bandwidth) | 2 GB/month          | Low at current scale | **Free** |

At ~1,000 DAU × 20 plays/day = 600,000 plays/month × 40 KB = ~24 GB egress.
Supabase Pro ($25/mo) includes 250 GB egress — well within limits even at scale.

### ElevenLabs (one-time generation)

~4,100 entries × ~80 chars avg (word + example) ≈ **328,000 characters total**.

| Plan           | Price   | Chars/month | Strategy                            |
| -------------- | ------- | ----------- | ----------------------------------- |
| Starter        | $5/mo   | 30,000      | Too slow (11 months)                |
| Creator        | $22/mo  | 100,000     | 4 months × $22 = ~$88               |
| **Pro**        | **$99/mo** | **500,000** | **One month covers everything. Cancel after.** |

**Recommended: Pro plan for one month (~$99 one-time), then cancel.**

---

## Architecture

```
Build-time / one-time script
  vocab JSON files
      → scripts/generate-audio.ts
          → ElevenLabs API (nb-NO voice)
              → MP3 files
                  → Supabase Storage (bucket: audio)
                      path: audio/nb/{level}/{lemma}.mp3
                      e.g.  audio/nb/a1/hei.mp3

Runtime
  SpeakButton.svelte
      → checks audio_url prop (pre-generated)
          → if present: plays <audio> element (MP3)
          → if absent:  falls back to Web Speech API
```

No server-side routes needed at runtime. All audio is served as static files from Supabase Storage
with public read access. The `audio_url` is resolved at app load time from a generated manifest or
derived from the lemma.

---

## Phases

### Phase A — Voice selection and proof of concept

**Goal:** Pick the right ElevenLabs voice for Norwegian and validate quality.

1. Sign up for ElevenLabs free tier (10,000 chars).
2. Browse voices filtered to `nb` (Norwegian Bokmål). Good candidates:
   - **Freya** — natural female Norwegian voice
   - **Mathias** — natural male Norwegian voice
3. Generate ~20 test words across A1–B2 levels covering nouns, verbs, phrases.
4. Compare against Web Speech API on desktop and Android.
5. Pick one voice and note the `voice_id` for the generation script.

**No code changes yet — just API exploration.**

---

### Phase B — Supabase Storage setup

**Goal:** Create the storage bucket and verify public URL pattern.

1. In Supabase dashboard → Storage → New bucket: `audio`, public read.
2. Confirm public URL pattern:
   ```
   https://<project>.supabase.co/storage/v1/object/public/audio/nb/a1/hei.mp3
   ```
3. Add bucket name to `.env`:
   ```
   PUBLIC_SUPABASE_AUDIO_BUCKET=audio
   ```
4. No RLS needed — public read is fine for audio.

---

### Phase C — Generation script

**Goal:** Batch-generate all MP3s and upload to Supabase Storage.

File: `scripts/generate-audio.ts`

#### Key logic

```typescript
// Derive a stable file key from the lemma (or norsk as fallback)
function audioKey(entry: VocabEntry): string {
  const base = (entry.lemma ?? entry.norsk)
    .toLowerCase()
    .replace(/^å /, '')        // strip verb infinitive marker
    .replace(/^(en|et|ei) /, '') // strip Norwegian articles
    .replace(/[^a-zæøå0-9-]/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return base;
}

// Text sent to ElevenLabs per vocab entry
function buildSpeechText(entry: VocabEntry): string {
  // Speak the display form + pause + example sentence
  // SSML not required — ElevenLabs handles natural pausing
  return `${entry.norsk}. ${entry.example}`;
}
```

#### Script flow

```
1. Load all vocab JSON files (vocab-*.json, uttrykk-*.json)
2. Deduplicate by lemma (same lemma in two categories → generate once)
3. For each entry:
   a. Check if audio/nb/{level}/{key}.mp3 already exists in Supabase Storage
   b. If exists → skip (safe to re-run)
   c. If missing → call ElevenLabs /v1/text-to-speech/{voice_id}
   d. Upload MP3 buffer to Supabase Storage
   e. Rate-limit: ~3 req/sec to stay within ElevenLabs limits
4. Write manifest: scripts/audio-manifest.json
   { "hei": "audio/nb/a1/hei.mp3", ... }
```

#### Environment variables needed

```
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...          # chosen in Phase A
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...    # service role for Storage writes
```

#### Run command

```bash
npx tsx scripts/generate-audio.ts
```

Can be re-run safely — already-generated files are skipped.

---

### Phase D — Manifest and URL resolution

**Goal:** Make audio URLs available to the app at runtime without runtime API calls.

Two options:

**Option D-1 (simpler): Derived URL** — no manifest needed. Derive the public URL from the lemma
at render time using the same `audioKey()` function. Works if the key derivation is deterministic.

**Option D-2 (safer): Static manifest** — generate `src/lib/data/audio-manifest.json` during the
script run. The app imports it and looks up `manifest[lemma]` to get the path. Handles edge cases
(keys with unusual characters) explicitly.

**Recommended: Option D-2.** The manifest makes gaps visible (entries without audio show up as
missing keys) and decouples the URL scheme from the client code.

Manifest shape:

```json
{
  "hei": "audio/nb/a1/hei.mp3",
  "å reise": "audio/nb/b1/reise.mp3"
}
```

Import in app:

```typescript
// src/lib/audio.ts
import manifest from '$lib/data/audio-manifest.json';

const SUPABASE_AUDIO_BASE = import.meta.env.PUBLIC_SUPABASE_URL +
  '/storage/v1/object/public/' +
  import.meta.env.PUBLIC_SUPABASE_AUDIO_BUCKET;

export function getAudioUrl(entry: { norsk: string; lemma?: string }): string | null {
  const key = entry.lemma ?? entry.norsk;
  const path = manifest[key];
  return path ? `${SUPABASE_AUDIO_BASE}/${path}` : null;
}
```

---

### Phase E — SpeakButton upgrade

**Goal:** Update `SpeakButton.svelte` to prefer pre-generated audio with Web Speech fallback.

New prop:

```typescript
interface Props {
  word: string;
  label?: string;
  audioUrl?: string | null;  // pre-generated MP3 URL; if provided, preferred over Web Speech
}
```

Updated `speak()` logic:

```typescript
export function speak() {
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
    return;
  }
  // existing Web Speech API code unchanged below
  ...
}
```

Call sites pass `audioUrl` from `getAudioUrl(entry)`:

```svelte
<!-- VocabFlashcardPage.svelte -->
<SpeakButton word={card.norsk} audioUrl={getAudioUrl(card)} />
```

Web Speech remains as fallback for any entry without a pre-generated file (C1/C2 initially,
or any newly added words before the next generation run).

---

### Phase F — Plus gating (optional)

**Goal:** Gate high-quality audio behind the Plus plan as a differentiator.

Free tier: Web Speech API (current behaviour).
Plus tier: pre-generated ElevenLabs audio.

Implementation: pass `audioUrl` only when `isPlus` is true:

```svelte
<SpeakButton
  word={card.norsk}
  audioUrl={isPlus ? getAudioUrl(card) : null}
/>
```

Add to Plus comparison table on `/plus`:

> 🔊 **High-quality Norwegian audio** — natural AI voice, consistent across all devices

**This phase is optional** — you may choose to offer high-quality audio to all users as a quality
signal rather than a paywall feature.

---

### Phase G — Blog posts (future)

Same ElevenLabs voice can be used for blog post audio (VG-style article reading).

Workflow:
1. At publish time, run `scripts/generate-post-audio.ts` with the post body text.
2. Upload MP3 to Supabase Storage under `audio/posts/{slug}.mp3`.
3. Embed in the blog post layout with a play button above the content.

No additional infrastructure needed — reuses the same bucket and voice.

---

## File map

| File | Purpose |
| ---- | ------- |
| `scripts/generate-audio.ts` | Batch generation + Supabase upload script |
| `scripts/audio-manifest.json` | Output of generation script (gitignored or committed) |
| `src/lib/data/audio-manifest.json` | Manifest imported by the app |
| `src/lib/audio.ts` | `getAudioUrl()` helper |
| `src/lib/SpeakButton.svelte` | Updated to accept `audioUrl` prop |

---

## Rollout order

```
A (voice selection) → B (storage setup) → C (generation script, A1 only first)
→ D (manifest) → E (SpeakButton upgrade) → test on Android
→ C again (full corpus) → F (Plus gating, optional)
```

Start with A1 only in Phase C to validate the full pipeline before generating 4,100 files.

---

## What is NOT changing

- Vocab JSON files — no `audio_url` fields added. URLs are resolved at runtime via the manifest.
- FSRS progress keys — still based on `norsk` field, unaffected.
- Web Speech API code in `SpeakButton.svelte` — kept intact as fallback.
- Supabase database schema — Storage only, no new tables.
