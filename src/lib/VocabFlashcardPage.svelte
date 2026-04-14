<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { browser } from '$app/environment';
  import { Flashcard, ArrowLeft, ArrowRight } from '$lib';
  import SpeakButton from '$lib/SpeakButton.svelte';
  import { Button } from 'flowbite-svelte';
  import type { VocabEntry } from '$lib/types';

  interface Props {
    entries: VocabEntry[];
    title?: string;
  }

  let { entries, title = 'Vocab' }: Props = $props();

  type Mode = 'noreng' | 'engnor';
  type CardType = 'word' | 'phrase';
  type DeckItem = { entry: VocabEntry; front: string; back: string };

  const LS_MODE = 'vocab-flashcard-mode';
  const LS_CARD_TYPE = 'vocab-flashcard-card-type';
  const LS_SHOW_EXAMPLE = 'vocab-flashcard-show-example';

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

  let mode = $state<Mode>(getInitialMode());
  let cardType = $state<CardType>(getInitialCardType());
  let showExampleDefault = $state(getInitialShowExample());
  let showCardBack = $state(false);
  let showExampleEnglish = $state(getInitialShowExample());
  let deck = $state<DeckItem[]>([]);
  let currentIndex = $state(0);
  let completed = $state(false);
  let speakButtonRef = $state<SpeakButton | undefined>(undefined);
  let speakExampleRef = $state<SpeakButton | undefined>(undefined);

  // touch
  let isTouch = $state(false);
  let touchStartX = 0;

  onMount(() => {
    isTouch = window.matchMedia('(pointer: coarse)').matches;
  });

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function makeDeckItem(entry: VocabEntry, m: Mode, ct: CardType): DeckItem {
    if (ct === 'phrase') {
      const norskExample = entry.example;
      const engExample = entry.example_english ?? entry.example;
      return {
        entry,
        front: m === 'noreng' ? norskExample : engExample,
        back: m === 'noreng' ? engExample : norskExample
      };
    }
    return {
      entry,
      front: m === 'noreng' ? entry.norsk : entry.english,
      back: m === 'noreng' ? entry.english : entry.norsk
    };
  }

  function buildDeck(es: VocabEntry[], m: Mode, ct: CardType) {
    deck = shuffle(es).map((e) => makeDeckItem(e, m, ct));
    currentIndex = 0;
    completed = false;
    showCardBack = false;
    showExampleEnglish = showExampleDefault;
  }

  function resetCardState() {
    showCardBack = false;
    showExampleEnglish = showExampleDefault;
  }

  function restart() {
    buildDeck(entries, mode, cardType);
  }

  function setMode(m: Mode) {
    if (m === mode) return;
    mode = m;
    localStorage.setItem(LS_MODE, m);
  }

  function setCardType(ct: CardType) {
    if (ct === cardType) return;
    cardType = ct;
    localStorage.setItem(LS_CARD_TYPE, ct);
  }

  function prev() {
    if (completed) {
      // Exit completion screen back to the last card
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

  function deriveExample(entry: VocabEntry, m: Mode, ct: CardType): string {
    if (ct === 'phrase') return m === 'noreng' ? entry.norsk : entry.english;
    return m === 'noreng' ? entry.example : (entry.example_english ?? entry.example);
  }

  function deriveExampleTranslation(entry: VocabEntry, m: Mode, ct: CardType): string {
    if (ct === 'phrase') return m === 'noreng' ? entry.english : entry.norsk;
    return m === 'noreng'
      ? (entry.example_english ?? '')
      : entry.example_english
        ? entry.example
        : '';
  }

  let currentExample = $derived(current ? deriveExample(current.entry, mode, cardType) : '');
  let currentExampleTranslation = $derived(
    current ? deriveExampleTranslation(current.entry, mode, cardType) : ''
  );

  // Rebuild deck whenever entries changes (new category/level)
  $effect(() => {
    const e = entries;
    const m = mode;
    const ct = cardType;
    untrack(() => {
      if (e.length === 0) {
        deck = [];
        currentIndex = 0;
        completed = false;
        resetCardState();
        return;
      }
      buildDeck(e, m, ct);
    });
  });

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
    }
  }

  const modeButtonCls =
    'font-medium rounded-lg text-lg px-3 sm:px-5 py-1 sm:py-2.5 me-1 sm:me-2 mb-1 sm:mb-2 focus:outline-none focus:ring-4 text-white bg-green-700 hover:bg-green-800 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800';
  const cardTypeButtonCls =
    'font-medium rounded-lg text-lg px-3 sm:px-5 py-1 sm:py-2.5 me-1 sm:me-2 mb-1 sm:mb-2 focus:outline-none focus:ring-4 text-white bg-blue-700 hover:bg-blue-800 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800';
