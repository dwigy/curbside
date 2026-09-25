// Batch actions: repeat an action N times or until a condition, with auto-eat.
// Batches stop for anything the player should see: events, story, warnings, death.

import { BALANCE } from '../content/balance';
import { itemAvailable, autoEatChoice } from './selectors';
import { step, type StepOutcome } from './step';
import type { Action, GameState, LogEntry, StatKey, Warning } from './types';

export interface Until {
  cashAtLeast?: number;
  healthBelow?: number;
  energyBelow?: number;
  foodBelow?: number;
  happinessBelow?: number;
}

export interface BatchOptions {
  times: number;
  until?: Until;
  autoEat?: boolean;
}

export type StopReason = 'done' | 'until' | 'event' | 'story' | 'prompt' | 'warning' | 'dead' | 'unavailable';

export interface BatchSummary {
  iterations: number;
  days: number;
  cashDelta: number;
  bankDelta: number;
  stats: Record<StatKey, { from: number; to: number }>;
  daysLeftDelta: number;
  stop: StopReason;
  stopDetail?: string;
  /** Notable log lines (good, bad, events, warnings). */
  highlights: LogEntry[];
  warnings: Warning[];
  earned: number;
  spentFood: number;
}

export function untilMet(s: GameState, u: Until | undefined): boolean {
  if (!u) return false;
  const funds = s.cash + (s.bank ?? 0);
  if (u.cashAtLeast !== undefined && funds >= u.cashAtLeast) return true;
  if (u.healthBelow !== undefined && s.stats.health < u.healthBelow) return true;
  if (u.energyBelow !== undefined && s.stats.energy < u.energyBelow) return true;
  if (u.foodBelow !== undefined && s.stats.food < u.foodBelow) return true;
  if (u.happinessBelow !== undefined && s.stats.happiness < u.happinessBelow) return true;
  return false;
}

/** Eat and feed the dog if needed. Returns the new state and log. */
export function autoUpkeep(s: GameState): { state: GameState; log: LogEntry[]; spent: number } {
  let cur = s;
  const log: LogEntry[] = [];
  let spent = 0;
  for (let i = 0; i < 3 && cur.stats.food < BALANCE.batch.autoEatBelow; i++) {
    const id = autoEatChoice(cur);
    if (!id) break;
    const before = cur.cash + (cur.bank ?? 0);
    const r = step(cur, { type: 'eat', id });
    if (!r.ok) break;
    spent += before - (r.state.cash + (r.state.bank ?? 0));
    cur = r.state;
    log.push(...r.log);
  }
  if (cur.dog && cur.dog.foodDays <= 1 && itemAvailable(cur, 'dog_food').ok && cur.unlocked.shop) {
    const r = step(cur, { type: 'buy', id: 'dog_food' });
    if (r.ok) {
      cur = r.state;
      log.push(...r.log);
    }
  }
  return { state: cur, log, spent };
}

export function runBatch(start: GameState, action: Action, opts: BatchOptions): { state: GameState; summary: BatchSummary; outcome?: StepOutcome } {
  let s = start;
  const highlights: LogEntry[] = [];
  const warnings: Warning[] = [];
  let iterations = 0;
  let stop: StopReason = 'done';
  let stopDetail: string | undefined;
  let earned = 0;
  let spentFood = 0;
  const times = Math.min(opts.times, BALANCE.batch.maxTimes);

  for (let i = 0; i < times; i++) {
    if (untilMet(s, opts.until)) {
      stop = 'until';
      break;
    }
    if (opts.autoEat) {
      const u = autoUpkeep(s);
      s = u.state;
      spentFood += u.spent;
      if (s.newWarnings.length) warnings.push(...s.newWarnings);
      // Eating can trigger a story beat (e.g. meeting someone at the kitchen).
      if (s.pendingPrompt) { stop = 'prompt'; break; }
      if (s.pendingEvent) { stop = 'event'; break; }
      if (s.pendingStory.length) { stop = 'story'; break; }
    }
    const before = s.counters.earned ?? 0;
    const r = step(s, action);
    if (!r.ok) {
      stop = 'unavailable';
      stopDetail = r.error;
      break;
    }
    s = r.state;
    iterations++;
    earned += (s.counters.earned ?? 0) - before;
    for (const l of r.log) if (l.kind !== 'info' && l.kind !== 'warn') highlights.push(l);
    if (s.newWarnings.length) {
      warnings.push(...s.newWarnings);
    }
    if (s.dead) { stop = 'dead'; break; }
    if (s.pendingPrompt) { stop = 'prompt'; break; }
    if (s.pendingEvent) { stop = 'event'; break; }
    if (s.pendingStory.length) { stop = 'story'; break; }
    if (s.newWarnings.length) { stop = 'warning'; break; }
  }
  if (stop === 'done' && untilMet(s, opts.until)) stop = 'until';

  const keys: StatKey[] = ['health', 'happiness', 'food', 'energy'];
  const stats = Object.fromEntries(keys.map((k) => [k, { from: start.stats[k], to: s.stats[k] }])) as BatchSummary['stats'];
  const left = (x: GameState) => x.lifeExpectancyDays - (x.character.startAgeDays + x.day);
  // Keep the warnings visible to the UI even if later upkeep steps reset newWarnings.
  s = { ...s, newWarnings: warnings };
  return {
    state: s,
    summary: {
      iterations,
      days: s.day - start.day,
      cashDelta: Math.round((s.cash - start.cash) * 100) / 100,
      bankDelta: Math.round(((s.bank ?? 0) - (start.bank ?? 0)) * 100) / 100,
      stats,
      daysLeftDelta: Math.round(left(s) - left(start)),
      stop,
      stopDetail,
      highlights: highlights.slice(-40),
      warnings,
      earned: Math.round(earned * 100) / 100,
      spentFood: Math.round(spentFood * 100) / 100,
    },
  };
}
