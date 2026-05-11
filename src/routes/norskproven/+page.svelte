<script lang="ts">
  import { removeHyphensAndCapitalize } from '$lib/utils';
  import * as m from '$lib/paraglide/messages.js';
  import { page } from '$app/state';

  const user = $derived(page.data.user);
  // Curated exam-essential categories per level, ordered by exam relevance
  const examSections = [
    {
      level: 'A2' as const,
      labelKey: 'a2' as const,
      descriptionKey: 'a2' as const,
      color: {
        badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
        border: 'border-teal-200 dark:border-teal-800',
        heading: 'text-teal-700 dark:text-teal-400',
        bar: 'bg-teal-500'
      },
      categories: [
        { slug: 'shopping', note: 'prices, everyday transactions' },
        { slug: 'transport', note: 'public transport, tickets, travel' },
        { slug: 'health-basic', note: 'doctor visits, symptoms, medicine' },
        { slug: 'occupations', note: 'jobs, workplace, daily routine' },
        { slug: 'directions', note: 'asking for and giving directions' },
        { slug: 'time', note: 'appointments, schedules, clock' },
        { slug: 'communication', note: 'phone, email, formal requests' },
        { slug: 'hobbies', note: 'leisure, weekend activities' }
      ]
    },
    {
      level: 'B1' as const,
      labelKey: 'b1' as const,
      descriptionKey: 'b1' as const,
      color: {
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        border: 'border-blue-200 dark:border-blue-800',
        heading: 'text-blue-700 dark:text-blue-400',
        bar: 'bg-blue-500'
      },
      categories: [
        { slug: 'work', note: 'applying for jobs, workplace rights' },
        { slug: 'education', note: 'schools, courses, grades' },
        { slug: 'health-body-intermediate', note: 'healthcare system, insurance' },
        { slug: 'finance-banking', note: 'bank accounts, bills, tax' },
        { slug: 'housing-renting', note: 'renting, tenancy, utilities' },
        { slug: 'travel', note: 'planning trips, booking, describing places' },
        { slug: 'relationships', note: 'family, social situations, feelings' },
        { slug: 'city-life', note: 'public services, neighbourhood, local life' }
      ]
    }
  ] as const;

  const examFacts = [
    {
      icon: '📋',
      labelKey: 'who' as const,
      textKey: 'who' as const
    },
    {
      icon: '🎯',
      labelKey: 'target' as const,
      textKey: 'target' as const
    },
    {
      icon: '📝',
      labelKey: 'tests' as const,
      textKey: 'tests' as const
    },
    {
      icon: '📅',
      labelKey: 'register' as const,
      textKey: 'register' as const
    }
  ] as const;

  function getFactLabel(key: 'who' | 'target' | 'tests' | 'register'): string {
    if (key === 'who') return m.norskproven_fact_who_label();
    if (key === 'target') return m.norskproven_fact_target_label();
    if (key === 'tests') return m.norskproven_fact_tests_label();
    return m.norskproven_fact_register_label();
  }

  function getFactText(key: 'who' | 'target' | 'tests' | 'register'): string {
    if (key === 'who') return m.norskproven_fact_who_text();
    if (key === 'target') return m.norskproven_fact_target_text();
    if (key === 'tests') return m.norskproven_fact_tests_text();
    return m.norskproven_fact_register_text();
  }

  function getSectionLabel(key: 'a2' | 'b1'): string {
    return key === 'a2' ? m.norskproven_a2_label() : m.norskproven_b1_label();
  }

  function getSectionDescription(key: 'a2' | 'b1'): string {
    return key === 'a2' ? m.norskproven_a2_description() : m.norskproven_b1_description();
  }
</script>

