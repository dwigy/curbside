// Core engine types. The engine is framework-free: (state, action, rng) -> (state, log).

export type StatKey = 'health' | 'happiness' | 'food' | 'energy';
export type SkillKey = 'streetSmarts' | 'charisma' | 'trade' | 'business' | 'music';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'clear' | 'rain' | 'snow' | 'heat' | 'cold';
export type DistrictId = 'riverfront' | 'downtown' | 'university' | 'oldmill' | 'suburbs' | 'heights';
export type HousingId = 'street' | 'shelter' | 'room_albescu' | 'room_canal';
export type BackstoryId = 'laid_off' | 'burned_out' | 'foster' | 'failed_business';
export type CastId = 'ines' | 'wick' | 'priya' | 'albescu' | 'grace' | 'jaylen' | 'rafe';
export type Pronouns = 'they' | 'she' | 'he';
export type TabId = 'life' | 'hustle' | 'shop' | 'money' | 'city' | 'journal';

export type FlagValue = boolean | number | string;

export interface AvatarSpec {
  skin: number; // index into palette
  hair: number; // style index
  hairColor: number;
  facial: number; // 0 none
  top: number; // clothing color index
  accessory: number; // 0 none, 1 beanie, 2 glasses, 3 cap
}

export interface Character {
  name: string;
  pronouns: Pronouns;
  avatar: AvatarSpec;
  backstory: BackstoryId;
  /** Age in days on day 0 of the run. */
  startAgeDays: number;
}

export interface Dog {
  name: string;
  /** Days of dog food left. */
  foodDays: number;
  /** Consecutive days without food. */
  hungryDays: number;
  /** 0..100 */
  bond: number;
  /** Day the dog joined. */
  since: number;
}

export interface LedgerEntry {
  day: number;
  amount: number;
  account: 'cash' | 'bank';
  reason: string;
  category: string;
  /** Balance of that account after the entry. */
  balance: number;
}

export type LogKind = 'info' | 'good' | 'bad' | 'event' | 'story' | 'warn';

export interface LogEntry {
  day: number;
  kind: LogKind;
  text: string;
}

export interface JournalEntry {
  day: number;
  text: string;
}

export interface PendingEvent {
  id: string;
  /** Day the event fired. */
  day: number;
  /** Outcome-only events apply their effects once, when activated. */
  applied?: boolean;
}

/** A thing ordered that arrives later (e.g. a birth certificate by mail). */
export interface Delivery {
  itemId: string;
  arrivesDay: number;
}

export interface Warning {
  id: string;
  day: number;
  text: string;
}

export interface Death {
  day: number;
  ageDays: number;
  cause: string;
}

export interface GameState {
  schema: number;
  gameVersion: string;
  seed: number;
  /** Internal RNG state; advancing it is the only source of randomness. */
  rng: number;
  day: number;
  character: Character;

  cash: number;
  /** null when the player has no bank account. */
  bank: number | null;
  stats: Record<StatKey, number>;
  skills: Record<SkillKey, number>;
  reputation: number;
  /** Age (in days) at which the character is expected to die. Moves with lifestyle. */
  lifeExpectancyDays: number;
  /** Daily snapshots of days-left, most recent last (capped). Used for the trend arrow. */
  lifeHistory: number[];
  /** Rolling diet quality 0..100. */
  diet: number;
  /** Meals eaten today: sum of quality and count (reset nightly). */
  mealsToday: { quality: number; count: number };

  housing: HousingId;
  housingSince: number;
  /** Day the next rent payment is due (null when rent-free). */
  rentDueDay: number | null;
  rentArrears: number;
  /** Day the grace period on unpaid rent ends. */
  evictionDay: number | null;
  /** Shelter stays are time limited. */
  shelterUntil: number | null;
  shelterBarredUntil: number | null;
  deposit: number;

  district: DistrictId;
  /** Item id -> count. Expiring items store expiry in `expiries`. */
  items: Record<string, number>;
  expiries: Record<string, number>;
  deliveries: Delivery[];
  flags: Record<string, FlagValue>;
  counters: Record<string, number>;
  dog: Dog | null;
  relationships: Record<CastId, number>;
  /** Begging in one district repeatedly wears out your welcome. 0..1 */
  spotFatigue: Record<DistrictId, number>;
  weather: Weather;
  lastKitchenDay: number;

