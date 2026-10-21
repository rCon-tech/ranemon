import { compile, type Compiled } from './music';
import { getSoundMode, subscribeSound } from './settings';
import { cry as playCry, SFX, type SfxId } from './sfx';
import { JINGLES, SONGS, type JingleId, type SongId } from './songs';
import { playDrum, playNote, type Chip } from './synth';

/**
 * Plays the music and effects in the browser. Phones only allow sound after a tap, so nothing is
 * made until `unlock` runs on the first one; music asked for before then starts at that tap.
 * Hidden tabs go quiet.
 */
let ctx: AudioContext | null = null;
let musicBus: GainNode | null = null;
let sfxChip: Chip | null = null;
let musicChip: Chip | null = null;

const MUSIC_LEVEL = 0.55;
const SFX_LEVEL = 0.9;

/** The song the game wants now, and the one playing, if any. */
let wanted: SongId | null = null;
let playing: { id: SongId; song: Compiled; step: number; next: number; bus: GainNode } | null =
  null;
let jingleUntil = 0;
let jingleTimer: ReturnType<typeof setTimeout> | null = null;
let ticker: ReturnType<typeof setInterval> | null = null;

const compiled = new Map<string, Compiled>();
function song(id: SongId | JingleId, jingle: boolean): Compiled {
  const key = `${jingle ? 'j' : 's'}:${id}`;
  let c = compiled.get(key);
  if (!c) {
    c = compile(jingle ? JINGLES[id as JingleId] : SONGS[id as SongId]);
    compiled.set(key, c);
  }
  return c;
}

/** Called from a tap or key press: sets up the audio, and starts any music waiting for it. */
export function unlock() {
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      globalThis.AudioContext ??
      (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.8;
    // A gentle limiter, so a crit over the battle theme doesn't clip on a phone.
    const limit = ctx.createDynamicsCompressor();
    limit.threshold.value = -10;
    limit.ratio.value = 6;
    master.connect(limit).connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = MUSIC_LEVEL;
    musicBus.connect(master);
    const sfxBus = ctx.createGain();
    sfxBus.gain.value = SFX_LEVEL;
    sfxBus.connect(master);
    sfxChip = { ctx, out: sfxBus };
    musicChip = { ctx, out: musicBus };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') ctx?.suspend();
      else ctx?.resume();
    });
    subscribeSound(refresh);
  }
  if (ctx.state === 'suspended' && document.visibilityState !== 'hidden') ctx.resume();
  refresh();
}

const musicOn = () => getSoundMode() === 'on';
const sfxOn = () => getSoundMode() !== 'off';

/** Starts, stops or changes the music to match what's wanted and the sound setting. */
function refresh() {
  if (!ctx || !musicChip) return;
  if (!musicOn()) {
    stopSong();
    return;
  }
  if (performance.now() < jingleUntil) return;
  if (playing?.id === wanted) return;
  stopSong();
  if (wanted) startSong(wanted);
}

function stopSong() {
  if (!ctx || !playing) return;
  const { bus } = playing;
  bus.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
  setTimeout(() => bus.disconnect(), 400);
  playing = null;
}

function startSong(id: SongId) {
  if (!ctx || !musicBus) return;
  const bus = ctx.createGain();
  bus.connect(musicBus);
  playing = { id, song: song(id, false), step: 0, next: ctx.currentTime + 0.06, bus };
  ticker ??= setInterval(schedule, 25);
  schedule();
}

/** Schedules the next tenth of a second or so of the song. */
function schedule() {
  if (!ctx || !playing) {
    if (ticker) clearInterval(ticker);
    ticker = null;
    return;
  }
  const p = playing;
  const chip: Chip = { ctx, out: p.bus };
  // After a stall (a slow phone, a tab coming back), carry on from now rather than catch up.
  if (p.next < ctx.currentTime - 0.1) p.next = ctx.currentTime + 0.02;
  while (p.next < ctx.currentTime + 0.15) {
    const at = p.step % p.song.length;
    for (const n of p.song.steps[at]) {
      const dur = n.len * p.song.stepSec;
      if (n.voice === 'drum') playDrum(chip, p.next, n.drum);
      else playNote(chip, p.next, n.voice, n.midi, dur, p.song.leadWave);
    }
    p.next += p.song.stepSec;
    p.step++;
    if (!p.song.loop && p.step >= p.song.length) {
      playing = null;
      return;
    }
  }
}

/** The music to play from now on, or none. The same song again carries on where it is. */
export function setMusic(id: SongId | null) {
  wanted = id;
  refresh();
}

/**
 * A short tune over everything, such as a level up. The music stops for it and starts again
 * after it, from the top, as on the handhelds.
 */
export function playJingle(id: JingleId) {
  if (!ctx || !musicChip || !musicOn()) {
    // With the music off, a jingle is still worth a little chime.
    if (sfxOn()) playSfx(id === 'lose' ? 'fail' : 'heal');
    return;
  }
  stopSong();
  const s = song(id, true);
  const start = ctx.currentTime + 0.05;
  for (let step = 0; step < s.length; step++) {
    for (const n of s.steps[step]) {
      const t = start + step * s.stepSec;
      if (n.voice === 'drum') playDrum(musicChip, t, n.drum);
      else playNote(musicChip, t, n.voice, n.midi, n.len * s.stepSec, s.leadWave);
    }
  }
  const ms = s.length * s.stepSec * 1000 + 250;
  jingleUntil = performance.now() + ms;
  if (jingleTimer) clearTimeout(jingleTimer);
  jingleTimer = setTimeout(() => {
    jingleUntil = 0;
    refresh();
  }, ms);
}

export function playSfx(id: SfxId, delay = 0) {
  if (!ctx || !sfxChip || !sfxOn()) return;
  SFX[id](sfxChip, ctx.currentTime + 0.005 + delay);
}

/** A Ranemon's own cry; lower when it faints. */
export function playCryOf(id: string, low = false, delay = 0) {
  if (!ctx || !sfxChip || !sfxOn()) return;
  playCry(sfxChip, ctx.currentTime + 0.005 + delay, id, low);
}
