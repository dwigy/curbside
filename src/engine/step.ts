// step(state, action) -> new state. The only way game state ever changes.

import { activityById } from '../content/activities';
import { BALANCE } from '../content/balance';
import { foodById } from '../content/foods';
import { housingById } from '../content/housing';
import { itemById } from '../content/items';
import { formatSpan } from './calendar';
import { check } from './conditions';
import { addBank, addCash, addItem, addRel, addStat, applyEffect, counter, type Ctx, journal, learn, log, pay, r2 } from './ops';
import { createRng } from './rng';
import { actionAvailable, travelDays } from './selectors';
import { activatePending, checkBeats, eventById, moveTo, rollEvent, runDay, thresholdWarnings } from './sim';
import { fill, money, pct } from './text';
import type { Action, Chance, EventChoice, GameState, LogEntry } from './types';

const B = BALANCE;

export interface StepOutcome {
  title: string;
  text: string;
  /** null for guaranteed outcomes */
  success: boolean | null;
  chance: number | null;
}

export interface StepOutput {
  state: GameState;
  log: LogEntry[];
  days: number;
  ok: boolean;
  error?: string;
  outcome?: StepOutcome;
}

export function resolveChance(c: number | Chance | undefined, s: GameState): number {
  if (c === undefined) return 1;
  if (typeof c === 'number') return Math.min(1, Math.max(0, c));
  let p = c.base;
  if (c.skill) p += (s.skills[c.skill] ?? 0) * (c.perSkill ?? 0);
  if (c.rel) p += (s.relationships[c.rel] ?? 0) * (c.perRel ?? 0);
  p = Math.max(c.min ?? 0, Math.min(c.max ?? 1, p));
  return r2(p);
}

export function choiceAvailable(s: GameState, ch: EventChoice): { visible: boolean; ok: boolean; reason?: string } {
  if (ch.when && !check(ch.when, s)) return { visible: false, ok: false };
  if (ch.requires && !check(ch.requires.cond, s)) return { visible: true, ok: false, reason: fill(ch.requires.reason, s) };
  if (ch.costCash && s.cash + (s.bank ?? 0) < ch.costCash) return { visible: true, ok: false, reason: `Needs ${money(ch.costCash)}.` };
  return { visible: true, ok: true };
}


function passDays(ctx: Ctx, n: number) {
  for (let i = 0; i < n && !ctx.s.dead; i++) runDay(ctx, null);
}

/** After any action: story first, then chance of a random event, then warnings. */
function afterAction(ctx: Ctx, daysPassed: number) {
  checkBeats(ctx);
  activatePending(ctx);
  if (daysPassed > 0 && !ctx.s.pendingEvent) rollEvent(ctx, daysPassed);
  activatePending(ctx);
  thresholdWarnings(ctx);
}

