<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import type { PageData } from './$types';
  import type { Component } from 'svelte';
  import * as m from '$lib/paraglide/messages.js';
  import { cefrLevels } from '$lib/blog';

  let { data }: { data: PageData } = $props();

  const PostContent = $derived(data.content as Component);

  const cefrColors: Record<string, 'green' | 'blue' | 'indigo' | 'purple' | 'pink' | 'yellow'> = {
    A1: 'green',
    A2: 'green',
    B1: 'blue',
    B2: 'indigo',
    C: 'purple'
  };

  const levels = $derived(cefrLevels(data.meta.cefr));

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  const articleSchemaJson = $derived(JSON.stringify(data.articleSchema));
</script>

<svelte:head>
  <title>{data.meta.title} — Norskeord</title>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html '<scr' + 'ipt type="application/ld+json">' + articleSchemaJson + '</scr' + 'ipt>'}
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-10">
  <!-- Header -->
  <div class="mb-8">
    <a
      href="/blog"
      class="mb-6 inline-block text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
    >
      ← {m.blog_post_back_to_all()}
    </a>
    <h1 class="mb-3 text-3xl font-bold dark:text-white">{data.meta.title}</h1>
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1">
        {#each levels as lvl (lvl)}
          <Badge color={cefrColors[lvl] ?? 'blue'} data-testid="cefr-badge">{lvl}</Badge>
        {/each}
      </div>
      <span class="text-sm text-gray-400">{formatDate(data.meta.publishedAt)}</span>
    </div>
  </div>

  <!-- Rendered markdown -->
  <div class="prose prose-gray dark:prose-invert max-w-none text-left">
    <PostContent />
  </div>

  <!-- Practice decks -->
  {#if data.meta.decks && data.meta.decks.length > 0}
    <div
      class="mt-10 rounded-xl border border-blue-100 bg-blue-50 px-6 py-5 dark:border-blue-900 dark:bg-blue-950/40"
    >
      <p
        class="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400"
      >
        {m.blog_post_practice_vocab()}
      </p>
      <div class="flex flex-wrap gap-2">
        {#each data.meta.decks as deck (deck.level + '/' + deck.category)}
          <a
            href="/{deck.level}/{deck.category}"
            class="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/60"
          >
            <span>🃏</span>
            {deck.label}
          </a>
        {/each}
      </div>
    </div>
  {/if}
</div>
