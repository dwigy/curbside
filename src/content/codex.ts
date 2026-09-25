import type { CodexDef } from './types';

// "Street Smarts": the in-game codex. Entries unlock as you discover things.
export const CODEX: CodexDef[] = [
  {
    id: 'clock',
    title: 'The clock',
    category: 'basics',
    body:
      'Every action spends days, and days spend your life. The number at the top is exactly how much life you have left if nothing changes. Hard living (sleeping outside, going hungry, poor health) makes it drop faster than the calendar. Good food, shelter and care slow it down or buy time back. The arrow shows which way it’s trending. You’ll always be warned at 5 years, 1 year and 90 days left.',
  },
  {
    id: 'needs',
    title: 'Food, energy, health, happiness',
    category: 'health',
    body:
      'Fed drops about 28 a day (more for hard work). Below 20 you’re hungry and earn less; at 0 you’re starving and your health crashes. Energy comes back when you sleep, and how much depends on where you sleep. Health falls with cold nights, hunger and exhaustion. If it hits 0 you collapse and lose months of life. Happiness below 20 makes everything harder.',
  },
  {
    id: 'odds',
    title: 'Every number is honest',
    category: 'basics',
    body:
      'When the game shows you a percentage (a shelter bed, being picked at the lot, a choice in an event), that is the real probability the game rolls. No hidden modifiers, no fake guarantees. Expected values are shown where it matters.',
  },
  {
    id: 'shops',
    title: 'Buying things that buy you days',
    category: 'money',
    body:
      'Early purchases aren’t luxuries, they’re tools. A sleeping bag protects your health. A phone opens odd jobs. Boots and an ID get you onto work crews. A bike plus a phone means deliveries. Each one opens a better way to earn, so buy them in an order that pays for the next one.',
  },
  {
    id: 'kitchen',
    title: '{kitchen}',
    category: 'places',
    body: 'Free lunch every day but Sunday, in {riverfront}. Decent food (diet quality 55). {inesShort} runs it and notices who keeps coming back.',
  },
  {
    id: 'shelter_intro',
    title: 'Shelter beds',
    category: 'places',
    body:
      'The {shelter} has cots, lockers and a curfew. You have to line up for a bed and there aren’t always enough: the real odds are shown before you try, and they’re worse in winter. Stays are capped at 60 nights. No pets.',
  },
  {
    id: 'shelter',
    title: 'Living in the shelter',
    category: 'places',
    body:
      'Indoors, your life clock runs much slower than outside and theft is rarer. The curfew costs evening income from busking and deliveries (-20%). When your 60 nights run out, you have to wait 14 days to reapply, so use the time to save for a room.',
  },
  {
    id: 'wick',
    title: '{wick}',
    category: 'people',
    body: 'Knows every can route in the city and every cop’s beat. Good company, bad nights. What happens to him depends partly on you.',
  },
  {
    id: 'priya',
    title: '{priyaShort}',
    category: 'people',
    body: 'Starting over like you, and determined to do it faster. A rival, maybe an ally. She keeps score in a notebook.',
  },
  {
    id: 'dog',
    title: 'Your dog',
    category: 'basics',
    body:
      'A dog makes people kinder: +25% when asking for change. It lifts your mood every day. It needs food: a $9 bag lasts 7 days. If it goes 5 days without food it will leave, and you’ll be warned every day before that happens. Shelters and some landlords don’t allow pets.',
  },
  {
    id: 'papers',
    title: 'Papers',
    category: 'money',
    body:
      'Birth certificate (by mail, $15, 14 days) → State ID (DMV, $28, two days of lines) → bank account, day labor, renting. Bureaucracy is a hustle of its own. The kitchen lets you use its address for mail.',
  },
  {
    id: 'spot_fatigue',
    title: 'Wearing out a corner',
    category: 'basics',
    body:
      'Ask for change in the same district day after day and people stop seeing you: up to 45% less. It recovers when you do something else or move somewhere new. The Hustle tab shows how worn out your current spot is.',
  },
  {
    id: 'districts',
    title: 'Districts',
    category: 'places',
    body:
      '{downtown} pays best for asking for change and busking. {university} is great for cans and music. {riverfront} is home: the kitchen, shelter, clinic and labor lot. Walking between districts takes a day; a bus pass makes it free.',
  },
  {
    id: 'theft',
    title: 'Theft',
    category: 'money',
    body:
      'Cash on you can be stolen at night. The exact nightly risk is on the Money tab: highest on the street, lower in the shelter, lowest behind a locked door. Street smarts lower it. Money in a bank account can’t be stolen, which is why the account matters.',
  },
  {
    id: 'bank',
    title: 'Bank account',
    category: 'money',
    body:
      'Needs a State ID and a $25 opening deposit. Deposits and withdrawals are free and instant. Rent comes out of cash first, then the bank. Later (Act II) the bank is also where credit, loans and savings live.',
  },
  {
    id: 'habit',
    title: 'The habit',
    category: 'money',
    body:
      'The single most reliable way up: spend less than you earn, every week, and move the difference somewhere safe. Small amounts compound into options.',
  },
  {
    id: 'rent',
    title: 'Rent',
    category: 'money',
    body:
      'A room costs a two-week deposit plus weekly rent, charged every 7 days from cash and then the bank. Landlords also want a reference: {inesShort} will vouch for you once she trusts you. Miss a payment and you have 7 days of grace to catch up before you’re evicted and lose the deposit. You’ll be warned. A room gives you real sleep, a kitchen for cheap healthy meals, and an address.',
  },
  {
    id: 'weather',
    title: 'Weather',
    category: 'health',
    body:
      'Rain and snow cut street income (busking most of all) and hurt your health if you sleep outside. Deliveries pay a rain surge. Winter nights outside are the most dangerous thing in Act I: a sleeping bag halves the damage.',
  },
  {
    id: 'diet',
    title: 'Diet',
    category: 'health',
    body:
      'Every food has a quality. Your diet score is a rolling average of what you eat. Above 70 it slowly adds to your life expectancy; below 30 it slowly takes away. Cheap and filling is rarely the same as good.',
  },
  {
    id: 'kindness',
    title: 'Kindness',
    category: 'people',
    body: 'People remember. Reputation opens doors (odd jobs come easier) and the cast of this city keeps track of what you did.',
  },
  {
    id: 'batch',
    title: 'Doing things many times',
    category: 'basics',
    body:
      'Tap ×10 or ×100 to repeat an action, or "Until…" to repeat until a condition (e.g. until $200, or until health drops below 40). Batches stop automatically for events, story moments and warnings. With auto-eat on, you eat the cheapest decent food whenever you’re getting hungry.',
  },
];

export const codexById = (id: string) => CODEX.find((c) => c.id === id);