</script>

<div class="flex w-full flex-col items-center">
  <h1 class="m-4 text-3xl">{title}</h1>

  <!-- Mode + CardType toggles -->
  <div class="flex justify-center">
    <button
      type="button"
      class={modeButtonCls}
      onclick={() => setMode(mode === 'noreng' ? 'engnor' : 'noreng')}
    >
      {mode === 'noreng' ? 'Norsk' : 'English'}
    </button>
    <button
      type="button"
      class={cardTypeButtonCls}
      onclick={() => setCardType(cardType === 'word' ? 'phrase' : 'word')}
    >
      {cardType === 'word' ? 'Word' : 'Phrase'}
    </button>
  </div>

  <!-- Counter -->
  <div
    class="mt-4 mb-2 flex justify-center gap-4 text-lg font-medium text-gray-700 dark:text-gray-300"
  >
    <Button color="gray"
      >{deck.length === 0 ? 0 : completed ? deck.length : currentIndex + 1}/{deck.length}</Button
    >
  </div>

  <!-- Flashcard -->
  <div class="flip-box h-96 w-full bg-transparent md:w-1/2">
    {#if deck.length === 0}
      <div
        class="flex h-full flex-col items-center justify-center gap-4 rounded-xl bg-gray-100 dark:bg-gray-800"
      >
        <p class="text-lg font-medium text-gray-700 dark:text-gray-300">
          No vocabulary items found for this selection.
        </p>
      </div>
    {:else if completed}
      <div class="bg-custom-blue flex h-full flex-col items-center justify-center gap-6 rounded-xl">
        <p class="text-2xl font-semibold text-white">🎉 All {deck.length} cards done!</p>
        <button
          type="button"
          onclick={restart}
          class="rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none"
        >
          Shuffle &amp; Restart
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
          >{cardType === 'word' ? 'phrase' : 'word'}</span
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
            {showExampleEnglish ? 'Hide translation' : 'Show translation'}
          </button>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Hint -->
  <p class="mt-4 rounded bg-gray-900 px-2 py-1 text-white">
    {#if isTouch}
      Tap to flip · ← → to navigate
    {:else}
      Space/Enter/↑↓ to flip · ← → to navigate · R to restart · E to toggle translation · / to
      pronounce word · . to pronounce {cardType === 'word' ? 'example phrase' : 'word'}
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
      Previous
    </button>

    <button
      type="button"
      class="inline-flex w-full items-center justify-center bg-gray-300 p-2 disabled:cursor-not-allowed disabled:opacity-50 sm:p-4 dark:bg-gray-700"
      onclick={restart}
      disabled={entries.length === 0}
    >
      RESTART
    </button>

    <button
      type="button"
      onclick={next}
      class="inline-flex w-full items-center bg-gray-300 p-2 disabled:cursor-not-allowed disabled:opacity-50 sm:p-4 dark:bg-gray-700"
      disabled={completed || deck.length === 0}
    >
      <ArrowRight class="mr-4" />
      Next
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
