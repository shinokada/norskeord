import { describe, it, expect } from 'vitest';
import { FREE_UTTRYKK_THEMES, isFreeUttrykkTheme } from './uttrykk-gating';
import { UTTRYKK_THEME_LEVELS, UTTRYKK_THEMES_BY_LEVEL, UTTRYKK_CATCHALL_THEME } from './config';

// See ai-docs/implementation/uttrykk-gate.md — "Choosing the free themes".
// This is the validation the doc calls for: a typo'd theme slug in
// FREE_UTTRYKK_THEMES should fail loudly (zero free themes for that level)
// instead of silently granting zero free themes to real users.

describe('FREE_UTTRYKK_THEMES', () => {
  it('only lists levels that have a real theme taxonomy', () => {
    expect(Object.keys(FREE_UTTRYKK_THEMES).sort()).toEqual([...UTTRYKK_THEME_LEVELS].sort());
  });

  for (const level of UTTRYKK_THEME_LEVELS) {
    it(`every free theme for ${level} is a real UTTRYKK_THEMES_BY_LEVEL member`, () => {
      const valid = new Set(UTTRYKK_THEMES_BY_LEVEL[level]);
      for (const theme of FREE_UTTRYKK_THEMES[level]) {
        expect(valid.has(theme), `"${theme}" is not a real theme at ${level}`).toBe(true);
      }
    });

    it(`${level} has at least one free theme`, () => {
      expect(FREE_UTTRYKK_THEMES[level].length).toBeGreaterThan(0);
    });

    it(`${level}'s free themes never include the catch-all "general" bucket`, () => {
      expect(FREE_UTTRYKK_THEMES[level]).not.toContain(UTTRYKK_CATCHALL_THEME);
    });
  }
});

describe('isFreeUttrykkTheme', () => {
  it('returns true only for themes in the allow-list', () => {
    expect(isFreeUttrykkTheme('A1', 'greetings')).toBe(true);
    expect(isFreeUttrykkTheme('A1', 'classroom')).toBe(false);
  });

  it('returns false for null (no theme selected / "study all")', () => {
    expect(isFreeUttrykkTheme('A1', null)).toBe(false);
  });

  it('returns false for the Others bucket and unknown slugs', () => {
    expect(isFreeUttrykkTheme('B2', 'others')).toBe(false);
    expect(isFreeUttrykkTheme('B2', 'not-a-real-theme')).toBe(false);
  });

  it("never treats B2's oversized idioms theme as free", () => {
    // idioms is 541/679 (80%) of the B2 deck — see uttrykk-gate.md's
    // "never free if it would dominate the deck" rule.
    expect(isFreeUttrykkTheme('B2', 'idioms')).toBe(false);
  });
});
