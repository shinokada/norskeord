import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { sessionHeader, type SessionHeader } from './sessionHeader.svelte';

const make = (title: string): SessionHeader => ({
  backLabel: 'Quiz',
  title,
  onback: () => {}
});

// The store is module-level state: clear whatever a test left registered.
const releases: Array<() => void> = [];
afterEach(() => {
  while (releases.length) releases.pop()?.();
});

describe('sessionHeader', () => {
  it('starts empty', () => {
    expect(sessionHeader.current).toBeNull();
  });

  it('shows a registered header and clears it on release', () => {
    const header = make('A2 · Body');
    releases.push(sessionHeader.register(header));
    expect(sessionHeader.current).toBe(header);

    releases.pop()?.();
    expect(sessionHeader.current).toBeNull();
  });

  it('the last registration wins, and releasing an older one does not clear it', () => {
    const first = make('first');
    const second = make('second');
    const releaseFirst = sessionHeader.register(first);
    const releaseSecond = sessionHeader.register(second);
    releases.push(releaseSecond);
    expect(sessionHeader.current).toBe(second);

    releaseFirst();
    expect(sessionHeader.current).toBe(second);

    releaseSecond();
    expect(sessionHeader.current).toBeNull();
  });

  it('releasing twice is harmless', () => {
    const release = sessionHeader.register(make('x'));
    release();
    release();
    expect(sessionHeader.current).toBeNull();
  });

  it('keeps the onback callback, so the arrow runs the view exit', () => {
    const onback = vi.fn();
    releases.push(sessionHeader.register({ backLabel: 'Quiz', title: 't', onback }));
    sessionHeader.current?.onback();
    expect(onback).toHaveBeenCalledOnce();
  });
});

describe('sessionHeader inside $effect (the pattern the quiz uses)', () => {
  it('registers while the effect is active, without re-running it in a loop', () => {
    let runs = 0;
    const stop = $effect.root(() => {
      $effect(() => {
        runs += 1;
        return sessionHeader.register(make('A2 · Body'));
      });
    });

    flushSync();
    expect(sessionHeader.current?.title).toBe('A2 · Body');
    expect(runs).toBe(1);

    stop();
    expect(sessionHeader.current).toBeNull();
  });

  it('follows the session condition and a changing title', () => {
    let inSession = $state(true);
    let title = $state('A1 · Food');
    const stop = $effect.root(() => {
      $effect(() => {
        if (inSession) return sessionHeader.register(make(title));
      });
    });

    flushSync();
    expect(sessionHeader.current?.title).toBe('A1 · Food');

    title = 'B1 · Travel';
    flushSync();
    expect(sessionHeader.current?.title).toBe('B1 · Travel');

    inSession = false;
    flushSync();
    expect(sessionHeader.current).toBeNull();

    inSession = true;
    flushSync();
    expect(sessionHeader.current?.title).toBe('B1 · Travel');

    stop();
    expect(sessionHeader.current).toBeNull();
  });
});
