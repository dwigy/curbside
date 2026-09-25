import { useId, type KeyboardEvent, type ReactElement } from 'react';
import type { DistrictId } from '../../engine/types';

type Pt = [number, number];

interface DistrictShape {
  id: DistrictId;
  pts: Pt[];
  /** Label anchor. The glyph / marker sits just above it. */
  label: Pt;
  color: string;
}

/** Smooth closed path through the midpoints of a polygon: soft, hand-drawn blobs. */
function blob(pts: Pt[]): string {
  const n = pts.length;
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const f = (v: number) => Math.round(v * 10) / 10;
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${f(m0[0])} ${f(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    d += ` Q${f(p[0])} ${f(p[1])} ${f(m[0])} ${f(m[1])}`;
  }
  return `${d} Z`;
}

const DISTRICTS: DistrictShape[] = [
  {
    id: 'heights',
    pts: [[166, 12], [250, 6], [346, 14], [352, 66], [304, 84], [236, 76], [176, 62]],
    label: [264, 50],
    color: '#b096a6',
  },
  {
    id: 'downtown',
    pts: [[96, 64], [168, 56], [236, 72], [244, 128], [214, 140], [160, 124], [108, 96]],
    label: [174, 106],
    color: '#93a2ae',
  },
  {
    id: 'university',
    pts: [[252, 88], [304, 84], [358, 94], [360, 192], [326, 196], [280, 164], [256, 140]],
    label: [306, 144],
    color: '#a3ad84',
  },
  {
    id: 'oldmill',
    pts: [[2, 74], [44, 82], [84, 118], [112, 146], [108, 196], [60, 214], [2, 204]],
    label: [56, 164],
    color: '#c28a6a',
  },
  {
    id: 'riverfront',
    pts: [[116, 140], [160, 154], [206, 170], [250, 184], [244, 222], [178, 230], [120, 214]],
    label: [182, 204],
    color: '#d6a066',
  },
  {
    id: 'suburbs',
    pts: [[142, 238], [250, 228], [306, 224], [354, 234], [352, 292], [250, 296], [146, 290]],
    label: [250, 274],
    color: '#cfc084',
  },
];

const PATHS: Record<DistrictId, string> = Object.fromEntries(
  DISTRICTS.map((d) => [d.id, blob(d.pts)]),
) as Record<DistrictId, string>;

const RIVER = 'M-12 50 C60 55 90 120 160 140 S280 170 372 252';

const BRIDGES: Array<[Pt, Pt]> = [
  [[110, 97], [90, 130]],
  [[219, 141], [209, 176]],
  [[309, 181], [284, 209]],
];

const INK = 'var(--ink, #2a2622)';
const PAPER = 'var(--paper, #f3e9d2)';
const ACCENT = 'var(--accent, #d9a441)';

/** Tiny ink glyph for each district, centered on (0, 0). */
function Glyph({ id }: { id: DistrictId }): ReactElement {
  switch (id) {
    case 'downtown':
      return <path d="M-9 5 V-3 H-5 V-9 H0 V-1 H3 V-6 H8 V5 Z" />;
    case 'university':
      return <path d="M-9 5 V3 H-7 V-2 H-9 L0 -8 L9 -2 H7 V3 H9 V5 Z M-4 -2 V3 H-2 V-2 Z M2 -2 V3 H4 V-2 Z" fillRule="evenodd" />;
    case 'oldmill':
      return <path d="M-9 5 V-1 L-5 -4 V-1 L-1 -4 V-1 L3 -4 V-9 H6 V5 Z" />;
    case 'riverfront':
      return <path d="M-9 5 V-2 L-3 -6 L3 -2 V5 Z M5 5 V-9 H6.6 V-7 L10 -7 L6.6 -5.6 V5 Z" />;
    case 'suburbs':
      return <path d="M-9 5 V-1 L-5 -5 L-1 -1 V5 Z M1 5 V-1 L5 -5 L9 -1 V5 Z" />;
    case 'heights':
      return <path d="M-10 5 L-3 -6 L1 0 L4 -3 L10 5 Z" />;
  }
}

function Lock() {
  return (
    <g>
      <path d="M-3.4 -1.5 V-4 Q-3.4 -7.6 0 -7.6 Q3.4 -7.6 3.4 -4 V-1.5" fill="none" stroke={INK} strokeWidth="1.5" />
      <rect x="-5" y="-2" width="10" height="7.5" rx="1.6" fill={INK} />
      <circle cx="0" cy="1.6" r="1.1" fill={PAPER} />
    </g>
  );
}

export function CityMap({
  current,
  open,
  onSelect,
  labels,
}: {
  current: DistrictId;
  open: Record<DistrictId, boolean>;
  onSelect: (id: DistrictId) => void;
  labels: Record<DistrictId, string>;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const hatchId = `citymap-${uid}-hatch`;
  const waterId = `citymap-${uid}-water`;
  const desat = `citymap-${uid}-desat`;

  const onKey = (id: DistrictId) => (e: KeyboardEvent<SVGGElement>) => {
    if (!open[id]) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <svg
      viewBox="0 0 360 300"
      width="100%"
      role="group"
      aria-label="Map of Port Ellery"
      xmlns="http://www.w3.org/2000/svg"
      className="curbside-map"
    >
      <style>{`
        .curbside-map-d { outline: none; }
        .curbside-map-d.is-open { cursor: pointer; }
        .curbside-map-d.is-open:hover .curbside-map-shape { filter: brightness(1.07); }
        .curbside-map-d:focus-visible .curbside-map-shape { stroke: ${ACCENT}; stroke-width: 3; }
        .curbside-map-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: curbside-map-pulse 1.8s ease-out infinite;
        }
        @keyframes curbside-map-pulse {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .curbside-map-pulse { animation: none; opacity: 0.45; transform: scale(1.6); }
        }
      `}</style>
      <defs>
        <pattern id={hatchId} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="1" height="4" fill="#2a2622" opacity="0.18" />
        </pattern>
        <linearGradient id={waterId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7f9ea8" />
          <stop offset="1" stopColor="#5f7f8c" />
        </linearGradient>
        <filter id={desat}>
          <feColorMatrix type="saturate" values="0.12" />
        </filter>
      </defs>

      {/* land */}
      <rect width="360" height="300" fill={PAPER} />
      <rect width="360" height="300" fill="#b89a6e" opacity="0.12" />

      {/* parkland and hills in the gaps */}
      <g fill="#8a9a6a" opacity="0.28">
        <path d={blob([[6, 8], [80, 6], [140, 20], [132, 50], [70, 44], [10, 36]])} />
        <path d={blob([[8, 226], [90, 214], [128, 244], [120, 292], [40, 294], [6, 270]])} />
      </g>
      <g fill="#6f7d5c" opacity="0.45">
        {[[58, 16], [72, 26], [96, 22], [112, 32], [86, 38], [30, 250], [48, 262], [70, 244], [92, 270], [60, 280]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="4" />
        ))}
      </g>

      {/* the river, with a pale bank line */}
      <path d={RIVER} stroke="#c9b894" strokeWidth="30" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d={RIVER} stroke={`url(#${waterId})`} strokeWidth="22" fill="none" strokeLinecap="round" />
      <path
        d={RIVER}
        stroke="#d8e6e8"
        strokeWidth="0.9"
        fill="none"
        strokeDasharray="6 10"
        opacity="0.6"
        transform="translate(0 -3)"
      />

      {/* bridges */}
      {BRIDGES.map(([a, b], i) => (
        <g key={i} strokeLinecap="round">
          <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={INK} strokeWidth="6" opacity="0.75" />
          <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={PAPER} strokeWidth="2.4" />
        </g>
      ))}

      {/* districts */}
      {DISTRICTS.map((d) => {
        const isOpen = !!open[d.id];
        const isHere = d.id === current;
        const name = labels[d.id] ?? d.id;
        const [lx, ly] = d.label;
        const aria = `${name}${isHere ? ', you are here' : ''}${isOpen ? '' : ', locked'}`;
        return (
          <g
            key={d.id}
            role="button"
            tabIndex={0}
            aria-label={aria}
            aria-disabled={!isOpen}
            aria-current={isHere ? 'location' : undefined}
            className={`curbside-map-d${isOpen ? ' is-open' : ''}`}
            onClick={isOpen ? () => onSelect(d.id) : undefined}
            onKeyDown={onKey(d.id)}
          >
            <path
              className="curbside-map-shape"
              d={PATHS[d.id]}
              fill={d.color}
              fillOpacity={isOpen ? 0.9 : 0.55}
              filter={isOpen ? undefined : `url(#${desat})`}
              stroke={isHere ? ACCENT : INK}
              strokeOpacity={isHere ? 1 : 0.35}
              strokeWidth={isHere ? 2.6 : 1.2}
              strokeLinejoin="round"
            />
            {!isOpen && <path d={PATHS[d.id]} fill={`url(#${hatchId})`} pointerEvents="none" />}

            <g transform={`translate(${lx} ${ly - 17})`} pointerEvents="none">
              {isHere ? (
                <g>
                  <circle className="curbside-map-pulse" r="7" fill={ACCENT} />
                  <circle r="7.5" fill={PAPER} opacity="0.9" />
                  <circle r="5" fill={ACCENT} stroke={INK} strokeWidth="1.2" />
                  <circle r="1.8" fill={INK} />
                </g>
              ) : isOpen ? (
                <g fill={INK} opacity="0.55">
                  <Glyph id={d.id} />
                </g>
              ) : (
                <Lock />
              )}
            </g>

            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              fontSize="11.5"
              fontWeight={isHere ? 700 : 600}
              fontFamily="inherit"
              fill={INK}
              fillOpacity={isOpen ? 1 : 0.6}
              stroke={PAPER}
              strokeWidth="3"
              strokeLinejoin="round"
              paintOrder="stroke"
              pointerEvents="none"
            >
              {name}
            </text>
          </g>
        );
      })}

      {/* compass */}
      <g transform="translate(22 24)" pointerEvents="none" aria-hidden="true">
        <circle r="9" fill={PAPER} stroke={INK} strokeOpacity="0.4" />
        <path d="M0 -7 L2.6 0 L0 2 L-2.6 0 Z" fill={ACCENT} />
        <path d="M0 7 L2.6 0 L0 2 L-2.6 0 Z" fill={INK} opacity="0.5" />
        <text x="13" y="3" textAnchor="middle" fontSize="7" fontWeight="700" fill={INK} fontFamily="inherit">
          N
        </text>
      </g>
    </svg>
  );
}
