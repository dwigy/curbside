// Derived values shared by the engine and the UI. Anything the UI displays as a
// probability or a range comes from here, and the engine rolls against the same numbers.

import { ACTIVITIES, activityById } from '../content/activities';
import { BALANCE } from '../content/balance';
import { districtById } from '../content/districts';
import { FOODS, foodById } from '../content/foods';
import { HOUSING, housingById } from '../content/housing';
import { itemById, ITEMS } from '../content/items';
import { GOALS } from '../content/story';
import type { ActivityDef, HousingTier } from '../content/types';
import { isHolidaySeason, seasonOf, weekdayOf } from './calendar';
import { check, hasItem } from './conditions';
import { clamp, r2 } from './ops';
import { fill } from './text';
import type { Action, Availability, DistrictId, GameState, Weather } from './types';

const B = BALANCE;

export const ageDays = (s: GameState) => s.character.startAgeDays + s.day;
export const daysLeft = (s: GameState) => Math.max(0, Math.floor(s.lifeExpectancyDays - ageDays(s)));
export const netWorth = (s: GameState) => r2(s.cash + (s.bank ?? 0) + s.deposit);
export const tierOf = (s: GameState): HousingTier => housingById(s.housing).tier;

/** Days of life lost per calendar day over the recent window (1.0 = normal aging). */
export function lifeBurnRate(s: GameState): number {
  const h = s.lifeHistory;
  if (h.length < 2) return 1;
  return r2((h[0] - h[h.length - 1]) / (h.length - 1));
}

export function lifeTrend(s: GameState): 'down' | 'flat' | 'up' {
  const rate = lifeBurnRate(s);
  if (rate > 1.25) return 'down';
  if (rate < 0.9) return 'up';
  return 'flat';
}

/** 0 (street) .. 1 (thriving). Drives the palette shift. */
export function prosperity(s: GameState): number {
  const tier = { street: 0, shelter: 0.12, room: 0.3 }[tierOf(s)];
  const nw = Math.max(0, netWorth(s));
  return r2(clamp(tier + (Math.log10(1 + nw) / 6) * 0.7, 0, 1));
}

// ---------------------------------------------------------------------------
// Hustle projections
// ---------------------------------------------------------------------------

export interface Factor {
  label: string;
  mult: number;
}

export interface Projection {
  /** Probability the hustle pays at all (1 for most). */
  chance: number;
  min: number;
  max: number;
  /** chance * mean pay */
  expected: number;
  factors: Factor[];
}

function districtMult(kind: keyof typeof B.districtMult, d: DistrictId): number {
  return (B.districtMult[kind] as Partial<Record<DistrictId, number>>)[d] ?? 1;
}

function weatherMult(kind: keyof typeof B.weatherMult, w: Weather): number {
  return (B.weatherMult[kind] as Partial<Record<Weather, number>>)[w] ?? 1;
}

function conditionFactors(s: GameState): Factor[] {
  const f: Factor[] = [];
  if (s.stats.energy < B.needs.tiredAt) f.push({ label: 'Exhausted', mult: B.needs.tiredIncomeMult });
  if (s.stats.food < B.needs.hungryAt) f.push({ label: 'Hungry', mult: B.needs.hungryIncomeMult });
  if (s.stats.happiness < B.happiness.miserableAt) f.push({ label: 'Miserable', mult: B.happiness.miserableIncomeMult });
  return f;
}

function spread(base: number, sp: number, factors: Factor[], chance = 1): Projection {
  const mult = factors.reduce((m, f) => m * f.mult, 1);
  const min = r2(base * (1 - sp) * mult);
  const max = r2(base * (1 + sp) * mult);
  return { chance, min, max, expected: r2(chance * ((min + max) / 2)), factors: factors.filter((f) => Math.abs(f.mult - 1) > 0.001) };
}

export function shelterCurfew(s: GameState): boolean {
  return s.housing === 'shelter';
}

