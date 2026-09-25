// The day loop: everything that happens when a day passes.

import { BALANCE } from '../content/balance';
import { EVENTS } from '../content/events';
import { housingById } from '../content/housing';
import { itemName } from '../content/items';
import { BEATS } from '../content/story';
import { STORY_EVENTS } from '../content/storyEvents';
import type { ActivityDef } from '../content/types';
import { formatSpan, seasonOf } from './calendar';
import { check, hasItem } from './conditions';
import {
  addCash, addSkill, addStat, applyEffect, clamp, counter, type Ctx, journal, learn, log, pay, r2, removeItem, warn,
} from './ops';
import { ageDays, bikeTheftChance, daysLeft, eventChanceToday, projectHustle, shelterBedChance as shelterChance, theftChance, tierOf } from './selectors';
import { money, pct } from './text';
import type { EventDef, GameState, SkillKey, Weather } from './types';

const B = BALANCE;

export const ALL_EVENTS: EventDef[] = [...STORY_EVENTS, ...EVENTS];
export const eventById = (id: string) => ALL_EVENTS.find((e) => e.id === id);

export function rollWeather(ctx: Ctx): Weather {
  const table = B.weather[seasonOf(ctx.s.day)];
  const r = ctx.rng.next();
  let acc = 0;
  for (const w of ['rain', 'cold', 'heat', 'snow'] as const) {
    acc += table[w];
    if (r < acc) return w;
  }
  return 'clear';
}

// ---------------------------------------------------------------------------
// Hustle and life activity outcomes (the daytime part of a day)
// ---------------------------------------------------------------------------

function gainSkills(ctx: Ctx, gains: Partial<Record<SkillKey, number>>) {
  for (const [k, v] of Object.entries(gains)) addSkill(ctx, k as SkillKey, v ?? 0);
}

function earn(ctx: Ctx, amount: number, reason: string) {
  if (amount <= 0) return;
  addCash(ctx, amount, reason, 'income');
  counter(ctx, 'earned', amount);
}

function doHustle(ctx: Ctx, a: ActivityDef) {
  const s = ctx.s;
  const p = projectHustle(s, a.kind);
  if (!p) return;
  const G = B.hustles.skillGain;
  counter(ctx, 'hustleDays');
  const success = p.chance >= 1 || ctx.rng.chance(p.chance);
  const amount = success ? Math.round(ctx.rng.range(p.min, p.max + 0.999)) : 0;
  switch (a.kind) {
    case 'beg': {
      earn(ctx, amount, 'Asked for change');
      counter(ctx, 'begDays');
      gainSkills(ctx, G.beg);
      s.spotFatigue[s.district] = r2(Math.min(B.spotFatigue.max, (s.spotFatigue[s.district] ?? 0) + B.spotFatigue.perDay));
      log(ctx, 'good', `Asked for change: ${money(amount)}.`);
      break;
    }
    case 'scavenge': {
      earn(ctx, amount, 'Can & bottle deposits');
      counter(ctx, 'scavengeDays');
      gainSkills(ctx, G.scavenge);
      log(ctx, 'good', `Returned cans and bottles: ${money(amount)}.`);
      if (ctx.rng.chance(B.hustles.scavenge.findChance)) {
        const found = ctx.rng.int(3, 15);
        earn(ctx, found, 'Found in a bin');
        log(ctx, 'good', `Found ${money(found)} tucked in an old jacket in a bin.`);
      }
      break;
    }
    case 'busk': {
      earn(ctx, amount, 'Busking tips');
      counter(ctx, 'buskDays');
      gainSkills(ctx, G.busk);
      log(ctx, 'good', `Busked: ${money(amount)} in the case.`);
      break;
    }
    case 'oddJobs': {
      counter(ctx, 'oddJobsDays');
      if (success) {
        earn(ctx, amount, 'Odd job');
        gainSkills(ctx, G.oddJobs);
        log(ctx, 'good', `Got an odd job: ${money(amount)}.`);
      } else {
        gainSkills(ctx, G.oddJobsMiss);
        log(ctx, 'bad', `No odd jobs came through today (${pct(p.chance)} chance).`);
      }
      break;
    }
    case 'dayLabor': {
      counter(ctx, 'dayLaborTries');
      if (success) {
        counter(ctx, 'dayLaborHired');
        earn(ctx, amount, 'Day labor wages');
        gainSkills(ctx, G.dayLabor);
        log(ctx, 'good', `Picked for a crew: ${money(amount)} for the day.`);
      } else {
        log(ctx, 'bad', `Not picked at the lot today (${pct(p.chance)} chance).`);
        // You still spent the early morning; the rest of the day is lost too.
      }
      break;
    }
    case 'deliveries': {
      counter(ctx, 'deliveriesDays');
      earn(ctx, amount, 'Delivery pay');
      gainSkills(ctx, G.deliveries);
      if (s.weather === 'rain') addStat(ctx, 'health', B.hustles.deliveries.rainHealth);
      log(ctx, 'good', `Delivered all day: ${money(amount)}.`);
      break;
    }
  }
}

