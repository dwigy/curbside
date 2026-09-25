import { BALANCE } from '../content/balance';
import type { Season } from './types';

const MS_PER_DAY = 86_400_000;
const START = Date.UTC(BALANCE.calendar.startYear, BALANCE.calendar.startMonth - 1, BALANCE.calendar.startDay);

export function dateOf(day: number): Date {
  return new Date(START + day * MS_PER_DAY);
}

export function monthOf(day: number): number {
  return dateOf(day).getUTCMonth(); // 0..11
}

/** 0 = Sunday */
export function weekdayOf(day: number): number {
  return dateOf(day).getUTCDay();
}

export function seasonOf(day: number): Season {
  const m = monthOf(day);
  if (m === 11 || m <= 1) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'autumn';
}

export function isHolidaySeason(day: number): boolean {
  const d = dateOf(day);
  return d.getUTCMonth() === 11 && d.getUTCDate() >= 10;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(day: number, withYear = true): string {
  const d = dateOf(day);
  const base = `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  return withYear ? `${base}, ${d.getUTCFullYear()}` : base;
}

export function yearsDays(totalDays: number): { years: number; days: number } {
  const t = Math.max(0, Math.floor(totalDays));
  const years = Math.floor(t / 365);
  return { years, days: t - years * 365 };
}

export function formatSpan(totalDays: number): string {
  const { years, days } = yearsDays(totalDays);
  if (years === 0) return `${days}d`;
  return `${years}y ${days}d`;
}

export function ageYears(ageDays: number): number {
  return Math.floor(ageDays / 365);
}
