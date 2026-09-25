// localStorage persistence. Every access is guarded: storage can be missing or full.

import { deserialize, serialize } from '../engine/save';
import type { GameState } from '../engine/types';

const KEY = (slot: number) => `curbside.slot.${slot}`;
export const SLOTS = [1, 2, 3] as const;

export interface SlotMeta {
  slot: number;
  name: string;
  day: number;
  ageDays: number;
  cash: number;
  dead: boolean;
  savedAt: string;
  debug: boolean;
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function saveSlot(slot: number, state: GameState): boolean {
  const ok = safeSet(KEY(slot), serialize(state, new Date().toISOString()));
  safeSet('curbside.lastSlot', String(slot));
  return ok;
}

export function loadSlot(slot: number): GameState | null {
  const raw = safeGet(KEY(slot));
  if (!raw) return null;
  try {
    return deserialize(raw);
  } catch {
    return null;
  }
}

export function deleteSlot(slot: number) {
  try {
    localStorage.removeItem(KEY(slot));
  } catch {
    /* ignore */
  }
}

export function slotMeta(slot: number): SlotMeta | null {
  const raw = safeGet(KEY(slot));
  if (!raw) return null;
  try {
    const f = JSON.parse(raw);
    const s = f.state as GameState;
    return {
      slot,
      name: s.character.name,
      day: s.day,
      ageDays: s.character.startAgeDays + s.day,
      cash: s.cash + (s.bank ?? 0),
      dead: !!s.dead,
      savedAt: f.savedAt,
      debug: !!s.debugUsed,
    };
  } catch {
    return null;
  }
}

export function lastSlot(): number | null {
  const v = Number(safeGet('curbside.lastSlot'));
  return v >= 1 && v <= 3 ? v : null;
}

export interface Settings {
  sound: boolean;
  reducedMotion: 'system' | 'on' | 'off';
  autoEat: boolean;
  confirmBatches: boolean;
  seenTips: string[];
}

export const DEFAULT_SETTINGS: Settings = { sound: false, reducedMotion: 'system', autoEat: true, confirmBatches: true, seenTips: [] };

export function loadSettings(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(safeGet('curbside.settings') ?? '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: Settings) {
  safeSet('curbside.settings', JSON.stringify(s));
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function pickFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      f.text().then(resolve, () => resolve(null));
    };
    input.click();
  });
}
