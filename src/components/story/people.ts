import type { Dir, Look } from '@/lib/story/world';
import { INK } from './pixels';

/**
 * The overworld's people, drawn in code like the 5th generation's chibi sprites: a big head with
 * a face, hair and hat, a jacket or outfit with sleeves and hands, legs and shoes, shaded, with a
 * dark outline all round. Each sprite is 16 × 24 world pixels, drawn at twice that.
 */

/** Device pixels: 32 wide and 48 tall. */
export const PERSON_W = 32;
export const PERSON_H = 48;

type Hair = 'short' | 'spiky' | 'long' | 'balding' | 'slick' | 'bun' | 'bouffant' | 'bob' | 'none';
type Hat = 'cap' | 'flat' | 'garda' | 'mortar' | 'beanie';
type Top = 'jacket' | 'suit' | 'hivis' | 'gown' | 'jumper' | 'shirt' | 'waistcoat' | 'coat';

export interface Style {
  skin: string;
  hair: string;
  hairStyle: Hair;
  hat?: { kind: Hat; colour: string; trim?: string };
  top: string;
  topKind: Top;
  /** Collar, cuffs, zip or stripe. */
  trim: string;
  legs: string;
  shoes: string;
  tie?: string;
  glasses?: 'glasses' | 'shades';
  bag?: string;
  /** Carried at the side, on the arm. */
  handbag?: string;
  /** A skirt over the top of the legs, which are then tights. */
  skirt?: string;
  pearls?: boolean;
  earrings?: string;
  /** A canvas tote bag over the shoulder, with a badge on it. */
  tote?: string;
  /** Little badges pinned on the front. */
  badges?: string[];
  /** A walking stick, in the near hand. */
  stick?: string;
  /** A ring through the nose. */
  nosering?: boolean;
}

const SKIN = '#f8d0a8';

