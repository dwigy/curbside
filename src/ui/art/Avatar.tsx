import { useId, type ReactElement } from 'react';
import type { AvatarSpec } from '../../engine/types';

/** Skin tones, light to deep. */
export const SKIN_TONES: string[] = ['#f2d3b9', '#e2b28c', '#c98f63', '#a66d47', '#7b4c31', '#4f3223'];
export const HAIR_STYLES: string[] = ['Bald', 'Short', 'Long', 'Curly', 'Buzz', 'Bun'];
export const HAIR_COLORS: string[] = ['#1f1a17', '#4a2f22', '#7a4e2e', '#b88a4a', '#9c4a2a', '#9a968f'];
export const FACIAL: string[] = ['None', 'Stubble', 'Beard', 'Mustache'];
/** Muted jacket / hoodie colors. */
export const TOP_COLORS: string[] = ['#4e5a4c', '#3d4f66', '#8a4630', '#5a4a62', '#8a7a58', '#3a3a3e'];
export const ACCESSORIES: string[] = ['None', 'Beanie', 'Glasses', 'Cap'];

const INK = '#2a2622';

function pick(list: string[], i: number): string {
  const n = list.length;
  const k = Number.isFinite(i) ? Math.trunc(i) : 0;
  return list[((k % n) + n) % n];
}

function idx(n: number, i: number): number {
  const k = Number.isFinite(i) ? Math.trunc(i) : 0;
  return ((k % n) + n) % n;
}

/** Darken (amt < 0) or lighten (amt > 0) a #rrggbb color. */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => {
    const t = amt < 0 ? 0 : 255;
    const p = Math.abs(amt);
    return Math.round((t - v) * p + v);
  };
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/* Curls sit on an arc around the crown. */
const CURLS: Array<[number, number, number]> = [
  [31.5, 47, 5.2],
  [32, 38, 6],
  [37, 30, 6.4],
  [44.5, 25.5, 6.6],
  [53, 24.8, 6.6],
  [61, 28, 6.4],
  [66.5, 35.5, 6],
  [68.5, 45, 5.2],
];
const SIDE_CURLS = CURLS.filter(([, y]) => y > 40);

