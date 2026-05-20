<script lang="ts">
  import { getSessionLimit } from '$lib/session-limit';
  import { onMount, untrack } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { Flashcard, ArrowLeft, ArrowRight } from '$lib';
  import SpeakButton from '$lib/SpeakButton.svelte';
  import { Button, Tooltip } from 'flowbite-svelte';
  import type { VocabEntry } from '$lib/types';
  import {
    saveProgress,
    loadProgressMap,
    countDueToday,
    previewIntervals,
    lsPrefix
  } from '$lib/progress';
  import type { FSRSRating, CardProgress } from '$lib/types';
  import { State } from 'ts-fsrs';
  import * as m from '$lib/paraglide/messages.js';

  interface Props {
    entries: VocabEntry[];
    title?: string;
  }

  let { entries, title = 'Vocab' }: Props = $props();

  type Mode = 'noreng' | 'engnor';
  type CardType = 'word' | 'phrase';
  type DeckMode = 'all' | 'due';
  type DeckItem = { entry: VocabEntry; front: string; back: string };

  // ── 2-D: undo snapshot ──────────────────────────────────────────────────────
  interface UndoSnapshot {
    entry: VocabEntry;
    previousProgress: CardProgress | null; // null = card had never been rated
    previousMap: Record<string, CardProgress>;
    previousIndex: number;
    timer: ReturnType<typeof setInterval>;
    countdown: number;
  }

  const LS_MODE = 'vocab-flashcard-mode';
  const LS_CARD_TYPE = 'vocab-flashcard-card-type';
  const LS_SHOW_EXAMPLE = 'vocab-flashcard-show-example';
  const LS_DECK_MODE = 'vocab-flashcard-deck-mode';
  const NEW_CARD_SESSION_LIMIT = 20;

  function getInitialMode(): Mode {
    if (!browser) return 'noreng';
    const saved = localStorage.getItem(LS_MODE);
    return saved === 'noreng' || saved === 'engnor' ? saved : 'noreng';
  }

  function getInitialCardType(): CardType {
    if (!browser) return 'word';
    const saved = localStorage.getItem(LS_CARD_TYPE);
    return saved === 'word' || saved === 'phrase' ? saved : 'word';
  }

  function getInitialShowExample(): boolean {
    if (!browser) return false;
    return localStorage.getItem(LS_SHOW_EXAMPLE) === 'true';
  }

  function getInitialDeckMode(): DeckMode {
    if (!browser) return 'all';
    const saved = localStorage.getItem(LS_DECK_MODE);
    return saved === 'due' ? 'due' : 'all';
  }

  let mode = $state<Mode>(getInitialMode());
  let cardType = $state<CardType>(getInitialCardType());
  let deckMode = $state<DeckMode>(getInitialDeckMode());
  let showExampleDefault = $state(getInitialShowExample());
  let showCardBack = $state(false);
  let showExampleEnglish = $state(getInitialShowExample());
  let deck = $state<DeckItem[]>([]);
  let currentIndex = $state(0);
  let completed = $state(false);
  let speakButtonRef = $state<SpeakButton | undefined>(undefined);
  let speakExampleRef = $state<SpeakButton | undefined>(undefined);
  let progressMap = $state<Record<string, CardProgress>>({});
  let dueCount = $state(0);

  // 2-B: track new-card count for this session
  let sessionNewCardCount = $state(0);

  // 2-D: undo state
  let undoSnapshot = $state<UndoSnapshot | null>(null);
  let undoCountdown = $state(0);

  // localStorage fallback — read synchronously at init (browser only), kept reactive for storage events
  let localSessionLimit = $state<number | null>(browser ? getSessionLimit(localStorage) : 20);

  // touch
  let isTouch = $state(false);
  let touchStartX = 0;

  // Step 5: Detect uttrykk-preview category for banner
  let isUttrykkPreview = $derived(entries.length > 0 && entries[0].category === 'uttrykk-preview');
  const UTTRYKK_FULL_COUNT = 310;

  // 3-A: plan from layout server data
  let plan = $derived(page.data.plan as 'free' | 'plus');
  let isPlus = $derived(plan === 'plus');
  let isGuest = $derived(page.data.user === null);

  // session limit from layout server data (cross-device); falls back to localStorage for guests
  let profileSessionLimit = $derived<number | null>(
    (page.data.sessionLimit as number | null | undefined) ?? null
  );

  // session limit — DB value (cross-device) takes priority; localStorage is the fallback for
  // unauthenticated users or when no profile value is set.
  // Uses $derived so it stays in sync if the prop changes (e.g. navigation).
  let sessionLimit = $derived<number | null>(
    profileSessionLimit !== null && profileSessionLimit !== undefined
      ? profileSessionLimit
      : localSessionLimit
  );

  onMount(() => {
    isTouch = window.matchMedia('(pointer: coarse)').matches;
    progressMap = loadProgressMap(page.data.user?.id ?? null);
    dueCount = countDueToday(progressMap);

    // Keep localSessionLimit in sync if the user updates it in another tab
    // (only matters for unauthenticated users — logged-in users use the DB value)
    function onStorageChange(e: StorageEvent) {
      if (e.key === 'vocab-flashcard-session-limit' && profileSessionLimit === null) {
        localSessionLimit = getSessionLimit(localStorage);
      }
    }
    window.addEventListener('storage', onStorageChange);

    // 3-A: Plus users are always in due mode
    if (isPlus) {
      deckMode = 'due';
      localStorage.setItem(LS_DECK_MODE, 'due');
    } else if (deckMode === 'due') {
      deckMode = 'all';
      localStorage.setItem(LS_DECK_MODE, 'all');
    }

    return () => window.removeEventListener('storage', onStorageChange);
  });

  // ── Deck building ────────────────────────────────────────────────────────────

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function makeDeckItem(entry: VocabEntry, mo: Mode, ct: CardType): DeckItem {
    if (ct === 'phrase') {
      return {
        entry,
        front: mo === 'noreng' ? entry.example : entry.example_english,
        back: mo === 'noreng' ? entry.example_english : entry.example
      };
    }
    return {
      entry,
      front: mo === 'noreng' ? entry.norsk : entry.english,
      back: mo === 'noreng' ? entry.english : entry.norsk
    };
  }

  /**
   * 2-B: Build due deck.
   *
   * Priority order: overdue → new (capped at NEW_CARD_SESSION_LIMIT) → requeue
   * "Again" cards get pushed to the back with a requeue flag rather than
   * dropped, so the session doesn't end prematurely.
   */
  function buildDueDeck(
    es: VocabEntry[],
    mo: Mode,
    ct: CardType,
    pm: Record<string, CardProgress>,
    limit: number | null
  ): DeckItem[] {
    const now = new Date();
    const overdue: VocabEntry[] = [];
    const newCards: VocabEntry[] = [];

    for (const e of es) {
      const p = pm[e.norsk];
      if (!p) {
        newCards.push(e);
      } else if (new Date(p.fsrs.due) <= now) {
        overdue.push(e);
      }
    }

    const newCap = limit ?? NEW_CARD_SESSION_LIMIT;
    const shuffledOverdue = shuffle(overdue);
    const newCapped = shuffle(newCards).slice(0, newCap);
    const combined = [...shuffledOverdue, ...newCapped];
    // Apply overall session limit after combining overdue + new
    const limited = limit != null ? combined.slice(0, limit) : combined;
    return limited.map((e) => makeDeckItem(e, mo, ct));
  }

  function buildDeck(es: VocabEntry[], mo: Mode, ct: CardType, dm: DeckMode, limit: number | null) {
    const items =
      dm === 'due'
        ? buildDueDeck(es, mo, ct, progressMap, limit)
        : shuffle(es)
            .slice(0, limit ?? es.length)
            .map((e) => makeDeckItem(e, mo, ct));
    deck = items;
    currentIndex = 0;
    completed = false;
    showCardBack = false;
    showExampleEnglish = showExampleDefault;
    sessionNewCardCount = 0;
    clearUndo();
  }

  function resetCardState() {
    showCardBack = false;
    showExampleEnglish = showExampleDefault;
  }

  function restart() {
    buildDeck(entries, mode, cardType, deckMode, sessionLimit);
  }

  function setMode(mo: Mode) {
    if (mo === mode) return;
    mode = mo;
    localStorage.setItem(LS_MODE, mo);
  }

  function setCardType(ct: CardType) {
    if (ct === cardType) return;
    cardType = ct;
    localStorage.setItem(LS_CARD_TYPE, ct);
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  function prev() {
    if (completed) {
      completed = false;
      return;
    }
    if (currentIndex > 0) {
      currentIndex--;
      resetCardState();
    }
  }

  function next() {
    if (completed || deck.length === 0) return;
    if (currentIndex < deck.length - 1) {
      currentIndex++;
      resetCardState();
    } else {
      completed = true;
    }
  }

  const toggleBack = () => (showCardBack = !showCardBack);

  let current = $derived(deck[currentIndex]);

  function deriveExample(entry: VocabEntry, mo: Mode, ct: CardType): string {
    if (ct === 'phrase') return mo === 'noreng' ? entry.norsk : entry.english;
    return mo === 'noreng' ? entry.example : entry.example_english;
  }

  function deriveExampleTranslation(entry: VocabEntry, mo: Mode, ct: CardType): string {
    if (ct === 'phrase') return mo === 'noreng' ? entry.english : entry.norsk;
    return mo === 'noreng' ? entry.example_english : entry.example;
  }

  let currentExample = $derived(current ? deriveExample(current.entry, mode, cardType) : '');
  let currentExampleTranslation = $derived(
    current ? deriveExampleTranslation(current.entry, mode, cardType) : ''
  );
  // Always the Norwegian text for TTS — regardless of card direction.
  let currentExampleNorsk = $derived(
    current ? (cardType === 'phrase' ? current.entry.norsk : current.entry.example) : ''
  );

  // ── 2-C: interval preview ────────────────────────────────────────────────────

  let intervals = $derived.by(() => {
    if (!current || !showCardBack) return null;
    return previewIntervals(progressMap[current.entry.norsk] ?? null, new Date());
  });

  // ── 2-B: requeue "Again" cards in due mode ───────────────────────────────────

  /**
   * When a card is rated "again" in due mode, push a fresh copy to the end
   * of the deck so the user sees it again this session.
   */
  function requeueCard(item: DeckItem) {
    deck = [...deck, { ...item }];
  }

  // ── 2-D: undo helpers ────────────────────────────────────────────────────────

  function clearUndo() {
    if (undoSnapshot) {
      clearInterval(undoSnapshot.timer);
      undoSnapshot = null;
    }
    undoCountdown = 0;
  }

  function startUndoTimer(snapshot: Omit<UndoSnapshot, 'timer' | 'countdown'>) {
    clearUndo();
    let seconds = 5;
    undoCountdown = seconds;
    const timer = setInterval(() => {
      seconds--;
      undoCountdown = seconds;
      if (seconds <= 0) clearUndo();
    }, 1000);
    undoSnapshot = { ...snapshot, timer, countdown: seconds };
  }

  function undo() {
    if (!undoSnapshot) return;
    const { entry, previousProgress, previousMap, previousIndex } = undoSnapshot;
    clearUndo();

    // Restore progressMap (in memory and localStorage)
    const prefix = lsPrefix(page.data.user?.id ?? null);
    if (previousProgress === null) {
      localStorage.removeItem(prefix + entry.norsk);
    } else {
      localStorage.setItem(prefix + entry.norsk, JSON.stringify(previousProgress));
    }
    progressMap = previousMap;
    dueCount = countDueToday(previousMap);

    // Step back to the card that was just rated
    currentIndex = previousIndex;
    resetCardState();
    completed = false;
  }

  // ── Rebuild deck when entries / mode / cardType / deckMode changes ───────────

  $effect(() => {
    const e = entries;
    const mo = mode;
    const ct = cardType;
    const dm = deckMode;
    const lim = sessionLimit;
    untrack(() => {
      if (e.length === 0) {
        deck = [];
        currentIndex = 0;
        completed = false;
        resetCardState();
        clearUndo();
        return;
      }
      buildDeck(e, mo, ct, dm, lim);
    });
  });

  // ── Input handlers ────────────────────────────────────────────────────────────

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.changedTouches[0].screenX;
  }

  function handleTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].screenX - touchStartX;
    if (dx < -30) next();
    else if (dx > 30) prev();
  }

  function handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    if (
      !target ||
      target.closest('button, a, input, textarea, select, summary') ||
      target.isContentEditable
    )
      return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (!completed && current && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      toggleBack();
    } else if (!completed && current && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      toggleBack();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      restart();
    } else if (!completed && current && (e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
      showExampleEnglish = !showExampleEnglish;
      showExampleDefault = showExampleEnglish;
      localStorage.setItem(LS_SHOW_EXAMPLE, String(showExampleEnglish));
    } else if (!completed && current && e.key === '/') {
      e.preventDefault();
      speakButtonRef?.speak();
    } else if (!completed && current && e.key === '.') {
      e.preventDefault();
      speakExampleRef?.speak();
    } else if (!completed && current && e.key === '1') {
      e.preventDefault();
      rate('again');
    } else if (!completed && current && e.key === '2') {
      e.preventDefault();
      rate('hard');
    } else if (!completed && current && e.key === '3') {
      e.preventDefault();
      rate('good');
    } else if (!completed && current && e.key === '4') {
      e.preventDefault();
      rate('easy');
    } else if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault();
      undo();
    }
  }

  // ── Rating ───────────────────────────────────────────────────────────────────

  function rate(rating: FSRSRating) {
    if (!current) return;

    const entry = current.entry;
    const previousProgress = progressMap[entry.norsk] ?? null;
    const previousMap = { ...progressMap };
    const previousIndex = currentIndex;

    // Track new cards for 2-B session cap
    const isNew = previousProgress === null || previousProgress.fsrs.state === State.New;
    if (isNew) sessionNewCardCount++;

    // 3-A: only pass userId for Plus users (free users get localStorage only)
    const userId = isPlus ? (page.data.user?.id ?? null) : null;
    progressMap = saveProgress(entry, rating, progressMap, userId);
    dueCount = countDueToday(progressMap);

    // 2-D: arm undo (before navigation so index is still pointing at the rated card)
    startUndoTimer({ entry, previousProgress, previousMap, previousIndex });

    // 2-B: requeue "again" cards in due mode
    if (rating === 'again' && deckMode === 'due') {
      requeueCard(current);
    }

    next();
  }

  // ── Interval label helpers ──────────────────────────────────────────────────

  /**
   * Expand a compact interval string (e.g. "1m", "6m", "10m", "8d", "3h")
   * into a human-readable tooltip label.
   */
  function expandInterval(raw: string): string {
    if (!raw) return '';
    const match = raw.match(/^(\d+)([smhd])$/);
    if (!match) return raw;
    const n = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === 's') return n === 1 ? '1 second' : `${n} seconds`;
    if (unit === 'm') return n === 1 ? '1 minute' : `${n} minutes`;
    if (unit === 'h') return n === 1 ? '1 hour' : `${n} hours`;
    if (unit === 'd') return n === 1 ? '1 day' : `${n} days`;
    return raw;
  }

  function intervalTooltip(raw: string | undefined, rating: FSRSRating): string {
    if (!raw) return '';
    if (rating === 'again') return 'Review again soon';
    return `Next review: ${expandInterval(raw)}`;
  }

  // ── Button styles ─────────────────────────────────────────────────────────────

  const modeButtonCls =
    'font-medium rounded-lg text-lg px-3 sm:px-5 py-1 sm:py-2.5 me-1 sm:me-2 mb-1 sm:mb-2 focus:outline-none focus:ring-4 text-white bg-green-700 hover:bg-green-800 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800';
  const cardTypeButtonCls =
    'font-medium rounded-lg text-lg px-3 sm:px-5 py-1 sm:py-2.5 me-1 sm:me-2 mb-1 sm:mb-2 focus:outline-none focus:ring-4 text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800';