export const STYLES: Record<Look | 'player', Style> = {
  // A red and white cap, brown hair, a blue jacket with white trim: the 5th generation's hero.
  player: {
    skin: SKIN,
    hair: '#6a3a1e',
    hairStyle: 'spiky',
    hat: { kind: 'cap', colour: '#e03c3a', trim: '#f8f8f8' },
    top: '#2f6ad0',
    topKind: 'jacket',
    trim: '#f4f4f4',
    legs: '#283048',
    shoes: '#d03030',
    bag: '#303848',
  },
  mam: {
    skin: SKIN,
    hair: '#8a4a22',
    hairStyle: 'long',
    top: '#e87898',
    topKind: 'jumper',
    trim: '#f8c0d0',
    legs: '#58607c',
    shoes: '#5a3a2a',
  },
  // The President: white hair, dark suit, a red tie.
  higgins: {
    skin: SKIN,
    hair: '#f0f0f0',
    hairStyle: 'balding',
    top: '#2c3040',
    topKind: 'suit',
    trim: '#f4f4f4',
    tie: '#c83030',
    legs: '#262a36',
    shoes: '#18181c',
    glasses: 'glasses',
  },
  // The rival: Margaret Thatcher. The hair that never moved, pearls, a royal blue suit and
  // the handbag.
  rival: {
    skin: '#f8d8b8',
    hair: '#d8c8a0',
    hairStyle: 'bouffant',
    top: '#1f4fa8',
    topKind: 'suit',
    trim: '#f4f4f4',
    tie: '#1f4fa8',
    legs: '#e8c8a8',
    shoes: '#1c2848',
    skirt: '#1f4fa8',
    handbag: '#141418',
    pearls: true,
  },
  farmer: {
    skin: SKIN,
    hair: '#8a8078',
    hairStyle: 'short',
    hat: { kind: 'flat', colour: '#7a6a50' },
    top: '#5a6a3a',
    topKind: 'coat',
    trim: '#8a7a4a',
    legs: '#4a3a2a',
    shoes: '#2a4a2a',
  },
  // A county jersey.
  lad: {
    skin: SKIN,
    hair: '#6a4a2a',
    hairStyle: 'short',
    top: '#f0a020',
    topKind: 'shirt',
    trim: '#2f8a4a',
    legs: '#3a4a6a',
    shoes: '#f4f4f4',
  },
  leader: {
    skin: SKIN,
    hair: '#202020',
    hairStyle: 'slick',
    top: '#c83030',
    topKind: 'jacket',
    trim: '#f8d048',
    legs: '#202028',
    shoes: '#f4f4f4',
  },
  trainer: {
    skin: SKIN,
    hair: '#8a5a30',
    hairStyle: 'short',
    hat: { kind: 'beanie', colour: '#4a90d8' },
    top: '#3a78c8',
    topKind: 'jacket',
    trim: '#f4f4f4',
    legs: '#3a3a48',
    shoes: '#e8a020',
    bag: '#c84a30',
  },
  // An Garda Síochána: peaked cap, hi-vis over the navy.
  guard: {
    skin: SKIN,
    hair: '#3a2a1a',
    hairStyle: 'short',
    hat: { kind: 'garda', colour: '#1c2848', trim: '#e8c040' },
    top: '#d8e030',
    topKind: 'hivis',
    trim: '#c8ccd4',
    legs: '#1c2848',
    shoes: '#141418',
  },
  scholar: {
    skin: SKIN,
    hair: '#4a3a30',
    hairStyle: 'short',
    hat: { kind: 'mortar', colour: '#202020', trim: '#e8c040' },
    top: '#202024',
    topKind: 'gown',
    trim: '#f4f4f4',
    legs: '#202020',
    shoes: '#141418',
    glasses: 'glasses',
  },
  bns: {
    skin: '#f0c098',
    hair: '#202020',
    hairStyle: 'slick',
    top: '#202024',
    topKind: 'suit',
    trim: '#f4f4f4',
    tie: '#202024',
    legs: '#2a2a34',
    shoes: '#101014',
    glasses: 'shades',
  },
  local: {
    skin: SKIN,
    hair: '#c06a30',
    hairStyle: 'short',
    top: '#58a058',
    topKind: 'jumper',
    trim: '#88c888',
    legs: '#5a6a8a',
    shoes: '#5a3a2a',
  },
  // Dua Lipa, pulling pints in McGrattans: long black hair, gold hoops, a black top.
  barman: {
    skin: '#f0c8a0',
    hair: '#141418',
    hairStyle: 'long',
    top: '#18181c',
    topKind: 'shirt',
    trim: '#d4a838',
    legs: '#202028',
    shoes: '#101014',
    earrings: '#f0c040',
  },
  // Saoirse, the Tipperary gym leader: a blue bob with a straight fringe, round glasses, a nose
  // ring, an oversized green cardigan covered in badges, a tote bag and Docs.
  saoirse: {
    skin: '#f8d8c0',
    hair: '#3aa8e8',
    hairStyle: 'bob',
    top: '#4a9a6a',
    topKind: 'jumper',
    trim: '#f0e0b0',
    legs: '#2a2a38',
    shoes: '#5a1a22',
    glasses: 'glasses',
    earrings: '#c8ccd4',
    tote: '#ece0c4',
    badges: ['#e83a8a', '#f8d048', '#9b7be8'],
    nosering: true,
  },
  // The old man in Thurles, a retired donkey vet: flat cap, tweed jacket, a blackthorn stick.
  oldman: {
    skin: '#f0c8a8',
    hair: '#e8e8e8',
    hairStyle: 'balding',
    hat: { kind: 'flat', colour: '#6a5a48' },
    top: '#8a7458',
    topKind: 'coat',
    trim: '#5a4a38',
    legs: '#4a4038',
    shoes: '#2a2018',
    glasses: 'glasses',
    stick: '#3a2a1a',
  },
  shopkeeper: {
    skin: SKIN,
    hair: '#c8c8c8',
    hairStyle: 'short',
    top: '#2f8a4a',
    topKind: 'coat',
    trim: '#f4f4f4',
    legs: '#3a3a48',
    shoes: '#2a2a30',
    glasses: 'glasses',
  },
};

