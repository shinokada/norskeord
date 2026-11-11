/**
 * Route classification for the small-screen app shell
 * (ai-docs/implementation/mobile-web-shell.md, Phase 1).
 *
 * Pure functions, no Svelte and no browser APIs, so they can run during SSR and prerendering.
 *
 * An allowlist, not a blocklist: a path that is not listed here is `site`, so a new route never
 * gets the shell by accident.
 */
import { LEVEL_ORDER } from '$lib/config';

/**
 * `tabs`: bottom tab bar, compact top bar, no footer (below `md`).
 * `session`: no bottom bar and no footer (a study session is on screen).
 * `site`: nothing changes (marketing, blog and utility pages).
 */
export type ShellMode = 'tabs' | 'session' | 'site';

export type ShellTab = 'learn' | 'grammar' | 'quiz' | 'progress' | 'profile';

const LEVELS: readonly string[] = LEVEL_ORDER;

function isLevel(segment: string | undefined): segment is string {
  return segment !== undefined && LEVELS.includes(segment);
}

/** Split a pathname into segments, ignoring a query, a hash and a trailing slash. */
function segmentsOf(pathname: string): string[] {
  if (typeof pathname !== 'string') return [];
  const path = pathname.split(/[?#]/)[0];
  return path.split('/').filter(Boolean);
}

/**
 * Which chrome a path gets. `/grammar/[topic]` and `/quiz` are `tabs` here; while their practice
 * session is on screen they hide the bar themselves through the shellSession store (Phase 4).
 */
export function shellMode(pathname: string): ShellMode {
  const segments = segmentsOf(pathname);
  const [first, second] = segments;
  const depth = segments.length;

  switch (first) {
    case undefined:
      return 'site';
    case 'learn':
      // There is no /learn page itself, only /learn/[level].
      return depth === 2 && isLevel(second) ? 'tabs' : 'site';
    case 'grammar':
      if (depth === 1) return 'tabs';
      if (second === 'chapter') return depth === 3 ? 'tabs' : 'site';
      return depth === 2 ? 'tabs' : 'site'; // /grammar/[topic]
    case 'quiz':
      return depth === 1 ? 'tabs' : 'site';
    case 'norskproven':
      // The hub is a browsing page; every test and practice page below it is a session.
      return depth === 1 ? 'tabs' : 'session';
    case 'my-progress':
      return depth === 1 || (depth === 2 && second === 'grammar') ? 'tabs' : 'site';
    case 'my-profile':
      return depth === 1 ? 'tabs' : 'site';
    case 'review':
      return depth === 1 || (depth === 2 && second === 'grammar') ? 'session' : 'site';
    default:
      // Flashcards: /{level}/{category}, and /c/uttrykk. Level slugs are matched literally so an
      // unrelated two-segment path (for example /blog/x) does not get the session mode.
      return isLevel(first) && depth === 2 ? 'session' : 'site';
  }
}

/** The tab to highlight, or `null` when the path belongs to none of the five. */
export function activeTab(pathname: string): ShellTab | null {
  switch (segmentsOf(pathname)[0]) {
    case 'learn':
      return 'learn';
    case 'grammar':
      return 'grammar';
    case 'quiz':
      return 'quiz';
    case 'my-progress':
      return 'progress';
    case 'my-profile':
      return 'profile';
    default:
      return null;
  }
}

/**
 * Target of the Learn tab: the user's current level, else A1. `currentLevel` comes from the root
 * layout data (`profiles.current_level`, `A1`…`C`), and is `null` for guests.
 */
export function learnHref(currentLevel: string | null | undefined): string {
  if (typeof currentLevel === 'string') {
    const slug = currentLevel.trim().toLowerCase();
    if (isLevel(slug)) return `/learn/${slug}`;
  }
  return '/learn/a1';
}

/**
 * Target of the top bar's back arrow, or `null` on a tab root (the top bar then shows the brand).
 * Only `tabs` paths have a parent.
 */
export function parentHref(pathname: string): string | null {
  if (shellMode(pathname) !== 'tabs') return null;
  const [first, second] = segmentsOf(pathname);
  if (first === 'grammar' && second !== undefined) return '/grammar';
  if (first === 'my-progress' && second === 'grammar') return '/my-progress';
  return null;
}
