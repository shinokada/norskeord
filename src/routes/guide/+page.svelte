<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  type Path = {
    id: number;
    icon: string;
    label: () => string;
    desc: () => string;
    cta: () => string;
    href: string;
  };

  const paths: Path[] = [
    {
      id: 1,
      icon: '🇳🇴',
      label: m.guide_start_path_beginner_label,
      desc: m.guide_start_path_beginner_desc,
      cta: m.guide_start_path_beginner_cta,
      href: '/a1'
    },
    {
      id: 2,
      icon: '📋',
      label: m.guide_start_path_exam_label,
      desc: m.guide_start_path_exam_desc,
      cta: m.guide_start_path_exam_cta,
      href: '/norskproven'
    },
    {
      id: 3,
      icon: '🧠',
      label: m.guide_start_path_quiz_label,
      desc: m.guide_start_path_quiz_desc,
      cta: m.guide_start_path_quiz_cta,
      href: '/quiz'
    },
    {
      id: 4,
      icon: '✏️',
      label: m.guide_start_path_grammar_label,
      desc: m.guide_start_path_grammar_desc,
      cta: m.guide_start_path_grammar_cta,
      href: '/grammar'
    }
  ];

  const buttons = [
    {
      id: 1,
      label: m.guide_btn_again_label,
      desc: m.guide_btn_again_desc,
      classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    },
    {
      id: 2,
      label: m.guide_btn_hard_label,
      desc: m.guide_btn_hard_desc,
      classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
    },
    {
      id: 3,
      label: m.guide_btn_good_label,
      desc: m.guide_btn_good_desc,
      classes: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
    },
    {
      id: 4,
      label: m.guide_btn_easy_label,
      desc: m.guide_btn_easy_desc,
      classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    }
  ];
  // Anchor sections
  const sections = [
    { id: 'start', label: () => m.guide_anchor_start() },
    { id: 'flashcards', label: () => m.guide_anchor_flashcards() },
    { id: 'quiz', label: () => m.guide_anchor_quiz() },
    { id: 'grammar', label: () => m.guide_anchor_grammar() },
    { id: 'norskproven', label: () => m.guide_anchor_norskproven() }
  ];
  const h2class = 'mb-4';
  const h3class = 'mb-3';
</script>

<div class="mx-auto max-w-3xl px-4 py-10 text-left">
  <h1 class="mb-2 dark:text-white">{m.guide_page_title()}</h1>
  <p class="mb-6 text-gray-600 dark:text-gray-300">
    {m.guide_page_subtitle()}
  </p>

  <!-- Anchor nav -->
  <nav aria-label="Page sections" class="mb-10 flex flex-wrap gap-2">
    {#each sections as { id, label } (id)}
      <a
        href="#{id}"
        class="min-h-10 flex items-center rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
      >
        {label()}
      </a>
    {/each}
  </nav>

  <!-- ── WHERE TO START ─────────────────────────────────────── -->
  <section id="start" class="mb-12 scroll-mt-20">
    <h2 class={h2class}>{m.guide_start_heading()}</h2>
    <p class="mb-4 text-gray-700 dark:text-gray-300">{m.guide_start_intro()}</p>

    <div
      class="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
    >
      {#each paths as path (path.id)}
        <div class="flex items-start gap-3">
          <span class="mt-0.5 shrink-0 text-lg">{path.icon}</span>

          <p class="text-gray-700 dark:text-gray-300">
            <strong>{path.label()}</strong>
            {path.desc()}

            <a href={path.href} class="font-medium text-indigo-600 underline dark:text-indigo-400">
              {path.cta()}
            </a>
          </p>
        </div>
      {/each}
    </div>

    <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">{m.guide_start_note()}</p>
  </section>

  <!-- ── FLASHCARDS ─────────────────────────────────────────── -->
  <section id="flashcards" class="mb-12 scroll-mt-20">
    <h2 class={h2class}>{m.guide_flashcards_heading()}</h2>
    <p class="mb-4 text-gray-700 dark:text-gray-300">{m.guide_flashcards_intro()}</p>

    <!-- Smart scheduling -->
    <h3 class={h3class}>{m.guide_scheduling_heading()}</h3>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p class="mb-4 text-gray-700 dark:text-gray-300">{@html m.guide_scheduling_1()}</p>
    <p class="mb-4 text-gray-700 dark:text-gray-300">{m.guide_scheduling_2()}</p>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p class="mb-6 text-gray-700 dark:text-gray-300">{@html m.guide_scheduling_4()}</p>

    <!-- Rating buttons + Card states combined -->
    <h3 class={h3class}>{m.guide_buttons_heading()}</h3>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p class="mb-4 text-gray-700 dark:text-gray-300">{@html m.guide_buttons_intro()}</p>

    <div class="mb-4 space-y-3">
      {#each buttons as button (button.id)}
        <div class="flex items-start gap-3">
          <span
            class={`inline-block shrink-0 rounded-lg px-3 py-1 text-sm font-semibold ${button.classes}`}
          >
            {button.label()}
          </span>

          <p class="text-gray-700 dark:text-gray-300">
            {button.desc()}
          </p>
        </div>
      {/each}
    </div>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    <p class="mb-6 text-gray-700 dark:text-gray-300">{@html m.guide_buttons_outro()}</p>

    <!-- Card states -->
    <h3 class={h3class}>{m.guide_states_heading()}</h3>
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

    <div
      class="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-800 dark:bg-blue-900/20"
    >
      <p class="text-base text-blue-700 dark:text-blue-300">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html m.guide_plus_tip()}
        <a href="/plus" class="font-semibold underline">{m.guide_plus_tip_link()}</a>
      </p>
    </div>

    <!-- Language note (folded in) -->
    <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
      {m.guide_lang_intro()}
      {m.guide_lang_change()}
    </p>
  </section>

  <!-- ── QUIZ ───────────────────────────────────────────────── -->
  <section id="quiz" class="mb-12 scroll-mt-20">
    <h2 class={h2class}>{m.guide_quiz_heading()}</h2>
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
    <h2 class={h2class}>{m.guide_grammar_heading()}</h2>
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
    <h2 class={h2class}>{m.guide_norskproven_heading()}</h2>
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

  <div class="mt-4 border-t border-gray-200 pt-8 dark:border-gray-700">
    <p class="mb-2 text-base text-gray-600 dark:text-gray-300">
      {m.guide_questions_footer()}
      <a href="/faq" class="font-medium text-indigo-600 underline dark:text-indigo-400"
        >{m.guide_faq_link()}</a
      >
    </p>
  </div>
</div>
