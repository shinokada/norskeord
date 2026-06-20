<script lang="ts">
  import { onMount } from 'svelte';
  import type { VocabEntry, PartOfSpeech } from '$lib/types';
  import type { ReviewState } from '$lib/admin/reviewState';

  type DraftEntry = VocabEntry & { _status?: 'added' | 'edited' | 'deleted'; _key: string };

  type UttrykkLevel = 'A1' | 'A2' | 'B1' | 'B2';
  type DeckType = 'full' | 'preview';

  const LEVELS: UttrykkLevel[] = ['A1', 'A2', 'B1', 'B2'];
  const PARTS: PartOfSpeech[] = ['phrase', 'noun', 'verb', 'adjective', 'adverb', 'interjection'];

  // ── State ────────────────────────────────────────────────────────────────────

  let selectedLevel = $state<UttrykkLevel>('A1');
  let deckType = $state<DeckType>('full');
  let published = $state<VocabEntry[]>([]);
  let draft = $state<DraftEntry[]>([]);
  let reviewed = $state<ReviewState['uttrykk']>({});
  let loading = $state(false);
  let publishing = $state(false);
  let savingReview = $state(false);
  let cooldown = $state(0);
  let loadError = $state<string | null>(null);
  let publishMessage = $state<string | null>(null);

  let filterPart = $state('');
  let searchQuery = $state('');
  let showUnreviewedOnly = $state(false);

  let modal = $state<{
    mode: 'add' | 'edit';
    entry: Partial<DraftEntry>;
    modalReviewed: boolean;
  } | null>(null);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const isDirty = $derived(draft.some((e) => e._status));
  const changeCount = $derived(draft.filter((e) => e._status).length);

  const apiLevel = $derived(deckType === 'preview' ? `${selectedLevel}-PREVIEW` : selectedLevel);

  const reviewedCount = $derived(
    draft.filter((e) => e._status !== 'deleted' && reviewed[reviewKey(e)]).length
  );
  const totalReviewable = $derived(draft.filter((e) => e._status !== 'deleted').length);

  const filtered = $derived(
    draft.filter((e) => {
      if (e._status === 'deleted') return false;
      if (filterPart && e.part !== filterPart) return false;
      if (showUnreviewedOnly && reviewed[reviewKey(e)]) return false;
      if (searchQuery) {
        const hay = `${e.norsk} ${e.english} ${e.example ?? ''}`.toLowerCase();
        if (!hay.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    })
  );

  const deletedRows = $derived(
    showUnreviewedOnly ? [] : draft.filter((e) => e._status === 'deleted')
  );

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function reviewKey(e: Pick<VocabEntry, 'level' | 'norsk'>): string {
    // Include deck type so full and preview entries don't share review state
    return `${e.level}:${deckType}:${e.norsk}`;
  }

  function makeKey(e: VocabEntry, index: number): string {
    return `${e.level}-${e.category}-${index}-${e.norsk.slice(0, 20)}`;
  }

  function blankEntry(): Partial<DraftEntry> {
    return {
      norsk: '',
      lemma: '',
      english: '',
      example: '',
      example_english: '',
      level: selectedLevel,
      category: deckType === 'preview' ? 'uttrykk-preview' : 'uttrykk',
      part: 'phrase'
    };
  }

  // ── Load / Switch ─────────────────────────────────────────────────────────────

  onMount(async () => {
    await load();
  });

  async function load() {
    loading = true;
    loadError = null;
    publishMessage = null;
    filterPart = '';
    searchQuery = '';
    try {
      const [uttrykkRes, reviewRes] = await Promise.all([
        fetch(`/admin/uttrykk/api?level=${apiLevel}`),
        fetch('/admin/review-state/api')
      ]);
      if (!uttrykkRes.ok) throw new Error(`Failed to load: ${uttrykkRes.status}`);
      const data: VocabEntry[] = await uttrykkRes.json();
      published = data;
      draft = data.map((e, i) => ({ ...e, _key: makeKey(e, i) }));

      if (reviewRes.ok) {
        const reviewData: ReviewState = await reviewRes.json();
        reviewed = reviewData.uttrykk ?? {};
      }
    } catch (e) {
      loadError = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  async function switchTo(level: UttrykkLevel, deck: DeckType) {
    if (isDirty && !confirm('You have unpublished changes. Switch deck and lose them?')) return;
    selectedLevel = level;
    deckType = deck;
    await load();
  }

  // ── Review state ─────────────────────────────────────────────────────────────

  async function saveReviewState() {
    savingReview = true;
    try {
      const res = await fetch('/admin/review-state/api');
      const current: ReviewState = res.ok
        ? await res.json()
        : { grammar: {}, blog: {}, vocab: {}, uttrykk: {} };
      await fetch('/admin/review-state/api', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...current, uttrykk: reviewed })
      });
    } catch {
      // Silent fail — review state is best-effort
    } finally {
      savingReview = false;
    }
  }

  // ── Draft mutations ───────────────────────────────────────────────────────────

  function openAdd() {
    modal = { mode: 'add', entry: blankEntry(), modalReviewed: false };
  }

  function openEdit(e: DraftEntry) {
    modal = { mode: 'edit', entry: { ...e }, modalReviewed: !!reviewed[reviewKey(e)] };
  }

  function closeModal() {
    modal = null;
  }

  function saveModal() {
    if (!modal) return;
    const e = modal.entry as DraftEntry;
    if (!e.norsk?.trim() || !e.english?.trim()) {
      alert('norsk and english are required.');
      return;
    }

    const rKey = reviewKey({ level: e.level ?? selectedLevel, norsk: e.norsk });

    if (modal.mode === 'add') {
      const key = `new-${Date.now()}-${Math.random()}`;
      draft = [...draft, { ...e, _key: key, _status: 'added' }];
    } else {
      draft = draft.map((d) => {
        if (d._key !== e._key) return d;
        return { ...e, _status: d._status === 'added' ? 'added' : 'edited' };
      });
    }

    const next = { ...reviewed };
    if (modal.modalReviewed) {
      next[rKey] = { checkedAt: new Date().toISOString().slice(0, 10) };
    } else {
      delete next[rKey];
    }
    reviewed = next;
    saveReviewState();

    modal = null;
  }

  function removeEntry(e: DraftEntry) {
    if (e._status === 'added') {
      draft = draft.filter((d) => d._key !== e._key);
      return;
    }
    if (!confirm(`Delete "${e.norsk}"? This will take effect on Publish.`)) return;
    draft = draft.map((d) => (d._key === e._key ? { ...d, _status: 'deleted' } : d));
  }

  function undelete(e: DraftEntry) {
    draft = draft.map((d) => (d._key === e._key ? { ...d, _status: undefined } : d));
  }

  function discard() {
    if (!confirm('Discard all unpublished changes?')) return;
    draft = published.map((e, i) => ({ ...e, _key: makeKey(e, i) }));
    publishMessage = null;
  }

  // ── Publish ───────────────────────────────────────────────────────────────────

  function beforeUnload(ev: BeforeUnloadEvent) {
    if (isDirty) {
      ev.preventDefault();
      ev.returnValue = '';
    }
  }

  async function publish() {
    if (!isDirty || publishing || cooldown > 0) return;
    publishing = true;
    publishMessage = null;
    try {
      const res = await fetch(`/admin/uttrykk/api?level=${apiLevel}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Publish failed: ${res.status}`);
      }
      publishMessage = 'Published! Changes will be live in ~60 seconds.';
      const clean = draft
        .filter((e) => e._status !== 'deleted')
        .map((e) => {
          const { _status, _key, ...rest } = e;
          return rest as VocabEntry;
        });
      published = clean;
      draft = clean.map((e, i) => ({ ...e, _key: makeKey(e, i) }));
      startCooldown();
    } catch (e) {
      publishMessage = e instanceof Error ? e.message : String(e);
    } finally {
      publishing = false;
    }
  }

  function startCooldown() {
    cooldown = 90;
    const iv = setInterval(() => {
      cooldown -= 1;
      if (cooldown <= 0) clearInterval(iv);
    }, 1000);
  }