export function projectHustle(s: GameState, kind: string): Projection | null {
  const H = B.hustles;
  const w = s.weather;
  const d = s.district;
  const cond = conditionFactors(s);
  switch (kind) {
    case 'beg': {
      const f: Factor[] = [
        { label: 'Charisma', mult: 1 + s.skills.charisma / H.beg.charismaDivisor },
        { label: 'District', mult: districtMult('beg', d) },
        { label: 'Weather', mult: weatherMult('beg', w) },
      ];
      if (s.dog) f.push({ label: 'Your dog', mult: B.dog.incomeMult });
      const fat = s.spotFatigue[d] ?? 0;
      if (fat > 0) f.push({ label: 'Worn-out corner', mult: 1 - fat });
      if (isHolidaySeason(s.day)) f.push({ label: 'Holiday season', mult: H.beg.holidayMult });
      return spread(H.beg.base, H.beg.spread, [...f, ...cond]);
    }
    case 'scavenge': {
      const f: Factor[] = [
        { label: 'Street smarts', mult: 1 + s.skills.streetSmarts / H.scavenge.skillDivisor },
        { label: 'District', mult: districtMult('scavenge', d) },
        { label: 'Weather', mult: weatherMult('scavenge', w) },
      ];
      if (hasItem(s, 'shopping_cart')) f.push({ label: 'Shopping cart', mult: H.scavenge.cartMult });
      if (s.flags.wickRoute) f.push({ label: 'Wick’s route', mult: H.scavenge.wickRouteMult });
      return spread(H.scavenge.base, H.scavenge.spread, [...f, ...cond]);
    }
    case 'busk': {
      const base = hasItem(s, 'guitar') ? H.busk.guitar : H.busk.harmonica;
      const f: Factor[] = [
        { label: 'Music skill', mult: 1 + s.skills.music / H.busk.skillDivisor },
        { label: 'District', mult: districtMult('busk', d) },
        { label: 'Weather', mult: weatherMult('busk', w) },
      ];
      if (shelterCurfew(s)) f.push({ label: 'Shelter curfew', mult: B.shelter.curfewMult });
      return spread(base, H.busk.spread, [...f, ...cond]);
    }
    case 'oddJobs': {
      const o = H.oddJobs;
      const chance = r2(clamp(o.chanceBase + s.skills.streetSmarts * o.chancePerStreetSmarts + s.reputation * o.chancePerRep, 0.05, o.chanceMax));
      const mid = (o.payMin + o.payMax) / 2;
      const sp = (o.payMax - o.payMin) / 2 / mid;
      return spread(mid, sp, [{ label: 'Trade skill', mult: 1 + s.skills.trade / o.tradeDivisor }, ...cond], chance);
    }
    case 'dayLabor': {
      const L = H.dayLabor;
      let c = L.chanceBase + s.skills.trade * L.chancePerTrade;
      if (hasItem(s, 'clean_clothes')) c += L.cleanClothesBonus;
      if (s.flags.priyaCrew) c += L.crewBonus;
      if (s.stats.energy < 40) c -= L.tiredPenalty;
      if (seasonOf(s.day) === 'winter') c -= L.winterPenalty;
      const chance = r2(clamp(c, 0.05, L.chanceMax));
      return { chance, min: L.pay, max: L.pay, expected: r2(chance * L.pay), factors: [] };
    }
    case 'deliveries': {
      const D = H.deliveries;
      const f: Factor[] = [{ label: 'District', mult: districtMult('deliveries', d) }];
      if (w === 'rain') f.push({ label: 'Rain surge', mult: D.rainMult });
      if (shelterCurfew(s)) f.push({ label: 'Shelter curfew', mult: B.shelter.curfewMult });
      return spread(D.base, D.spread, [...f, ...cond]);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Other odds
// ---------------------------------------------------------------------------

export function theftChance(s: GameState): number {
  const base = B.theft.nightly[tierOf(s)];
  const low = s.cash < B.theft.lowCashThreshold ? B.theft.lowCashMult : 1;
  const smarts = 1 - s.skills.streetSmarts / B.theft.streetSmartsDivisor;
  if (s.cash <= 0 || s.day < B.theft.graceDays) return 0;
  return r2(base * low * smarts * 10000) / 10000;
}

export function bikeTheftChance(s: GameState): number {
  if (!hasItem(s, 'bike') || hasItem(s, 'bike_lock') || tierOf(s) === 'room' || s.day < B.theft.graceDays) return 0;
  return B.theft.bikeNoLockNightly;
}

export function shelterBedChance(s: GameState): number {
  const base = seasonOf(s.day) === 'winter' ? B.shelter.winterBedChance : B.shelter.bedChance;
  const bonus = (s.relationships.ines ?? 0) >= B.shelter.trustedAt ? B.shelter.trustedBonus : 0;
  return r2(clamp(base + bonus, 0, 0.95));
}

export function eventChanceToday(s: GameState): number {
  if (!s.eventsEnabled || s.day < B.events.graceDays) return 0;
  return B.events.dailyChance;
}

// ---------------------------------------------------------------------------
// Availability: one source of truth for what's allowed, and why not.
// ---------------------------------------------------------------------------

const yes: Availability = { ok: true };
const no = (reason: string): Availability => ({ ok: false, reason: fill(reason) });

export function activityVisible(s: GameState, a: ActivityDef): boolean {
  return check(a.visible, s);
}

export function activityAvailable(s: GameState, a: ActivityDef): Availability {
  if (!check(a.requires, s)) return no(a.requiresReason ?? 'Not available.');
  switch (a.kind) {
    case 'dayLabor':
      if (s.district !== 'riverfront') return no('The labor lot is in {riverfront}.');
      break;
    case 'deliveries':
      if (s.weather === 'snow') return no('Too icy to ride today.');
      break;
    case 'clinic':
      if (s.district !== 'riverfront') return no('The clinic is in {riverfront}.');
      if (s.stats.health >= 95) return no('You’re healthy. They’d send you home.');
      break;
    case 'rest':
      if (s.stats.energy >= 100) return no('You’re fully rested.');
      break;
    case 'shelterIntake':
      if (s.housing !== 'street') return no('You already have a bed.');
      if (s.district !== 'riverfront') return no('The shelter is in {riverfront}.');
      if (s.shelterBarredUntil !== null && s.day < s.shelterBarredUntil)
        return no(`Your stay limit reset: you can reapply in ${s.shelterBarredUntil - s.day} days.`);
      if (s.dog && (s.relationships.wick ?? 0) < 15) return no('No pets allowed, and there’s nobody to watch {dog}.');
      break;
    case 'dmv':
      if (hasItem(s, 'state_id')) return no('You already have a State ID.');
      if (s.cash + (s.bank ?? 0) < B.activities.dmv.fee) return no(`The fee is $${B.activities.dmv.fee}.`);
      break;
  }
  return yes;
}

export function kitchenOpen(s: GameState): Availability {
  if (s.district !== 'riverfront') return no('The kitchen is in {riverfront}.');
  if (weekdayOf(s.day) === B.kitchen.closedWeekday) return no('Closed Sundays.');
  if (s.lastKitchenDay === s.day) return no('Already ate there today. Come back tomorrow.');
  return yes;
}

export function foodAvailable(s: GameState, id: string): Availability {
  const f = foodById(id);
  if (!f) return no('Unknown food.');
  if (f.kitchen) {
    const k = kitchenOpen(s);
    if (!k.ok) return k;
  }
  if (!check(f.requires, s)) return no(f.requiresReason ?? 'Not available.');
  if (s.stats.food >= 100) return no('You couldn’t eat another bite.');
  if (f.price > s.cash + (s.bank ?? 0)) return no(`Costs $${f.price}.`);
  return yes;
}

export function itemVisible(s: GameState, id: string): boolean {
  const def = itemById(id);
  return !!def && def.shop !== 'none' && check(def.visible, s);
}

export function itemAvailable(s: GameState, id: string): Availability {
  const def = itemById(id);
  if (!def) return no('Unknown item.');
  if (!check(def.requires, s)) return no(def.requiresReason ?? 'Not available.');
  if (def.delivers) {
    if (hasItem(s, def.delivers) || s.deliveries.some((d) => d.itemId === def.delivers) || hasItem(s, 'state_id'))
      return no('Already on its way, or already have it.');
  } else if (!def.consumable && !def.expiresDays && hasItem(s, id)) return no('You already have one.');
  if (def.expiresDays && hasItem(s, id) && (s.expiries[id] ?? 0) - s.day > def.expiresDays) return no('Already renewed.');
  if (def.price > s.cash + (s.bank ?? 0)) return no(`Costs $${def.price}. You have $${r2(s.cash + (s.bank ?? 0))}.`);
  return yes;
}

export function housingMoveInCost(id: string): number {
  const h = housingById(id);
  return h.deposit + h.rent;
}

export function housingAvailable(s: GameState, id: string): Availability {
  const h = HOUSING.find((x) => x.id === id);
  if (!h) return no('Unknown housing.');
  if (s.housing === id) return no('You live here.');
  if (h.tier === 'shelter') return no('Ask for a bed on the Life tab.');
  if (h.tier === 'street') return yes;
  if (!check(h.requires, s)) return no(h.requiresReason ?? 'Not available.');
  if ((s.relationships.ines ?? 0) < B.rent.referenceAt && (s.relationships.priya ?? 0) < B.rent.referenceAt)
    return no('The landlord wants a reference. {inesShort} will vouch for you once she knows you better. Keep showing up.');
  if (s.dog && !h.pets) return no('No pets. {roomCanal} takes dogs.');
  const cost = housingMoveInCost(id);
  if (cost > s.cash + (s.bank ?? 0)) return no(`Move-in costs $${cost} (deposit + first week).`);
  return yes;
}

export function travelAvailable(s: GameState, to: DistrictId): Availability {
  if (!s.unlocked.city) return no('You don’t know the city well enough yet.');
  if (to === s.district) return no('You’re already here.');
  const d = districtById(to);
  if (!d.open || !check(d.open, s)) return no(d.lockedReason);
  return yes;
}

export function travelDays(s: GameState): number {
  return hasItem(s, 'bus_pass') ? 0 : B.travel.walkDays;
}

export function bankAvailable(s: GameState, op: 'open' | 'deposit' | 'withdraw', amount: number): Availability {
  if (op === 'open') {
    if (s.bank !== null) return no('You already have an account.');
    if (!hasItem(s, 'state_id')) return no('You need a State ID to open an account.');
    if (s.cash < B.bank.minOpeningDeposit) return no(`You need $${B.bank.minOpeningDeposit} in cash to open an account.`);
    return yes;
  }
  if (s.bank === null) return no('Open an account first.');
  if (!(amount > 0)) return no('Enter an amount.');
  if (op === 'deposit' && amount > s.cash + 1e-9) return no('You don’t have that much cash.');
  if (op === 'withdraw' && amount > s.bank + 1e-9) return no('Not enough in the account.');
  return yes;
}

/** Is the game waiting on the player to resolve something first? */
export function blocked(s: GameState): string | null {
  if (s.dead) return 'dead';
  if (s.pendingPrompt) return 'prompt';
  if (s.pendingEvent) return 'event';
  if (s.pendingStory.length) return 'story';
  return null;
}

export function actionAvailable(s: GameState, a: Action): Availability {
  const b = blocked(s);
  switch (a.type) {
    case 'choose':
      return s.pendingEvent ? yes : no('Nothing to choose.');
    case 'nameDog':
      return s.pendingPrompt === 'nameDog' && a.name.trim() ? yes : no('Give your dog a name.');
    case 'dismissStory':
      return s.pendingStory.length ? yes : no('No story to dismiss.');
    case 'ackWarnings':
      return yes;
  }
  if (b) return no(b === 'dead' ? 'This life is over.' : 'Finish what’s in front of you first.');
  switch (a.type) {
    case 'activity': {
      const def = activityById(a.id);
      if (!def) return no('Unknown activity.');
      if (!activityVisible(s, def)) return no('Not available yet.');
      return activityAvailable(s, def);
    }
    case 'eat':
      return foodAvailable(s, a.id);
    case 'buy':
      if (!itemVisible(s, a.id) || !s.unlocked.shop) return no('Not for sale here.');
      return itemAvailable(s, a.id);
    case 'travel':
      return travelAvailable(s, a.to);
    case 'housing':
      return housingAvailable(s, a.id);
    case 'bank':
      return bankAvailable(s, a.op, a.amount);
  }
}

/** Days and cash an action will cost, for misclick confirmations. */
export function actionCost(s: GameState, a: Action): { days: number; cash: number } {
  switch (a.type) {
    case 'activity': {
      const def = activityById(a.id);
      const cash = def?.kind === 'dmv' ? B.activities.dmv.fee : 0;
      return { days: def?.days ?? 0, cash };
    }
    case 'eat':
      return { days: 0, cash: foodById(a.id)?.price ?? 0 };
    case 'buy':
      return { days: 0, cash: itemById(a.id)?.price ?? 0 };
    case 'travel':
      return { days: travelDays(s), cash: 0 };
    case 'housing':
      return { days: 0, cash: a.id === 'street' ? 0 : housingMoveInCost(a.id) };
    default:
      return { days: 0, cash: 0 };
  }
}

export function needsConfirm(s: GameState, a: Action): boolean {
  const c = actionCost(s, a);
  const funds = s.cash + (s.bank ?? 0);
  return c.days > B.confirm.days || (c.cash > 0 && c.cash > funds * B.confirm.cashFraction && c.cash >= 5) || (a.type === 'housing' && a.id === 'street');
}

export function currentGoal(s: GameState) {
  return GOALS.find((g) => check(g.when, s) && !check(g.done, s)) ?? null;
}

export function visibleActivities(s: GameState, category: 'hustle' | 'life') {
  return ACTIVITIES.filter((a) => a.category === category && activityVisible(s, a));
}

export function visibleFoods(s: GameState) {
  return FOODS.filter((f) => !f.requires || check(f.requires, s) || f.id === 'groceries');
}

export function visibleItems(s: GameState) {
  return ITEMS.filter((i) => itemVisible(s, i.id));
}

export function visibleHousing(s: GameState) {
  return HOUSING.filter((h) => check(h.visible, s));
}

/** Cheapest food that's actually available and worth eating, for auto-eat. */
export function autoEatChoice(s: GameState): string | null {
  const opts = FOODS.filter((f) => f.id !== 'dumpster' && foodAvailable(s, f.id).ok);
  if (!opts.length) return null;
  opts.sort((a, b) => a.price / a.food - b.price / b.food || b.quality - a.quality);
  return opts[0].id;
}
