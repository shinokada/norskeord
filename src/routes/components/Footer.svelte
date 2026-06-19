<script module lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  declare const __VERSION__: string;
  const learnPages = [{name:'A1',link:'/learn/a1'}, {name:'A2',link:'/learn/a2'}, {name:'B1',link:'/learn/b1'}, {name:'B2',link:'/learn/b2'}, {name:'C',link:'/learn/c'}, {name:'Grammar',link:'/grammar'}, {name:'Quiz',link:'/quiz'}, {name:'Norskprøven',link:'/norskproven'}];
  const resourcesPages = [{name:'Blog',link:'/blog'}, {name:'My stats',link:'/stats'}, {name:'Plus',link:'/plus'}, {name:'Guide',link:'/guide'}];
</script>

<footer class="border-t border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-blue-950">
  <div class="mx-auto max-w-4xl px-4">
    <div class="grid grid-cols-2 gap-8 sm:grid-cols-4">
      <!-- Brand -->
      <div class="col-span-2 sm:col-span-1">
        <a href="/" class="text-base font-bold text-gray-900 dark:text-white">{m.norskeord()} </a>
        <p class="mt-1 text-xs text-gray-800 dark:text-gray-300">
           {m.home_hero_badge()}
        </p>
        <p class="mt-3 text-xs text-gray-800 dark:text-gray-300">v{__VERSION__}</p>
      </div>

      <!-- Learn -->
      <div>
        <p
          class="mb-3 text-xs font-semibold tracking-widest text-gray-800 uppercase dark:text-gray-200"
        >
          Learn
        </p>
        <ul class="space-y-2">
          {#each learnPages as page (page.name)}
          <li>
            <a
              href={page.link}
              class="text-sm text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
              >{page.name}</a
            >
          </li>
          {/each}
        </ul>
      </div>

      <!-- Resources -->
      <div>
        <p
          class="mb-3 text-xs font-semibold tracking-widest text-gray-800 uppercase dark:text-gray-200"
        >
          Resources
        </p>
        <ul class="space-y-2">
        {#each resourcesPages as page (page.name)}
          <li>
            <a
              href="{page.link}"
              class="text-sm text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
              >{page.name}</a
            >
          </li>
          {/each}
        </ul>
      </div>
    </div>

    <p class="mt-8 text-xs text-gray-700 dark:text-gray-300">
      © {new Date().getFullYear()} Norskeord
    </p>
  </div>
</footer>
