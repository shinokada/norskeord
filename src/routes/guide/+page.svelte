<script>
  import { Heading } from 'flowbite-svelte';
  import * as m from '$lib/paraglide/messages.js';

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
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
        name: 'What is the difference between Free and Plus?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Free gives you all A1 and A2 vocabulary plus a preview of B1/B2. Plus unlocks all levels (B1–C2), smart Due today scheduling, cross-device sync, quiz mode, and lesson emails.'
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
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html '<scr' + 'ipt type="application/ld+json">' + faqSchemaJson + '</scr' + 'ipt>'}
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-12 text-left">
  <Heading tag="h1" class="mb-2 text-4xl font-bold dark:text-white">{m.guide_page_title()}</Heading>
  <p class="mb-8 text-gray-500 dark:text-gray-400">
    {m.guide_page_subtitle()}
  </p>

  <p class="mb-6 text-gray-700 dark:text-gray-300">
    {m.guide_intro_1()}
  </p>

  <p class="mb-10 text-gray-700 dark:text-gray-300">
    {m.guide_intro_2()}
  </p>

  <!-- Smart scheduling section -->
  <Heading tag="h2" class="mb-3 text-2xl font-semibold dark:text-white"
    >{m.guide_scheduling_heading()}</Heading
  >

  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  <p class="mb-4 text-gray-700 dark:text-gray-300">{@html m.guide_scheduling_1()}</p>
  <p class="mb-4 text-gray-700 dark:text-gray-300">{m.guide_scheduling_2()}</p>
  <p class="mb-4 text-gray-700 dark:text-gray-300">{m.guide_scheduling_3()}</p>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  <p class="mb-10 text-gray-700 dark:text-gray-300">{@html m.guide_scheduling_4()}</p>

  <!-- Rating buttons -->
  <Heading tag="h2" class="mb-3 text-2xl font-semibold dark:text-white"
    >{m.guide_buttons_heading()}</Heading
  >

  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  <p class="mb-6 text-gray-700 dark:text-gray-300">{@html m.guide_buttons_intro()}</p>

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
  <p class="mb-10 text-gray-700 dark:text-gray-300">{@html m.guide_buttons_outro()}</p>

  <!-- Card states -->
  <Heading tag="h2" class="mb-3 text-2xl font-semibold dark:text-white"
    >{m.guide_states_heading()}</Heading
  >

  <div class="mb-6 space-y-3">
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

  <div class="mb-10 space-y-2 text-sm text-gray-700 dark:text-gray-300">
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

  <!-- FAQ -->
  <Heading tag="h2" class="mt-12 mb-6 text-2xl font-semibold dark:text-white"
    >{m.guide_faq_heading()}</Heading
  >

  <div class="space-y-6">
    <div>
      <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_reminder_q()}</p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{m.guide_faq_reminder_a()}</p>
    </div>

    <div>
      <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_no_reminder_q()}</p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{m.guide_faq_no_reminder_a()}</p>
    </div>

    <div>
      <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_emails_q()}</p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{m.guide_faq_emails_a()}</p>
    </div>

    <div>
      <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_sync_q()}</p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {m.guide_faq_sync_a()}
        <a href="/plus" class="underline">{m.guide_faq_sync_cta()}</a>
      </p>
    </div>

    <div>
      <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_offline_q()}</p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{m.guide_faq_offline_a()}</p>
    </div>

    <div>
      <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_freeplus_q()}</p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {m.guide_faq_freeplus_a()}
        <a href="/plus" class="underline">{m.guide_faq_freeplus_cta()}</a>
      </p>
    </div>

    <div>
      <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_prefs_q()}</p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{m.guide_faq_prefs_a()}</p>
    </div>

    <div>
      <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_download_q()}</p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {m.guide_faq_download_a()}
        <span
          class="ml-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
          >✶ Plus</span
        >
      </p>
    </div>

    <div>
      <p class="font-semibold text-gray-800 dark:text-gray-100">{m.guide_faq_contact_q()}</p>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {m.guide_faq_contact_a()}
        <span
          class="ml-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
          >✶ Plus</span
        >
      </p>
    </div>
  </div>
</div>
