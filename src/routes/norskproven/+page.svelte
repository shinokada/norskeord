<script lang="ts">
  import { removeHyphensAndCapitalize } from '$lib/utils';
  import * as m from '$lib/paraglide/messages.js';
  import { page } from '$app/state';
  import { isFreeTest } from '$lib/access';
  import { Tooltip } from 'flowbite-svelte';

  const plan = $derived(page.data.plan);
  let isPlus = $derived(plan === 'plus');

  // ── Practice test grid (was /norskproven/practice) ─────────────────────────
  const practiceLevels = [
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

  const practiceTypes = [
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

  const testCount = 3;
  const tests = Array.from({ length: testCount }, (_, i) => i + 1);

  // ── Vocabulary prep sections (was /norskproven content) ────────────────────
  const examSections = [
    {
      level: 'A2' as const,
      labelKey: 'a2' as const,
      descriptionKey: 'a2' as const,
      color: {
        badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
        heading: 'text-teal-700 dark:text-teal-400'
      },
      categories: [
        { slug: 'shopping', noteKey: 'a2_shopping' as const },
        { slug: 'transport', noteKey: 'a2_transport' as const },
        { slug: 'health', noteKey: 'a2_health' as const },
        { slug: 'occupations', noteKey: 'a2_occupations' as const },
        { slug: 'directions', noteKey: 'a2_directions' as const },
        { slug: 'time', noteKey: 'a2_time' as const },
        { slug: 'communication', noteKey: 'a2_communication' as const },
        { slug: 'hobbies', noteKey: 'a2_hobbies' as const }
      ]
    },
    {
      level: 'B1' as const,
      labelKey: 'b1' as const,
      descriptionKey: 'b1' as const,
      color: {
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        heading: 'text-blue-700 dark:text-blue-400'
      },
      categories: [
        { slug: 'work', noteKey: 'b1_work' as const },
        { slug: 'education', noteKey: 'b1_education' as const },
        { slug: 'health', noteKey: 'b1_health' as const },
        { slug: 'relationships', noteKey: 'b1_relationships' as const },
        { slug: 'travel', noteKey: 'b1_travel' as const },
        { slug: 'society', noteKey: 'b1_society' as const },
        { slug: 'culture', noteKey: 'b1_culture' as const },
        { slug: 'environment', noteKey: 'b1_environment' as const }
      ]
    }
  ] as const;

  const _examFacts = [
    { icon: '📋', labelKey: 'who' as const, textKey: 'who' as const },
    { icon: '🎯', labelKey: 'target' as const, textKey: 'target' as const },
    { icon: '📝', labelKey: 'tests' as const, textKey: 'tests' as const },
    { icon: '📅', labelKey: 'register' as const, textKey: 'register' as const }
  ] as const;

  function _getFactLabel(key: 'who' | 'target' | 'tests' | 'register'): string {
    if (key === 'who') return m.norskproven_fact_who_label();
    if (key === 'target') return m.norskproven_fact_target_label();
    if (key === 'tests') return m.norskproven_fact_tests_label();
    return m.norskproven_fact_register_label();
  }

  function _getFactText(key: 'who' | 'target' | 'tests' | 'register'): string {
    if (key === 'who') return m.norskproven_fact_who_text();
    if (key === 'target') return m.norskproven_fact_target_text();
    if (key === 'tests') return m.norskproven_fact_tests_text();
    return m.norskproven_fact_register_text();
  }

  function getSectionLabel(key: 'a2' | 'b1'): string {
    return key === 'a2' ? m.norskproven_a2_label() : m.norskproven_b1_label();
  }

  function getCategoryNote(
    key:
      | 'a2_shopping'
      | 'a2_transport'
      | 'a2_health'
      | 'a2_occupations'
      | 'a2_directions'
      | 'a2_time'
      | 'a2_communication'
      | 'a2_hobbies'
      | 'b1_work'
      | 'b1_education'
      | 'b1_health'
      | 'b1_relationships'
      | 'b1_travel'
      | 'b1_society'
      | 'b1_culture'
      | 'b1_environment'
  ): string {
    const noteMap = {
      a2_shopping: m.norskproven_note_a2_shopping,
      a2_transport: m.norskproven_note_a2_transport,
      a2_health: m.norskproven_note_a2_health,
      a2_occupations: m.norskproven_note_a2_occupations,
      a2_directions: m.norskproven_note_a2_directions,
      a2_time: m.norskproven_note_a2_time,
      a2_communication: m.norskproven_note_a2_communication,
      a2_hobbies: m.norskproven_note_a2_hobbies,
      b1_work: m.norskproven_note_b1_work,
      b1_education: m.norskproven_note_b1_education,
      b1_health: m.norskproven_note_b1_health,
      b1_relationships: m.norskproven_note_b1_relationships,
      b1_travel: m.norskproven_note_b1_travel,
      b1_society: m.norskproven_note_b1_society,
      b1_culture: m.norskproven_note_b1_culture,
      b1_environment: m.norskproven_note_b1_environment
    };
    return noteMap[key]();
  }

  function getSectionDescription(key: 'a2' | 'b1'): string {
    return key === 'a2' ? m.norskproven_a2_description() : m.norskproven_b1_description();
  }
</script>

<div class="mx-auto max-w-4xl px-4 py-10 text-left">
  <!-- ── Hero ─────────────────────────────────────────────────────────────────────────── -->
  <div class="mb-10">
    <div
      class="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase dark:bg-blue-900 dark:text-blue-300"
    >
      {m.norskproven_badge()}
    </div>
    <h1 class="text-4xl leading-tight font-bold dark:text-white">{m.norskproven_heading()}</h1>
    <p class="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
      {m.norskproven_subheading()}
    </p>
    <a
      href="/stats"
      class="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      {m.norskproven_cta_progress()}
    </a>
  </div>

  <!-- ── Practice tests ──────────────────────────────────────────────────────────── -->
  <div class="mb-14">
    <div class="mb-5">
      <h2 class="text-2xl font-bold dark:text-white">{m.norskproven_practice_heading()}</h2>
    </div>
    <p class="mb-6 text-sm text-gray-600 dark:text-gray-300">
      {m.norskproven_practice_subheading()}
    </p>

    <div class="grid grid-cols-1 gap-8 sm:grid-cols-2">
      {#each practiceLevels as { level, color } (level)}
        <div>
          <div class="mb-4 flex items-center gap-3">
            <h3 class="text-xl font-bold {color.heading}">{level}</h3>
            <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold {color.badge}">
              {m.norskproven_practice_badge()}
            </span>
          </div>
          <div class="space-y-3">
            {#each practiceTypes as type (type.key)}
              <div
                class="rounded-2xl border {color.border} bg-white p-4 shadow-sm dark:bg-indigo-950/60"
              >
                <div class="flex items-center gap-4">
                  <span
                    class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl {color.icon}"
                  >
                    {type.icon}
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="font-semibold text-gray-800 dark:text-gray-100">{type.labelFn()}</p>
                    <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-400">{type.descFn()}</p>
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-2 pl-[60px]">
                  {#each tests as test (test)}
                    {@const locked = !isPlus && !isFreeTest(test)}
                    {@const pillId = `pill-${level}-${type.key}-${test}`}
                    <a
                      id={pillId}
                      href={locked
                        ? '/plus?ref=practice-test-lock'
                        : `/norskproven/${test}/${type.key}/${level.toLowerCase()}`}
                      class="rounded-lg border px-3 py-1 text-xs font-semibold transition-colors
                        {locked
                        ? 'cursor-not-allowed border-gray-300 text-gray-400 opacity-50 dark:border-gray-600 dark:text-gray-500'
                        : color.pill}"
                    >
                      {m.norskproven_test_label({ n: test })}{locked ? ' 🔒' : ''}
                    </a>
                    {#if locked}
                      <Tooltip triggeredBy="#{pillId}" placement="top" class="text-xs"
                        >{m.norskproven_test_locked_tooltip()}</Tooltip
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
  </div>

  <!-- ── Exam Essential categories ───────────────────────────────────────────────────── -->
  {#each examSections as section (section.level)}
    <div class="mb-10">
      <div class="mb-1 flex items-center gap-3">
        <h2 class="text-2xl font-bold {section.color.heading}">
          {getSectionLabel(section.labelKey)}
        </h2>
      </div>
      <p class="mb-5 text-sm text-gray-600 dark:text-gray-300">
        {getSectionDescription(section.descriptionKey)}
      </p>

      <div class="flex flex-wrap gap-2">
        {#each section.categories as cat (cat.slug)}
          <a
            href="/{section.level.toLowerCase()}/{cat.slug}"
            class="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-gray-700 dark:bg-indigo-950/60 dark:text-gray-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300"
            title={getCategoryNote(cat.noteKey)}
          >
            {removeHyphensAndCapitalize(cat.slug)}
          </a>
        {/each}
      </div>

      <p class="mt-4 text-sm text-gray-600 dark:text-gray-300">
        {#if section.level === 'B1' && plan !== 'plus'}
          {m.norskproven_unlock_more_prompt({ level: section.level })}
          <a
            href="/plus?ref=norskproven-{section.level.toLowerCase()}"
            class="font-semibold text-blue-500 underline hover:text-blue-700 dark:hover:text-blue-300"
          >
            {m.norskproven_unlock_cta()}
          </a>
        {:else}
          {m.norskproven_more_topics({ level: section.level })}
          <a
            href="/learn/{section.level.toLowerCase()}"
            class="text-blue-500 underline hover:text-blue-700 dark:hover:text-blue-300"
          >
            {m.norskproven_browse_all({ level: section.level })}
          </a>
        {/if}
      </p>
    </div>
  {/each}
</div>
