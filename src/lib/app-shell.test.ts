import { describe, it, expect } from 'vitest';
import { shellMode, activeTab, learnHref, parentHref } from './app-shell';

describe('shellMode', () => {
  it.each([
    ['/learn/a1', 'tabs'],
    ['/learn/B1', 'site'], // slugs are lower case; the route would not match
    ['/learn/c/', 'tabs'], // trailing slash
    ['/learn', 'site'], // no such page
    ['/learn/x1', 'site'],
    ['/grammar', 'tabs'],
    ['/grammar/chapter/jeg-og-du', 'tabs'],
    ['/grammar/chapter', 'site'],
    ['/grammar/spesial-kvantorer', 'tabs'],
    ['/grammar/a/b', 'site'],
    ['/quiz', 'tabs'],
    ['/quiz/x', 'site'],
    ['/norskproven', 'tabs'],
    ['/norskproven/test-1/reading/b1', 'session'],
    ['/my-progress', 'tabs'],
    ['/my-progress/grammar', 'tabs'],
    ['/my-progress/other', 'site'],
    ['/my-profile', 'tabs'],
    ['/review', 'session'],
    ['/review/grammar', 'session'],
    ['/review/other', 'site'],
    ['/a1/food', 'session'],
    ['/c/uttrykk', 'session'],
    ['/a1', 'site'],
    ['/a1/food/extra', 'site'],
    ['/', 'site'],
    ['', 'site'],
    ['/blog', 'site'],
    ['/blog/x', 'site'],
    ['/about/x', 'site'],
    ['/plus', 'site'],
    ['/plus/success', 'site'],
    ['/auth/login', 'site'],
    ['/guide', 'site'],
    ['/faq', 'site'],
    ['/contact', 'site'],
    ['/privacy', 'site'],
    ['/terms', 'site'],
    ['/resources', 'site'],
    ['/admin', 'site'],
    ['/daily/a/2026-11-07', 'site'],
    ['/something-new', 'site']
  ])('%s is %s', (path, mode) => {
    expect(shellMode(path)).toBe(mode);
  });

  it('ignores a query string and a hash', () => {
    expect(shellMode('/quiz?level=b1')).toBe('tabs');
    expect(shellMode('/grammar/spesial-kvantorer#practice')).toBe('tabs');
  });

  it('does not throw on a non-string value', () => {
    expect(shellMode(undefined as unknown as string)).toBe('site');
  });
});

describe('activeTab', () => {
  it.each([
    ['/learn/b2', 'learn'],
    ['/grammar', 'grammar'],
    ['/grammar/chapter/x', 'grammar'],
    ['/quiz', 'quiz'],
    ['/my-progress', 'progress'],
    ['/my-progress/grammar', 'progress'],
    ['/my-profile', 'profile'],
    ['/', null],
    ['/norskproven', null],
    ['/review', null],
    ['/blog/x', null],
    ['/a1/food', null]
  ])('%s highlights %s', (path, tab) => {
    expect(activeTab(path)).toBe(tab);
  });
});

describe('learnHref', () => {
  it.each(['A1', 'A2', 'B1', 'B2', 'C'])('uses the level %s', (level) => {
    expect(learnHref(level)).toBe(`/learn/${level.toLowerCase()}`);
  });

  it('accepts lower case and surrounding spaces', () => {
    expect(learnHref('b1')).toBe('/learn/b1');
    expect(learnHref(' B2 ')).toBe('/learn/b2');
  });

  it('falls back to A1', () => {
    expect(learnHref(null)).toBe('/learn/a1');
    expect(learnHref(undefined)).toBe('/learn/a1');
    expect(learnHref('')).toBe('/learn/a1');
    expect(learnHref('D7')).toBe('/learn/a1');
    expect(learnHref('../admin')).toBe('/learn/a1');
  });
});

describe('parentHref', () => {
  it.each([
    ['/grammar/spesial-kvantorer', '/grammar'],
    ['/grammar/chapter/jeg-og-du', '/grammar'],
    ['/my-progress/grammar', '/my-progress'],
    ['/grammar', null],
    ['/quiz', null],
    ['/my-progress', null],
    ['/my-profile', null],
    ['/learn/b1', null],
    ['/norskproven', null],
    ['/blog/x', null], // not a tabs route
    ['/a1/food', null], // session route
    ['/', null]
  ])('%s goes back to %s', (path, parent) => {
    expect(parentHref(path)).toBe(parent);
  });
});
