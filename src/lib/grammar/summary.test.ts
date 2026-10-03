// src/lib/grammar/summary.test.ts
import { describe, it, expect } from 'vitest';
import { GRAMMAR_RULES } from './rules';
import { plainSummary } from './summary';

describe('plainSummary', () => {
  it('strips bold markers and collapses whitespace', () => {
    expect(plainSummary('Bruk **-er** i  presens.\nDet gjelder alle verb i denne gruppen.')).toBe(
      'Bruk -er i presens. Det gjelder alle verb i denne gruppen.'
    );
  });

  it('removes bullet markers', () => {
    const out = plainSummary('• første punkt som er ganske langt\n• andre punkt som også er langt');
    expect(out).not.toContain('•');
    expect(out).toContain('første punkt');
  });

  it('uses only the first paragraph when it is long enough', () => {
    const first = 'Dette er et første avsnitt som er langt nok til å stå alene som sammendrag.';
    expect(plainSummary(`${first}\n\nDette er et andre avsnitt.`)).toBe(first);
  });

  it('joins a very short first paragraph with the next one', () => {
    const out = plainSummary('Regel:\n\nSubjektet står foran verbalet i vanlige setninger.');
    expect(out).toBe('Regel: Subjektet står foran verbalet i vanlige setninger.');
  });

  it('cuts at a word boundary and adds an ellipsis when too long', () => {
    const long = 'ord '.repeat(100).trim();
    const out = plainSummary(long, 50);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(51);
    expect(out.slice(0, -1).endsWith(' ')).toBe(false);
  });

  it('returns an empty string for empty input', () => {
    expect(plainSummary('')).toBe('');
    expect(plainSummary('\n\n  \n')).toBe('');
  });

  it('never leaks markdown into the summary of any real rule', () => {
    for (const [topic, rule] of Object.entries(GRAMMAR_RULES)) {
      const out = plainSummary(rule.explanationNb);
      expect(out, topic).not.toContain('**');
      expect(out, topic).not.toContain('•');
      expect(out.length, topic).toBeGreaterThan(0);
    }
  });
});
