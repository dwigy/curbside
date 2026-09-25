import { backstoryById } from '../content/backstories';
import { BALANCE } from '../content/balance';
import { GAME_VERSION } from '../content/config';
import type { Ctx } from './ops';
import { createRng } from './rng';
import { SCHEMA_VERSION } from './save';
import { daysLeft } from './selectors';
import { activatePending, checkBeats, rollWeather } from './sim';
import type { AvatarSpec, BackstoryId, GameState, Pronouns } from './types';

export interface NewGameOptions {
  name: string;
  pronouns: Pronouns;
  avatar: AvatarSpec;
  backstory: BackstoryId;
  seed: number;
}

export function newGame(o: NewGameOptions): GameState {
  const b = backstoryById(o.backstory);
  const Y = BALANCE.life.yearDays;
  const S = BALANCE.starting;
  const s: GameState = {
    schema: SCHEMA_VERSION,
    gameVersion: GAME_VERSION,
    seed: o.seed >>> 0,
    rng: o.seed >>> 0,
    day: 0,
    character: {
      name: o.name.trim() || 'Sam',
      pronouns: o.pronouns,
      avatar: o.avatar,
      backstory: o.backstory,
      startAgeDays: b.ageYears * Y + 100,
    },
    cash: b.cash,
    bank: null,
    stats: { health: b.stats.health ?? 70, happiness: b.stats.happiness ?? 35, food: S.food, energy: S.energy },
    skills: { streetSmarts: 0, charisma: 0, trade: 0, business: 0, music: 0, ...b.skills },
    reputation: S.reputation,
    lifeExpectancyDays: b.lifeExpectancyYears * Y,
    lifeHistory: [],
    diet: S.diet,
    mealsToday: { quality: 0, count: 0 },
    housing: 'street',
    housingSince: 0,
    rentDueDay: null,
    rentArrears: 0,
    evictionDay: null,
    shelterUntil: null,
    shelterBarredUntil: null,
    deposit: 0,
    district: 'riverfront',
    items: {},
    expiries: {},
    deliveries: [],
    flags: { ...(b.flags ?? {}) },
    counters: {},
    dog: null,
    relationships: { ines: 0, wick: 0, priya: 0, albescu: 0, grace: 0, jaylen: 0, rafe: 0 },
    spotFatigue: { riverfront: 0, downtown: 0, university: 0, oldmill: 0, suburbs: 0, heights: 0 },
    weather: 'clear',
    lastKitchenDay: -1,
    pendingEvent: null,
    pendingStory: [],
    pendingPrompt: null,
    beats: {},
    act: 1,
    unlocked: { life: false, hustle: false, shop: false, money: false, city: false, journal: false },
    codex: [],
    journal: [],
    log: [],
    ledger: [],
    ledgerTotals: { cash: 0, bank: 0 },
    opening: { cash: b.cash, bank: 0 },
    eventsEnabled: true,
    forcedNextEvent: null,
    eventHistory: {},
    warnings: {},
    newWarnings: [],
    debugUsed: false,
    dead: null,
  };
  const ctx: Ctx = { s, rng: createRng(s.rng), log: [] };
  s.weather = rollWeather(ctx);
  if (s.weather === 'heat' || s.weather === 'snow') s.weather = 'clear';
  s.lifeHistory.push(daysLeft(s));
  checkBeats(ctx);
  activatePending(ctx);
  s.rng = ctx.rng.state();
  return s;
}
