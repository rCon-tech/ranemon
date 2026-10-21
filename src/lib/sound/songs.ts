import type { Song } from './music';

/**
 * Every tune in the game, all original and written for it: themes for the title, the road, the
 * city, McGrattans, home, the gyms and the bike; four battle themes; and the short jingles for
 * levels, items, the pub's heal, befriending, evolving and losing.
 */
export type SongId =
  | 'title'
  | 'route'
  | 'city'
  | 'pub'
  | 'home'
  | 'gym'
  | 'bike'
  | 'wild'
  | 'trainer'
  | 'leader'
  | 'boss'
  | 'victory';

export type JingleId = 'level' | 'item' | 'heal' | 'caught' | 'evolved' | 'lose';

const ROCK = 'k . h . s . h . k . k h s . h .';
const DRIVE = 'k . h . s . h . k k h . s . h s';

export const SONGS: Record<SongId, Song> = {
  /** Bright and heroic: the start of something. */
  title: {
    bpm: 128,
    bar: 16,
    loop: true,
    leadWave: 'sq25',
    bass: { style: 'alt', every: 4 },
    arp: 2,
    drums: ROCK,
    chords: 'C | C | F | G | Am | F | G | G',
    lead: `C5 - - G4 C5 E5 G5 - | E5 - D5 C5 D5 - E5 - | F5 - - E5 F5 A5 C6 - | B5 - A5 G5 D5 - - - |
           E5 - A5 - C6 - B5 A5 | A5 - G5 F5 C5 - F5 - | G5 - - F5 E5 - D5 - | D5 - B4 - G4 - . .`,
  },

  /** The road through the counties: a jig. */
  route: {
    bpm: 180,
    bar: 12,
    loop: true,
    leadWave: 'sq25',
    bass: { style: 'alt', every: 6 },
    arp: 0,
    drums: 'k . h . h . s . h . h .',
    chords: `G | G | C | D | G | Em | Am D | G |
             C | G | Am | D | C | G | Am D | G`,
    lead: `G4 A4 B4 D5 B4 G4 | D5 E5 D5 B4 A4 G4 | E5 - C5 G5 - E5 | D5 E5 F#5 A5 F#5 D5 |
           G5 F#5 G5 D5 B4 G4 | E5 F#5 G5 B5 - G5 | A5 G5 E5 F#5 E5 D5 | G5 - D5 G4 - . |
           C6 B5 A5 G5 E5 C5 | B5 A5 G5 D5 B4 G4 | A4 C5 E5 A5 - G5 | F#5 E5 D5 A4 - D5 |
           E5 G5 C6 G5 E5 C5 | D5 G5 B5 G5 D5 B4 | C5 E5 A5 F#5 E5 D5 | G5 - - G4 - .`,
  },

  /** Dublin and Trinity: a bit of swagger. */
  city: {
    bpm: 116,
    bar: 16,
    loop: true,
    leadWave: 'sq50',
    bass: { style: 'walk', every: 2 },
    arp: 0,
    drums: 'k . h . s . h k . k h . s . h h',
    chords: 'Dm7 | G7 | Dm7 | G7 | Bbmaj7 | A7 | Dm7 | A7',
    lead: `D5 - F5 A5 - G5 F5 - | . . B4 D5 F5 - E5 D5 | C5 - D5 - A4 - F4 A4 | B4 - D5 - G5 - - . |
           A5 - F5 D5 Bb4 - D5 F5 | E5 - C#5 E5 A5 - G5 - | F5 - E5 D5 A4 - D5 - | C#5 - E5 - A4 - . .`,
  },

  /** McGrattans: a reel, with the fiddle on the thin pulse. */
  pub: {
    bpm: 190,
    bar: 16,
    loop: true,
    leadWave: 'sq12',
    bass: { style: 'alt', every: 4 },
    arp: 0,
    drums: 'k . h h s . h h k . h h s . h h',
    chords: 'D | D | G | A | D | Bm | G A | D',
    lead: `D5 F#5 A5 F#5 D5 F#5 A5 F#5 | B5 A5 F#5 A5 D6 A5 F#5 D5 | G5 B5 D6 B5 G5 F#5 E5 D5 |
           C#5 E5 A5 E5 C#5 B4 A4 C#5 | D5 E5 F#5 D5 A5 F#5 D5 F#5 | B5 F#5 D5 F#5 B4 D5 F#5 D5 |
           G5 F#5 E5 D5 C#5 E5 A5 G5 | F#5 D5 A4 F#4 D4 - - .`,
  },

  /** Home, the shop and quiet rooms. */
  home: {
    bpm: 92,
    bar: 16,
    loop: true,
    leadWave: 'sq50',
    bass: { style: 'alt', every: 4 },
    arp: 2,
    drums: 'h . . . . . h . h . . . . . h .',
    chords: 'F | Dm | Bb | C | F | Am | Bb C | F',
    lead: `A4 - C5 - F5 - E5 - | D5 - - C5 A4 - - - | Bb4 - D5 - F5 - D5 - | E5 - - - G5 - . . |
           A5 - G5 F5 C5 - F5 - | E5 - C5 - A4 - C5 - | D5 - Bb4 - C5 - E5 - | F5 - - - - - . .`,
  },

  /** Inside a gym, before the leader. */
  gym: {
    bpm: 132,
    bar: 16,
    loop: true,
    leadWave: 'sq25',
    bass: { style: 'octaves', every: 2 },
    arp: 0,
    drums: 'k . h . s . h . k . h . s . h k',
    chords: 'Em | C | D | B7 | Em | C | Am | B7',
    lead: `E5 - B4 - E5 G5 - F#5 | E5 - - - C5 - E5 - | F#5 - D5 - A5 - F#5 - | D#5 - - - B4 - - - |
           G5 - F#5 E5 B5 - G5 - | A5 - G5 E5 C5 - E5 - | C6 - B5 A5 E5 - A5 - | F#5 - D#5 - B4 - . .`,
  },

  /** On the bike, or a Lime. */
  bike: {
    bpm: 150,
    bar: 16,
    loop: true,
    leadWave: 'sq25',
    bass: { style: 'octaves', every: 2 },
    arp: 1,
    drums: 'k . h k s . h . k . h k s . h h',
    chords: 'A | E | F#m | D | A | E | D E | A',
    lead: `C#5 - E5 - A5 - E5 C#5 | B4 - E5 - G#5 - B5 - | A5 - F#5 - C#5 - F#5 A5 | F#5 - - E5 D5 - A4 - |
           C#6 - B5 A5 E5 - A5 - | G#5 - E5 - B4 - E5 - | F#5 - A5 - G#5 - B5 - | A5 - - - E5 - C#5 -`,
  },

  /** A wild Ranemon. */
  wild: {
    bpm: 168,
    bar: 16,
    loop: true,
    leadWave: 'sq25',
    bass: { style: 'octaves', every: 1 },
    arp: 1,
    drums: DRIVE,
    chords: 'Am | Am | F | G | Am | Am | F | E',
    lead: `A5 - E5 - A5 B5 C6 - | B5 A5 G5 - E5 - - - | F5 - A5 - C6 - A5 - | B5 - - G5 D5 - G5 - |
           C6 - B5 A5 E5 - A5 - | G5 - E5 - C5 - E5 - | F5 - E5 F5 A5 - C6 - | B5 - G#5 - E5 - - -`,
  },

  /** A trainer, and the rival in battle mode. */
  trainer: {
    bpm: 176,
    bar: 16,
    loop: true,
    leadWave: 'sq25',
    bass: { style: 'octaves', every: 1 },
    arp: 1,
    drums: DRIVE,
    chords: 'Em | D | C | B | Em | D | C | B7',
    lead: `E5 - G5 - B5 - G5 E5 | F#5 - A5 - D6 - A5 - | G5 - E5 - C5 - E5 G5 | F#5 - - - D#5 - B4 - |
           B5 - A5 G5 F#5 - E5 - | A5 - G5 F#5 D5 - F#5 - | G5 - F#5 E5 C6 - B5 - | A5 - F#5 - D#5 - B4 -`,
  },

  /** A gym leader. */
  leader: {
    bpm: 184,
    bar: 16,
    loop: true,
    leadWave: 'sq12',
    bass: { style: 'octaves', every: 1 },
    arp: 1,
    drums: 'k . h k s . h . k k h . s . s s',
    chords: 'Dm | Bb | C | A | Dm | Bb | Gm | A7',
    lead: `D5 - A4 - F4 - A4 D5 | F5 - - D5 Bb4 - F4 - | G4 - E4 - C5 - E5 G5 | A5 - - - C#5 - E5 - |
           F5 - E5 D5 A4 - D5 - | D5 - C5 Bb4 F4 - Bb4 - | Bb4 - A4 G4 D5 - G5 - | A5 - C#5 - E5 - G5 -`,
  },

  /** B&S under the Campanile, the legend, and Poseidon. */
  boss: {
    bpm: 160,
    bar: 16,
    loop: true,
    leadWave: 'sq50',
    bass: { style: 'octaves', every: 1 },
    arp: 1,
    drums: 'k . h . s . h k k . h . s . t t',
    chords: 'Cm | Ab | Bb | G | Cm | Ab | Fm | G7',
    lead: `C5 - Eb5 - G5 - C6 - | Bb5 - Ab5 - Eb5 - C5 - | D5 - F5 - Bb5 - F5 - | G5 - - - B4 - D5 - |
           Eb5 - D5 C5 G5 - Eb5 - | Ab5 - G5 F5 Eb5 - C5 - | F5 - Ab5 - C6 - Ab5 - | B5 - G5 - F5 - D5 -`,
  },

  /** After a win. */
  victory: {
    bpm: 132,
    bar: 16,
    loop: true,
    leadWave: 'sq25',
    bass: { style: 'alt', every: 4 },
    arp: 2,
    drums: 'k . h . s . h . k . h . s . h .',
    chords: 'G | C | D | G | Em | C | D | G',
    lead: `G5 - D5 - G5 - B5 - | C6 - B5 A5 G5 - E5 - | F#5 - A5 - D6 - A5 - | B5 - - - G5 - - - |
           E5 - G5 - B5 - G5 - | C6 - G5 - E5 - C5 - | D5 - F#5 - A5 - C6 - | B5 - - - G5 - . .`,
  },
};