/** A Ranemon's body below its photo head: a little round body in its colour. */
export const monStyle = (colour: string): Style => ({
  skin: colour,
  hair: colour,
  hairStyle: 'none',
  top: colour,
  topKind: 'shirt',
  trim: colour,
  legs: shade(colour, 0.6),
  shoes: shade(colour, 0.45),
});

/** Shifts a hex colour toward black (k < 1) or white (k > 1). */
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) =>
    Math.round(k < 1 ? v * k : v + (255 - v) * (k - 1))
      .toString(16)
      .padStart(2, '0');
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

type Ctx = CanvasRenderingContext2D;

function px(c: Ctx, x: number, y: number, w: number, h: number, colour: string) {
  if (w <= 0 || h <= 0) return;
  c.fillStyle = colour;
  c.fillRect(x, y, w, h);
}

/** A rectangle with rounded corners, in hard pixels. */
function round(c: Ctx, x: number, y: number, w: number, h: number, r: number, colour: string) {
  c.fillStyle = colour;
  for (let i = 0; i < h; i++) {
    const d = i < r ? r - i - 0.5 : i >= h - r ? i - (h - r) + 0.5 : 0;
    const inset = d > 0 ? Math.round(r - Math.sqrt(Math.max(0, r * r - d * d))) : 0;
    c.fillRect(x + inset, y + i, w - inset * 2, 1);
  }
}

/** A dark line round everything drawn, one device pixel wide. */
function outline(c: Ctx) {
  const img = c.getImageData(0, 0, PERSON_W, PERSON_H);
  const d = img.data;
  const solid = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < PERSON_W && y < PERSON_H && d[(y * PERSON_W + x) * 4 + 3] > 0;
  const edge: number[] = [];
  for (let y = 0; y < PERSON_H; y++)
    for (let x = 0; x < PERSON_W; x++)
      if (
        !solid(x, y) &&
        (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))
      )
        edge.push(x, y);
  const n = parseInt(INK.slice(1), 16);
  for (let i = 0; i < edge.length; i += 2) {
    const at = (edge[i + 1] * PERSON_W + edge[i]) * 4;
    d[at] = n >> 16;
    d[at + 1] = (n >> 8) & 255;
    d[at + 2] = n & 255;
    d[at + 3] = 255;
  }
  c.putImageData(img, 0, 0);
}

type Side = 'down' | 'up' | 'left';

/** Legs and shoes. `step` is -1, 0 or 1: which foot is forward. */
function legs(c: Ctx, s: Style, side: Side, step: number) {
  legPairs(c, s, side, step);
  if (s.skirt) {
    if (side === 'left') round(c, 11, 34, 11, 7, 2, s.skirt);
    else round(c, 9, 34, 14, 7, 2, s.skirt);
  }
}

function legPairs(c: Ctx, s: Style, side: Side, step: number) {
  const dark = shade(s.legs, 0.75);
  if (side === 'left') {
    // Seen from the side, the legs scissor.
    const front = 13 - step * 3;
    const back = 15 + step * 3;
    px(c, back, 37, 4, 7, dark);
    px(c, back - 1, 43, 6, 3, shade(s.shoes, 0.75));
    px(c, front, 37, 4, 7, s.legs);
    px(c, front - 2, 43, 6, 3, s.shoes);
    px(c, front - 2, 43, 6, 1, shade(s.shoes, 1.3));
    return;
  }
  const lift = (foot: number) => (step === foot ? 2 : 0);
  for (const [x, foot] of [
    [11, -1],
    [17, 1],
  ] as const) {
    const up = lift(foot);
    px(c, x, 37, 4, 7 - up, s.legs);
    px(c, x + 3, 37, 1, 7 - up, dark);
    px(c, x - 1, 43 - up, 6, 3, s.shoes);
    px(c, x - 1, 43 - up, 6, 1, shade(s.shoes, 1.3));
  }
}