  pendingEvent: PendingEvent | null;
  /** Story card ids waiting to be shown. */
  pendingStory: string[];
  /** Prompt the UI must satisfy before play continues (e.g. naming the dog). */
  pendingPrompt: 'nameDog' | null;
  beats: Record<string, number>;
  act: number;
  unlocked: Record<TabId, boolean>;
  codex: string[];
  journal: JournalEntry[];
  log: LogEntry[];
  ledger: LedgerEntry[];
  /** Running totals of every ledger entry ever written (the capped list drops old rows). */
  ledgerTotals: { cash: number; bank: number };
  /** Starting balances, so totals can be reconciled: start + totals == current. */
  opening: { cash: number; bank: number };
  eventsEnabled: boolean;
  forcedNextEvent: string | null;
  eventHistory: Record<string, number>;
  warnings: Record<string, number>;
  /** Warnings raised by the last action, for the UI to surface. */
  newWarnings: Warning[];
  debugUsed: boolean;
  dead: Death | null;
}

// ---------- Declarative content: conditions & effects ----------

export interface Cond {
  minDay?: number;
  maxDay?: number;
  season?: Season[];
  weather?: Weather[];
  housing?: HousingId[];
  notHousing?: HousingId[];
  district?: DistrictId[];
  hasItem?: string[];
  lacksItem?: string[];
  flag?: string[];
  notFlag?: string[];
  cashAtLeast?: number;
  cashBelow?: number;
  hasDog?: boolean;
  hasBank?: boolean;
  act?: number[];
  minSkill?: Partial<Record<SkillKey, number>>;
  minStat?: Partial<Record<StatKey, number>>;
  maxStat?: Partial<Record<StatKey, number>>;
  backstory?: BackstoryId[];
  relAtLeast?: Partial<Record<CastId, number>>;
  relBelow?: Partial<Record<CastId, number>>;
  beat?: string[];
  notBeat?: string[];
  counterAtLeast?: Record<string, number>;
  minReputation?: number;
  /** Any of these sub-conditions. */
  any?: Cond[];
}

export interface Effect {
  cash?: number;
  bank?: number;
  health?: number;
  happiness?: number;
  food?: number;
  energy?: number;
  reputation?: number;
  lifeDays?: number;
  /** Extra days that pass (the character is busy). */
  days?: number;
  skills?: Partial<Record<SkillKey, number>>;
  addItem?: string[];
  removeItem?: string[];
  setFlag?: Record<string, FlagValue>;
  clearFlag?: string[];
  rel?: Partial<Record<CastId, number>>;
  /** Fraction (0..1) of cash on hand that is lost. */
  stealCashPct?: number;
  journal?: string;
  codex?: string[];
  dogBond?: number;
  dogFood?: number;
  loseDog?: boolean;
  getDog?: boolean;
  unlock?: TabId[];
  story?: string[];
  /** Queue another event (e.g. a follow-up). */
  event?: string;
  moveTo?: HousingId;
  counter?: Record<string, number>;
  /** Advance the story to this act. */
  act?: number;
}

export interface Outcome {
  text: string;
  effects?: Effect;
}

export interface Chance {
  base: number;
  skill?: SkillKey;
  /** Added per skill point. */
  perSkill?: number;
  rel?: CastId;
  perRel?: number;
  min?: number;
  max?: number;
}

export interface EventChoice {
  label: string;
  /** Hidden when the condition fails. */
  when?: Cond;
  /** Shown but disabled (with this reason) when the condition fails. */
  requires?: { cond: Cond; reason: string };
  /** Cash needed to pick this choice (checked, and deducted as part of the effects). */
  costCash?: number;
  /** Probability of `success`; omitted means guaranteed. */
  chance?: number | Chance;
  success: Outcome;
  failure?: Outcome;
}

export interface EventDef {
  id: string;
  title: string;
  text: string;
  tone: 'good' | 'bad' | 'neutral';
  /** Relative weight in the random pool. 0 = never random (story/forced only). */
  weight: number;
  when?: Cond;
  once?: boolean;
  cooldownDays?: number;
  /** Outcome-only events apply these immediately. */
  effects?: Effect;
  choices?: EventChoice[];
  art?: string;
  speaker?: CastId;
}

// ---------- Actions ----------

export type Action =
  | { type: 'activity'; id: string }
  | { type: 'eat'; id: string }
  | { type: 'buy'; id: string }
  | { type: 'travel'; to: DistrictId }
  | { type: 'housing'; id: HousingId }
  | { type: 'bank'; op: 'open' | 'deposit' | 'withdraw'; amount: number }
  | { type: 'choose'; choice: number }
  | { type: 'nameDog'; name: string }
  | { type: 'dismissStory' }
  | { type: 'ackWarnings' };

export interface StepResult {
  state: GameState;
  /** Log entries produced by this step. */
  log: LogEntry[];
  /** Days that passed. */
  days: number;
}

export interface Availability {
  ok: boolean;
  reason?: string;
}
