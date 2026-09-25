import type { BeatDef, GoalDef, StoryCardDef } from './types';

// ---------------------------------------------------------------------------
// Story cards: full-screen illustrated moments that open and close acts.
// ---------------------------------------------------------------------------

export const STORY_CARDS: StoryCardDef[] = [
  {
    id: 'act1_open',
    act: 1,
    kicker: 'Act I · Survival',
    title: 'Under the overpass',
    art: 'overpass',
    body: [
      'The trucks start at four. You learn that on the first night, and on the second, and by the third you stop flinching.',
      'Everything you own fits in a grocery bag. The city of {city} goes to work above your head.',
      'Nobody is coming to fix this. But you’re still here, and that counts for something.',
    ],
    byBackstory: {
      laid_off:
        'Nineteen years you punched a clock at Kessler. Your hands still wake up at 5:40 expecting the line. There is no line.',
      burned_out:
        'You used to answer emails at midnight. Now midnight is just cold. Some small, tired part of you is relieved that nobody needs anything from you. The rest of you is terrified.',
      foster:
        'You have been leaving places with a garbage bag of your things since you were seven. This is just the first place with no walls.',
      failed_business:
        'Somewhere in a landfill is a sign that says your name and HARDWARE. You painted the letters yourself.',
    },
  },
  {
    id: 'act1_end',
    act: 1,
    kicker: 'Act I · Complete',
    title: 'A door that locks',
    art: 'door',
    body: [
      'The key sticks. You have to lift the knob and lean. Then it gives, and the door swings open on eight feet by ten of yours.',
      'You sit on the bare mattress with your coat still on and listen to nothing: no trucks, no footsteps, nobody moving you along.',
      'You don’t sleep much the first night. You’re too busy being inside.',
    ],
  },
  {
    id: 'act2_teaser',
    act: 2,
    kicker: 'Act II · Stability',
    title: 'What comes next',
    art: 'city',
    body: [
      'A room is a foothold, not a summit. Rent is due every seven days whether the lot picks you or not.',
      'Act II (school, a real career, a bank that lends and a credit score that remembers) is coming in the next update of {game}.',
      'Until then you can keep living this life: work, save, stay healthy, and watch the clock. Or start another one.',
    ],
  },
];

export const storyCardById = (id: string) => STORY_CARDS.find((c) => c.id === id);

// ---------------------------------------------------------------------------
// Beats: story triggers, checked in order after every day and action. Each fires once.
// Beats that open a conversation queue a story event (content/storyEvents.ts).
// ---------------------------------------------------------------------------

export const BEATS: BeatDef[] = [
  {
    id: 'wake',
    when: {},
    effects: {
      story: ['act1_open'],
      unlock: ['life', 'hustle'],
      codex: ['clock', 'needs', 'odds'],
      journal: 'Day one, officially. I’m writing this on the back of a flyer. If I’m going to climb out, I want a record of the climb.',
    },
  },
  {
    id: 'meet_ines',
    when: { counterAtLeast: { kitchenMeals: 1 } },
    effects: { event: 'st_ines_intro', unlock: ['journal'] },
  },
  {
    id: 'meet_wick',
    when: { minDay: 2, counterAtLeast: { hustleDays: 2 } },
    effects: { event: 'st_wick_intro' },
  },
  {
    id: 'first_money',
    when: { counterAtLeast: { earned: 20 } },
    effects: {
      unlock: ['shop'],
      codex: ['shops'],
      journal: 'Twenty dollars, all mine. I counted it three times. It’s nothing, and it’s the first thing in a while.',
    },
  },
  {
    id: 'stray_dog',
    when: { minDay: 6 },
    effects: { event: 'st_stray_dog' },
  },
  {
    id: 'paperwork',
    when: { beat: ['meet_ines'], minDay: 12, counterAtLeast: { kitchenMeals: 4 } },
    effects: { event: 'st_ines_paperwork' },
  },
  {
    id: 'city',
    when: { beat: ['meet_wick'], minDay: 12 },
    effects: { event: 'st_wick_downtown' },
  },
  {
    id: 'first_shelter_night',
    when: { housing: ['shelter'] },
    effects: {
      codex: ['shelter'],
      journal: 'Slept indoors tonight, forty cots in one room. A man two rows over sang in his sleep. I didn’t mind.',
    },
  },
  {
    id: 'got_id',
    when: { hasItem: ['state_id'] },
    effects: {
      unlock: ['money'],
      codex: ['bank'],
      journal: 'The DMV photo makes me look like a ghost. I don’t care. It says I exist. It says this is me.',
    },
  },
  {
    id: 'room_hint',
    when: { beat: ['got_id'], minDay: 2 },
    effects: { event: 'st_room_flyer' },
  },
  {
    id: 'meet_grace',
    when: { hasBank: true },
    effects: { event: 'st_grace_intro' },
  },
  {
    id: 'meet_priya',
    when: { counterAtLeast: { dayLaborTries: 1 } },
    effects: { event: 'st_priya_intro' },
  },
  {
    id: 'wick_crisis',
    when: { beat: ['meet_wick'], minDay: 40, relAtLeast: { wick: 5 } },
    effects: { event: 'st_wick_crisis' },
  },
  {
    id: 'priya_again',
    when: { beat: ['meet_priya'], counterAtLeast: { dayLaborHired: 6 } },
    effects: { event: 'st_priya_again' },
  },
  {
    id: 'act1_end',
    when: { housing: ['room_albescu', 'room_canal'] },
    effects: {
      story: ['act1_end', 'act2_teaser'],
      act: 2,
      setFlag: { act1Done: true },
      journal: 'I have a key. I keep touching it in my pocket to make sure it’s real.',
    },
  },
];

