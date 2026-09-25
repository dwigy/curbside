// The palette shifts from muted street tones toward warm gold as life improves.
// Colors are interpolated in HSL and written to CSS custom properties on :root.

type HSL = [number, number, number];

const STREET: Record<string, HSL> = {
  bg: [220, 8, 10],
  bg2: [220, 7, 14],
  card: [220, 7, 17],
  line: [220, 6, 26],
  ink: [40, 12, 88],
  muted: [35, 6, 62],
  accent: [38, 38, 58],
  accentInk: [30, 30, 10],
  good: [140, 22, 55],
  bad: [4, 50, 62],
  warn: [38, 70, 58],
};

const GOLD: Record<string, HSL> = {
  bg: [28, 30, 9],
  bg2: [28, 28, 13],
  card: [30, 26, 17],
  line: [32, 22, 27],
  ink: [40, 45, 92],
  muted: [36, 20, 68],
  accent: [40, 85, 60],
  accentInk: [30, 60, 10],
  good: [130, 45, 55],
  bad: [4, 65, 62],
  warn: [38, 90, 58],
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpHue = (a: number, b: number, t: number) => {
  let d = b - a;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return (a + d * t + 360) % 360;
};

export function applyTheme(prosperity: number, root: HTMLElement = document.documentElement) {
  const t = Math.max(0, Math.min(1, prosperity));
  for (const key of Object.keys(STREET)) {
    const a = STREET[key];
    const b = GOLD[key];
    const h = lerpHue(a[0], b[0], t);
    const s = lerp(a[1], b[1], t);
    const l = lerp(a[2], b[2], t);
    root.style.setProperty(`--${key}`, `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`);
  }
  root.style.setProperty('--prosperity', t.toFixed(3));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const bg = STREET.bg.map((v, i) => (i === 0 ? lerpHue(v, GOLD.bg[0], t) : lerp(v, GOLD.bg[i], t)));
    meta.setAttribute('content', `hsl(${bg[0]} ${bg[1]}% ${bg[2]}%)`);
  }
}
