<script lang="ts">
  import { localeStore } from '$lib/localeStore.svelte';
  import '../app.css';
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { Runatics } from 'runatics';
  import { MetaTags, deepMerge } from 'runes-meta-tags';
  import { page } from '$app/state';
  import Nav from './components/Nav.svelte';
  import Footer from './components/Footer.svelte';
  import InAppBrowserBanner from './components/InAppBrowserBanner.svelte';
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

  // Prevent horizontal swipe-to-pan on Android PWA.
  // CSS overflow-x:hidden is ignored by the Android WebView in standalone mode,
  // so we block touchmove events whose horizontal component exceeds the vertical one.
  onMount(() => {
    let startX = 0;
    let startY = 0;

    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);

      if (dx > dy) {
        e.preventDefault();
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
    };
  });
</script>

<Runatics {analyticsId} />
<MetaTags {...metaTags} />

{#key localeStore.current}
  <Nav />

  <section class="border-b border-gray-300 pb-8 dark:border-gray-600">
    <div class="mx-auto max-w-7xl text-center">{@render children()}</div>
  </section>

  <Footer />
{/key}

<InAppBrowserBanner />
