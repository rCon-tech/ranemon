import type { RaneType } from '../battle/types';
import { noise, tone, type Chip } from './synth';

/** Every sound effect, made on the chip from scratch. */
export type SfxId =
  | 'select'
  | 'back'
  | 'blip'
  | 'door'
  | 'encounter'
  | 'exclaim'
  | 'send'
  | 'withdraw'
  | 'move'
  | 'move-status'
  | 'move-brains'
  | 'move-brawn'
  | 'move-chaos'
  | 'move-chill'
  | 'move-charm'
  | 'move-hype'
  | 'move-posh'
  | 'move-graft'
  | 'move-arty'
  | 'special'
  | 'hit'
  | 'hit-super'
  | 'hit-weak'
  | 'crit'
  | 'miss'
  | 'fail'
  | 'heal'
  | 'stat-up'
  | 'stat-down'
  | 'flustered'
  | 'hangry'
  | 'asleep'
  | 'wake'
  | 'swap'
  | 'faint'
  | 'throw'
  | 'sip'
  | 'run'
  | 'sparkle'
  | 'shiny'
  | 'bark'
  | 'bell'
  | 'save'
  | 'tick'
  | 'evolving';

type Recipe = (chip: Chip, t: number) => void;

/** Notes one after another, each `gap` seconds apart. */
function run(
  chip: Chip,
  t: number,
  wave: 'sq12' | 'sq25' | 'sq50' | 'sine',
  fs: number[],
  gap: number,
  vol = 0.22,
) {
  fs.forEach((f, i) => tone(chip, t, { wave, f, at: i * gap, dur: gap * 1.6, vol }));
}

const hit: Recipe = (c, t) => {
  noise(c, t, { dur: 0.16, vol: 0.5, f: 3000, to: 300 });
  tone(c, t, { wave: 'sq50', f: 180, to: 60, dur: 0.12, vol: 0.25 });
};

