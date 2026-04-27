<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { Flashcard, ArrowLeft, ArrowRight } from '$lib';
  import SpeakButton from '$lib/SpeakButton.svelte';
  import { Button } from 'flowbite-svelte';
  import type { VocabEntry } from '$lib/types';
  import { saveProgress, loadProgressMap, countDueToday, previewIntervals } from '$lib/progress';
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
  const NEW_CARD_SESSION_LIMIT = 15;

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

  // touch
  let isTouch = $state(false);
  let touchStartX = 0;

  // 3-A: plan from layout server data
  let plan = $derived(page.data.plan as 'free' | 'plus');
  let isPlus = $derived(plan === 'plus');

  onMount(() => {
    isTouch = window.matchMedia('(pointer: coarse)').matches;
    progressMap = loadProgressMap();
    dueCount = countDueToday(progressMap);

    // 3-A: if free user has due mode stored, reset it to 'all'
    if (!isPlus && deckMode === 'due') {
      deckMode = 'all';
      localStorage.setItem(LS_DECK_MODE, 'all');
    }
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
    pm: Record<string, CardProgress>
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

    const newCapped = shuffle(newCards).slice(0, NEW_CARD_SESSION_LIMIT);
    return [...shuffle(overdue), ...newCapped].map((e) => makeDeckItem(e, mo, ct));
  }

  function buildDeck(es: VocabEntry[], mo: Mode, ct: CardType, dm: DeckMode) {
    const items =
      dm === 'due'
        ? buildDueDeck(es, mo, ct, progressMap)
        : shuffle(es).map((e) => makeDeckItem(e, mo, ct));
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
    buildDeck(entries, mode, cardType, deckMode);
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

  function setDeckMode(dm: DeckMode) {
    // 3-A: free users cannot switch to due mode
    if (!isPlus && dm === 'due') return;
    if (dm === deckMode) return;
    deckMode = dm;
    localStorage.setItem(LS_DECK_MODE, dm);
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
    if (previousProgress === null) {
      localStorage.removeItem(`progress-${entry.norsk}`);
    } else {
      localStorage.setItem(`progress-${entry.norsk}`, JSON.stringify(previousProgress));
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
    untrack(() => {
      if (e.length === 0) {
        deck = [];
        currentIndex = 0;
        completed = false;
        resetCardState();
        clearUndo();
        return;
      }
      buildDeck(e, mo, ct, dm);
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

    <!-- 2-B / 3-A: deck mode toggle — Plus only -->
    {#if isPlus}
      <button
        type="button"
        onclick={() => setDeckMode(deckMode === 'all' ? 'due' : 'all')}
        class="mb-1 rounded-lg px-3 py-1 text-sm font-semibold transition-colors sm:mb-2 sm:px-4 sm:py-2 {deckMode ===
        'due'
          ? 'bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-400 dark:hover:bg-orange-500'
          : 'border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}"
      >
        {deckMode === 'due'
          ? m.flashcard_review_due({ count: String(dueCount) })
          : m.flashcard_all_cards()}
      </button>
    {:else}
      <!-- 3-A: upsell button for free users -->
      <a
        href="/plus"
        class="mb-1 inline-flex items-center gap-1.5 rounded-lg border border-orange-300 px-3 py-1 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50 sm:mb-2 sm:px-4 sm:py-2 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
        title={m.flashcard_plus_due_heading()}
      >
        <span>⭐</span>
        {m.flashcard_all_cards()}
      </a>
    {/if}
  </div>

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
      <div class="bg-custom-blue flex h-full flex-col items-center justify-center gap-6 rounded-xl">
        <p class="text-2xl font-semibold text-white">
          {m.flashcard_all_done({ count: String(deck.length) })}
        </p>
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
    <div class="mt-4 flex flex-wrap justify-center gap-2">
      <div class="flex flex-col items-center gap-0.5">
        <button
          type="button"
          onclick={() => rate('again')}
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:ring-4 focus:ring-red-300 focus:outline-none dark:bg-red-500 dark:hover:bg-red-600"
        >
          {m.flashcard_again()} <kbd class="ml-1 rounded bg-red-800 px-1 text-xs opacity-70">1</kbd>
        </button>
        <!-- 2-C: interval preview -->
        {#if intervals}
          <span class="text-xs text-gray-400 dark:text-gray-500">{intervals.again}</span>
        {/if}
      </div>

      <div class="flex flex-col items-center gap-0.5">
        <button
          type="button"
          onclick={() => rate('hard')}
          class="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 focus:ring-4 focus:ring-orange-300 focus:outline-none dark:bg-orange-400 dark:hover:bg-orange-500"
        >
          {m.flashcard_hard()}
          <kbd class="ml-1 rounded bg-orange-700 px-1 text-xs opacity-70">2</kbd>
        </button>
        {#if intervals}
          <span class="text-xs text-gray-400 dark:text-gray-500">{intervals.hard}</span>
        {/if}
      </div>

      <div class="flex flex-col items-center gap-0.5">
        <button
          type="button"
          onclick={() => rate('good')}
          class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:ring-4 focus:ring-green-300 focus:outline-none dark:bg-green-500 dark:hover:bg-green-600"
        >
          {m.flashcard_good()}
          <kbd class="ml-1 rounded bg-green-800 px-1 text-xs opacity-70">3</kbd>
        </button>
        {#if intervals}
          <span class="text-xs text-gray-400 dark:text-gray-500">{intervals.good}</span>
        {/if}
      </div>

      <div class="flex flex-col items-center gap-0.5">
        <button
          type="button"
          onclick={() => rate('easy')}
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {m.flashcard_easy()} <kbd class="ml-1 rounded bg-blue-800 px-1 text-xs opacity-70">4</kbd>
        </button>
        {#if intervals}
          <span class="text-xs text-gray-400 dark:text-gray-500">{intervals.easy}</span>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Part of speech badge & Pronounce -->
  {#if !completed && current}
    <div class="mt-3 flex items-center gap-3">
      <span
        class="rounded-full bg-gray-200 px-3 py-0.5 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300"
      >
        {current.entry.part}
      </span>
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
        <SpeakButton bind:this={speakExampleRef} word={currentExample} />
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
