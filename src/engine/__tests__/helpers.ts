import { newGame } from '../newGame';
import type { BackstoryId, GameState } from '../types';

export function fresh(seed = 42, backstory: BackstoryId = 'laid_off'): GameState {
  return newGame({ name: 'Test', pronouns: 'they', avatar: { skin: 0, hair: 0, hairColor: 0, facial: 0, top: 0, accessory: 0 }, backstory, seed });
}

/** Clear everything blocking so the test can act. */
export function unblocked(s: GameState): GameState {
  return { ...s, pendingStory: [], pendingEvent: null, pendingPrompt: null };
}

export function reconciles(s: GameState): boolean {
  const cashOk = Math.abs(s.opening.cash + s.ledgerTotals.cash - s.cash) < 0.011;
  const bankOk = Math.abs(s.opening.bank + s.ledgerTotals.bank - (s.bank ?? 0)) < 0.011;
  return cashOk && bankOk;
}
