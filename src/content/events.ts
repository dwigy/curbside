import type { EventDef } from '../engine/types';

// Act I random events: the street, the shelter, the first rented room.
// Every probability here is shown to the player and honored exactly.
// Text uses {placeholders} from content/config.ts (see engine/text.ts).

const INSTRUMENT = { any: [{ hasItem: ['harmonica'] }, { hasItem: ['guitar'] }] };
const ROOMS: ('room_albescu' | 'room_canal')[] = ['room_albescu', 'room_canal'];
const LIBRARY_OPEN = { any: [{ beat: ['meet_ines'] }, { minDay: 5 }] };

export const EVENTS: EventDef[] = [
  // ---------------------------------------------------------------- Weather & season
  {
    id: 'ev_cold_snap',
    title: 'Cold snap',
    text: 'The temperature drops twenty degrees after dark. Your breath hangs in the air and your fingers stop working right.',
    tone: 'bad',
    weight: 6,
    cooldownDays: 20,
    when: { weather: ['cold'], housing: ['street'] },
    choices: [
      {
        label: 'Ride the night bus until morning',
        costCash: 5,
        success: {
          text: 'You buy a day pass and ride the loop until dawn. The driver lets you be. It isn’t sleep, but it’s warm.',
          effects: { energy: -8, codex: ['weather'] },
        },
      },
      {
        label: 'Find a sheltered stairwell',
        chance: { base: 0.5, skill: 'streetSmarts', perSkill: 0.005, max: 0.85 },
        success: {
          text: 'You find a parking garage stairwell with a warm vent. Nobody bothers you until six.',
          effects: { health: -1, codex: ['weather'] },
        },
        failure: {
          text: 'Security finds you at two a.m. You spend the rest of the night walking to stay warm.',
          effects: { health: -6, energy: -12, lifeDays: -4, codex: ['weather'] },
        },
      },
      {
        label: 'Tough it out',
        success: {
          text: 'You pull everything you own around you and wait for the sun. It takes forever.',
          effects: { health: -7, energy: -8, lifeDays: -5, codex: ['weather'] },
        },
      },
    ],
  },
  {
    id: 'ev_heatwave',
    title: 'Heatwave',
    text: 'The sidewalk shimmers by ten a.m. Every patch of shade is taken, and your water bottle is empty.',
    tone: 'bad',
    weight: 5,
    cooldownDays: 20,
    when: { weather: ['heat'], notHousing: ROOMS },
    choices: [
      {
        label: 'Buy cold water and a bag of ice at {corner}',
        costCash: 5,
        success: {
          text: 'You press the ice to the back of your neck and almost cry with relief.',
          effects: { health: 1, happiness: 2, codex: ['weather'] },
        },
      },
      {
        label: 'Refill at the park fountain and lie low',
        chance: 0.7,
        success: {
          text: 'The fountain works. You soak your shirt and sit out the worst of it in a bus shelter’s shadow.',
          effects: { energy: -6, codex: ['weather'] },
        },
        failure: {
          text: 'The fountain is shut off for repairs. By afternoon your head is pounding.',
          effects: { health: -6, energy: -10, lifeDays: -3, codex: ['weather'] },
        },
      },
    ],
  },
  {
    id: 'ev_rain_soaks',
    title: 'Soaked through',
    text: 'The rain blows in sideways under {overpass}. Everything you own is wet, and none of it will be dry before dark.',
    tone: 'bad',
    weight: 6,
    cooldownDays: 20,
    when: { weather: ['rain'], housing: ['street'] },
    effects: { health: -3, happiness: -5, energy: -6, codex: ['weather'] },
  },
  {
    id: 'ev_first_snow',
    title: 'First snow',
    text: 'Snow starts falling a little after midnight. For an hour {city} goes completely quiet, and the streetlights turn everything gold.',
    tone: 'neutral',
    weight: 8,
    once: true,
    when: { weather: ['snow'] },
    effects: {
      happiness: 4,
      health: -2,
      journal: 'First snow tonight. I forgot it could still be beautiful. I also forgot how cold it gets.',
    },
  },
  {
    id: 'ev_street_festival',
    title: 'Summer festival',
    text: 'Six blocks are closed off for the summer festival. Food trucks, a brass band, and more people than you’ve seen in months.',
    tone: 'good',
    weight: 4,
    cooldownDays: 60,
    when: { season: ['summer'], weather: ['clear', 'heat'] },
    choices: [
      {
        label: 'Work the crowd for cans',
        success: {
          text: 'The recycling bins overflow by noon. You fill four bags and cash them in at dusk.',
          effects: { cash: 22, energy: -15, skills: { streetSmarts: 0.5 } },
        },
      },
      {
        label: 'Play for the crowd',
        requires: { cond: INSTRUMENT, reason: 'You need an instrument.' },
        chance: { base: 0.6, skill: 'music', perSkill: 0.005, max: 0.9 },
        success: {
          text: 'You find a spot between the lemonade stand and the face painter. People are in a generous mood.',
          effects: { cash: 35, happiness: 5, energy: -10, skills: { music: 1 } },
        },
        failure: {
          text: 'The brass band sets up right next to you. You can’t hear yourself, and neither can anyone else.',
          effects: { cash: 6, happiness: -2, energy: -10 },
        },
      },
      {
        label: 'Just enjoy it',
        success: {
          text: 'A vendor gives away the last of the funnel cake at closing. You eat it on a curb while the band plays, just someone at a festival.',
          effects: { food: 12, happiness: 8 },
        },
      },
    ],
  },
  {
    id: 'ev_first_warm_day',
    title: 'First warm day',
    text: 'The sun comes out and stays out. Someone on a bench takes off their coat, then everyone does. You sit with your face tipped up like a cat.',
    tone: 'good',
    weight: 5,
    once: true,
    when: { season: ['spring'], weather: ['clear'] },
    effects: { happiness: 6, energy: 4, health: 1 },
  },
  {
    id: 'ev_laundromat_rain',
    title: 'The laundromat',
    text: 'You duck into a laundromat to get out of the downpour. The owner, a small woman in a cardigan, looks at you for a long second.',
    tone: 'neutral',
    weight: 3,
    cooldownDays: 45,
    when: { weather: ['rain'], housing: ['street'] },
    choices: [
      {
        label: 'Ask if you can wait out the storm',
        chance: { base: 0.55, skill: 'charisma', perSkill: 0.004, max: 0.85 },
        success: {
          text: 'She points at a chair by the dryers. Later she runs your wet jacket through a cycle and won’t take a cent.',
          effects: { health: 3, happiness: 5, energy: 4, codex: ['kindness'] },
        },
        failure: {
          text: 'She says she’s sorry, but she has customers. You go back out into it.',
          effects: { happiness: -3, health: -2 },
        },
      },
      {
        label: 'Leave before she has to ask',
        success: {
          text: 'You nod and step back into the rain. The awning next door will do.',
          effects: { health: -2 },
        },
      },
    ],
  },

  // ---------------------------------------------------------------- Street life
  {
    id: 'ev_newcomer',
    title: 'New face',
    text: 'A kid, maybe twenty, is sitting on a duffel bag near your spot with the look you had your first week. They ask you where it’s safe to sleep.',
    tone: 'neutral',
    weight: 5,
    cooldownDays: 45,
    when: { housing: ['street'], minDay: 7 },
    choices: [
      {
        label: 'Tell them everything you’ve learned',
        success: {
          text: 'You walk them through it: the {kitchen} schedule, which doorways get hosed at dawn, where not to sleep alone. They write it on their hand.',
          effects: { reputation: 2, happiness: 4, skills: { streetSmarts: 0.5 }, codex: ['kindness'] },
        },
      },
      {
        label: 'Share your food too',
        requires: { cond: { minStat: { food: 25 } }, reason: 'You don’t have enough to share.' },
        success: {
          text: 'You split what you have. They eat like they haven’t in two days, and maybe they haven’t.',
          effects: { food: -12, reputation: 3, happiness: 6, codex: ['kindness'] },
        },
      },
      {
        label: 'Point them to {shelter}',
        success: {
          text: 'You give them the address and wish them luck. It’s all you have in you today.',
        },
      },
    ],
  },
  {
    id: 'ev_man_down',
    title: 'Man down',
    text: 'An older man is slumped against a bus shelter, not responding. People are stepping around him.',
    tone: 'neutral',
    weight: 3,
    cooldownDays: 60,
    choices: [
      {
        label: 'Stay with him and flag down help',
        success: {
          text: 'You keep talking to him until the ambulance comes. A paramedic squeezes your shoulder on the way out. “You did good.”',
          effects: { reputation: 4, happiness: 3, energy: -6, codex: ['kindness'] },
        },
      },
      {
        label: 'Keep walking',
        success: {
          text: 'You tell yourself someone else will stop. You think about him the rest of the day.',
          effects: { happiness: -4 },
        },
      },
    ],
  },
  {
    id: 'ev_sweep_notice',
    title: 'Cleanup notice',
    text: 'Orange notices are zip-tied to the fence at dawn: an “encampment cleanup” comes through tomorrow morning. Anything left behind goes in the truck.',
    tone: 'bad',
    weight: 5,
    cooldownDays: 30,
    when: { housing: ['street'], hasItem: ['sleeping_bag'] },
    choices: [
      {
        label: 'Pack up and move early',
        success: {
          text: 'You haul everything two blocks over and spend a bad night somewhere new. But you still have your bag.',
          effects: { energy: -12, happiness: -3 },
        },
      },
      {
        label: 'Stay and hope they skip your spot',
        chance: 0.35,
        success: {
          text: 'The crew runs out of time before they reach your corner. You got lucky.',
        },
        failure: {
          text: 'You step away for coffee and come back to bare concrete. Your sleeping bag is in a city truck.',
          effects: { removeItem: ['sleeping_bag'], happiness: -8 },
        },
      },
    ],
  },
  {
    id: 'ev_sweep_cart',
    title: 'Sweep day',
    text: 'Workers in yellow vests are clearing the camp with a garbage truck. Your cart, loaded with a week of cans, is parked right in their path.',
    tone: 'bad',
    weight: 4,
    cooldownDays: 30,
    when: { housing: ['street'], hasItem: ['shopping_cart'] },
    choices: [
      {
        label: 'Grab it and go',
        chance: { base: 0.6, skill: 'streetSmarts', perSkill: 0.004, max: 0.9 },
        success: {
          text: 'You push the cart out the far end of the block as the truck backs in. Cans clatter everywhere, but it’s still yours.',
          effects: { energy: -8 },
        },
        failure: {
          text: 'A worker gets a hand on it first. “City property now.” Into the truck it goes, cans and all.',
          effects: { removeItem: ['shopping_cart'], happiness: -6 },
        },
      },
      {
        label: 'Save the cans, let the cart go',
        success: {
          text: 'You stuff a trash bag with cans and watch the cart get lifted into the truck.',
          effects: { removeItem: ['shopping_cart'], cash: 6, happiness: -4 },
        },
      },
    ],
  },
  {
    id: 'ev_move_along',
    title: 'Move along',
    text: 'Two officers stop at your spot. Not unkind, just tired. A business owner called, and they need you to move along.',
    tone: 'bad',
    weight: 5,
    cooldownDays: 25,
    when: { district: ['downtown', 'university'], notHousing: ROOMS },
    choices: [
      {
        label: 'Pack up without a fuss',
        success: {
          text: 'You fold your sign and go. People get used to seeing you in one place. Maybe it’s time for a new corner anyway.',
          effects: { energy: -4, happiness: -2, codex: ['spot_fatigue'] },
        },
      },
      {
        label: 'Calmly ask where you’re allowed to be',
        chance: { base: 0.35, skill: 'charisma', perSkill: 0.005, max: 0.75 },
        success: {
          text: 'One of them actually thinks about it and names a block where nobody will call. You thank him and mean it.',
          effects: { skills: { streetSmarts: 1 }, codex: ['spot_fatigue'] },
        },
        failure: {
          text: 'They don’t have an answer and don’t like the question. You move anyway, with less day left.',
          effects: { happiness: -4, energy: -6, codex: ['spot_fatigue'] },
        },
      },
    ],
  },
  {
    id: 'ev_breakfast_stranger',
    title: 'Breakfast',
    text: 'A man in a delivery uniform stops at the diner door and asks if you’ve eaten. You haven’t. He comes back out with eggs, toast and a coffee.',
    tone: 'good',
    weight: 5,
    cooldownDays: 30,
    when: { notHousing: ROOMS },
    effects: { food: 25, happiness: 6, codex: ['kindness'] },
  },
  {
    id: 'ev_found_wallet',
    title: 'A fat wallet',
    text: 'There’s a wallet in the gutter by the bus stop. Inside: a driver’s license, two credit cards and a hundred dollars in twenties.',
    tone: 'neutral',
    weight: 2,
    once: true,
    when: { minDay: 10 },
    choices: [
      {
        label: 'Return it to the address on the license',
        chance: 0.5,
        success: {
          text: 'The woman who answers bursts into tears. She presses a twenty on you and tells the whole block what you did.',
          effects: {
            cash: 20,
            reputation: 5,
            happiness: 8,
            codex: ['kindness'],
            journal: 'Gave back a wallet with $100 in it. I needed that money. I needed to be someone who gives it back more.',
          },
        },
        failure: {
          text: 'The man who answers counts the cash, says “Thanks,” and shuts the door. The neighbor watering her roses saw the whole thing, though.',
          effects: {
            reputation: 3,
            happiness: 3,
            codex: ['kindness'],
            journal: 'Gave back a stranger’s wallet. He barely said thanks. I’d do it again.',
          },
        },
      },
      {
        label: 'Keep the cash, mail the rest',
        success: {
          text: 'You take the hundred and drop the wallet in a mailbox so at least the cards get home. The money feels heavier than it should.',
          effects: { cash: 100, happiness: -3 },
        },
      },
    ],
  },
  {
    id: 'ev_card_game',
    title: 'Card game',
    text: 'Someone is dealing blackjack on an upturned milk crate. Ten dollars a hand, and the dealer is honest about it: you’ll win a little less than half the time.',
    tone: 'neutral',
    weight: 4,
    cooldownDays: 20,
    when: { housing: ['street', 'shelter'] },
    choices: [
      {
        label: 'Play one hand',
        costCash: 10,
        chance: 0.45,
        success: {
          text: 'Nineteen against his eighteen. He slides you twenty and nods like he means it.',
          effects: { cash: 20, happiness: 3, codex: ['odds'] },
        },
        failure: {
          text: 'He turns over twenty-one. Your ten is gone, which is what ten usually does at a card table.',
          effects: { happiness: -2, codex: ['odds'] },
        },
      },
      {
        label: 'Just watch',
        success: {
          text: 'You watch a dozen hands. The dealer takes seven. You keep your money and learn something about people who can’t stop.',
          effects: { skills: { streetSmarts: 0.5 }, codex: ['odds'] },
        },
      },
    ],
  },
  {
    id: 'ev_hot_phone',
    title: 'A phone, cheap',
    text: 'A guy in a hoodie opens his jacket: a smartphone, twenty dollars, “works great.” He doesn’t say whose it used to be.',
    tone: 'neutral',
    weight: 4,
    cooldownDays: 60,
    when: { lacksItem: ['phone'], minDay: 7 },
    choices: [
      {
        label: 'Buy it',
        costCash: 20,
        chance: 0.4,
        success: {
          text: 'It powers on, unlocked. You don’t ask questions. It’ll need a prepaid plan before it’s good for anything.',
          effects: { addItem: ['phone'], codex: ['theft'] },
        },
        failure: {
          text: 'It turns on just long enough to show a lock screen: “This device has been reported lost.” By then he’s gone.',
          effects: { happiness: -4, codex: ['theft'] },
        },
      },
      {
        label: 'Pass',
        success: {
          text: 'You shake your head. He shrugs and drifts toward the next bench.',
        },
      },
    ],
  },
  {
    id: 'ev_wick_fire',
    title: 'Beans by the barrel',
    text: '{wick} has a fire going in an old oil drum and a can of beans warming on the rim. He nods at the crate beside him. “Half’s yours.”',
    tone: 'good',
    weight: 4,
    cooldownDays: 25,
    when: { beat: ['meet_wick'], housing: ['street'], season: ['autumn', 'winter', 'spring'] },
    choices: [
      {
        label: 'Sit and eat',
        success: {
          text: 'He tells you about the winter the river froze while you split the beans with one plastic spoon. Some of it might even be true.',
          effects: { food: 12, happiness: 5, rel: { wick: 4 } },
        },
      },
      {
        label: 'Bring something to share',
        costCash: 5,
        success: {
          text: 'You come back with bread and two oranges from {corner}. He looks at the orange for a while before he eats it.',
          effects: { food: 15, happiness: 6, rel: { wick: 8 } },
        },
      },
    ],
  },
  {
    id: 'ev_sidewalk_twenty',
    title: 'Lucky break',
    text: 'A folded twenty is plastered to the sidewalk under a wet leaf. You look around. Nobody is looking for it.',
    tone: 'good',
    weight: 3,
    cooldownDays: 60,
    effects: { cash: 20, happiness: 4 },
  },
  {
    id: 'ev_doorway_wakeup',
    title: 'Opening time',
    text: 'At six a.m. a café owner unlocks the door you’re sleeping against. He needs the doorway. He also has a broom.',
    tone: 'neutral',
    weight: 4,
    cooldownDays: 30,
    when: { housing: ['street'] },
    choices: [
      {
        label: 'Offer to sweep the step',
        chance: { base: 0.5, skill: 'charisma', perSkill: 0.004, max: 0.85 },
        success: {
          text: 'He thinks about it, then hands you the broom. Afterward there’s a coffee and yesterday’s muffin waiting on the counter.',
          effects: { food: 8, happiness: 4, reputation: 1 },
        },
        failure: {
          text: '“No thanks.” He’s polite about it, but he waits until you’re gone.',
          effects: { happiness: -2 },
        },
      },
      {
        label: 'Pack up and go',
        success: {
          text: 'You roll up your things and head out before he has to ask twice.',
          effects: { energy: -3 },
        },
      },
    ],
  },

  // ---------------------------------------------------------------- Work
  {
    id: 'ev_contractor_offer',
    title: 'Cash work',
    text: 'A pickup slows at the curb. The contractor needs one more pair of hands to tear out drywall today. Sixty dollars, cash, no paperwork.',
    tone: 'good',
    weight: 4,
    cooldownDays: 30,
    when: { minDay: 7 },
    choices: [
      {
        label: 'Hop in the truck',
        chance: 0.8,
        success: {
          text: 'It’s dusty and loud, and your shoulders will hate you tomorrow. At six he counts out three twenties.',
          effects: { cash: 60, energy: -25, food: -10, days: 1, skills: { trade: 1.5 } },
        },
        failure: {
          text: 'You work all day. At six he “only has forty on him.” You take it, because what else can you do.',
          effects: { cash: 40, energy: -25, food: -10, happiness: -3, days: 1, skills: { trade: 1.5 } },
        },
      },
      {
        label: 'Pass',
        success: {
          text: 'You wave him on. The truck pulls away to find someone else.',
        },
      },
    ],
  },
  {
    id: 'ev_delivery_tip',
    title: 'Big tipper',
    text: 'You drop off six pizzas at a party on {university}. The host takes one look at you, drenched in sweat, and adds a thirty-dollar tip on the spot.',
    tone: 'good',
    weight: 4,
    cooldownDays: 30,
    when: { hasItem: ['bike', 'phone', 'phone_plan'] },
    effects: { cash: 30, happiness: 5 },
  },
  {
    id: 'ev_busking_crowd',
    title: 'A crowd gathers',
    text: 'You’re halfway through a song when people start stopping. Five, then ten. A little girl is dancing.',
    tone: 'good',
    weight: 4,
    cooldownDays: 20,
    when: { ...INSTRUMENT, weather: ['clear', 'heat'] },
    choices: [
      {
        label: 'Play the one everybody knows',
        success: {
          text: 'They sing the chorus back to you. The case fills with ones and a few fives.',
          effects: { cash: 25, happiness: 5, skills: { charisma: 0.5 } },
        },
      },
      {
        label: 'Play something of your own',
        chance: { base: 0.4, skill: 'music', perSkill: 0.006, max: 0.85 },
        success: {
          text: 'It’s quiet at first. Then someone yells “Again!” and a woman asks if you have a recording. You don’t. You want one.',
          effects: { cash: 35, happiness: 10, skills: { music: 2 } },
        },
        failure: {
          text: 'Half the crowd drifts off by the second verse. The ones who stay are kind about it.',
          effects: { cash: 8, skills: { music: 1 } },
        },
      },
    ],
  },
  {
    id: 'ev_bad_gig',
    title: 'Stiffed',
    text: 'The guy promised forty dollars to help empty his garage. Five hours later the garage is empty and he’s suddenly “waiting on a check.”',
    tone: 'bad',
    weight: 3,
    cooldownDays: 45,
    when: { minDay: 7 },
    choices: [
      {
        label: 'Stand your ground, politely',
        chance: { base: 0.3, skill: 'streetSmarts', perSkill: 0.005, max: 0.7 },
        success: {
          text: 'You stay on his porch and never raise your voice. Eventually he finds a twenty in a kitchen drawer.',
          effects: { cash: 20, energy: -20 },
        },
        failure: {
          text: 'He threatens to call the cops. You leave with nothing but sore arms.',
          effects: { energy: -20, happiness: -6 },
        },
      },
      {
        label: 'Let it go',
        success: {
          text: 'You walk away. Some people will always think your time is free.',
          effects: { energy: -20, happiness: -4 },
        },
      },
    ],
  },
  {
    id: 'ev_flyer_job',
    title: 'Flyers',
    text: 'A new noodle shop needs someone to hand out flyers through the lunch rush. Fifteen dollars and a bowl of noodles.',
    tone: 'good',
    weight: 4,
    cooldownDays: 30,
    when: { district: ['downtown', 'university'] },
    choices: [
      {
        label: 'Take it',
        success: {
          text: 'You hand out three hundred flyers and smile until your face hurts. The noodles are excellent.',
          effects: { cash: 15, food: 15, energy: -10, skills: { charisma: 0.5 } },
        },
      },
      {
        label: 'Not today',
        success: {
          text: 'You don’t have four hours of smiling in you today. The owner says maybe next time.',
        },
      },
    ],
  },
  {
    id: 'ev_moving_day',
    title: 'Move-out week',
    text: 'It’s the end of the semester on {university}. Students are dragging furniture to the curb, and one of them is losing a fight with a mattress.',
    tone: 'good',
    weight: 4,
    cooldownDays: 60,
    when: { district: ['university'], season: ['spring', 'summer'] },
    choices: [
      {
        label: 'Offer a hand',
        when: { lacksItem: ['clean_clothes'] },
        success: {
          text: 'Three flights and a futon later, he pays you twenty-five dollars and a bag of clothes he “never wore.” Some of them fit.',
          effects: { cash: 25, energy: -12, addItem: ['clean_clothes'], happiness: 4 },
        },
      },
      {
        label: 'Offer a hand',
        when: { hasItem: ['clean_clothes'] },
        success: {
          text: 'Three flights and a futon later, he pays you twenty-five dollars and tries to give you his mini-fridge.',
          effects: { cash: 25, energy: -12, happiness: 3 },
        },
      },
      {
        label: 'Pick through the curb pile',
        success: {
          text: 'A lamp, a toaster and half a box of granola bars. You keep the granola and sell the rest for a few bucks.',
          effects: { cash: 8, food: 8 },
        },
      },
    ],
  },

  // ---------------------------------------------------------------- Shelter
  {
    id: 'ev_bunkmate_snores',
    title: 'The snorer',
    text: 'The man in the next cot snores like a leaf blower with a grudge. By two a.m. the whole row is awake and glaring at him. He sleeps on, serene.',
    tone: 'bad',
    weight: 5,
    cooldownDays: 20,
    when: { housing: ['shelter'] },
    effects: { energy: -10, happiness: -2 },
  },
  {
    id: 'ev_shelter_chores',
    title: 'Extra hands',
    text: '{inesShort} is short on volunteers for the shelter’s evening dishes. She doesn’t ask. She just holds out an apron and raises an eyebrow.',
    tone: 'neutral',
    weight: 4,
    cooldownDays: 20,
    speaker: 'ines',
    when: { housing: ['shelter'], beat: ['meet_ines'] },
    choices: [
      {
        label: 'Put on the apron',
        success: {
          text: 'Two hours of pots and trays. After, {inesShort} hands you a plate she saved. “You showed up. People remember that.”',
          effects: { energy: -10, food: 10, rel: { ines: 6 }, reputation: 1 },
        },
      },
      {
        label: 'Say you’re too tired',
        success: {
          text: 'She nods. “Rest, then.” She finds someone else.',
        },
      },
    ],
  },
  {
    id: 'ev_locker_key',
    title: 'Lost key',
    text: 'Your locker key isn’t on its string. Everything you own that matters is behind that little metal door.',
    tone: 'bad',
    weight: 3,
    cooldownDays: 45,
    when: { housing: ['shelter'] },
    choices: [
      {
        label: 'Pay the desk for a new key',
        costCash: 5,
        success: {
          text: 'Five dollars and a short talk about keeping track of things. The door opens. Everything is still there.',
          effects: { happiness: -1 },
        },
      },
      {
        label: 'Retrace your steps',
        chance: 0.6,
        success: {
          text: 'It’s in the shower room, under the bench, right where you somehow knew it would be.',
          effects: { energy: -4 },
        },
        failure: {
          text: 'You search until lights-out and come up empty. Tomorrow you’ll have to plead your case at the desk.',
          effects: { energy: -6, happiness: -4 },
        },
      },
    ],
  },
  {
    id: 'ev_shelter_movie',
    title: 'Movie night',
    text: 'Someone has rigged a projector to a bedsheet in the common room. It’s a comedy from twenty years ago, and forty strangers laugh at the same jokes.',
    tone: 'good',
    weight: 3,
    cooldownDays: 30,
    when: { housing: ['shelter'] },
    effects: { happiness: 7, energy: 2 },
  },

  // ---------------------------------------------------------------- Rented room
  {
    id: 'ev_neighbor_noise',
    title: 'Thin walls',
    text: 'The neighbor is playing music at one a.m. Loud. The same four songs, over and over.',
    tone: 'bad',
    weight: 5,
    cooldownDays: 25,
    when: { housing: ROOMS },
    choices: [
      {
        label: 'Knock and ask nicely',
        chance: { base: 0.55, skill: 'charisma', perSkill: 0.004, max: 0.9 },
        success: {
          text: 'He opens the door, looks mortified, and turns it off. In the morning there’s an apology note under your door.',
          effects: { happiness: 2 },
        },
        failure: {
          text: 'He turns it down for ten minutes, then back up. You sleep in fits.',
          effects: { energy: -10, happiness: -3 },
        },
      },
      {
        label: 'Buy earplugs at {corner}',
        costCash: 5,
        success: {
          text: 'Toilet paper in your ears tonight, real earplugs in the morning. Worth every cent.',
          effects: { energy: -4 },
        },
      },
      {
        label: 'Put a pillow over your head',
        success: {
          text: 'You lie awake and learn every word of all four songs.',
          effects: { energy: -10, happiness: -2 },
        },
      },
    ],
  },
  {
    id: 'ev_fridge_thief',
    title: 'Fridge thief',
    text: 'Someone has been eating your food out of the shared fridge. Today it’s the leftovers you were saving for dinner.',
    tone: 'bad',
    weight: 4,
    cooldownDays: 30,
    when: { housing: ROOMS },
    choices: [
      {
        label: 'Tape a polite note to the fridge',
        chance: 0.5,
        success: {
          text: 'The next day your food is untouched, and someone has drawn a sheepish face on your note.',
          effects: { food: -8, happiness: 1, codex: ['theft'] },
        },
        failure: {
          text: 'Your note disappears. So does your yogurt.',
          effects: { food: -12, happiness: -3, codex: ['theft'] },
        },
      },
      {
        label: 'Keep your food in your room',
        success: {
          text: 'A cooler bag under the bed. Annoying, but nothing else goes missing.',
          effects: { food: -8, codex: ['theft'] },
        },
      },
    ],
  },
  {
    id: 'ev_landlord_knock',
    title: 'A knock',
    text: 'Three sharp knocks. It’s {albescu} with a toolbox. “Your radiator is on my list,” he says, and steps past you. Five minutes turns into forty.',
    tone: 'neutral',
    weight: 4,
    cooldownDays: 30,
    speaker: 'albescu',
    when: { housing: ['room_albescu'] },
    choices: [
      {
        label: 'Hold the flashlight',
        success: {
          text: 'He talks you through bleeding the valve like you might need to know someday. By the end he’s calling you by your first name.',
          effects: { rel: { albescu: 5 }, skills: { trade: 0.5 } },
        },
      },
      {
        label: 'Wait in the hall',
        success: {
          text: 'You lean in the hallway until he’s done. He grunts on the way out, which may be goodbye.',
          effects: { rel: { albescu: 1 } },
        },
      },
    ],
  },

  // ---------------------------------------------------------------- Dog
  {
    id: 'ev_dog_finds_food',
    title: 'A good find',
    text: '{dog} vanishes behind the pet store and trots back dragging a torn sack of kibble, looking extremely pleased with the world.',
    tone: 'good',
    weight: 5,
    cooldownDays: 20,
    when: { hasDog: true },
    effects: { dogFood: 3, dogBond: 2, happiness: 3 },
  },
  {
    id: 'ev_dog_sick',
    title: 'Sick dog',
    text: '{dog} won’t eat and hasn’t left your side all day. A low-cost vet clinic in {riverfront} can see {dog} today for forty dollars.',
    tone: 'bad',
    weight: 3,
    cooldownDays: 45,
    when: { hasDog: true },
    choices: [
      {
        label: 'Take {dog} to the vet',
        costCash: 40,
        chance: 0.9,
        success: {
          text: 'Something {dog} ate, the vet says. A shot, some pills, and by evening the tail is going again.',
          effects: { dogBond: 6, happiness: 4 },
        },
        failure: {
          text: 'The vet does what she can and sends you home with pills. It takes {dog} a rough week to bounce back.',
          effects: { dogBond: 3, happiness: -3 },
        },
      },
      {
        label: 'Keep {dog} warm and wait it out',
        chance: 0.6,
        success: {
          text: 'You keep {dog} close all night. By morning the appetite is back.',
          effects: { dogBond: 2 },
        },
        failure: {
          text: '{dog} is miserable for days. You barely sleep, listening to every breath.',
          effects: { dogBond: -4, happiness: -8, energy: -10 },
        },
      },
    ],
  },
  {
    id: 'ev_dog_kid',
    title: 'Best trick',
    text: 'A little boy waiting for the bus asks if he can pet {dog}. {dog} rolls over on cue, and the kid laughs so hard he gets hiccups. His mom thanks you twice.',
    tone: 'good',
    weight: 4,
    cooldownDays: 25,
    when: { hasDog: true },
    effects: { reputation: 3, happiness: 6, dogBond: 2 },
  },
  {
    id: 'ev_dog_cold_night',
    title: 'Warm weight',
    text: 'It’s the coldest night yet. {dog} climbs into your lap without asking and stays there until morning.',
    tone: 'good',
    weight: 4,
    cooldownDays: 30,
    when: { hasDog: true, housing: ['street'], season: ['winter'] },
    effects: {
      health: 2,
      energy: 5,
      dogBond: 5,
      journal: '{dog} kept me warm all night. I don’t know anymore who’s taking care of who.',
    },
  },

  // ---------------------------------------------------------------- Kindness & dignity
  {
    id: 'ev_socks_volunteer',
    title: 'Dry socks',
    text: 'A volunteer with a rolling suitcase is handing out new socks, still in the package. She gives you two pairs and asks how your feet are holding up.',
    tone: 'good',
    weight: 4,
    cooldownDays: 40,
    when: { notHousing: ROOMS },
    effects: { health: 3, happiness: 4 },
  },
  {
    id: 'ev_soup_van',
    title: 'The soup van',
    text: 'A church van parks by {overpass} at dusk. Hot lentil soup, bread, and an orange for everyone. No sermon, just a guy with a ladle asking if you want seconds.',
    tone: 'good',
    weight: 5,
    cooldownDays: 25,
    when: { notHousing: ROOMS },
    effects: { food: 20, happiness: 3, codex: ['diet'] },
  },
  {
    id: 'ev_student_interview',
    title: 'Class project',
    text: 'A college student with a notebook asks if she can interview you for her sociology class. She offers ten dollars for your time and looks nervous asking.',
    tone: 'neutral',
    weight: 3,
    once: true,
    when: { minDay: 5 },
    choices: [
      {
        label: 'Tell her how you really got here',
        success: {
          text: 'You talk for an hour. Halfway through she stops writing and just listens. “Thank you for trusting me with that.”',
          effects: {
            cash: 10,
            happiness: 6,
            skills: { charisma: 1 },
            journal: 'Told a stranger my whole story today. Out loud, it sounded less like failure than it does in my head.',
          },
        },
      },
      {
        label: 'Give her the short version',
        success: {
          text: 'You give her the basics and take the ten. She thanks you like you gave her more.',
          effects: { cash: 10 },
        },
      },
      {
        label: 'Politely decline',
        success: {
          text: 'You’re not a lesson plan today. She nods, a little embarrassed, and says she understands.',
        },
      },
    ],
  },
  {
    id: 'ev_find_cart',
    title: 'Abandoned cart',
    text: 'A shopping cart lies on its side in the weeds by the river, one wheel turning in the wind. The store it came from closed two years ago.',
    tone: 'good',
    weight: 5,
    once: true,
    when: { lacksItem: ['shopping_cart'], minDay: 4 },
    choices: [
      {
        label: 'Take it',
        success: {
          text: 'You wrestle it upright. One wheel wobbles, but it rolls. You can haul a lot more cans now.',
          effects: { addItem: ['shopping_cart'], happiness: 3 },
        },
      },
      {
        label: 'Leave it',
        success: {
          text: 'You leave it to the weeds.',
        },
      },
    ],
  },

  // ---------------------------------------------------------------- Backstory
  {
    id: 'ev_bs_coworker',
    title: 'Someone from the line',
    text: 'You know the walk before you see the face: the man who ran the press next to yours for eleven years. He’s coming straight down the sidewalk toward you.',
    tone: 'neutral',
    weight: 4,
    once: true,
    when: { backstory: ['laid_off'], minDay: 5 },
    choices: [
      {
        label: 'Say his name',
        success: {
          text: 'He stops. It takes him a second. Then he hugs you, right there on the street, and writes his number on a receipt.',
          effects: {
            happiness: 8,
            setFlag: { oldCoworkerNumber: true },
            journal: 'Ran into someone from the plant. I thought I’d want to disappear. He hugged me like no time had passed.',
          },
        },
      },
      {
        label: 'Look down until he passes',
        success: {
          text: 'He walks right by without seeing you. You’re relieved, and then you’re not.',
          effects: {
            happiness: -5,
            journal: 'Hid from someone from the plant today. I still don’t know what I was ashamed of.',
          },
        },
      },
    ],
  },
  {
    id: 'ev_bs_job_posting',
    title: 'Help wanted',
    text: 'A posting in a coffee shop window is for your old job, almost word for word. Same title, same “fast-paced environment,” same salary you used to make.',
    tone: 'neutral',
    weight: 4,
    once: true,
    when: { backstory: ['burned_out'], minDay: 10 },
    choices: [
      {
        label: 'Take a photo of it, just in case',
        success: {
          text: 'You’re not ready. But you might be someday, and next time you’d do it differently.',
          effects: {
            happiness: 3,
            setFlag: { oldFieldLead: true },
            journal: 'Saw a posting for my old job. I didn’t feel sick this time. That’s new.',
          },
        },
      },
      {
        label: 'Keep walking',
        success: {
          text: 'The thought of that inbox still tightens your chest. You keep walking, and that’s allowed.',
          effects: { happiness: 1 },
        },
      },
    ],
  },
  {
    id: 'ev_bs_caseworker',
    title: 'A familiar face',
    text: 'Your old caseworker from the county is buying coffee at {corner}. She sees you before you can decide whether to hide.',
    tone: 'neutral',
    weight: 4,
    once: true,
    when: { backstory: ['foster'], minDay: 7 },
    choices: [
      {
        label: 'Let her buy you a coffee',
        success: {
          text: 'She asks real questions and waits for real answers. Before she goes, she writes down a youth housing program that takes people up to twenty-four.',
          effects: {
            happiness: 6,
            food: 5,
            setFlag: { youthProgramLead: true },
            journal: 'Saw my old caseworker. She still remembered my birthday. I didn’t know how much I needed someone to.',
          },
        },
      },
      {
        label: 'Tell her you’re doing fine',
        success: {
          text: 'She doesn’t believe you, but she lets you have it. On her way out she presses a twenty into your hand.',
          effects: { cash: 20, happiness: -2 },
        },
      },
    ],
  },
  {
    id: 'ev_bs_old_sign',
    title: 'The old sign',
    text: 'Propped against a salvage yard fence is the sign from your hardware store. Your name is still on it, faded to pink.',
    tone: 'neutral',
    weight: 4,
    once: true,
    when: { backstory: ['failed_business'], minDay: 5 },
    choices: [
      {
        label: 'Stand there a while',
        success: {
          text: 'Opening day. The ribbon. Your first customer, who bought a single hinge. It hurts, but it happened, and nobody can take that.',
          effects: {
            happiness: -2,
            skills: { business: 1 },
            journal: 'Found my old store sign in a junkyard. I built something once. I can do it again: smaller, smarter.',
          },
        },
      },
      {
        label: 'Ask what they want for it',
        success: {
          text: 'The yard man says fifty bucks. You laugh, and for the first time in months it’s a real one.',
          effects: { happiness: 4 },
        },
      },
    ],
  },

  // ---------------------------------------------------------------- Library
  {
    id: 'ev_library_help',
    title: 'The reference desk',
    text: 'The librarian at {library} notices you’ve been fighting the same online form for an hour. She pulls up a chair.',
    tone: 'good',
    weight: 4,
    cooldownDays: 30,
    when: LIBRARY_OPEN,
    choices: [
      {
        label: 'Accept the help',
        success: {
          text: 'She sets you up with a free email address and a one-page résumé that doesn’t lie and doesn’t apologize. You print three copies.',
          effects: { skills: { business: 1, charisma: 0.5 }, happiness: 5 },
        },
      },
      {
        label: 'Say you’ve got it',
        success: {
          text: 'You figure it out yourself eventually. It takes the rest of the afternoon.',
          effects: { skills: { business: 0.5 }, energy: -5 },
        },
      },
    ],
  },
  {
    id: 'ev_library_book',
    title: 'Free books',
    text: 'There’s a cart of withdrawn books outside {library} with a hand-lettered sign: FREE, TAKE ONE.',
    tone: 'good',
    weight: 3,
    cooldownDays: 40,
    when: LIBRARY_OPEN,
    choices: [
      {
        label: 'A small-engine repair manual',
        success: {
          text: 'Greasy diagrams and dog-eared pages. You read it cover to cover over two nights.',
          effects: { skills: { trade: 1.5 } },
        },
      },
      {
        label: 'A thick mystery novel',
        success: {
          text: 'You guess the killer on page 300 and feel smug about it for a whole day.',
          effects: { happiness: 8 },
        },
      },
      {
        label: 'A book about talking to people',
        success: {
          text: 'Half of it is obvious. The other half is surprisingly useful.',
          effects: { skills: { charisma: 1 } },
        },
      },
    ],
  },

  // ---------------------------------------------------------------- Small comedies
  {
    id: 'ev_pigeon_standoff',
    title: 'Standoff',
    text: 'You set your sandwich down for one second. A pigeon with one bad foot and zero fear lands beside it and looks you dead in the eye.',
    tone: 'neutral',
    weight: 4,
    cooldownDays: 45,
    choices: [
      {
        label: 'Defend the sandwich',
        chance: 0.7,
        success: {
          text: 'You win. The pigeon struts off like it was never interested. You eat with one arm curled around the bread.',
          effects: { food: 8 },
        },
        failure: {
          text: 'It snatches half and flaps to a ledge to eat it in front of you. Honestly, respect.',
          effects: { food: 3, happiness: 1 },
        },
      },
      {
        label: 'Share a corner of the crust',
        success: {
          text: 'You tear off a piece. Within a minute there are eleven pigeons, and you are their god.',
          effects: { food: 5, happiness: 4 },
        },
      },
    ],
  },
  {
    id: 'ev_tourist_directions',
    title: 'Walking tour',
    text: 'A couple with a paper map and matching sun hats asks you the way to the old harbor lighthouse. You end up walking them there and pointing out the good bakery on the way. They insist on tipping the guide.',
    tone: 'good',
    weight: 4,
    cooldownDays: 30,
    when: { district: ['downtown', 'riverfront'], season: ['spring', 'summer', 'autumn'] },
    effects: { cash: 15, happiness: 5, skills: { charisma: 0.5 } },
  },
];
