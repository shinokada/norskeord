import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';

// jsdom has no matchMedia, and flowbite-svelte's barrel import pulls in NavUl, which creates a
// MediaQuery as soon as the module loads. The stub is a plain statement and the modules that need
// it are imported dynamically below, so the stub runs first (static imports are hoisted above it).
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false
    }) as MediaQueryList;
}

// `page` and `authStore` are replaced so each test can set the path and the signed-in state.
const mockPage = vi.hoisted(() => ({
  url: { pathname: '/' },
  data: {} as Record<string, unknown>
}));
const mockAuth = vi.hoisted(() => ({ user: null as { id: string } | null }));

vi.mock('$app/state', () => ({ page: mockPage }));
vi.mock('$lib/stores/auth.svelte', () => ({ authStore: mockAuth }));
vi.mock('$lib/paraglide/messages.js', () => ({
  nav_learn: () => 'Learn',
  nav_grammar: () => 'Grammar',
  nav_quiz: () => 'Quiz',
  nav_my_progress: () => 'My Progress',
  nav_my_profile: () => 'Profile',
  bottom_nav_label: () => 'Main navigation'
}));

const { shellSession } = await import('$lib/stores/shellSession.svelte');
const { default: BottomNav } = await import('./BottomNav.svelte');

function setPage(pathname: string, data: Record<string, unknown> = {}) {
  mockPage.url = { pathname };
  mockPage.data = data;
}

function bar() {
  return screen.queryByRole('navigation', { name: 'Main navigation' });
}

function tab(name: string) {
  return screen.getByRole(name === 'Profile-button' ? 'button' : 'link', {
    name: name === 'Profile-button' ? 'Profile' : name
  });
}

beforeEach(() => {
  setPage('/');
  mockAuth.user = null;
});

afterEach(() => {
  while (shellSession.hidden) shellSession.show();
});

describe('BottomNav visibility', () => {
  it.each(['/grammar', '/grammar/chapter/x', '/grammar/word-order', '/quiz', '/learn/b1'])(
    'renders on the tabs route %s',
    (path) => {
      setPage(path);
      render(BottomNav);
      expect(bar()).not.toBeNull();
    }
  );

  it.each(['/', '/blog', '/blog/x', '/plus', '/auth/login', '/daily/a1/2026-11-07', '/learn'])(
    'does not render on the site route %s',
    (path) => {
      setPage(path);
      render(BottomNav);
      expect(bar()).toBeNull();
    }
  );

  it.each(['/a1/food', '/c/uttrykk', '/review', '/norskproven/test-1/reading/b1'])(
    'does not render on the session route %s',
    (path) => {
      setPage(path);
      render(BottomNav);
      expect(bar()).toBeNull();
    }
  );

  it('disappears while a view hides it and comes back afterwards', () => {
    setPage('/quiz');
    render(BottomNav);
    expect(bar()).not.toBeNull();

    shellSession.hide();
    flushSync();
    expect(bar()).toBeNull();

    shellSession.show();
    flushSync();
    expect(bar()).not.toBeNull();
  });
});

describe('BottomNav tabs', () => {
  it('shows the five tabs in order', () => {
    setPage('/grammar');
    render(BottomNav);
    const labels = Array.from(bar()!.querySelectorAll('a, button')).map((el) =>
      el.textContent?.trim()
    );
    expect(labels).toEqual(['Learn', 'Grammar', 'Quiz', 'My Progress', 'Profile']);
  });

  it('links the plain tabs', () => {
    setPage('/grammar');
    render(BottomNav);
    expect(tab('Grammar').getAttribute('href')).toBe('/grammar');
    expect(tab('Quiz').getAttribute('href')).toBe('/quiz');
    expect(tab('My Progress').getAttribute('href')).toBe('/my-progress');
  });

  it.each([
    ['/learn/b1', 'Learn'],
    ['/grammar', 'Grammar'],
    ['/grammar/chapter/x', 'Grammar'],
    ['/grammar/word-order', 'Grammar'],
    ['/quiz', 'Quiz'],
    ['/my-progress', 'My Progress'],
    ['/my-progress/grammar', 'My Progress'],
    ['/my-profile', 'Profile']
  ])('marks the right tab current on %s', (path, name) => {
    setPage(path, { user: { id: 'u1' } });
    render(BottomNav);
    const current = Array.from(bar()!.querySelectorAll('[aria-current="page"]'));
    expect(current.map((el) => el.textContent?.trim())).toEqual([name]);
  });

  it('marks no tab current on /norskproven (a tabs page with no tab of its own)', () => {
    setPage('/norskproven');
    render(BottomNav);
    expect(bar()!.querySelectorAll('[aria-current="page"]').length).toBe(0);
  });

  it('marks Learn current even though its href is /learn/{level}', () => {
    setPage('/learn/a2', { currentLevel: 'B1' });
    render(BottomNav);
    expect(tab('Learn').getAttribute('href')).toBe('/learn/b1');
    expect(tab('Learn').getAttribute('aria-current')).toBe('page');
  });
});

