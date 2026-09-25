// Versioned save format. Every schema change adds a migration; old saves are upgraded, never wiped.

import type { GameState } from './types';

export const SCHEMA_VERSION = 1;

export interface SaveFile {
  format: 'curbside-save';
  schema: number;
  savedAt: string;
  state: GameState;
}

type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

/** MIGRATIONS[n] upgrades a schema-n save to schema n+1. */
export const MIGRATIONS: Record<number, Migration> = {
  // 1: (s) => ({ ...s, newField: default, schema: 2 }),
};

export function migrate(raw: Record<string, unknown>): GameState {
  let s = raw;
  let v = typeof s.schema === 'number' ? s.schema : 0;
  if (v > SCHEMA_VERSION) throw new Error(`This save is from a newer version of the game (schema ${v}).`);
  while (v < SCHEMA_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) throw new Error(`No migration from schema ${v}.`);
    s = m(s);
    v = (s.schema as number) ?? v + 1;
  }
  return s as unknown as GameState;
}

export function serialize(state: GameState, savedAt: string): string {
  const file: SaveFile = { format: 'curbside-save', schema: SCHEMA_VERSION, savedAt, state };
  return JSON.stringify(file);
}

export function deserialize(json: string): GameState {
  const parsed = JSON.parse(json) as Partial<SaveFile> & Record<string, unknown>;
  const raw = (parsed.format === 'curbside-save' ? parsed.state : parsed) as Record<string, unknown> | undefined;
  if (!raw || typeof raw !== 'object' || !('character' in raw) || !('day' in raw)) throw new Error('Not a Curbside save file.');
  return migrate(raw);
}
