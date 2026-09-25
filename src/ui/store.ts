// UI store. The engine owns game rules; this owns screens, modals, undo and saving.
// UI code never mutates GameState: it dispatches actions through here.

import { useSyncExternalStore } from 'react';
import { runBatch, type BatchSummary, type Until } from '../engine/batch';
import { debug } from '../engine/debug';
import { newGame, type NewGameOptions } from '../engine/newGame';
import { deserialize, serialize } from '../engine/save';
import { step, type StepOutcome } from '../engine/step';
import type { Action, GameState, TabId, Warning } from '../engine/types';
import { play, setSoundEnabled } from './audio';
import { loadSettings, loadSlot, saveSettings, saveSlot, type Settings } from './persist';

export type Screen = 'title' | 'create' | 'game';

export type Sheet =
  | { kind: 'confirm'; title: string; body: string; confirmLabel: string; onConfirm: () => void; batchNote?: boolean }
  | { kind: 'until'; action: Action; label: string }
  | { kind: 'tip'; title: string; body: string; codexId?: string }
  | { kind: 'settings' }
  | { kind: 'codex'; id: string };

export interface UIState {
  screen: Screen;
  slot: number;
  game: GameState | null;
  undo: GameState | null;
  tab: TabId;
  sheet: Sheet | null;
  summary: BatchSummary | null;
  outcome: StepOutcome | null;
  warnings: Warning[];
  toast: { id: number; text: string; tone: 'good' | 'bad' | 'info' } | null;
  settings: Settings;
  debugOpen: boolean;
  /** Increments each time a day passes, to drive the light-change animation. */
  dayPulse: number;
  busy: boolean;
}

let state: UIState = {
  screen: 'title',
  slot: 1,
  game: null,
  undo: null,
  tab: 'life',
  sheet: null,
  summary: null,
  outcome: null,
  warnings: [],
  toast: null,
  settings: loadSettings(),
  debugOpen: false,
  dayPulse: 0,
  busy: false,
};
setSoundEnabled(state.settings.sound);

const listeners = new Set<() => void>();

export function getState() {
  return state;
}

