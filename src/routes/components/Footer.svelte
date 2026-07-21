<script module lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  declare const __VERSION__: string;

  const learnLevels = [
    { name: 'A1', link: '/learn/a1' },
    { name: 'A2', link: '/learn/a2' },
    { name: 'B1', link: '/learn/b1' },
    { name: 'B2', link: '/learn/b2' },
    { name: 'C', link: '/learn/c' }
  ];

  const learnFeatures = [
    { name: () => m.nav_norskproven(), link: '/norskproven' },
    { name: () => m.nav_grammar(), link: '/grammar' },
    { name: () => m.nav_quiz(), link: '/quiz' },
    { name: () => m.nav_blog(), link: '/blog' }
  ];

  const accountPages = [
    { name: () => m.nav_my_stats(), link: '/stats' },
    { name: () => m.nav_my_profile(), link: '/my-profile' },
    { name: () => m.footer_contact(), link: '/contact' }
  ];

  const helpPages = [
    { name: () => m.nav_plus(), link: '/plus' },
    { name: () => m.nav_guide(), link: '/guide' },
    { name: () => m.nav_faq(), link: '/faq' },
    { name: () => m.nav_resources(), link: '/resources' }
  ];
</script>

<footer class="border-t border-gray-200 bg-white py-8 dark:border-gray-700 dark:bg-blue-950">
  <div class="mx-auto max-w-4xl px-4">
    <div class="grid grid-cols-2 gap-8 sm:grid-cols-5">
      <!-- Brand: 1 of 5 cols on desktop, full width on mobile -->
      <div class="col-span-2 sm:col-span-1">
        <a
          href="/"
          class="font-norse text-xl font-bold text-gray-900 visited:text-gray-900 dark:font-normal dark:text-white dark:visited:text-white"
          >{m.norskeord()}</a
        >
        <p class="mt-1 text-xs text-gray-800 dark:text-gray-300">
          {m.footer_tagline()}
        </p>
        <p class="mt-3 text-xs text-gray-800 dark:text-gray-300">v{__VERSION__}</p>
      </div>

      <!-- Level -->
      <div>
        <p
          class="font-norse mb-3 text-base font-bold tracking-widest text-gray-800 uppercase dark:font-normal dark:text-gray-200"
        >
          {m.footer_level()}
        </p>
        <ul class="space-y-2">
          {#each learnLevels as page (page.name)}
            <li>
              <a
                href={page.link}
                class="text-sm text-gray-800 visited:text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:visited:text-gray-200 dark:hover:text-white"
                >{page.name}</a
              >
            </li>
          {/each}
        </ul>
      </div>

      <!-- Learn -->
      <div>
        <p
          class="font-norse mb-3 text-base font-bold tracking-widest text-gray-800 uppercase dark:font-normal dark:text-gray-200"
        >
          {m.footer_learn()}
        </p>
        <ul class="space-y-2">
          {#each learnFeatures as page (page.name)}
            <li>
              <a
                href={page.link}
                class="text-sm text-gray-800 visited:text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:visited:text-gray-200 dark:hover:text-white"
                >{page.name()}</a
              >
            </li>
          {/each}
        </ul>
      </div>

      <!-- Account -->
      <div>
        <p
          class="font-norse mb-3 text-base font-bold tracking-widest text-gray-800 uppercase dark:font-normal dark:text-gray-200"
        >
          {m.footer_account()}
        </p>
        <ul class="space-y-2">
          {#each accountPages as page (page.name)}
            <li>
              <a
                href={page.link}
                class="text-sm text-gray-800 visited:text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:visited:text-gray-200 dark:hover:text-white"
                >{page.name()}</a
              >
            </li>
          {/each}
        </ul>
      </div>

      <!-- Help -->
      <div>
        <p
          class="font-norse mb-3 text-base font-bold tracking-widest text-gray-800 uppercase dark:font-normal dark:text-gray-200"
        >
          {m.nav_help()}
        </p>
        <ul class="space-y-2">
          {#each helpPages as page (page.name)}
            <li>
              <a
                href={page.link}
                class="text-sm text-gray-800 visited:text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:visited:text-gray-200 dark:hover:text-white"
                >{page.name()}</a
              >
            </li>
          {/each}
        </ul>
      </div>
    </div>

    <!-- Copyright with divider -->
    <div class="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
      <p class="text-xs text-gray-700 dark:text-gray-300">
        © {new Date().getFullYear()} Norskeord
      </p>
    </div>
  </div>
</footer>
