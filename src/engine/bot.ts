// Headless bot players for smoke tests and the debug balance simulator.

import { BALANCE } from '../content/balance';
import { autoUpkeep } from './batch';
import { hasItem } from './conditions';
import { newGame } from './newGame';
import { activityById } from '../content/activities';
import { actionAvailable, ageDays, daysLeft, projectHustle } from './selectors';
import { choiceAvailable, step } from './step';
import { eventById } from './sim';
import type { Action, BackstoryId, GameState } from './types';

export type Strategy = 'beggar' | 'scavenger' | 'climber';
export const STRATEGIES: Strategy[] = ['beggar', 'scavenger', 'climber'];

const ok = (s: GameState, a: Action) => actionAvailable(s, a).ok;

function firstOk(s: GameState, actions: Action[]): Action | null {
  for (const a of actions) if (ok(s, a)) return a;
  return null;
}

function resolveBlocking(s: GameState): Action | null {
  if (s.pendingPrompt === 'nameDog') return { type: 'nameDog', name: 'Biscuit' };
  if (s.pendingStory.length) return { type: 'dismissStory' };
  if (s.pendingEvent) {
    const e = eventById(s.pendingEvent.id);
    const idx = e?.choices?.findIndex((c) => choiceAvailable(s, c).ok && !c.costCash) ?? -1;
    return { type: 'choose', choice: Math.max(0, idx) };
  }
  return null;
}

function bestHustle(s: GameState): Action | null {
  const options = ['daylabor', 'deliveries', 'oddjobs', 'busk', 'beg', 'scavenge']
    .map((id) => ({ id, def: activityById(id)! }))
    .filter(({ id }) => ok(s, { type: 'activity', id }))
    .map(({ id, def }) => ({ id, ev: projectHustle(s, def.kind)?.expected ?? 0 }));
  options.sort((a, b) => b.ev - a.ev);
  return options[0] ? { type: 'activity', id: options[0].id } : null;
}

export function botAction(s: GameState, strategy: Strategy): Action | null {
  const block = resolveBlocking(s);
  if (block) return block;
  if (s.stats.health < 30 && ok(s, { type: 'activity', id: 'clinic' })) return { type: 'activity', id: 'clinic' };
  if (s.stats.energy < 25) return { type: 'activity', id: 'rest' };

  if (strategy === 'beggar') return firstOk(s, [{ type: 'activity', id: 'beg' }, { type: 'activity', id: 'rest' }]);
  if (strategy === 'scavenger') return firstOk(s, [{ type: 'activity', id: 'scavenge' }, { type: 'activity', id: 'rest' }]);

  // Climber: follows the intended Act I path.
  const funds = s.cash + (s.bank ?? 0);
  const buys = ['sleeping_bag', 'birth_certificate_order', 'work_boots', 'clean_clothes', 'bike_lock'];
  if (s.housing === 'street' || funds > 120) for (const id of buys) if (ok(s, { type: 'buy', id }) && funds > 30) return { type: 'buy', id };
  if (hasItem(s, 'birth_certificate') && ok(s, { type: 'activity', id: 'dmv' })) return { type: 'activity', id: 'dmv' };
  if (ok(s, { type: 'bank', op: 'open', amount: 0 })) return { type: 'bank', op: 'open', amount: 0 };
  if (s.bank !== null && s.cash > 5) return { type: 'bank', op: 'deposit', amount: Math.floor(s.cash) };
  const room = s.dog ? 'room_canal' : 'room_albescu';
  if (s.housing !== room && ok(s, { type: 'housing', id: room }) && funds > 300) return { type: 'housing', id: room };
  if (s.housing === 'street' && ok(s, { type: 'activity', id: 'shelter_intake' })) return { type: 'activity', id: 'shelter_intake' };
  if (s.district !== 'riverfront' && ok(s, { type: 'travel', to: 'riverfront' })) return { type: 'travel', to: 'riverfront' };
  return bestHustle(s) ?? { type: 'activity', id: 'rest' };
}

export interface BotResult {
  strategy: Strategy;
  seed: number;
  days: number;
  deathAge: number | null;
  cause: string | null;
  finalNetWorth: number;
  roomDay: number | null;
  /** Net worth sampled every 365 days. */
  netWorthByYear: number[];
  steps: number;
  invalidNumbers: string[];
}

