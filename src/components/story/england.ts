import type { ClubId, Scenery } from '@/lib/story/world';
import { paintCrest } from './crests';
import { TILE } from './pixels';

/**
 * The Premier League grounds' own looks in the London expansion (premier.ts), drawn over the map
 * in world pixels, 2D only. Every club has its own part of town: its ground from the outside, drawn
 * as that stadium (Spurs' silver bowl with the cockerel on top, the Amex's arch, Old Trafford's
 * truss and Munich clock, the Etihad's money), with its name and its crest over the turnstiles,
 * and the landmarks round it, so Highbury looks like Highbury and Anfield like Anfield. The tiles
 * underneath, and so walking, doors and saves, are the same as any building's.
 */

type Ctx = CanvasRenderingContext2D;

const FONT = '"Pixelify Sans", sans-serif';

function rect(c: Ctx, x: number, y: number, w: number, h: number, colour: string) {
  c.fillStyle = colour;
  c.fillRect(x, y, w, h);
}

function text(c: Ctx, s: string, x: number, y: number, size: number, colour: string, max?: number) {
  c.font = `700 ${size}px ${FONT}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = colour;
  c.fillText(s, x, y, max);
}

/** How a ground looks from the street. */
interface Ground {
  /** The name across the front, as the club puts it, and a smaller line under it, if any. */
  name: string;
  sub?: string;
  /** What the outside is made of. */
  wall: 'brick' | 'clad' | 'glass' | 'white';
  /** The wall's colour, its trim, and the lettering. */
  main: string;
  trim: string;
  letters: string;
  /**
   * The roof: a flat cantilever, the Amex's white arch, a bowl, the Etihad's masts, a gable over
   * the middle, or the great white trusses over Old Trafford and St James' Park.
   */
  roof: 'cantilever' | 'arches' | 'bowl' | 'masts' | 'gable' | 'truss';
  floodlights?: boolean;
}

const GROUNDS: Record<ClubId, Ground> = {
  brighton: {
    name: 'THE AMEX',
    wall: 'white',
    main: '#0057b8',
    trim: '#ffffff',
    letters: '#0057b8',
    roof: 'arches',
  },
  palace: {
    name: 'SELHURST PARK',
    sub: 'HOLMESDALE ROAD',
    wall: 'brick',
    main: '#1b458f',
    trim: '#c4122e',
    letters: '#ffffff',
    roof: 'cantilever',
    floodlights: true,
  },
  villa: {
    name: 'VILLA PARK',
    sub: 'HOLTE END',
    wall: 'brick',
    main: '#670e36',
    trim: '#95bfe5',
    letters: '#fee505',
    roof: 'gable',
    floodlights: true,
  },
  everton: {
    name: 'EVERTON STADIUM',
    sub: 'BRAMLEY-MOORE DOCK',
    wall: 'brick',
    main: '#003399',
    trim: '#ffffff',
    letters: '#ffffff',
    roof: 'gable',
  },
  leeds: {
    name: 'ELLAND ROAD',
    sub: 'LEEDS UNITED',
    wall: 'clad',
    main: '#ffffff',
    trim: '#1d428a',
    letters: '#1d428a',
    roof: 'cantilever',
    floodlights: true,
  },
  newcastle: {
    name: 'ST JAMES’ PARK',
    sub: 'NEWCASTLE UNITED',
    wall: 'clad',
    main: '#241f20',
    trim: '#ffffff',
    letters: '#ffffff',
    roof: 'truss',
  },
  spurs: {
    name: 'TOTTENHAM HOTSPUR STADIUM',
    wall: 'glass',
    main: '#132257',
    trim: '#c9ccd4',
    letters: '#ffffff',
    roof: 'bowl',
  },
  city: {
    name: 'ETIHAD STADIUM',
    wall: 'clad',
    main: '#6cabdd',
    trim: '#1c2c5b',
    letters: '#1c2c5b',
    roof: 'masts',
  },
  chelsea: {
    name: 'STAMFORD BRIDGE',
    sub: 'CHELSEA FOOTBALL CLUB',
    wall: 'clad',
    main: '#034694',
    trim: '#dba111',
    letters: '#ffffff',
    roof: 'cantilever',
  },
  arsenal: {
    name: 'EMIRATES STADIUM',
    wall: 'white',
    main: '#ef0107',
    trim: '#063672',
    letters: '#ef0107',
    roof: 'bowl',
  },
  liverpool: {
    name: 'ANFIELD',
    sub: 'MAIN STAND',
    wall: 'clad',
    main: '#c8102e',
    trim: '#f6eb61',
    letters: '#ffffff',
    roof: 'cantilever',
  },
  united: {
    name: 'MANCHESTER UNITED',
    sub: 'THEATRE OF DREAMS',
    wall: 'clad',
    main: '#da291c',
    trim: '#1a1a1a',
    letters: '#ffffff',
    roof: 'truss',
  },
};

/** A floodlight pylon, its foot at (x, foot), its lamps at the top. */
function floodlight(c: Ctx, x: number, top: number, foot: number) {
  rect(c, x - 0.5, top + 4, 1, foot - top - 4, '#5a5e66');
  rect(c, x - 3.5, top, 7, 5, '#3a3e46');
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 2; j++) rect(c, x - 3 + i * 2.2, top + 0.6 + j * 2.2, 1.6, 1.6, '#fff8d0');
}

/** A brick wall, from (x, y), `w` by `h`, in the given brick colour. */
function brick(c: Ctx, x: number, y: number, w: number, h: number, base: string) {
  rect(c, x, y, w, h, base);
  c.fillStyle = 'rgb(0 0 0 / 0.18)';
  for (let row = 0; row * 2 < h; row++) {
    c.fillRect(x, y + row * 2, w, 0.4);
    for (let col = (row % 2) * 2; col < w; col += 4) c.fillRect(x + col, y + row * 2, 0.4, 2);
  }
}

/** An arched window, its top left at (x, y): a round head over dark glass. */
function arched(c: Ctx, x: number, y: number, w: number, h: number, glass = '#2a3440') {
  c.fillStyle = glass;
  c.beginPath();
  c.moveTo(x, y + h);
  c.lineTo(x, y + w / 2);
  c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
  c.lineTo(x + w, y + h);
  c.closePath();
  c.fill();
}

/** A tiny figure in a shirt, standing at (x, foot), for crowds, murals and statues. */
function figure(c: Ctx, x: number, foot: number, shirt: string, skin = '#e8c8a8', s = 1) {
  rect(c, x - 1 * s, foot - 7 * s, 2 * s, 2 * s, skin);
  rect(c, x - 1.5 * s, foot - 5 * s, 3 * s, 3 * s, shirt);
  rect(c, x - 1.5 * s, foot - 2 * s, 1.2 * s, 2 * s, '#2a2a30');
  rect(c, x + 0.3 * s, foot - 2 * s, 1.2 * s, 2 * s, '#2a2a30');
}

/** A clock face. */
function clock(c: Ctx, x: number, y: number, r: number) {
  c.fillStyle = '#f8f4e0';
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#222';
  c.lineWidth = 0.5;
  c.stroke();
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x, y - r * 0.7);
  c.moveTo(x, y);
  c.lineTo(x + r * 0.5, y);
  c.stroke();
}

/** A ground from the street: tiles x0 to x1, from the top of row y0 to the bottom of y1. */
function paintStadium(
  c: Ctx,
  now: number,
  club: ClubId,
  left: number,
  top: number,
  w: number,
  h: number,
  door: number,
) {
  if (club === 'spurs') return paintSpurs(c, left, top, w, h, door, now);
  const g = GROUNDS[club];
  const roofH = 12;
  const body = top + roofH;
  const bodyH = h - roofH;
  const base = top + h;
  // The walls.
  if (g.wall === 'brick') {
    brick(c, left, body, w, bodyH, '#9a4a36');
    rect(c, left, body + 2, w, 11, g.main);
  } else if (g.wall === 'glass') {
    rect(c, left, body, w, bodyH, '#8aa4bc');
    c.fillStyle = 'rgb(255 255 255 / 0.25)';
    for (let x = 0; x < w; x += 6) c.fillRect(left + x, body, 3, bodyH);
    rect(c, left, body + 2, w, 11, g.main);
  } else if (g.wall === 'white') {
    rect(c, left, body, w, bodyH, '#f2f4f6');
    c.fillStyle = 'rgb(0 0 0 / 0.08)';
    for (let x = 2; x < w; x += 5) c.fillRect(left + x, body, 1, bodyH);
    rect(c, left, base - 18, w, 2, g.main);
  } else {
    rect(c, left, body, w, bodyH, g.main);
    c.fillStyle = 'rgb(0 0 0 / 0.12)';
    for (let x = 2; x < w; x += 4) c.fillRect(left + x, body, 1, bodyH);
    rect(c, left, body + 13, w, 1.5, g.trim);
  }
  // The top of the stand showing under the roof: seats in the club's colour, and a crowd.
  rect(c, left, body - 3, w, 4, '#2a2a30');
  for (let x = 0; x < w; x += 2) {
    const k = (x * 7 + club.length * 13) % 5;
    rect(c, left + x, body - 2.5, 1.5, 1.2, k < 2 ? g.main : k < 4 ? '#e8c8a8' : '#ffffff');
    rect(c, left + x + 1, body - 1, 1, 1.2, k === 1 ? '#ffffff' : g.trim);
  }
  paintRoof(c, g, left, top, w, body, roofH);
  // Each ground's own look, over the plain one.
  paintOwnLook(c, club, g, left, top, w, h, body, door, now);
  if (g.floodlights || g.roof === 'cantilever' || g.roof === 'gable') {
    floodlight(c, left + 3, top - 4, body + 2);
    floodlight(c, left + w - 3, top - 4, body + 2);
  }
  // The name across the front, in the club's letters, and the line under it.
  if (g.wall === 'white') rect(c, left + 6, body + 2, w - 12, 11, '#ffffff');
  text(c, g.name, left + w / 2, body + 5.5, 7, g.letters, w - 12);
  if (g.sub) text(c, g.sub, left + w / 2, body + 11.5, 4, g.letters, w - 20);
  paintTurnstiles(c, club, g, door, base);
  // A shade along the bottom where it meets the pavement.
  rect(c, left, base - 1, w, 1, 'rgb(0 0 0 / 0.3)');
}

/** The turnstiles at the door, the crest over them, and a shade along the pavement. */
function paintTurnstiles(c: Ctx, club: ClubId, g: Ground, door: number, base: number) {
  const dy = base - TILE;
  rect(c, door + 1, dy + 3, TILE - 2, TILE - 3, '#22242a');
  for (let i = 0; i < 3; i++) rect(c, door + 3 + i * 4, dy + 6, 1, TILE - 7, '#8a8f98');
  rect(c, door + 1, dy + 3, TILE - 2, 1.5, g.trim);
  const cx = door + 8;
  const cy = base - 22;
  c.fillStyle = 'rgb(0 0 0 / 0.25)';
  c.beginPath();
  c.arc(cx, cy, 8, 0, Math.PI * 2);
  c.fill();
  paintCrest(c, club, cx, cy, 14);
}

/** The roof over the top of the stand, by kind. */
function paintRoof(
  c: Ctx,
  g: Ground,
  left: number,
  top: number,
  w: number,
  body: number,
  roofH: number,
) {
  const roofC = '#e8ebef';
  switch (g.roof) {
    case 'arches': {
      // The Amex: one great white arch along the stand, and the roof swept up under it.
      c.fillStyle = roofC;
      c.beginPath();
      c.moveTo(left, body);
      c.quadraticCurveTo(left + w / 2, top - 8, left + w, body);
      c.closePath();
      c.fill();
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(left, body);
      c.quadraticCurveTo(left + w / 2, top - 10, left + w, body);
      c.stroke();
      c.strokeStyle = '#c0c6ce';
      c.lineWidth = 0.6;
      c.beginPath();
      for (let x = 6; x < w; x += 6) {
        const t = x / w;
        c.moveTo(left + x, body);
        c.lineTo(left + x, body - 4 * t * (1 - t) * (roofH + 8) + 1);
      }
      c.stroke();
      break;
    }
    case 'bowl': {
      c.fillStyle = roofC;
      c.beginPath();
      c.moveTo(left, body + 2);
      c.quadraticCurveTo(left + 2, top, left + 16, top);
      c.lineTo(left + w - 16, top);
      c.quadraticCurveTo(left + w - 2, top, left + w, body + 2);
      c.closePath();
      c.fill();
      // The translucent edge of the roof, and the band of the club's colour under it.
      rect(c, left + 10, top + 2, w - 20, 4, 'rgb(200 220 235 / 0.8)');
      rect(c, left + 8, body - 1, w - 16, 1.5, g.main);
      break;
    }
    case 'gable': {
      rect(c, left, top + 6, w, roofH - 6, '#7c8088');
      // A gable over the middle, like the old fronts of the Holte End and the docks.
      c.fillStyle = g.wall === 'brick' ? '#9a4a36' : g.main;
      c.beginPath();
      c.moveTo(left + w / 2 - 20, body + 1);
      c.lineTo(left + w / 2, top - 2);
      c.lineTo(left + w / 2 + 20, body + 1);
      c.closePath();
      c.fill();
      c.strokeStyle = g.trim;
      c.lineWidth = 1;
      c.stroke();
      break;
    }
    case 'truss': {
      // A great white truss along the front, standing well up over the city.
      rect(c, left, top - 6, w, 5, roofC);
      rect(c, left, top - 1, w, 3, '#b8bec6');
      c.strokeStyle = '#ffffff';
      c.lineWidth = 0.8;
      c.beginPath();
      for (let x = 0; x < w; x += 10) {
        c.moveTo(left + x, top + 2);
        c.lineTo(left + x + 5, top + 10);
        c.lineTo(left + x + 10, top + 2);
      }
      c.moveTo(left, top + 10);
      c.lineTo(left + w, top + 10);
      c.stroke();
      // The upper tier in glass under it.
      rect(c, left, top + 10, w, body - top - 10, '#6a7e92');
      c.fillStyle = 'rgb(255 255 255 / 0.2)';
      for (let x = 0; x < w; x += 5) c.fillRect(left + x, top + 10, 2, body - top - 10);
      break;
    }
    case 'masts':
      // The Etihad: a white roof hung from masts, on cables.
      rect(c, left, top + 5, w, 4, roofC);
      c.strokeStyle = '#ffffff';
      c.lineWidth = 0.5;
      c.beginPath();
      for (const mx of [left + 10, left + w / 2, left + w - 10]) {
        c.moveTo(mx, top + 9);
        c.lineTo(mx, top - 4);
        for (const d of [-10, -5, 5, 10]) {
          c.moveTo(mx, top - 4);
          c.lineTo(mx + d, top + 5);
        }
      }
      c.stroke();
      break;
    default: {
      // A cantilever: the roof's edge, and its trusses showing underneath.
      rect(c, left, top + 4, w, 5, roofC);
      rect(c, left, top + 9, w, 2, '#9aa0a8');
      c.strokeStyle = '#7a8088';
      c.lineWidth = 0.5;
      c.beginPath();
      for (let x = 0; x < w; x += 8) {
        c.moveTo(left + x, top + 9);
        c.lineTo(left + x + 4, top + 4);
        c.lineTo(left + x + 8, top + 9);
      }
      c.stroke();
    }
  }
}

/** What makes each ground itself, painted over the plain stand. */
function paintOwnLook(
  c: Ctx,
  club: ClubId,
  g: Ground,
  left: number,
  top: number,
  w: number,
  h: number,
  body: number,
  door: number,
  now: number,
) {
  const base = top + h;
  switch (club) {
    case 'brighton':
      // A seagull on the arch, as there always is.
      gull(c, left + w / 2 + 10, top - 1);
      break;
    case 'palace': {
      // The eagle on the roof, and the old main stand's brick arches either side of the door.
      eagle(c, left + w / 2, top + 1);
      for (const x of [left + 10, left + 26, left + w - 36, left + w - 20])
        arched(c, x, base - 18, 8, 16, '#3a2a22');
      break;
    }
    case 'villa': {
      // The Holte End's front: claret and blue in the windows, a lion on the gable, and the
      // red-brick towers at each end.
      for (const x of [left, left + w - 14]) {
        brick(c, x, top + 2, 14, h - 2, '#8a3a2a');
        rect(c, x + 2, top - 2, 10, 4, '#7a3222');
        for (let y = top + 8; y < base - 10; y += 9) arched(c, x + 4, y, 6, 7, '#95bfe5');
      }
      for (let x = left + 18; x < left + w - 18; x += 9)
        if (Math.abs(x + 3 - (door + 8)) > 12) arched(c, x, base - 15, 6, 12, '#95bfe5');
      paintCrest(c, 'villa', left + w / 2, top + 5, 8);
      break;
    }
    case 'everton': {
      // Bramley-Moore Dock: a brick dock warehouse of a stand, tall arched windows, the steel
      // gable ends of the roof, and the river behind.
      for (let x = left + 6; x < left + w - 8; x += 10)
        if (Math.abs(x + 3 - (door + 8)) > 12) arched(c, x, base - 22, 6, 18, '#3a5a8a');
      for (const x of [left + 2, left + w - 26]) {
        c.strokeStyle = '#5a6068';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x, top + 12);
        c.lineTo(x + 12, top - 4);
        c.lineTo(x + 24, top + 12);
        for (let i = 4; i < 24; i += 4) {
          c.moveTo(x + i, top + 12);
          c.lineTo(x + 12, top - 4);
        }
        c.stroke();
      }
      break;
    }
    case 'leeds': {
      // The East Stand, white with a blue and yellow band, the biggest cantilever in the country
      // when it went up.
      rect(c, left, base - 22, w, 2, '#ffcd00');
      rect(c, left, base - 20, w, 1.5, '#1d428a');
      break;
    }
    case 'newcastle': {
      // Black and white panels up the stand, and the roof standing over all of Newcastle.
      for (let x = 0; x < w; x += 8)
        rect(c, left + x, body + 20, 4, h - (body - top) - 22, '#f4f4f4');
      rect(c, left, body + 18, w, 2, '#9a9a9a');
      // The roof's legs, down to the street.
      for (const x of [left + 4, left + w - 7]) rect(c, x, top - 2, 3, h + 2, '#d8dde2');
      break;
    }
    case 'city': {
      paintEtihad(c, left, top, w, h, body, door, now);
      break;
    }
    case 'chelsea': {
      // The Shed End: the old brick wall at the end of the ground, with its name on it.
      brick(c, left + w - 34, body + 18, 34, base - body - 18, '#8a4a36');
      rect(c, left + w - 32, body + 21, 30, 7, '#f2efe6');
      text(c, 'THE SHED END', left + w - 17, body + 24.8, 4, '#034694', 28);
      for (const x of [left + w - 28, left + w - 14]) arched(c, x, base - 13, 7, 11, '#2a2a30');
      break;
    }
    case 'arsenal': {
      // The legends round the outside, arms round each other, and the cannon by the door.
      const foot = base - 3;
      for (let x = left + 6; x < left + w - 6; x += 7) {
        if (Math.abs(x - (door + 8)) < 14) continue;
        figure(c, x, foot, '#ef0107', (x * 3) % 2 ? '#8a5a3a' : '#e8c8a8', 1.6);
        rect(c, x - 3.5, foot - 9, 7, 1, '#ef0107');
      }
      cannon(c, door - 14, base - 4);
      break;
    }
    case 'liverpool': {
      // The Main Stand: red brick along the bottom, the great grey upper tier, and the Liver
      // bird up on the roof.
      brick(c, left, base - 20, w, 20, '#9a3a2c');
      rect(c, left, base - 21, w, 1.5, '#f6eb61');
      for (let x = left + 6; x < left + w - 6; x += 10)
        if (Math.abs(x + 3 - (door + 8)) > 12) arched(c, x, base - 15, 6, 12, '#2a2a30');
      paintCrest(c, 'liverpool', left + w / 2, top + 1, 9);
      break;
    }
    case 'united': {
      // The Munich clock on the corner, stopped at the time of the crash, and Sir Matt Busby
      // in bronze by the door.
      const mx = left + 14;
      rect(c, mx - 9, body + 20, 18, 22, '#e8e2d2');
      clock(c, mx, body + 27, 5);
      text(c, 'FEB 6 1958', mx, body + 36, 3, '#3a3a3a', 16);
      text(c, 'MUNICH', mx, body + 40, 3, '#3a3a3a', 16);
      statue(c, door + 30, base - 2, 1);
      // The roof's red trim.
      rect(c, left, top - 6, w, 1.5, '#da291c');
      break;
    }
  }
}

/** A gull, wings out, centred on (x, y). */
function gull(c: Ctx, x: number, y: number) {
  c.strokeStyle = '#ffffff';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x - 4, y - 1);
  c.quadraticCurveTo(x - 2, y - 3, x, y);
  c.quadraticCurveTo(x + 2, y - 3, x + 4, y - 1);
  c.stroke();
  rect(c, x - 0.5, y - 0.5, 1, 1, '#f2b705');
}

/** Palace's eagle, wings spread, on the roof. */
function eagle(c: Ctx, x: number, y: number) {
  c.fillStyle = '#a07a3a';
  c.beginPath();
  c.moveTo(x, y + 3);
  c.lineTo(x - 9, y - 3);
  c.lineTo(x - 3, y);
  c.lineTo(x, y - 4);
  c.lineTo(x + 3, y);
  c.lineTo(x + 9, y - 3);
  c.closePath();
  c.fill();
  rect(c, x - 1, y - 6, 2, 2, '#f4f4f4');
}

/** The Arsenal cannon, on its carriage, its wheel at (x, foot). */
function cannon(c: Ctx, x: number, foot: number) {
  c.fillStyle = '#c8a040';
  c.save();
  c.translate(x, foot - 4);
  c.rotate(-0.25);
  c.fillRect(-3, -2, 14, 4);
  c.restore();
  c.fillStyle = '#5a3a1a';
  c.beginPath();
  c.arc(x, foot - 2, 3, 0, Math.PI * 2);
  c.fill();
}

/** A bronze statue on a granite plinth, its plinth's foot at (x, foot). */
function statue(c: Ctx, x: number, foot: number, n: number, arms = false) {
  rect(c, x - 3 - n * 2, foot - 6, 6 + n * 4, 6, '#7a7a80');
  for (let i = 0; i < n; i++) {
    const fx = x - (n - 1) * 3 + i * 6;
    figure(c, fx, foot - 6, '#7a5a30', '#8a6a3a', 1.6);
    if (arms) {
      rect(c, fx - 4, foot - 19, 1.5, 6, '#8a6a3a');
      rect(c, fx + 2.5, foot - 19, 1.5, 6, '#8a6a3a');
    }
  }
}

/**
 * The Tottenham Hotspur Stadium: a huge bowl in silver panels, swept up at each end, with a glass
 * front along the street, the Skywalk across the roof (people on it), the golden cockerel on top,
 * and its name on a navy band.
 */
function paintSpurs(
  c: Ctx,
  left: number,
  top: number,
  w: number,
  h: number,
  door: number,
  now: number,
) {
  const base = top + h;
  // The bowl's silhouette: high in the middle, rounding away at each end.
  const bowl = () => {
    c.beginPath();
    c.moveTo(left, base);
    c.lineTo(left, top + 18);
    c.quadraticCurveTo(left, top - 2, left + 40, top - 4);
    c.quadraticCurveTo(left + w / 2, top - 8, left + w - 40, top - 4);
    c.quadraticCurveTo(left + w, top - 2, left + w, top + 18);
    c.lineTo(left + w, base);
    c.closePath();
  };
  c.fillStyle = '#c4cad2';
  bowl();
  c.fill();
  // The metal skin: long panels sweeping up and out from the middle.
  c.save();
  bowl();
  c.clip();
  c.strokeStyle = 'rgb(90 100 115 / 0.35)';
  c.lineWidth = 0.6;
  c.beginPath();
  for (let x = -60; x < w + 60; x += 5) {
    c.moveTo(left + x, base);
    c.quadraticCurveTo(
      left + x + (x - w / 2) * 0.1,
      top + 10,
      left + x + (x - w / 2) * 0.25,
      top - 10,
    );
  }
  c.stroke();
  c.restore();
  // The roof's white edge, with the Skywalk along it and people walking over.
  c.strokeStyle = '#ffffff';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(left + 2, top + 14);
  c.quadraticCurveTo(left + 2, top - 1, left + 40, top - 3);
  c.quadraticCurveTo(left + w / 2, top - 7, left + w - 40, top - 3);
  c.quadraticCurveTo(left + w - 2, top - 1, left + w - 2, top + 14);
  c.stroke();
  for (let i = 0; i < 6; i++) {
    const t = (((now / 9000 + i / 6) % 1) + 1) % 1;
    const x = left + 40 + t * (w - 80);
    const y = top - 3 - Math.sin(t * Math.PI) * 4;
    rect(c, x - 0.5, y - 3, 1.2, 2.5, i % 2 ? '#f8b820' : '#e04040');
  }
  // The navy band and the name.
  rect(c, left, top + 10, w, 11, '#132257');
  rect(c, left, top + 21, w, 1, '#c9ccd4');
  text(c, GROUNDS.spurs.name, left + w / 2, top + 16, 7, '#ffffff', w - 12);
  // The golden cockerel on its ball, on top of the bowl in the middle.
  paintCockerel(c, left + w / 2, top + 9);
  // The glass front along the street, lit from inside.
  rect(c, left, base - 24, w, 24, '#5a7898');
  c.fillStyle = 'rgb(255 248 220 / 0.35)';
  for (let x = 2; x < w; x += 8) c.fillRect(left + x, base - 22, 5, 20);
  rect(c, left, base - 25, w, 1.5, '#e8ebef');
  paintTurnstiles(c, 'spurs', GROUNDS.spurs, door, base);
}

/** Spurs' cockerel, standing on its ball, in gold. */
function paintCockerel(c: Ctx, cx: number, cy: number) {
  c.save();
  c.translate(cx, cy);
  const x = 0;
  const y = 0;
  c.fillStyle = '#e8b830';
  c.beginPath();
  c.arc(x, y + 1, 2.5, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(x - 4, y - 2);
  c.quadraticCurveTo(x - 1, y - 8, x + 3, y - 6);
  c.lineTo(x + 4, y - 9);
  c.lineTo(x + 2, y - 2);
  c.closePath();
  c.fill();
  // The tail.
  c.beginPath();
  c.moveTo(x - 4, y - 2);
  c.quadraticCurveTo(x - 9, y - 9, x - 6, y - 12);
  c.quadraticCurveTo(x - 6, y - 6, x - 2, y - 4);
  c.fill();
  rect(c, x - 0.5, y - 2, 1, 1.5, '#e8b830');
  c.restore();
}

/**
 * The Etihad's money, over its stand: two pumpjacks nodding by the stand, oil barrels stacked
 * along the front, sacks of cash, gold bars and bundles of notes at the turnstiles, a slick of oil
 * on the pavement, notes drifting down off the roof, the charge sheet for everyone to see, and
 * the round ramp towers at the corners.
 */
function paintEtihad(
  c: Ctx,
  left: number,
  top: number,
  w: number,
  h: number,
  body: number,
  door: number,
  now: number,
) {
  const bodyH = top + h - body;
  const base = top + h;
  for (const tx of [left + 2, left + w - 12]) {
    rect(c, tx, body, 10, bodyH, '#3b4a6b');
    c.fillStyle = 'rgb(255 255 255 / 0.35)';
    for (let i = 0; i < bodyH; i += 4) c.fillRect(tx, body + i, 10, 1);
  }
  pumpjack(c, left + 20, body + 22, bodyH - 22, now, 0);
  pumpjack(c, left + w - 24, body + 22, bodyH - 22, now, 1.7);
  oilSlick(c, left + w / 2, base - 0.5, w / 2 - 6);
  barrels(c, left + 28, base, 7);
  barrels(c, left + w - 64, base, 7);
  for (const [bx, by] of [
    [left + 4, base - 3.5],
    [left + 9, base - 3.5],
    [left + 6.5, base - 9],
    [left + w - 4, base - 3.5],
    [left + w - 9, base - 3.5],
    [left + w - 6.5, base - 9],
    [door - 4, base - 3.5],
    [door + TILE + 4, base - 3.5],
  ])
    cashSack(c, bx, by);
  for (const gx of [left + 34, left + w - 58]) goldBars(c, gx, base - 22);
  for (const nx of [left + 48, left + w - 44]) notes(c, nx, base - 21);
  fallingNotes(c, left, top, w, h, now, 16);
  const sx = door - 30;
  rect(c, sx, body + 20, 22, 12, '#fffdf0');
  rect(c, sx, body + 20, 22, 2, '#c8102e');
  text(c, '115 CHARGES', sx + 11, body + 24.5, 3, '#c8102e', 20);
  text(c, 'APPEALING', sx + 11, body + 29, 3.5, '#1a1a1a', 20);
}

// ---------- the landmarks round each ground ----------

/** A Gothic window: a pointed arch, dark glass. */
function gothic(c: Ctx, x: number, y: number, w: number, h: number) {
  c.fillStyle = '#2a3440';
  c.beginPath();
  c.moveTo(x, y + h);
  c.lineTo(x, y + w / 2);
  c.quadraticCurveTo(x + w / 2, y - w / 2, x + w, y + w / 2);
  c.lineTo(x + w, y + h);
  c.closePath();
  c.fill();
}

/** A sign on a post or a wall: white letters on a coloured board. */
function board(c: Ctx, s: string, x: number, y: number, colour: string, size = 5) {
  c.font = `700 ${size}px ${FONT}`;
  const w = Math.ceil(c.measureText(s).width) + 5;
  rect(c, x - w / 2 - 0.5, y - size / 2 - 2, w + 1, size + 4, '#1a1a1a');
  rect(c, x - w / 2, y - size / 2 - 1.5, w, size + 3, colour);
  text(c, s, x, y + 0.5, size, '#ffffff');
}

/** A Manchester worker bee, the city's own. */
function bee(c: Ctx, x: number, y: number, s: number) {
  c.fillStyle = 'rgb(255 255 255 / 0.85)';
  c.beginPath();
  c.ellipse(x - s * 0.6, y - s * 0.7, s * 0.6, s * 0.4, -0.5, 0, Math.PI * 2);
  c.ellipse(x + s * 0.6, y - s * 0.7, s * 0.6, s * 0.4, 0.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#f2b705';
  c.beginPath();
  c.ellipse(x, y, s * 0.55, s, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#1a1a1a';
  for (const dy of [-0.3, 0.3]) c.fillRect(x - s * 0.55, y + dy * s - 0.4, s * 1.1, 0.8);
}

/** The Liver Bird, up on a dome. */
function liverBird(c: Ctx, x: number, y: number) {
  c.fillStyle = '#2f6e5a';
  c.beginPath();
  c.ellipse(x, y, 1.5, 2.2, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(x - 0.5, y - 4, 1, 2.5);
  c.beginPath();
  c.moveTo(x - 1, y - 1);
  c.lineTo(x - 4, y - 4);
  c.lineTo(x - 2, y + 1);
  c.moveTo(x + 1, y - 1);
  c.lineTo(x + 4, y - 4);
  c.lineTo(x + 2, y + 1);
  c.fill();
}

/** A sky, with a hill along the bottom in the given green. */
function skyAndHill(
  c: Ctx,
  left: number,
  top: number,
  w: number,
  h: number,
  green: string,
  rise = 18,
) {
  rect(c, left, top, w, h, '#b4d0e4');
  c.fillStyle = green;
  c.beginPath();
  c.moveTo(left, top + h);
  c.quadraticCurveTo(left + w / 2, top + rise, left + w, top + h);
  c.closePath();
  c.fill();
}

/** A round tree, its trunk's foot at (x, foot). */
function tree(c: Ctx, x: number, foot: number, r: number, green = '#3e7a3a') {
  rect(c, x - 0.75, foot - r, 1.5, r, '#5a3a22');
  c.fillStyle = green;
  c.beginPath();
  c.arc(x, foot - r - r * 0.6, r * 0.9, 0, Math.PI * 2);
  c.fill();
}

/** A station's front: its building, and the roundel or the arrows of its line, with its name. */
function station(
  c: Ctx,
  line: 'underground' | 'overground' | 'rail',
  name: string,
  left: number,
  top: number,
  w: number,
  h: number,
) {
  const foot = top + h;
  if (line === 'rail') brick(c, left, top + 8, w, h - 8, '#8c5440');
  else {
    rect(c, left, top + 8, w, h - 8, line === 'underground' ? '#e6e0d0' : '#ece8e0');
    c.fillStyle = line === 'underground' ? '#7a1a1a' : '#a04a10';
    c.fillRect(left, top + 8, w, 3);
  }
  rect(c, left + 3, foot - 16, w - 6, 16, '#1a1a1a');
  const rx = left + w / 2;
  const ry = top + 18;
  if (line === 'rail') {
    // National Rail's double arrow, in red.
    rect(c, rx - 8, ry - 7, 16, 14, '#c8102e');
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(rx - 5, ry - 3);
    c.lineTo(rx + 5, ry - 3);
    c.lineTo(rx + 2, ry - 5);
    c.moveTo(rx + 5, ry + 3);
    c.lineTo(rx - 5, ry + 3);
    c.lineTo(rx - 2, ry + 5);
    c.moveTo(rx - 3, ry - 3);
    c.lineTo(rx + 3, ry + 3);
    c.stroke();
    board(c, name, rx, foot - 21, '#1a1a1a', 4);
    return;
  }
  c.strokeStyle = line === 'underground' ? '#dc241f' : '#ee7c0e';
  c.lineWidth = 2.5;
  c.beginPath();
  c.arc(rx, ry, 7, 0, Math.PI * 2);
  c.stroke();
  c.font = `700 3px ${FONT}`;
  const bw = Math.min(w - 4, Math.max(22, Math.ceil(c.measureText(name).width) + 4));
  rect(c, rx - bw / 2, ry - 2.5, bw, 5, '#0019a8');
  text(c, name, rx, ry + 0.5, 3, '#ffffff', bw - 2);
}

function paintLandmark(
  c: Ctx,
  kind: Scenery['kind'],
  label: string,
  left: number,
  top: number,
  w: number,
  h: number,
  now: number,
) {
  const foot = top + h;
  switch (kind) {
    case 'underground':
    case 'overground':
    case 'rail':
      station(c, kind, label, left, top, w, h);
      break;
    case 'south-downs': {
      // The South Downs behind Falmer, with sheep on them.
      rect(c, left, top, w, h, '#b4d0e4');
      c.fillStyle = '#7ab060';
      c.beginPath();
      c.moveTo(left, foot);
      c.quadraticCurveTo(left + w * 0.3, top + 6, left + w * 0.6, top + 20);
      c.quadraticCurveTo(left + w * 0.8, top + 10, left + w, top + 18);
      c.lineTo(left + w, foot);
      c.closePath();
      c.fill();
      c.fillStyle = '#ffffff';
      for (const [sx, sy] of [
        [0.3, 26],
        [0.5, 32],
        [0.75, 28],
      ]) {
        c.beginPath();
        c.ellipse(left + w * sx, top + sy, 2, 1.3, 0, 0, Math.PI * 2);
        c.fill();
      }
      board(c, 'SOUTH DOWNS', left + w / 2, foot - 6, '#3a6a2a', 4);
      break;
    }
    case 'crystal-palace-mast': {
      // Crystal Palace Park on its hill: the TV mast, red and white, and a Victorian dinosaur.
      skyAndHill(c, left, top, w, h, '#6aa050', 14);
      const mx = left + w * 0.62;
      c.strokeStyle = '#c8102e';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(mx - 7, foot - 14);
      c.lineTo(mx, top - 18);
      c.lineTo(mx + 7, foot - 14);
      for (let y = top - 12; y < foot - 16; y += 5) {
        const half = ((y - (top - 18)) / (foot - 14 - (top - 18))) * 7;
        c.moveTo(mx - half, y);
        c.lineTo(mx + half, y + 5);
        c.moveTo(mx + half, y);
        c.lineTo(mx - half, y + 5);
      }
      c.stroke();
      rect(c, mx - 0.5, top - 20, 1, 3, '#ffffff');
      // An Iguanodon, as the Victorians thought they looked.
      const dx = left + w * 0.25;
      const dy = foot - 10;
      c.fillStyle = '#4a7a4a';
      c.beginPath();
      c.ellipse(dx, dy, 8, 4, 0, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(dx + 9, dy - 3, 3, 2, -0.3, 0, Math.PI * 2);
      c.fill();
      c.fillRect(dx - 5, dy + 2, 2, 4);
      c.fillRect(dx + 3, dy + 2, 2, 4);
      c.beginPath();
      c.moveTo(dx - 7, dy);
      c.lineTo(dx - 15, dy + 3);
      c.lineTo(dx - 7, dy + 2);
      c.fill();
      board(c, 'CRYSTAL PALACE PARK', left + w / 2, foot - 4, '#3a6a2a', 4);
      break;
    }
    case 'sainsburys': {
      // The Sainsbury's built into the Whitehorse Lane end, with its orange sign and trolleys.
      rect(c, left, top + 10, w, h - 10, '#d8d4cc');
      rect(c, left, top + 10, w, 12, '#f06c00');
      text(c, 'Sainsbury’s', left + w / 2, top + 16.5, 8, '#ffffff', w - 6);
      rect(c, left + 3, top + 26, w - 6, h - 26, '#5a7a90');
      c.fillStyle = 'rgb(255 255 255 / 0.3)';
      for (let x = left + 5; x < left + w - 5; x += 8) c.fillRect(x, top + 27, 3, h - 28);
      for (const x of [left + 8, left + 14, left + w - 16]) {
        c.strokeStyle = '#9aa0a8';
        c.lineWidth = 0.6;
        c.strokeRect(x, foot - 6, 5, 4);
        rect(c, x, foot - 1.5, 1, 1, '#333');
        rect(c, x + 4, foot - 1.5, 1, 1, '#333');
      }
      break;
    }
    case 'aston-hall': {
      // Aston Hall: a Jacobean mansion in red brick, with Dutch gables, stone-trimmed windows and
      // towers with lead caps.
      rect(c, left, top, w, h, '#b4d0e4');
      brick(c, left + 6, top + 16, w - 12, h - 16, '#a2503a');
      for (let x = left + 10; x < left + w - 12; x += 16) {
        c.fillStyle = '#a2503a';
        c.beginPath();
        c.moveTo(x, top + 17);
        c.lineTo(x, top + 10);
        c.quadraticCurveTo(x + 6, top + 2, x + 12, top + 10);
        c.lineTo(x + 12, top + 17);
        c.fill();
      }
      for (const tx of [left + 2, left + w - 14]) {
        brick(c, tx, top + 6, 12, h - 6, '#984a34');
        c.fillStyle = '#4a5058';
        c.beginPath();
        c.moveTo(tx, top + 6);
        c.quadraticCurveTo(tx + 6, top - 6, tx + 12, top + 6);
        c.fill();
      }
      for (let x = left + 9; x < left + w - 10; x += 8)
        for (const y of [top + 20, top + 31]) {
          rect(c, x - 0.5, y - 0.5, 5, 7, '#e6dcc4');
          rect(c, x, y, 4, 6, '#2a3440');
        }
      rect(c, left + w / 2 - 4, foot - 10, 8, 10, '#3a2a1a');
      board(c, 'ASTON HALL', left + w / 2, top + 14, '#670e36', 4);
      break;
    }
    case 'canal': {
      // The Birmingham and Fazeley canal under a brick bridge, a narrowboat on it.
      brick(c, left, top + 4, w, h - 4, '#8c5440');
      rect(c, left, foot - 16, w, 16, '#2c5a5a');
      c.fillStyle = '#1e3a3a';
      c.beginPath();
      c.arc(left + w / 2, foot - 2, 10, Math.PI, 0);
      c.fill();
      rect(c, left + 3, foot - 8, w - 6, 4, '#2f7a3a');
      rect(c, left + 5, foot - 11, w - 14, 3, '#c8102e');
      board(c, 'FAZELEY CANAL', left + w / 2, top + 10, '#8c1d2c', 4);
      break;
    }
    case 'liver-building': {
      // The Royal Liver Building down the river: white stone, two clock towers with green domes
      // and a Liver Bird on each.
      rect(c, left, top + 20, w, h - 20, '#e6e2d6');
      for (let x = left + 3; x < left + w - 3; x += 5)
        for (let y = top + 31; y < foot - 4; y += 6) rect(c, x, y, 2.5, 4, '#3a4450');
      for (const tx of [left + 4, left + w - 16]) {
        rect(c, tx, top + 12, 12, h - 12, '#dcd6c6');
        clock(c, tx + 6, top + 17, 3.5);
        c.fillStyle = '#4c8c74';
        c.beginPath();
        c.arc(tx + 6, top + 12, 5, Math.PI, 0);
        c.fill();
        liverBird(c, tx + 6, top + 5);
      }
      board(c, 'ROYAL LIVER BUILDING', left + w / 2, top + 26, '#2f6e5a', 4);
      break;
    }
    case 'victoria-tower': {
      // The Victoria clock tower on the dock wall at Salisbury Dock, next door to the ground.
      rect(c, left, top, w, h, '#b4d0e4');
      rect(c, left, foot - 10, w, 10, '#3a6e94');
      const tx = left + w / 2 - 8;
      rect(c, tx, top + 10, 16, h - 18, '#8a8478');
      c.fillStyle = 'rgb(0 0 0 / 0.15)';
      for (let y = top + 12; y < foot - 8; y += 4) c.fillRect(tx, y, 16, 0.5);
      clock(c, tx + 8, top + 16, 4.5);
      c.fillStyle = '#4a5058';
      c.beginPath();
      c.moveTo(tx - 1, top + 10);
      c.lineTo(tx + 8, top - 6);
      c.lineTo(tx + 17, top + 10);
      c.closePath();
      c.fill();
      for (const y of [top + 26, top + 34]) gothic(c, tx + 6, y, 4, 6);
      board(c, 'VICTORIA TOWER', left + w / 2, foot - 5, '#1a1a1a', 3);
      break;
    }
    case 'mersey': {
      // The Mersey behind the docks, with the ferry to Dublin going by.
      rect(c, left, top, w, h * 0.55, '#a8c8e0');
      rect(c, left, top + h * 0.55, w, h * 0.45, '#3a6e94');
      c.fillStyle = 'rgb(255 255 255 / 0.4)';
      for (let x = 2; x < w; x += 7) c.fillRect(left + x, top + h * 0.7, 3, 0.6);
      const fx = left + w / 2 - 14;
      const fy = top + h * 0.55 - 6;
      rect(c, fx, fy + 4, 28, 5, '#1a1a1a');
      rect(c, fx + 3, fy, 20, 4, '#ffffff');
      rect(c, fx + 12, fy - 5, 3, 5, '#f2b705');
      // Mersey Ferries' red and black funnel, and the sign on the quay.
      rect(c, fx + 12, fy - 5, 3, 2, '#c8102e');
      board(c, 'FERRY TO DUBLIN', left + w / 2, foot - 6, '#2f6e5a', 4);
      break;
    }
    case 'bremner-statue': {
      // Billy Bremner outside Elland Road, in bronze, both arms in the air, on a plinth of
      // Yorkshire stone, with flowers and scarves round it.
      rect(c, left, top, w, h, '#c8d4dc');
      brick(c, left, top + 26, w, h - 26, '#8c5440');
      const sx = left + w / 2;
      rect(c, sx - 9, foot - 16, 18, 16, '#cfc6ae');
      text(c, 'BREMNER', sx, foot - 10, 4, '#1d428a', 16);
      c.fillStyle = '#7a5a30';
      c.fillRect(sx - 3, foot - 32, 6, 9);
      c.fillRect(sx - 3, foot - 23, 2.5, 7);
      c.fillRect(sx + 0.5, foot - 23, 2.5, 7);
      c.beginPath();
      c.arc(sx, foot - 35, 3, 0, Math.PI * 2);
      c.fill();
      c.save();
      c.translate(sx - 3, foot - 31);
      c.rotate(-2.4);
      c.fillRect(0, -1, 9, 2);
      c.restore();
      c.save();
      c.translate(sx + 3, foot - 31);
      c.rotate(-0.7);
      c.fillRect(0, -1, 9, 2);
      c.restore();
      for (const [fx, col] of [
        [-12, '#ffcd00'],
        [-8, '#ffffff'],
        [8, '#1d428a'],
        [12, '#ffcd00'],
      ] as const)
        rect(c, sx + fx - 1, foot - 3, 2, 3, col);
      board(c, 'BILLY BREMNER', sx, top + 6, '#1d428a', 4);
      break;
    }
    case 'yorkshire-rose': {
      // A banner of the white rose of Yorkshire over a brick arcade.
      brick(c, left, top + 10, w, h - 10, '#8c5440');
      rect(c, left + 3, top + 2, w - 6, 20, '#1d428a');
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(left + w / 2 + Math.cos(a) * 3, top + 10 + Math.sin(a) * 3, 2.8, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = '#ffcd00';
      c.beginPath();
      c.arc(left + w / 2, top + 10, 1.8, 0, Math.PI * 2);
      c.fill();
      text(c, 'YORKSHIRE', left + w / 2, top + 19, 4, '#ffcd00', w - 8);
      for (let x = left + 3; x < left + w - 3; x += 8) gothic(c, x, foot - 12, 5, 12);
      break;
    }
    case 'tyne-bridge': {
      // The Tyne Bridge: its green arch over the river, the Quayside behind.
      rect(c, left, top, w, h, '#b4d0e4');
      for (let x = left; x < left + w; x += 7)
        rect(c, x, top + 14 + ((x * 3) % 7), 6, 20, '#8a8070');
      rect(c, left, top + 30, w, h - 30, '#3c6a8a');
      c.strokeStyle = '#2e7a4a';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(left + 2, top + 30);
      c.quadraticCurveTo(left + w / 2, top - 14, left + w - 2, top + 30);
      c.stroke();
      rect(c, left, top + 24, w, 2.5, '#2e7a4a');
      c.strokeStyle = '#2e7a4a';
      c.lineWidth = 0.6;
      c.beginPath();
      for (let x = 8; x < w - 6; x += 6) {
        const t = x / w;
        c.moveTo(left + x, top + 24);
        c.lineTo(left + x, top + 30 - 4 * t * (1 - t) * 44);
      }
      c.stroke();
      rect(c, left, top + 26, 6, h - 26, '#9a9488');
      rect(c, left + w - 6, top + 26, 6, h - 26, '#9a9488');
      board(c, 'TYNE BRIDGE', left + w / 2, foot - 7, '#2e7a4a', 4);
      break;
    }
    case 'angel': {
      // The Angel of the North, rusty red on its green hill.
      skyAndHill(c, left, top, w, h, '#5a9a4a');
      const ax = left + w / 2;
      c.fillStyle = '#8a4a2a';
      c.fillRect(ax - 1.5, top + 4, 3, 26);
      c.beginPath();
      c.arc(ax, top + 3, 2, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.moveTo(ax - 22, top + 9);
      c.lineTo(ax + 22, top + 9);
      c.lineTo(ax + 22, top + 13);
      c.lineTo(ax, top + 15);
      c.lineTo(ax - 22, top + 13);
      c.closePath();
      c.fill();
      board(c, 'ANGEL OF THE NORTH', ax, foot - 6, '#1a1a1a', 4);
      break;
    }
    case 'bruce-castle': {
      // Bruce Castle, Tottenham's Tudor manor: white-rendered with a clock turret, and its round
      // red-brick tower beside it, in the park.
      rect(c, left, top, w, h, '#b4d0e4');
      rect(c, left, foot - 6, w, 6, '#6aa050');
      rect(c, left + 18, top + 16, w - 22, h - 22, '#ece6d8');
      rect(c, left + 18, top + 13, w - 22, 3, '#5a4a40');
      for (let x = left + 22; x < left + w - 6; x += 7)
        for (const y of [top + 19, top + 29]) rect(c, x, y, 4, 6, '#2a3440');
      const cx = left + 18 + (w - 22) / 2;
      rect(c, cx - 3, top + 4, 6, 9, '#ece6d8');
      clock(c, cx, top + 8, 2);
      c.fillStyle = '#4a5058';
      c.beginPath();
      c.moveTo(cx - 4, top + 4);
      c.lineTo(cx, top - 2);
      c.lineTo(cx + 4, top + 4);
      c.fill();
      brick(c, left + 3, top + 12, 13, h - 18, '#a2503a');
      rect(c, left + 2, top + 10, 15, 3, '#8a3a2a');
      gothic(c, left + 7, top + 20, 4, 7);
      tree(c, left + w - 3, foot - 2, 6);
      board(c, 'BRUCE CASTLE', left + w / 2 + 4, foot - 4, '#132257', 4);
      break;
    }
    case 'velodrome': {
      // The National Cycling Centre beside the Etihad: a long low silver dome.
      rect(c, left, top, w, h, '#b4d0e4');
      c.fillStyle = '#c8ced6';
      c.beginPath();
      c.moveTo(left + 2, foot - 6);
      c.quadraticCurveTo(left + w / 2, top - 4, left + w - 2, foot - 6);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgb(255 255 255 / 0.6)';
      c.lineWidth = 0.5;
      c.beginPath();
      for (let x = 10; x < w - 8; x += 8) {
        const t = x / w;
        c.moveTo(left + x, foot - 6);
        c.lineTo(left + x, foot - 6 - 4 * t * (1 - t) * (h - 2) * 0.95);
      }
      c.stroke();
      rect(c, left, foot - 7, w, 7, '#6a7e92');
      // A bike, on the front.
      const bx = left + w / 2;
      const by = top + 22;
      c.strokeStyle = '#1c2c5b';
      c.lineWidth = 1;
      c.beginPath();
      c.arc(bx - 5, by, 3, 0, Math.PI * 2);
      c.moveTo(bx + 8, by);
      c.arc(bx + 5, by, 3, 0, Math.PI * 2);
      c.moveTo(bx - 5, by);
      c.lineTo(bx - 1, by - 5);
      c.lineTo(bx + 4, by - 5);
      c.lineTo(bx + 5, by);
      c.moveTo(bx - 1, by - 5);
      c.lineTo(bx + 1, by);
      c.stroke();
      board(c, 'NATIONAL CYCLING CENTRE', left + w / 2, foot - 3.5, '#1c2c5b', 3);
      break;
    }
    case 'oil-field': {
      // An oil field in Manchester, beside the Etihad, nodding away, and a sign saying whose it
      // isn't.
      rect(c, left, top, w, h, '#d8c8a0');
      rect(c, left, top, w, 14, '#b4d0e4');
      for (const [px, ph] of [
        [left + 18, 0.4],
        [left + w - 22, 2.2],
      ] as const)
        pumpjack(c, px, top + 22, foot - top - 26, now, ph);
      oilSlick(c, left + w / 2, foot - 2, w / 3);
      barrels(c, left + w / 2 - 8, foot - 2, 4);
      rect(c, left + w / 2 - 22, top + 2, 44, 13, '#fffdf0');
      rect(c, left + w / 2 - 22, top + 2, 44, 2, '#6cabdd');
      text(c, 'OIL FIELD', left + w / 2, top + 7, 4, '#1c2c5b', 40);
      text(c, 'NOTHING TO DO WITH THE OWNER', left + w / 2, top + 11.5, 2.5, '#c8102e', 42);
      break;
    }
    case 'brompton-cemetery': {
      // Brompton Cemetery over the wall from Stamford Bridge: its gateway arch, the domed chapel
      // at the far end, the trees and the old stones.
      rect(c, left, top, w, h, '#b4d0e4');
      rect(c, left, foot - 18, w, 18, '#5a8a4a');
      const cx = left + w / 2;
      rect(c, cx - 6, top + 12, 12, 16, '#d8d0bc');
      c.fillStyle = '#9aa0a0';
      c.beginPath();
      c.arc(cx, top + 12, 6, Math.PI, 0);
      c.fill();
      rect(c, cx - 0.5, top + 2, 1, 4, '#5a6060');
      for (const x of [left + 6, left + 14, left + w - 18, left + w - 10]) {
        rect(c, x, foot - 14, 4, 6, '#b8b4aa');
        rect(c, x + 1.5, foot - 17, 1, 4, '#b8b4aa');
      }
      tree(c, left + 22, foot - 12, 7, '#2e5a2e');
      tree(c, left + w - 26, foot - 12, 7, '#2e5a2e');
      // The wall along the street, with the gate in it.
      rect(c, left, foot - 10, w, 10, '#c8beac');
      c.fillStyle = '#2a2a30';
      c.beginPath();
      c.moveTo(cx - 5, foot);
      c.lineTo(cx - 5, foot - 5);
      c.arc(cx, foot - 5, 5, Math.PI, 0);
      c.lineTo(cx + 5, foot);
      c.fill();
      board(c, 'BROMPTON CEMETERY', cx, foot - 13, '#3a4a3a', 3);
      break;
    }
    case 'highbury-square': {
      // The old East Stand at Highbury, its Art Deco front kept when the ground became flats:
      // cream stone, the red ARSENAL STADIUM lettering, the cannon over the door.
      rect(c, left, top, w, h, '#b4d0e4');
      rect(c, left + 2, top + 8, w - 4, h - 8, '#efe8d6');
      for (let y = top + 12; y < foot - 4; y += 6) rect(c, left + 2, y, w - 4, 0.8, '#d4cab0');
      rect(c, left + 2, top + 6, w - 4, 3, '#c9bc98');
      rect(c, left + 10, top + 14, w - 20, 7, '#efe8d6');
      text(c, 'ARSENAL STADIUM', left + w / 2, top + 17.5, 5, '#c8102e', w - 22);
      for (let x = left + 6; x < left + w - 6; x += 9)
        if (Math.abs(x + 2 - (left + w / 2)) > 8) rect(c, x, top + 26, 5, 8, '#2a3440');
      rect(c, left + w / 2 - 5, foot - 12, 10, 12, '#3a2a1a');
      cannon(c, left + w / 2 - 2, top + 30);
      board(c, 'HIGHBURY SQUARE', left + w / 2, top + 3, '#c8102e', 3);
      break;
    }
    case 'stanley-park': {
      // Stanley Park, between the two grounds: grass, trees, the Gladstone glasshouse, and Goodison
      // Park in blue across the far side.
      rect(c, left, top, w, h, '#b4d0e4');
      rect(c, left + w - 48, top + 10, 44, 18, '#2a4a9a');
      rect(c, left + w - 48, top + 8, 44, 3, '#e8ebef');
      text(c, 'GOODISON PARK', left + w - 26, top + 19, 4, '#ffffff', 40);
      rect(c, left, foot - 22, w, 22, '#5a9a4a');
      c.fillStyle = 'rgb(220 235 240 / 0.85)';
      c.beginPath();
      c.moveTo(left + 8, foot - 10);
      c.quadraticCurveTo(left + 22, foot - 30, left + 36, foot - 10);
      c.fill();
      for (const x of [left + 44, left + 58, left + 72]) tree(c, x, foot - 6, 6);
      board(c, 'STANLEY PARK', left + w / 2, foot - 4, '#2e5a2e', 4);
      break;
    }
    case 'shankly-gates': {
      // The Shankly Gates: black and gold ironwork between two sandstone pillars, YOU'LL NEVER
      // WALK ALONE across the top.
      rect(c, left, top, w, h, '#c8d4dc');
      for (const x of [left + 2, left + w - 10]) {
        rect(c, x, top + 8, 8, h - 8, '#c8a878');
        rect(c, x - 1, top + 6, 10, 3, '#b0905e');
      }
      const gx = left + 10;
      const gw = w - 20;
      c.strokeStyle = '#d4a020';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(gx, top + 12);
      c.quadraticCurveTo(gx + gw / 2, top + 2, gx + gw, top + 12);
      c.stroke();
      text(c, 'YOU’LL NEVER WALK ALONE', gx + gw / 2, top + 9, 3, '#d4a020', gw - 4);
      c.strokeStyle = '#1a1a1a';
      c.lineWidth = 0.8;
      c.beginPath();
      for (let x = gx + 2; x < gx + gw; x += 3) {
        c.moveTo(x, top + 13);
        c.lineTo(x, foot);
      }
      c.moveTo(gx, top + 20);
      c.lineTo(gx + gw, top + 20);
      c.stroke();
      paintCrest(c, 'liverpool', gx + gw / 2, top + 28, 9);
      break;
    }
    case 'homebaked': {
      // Homebaked, the bakery on the corner by the Kop: red brick, a blue front, pies in the window.
      brick(c, left, top + 4, w, h - 4, '#a2503a');
      for (const x of [left + 6, left + w - 14]) rect(c, x, top + 9, 8, 9, '#2a3440');
      rect(c, left + 2, top + 22, w - 4, 7, '#2a5a9a');
      text(c, 'HOMEBAKED', left + w / 2, top + 25.8, 4, '#ffffff', w - 6);
      rect(c, left + 4, top + 31, w - 18, h - 31, '#e8dcc0');
      for (let x = left + 7; x < left + w - 16; x += 6) {
        c.fillStyle = '#c88a40';
        c.beginPath();
        c.ellipse(x, foot - 7, 2.5, 1.5, 0, 0, Math.PI * 2);
        c.fill();
      }
      rect(c, left + w - 12, top + 31, 8, h - 31, '#3a2a1a');
      break;
    }
    case 'manchester-mill': {
      // A red-brick cotton mill with its chimney, the worker bee and the city's name.
      brick(c, left, top + 8, w, h - 8, '#a5483a');
      for (let x = left + 3; x < left + w - 3; x += 6)
        for (let y = top + 12; y < foot - 6; y += 9) rect(c, x, y, 3.5, 5, '#2a3440');
      rect(c, left + w - 8, top - 10, 6, 20, '#8a3a2e');
      rect(c, left + w - 9, top - 11, 8, 2, '#5a2a22');
      c.fillStyle = 'rgb(200 200 210 / 0.6)';
      c.beginPath();
      c.arc(left + w - 5, top - 14, 3, 0, Math.PI * 2);
      c.arc(left + w - 1, top - 17, 4, 0, Math.PI * 2);
      c.fill();
      rect(c, left + 2, top + 8, w - 12, 9, '#1a1a1a');
      bee(c, left + 8, top + 12.5, 3);
      text(c, 'MANCHESTER', left + (w - 10) / 2 + 6, top + 13, 5, '#f2b705', w - 20);
      break;
    }
    case 'united-trinity': {
      // The United Trinity: Best, Law and Charlton in bronze, on a granite plinth across from
      // the East Stand.
      rect(c, left, top, w, h, '#c8d0d8');
      rect(c, left, foot - 12, w, 12, '#9a9aa0');
      const sx = left + w / 2;
      rect(c, sx - 16, foot - 20, 32, 9, '#5a5a62');
      text(c, 'BEST · LAW · CHARLTON', sx, foot - 15.5, 3, '#e8e2d2', 30);
      statue(c, sx, foot - 20, 3, true);
      board(c, 'THE UNITED TRINITY', sx, top + 6, '#da291c', 3);
      break;
    }
    case 'ship-canal': {
      // The Manchester Ship Canal behind the ground, with Salford Quays and MediaCity over it.
      rect(c, left, top, w, h, '#b4d0e4');
      for (const [x, bh, col] of [
        [6, 28, '#8a96a4'],
        [20, 34, '#c8ced6'],
        [36, 24, '#5a6a7a'],
        [52, 30, '#a8b4c0'],
        [70, 26, '#7a8a9a'],
      ] as const)
        if (x + 12 < w) {
          rect(c, left + x, foot - 14 - bh, 12, bh, col);
          c.fillStyle = 'rgb(255 255 255 / 0.3)';
          for (let y = foot - 12 - bh; y < foot - 16; y += 4) c.fillRect(left + x + 2, y, 8, 1.5);
        }
      rect(c, left, foot - 14, w, 14, '#4a6a7a');
      c.fillStyle = 'rgb(255 255 255 / 0.35)';
      for (let x = 2; x < w; x += 7) c.fillRect(left + x, foot - 8, 3, 0.6);
      board(c, 'SALFORD QUAYS', left + w / 2, foot - 4, '#1a1a1a', 3);
      break;
    }
  }
}

// ---------- the money at the Etihad ----------

/** A pumpjack, nodding away: its post from (x, y) down `h`, and the beam on top. */
function pumpjack(c: Ctx, x: number, y: number, h: number, now: number, phase: number) {
  rect(c, x - 1, y - 1, 2, h, '#2a2a2a');
  c.save();
  c.translate(x, y);
  c.rotate(Math.sin(now / 600 + phase) * 0.25);
  rect(c, -9, -1.5, 18, 3, '#3a3a3a');
  rect(c, 8, -3, 3, 6, '#3a3a3a');
  c.restore();
}

/** A black slick of oil, centred on (x, y). */
function oilSlick(c: Ctx, x: number, y: number, r: number) {
  c.fillStyle = 'rgb(10 10 14 / 0.55)';
  c.beginPath();
  c.ellipse(x, y, r, 1.6, 0, 0, Math.PI * 2);
  c.fill();
}

/** One oil barrel, its top left at (x, y). */
function oilBarrel(c: Ctx, x: number, y: number) {
  rect(c, x, y, 4.5, 6, '#1a1a1a');
  rect(c, x, y + 1, 4.5, 1, '#f2b705');
  rect(c, x, y + 4, 4.5, 1, '#f2b705');
  rect(c, x + 0.5, y + 0.5, 1, 5, 'rgb(255 255 255 / 0.2)');
}

/** A pyramid of barrels three high, `n` along the bottom, standing on `base`. */
function barrels(c: Ctx, x: number, base: number, n: number) {
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < n - row * 2; i++) oilBarrel(c, x + row * 2.5 + i * 5, base - 7 - row * 6);
}

/** A sack of cash with a £ on it, centred on (x, y). */
function cashSack(c: Ctx, x: number, y: number) {
  c.fillStyle = '#c8a860';
  c.beginPath();
  c.ellipse(x, y, 3, 3.5, 0, 0, Math.PI * 2);
  c.fill();
  rect(c, x - 1, y - 4.5, 2, 1.5, '#8a6a30');
  text(c, '£', x, y + 0.5, 4, '#2a6a2a');
}

/** Three gold bars, stacked. */
function goldBars(c: Ctx, x: number, y: number) {
  rect(c, x, y, 5, 2.5, '#f4c430');
  rect(c, x + 6, y, 5, 2.5, '#f4c430');
  rect(c, x + 3, y - 2.5, 5, 2.5, '#e0b020');
}

/** A bundle of notes, three high. */
function notes(c: Ctx, x: number, y: number) {
  for (let i = 0; i < 3; i++) {
    rect(c, x, y - i * 2, 7, 1.8, '#7ab060');
    rect(c, x + 3, y - i * 2, 1, 1.8, '#f2f0ea');
  }
}

/** `n` notes fluttering down through a stretch `w` by `h` from (left, top). */
function fallingNotes(
  c: Ctx,
  left: number,
  top: number,
  w: number,
  h: number,
  now: number,
  n: number,
) {
  for (let i = 0; i < n; i++) {
    const fall = ((now / 30 + i * 37) % (h + 10)) - 10;
    const nx = left + ((i * 53) % w) + Math.sin(now / 300 + i) * 3;
    c.save();
    c.translate(nx, top + fall);
    c.rotate(Math.sin(now / 200 + i) * 0.6);
    rect(c, -2, -1, 4, 2, '#7ab060');
    rect(c, -0.5, -1, 1, 2, '#f2f0ea');
    c.restore();
  }
}

/**
 * Inside the Etihad (the ground's room, offset by (ox, oy)): a pumpjack on the pitch over a slick
 * of oil, barrels piled on the seats, cash and gold along the touchline, and notes coming down
 * over everyone.
 */
export function paintCityRoom(
  c: Ctx,
  ox: number,
  oy: number,
  cols: number,
  rows: number,
  now: number,
) {
  oilSlick(c, ox + 150, oy + 62, 14);
  pumpjack(c, ox + 150, oy + 44, 18, now, 0.6);
  pumpjack(c, ox + 26, oy + 44, 18, now, 2.1);
  // Barrels on the lower stands, either side of the way in.
  barrels(c, ox + 18, oy + 112, 9);
  barrels(c, ox + 130, oy + 112, 9);
  // Cash and gold along the touchline, clear of the legend and the centre circle.
  for (const x of [70, 78, 86, 120, 128, 136]) cashSack(c, ox + x, oy + 60);
  goldBars(c, ox + 72, oy + 54);
  goldBars(c, ox + 122, oy + 54);
  notes(c, ox + 166, oy + 60);
  notes(c, ox + 4, oy + 60);
  // The far stand stuffed with notes, either side of the banner.
  for (let x = 20; x < cols * TILE - 20; x += 12) if (x < 60 || x > 130) notes(c, ox + x, oy + 28);
  fallingNotes(c, ox, oy, cols * TILE, rows * TILE, now, 24);
}

/** How far into the top of a ground's stretch its roof can rise. */
const RISE = 10;

/** Everything in a map's `scenery`, in world pixels offset by (ox, oy). */
export function paintScenery(
  c: Ctx,
  scenery: Scenery[],
  ox: number,
  oy: number,
  doorX: (s: Scenery) => number,
  now = 0,
) {
  for (const s of scenery) {
    const left = ox + s.x0 * TILE;
    const top = oy + s.y0 * TILE;
    const w = (s.x1 - s.x0 + 1) * TILE;
    const h = (s.y1 - s.y0 + 1) * TILE;
    c.save();
    c.beginPath();
    c.rect(left, top - 24, w, h + 24);
    c.clip();
    // Sky behind it all, where the wall tiles under the drawing would otherwise show.
    rect(c, left, top, w, h, '#b4d0e4');
    // A ground's roof, arch or cockerel rises into the top of its stretch, which stays sky.
    if (s.kind === 'stadium')
      paintStadium(c, now, s.club, left, top + RISE, w, h - RISE, ox + doorX(s) * TILE);
    else paintLandmark(c, s.kind, s.label ?? '', left, top, w, h, now);
    c.restore();
  }
}

/** A ground's pitch from inside: the centre circle, and the club's crest on the centre spot. */
export function paintCentreSpot(c: Ctx, club: ClubId, x: number, y: number) {
  c.strokeStyle = 'rgb(255 255 255 / 0.8)';
  c.lineWidth = 1;
  c.beginPath();
  c.arc(x, y, 13, 0, Math.PI * 2);
  c.stroke();
  paintCrest(c, club, x, y, 20);
}

/** A ground's crest on a banner hung along the front of the far stand. */
export function paintStandBanner(c: Ctx, club: ClubId, x: number, y: number) {
  const g = GROUNDS[club];
  rect(c, x - 30, y - 6, 60, 12, '#1a1a1a');
  rect(c, x - 29.5, y - 5.5, 59, 11, g.main);
  text(c, g.name, x + 5, y + 0.5, 5, '#ffffff', 44);
  paintCrest(c, club, x - 23, y, 10);
}

/** A platform on the King's Cross board: its number, where it goes, and the crests it's for. */
export interface BoardRow {
  platform: number;
  to: string;
  clubs: { id: ClubId; won: boolean }[];
  /** The train for your next match: lit up. */
  next: boolean;
}

/**
 * The King's Cross departures board, along the back wall: a panel over each platform's guard
 * (at tile x = 2n - 1 on row 3), with the platform number, where it goes and the crest of every
 * club it's for, the ones you've beaten greyed out, and your next train lit up.
 */
export function paintKxBoard(c: Ctx, rows: BoardRow[], ox: number, oy: number, now: number) {
  const wide = (2 * rows.length + 1) * TILE - 12;
  rect(c, ox + 6, oy + 3, wide, 29, '#1a1a1e');
  rect(c, ox + 6, oy + 3, wide, 1, '#44444c');
  for (const r of rows) {
    const cx = ox + (2 * r.platform - 1) * TILE + 8;
    const left = cx - 13;
    const top = oy + 5;
    rect(c, left, top, 26, 25, r.next ? '#2a2410' : '#101014');
    if (r.next && Math.floor(now / 500) % 2 === 0) {
      c.strokeStyle = '#f8d030';
      c.lineWidth = 1;
      c.strokeRect(left + 0.5, top + 0.5, 25, 24);
    }
    rect(c, cx - 4, top + 1.5, 8, 8, '#f8b820');
    text(c, String(r.platform), cx, top + 6, 7, '#1a1a1e');
    text(c, r.to.toUpperCase(), cx, top + 13, 4, '#f8b820', 25);
    const n = r.clubs.length;
    const size = n > 2 ? 6 : 7;
    const step = size + 0.5;
    r.clubs.forEach((club, i) => {
      const x = cx - ((n - 1) * step) / 2 + i * step;
      c.save();
      if (club.won) c.globalAlpha = 0.35;
      paintCrest(c, club.id, x, top + 20, size);
      c.restore();
    });
  }
}
