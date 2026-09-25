import type { BackstoryId, CastId, Cond, DistrictId, Effect, HousingId, SkillKey, StatKey, TabId } from '../engine/types';

export interface ItemDef {
  id: string;
  name: string;
  /** What it does, in one line. */
  desc: string;
  price: number;
  shop: 'thrift' | 'pawn' | 'corner' | 'bikeShop' | 'transit' | 'records' | 'none';
  requires?: Cond;
  requiresReason?: string;
  /** Hidden from the shop until this holds. */
  visible?: Cond;
  /** Expiring items (passes, plans) last this many days and can be renewed. */
  expiresDays?: number;
  /** Consumables can be bought repeatedly and stack. */
  consumable?: boolean;
  /** Ordered items arrive after this many days, as the item `delivers`. */
  deliveryDays?: number;
  delivers?: string;
  onBuy?: Effect;
}

export interface FoodDef {
  id: string;
  name: string;
  desc: string;
  price: number;
  food: number;
  /** 0..100, feeds the rolling diet score that moves life expectancy. */
  quality: number;
  happiness?: number;
  risk?: { chance: number; health: number; text: string };
  requires?: Cond;
  requiresReason?: string;
  kitchen?: boolean;
}

export type HousingTier = 'street' | 'shelter' | 'room';

export interface HousingDef {
  id: HousingId;
  name: string;
  tier: HousingTier;
  desc: string;
  /** Weekly rent. */
  rent: number;
  deposit: number;
  pets: boolean;
  requires?: Cond;
  requiresReason?: string;
  visible?: Cond;
  perks: string[];
}

export interface DistrictDef {
  id: DistrictId;
  blurb: string;
  /** Unlocked for travel when this holds (Act I: first three). */
  open: Cond | false;
  lockedReason: string;
}

export type HustleKind = 'beg' | 'scavenge' | 'busk' | 'oddJobs' | 'dayLabor' | 'deliveries';
export type LifeKind = 'rest' | 'clinic' | 'library' | 'shelterIntake' | 'dmv';

export interface ActivityDef {
  id: string;
  name: string;
  verb: string;
  desc: string;
  category: 'hustle' | 'life';
  kind: HustleKind | LifeKind;
  days: number;
  requires?: Cond;
  requiresReason?: string;
  visible?: Cond;
  /** Energy spent doing it (sleep is separate). */
  energy: number;
  /** Food drain multiplier for the day. */
  foodMult: number;
  happiness?: number;
}

export interface CastDef {
  id: CastId;
  role: string;
  blurb: string;
}

export interface BackstoryDef {
  id: BackstoryId;
  title: string;
  pitch: string;
  ageYears: number;
  lifeExpectancyYears: number;
  cash: number;
  stats: Partial<Record<StatKey, number>>;
  skills: Partial<Record<SkillKey, number>>;
  flags?: Record<string, boolean | number | string>;
  /** Shown on the character screen. */
  modifiers: string[];
}

export interface StoryCardDef {
  id: string;
  act: number;
  title: string;
  kicker: string;
  art: string;
  body: string[];
  /** Backstory-specific paragraph appended after the body. */
  byBackstory?: Partial<Record<BackstoryId, string>>;
}

export interface BeatDef {
  id: string;
  when: Cond;
  /** Fire immediately when the condition holds, even mid-batch (batches stop on story). */
  effects: Effect;
}

export interface GoalDef {
  id: string;
  text: string;
  /** Goal is complete when this holds. */
  done: Cond;
  /** Goal is only shown once this holds. */
  when?: Cond;
}

export interface CodexDef {
  id: string;
  title: string;
  category: 'basics' | 'money' | 'places' | 'people' | 'health';
  body: string;
}

export type { TabId };
