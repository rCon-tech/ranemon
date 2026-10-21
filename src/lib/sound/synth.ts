import { freqOf, type Drum, type Wave } from './music';

/**
 * The chip: pulse waves at 12.5%, 25% and 50%, a triangle, and noise, played on any audio
 * context, so the game and an offline render sound the same.
 */
export interface Chip {
  ctx: BaseAudioContext;
  out: AudioNode;
}

const waves = new WeakMap<BaseAudioContext, Map<Wave, PeriodicWave>>();
const noises = new WeakMap<BaseAudioContext, AudioBuffer>();

const DUTY: Record<Exclude<Wave, 'tri'>, number> = { sq12: 0.125, sq25: 0.25, sq50: 0.5 };

/** A pulse wave from its Fourier series. */
function pulse(ctx: BaseAudioContext, wave: Exclude<Wave, 'tri'>): PeriodicWave {
  let byWave = waves.get(ctx);
  if (!byWave) waves.set(ctx, (byWave = new Map()));
  let w = byWave.get(wave);
  if (!w) {
    const n = 48;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let k = 1; k < n; k++) real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * DUTY[wave]);
    w = ctx.createPeriodicWave(real, imag);
    byWave.set(wave, w);
  }
  return w;
}

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let b = noises.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = b.getChannelData(0);
    // The handhelds' noise came from a shift register; plain random reads much the same.
    let seed = 1;
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      data[i] = (seed / 0x3fffffff - 1) * 0.9;
    }
    noises.set(ctx, b);
  }
  return b;
}

export interface Tone {
  wave: Wave | 'sine';
  /** Hz. */
  f: number;
  /** Slides to this pitch by the end. */
  to?: number;
  /** Seconds after the start. */
  at?: number;
  dur: number;
  vol?: number;
  /** Vibrato: how fast, and how far in cents. */
  vib?: [rate: number, cents: number];
  /** How much of the level it falls to after the attack, 0 to 1. */
  sustain?: number;
}

export function tone(chip: Chip, t: number, o: Tone) {
  const { ctx } = chip;
  const start = t + (o.at ?? 0);
  const end = start + o.dur;
  const vol = o.vol ?? 0.3;
  const osc = ctx.createOscillator();
  if (o.wave === 'tri' || o.wave === 'sine') osc.type = o.wave === 'tri' ? 'triangle' : 'sine';
  else osc.setPeriodicWave(pulse(ctx, o.wave));
  osc.frequency.setValueAtTime(o.f, start);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), end);
  if (o.vib) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = o.vib[0];
    depth.gain.value = o.vib[1];
    lfo.connect(depth).connect(osc.detune);
    lfo.start(start);
    lfo.stop(end + 0.05);
  }
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.004);
  g.gain.setTargetAtTime(vol * (o.sustain ?? 0.7), start + 0.01, 0.08);
  g.gain.setTargetAtTime(0, Math.max(start + 0.01, end - 0.02), 0.012);
  osc.connect(g).connect(chip.out);
  osc.start(start);
  osc.stop(end + 0.08);
}

export interface Noise {
  at?: number;
  dur: number;
  vol?: number;
  filter?: BiquadFilterType;
  /** The filter's frequency, sliding to `to` if given. */
  f?: number;
  to?: number;
  q?: number;
}

export function noise(chip: Chip, t: number, o: Noise) {
  const { ctx } = chip;
  const start = t + (o.at ?? 0);
  const end = start + o.dur;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = o.filter ?? 'lowpass';
  filter.frequency.setValueAtTime(o.f ?? 4000, start);
  if (o.to) filter.frequency.exponentialRampToValueAtTime(o.to, end);
  filter.Q.value = o.q ?? 1;
  const g = ctx.createGain();
  const vol = o.vol ?? 0.3;
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, end);
  src.connect(filter).connect(g).connect(chip.out);
  src.start(start, Math.random() * 0.5);
  src.stop(end + 0.02);
}

/** Levels of the music's channels against each other. */
const LEVEL = { lead: 0.16, arp: 0.045, bass: 0.3 };

/** One note of a song. Long lead notes get a little vibrato, like a held fiddle note. */
export function playNote(
  chip: Chip,
  t: number,
  voice: 'lead' | 'arp' | 'bass',
  midi: number,
  dur: number,
  leadWave: Wave,
) {
  const f = freqOf(midi);
  if (voice === 'bass')
    tone(chip, t, { wave: 'tri', f, dur: dur * 0.95, vol: LEVEL.bass, sustain: 0.85 });
  else if (voice === 'arp')
    tone(chip, t, { wave: 'sq12', f, dur: dur * 0.9, vol: LEVEL.arp, sustain: 0.5 });
  else
    tone(chip, t, {
      wave: leadWave,
      f,
      dur: dur * 0.92,
      vol: LEVEL.lead,
      sustain: 0.65,
      vib: dur > 0.3 ? [5.5, 12] : undefined,
    });
}

export function playDrum(chip: Chip, t: number, drum: Drum) {
  switch (drum) {
    case 'k':
      tone(chip, t, { wave: 'sine', f: 150, to: 45, dur: 0.12, vol: 0.55, sustain: 0.9 });
      noise(chip, t, { dur: 0.02, vol: 0.12, f: 2000 });
      break;
    case 's':
      noise(chip, t, { dur: 0.13, vol: 0.22, filter: 'bandpass', f: 1800, q: 0.7 });
      tone(chip, t, { wave: 'tri', f: 220, to: 140, dur: 0.06, vol: 0.15 });
      break;
    case 'h':
      noise(chip, t, { dur: 0.035, vol: 0.07, filter: 'highpass', f: 7000 });
      break;
    case 'o':
      noise(chip, t, { dur: 0.16, vol: 0.06, filter: 'highpass', f: 6000 });
      break;
    case 't':
      tone(chip, t, { wave: 'tri', f: 200, to: 90, dur: 0.14, vol: 0.4, sustain: 0.9 });
      break;
  }
}
