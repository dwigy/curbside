import { useId, type ReactElement } from 'react';

/**
 * CURBSIDE scene illustrations.
 *
 * Flat, layered vector art: bold simple shapes, gradients for sky and light,
 * a shared grain + vignette finish, silhouettes rather than detailed faces.
 * Every gradient/pattern id is prefixed with the scene id plus a React id so
 * several scenes can live on one page without collisions.
 */

export type SceneId =
  | 'overpass'
  | 'kitchen'
  | 'dog'
  | 'papers'
  | 'labor'
  | 'bank'
  | 'door'
  | 'city'
  | 'candle'
  | 'library'
  | 'rain'
  | 'shelter';

const LABELS: Record<SceneId, string> = {
  overpass: 'Dawn under a concrete highway overpass by the river. A lone figure sits on flattened cardboard beside a shopping cart under an amber lamp.',
  kitchen: 'A warm community kitchen serving window with steaming pots and a line of people waiting.',
  dog: 'A scruffy stray dog sits in a puddle-lit alley, looking up hopefully.',
  papers: 'A desk under fluorescent light with forms, a rubber stamp, an ID card and a pen.',
  labor: 'A lumber yard gate at five in the morning. Workers in hoodies wait in the glow of a pickup truck.',
  bank: 'A small credit union counter with a teller window and a potted plant.',
  door: 'A narrow rented-room door stands ajar, golden light spilling out, a key in the lock.',
  city: 'The Port Ellery skyline at dusk: a river bridge, towers, hills and warehouses.',
  candle: 'A single candle burning quietly in the dark.',
  library: 'A figure reads at a long table in a library with tall windows and warm light.',
  rain: 'A rainy street at night. A figure shelters under an awning while lights reflect on the wet road.',
  shelter: 'Rows of cots under high windows in a shelter at night, lit by dim blue light.',
};

const SCENE_IDS = Object.keys(LABELS) as SceneId[];

interface Ctx {
  id: (name: string) => string;
  url: (name: string) => string;
}

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

/** Deterministic PRNG so generated details (books, rain) are stable. */
function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Grain, hatch and vignette definitions shared by every scene. */
function TextureDefs({ c, hatch = '#000' }: { c: Ctx; hatch?: string }) {
  return (
    <>
      <pattern id={c.id('grainA')} width="17" height="13" patternUnits="userSpaceOnUse">
        <rect x="1" y="1" width="0.8" height="0.8" fill="#000" opacity="0.2" />
        <rect x="9.5" y="3" width="0.7" height="0.7" fill="#fff" opacity="0.09" />
        <rect x="4.5" y="7.2" width="0.7" height="0.7" fill="#000" opacity="0.16" />
        <rect x="14" y="10.3" width="0.6" height="0.6" fill="#fff" opacity="0.08" />
        <rect x="12" y="6" width="0.8" height="0.8" fill="#000" opacity="0.14" />
        <rect x="6.5" y="11.5" width="0.6" height="0.6" fill="#fff" opacity="0.07" />
        <rect x="15.5" y="1.5" width="0.7" height="0.7" fill="#000" opacity="0.12" />
      </pattern>
      <pattern id={c.id('grainB')} width="11" height="9" patternUnits="userSpaceOnUse">
        <rect x="3" y="2" width="0.7" height="0.7" fill="#fff" opacity="0.08" />
        <rect x="8" y="6" width="0.8" height="0.8" fill="#000" opacity="0.16" />
        <rect x="1.5" y="7" width="0.6" height="0.6" fill="#000" opacity="0.1" />
      </pattern>
      <pattern
        id={c.id('hatch')}
        width="3.2"
        height="3.2"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(38)"
      >
        <rect width="0.75" height="3.2" fill={hatch} opacity="0.32" />
      </pattern>
      <radialGradient id={c.id('vignette')} cx="0.5" cy="0.45" r="0.72">
        <stop offset="0.55" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.5" />
      </radialGradient>
    </>
  );
}

/** Grain + vignette laid over the whole frame. */
function Finish({ c, vignette = 1 }: { c: Ctx; vignette?: number }) {
  return (
    <g pointerEvents="none">
      <rect width="360" height="200" fill={c.url('grainA')} />
      <rect width="360" height="200" fill={c.url('grainB')} />
      <rect width="360" height="200" fill={c.url('vignette')} opacity={vignette} />
    </g>
  );
}

type Headwear = 'none' | 'hood' | 'cap' | 'beanie';

interface PersonProps {
  x: number;
  y: number;
  s?: number;
  fill: string;
  rim?: string;
  rimDx?: number;
  head?: Headwear;
  /** Wider torso (a coat or a pack). */
  bulk?: number;
  flip?: boolean;
}