function numbersValid(s: GameState): string[] {
  const bad: string[] = [];
  const chk = (k: string, v: number) => {
    if (!Number.isFinite(v)) bad.push(k);
  };
  chk('cash', s.cash);
  if (s.bank !== null) chk('bank', s.bank);
  chk('lifeExpectancyDays', s.lifeExpectancyDays);
  chk('diet', s.diet);
  for (const [k, v] of Object.entries(s.stats)) chk(k, v);
  for (const [k, v] of Object.entries(s.skills)) chk(k, v);
  if (s.cash < 0) bad.push('cash<0');
  if (s.bank !== null && s.bank < 0) bad.push('bank<0');
  return bad;
}

export function runBot(opts: { strategy: Strategy; seed: number; backstory?: BackstoryId; maxDays?: number; autoEat?: boolean }): BotResult {
  let s = newGame({
    name: 'Bot',
    pronouns: 'they',
    avatar: { skin: 0, hair: 0, hairColor: 0, facial: 0, top: 0, accessory: 0 },
    backstory: opts.backstory ?? 'laid_off',
    seed: opts.seed,
  });
  const maxDays = opts.maxDays ?? 365 * 60;
  const nw: number[] = [];
  let roomDay: number | null = null;
  let steps = 0;
  const invalid = new Set<string>();
  let guard = 0;
  while (!s.dead && s.day < maxDays && guard++ < maxDays * 6) {
    if (opts.autoEat !== false && !s.pendingEvent && !s.pendingStory.length && !s.pendingPrompt) s = autoUpkeep(s).state;
    const a = botAction(s, opts.strategy);
    if (!a) break;
    const prevYear = Math.floor(s.day / 365);
    const r = step(s, a);
    steps++;
    if (!r.ok) {
      // Fall back to resting so the bot can't get stuck.
      const rr = step(s, { type: 'activity', id: 'rest' });
      if (!rr.ok) {
        const unblock = resolveBlocking(s);
        if (!unblock) break;
        s = step(s, unblock).state;
        continue;
      }
      s = rr.state;
    } else s = r.state;
    for (const b of numbersValid(s)) invalid.add(b);
    if (roomDay === null && (s.housing === 'room_albescu' || s.housing === 'room_canal')) roomDay = s.day;
    if (Math.floor(s.day / 365) > prevYear) nw.push(Math.round(s.cash + (s.bank ?? 0) + s.deposit));
  }
  return {
    strategy: opts.strategy,
    seed: opts.seed,
    days: s.day,
    deathAge: s.dead ? Math.floor(ageDays(s) / 365) : null,
    cause: s.dead?.cause ?? null,
    finalNetWorth: Math.round(s.cash + (s.bank ?? 0) + s.deposit),
    roomDay,
    netWorthByYear: nw,
    steps,
    invalidNumbers: [...invalid],
  };
}

export interface SimReport {
  strategy: Strategy;
  runs: number;
  medianDeathAge: number | null;
  medianRoomDay: number | null;
  reachedRoom: number;
  medianNetWorthByYear: number[];
  causes: Record<string, number>;
  medianDaysLeftAtStart: number;
}

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const a = [...xs].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
};

export function simulate(strategy: Strategy, runs: number, seedBase = 1000, maxDays = 365 * 60): SimReport {
  const results = Array.from({ length: runs }, (_, i) => runBot({ strategy, seed: seedBase + i, maxDays }));
  const years = Math.max(0, ...results.map((r) => r.netWorthByYear.length));
  const byYear: number[] = [];
  for (let y = 0; y < years; y++) {
    byYear.push(median(results.map((r) => r.netWorthByYear[y]).filter((v) => v !== undefined)) ?? 0);
  }
  const causes: Record<string, number> = {};
  for (const r of results) if (r.cause) causes[r.cause] = (causes[r.cause] ?? 0) + 1;
  const start = newGame({ name: 'x', pronouns: 'they', avatar: { skin: 0, hair: 0, hairColor: 0, facial: 0, top: 0, accessory: 0 }, backstory: 'laid_off', seed: 1 });
  return {
    strategy,
    runs,
    medianDeathAge: median(results.map((r) => r.deathAge).filter((x): x is number => x !== null)),
    medianRoomDay: median(results.map((r) => r.roomDay).filter((x): x is number => x !== null)),
    reachedRoom: results.filter((r) => r.roomDay !== null).length,
    medianNetWorthByYear: byYear,
    causes,
    medianDaysLeftAtStart: daysLeft(start),
  };
}

export const BOT_BALANCE_NOTE = `Bots use the same step() as players; auto-eat below ${BALANCE.batch.autoEatBelow} food.`;
