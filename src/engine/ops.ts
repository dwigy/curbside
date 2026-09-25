// Mutation helpers used inside a step. A step clones the incoming state once and
// mutates the clone through these helpers, so callers only ever see pure transitions.

import { codexById } from '../content/codex';
import { itemById } from '../content/items';
import type { Rng } from './rng';
import { fill, money } from './text';
import type { CastId, Effect, GameState, LogEntry, LogKind, SkillKey, StatKey, Warning } from './types';

export interface Ctx {
  s: GameState;
  rng: Rng;
  log: LogEntry[];
}

export const LOG_CAP = 200;
export const LEDGER_CAP = 400;

export const r2 = (n: number) => Math.round(n * 100) / 100;
export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function log(ctx: Ctx, kind: LogKind, text: string) {
  const entry = { day: ctx.s.day, kind, text: fill(text, ctx.s) };
  ctx.log.push(entry);
  ctx.s.log.push(entry);
  if (ctx.s.log.length > LOG_CAP) ctx.s.log.splice(0, ctx.s.log.length - LOG_CAP);
}

export function journal(ctx: Ctx, text: string) {
  const filled = fill(text, ctx.s);
  const last = ctx.s.journal[ctx.s.journal.length - 1];
  if (last && last.text === filled) return;
  ctx.s.journal.push({ day: ctx.s.day, text: filled });
  ctx.s.unlocked.journal = true;
}

export function warn(ctx: Ctx, id: string, text: string) {
  const w: Warning = { id, day: ctx.s.day, text: fill(text, ctx.s) };
  ctx.s.newWarnings.push(w);
  ctx.s.warnings[id] = ctx.s.day;
  log(ctx, 'warn', w.text);
}

export function learn(ctx: Ctx, ids: string[]) {
  for (const id of ids) {
    if (!ctx.s.codex.includes(id) && codexById(id)) ctx.s.codex.push(id);
  }
}

export function counter(ctx: Ctx, key: string, by = 1) {
  ctx.s.counters[key] = r2((ctx.s.counters[key] ?? 0) + by);
}

function ledger(ctx: Ctx, account: 'cash' | 'bank', amount: number, reason: string, category: string) {
  const s = ctx.s;
  const balance = account === 'cash' ? s.cash : (s.bank ?? 0);
  s.ledger.push({ day: s.day, amount: r2(amount), account, reason: fill(reason, s), category, balance: r2(balance) });
  if (s.ledger.length > LEDGER_CAP) s.ledger.splice(0, s.ledger.length - LEDGER_CAP);
  s.ledgerTotals[account] = r2(s.ledgerTotals[account] + amount);
}

/** Add (or remove, if negative) cash on hand. Never lets cash go below zero. */
export function addCash(ctx: Ctx, amount: number, reason: string, category: string): number {
  const s = ctx.s;
  const applied = r2(amount < 0 ? -Math.min(s.cash, -amount) : amount);
  if (applied === 0) return 0;
  s.cash = r2(s.cash + applied);
  ledger(ctx, 'cash', applied, reason, category);
  return applied;
}

export function addBank(ctx: Ctx, amount: number, reason: string, category: string): number {
  const s = ctx.s;
  if (s.bank === null) return 0;
  const applied = r2(amount < 0 ? -Math.min(s.bank, -amount) : amount);
  if (applied === 0) return 0;
  s.bank = r2(s.bank + applied);
  ledger(ctx, 'bank', applied, reason, category);
  return applied;
}

export function totalFunds(s: GameState): number {
  return r2(s.cash + (s.bank ?? 0));
}

/**
 * Pay an amount from cash first, then the bank. Returns the amount actually paid
 * (less than asked only when funds run out; callers decide what a shortfall means).
 */
export function pay(ctx: Ctx, amount: number, reason: string, category: string): number {
  const fromCash = Math.min(ctx.s.cash, amount);
  let paid = -addCash(ctx, -fromCash, reason, category);
  const rest = r2(amount - paid);
  if (rest > 0 && ctx.s.bank !== null) paid += -addBank(ctx, -rest, reason, category);
  return r2(paid);
}

