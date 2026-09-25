// Tiny Web Audio synth. Off by default; nothing plays unless the player turns sound on.

type Cue = 'tap' | 'coin' | 'bad' | 'event' | 'story' | 'warn';

let ctx: AudioContext | null = null;
let enabled = false;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.08) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function play(cue: Cue) {
  if (!enabled) return;
  switch (cue) {
    case 'tap':
      tone(520, 0, 0.05, 'triangle', 0.04);
      break;
    case 'coin':
      tone(880, 0, 0.08, 'triangle');
      tone(1320, 0.07, 0.12, 'triangle');
      break;
    case 'bad':
      tone(220, 0, 0.18, 'sawtooth', 0.04);
      tone(165, 0.12, 0.25, 'sawtooth', 0.04);
      break;
    case 'event':
      tone(660, 0, 0.12);
      tone(990, 0.1, 0.2);
      break;
    case 'story':
      tone(392, 0, 0.5, 'sine', 0.06);
      tone(523, 0.15, 0.6, 'sine', 0.05);
      tone(659, 0.3, 0.8, 'sine', 0.04);
      break;
    case 'warn':
      tone(440, 0, 0.15, 'square', 0.03);
      tone(440, 0.22, 0.15, 'square', 0.03);
      break;
  }
}