export function Avatar({ spec, size = 96, title }: { spec: AvatarSpec; size?: number; title?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const clip = `av-${uid}-clip`;
  const bg = `av-${uid}-bg`;

  const skin = pick(SKIN_TONES, spec.skin);
  const hairColor = pick(HAIR_COLORS, spec.hairColor);
  const top = pick(TOP_COLORS, spec.top);
  const style = idx(HAIR_STYLES.length, spec.hair);
  const facial = idx(FACIAL.length, spec.facial);
  const acc = idx(ACCESSORIES.length, spec.accessory);

  const skinShadow = shade(skin, -0.16);
  const topDark = shade(top, -0.3);
  const topLight = shade(top, 0.12);
  const hairHi = shade(hairColor, 0.22);
  const covered = acc === 1 || acc === 3; // beanie or cap hides the crown

  /* ---------- hair layers ---------- */
  const back: ReactElement[] = [];
  const front: ReactElement[] = [];

  if (style === 2) {
    // Long: a back mass that falls to the shoulders, plus a side-swept fringe.
    back.push(
      <path
        key="long-back"
        d="M29.5 50 Q27 23 50 23 Q73 23 70.5 50 L72.5 73 Q65 79 58.5 71 L41.5 71 Q35 79 27.5 73 Z"
        fill={hairColor}
      />,
    );
    if (!covered) {
      front.push(
        <path
          key="long-front"
          d="M32.4 47 Q31 26.5 50 26.5 Q69 26.5 67.6 47 Q66 38 58 33.5 Q50 39 38 38 Q34 41 32.4 47 Z"
          fill={hairColor}
        />,
        <path key="long-hi" d="M42 30 Q50 27.6 58 30" stroke={hairHi} strokeWidth="1.4" fill="none" strokeLinecap="round" />,
      );
    } else {
      front.push(
        <path key="long-sides-l" d="M32.6 42 Q31.4 50 33 58 L35 58 Q34 50 36 42 Z" fill={hairColor} />,
        <path key="long-sides-r" d="M67.4 42 Q68.6 50 67 58 L65 58 Q66 50 64 42 Z" fill={hairColor} />,
      );
    }
  } else if (style === 3) {
    // Curly: a halo of round curls.
    const curls = covered ? SIDE_CURLS : CURLS;
    back.push(
      <g key="curly-back" fill={hairColor}>
        {curls.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
        {!covered && <ellipse cx="50" cy="35" rx="17" ry="11" />}
      </g>,
    );
    if (!covered) {
      front.push(
        <g key="curly-front" fill={hairColor}>
          <circle cx="40" cy="33.5" r="4.6" />
          <circle cx="47.5" cy="31.5" r="4.8" />
          <circle cx="55" cy="32" r="4.8" />
          <circle cx="61.5" cy="35" r="4.2" />
        </g>,
        <g key="curly-hi" stroke={hairHi} strokeWidth="1" fill="none" strokeLinecap="round">
          <path d="M44 24 q2 -1.6 4 0" />
          <path d="M56 26 q2 -1.4 4 0.4" />
          <path d="M34 36 q1 -2 3 -2.4" />
        </g>,
      );
    }
  } else if (style === 1) {
    // Short: a neat crop with a soft side part.
    if (!covered) {
      front.push(
        <path
          key="short"
          d="M32.6 46 Q30.5 26 50 25.5 Q69.5 26 67.4 46 Q66 39 63 37 Q55 35 48 36.5 Q44 33.8 40 36 Q35 38 32.6 46 Z"
          fill={hairColor}
        />,
        <path key="short-hi" d="M40 29.5 Q46 27 52 28" stroke={hairHi} strokeWidth="1.3" fill="none" strokeLinecap="round" />,
      );
    } else {
      front.push(
        <path key="short-l" d="M33 41 L33.4 49 L35.6 49 L36 41 Z" fill={hairColor} />,
        <path key="short-r" d="M67 41 L66.6 49 L64.4 49 L64 41 Z" fill={hairColor} />,
      );
    }
  } else if (style === 4) {
    // Buzz: close to the scalp, slightly translucent over skin.
    if (!covered) {
      front.push(
        <path
          key="buzz"
          d="M33.2 45 Q32.4 27.5 50 27 Q67.6 27.5 66.8 45 Q64 38.5 50 37.5 Q36 38.5 33.2 45 Z"
          fill={hairColor}
          opacity="0.82"
        />,
      );
    }
  } else if (style === 5) {
    // Bun: hair pulled back, bun on top (hidden by a beanie, peeks behind a cap).
    if (acc !== 1) {
      back.push(<circle key="bun" cx="50" cy={acc === 3 ? 22 : 20.5} r="7.6" fill={hairColor} />);
      back.push(
        <path key="bun-tie" d={`M44 ${acc === 3 ? 27.5 : 26.5} Q50 ${acc === 3 ? 30 : 29} 56 ${acc === 3 ? 27.5 : 26.5}`} stroke={hairHi} strokeWidth="1.4" fill="none" />,
      );
    }
    if (!covered) {
      front.push(
        <path
          key="bun-front"
          d="M32.8 46 Q31 26.5 50 26 Q69 26.5 67.2 46 Q65 36 50 35 Q35 36 32.8 46 Z"
          fill={hairColor}
        />,
        <path key="bun-lines" d="M42 30.5 Q50 28 58 30.5 M39 34 Q50 30.5 61 34" stroke={hairHi} strokeWidth="0.9" fill="none" />,
      );
    } else {
      front.push(
        <path key="bun-l" d="M33 41 L33.6 50 L35.4 50 L36 41 Z" fill={hairColor} />,
        <path key="bun-r" d="M67 41 L66.4 50 L64.6 50 L64 41 Z" fill={hairColor} />,
      );
    }
  }

  /* ---------- facial hair ---------- */
  let facialEl: ReactElement | null = null;
  if (facial === 1) {
    facialEl = (
      <path
        d="M33.6 49 Q34 66.5 50 67 Q66 66.5 66.4 49 Q64 58.5 57 59.4 Q50 57.8 43 59.4 Q36 58.5 33.6 49 Z"
        fill={hairColor}
        opacity="0.28"
      />
    );
  } else if (facial === 2) {
    facialEl = (
      <path
        d="M33 47 Q32.5 71 50 72 Q67.5 71 67 47 Q65 57.5 58.5 58.6 Q54 56 50 56.5 Q46 56 41.5 58.6 Q35 57.5 33 47 Z"
        fill={hairColor}
      />
    );
  } else if (facial === 3) {
    facialEl = <path d="M43.2 57.4 Q50 53.4 56.8 57.4 Q54 58.6 50 57.2 Q46 58.6 43.2 57.4 Z" fill={hairColor} />;
  }

  /* ---------- accessory ---------- */
  let accEl: ReactElement | null = null;
  if (acc === 1) {
    const knit = shade(top, 0.28);
    accEl = (
      <g>
        <path d="M31 44 Q29.5 18.5 50 18.5 Q70.5 18.5 69 44 Z" fill={knit} />
        <path d="M38 22 V41 M44 19.6 V41 M50 18.8 V41 M56 19.6 V41 M62 22 V41" stroke={shade(knit, -0.12)} strokeWidth="1" />
        <path d="M30 38 Q50 34.5 70 38 L70.4 45 Q50 41.5 29.6 45 Z" fill={shade(knit, -0.15)} />
        <circle cx="50" cy="16.5" r="4.4" fill={shade(knit, -0.08)} />
      </g>
    );
  } else if (acc === 3) {
    const capC = shade(top, 0.2);
    accEl = (
      <g>
        <path d="M31.6 42 Q30.5 22.5 50 22.5 Q69.5 22.5 68.4 42 Z" fill={capC} />
        <path d="M50 22.5 V41" stroke={shade(capC, -0.18)} strokeWidth="0.9" />
        <circle cx="50" cy="23" r="1.6" fill={shade(capC, -0.2)} />
        <path d="M29 41.5 Q50 35.6 71 41.5 Q73.5 45.5 69 46 Q50 42.6 31 46 Q26.5 45.5 29 41.5 Z" fill={shade(capC, -0.22)} />
      </g>
    );
  }

  const glasses =
    acc === 2 ? (
      <g stroke={INK} strokeWidth="1.5" fill="#fff" fillOpacity="0.14">
        <rect x="38.2" y="43.4" width="10" height="8.4" rx="3.4" />
        <rect x="51.8" y="43.4" width="10" height="8.4" rx="3.4" />
        <path d="M48.2 46.4 Q50 45 51.8 46.4" fill="none" />
        <path d="M38.2 46 L33.6 45 M61.8 46 L66.4 45" fill="none" />
      </g>
    ) : null;

  const label = title ?? 'Character portrait';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      <defs>
        <clipPath id={clip}>
          <circle cx="50" cy="50" r="48" />
        </clipPath>
        <radialGradient id={bg} cx="0.5" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#f6dfae" />
          <stop offset="1" stopColor="#d9a466" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="100" height="100" fill={`url(#${bg})`} />
        {/* a curb-edge horizon for a sense of place */}
        <path d="M0 78 H100 V100 H0 Z" fill="#c48850" opacity="0.35" />
        {/* the bust is drawn slightly larger than its 100-unit layout so it reads at 40px */}
        <g transform="translate(50 62) scale(1.1) translate(-50 -62)">

          {back}

          {/* shoulders: hoodie with hood around the neck */}
          <path d="M10 104 Q11 79 33 73.5 L67 73.5 Q89 79 90 104 Z" fill={top} />
          <path d="M31 75 Q33 65.5 50 65.5 Q67 65.5 69 75 Q60 70 50 79 Q40 70 31 75 Z" fill={topDark} />
          {/* neck */}
          <path d="M43.5 60 H56.5 V71 Q50 76 43.5 71 Z" fill={skinShadow} />
          <path d="M50 79 V104" stroke={topDark} strokeWidth="1.2" />
          <path d="M46 80 V87 M54 80 V87" stroke={topLight} strokeWidth="1.1" strokeLinecap="round" />
          <path d="M14 92 Q18 82 26 78" stroke={topLight} strokeWidth="1.2" fill="none" opacity="0.6" />

          {/* ears + head */}
          <ellipse cx="32.8" cy="49" rx="3.6" ry="4.4" fill={skin} />
          <ellipse cx="67.2" cy="49" rx="3.6" ry="4.4" fill={skin} />
          <ellipse cx="32.9" cy="49.2" rx="1.6" ry="2.4" fill={skinShadow} />
          <ellipse cx="67.1" cy="49.2" rx="1.6" ry="2.4" fill={skinShadow} />
          <path d="M33 46 Q33 27 50 27 Q67 27 67 46 Q67 66.5 50 66.5 Q33 66.5 33 46 Z" fill={skin} />

          {facial !== 3 && facialEl}

          {/* face: gentle features */}
          <ellipse cx="41" cy="54.5" rx="3.2" ry="2" fill="#e0785a" opacity="0.18" />
          <ellipse cx="59" cy="54.5" rx="3.2" ry="2" fill="#e0785a" opacity="0.18" />
          <circle cx="43.4" cy="47.6" r="2.1" fill={INK} />
          <circle cx="56.6" cy="47.6" r="2.1" fill={INK} />
          <circle cx="44.1" cy="46.9" r="0.6" fill="#fff" opacity="0.8" />
          <circle cx="57.3" cy="46.9" r="0.6" fill="#fff" opacity="0.8" />
          <path d="M40.4 43.2 Q43.4 41.6 46.2 42.8 M53.8 42.8 Q56.6 41.6 59.6 43.2" stroke={shade(hairColor, style === 0 || style === 4 ? 0.1 : 0)} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.85" />
          <path d="M50 49.5 Q51.6 52.6 49.4 53.4" stroke={skinShadow} strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <path
            d="M46.4 58.6 Q50 60.8 53.6 58.6"
            stroke={facial === 2 ? shade(skin, -0.35) : shade(skin, -0.45)}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          {facial === 3 && facialEl}

          {style === 0 && !covered && (
            <path d="M40 31 Q46 28.5 52 29.4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.25" />
          )}
          {front}
          {glasses}
          {accEl}
        </g>
      </g>
      <circle cx="50" cy="50" r="48" fill="none" stroke={INK} strokeOpacity="0.25" strokeWidth="1.5" />
    </svg>
  );
}