function doLife(ctx: Ctx, a: ActivityDef, dayIndex: number) {
  const s = ctx.s;
  const A = B.activities;
  switch (a.kind) {
    case 'rest':
      addStat(ctx, 'energy', A.rest.energy);
      addStat(ctx, 'happiness', A.rest.happiness);
      log(ctx, 'info', 'Rested.');
      break;
    case 'clinic': {
      counter(ctx, 'clinicVisits');
      if (ctx.rng.chance(A.clinic.seenChance)) {
        addStat(ctx, 'health', A.clinic.health);
        log(ctx, 'good', `Seen at the clinic: +${A.clinic.health} health.`);
      } else {
        addStat(ctx, 'health', A.clinic.healthIfNotSeen);
        log(ctx, 'bad', `Waited all day and wasn’t seen (${pct(A.clinic.seenChance)} chance). A nurse gave you something for the cough.`);
      }
      break;
    }
    case 'library':
      counter(ctx, 'libraryDays');
      addStat(ctx, 'happiness', A.library.happiness);
      addSkill(ctx, 'streetSmarts', A.library.streetSmarts);
      addSkill(ctx, 'charisma', A.library.charisma);
      log(ctx, 'info', 'Spent the day at the library. Warm, quiet, and nobody asked you to leave.');
      break;
    case 'shelterIntake': {
      const c = shelterChance(s);
      if (ctx.rng.chance(c)) {
        moveTo(ctx, 'shelter');
        s.shelterUntil = s.day + B.shelter.maxStay;
        log(ctx, 'good', `A cot opened up. You have a bed at the shelter for up to ${B.shelter.maxStay} nights.`);
        if (s.dog) log(ctx, 'info', '{wick} will keep {dog} at the camp while you’re at the shelter.');
      } else {
        log(ctx, 'bad', `No beds tonight (${pct(c)} chance). Try again tomorrow.`);
      }
      break;
    }
    case 'dmv':
      if (dayIndex === 0) pay(ctx, A.dmv.fee, 'State ID fee', 'fees');
      if (dayIndex === a.days - 1) {
        ctx.s.items.state_id = 1;
        log(ctx, 'good', 'You have a State ID.');
      }
      break;
  }
}

// ---------------------------------------------------------------------------
// Housing
// ---------------------------------------------------------------------------

export function moveTo(ctx: Ctx, id: GameState['housing']) {
  const s = ctx.s;
  const h = housingById(id);
  s.housing = id;
  s.housingSince = s.day;
  s.rentArrears = 0;
  s.evictionDay = null;
  if (h.tier === 'room') {
    s.rentDueDay = s.day + B.rent.periodDays;
  } else {
    s.rentDueDay = null;
  }
  if (h.tier !== 'shelter') s.shelterUntil = null;
}

function leaveToStreet(ctx: Ctx, why: string) {
  moveTo(ctx, 'street');
  log(ctx, 'bad', why);
}

