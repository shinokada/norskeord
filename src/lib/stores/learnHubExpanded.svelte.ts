/**
 * Shared reactive "Show more" expand state for the /learn/[level] hub.
 *
 * The hub page's grammarExpanded/blogExpanded/vocabExpanded/uttrykkExpanded
 * flags used to live as local $state in +page.svelte, backed by a SvelteKit
 * `snapshot` so browser back/forward restored them. That only covers actual
 * history traversal, though — clicking a level link in the main nav (or any
 * regular forward navigation) tears down and remounts the page component, so
 * the flags always reset to their initial `false`. A visitor who expands
 * Uttrykk, studies a theme via the flashcard prev/next nav, then clicks "B1"
 * in the main menu to come back sees "Show more" again even though they
 * never really left the level.
 *
 * Keeping the flags here instead — a module-level store — means they
 * survive any client-side navigation for the lifetime of the page session
 * (reset only on a full page reload, which is an acceptable/expected reset
 * point). Keyed by level since each level's hub has its own independent
 * expand state.
 *
 * Usage:
 *   import { learnHubExpanded } from '$lib/stores/learnHubExpanded.svelte';
 *
 *   let uttrykkExpanded = $derived(learnHubExpanded.get('uttrykk', data.level));
 *   // ...
 *   onclick={() => learnHubExpanded.toggle('uttrykk', data.level)}
 */

export type LearnHubSection = 'grammar' | 'blog' | 'vocab' | 'uttrykk';

function createLearnHubExpandedStore() {
  const state = $state<Record<LearnHubSection, Record<string, boolean>>>({
    grammar: {},
    blog: {},
    vocab: {},
    uttrykk: {}
  });

  function get(section: LearnHubSection, level: string): boolean {
    return state[section][level] ?? false;
  }

  function set(section: LearnHubSection, level: string, value: boolean) {
    state[section][level] = value;
  }

  function toggle(section: LearnHubSection, level: string) {
    state[section][level] = !get(section, level);
  }

  return { get, set, toggle };
}

export const learnHubExpanded = createLearnHubExpandedStore();
