import type { Cond, GameState } from './types';
import { seasonOf } from './calendar';

export function hasItem(s: GameState, id: string): boolean {
  return (s.items[id] ?? 0) > 0;
}

export function check(cond: Cond | undefined, s: GameState): boolean {
  if (!cond) return true;
  if (cond.minDay !== undefined && s.day < cond.minDay) return false;
  if (cond.maxDay !== undefined && s.day > cond.maxDay) return false;
  if (cond.season && !cond.season.includes(seasonOf(s.day))) return false;
  if (cond.weather && !cond.weather.includes(s.weather)) return false;
  if (cond.housing && !cond.housing.includes(s.housing)) return false;
  if (cond.notHousing && cond.notHousing.includes(s.housing)) return false;
  if (cond.district && !cond.district.includes(s.district)) return false;
  if (cond.hasItem && !cond.hasItem.every((i) => hasItem(s, i))) return false;
  if (cond.lacksItem && cond.lacksItem.some((i) => hasItem(s, i))) return false;
  if (cond.flag && !cond.flag.every((f) => !!s.flags[f])) return false;
  if (cond.notFlag && cond.notFlag.some((f) => !!s.flags[f])) return false;
  if (cond.cashAtLeast !== undefined && s.cash < cond.cashAtLeast) return false;
  if (cond.cashBelow !== undefined && s.cash >= cond.cashBelow) return false;
  if (cond.hasDog !== undefined && !!s.dog !== cond.hasDog) return false;
  if (cond.hasBank !== undefined && (s.bank !== null) !== cond.hasBank) return false;
  if (cond.act && !cond.act.includes(s.act)) return false;
  if (cond.minSkill) for (const [k, v] of Object.entries(cond.minSkill)) if (s.skills[k as keyof typeof s.skills] < (v ?? 0)) return false;
  if (cond.minStat) for (const [k, v] of Object.entries(cond.minStat)) if (s.stats[k as keyof typeof s.stats] < (v ?? 0)) return false;
  if (cond.maxStat) for (const [k, v] of Object.entries(cond.maxStat)) if (s.stats[k as keyof typeof s.stats] > (v ?? 100)) return false;
  if (cond.backstory && !cond.backstory.includes(s.character.backstory)) return false;
  if (cond.relAtLeast) for (const [k, v] of Object.entries(cond.relAtLeast)) if ((s.relationships[k as keyof typeof s.relationships] ?? 0) < (v ?? 0)) return false;
  if (cond.relBelow) for (const [k, v] of Object.entries(cond.relBelow)) if ((s.relationships[k as keyof typeof s.relationships] ?? 0) >= (v ?? 0)) return false;
  if (cond.beat && !cond.beat.every((b) => b in s.beats)) return false;
  if (cond.notBeat && cond.notBeat.some((b) => b in s.beats)) return false;
  if (cond.counterAtLeast) for (const [k, v] of Object.entries(cond.counterAtLeast)) if ((s.counters[k] ?? 0) < v) return false;
  if (cond.minReputation !== undefined && s.reputation < cond.minReputation) return false;
  if (cond.any && !cond.any.some((c) => check(c, s))) return false;
  return true;
}
