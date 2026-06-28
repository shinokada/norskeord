/**
 * Shared reactive locale store.
 *
 * Both the nav language button and PreferencesSection import `localeStore`
 * so they always reflect the same value and stay in sync with each other.
 *
 * Usage:
 *   import { localeStore } from '$lib/localeStore.svelte';
 *
 *   // Read
 *   localeStore.current   // 'en' | 'nb'
 *
 *   // Write (updates paraglide + localStorage + the store atomically)
 *   localeStore.set('nb');
 */
import { getLocale, setLocale } from '$lib/paraglide/runtime';
import { LANGUAGES } from '$lib/config';

export type Locale = (typeof LANGUAGES)[keyof typeof LANGUAGES]['code']; // 'nb' | 'en' | 'es' | 'uk'

function createLocaleStore() {
  let current = $state<Locale>(getLocale() as Locale);

  function set(next: Locale, options?: { reload?: boolean }) {
    current = next;
    localStorage.setItem('locale', next);
    setLocale(next as Parameters<typeof setLocale>[0], { reload: options?.reload ?? false });
  }

  function init() {
    const saved = localStorage.getItem('locale');
    if (saved && Object.values(LANGUAGES).some((l) => l.code === saved)) {
      set(saved as Locale, { reload: false });
    }
  }

  return {
    get current() {
      return current;
    },
    set,
    init
  };
}

export const localeStore = createLocaleStore();
