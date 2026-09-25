import { NAMES } from '../content/config';
import type { GameState } from './types';

/**
 * Fill {placeholders} in content text.
 * - {name}: the protagonist's name
 * - {dog}: the dog's name (or "the dog")
 * - any key of NAMES in content/config.ts, e.g. {kitchen}, {ines}, {city}
 * Unknown placeholders are left as-is so they are easy to spot.
 */
export function fill(text: string, state?: Pick<GameState, 'character' | 'dog'> | null): string {
  return text.replace(/\{(\w+)\}/g, (whole, key: string) => {
    if (key === 'name') return state?.character.name ?? 'you';
    if (key === 'dog') return state?.dog?.name ?? 'the dog';
    if (key in NAMES) return NAMES[key as keyof typeof NAMES];
    return whole;
  });
}

export function money(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const s = abs >= 1000 ? Math.round(abs).toLocaleString('en-US') : abs % 1 === 0 ? String(abs) : abs.toFixed(2);
  return `${sign}$${s}`;
}

export function pct(p: number): string {
  const v = p * 100;
  return `${v < 10 && v % 1 !== 0 ? v.toFixed(1) : Math.round(v)}%`;
}
