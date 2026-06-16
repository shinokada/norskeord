My thoughts after reading the following:

- Relating to ./when-can-app-be-monolingual.md, start from A1, src/lib/data/vocab-a1.json, uttrykk-1.json, uttrykk-a1.preview.json, and messages/xx.json
- B2 and above don't need since it will be monolingual.
- I think I will start from Ukrainian first, then other languages.
- Polish and Pakistani are in Norway for a long time and I don't think they are new Norwegian learners.
- Arabic is interesting one.
- I met a quite few Spanish speakers in Oslo.
- South Asian language like Thai and Vietnamese can be candidates.
- Another consideration is Nepali.

---

Adding languages beyond English makes a lot of sense for Oslo specifically — and your own `ai-docs/multi-language.md` already has a solid, well-scoped plan for this (translation + example fields on `VocabEntry`, a `languageStore`, no changes to `ui_language` or the rest of the UI). Worth noting: that plan already lists **Polish** alongside Spanish and Ukrainian as one of the four initial languages, even though you didn't mention it here — and the demographic data backs that up strongly.

I searched for current numbers on immigrant populations in Norway/Oslo to ground this rather than guess, and a few things stand out:

Nationally, the largest immigrant groups come from Poland (111,376), Ukraine (79,624), Lithuania (43,077), Syria (40,774) and Sweden (37,213), and historically Poles are also the biggest group of immigrants living in Norway. In Oslo specifically, the largest ethnic minority in Oslo is Pakistanis, followed by immigrants from Sweden, Somalia, and Poland.

So my take, in order of priority:

**Polish** — already in your draft, and arguably the single highest-value addition. It's the largest immigrant group both nationally and in Oslo, and a meaningful share of Polish labor migrants (especially in construction, trades, cleaning) have limited English. This should probably be language #1, not an afterthought alongside Spanish/Ukrainian.

**Ukrainian** — yes, agreed, and there's urgency here: the post-2022 refugee wave is large and recent, many adults arrived with little to no English or Norwegian, and many are actively in government-funded Norwegian courses right now. This is a population with genuinely strong, current demand for exactly what you're building.

**Spanish** — this is the one I'd reconsider in terms of _priority_, though not necessarily cut. Latin American immigration to Norway is comparatively small — Spanish-speaking countries don't appear in the top immigrant-origin lists for Norway or Oslo. If your goal is "serve non-English-speakers currently living in Oslo," Spanish is lower-impact than Polish or Ukrainian. But if your goal is broader — e.g., reaching the much larger global population of Spanish L1 speakers who might be considering a move to Norway, or just maximizing total addressable market for the app — Spanish is one of the most widely spoken L1s in the world and could pull in users well beyond Oslo. Worth being clear with yourself about which goal you're optimizing for, since it changes the answer.

On Hindi/Indians — I'd push back gently, but on a slightly different group than the one you named. India had the largest decrease in migration flows to Norway recently, and your instinct that Indian immigrants in Norway tend to have strong English is generally consistent with what's documented. But Pakistanis are _the_ largest minority group in Oslo specifically, and that community is large enough and multigenerational enough that there's likely a real subset — older first-generation arrivals, women who came via family reunification, etc. — with much weaker English than the India-via-skilled-migration population. If you're going to skip South Asia, I'd think about Urdu/Punjabi before dismissing Hindi, given the Oslo-specific numbers. That said, this is the kind of thing best validated by actually asking your users (a quick in-app survey on "what's your first language?" would tell you more than demographic statistics ever could).

Other candidates worth keeping on the radar given the data: Somali (large, established Oslo community, often lower English proficiency among older arrivals) and Arabic (covers Syria + Iraq, two top-10 source countries, and is broadly useful across multiple MENA immigrant groups even when it's not someone's exact dialect).

One practical flag on scope, since your plan already handles this well but it's easy to lose discipline on later: Arabic and Urdu would bring RTL layout into the picture, which is a meaningfully bigger UI lift than adding another Latin/Cyrillic-script language like Polish or Ukrainian. I'd treat "Latin/Cyrillic script languages" (Polish, Ukrainian, Spanish) as one phase — basically just data + the store/dropdown work your doc already specced — and treat RTL languages as a separate phase with its own design/testing pass.

Given the scale of the data work (6 level files × N languages × translation + example fields, with B1+ also carrying the Norwegian `definition` field unaffected), I'd pilot with **one** language end-to-end first — Polish or Ukrainian — including native-speaker QA on a sample, before fanning out the AI-generation prompt across all languages and levels at once. That way if there's a systemic issue (e.g., AI-generated examples drifting above the target CEFR level, which is the same defining-vocabulary problem we discussed for the Norwegian definitions), you catch it on one language's worth of data instead of four.
