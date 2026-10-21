/**
 * The music format, and how a song is turned into notes. A song is written like a tracker: a lead
 * line note by note, chords bar by bar, and styles that build the bass and arpeggio from the
 * chords, as on the old handhelds' four channels (two pulses, a wave and noise).
 *
 * Bars are split by `|`. Each bar's tokens share the bar evenly, so 8 tokens in a 16-step bar are
 * eighth notes. A token is a note (`C5`, `F#4`, `Bb3`), `.` for a rest, or `-` to hold the note
 * before. Steps are sixteenth notes.
 */
export type Wave = 'sq12' | 'sq25' | 'sq50' | 'tri';
export type Drum = 'k' | 's' | 'h' | 'o' | 't';

export interface Song {
  /** Quarter notes a minute. */
  bpm: number;
  /** Sixteenth steps in a bar: 16 for 4/4, 12 for a jig's 6/8. */
  bar: 12 | 16;
  loop: boolean;
  /** One or more chords per bar, splitting it evenly: `C | Am | F G | C`. */
  chords: string;
  lead: string;
  leadWave: Wave;
  /** How the bass walks over the chords, and every how many steps it moves. */
  bass: { style: 'alt' | 'octaves' | 'walk' | 'hold'; every: number };
  /** The second pulse running up the chord, every how many steps. 0 for none. */
  arp: number;
  /** One or more bars of drums, cycled: k kick, s snare, h hat, o open hat, t tom, . nothing. */
  drums?: string;
}

export type Voice = 'lead' | 'arp' | 'bass';

export type Note =
  | { step: number; len: number; voice: Voice; midi: number }
  | { step: number; len: number; voice: 'drum'; drum: Drum };

export interface Compiled {
  /** Seconds a step lasts. */
  stepSec: number;
  length: number;
  loop: boolean;
  leadWave: Wave;
  /** Notes by the step they start on. */
  steps: Note[][];
}

const NAMES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** `C4` is MIDI 60. */
export function midiOf(name: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`Not a note: ${name}`);
  const shift = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return 12 * (Number(m[3]) + 1) + NAMES[m[1]] + shift;
}

export const freqOf = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

const QUALITIES: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  dim: [0, 3, 6],
  sus4: [0, 5, 7],
};

/** A chord's root (0 to 11) and the semitones above it of each tone. */
export function chordOf(name: string): { root: number; tones: number[] } {
  const m = /^([A-G])([#b]?)(.*)$/.exec(name);
  const tones = m && QUALITIES[m[3]];
  if (!m || !tones) throw new Error(`Not a chord: ${name}`);
  const shift = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return { root: (NAMES[m[1]] + shift + 12) % 12, tones };
}

export const barsOf = (line: string) =>
  line
    .split('|')
    .map((b) => b.trim().split(/\s+/).filter(Boolean))
    .filter((b) => b.length > 0);

/** The lead line's notes: each note runs on through any `-` after it. */
function leadNotes(song: Song): Note[] {
  const notes: Note[] = [];
  let open: Extract<Note, { midi: number }> | null = null;
  barsOf(song.lead).forEach((tokens, b) => {
    const each = song.bar / tokens.length;
    tokens.forEach((t, i) => {
      const step = b * song.bar + i * each;
      if (t === '-') {
        if (open) open.len += each;
        return;
      }
      open = null;
      if (t === '.') return;
      open = { step, len: each, voice: 'lead', midi: midiOf(t) };
      notes.push(open);
    });
  });
  return notes;
}

/** The chords' spans: which chord sounds from which step, for how long. */
function chordSpans(song: Song) {
  return barsOf(song.chords).flatMap((names, b) => {
    const each = song.bar / names.length;
    return names.map((n, i) => ({ step: b * song.bar + i * each, len: each, ...chordOf(n) }));
  });
}

/** The bass sits from A2 up to G#3, low enough to rumble, high enough for a phone speaker. */
const bassRoot = (root: number) => 45 + ((root - 9 + 12) % 12);
/** The arpeggio runs from C5. */
const arpRoot = (root: number) => 72 + root;

function chordNotes(song: Song): Note[] {
  const notes: Note[] = [];
  for (const span of chordSpans(song)) {
    const low = bassRoot(span.root);
    const { style, every } = song.bass;
    if (style === 'hold') {
      notes.push({ step: span.step, len: span.len, voice: 'bass', midi: low });
    } else {
      for (let s = 0, i = 0; s < span.len; s += every, i++) {
        const tone =
          style === 'alt'
            ? i % 2
              ? 7
              : 0
            : style === 'octaves'
              ? i % 2
                ? 12
                : 0
              : span.tones[[0, 1, 2, 1][i % 4]];
        const len = Math.max(1, Math.min(every, span.len - s) - (style === 'walk' ? 0 : 1));
        notes.push({ step: span.step + s, len, voice: 'bass', midi: low + tone });
      }
    }
    if (song.arp > 0) {
      const tones = [...span.tones.slice(0, 3), 12];
      for (let s = 0, i = 0; s < span.len; s += song.arp, i++) {
        const midi = arpRoot(span.root) + tones[i % tones.length];
        notes.push({ step: span.step + s, len: song.arp, voice: 'arp', midi });
      }
    }
  }
  return notes;
}

function drumNotes(song: Song, length: number): Note[] {
  if (!song.drums) return [];
  const bars = barsOf(song.drums);
  const notes: Note[] = [];
  for (let b = 0; b * song.bar < length; b++) {
    const tokens = bars[b % bars.length];
    const each = song.bar / tokens.length;
    tokens.forEach((t, i) => {
      if (t !== '.')
        notes.push({ step: b * song.bar + i * each, len: each, voice: 'drum', drum: t as Drum });
    });
  }
  return notes;
}

/** Turns a song into its notes, step by step. */
export function compile(song: Song): Compiled {
  const length = barsOf(song.lead).length * song.bar;
  const steps: Note[][] = Array.from({ length }, () => []);
  for (const n of [...leadNotes(song), ...chordNotes(song), ...drumNotes(song, length)]) {
    steps[n.step].push(n);
  }
  return { stepSec: 60 / song.bpm / 4, length, loop: song.loop, leadWave: song.leadWave, steps };
}
