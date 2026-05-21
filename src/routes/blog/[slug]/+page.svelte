<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import type { PageData } from './$types';
  import type { Component } from 'svelte';

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

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>{data.meta.title} — Norskeord</title>
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
      <Badge color={cefrColors[data.meta.cefr] ?? 'blue'} data-testid="cefr-badge"
        >{data.meta.cefr}</Badge
      >
      <span class="text-sm text-gray-400">{formatDate(data.meta.publishedAt)}</span>
    </div>
  </div>

  <!-- Rendered markdown -->
  <div class="prose prose-gray dark:prose-invert max-w-none text-left">
    <PostContent />
  </div>
</div>