export const JINGLES: Record<JingleId, Song> = {
  level: {
    bpm: 150,
    bar: 16,
    loop: false,
    leadWave: 'sq25',
    bass: { style: 'hold', every: 16 },
    arp: 0,
    chords: 'G | C D | G',
    lead: 'D5 G5 B5 D6 - - B5 D6 | E6 - - - F#6 - - - | G6 - - - - - . .',
  },
  item: {
    bpm: 150,
    bar: 16,
    loop: false,
    leadWave: 'sq25',
    bass: { style: 'hold', every: 16 },
    arp: 0,
    chords: 'C | F G | C',
    lead: 'G4 C5 E5 G5 - - E5 G5 | A5 - - - B5 - - - | C6 - - - - - . .',
  },
  heal: {
    bpm: 120,
    bar: 16,
    loop: false,
    leadWave: 'sq12',
    bass: { style: 'hold', every: 16 },
    arp: 0,
    chords: 'C | G C',
    lead: 'C5 - E5 - G5 - C6 - | B5 - D6 - C6 - - .',
  },
  caught: {
    bpm: 140,
    bar: 16,
    loop: false,
    leadWave: 'sq25',
    bass: { style: 'hold', every: 16 },
    arp: 2,
    chords: 'G | C | D | G',
    lead: 'G4 B4 D5 G5 - D5 G5 - | E5 - G5 - C6 - - - | A5 - F#5 - D5 - A5 - | G5 - - - - - . .',
  },
  evolved: {
    bpm: 132,
    bar: 16,
    loop: false,
    leadWave: 'sq25',
    bass: { style: 'hold', every: 16 },
    arp: 2,
    chords: 'F | G | Am F | G C',
    lead: 'C5 F5 A5 C6 - - A5 C6 | D6 - B5 - G5 - B5 D6 | E6 - - C6 - - . . | D6 - - - C6 - . .',
  },
  lose: {
    bpm: 90,
    bar: 16,
    loop: false,
    leadWave: 'sq50',
    bass: { style: 'hold', every: 16 },
    arp: 0,
    chords: 'Am | F E | Am',
    lead: 'E5 - - D5 C5 - - B4 | A4 - - - G#4 - - - | A4 - - - - - . .',
  },
};