function rentTick(ctx: Ctx) {
  const s = ctx.s;
  const h = housingById(s.housing);
  if (h.tier !== 'room' || s.rentDueDay === null) return;
  if (s.day >= s.rentDueDay) {
    s.rentArrears = r2(s.rentArrears + h.rent);
    s.rentDueDay += B.rent.periodDays;
  }
  if (s.rentArrears > 0) {
    const paid = pay(ctx, s.rentArrears, `Rent: ${h.name}`, 'housing');
    s.rentArrears = r2(s.rentArrears - paid);
    if (paid > 0) counter(ctx, 'rentPaid', paid);
    if (s.rentArrears > 0) {
      if (s.evictionDay === null) {
        s.evictionDay = s.day + B.rent.graceDays;
        warn(ctx, 'rent_late', `Rent is late: you owe ${money(s.rentArrears)}. Pay within ${B.rent.graceDays} days or you’ll be evicted and lose your deposit.`);
      } else if (s.day >= s.evictionDay) {
        const lost = s.deposit;
        s.deposit = 0;
        s.rentArrears = 0;
        counter(ctx, 'evictions');
        leaveToStreet(ctx, `Evicted. The deposit (${money(lost)}) covers what you owed. You’re back under the overpass.`);
        journal(ctx, 'Evicted. I packed everything in eleven minutes. It all still fits in one bag.');
        warn(ctx, 'evicted', 'You were evicted for unpaid rent.');
        s.relationships.albescu = (s.relationships.albescu ?? 0) - 10;
      }
    } else if (s.evictionDay !== null) {
      s.evictionDay = null;
      log(ctx, 'good', 'Rent caught up. The landlord nods at you in the hall.');
    }
  }
}

function shelterTick(ctx: Ctx) {
  const s = ctx.s;
  if (s.housing !== 'shelter' || s.shelterUntil === null) return;
  const left = s.shelterUntil - s.day;
  if (left === 3) warn(ctx, 'shelter_ending', 'Your shelter stay ends in 3 days. Have a plan.');
  if (left <= 0) {
    s.shelterBarredUntil = s.day + B.shelter.cooldown;
    leaveToStreet(ctx, `Your ${B.shelter.maxStay} nights at the shelter are up. You can reapply in ${B.shelter.cooldown} days.`);
  }
}

// ---------------------------------------------------------------------------
// The night: needs, health, lifespan, upkeep, theft
// ---------------------------------------------------------------------------

