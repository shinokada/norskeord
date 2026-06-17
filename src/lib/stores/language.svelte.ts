import { LANGUAGES } from '$lib/config';
import { type Language } from '$lib/types';

const STORAGE_KEY = 'norskeord-language';

function createLanguageStore() {
  let stored: Language | null = null;
  if (typeof localStorage !== 'undefined') {
    try {
      stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    } catch (e) {
      console.warn('Failed to read language preference from localStorage:', e);
    }
  }

  // Guard against stale or invalid stored values
  const initial: Language = stored && stored in LANGUAGES ? stored : 'english';

  let current = $state<Language>(initial);

  return {
    get current() {
      return current;
    },
    set(lang: Language) {
      current = lang;
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, lang);
        } catch (e) {
          console.warn('Failed to save language preference to localStorage:', e);
        }
      }
    }
  };
}

export const languageStore = createLanguageStore();
