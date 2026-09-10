<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import {
    loadProgressMap,
    loadProgressMapFromSupabase,
    loadGrammarProgressMap,
    loadGrammarProgressFromSupabase,
    countDueToday,
    getStreakFromLocalStorage,
    loadStudyDays,
    buildActivityGrid,
    resetProgressInSupabase,
    clearUserProgress
  } from '$lib/progress';
  import type { ActivityCell } from '$lib/progress';
  import { CATEGORIES_BY_LEVEL } from '$lib/config';
  import { UTTRYKK_C_KEYS } from '$lib/uttrykk-c-stats';
  import { State } from 'ts-fsrs';
  import type { CardProgress, CEFRLevel } from '$lib/types';
  import { localeStore } from '$lib/localeStore.svelte';
  import * as m from '$lib/paraglide/messages.js';
  import {
    vocabCategoryStatsForLevel,
    uttrykkThemeStatsForLevel,
    grammarTopicStatsForLevel
  } from '$lib/stats';
  import LevelStatRows from '$lib/components/LevelStatRows.svelte';
  import ActivityChart from '$lib/components/ActivityChart.svelte';
  import CollapsibleSection from '$lib/components/CollapsibleSection.svelte';

  // ── State ────────────────────────────────────────────────────────────────────
  let progressMap = $state<Record<string, CardProgress>>({});
  // Grammar progress is a separate store (keyed by question id). The level/category
  // fields on these CardProgress entries carry the CEFR level and the topic.
  let grammarMap = $state<Record<string, CardProgress>>({});
  let confirmReset = $state(false);
  let resetting = $state(false);
  let mounted = $state(false);

  // Activity chart state
  let activityCells = $state<ActivityCell[]>([]);
  let streak = $state(0);
  let activityLoading = $state(true);

  // 3-A: plan gate
  let user = $derived(page.data.user);
  let displayName = $derived(page.data.displayName as string | null);
  let plan = $derived(page.data.plan as 'free' | 'plus');
  let isPlus = $derived(plan === 'plus');

  // ── Derived totals ────────────────────────────────────────────────────────────
  const allCards = $derived(Object.values(progressMap));
  const totalSeen = $derived(allCards.length);

  const byState = $derived({
    learning: allCards.filter((c) => c.fsrs.state === State.Learning).length,
    review: allCards.filter((c) => c.fsrs.state === State.Review).length,
    relearning: allCards.filter((c) => c.fsrs.state === State.Relearning).length
  });

  // ── Grammar totals ─────────────────────────────────────────────────────────
  const isNb = $derived(localeStore.current === 'nb');
  const grammarCards = $derived(Object.values(grammarMap));
  const grammarSeen = $derived(grammarCards.length);
  const grammarDue = $derived(countDueToday(grammarMap));

  const levels = ['A1', 'A2', 'B1', 'B2', 'C'] as const;

  const levelColors: Record<CEFRLevel, string> = {
    A1: 'bg-green-500',
    A2: 'bg-teal-500',
    B1: 'bg-blue-500',
    B2: 'bg-indigo-500',
    C: 'bg-purple-500'
  };

  const levelTextColors: Record<CEFRLevel, string> = {
    A1: 'text-green-700 dark:text-green-400',
    A2: 'text-teal-700 dark:text-teal-400',
    B1: 'text-blue-700 dark:text-blue-400',
    B2: 'text-indigo-700 dark:text-indigo-400',
    C: 'text-purple-700 dark:text-purple-400'
  };

  interface LevelStat {
    level: CEFRLevel;
    seen: number;
    learning: number;
    review: number;
    relearning: number;
    due: number;
  }

  /**
   * Shared by the Vocabulary and Uttrykk blocks' free-tier per-level summary
   * card — each filters allCards down to its own content type first (see
   * vocabCards/uttrykkCards below), then calls this against the full A1..C
   * levels list so the active level's card can just look itself up. For C,
   * uttrykkCards is built via a key-based match against uttrykk-c.json
   * (uttrykk-c-stats.ts) rather than category === 'uttrykk', since C's
   * uttrykk entries carry their real category, not the 'uttrykk' sentinel —
   * see Phase 4/6 of ai-docs/implementation/uttrykk-category.md.
   */
  function buildLevelStats(cards: CardProgress[], levelsList: readonly CEFRLevel[]): LevelStat[] {
    const now = new Date();
    return levelsList.map((level) => {
      const lvlCards = cards.filter((c) => c.level === level);
      return {
        level,
        seen: lvlCards.length,
        learning: lvlCards.filter((c) => c.fsrs.state === State.Learning).length,
        review: lvlCards.filter((c) => c.fsrs.state === State.Review).length,
        relearning: lvlCards.filter((c) => c.fsrs.state === State.Relearning).length,
        due: lvlCards.filter((c) => new Date(c.fsrs.due) <= now).length
      };
    });
  }

  // ── Vocabulary vs. Uttrykk split ──────────────────────────────────────────
  // A card's CardProgress.category is 'uttrykk' for A1–B2 uttrykk entries.
  // C-level uttrykk entries never carry that sentinel — they merge into
  // vocab-c.json's categories at read time (Phase 4), so a studied C idiom's
  // card looks identical to a studied C vocab word's card except for its
  // progressMap key, which uttrykk-c-stats.ts can match back to
  // uttrykk-c.json. UTTRYKK_C_KEYS.has(key) is what makes that split exact
  // for C, not just an approximation.
  const vocabCards = $derived(
    Object.entries(progressMap)
      .filter(
        ([key, c]) => c.category !== 'uttrykk' && !(c.level === 'C' && UTTRYKK_C_KEYS.has(key))
      )
      .map(([, c]) => c)
  );
  const uttrykkCards = $derived(
    Object.entries(progressMap)
      .filter(
        ([key, c]) => c.category === 'uttrykk' || (c.level === 'C' && UTTRYKK_C_KEYS.has(key))
      )
      .map(([, c]) => c)
  );

  function computeDueToday(cards: CardProgress[]): number {
    const now = new Date();
    return cards.filter((c) => new Date(c.fsrs.due) <= now).length;
  }

  const vocabSeen = $derived(vocabCards.length);
  const vocabDue = $derived(computeDueToday(vocabCards));
  const vocabLevelStats = $derived<LevelStat[]>(buildLevelStats(vocabCards, levels));

  const uttrykkSeen = $derived(uttrykkCards.length);
  const uttrykkDue = $derived(computeDueToday(uttrykkCards));
  // All five levels now — C is included via the key-based split above, using
  // its own real category slugs as "themes" (see uttrykkThemeStatsForLevel
  // in stats.ts).
  const uttrykkLevelStats = $derived<LevelStat[]>(buildLevelStats(uttrykkCards, levels));

  const totalDueToday = $derived(vocabDue + uttrykkDue + grammarDue);

  // ── Level tabs (Phase 3) ─────────────────────────────────────────────────────
  const ACTIVE_LEVEL_KEY = 'stats-active-level';

  function isCEFRLevel(v: string): v is CEFRLevel {
    return (levels as readonly string[]).includes(v);
  }

  let activeLevel = $state<CEFRLevel>('A1');

  function setActiveLevel(level: CEFRLevel) {
    activeLevel = level;
    try {
      localStorage.setItem(ACTIVE_LEVEL_KEY, level);
    } catch {
      /* ignore */
    }
  }

  // ── Accordion sections (stats-page-update.md) ───────────────────────────────
  // One global flag per content type — not per-level (see the doc's resolved
  // Open questions). Defaults to expanded so first visit is pixel-for-pixel
  // identical to the pre-accordion page (Goal 4).
  type SectionKey = 'vocab' | 'uttrykk' | 'grammar';

  const SECTION_STORAGE_KEYS: Record<SectionKey, string> = {
    vocab: 'stats-section-vocab-open',
    uttrykk: 'stats-section-uttrykk-open',
    grammar: 'stats-section-grammar-open'
  };

  let vocabOpen = $state(true);
  let uttrykkOpen = $state(true);
  let grammarOpen = $state(true);

  function toggleSection(key: SectionKey) {
    let next: boolean;
    if (key === 'vocab') {
      vocabOpen = !vocabOpen;
      next = vocabOpen;
    } else if (key === 'uttrykk') {
      uttrykkOpen = !uttrykkOpen;
      next = uttrykkOpen;
    } else {
      grammarOpen = !grammarOpen;
      next = grammarOpen;
    }
    try {
      localStorage.setItem(SECTION_STORAGE_KEYS[key], String(next));
    } catch {
      /* ignore */
    }
  }

  // Per-level rows for the three content-type blocks — same StatRow shape
  // for all three (see stats.ts), rendered through the one LevelStatRows
  // component (Phase 2).
  const vocabRowsForActiveLevel = $derived(vocabCategoryStatsForLevel(activeLevel, progressMap));
  const uttrykkRowsForActiveLevel = $derived(uttrykkThemeStatsForLevel(activeLevel, progressMap));
  const grammarRowsForActiveLevel = $derived(
    grammarTopicStatsForLevel(activeLevel, grammarMap, isNb)
  );

  // Free-tier per-level summary cards — the vocabLevelStats/uttrykkLevelStats
  // arrays always have one entry per level (buildLevelStats maps over all
  // five unconditionally), so these lookups always resolve.
  const activeVocabLevelStat = $derived(vocabLevelStats.find((ls) => ls.level === activeLevel)!);
  const activeUttrykkLevelStat = $derived(
    uttrykkLevelStats.find((ls) => ls.level === activeLevel)!
  );

  const grammarSeenForActiveLevel = $derived(
    grammarCards.filter((c) => c.level === activeLevel).length
  );
  const grammarDueForActiveLevel = $derived(
    computeDueToday(grammarCards.filter((c) => c.level === activeLevel))
  );
  const grammarMasteredForActiveLevel = $derived(
    grammarCards.filter((c) => c.level === activeLevel && c.fsrs.state === State.Review).length
  );

  // ── CEFR estimate ─────────────────────────────────────────────────────────────
  const categoryCountByLevel: Record<CEFRLevel, number> = {
    A1: CATEGORIES_BY_LEVEL.A1.length,
    A2: CATEGORIES_BY_LEVEL.A2.length,
    B1: CATEGORIES_BY_LEVEL.B1.length,
    B2: CATEGORIES_BY_LEVEL.B2.length,
    C: CATEGORIES_BY_LEVEL.C.length
  };

  function getCefrEstimate(cards: CardProgress[]): string {
    const seenCategoriesByLevel: Record<CEFRLevel, Set<string>> = {
      A1: new Set(),
      A2: new Set(),
      B1: new Set(),
      B2: new Set(),
      C: new Set()
    };
    for (const card of cards) {
      seenCategoriesByLevel[card.level].add(card.category);
    }

    const coverage = levels.map((level) => ({
      level,
      pct: Math.min(
        100,
        Math.round((seenCategoriesByLevel[level].size / categoryCountByLevel[level]) * 100)
      )
    }));

    let solidLevel: CEFRLevel | null = null;
    let growingLevel: CEFRLevel | null = null;
    for (const { level, pct } of coverage) {
      if (pct >= 50) solidLevel = level;
      else if (pct > 0 && !growingLevel) growingLevel = level;
    }

    if (!solidLevel && !growingLevel) {
      return m.stats_cefr_no_cards();
    }
    if (solidLevel && growingLevel) {
      const sPct = coverage.find((c) => c.level === solidLevel)?.pct ?? 0;
      const gPct = coverage.find((c) => c.level === growingLevel)?.pct ?? 0;
      return m.stats_cefr_solid_and_growing({
        solidPct: String(sPct),
        solidLevel,
        growingPct: String(gPct),
        growingLevel
      });
    }
    if (solidLevel) {
      const sPct = coverage.find((c) => c.level === solidLevel)?.pct ?? 0;
      return m.stats_cefr_solid_only({ solidPct: String(sPct), solidLevel });
    }
    const a1pct = coverage.find((c) => c.level === 'A1')?.pct ?? 0;
    const a2pct = coverage.find((c) => c.level === 'A2')?.pct ?? 0;
    return m.stats_cefr_getting_started({ a1pct: String(a1pct), a2pct: String(a2pct) });
  }

  const cefrEstimate = $derived(getCefrEstimate(allCards));

  // ── Share / clipboard ───────────────────────────────────────────────────────
  let copied = $state(false);

  function buildShareText(): string {
    const parts: string[] = [];

    if (byState.review > 0) {
      parts.push(m.stats_share_memorized({ count: byState.review }));
    } else if (totalSeen > 0) {
      parts.push(m.stats_share_explored({ count: totalSeen }));
    }

    // Extract the highest solid CEFR level from the estimate string
    const levelMatch = cefrEstimate.match(/\b(A1|A2|B1|B2|C)\b/);
    if (levelMatch) parts.push(m.stats_share_currently_at({ level: levelMatch[0] }));

    if (streak >= 3) parts.push(m.stats_share_streak({ count: streak }));

    return parts.join(' · ') + ' 🇳🇴 norskeord.no';
  }

  async function handleShare() {
    const text = buildShareText();
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 2500);
    } catch {
      // Fallback: prompt with pre-filled text
      prompt(m.stats_share_copy_prompt(), text);
    }
  }

  onMount(async () => {
    const userId = page.data.user?.id as string | undefined;

    if (isPlus && userId) {
      // Plus: single source of truth is Supabase
      progressMap = await loadProgressMapFromSupabase(userId);
      grammarMap = await loadGrammarProgressFromSupabase(userId);
    } else {
      // Guest / free: localStorage
      progressMap = await loadProgressMap();
      grammarMap = loadGrammarProgressMap();
    }
    mounted = true;

    // Restore the active level tab, or default to where cefrEstimate (just
    // recomputed above via progressMap) says the learner currently is.
    try {
      const saved = localStorage.getItem(ACTIVE_LEVEL_KEY);
      if (saved && isCEFRLevel(saved)) {
        activeLevel = saved;
      } else {
        const match = cefrEstimate.match(/\b(A1|A2|B1|B2|C)\b/);
        if (match) activeLevel = match[0] as CEFRLevel;
      }
    } catch {
      /* ignore */
    }

    // Restore each section's collapse state — missing or invalid value
    // (e.g. a user who never touched a toggle) defaults to expanded, so
    // first-time-toggling users still see everything as before.
    try {
      const savedVocab = localStorage.getItem(SECTION_STORAGE_KEYS.vocab);
      if (savedVocab === 'true' || savedVocab === 'false') vocabOpen = savedVocab === 'true';
      const savedUttrykk = localStorage.getItem(SECTION_STORAGE_KEYS.uttrykk);
      if (savedUttrykk === 'true' || savedUttrykk === 'false')
        uttrykkOpen = savedUttrykk === 'true';
      const savedGrammar = localStorage.getItem(SECTION_STORAGE_KEYS.grammar);
      if (savedGrammar === 'true' || savedGrammar === 'false')
        grammarOpen = savedGrammar === 'true';
    } catch {
      /* ignore */
    }

    if (isPlus && userId) {
      streak = 0; // streak comes from study_days below
      // study_days already counts grammar reviews (saveGrammarProgress calls
      // recordStudyDay), so no separate grammar handling is needed here.
      const studyDays = await loadStudyDays(userId);
      activityCells = buildActivityGrid(studyDays, 26);
      // Derive streak from study_days
      const studyDaySet = new Set(Object.keys(studyDays));
      let s = 0;
      const todayStr = new Date().toISOString().slice(0, 10);
      let cursorMs = Date.now();
      // If today has no entry, start counting from yesterday
      if (!studyDaySet.has(todayStr)) cursorMs -= 86_400_000;
      while (true) {
        const key = new Date(cursorMs).toISOString().slice(0, 10);
        if (!studyDaySet.has(key)) break;
        s++;
        cursorMs -= 86_400_000;
      }
      streak = s;
    } else {
      // Free/guest: derive streak + activity from vocab AND grammar reviews so
      // grammar-only practice still counts. Keys don't collide (norsk vs id).
      const combined = { ...progressMap, ...grammarMap };
      streak = getStreakFromLocalStorage(combined);
      const localStudyDays: Record<string, number> = {};
      for (const p of Object.values(combined)) {
        if (p.lastSeen) {
          const d = new Date(p.lastSeen);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          localStudyDays[key] = (localStudyDays[key] ?? 0) + 1;
        }
      }
      activityCells = buildActivityGrid(localStudyDays, 26);
    }

    activityLoading = false;
  });

  async function handleReset() {
    if (!confirmReset) return;
    resetting = true;
    try {
      const userId = page.data.user?.id as string | undefined;
      if (userId && isPlus) {
        // Plus: Supabase is the only store — wipe vocab + grammar + study days
        await resetProgressInSupabase(userId);
      } else {
        // Guest / free: wipe localStorage (clears both progress- and grammar- keys)
        clearUserProgress();
      }
      progressMap = {};
      grammarMap = {};
      activityCells = buildActivityGrid({}, 26);
      streak = 0;
    } finally {
      confirmReset = false;
      resetting = false;
    }
  }