function nightly(ctx: Ctx, a: ActivityDef | null) {
  const s = ctx.s;
  const tier = tierOf(s);
  const season = seasonOf(s.day);
  const street = tier === 'street';
  const bag = hasItem(s, 'sleeping_bag');

  // Food
  const foodMult = a?.foodMult ?? 1;
  addStat(ctx, 'food', -B.needs.foodDrain * foodMult);
  const hungry = s.stats.food < B.needs.hungryAt;
  const starving = s.stats.food <= B.needs.starvingAt;

  // Energy: spent during the day, recovered at night
  addStat(ctx, 'energy', -(a?.energy ?? 10));
  const exhausted = s.stats.energy < 15;
  addStat(ctx, 'energy', B.needs.sleep[tier] + (street && bag ? B.needs.sleepingBagBonus : 0));

  // Diet
  if (s.mealsToday.count > 0) {
    const q = s.mealsToday.quality / s.mealsToday.count;
    s.diet = r2(s.diet * (1 - B.diet.smoothing) + q * B.diet.smoothing);
  }
  s.mealsToday = { quality: 0, count: 0 };

  // Health
  const HD = B.health.daily;
  let dh = HD[tier];
  if (street && season === 'winter') dh += bag ? HD.winterStreet / 2 : HD.winterStreet;
  if (street && s.weather === 'rain') dh += HD.rainStreet;
  if (street && s.weather === 'snow') dh += bag ? HD.snowStreet / 2 : HD.snowStreet;
  if (starving) dh += HD.starving;
  else if (hungry) dh += HD.hungry;
  if (exhausted) dh += HD.exhausted;
  if (s.stats.food > 50 && s.stats.energy > 40) dh += HD.wellRested;
  dh += (s.diet - 50) * B.health.dietFactor;
  addStat(ctx, 'health', dh);

  // Happiness
  const HP = B.happiness.daily;
  let dj = HP[tier] + (a?.happiness ?? 0);
  if (s.dog && s.dog.bond > 40 && s.housing !== 'shelter') dj += HP.dog;
  if (hungry) dj += HP.hungry;
  if (s.stats.health < 30) dj += HP.sick;
  addStat(ctx, 'happiness', dj);

  // Lifespan: extra days lost or gained on top of simply aging
  const L = B.life.dailyDelta;
  const loss: Record<string, number> = {};
  const add = (cause: string, v: number) => {
    loss[cause] = (loss[cause] ?? 0) + v;
  };
  add('the street', L[tier]);
  if (street && season === 'winter') add('the cold', bag ? L.winterStreet / 2 : L.winterStreet);
  if (s.stats.health < 20) add('illness', L.healthBelow20);
  else if (s.stats.health < 40) add('illness', L.healthBelow40);
  if (starving) add('hunger', L.starving);
  if (s.stats.happiness < B.happiness.miserableAt) add('despair', L.miserable);
  if (s.diet > B.diet.good) add('diet', L.goodDiet);
  else if (s.diet < B.diet.poor) add('diet', L.poorDiet);
  let total = 0;
  for (const [cause, v] of Object.entries(loss)) {
    total += v;
    if (v < 0) counter(ctx, `lifeLost:${cause}`, -v);
  }
  s.lifeExpectancyDays = r2(s.lifeExpectancyDays + total);

  // Spot fatigue recovers everywhere you didn't beg today
  for (const d of Object.keys(s.spotFatigue) as (keyof typeof s.spotFatigue)[]) {
    if (a?.kind === 'beg' && d === s.district) continue;
    s.spotFatigue[d] = r2(Math.max(0, s.spotFatigue[d] - B.spotFatigue.recovery));
  }

  // Dog
  if (s.dog) {
    const dog = s.dog;
    if (dog.foodDays > 0) {
      dog.foodDays -= 1;
      dog.hungryDays = 0;
      dog.bond = r2(clamp(dog.bond + B.dog.bondPerDay, 0, 100));
    } else {
      dog.hungryDays += 1;
      dog.bond = r2(clamp(dog.bond - B.dog.bondLossHungry, 0, 100));
      const left = B.dog.leavesAfterHungryDays - dog.hungryDays;
      if (left > 0) warn(ctx, `dog_hungry_${dog.hungryDays}`, `${dog.name || 'Your dog'} hasn’t eaten in ${dog.hungryDays} day${dog.hungryDays > 1 ? 's' : ''}. Buy dog food, or in ${left} day${left > 1 ? 's' : ''} they’ll go looking for someone who can feed them.`);
      else {
        log(ctx, 'bad', `${dog.name} is gone. You search every alley for two days.`);
        journal(ctx, `${dog.name} left. I couldn’t feed us both. I keep hearing tags jingling that aren’t there.`);
        addStat(ctx, 'happiness', -15);
        s.dog = null;
        s.flags.dogLost = true;
        warn(ctx, 'dog_left', 'Your dog left to find food.');
      }
    }
    if (s.dog && s.housing === 'shelter') s.dog.bond = r2(clamp(s.dog.bond - B.dog.bondLossApart, 0, 100));
  }

  // Theft
  const tc = theftChance(s);
  if (tc > 0 && ctx.rng.chance(tc)) {
    const take = r2(s.cash * ctx.rng.range(B.theft.takeMin, B.theft.takeMax));
    if (take > 0) {
      addCash(ctx, -take, 'Stolen while you slept', 'theft');
      counter(ctx, 'thefts');
      learn(ctx, ['theft']);
      log(ctx, 'bad', `Someone went through your things in the night. ${money(take)} is gone.`);
      warn(ctx, `theft_${s.day}`, `Robbed in the night: ${money(take)} stolen. Money in a bank account can’t be taken.`);
    }
  }
  const bt = bikeTheftChance(s);
  if (bt > 0 && ctx.rng.chance(bt)) {
    removeItem(ctx, 'bike');
    counter(ctx, 'bikesStolen');
    log(ctx, 'bad', 'Your bike is gone. The cut zip tie is still on the railing.');
    warn(ctx, `bike_${s.day}`, 'Your bike was stolen. A U-lock would have stopped it.');
  }

  counter(ctx, `nights${tier === 'street' ? 'Street' : tier === 'shelter' ? 'Shelter' : 'Room'}`);
}

