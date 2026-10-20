import type { SfxName } from './types';
import { getProgress } from './progress';

/** Synthesised sound effects (Web Audio) — no audio files to load. */
let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.12, glideTo?: number) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5;

const RECIPES: Record<SfxName, () => void> = {
  click: () => tone(1200, 0, 0.03, 'square', 0.03),
  tick: () => tone(880, 0, 0.05, 'sine', 0.05),
  compare: () => tone(660, 0, 0.06, 'triangle', 0.06),
  swap: () => {
    tone(520, 0, 0.07, 'triangle', 0.08);
    tone(780, 0.06, 0.08, 'triangle', 0.08);
  },
  push: () => tone(440, 0, 0.09, 'triangle', 0.08, 880),
  pop: () => tone(880, 0, 0.09, 'triangle', 0.08, 440),
  found: () => {
    tone(G5, 0, 0.09, 'sine', 0.1);
    tone(C6, 0.08, 0.16, 'sine', 0.1);
  },
  correct: () => {
    tone(C5, 0, 0.1, 'sine', 0.11);
    tone(E5, 0.08, 0.1, 'sine', 0.11);
    tone(G5, 0.16, 0.18, 'sine', 0.11);
  },
  wrong: () => tone(220, 0, 0.28, 'sawtooth', 0.06, 110),
  unlock: () => tone(300, 0, 0.45, 'triangle', 0.09, 1200),
  fanfare: () => {
    [C5, E5, G5].forEach((f, i) => tone(f, i * 0.11, 0.14, 'square', 0.05));
    [C5, E5, G5, C6].forEach((f) => tone(f, 0.36, 0.6, 'triangle', 0.06));
  },
};

export function sfx(name: SfxName | undefined) {
  if (!name || getProgress().settings.muted) return;
  try {
    RECIPES[name]();
  } catch {
    /* audio unavailable */
  }
}