</script>

<div class="mx-auto max-w-4xl px-4 py-10 text-left">
  <!-- Header -->
  <div class="mb-8 flex items-start justify-between gap-4">
    <div>
      <h1>
        {displayName ? m.stats_title_named({ name: displayName }) : m.stats_title()}
      </h1>
      <p class="mt-1 text-gray-500 dark:text-gray-300">
        {isPlus
          ? m.stats_subtitle_plus()
          : user
            ? m.stats_subtitle_free()
            : m.stats_subtitle_guest()}
      </p>
      {#if !isPlus}
        <p class="mt-2 text-sm text-indigo-600 dark:text-indigo-400">
          🔁 {user ? m.stats_sync_upsell_free() : m.stats_sync_upsell_guest()}
          <a
            href="/plus"
            class="ml-1 font-semibold underline underline-offset-2 hover:text-indigo-800 dark:hover:text-indigo-200"
            >{m.stats_sync_upsell_cta()}</a
          >
        </p>
      {/if}
    </div>
    {#if mounted && totalSeen > 0}
      <button
        type="button"
        onclick={handleShare}
        class="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium transition
          {copied
          ? 'border-green-400 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/20 dark:text-green-400'
          : 'text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'}"
      >
        {copied ? m.stats_share_copied() : m.stats_share_button()}
      </button>
    {/if}
  </div>

  {#if !mounted}
    <p class="text-gray-600 dark:text-gray-300">{m.stats_loading()}</p>
  {:else if totalSeen === 0 && grammarSeen === 0}
    <!-- Empty state -->
    <div
      class="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-indigo-950/60"
    >
      <p class="text-2xl">📚</p>
      <p class="mt-3 text-lg font-medium dark:text-white">{m.stats_empty_heading()}</p>
      <p class="mt-1 text-gray-500 dark:text-gray-300">{m.stats_empty_body()}</p>
      <a
        href="/"
        class="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        {m.stats_start_studying()}
      </a>
    </div>
  {:else}
    <!-- ── CEFR Estimate (vocab-based) ───────────────────────────────────────── -->
    {#if totalSeen > 0}
      <div
        class="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20"
      >
        <p class="text-sm font-semibold tracking-wide text-blue-600 uppercase dark:text-blue-400">
          {m.stats_cefr_label()}
        </p>
        <p class="mt-1 text-base text-gray-800 dark:text-gray-200">{cefrEstimate}</p>
      </div>
    {/if}

    <!-- ── Activity chart ────────────────────────────────────────────────────── -->
    <div
      class="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-indigo-950/60"
    >
      <p class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
        {m.stats_activity_heading()}
      </p>
      <ActivityChart cells={activityCells} {streak} loading={activityLoading} {isPlus} />
    </div>

    <!-- ── Summary strip ─────────────────────────────────────────────────────── -->
    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {#each [{ label: m.stats_vocabulary_heading(), value: vocabSeen, color: 'text-gray-800 dark:text-white' }, { label: m.stats_uttrykk_heading(), value: uttrykkSeen, color: 'text-gray-800 dark:text-white' }, { label: m.stats_grammar_practiced(), value: grammarSeen, color: 'text-gray-800 dark:text-white' }, { label: m.stats_due_today(), value: totalDueToday, color: 'text-red-600 dark:text-red-400' }] as stat (stat.label)}
        <div
          class="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm dark:border-white/10 dark:bg-indigo-950/60"
        >
          <p class="text-2xl font-bold {stat.color}">{stat.value}</p>
          <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-300">{stat.label}</p>
        </div>
      {/each}
    </div>

    <!-- ── Study due (Step 4a, ai-docs/implementation/due-only.md) ────────────── -->
    {#if totalDueToday > 0}
      <a
        href="/review"
        class="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
      >
        <span class="font-semibold">📌 Study due now</span>
        <span class="rounded-full bg-red-600 px-2.5 py-1 text-sm font-bold text-white"
          >{totalDueToday}</span
        >
      </a>
    {/if}

    <!-- ── Level tabs ─────────────────────────────────────────────────────────── -->
    <div
      class="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-white/10 dark:bg-indigo-900/30"
      role="tablist"
      aria-label={m.stats_by_level()}
    >
      {#each levels as lvl (lvl)}
        <button
          type="button"
          role="tab"
          aria-selected={activeLevel === lvl}
          onclick={() => setActiveLevel(lvl)}
          class="flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors {activeLevel ===
          lvl
            ? `${levelColors[lvl]} text-white`
            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'}"
        >
          {lvl}
        </button>
      {/each}
    </div>

    <!-- ── Study due at this level (Step 4b) ────────────────────────────── -->
    <!-- Vocab+uttrykk only — matches /review's scope; grammar isn't included
         in that count so this badge stays accurate for what clicking it
         actually opens (see due-only.md's Open questions). -->
    {#if activeVocabLevelStat.due + activeUttrykkLevelStat.due > 0}
      <a
        href="/review?level={activeLevel.toLowerCase()}"
        class="-mt-3 mb-6 flex items-center justify-between rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-indigo-950/60 dark:text-red-300 dark:hover:bg-red-900/20"
      >
        <span class="font-medium">Study due at {activeLevel}</span>
        <span
          class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-400"
        >
          {activeVocabLevelStat.due + activeUttrykkLevelStat.due} due
        </span>
      </a>
    {/if}

    <!-- ── Vocabulary — active level ──────────────────────────────────────────── -->
    <!-- Phase 3: only Plus users get the collapsible wrapper — free users'
         collapsible content is just the small upsell box, which isn't worth
         collapsing (see stats-page-update.md Phase 3). -->
    {#if isPlus}
      <CollapsibleSection
        icon="📖"
        title={m.stats_vocabulary_heading()}
        open={vocabOpen}
        onToggle={() => toggleSection('vocab')}
        id="stats-vocab"
      >
        {#snippet summary()}
          <div
            class="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-indigo-950/60"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="font-semibold {levelTextColors[activeLevel]}">{activeLevel}</span>
              <span class="text-sm text-gray-500 dark:text-gray-300">
                {activeVocabLevelStat.seen}
                {m.stats_seen()} · {activeVocabLevelStat.due}
                {m.stats_due_today_short()}
              </span>
            </div>
            <div class="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-indigo-900/40">
              {#if activeVocabLevelStat.seen > 0}
                <div class="flex h-full">
                  {#if activeVocabLevelStat.learning > 0}
                    <div
                      class="bg-yellow-400"
                      style="width: {(activeVocabLevelStat.learning / activeVocabLevelStat.seen) *
                        100}%"
                      title={m.stats_tooltip_learning({ count: activeVocabLevelStat.learning })}
                    ></div>
                  {/if}
                  {#if activeVocabLevelStat.review > 0}
                    <div
                      class={levelColors[activeLevel]}
                      style="width: {(activeVocabLevelStat.review / activeVocabLevelStat.seen) *
                        100}%"
                      title={m.stats_tooltip_review({ count: activeVocabLevelStat.review })}
                    ></div>
                  {/if}
                  {#if activeVocabLevelStat.relearning > 0}
                    <div
                      class="bg-orange-400"
                      style="width: {(activeVocabLevelStat.relearning / activeVocabLevelStat.seen) *
                        100}%"
                      title={m.stats_tooltip_relearning({
                        count: activeVocabLevelStat.relearning
                      })}
                    ></div>
                  {/if}
                </div>
              {/if}
            </div>
            {#if activeVocabLevelStat.seen === 0}
              <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
                {m.stats_no_cards_this_level()}
              </p>
            {:else}
              <div class="mt-1.5 flex gap-4 text-xs text-gray-500 dark:text-gray-300">
                <span class="flex items-center gap-1">
                  <span class="inline-block h-2 w-2 rounded-full bg-yellow-400"></span>
                  {m.stats_learning()}
                  {activeVocabLevelStat.learning}
                </span>
                <span class="flex items-center gap-1">
                  <span class="inline-block h-2 w-2 rounded-full {levelColors[activeLevel]}"></span>
                  {m.stats_review()}
                  {activeVocabLevelStat.review}
                </span>
                <span class="flex items-center gap-1">
                  <span class="inline-block h-2 w-2 rounded-full bg-orange-400"></span>
                  {m.stats_relearning()}
                  {activeVocabLevelStat.relearning}
                </span>
              </div>
            {/if}
          </div>
        {/snippet}
        <div class="mb-8">
          <LevelStatRows
            rows={vocabRowsForActiveLevel}
            levelColor={levelColors[activeLevel]}
            level={activeLevel}
            reviewType="vocab"
          />
        </div>
      </CollapsibleSection>
    {:else}
      <h2 class="mb-3">📖 {m.stats_vocabulary_heading()}</h2>
      <div
        class="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-indigo-950/60"
      >
        <div class="mb-2 flex items-center justify-between">
          <span class="font-semibold {levelTextColors[activeLevel]}">{activeLevel}</span>
          <span class="text-sm text-gray-500 dark:text-gray-300">
            {activeVocabLevelStat.seen}
            {m.stats_seen()} · {activeVocabLevelStat.due}
            {m.stats_due_today_short()}
          </span>
        </div>
        <div class="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-indigo-900/40">
          {#if activeVocabLevelStat.seen > 0}
            <div class="flex h-full">
              {#if activeVocabLevelStat.learning > 0}
                <div
                  class="bg-yellow-400"
                  style="width: {(activeVocabLevelStat.learning / activeVocabLevelStat.seen) *
                    100}%"
                  title={m.stats_tooltip_learning({ count: activeVocabLevelStat.learning })}
                ></div>
              {/if}
              {#if activeVocabLevelStat.review > 0}
                <div
                  class={levelColors[activeLevel]}
                  style="width: {(activeVocabLevelStat.review / activeVocabLevelStat.seen) * 100}%"
                  title={m.stats_tooltip_review({ count: activeVocabLevelStat.review })}
                ></div>
              {/if}
              {#if activeVocabLevelStat.relearning > 0}
                <div
                  class="bg-orange-400"
                  style="width: {(activeVocabLevelStat.relearning / activeVocabLevelStat.seen) *
                    100}%"
                  title={m.stats_tooltip_relearning({ count: activeVocabLevelStat.relearning })}
                ></div>
              {/if}
            </div>
          {/if}
        </div>
        {#if activeVocabLevelStat.seen === 0}
          <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
            {m.stats_no_cards_this_level()}
          </p>
        {:else}
          <div class="mt-1.5 flex gap-4 text-xs text-gray-500 dark:text-gray-300">
            <span class="flex items-center gap-1">
              <span class="inline-block h-2 w-2 rounded-full bg-yellow-400"></span>
              {m.stats_learning()}
              {activeVocabLevelStat.learning}
            </span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-2 w-2 rounded-full {levelColors[activeLevel]}"></span>
              {m.stats_review()}
              {activeVocabLevelStat.review}
            </span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-2 w-2 rounded-full bg-orange-400"></span>
              {m.stats_relearning()}
              {activeVocabLevelStat.relearning}
            </span>
          </div>
        {/if}
      </div>
      <div
        class="mb-8 rounded-xl border border-orange-200 bg-orange-50 px-6 py-5 dark:border-orange-800 dark:bg-orange-900/20"
      >
        <p class="font-semibold text-orange-700 dark:text-orange-300">
          ⭐ {m.stats_plus_category_heading()}
        </p>
        <p class="mt-1 text-sm text-orange-600 dark:text-orange-400">
          {m.stats_plus_category_body()}
        </p>
        <a
          href="/plus"
          class="mt-3 inline-block rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 focus:ring-4 focus:ring-orange-300 focus:outline-none dark:bg-orange-400 dark:hover:bg-orange-500"
        >
          {m.stats_plus_upgrade()}
        </a>
      </div>
    {/if}

    <!-- ── Uttrykk — active level ─────────────────────────────────────────────── -->
    {#if isPlus}
      <CollapsibleSection
        icon="💬"
        title={m.stats_uttrykk_heading()}
        open={uttrykkOpen}
        onToggle={() => toggleSection('uttrykk')}
        id="stats-uttrykk"
      >
        {#snippet summary()}
          <div
            class="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-indigo-950/60"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="font-semibold {levelTextColors[activeLevel]}">{activeLevel}</span>
              <span class="text-sm text-gray-500 dark:text-gray-300">
                {activeUttrykkLevelStat.seen}
                {m.stats_seen()} · {activeUttrykkLevelStat.due}
                {m.stats_due_today_short()}
              </span>
            </div>
            <div class="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-indigo-900/40">
              {#if activeUttrykkLevelStat.seen > 0}
                <div class="flex h-full">
                  {#if activeUttrykkLevelStat.learning > 0}
                    <div
                      class="bg-yellow-400"
                      style="width: {(activeUttrykkLevelStat.learning /
                        activeUttrykkLevelStat.seen) *
                        100}%"
                      title={m.stats_tooltip_learning({ count: activeUttrykkLevelStat.learning })}
                    ></div>
                  {/if}
                  {#if activeUttrykkLevelStat.review > 0}
                    <div
                      class={levelColors[activeLevel]}
                      style="width: {(activeUttrykkLevelStat.review / activeUttrykkLevelStat.seen) *
                        100}%"
                      title={m.stats_tooltip_review({ count: activeUttrykkLevelStat.review })}
                    ></div>
                  {/if}
                  {#if activeUttrykkLevelStat.relearning > 0}
                    <div
                      class="bg-orange-400"
                      style="width: {(activeUttrykkLevelStat.relearning /
                        activeUttrykkLevelStat.seen) *
                        100}%"
                      title={m.stats_tooltip_relearning({
                        count: activeUttrykkLevelStat.relearning
                      })}
                    ></div>
                  {/if}
                </div>
              {/if}
            </div>
            {#if activeUttrykkLevelStat.seen === 0}
              <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
                {m.stats_no_cards_this_level()}
              </p>
            {:else}
              <div class="mt-1.5 flex gap-4 text-xs text-gray-500 dark:text-gray-300">
                <span class="flex items-center gap-1">
                  <span class="inline-block h-2 w-2 rounded-full bg-yellow-400"></span>
                  {m.stats_learning()}
                  {activeUttrykkLevelStat.learning}
                </span>
                <span class="flex items-center gap-1">
                  <span class="inline-block h-2 w-2 rounded-full {levelColors[activeLevel]}"></span>
                  {m.stats_review()}
                  {activeUttrykkLevelStat.review}
                </span>
                <span class="flex items-center gap-1">
                  <span class="inline-block h-2 w-2 rounded-full bg-orange-400"></span>
                  {m.stats_relearning()}
                  {activeUttrykkLevelStat.relearning}
                </span>
              </div>
            {/if}
          </div>
        {/snippet}
        <div class="mb-8">
          <LevelStatRows
            rows={uttrykkRowsForActiveLevel}
            levelColor={levelColors[activeLevel]}
            level={activeLevel}
            reviewType="uttrykk"
          />
        </div>
      </CollapsibleSection>
    {:else}
      <h2 class="mb-3">💬 {m.stats_uttrykk_heading()}</h2>
      <div
        class="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-indigo-950/60"
      >
        <div class="mb-2 flex items-center justify-between">
          <span class="font-semibold {levelTextColors[activeLevel]}">{activeLevel}</span>
          <span class="text-sm text-gray-500 dark:text-gray-300">
            {activeUttrykkLevelStat.seen}
            {m.stats_seen()} · {activeUttrykkLevelStat.due}
            {m.stats_due_today_short()}
          </span>
        </div>
        <div class="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-indigo-900/40">
          {#if activeUttrykkLevelStat.seen > 0}
            <div class="flex h-full">
              {#if activeUttrykkLevelStat.learning > 0}
                <div
                  class="bg-yellow-400"
                  style="width: {(activeUttrykkLevelStat.learning / activeUttrykkLevelStat.seen) *
                    100}%"
                  title={m.stats_tooltip_learning({ count: activeUttrykkLevelStat.learning })}
                ></div>
              {/if}
              {#if activeUttrykkLevelStat.review > 0}
                <div
                  class={levelColors[activeLevel]}
                  style="width: {(activeUttrykkLevelStat.review / activeUttrykkLevelStat.seen) *
                    100}%"
                  title={m.stats_tooltip_review({ count: activeUttrykkLevelStat.review })}
                ></div>
              {/if}
              {#if activeUttrykkLevelStat.relearning > 0}
                <div
                  class="bg-orange-400"
                  style="width: {(activeUttrykkLevelStat.relearning / activeUttrykkLevelStat.seen) *
                    100}%"
                  title={m.stats_tooltip_relearning({ count: activeUttrykkLevelStat.relearning })}
                ></div>
              {/if}
            </div>
          {/if}
        </div>
        {#if activeUttrykkLevelStat.seen === 0}
          <p class="mt-1 text-xs text-gray-600 dark:text-gray-300">
            {m.stats_no_cards_this_level()}
          </p>
        {:else}
          <div class="mt-1.5 flex gap-4 text-xs text-gray-500 dark:text-gray-300">
            <span class="flex items-center gap-1">
              <span class="inline-block h-2 w-2 rounded-full bg-yellow-400"></span>
              {m.stats_learning()}
              {activeUttrykkLevelStat.learning}
            </span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-2 w-2 rounded-full {levelColors[activeLevel]}"></span>
              {m.stats_review()}
              {activeUttrykkLevelStat.review}
            </span>
            <span class="flex items-center gap-1">
              <span class="inline-block h-2 w-2 rounded-full bg-orange-400"></span>
              {m.stats_relearning()}
              {activeUttrykkLevelStat.relearning}
            </span>
          </div>
        {/if}
      </div>
      <div
        class="mb-8 rounded-xl border border-orange-200 bg-orange-50 px-6 py-5 dark:border-orange-800 dark:bg-orange-900/20"
      >
        <p class="font-semibold text-orange-700 dark:text-orange-300">
          ⭐ {m.stats_plus_theme_heading()}
        </p>
        <p class="mt-1 text-sm text-orange-600 dark:text-orange-400">
          {m.stats_plus_theme_body()}
        </p>
        <a
          href="/plus"
          class="mt-3 inline-block rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 focus:ring-4 focus:ring-orange-300 focus:outline-none dark:bg-orange-400 dark:hover:bg-orange-500"
        >
          {m.stats_plus_upgrade()}
        </a>
      </div>
    {/if}

    <!-- ── Grammar — active level ─────────────────────────────────────────────── -->
    <!-- Only rendered when this level actually has grammar topics (grammar
         content starts at A2 today — see stats.ts's grammarTotalsByLevel /
         stats.test.ts). Not gated by isPlus — grammar topic-level progress
         has always been free (see routes/grammar/[topic] plusOnly gating,
         which is per-question, not per-topic-list). -->
    {#if grammarRowsForActiveLevel.length > 0}
      <CollapsibleSection
        icon="📐"
        title={m.stats_grammar_heading()}
        open={grammarOpen}
        onToggle={() => toggleSection('grammar')}
        id="stats-grammar"
      >
        {#snippet summary()}
          <div
            class="mb-3 grid grid-cols-3 divide-x divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-white/10 dark:border-white/10"
          >
            {#each [{ label: m.stats_grammar_practiced(), value: grammarSeenForActiveLevel, color: 'text-gray-800 dark:text-white' }, { label: m.stats_grammar_due(), value: grammarDueForActiveLevel, color: 'text-red-600 dark:text-red-400' }, { label: m.stats_grammar_mastered(), value: grammarMasteredForActiveLevel, color: 'text-green-600 dark:text-green-400' }] as stat (stat.label)}
              <div class="bg-white p-4 text-center dark:bg-indigo-950/60">
                <p class="text-2xl font-bold {stat.color}">{stat.value}</p>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-300">{stat.label}</p>
              </div>
            {/each}
          </div>
        {/snippet}
        <div class="mb-8">
          <LevelStatRows
            rows={grammarRowsForActiveLevel}
            levelColor={levelColors[activeLevel]}
            level={activeLevel}
            reviewType="grammar"
          />
        </div>
      </CollapsibleSection>
    {/if}

    <!-- ── Reset ──────────────────────────────────────────────────────────────── -->
    <div class="mt-8 border-t border-white/10 pt-8">
      <h2 class="mb-2 text-red-600 dark:text-red-400">
        {m.stats_danger_zone()}
      </h2>
      <p class="mb-4 text-sm text-gray-500 dark:text-gray-300">
        {user ? m.stats_danger_body_signed_in() : m.stats_danger_body_guest()}
      </p>

      {#if confirmReset}
        <div class="flex flex-wrap items-center gap-3">
          <p class="text-sm font-medium text-red-600 dark:text-red-400">
            {m.stats_confirm_question()}
          </p>
          <button
            onclick={handleReset}
            disabled={resetting}
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {resetting ? m.stats_resetting() : m.stats_confirm_yes()}
          </button>
          <button
            onclick={() => (confirmReset = false)}
            disabled={resetting}
            class="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white/10 disabled:opacity-60 dark:text-gray-300"
          >
            {m.stats_cancel()}
          </button>
        </div>
      {:else}
        <button
          onclick={() => (confirmReset = true)}
          class="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          {m.stats_reset_button()}
        </button>
      {/if}
    </div>
  {/if}
</div>
