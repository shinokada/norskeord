<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import type { PageData } from './$types';
  import * as m from '$lib/paraglide/messages.js';
  import { cefrLevels } from '$lib/blog';

  let { data }: { data: PageData } = $props();

  const cefrOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const cefrColors: Record<string, 'green' | 'blue' | 'indigo' | 'purple' | 'pink' | 'yellow'> = {
    A1: 'green',
    A2: 'green',
    B1: 'blue',
    B2: 'indigo',
    C1: 'purple',
    C2: 'pink'
  };

  const guides = $derived(data.posts.filter((p) => p.type === 'guide'));

  const grouped = $derived(
    cefrOrder
      .map((level) => ({
        level,
        posts: data.posts.filter(
          (p) => p.type !== 'guide' && cefrLevels(p.cefr).includes(level)
        )
      }))
      .filter((g) => g.posts.length > 0)
  );

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' });
  }
</script>

<svelte:head>
  <title>Språkhjørnet — Norskeord</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-12 text-left">
  <h1 class="mb-2 text-3xl font-bold dark:text-white">Språkhjørnet</h1>
  <p class="mb-10 text-gray-500 dark:text-gray-400">
    {m.blog_subheading()}
  </p>

  {#if guides.length > 0}
    <section class="mb-10">
      <h2
        class="mb-4 text-sm font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500"
      >
        {m.blog_section_guides()}
      </h2>
      <div class="space-y-3">
        {#each guides as post (post.slug)}
          <a
            href="/blog/{post.slug}"
            class="hover:border-primary-400 dark:hover:border-primary-500 block rounded-xl border border-gray-200 px-5 py-4 transition hover:shadow-sm dark:border-gray-700"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="font-semibold text-gray-900 dark:text-white">{post.title}</p>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{post.description}</p>
              </div>
              <span class="text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-1"
                >{formatDate(post.publishedAt)}</span
              >
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  {#each grouped as group (group.level)}
    <section class="mb-10">
      <h2
        class="mb-4 text-sm font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500"
      >
        {m.blog_section_level({ level: group.level })}
      </h2>

      <div class="space-y-3">
        {#each group.posts as post (post.slug)}
          {@const postLevels = cefrLevels(post.cefr)}
          <a
            href="/blog/{post.slug}"
            class="hover:border-primary-400 dark:hover:border-primary-500 block rounded-xl border border-gray-200 px-5 py-4 transition hover:shadow-sm dark:border-gray-700"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="font-semibold text-gray-900 dark:text-white">{post.title}</p>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{post.description}</p>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-2">
                <div class="flex items-center gap-1">
                  {#each postLevels as lvl (lvl)}
                    <Badge color={cefrColors[lvl] ?? 'blue'} data-testid="cefr-badge">{lvl}</Badge>
                  {/each}
                </div>
                <span class="text-xs text-gray-400 dark:text-gray-500"
                  >{formatDate(post.publishedAt)}</span
                >
              </div>
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/each}
</div>
