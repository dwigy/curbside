import type { DistrictDef } from './types';

export const DISTRICTS: DistrictDef[] = [
  {
    id: 'riverfront',
    blurb: 'Warehouses, the overpass, the kitchen, the shelter. Where you start.',
    open: {},
    lockedReason: '',
  },
  {
    id: 'downtown',
    blurb: 'Office towers and foot traffic. Begging and busking pay more. Deliveries too.',
    open: {},
    lockedReason: '',
  },
  {
    id: 'university',
    blurb: 'Students, bars, recycling bins overflowing on Sunday mornings. Great for cans and busking.',
    open: {},
    lockedReason: '',
  },
  { id: 'oldmill', blurb: 'Old factories turning into lofts. Trades and cheap property.', open: false, lockedReason: 'Opens in Act II.' },
  { id: 'suburbs', blurb: 'Lawns, schools, cul-de-sacs.', open: false, lockedReason: 'Opens in Act II.' },
  { id: 'heights', blurb: 'Gates and views. Money lives up here.', open: false, lockedReason: 'Opens in Act III.' },
];

export const districtById = (id: string) => DISTRICTS.find((d) => d.id === id)!;