<div class="mx-auto max-w-4xl px-4 py-10 text-left">
  <!-- ── Hero ─────────────────────────────────────────────────────────────────── -->
  <div class="mb-10">
    <div
      class="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase dark:bg-blue-900 dark:text-blue-300"
    >
      {m.norskproven_badge()}
    </div>
    <h1 class="text-4xl leading-tight font-bold dark:text-white">{m.norskproven_heading()}</h1>
    <p class="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
      {m.norskproven_subheading()}
    </p>
    {#if user}
      <a
        href="/stats"
        class="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
      >
        {m.norskproven_cta_progress()}
      </a>
    {:else}
      <a
        href="/plus"
        class="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
      >
        {m.nav_plus_badge()}
      </a>
    {/if}
  </div>

  <!-- ── What is Norskprøven ───────────────────────────────────────────────────── -->
  <div class="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
    {#each examFacts as fact (fact.labelKey)}
      <div
        class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="mb-1 flex items-center gap-2">
          <span class="text-xl">{fact.icon}</span>
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-200"
            >{getFactLabel(fact.labelKey)}</span
          >
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{getFactText(fact.textKey)}</p>
      </div>
    {/each}
  </div>

  <!-- ── Exam Essential categories ─────────────────────────────────────────────── -->
  {#each examSections as section (section.level)}
    <div class="mb-10">
      <div class="mb-1 flex items-center gap-3">
        <h2 class="text-2xl font-bold {section.color.heading}">
          {getSectionLabel(section.labelKey)}
        </h2>
        <span class="rounded-full {section.color.badge} px-2.5 py-0.5 text-xs font-semibold">
          {m.norskproven_exam_essential()}
        </span>
      </div>
      <p class="mb-5 text-sm text-gray-500 dark:text-gray-400">
        {getSectionDescription(section.descriptionKey)}
      </p>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {#each section.categories as cat (cat.slug)}
          <a
            href="/{section.level.toLowerCase()}/{cat.slug}"
            class="group flex items-center justify-between rounded-xl border {section.color
              .border} bg-white p-4 transition-shadow hover:shadow-md dark:bg-gray-800"
          >
            <div>
              <p
                class="font-semibold text-gray-800 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400"
              >
                {removeHyphensAndCapitalize(cat.slug)}
              </p>
              <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{cat.note}</p>
            </div>
            <span class="ml-3 shrink-0 text-gray-300 group-hover:text-blue-400 dark:text-gray-600">
              →
            </span>
          </a>
        {/each}
      </div>

      <!-- Link to full level -->
      <p class="mt-4 text-sm text-gray-400 dark:text-gray-500">
        {m.norskproven_more_topics({ level: section.level })}
        {#each ['A2', 'B1'].filter((l) => l === section.level) as _ (_)}
          <a href="/" class="text-blue-500 underline hover:text-blue-700 dark:hover:text-blue-300">
            {m.norskproven_browse_all({ level: section.level })}
          </a>
        {/each}
      </p>
    </div>
  {/each}

  <!-- ── Study tips ─────────────────────────────────────────────────────────────── -->
  <div
    class="mb-10 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20"
  >
    <h2 class="mb-3 text-lg font-bold text-amber-800 dark:text-amber-300">
      {m.norskproven_tips_heading()}
    </h2>
    <ul class="space-y-2 text-sm text-amber-900 dark:text-amber-200">
      <li>
        <strong>{m.norskproven_tip_1_strong()}</strong>{m.norskproven_tip_1_text()}
      </li>
      <li>
        <strong>{m.norskproven_tip_2_strong()}</strong>{m.norskproven_tip_2_text()}
      </li>
      <li>
        <strong>{m.norskproven_tip_3_strong()}</strong>{m.norskproven_tip_3_text()}
      </li>
      <li>
        <strong>{m.norskproven_tip_4_strong()}</strong>
        — the
        <a href="/stats" class="underline hover:text-amber-700 dark:hover:text-amber-100"
          >{m.norskproven_tip_4_link_text()}</a
        >{m.norskproven_tip_4_text().replace(/^— the My Progress page/, '')}
      </li>
    </ul>
  </div>

  <!-- ── CTA ───────────────────────────────────────────────────────────────────── -->
  <div
    class="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/40"
  >
    <p class="text-lg font-semibold dark:text-white">{m.norskproven_cta_heading()}</p>
    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {m.norskproven_cta_body()}
    </p>
    <div class="mt-4 flex flex-wrap justify-center gap-3">
      <a
        href="/a2/health-basic"
        class="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700"
      >
        {m.norskproven_cta_a2()}
      </a>
      <a
        href="/b1/work"
        class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        {m.norskproven_cta_b1()}
      </a>
      <a
        href="/stats"
        class="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        {m.norskproven_cta_stats()}
      </a>
    </div>
  </div>
</div>
