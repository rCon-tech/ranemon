import type { Dir, Look } from '@/lib/story/world';

/**
 * The overworld's people, as text: one character per pixel on a 16×16 grid, `0` for the
 * outline and `.` for clear, with letters for the parts that change between them (hair, skin,
 * clothes, trousers), filled in per look. The tiles are drawn in code, in tiles.ts.
 */

export const TILE = 16;
/** Outlines, and the overworld's own text and markers. */
export const INK = '#283038';
export const LIGHT = '#ffffff';

/** What each door's building says over it. */
export const DOOR_LABEL: Record<string, string> = { P: 'McGRATTANS', M: 'VAPES', G: 'GYM' };

// ---------- people ----------

const DOWN = [
  '................',
  '.....000000.....',
  '....0hhhhhh0....',
  '...0hhhhhhhh0...',
  '...0hhhhhhhh0...',
  '...0hssssssh0...',
  '...0s0ssss0s0...',
  '....0ssssss0....',
  '.....0ssss0.....',
  '....00cccc00....',
  '...0s0cccc0s0...',
  '...0s0cccc0s0...',
  '....00cccc00....',
  '.....0pppp0.....',
  '.....0p00p0.....',
  '.....00..00.....',
];

const UP = [
  '................',
  '.....000000.....',
  '....0hhhhhh0....',
  '...0hhhhhhhh0...',
  '...0hhhhhhhh0...',
  '...0hhhhhhhh0...',
  '...0hhhhhhhh0...',
  '....0hhhhhh0....',
  '.....0ssss0.....',
  '....00cccc00....',
  '...0s0cccc0s0...',
  '...0s0cccc0s0...',
  '....00cccc00....',
  '.....0pppp0.....',
  '.....0p00p0.....',
  '.....00..00.....',
];

const LEFT = [
  '................',
  '......00000.....',
  '.....0hhhhh0....',
  '....0hhhhhhh0...',
  '....0hhhhhhh0...',
  '....0sshhhhh0...',
  '....00shhhhh0...',
  '....0sssshh0....',
  '.....0sss00.....',
  '......0cc0......',
  '.....0ccsc0.....',
  '.....0ccsc0.....',
  '.....0cccc0.....',
  '......0pp0......',
  '......0pp0......',
  '......000.......',
];

/** A step: the same body with the legs apart. */
const legs = (art: string[], rows: string[]) => [...art.slice(0, 13), ...rows];
const DOWN_STEP = legs(DOWN, ['.....0pppp0.....', '.....0p0.00.....', '.....00.........']);
const UP_STEP = legs(UP, ['.....0pppp0.....', '.....00.0p0.....', '.........00.....']);
const LEFT_STEP = legs(LEFT, ['.....0pppp0.....', '....0pp00pp0....', '....000..000....']);

const mirror = (art: string[]) => art.map((r) => [...r].reverse().join(''));

/** Frames per facing: standing, then a step. Down and up alternate feet with a mirrored step. */
export const PERSON: Record<Dir, string[][]> = {
  down: [DOWN, DOWN_STEP, DOWN, mirror(DOWN_STEP)],
  up: [UP, UP_STEP, UP, mirror(UP_STEP)],
  left: [LEFT, LEFT_STEP, LEFT, LEFT_STEP],
  right: [mirror(LEFT), mirror(LEFT_STEP), mirror(LEFT), mirror(LEFT_STEP)],
};

const SKIN = '#f8d0a8';

/** Hair, skin, clothes and trousers for each kind of person. */
export const LOOKS: Record<Look | 'player', Record<'h' | 's' | 'c' | 'p', string>> = {
  // A red cap and a blue jacket, like the 5th generation's hero.
  player: { h: '#e03c3a', s: SKIN, c: '#3878d8', p: '#283048' },
  mam: { h: '#a05828', s: SKIN, c: '#e87898', p: '#58607c' },
  higgins: { h: '#eeeeee', s: SKIN, c: '#383c48', p: '#282830' },
  rival: { h: '#f0b830', s: SKIN, c: '#38a048', p: '#283048' },
  farmer: { h: '#6a6058', s: SKIN, c: '#7a8a4a', p: '#4a3a2a' },
  lad: { h: '#6a4a2a', s: SKIN, c: '#f0a020', p: '#3a4a6a' },
  leader: { h: '#202020', s: SKIN, c: '#c83030', p: '#202028' },
  trainer: { h: '#8a5a30', s: SKIN, c: '#4a90d8', p: '#3a3a48' },
  // The Gardaí's hi-vis over navy.
  guard: { h: '#1c2848', s: SKIN, c: '#d8e030', p: '#1c2848' },
  scholar: { h: '#4a3a30', s: SKIN, c: '#202020', p: '#202020' },
  bns: { h: '#202020', s: '#f0c098', c: '#202020', p: '#3a3a48' },
  local: { h: '#a87038', s: SKIN, c: '#58a058', p: '#5a6a8a' },
  // A white shirt and black waistcoat behind the bar; a green shop coat.
  barman: { h: '#3a2a20', s: SKIN, c: '#f4f4f4', p: '#202028' },
  shopkeeper: { h: '#c8c8c8', s: SKIN, c: '#2f8a4a', p: '#3a3a48' },
};

/** Shifts a hex colour toward black (k < 1) or white (k > 1). */
function tone(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) =>
    Math.round(k < 1 ? v * k : v + (255 - v) * (k - 1))
      .toString(16)
      .padStart(2, '0');
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

/**
 * Draws a person at twice the art's resolution, shaded like the later games: each part is
 * darker along its lower right edge and lit along its upper left.
 */
export function paintPerson(art: string[], fill: Record<string, string>): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = art[0].length * 2;
  canvas.height = art.length * 2;
  const ctx = canvas.getContext('2d')!;
  const at = (x: number, y: number) => art[y]?.[x] ?? '.';
  art.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      if (ch === '0') {
        ctx.fillStyle = INK;
        ctx.fillRect(x * 2, y * 2, 2, 2);
        return;
      }
      const base = fill[ch] ?? INK;
      const edge = (c: string) => c === '0' || c === '.';
      ctx.fillStyle = base;
      ctx.fillRect(x * 2, y * 2, 2, 2);
      ctx.fillStyle = tone(base, 0.72);
      if (edge(at(x + 1, y))) ctx.fillRect(x * 2 + 1, y * 2, 1, 2);
      if (edge(at(x, y + 1))) ctx.fillRect(x * 2, y * 2 + 1, 2, 1);
      ctx.fillStyle = tone(base, 1.35);
      if (edge(at(x - 1, y)) && edge(at(x, y - 1))) ctx.fillRect(x * 2, y * 2, 1, 1);
      else if (edge(at(x, y - 1)) && ch === 'h') ctx.fillRect(x * 2, y * 2, 2, 1);
    }),
  );
  return canvas;
}