/** The torso and arms, in the outfit's cut. */
function body(c: Ctx, s: Style, side: Side, step: number) {
  const dark = shade(s.top, 0.75);
  const light = shade(s.top, 1.25);
  if (side === 'left') {
    if (s.bag) round(c, 19, 26, 6, 10, 2, s.bag);
    round(c, 11, 25, 11, s.topKind === 'gown' ? 18 : 13, 3, s.top);
    px(c, 20, 26, 2, 11, dark);
    px(c, 12, 26, 2, 6, light);
    if (s.topKind === 'hivis') {
      px(c, 11, 30, 11, 2, s.trim);
      px(c, 11, 34, 11, 2, s.trim);
    }
    if (s.topKind === 'suit' || s.topKind === 'waistcoat') px(c, 11, 26, 3, 6, s.trim);
    if (s.topKind === 'jacket') px(c, 11, 25, 5, 2, s.trim);
    // The near arm swings with the step.
    const ax = 14 - step * 2;
    const sleeve = s.topKind === 'waistcoat' ? s.trim : s.top;
    px(c, ax, 26, 4, 9, sleeve);
    px(c, ax + 3, 26, 1, 9, shade(sleeve, 0.75));
    px(c, ax, 35, 4, 3, s.skin);
    if (s.handbag) handbag(c, s.handbag, ax - 2, 33);
    if (s.tote) round(c, 18, 31, 7, 8, 1, s.tote);
    if (s.badges) px(c, 13, 28, 2, 2, s.badges[0]);
    if (s.stick) px(c, ax, 37, 1, 10, s.stick);
    if (s.pearls) for (let x = 7; x < 14; x += 2) px(c, x, 25, 1, 1, '#f8f4ec');
    return;
  }
  const back = side === 'up';
  if (s.bag && back) round(c, 10, 26, 12, 11, 3, s.bag);
  round(c, 9, 25, 14, s.topKind === 'gown' ? 18 : 13, 3, s.top);
  px(c, 21, 26, 2, 11, dark);
  px(c, 10, 26, 2, 5, light);
  px(c, 9, 36, 14, 1, dark);
  if (s.bag && back) {
    round(c, 10, 27, 12, 10, 3, s.bag);
    px(c, 11, 28, 10, 2, shade(s.bag, 1.3));
  }
  if (!back) {
    switch (s.topKind) {
      case 'jacket':
        px(c, 15, 27, 2, 10, s.trim);
        px(c, 11, 25, 10, 2, s.trim);
        if (s.bag) px(c, 11, 26, 2, 10, s.bag);
        break;
      case 'suit':
        px(c, 13, 25, 6, 5, s.trim);
        px(c, 15, 26, 2, 7, s.tie ?? s.trim);
        break;
      case 'waistcoat':
        px(c, 13, 25, 6, 12, s.trim);
        px(c, 15, 27, 2, 1, s.top);
        px(c, 15, 30, 2, 1, s.top);
        break;
      case 'hivis':
        px(c, 9, 30, 14, 2, s.trim);
        px(c, 9, 34, 14, 2, s.trim);
        px(c, 15, 25, 2, 12, shade(s.top, 0.85));
        break;
      case 'gown':
        px(c, 13, 25, 6, 4, s.trim);
        px(c, 15, 29, 2, 13, shade(s.top, 1.4));
        break;
      case 'jumper':
        px(c, 9, 35, 14, 2, s.trim);
        px(c, 13, 25, 6, 2, s.trim);
        break;
      case 'coat':
        px(c, 15, 26, 1, 12, dark);
        px(c, 12, 29, 2, 1, s.trim);
        px(c, 12, 33, 2, 1, s.trim);
        px(c, 12, 25, 8, 2, s.trim);
        break;
      case 'shirt':
        px(c, 13, 25, 6, 2, s.trim);
        px(c, 9, 29, 14, 2, s.trim);
        break;
    }
  }
  // Arms swing a little, opposite the legs.
  const sleeve = s.topKind === 'waistcoat' ? s.trim : s.top;
  for (const [x, foot] of [
    [6, -1],
    [23, 1],
  ] as const) {
    const swing = step === 0 ? 0 : step === foot ? 1 : -1;
    px(c, x, 26 + swing, 3, 9, sleeve);
    px(c, x + (x < 15 ? 0 : 2), 26 + swing, 1, 9, shade(sleeve, 0.75));
    if (s.topKind === 'jacket' || s.topKind === 'hivis') px(c, x, 33 + swing, 3, 1, s.trim);
    px(c, x, 35 + swing, 3, 3, s.skin);
  }
  if (s.pearls && !back)
    for (let x = 11; x < 22; x += 2) px(c, x, 25 + (x > 13 && x < 19 ? 1 : 0), 1, 1, '#f8f4ec');
  if (s.handbag && !back) handbag(c, s.handbag, 23, 32 + (step === 1 ? 1 : step === -1 ? -1 : 0));
  if (s.tote) {
    // The strap across the shoulder and the bag at the hip.
    if (!back) for (let i = 0; i < 9; i++) px(c, 11 + i, 25 + i, 1, 1, shade(s.tote, 0.8));
    round(c, back ? 5 : 21, 31, 7, 8, 1, s.tote);
    px(c, back ? 6 : 22, 32, 5, 1, shade(s.tote, 1.1));
    if (!back) px(c, 23, 34, 3, 3, '#e83a8a');
  }
  if (s.badges && !back) s.badges.forEach((b, i) => px(c, 17 + (i % 2) * 2, 28 + i * 2, 2, 2, b));
  if (s.stick && !back) {
    px(c, 7, 36, 1, 11, s.stick);
    px(c, 6, 35, 3, 1, s.stick);
  }
}

