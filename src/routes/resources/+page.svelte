<script lang="ts">
  import { page } from '$app/state';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const user = $derived(page.data.user);
  const webPageSchemaJson = $derived(JSON.stringify(data.webPageSchema));

  const sections = [
    {
      icon: '🗣️',
      title: 'Norsktrening',
      description: 'Free in-person and online conversation practice with volunteers.',
      color: {
        badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
        heading: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-800',
        hover: 'hover:border-rose-400 dark:hover:border-rose-600'
      },
      resources: [
        {
          name: 'Røde Kors Norsktrening',
          description:
            'Free conversation groups in Oslo, Bergen, Trondheim, Tromsø & Kristiansand.',
          href: 'https://www.rodekors.no/tilbudene/norsktrening/'
        },
        {
          name: 'Røde Kors Online',
          description: 'Join a digital norsktrening session from anywhere in Norway.',
          href: 'https://oslo.norsktrening.rodekors.no/pamelding/digital/norsktrening'
        },
        {
          name: 'Caritas Norge',
          description: 'Free language café and conversation practice in Oslo.',
          href: 'https://caritas.no/kurs/norsktrening-2/'
        },
        {
          name: 'KIA Norge',
          description: 'Språkkafé in Oslo — informal drop-in conversation practice.',
          href: 'https://www.kianorge.no/aktivitet/sprakkafe-i-oslo-tullinsgate'
        }
      ]
    },
    {
      icon: '💻',
      title: 'Online Learning',
      description:
        'Free structured Norwegian courses from NTNU — ideal for A1 to B1 learners and Norskprøven candidates.',
      color: {
        badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
        heading: 'text-violet-700 dark:text-violet-400',
        border: 'border-violet-200 dark:border-violet-800',
        hover: 'hover:border-violet-400 dark:hover:border-violet-600'
      },
      resources: [
        {
          name: 'Learn Norwegian Now (NTNU)',
          description: 'Free beginner Norwegian course from NTNU. Great for A1–A2.',
          href: 'https://www.ntnu.edu/learnnow/'
        },
        {
          name: 'Learn Norwegian Now 2 (NTNU)',
          description: 'Continuation course for intermediate learners. Targets A2–B1.',
          href: 'https://www.ntnu.edu/learnnow2-hs/'
        }
      ]
    },
    {
      icon: '📖',
      title: 'Reading',
      description: 'Simplified Norwegian texts and easy-reader books for language learners.',
      color: {
        badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
        heading: 'text-teal-700 dark:text-teal-400',
        border: 'border-teal-200 dark:border-teal-800',
        hover: 'hover:border-teal-400 dark:hover:border-teal-600'
      },
      resources: [
        {
          name: 'Lesnorsk',
          description: 'Short graded reading texts by Sissel Ofstad. Perfect for beginners.',
          href: 'https://lesnorsk.no/'
        },
        {
          name: 'Klar Tale',
          description: 'Norwegian news written in plain, simple language. Great for A2–B1.',
          href: 'https://www.klartale.no/'
        },
        {
          name: 'Deichman — Lettlest',
          description: "Easy-reader books for adults from Oslo's public library catalogue.",
          href: 'https://deichman.no/sok/form:%20%22Lettlest%2C%20enkelt%20innhold%22?language=languages_Norsk+%28bokm%C3%A5l%29&audience=work.audiences_Voksne'
        },
        {
          name: 'Barnebøker for Norge',
          description: "Norwegian children's books — simple vocabulary and short sentences.",
          href: 'https://barneboker.no/'
        }
      ]
    },
    {
      icon: '🃏',
      title: 'Vocabulary & Flashcards',
      description: 'Extra flashcard tools to supplement your Norskeord practice.',
      color: {
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        heading: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        hover: 'hover:border-amber-400 dark:hover:border-amber-600'
      },
      resources: [
        {
          name: 'norskflashcards.no',
          description: 'Flashcard sets for Norwegian vocabulary, organised by topic.',
          href: 'https://norskflashcards.no/'
        },
        {
          name: 'kids-flashcards.com',
          description: 'Visual flashcards for everyday Norwegian words. Great for beginners.',
          href: 'https://kids-flashcards.com/no'
        }
      ]
    },
    {
      icon: '🎧',
      title: 'Listening',
      description: 'Podcasts and YouTube channels made for Norwegian learners.',
      color: {
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        heading: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        hover: 'hover:border-blue-400 dark:hover:border-blue-600'
      },
      resources: [
        {
          name: 'Lær norsk nå',
          description: 'Podcast with slow, clear Norwegian speech. Ideal for A2–B1 listeners.',
          href: 'https://laernorsknaa.com/'
        },
        {
          name: 'Norsklærer Karense',
          description: 'YouTube channel with grammar tips and listening practice in Norwegian.',
          href: 'https://www.youtube.com/@NorsklrerKarense'
        },
        {
          name: 'Lingu — Norskpodden',
          description: 'Norwegian podcast for learners with transcripts and vocabulary help.',
          href: 'https://lingu.no/norskpodden'
        }
      ]
    },
    {
      icon: '📝',
      title: 'Grammar',
      description:
        'Reference guides covering Norwegian grammar rules and structures — including key Norskprøven grammar topics.',
      color: {
        badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
        heading: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
        hover: 'hover:border-orange-400 dark:hover:border-orange-600'
      },
      resources: [
        {
          name: 'Lenoo: Norwegian Grammar',
          description: 'Clear, structured grammar reference covering all core Norwegian rules.',
          href: 'https://www.lenoo.no/norwegian-grammar'
        }
      ]
    },
    {
      icon: '📚',
      title: 'Dictionaries',
      description: 'Official Norwegian dictionaries — free and authoritative.',
      color: {
        badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
        heading: 'text-green-700 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800',
        hover: 'hover:border-green-400 dark:hover:border-green-600'
      },
      resources: [
        {
          name: 'Ordbøkene.no',
          description: 'Official Norwegian dictionaries (Bokmål & Nynorsk) from Språkrådet.',
          href: 'https://ordbokene.no/'
        },
        {
          name: 'NAOB',
          description: "The Norwegian Academy's comprehensive Bokmål dictionary.",
          href: 'https://naob.no/'
        }
      ]
    }
  ];
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html '<scr' + 'ipt type="application/ld+json">' + webPageSchemaJson + '</scr' + 'ipt>'}
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10 text-left">
  <!-- ── Hero ──────────────────────────────────────────────────────────────── -->
  <div class="mb-10">
    <h1 class="text-4xl leading-tight font-bold dark:text-white">Norwegian Learning Resources</h1>
    <p class="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
      A curated collection of free tools, courses, and communities to help you learn Norwegian —
      organised by skill, from A1 beginner to B2 and Norskprøven preparation.
    </p>
  </div>

  <!-- ── Sections ──────────────────────────────────────────────────────────── -->
  {#each sections as section (section.title)}
    <div class="mb-10">
      <div class="mb-1 flex items-center gap-3">
        <span class="text-2xl">{section.icon}</span>
        <h2 class="text-2xl font-bold {section.color.heading}">{section.title}</h2>
        <span class="rounded-full {section.color.badge} px-2.5 py-0.5 text-xs font-semibold"
          >Free</span
        >
      </div>
      <p class="mb-5 text-sm text-gray-500 dark:text-gray-400">{section.description}</p>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {#each section.resources as resource (resource.name)}
          <a
            href={resource.href}
            target="_blank"
            rel="noopener noreferrer"
            class="group flex items-start justify-between rounded-xl border {section.color
              .border} {section.color
              .hover} bg-white p-4 transition-all hover:shadow-md dark:bg-indigo-950/60"
          >
            <div>
              <p
                class="font-semibold text-gray-800 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400"
              >
                {resource.name}
              </p>
              <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-400">{resource.description}</p>
            </div>
            <span
              class="mt-0.5 ml-3 shrink-0 text-gray-300 group-hover:text-blue-400 dark:text-gray-600"
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
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Know a great free resource that's missing?
      {#if user}
        Send us a message from <a
          href="/my-profile"
          class="text-blue-500 underline hover:text-blue-700 dark:hover:text-blue-300">My Profile</a
        > and we'll add it.
      {:else}
        <a
          href="/auth/login"
          class="text-blue-500 underline hover:text-blue-700 dark:hover:text-blue-300">Sign in</a
        > to send us a suggestion.
      {/if}
    </p>
  </div>
</div>