export function setState(patch: Partial<UIState> | ((s: UIState) => Partial<UIState>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  for (const l of listeners) l();
}

export function useStore<T>(select: (s: UIState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => select(state),
    () => select(state),
  );
}

// ---------------------------------------------------------------------------
// Game flow
// ---------------------------------------------------------------------------

function persist(game: GameState) {
  saveSlot(state.slot, game);
}

let toastId = 0;
export function toast(text: string, tone: 'good' | 'bad' | 'info' = 'info') {
  const id = ++toastId;
  setState({ toast: { id, text, tone } });
  setTimeout(() => {
    if (state.toast?.id === id) setState({ toast: null });
  }, 2600);
}

export function startNewGame(o: NewGameOptions) {
  const game = newGame(o);
  setState({ game, undo: null, screen: 'game', tab: 'life', summary: null, outcome: null, warnings: [] });
  persist(game);
}

export function loadGame(slot: number): boolean {
  const game = loadSlot(slot);
  if (!game) return false;
  setState({ slot, game, undo: null, screen: 'game', tab: 'life', summary: null, outcome: null, warnings: [] });
  return true;
}

export function importSave(json: string, slot: number): string | null {
  try {
    const game = deserialize(json);
    setState({ slot, game, undo: null, screen: 'game', tab: 'life', summary: null, outcome: null, warnings: [] });
    persist(game);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : 'Could not read that file.';
  }
}

export function exportSave(): string | null {
  return state.game ? serialize(state.game, new Date().toISOString()) : null;
}

/** Story dismissals, naming and event choices aren't undoable: undo is for misclicks, not rerolls. */
const NOT_UNDOABLE = new Set<Action['type']>(['dismissStory', 'nameDog', 'choose', 'ackWarnings']);

function commit(prev: GameState, next: GameState, extra: Partial<UIState> = {}, action?: Action) {
  const daysPassed = next.day - prev.day;
  const undoable = !action || !NOT_UNDOABLE.has(action.type);
  const moneyUp = next.cash + (next.bank ?? 0) > prev.cash + (prev.bank ?? 0) + 0.001;
  setState((s) => ({
    game: next,
    undo: undoable ? prev : null,
    dayPulse: daysPassed > 0 ? s.dayPulse + 1 : s.dayPulse,
    warnings: next.newWarnings.length ? [...s.warnings, ...next.newWarnings].slice(-8) : s.warnings,
    ...extra,
  }));
  persist(next);
  if (next.newWarnings.length) play('warn');
  else if (next.pendingEvent && !prev.pendingEvent) play('event');
  else if (next.pendingStory.length > prev.pendingStory.length) play('story');
  else if (moneyUp) play('coin');
}

/** Run one action (or a batch). Returns false if it wasn't allowed. */
export function dispatch(action: Action, opts: { times?: number; until?: Until } = {}): boolean {
  const game = state.game;
  if (!game) return false;
  const times = opts.times ?? 1;
  if (times === 1 && !opts.until) {
    // Single steps still auto-eat for activities if the player enabled it? No: single taps are
    // fully manual so nothing surprising happens. Only batches and hold-to-repeat auto-eat.
    const r = step(game, action);
    if (!r.ok) {
      if (r.error) toast(r.error, 'bad');
      play('bad');
      return false;
    }
    const multiDay = r.days > 1 && action.type === 'activity';
    commit(game, r.state, {
      outcome: r.outcome ?? null,
      summary: multiDay ? summaryFromSingle(game, r.state, r.log) : state.summary,
    }, action);
    return true;
  }
  const { state: next, summary } = runBatch(game, action, { times, until: opts.until, autoEat: state.settings.autoEat });
  if (summary.iterations === 0 && summary.stop === 'unavailable') {
    toast(summary.stopDetail ?? 'Not available.', 'bad');
    return false;
  }
  commit(game, next, { summary }, action);
  return true;
}

/** Hold-to-repeat tick: one iteration with auto-eat, no summary popup. */
export function repeatOnce(action: Action): boolean {
  const game = state.game;
  if (!game) return false;
  const { state: next, summary } = runBatch(game, action, { times: 1, autoEat: state.settings.autoEat });
  if (summary.iterations === 0) {
    if (summary.stop === 'unavailable') toast(summary.stopDetail ?? 'Not available.', 'bad');
    return false;
  }
  commit(game, next, {}, action);
  return summary.stop === 'done' || summary.stop === 'until';
}

function summaryFromSingle(prev: GameState, next: GameState, log: GameState['log']): BatchSummary {
  const keys = ['health', 'happiness', 'food', 'energy'] as const;
  const left = (x: GameState) => x.lifeExpectancyDays - (x.character.startAgeDays + x.day);
  return {
    iterations: 1,
    days: next.day - prev.day,
    cashDelta: Math.round((next.cash - prev.cash) * 100) / 100,
    bankDelta: Math.round(((next.bank ?? 0) - (prev.bank ?? 0)) * 100) / 100,
    stats: Object.fromEntries(keys.map((k) => [k, { from: prev.stats[k], to: next.stats[k] }])) as BatchSummary['stats'],
    daysLeftDelta: Math.round(left(next) - left(prev)),
    stop: 'done',
    highlights: log.filter((l) => l.kind !== 'info' && l.kind !== 'warn'),
    warnings: next.newWarnings,
    earned: Math.round(((next.counters.earned ?? 0) - (prev.counters.earned ?? 0)) * 100) / 100,
    spentFood: 0,
  };
}

export function undo() {
  const { undo: prev, game } = state;
  if (!prev || !game) return;
  if (game.flags.ironMode) return;
  setState({ game: prev, undo: null, summary: null, outcome: null, warnings: [] });
  persist(prev);
  toast('Undid the last action.', 'info');
}

export function applyDebug(fn: (g: GameState) => GameState) {
  const game = state.game;
  if (!game) return;
  const next = fn(game);
  setState({ game: next, undo: game });
  persist(next);
}

export { debug };

export function updateSettings(patch: Partial<Settings>) {
  const settings = { ...state.settings, ...patch };
  setSoundEnabled(settings.sound);
  saveSettings(settings);
  setState({ settings });
}

export function setTab(tab: TabId) {
  setState({ tab });
}

export function openSheet(sheet: Sheet) {
  setState({ sheet });
}

export function closeSheet() {
  setState({ sheet: null });
}

export function quitToTitle() {
  setState({ screen: 'title', game: null, undo: null, summary: null, outcome: null, warnings: [], sheet: null });
}