/** A stiff little handbag with a clasp, hung from the arm. */
function handbag(c: Ctx, colour: string, x: number, y: number) {
  px(c, x + 1, y - 2, 4, 1, colour);
  px(c, x, y - 1, 1, 2, colour);
  px(c, x + 5, y - 1, 1, 2, colour);
  round(c, x - 1, y + 1, 8, 7, 2, colour);
  px(c, x, y + 2, 6, 1, shade(colour, 1.6));
  px(c, x + 2, y + 1, 2, 1, '#e8c040');
}

function hairBack(c: Ctx, s: Style, side: Side) {
  if (s.hairStyle === 'bouffant')
    round(c, side === 'left' ? 5 : 2, 1, side === 'left' ? 24 : 28, 21, 10, s.hair);
  if (s.hairStyle === 'long')
    round(c, side === 'left' ? 9 : 4, 8, side === 'left' ? 19 : 24, 24, 7, s.hair);
  if (s.hairStyle === 'bob')
    round(c, side === 'left' ? 8 : 3, 6, side === 'left' ? 21 : 26, 18, 5, s.hair);
}

/** The head: hair, face and hat, for each facing. */
function head(c: Ctx, s: Style, side: Side) {
  const hairDark = shade(s.hair, 0.72);
  const hairLight = shade(s.hair, 1.3);
  const skinDark = shade(s.skin, 0.86);
  const bald = s.hairStyle === 'balding' || s.hairStyle === 'none';
  if (side === 'up') {
    round(c, 4, 3, 24, 23, 9, bald ? s.skin : s.hair);
    if (bald && s.hairStyle === 'balding') round(c, 4, 12, 24, 13, 6, s.hair);
    px(c, 12, 23, 8, 2, skinDark);
    px(c, 8, 6, 8, 2, hairLight);
    px(c, 24, 10, 2, 12, hairDark);
  } else if (side === 'down') {
    round(c, 4, 3, 24, 23, 9, bald ? s.skin : s.hair);
    round(c, 7, 9, 18, 16, 6, s.skin);
    px(c, 5, 15, 2, 5, s.skin);
    px(c, 25, 15, 2, 5, s.skin);
    if (s.hairStyle === 'balding') {
      px(c, 4, 11, 4, 9, s.hair);
      px(c, 24, 11, 4, 9, s.hair);
    } else if (!bald) {
      // A fringe, ragged along the bottom.
      for (let x = 7; x < 25; x++) {
        const drop = s.hairStyle === 'slick' ? 0 : (x * 5) % 3;
        px(c, x, 8, 1, 3 + drop, s.hair);
      }
      px(c, 5, 10, 2, 6, s.hair);
      px(c, 25, 10, 2, 6, s.hair);
      px(c, 9, 5, 7, 2, hairLight);
    }
    px(c, 8, 11, 16, 1, skinDark);
    // Eyes with a shine, brows, cheeks and a small mouth.
    for (const x of [10, 19]) {
      px(c, x, 15, 3, 1, s.hairStyle === 'none' ? INK : hairDark);
      px(c, x, 16, 3, 4, '#283048');
      px(c, x, 16, 1, 1, '#ffffff');
    }
    px(c, 8, 20, 2, 1, '#f0a090');
    px(c, 22, 20, 2, 1, '#f0a090');
    px(c, 15, 22, 2, 1, '#b85a50');
    if (s.glasses === 'shades') px(c, 9, 15, 14, 4, '#141418');
    if (s.glasses === 'glasses') {
      for (const x of [9, 18]) {
        px(c, x, 15, 5, 1, INK);
        px(c, x, 19, 5, 1, INK);
        px(c, x, 15, 1, 5, INK);
        px(c, x + 4, 15, 1, 5, INK);
      }
      px(c, 14, 16, 4, 1, INK);
    }
  } else {
    // Facing left: the face on the left, the hair round the back.
    round(c, 5, 3, 23, 23, 9, bald ? s.skin : s.hair);
    round(c, 5, 9, 14, 16, 5, s.skin);
    px(c, 3, 17, 2, 3, s.skin);
    px(c, 18, 15, 3, 5, skinDark);
    if (s.hairStyle === 'balding') round(c, 15, 10, 12, 12, 4, s.hair);
    else if (!bald) {
      for (let x = 6; x < 19; x++) px(c, x, 8, 1, 2 + ((x * 5) % 3), s.hair);
      px(c, 8, 5, 6, 2, hairLight);
      px(c, 24, 10, 3, 12, hairDark);
    }
    px(c, 7, 15, 3, 1, s.hairStyle === 'none' ? INK : hairDark);
    px(c, 7, 16, 3, 4, '#283048');
    px(c, 7, 16, 1, 1, '#ffffff');
    px(c, 6, 20, 2, 1, '#f0a090');
    px(c, 6, 22, 2, 1, '#b85a50');
    if (s.glasses === 'shades') px(c, 4, 15, 9, 4, '#141418');
    if (s.glasses === 'glasses') {
      px(c, 5, 15, 7, 1, INK);
      px(c, 5, 19, 7, 1, INK);
      px(c, 11, 15, 1, 5, INK);
      px(c, 12, 16, 7, 1, INK);
    }
  }
  if (s.hairStyle === 'spiky') {
    const spikes = side === 'left' ? [10, 16, 22, 27] : [6, 12, 18, 24];
    for (const x of spikes) {
      px(c, x, 2, 3, 3, s.hair);
      px(c, x + 1, 0, 1, 2, s.hair);
    }
  }
  if (s.hairStyle === 'bun') round(c, 12, 0, 8, 6, 3, s.hair);
  if (s.hairStyle === 'bob' && side !== 'up') {
    // A blunt fringe straight across, and a lighter streak.
    if (side === 'down') {
      px(c, 7, 8, 18, 5, s.hair);
      px(c, 7, 12, 18, 1, shade(s.hair, 0.72));
      px(c, 3, 10, 4, 13, s.hair);
      px(c, 25, 10, 4, 13, s.hair);
      px(c, 11, 4, 3, 8, shade(s.hair, 1.45));
    } else {
      px(c, 5, 8, 14, 5, s.hair);
      px(c, 5, 12, 14, 1, shade(s.hair, 0.72));
      px(c, 18, 9, 9, 14, s.hair);
      px(c, 9, 4, 3, 8, shade(s.hair, 1.45));
    }
  }
  if (s.hairStyle === 'bob' && side === 'up') round(c, 3, 3, 26, 21, 6, s.hair);
  if (s.nosering && side === 'down') px(c, 15, 21, 2, 1, '#c8ccd4');
  if (s.nosering && side === 'left') px(c, 4, 20, 1, 1, '#c8ccd4');
  if (s.hairStyle === 'bouffant' && side !== 'up') {
    // The famous set: a swept wave of hair over the forehead.
    round(c, side === 'left' ? 4 : 5, 2, side === 'left' ? 20 : 22, 9, 5, s.hair);
    px(c, side === 'left' ? 7 : 9, 4, 10, 2, shade(s.hair, 1.3));
    px(c, side === 'left' ? 6 : 8, 9, 12, 1, shade(s.hair, 0.8));
  }
  if (s.hairStyle === 'bouffant' && side === 'up') round(c, 2, 1, 28, 23, 10, s.hair);
  if (s.earrings && side !== 'up') {
    for (const x of side === 'left' ? [19] : [4, 26]) {
      px(c, x, 20, 2, 1, s.earrings);
      px(c, x - 1, 21, 1, 2, s.earrings);
      px(c, x + 2, 21, 1, 2, s.earrings);
      px(c, x, 23, 2, 1, s.earrings);
    }
  }
  if (s.hat) hat(c, s, side);
}