// ---------------------------------------------------------------------------
// Goals: the onboarding chain. The first unfinished goal is shown on the Life tab.
// ---------------------------------------------------------------------------

export const GOALS: GoalDef[] = [
  {
    id: 'eat',
    text: 'You haven’t eaten since yesterday. The {kitchen} serves a free lunch: open the Life tab and eat.',
    done: { counterAtLeast: { meals: 1 } },
  },
  {
    id: 'earn',
    text: 'Earn a few dollars. On the Hustle tab, ask for change or collect cans. Each takes a day.',
    done: { counterAtLeast: { earned: 20 } },
  },
  {
    id: 'bag',
    text: 'Buy a sleeping bag at {thrift}. Nights outside cost you health, and cold ones cost years.',
    done: { any: [{ hasItem: ['sleeping_bag'] }, { notHousing: ['street'] }] },
  },
  {
    id: 'shelter',
    text: 'Ask {inesShort} about a bed at the {shelter}. Indoors, your life clock slows way down.',
    when: { beat: ['meet_ines'] },
    done: { any: [{ counterAtLeast: { nightsShelter: 1 } }, { beat: ['paperwork'] }] },
  },
  {
    id: 'papers',
    text: 'Get your papers: order a birth certificate from the Shop, mailed to the kitchen.',
    when: { beat: ['paperwork'] },
    done: { any: [{ flag: ['certOrdered'] }, { hasItem: ['birth_certificate'] }, { hasItem: ['state_id'] }] },
  },
  {
    id: 'id',
    text: 'When the birth certificate arrives, stand in line for a State ID (Life tab).',
    when: { beat: ['paperwork'] },
    done: { hasItem: ['state_id'] },
  },
  {
    id: 'bank',
    text: 'Open an account at {creditUnion} (Money tab). Money in the bank can’t be stolen.',
    done: { hasBank: true },
  },
  {
    id: 'steady',
    text: 'Find steadier work. Day labor needs boots and an ID; deliveries need a bike and a phone.',
    done: { any: [{ counterAtLeast: { dayLaborHired: 1 } }, { counterAtLeast: { deliveriesDays: 1 } }] },
  },
  {
    id: 'room',
    text: 'Save for a room: a two-week deposit plus the first week (about $255–$330), and earn {inesShort}’s trust so she’ll give you a reference.',
    done: { housing: ['room_albescu', 'room_canal'] },
  },
  {
    id: 'done',
    text: 'You have a door that locks. Keep your rent paid and your health up. Act II arrives in the next update.',
    done: { flag: ['never'] },
  },
];
