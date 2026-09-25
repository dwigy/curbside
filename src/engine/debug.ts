// Debug-only state edits. Every function marks the save as debug-touched so
// leaderboard/trophy entries from it can be flagged.

import { BEATS } from '../content/story';
import { autoUpkeep } from './batch';
import { applyEffect, type Ctx, log } from './ops';
import { createRng } from './rng';
import { activatePending, checkBeats, eventById, fireEvent, runDay, thresholdWarnings } from './sim';
import type { CastId, Effect, GameState, SkillKey, StatKey } from './types';

function edit(state: GameState, fn: (ctx: Ctx) => void): GameState {
  const s = structuredClone(state);
  s.debugUsed = true;
  s.newWarnings = [];
  const ctx: Ctx = { s, rng: createRng(s.rng), log: [] };
  fn(ctx);
  s.rng = ctx.rng.state();
  return s;
}

export const debug = {
  addCash: (st: GameState, amount: number) => edit(st, (c) => applyEffect(c, { cash: amount }, 'Debug')),
  setStat: (st: GameState, k: StatKey, v: number) => edit(st, (c) => { c.s.stats[k] = Math.max(0, Math.min(100, v)); }),
  setSkill: (st: GameState, k: SkillKey, v: number) => edit(st, (c) => { c.s.skills[k] = Math.max(0, Math.min(100, v)); }),
  setReputation: (st: GameState, v: number) => edit(st, (c) => { c.s.reputation = v; }),
  /** Set days of life left directly. */
  setDaysLeft: (st: GameState, days: number) =>
    edit(st, (c) => { c.s.lifeExpectancyDays = c.s.character.startAgeDays + c.s.day + days; }),
  setRel: (st: GameState, who: CastId, v: number) => edit(st, (c) => { c.s.relationships[who] = v; }),
  grantItem: (st: GameState, id: string) => edit(st, (c) => applyEffect(c, { addItem: [id] }, 'Debug')),
  removeItem: (st: GameState, id: string) => edit(st, (c) => applyEffect(c, { removeItem: [id] }, 'Debug')),
  apply: (st: GameState, e: Effect) => edit(st, (c) => applyEffect(c, e, 'Debug')),
  unlockAll: (st: GameState) => edit(st, (c) => { for (const k of Object.keys(c.s.unlocked)) c.s.unlocked[k as keyof typeof c.s.unlocked] = true; }),
  toggleEvents: (st: GameState) => edit(st, (c) => { c.s.eventsEnabled = !c.s.eventsEnabled; }),
  forceNextEvent: (st: GameState, id: string | null) => edit(st, (c) => { c.s.forcedNextEvent = id; }),
  triggerEvent: (st: GameState, id: string) =>
    edit(st, (c) => {
      if (!eventById(id)) return;
      c.s.pendingEvent = null;
      fireEvent(c, id);
    }),
  /** Mark every beat up to and including `id` as reached (skipping their effects). */
  jumpToBeat: (st: GameState, id: string) =>
    edit(st, (c) => {
      for (const b of BEATS) {
        if (!(b.id in c.s.beats)) {
          c.s.beats[b.id] = c.s.day;
          if (b.id === id) { applyEffect(c, { ...b.effects, event: undefined }, 'Debug'); break; }
          applyEffect(c, { unlock: b.effects.unlock, act: b.effects.act, codex: b.effects.codex }, 'Debug');
        }
        if (b.id === id) break;
      }
    }),
  setAct: (st: GameState, act: number) => edit(st, (c) => { c.s.act = act; }),
  /** Fast-forward N days with the simulation running (auto-eating, idle days). */
  fastForward: (st: GameState, days: number) => {
    let s = edit(st, () => {});
    for (let i = 0; i < days && !s.dead; i++) {
      s = { ...s, pendingEvent: null, pendingStory: [], pendingPrompt: null };
      s = autoUpkeep(s).state;
      s = edit(s, (c) => {
        runDay(c, null);
        checkBeats(c);
        c.s.pendingEvent = null;
        c.s.pendingStory = [];
        thresholdWarnings(c);
      });
    }
    return edit(s, (c) => log(c, 'info', `Debug: fast-forwarded ${days} days.`));
  },
  kill: (st: GameState, cause = 'debug') =>
    edit(st, (c) => { c.s.dead = { day: c.s.day, ageDays: c.s.character.startAgeDays + c.s.day, cause }; }),
  revive: (st: GameState) => edit(st, (c) => { c.s.dead = null; c.s.lifeExpectancyDays = c.s.character.startAgeDays + c.s.day + 365 * 5; }),
  setSeed: (st: GameState, seed: number) => edit(st, (c) => { c.s.rng = seed >>> 0; c.rng = createRng(seed >>> 0); }),
  clearBlocking: (st: GameState) => edit(st, (c) => { c.s.pendingEvent = null; c.s.pendingStory = []; c.s.pendingPrompt = null; activatePending(c); }),
};
