import type { BackstoryDef } from './types';

export const BACKSTORIES: BackstoryDef[] = [
  {
    id: 'laid_off',
    title: 'Laid off',
    pitch: 'Nineteen years on the line at the Kessler plant. Then the plant moved and the savings didn’t last.',
    ageYears: 38,
    lifeExpectancyYears: 74,
    cash: 9,
    stats: { health: 70, happiness: 35 },
    skills: { trade: 20, business: 5, charisma: 8 },
    modifiers: ['Trade skill 20: better odds at day labor', 'Age 38', 'Starts with $9'],
  },
  {
    id: 'burned_out',
    title: 'Burned out',
    pitch: 'You were good at a job that ate you alive. One missed month became three, then the eviction notice.',
    ageYears: 31,
    lifeExpectancyYears: 76,
    cash: 23,
    stats: { health: 55, happiness: 20 },
    skills: { charisma: 20, business: 10 },
    modifiers: ['Charisma 20: better begging and busking', 'Low happiness at the start', 'Starts with $23'],
  },
  {
    id: 'foster',
    title: 'Aged out of care',
    pitch: 'You turned eighteen and the system said good luck. A year of couches later, the couches ran out.',
    ageYears: 19,
    lifeExpectancyYears: 78,
    cash: 4,
    stats: { health: 80, happiness: 40 },
    skills: { streetSmarts: 15, charisma: 5 },
    modifiers: ['Street smarts 15: better scavenging, less theft', 'Young: the most time on the clock', 'Starts with $4'],
  },
  {
    id: 'failed_business',
    title: 'Lost the business',
    pitch: 'You bet everything on a hardware store. The big box opened across the road. The bank took the rest.',
    ageYears: 45,
    lifeExpectancyYears: 72,
    cash: 31,
    stats: { health: 60, happiness: 25 },
    skills: { business: 25, charisma: 15 },
    flags: { collectionsDebt: 8400 },
    modifiers: ['Business 25 (pays off in later acts)', '$8,400 in old debt in collections', 'Starts with $31'],
  },
];

export const backstoryById = (id: string) => BACKSTORIES.find((b) => b.id === id)!;