</script>

<div class="flex w-full flex-col items-center">
  <h1 class="m-4 text-3xl">{title}</h1>

  <!-- Mode + CardType + DeckMode toggles -->
  <div class="flex flex-wrap justify-center gap-1">
    <button
      type="button"
      class={modeButtonCls}
      onclick={() => setMode(mode === 'noreng' ? 'engnor' : 'noreng')}
    >
      {mode === 'noreng' ? m.flashcard_norsk() : m.flashcard_english()}
    </button>
    <button
      type="button"
      class={cardTypeButtonCls}
      onclick={() => setCardType(cardType === 'word' ? 'phrase' : 'word')}
    >
      {cardType === 'word' ? m.flashcard_word() : m.flashcard_phrase()}
    </button>

    <!-- 2-B / 3-A: deck mode toggle removed; Plus users always use due mode -->
  </div>

  <!-- Link to profile preferences -->
  <a
    href="/my-profile"
    class="mt-1 text-xs text-gray-400 hover:text-gray-600 hover:underline dark:text-gray-500 dark:hover:text-gray-300"
  >
    {m.flashcard_change_defaults()}
  </a>

  <!-- 3-A: Plus upsell banner for free users (shown below controls) -->
  {#if !isPlus && dueCount > 0}
    <div
      class="mt-3 w-full max-w-lg rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 dark:border-orange-800 dark:bg-orange-900/20"
    >
      <p class="font-semibold text-orange-700 dark:text-orange-300">
        {m.flashcard_plus_due_heading()}
      </p>
      <p class="mt-1 text-sm text-orange-600 dark:text-orange-400">
        {m.flashcard_plus_due_body()}
      </p>
      <a
        href="/plus"
        class="mt-2 inline-block text-sm font-semibold text-orange-700 hover:underline dark:text-orange-300"
      >
        {m.flashcard_plus_upgrade()}
      </a>
    </div>
  {/if}

  <!-- Counter row -->
  <div
    class="mt-4 mb-2 flex flex-wrap justify-center gap-3 text-lg font-medium text-gray-700 dark:text-gray-300"
  >
    <Button color="gray"
      >{deck.length === 0 ? 0 : completed ? deck.length : currentIndex + 1}/{deck.length}</Button
    >
    {#if dueCount > 0 && deckMode === 'all'}
      <span
        class="inline-flex items-center rounded-full bg-orange-100 px-3 py-0.5 text-sm font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      >
        {m.flashcard_due({ count: String(dueCount) })}
      </span>
    {/if}

    <!-- 2-D: undo button with countdown -->
    {#if undoSnapshot}
      <button
        type="button"
        onclick={undo}
        class="inline-flex items-center rounded-full bg-yellow-100 px-3 py-0.5 text-sm font-medium text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800"
      >
        ↩ {m.flashcard_undo_countdown({ seconds: String(undoCountdown) })}
      </button>
    {/if}
  </div>

  <!-- Step 5: uttrykk preview banner -->
  {#if isUttrykkPreview}
    <div
      class="mb-3 w-full max-w-lg rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-center dark:border-indigo-800 dark:bg-indigo-900/20"
    >
      <p class="text-sm text-indigo-700 dark:text-indigo-300">
        {m.plus_uttrykk_preview_banner({ count: String(entries.length) })}
        <a href="/plus" class="ml-1 font-semibold underline hover:no-underline">
          {m.plus_uttrykk_preview_cta({ total: String(UTTRYKK_FULL_COUNT) })}
        </a>
      </p>
    </div>
  {/if}

  <!-- Flashcard -->
  <div class="flip-box h-96 w-full bg-transparent md:w-1/2">
    {#if deck.length === 0}
      <div
        class="flex h-full flex-col items-center justify-center gap-4 rounded-xl bg-gray-100 dark:bg-gray-800"
      >
        <p class="text-lg font-medium text-gray-700 dark:text-gray-300">
          {m.flashcard_no_items()}
        </p>
      </div>
    {:else if completed}
      <div class="bg-custom-blue flex h-full flex-col items-center justify-center gap-4 rounded-xl">
        <p class="text-2xl font-semibold text-white">
          {m.flashcard_all_done({ count: String(deck.length) })}
        </p>

        <!-- Guest post-session login nudge -->
        {#if isGuest}
          <div class="mx-4 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
            <p class="text-sm font-semibold text-white">
              🎉 Great session! Log in to save your progress.
            </p>
            <p class="mt-0.5 text-xs text-white/70">
              Your ratings are stored on this device only — log in to keep them safe across devices.
            </p>
            <a
              href="/auth/login"
              class="mt-2 inline-block rounded-lg bg-white px-4 py-1.5 text-sm font-semibold text-blue-700 hover:bg-white/90"
            >
              Log in for free →
            </a>
          </div>
        {/if}

        <button
          type="button"
          onclick={restart}
          class="rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none"
        >
          {m.flashcard_shuffle_restart()}
        </button>
      </div>
    {:else}
      <div
        class="flip-box-inner"
        class:flip-it={showCardBack}
        onclick={toggleBack}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            toggleBack();
          }
        }}
        ontouchstart={handleTouchStart}
        ontouchend={handleTouchEnd}
        tabindex="0"
        role="button"
        aria-pressed={showCardBack}
        aria-label={showCardBack
          ? 'Flashcard showing answer, press to show question'
          : 'Flashcard showing question, press to reveal answer'}
      >
        <Flashcard front={current?.front} back={current?.back} {showCardBack} />
      </div>
    {/if}
  </div>

  <!-- 2-B: new-card cap notice -->
  {#if deckMode === 'due' && sessionNewCardCount >= NEW_CARD_SESSION_LIMIT}
    <p class="mt-2 text-xs text-gray-400 dark:text-gray-500">
      {m.flashcard_new_limit()}
    </p>
  {/if}

  <!-- FSRS Rating buttons (visible after flip — free for all users) -->
  {#if !completed && current && showCardBack}
    {@const lastRating = progressMap[current.entry.norsk]?.lastRating}
    {#if lastRating}
      {@const labelMap = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' }}
      {@const colorMap = {
        again: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        hard: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
        good: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        easy: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      }}
      <p class="mt-3 text-xs text-gray-400 dark:text-gray-500">
        Last: <span
          class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {colorMap[lastRating]}"
          >{labelMap[lastRating]}</span
        >
      </p>
    {/if}
    <div class="mt-4 flex flex-wrap justify-center gap-2">
      <!-- Again -->
      <button
        id="btn-again"
        type="button"
        onclick={() => rate('again')}
        class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:ring-4 focus:ring-red-300 focus:outline-none dark:bg-red-500 dark:hover:bg-red-600"
      >
        {m.flashcard_again()} <kbd class="ml-1 rounded bg-red-800 px-1 text-xs opacity-70">1</kbd>
      </button>
      {#if intervals}
        <Tooltip triggeredBy="#btn-again" placement="top">
          {intervalTooltip(intervals.again, 'again')}
        </Tooltip>
      {/if}

      <!-- Hard -->
      <button
        id="btn-hard"
        type="button"
        onclick={() => rate('hard')}
        class="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 focus:ring-4 focus:ring-orange-300 focus:outline-none dark:bg-orange-400 dark:hover:bg-orange-500"
      >
        {m.flashcard_hard()}
        <kbd class="ml-1 rounded bg-orange-700 px-1 text-xs opacity-70">2</kbd>
      </button>
      {#if intervals}
        <Tooltip triggeredBy="#btn-hard" placement="top">
          {intervalTooltip(intervals.hard, 'hard')}
        </Tooltip>
      {/if}

      <!-- Good -->
      <button
        id="btn-good"
        type="button"
        onclick={() => rate('good')}
        class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:ring-4 focus:ring-green-300 focus:outline-none dark:bg-green-500 dark:hover:bg-green-600"
      >
        {m.flashcard_good()}
        <kbd class="ml-1 rounded bg-green-800 px-1 text-xs opacity-70">3</kbd>
      </button>
      {#if intervals}
        <Tooltip triggeredBy="#btn-good" placement="top">
          {intervalTooltip(intervals.good, 'good')}
        </Tooltip>
      {/if}

      <!-- Easy -->
      <button
        id="btn-easy"
        type="button"
        onclick={() => rate('easy')}
        class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {m.flashcard_easy()} <kbd class="ml-1 rounded bg-blue-800 px-1 text-xs opacity-70">4</kbd>
      </button>
      {#if intervals}
        <Tooltip triggeredBy="#btn-easy" placement="top">
          {intervalTooltip(intervals.easy, 'easy')}
        </Tooltip>
      {/if}
    </div>
  {/if}

  <!-- Part of speech badge & Pronounce -->
  {#if !completed && current}
    <div class="mt-3 flex items-center gap-3">
      {#if cardType !== 'phrase'}
        <span
          class="rounded-full bg-gray-200 px-3 py-0.5 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >
          {current.entry.part === 'noun'
            ? m.part_noun()
            : current.entry.part === 'verb'
              ? m.part_verb()
              : current.entry.part === 'adjective'
                ? m.part_adjective()
                : current.entry.part === 'adverb'
                  ? m.part_adverb()
                  : current.entry.part === 'pronoun'
                    ? m.part_pronoun()
                    : current.entry.part === 'preposition'
                      ? m.part_preposition()
                      : current.entry.part === 'conjunction'
                        ? m.part_conjunction()
                        : current.entry.part === 'interjection'
                          ? m.part_interjection()
                          : m.part_phrase()}
        </span>
      {/if}
      <SpeakButton
        bind:this={speakButtonRef}
        word={cardType === 'word' ? current.entry.norsk : current.entry.example}
      />
    </div>
  {/if}

  <!-- Example / Word section -->
  {#if !completed && current}
    <div class="mt-3 w-full max-w-lg rounded-lg bg-gray-50 px-5 py-4 dark:bg-gray-800">
      <div class="mb-2 flex items-center gap-2">
        <span
          class="rounded-full bg-gray-200 px-3 py-0.5 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >{cardType === 'word' ? m.flashcard_phrase() : m.flashcard_word()}</span
        >
        <SpeakButton bind:this={speakExampleRef} word={currentExampleNorsk} />
      </div>
      <p class="text-base text-gray-700 italic dark:text-gray-300">
        {currentExample}
      </p>
      {#if currentExampleTranslation}
        <div class="mt-2">
          {#if showExampleEnglish}
            <p class="mb-1 text-sm text-gray-500 dark:text-gray-400">
              {currentExampleTranslation}
            </p>
          {/if}
          <button
            type="button"
            class="text-sm text-blue-600 hover:underline dark:text-blue-400"
            onclick={() => {
              showExampleEnglish = !showExampleEnglish;
              showExampleDefault = showExampleEnglish;
              localStorage.setItem(LS_SHOW_EXAMPLE, String(showExampleEnglish));
            }}
          >
            {showExampleEnglish ? m.flashcard_hide_translation() : m.flashcard_show_translation()}
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Hint -->
  <p class="mt-4 rounded bg-gray-900 px-2 py-1 text-white">
    {#if isTouch}
      {m.flashcard_hint_touch()}
    {:else}
      {m.flashcard_hint_desktop_prefix()}
      {cardType === 'word' ? m.flashcard_hint_example_phrase() : m.flashcard_hint_word()}
    {/if}
  </p>

  <!-- Nav buttons -->
  <div class="grid w-full grid-cols-3 gap-2 pt-4">
    <button
      type="button"
      onclick={prev}
      class="inline-flex w-full items-center bg-gray-300 p-2 disabled:cursor-not-allowed disabled:opacity-50 sm:p-4 dark:bg-gray-700"
      disabled={currentIndex <= 0 && !completed}
    >
      <ArrowLeft class="mr-4" />
      {m.flashcard_previous()}
    </button>

    <button
      type="button"
      class="inline-flex w-full items-center justify-center bg-gray-300 p-2 disabled:cursor-not-allowed disabled:opacity-50 sm:p-4 dark:bg-gray-700"
      onclick={restart}
      disabled={entries.length === 0}
    >
      {m.flashcard_restart()}
    </button>

    <button
      type="button"
      onclick={next}
      class="inline-flex w-full items-center bg-gray-300 p-2 disabled:cursor-not-allowed disabled:opacity-50 sm:p-4 dark:bg-gray-700"
      disabled={completed || deck.length === 0}
    >
      <ArrowRight class="mr-4" />
      {m.flashcard_next()}
    </button>
  </div>

  <!-- Guest persistent footer nudge (shown below nav, only for non-logged-in users) -->
  {#if isGuest}
    <div class="mt-6 w-full max-w-lg border-t border-gray-200 pt-4 text-center dark:border-gray-700">
      <p class="text-xs text-gray-400 dark:text-gray-500">
        📌 Your progress is saved on this device only.
        <a
          href="/auth/login"
          class="font-medium text-indigo-500 hover:underline dark:text-indigo-400"
        >
          Log in for free
        </a>
        to keep it safe across devices.
      </p>
    </div>
  {/if}
</div>

<svelte:window onkeydown={handleKeyDown} />

<style>
  .flip-box {
    background-color: transparent;
    perspective: 1000px;
  }
  .flip-box-inner {
    position: relative;
    width: 100%;
    height: 100%;
    text-align: center;
    transition: transform 0.8s;
    transform-style: preserve-3d;
    cursor: pointer;
    user-select: none;
    touch-action: pan-y;
  }
  .flip-it {
    transform: rotateY(180deg);
  }
</style>
