<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const webPageSchemaJson = $derived(JSON.stringify(data.webPageSchema));

  const sections = $derived([
    {
      icon: '🗣️',
      title: m.resources_section_norsktrening(),
      color: {
        badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
        heading: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-800',
        hover: 'hover:border-rose-400 dark:hover:border-rose-600'
      },
      resources: [
        { name: 'Røde Kors Norsktrening', href: 'https://www.rodekors.no/tilbudene/norsktrening/' },
        {
          name: 'Røde Kors Online',
          href: 'https://oslo.norsktrening.rodekors.no/pamelding/digital/norsktrening'
        },
        { name: 'Caritas Norge', href: 'https://caritas.no/kurs/norsk-sprakkafe-2/' },
        {
          name: 'KIA Norge',
          href: 'https://www.kianorge.no/aktivitet/sprakkafe-i-oslo-tullinsgate'
        }
      ]
    },
    {
      icon: '💻',
      title: m.resources_section_online_learning(),
      color: {
        badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
        heading: 'text-violet-700 dark:text-violet-400',
        border: 'border-violet-200 dark:border-violet-800',
        hover: 'hover:border-violet-400 dark:hover:border-violet-600'
      },
      resources: [
        { name: 'Learn Norwegian Now (NTNU)', href: 'https://www.ntnu.edu/learnnow/' },
        { name: 'Learn Norwegian Now 2 (NTNU)', href: 'https://www.ntnu.edu/learnnow2-hs/' }
      ]
    },
    {
      icon: '📖',
      title: m.resources_section_reading(),
      color: {
        badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
        heading: 'text-teal-700 dark:text-teal-400',
        border: 'border-teal-200 dark:border-teal-800',
        hover: 'hover:border-teal-400 dark:hover:border-teal-600'
      },
      resources: [
        { name: 'Lesnorsk', href: 'https://lesnorsk.no/' },
        { name: 'Klar Tale', href: 'https://www.klartale.no/' },
        {
          name: 'Deichman — Lettlest',
          href: 'https://deichman.no/sok/form:%20%22Lettlest%2C%20enkelt%20innhold%22?language=languages_Norsk+%28bokm%C3%A5l%29&audience=work.audiences_Voksne'
        },
        { name: 'Barnebøker for Norge', href: 'https://barneboker.no/' }
      ]
    },
    {
      icon: '🃏',
      title: m.resources_section_vocab_flashcards(),
      color: {
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        heading: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        hover: 'hover:border-amber-400 dark:hover:border-amber-600'
      },
      resources: [
        { name: 'norskflashcards.no', href: 'https://norskflashcards.no/' },
        { name: 'kids-flashcards.com', href: 'https://kids-flashcards.com/no' }
      ]
    },
    {
      icon: '🎧',
      title: m.resources_section_listening(),
      color: {
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        heading: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        hover: 'hover:border-blue-400 dark:hover:border-blue-600'
      },
      resources: [
        { name: 'Lær norsk nå', href: 'https://laernorsknaa.com/' },
        { name: 'Norsklærer Karense', href: 'https://www.youtube.com/@NorsklrerKarense' },
        { name: 'Lingu — Norskpodden', href: 'https://lingu.no/norskpodden' }
      ]
    },
    {
      icon: '📝',
      title: m.resources_section_grammar(),
      color: {
        badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
        heading: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
        hover: 'hover:border-orange-400 dark:hover:border-orange-600'
      },
      resources: [
        { name: 'Lenoo: Norwegian Grammar', href: 'https://www.lenoo.no/norwegian-grammar' }
      ]
    },
    {
      icon: '📚',
      title: m.resources_section_dictionaries(),
      color: {
        badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
        heading: 'text-green-700 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
        hover: 'hover:border-green-400 dark:hover:border-green-600'
      },
      resources: [
        { name: 'Ordbøkene.no', href: 'https://ordbokene.no/' },
        { name: 'NAOB', href: 'https://naob.no/' }
      ]
    }
  ]);
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html '<scr' + 'ipt type="application/ld+json">' + webPageSchemaJson + '</scr' + 'ipt>'}
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10 text-left">
  <!-- ── Hero ──────────────────────────────────────────────────────────────── -->
  <div class="mb-10">
    <h1 class="leading-tight dark:text-white">{m.resources_hero_heading()}</h1>
    <p class="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
      {m.resources_hero_subheading()}
    </p>
  </div>

  <!-- ── Sections ──────────────────────────────────────────────────────────── -->
  {#each sections as section (section.title)}
    <div class="mb-10">
      <div class="mb-4 flex items-center gap-3">
        <span class="text-2xl">{section.icon}</span>
        <h2 class={section.color.heading}>{section.title}</h2>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {#each section.resources as resource (resource.name)}
          <a
            href={resource.href}
            target="_blank"
            rel="noopener noreferrer"
            class="group flex items-center justify-between rounded-xl border {section.color
              .border} {section.color
              .hover} bg-white p-4 transition-all hover:shadow-md dark:bg-indigo-950/60"
          >
            <p
              class="font-semibold text-gray-800 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400"
            >
              {resource.name}
            </p>
            <span class="ml-3 shrink-0 text-gray-700 group-hover:text-blue-400 dark:text-gray-300"
              >↗</span
            >
          </a>
        {/each}
      </div>
    </div>
  {/each}

  <!-- ── Footer note ───────────────────────────────────────────────────────── -->
  <div
    class="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/40"
  >
    <p class="text-sm text-gray-600 dark:text-gray-300">
      {m.resources_footer_text_prefix()}
      <a
        href="/contact"
        class="text-blue-500 underline hover:text-blue-700 dark:hover:text-blue-300"
        >{m.resources_footer_contact_link()}</a
      >
      {m.resources_footer_text_suffix()}
    </p>
  </div>
</div>
