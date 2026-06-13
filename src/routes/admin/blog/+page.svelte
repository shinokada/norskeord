<script lang="ts">
  import { onMount } from 'svelte';
  import type { PostMeta, DeckLink } from '$lib/blog';
  import {
    validatePost,
    blankPost,
    isValidSlug,
    CANONICAL_TAGS,
    type CanonicalTag
  } from '$lib/admin/blogUtils';
  import type { ReviewState } from '$lib/admin/reviewState';

  interface AdminPost {
    filename: string;
    meta: PostMeta;
    body: string;
  }

  type DraftPost = AdminPost & {
    _status?: 'added' | 'edited' | 'deleted';
    _originalFilename?: string;
  };

  let published = $state<AdminPost[]>([]);
  let draft = $state<DraftPost[]>([]);
  let reviewed = $state<ReviewState['blog']>({});
  let loading = $state(true);
  let publishing = $state(false);
  let savingReview = $state(false);
  let cooldown = $state(0);
  let loadError = $state<string | null>(null);
  let publishMessage = $state<string | null>(null);

  let filterCefr = $state('');
  let filterTag = $state('');
  let filterType = $state('');
  let searchQuery = $state('');
  let showUnreviewedOnly = $state(false);

  let modal = $state<{
    mode: 'add' | 'edit';
    post: Partial<AdminPost> & { _originalFilename?: string };
  } | null>(null);

  const isDirty = $derived(draft.some((p) => p._status));
  const changeCount = $derived(draft.filter((p) => p._status).length);

  const reviewedCount = $derived(
    draft.filter((p) => p._status !== 'deleted' && reviewed[p.filename]).length
  );
  const totalReviewable = $derived(draft.filter((p) => p._status !== 'deleted').length);

  const CEFR_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C'];
  const TYPES = ['word', 'guide'];

  const filtered = $derived(
    draft.filter((p) => {
      if (p._status === 'deleted') return false;
      const levels = Array.isArray(p.meta.cefr) ? p.meta.cefr : [p.meta.cefr];
      if (filterCefr && !levels.includes(filterCefr)) return false;
      if (filterTag && !(p.meta.tags ?? []).includes(filterTag)) return false;
      if (filterType && (p.meta.type ?? 'word') !== filterType) return false;
      if (showUnreviewedOnly && reviewed[p.filename]) return false;
      if (searchQuery) {
        const haystack = `${p.meta.title} ${p.meta.slug} ${p.meta.description}`.toLowerCase();
        if (!haystack.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    })
  );

  const deletedRows = $derived(
    showUnreviewedOnly ? [] : draft.filter((p) => p._status === 'deleted')
  );

  const usedTags = $derived(Array.from(new Set(draft.flatMap((p) => p.meta.tags ?? []))).sort());

  onMount(load);

  async function load() {
    loading = true;
    loadError = null;
    try {
      const [postsRes, reviewRes] = await Promise.all([
        fetch('/admin/blog/api'),
        fetch('/admin/review-state/api')
      ]);
      if (!postsRes.ok) throw new Error(`Failed to load posts: ${postsRes.status}`);
      const data: AdminPost[] = await postsRes.json();
      published = data;
      draft = data.map((p) => ({ ...p, _originalFilename: p.filename }));

      if (reviewRes.ok) {
        const reviewData: ReviewState = await reviewRes.json();
        reviewed = reviewData.blog ?? {};
      }
    } catch (e) {
      loadError = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  async function toggleReviewed(p: DraftPost) {
    const key = p.filename;
    const today = new Date().toISOString().slice(0, 10);
    const next = { ...reviewed };
    if (next[key]) {
      delete next[key];
    } else {
      next[key] = { checkedAt: today };
    }
    reviewed = next;
    await saveReviewState();
  }

  async function saveReviewState() {
    savingReview = true;
    try {
      const res = await fetch('/admin/review-state/api');
      const current: ReviewState = res.ok ? await res.json() : { grammar: {}, blog: {} };
      await fetch('/admin/review-state/api', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...current, blog: reviewed })
      });
    } catch {
      // Silent fail — review state is best-effort
    } finally {
      savingReview = false;
    }
  }

  function beforeUnload(e: BeforeUnloadEvent) {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  }

  function openAdd() {
    const blank = blankPost();
    modal = { mode: 'add', post: { filename: '', meta: blank.meta as PostMeta, body: blank.body } };
  }

  function openEdit(p: DraftPost) {
    // Clear review mark when editing
    if (reviewed[p.filename]) {
      const next = { ...reviewed };
      delete next[p.filename];
      reviewed = next;
      saveReviewState();
    }
    modal = {
      mode: 'edit',
      post: {
        ...p,
        meta: {
          ...p.meta,
          tags: [...(p.meta.tags ?? [])],
          decks: p.meta.decks ? [...p.meta.decks] : []
        },
        _originalFilename: p._originalFilename ?? p.filename
      }
    };
  }

  function closeModal() {
    modal = null;
  }

  function toggleTag(tag: CanonicalTag) {
    if (!modal) return;
    const tags = modal.post.meta?.tags ?? [];
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    modal.post = { ...modal.post, meta: { ...(modal.post.meta as PostMeta), tags: next } };
  }

  function toggleCefr(level: string) {
    if (!modal) return;
    const current = modal.post.meta?.cefr;
    const levels = Array.isArray(current) ? current : current ? [current] : [];
    const next = levels.includes(level) ? levels.filter((l) => l !== level) : [...levels, level];
    const cefr = next.length === 1 ? next[0] : next;
    modal.post = { ...modal.post, meta: { ...(modal.post.meta as PostMeta), cefr } };
  }

  function isCefrSelected(level: string): boolean {
    const current = modal?.post.meta?.cefr;
    if (!current) return false;
    return Array.isArray(current) ? current.includes(level) : current === level;
  }

  function addDeck() {
    if (!modal) return;
    const decks = modal.post.meta?.decks ?? [];
    const newDeck: DeckLink = { level: '', category: '', label: '' };
    modal.post = {
      ...modal.post,
      meta: { ...(modal.post.meta as PostMeta), decks: [...decks, newDeck] }
    };
  }

  function removeDeck(i: number) {
    if (!modal) return;
    const decks = modal.post.meta?.decks ?? [];
    modal.post = {
      ...modal.post,
      meta: { ...(modal.post.meta as PostMeta), decks: decks.filter((_, idx) => idx !== i) }
    };
  }

  function updateDeck(i: number, field: keyof DeckLink, value: string) {
    if (!modal) return;
    const decks = [...(modal.post.meta?.decks ?? [])];
    decks[i] = { ...decks[i], [field]: value };
    modal.post = { ...modal.post, meta: { ...(modal.post.meta as PostMeta), decks } };
  }

  function saveModal() {
    if (!modal) return;
    const meta = modal.post.meta as PostMeta;
    const body = modal.post.body ?? '';

    const issues = validatePost(meta, body);
    if (issues.length) {
      alert(issues.join('\n'));
      return;
    }

    if (modal.mode === 'add') {
      const exists = draft.some((p) => p._status !== 'deleted' && p.meta.slug === meta.slug);
      if (exists) {
        alert(`A post with slug "${meta.slug}" already exists.`);
        return;
      }
      const newPost: DraftPost = {
        filename: meta.slug,
        meta,
        body,
        _status: 'added'
      };
      draft = [...draft, newPost];
    } else {
      const originalFilename = modal.post._originalFilename!;
      const exists = draft.some(
        (p) =>
          p._status !== 'deleted' &&
          p.meta.slug === meta.slug &&
          p._originalFilename !== originalFilename
      );
      if (exists) {
        alert(`A post with slug "${meta.slug}" already exists.`);
        return;
      }
      draft = draft.map((p) => {
        if ((p._originalFilename ?? p.filename) !== originalFilename) return p;
        const wasOriginallyAdded = p._status === 'added';
        return {
          ...p,
          filename: meta.slug,
          meta,
          body,
          _status: wasOriginallyAdded ? 'added' : 'edited',
          _originalFilename: p._originalFilename ?? p.filename
        };
      });
    }
    modal = null;
  }

  function removePost(p: DraftPost) {
    if (p._status === 'added') {
      draft = draft.filter(
        (d) => (d._originalFilename ?? d.filename) !== (p._originalFilename ?? p.filename)
      );
      return;
    }
    if (!confirm(`Delete post "${p.meta.title}"? This will be removed on Publish.`)) return;
    draft = draft.map((d) =>
      (d._originalFilename ?? d.filename) === (p._originalFilename ?? p.filename)
        ? { ...d, _status: 'deleted' }
        : d
    );
  }

  function undelete(p: DraftPost) {
    draft = draft.map((d) =>
      (d._originalFilename ?? d.filename) === (p._originalFilename ?? p.filename)
        ? { ...d, _status: undefined }
        : d
    );
  }

  function discard() {
    if (!confirm('Discard all unpublished changes?')) return;
    draft = published.map((p) => ({ ...p, _originalFilename: p.filename }));
  }

  async function publish() {
    if (!isDirty || publishing || cooldown > 0) return;

    const toSend = draft.filter((p) => p._status !== 'deleted');
    for (const p of toSend) {
      const issues = validatePost(p.meta, p.body);
      if (issues.length) {
        alert(`Post "${p.meta.title || p.filename}": ${issues.join('; ')}`);
        const found = draft.find(
          (d) => (d._originalFilename ?? d.filename) === (p._originalFilename ?? p.filename)
        );
        if (found) openEdit(found);
        return;
      }
    }

    publishing = true;
    publishMessage = null;
    try {
      const res = await fetch('/admin/blog/api', {
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
        .filter((p) => p._status !== 'deleted')
        .map((p) => ({
          filename: p.meta.slug,
          meta: p.meta,
          body: p.body,
          _originalFilename: p.meta.slug
        }));
      published = clean.map(({ _originalFilename, ...rest }) => rest);
      draft = clean;
      startCooldown();
    } catch (e) {
      publishMessage = e instanceof Error ? e.message : String(e);
    } finally {
      publishing = false;
    }
  }

  function startCooldown() {
    cooldown = 90;
    const interval = setInterval(() => {
      cooldown -= 1;
      if (cooldown <= 0) clearInterval(interval);
    }, 1000);
  }

  function cefrLabel(cefr: string | string[]): string {
    return Array.isArray(cefr) ? cefr.join(', ') : cefr;
  }
</script>

<svelte:window onbeforeunload={beforeUnload} />

<svelte:head>
  <title>Blog Admin — Norskeord</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8 text-left">
  <a href="/admin" class="text-sm text-blue-600 hover:underline dark:text-blue-400">&larr; Admin</a>
  <h1 class="mt-2 text-2xl font-bold dark:text-white">Blog Posts</h1>

  {#if loading}
    <p class="mt-6 text-gray-500 dark:text-gray-400">Loading…</p>
  {:else if loadError}
    <p class="mt-6 text-red-600">Error: {loadError}</p>
  {:else}
    <!-- Toolbar -->
    <div class="mt-4 flex flex-wrap items-center gap-3">
      <!-- Review progress -->
      <span class="text-sm text-gray-500 dark:text-gray-400">
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
          + New post
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
    <div class="mt-4 flex flex-wrap gap-2">
      <select
        bind:value={filterCefr}
        class="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="">All CEFR</option>
        {#each CEFR_OPTIONS as l (l)}
          <option value={l}>{l}</option>
        {/each}
      </select>

      <select
        bind:value={filterTag}
        class="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="">All tags</option>
        {#each usedTags as t (t)}
          <option value={t}>{t}</option>
        {/each}
      </select>

      <select
        bind:value={filterType}
        class="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      >
        <option value="">All types</option>
        {#each TYPES as t (t)}
          <option value={t}>{t}</option>
        {/each}
      </select>

      <input
        type="text"
        placeholder="Search…"
        bind:value={searchQuery}
        class="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />

      <label class="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
        <input type="checkbox" bind:checked={showUnreviewedOnly} class="rounded" />
        Unreviewed only
      </label>

      <span class="ml-auto self-center text-sm text-gray-500 dark:text-gray-400">
        {filtered.length} of {totalReviewable}
      </span>
    </div>

    <!-- Table -->
    <div class="mt-4 overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr
            class="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400"
          >
            <th class="py-2 pr-3 text-center" title="Reviewed">✓</th>
            <th class="py-2 pr-3">Title</th>
            <th class="py-2 pr-3">Slug</th>
            <th class="py-2 pr-3">CEFR</th>
            <th class="py-2 pr-3">Type</th>
            <th class="py-2 pr-3">Published</th>
            <th class="py-2 pr-3">Tags</th>
            <th class="py-2 pr-3">Status</th>
            <th class="py-2 pr-3"></th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as p (p._originalFilename ?? p.filename)}
            {@const isReviewed = !!reviewed[p.filename]}
            <tr
              class={[
                'border-b border-gray-100 dark:border-gray-800',
                isReviewed ? 'bg-green-50 dark:bg-green-950/20' : ''
              ].join(' ')}
            >
              <td class="py-2 pr-3 text-center">
                <button
                  onclick={() => toggleReviewed(p)}
                  title={isReviewed
                    ? `Reviewed ${reviewed[p.filename].checkedAt} — click to unmark`
                    : 'Mark as reviewed'}
                  class={[
                    'text-lg leading-none transition-opacity',
                    isReviewed
                      ? 'text-green-500'
                      : 'opacity-20 hover:opacity-60 hover:text-green-400'
                  ].join(' ')}
                >
                  ✓
                </button>
              </td>
              <td class="max-w-xs truncate py-2 pr-3" title={p.meta.title}>
                {p.meta.title}
              </td>
              <td class="py-2 pr-3 font-mono text-xs">{p.meta.slug}</td>
              <td class="py-2 pr-3">{cefrLabel(p.meta.cefr)}</td>
              <td class="py-2 pr-3">{p.meta.type ?? 'word'}</td>
              <td class="py-2 pr-3 whitespace-nowrap">{p.meta.publishedAt}</td>
              <td class="py-2 pr-3">{(p.meta.tags ?? []).join(', ')}</td>
              <td class="py-2 pr-3">
                {#if p._status === 'added'}
                  <span
                    class="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300"
                    >+ new</span
                  >
                {:else if p._status === 'edited'}
                  <span
                    class="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                    >edited</span
                  >
                {/if}
              </td>
              <td class="py-2 pr-3 text-right whitespace-nowrap">
                <button class="mr-2 text-blue-600 hover:underline" onclick={() => openEdit(p)}
                  >✏</button
                >
                <button class="text-red-600 hover:underline" onclick={() => removePost(p)}
                  >🗑</button
                >
              </td>
            </tr>
          {/each}

          <!-- Deleted rows at bottom -->
          {#each deletedRows as p (p._originalFilename ?? p.filename)}
            <tr class="border-b border-gray-100 opacity-50 dark:border-gray-800">
              <td class="py-2 pr-3"></td>
              <td class="max-w-xs truncate py-2 pr-3 line-through" title={p.meta.title}
                >{p.meta.title}</td
              >
              <td class="py-2 pr-3 font-mono text-xs line-through">{p.meta.slug}</td>
              <td class="py-2 pr-3 line-through">{cefrLabel(p.meta.cefr)}</td>
              <td class="py-2 pr-3 line-through">{p.meta.type ?? 'word'}</td>
              <td class="py-2 pr-3 line-through whitespace-nowrap">{p.meta.publishedAt}</td>
              <td class="py-2 pr-3 line-through">{(p.meta.tags ?? []).join(', ')}</td>
              <td class="py-2 pr-3">
                <span
                  class="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900 dark:text-red-300"
                  >deleted</span
                >
              </td>
              <td class="py-2 pr-3 text-right">
                <button class="text-blue-600 hover:underline" onclick={() => undelete(p)}
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

<!-- Post form modal -->
{#if modal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div
      class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-900"
    >
      <h2 class="text-lg font-bold dark:text-white">
        {modal.mode === 'add' ? 'New post' : `Edit ${modal.post._originalFilename}`}
      </h2>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <label class="col-span-2 text-sm">
          <span class="block font-medium dark:text-gray-200">Title</span>
          <input
            type="text"
            bind:value={modal.post.meta!.title}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </label>

        <label class="col-span-2 text-sm">
          <span class="block font-medium dark:text-gray-200">Description</span>
          <textarea
            bind:value={modal.post.meta!.description}
            rows="2"
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          ></textarea>
        </label>

        <label class="text-sm">
          <span class="block font-medium dark:text-gray-200">Slug</span>
          <input
            type="text"
            bind:value={modal.post.meta!.slug}
            placeholder="my-post-slug"
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm font-mono dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          {#if modal.post.meta?.slug && !isValidSlug(modal.post.meta.slug)}
            <span class="text-xs text-red-600">lowercase letters, digits, and hyphens only</span>
          {/if}
        </label>

        <label class="text-sm">
          <span class="block font-medium dark:text-gray-200">Type</span>
          <select
            value={modal.post.meta?.type ?? 'word'}
            onchange={(e) =>
              (modal!.post.meta!.type = (e.currentTarget.value || undefined) as
                | 'word'
                | 'guide'
                | undefined)}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {#each TYPES as t (t)}
              <option value={t}>{t}</option>
            {/each}
          </select>
        </label>

        <div class="col-span-2 text-sm">
          <span class="block font-medium dark:text-gray-200">CEFR levels</span>
          <div class="mt-1 flex flex-wrap gap-2">
            {#each CEFR_OPTIONS as l (l)}
              <label class="flex items-center gap-1">
                <input type="checkbox" checked={isCefrSelected(l)} onchange={() => toggleCefr(l)} />
                <span class="dark:text-gray-200">{l}</span>
              </label>
            {/each}
          </div>
        </div>

        <label class="text-sm">
          <span class="block font-medium dark:text-gray-200">Published at</span>
          <input
            type="date"
            bind:value={modal.post.meta!.publishedAt}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </label>

        <label class="text-sm">
          <span class="block font-medium dark:text-gray-200">Updated at (optional)</span>
          <input
            type="date"
            value={modal.post.meta?.updatedAt ?? ''}
            onchange={(e) => (modal!.post.meta!.updatedAt = e.currentTarget.value || undefined)}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </label>

        <div class="col-span-2 text-sm">
          <span class="block font-medium dark:text-gray-200">Tags (canonical taxonomy)</span>
          <div class="mt-1 flex flex-wrap gap-2">
            {#each CANONICAL_TAGS as tag (tag)}
              <label
                class="flex items-center gap-1 rounded border border-gray-300 px-2 py-0.5 dark:border-gray-600"
              >
                <input
                  type="checkbox"
                  checked={(modal.post.meta?.tags ?? []).includes(tag)}
                  onchange={() => toggleTag(tag)}
                />
                <span class="dark:text-gray-200">{tag}</span>
              </label>
            {/each}
          </div>
        </div>

        <div class="col-span-2 text-sm">
          <div class="flex items-center justify-between">
            <span class="block font-medium dark:text-gray-200">Deck links (optional)</span>
            <button type="button" class="text-xs text-blue-600 hover:underline" onclick={addDeck}>
              + Add deck
            </button>
          </div>
          {#each modal.post.meta?.decks ?? [] as deck, i (i)}
            <div class="mt-2 flex gap-2">
              <input
                type="text"
                value={deck.level}
                oninput={(e) => updateDeck(i, 'level', e.currentTarget.value)}
                placeholder="a2"
                class="w-20 rounded border border-gray-300 px-2 py-1 text-sm font-mono dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <input
                type="text"
                value={deck.category}
                oninput={(e) => updateDeck(i, 'category', e.currentTarget.value)}
                placeholder="category-slug"
                class="flex-1 rounded border border-gray-300 px-2 py-1 text-sm font-mono dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <input
                type="text"
                value={deck.label}
                oninput={(e) => updateDeck(i, 'label', e.currentTarget.value)}
                placeholder="A2 Category Label"
                class="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <button type="button" class="text-red-600" onclick={() => removeDeck(i)}>×</button>
            </div>
          {/each}
        </div>

        <label class="col-span-2 text-sm">
          <span class="block font-medium dark:text-gray-200">Body (Markdown)</span>
          <textarea
            bind:value={modal.post.body}
            rows="16"
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 font-mono text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          ></textarea>
        </label>
      </div>

      <div class="mt-6 flex justify-end gap-2">
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
{/if}