function hat(c: Ctx, s: Style, side: Side) {
  const { kind, colour, trim } = s.hat!;
  const dark = shade(colour, 0.7);
  const light = shade(colour, 1.3);
  const left = side === 'left';
  switch (kind) {
    case 'cap':
      round(c, 5, 1, 22, 11, 7, colour);
      if (trim) {
        // A white front panel with a little badge, like the hero's.
        if (side === 'down') {
          round(c, 9, 2, 14, 8, 4, trim);
          px(c, 14, 5, 4, 3, colour);
        } else if (left) round(c, 6, 2, 10, 8, 4, trim);
      }
      px(c, 8, 2, 6, 1, light);
      if (side === 'down') px(c, 6, 10, 20, 3, dark);
      if (left) px(c, 0, 10, 10, 3, dark);
      if (side === 'up') {
        px(c, 13, 9, 6, 2, s.hair);
        px(c, 12, 8, 8, 1, dark);
      }
      break;
    case 'flat':
      round(c, 4, 4, 24, 8, 4, colour);
      for (let x = 6; x < 26; x += 3) px(c, x, 6, 1, 4, dark);
      if (side === 'down') px(c, 6, 11, 20, 2, dark);
      if (left) px(c, 1, 10, 10, 2, dark);
      break;
    case 'garda':
      round(c, 3, 1, 26, 9, 4, colour);
      px(c, 5, 8, 22, 2, '#101418');
      if (side !== 'up') px(c, 14, 3, 4, 4, trim ?? '#e8c040');
      if (side === 'down') px(c, 7, 10, 18, 3, '#101418');
      if (left) px(c, 0, 10, 10, 3, '#101418');
      break;
    case 'mortar':
      round(c, 6, 3, 20, 8, 3, colour);
      px(c, 1, 1, 30, 3, colour);
      px(c, 1, 1, 30, 1, light);
      px(c, left ? 24 : 22, 2, 1, 9, trim ?? '#e8c040');
      break;
    case 'beanie':
      round(c, 5, 1, 22, 10, 7, colour);
      px(c, 5, 9, 22, 2, dark);
      px(c, 14, 0, 4, 2, light);
      break;
  }
}

/**
 * One frame of a person. `frame` 0 and 2 stand, 1 and 3 step with each foot. Right is left,
 * mirrored. With `headless`, the head is left off, for a Ranemon's photo to go on top.
 */
export function paintPerson(
  s: Style,
  dir: Dir,
  frame: number,
  headless = false,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = PERSON_W;
  canvas.height = PERSON_H;
  const c = canvas.getContext('2d')!;
  const side: Side = dir === 'right' ? 'left' : dir;
  const step = frame === 1 ? -1 : frame === 3 ? 1 : 0;
  if (side === 'up') {
    legs(c, s, side, step);
    body(c, s, side, step);
    if (!headless) head(c, s, side);
  } else {
    if (!headless) hairBack(c, s, side);
    legs(c, s, side, step);
    body(c, s, side, step);
    if (!headless) head(c, s, side);
  }
  outline(c);
  if (dir !== 'right') return canvas;
  const flipped = document.createElement('canvas');
  flipped.width = PERSON_W;
  flipped.height = PERSON_H;
  const f = flipped.getContext('2d')!;
  f.scale(-1, 1);
  f.drawImage(canvas, -PERSON_W, 0);
  return flipped;
}
