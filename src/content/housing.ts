import type { HousingDef } from './types';

export const HOUSING: HousingDef[] = [
  {
    id: 'street',
    name: 'Sleeping rough',
    tier: 'street',
    desc: 'Under {overpass}. Free. Costs you in other ways.',
    rent: 0,
    deposit: 0,
    pets: true,
    perks: ['Free', 'Worst sleep, highest theft risk', 'Your life clock runs fast'],
  },
  {
    id: 'shelter',
    name: 'Bed at the {shelter}',
    tier: 'shelter',
    desc: 'A cot, a locker, a curfew. Stays are limited to 60 nights.',
    rent: 0,
    deposit: 0,
    pets: false,
    visible: { beat: ['meet_ines'] },
    perks: ['Free', 'Better sleep, low theft', 'Curfew: busking and deliveries earn 20% less', 'No pets'],
  },
  {
    id: 'room_albescu',
    name: 'Room at {roomAlbescu}',
    tier: 'room',
    desc: 'Eight by ten, a window, a lock. Shared kitchen and bath. No pets.',
    rent: 85,
    deposit: 170,
    pets: false,
    requires: { hasItem: ['state_id'] },
    requiresReason: 'The landlord needs to see a State ID.',
    visible: { beat: ['room_hint'] },
    perks: ['$85/week + $170 deposit (two weeks)', 'Real sleep, a door that locks', 'Kitchen: cook cheap healthy meals', 'An address for job applications'],
  },
  {
    id: 'room_canal',
    name: 'Room at {roomCanal}',
    tier: 'room',
    desc: 'A little bigger, a little shabbier. {canalLandlady} doesn’t mind dogs.',
    rent: 110,
    deposit: 220,
    pets: true,
    requires: { hasItem: ['state_id'] },
    requiresReason: 'The landlady needs to see a State ID.',
    visible: { beat: ['room_hint'] },
    perks: ['$110/week + $220 deposit (two weeks)', 'Pets allowed', 'Kitchen and an address'],
  },
];

export const housingById = (id: string) => HOUSING.find((h) => h.id === id)!;