export function step(state: GameState, action: Action): StepOutput {
  const avail = actionAvailable(state, action);
  if (!avail.ok) return { state, log: [], days: 0, ok: false, error: avail.reason };

  const s: GameState = structuredClone(state);
  s.newWarnings = [];
  const ctx: Ctx = { s, rng: createRng(s.rng), log: [] };
  const startDay = s.day;
  let outcome: StepOutcome | undefined;

  switch (action.type) {
    case 'activity': {
      const def = activityById(action.id)!;
      for (let i = 0; i < def.days && !s.dead; i++) runDay(ctx, def, i);
      break;
    }
    case 'eat': {
      const f = foodById(action.id)!;
      if (f.price > 0) pay(ctx, f.price, f.name, 'food');
      if (f.kitchen) {
        s.lastKitchenDay = s.day;
        counter(ctx, 'kitchenMeals');
        if ((s.relationships.ines ?? 0) < B.kitchen.inesMealCap) addRel(ctx, 'ines', B.kitchen.inesPerMeal);
      }
      addStat(ctx, 'food', f.food);
      if (f.happiness) addStat(ctx, 'happiness', f.happiness);
      s.mealsToday.quality += f.quality;
      s.mealsToday.count += 1;
      counter(ctx, 'meals');
      learn(ctx, ['diet']);
      log(ctx, 'info', `Ate: ${fill(f.name)}${f.price ? ` (${money(f.price)})` : ''}.`);
      if (f.risk && ctx.rng.chance(f.risk.chance)) {
        addStat(ctx, 'health', f.risk.health);
        log(ctx, 'bad', `${f.risk.text} (${f.risk.health} health, ${pct(f.risk.chance)} chance)`);
      }
      break;
    }
    case 'buy': {
      const def = itemById(action.id)!;
      pay(ctx, def.price, def.name, 'goods');
      if (def.delivers) {
        s.deliveries.push({ itemId: def.delivers, arrivesDay: s.day + (def.deliveryDays ?? 0) });
        log(ctx, 'info', `Ordered: ${def.name}. It arrives in ${def.deliveryDays} days.`);
      } else {
        addItem(ctx, def.id);
        log(ctx, 'info', `Bought: ${def.name} (${money(def.price)}).`);
      }
      applyEffect(ctx, def.onBuy, def.name);
      counter(ctx, 'purchases');
      break;
    }
    case 'travel': {
      const days = travelDays(s);
      for (let i = 0; i < days && !s.dead; i++) runDay(ctx, { id: 'walk', name: 'Walk', verb: 'Walked', desc: '', category: 'life', kind: 'rest', days: 1, energy: 15, foodMult: 1 } as never, 0);
      s.district = action.to;
      log(ctx, 'info', `${days ? 'Walked' : 'Took the bus'} to ${fill(`{${action.to}}`)}.`);
      break;
    }
    case 'housing': {
      const h = housingById(action.id);
      if (h.tier === 'street') {
        moveTo(ctx, 'street');
        log(ctx, 'info', 'You gave up your bed.');
        break;
      }
      // Moving from one room to another: the old deposit comes back.
      if (s.deposit > 0) {
        addCash(ctx, s.deposit, 'Deposit returned', 'housing');
        s.deposit = 0;
      }
      pay(ctx, h.deposit, `Deposit: ${fill(h.name)}`, 'housing');
      pay(ctx, h.rent, `First week: ${fill(h.name)}`, 'housing');
      s.deposit = h.deposit;
      moveTo(ctx, action.id);
      counter(ctx, 'moves');
      log(ctx, 'good', `Moved into: ${fill(h.name)}. Rent of ${money(h.rent)} is due every ${B.rent.periodDays} days.`);
      break;
    }
    case 'bank': {
      if (action.op === 'open') {
        s.bank = 0;
        addCash(ctx, -B.bank.minOpeningDeposit, 'Opening deposit', 'transfer');
        addBank(ctx, B.bank.minOpeningDeposit, 'Opening deposit', 'transfer');
        log(ctx, 'good', 'Opened a checking account at {creditUnion}.');
      } else if (action.op === 'deposit') {
        const amt = r2(action.amount);
        addCash(ctx, -amt, 'Deposit', 'transfer');
        addBank(ctx, amt, 'Deposit', 'transfer');
        log(ctx, 'info', `Deposited ${money(amt)}.`);
      } else {
        const amt = r2(action.amount);
        addBank(ctx, -amt, 'Withdrawal', 'transfer');
        addCash(ctx, amt, 'Withdrawal', 'transfer');
        log(ctx, 'info', `Withdrew ${money(amt)}.`);
      }
      break;
    }
    case 'choose': {
      const pe = s.pendingEvent!;
      const e = eventById(pe.id);
      s.pendingEvent = null;
      if (!e) break;
      if (!e.choices?.length) break; // outcome-only events were applied when they fired
      const ch = e.choices[action.choice];
      const av = ch ? choiceAvailable(s, ch) : { ok: false };
      if (!ch || !av.ok) return { state, log: [], days: 0, ok: false, error: 'That choice isn’t available.' };
      if (ch.costCash) pay(ctx, ch.costCash, fill(e.title, s), 'event');
      const p = resolveChance(ch.chance, s);
      const success = ch.chance === undefined ? true : ctx.rng.chance(p);
      const out = success ? ch.success : (ch.failure ?? ch.success);
      applyEffect(ctx, out.effects, fill(e.title, s));
      log(ctx, success ? 'good' : 'bad', out.text);
      outcome = { title: fill(e.title, s), text: fill(out.text, s), success: ch.chance === undefined ? null : success, chance: ch.chance === undefined ? null : p };
      if (out.effects?.days) passDays(ctx, out.effects.days);
      break;
    }
    case 'nameDog': {
      if (s.dog) {
        s.dog.name = action.name.trim().slice(0, 20);
        s.pendingPrompt = null;
        journal(ctx, `There’s a dog now. I named them ${s.dog.name}. We’re a team, apparently.`);
        log(ctx, 'good', `${s.dog.name} is yours now. They need food: $9 buys a week.`);
      }
      break;
    }
    case 'dismissStory':
      s.pendingStory.shift();
      break;
    case 'ackWarnings':
      break;
  }

  const days = s.day - startDay;
  if (action.type !== 'dismissStory' && action.type !== 'ackWarnings') afterAction(ctx, days);
  else activatePending(ctx);
  s.rng = ctx.rng.state();
  return { state: s, log: ctx.log, days: s.day - startDay, ok: true, outcome };
}

/** Days left, formatted: used in a couple of engine messages and the UI. */
export const spanText = formatSpan;
