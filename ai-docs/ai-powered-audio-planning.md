# AI Powered Audio

VG's audio is indeed noticeably better than browser Web Speech API — the difference is that they're using **ElevenLabs**, which generates pre-rendered MP3 audio server-side rather than doing text-to-speech live in the browser. Here's a breakdown of your options and how they'd fit into norskeord:

---

## The core difference

**Web Speech API (what you use now):** Free, instant, runs in-browser, but quality varies wildly by OS/device and has the Android inconsistency bugs you've already fought.

**ElevenLabs (what VG uses):** Cloud TTS API, generates high-quality audio files you can store and serve. Sounds like a real human. Costs money per character.

---

## Could you do the same thing?

Yes, and it would fit norskeord quite naturally. A few approaches:

### Option A — Pre-generate and store audio (VG's approach)
Generate MP3 files for every Norwegian word/example sentence at build time or via a script, upload them to Supabase Storage, and serve them from there. The `SpeakButton` component just plays a URL instead of calling Web Speech.

**Pros:** Zero latency, consistent quality everywhere, no API calls at runtime.  
**Cons:** Storage costs (small for vocab), and you'd need to re-generate if pronunciations change. For ~2,000 B2 words + example sentences, this is maybe a few thousand API calls up-front.

### Option B — Generate on demand, cache in Supabase
First request for a word generates audio via ElevenLabs API (server-side route), stores it in Supabase Storage, future plays fetch the cached file.

**Pros:** Only generates what users actually encounter, no big up-front batch job.  
**Cons:** First play has latency; requires a server-side route.

### Option C — ElevenLabs only for Plus users
Free tier keeps Web Speech API, Plus users get pre-generated high-quality audio. Actually a nice monetization angle.

---

## ElevenLabs pricing reality

Their **Starter plan is $5/mo for 30,000 characters/month**. A typical Norwegian word + example sentence is ~50–100 chars. That's 300–600 words/sentences per month on the cheapest paid tier. For pre-generating your entire vocab corpus once, you'd use a **Creator plan ($22/mo, 100k chars)** or just do a one-time batch with any plan.

They also have a **free tier (10,000 chars/month)** — enough to prototype and test.

---

## For blog posts

Even simpler — you'd just run a script before publishing that generates an MP3 for the post body and embed it. Same pattern as VG.

---

## My recommendation for norskeord

The cleanest path: write a **one-time Python/Node script** that iterates your vocab JSON files, calls ElevenLabs for each word + example, saves MP3s to Supabase Storage with a predictable path pattern like `audio/nb/{word_id}.mp3`. Then update `SpeakButton` to prefer `audio_url` from the vocab data over Web Speech fallback.

Want me to look at your current `SpeakButton.svelte` and vocab data structure to sketch out exactly how this would fit in?

Let me check your current Supabase setup and vocab data to give you a realistic estimate.Good, now I have what I need. Let me count the entries across the key files.The bash sandbox can't reach your local Mac filesystem directly. But I already have all the data I need from the file sizes and the JSON structure I read. Let me calculate this manually.Good enough — I can estimate from the file sizes and known entry structure. Here's the full breakdown:

---

## Supabase cost estimate

### Step 1 — How many audio files?

Based on file sizes and the ~9–10 fields per entry structure I can see:

| File                     | Est. entries       | What to speak           |
| ------------------------ | ------------------ | ----------------------- |
| vocab-a1 to vocab-c2     | ~3,500 total       | word + example sentence |
| uttrykk-a1 to uttrykk-b2 | ~400 total         | full phrase only        |
| norskprøven              | ~200 total         | full sentence           |
| **Total**                | **~4,100 entries** |                         |

If you generate **one audio file per entry** (word + example sentence combined), that's ~4,100 MP3 files. If you split word and example separately, ~8,200 files.

### Step 2 — How big are the MP3s?

ElevenLabs output at standard quality (MP3, 128kbps):
- A single Norwegian word: ~5–15 KB
- A word + example sentence (~40–60 chars): ~30–60 KB

Rough average: **~40 KB per file**

**Total storage: ~4,100 × 40 KB ≈ 164 MB**

### Step 3 — Supabase Storage pricing

Supabase's free tier includes **1 GB storage** and **2 GB egress/month**. You're well within free tier on storage — 164 MB is only ~16% of the 1 GB free allowance.

**Egress** (bandwidth) is where it gets interesting. Every time a user plays audio, they download that file (~40 KB). The free tier gives 2 GB/month egress.

2 GB ÷ 40 KB = **~50,000 audio plays/month for free**

For a flashcard app at your current scale, that's very comfortable. Even at 1,000 daily active users each playing 20 words/day = 20,000 plays/day × 30 = 600,000 plays/month. At that scale you'd be looking at ~24 GB egress, which on the Pro plan ($25/mo) costs $0.09/GB over 250 GB — so still just a few dollars.

### Step 4 — ElevenLabs generation cost (one-time)

The real cost is the **one-time generation**, not Supabase hosting:

4,100 entries × ~80 chars average (word + example) = **~328,000 characters**

ElevenLabs pricing:
- Free tier: 10,000 chars/month — not enough for a full batch
- **Starter ($5/mo): 30,000 chars** — need 11 months, impractical
- **Creator ($22/mo): 100,000 chars** — do it in 4 months, or just pay for one month and cancel
- **Pro ($99/mo): 500,000 chars** — one month covers everything comfortably ($99 one-time effectively)

**Most practical approach: one month of Creator at $22 × 4 months = ~$88 total**, or Pro at $99 one-time. Then cancel and you have all the audio files forever.

---

## Summary

| Cost                             | Amount                              |
| -------------------------------- | ----------------------------------- |
| Supabase storage                 | **Free** (164 MB << 1 GB)           |
| Supabase egress at current scale | **Free** (well under 2 GB/mo)       |
| ElevenLabs one-time generation   | **~$88–99** (one-time, then cancel) |
| Ongoing Supabase cost            | **$0** unless you grow a lot        |

So the real cost is essentially just a one-time ~$90 ElevenLabs batch generation. After that, hosting on Supabase is free for quite a while. Want to proceed with planning the implementation?