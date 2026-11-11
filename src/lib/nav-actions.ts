/**
 * Account and language actions shared by the desktop `Nav` and the small-screen `MoreMenu`
 * (ai-docs/implementation/mobile-web-shell.md, Phase 5). They were methods of `Nav.svelte`; both
 * places call these so the behaviour cannot drift apart.
 */
import { authStore } from '$lib/stores/auth.svelte';
import { languageStore } from '$lib/stores/language.svelte';
import { localeStore, type Locale } from '$lib/localeStore.svelte';
import { parkForLogout } from '$lib/parked-progress';
import { LANGUAGES, FLASHCARD_LANGUAGES } from '$lib/config';
import type { FlashcardLanguage } from '$lib/types';

/**
 * Log out and go to the home page with a full reload.
 *
 * Parks this account's local progress instead of deleting it: leftovers of a failed free to Plus
 * migration and a free user's progress come back at the next login of the same account, and nobody
 * else can read them (ai-docs/implementation/logout-progress-parking.md).
 */
export async function logout(userId: string | undefined): Promise<void> {
  parkForLogout(userId);
  authStore.reset();
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/';
}

/**
 * Switch the interface language. Also moves the flashcard translation language to the same
 * language, and saves the choice to the profile when someone is signed in.
 */
export async function switchLocale(code: Locale, signedIn: boolean): Promise<void> {
  if (code === localeStore.current) return;
  localeStore.set(code);
  // Keep the flashcard translation language in sync with the chosen locale.
  // Look up the language key (e.g. 'spanish') whose code matches (e.g. 'es').
  const matchedLang = Object.entries(LANGUAGES).find(([, v]) => v.code === code)?.[0] as
    FlashcardLanguage | undefined;
  if (matchedLang && matchedLang in FLASHCARD_LANGUAGES) {
    languageStore.set(matchedLang);
  }
  if (signedIn) {
    try {
      await fetch('/api/profile/language', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: code })
      });
    } catch {
      console.warn('[nav-actions] Failed to persist locale to profile');
    }
  }
}
