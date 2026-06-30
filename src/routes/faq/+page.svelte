<script>
  import * as m from '$lib/paraglide/messages.js';
  const faqs = [
    {
      id: 1,
      question: m.guide_faq_freeplus_q(),
      answer: m.guide_faq_freeplus_a_v2(),
      cta: {
        href: '/plus',
        text: m.guide_faq_freeplus_cta()
      }
    },
    {
      id: 2,
      question: m.guide_faq_norskproven_q(),
      answer: m.guide_faq_norskproven_a()
    },
    {
      id: 3,
      question: m.guide_faq_reminder_q(),
      answer: m.guide_faq_reminder_a()
    },
    {
      id: 4,
      question: m.guide_faq_no_reminder_q(),
      answer: m.guide_faq_no_reminder_a()
    },
    {
      id: 5,
      question: m.guide_faq_emails_q(),
      answer: m.guide_faq_emails_a()
    },
    {
      id: 6,
      question: m.guide_faq_sync_q(),
      answer: m.guide_faq_sync_a(),
      cta: {
        href: '/plus',
        text: m.guide_faq_sync_cta()
      }
    },
    {
      id: 7,
      question: m.guide_faq_offline_q(),
      answer: m.guide_faq_offline_a()
    },
    {
      id: 8,
      question: m.guide_faq_prefs_q(),
      answer: m.guide_faq_prefs_a()
    },
    {
      id: 9,
      question: m.guide_faq_download_q(),
      answer: m.guide_faq_download_a(),
      badge: m.faq_badge_plus()
    },
    {
      id: 10,
      question: m.guide_faq_contact_q(),
      answer: m.guide_faq_contact_a(),
      cta: {
        href: '/contact',
        text: m.nav_contact()
      }
    }
  ];
</script>

<div class="mx-auto max-w-3xl px-4 py-10 text-left">
  <h1 class="mb-2">{m.guide_faq_heading()}</h1>
  <p class="mb-10 text-gray-600 dark:text-gray-300">
    {m.faq_page_subtitle()}
  </p>

  <div class="space-y-6">
    {#each faqs as faq (faq.id)}
      <div>
        <p class="font-semibold text-gray-800 dark:text-gray-100">
          {faq.question}
        </p>

        <p class="mt-1 text-base text-gray-600 dark:text-gray-300">
          {faq.answer}

          {#if faq.cta}
            <a href={faq.cta.href} class="underline">
              {faq.cta.text}
            </a>
          {/if}

          {#if faq.badge}
            <span
              class="ml-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
            >
              {faq.badge}
            </span>
          {/if}
        </p>
      </div>
    {/each}
  </div>
</div>
