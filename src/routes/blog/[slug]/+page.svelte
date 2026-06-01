<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import type { PageData } from './$types';
  import type { Component } from 'svelte';
  import { cefrLevels } from '$lib/blog';

  let { data }: { data: PageData } = $props();

  const PostContent = $derived(data.content as Component);

  const cefrColors: Record<string, 'green' | 'blue' | 'indigo' | 'purple' | 'pink' | 'yellow'> = {
    A1: 'green',
    A2: 'green',
    B1: 'blue',
    B2: 'indigo',
    C1: 'purple',
    C2: 'pink'
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

<div class="mx-auto max-w-2xl px-4 py-12">
  <!-- Header -->
  <div class="mb-8">
    <a
      href="/blog"
      class="mb-6 inline-block text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
    >
      ← All posts
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
</div>