// ---------------------------------------------------------------------------
// One full day
// ---------------------------------------------------------------------------

export function runDay(ctx: Ctx, a: ActivityDef | null, dayIndex = 0) {
  const s = ctx.s;
  if (s.dead) return;
  if (a) {
    if (a.category === 'hustle') doHustle(ctx, a);
    else doLife(ctx, a, dayIndex);
  }
  nightly(ctx, a);
  rentTick(ctx);
  shelterTick(ctx);

  // Midnight
  s.day += 1;
  const age = ageDays(s);
  if (age % 365 === 0) {
    log(ctx, 'story', `Happy birthday. You’re ${age / 365}.`);
    journal(ctx, `Turned ${age / 365} today.`);
  }
  s.weather = rollWeather(ctx);
  expiries(ctx);
  deliveries(ctx);

  // Collapse
  if (s.stats.health <= 0) collapse(ctx);

  s.lifeHistory.push(daysLeft(s));
  if (s.lifeHistory.length > B.life.historyLength) s.lifeHistory.splice(0, s.lifeHistory.length - B.life.historyLength);

  if (age >= s.lifeExpectancyDays) die(ctx);
}

function expiries(ctx: Ctx) {
  const s = ctx.s;
  for (const [id, until] of Object.entries(s.expiries)) {
    const left = until - s.day;
    if (left === 2) warn(ctx, `expiring_${id}`, `Your ${itemName(id).toLowerCase()} runs out in 2 days.`);
    if (left <= 0) {
      removeItem(ctx, id);
      log(ctx, 'bad', `Your ${itemName(id).toLowerCase()} ran out.`);
    }
  }
}

function deliveries(ctx: Ctx) {
  const s = ctx.s;
  const arrived = s.deliveries.filter((d) => d.arrivesDay <= s.day);
  if (!arrived.length) return;
  s.deliveries = s.deliveries.filter((d) => d.arrivesDay > s.day);
  for (const d of arrived) {
    s.items[d.itemId] = 1;
    log(ctx, 'good', `Mail for you at the kitchen: your ${itemName(d.itemId).toLowerCase()} arrived.`);
    warn(ctx, `arrived_${d.itemId}`, `Your ${itemName(d.itemId).toLowerCase()} arrived at the kitchen.`);
  }
}

function collapse(ctx: Ctx) {
  const s = ctx.s;
  const C = B.life.collapse;
  counter(ctx, 'collapses');
  const left = daysLeft(s);
  // A collapse costs months, but never takes you from warned-and-alive straight to dead.
  const newLeft = Math.max(left + C.lifeDays, Math.min(left, 30));
  s.lifeExpectancyDays = r2(s.lifeExpectancyDays - (left - newLeft));
  s.stats.health = C.healthAfter;
  s.stats.food = Math.max(s.stats.food, 40);
  s.stats.energy = Math.max(s.stats.energy, 30);
  s.day += C.days;
  log(ctx, 'bad', `You collapsed. You wake up in the ER at St. Agnes ${C.days} days later. It cost you ${formatSpan(left - newLeft)} of life.`);
  journal(ctx, 'I collapsed. I don’t remember falling. A nurse said I was lucky. I don’t feel lucky; I feel warned.');
  warn(ctx, `collapse_${s.day}`, `You collapsed from poor health and lost ${formatSpan(left - newLeft)} of life. Eat, rest, see the clinic.`);
}

export function causeOfDeath(s: GameState): string {
  let best = 'old age';
  let bestV = 365 * 2;
  for (const [k, v] of Object.entries(s.counters)) {
    if (k.startsWith('lifeLost:') && v > bestV) {
      best = k.slice(9);
      bestV = v;
    }
  }
  return best;
}

