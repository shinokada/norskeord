import { FLASHCARD_LANGUAGES } from '$lib/config';
import { type FlashcardLanguage } from '$lib/types';

const STORAGE_KEY = 'norskeord-language';

function createLanguageStore() {
  let stored: FlashcardLanguage | null = null;
  if (typeof localStorage !== 'undefined') {
    try {
      stored = localStorage.getItem(STORAGE_KEY) as FlashcardLanguage | null;
    } catch (e) {
      console.warn('Failed to read language preference from localStorage:', e);
    }
  }

  // Guard against stale or invalid stored values (e.g. 'norwegian')
  const initial: FlashcardLanguage = stored && stored in FLASHCARD_LANGUAGES ? stored : 'english';

  let current = $state<FlashcardLanguage>(initial);

  return {
    get current() {
      return current;
    },
    set(lang: FlashcardLanguage) {
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
