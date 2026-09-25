import { describe, expect, it } from 'vitest';
import { runBot, STRATEGIES } from '../bot';

describe('smoke: a whole life', () => {
  it('runs a 60-year climber life with no errors or NaN', () => {
    const r = runBot({ strategy: 'climber', seed: 2024, maxDays: 365 * 60 });
    expect(r.invalidNumbers).toEqual([]);
    expect(r.days).toBeGreaterThan(365 * 5);
    expect(r.roomDay).not.toBeNull();
  }, 120_000);

  it('every strategy survives a year without invalid numbers', () => {
    for (const strategy of STRATEGIES) {
      const r = runBot({ strategy, seed: 77, maxDays: 365 });
      expect(r.invalidNumbers).toEqual([]);
    }
  }, 60_000);
});
