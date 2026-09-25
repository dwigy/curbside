import type { EventDef } from '../engine/types';

// Story conversations. Weight 0 = never random; beats in story.ts queue them.
export const STORY_EVENTS: EventDef[] = [
  {
    id: 'st_ines_intro',
    title: 'The woman with the ladle',
    speaker: 'ines',
    art: 'kitchen',
    tone: 'good',
    weight: 0,
    text:
      'The woman behind the counter gives you an extra roll without asking. “First time? I’m {inesShort}. You eat here every day we’re open, you hear me? Sundays we’re closed; plan for Sundays.”',
    choices: [
      {
        label: 'Thank her',
        success: {
          text: '“Don’t thank me. Come back.” She points her ladle at a corkboard. “Shelter beds, clinic hours, all of it. Read it.”',
          effects: { rel: { ines: 8 }, codex: ['kitchen', 'shelter_intro'], journal: 'Met {inesShort} at the kitchen. She talks like a drill sergeant and serves seconds like a grandmother.' },
        },
      },
      {
        label: 'Ask if there’s work',
        success: {
          text: '“Not here, honey, we’re all volunteers. But eat first. Nobody gets hired on an empty stomach.” She slides you a bruised apple for later.',
          effects: { rel: { ines: 5 }, food: 8, codex: ['kitchen', 'shelter_intro'], journal: 'Met {inesShort} at the kitchen. Asked her for work. She gave me an apple, which is its own kind of answer.' },
        },
      },
    ],
  },
  {
    id: 'st_wick_intro',
    title: 'The can route',
    speaker: 'wick',
    art: 'overpass',
    tone: 'good',
    weight: 0,
    text:
      'A man with a grey beard and a shopping bag full of cans watches you work the wrong bins for a while. “You’re doing it backwards,” he says finally. “Name’s {wick}. University kids drink Thursday, trash goes out Friday. Also, never the bins on Pier Street. Trust me.”',
    choices: [
      {
        label: 'Listen to him',
        success: {
          text: 'He walks you through the whole route, alley by alley. You’ll collect about 15% more from now on.',
          effects: { rel: { wick: 10 }, setFlag: { wickRoute: true }, skills: { streetSmarts: 2 }, codex: ['wick'] },
        },
      },
      {
        label: 'Share your food with him',
        requires: { cond: { minStat: { food: 25 } }, reason: 'You barely have enough for yourself.' },
        success: {
          text: 'You split what you have. He eats slowly, like it matters. Then he teaches you the route, and where the cops don’t bother people.',
          effects: { rel: { wick: 18 }, food: -12, setFlag: { wickRoute: true }, skills: { streetSmarts: 3 }, codex: ['wick'], journal: 'Shared lunch with a guy called {wick}. He knows this city like a map he drew himself.' },
        },
      },
    ],
  },
  {
    id: 'st_stray_dog',
    title: 'Someone’s following you',
    art: 'dog',
    tone: 'good',
    weight: 0,
    text:
      'A scruffy brown dog has been trailing you since the bus station, three steps behind, stopping when you stop. No collar. Ribs showing. When you turn around it sits, like it has been waiting for you to notice.',
    choices: [
      {
        label: 'Share your food',
        success: {
          text: 'It eats from your hand, gently. When you walk on, it walks with you. Seems you have a dog now.',
          effects: { food: -10, getDog: true, codex: ['dog'] },
        },
      },
      {
        label: 'Let it go',
        success: {
          text: 'You shoo it off. It watches you from across the street for a long time before it trots away.',
          effects: { setFlag: { dogDeclined: true }, happiness: -3 },
        },
      },
    ],
  },
  {
    id: 'ev_dog_returns',
    title: 'The brown dog, again',
    art: 'dog',
    tone: 'good',
    weight: 4,
    once: true,
    when: { flag: ['dogDeclined'], hasDog: false, minDay: 20 },
    text: 'The same brown dog, thinner now, is sitting outside the kitchen. It recognizes you. Its tail thumps once.',
    choices: [
      {
        label: 'Take it with you this time',
        success: { text: 'It falls in step beside you like it never left.', effects: { getDog: true, codex: ['dog'], clearFlag: ['dogDeclined'] } },
      },
      { label: 'Walk past', success: { text: 'You don’t look back. It doesn’t follow.', effects: { happiness: -4 } } },
    ],
  },
  {
    id: 'st_ines_paperwork',
    title: 'Papers',
    speaker: 'ines',
    art: 'papers',
    tone: 'neutral',
    weight: 0,
    text:
      '{inesShort} sits down across from you with a cup of coffee. “Here’s what nobody tells you. To rent, to work a real job, to open a bank account, you need an ID. To get an ID you need a birth certificate. To get a birth certificate mailed, you need an address.” She taps the table. “Use ours. {kitchen}, 14 Harbor Street. We hold mail for sixty people.”',
    choices: [
      {
        label: '“Thank you. Really.”',
        success: {
          text: '“Order it from the county records office. Fifteen dollars and two weeks. Then the DMV.” She writes the steps on a napkin.',
          effects: { setFlag: { mailAddress: true }, rel: { ines: 6 }, codex: ['papers'], journal: '{inesShort} gave me an address. Funny how a place to get mail is the first rung of the ladder.' },
        },
      },
    ],
  },
  {
    id: 'st_wick_downtown',
    title: 'Better corners',
    speaker: 'wick',
    art: 'city',
    tone: 'good',
    weight: 0,
    text:
      '“You keep sitting in the same spot, people stop seeing you,” {wick} says. “Go downtown. Suits walking to lunch give more than anybody down here. University Hill’s good for cans and music. Walk takes a day; the bus is quicker if you’ve got a pass.”',
    choices: [
      {
        label: 'Look at the city map',
        success: { text: 'You can now travel between districts from the City tab.', effects: { unlock: ['city'], codex: ['spot_fatigue', 'districts'], rel: { wick: 4 } } },
      },
    ],
  },
  {
    id: 'st_room_flyer',
    title: 'Rooms for rent',
    art: 'door',
    tone: 'good',
    weight: 0,
    text:
      'Two flyers on the kitchen corkboard. “{roomAlbescu}. Clean, quiet, NO PETS. $85/wk + 2 wks deposit. ID and reference required.” And a handwritten one: “{roomCanal}. Rooms $110/wk + 2 wks deposit, dogs welcome, ask for {canalLandlady}.”',
    choices: [
      {
        label: 'Tear off a phone number',
        success: {
          text: 'You fold it into your wallet next to your ID. Rooms now show up on the Life tab under Housing.',
          effects: { codex: ['rent'], journal: 'There’s a flyer in my wallet with a phone number on it. A room. Maybe.' },
        },
      },
    ],
  },
  {
    id: 'st_grace_intro',
    title: 'Account opened',
    speaker: 'grace',
    art: 'bank',
    tone: 'good',
    weight: 0,
    text:
      'The teller, {grace}, doesn’t blink at your address. “Welcome to {creditUnion}. Checking, no minimum after today, no fees. Anything in here is safe: nobody can take it off you at night.” She slides a debit card across. “Come see me when you want to talk about savings.”',
    choices: [
      {
        label: '“What about savings?”',
        success: {
          text: '“Later. Right now, the most important thing is building a habit: a little in, every week. That’s how people climb.”',
          effects: { rel: { grace: 8 }, codex: ['bank', 'habit'], journal: 'I have a bank account. {grace} at the credit union treated $25 like it was $25,000.' },
        },
      },
      {
        label: 'Say thanks and go',
        success: { text: 'You leave with a debit card and a very slightly straighter spine.', effects: { rel: { grace: 4 }, codex: ['bank'] } },
      },
    ],
  },
  {
    id: 'st_priya_intro',
    title: 'The lot at 5 a.m.',
    speaker: 'priya',
    art: 'labor',
    tone: 'neutral',
    weight: 0,
    text:
      'A woman in a clean canvas jacket steps in front of you just as the foreman’s truck pulls up. “Sorry,” she says, not sorry. “{priyaShort}. I was here yesterday.” She has a notebook with every foreman’s name in it.',
    choices: [
      {
        label: 'Let her go first',
        success: { text: 'She glances back, surprised. “…Thanks.” You get the sense she remembers a favor.', effects: { rel: { priya: 8 }, codex: ['priya'] } },
      },
      {
        label: 'Hold your ground',
        chance: 0.5,
        success: {
          text: 'The foreman points at you, not her. She laughs once. “Fair. Tomorrow, then.”',
          effects: { rel: { priya: 2 }, reputation: 2, codex: ['priya'] },
        },
        failure: { text: 'The foreman picks her anyway. She shrugs at you on the way to the truck.', effects: { rel: { priya: -2 }, codex: ['priya'] } },
      },
    ],
  },
  {
    id: 'st_priya_again',
    title: 'A standing crew',
    speaker: 'priya',
    art: 'labor',
    tone: 'good',
    weight: 0,
    text:
      '{priyaShort} is running a crew now, three guys and a borrowed truck. “I need somebody who shows up. You show up.” She doesn’t say it warmly. She says it like a fact.',
    choices: [
      {
        label: 'Join her crew',
        success: {
          text: 'You’re on her call list. Day labor odds +10% from now on.',
          effects: { rel: { priya: 12 }, setFlag: { priyaCrew: true }, journal: '{priyaShort} put me on her crew. We are not friends. We might be something.' },
        },
      },
      {
        label: 'Decline: you work for yourself',
        success: { text: '“Suit yourself.” She writes something in her notebook.', effects: { rel: { priya: -4 }, setFlag: { priyaRival: true } } },
      },
    ],
  },
  {
    id: 'st_wick_crisis',
    title: '{wick} doesn’t get up',
    speaker: 'wick',
    art: 'rain',
    tone: 'bad',
    weight: 0,
    text:
      '{wick} is curled up under the overpass, shaking, grey in the face. He waves you off. “Just a cold. Just need a drink.” His hands are burning hot.',
    choices: [
      {
        label: 'Get him to the clinic (2 days)',
        chance: 0.8,
        success: {
          text: 'You half-carry him there and wait with him two days. Pneumonia, caught early. The doctor says you probably saved his life. {wick} says nothing. He just grips your arm.',
          effects: { days: 2, energy: -15, rel: { wick: 25, ines: 6 }, reputation: 4, setFlag: { wickHelped: true }, journal: 'Two days in a plastic chair while {wick} slept on oxygen. He’s going to be okay. I think I am too.' },
        },
        failure: {
          text: 'They admit him and send you away. He’s alive, but they won’t tell you anything more. You spent two days you didn’t have.',
          effects: { days: 2, energy: -15, rel: { wick: 15 }, setFlag: { wickHospital: true }, journal: 'They took {wick} upstairs. I don’t know if he’ll come back down.' },
        },
      },
      {
        label: 'Give him $30 for a motel night',
        costCash: 30,
        chance: 0.5,
        success: {
          text: 'He takes the motel room. When you see him three days later he’s thinner, but on his feet.',
          effects: { rel: { wick: 14 }, setFlag: { wickHelped: true } },
        },
        failure: {
          text: 'Word gets back that he spent it at the liquor store. He avoids you for a week.',
          effects: { rel: { wick: 4 }, setFlag: { wickRelapse: true }, happiness: -4 },
        },
      },
      {
        label: 'You can’t carry everyone',
        success: {
          text: 'You leave him a bottle of water and walk away. The next week his spot under the overpass is empty.',
          effects: { rel: { wick: -30 }, happiness: -8, setFlag: { wickAbandoned: true }, journal: 'I walked away from {wick}. I keep telling myself I had no choice.' },
        },
      },
    ],
  },
];
