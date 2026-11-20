import { afterEach, describe, expect, it } from 'vitest';
import { flushSync } from 'svelte';
import { shellSession } from './shellSession.svelte';

// The store is module-level state, so put it back to zero after every test.
afterEach(() => {
  while (shellSession.hidden) shellSession.show();
});

describe('shellSession counter', () => {
  it('starts visible', () => {
    expect(shellSession.hidden).toBe(false);
  });

  it('hides after hide() and shows again after show()', () => {
    shellSession.hide();
    expect(shellSession.hidden).toBe(true);
    shellSession.show();
    expect(shellSession.hidden).toBe(false);
  });

  it('stays hidden until every registration has called show()', () => {
    shellSession.hide();
    shellSession.hide();
    shellSession.show();
    expect(shellSession.hidden).toBe(true);
    shellSession.show();
    expect(shellSession.hidden).toBe(false);
  });

  it('does not go below zero on an extra show()', () => {
    shellSession.show();
    shellSession.show();
    expect(shellSession.hidden).toBe(false);
    // A later hide() must still take effect, so the counter did not go negative.
    shellSession.hide();
    expect(shellSession.hidden).toBe(true);
  });
});

describe('shellSession inside $effect (the pattern the views use)', () => {
  it('hides while the effect is active, without re-running it in a loop', () => {
    let runs = 0;
    let cleanups = 0;
    const stop = $effect.root(() => {
      $effect(() => {
        runs += 1;
        shellSession.hide();
        return () => {
          cleanups += 1;
          shellSession.show();
        };
      });
    });

    flushSync();
    expect(shellSession.hidden).toBe(true);
    expect(runs).toBe(1);
    expect(cleanups).toBe(0);

    stop();
    expect(shellSession.hidden).toBe(false);
    expect(cleanups).toBe(1);
  });

  it('shows the bar again when the session condition turns false', () => {
    let inSession = $state(true);
    const stop = $effect.root(() => {
      $effect(() => {
        if (inSession) {
          shellSession.hide();
          return () => shellSession.show();
        }
      });
    });

    flushSync();
    expect(shellSession.hidden).toBe(true);

    inSession = false;
    flushSync();
    expect(shellSession.hidden).toBe(false);

    inSession = true;
    flushSync();
    expect(shellSession.hidden).toBe(true);

    stop();
    expect(shellSession.hidden).toBe(false);
  });

  it('keeps the bar hidden while a second view is still in a session', () => {
    let first = $state(true);
    const stop = $effect.root(() => {
      $effect(() => {
        if (first) {
          shellSession.hide();
          return () => shellSession.show();
        }
      });
      $effect(() => {
        shellSession.hide();
        return () => shellSession.show();
      });
    });

    flushSync();
    expect(shellSession.hidden).toBe(true);

    first = false;
    flushSync();
    expect(shellSession.hidden).toBe(true);

    stop();
    expect(shellSession.hidden).toBe(false);
  });
});
