// Every proper name in the game lives here. Content text refers to these through
// {placeholders} (see engine/text.ts), so a rename is a one-line change.

export const GAME_VERSION = '0.1.0';

export const NAMES = {
  game: 'Curbside',
  tagline: 'Start with nothing. Build a life.',
  city: 'Port Ellery',

  // Districts
  riverfront: 'the Riverfront',
  downtown: 'Downtown',
  university: 'University Hill',
  oldmill: 'Old Mill',
  suburbs: 'Maple Park',
  heights: 'the Heights',

  // Places
  overpass: 'the Harbor Street overpass',
  kitchen: 'Harbor Street Kitchen',
  shelter: 'Harbor Street Shelter',
  clinic: 'Riverfront Free Clinic',
  library: 'Wexley Branch Library',
  thrift: 'Second Chances Thrift',
  pawn: 'Lucky Seven Pawn',
  corner: 'Dino’s Corner Store',
  bikeShop: 'Spoke & Chain',
  creditUnion: 'Riverside Credit Union',
  laborLot: 'the Pell Lumber lot',
  records: 'the County Records Office',
  dmv: 'the DMV on Fifth',
  roomAlbescu: 'Albescu Rooms',
  roomCanal: 'Canal Street Rooms',
  transit: 'Port Ellery Transit',

  // Recurring cast
  ines: 'Ines Calder',
  inesShort: 'Ines',
  wick: 'Wick',
  wickFull: 'Dale "Wick" Whitcomb',
  priya: 'Priya Sandhu',
  priyaShort: 'Priya',
  albescu: 'Mr. Albescu',
  grace: 'Grace Tolliver',
  graceShort: 'Grace',
  jaylen: 'Jaylen',
  rafe: 'Rafe Dunmore',
  canalLandlady: 'Dotty Fenn',
} as const;

export type NameKey = keyof typeof NAMES;
