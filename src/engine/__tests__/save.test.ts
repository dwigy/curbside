import { describe, expect, it } from 'vitest';
import { deserialize, migrate, SCHEMA_VERSION, serialize } from '../save';
import { step } from '../step';
import { fresh, unblocked } from './helpers';

describe('save/load', () => {
  it('round-trips exactly', () => {
    let s = unblocked(fresh(4));
    for (let i = 0; i < 20; i++) s = unblocked(step(s, { type: 'activity', id: 'scavenge' }).state);
    const back = deserialize(serialize(s, '2031-01-01T00:00:00Z'));
    expect(back).toEqual(s);
    // And play continues identically from the loaded save.
    const a = step(s, { type: 'activity', id: 'beg' }).state;
    const b = step(back, { type: 'activity', id: 'beg' }).state;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('accepts a bare state object', () => {
    const s = fresh(1);
    expect(deserialize(JSON.stringify(s)).day).toBe(0);
  });

  it('rejects garbage and saves from the future', () => {
    expect(() => deserialize('{"hello":1}')).toThrow();
    expect(() => migrate({ ...fresh(1), schema: SCHEMA_VERSION + 1 } as never)).toThrow(/newer/);
  });
});
