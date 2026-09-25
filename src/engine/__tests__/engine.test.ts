import { describe, expect, it } from 'vitest';
import { runBatch } from '../batch';
import { runBot } from '../bot';
import { createRng } from '../rng';
import { daysLeft, projectHustle, shelterBedChance } from '../selectors';
import { step } from '../step';
import { fresh, reconciles, unblocked } from './helpers';

describe('rng', () => {
  it('is deterministic and serializable', () => {
    const a = createRng(7);
    const seq = [a.next(), a.next(), a.next()];
    const b = createRng(7);
    expect([b.next(), b.next(), b.next()]).toEqual(seq);
    const c = createRng(a.state());
    const d = createRng(a.state());
    expect(c.next()).toBe(d.next());
  });
});

describe('new game', () => {
  it('opens on the Act I story card with only Life and Hustle unlocked', () => {
    const s = fresh();
    expect(s.pendingStory).toContain('act1_open');
    expect(s.unlocked.life && s.unlocked.hustle).toBe(true);
    expect(s.unlocked.shop).toBe(false);
    expect(daysLeft(s)).toBeGreaterThan(365 * 20);
  });

  it('blocks play until the story card is dismissed', () => {
    const s = fresh();
    expect(step(s, { type: 'activity', id: 'beg' }).ok).toBe(false);
    const r = step(s, { type: 'dismissStory' });
    expect(r.ok).toBe(true);
    expect(step(r.state, { type: 'activity', id: 'beg' }).ok).toBe(true);
  });
});

describe('actions', () => {
  it('begging spends a day and earns within the projected range', () => {
    const s = unblocked(fresh());
    const p = projectHustle(s, 'beg')!;
    const r = step(s, { type: 'activity', id: 'beg' });
    expect(r.ok).toBe(true);
    expect(r.state.day).toBe(1);
    const earned = r.state.counters.earned ?? 0;
    expect(earned).toBeGreaterThanOrEqual(Math.floor(p.min));
    expect(earned).toBeLessThanOrEqual(Math.ceil(p.max) + 1);
  });

  it('eating at the kitchen is free, once a day', () => {
    const s = unblocked(fresh());
    const r = step(s, { type: 'eat', id: 'kitchen' });
    expect(r.ok).toBe(true);
    expect(r.state.cash).toBe(s.cash);
    const again = step(unblocked(r.state), { type: 'eat', id: 'kitchen' });
    expect(again.ok).toBe(false);
  });

  it('refuses purchases you cannot afford and never goes negative', () => {
    let s = unblocked(fresh());
    s = { ...s, unlocked: { ...s.unlocked, shop: true }, cash: 5 };
    const r = step(s, { type: 'buy', id: 'sleeping_bag' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Costs/);
  });

  it('is deterministic for the same seed and actions', () => {
    const run = () => {
      let s = unblocked(fresh(99));
      for (let i = 0; i < 30; i++) s = unblocked(step(s, { type: 'activity', id: i % 3 ? 'beg' : 'scavenge' }).state);
      return s;
    };
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()));
  });
});

describe('honest odds', () => {
  it('shelter bed rate matches the displayed chance', () => {
    let hits = 0;
    const n = 1500;
    let shown = 0;
    for (let i = 0; i < n; i++) {
      let s = unblocked(fresh(5000 + i));
      s = { ...s, beats: { ...s.beats, meet_ines: 0 }, eventsEnabled: false };
      shown = shelterBedChance(s);
      const r = step(s, { type: 'activity', id: 'shelter_intake' });
      if (r.state.housing === 'shelter') hits++;
    }
    expect(Math.abs(hits / n - shown)).toBeLessThan(0.04);
  });

  it('day labor hire rate matches the displayed chance', () => {
    let hits = 0;
    const n = 1500;
    let shown = 0;
    for (let i = 0; i < n; i++) {
      let s = unblocked(fresh(9000 + i));
      s = { ...s, items: { state_id: 1, work_boots: 1 }, beats: { ...s.beats, paperwork: 0 }, eventsEnabled: false };
      shown = projectHustle(s, 'dayLabor')!.chance;
      const r = step(s, { type: 'activity', id: 'daylabor' });
      if ((r.state.counters.dayLaborHired ?? 0) > 0) hits++;
    }
    expect(Math.abs(hits / n - shown)).toBeLessThan(0.04);
  });
});

describe('invariants', () => {
  it('ledger reconciles and money never goes negative through a long climber run', () => {
    for (const seed of [1, 2, 3]) {
      const r = runBot({ strategy: 'climber', seed, maxDays: 365 * 3 });
      expect(r.invalidNumbers).toEqual([]);
    }
  });

  it('every step keeps the ledger reconciled', () => {
    let s = fresh(12);
    for (let i = 0; i < 400 && !s.dead; i++) {
      s = unblocked(s);
      const id = ['beg', 'scavenge', 'rest'][i % 3];
      const r = step(s, { type: 'activity', id });
      s = r.state;
      if (s.cash > 3 && s.stats.food < 50) s = step(unblocked(s), { type: 'eat', id: 'bread' }).state;
      expect(reconciles(s)).toBe(true);
      expect(s.cash).toBeGreaterThanOrEqual(0);
    }
  });

  it('rent is charged weekly and eviction follows unpaid rent after the grace period', () => {
    let s = unblocked(fresh(3));
    s = { ...s, items: { state_id: 1 }, beats: { ...s.beats, room_hint: 0 }, cash: 255, opening: { cash: 255, bank: 0 }, relationships: { ...s.relationships, ines: 30 }, eventsEnabled: false };
    const moved = step(s, { type: 'housing', id: 'room_albescu' });
    expect(moved.ok).toBe(true);
    s = moved.state;
    expect(s.cash).toBe(0);
    expect(s.deposit).toBe(170);
    // Rest with no money: rent is due on day 7, eviction 7 days later.
    for (let i = 0; i < 16; i++) {
      const r = step(unblocked({ ...s, stats: { ...s.stats, energy: 50, food: 80 } }), { type: 'activity', id: 'rest' });
      expect(r.ok).toBe(true);
      s = unblocked(r.state);
    }
    expect(s.housing).toBe('street');
    expect(s.counters.evictions).toBe(1);
    expect(reconciles(s)).toBe(true);
  });
});

describe('batches', () => {
  it('stops when the until-condition is met', () => {
    const s = unblocked(fresh(8));
    const { summary, state } = runBatch({ ...s, eventsEnabled: false }, { type: 'activity', id: 'beg' }, { times: 100, until: { cashAtLeast: 40 }, autoEat: true });
    expect(['until', 'story', 'event', 'warning', 'prompt']).toContain(summary.stop);
    if (summary.stop === 'until') expect(state.cash + (state.bank ?? 0)).toBeGreaterThanOrEqual(40);
    expect(summary.iterations).toBeGreaterThan(0);
  });
});