export const SFX: Record<SfxId, Recipe> = {
  select: (c, t) => {
    tone(c, t, { wave: 'sq25', f: 1320, dur: 0.035, vol: 0.14 });
    tone(c, t, { wave: 'sq25', f: 1760, at: 0.035, dur: 0.05, vol: 0.14 });
  },
  back: (c, t) => {
    tone(c, t, { wave: 'sq25', f: 1100, dur: 0.035, vol: 0.14 });
    tone(c, t, { wave: 'sq25', f: 740, at: 0.035, dur: 0.06, vol: 0.14 });
  },
  blip: (c, t) => tone(c, t, { wave: 'sq50', f: 990, dur: 0.03, vol: 0.1 }),
  door: (c, t) => {
    noise(c, t, { dur: 0.25, vol: 0.35, f: 1500, to: 200 });
    tone(c, t, { wave: 'tri', f: 120, to: 70, at: 0.03, dur: 0.12, vol: 0.4 });
  },
  encounter: (c, t) => {
    for (let i = 0; i < 12; i++) {
      tone(c, t, { wave: 'sq50', f: 220 * 2 ** (i / 4), at: i * 0.035, dur: 0.04, vol: 0.18 });
    }
    noise(c, t, { at: 0.42, dur: 0.3, vol: 0.25, filter: 'highpass', f: 2000 });
  },
  exclaim: (c, t) => {
    tone(c, t, { wave: 'sq25', f: 1400, to: 1900, dur: 0.07, vol: 0.2 });
    tone(c, t, { wave: 'sq25', f: 1900, at: 0.09, dur: 0.14, vol: 0.2 });
  },
  send: (c, t) => {
    noise(c, t, { dur: 0.22, vol: 0.25, filter: 'highpass', f: 3000, to: 8000 });
    tone(c, t, { wave: 'sq12', f: 300, to: 1500, dur: 0.1, vol: 0.18 });
  },
  withdraw: (c, t) => tone(c, t, { wave: 'sq25', f: 1200, to: 300, dur: 0.18, vol: 0.18 }),
  move: (c, t) => tone(c, t, { wave: 'sq50', f: 400, to: 250, dur: 0.1, vol: 0.2 }),
  'move-status': (c, t) => run(c, t, 'sq12', [660, 880, 1320], 0.05, 0.16),
  'move-brains': (c, t) => {
    tone(c, t, { wave: 'sq12', f: 880, to: 1760, dur: 0.15, vol: 0.2, vib: [30, 40] });
    tone(c, t, { wave: 'sq12', f: 1320, to: 2640, at: 0.1, dur: 0.15, vol: 0.16 });
  },
  'move-brawn': (c, t) => {
    noise(c, t, { dur: 0.18, vol: 0.55, f: 900, to: 200 });
    tone(c, t, { wave: 'tri', f: 130, to: 40, dur: 0.16, vol: 0.5 });
  },
  'move-chaos': (c, t) => run(c, t, 'sq50', [523, 932, 370, 1245, 466, 1661, 311], 0.035, 0.15),
  'move-chill': (c, t) => {
    tone(c, t, { wave: 'sine', f: 1047, dur: 0.5, vol: 0.25, sustain: 0.4 });
    tone(c, t, { wave: 'sine', f: 1568, at: 0.12, dur: 0.5, vol: 0.2, sustain: 0.4 });
    tone(c, t, { wave: 'sine', f: 2093, at: 0.24, dur: 0.5, vol: 0.15, sustain: 0.4 });
  },
  'move-charm': (c, t) => run(c, t, 'sq12', [2093, 2637, 3136, 4186, 3136, 4186], 0.04, 0.12),
  'move-hype': (c, t) => {
    tone(c, t, { wave: 'sq25', f: 200, to: 1600, dur: 0.3, vol: 0.2 });
    noise(c, t, { at: 0.1, dur: 0.25, vol: 0.18, filter: 'highpass', f: 2000, to: 8000 });
  },
  // A little fanfare, as if someone important has arrived.
  'move-posh': (c, t) => {
    run(c, t, 'sq25', [523, 659, 784], 0.08, 0.16);
    tone(c, t, { wave: 'sq25', f: 1047, at: 0.24, dur: 0.35, vol: 0.18, sustain: 0.3 });
  },
  // Three hammer blows.
  'move-graft': (c, t) => {
    for (const at of [0, 0.09, 0.18]) {
      noise(c, t, { at, dur: 0.06, vol: 0.45, filter: 'bandpass', f: 2500, to: 1200 });
      tone(c, t, { wave: 'tri', f: 220, to: 110, at, dur: 0.06, vol: 0.35 });
    }
  },
  // A brush stroke up the scale and back.
  'move-arty': (c, t) => run(c, t, 'sine', [392, 523, 659, 880, 1175, 880, 659], 0.04, 0.2),
  special: (c, t) => {
    run(c, t, 'sq25', [262, 330, 392, 523, 659, 784, 1047, 1319], 0.05, 0.18);
    noise(c, t, { at: 0.35, dur: 0.6, vol: 0.25, filter: 'bandpass', f: 600, to: 5000 });
    tone(c, t, { wave: 'sq50', f: 1047, at: 0.4, dur: 0.5, vol: 0.14, vib: [8, 30] });
  },
  hit,
  'hit-super': (c, t) => {
    noise(c, t, { dur: 0.26, vol: 0.65, f: 5000, to: 200 });
    tone(c, t, { wave: 'sq50', f: 260, to: 50, dur: 0.22, vol: 0.3 });
    noise(c, t, { at: 0.09, dur: 0.18, vol: 0.4, f: 2500, to: 150 });
  },
  'hit-weak': (c, t) => noise(c, t, { dur: 0.1, vol: 0.35, f: 1200, to: 200 }),
  crit: (c, t) => {
    tone(c, t, { wave: 'sq25', f: 2000, to: 1000, dur: 0.06, vol: 0.18 });
    hit(c, t + 0.05);
    noise(c, t, { at: 0.13, dur: 0.14, vol: 0.35, f: 4000, to: 300 });
  },
  miss: (c, t) => noise(c, t, { dur: 0.2, vol: 0.18, filter: 'bandpass', f: 1500, to: 6000, q: 2 }),
  fail: (c, t) => {
    tone(c, t, { wave: 'sq50', f: 220, dur: 0.1, vol: 0.16 });
    tone(c, t, { wave: 'sq50', f: 165, at: 0.11, dur: 0.18, vol: 0.16 });
  },
  heal: (c, t) => {
    run(c, t, 'sq25', [1047, 1319, 1568, 2093], 0.06, 0.15);
    tone(c, t, { wave: 'sine', f: 2637, at: 0.24, dur: 0.3, vol: 0.12, sustain: 0.4 });
  },
  'stat-up': (c, t) =>
    run(c, t, 'sq12', [523, 659, 784, 659, 784, 988, 784, 988, 1175], 0.035, 0.16),
  'stat-down': (c, t) => run(c, t, 'sq12', [1175, 988, 1047, 880, 784, 830, 659, 523], 0.04, 0.16),
  flustered: (c, t) => tone(c, t, { wave: 'sq25', f: 700, dur: 0.45, vol: 0.18, vib: [16, 120] }),
  hangry: (c, t) => {
    tone(c, t, { wave: 'sq50', f: 110, to: 85, dur: 0.4, vol: 0.25, vib: [28, 60] });
    noise(c, t, { dur: 0.35, vol: 0.18, f: 500 });
  },
  asleep: (c, t) => {
    tone(c, t, { wave: 'tri', f: 440, to: 330, dur: 0.28, vol: 0.3 });
    tone(c, t, { wave: 'tri', f: 330, to: 220, at: 0.32, dur: 0.36, vol: 0.3 });
  },
  wake: (c, t) => tone(c, t, { wave: 'sq25', f: 660, to: 1320, dur: 0.12, vol: 0.18 }),
  swap: (c, t) => {
    tone(c, t, { wave: 'sq25', f: 400, to: 1200, dur: 0.18, vol: 0.18 });
    tone(c, t, { wave: 'sq25', f: 1200, to: 400, at: 0.18, dur: 0.18, vol: 0.18 });
  },
  faint: (c, t) => tone(c, t, { wave: 'sq50', f: 600, to: 70, dur: 0.75, vol: 0.2, sustain: 0.9 }),
  throw: (c, t) => {
    noise(c, t, { dur: 0.3, vol: 0.2, filter: 'bandpass', f: 700, to: 2600, q: 1.5 });
    tone(c, t, { wave: 'sq12', f: 500, to: 900, dur: 0.25, vol: 0.12 });
  },
  sip: (c, t) => {
    tone(c, t, { wave: 'tri', f: 320, to: 170, dur: 0.12, vol: 0.45 });
    noise(c, t, { at: 0.03, dur: 0.08, vol: 0.15, f: 600 });
    tone(c, t, { wave: 'tri', f: 280, to: 150, at: 0.2, dur: 0.12, vol: 0.4 });
  },
  run: (c, t) => {
    for (let i = 0; i < 5; i++) noise(c, t, { at: i * 0.08, dur: 0.045, vol: 0.3, f: 700 });
  },
  sparkle: (c, t) => run(c, t, 'sine', [2637, 3136, 3951, 4699, 3951, 4699, 5274], 0.05, 0.12),
  shiny: (c, t) => {
    run(c, t, 'sine', [2637, 3136, 3951, 4699, 5274, 6272], 0.045, 0.14);
    run(c, t + 0.32, 'sq12', [2093, 2637, 3136, 4186], 0.05, 0.08);
  },
  bark: (c, t) => {
    for (const at of [0, 0.17]) {
      tone(c, t, { wave: 'sq50', f: 360, to: 170, at, dur: 0.09, vol: 0.25 });
      noise(c, t, { at, dur: 0.08, vol: 0.2, filter: 'bandpass', f: 900, q: 2 });
    }
  },
  bell: (c, t) => {
    for (const at of [0, 0.15]) {
      tone(c, t, { wave: 'sine', f: 2349, at, dur: 0.35, vol: 0.18, sustain: 0.3 });
      tone(c, t, { wave: 'sine', f: 2960, at, dur: 0.3, vol: 0.1, sustain: 0.3 });
    }
  },
  save: (c, t) => run(c, t, 'sq25', [1047, 1568], 0.07, 0.16),
  tick: (c, t) => tone(c, t, { wave: 'sq50', f: 1000, dur: 0.03, vol: 0.12 }),
  evolving: (c, t) =>
    tone(c, t, { wave: 'sq25', f: 300, to: 1200, dur: 1.4, vol: 0.15, vib: [12, 50] }),
};