</script>

<svelte:window onbeforeunload={beforeUnload} />

<svelte:head>
  <title>Uttrykk Admin — Norskeord</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-10 text-left">
  <a href="/admin" class="text-sm text-blue-600 hover:underline dark:text-blue-400">&larr; Admin</a>
  <h1 class="mt-2 text-2xl font-bold dark:text-white">Uttrykk</h1>

  <!-- Level + deck tabs -->
  <div class="mt-4 flex flex-wrap gap-2">
    {#each LEVELS as lvl (lvl)}
      <div class="flex overflow-hidden rounded border border-gray-300 dark:border-gray-600">
        <button
          class={[
            'px-3 py-1.5 text-sm font-semibold',
            selectedLevel === lvl && deckType === 'full'
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800'
          ].join(' ')}
          onclick={() => switchTo(lvl, 'full')}
        >
          {lvl}
        </button>
        <button
          class={[
            'border-l border-gray-300 px-3 py-1.5 text-xs font-medium dark:border-gray-600',
            selectedLevel === lvl && deckType === 'preview'
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800'
          ].join(' ')}
          onclick={() => switchTo(lvl, 'preview')}
        >
          preview
        </button>
      </div>
    {/each}
  </div>

  <p class="mt-1 text-xs text-gray-400">
    Editing: <span class="font-mono"
      >uttrykk-{selectedLevel.toLowerCase()}{deckType === 'preview' ? '-preview' : ''}.json</span
    >
  </p>

  {#if loading}
    <p class="mt-6 text-gray-600 dark:text-gray-300">Loading…</p>
  {:else if loadError}
    <p class="mt-6 text-red-600">Error: {loadError}</p>
  {:else}
    <!-- Toolbar -->
    <div class="mt-4 flex flex-wrap items-center gap-3">
      <!-- Review progress -->
      <span class="text-sm text-gray-600 dark:text-gray-300">
        Reviewed
        <span
          class={[
            'font-semibold',
            reviewedCount === totalReviewable && totalReviewable > 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-700 dark:text-gray-200'
          ].join(' ')}
        >
          {reviewedCount} / {totalReviewable}
        </span>
        {#if savingReview}
          <span class="ml-1 text-xs text-gray-400">saving…</span>
        {/if}
      </span>

      <div class="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>

      {#if isDirty}
        <span class="text-sm font-medium text-amber-600 dark:text-amber-400">
          ● {changeCount} unpublished change{changeCount === 1 ? '' : 's'}
        </span>
      {:else}
        <span class="text-sm text-gray-400">No unpublished changes</span>
      {/if}

      <button
        class="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-800"
        onclick={discard}
        disabled={!isDirty || publishing}
      >
        Discard
      </button>

      <button
        class="rounded bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        onclick={publish}
        disabled={!isDirty || publishing || cooldown > 0}
      >
        {#if publishing}
          Publishing…
        {:else if cooldown > 0}
          Publish ({cooldown}s)
        {:else}
          Publish ▶
        {/if}
      </button>

      <div class="ml-auto">
        <button
          class="rounded bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
          onclick={openAdd}
        >
          + Add
        </button>
      </div>
    </div>

    {#if publishMessage}
      <p
        class="mt-2 text-sm"
        class:text-green-600={publishMessage.startsWith('Published')}
        class:text-red-600={!publishMessage.startsWith('Published')}
      >
        {publishMessage}
      </p>
    {/if}

    <!-- Filters -->
    <div class="mt-3 flex flex-wrap gap-2">
      <select
        bind:value={filterPart}
        class="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="">All parts</option>
        {#each PARTS as p (p)}
          <option value={p}>{p}</option>
        {/each}
      </select>

      <input
        type="text"
        placeholder="Search norsk / english…"
        bind:value={searchQuery}
        class="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />

      <label class="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
        <input type="checkbox" bind:checked={showUnreviewedOnly} class="rounded" />
        Unreviewed only
      </label>

      <span class="ml-auto self-center text-sm text-gray-600 dark:text-gray-300">
        {filtered.length} shown
      </span>
    </div>

    <!-- Table -->
    <div class="mt-3 overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr
            class="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400"
          >
            <th class="py-2 pr-3 text-center" title="Reviewed">✓</th>
            <th class="py-2 pr-3">Norsk</th>
            <th class="py-2 pr-3">English</th>
            <th class="py-2 pr-3">Example</th>
            <th class="py-2 pr-3">Part</th>
            <th class="py-2 pr-3">Status</th>
            <th class="py-2 pr-3"></th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as e (e._key)}
            {@const rk = reviewKey(e)}
            {@const isReviewed = !!reviewed[rk]}
            <tr
              class={[
                'border-b border-gray-100 dark:border-gray-800',
                isReviewed ? 'bg-green-50 dark:bg-green-950/20' : ''
              ].join(' ')}
            >
              <td class="py-2 pr-3 text-center">
                <span
                  title={isReviewed ? `Reviewed ${reviewed[rk].checkedAt}` : 'Not reviewed'}
                  class={[
                    'text-lg leading-none',
                    isReviewed ? 'text-green-500' : 'opacity-10'
                  ].join(' ')}>✓</span
                >
              </td>
              <td class="max-w-xs truncate py-2 pr-3 font-medium dark:text-white" title={e.norsk}>
                {e.norsk}
              </td>
              <td
                class="max-w-xs truncate py-2 pr-3 text-gray-600 dark:text-gray-300"
                title={e.english}
              >
                {e.english}
              </td>
              <td
                class="max-w-xs truncate py-2 pr-3 text-gray-600 dark:text-gray-300"
                title={e.example}
              >
                {e.example ?? ''}
              </td>
              <td class="py-2 pr-3 text-gray-600 dark:text-gray-300">{e.part}</td>
              <td class="py-2 pr-3">
                {#if e._status === 'added'}
                  <span
                    class="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300"
                    >+ new</span
                  >
                {:else if e._status === 'edited'}
                  <span
                    class="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                    >edited</span
                  >
                {/if}
              </td>
              <td class="py-2 pr-3 text-right whitespace-nowrap">
                <button class="mr-2 text-blue-600 hover:underline" onclick={() => openEdit(e)}
                  >✏</button
                >
                <button class="text-red-600 hover:underline" onclick={() => removeEntry(e)}
                  >🗑</button
                >
              </td>
            </tr>
          {/each}

          {#each deletedRows as e (e._key)}
            <tr class="border-b border-gray-100 opacity-50 dark:border-gray-800">
              <td class="py-2 pr-3"></td>
              <td class="py-2 pr-3 line-through dark:text-white">{e.norsk}</td>
              <td class="py-2 pr-3 line-through text-gray-600 dark:text-gray-300">{e.english}</td>
              <td class="py-2 pr-3 line-through text-gray-400">{e.example ?? ''}</td>
              <td class="py-2 pr-3 line-through text-gray-500">{e.part}</td>
              <td class="py-2 pr-3">
                <span
                  class="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900 dark:text-red-300"
                  >deleted</span
                >
              </td>
              <td class="py-2 pr-3 text-right">
                <button class="text-blue-600 hover:underline" onclick={() => undelete(e)}
                  >Undo</button
                >
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Entry modal -->
{#if modal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div
      class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-900"
    >
      <h2 class="text-lg font-bold dark:text-white">
        {modal.mode === 'add' ? 'Add uttrykk entry' : `Edit "${modal.entry.norsk}"`}
      </h2>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <label class="col-span-2 text-sm">
          <span class="block font-medium dark:text-gray-200"
            >Norsk <span class="text-red-500">*</span></span
          >
          <textarea
            bind:value={modal.entry.norsk}
            rows="2"
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          ></textarea>
        </label>

        <label class="col-span-2 text-sm">
          <span class="block font-medium dark:text-gray-200">Lemma</span>
          <textarea
            bind:value={modal.entry.lemma}
            rows="2"
            placeholder="Usually the same as norsk for phrases"
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          ></textarea>
        </label>

        <label class="col-span-2 text-sm">
          <span class="block font-medium dark:text-gray-200"
            >English <span class="text-red-500">*</span></span
          >
          <textarea
            bind:value={modal.entry.english}
            rows="2"
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          ></textarea>
        </label>

        <label class="col-span-2 text-sm">
          <span class="block font-medium dark:text-gray-200">Example (Norwegian)</span>
          <textarea
            bind:value={modal.entry.example}
            rows="2"
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          ></textarea>
        </label>

        <label class="col-span-2 text-sm">
          <span class="block font-medium dark:text-gray-200">Example (English)</span>
          <textarea
            bind:value={modal.entry.example_english}
            rows="2"
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          ></textarea>
        </label>

        <label class="text-sm">
          <span class="block font-medium dark:text-gray-200">Part of speech</span>
          <select
            bind:value={modal.entry.part}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {#each PARTS as p (p)}
              <option value={p}>{p}</option>
            {/each}
          </select>
        </label>

        <label class="text-sm">
          <span class="block font-medium dark:text-gray-200">Category</span>
          <input
            type="text"
            bind:value={modal.entry.category}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <span class="text-xs text-gray-400">uttrykk or uttrykk-preview</span>
        </label>
      </div>

      <div class="mt-6 flex items-center justify-between">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" bind:checked={modal.modalReviewed} class="rounded" />
          <span class="font-medium text-gray-700 dark:text-gray-200">Mark as reviewed</span>
        </label>
        <div class="flex gap-2">
          <button
            class="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            onclick={closeModal}
          >
            Cancel
          </button>
          <button
            class="rounded bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            onclick={saveModal}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
