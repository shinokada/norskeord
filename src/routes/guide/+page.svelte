<script>
  import { Heading } from 'flowbite-svelte';
  import * as m from '$lib/paraglide/messages.js';

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the difference between Free and Plus?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Free gives you all A1 and A2 vocabulary plus a preview of B1/B2, the top 3 quiz categories per level, and 4 grammar topics. Plus unlocks all levels (B1–C2), smart Due today scheduling, cross-device sync, all quiz categories, all grammar topics, Norskprøven practice tests, full-text search, and lesson emails.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is the daily study reminder?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A browser push notification sent once a day to remind you to study. Enable it under Profile → Notifications → Daily study reminder.'
        }
      },
      {
        '@type': 'Question',
        name: 'I enabled the reminder but nothing arrives. Why?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Check that your browser is allowed to send notifications in your OS settings. On iPhone, notifications only work if you have added Norskeord to your home screen first (Share → Add to Home Screen).'
        }
      },
      {
        '@type': 'Question',
        name: 'What are Norwegian lesson emails?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Biweekly emails with a short Norwegian text, a vocabulary list, and exercises matched to your level. Available to Plus members. Enable under Profile → Notifications.'
        }
      },
      {
        '@type': 'Question',
        name: "My progress isn't showing on my other device.",
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Progress syncs across devices for Plus members. Free accounts store progress on the current device only.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I use Norskeord offline?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Install it as an app (Share → Add to Home Screen on iPhone, or the install prompt in Chrome) and flashcard decks you have opened before will work without an internet connection.'
        }
      },
      {
        '@type': 'Question',
        name: 'What is Norskprøven?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Norskprøven is the official Norwegian language exam, required for permanent residency and citizenship. Norskeord includes vocabulary focused on exam topics and full practice tests (reading, writing, oral) at A2 and B1 level.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I change my flashcard preferences?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Go to Profile → Preferences. You can set your target level, interface language, default card direction, card type, pronunciation speed, and number of cards per session.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I download my progress report?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Go to Profile → Account and click Download Progress report. This exports all your card history as a file you can save or share. This is a Plus feature.'
        }
      }
    ]
  };
  const faqSchemaJson = JSON.stringify(faqSchema);

  // Anchor sections
  const sections = [
    { id: 'start', label: () => m.guide_anchor_start() },
    { id: 'flashcards', label: () => m.guide_anchor_flashcards() },
    { id: 'quiz', label: () => m.guide_anchor_quiz() },
    { id: 'grammar', label: () => m.guide_anchor_grammar() },
    { id: 'norskproven', label: () => m.guide_anchor_norskproven() },
    { id: 'faq', label: () => m.guide_anchor_faq() }
  ];
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html '<scr' + 'ipt type="application/ld+json">' + faqSchemaJson + '</scr' + 'ipt>'}
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10 text-left">
  <Heading tag="h1" class="mb-2 text-4xl font-bold dark:text-white">{m.guide_page_title()}</Heading>
  <p class="mb-6 text-gray-600 dark:text-gray-300">
    {m.guide_page_subtitle()}
  </p>

  <!-- Anchor nav -->
  <nav aria-label="Page sections" class="mb-10 flex flex-wrap gap-2">
    {#each sections as { id, label } (id)}
      <a
        href="#{id}"
        class="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
      >
        {label()}
      </a>
    {/each}
  </nav>

  <!-- ── WHERE TO START ─────────────────────────────────────── -->
  <section id="start" class="mb-12 scroll-mt-20">
    <Heading tag="h2" class="mb-4 text-2xl font-semibold dark:text-white"
      >{m.guide_start_heading()}</Heading
    >
    <p class="mb-4 text-gray-700 dark:text-gray-300">{m.guide_start_intro()}</p>

    <div
      class="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
    >
      <div class="flex items-start gap-3">
        <span class="mt-0.5 shrink-0 text-lg">🇳🇴</span>
        <p class="text-gray-700 dark:text-gray-300">
          <strong>{m.guide_start_path_beginner_label()}</strong>
          {m.guide_start_path_beginner_desc()}
          <a href="/a1" class="font-medium text-indigo-600 underline dark:text-indigo-400"
            >{m.guide_start_path_beginner_cta()}</a
          >
        </p>
      </div>
      <div class="flex items-start gap-3">
        <span class="mt-0.5 shrink-0 text-lg">📋</span>
        <p class="text-gray-700 dark:text-gray-300">
          <strong>{m.guide_start_path_exam_label()}</strong>
          {m.guide_start_path_exam_desc()}
          <a href="/norskproven" class="font-medium text-indigo-600 underline dark:text-indigo-400"
            >{m.guide_start_path_exam_cta()}</a
          >
        </p>
      </div>
      <div class="flex items-start gap-3">
        <span class="mt-0.5 shrink-0 text-lg">🧠</span>
        <p class="text-gray-700 dark:text-gray-300">
          <strong>{m.guide_start_path_quiz_label()}</strong>
          {m.guide_start_path_quiz_desc()}
          <a href="/quiz" class="font-medium text-indigo-600 underline dark:text-indigo-400"
            >{m.guide_start_path_quiz_cta()}</a
          >
        </p>
      </div>
      <div class="flex items-start gap-3">
        <span class="mt-0.5 shrink-0 text-lg">✏️</span>
        <p class="text-gray-700 dark:text-gray-300">
          <strong>{m.guide_start_path_grammar_label()}</strong>
          {m.guide_start_path_grammar_desc()}
          <a href="/grammar" class="font-medium text-indigo-600 underline dark:text-indigo-400"
            >{m.guide_start_path_grammar_cta()}</a
          >
        </p>
      </div>
    </div>

    <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">{m.guide_start_note()}</p>
  </section>

  <!-- ── FLASHCARDS ─────────────────────────────────────────── -->
  <section id="flashcards" class="mb-12 scroll-mt-20">
    <Heading tag="h2" class="mb-3 text-2xl font-semibold dark:text-white"
      >{m.guide_flashcards_heading()}</Heading
    >
    <p class="mb-4 text-gray-700 dark:text-gray-300">{m.guide_flashcards_intro()}</p>

    <!-- Smart scheduling -->
    <Heading tag="h3" class="mb-3 text-lg font-semibold dark:text-white"
      >{m.guide_scheduling_heading()}</Heading
    >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p class="mb-4 text-gray-700 dark:text-gray-300">{@html m.guide_scheduling_1()}</p>
    <p class="mb-4 text-gray-700 dark:text-gray-300">{m.guide_scheduling_2()}</p>
    <p class="mb-4 text-gray-700 dark:text-gray-300">{m.guide_scheduling_3()}</p>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p class="mb-6 text-gray-700 dark:text-gray-300">{@html m.guide_scheduling_4()}</p>

    <!-- Rating buttons -->
    <Heading tag="h3" class="mb-3 text-lg font-semibold dark:text-white"
      >{m.guide_buttons_heading()}</Heading
    >
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p class="mb-4 text-gray-700 dark:text-gray-300">{@html m.guide_buttons_intro()}</p>

    <div class="mb-4 space-y-3">
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 inline-block shrink-0 rounded-lg bg-red-100 px-3 py-1 text-sm font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300"
          >{m.guide_btn_again_label()}</span
        >
        <p class="text-gray-700 dark:text-gray-300">{m.guide_btn_again_desc()}</p>
      </div>
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 inline-block shrink-0 rounded-lg bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
          >{m.guide_btn_hard_label()}</span
        >
        <p class="text-gray-700 dark:text-gray-300">{m.guide_btn_hard_desc()}</p>
      </div>
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 inline-block shrink-0 rounded-lg bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300"
          >{m.guide_btn_good_label()}</span
        >
        <p class="text-gray-700 dark:text-gray-300">{m.guide_btn_good_desc()}</p>
      </div>
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 inline-block shrink-0 rounded-lg bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          >{m.guide_btn_easy_label()}</span
        >
        <p class="text-gray-700 dark:text-gray-300">{m.guide_btn_easy_desc()}</p>
      </div>
    </div>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p class="mb-6 text-gray-700 dark:text-gray-300">{@html m.guide_buttons_outro()}</p>

    <!-- Card states -->
    <Heading tag="h3" class="mb-3 text-lg font-semibold dark:text-white"
      >{m.guide_states_heading()}</Heading
    >
    <div class="mb-4 space-y-3">
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 inline-block rounded-full bg-gray-200 px-3 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >{m.guide_state_new_label()}</span
        >
        <p class="text-gray-700 dark:text-gray-300">{m.guide_state_new_desc()}</p>
      </div>
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 inline-block rounded-full bg-yellow-100 px-3 py-0.5 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
          >{m.guide_state_learning_label()}</span
        >
        <p class="text-gray-700 dark:text-gray-300">{m.guide_state_learning_desc()}</p>
      </div>
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 inline-block rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300"
          >{m.guide_state_memorized_label()}</span
        >
        <p class="text-gray-700 dark:text-gray-300">{m.guide_state_memorized_desc()}</p>
      </div>
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 inline-block rounded-full bg-orange-100 px-3 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
          >{m.guide_state_forgotten_label()}</span
        >
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <p class="text-gray-700 dark:text-gray-300">{@html m.guide_state_forgotten_desc()}</p>
      </div>
    </div>

    <!-- Rating flow -->
    <Heading tag="h3" class="mb-3 text-lg font-semibold dark:text-white"
      >{m.guide_flow_heading()}</Heading
    >
    <p class="mb-4 text-gray-700 dark:text-gray-300">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html m.guide_flow_intro({
        memorized: `<span class="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">${m.guide_state_memorized_label()}</span>`,
        forgotten: `<span class="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">${m.guide_state_forgotten_label()}</span>`,
        learning: `<span class="inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">${m.guide_state_learning_label()}</span>`
      })}
    </p>
    <div class="mb-6 space-y-2 text-sm text-gray-700 dark:text-gray-300">
      <div class="flex items-baseline gap-2">
        <span
          class="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          >{m.guide_state_new_label()}</span
        >
        <span>{m.guide_flow_new()}</span>
      </div>
      <div class="flex items-baseline gap-2">
        <span
          class="shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
          >{m.guide_state_learning_label()}</span
        >
        <span>{m.guide_flow_learning()}</span>
      </div>
      <div class="flex items-baseline gap-2">
        <span
          class="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300"
          >{m.guide_state_memorized_label()}</span
        >
        <span>{m.guide_flow_memorized()}</span>
      </div>
      <div class="flex items-baseline gap-2">
        <span
          class="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
          >{m.guide_state_forgotten_label()}</span
        >
        <span>{m.guide_flow_forgotten()}</span>
      </div>
    </div>

    <div
      class="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-800 dark:bg-blue-900/20"
    >
      <p class="text-sm text-blue-700 dark:text-blue-300">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html m.guide_plus_tip()}
        <a href="/plus" class="font-semibold underline">{m.guide_plus_tip_link()}</a>
      </p>
    </div>
  </section>

  <!-- ── QUIZ ───────────────────────────────────────────────── -->
  <section id="quiz" class="mb-12 scroll-mt-20">
    <Heading tag="h2" class="mb-3 text-2xl font-semibold dark:text-white"
      >{m.guide_quiz_heading()}</Heading
    >
    <p class="mb-4 text-gray-700 dark:text-gray-300">{m.guide_quiz_intro()}</p>

    <div class="mb-4 space-y-3">
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 shrink-0 rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
          >MC</span
        >
        <p class="text-gray-700 dark:text-gray-300">{m.guide_quiz_mc()}</p>
      </div>
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 shrink-0 rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
          >{m.guide_quiz_fill_label()}</span
        >
        <p class="text-gray-700 dark:text-gray-300">{m.guide_quiz_fill()}</p>
      </div>
      <div class="flex items-start gap-3">
        <span
          class="mt-0.5 shrink-0 rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
          >{m.guide_quiz_type_label()}</span
        >
        <p class="text-gray-700 dark:text-gray-300">{m.guide_quiz_type()}</p>
      </div>
    </div>

    <p class="mb-4 text-gray-700 dark:text-gray-300">{m.guide_quiz_scheduling()}</p>

    <div
      class="rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-700 dark:bg-gray-800/50"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html m.guide_quiz_access()}
        <a href="/plus" class="font-semibold text-indigo-600 underline dark:text-indigo-400"
          >{m.guide_quiz_access_cta()}</a
        >
      </p>
    </div>
  </section>

  <!-- ── GRAMMAR ────────────────────────────────────────────── -->
  <section id="grammar" class="mb-12 scroll-mt-20">
    <Heading tag="h2" class="mb-3 text-2xl font-semibold dark:text-white"
      >{m.guide_grammar_heading()}</Heading
    >
    <p class="mb-4 text-gray-700 dark:text-gray-300">{m.guide_grammar_intro()}</p>

    <div class="mb-4 space-y-2">
      <div class="flex items-start gap-3">
        <span class="mt-0.5 shrink-0 text-base">→</span>
        <p class="text-gray-700 dark:text-gray-300">{m.guide_grammar_type_fill()}</p>
      </div>
      <div class="flex items-start gap-3">
        <span class="mt-0.5 shrink-0 text-base">→</span>
        <p class="text-gray-700 dark:text-gray-300">{m.guide_grammar_type_order()}</p>
      </div>
      <div class="flex items-start gap-3">
        <span class="mt-0.5 shrink-0 text-base">→</span>
        <p class="text-gray-700 dark:text-gray-300">{m.guide_grammar_type_transform()}</p>
      </div>
    </div>

    <p class="mb-4 text-gray-700 dark:text-gray-300">{m.guide_grammar_rule()}</p>

    <div
      class="rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-700 dark:bg-gray-800/50"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html m.guide_grammar_access()}
        <a href="/plus" class="font-semibold text-indigo-600 underline dark:text-indigo-400"
          >{m.guide_grammar_access_cta()}</a
        >
      </p>
    </div>
  </section>

  <!-- ── NORSKPRØVEN ────────────────────────────────────────── -->
  <section id="norskproven" class="mb-12 scroll-mt-20">
    <Heading tag="h2" class="mb-3 text-2xl font-semibold dark:text-white"
      >{m.guide_norskproven_heading()}</Heading
    >
    <p class="mb-4 text-gray-700 dark:text-gray-300">{m.guide_norskproven_what()}</p>
    <p class="mb-4 text-gray-700 dark:text-gray-300">{m.guide_norskproven_how()}</p>

    <div class="mb-4 space-y-2">
      <div class="flex items-start gap-3">
        <span class="mt-0.5 shrink-0 text-base">📖</span>
        <p class="text-gray-700 dark:text-gray-300">{m.guide_norskproven_reading()}</p>
      </div>
      <div class="flex items-start gap-3">
        <span class="mt-0.5 shrink-0 text-base">✍️</span>
        <p class="text-gray-700 dark:text-gray-300">{m.guide_norskproven_writing()}</p>
      </div>
      <div class="flex items-start gap-3">
        <span class="mt-0.5 shrink-0 text-base">🗣️</span>
        <p class="text-gray-700 dark:text-gray-300">{m.guide_norskproven_oral()}</p>
      </div>
    </div>

    <div
      class="rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 dark:border-gray-700 dark:bg-gray-800/50"
    >
      <p class="text-sm text-gray-600 dark:text-gray-400">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html m.guide_norskproven_access()}
        <a href="/plus" class="font-semibold text-indigo-600 underline dark:text-indigo-400"
          >{m.guide_norskproven_access_cta()}</a
        >
      </p>
    </div>
  </section>

  <!-- ── FLASHCARD LANGUAGE NOTE ───────────────────────────── -->
  <section class="mb-12">
    <Heading tag="h2" class="mb-3 text-2xl font-semibold dark:text-white"
      >{m.guide_lang_heading()}</Heading
    >
    <p class="mb-3 text-gray-700 dark:text-gray-300">{m.guide_lang_intro()}</p>
    <p class="text-gray-700 dark:text-gray-300">{m.guide_lang_change()}</p>
  </section>

  <!-- ── FAQ ───────────────────────────────────────────────── -->
  <section id="faq" class="scroll-mt-20">
    <Heading tag="h2" class="mb-6 text-2xl font-semibold dark:text-white"
      >{m.guide_faq_heading()}</Heading
    >

    <div class="space-y-6">
      <div>
        <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_freeplus_q()}</p>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {m.guide_faq_freeplus_a_v2()}
          <a href="/plus" class="underline">{m.guide_faq_freeplus_cta()}</a>
        </p>
      </div>

      <div>
        <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_norskproven_q()}</p>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{m.guide_faq_norskproven_a()}</p>
      </div>

      <div>
        <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_reminder_q()}</p>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{m.guide_faq_reminder_a()}</p>
      </div>

      <div>
        <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_no_reminder_q()}</p>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{m.guide_faq_no_reminder_a()}</p>
      </div>

      <div>
        <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_emails_q()}</p>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{m.guide_faq_emails_a()}</p>
      </div>

      <div>
        <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_sync_q()}</p>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {m.guide_faq_sync_a()}
          <a href="/plus" class="underline">{m.guide_faq_sync_cta()}</a>
        </p>
      </div>

      <div>
        <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_offline_q()}</p>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{m.guide_faq_offline_a()}</p>
      </div>

      <div>
        <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_prefs_q()}</p>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{m.guide_faq_prefs_a()}</p>
      </div>

      <div>
        <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_download_q()}</p>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {m.guide_faq_download_a()}
          <span
            class="ml-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
            >✶ Plus</span
          >
        </p>
      </div>

      <div>
        <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_contact_q()}</p>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {m.guide_faq_contact_a()}
          <span
            class="ml-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
            >✶ Plus</span
          >
        </p>
      </div>
    </div>
  </section>

  <!-- Volunteer note -->
  <div class="mt-12 border-t border-gray-200 pt-8 dark:border-gray-700">
    <p class="text-sm text-gray-500 dark:text-gray-400">{m.guide_volunteer_note()}</p>
  </div>
</div>