export function addStat(ctx: Ctx, key: StatKey, by: number) {
  ctx.s.stats[key] = r2(clamp(ctx.s.stats[key] + by, 0, 100));
}

export function addSkill(ctx: Ctx, key: SkillKey, by: number) {
  ctx.s.skills[key] = r2(clamp(ctx.s.skills[key] + by, 0, 100));
}

export function addRel(ctx: Ctx, who: CastId, by: number) {
  ctx.s.relationships[who] = r2(clamp((ctx.s.relationships[who] ?? 0) + by, -100, 100));
}

export function addItem(ctx: Ctx, id: string, count = 1) {
  const s = ctx.s;
  const def = itemById(id);
  if (def?.expiresDays) {
    const from = Math.max(s.day, s.expiries[id] ?? s.day);
    s.expiries[id] = from + def.expiresDays;
    s.items[id] = 1;
  } else if (def?.consumable) {
    s.items[id] = (s.items[id] ?? 0) + count;
  } else {
    s.items[id] = 1;
  }
}

export function removeItem(ctx: Ctx, id: string) {
  delete ctx.s.items[id];
  delete ctx.s.expiries[id];
}

/** Apply a declarative effect. `days` is handled by the caller (it needs the day loop). */
export function applyEffect(ctx: Ctx, e: Effect | undefined, source: string) {
  if (!e) return;
  const s = ctx.s;
  if (e.cash) {
    if (e.cash > 0) addCash(ctx, e.cash, source, 'event');
    else {
      const paid = pay(ctx, -e.cash, source, 'event');
      if (paid < -e.cash) log(ctx, 'bad', `You couldn’t cover ${money(-e.cash - paid)} of that.`);
    }
  }
  if (e.bank) addBank(ctx, e.bank, source, 'event');
  if (e.health) addStat(ctx, 'health', e.health);
  if (e.happiness) addStat(ctx, 'happiness', e.happiness);
  if (e.food) addStat(ctx, 'food', e.food);
  if (e.energy) addStat(ctx, 'energy', e.energy);
  if (e.reputation) s.reputation = r2(clamp(s.reputation + e.reputation, -100, 100));
  if (e.lifeDays) s.lifeExpectancyDays = r2(s.lifeExpectancyDays + e.lifeDays);
  if (e.skills) for (const [k, v] of Object.entries(e.skills)) addSkill(ctx, k as SkillKey, v ?? 0);
  if (e.addItem) for (const id of e.addItem) addItem(ctx, id);
  if (e.removeItem) for (const id of e.removeItem) removeItem(ctx, id);
  if (e.setFlag) Object.assign(s.flags, e.setFlag);
  if (e.clearFlag) for (const f of e.clearFlag) delete s.flags[f];
  if (e.rel) for (const [k, v] of Object.entries(e.rel)) addRel(ctx, k as CastId, v ?? 0);
  if (e.stealCashPct && s.cash > 0) {
    const lost = r2(s.cash * e.stealCashPct);
    addCash(ctx, -lost, source, 'theft');
    counter(ctx, 'thefts');
  }
  if (e.counter) for (const [k, v] of Object.entries(e.counter)) counter(ctx, k, v);
  if (e.getDog && !s.dog) {
    s.dog = { name: '', foodDays: 2, hungryDays: 0, bond: 30, since: s.day };
    s.pendingPrompt = 'nameDog';
  }
  if (s.dog) {
    if (e.dogBond) s.dog.bond = r2(clamp(s.dog.bond + e.dogBond, 0, 100));
    if (e.dogFood) s.dog.foodDays += e.dogFood;
  }
  if (e.loseDog && s.dog) {
    s.dog = null;
    s.flags.dogLost = true;
  }
  if (e.unlock) for (const tab of e.unlock) s.unlocked[tab] = true;
  if (e.codex) learn(ctx, e.codex);
  if (e.journal) journal(ctx, e.journal);
  if (e.story) s.pendingStory.push(...e.story);
  if (e.act) s.act = Math.max(s.act, e.act);
  if (e.event && !s.pendingEvent) s.pendingEvent = { id: e.event, day: s.day };
}
