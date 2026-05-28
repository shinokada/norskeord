<script lang="ts">
  import { page } from '$app/state';
  import { isFreeTest } from '$lib/types';
  import { Tooltip } from 'flowbite-svelte';
  import * as m from '$lib/paraglide/messages.js';

  // ── Practice sections ──────────────────────────────────────────────────────

  const levels = [
    {
      level: 'A2',
      color: {
        badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
        heading: 'text-teal-700 dark:text-teal-400',
        border: 'border-teal-200 dark:border-teal-800',
        icon: 'bg-teal-50 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300',
        pill: 'border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300 dark:hover:bg-teal-900/30'
      }
    },
    {
      level: 'B1',
      color: {
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        heading: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
        pill: 'border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30'
      }
    }
  ] as const;

  const types = [
    {
      key: 'reading' as const,
      icon: '📖',
      labelFn: () => m.norskproven_practice_reading(),
      descFn: () => m.norskproven_practice_reading_desc()
    },
    {
      key: 'writing' as const,
      icon: '✍️',
      labelFn: () => m.norskproven_practice_writing(),
      descFn: () => m.norskproven_practice_writing_desc()
    },
    {
      key: 'oral' as const,
      icon: '🗣️',
      labelFn: () => m.norskproven_practice_oral(),
      descFn: () => m.norskproven_practice_oral_desc()
    }
  ] as const;

  // ── Test counts — increment this when adding a new test set ───────────────
  // To add Test 4: set testCount to 4 and add norskproven-{level}-4.json files.
  const testCount = 3;
  const tests = Array.from({ length: testCount }, (_, i) => i + 1);

  // ── Plan state ──────────────────────────────────────────────────────────────
  let isPlus = $derived(page.data.plan === 'plus');
</script>

<div class="mx-auto max-w-4xl px-4 py-10 text-left">
  <!-- ── Hero ─────────────────────────────────────────────────────────────── -->
  <div class="mb-10">
    <div
      class="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase dark:bg-blue-900 dark:text-blue-300"
    >
      {m.norskproven_practice_badge()}
    </div>
    <h1 class="text-3xl font-bold dark:text-white">{m.norskproven_practice_heading()}</h1>
    <p class="mt-3 max-w-2xl text-base text-gray-600 dark:text-gray-400">
      {m.norskproven_practice_subheading()}
    </p>
    <a
      href="/norskproven"
      class="mt-4 inline-flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
    >
      ← Tilbake til Norskprøven
    </a>
  </div>

  <!-- ── Level columns ─────────────────────────────────────────────────────── -->
  <div class="grid grid-cols-1 gap-8 sm:grid-cols-2">
    {#each levels as { level, color } (level)}
      <div>
        <!-- Level heading -->
        <div class="mb-4 flex items-center gap-3">
          <h2 class="text-xl font-bold {color.heading}">{level}</h2>
          <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold {color.badge}">
            {m.norskproven_practice_badge()}
          </span>
        </div>

        <!-- Type cards -->
        <div class="space-y-3">
          {#each types as type (type.key)}
            <div class="rounded-2xl border {color.border} bg-white p-4 shadow-sm dark:bg-gray-800">
              <div class="flex items-center gap-4">
                <!-- Icon -->
                <span
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl {color.icon}"
                >
                  {type.icon}
                </span>

                <!-- Text -->
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-gray-800 dark:text-gray-100">
                    {type.labelFn()}
                  </p>
                  <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {type.descFn()}
                  </p>
                </div>
              </div>

              <!-- Test pills -->
              <div class="mt-3 flex flex-wrap gap-2 pl-[60px]">
                {#each tests as test (test)}
                  {@const locked = !isPlus && !isFreeTest(test)}
                  {@const pillId = `pill-${level}-${type.key}-${test}`}
                  <a
                    id={pillId}
                    href={locked
                      ? '/plus?ref=practice-test-lock'
                      : `/norskproven/practice/${test}/${type.key}/${level.toLowerCase()}`}
                    class="rounded-lg border px-3 py-1 text-xs font-semibold transition-colors
                      {locked
                      ? 'cursor-not-allowed border-gray-300 text-gray-400 opacity-50 dark:border-gray-600 dark:text-gray-500'
                      : color.pill}"
                  >
                    Test {test}{locked ? ' 🔒' : ''}
                  </a>
                  {#if locked}
                    <Tooltip triggeredBy="#{pillId}" placement="top" class="text-xs"
                      >Upgrade to Plus to unlock</Tooltip
                    >
                  {/if}
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <!-- ── Tip banner ─────────────────────────────────────────────────────────── -->
  <div
    class="mt-10 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-800 dark:bg-amber-900/20"
  >
    <p class="text-sm text-amber-800 dark:text-amber-300">
      <strong>{m.norskproven_practice_tip_label()}:</strong>
      {m.norskproven_practice_tip_body()}
    </p>
  </div>
</div>
