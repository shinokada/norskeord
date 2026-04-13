<script>
  import '../app.css';
  import { afterNavigate } from '$app/navigation';
  import { Runatics } from 'runatics';
  import { MetaTags, deepMerge } from 'runes-meta-tags';
  import { page } from '$app/state';
  import Nav from './components/Nav.svelte';
  import Footer from './components/Footer.svelte';
  import PwaUpdatePrompt from './components/PwaUpdatePrompt.svelte';
  import { validFlashcardPathPattern } from '$lib/utils';
  let { children, data } = $props();
  let metaTags = $derived(
    page.data.pageMetaTags
      ? deepMerge(page.data.layoutMetaTags, page.data.pageMetaTags)
      : data.layoutMetaTags
  );

  const analyticsId = $derived(data.ANALYTICS_ID_LANGUAGE_APP);

  // Persist last-visited page on in-app navigations only.
  // Using afterNavigate (not $effect) so cold-start at / never overwrites the stored path.
  afterNavigate(({ from, to }) => {
    if (from !== null && to?.url.pathname && validFlashcardPathPattern.test(to.url.pathname)) {
      localStorage.setItem('last-flashcard-path', to.url.pathname);
    }
  });
</script>

<Runatics {analyticsId} />
<MetaTags {...metaTags} />
<Nav />

<section class="overflow-x-hidden border-b border-gray-300 pb-8 dark:border-gray-600">
  <div class="mx-auto max-w-screen-xl px-4 text-center">
    {@render children()}
  </div>
</section>

<Footer />
<PwaUpdatePrompt />