describe('BottomNav Learn target', () => {
  it('uses the signed-in level, lower case', () => {
    setPage('/quiz', { currentLevel: 'B2' });
    render(BottomNav);
    expect(tab('Learn').getAttribute('href')).toBe('/learn/b2');
  });

  it.each([[null], [undefined], ['../admin'], ['Z9']])('falls back to A1 for %s', (level) => {
    setPage('/quiz', { currentLevel: level });
    render(BottomNav);
    expect(tab('Learn').getAttribute('href')).toBe('/learn/a1');
  });
});

describe('BottomNav Profile tab', () => {
  it('links to /my-profile when page.data.user is set', () => {
    setPage('/quiz', { user: { id: 'u1' } });
    render(BottomNav);
    expect(tab('Profile').getAttribute('href')).toBe('/my-profile');
  });

  it('links to /my-profile from the auth store on a prerendered page (page.data.user is null)', () => {
    setPage('/quiz', { user: null });
    mockAuth.user = { id: 'u1' };
    render(BottomNav);
    expect(tab('Profile').getAttribute('href')).toBe('/my-profile');
  });

  it('links a guest to the login page by default', () => {
    setPage('/quiz', { user: null });
    render(BottomNav);
    expect(tab('Profile').getAttribute('href')).toBe('/auth/login');
  });

  it('turns into a button for a guest when onGuestProfile is given', async () => {
    setPage('/quiz', { user: null });
    const onGuestProfile = vi.fn();
    render(BottomNav, { props: { onGuestProfile } });
    await fireEvent.click(tab('Profile-button'));
    expect(onGuestProfile).toHaveBeenCalledTimes(1);
  });

  it('keeps the link for a signed-in user even when onGuestProfile is given', () => {
    setPage('/quiz', { user: { id: 'u1' } });
    render(BottomNav, { props: { onGuestProfile: vi.fn() } });
    expect(tab('Profile').getAttribute('href')).toBe('/my-profile');
  });
});

describe('BottomNav styling overrides', () => {
  // jsdom runs no Tailwind, so this only checks that the class overrides survived tailwind-merge.
  it('hides at md and up and sits above the old z-30 default', () => {
    setPage('/quiz');
    render(BottomNav);
    const outer = bar()!;
    expect(outer.classList.contains('md:hidden')).toBe(true);
    expect(outer.classList.contains('z-40')).toBe(true);
    expect(outer.classList.contains('z-30')).toBe(false);
    expect(outer.classList.contains('h-16')).toBe(false);
    expect(outer.classList.contains('bg-white')).toBe(false);
  });

  it('pads for the home indicator and the landscape notch', () => {
    setPage('/quiz');
    render(BottomNav);
    const outer = bar()!;
    expect(outer.classList.contains('pb-[env(safe-area-inset-bottom)]')).toBe(true);
    expect(outer.classList.contains('pl-[env(safe-area-inset-left)]')).toBe(true);
    expect(outer.classList.contains('pr-[env(safe-area-inset-right)]')).toBe(true);
  });

  it('uses a five-column grid with a 4rem row', () => {
    setPage('/quiz');
    render(BottomNav);
    const inner = bar()!.firstElementChild as HTMLElement;
    expect(inner.classList.contains('grid-cols-5')).toBe(true);
    expect(inner.classList.contains('h-16')).toBe(true);
  });

  it('uses small, tight items so five labels fit at 360px', () => {
    setPage('/quiz');
    render(BottomNav);
    const link = tab('Grammar');
    expect(link.classList.contains('px-1')).toBe(true);
    expect(link.classList.contains('px-5')).toBe(false);
    const labelSpan = link.querySelector('span')!;
    expect(labelSpan.classList.contains('text-xs')).toBe(true);
    expect(labelSpan.classList.contains('text-sm')).toBe(false);
  });

  it('gives the active tab a colour that works on the dark background', () => {
    setPage('/quiz');
    render(BottomNav);
    const active = tab('Quiz');
    expect(active.classList.contains('dark:text-primary-400')).toBe(true);
    expect(active.classList.contains('dark:text-primary-700')).toBe(false);
  });
});
