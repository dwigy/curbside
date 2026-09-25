// Every tunable number lives here. docs/BALANCE.md explains the reasoning behind each block.
// Units: money in dollars, time in days, stats 0..100 unless noted.

export const BALANCE = {
  calendar: {
    // Day 0 is a Monday so the kitchen is open on the first day.
    startYear: 2031,
    startMonth: 3,
    startDay: 3,
  },

  life: {
    yearDays: 365,
    /** Days-left thresholds that raise a warning (5 years, 1 year, 90 days). */
    warnAt: [5 * 365, 365, 90],
    /** Snapshots kept for the trend arrow. */
    historyLength: 30,
    /**
     * Extra days of life lost (negative) or gained per day lived, on top of simply aging.
     * Living rough is the main clock accelerant in Act I.
     */
    dailyDelta: {
      street: -1.5,
      shelter: -0.4,
      room: 0,
      /** Winter on the street without a sleeping bag; halved with one. */
      winterStreet: -1.0,
      healthBelow40: -1.0,
      healthBelow20: -2.5,
      starving: -2.0,
      miserable: -0.4,
      goodDiet: 0.25,
      poorDiet: -0.25,
    },
    /** Health at or below 0 means a collapse: ER visit, lost time, and a big hit to expectancy. */
    collapse: { lifeDays: -120, days: 4, healthAfter: 25, bill: 0 },
  },

  needs: {
    /** Food lost per day at normal intensity. */
    foodDrain: 28,
    /** Below this you're hungry: income suffers. */
    hungryAt: 20,
    starvingAt: 0,
    hungryIncomeMult: 0.8,
    /** Energy recovered overnight, by housing. */
    sleep: { street: 22, shelter: 38, room: 50 },
    sleepingBagBonus: 8,
    tiredAt: 20,
    tiredIncomeMult: 0.7,
  },

  health: {
    daily: {
      street: -0.4,
      shelter: 0.3,
      room: 0.6,
      winterStreet: -1.4,
      rainStreet: -0.5,
      snowStreet: -1.0,
      hungry: -1.5,
      starving: -4,
      exhausted: -1.5,
      /** When food > 50 and energy > 40 the body mends a little. */
      wellRested: 0.3,
    },
    /** Diet shifts health by (diet - 50) * this per day. */
    dietFactor: 0.01,
  },

  happiness: {
    daily: {
      street: -0.6,
      shelter: -0.1,
      room: 0.5,
      dog: 0.8,
      hungry: -1,
      sick: -1,
    },
    miserableAt: 20,
    miserableIncomeMult: 0.85,
  },

  diet: {
    /** Weight of today's meals in the rolling average. */
    smoothing: 0.1,
    good: 70,
    poor: 30,
  },

  dog: {
    incomeMult: 1.25,
    /** Days without food before the dog leaves. The player is warned from day 1. */
    leavesAfterHungryDays: 5,
    bondPerDay: 0.6,
    bondLossHungry: 6,
    bondLossApart: 1,
  },

  theft: {
    /** Nightly chance that cash on hand is stolen, by housing. */
    nightly: { street: 0.03, shelter: 0.01, room: 0.003 },
    /** Theft is much less likely when you carry almost nothing. */
    lowCashThreshold: 20,
    lowCashMult: 0.3,
    /** Street smarts reduce theft: multiplier = 1 - skill / this. */
    streetSmartsDivisor: 200,
    takeMin: 0.35,
    takeMax: 0.75,
    bikeNoLockNightly: 0.03,
  },

  events: {
    /** Chance each day that a random event happens. */
    dailyChance: 0.07,
    /** No random events in the first days, so onboarding lands. */
    graceDays: 3,
    defaultCooldown: 30,
  },

  spotFatigue: {
    /** Each day of begging in the same district adds this much fatigue. */
    perDay: 0.03,
    max: 0.45,
    /** Fatigue recovered per day spent elsewhere / doing other things. */
    recovery: 0.02,
  },

  weather: {
    // Chances per season; remainder is clear.
    spring: { rain: 0.3, cold: 0.1, heat: 0, snow: 0 },
    summer: { rain: 0.15, cold: 0, heat: 0.25, snow: 0 },
    autumn: { rain: 0.3, cold: 0.2, heat: 0, snow: 0 },
    winter: { rain: 0.1, cold: 0.45, heat: 0, snow: 0.25 },
  },

  kitchen: {
    /** Sunday = 0 */
    closedWeekday: 0,
    /** Trust with Ines grows a little each time you show up, up to a cap. */
    inesPerMeal: 0.4,
    inesMealCap: 40,
  },

  shelter: {
    bedChance: 0.65,
    winterBedChance: 0.4,
    /** Extra bed chance once Ines trusts you. */
    trustedBonus: 0.15,
    trustedAt: 30,
    maxStay: 60,
    /** Days you must wait after a stay ends before re-applying. */
    cooldown: 14,
    /** Curfew cuts evening income for these hustles. */
    curfewMult: 0.8,
  },

  rent: {
    periodDays: 7,
    graceDays: 7,
    /** Landlords want a reference: Ines vouches for you once she trusts you this much. */
    referenceAt: 30,
  },

  bank: {
    minOpeningDeposit: 25,
  },

  phone: {
    planCost: 15,
    planDays: 30,
  },

  busPass: {
    days: 30,
  },

  travel: {
    walkDays: 1,
  },

  /** Hustle tuning. Incomes are per day before multipliers; ranges are +/- spread. */
  hustles: {
    beg: { base: 10, spread: 0.5, charismaDivisor: 100, energy: 15, holidayMult: 1.3 },
    scavenge: { base: 9, spread: 0.45, skillDivisor: 120, cartMult: 1.6, wickRouteMult: 1.15, energy: 22, findChance: 0.04 },
    busk: { harmonica: 11, guitar: 24, spread: 0.5, skillDivisor: 60, energy: 18 },
    oddJobs: { chanceBase: 0.45, chancePerStreetSmarts: 0.002, chancePerRep: 0.002, chanceMax: 0.8, payMin: 30, payMax: 50, tradeDivisor: 150, energy: 25 },
    dayLabor: { chanceBase: 0.3, chancePerTrade: 0.003, cleanClothesBonus: 0.05, crewBonus: 0.1, tiredPenalty: 0.2, winterPenalty: 0.15, chanceMax: 0.8, pay: 96, energy: 45 },
    deliveries: { base: 55, spread: 0.35, rainMult: 1.2, energy: 30, rainHealth: -1 },
    skillGain: {
      beg: { charisma: 0.15, streetSmarts: 0.1 },
      scavenge: { streetSmarts: 0.2 },
      busk: { music: 0.4, charisma: 0.1 },
      oddJobs: { trade: 0.2, streetSmarts: 0.1 },
      oddJobsMiss: { streetSmarts: 0.15 },
      dayLabor: { trade: 0.3 },
      deliveries: { streetSmarts: 0.15 },
    },
  },

  /** District multipliers per hustle. Missing = 1. */
  districtMult: {
    beg: { riverfront: 1, downtown: 1.5, university: 1.2 },
    scavenge: { riverfront: 1, downtown: 0.9, university: 1.3 },
    busk: { riverfront: 0.8, downtown: 1.3, university: 1.4 },
    deliveries: { riverfront: 0.9, downtown: 1.3, university: 1.2 },
  },

  weatherMult: {
    beg: { rain: 0.7, snow: 0.5, cold: 0.8, heat: 0.85 },
    scavenge: { rain: 0.8, snow: 0.6 },
    busk: { rain: 0.3, snow: 0.2, cold: 0.7 },
    deliveries: {},
  },

  activities: {
    rest: { energy: 30, happiness: 1, foodMult: 0.7 },
    clinic: { seenChance: 0.75, health: 18, healthIfNotSeen: 6 },
    library: { happiness: 1.5, streetSmarts: 0.3, charisma: 0.1, energy: 8 },
    dmv: { days: 2, fee: 28 },
  },

  /** Confirmation thresholds for misclick protection. */
  confirm: { days: 7, cashFraction: 0.1 },

  batch: {
    /** Auto-eat triggers below this food level during batches. */
    autoEatBelow: 35,
    maxTimes: 365,
  },

  starting: {
    food: 55,
    energy: 60,
    reputation: 0,
    diet: 35,
  },
} as const;

export type Balance = typeof BALANCE;