/** Standing silhouette, feet at (x, y), roughly 42 units tall at s=1. */
function Person({ x, y, s = 1, fill, rim, rimDx = 0.9, head = 'none', bulk = 0, flip }: PersonProps) {
  const w = 6.6 + bulk;
  const shape = (
    <>
      <path
        d={`M${-w + 0.4} -16 L${-w} -26 Q${-w + 0.3} -30.8 0 -31 Q${w - 0.3} -30.8 ${w} -26 L${w - 0.4} -16 Z`}
      />
      <path d="M-5.4 -17.5 L-5 -0.6 L-1.3 -0.6 L0 -12.5 L1.3 -0.6 L5 -0.6 L5.4 -17.5 Z" />
      <rect x="-1.6" y="-32.5" width="3.2" height="3" />
      <circle cx="0" cy="-35.2" r="4.3" />
      {head === 'hood' && (
        <path d="M-5.3 -33.6 Q-5.8 -41.8 0.2 -41.6 Q5.8 -41.4 5.2 -33.4 Q4.6 -30 0 -29.8 Q-4.8 -30 -5.3 -33.6 Z" />
      )}
      {head === 'cap' && (
        <>
          <path d="M-4.6 -37 Q-4.6 -40.9 0 -40.9 Q4.6 -40.9 4.6 -37 Z" />
          <path d="M3 -37.6 L8.6 -37 L3.6 -36 Z" />
        </>
      )}
      {head === 'beanie' && <path d="M-4.7 -36.4 Q-4.8 -42.6 0 -42.6 Q4.8 -42.6 4.7 -36.4 Z" />}
    </>
  );
  const sx = flip ? -s : s;
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${s})`}>
      {rim && (
        <g fill={rim} transform={`translate(${rimDx} -0.4)`}>
          {shape}
        </g>
      )}
      <g fill={fill}>{shape}</g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Overpass: dawn under the highway by the river                   */
/* ------------------------------------------------------------------ */

function Overpass({ c }: { c: Ctx }) {
  return (
    <>
      <defs>
        <linearGradient id={c.id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#343a52" />
          <stop offset="0.4" stopColor="#7d6476" />
          <stop offset="0.66" stopColor="#d4926a" />
          <stop offset="0.78" stopColor="#f2bf78" />
        </linearGradient>
        <radialGradient id={c.id('sun')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff2cc" />
          <stop offset="0.2" stopColor="#f8cf82" stopOpacity="0.85" />
          <stop offset="1" stopColor="#f2a860" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={c.id('river')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8906c" />
          <stop offset="0.5" stopColor="#6c5a62" />
          <stop offset="1" stopColor="#2e3140" />
        </linearGradient>
        <linearGradient id={c.id('pillar')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5b5550" />
          <stop offset="0.6" stopColor="#77706a" />
          <stop offset="1" stopColor="#4a4541" />
        </linearGradient>
        <radialGradient id={c.id('lamp')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.9" />
          <stop offset="0.3" stopColor="#e8a33d" stopOpacity="0.35" />
          <stop offset="1" stopColor="#e8a33d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={c.id('cone')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c56b" stopOpacity="0.45" />
          <stop offset="1" stopColor="#f6c56b" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id={c.id('ground')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6a625a" />
          <stop offset="1" stopColor="#35312e" />
        </linearGradient>
        <TextureDefs c={c} />
      </defs>

      <rect width="360" height="200" fill={c.url('sky')} />
      <circle cx="258" cy="132" r="78" fill={c.url('sun')} />
      <circle cx="258" cy="134" r="10" fill="#fff0c6" />

      {/* far shore skyline */}
      <path
        d="M150 138 V126 h8 v-6 h6 v6 h10 v-14 h9 v14 h6 v-8 h12 v8 h14 v-20 h4 v-4 h4 v24 h10 v-10 h12 v10 h20 v-6 h14 v6 h40 v-12 h10 v12 h22 V140 H150 Z"
        fill="#8a6f78"
        opacity="0.75"
      />
      <path d="M0 140 L360 134 L360 144 L0 148 Z" fill="#5c4d58" />

      {/* river with sun path */}
      <rect x="0" y="143" width="360" height="40" fill={c.url('river')} />
      <g fill="#ffe2a6" opacity="0.8">
        <rect x="244" y="148" width="28" height="1.6" rx="0.8" />
        <rect x="236" y="153" width="40" height="1.4" rx="0.7" opacity="0.8" />
        <rect x="250" y="158" width="20" height="1.3" rx="0.6" opacity="0.7" />
        <rect x="230" y="164" width="30" height="1.2" rx="0.6" opacity="0.5" />
        <rect x="262" y="169" width="18" height="1.2" rx="0.6" opacity="0.4" />
      </g>
      <g stroke="#e8c3a0" strokeWidth="0.8" opacity="0.35" strokeLinecap="round">
        <line x1="40" y1="152" x2="70" y2="152" />
        <line x1="110" y1="160" x2="150" y2="160" />
        <line x1="180" y1="150" x2="200" y2="150" />
        <line x1="310" y1="158" x2="340" y2="158" />
      </g>

      {/* overpass underside */}
      <path d="M0 0 H360 V20 L0 34 Z" fill="#26232a" />
      <path d="M0 34 L360 20 V26 L0 41 Z" fill="#3a3538" />
      <g stroke="#4a444a" strokeWidth="1.2">
        <line x1="0" y1="10" x2="360" y2="3" />
        <line x1="0" y1="22" x2="360" y2="12" />
      </g>
      <path d="M0 41 L360 26 V30 L0 45 Z" fill="#141216" opacity="0.6" />

      {/* pillars */}
      <path d="M32 38 H84 L78 50 V172 H38 V50 Z" fill={c.url('pillar')} />
      <path d="M38 50 H52 V172 H38 Z" fill={c.url('hatch')} />
      <path d="M296 25 H352 L346 38 V180 H302 V38 Z" fill={c.url('pillar')} />
      <path d="M302 38 H316 V180 H302 Z" fill={c.url('hatch')} />
      <path d="M78 50 V172 H74 V52 Z" fill="#8c847b" opacity="0.6" />

      {/* sodium lamp on the pillar and its cone */}
      <path d="M88 58 L150 170 L40 176 L80 58 Z" fill={c.url('cone')} />
      <circle cx="86" cy="58" r="58" fill={c.url('lamp')} />
      <path d="M78 54 h8 v-4 h3 v6 h-11 Z" fill="#2a2622" />
      <path d="M82 56 h9 l-2 4 h-5 Z" fill="#2a2622" />
      <ellipse cx="86.5" cy="60.5" rx="3.2" ry="1.4" fill="#ffe3a0" />

      {/* foreground embankment */}
      <path d="M0 164 Q110 156 220 160 L360 170 V200 H0 Z" fill={c.url('ground')} />
      <path d="M0 164 Q110 156 220 160 L360 170" stroke="#8d8378" strokeWidth="1.2" fill="none" />
      <path d="M0 184 L360 190 V200 H0 Z" fill="#2a2622" opacity="0.6" />
      <g stroke="#6f7d5c" strokeWidth="1.1" strokeLinecap="round">
        <path d="M226 162 l-2 -6 M229 162 l1 -7 M232 163 l3 -5" />
        <path d="M18 163 l-1 -5 M21 163 l2 -6" />
      </g>

      {/* cardboard */}
      <path d="M90 172 L150 166 L160 175 L98 182 Z" fill="#b08a5a" />
      <path d="M124 169 L130 178" stroke="#8a6a42" strokeWidth="1" />
      <path d="M90 172 L98 182 L98 184 L90 174 Z" fill="#7a5c38" />

      {/* backpack */}
      <path d="M102 172 Q101 160 108 159 Q114 160 113 172 Z" fill="#4e5a52" />
      <rect x="103.5" y="164" width="8" height="3" rx="1" fill="#3b453f" />

      {/* seated figure, knees up, amber rim from the lamp */}
      <g transform="translate(126 172)">
        <g fill="#e8a33d" transform="translate(-0.9 -0.6)">
          <path d="M-6 0 L-7.4 -15 Q-7.6 -24 -1.8 -25 L3.4 -24 Q7 -22 7.6 -16 L12.5 -14 Q14.6 -13 14 -10 L13.6 0 Z" />
          <circle cx="1.4" cy="-28.6" r="4.4" />
          <path d="M-3.4 -28 Q-4 -35 1.6 -34.8 Q7 -34.4 6 -27.6 Q4 -24 0 -24 Z" />
        </g>
        <path
          d="M-6 0 L-7.4 -15 Q-7.6 -24 -1.8 -25 L3.4 -24 Q7 -22 7.6 -16 L12.5 -14 Q14.6 -13 14 -10 L13.6 0 Z"
          fill="#27242b"
        />
        <circle cx="1.4" cy="-28.6" r="4.4" fill="#27242b" />
        <path d="M-3.4 -28 Q-4 -35 1.6 -34.8 Q7 -34.4 6 -27.6 Q4 -24 0 -24 Z" fill="#27242b" />
        <path d="M2 -18 Q8 -16 12 -12" stroke="#3a3540" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </g>

      {/* shopping cart */}
      <g transform="translate(166 146)">
        <path d="M2 4 Q6 -6 14 -2 Q22 -8 30 0 Q36 -2 38 4 Z" fill="#a4532e" />
        <path d="M10 -1 Q16 -6 22 -2" stroke="#6e3a24" strokeWidth="1.2" fill="none" />
        <path d="M0 2 H42 L38 20 H5 Z" fill="#9aa0a6" fillOpacity="0.14" stroke="#b6b9bb" strokeWidth="1.3" />
        <g stroke="#b6b9bb" strokeWidth="0.7" opacity="0.8">
          <line x1="8" y1="2" x2="9.5" y2="20" />
          <line x1="15" y1="2" x2="15.5" y2="20" />
          <line x1="22" y1="2" x2="22" y2="20" />
          <line x1="29" y1="2" x2="28.5" y2="20" />
          <line x1="36" y1="2" x2="34.5" y2="20" />
          <line x1="1.5" y1="9" x2="40.5" y2="9" />
          <line x1="3" y1="15" x2="39" y2="15" />
        </g>
        <path d="M42 2 L48 -4 H52" stroke="#b6b9bb" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M6 20 L4 27 H40 L38 20" stroke="#8e9194" strokeWidth="1.2" fill="none" />
        <circle cx="7" cy="28" r="2.2" fill="#2a2622" />
        <circle cx="37" cy="28" r="2.2" fill="#2a2622" />
      </g>

      {/* pigeons */}
      <g fill="#5e5a66">
        <g transform="translate(222 163)">
          <ellipse cx="0" cy="0" rx="4.2" ry="2.6" />
          <circle cx="3.8" cy="-2.4" r="1.7" />
          <path d="M-3.5 -0.5 L-7.5 -1.8 L-4 1.4 Z" />
          <rect x="3" y="-1.6" width="1.4" height="1" fill="#6f8a7a" />
        </g>
        <g transform="translate(238 165) scale(-1 1)">
          <ellipse cx="0" cy="0" rx="4" ry="2.5" />
          <circle cx="1.8" cy="-3.2" r="1.6" />
          <path d="M-3.5 -0.5 L-7.5 -1.8 L-4 1.4 Z" />
        </g>
        <g transform="translate(250 162)">
          <ellipse cx="0" cy="0" rx="3.6" ry="2.2" />
          <circle cx="3" cy="1" r="1.4" />
          <path d="M-3 -0.5 L-6.5 -2 L-3.5 1.2 Z" />
        </g>
      </g>
      <g stroke="#2a2622" strokeWidth="0.6">
        <path d="M222 165.5 v2 M238 167.5 v2 M250 164 v2" />
      </g>
      {/* one pigeon in flight toward the sun */}
      <path d="M270 92 q4 -4 8 0 q4 -4 8 0 q-4 -1.5 -8 1.5 q-4 -3 -8 -1.5 Z" fill="#4a3f4c" />
      <path d="M292 80 q3 -3 6 0 q3 -3 6 0 q-3 -1 -6 1 q-3 -2 -6 -1 Z" fill="#4a3f4c" opacity="0.8" />

      <Finish c={c} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Kitchen: community kitchen serving window                        */
/* ------------------------------------------------------------------ */

function Kitchen({ c }: { c: Ctx }) {
  return (
    <>
      <defs>
        <linearGradient id={c.id('wall')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a3b2e" />
          <stop offset="1" stopColor="#3a2822" />
        </linearGradient>
        <linearGradient id={c.id('inside')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7d596" />
          <stop offset="1" stopColor="#e39a4c" />
        </linearGradient>
        <radialGradient id={c.id('spill')} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#f6c56b" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f6c56b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={c.id('pot')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6b6660" />
          <stop offset="0.5" stopColor="#b8b0a4" />
          <stop offset="1" stopColor="#5c5750" />
        </linearGradient>
        <linearGradient id={c.id('floor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a342a" />
          <stop offset="1" stopColor="#241a17" />
        </linearGradient>
        <TextureDefs c={c} />
      </defs>

      <rect width="360" height="200" fill={c.url('wall')} />
      {/* wainscot */}
      <rect y="132" width="360" height="30" fill="#6e4a36" />
      <rect y="131" width="360" height="2.5" fill="#8a5e42" />

      {/* serving window */}
      <rect x="92" y="46" width="176" height="84" fill={c.url('inside')} />
      {/* back shelf + tiles */}
      <g stroke="#e2a860" strokeWidth="0.8" opacity="0.8">
        <line x1="92" y1="64" x2="268" y2="64" />
        <line x1="92" y1="80" x2="268" y2="80" />
        <line x1="120" y1="46" x2="120" y2="80" />
        <line x1="150" y1="46" x2="150" y2="80" />
        <line x1="180" y1="46" x2="180" y2="80" />
        <line x1="210" y1="46" x2="210" y2="80" />
        <line x1="240" y1="46" x2="240" y2="80" />
      </g>
      <rect x="96" y="58" width="60" height="3" fill="#a4532e" />
      <g fill="#8a4a2a">
        <rect x="100" y="51" width="6" height="7" rx="1" />
        <rect x="110" y="53" width="5" height="5" rx="1" />
        <rect x="119" y="50" width="7" height="8" rx="1" />
        <circle cx="136" cy="54" r="4" />
      </g>
      {/* cook behind the window */}
      <Person x={232} y={140} s={1.6} fill="#7a4a30" head="cap" />
      <path d="M225 104 H239 L242 130 H222 Z" fill="#f3e3c3" opacity="0.9" />
      <path d="M225 104 L229 98 M239 104 L235 98" stroke="#f3e3c3" strokeWidth="1.2" />
      {/* steam */}
      <g fill="none" stroke="#fff6e4" strokeLinecap="round" opacity="0.75">
        <path d="M128 92 q-6 -8 0 -16 q6 -8 0 -18" strokeWidth="3" />
        <path d="M140 94 q6 -8 0 -16 q-5 -7 1 -14" strokeWidth="2.2" />
        <path d="M180 96 q-5 -7 1 -14 q6 -7 0 -16 q-4 -6 2 -12" strokeWidth="3" />
        <path d="M192 98 q5 -6 0 -12 q-4 -5 1 -10" strokeWidth="2" />
      </g>
      {/* pots on the stove */}
      <rect x="112" y="92" width="38" height="28" rx="2" fill={c.url('pot')} />
      <rect x="109" y="90" width="44" height="4" rx="1.5" fill="#8f877d" />
      <rect x="163" y="96" width="34" height="24" rx="2" fill={c.url('pot')} />
      <rect x="160" y="94" width="40" height="4" rx="1.5" fill="#8f877d" />
      <path d="M104 98 h8 M150 98 h8 M155 102 h8 M197 102 h8" stroke="#5c5750" strokeWidth="2.4" strokeLinecap="round" />
      {/* ladle */}
      <path d="M186 94 L196 72" stroke="#5c5750" strokeWidth="1.6" />

      {/* window frame + counter */}
      <path d="M86 40 H274 V136 H86 Z M92 46 V130 H268 V46 Z" fill="#2e211c" fillRule="evenodd" />
      <rect x="80" y="126" width="200" height="8" rx="1" fill="#b98a5a" />
      <rect x="80" y="133" width="200" height="3" fill="#6e4a36" />
      {/* bowls on the counter */}
      <g>
        <path d="M110 126 q0 -6 8 -6 q8 0 8 6 Z" fill="#f3e3c3" />
        <path d="M112 121.5 q6 -2 12 0" stroke="#e39a4c" strokeWidth="1.4" fill="none" />
        <path d="M140 126 q0 -6 8 -6 q8 0 8 6 Z" fill="#f3e3c3" />
        <path d="M142 121.5 q6 -2 12 0" stroke="#e39a4c" strokeWidth="1.4" fill="none" />
        <rect x="248" y="116" width="14" height="10" rx="1" fill="#c9b08a" />
      </g>

      {/* hand-painted sign: a bowl and a heart, brushy edges */}
      <path d="M126 12 Q180 7 234 13 L232 34 Q180 38 128 33 Z" fill="#e8d6ae" />
      <path d="M126 12 Q180 7 234 13 L232 34 Q180 38 128 33 Z" fill="none" stroke="#a4532e" strokeWidth="1.6" />
      <path d="M146 22 q0 8 10 8 q10 0 10 -8 Z" fill="#a4532e" />
      <path d="M152 19 q2 -3 0 -6 M158 19 q2 -3 0 -6" stroke="#a4532e" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M180 18 Q184 16 188 18 Q192 24 180 26 M180 24 Q186 20 214 22" stroke="#4e5a52" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M200 28 h18" stroke="#4e5a52" strokeWidth="2" strokeLinecap="round" />
      <path d="M220 19 c-2 -3 -6 -1 -4 2 l4 4 l4 -4 c2 -3 -2 -5 -4 -2 Z" fill="#c05a3a" />
      <path d="M150 7 V12 M210 7 V12" stroke="#2e211c" strokeWidth="1" />

      {/* warm light spilling into the room */}
      <rect x="0" y="0" width="360" height="200" fill={c.url('spill')} />
      <path d="M0 162 H360 V200 H0 Z" fill={c.url('floor')} />
      <path d="M92 162 L40 200 H320 L268 162 Z" fill="#f6c56b" opacity="0.08" />

      {/* the line */}
      <Person x={70} y={194} s={1.55} fill="#2a2024" rim="#e8a33d" rimDx={1} head="hood" />
      <Person x={36} y={196} s={1.62} fill="#241c20" rim="#c98a3a" rimDx={0.8} bulk={1.4} />
      <Person x={8} y={198} s={1.7} fill="#1f191c" head="beanie" />
      <Person x={290} y={196} s={1.58} fill="#2a2024" rim="#e8a33d" rimDx={1} head="cap" flip />
      <Person x={326} y={198} s={1.66} fill="#211a1e" rim="#a8702e" rimDx={-0.7} bulk={1} />
      <Person x={106} y={188} s={1.42} fill="#2e2226" rim="#f6c56b" rimDx={1.1} bulk={0.6} />
      {/* tray in the front person's hands */}
      <rect x="112" y="150" width="14" height="3" rx="1" fill="#c9b08a" />

      <Finish c={c} vignette={0.8} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Dog: a stray in a puddle-lit alley                               */
/* ------------------------------------------------------------------ */

function Dog({ c }: { c: Ctx }) {
  const fur = '#a07a52';
  const furDark = '#6e5238';
  return (
    <>
      <defs>
        <linearGradient id={c.id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f2430" />
          <stop offset="1" stopColor="#3a3a44" />
        </linearGradient>
        <radialGradient id={c.id('lamp')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.95" />
          <stop offset="0.25" stopColor="#e8a33d" stopOpacity="0.45" />
          <stop offset="1" stopColor="#e8a33d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={c.id('wallL')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a2e24" />
          <stop offset="1" stopColor="#7a4630" />
        </linearGradient>
        <linearGradient id={c.id('wallR')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a5260" />
          <stop offset="1" stopColor="#262b34" />
        </linearGradient>
        <linearGradient id={c.id('ground')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4d4843" />
          <stop offset="1" stopColor="#24211f" />
        </linearGradient>
        <radialGradient id={c.id('puddle')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f6c56b" stopOpacity="0.85" />
          <stop offset="0.6" stopColor="#b8804a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#3d4650" stopOpacity="0.3" />
        </radialGradient>
        <TextureDefs c={c} />
      </defs>

      <rect width="360" height="200" fill={c.url('sky')} />
      {/* far end of the alley */}
      <rect x="140" y="40" width="80" height="90" fill="#2e3038" />
      <rect x="166" y="78" width="26" height="46" fill="#e8a33d" opacity="0.9" />
      <rect x="170" y="82" width="18" height="42" fill="#f6c56b" />
      <circle cx="180" cy="70" r="70" fill={c.url('lamp')} />
      <rect x="175" y="66" width="10" height="4" rx="1" fill="#2a2622" />
      <circle cx="180" cy="71.5" r="2.4" fill="#fff0c6" />

      {/* left brick wall in perspective */}
      <path d="M0 0 H140 V130 L0 180 Z" fill={c.url('wallL')} />
      <g stroke="#3a2420" strokeWidth="0.8" opacity="0.7">
        <path d="M0 30 L140 46 M0 60 L140 68 M0 90 L140 90 M0 120 L140 112 M0 150 L140 124" />
        <path d="M30 34 V63 M70 70 V92 M100 42 V69 M50 93 V122 M110 91 V114 M20 124 V152" />
      </g>
      {/* fire escape */}
      <g stroke="#1c1a18" strokeWidth="2" fill="none">
        <path d="M20 40 L110 50 M20 58 L110 64 M30 41 V58 M60 44 V61 M90 47 V63" />
        <path d="M40 58 L80 20" strokeWidth="1.4" />
      </g>
      {/* right wall */}
      <path d="M220 40 L360 0 V200 L220 130 Z" fill={c.url('wallR')} />
      <path d="M232 60 L262 52 V84 L232 88 Z" fill="#e8a33d" opacity="0.55" />
      <path d="M234 62 L260 55 V82 L234 86 Z" fill="#f6c56b" opacity="0.4" />
      <path d="M300 30 L330 22 V60 L300 64 Z" fill="#1c1e24" />
      <path d="M220 130 L360 200" stroke="#1c1a18" strokeWidth="1" />
      {/* pipe */}
      <path d="M340 0 V180" stroke="#2a2e36" strokeWidth="4" />

      {/* ground */}
      <path d="M0 180 L140 130 H220 L360 200 H0 Z" fill={c.url('ground')} />
      <ellipse cx="182" cy="150" rx="40" ry="6" fill={c.url('puddle')} />
      <ellipse cx="90" cy="184" rx="52" ry="8" fill={c.url('puddle')} opacity="0.8" />
      <ellipse cx="290" cy="178" rx="36" ry="5" fill={c.url('puddle')} opacity="0.6" />
      <path d="M170 146 v10 M178 146 v12 M186 146 v10" stroke="#ffe3a0" strokeWidth="1.2" opacity="0.6" />
      <g stroke="#8a847a" strokeWidth="0.6" opacity="0.5" fill="none">
        <ellipse cx="96" cy="184" rx="14" ry="2.2" />
        <ellipse cx="284" cy="178" rx="8" ry="1.4" />
      </g>

      {/* trash can and bags */}
      <path d="M244 118 h24 l-2 34 h-20 Z" fill="#3d4650" />
      <rect x="242" y="115" width="28" height="4" rx="1.5" fill="#5a6470" />
      <path d="M246 126 h20 M246 138 h20" stroke="#2c333b" strokeWidth="1" />
      <path d="M270 154 q-2 -14 8 -16 q10 2 8 16 Z" fill="#1c1e24" />

      {/* the dog: sitting, head tilted up toward the light */}
      <g transform="translate(168 184) scale(1.25)">
        <ellipse cx="0" cy="1" rx="30" ry="3" fill="#000" opacity="0.35" />
        {/* tail */}
        <path d="M-18 -2 Q-32 0 -34 -8 Q-30 -4 -18 -6 Z" fill={furDark} />
        {/* body */}
        <path
          d="M-22 0 Q-27 -16 -16 -28 Q-8 -37 3 -40 L10 -40 L12.5 -37 L10.5 -35 L13.5 -31 L11 -29 L14 -25 L11.5 -22 L13 -18 L12 0 Z"
          fill={fur}
        />
        {/* haunch */}
        <path d="M-20 0 Q-24 -14 -12 -20 Q-2 -22 -2 -10 Q-2 -2 -6 0 Z" fill={furDark} opacity="0.55" />
        <path d="M-18 -26 l-3 -2 M-12 -32 l-2 -3 M-5 -36 l-1 -3" stroke={furDark} strokeWidth="1.2" />
        {/* front legs */}
        <rect x="3" y="-22" width="4.6" height="22" rx="2" fill={fur} />
        <rect x="8.6" y="-22" width="4.6" height="22" rx="2" fill="#b38a60" />
        <ellipse cx="5.6" cy="-0.4" rx="3.6" ry="1.8" fill="#c9a476" />
        <ellipse cx="11.4" cy="-0.4" rx="3.6" ry="1.8" fill="#d8b688" />
        {/* chest bib */}
        <path d="M6 -38 L10 -36 L8.5 -32 L11 -29 L8.5 -26 L10.5 -22 L4 -22 Q2 -30 6 -38 Z" fill="#d8b688" />
        {/* head */}
        <g transform="rotate(-18 6 -46)">
          <path d="M-4 -46 Q-4 -58 6 -58 Q14 -58 15 -52 L25 -50 Q28 -48 26 -45 L17 -42 Q12 -38 4 -39 L1 -38 L2 -41 L-2 -41 L0 -43 Z" fill={fur} />
          <path d="M15 -52 L25 -50 Q28 -48 26 -45 L17 -43 Z" fill="#c9a476" />
          <ellipse cx="26" cy="-48.6" rx="2.3" ry="1.9" fill="#1c1a18" />
          {/* ear */}
          <path d="M0 -55 Q-8 -54 -7 -44 Q-5 -40 -2 -43 Q0 -48 3 -52 Z" fill={furDark} />
          {/* scruffy brow tufts */}
          <path d="M6 -58 l1 -3 l2 2.4 l1.4 -2.8 l1.4 3" fill={fur} />
          {/* eye with catchlight, brow lifted hopefully */}
          <circle cx="12" cy="-51.5" r="2" fill="#1c1a18" />
          <circle cx="12.7" cy="-52.2" r="0.7" fill="#fff4dc" />
          <path d="M9.5 -55.4 Q12 -57 14.5 -55" stroke={furDark} strokeWidth="1" fill="none" strokeLinecap="round" />
          <path d="M18 -43.5 q3 0.8 5 -0.5" stroke="#6e5238" strokeWidth="0.8" fill="none" />
        </g>
        {/* rim of lamplight along the back */}
        <path d="M-22 -2 Q-27 -16 -16 -28 Q-8 -37 3 -40" stroke="#f6c56b" strokeWidth="0.9" fill="none" opacity="0.7" />
      </g>

      <Finish c={c} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Papers: forms, stamp, ID card under fluorescent light            */
/* ------------------------------------------------------------------ */

function Papers({ c }: { c: Ctx }) {
  const line = (x: number, y: number, w: number, k: string) => (
    <rect key={k} x={x} y={y} width={w} height="1.6" rx="0.8" fill="#9aa0a6" />
  );
  return (
    <>
      <defs>
        <linearGradient id={c.id('wall')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d0bc" />
          <stop offset="1" stopColor="#8e9884" />
        </linearGradient>
        <linearGradient id={c.id('desk')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7c6a54" />
          <stop offset="1" stopColor="#4e4234" />
        </linearGradient>
        <linearGradient id={c.id('tube')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4fbef" stopOpacity="0.8" />
          <stop offset="1" stopColor="#f4fbef" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={c.id('paper')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbf6ea" />
          <stop offset="1" stopColor="#e2dccd" />
        </linearGradient>
        <TextureDefs c={c} />
      </defs>

      <rect width="360" height="200" fill={c.url('wall')} />
      {/* fluorescent fixture and its wash */}
      <path d="M90 14 H270 L360 110 H0 Z" fill={c.url('tube')} />
      <rect x="86" y="6" width="188" height="10" rx="2" fill="#6b6f68" />
      <rect x="92" y="10" width="176" height="5" rx="2.5" fill="#f4fbef" />
      <line x1="140" y1="0" x2="140" y2="6" stroke="#4a4e48" strokeWidth="1.2" />
      <line x1="220" y1="0" x2="220" y2="6" stroke="#4a4e48" strokeWidth="1.2" />
      {/* wall clock and a notice board */}
      <circle cx="42" cy="44" r="15" fill="#f3efe4" stroke="#3d4650" strokeWidth="2.4" />
      <path d="M42 44 V35 M42 44 L48 47" stroke="#2a2622" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="282" y="30" width="58" height="42" fill="#b89a6e" />
      <rect x="288" y="35" width="18" height="22" fill="#f3efe4" transform="rotate(-4 297 46)" />
      <rect x="312" y="37" width="22" height="16" fill="#f0d98a" />
      <circle cx="297" cy="36" r="1.5" fill="#a4532e" />
      <circle cx="323" cy="38" r="1.5" fill="#3d4650" />
      <rect x="310" y="56" width="16" height="12" fill="#e8ebe4" transform="rotate(5 318 62)" />

      {/* desk */}
      <path d="M0 96 H360 V200 H0 Z" fill={c.url('desk')} />
      <rect y="94" width="360" height="4" fill="#9a8468" />

      {/* stack of forms */}
      <g transform="rotate(-6 110 140)">
        <rect x="64" y="108" width="86" height="72" fill="#d8d2c2" />
        <rect x="60" y="104" width="86" height="72" fill="#e8e2d2" />
      </g>
      <g transform="rotate(-2 120 140)">
        <rect x="70" y="100" width="92" height="84" fill={c.url('paper')} />
        <rect x="78" y="108" width="40" height="3" fill="#3d4650" />
        {line(78, 118, 70, 'a')}
        {line(78, 124, 62, 'b')}
        {line(78, 130, 72, 'c')}
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x="78" y={140 + i * 9} width="5" height="5" fill="none" stroke="#3d4650" strokeWidth="0.9" />
            {line(88, 142 + i * 9, 40 - i * 6, `l${i}`)}
          </g>
        ))}
        <path d="M79 141.5 l1.6 2 l3 -4" stroke="#2f4a7a" strokeWidth="1.1" fill="none" />
        <path d="M79 150.5 l1.6 2 l3 -4" stroke="#2f4a7a" strokeWidth="1.1" fill="none" />
        {line(78, 172, 36, 'sig')}
        {/* red stamp impression */}
        <g transform="rotate(-14 136 162)" opacity="0.85">
          <ellipse cx="136" cy="162" rx="15" ry="9" fill="none" stroke="#b8402e" strokeWidth="1.6" />
          <rect x="126" y="160.5" width="20" height="3" fill="#b8402e" />
        </g>
        {/* signature scribble */}
        <path d="M80 170 q4 -6 7 0 t7 0 q3 -5 6 -1 q4 2 10 -2" stroke="#2f4a7a" strokeWidth="1" fill="none" />
      </g>

      {/* rubber stamp */}
      <g transform="translate(212 140)">
        <ellipse cx="0" cy="24" rx="20" ry="5" fill="#000" opacity="0.25" />
        <rect x="-16" y="12" width="32" height="10" rx="2" fill="#3d2a22" />
        <rect x="-15" y="21" width="30" height="3" rx="1" fill="#8a2e22" />
        <path d="M-4 12 L-5 -2 H5 L4 12 Z" fill="#7a4630" />
        <ellipse cx="0" cy="-6" rx="9" ry="7" fill="#a4532e" />
        <ellipse cx="-2.5" cy="-8.5" rx="3" ry="2" fill="#d08a5a" opacity="0.7" />
      </g>
      {/* ink pad */}
      <rect x="236" y="162" width="38" height="18" rx="2" fill="#2c333b" />
      <rect x="240" y="165" width="30" height="12" rx="1" fill="#6e2a22" />

      {/* ID card */}
      <g transform="rotate(8 300 130)">
        <rect x="272" y="112" width="58" height="36" rx="4" fill="#f3efe4" />
        <rect x="272" y="112" width="58" height="8" rx="3" fill="#3d6a78" />
        <rect x="277" y="124" width="17" height="19" rx="1.5" fill="#e8a33d" />
        <circle cx="285.5" cy="131" r="3.6" fill="#4a3a34" />
        <path d="M279 143 q6.5 -9 13 0 Z" fill="#4a3a34" />
        <rect x="298" y="126" width="26" height="2" rx="1" fill="#6b6f68" />
        <rect x="298" y="132" width="20" height="2" rx="1" fill="#9aa0a6" />
        <rect x="298" y="138" width="24" height="2" rx="1" fill="#9aa0a6" />
      </g>

      {/* pen */}
      <g transform="rotate(-32 180 180)">
        <rect x="150" y="178" width="58" height="5" rx="2.5" fill="#2f4a7a" />
        <path d="M208 178 L218 180.5 L208 183 Z" fill="#c9c2b2" />
        <rect x="156" y="176.6" width="18" height="1.8" rx="0.9" fill="#c9c2b2" />
      </g>
      {/* paper clip + number ticket */}
      <path d="M176 108 v14 q0 4 4 4 t4 -4 v-12 q0 -3 -2.5 -3 t-2.5 3 v10" stroke="#9aa0a6" strokeWidth="1.2" fill="none" />
      <rect x="300" y="168" width="22" height="14" fill="#f0d98a" transform="rotate(-10 311 175)" />
      <rect x="304" y="172" width="12" height="3" fill="#a4532e" transform="rotate(-10 311 175)" />

      <Finish c={c} vignette={0.7} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Labor: lumber yard gate at 5am                                  */
/* ------------------------------------------------------------------ */

function Labor({ c }: { c: Ctx }) {
  return (
    <>
      <defs>
        <linearGradient id={c.id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141a28" />
          <stop offset="0.6" stopColor="#27344a" />
          <stop offset="1" stopColor="#4f5d6a" />
        </linearGradient>
        <radialGradient id={c.id('flood')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.9" />
          <stop offset="0.3" stopColor="#e8a33d" stopOpacity="0.3" />
          <stop offset="1" stopColor="#e8a33d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={c.id('beam')} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#fff1c9" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fff1c9" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={c.id('ground')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a3a40" />
          <stop offset="1" stopColor="#1c1a1c" />
        </linearGradient>
        <pattern id={c.id('fence')} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0 H6 M0 0 V6" stroke="#8a8c90" strokeWidth="0.6" fill="none" />
        </pattern>
        <TextureDefs c={c} />
      </defs>

      <rect width="360" height="200" fill={c.url('sky')} />
      {/* last stars */}
      <g fill="#dfe6f0">
        <circle cx="40" cy="18" r="0.8" />
        <circle cx="120" cy="12" r="0.6" />
        <circle cx="200" cy="24" r="0.7" />
        <circle cx="310" cy="14" r="0.9" />
        <circle cx="260" cy="36" r="0.5" />
      </g>

      {/* lumber stacks behind the fence */}
      <g>
        <rect x="20" y="86" width="90" height="46" fill="#8a6a44" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x="20" y={86 + i * 9.4} width="90" height="1.4" fill="#5a4430" />
        ))}
        <rect x="126" y="70" width="70" height="62" fill="#9c7a50" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x="126" y={70 + i * 9} width="70" height="1.4" fill="#5a4430" />
        ))}
        <rect x="126" y="70" width="70" height="4" fill="#c9a476" />
        <rect x="20" y="86" width="90" height="3.5" fill="#b38a60" />
        <rect x="210" y="94" width="60" height="38" fill="#7a5c3e" />
        <rect x="210" y="94" width="60" height="3" fill="#a07a52" />
        {/* shed + crane arm */}
        <path d="M280 80 L320 66 L360 80 V132 H280 Z" fill="#2c333b" />
        <rect x="296" y="98" width="14" height="10" fill="#e8a33d" opacity="0.7" />
        <path d="M60 86 V34 L130 30" stroke="#2a2e36" strokeWidth="3" fill="none" />
        <path d="M110 31 V56" stroke="#2a2e36" strokeWidth="1" />
      </g>

      {/* floodlight pole */}
      <circle cx="244" cy="40" r="60" fill={c.url('flood')} />
      <rect x="242" y="40" width="3" height="92" fill="#1c1e24" />
      <rect x="236" y="36" width="16" height="6" rx="1" fill="#1c1e24" />
      <rect x="238" y="41" width="12" height="2" fill="#fff0c6" />

      {/* fence and gate */}
      <rect x="0" y="96" width="360" height="40" fill={c.url('fence')} />
      <rect x="0" y="95" width="360" height="2" fill="#6b6f74" />
      <rect x="0" y="134" width="360" height="2" fill="#6b6f74" />
      <g fill="#4a4e54">
        <rect x="96" y="84" width="5" height="54" />
        <rect x="200" y="84" width="5" height="54" />
        <rect x="8" y="92" width="3" height="44" />
        <rect x="300" y="92" width="3" height="44" />
      </g>
      <path d="M101 100 L200 132 M101 132 L200 100" stroke="#6b6f74" strokeWidth="1.4" />
      <path d="M140 84 h26 v10 h-26 Z" fill="#c9a476" />
      <path d="M144 88 h18 M144 91 h12" stroke="#5a4430" strokeWidth="1" />
      {/* barbed wire */}
      <path d="M0 90 q6 -3 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0" stroke="#5a5e64" strokeWidth="0.8" fill="none" />

      {/* ground */}
      <rect y="136" width="360" height="64" fill={c.url('ground')} />
      <path d="M340 150 L0 150 L0 200 H200 Z" fill={c.url('beam')} opacity="0.35" />

      {/* pickup truck with headlights */}
      <g>
        <path d="M280 140 L340 132 L360 132 V178 L280 178 Z" fill={c.url('beam')} opacity="0" />
        <path d="M268 158 L110 142 L110 196 Z" fill={c.url('beam')} opacity="0.55" />
        <path d="M260 152 h24 l10 -18 h60 v40 h-94 Z" fill="#6e3a24" />
        <path d="M296 136 h24 v14 h-30 Z" fill="#2c333b" />
        <path d="M324 136 h26 v14 h-26 Z" fill="#2c333b" />
        <rect x="258" y="152" width="102" height="4" fill="#8a4a2a" />
        <rect x="258" y="170" width="102" height="6" fill="#3a2420" />
        <circle cx="280" cy="178" r="9" fill="#1c1a18" />
        <circle cx="280" cy="178" r="3.4" fill="#5c5750" />
        <circle cx="338" cy="178" r="9" fill="#1c1a18" />
        <circle cx="338" cy="178" r="3.4" fill="#5c5750" />
        <ellipse cx="262" cy="160" rx="3.5" ry="3" fill="#fff6d8" />
        <circle cx="262" cy="160" r="9" fill={c.url('flood')} />
        <rect x="256" y="164" width="6" height="3" fill="#2a2622" />
      </g>

      {/* the crowd, waiting: loose clusters, nearer figures larger */}
      <Person x={112} y={170} s={1.08} fill="#232633" rim="#fff1c9" rimDx={0.8} head="beanie" />
      <Person x={60} y={172} s={1.1} fill="#222432" rim="#fff1c9" rimDx={0.8} head="hood" />
      <Person x={176} y={172} s={1.12} fill="#20222e" rim="#fff1c9" rimDx={0.8} head="cap" />
      <Person x={78} y={180} s={1.22} fill="#1c1e28" rim="#fff1c9" rimDx={0.9} head="none" bulk={0.8} />
      <Person x={134} y={182} s={1.26} fill="#1e202a" rim="#fff1c9" rimDx={0.9} head="hood" bulk={1} />
      <Person x={152} y={186} s={1.3} fill="#191b24" rim="#fff1c9" rimDx={1} head="beanie" />
      <Person x={34} y={190} s={1.4} fill="#15161d" head="hood" bulk={0.6} />
      <Person x={206} y={190} s={1.36} fill="#17181f" rim="#fff1c9" rimDx={1} head="cap" bulk={0.4} />
      {/* breath in the cold */}
      <g fill="#dfe6f0" opacity="0.35">
        <ellipse cx="86" cy="130" rx="4" ry="2" />
        <ellipse cx="142" cy="128" rx="3.5" ry="1.8" />
        <ellipse cx="214" cy="132" rx="3" ry="1.6" />
      </g>
      {/* coffee cup */}
      <rect x="141" y="160" width="4" height="5" rx="0.6" fill="#f3e3c3" />

      <Finish c={c} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Bank: small credit-union counter                                 */
/* ------------------------------------------------------------------ */

function Bank({ c }: { c: Ctx }) {
  return (
    <>
      <defs>
        <linearGradient id={c.id('wall')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2cfa8" />
          <stop offset="1" stopColor="#c9ae84" />
        </linearGradient>
        <linearGradient id={c.id('window')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe7b8" />
          <stop offset="1" stopColor="#e8b870" />
        </linearGradient>
        <linearGradient id={c.id('glass')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d8ecea" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#d8ecea" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={c.id('counter')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a5e42" />
          <stop offset="1" stopColor="#5a3b2e" />
        </linearGradient>
        <radialGradient id={c.id('sun')} cx="0.2" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff1c9" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff1c9" stopOpacity="0" />
        </radialGradient>
        <TextureDefs c={c} />
      </defs>

      <rect width="360" height="200" fill={c.url('wall')} />
      {/* window with daylight */}
      <rect x="18" y="22" width="70" height="92" rx="2" fill="#6e4a36" />
      <rect x="23" y="27" width="60" height="82" fill={c.url('window')} />
      <path d="M53 27 V109 M23 68 H83" stroke="#6e4a36" strokeWidth="3" />
      <path d="M23 90 q12 -10 22 -4 q10 -12 22 -2 q8 -4 16 2 V109 H23 Z" fill="#9aa37a" opacity="0.7" />
      <path d="M88 30 L180 200 H40 L23 114 Z" fill={c.url('sun')} />

      {/* teller booth back wall */}
      <rect x="112" y="18" width="200" height="104" fill="#b8956a" />
      <rect x="112" y="18" width="200" height="6" fill="#8a6a44" />
      {/* hanging plaque (no text) */}
      <rect x="182" y="30" width="60" height="14" rx="3" fill="#3d6a78" />
      <circle cx="194" cy="37" r="3.6" fill="#f6c56b" />
      <rect x="202" y="35.5" width="32" height="3" rx="1.5" fill="#e8ebe4" />
      {/* teller behind glass */}
      <g>
        <circle cx="212" cy="78" r="11" fill="#5a3b2e" />
        <path d="M202 74 q10 -12 22 -2 q-2 -8 -10 -9 q-10 0 -12 11 Z" fill="#2a2024" />
        <path d="M190 122 Q190 96 212 94 Q234 96 234 122 Z" fill="#3d6a78" />
        <path d="M205 96 L212 106 L219 96 L216 95 L212 100 L208 95 Z" fill="#f3efe4" />
      </g>
      {/* glass partition with mullions and speaking hole */}
      <rect x="120" y="50" width="184" height="72" fill={c.url('glass')} />
      <path d="M120 50 H304 M182 50 V122 M242 50 V122" stroke="#6e4a36" strokeWidth="2.4" />
      <path d="M128 90 L150 54 H158 L136 90 Z M140 104 L170 54 H174 L144 104 Z M252 88 L272 54 H282 L262 88 Z" fill="#fff" opacity="0.2" />
      <path d="M198 116 h28 v6 h-28 Z" fill="#5a3b2e" />

      {/* counter */}
      <rect x="96" y="122" width="232" height="8" rx="1.5" fill="#d9c7a8" />
      <rect x="100" y="130" width="224" height="70" fill={c.url('counter')} />
      <g stroke="#4a3024" strokeWidth="1.2">
        <path d="M150 134 V200 M212 134 V200 M274 134 V200" />
      </g>
      <rect x="100" y="130" width="224" height="3" fill="#3a2822" opacity="0.5" />

      {/* pen on a chain + deposit slips */}
      <rect x="150" y="116" width="26" height="6" fill="#f3efe4" transform="rotate(-6 163 119)" />
      <rect x="146" y="118" width="26" height="4" fill="#e8e2d2" transform="rotate(4 159 120)" />
      <path d="M262 122 q-6 -6 -2 -12" stroke="#9aa0a6" strokeWidth="0.8" fill="none" strokeDasharray="1.2 0.8" />
      <rect x="252" y="108" width="3.4" height="14" rx="1.2" fill="#2f4a7a" transform="rotate(-24 254 115)" />
      <rect x="262" y="119" width="8" height="3" rx="1" fill="#5c5750" />

      {/* potted plant */}
      <g transform="translate(300 122)">
        <path d="M-10 0 L-8 -16 H8 L10 0 Z" fill="#a4532e" transform="translate(0 0) scale(1 -1) translate(0 16)" />
        <rect x="-9" y="-17" width="18" height="3" rx="1" fill="#8a4a2a" />
        <g fill="#6f7d5c">
          <path d="M0 -16 Q-18 -26 -20 -46 Q-4 -40 0 -16 Z" />
          <path d="M0 -16 Q16 -30 22 -50 Q4 -44 0 -16 Z" />
          <path d="M0 -16 Q-4 -40 4 -60 Q10 -38 0 -16 Z" fill="#83926a" />
          <path d="M0 -16 Q-12 -20 -26 -24 Q-14 -32 0 -16 Z" fill="#5a6848" />
          <path d="M0 -16 Q14 -18 26 -28 Q10 -34 0 -16 Z" fill="#83926a" />
        </g>
        <path d="M0 -16 Q-10 -30 -16 -42 M0 -16 Q10 -32 16 -44" stroke="#4e5a3e" strokeWidth="0.7" fill="none" />
      </g>

      {/* queue post and rope */}
      <g>
        <rect x="42" y="142" width="4" height="50" fill="#b38a60" />
        <ellipse cx="44" cy="141" rx="4" ry="3" fill="#d9a441" />
        <ellipse cx="44" cy="194" rx="10" ry="3" fill="#8a6a44" />
        <path d="M46 146 Q70 166 98 150" stroke="#8a2e22" strokeWidth="3" fill="none" />
      </g>
      <rect y="194" width="360" height="6" fill="#4a3024" opacity="0.5" />

      <Finish c={c} vignette={0.6} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Door: the rented room, ajar, golden light, key in the lock       */
/* ------------------------------------------------------------------ */

function Door({ c }: { c: Ctx }) {
  return (
    <>
      <defs>
        <linearGradient id={c.id('hall')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a2224" />
          <stop offset="0.5" stopColor="#6a3a2a" />
          <stop offset="1" stopColor="#3a2224" />
        </linearGradient>
        <radialGradient id={c.id('glow')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff4d0" stopOpacity="0.95" />
          <stop offset="0.25" stopColor="#f6c56b" stopOpacity="0.6" />
          <stop offset="0.6" stopColor="#e8a33d" stopOpacity="0.2" />
          <stop offset="1" stopColor="#e8a33d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={c.id('room')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2c6" />
          <stop offset="0.6" stopColor="#f8cf7a" />
          <stop offset="1" stopColor="#eaa24a" />
        </linearGradient>
        <linearGradient id={c.id('spill')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe3a0" stopOpacity="0.9" />
          <stop offset="1" stopColor="#f6c56b" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id={c.id('doorFace')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3f5a52" />
          <stop offset="1" stopColor="#5f7a66" />
        </linearGradient>
        <linearGradient id={c.id('floor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a3524" />
          <stop offset="1" stopColor="#2e1c18" />
        </linearGradient>
        <pattern id={c.id('paper')} width="14" height="200" patternUnits="userSpaceOnUse">
          <rect width="1.2" height="200" fill="#f6c56b" opacity="0.1" />
          <circle cx="7" cy="10" r="1.2" fill="#f6c56b" opacity="0.12" />
        </pattern>
        <TextureDefs c={c} />
      </defs>

      <rect width="360" height="200" fill={c.url('hall')} />
      <rect width="360" height="160" fill={c.url('paper')} />
      {/* chair rail */}
      <rect y="120" width="360" height="3" fill="#8a4a2a" />
      <rect y="123" width="360" height="37" fill="#4a2a24" opacity="0.5" />

      {/* big warm bloom around the doorway */}
      <circle cx="200" cy="96" r="150" fill={c.url('glow')} />

      {/* door frame */}
      <rect x="146" y="18" width="92" height="144" fill="#2e1c18" />
      <rect x="150" y="22" width="84" height="140" fill="#1c1210" />
      {/* the room beyond: bright, with a window and a bed corner */}
      <rect x="194" y="22" width="40" height="140" fill={c.url('room')} />
      <rect x="208" y="44" width="22" height="34" fill="#fffaf0" />
      <path d="M219 44 V78 M208 61 H230" stroke="#eaa24a" strokeWidth="1.6" />
      <path d="M200 126 H234 V140 H200 Z" fill="#c9734a" />
      <path d="M200 120 H234 V127 H200 Z" fill="#f3e3c3" />
      <rect x="196" y="140" width="38" height="22" fill="#e39a4c" opacity="0.7" />
      {/* light rays from the gap */}
      <g fill="#fff4d0" opacity="0.14">
        <path d="M196 30 L120 200 H160 Z" />
        <path d="M200 60 L60 200 H100 Z" />
        <path d="M232 40 L300 200 H340 Z" />
      </g>

      {/* the door, swung inward, hinged on the left */}
      <path d="M150 22 L196 30 V156 L150 162 Z" fill={c.url('doorFace')} />
      <path d="M156 38 L188 42 V84 L156 82 Z" fill="none" stroke="#2e4a44" strokeWidth="1.6" />
      <path d="M156 94 L188 96 V146 L156 150 Z" fill="none" stroke="#2e4a44" strokeWidth="1.6" />
      <path d="M196 30 V156" stroke="#ffe3a0" strokeWidth="2" />
      <path d="M150 22 V162" stroke="#1c1210" strokeWidth="1.5" />
      {/* knob, lock and key with a tag */}
      <circle cx="190" cy="98" r="3.2" fill="#d9a441" />
      <circle cx="189" cy="97" r="1.1" fill="#fff0c6" />
      <rect x="187.6" y="104" width="4.6" height="7" rx="1.4" fill="#b8862e" />
      <path d="M190 107.5 H182" stroke="#e0c070" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="179.6" cy="107.5" r="3" fill="none" stroke="#e0c070" strokeWidth="1.6" />
      <path d="M178 110 L174 120" stroke="#b8862e" strokeWidth="0.7" />
      <path d="M170 119 L178 119 L179 127 L171 128 Z" fill="#f3e3c3" />
      <circle cx="174.6" cy="121" r="0.9" fill="#b8862e" />

      {/* hallway floor and the spill of light */}
      <path d="M0 160 H360 V200 H0 Z" fill={c.url('floor')} />
      <g stroke="#3a2220" strokeWidth="0.8" opacity="0.8">
        <path d="M0 170 H360 M0 182 H360 M0 194 H360" />
      </g>
      <path d="M196 160 L234 160 L300 200 L110 200 Z" fill={c.url('spill')} />
      <path d="M150 162 L196 156 L196 160 Z" fill="#1c1210" />
      {/* doormat */}
      <path d="M170 166 L250 166 L262 180 L160 180 Z" fill="#a4532e" opacity="0.85" />
      <path d="M174 170 L248 170 M168 175 L254 175" stroke="#d98a5a" strokeWidth="1" opacity="0.8" />

      {/* wall sconce on the left */}
      <circle cx="70" cy="70" r="30" fill={c.url('glow')} opacity="0.7" />
      <path d="M64 64 h12 l-2 10 h-8 Z" fill="#f6c56b" />
      <rect x="68" y="74" width="4" height="6" fill="#8a4a2a" />
      {/* a little framed picture on the right wall */}
      <rect x="276" y="56" width="34" height="26" fill="#8a4a2a" />
      <rect x="280" y="60" width="26" height="18" fill="#f0c986" />
      <path d="M280 78 L290 68 L296 74 L300 70 L306 78 Z" fill="#a4532e" />
      {/* dust motes in the light */}
      <g fill="#fff4d0">
        <circle cx="206" cy="150" r="0.9" opacity="0.8" />
        <circle cx="222" cy="136" r="0.7" opacity="0.6" />
        <circle cx="240" cy="176" r="0.8" opacity="0.7" />
        <circle cx="180" cy="186" r="0.7" opacity="0.5" />
        <circle cx="250" cy="120" r="0.6" opacity="0.5" />
      </g>

      <Finish c={c} vignette={0.9} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 8. City: Port Ellery at dusk                                        */
/* ------------------------------------------------------------------ */

const CITY_TOWERS: Array<[number, number, number]> = [
  // x, width, top y
  [116, 16, 70],
  [134, 12, 88],
  [148, 20, 52],
  [170, 14, 76],
  [186, 22, 40],
  [210, 14, 64],
  [226, 18, 82],
  [246, 12, 96],
];

function City({ c }: { c: Ctx }) {
  const win = rng(42);
  return (
    <>
      <defs>
        <linearGradient id={c.id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2640" />
          <stop offset="0.35" stopColor="#5e3f58" />
          <stop offset="0.62" stopColor="#b8604a" />
          <stop offset="0.8" stopColor="#eca25a" />
        </linearGradient>
        <radialGradient id={c.id('sun')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={c.id('river')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8785a" />
          <stop offset="0.4" stopColor="#6a4a5a" />
          <stop offset="1" stopColor="#262a3a" />
        </linearGradient>
        <TextureDefs c={c} />
      </defs>

      <rect width="360" height="200" fill={c.url('sky')} />
      <circle cx="300" cy="128" r="80" fill={c.url('sun')} />
      <g fill="#f3e3c3" opacity="0.8">
        <circle cx="30" cy="16" r="0.9" />
        <circle cx="80" cy="30" r="0.6" />
        <circle cx="160" cy="12" r="0.7" />
        <circle cx="268" cy="22" r="0.8" />
        <circle cx="336" cy="40" r="0.6" />
      </g>

      {/* hills */}
      <path d="M0 110 Q50 78 110 96 Q160 70 230 92 Q290 74 360 98 V140 H0 Z" fill="#5a4a6a" />
      <path d="M0 122 Q70 100 140 116 Q220 98 300 114 Q330 108 360 114 V140 H0 Z" fill="#473d58" />
      {/* hilltop houses (the Heights) */}
      <g fill="#f6c56b">
        <circle cx="96" cy="95" r="0.9" />
        <circle cx="104" cy="97" r="0.9" />
        <circle cx="286" cy="80" r="0.9" />
        <circle cx="294" cy="82" r="0.9" />
        <circle cx="302" cy="84" r="0.9" />
      </g>

      {/* downtown towers */}
      {CITY_TOWERS.map(([x, w, top], i) => (
        <g key={i}>
          <rect x={x} y={top} width={w} height={140 - top} fill={i % 2 ? '#2e2a3c' : '#363044'} />
          <rect x={x + w - 3} y={top} width="3" height={140 - top} fill="#1c1a28" opacity="0.5" />
          {Array.from({ length: Math.floor((140 - top - 6) / 7) }).map((_, r) =>
            [0, 1].map((col) =>
              win() > 0.55 ? (
                <rect
                  key={`${r}-${col}`}
                  x={x + 3 + col * (w / 2 - 1)}
                  y={top + 5 + r * 7}
                  width="2.4"
                  height="2.6"
                  fill="#f6c56b"
                  opacity={0.6 + win() * 0.4}
                />
              ) : null,
            ),
          )}
        </g>
      ))}
      {/* spire + antenna */}
      <path d="M197 40 L197 22" stroke="#363044" strokeWidth="1.6" />
      <circle cx="197" cy="21" r="1.3" fill="#e0503a" />
      <path d="M148 52 L158 42 L168 52 Z" fill="#363044" />

      {/* warehouses, right bank */}
      <path d="M262 140 V116 L272 108 V116 L282 108 V116 L292 108 V116 L302 108 V116 L312 108 V140 Z" fill="#6e3a24" />
      <path d="M312 140 V112 H348 V140 Z" fill="#5a3020" />
      <rect x="316" y="118" width="28" height="4" fill="#3a2020" />
      <g fill="#f6c56b" opacity="0.8">
        <rect x="268" y="124" width="4" height="3" />
        <rect x="288" y="124" width="4" height="3" />
        <rect x="326" y="128" width="4" height="3" />
      </g>
      {/* water tower */}
      <path d="M330 112 V96 M344 112 V96" stroke="#3a2020" strokeWidth="1.2" />
      <path d="M328 96 h18 v-10 l-9 -5 l-9 5 Z" fill="#5a3020" />
      {/* smokestack */}
      <rect x="352" y="84" width="6" height="28" fill="#4a2a20" />
      <path d="M355 82 q6 -8 2 -16 q-4 -6 3 -12" stroke="#b8a0a0" strokeWidth="2.4" fill="none" opacity="0.35" />

      {/* left bank low buildings */}
      <path d="M0 140 V118 H20 V110 H36 V122 H56 V114 H72 V126 H92 V140 Z" fill="#3a3044" />

      {/* river */}
      <rect y="138" width="360" height="62" fill={c.url('river')} />
      <g fill="#ffd98a">
        <rect x="270" y="146" width="40" height="1.4" opacity="0.7" />
        <rect x="280" y="152" width="30" height="1.2" opacity="0.55" />
        <rect x="262" y="160" width="44" height="1.2" opacity="0.4" />
        <rect x="186" y="150" width="3" height="10" opacity="0.35" />
        <rect x="152" y="148" width="3" height="8" opacity="0.3" />
      </g>

      {/* the bridge: truss spans on piers */}
      <g>
        <rect x="0" y="128" width="130" height="5" fill="#1c1a24" />
        <path d="M6 128 L22 112 L38 128 L54 112 L70 128 L86 112 L102 128 L118 112 L130 124" stroke="#1c1a24" strokeWidth="2" fill="none" />
        <path d="M22 112 H118" stroke="#1c1a24" strokeWidth="2" />
        <rect x="26" y="133" width="7" height="20" fill="#241f2c" />
        <rect x="90" y="133" width="7" height="20" fill="#241f2c" />
        <g fill="#ffd98a">
          <circle cx="14" cy="126" r="1" />
          <circle cx="46" cy="126" r="1" />
          <circle cx="78" cy="126" r="1" />
          <circle cx="110" cy="126" r="1" />
        </g>
        <path d="M22 153 v12 M29 153 v18 M93 153 v14" stroke="#ffd98a" strokeWidth="1" opacity="0.3" />
      </g>

      {/* foreground pier with a small figure watching */}
      <path d="M0 184 L150 178 L160 200 H0 Z" fill="#1f1c26" />
      <Person x={118} y={180} s={0.8} fill="#15131b" rim="#e8a33d" rimDx={0.8} />
      <path d="M40 180 V166 M36 166 h8" stroke="#15131b" strokeWidth="1.6" />
      <circle cx="40" cy="165" r="6" fill={c.url('sun')} />

      <Finish c={c} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 9. Candle: quiet, respectful                                        */
/* ------------------------------------------------------------------ */

function Candle({ c }: { c: Ctx }) {
  return (
    <>
      <defs>
        <radialGradient id={c.id('halo')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f6c56b" stopOpacity="0.5" />
          <stop offset="0.35" stopColor="#b8702e" stopOpacity="0.18" />
          <stop offset="1" stopColor="#1c1512" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={c.id('flame')} cx="0.5" cy="0.7" r="0.6">
          <stop offset="0" stopColor="#fffbe8" />
          <stop offset="0.4" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#e8903a" />
        </radialGradient>
        <linearGradient id={c.id('wax')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a8927a" />
          <stop offset="0.35" stopColor="#f3e3c3" />
          <stop offset="0.7" stopColor="#d8c4a0" />
          <stop offset="1" stopColor="#7a6650" />
        </linearGradient>
        <radialGradient id={c.id('pool')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f6c56b" stopOpacity="0.16" />
          <stop offset="1" stopColor="#f6c56b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={c.id('table')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1f1a" />
          <stop offset="1" stopColor="#120e0c" />
        </linearGradient>
        <TextureDefs c={c} />
      </defs>

      <rect width="360" height="200" fill="#110e0e" />
      <circle cx="180" cy="92" r="130" fill={c.url('halo')} />
      <circle cx="180" cy="76" r="34" fill={c.url('halo')} />

      {/* tabletop */}
      <path d="M0 132 H360 V200 H0 Z" fill={c.url('table')} />
      <path d="M0 132 H360" stroke="#f6c56b" strokeWidth="0.8" opacity="0.12" />
      <ellipse cx="180" cy="152" rx="120" ry="22" fill={c.url('pool')} />

      {/* holder */}
      <ellipse cx="180" cy="152" rx="30" ry="6" fill="#3a2a22" />
      <ellipse cx="180" cy="150" rx="30" ry="6" fill="#6e4a36" />
      <ellipse cx="180" cy="149" rx="22" ry="4" fill="#4a3024" />
      <ellipse cx="172" cy="148" rx="10" ry="1.6" fill="#d9a441" opacity="0.35" />

      {/* candle */}
      <rect x="170" y="94" width="20" height="56" fill={c.url('wax')} />
      <ellipse cx="180" cy="150" rx="10" ry="2.4" fill="#8a7460" />
      <ellipse cx="180" cy="94" rx="10" ry="2.6" fill="#f8ecd2" />
      <path d="M172 94 q0 7 2 10 q2 -3 1.6 -9 Z" fill="#f3e3c3" />
      <path d="M185 94 q1 12 2.4 15 q1.6 -3 1 -15 Z" fill="#e8d6b4" />
      <ellipse cx="180" cy="94.4" rx="4" ry="1" fill="#e0c89a" />

      {/* wick + flame */}
      <path d="M180 94 q0.6 -3 -0.4 -6" stroke="#2a1f1a" strokeWidth="1.1" fill="none" />
      <path d="M180 60 Q187 76 185 84 Q183 90 180 90 Q177 90 175 84 Q173 76 180 60 Z" fill={c.url('flame')} />
      <path d="M180 76 Q182.6 83 181.6 86.6 Q180.8 88.4 180 88.4 Q179.2 88.4 178.4 86.6 Q177.4 83 180 76 Z" fill="#5a80a8" opacity="0.4" />
      <ellipse cx="180" cy="80" rx="2" ry="4" fill="#fffef4" opacity="0.9" />

      {/* thread of smoke */}
      <path d="M181 56 q-5 -10 1 -18 q6 -8 -1 -18 q-4 -6 1 -12" stroke="#a89888" strokeWidth="0.9" fill="none" opacity="0.2" />

      {/* reflection in the table */}
      <ellipse cx="180" cy="164" rx="16" ry="2.4" fill="#f6c56b" opacity="0.1" />

      <Finish c={c} vignette={1} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 10. Library: tall windows, shelves, a reader                        */
/* ------------------------------------------------------------------ */

const BOOK_COLORS = ['#a4532e', '#3d6a78', '#6f7d5c', '#d9a441', '#6e3a24', '#4a3a48', '#8a6a44', '#c9b08a'];

function Shelf({ x, y, w, seed }: { x: number; y: number; w: number; seed: number }) {
  const r = rng(seed);
  const books: ReactElement[] = [];
  let cx = x + 1;
  let i = 0;
  while (cx < x + w - 3) {
    const bw = 2.4 + r() * 2.6;
    const bh = 10 + r() * 5;
    books.push(
      <rect
        key={i++}
        x={cx}
        y={y - bh}
        width={Math.min(bw, x + w - 1 - cx)}
        height={bh}
        fill={BOOK_COLORS[Math.floor(r() * BOOK_COLORS.length)]}
      />,
    );
    cx += bw + 0.4;
  }
  return (
    <g>
      {books}
      <rect x={x} y={y} width={w} height="2.4" fill="#4a3024" />
    </g>
  );
}

function Library({ c }: { c: Ctx }) {
  return (
    <>
      <defs>
        <linearGradient id={c.id('wall')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6a4a38" />
          <stop offset="1" stopColor="#4a3228" />
        </linearGradient>
        <linearGradient id={c.id('window')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2c6" />
          <stop offset="1" stopColor="#f2b86a" />
        </linearGradient>
        <linearGradient id={c.id('shaft')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe3a0" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffe3a0" stopOpacity="0.02" />
        </linearGradient>
        <radialGradient id={c.id('lamp')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={c.id('floor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a3b2e" />
          <stop offset="1" stopColor="#2e1f1a" />
        </linearGradient>
        <TextureDefs c={c} />
      </defs>

      <rect width="360" height="200" fill={c.url('wall')} />
      {/* tall arched windows */}
      {[110, 162, 214].map((x) => (
        <g key={x}>
          <path d={`M${x} 110 V36 Q${x} 16 ${x + 18} 16 Q${x + 36} 16 ${x + 36} 36 V110 Z`} fill="#3a2822" />
          <path d={`M${x + 3} 107 V37 Q${x + 3} 19 ${x + 18} 19 Q${x + 33} 19 ${x + 33} 37 V107 Z`} fill={c.url('window')} />
          <path d={`M${x + 18} 19 V107 M${x + 3} 50 H${x + 33} M${x + 3} 78 H${x + 33}`} stroke="#3a2822" strokeWidth="1.6" />
        </g>
      ))}
      {/* shafts of light across to the table */}
      <path d="M113 40 L146 40 L220 160 L150 160 Z" fill={c.url('shaft')} />
      <path d="M165 40 L198 40 L272 160 L202 160 Z" fill={c.url('shaft')} />
      <path d="M217 40 L250 40 L324 160 L254 160 Z" fill={c.url('shaft')} />

      {/* shelves left and right */}
      <rect x="0" y="10" width="96" height="150" fill="#3a2620" />
      <rect x="264" y="10" width="96" height="150" fill="#3a2620" />
      {[40, 70, 100, 130, 158].map((y, i) => (
        <g key={y}>
          <Shelf x={4} y={y} w={88} seed={11 + i} />
          <Shelf x={268} y={y} w={88} seed={31 + i} />
        </g>
      ))}
      <rect x="0" y="10" width="96" height="4" fill="#5a3b2e" />
      <rect x="264" y="10" width="96" height="4" fill="#5a3b2e" />
      <rect x="0" y="10" width="96" height="150" fill={c.url('hatch')} opacity="0.5" />

      {/* floor */}
      <path d="M0 160 H360 V200 H0 Z" fill={c.url('floor')} />

      {/* long table */}
      <path d="M40 150 H320 L336 162 H24 Z" fill="#8a5e42" />
      <rect x="24" y="162" width="312" height="5" fill="#5a3b2e" />
      <rect x="40" y="167" width="6" height="30" fill="#4a3024" />
      <rect x="314" y="167" width="6" height="30" fill="#4a3024" />
      <rect x="176" y="167" width="6" height="30" fill="#4a3024" />

      {/* banker's lamps */}
      {[86, 262].map((x) => (
        <g key={x}>
          <circle cx={x} cy="148" r="30" fill={c.url('lamp')} />
          <rect x={x - 1} y="138" width="2" height="12" fill="#b8862e" />
          <ellipse cx={x} cy="152" rx="6" ry="1.6" fill="#b8862e" />
          <path d={`M${x - 10} 140 Q${x} 130 ${x + 10} 140 Z`} fill="#3f6a52" />
          <rect x={x - 9} y="139.4" width="18" height="1.4" fill="#fff0c6" />
        </g>
      ))}

      {/* stacked books on the table */}
      <rect x="226" y="146" width="22" height="4" fill="#3d6a78" />
      <rect x="228" y="142" width="18" height="4" fill="#a4532e" />
      <rect x="227" y="139" width="20" height="3" fill="#d9a441" />

      {/* the reader, seated, book open */}
      <g>
        <path d="M160 152 V122 Q160 112 170 112 Q180 112 181 122 L184 144 L196 148 V152 Z" fill="#2e2a3a" />
        <circle cx="172" cy="104" r="7" fill="#2e2a3a" />
        <path d="M165 102 Q166 94 173 94 Q180 95 179 103 Q176 99 172 99 Q168 100 165 102 Z" fill="#1c1a24" />
        <path d="M176 126 L192 140" stroke="#2e2a3a" strokeWidth="5" strokeLinecap="round" />
        <path d="M186 146 L196 138 L208 146 Z" fill="#f3e3c3" />
        <path d="M196 138 V146" stroke="#c9b08a" strokeWidth="0.8" />
        <path d="M158 112 Q168 108 176 114" stroke="#ffd98a" strokeWidth="1.2" fill="none" opacity="0.7" />
        <path d="M180 104 Q180 98 177 96" stroke="#ffd98a" strokeWidth="1" fill="none" opacity="0.7" />
        {/* chair */}
        <path d="M152 152 V110 H158 V152 Z" fill="#4a3024" />
        <rect x="150" y="152" width="26" height="4" fill="#4a3024" />
        <rect x="152" y="156" width="3" height="40" fill="#3a2620" />
        <rect x="171" y="156" width="3" height="40" fill="#3a2620" />
      </g>

      {/* motes in the light */}
      <g fill="#fff4d0" opacity="0.6">
        <circle cx="190" cy="70" r="0.8" />
        <circle cx="222" cy="96" r="0.7" />
        <circle cx="246" cy="120" r="0.8" />
        <circle cx="160" cy="60" r="0.6" />
      </g>

      <Finish c={c} vignette={0.8} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 11. Rain: night street, reflections, figure under an awning         */
/* ------------------------------------------------------------------ */

function Rain({ c }: { c: Ctx }) {
  const r = rng(7);
  const drops = Array.from({ length: 70 }, (_, i) => {
    const x = r() * 380 - 10;
    const y = r() * 170;
    const len = 6 + r() * 8;
    return (
      <line key={i} x1={x} y1={y} x2={x - len * 0.28} y2={y + len} opacity={0.25 + r() * 0.35} />
    );
  });
  return (
    <>
      <defs>
        <linearGradient id={c.id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#151a26" />
          <stop offset="1" stopColor="#2c3446" />
        </linearGradient>
        <linearGradient id={c.id('street')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a3040" />
          <stop offset="1" stopColor="#151822" />
        </linearGradient>
        <radialGradient id={c.id('glow')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.8" />
          <stop offset="0.4" stopColor="#e8a33d" stopOpacity="0.25" />
          <stop offset="1" stopColor="#e8a33d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={c.id('shop')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c56b" />
          <stop offset="1" stopColor="#d98a3a" />
        </linearGradient>
        <linearGradient id={c.id('refl')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c56b" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f6c56b" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={c.id('reflTeal')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6fb0b0" stopOpacity="0.45" />
          <stop offset="1" stopColor="#6fb0b0" stopOpacity="0" />
        </linearGradient>
        <TextureDefs c={c} />
      </defs>

      <rect width="360" height="200" fill={c.url('sky')} />
      {/* buildings across the street */}
      <path d="M170 128 V40 H214 V28 H250 V128 Z" fill="#232838" />
      <path d="M250 128 V56 H300 V128 Z" fill="#1e2230" />
      <path d="M300 128 V34 H360 V128 Z" fill="#262b3a" />
      <g fill="#e8a33d">
        <rect x="180" y="52" width="6" height="8" opacity="0.8" />
        <rect x="196" y="68" width="6" height="8" opacity="0.5" />
        <rect x="226" y="44" width="6" height="8" opacity="0.7" />
        <rect x="262" y="70" width="6" height="8" opacity="0.6" />
        <rect x="314" y="48" width="8" height="8" opacity="0.75" />
        <rect x="336" y="76" width="8" height="8" opacity="0.5" />
      </g>
      <rect x="260" y="96" width="30" height="10" rx="2" fill="#4fa0a0" opacity="0.8" />
      <rect x="258" y="94" width="34" height="14" rx="3" fill="#4fa0a0" opacity="0.2" />

      {/* street lamp */}
      <circle cx="226" cy="66" r="44" fill={c.url('glow')} />
      <path d="M232 128 V70 Q232 64 226 64 H220" stroke="#12151e" strokeWidth="2.4" fill="none" />
      <path d="M214 64 h12 l-2 4 h-8 Z" fill="#12151e" />
      <ellipse cx="220" cy="68.4" rx="3.6" ry="1.2" fill="#fff0c6" />

      {/* near building with the shop and awning, left */}
      <rect x="0" y="0" width="150" height="150" fill="#2e2a34" />
      <rect x="0" y="0" width="150" height="150" fill={c.url('hatch')} opacity="0.4" />
      <rect x="14" y="80" width="112" height="62" fill={c.url('shop')} />
      <path d="M70 80 V142" stroke="#8a4a2a" strokeWidth="2" />
      <g fill="#8a4a2a" opacity="0.6">
        <rect x="22" y="112" width="14" height="30" />
        <rect x="40" y="120" width="10" height="22" />
        <circle cx="96" cy="118" r="7" />
        <rect x="84" y="126" width="30" height="16" />
      </g>
      <rect x="10" y="140" width="120" height="4" fill="#3a2a24" />
      <rect x="20" y="18" width="24" height="30" fill="#1c1a24" />
      <rect x="64" y="18" width="24" height="30" fill="#e8a33d" opacity="0.5" />
      <rect x="108" y="18" width="24" height="30" fill="#1c1a24" />
      {/* awning, striped */}
      <path d="M4 62 H146 L156 82 H-6 Z" fill="#a4532e" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path key={i} d={`M${10 + i * 20} 62 H${20 + i * 20} L${22 + i * 22 - i * 0.8} 82 H${10 + i * 22 - i * 0.8} Z`} fill="#e8d6ae" opacity="0.85" />
      ))}
      <path d="M-6 82 H156 V86 H-6 Z" fill="#6e3a24" />
      <g fill="#6e3a24">
        {Array.from({ length: 11 }).map((_, i) => (
          <path key={i} d={`M${-6 + i * 15} 86 q7.5 6 15 0 Z`} />
        ))}
      </g>
      {/* drips from the awning edge */}
      <g stroke="#cfe0ea" strokeWidth="0.9" opacity="0.6">
        <path d="M14 92 v4 M44 94 v5 M74 91 v4 M104 95 v5 M134 92 v4" />
      </g>

      {/* sidewalk + street */}
      <rect x="0" y="146" width="360" height="8" fill="#3d4650" />
      <rect x="0" y="146" width="360" height="1.5" fill="#6a7686" />
      <rect x="0" y="154" width="360" height="46" fill={c.url('street')} />
      {/* reflections */}
      <g fill={c.url('refl')}>
        {[16, 26, 38, 46, 60, 72, 80, 94, 104, 116].map((x, i) => (
          <rect key={x} x={x} y="154" width={i % 3 === 0 ? 7 : 4} height={30 + (i % 4) * 8} rx="2" />
        ))}
        <rect x="218" y="154" width="5" height="44" rx="2" />
        <rect x="224" y="154" width="3" height="30" rx="1.5" />
      </g>
      <g fill={c.url('reflTeal')}>
        <rect x="262" y="154" width="6" height="26" rx="2" />
        <rect x="272" y="154" width="8" height="32" rx="2" />
        <rect x="284" y="154" width="4" height="20" rx="2" />
      </g>
      <g stroke="#ffd98a" strokeWidth="1" opacity="0.5">
        <path d="M30 166 h26 M70 174 h34 M40 184 h20 M214 170 h18 M218 182 h12" />
      </g>
      <g stroke="#9ab0c0" strokeWidth="0.6" fill="none" opacity="0.5">
        <ellipse cx="160" cy="176" rx="10" ry="1.8" />
        <ellipse cx="300" cy="188" rx="14" ry="2.2" />
        <ellipse cx="90" cy="192" rx="8" ry="1.4" />
      </g>
      {/* lane dashes */}
      <g fill="#8a847a" opacity="0.5">
        <rect x="170" y="186" width="20" height="2" />
        <rect x="230" y="186" width="20" height="2" />
        <rect x="290" y="186" width="20" height="2" />
      </g>
      {/* distant taillights */}
      <g fill="#e0503a">
        <circle cx="330" cy="140" r="1.4" />
        <circle cx="342" cy="140" r="1.4" />
      </g>
      <rect x="329" y="142" width="2" height="12" fill="#e0503a" opacity="0.3" />
      <rect x="341" y="142" width="2" height="12" fill="#e0503a" opacity="0.3" />

      {/* figure under the awning, hood up */}
      <Person x={138} y={150} s={1.36} fill="#141620" rim="#f6c56b" rimDx={0.8} head="hood" bulk={0.6} flip />
      {/* the figure's reflection */}
      <g opacity="0.35" transform="translate(0 308) scale(1 -1)">
        <Person x={138} y={154} s={1.36} fill="#0c0e16" head="hood" bulk={0.6} flip />
      </g>

      {/* rain */}
      <g stroke="#b8c8d8" strokeWidth="0.7" strokeLinecap="round">
        {drops}
      </g>

      <Finish c={c} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* 12. Shelter: cots under high windows, blue night light              */
/* ------------------------------------------------------------------ */

function Cot({ x, y, s, sleeper, blanket }: { x: number; y: number; s: number; sleeper: boolean; blanket: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="12" rx="32" ry="3" fill="#000" opacity="0.3" />
      <path d="M-28 12 L-26 2 M28 12 L26 2 M-22 12 L-24 2 M22 12 L24 2" stroke="#5a6470" strokeWidth="1.4" />
      <rect x="-30" y="-2" width="60" height="6" rx="2" fill="#6a7686" />
      <rect x="-28" y="-6" width="12" height="5" rx="2.4" fill="#c8d0dc" />
      {sleeper ? (
        <path d="M-18 0 Q-18 -9 -6 -9 Q6 -12 14 -8 Q26 -6 28 0 Z" fill={blanket} />
      ) : (
        <path d="M4 0 L4 -3 Q16 -5 28 -3 L28 0 Z" fill={blanket} />
      )}
      {sleeper && <circle cx="-21" cy="-6" r="4" fill="#2a3040" />}
    </g>
  );
}

function Shelter({ c }: { c: Ctx }) {
  const windows = [18, 86, 154, 222, 290];
  return (
    <>
      <defs>
        <linearGradient id={c.id('wall')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a2138" />
          <stop offset="1" stopColor="#2c3654" />
        </linearGradient>
        <linearGradient id={c.id('window')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b4cdf0" />
          <stop offset="1" stopColor="#5a78a8" />
        </linearGradient>
        <linearGradient id={c.id('beam')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8c4ec" stopOpacity="0.22" />
          <stop offset="1" stopColor="#a8c4ec" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id={c.id('floor')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a3248" />
          <stop offset="1" stopColor="#12172a" />
        </linearGradient>
        <radialGradient id={c.id('night')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f6c56b" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f6c56b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={c.id('exit')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#4fbf8a" stopOpacity="0.3" />
          <stop offset="1" stopColor="#4fbf8a" stopOpacity="0" />
        </radialGradient>
        <TextureDefs c={c} />
      </defs>

      <rect width="360" height="200" fill={c.url('wall')} />
      {/* high clerestory windows */}
      {windows.map((x) => (
        <g key={x}>
          <rect x={x} y="8" width="52" height="30" fill="#10152a" />
          <rect x={x + 2.5} y="10.5" width="47" height="25" fill={c.url('window')} />
          <path d={`M${x + 18} 10.5 V35.5 M${x + 34} 10.5 V35.5 M${x + 2.5} 23 H${x + 49.5}`} stroke="#10152a" strokeWidth="1.4" />
        </g>
      ))}
      {/* moonlight shafts */}
      {windows.map((x) => (
        <path key={x} d={`M${x + 2} 36 H${x + 50} L${x + 84} 150 H${x + 30} Z`} fill={c.url('beam')} />
      ))}
      {/* wall rail + lockers on the right, a door on the left */}
      <rect x="0" y="92" width="360" height="2" fill="#3a4666" />
      <rect x="14" y="70" width="30" height="56" fill="#141a2c" />
      <rect x="16" y="72" width="26" height="54" fill="#27304a" />
      <circle cx="37" cy="100" r="1.4" fill="#8a9ab8" />
      <rect x="22" y="60" width="14" height="6" rx="1" fill="#4fbf8a" />
      <circle cx="29" cy="63" r="16" fill={c.url('exit')} />
      <g>
        <rect x="196" y="76" width="164" height="50" fill="#1e2638" />
        {Array.from({ length: 9 }).map((_, i) => (
          <g key={i}>
            <rect x={198 + i * 18} y="78" width="16" height="48" fill={i % 4 === 1 ? '#46547a' : '#3e4a68'} />
            <path d={`M${201 + i * 18} 83 h10 M${201 + i * 18} 86 h10`} stroke="#28314a" strokeWidth="0.8" />
            <rect x={210 + i * 18} y="100" width="1.6" height="5" rx="0.8" fill="#8a9ab8" />
          </g>
        ))}
        <path d="M232 78 q4 10 0 20" stroke="#6a5a7a" strokeWidth="2" fill="none" />
      </g>
      {/* a small warm night-light, low on the wall */}
      <circle cx="120" cy="116" r="24" fill={c.url('night')} />
      <rect x="117" y="113" width="6" height="6" rx="1.5" fill="#ffe3a0" />

      {/* floor with moonlight pools */}
      <rect x="0" y="124" width="360" height="76" fill={c.url('floor')} />
      {windows.map((x) => (
        <path key={x} d={`M${x + 34} 150 H${x + 86} L${x + 104} 200 H${x + 44} Z`} fill="#a8c4ec" opacity="0.07" />
      ))}

      {/* three receding rows of cots */}
      {[46, 118, 190, 262, 334].map((x, i) => (
        <Cot key={x} x={x} y={132} s={0.62} sleeper={i !== 2} blanket={['#3e4c6c', '#4c4262', '#3e5a5e', '#3e4c6c', '#4c4c5e'][i]} />
      ))}
      {[20, 112, 204, 296].map((x, i) => (
        <Cot key={x} x={x} y={152} s={0.86} sleeper={i !== 1} blanket={['#4a567a', '#5a4a62', '#6a4a56', '#3e5e66'][i]} />
      ))}
      {[62, 180, 298].map((x, i) => (
        <Cot key={x} x={x} y={182} s={1.3} sleeper={i !== 1} blanket={['#56628a', '#6e7a8a', '#6a4a5a'][i]} />
      ))}
      {/* shoes and a bag beside the empty front cot */}
      <g fill="#10141f">
        <ellipse cx="146" cy="196" rx="4.6" ry="2" />
        <ellipse cx="156" cy="197" rx="4.6" ry="2" />
      </g>
      <path d="M212 198 q-1 -12 9 -12 q9 0 9 12 Z" fill="#3a3048" />
      <path d="M216 188 q5 -6 10 0" stroke="#3a3048" strokeWidth="1.6" fill="none" />

      <Finish c={c} />
    </>
  );
}

/* ------------------------------------------------------------------ */

const RENDERERS: Record<SceneId, (props: { c: Ctx }) => ReactElement> = {
  overpass: Overpass,
  kitchen: Kitchen,
  dog: Dog,
  papers: Papers,
  labor: Labor,
  bank: Bank,
  door: Door,
  city: City,
  candle: Candle,
  library: Library,
  rain: Rain,
  shelter: Shelter,
};

export function Scene({ id, className }: { id: SceneId | string; className?: string }) {
  const sceneId: SceneId = (SCENE_IDS as string[]).includes(id) ? (id as SceneId) : 'city';
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const prefix = `${sceneId}-${reactId}`;
  const c: Ctx = {
    id: (name) => `${prefix}-${name}`,
    url: (name) => `url(#${prefix}-${name})`,
  };
  const Render = RENDERERS[sceneId];
  return (
    <svg
      viewBox="0 0 360 200"
      width="100%"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={LABELS[sceneId]}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <Render c={c} />
    </svg>
  );
}