/** The sound of a move, by its type; status moves all share one. */
export function moveSfx(type: RaneType | null, status: boolean, signature: boolean): SfxId {
  if (signature) return 'special';
  if (status) return 'move-status';
  return type ? `move-${type}` : 'move';
}

/** A string's hash, for a cry that's always the same for the same Ranemon. */
function hashOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** The shape of a Ranemon's cry, from its id. */
export function cryOf(id: string) {
  const h = hashOf(id);
  const base = 280 + (h % 520);
  return {
    wave: (['sq12', 'sq25', 'sq50'] as const)[(h >>> 10) % 3],
    pitches: [base, base * (1.1 + ((h >>> 3) % 6) / 10), base * (0.55 + ((h >>> 6) % 6) / 10)],
    wobble: 12 + ((h >>> 13) % 24),
  };
}

/** A Ranemon's cry: three slides on a pulse, with a growl of noise. Lower and slower when it faints. */
export function cry(chip: Chip, t: number, id: string, low = false) {
  const { wave, pitches, wobble } = cryOf(id);
  const k = low ? 0.7 : 1;
  const slow = low ? 1.7 : 1;
  const [a, b, d] = pitches.map((p) => p * k);
  tone(chip, t, { wave, f: a, to: b, dur: 0.1 * slow, vol: 0.2, vib: [wobble, 50] });
  tone(chip, t, {
    wave,
    f: b,
    to: d,
    at: 0.1 * slow,
    dur: 0.16 * slow,
    vol: 0.2,
    vib: [wobble, 80],
  });
  tone(chip, t, {
    wave,
    f: d,
    to: d * (low ? 0.6 : 0.85),
    at: 0.26 * slow,
    dur: 0.2 * slow,
    vol: 0.16,
  });
  noise(chip, t, { dur: 0.4 * slow, vol: 0.07, filter: 'bandpass', f: a * 2, q: 3 });
}