function die(ctx: Ctx) {
  const s = ctx.s;
  if (s.dead) return;
  s.dead = { day: s.day, ageDays: ageDays(s), cause: causeOfDeath(s) };
  log(ctx, 'story', 'Your story ends here.');
}

// ---------------------------------------------------------------------------
// Warnings that depend on thresholds (checked after every action)
// ---------------------------------------------------------------------------

export function thresholdWarnings(ctx: Ctx) {
  const s = ctx.s;
  if (s.dead) return;
  const left = daysLeft(s);
  for (const at of B.life.warnAt) {
    const id = `life_${at}`;
    if (left <= at && !(id in s.warnings)) {
      warn(ctx, id, `You have ${formatSpan(left)} of life left at this pace. ${at <= 90 ? 'This is the end of the road unless something changes now.' : 'Better food, shelter and care buy time back.'}`);
    } else if (left > at + 180 && id in s.warnings) {
      delete s.warnings[id];
    }
  }
  const gate = (id: string, bad: boolean, reset: boolean, text: string) => {
    if (bad && !(id in s.warnings)) warn(ctx, id, text);
    else if (reset && id in s.warnings) delete s.warnings[id];
  };
  gate('health_low', s.stats.health < 25, s.stats.health > 40, 'Your health is dangerously low. If it reaches 0 you’ll collapse. Rest, eat, or visit the free clinic.');
  gate('starving', s.stats.food < 10, s.stats.food > 30, 'You’re starving. Eat something now; starving wrecks your health fast.');
  gate('exhausted', s.stats.energy < 10, s.stats.energy > 30, 'You’re running on empty. Rest, or your health will pay.');
}

// ---------------------------------------------------------------------------
// Story beats and random events
// ---------------------------------------------------------------------------

export function checkBeats(ctx: Ctx) {
  const s = ctx.s;
  for (const beat of BEATS) {
    if (beat.id in s.beats) continue;
    if (!check(beat.when, s)) continue;
    if (beat.effects.event && s.pendingEvent) continue;
    s.beats[beat.id] = s.day;
    applyEffect(ctx, beat.effects, 'Story');
  }
}

export function eventEligible(s: GameState, e: EventDef): boolean {
  if (e.weight <= 0) return false;
  const last = s.eventHistory[e.id];
  if (last !== undefined) {
    if (e.once) return false;
    if (s.day - last < (e.cooldownDays ?? B.events.defaultCooldown)) return false;
  }
  return check(e.when, s);
}

export function rollEvent(ctx: Ctx, days: number) {
  const s = ctx.s;
  if (s.pendingEvent || s.dead) return;
  if (s.forcedNextEvent) {
    const id = s.forcedNextEvent;
    s.forcedNextEvent = null;
    fireEvent(ctx, id);
    return;
  }
  const p = eventChanceToday(s);
  if (p <= 0) return;
  const pAny = 1 - Math.pow(1 - p, Math.max(1, days));
  if (!ctx.rng.chance(pAny)) return;
  const pool = ALL_EVENTS.filter((e) => eventEligible(s, e));
  const e = ctx.rng.weighted(pool, (x) => x.weight);
  if (e) fireEvent(ctx, e.id);
}

export function fireEvent(ctx: Ctx, id: string) {
  const s = ctx.s;
  if (!eventById(id)) return;
  s.pendingEvent = { id, day: s.day };
  activatePending(ctx);
}

/** Record and (for outcome-only events) apply a newly pending event. Idempotent. */
export function activatePending(ctx: Ctx) {
  const s = ctx.s;
  const pe = s.pendingEvent;
  if (!pe || pe.applied) return;
  pe.applied = true;
  const e = eventById(pe.id);
  if (!e) {
    s.pendingEvent = null;
    return;
  }
  s.eventHistory[e.id] = s.day;
  log(ctx, 'event', e.title);
  if (!e.choices?.length) {
    applyEffect(ctx, e.effects, e.title);
    for (let i = 0; i < (e.effects?.days ?? 0) && !s.dead; i++) runDay(ctx, null);
  }
}
