import type { ClubId, Scenery } from '@/lib/story/world';
import { paintCrest } from './crests';
import { TILE } from './pixels';

/**
 * The Premier League towns' own looks in the London expansion (premier.ts), drawn over the map
 * in world pixels, 2D only: each ground as a football stadium from the outside, with its roof,
 * floodlights, the club's colours, its name in big letters and its crest over the turnstiles, and
 * each town's landmarks, so Manchester looks like Manchester. The tiles underneath, and so
 * walking, doors and saves, are the same as any building's.
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
  /** The name across the front, as the club puts it. */
  name: string;
  /** What the outside is made of. */
  wall: 'brick' | 'clad' | 'glass' | 'white';
  /** The wall's colour, its trim, and the lettering. */
  main: string;
  trim: string;
  letters: string;
  /** The roof: a flat cantilever, white arches, a bowl, or the Etihad's masts. */
  roof: 'cantilever' | 'arches' | 'bowl' | 'masts' | 'gable';
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
    wall: 'brick',
    main: '#1b458f',
    trim: '#c4122e',
    letters: '#ffffff',
    roof: 'cantilever',
    floodlights: true,
  },
  villa: {
    name: 'VILLA PARK',
    wall: 'brick',
    main: '#670e36',
    trim: '#95bfe5',
    letters: '#fee505',
    roof: 'gable',
    floodlights: true,
  },
  everton: {
    name: 'EVERTON STADIUM',
    wall: 'brick',
    main: '#003399',
    trim: '#ffffff',
    letters: '#ffffff',
    roof: 'gable',
  },
  leeds: {
    name: 'ELLAND ROAD',
    wall: 'clad',
    main: '#ffffff',
    trim: '#1d428a',
    letters: '#1d428a',
    roof: 'cantilever',
    floodlights: true,
  },
  newcastle: {
    name: 'ST JAMES’ PARK',
    wall: 'clad',
    main: '#241f20',
    trim: '#ffffff',
    letters: '#ffffff',
    roof: 'cantilever',
  },
  spurs: {
    name: 'TOTTENHAM HOTSPUR',
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
    wall: 'brick',
    main: '#c8102e',
    trim: '#f6eb61',
    letters: '#ffffff',
    roof: 'cantilever',
  },
  united: {
    name: 'MANCHESTER UNITED',
    wall: 'clad',
    main: '#da291c',
    trim: '#1a1a1a',
    letters: '#ffffff',
    roof: 'cantilever',
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
  const g = GROUNDS[club];
  const roofH = 9;
  const body = top + roofH;
  const bodyH = h - roofH;
  // The sky behind the roofline, and the stand rising up to it.
  // The walls.
  if (g.wall === 'brick') {
    brick(c, left, body, w, bodyH, '#9a4a36');
    rect(c, left, body + 2, w, 9, g.main);
  } else if (g.wall === 'glass') {
    rect(c, left, body, w, bodyH, '#8aa4bc');
    c.fillStyle = 'rgb(255 255 255 / 0.25)';
    for (let x = 0; x < w; x += 6) c.fillRect(left + x, body, 3, bodyH);
    rect(c, left, body + 2, w, 9, g.main);
  } else if (g.wall === 'white') {
    rect(c, left, body, w, bodyH, '#f2f4f6');
    c.fillStyle = 'rgb(0 0 0 / 0.08)';
    for (let x = 2; x < w; x += 5) c.fillRect(left + x, body, 1, bodyH);
    rect(c, left, body + bodyH - 14, w, 2, g.main);
  } else {
    rect(c, left, body, w, bodyH, g.main);
    c.fillStyle = 'rgb(0 0 0 / 0.12)';
    for (let x = 2; x < w; x += 4) c.fillRect(left + x, body, 1, bodyH);
    rect(c, left, body + 11, w, 1.5, g.trim);
  }
  // Newcastle's black and white, in panels along the stand.
  if (club === 'newcastle') {
    for (let x = 0; x < w; x += 8) rect(c, left + x, body + 12, 4, bodyH - 12, '#f4f4f4');
  }
  // Stairways up the outside, at each end.
  for (const x of [left + 4, left + w - 10]) {
    c.fillStyle = 'rgb(0 0 0 / 0.25)';
    for (let i = 0; i < 4; i++) c.fillRect(x + i * 1.5, body + 13 + i * 4, 6, 1);
  }
  // The top of the stand showing under the roof: seats in the club's colour, and a crowd.
  rect(c, left, body - 3, w, 4, '#2a2a30');
  for (let x = 0; x < w; x += 2) {
    const k = (x * 7 + club.length * 13) % 5;
    rect(c, left + x, body - 2.5, 1.5, 1.2, k < 2 ? g.main : k < 4 ? '#e8c8a8' : '#ffffff');
    rect(c, left + x + 1, body - 1, 1, 1.2, k === 1 ? '#ffffff' : g.trim);
  }
  // The roof, over the top of the stand.
  const roofC = '#e8ebef';
  if (g.roof === 'arches') {
    rect(c, left, body - 2, w, 3, roofC);
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(left, body);
    c.quadraticCurveTo(left + w / 2, top - 4, left + w, body);
    c.stroke();
    c.strokeStyle = '#c0c6ce';
    c.lineWidth = 0.6;
    c.beginPath();
    for (let x = 6; x < w; x += 6) {
      const t = x / w;
      const y = body - 2 - 4 * t * (1 - t) * (roofH + 2);
      c.moveTo(left + x, body);
      c.lineTo(left + x, y + 2);
    }
    c.stroke();
  } else if (g.roof === 'bowl') {
    c.fillStyle = roofC;
    c.beginPath();
    c.moveTo(left, body + 2);
    c.quadraticCurveTo(left + 2, top + 2, left + 14, top + 2);
    c.lineTo(left + w - 14, top + 2);
    c.quadraticCurveTo(left + w - 2, top + 2, left + w, body + 2);
    c.closePath();
    c.fill();
    rect(c, left + 8, body - 1, w - 16, 1.5, g.main);
  } else if (g.roof === 'gable') {
    rect(c, left, top + 4, w, roofH - 4, '#7c8088');
    // A gable over the middle, like the old fronts of the Holte End and the docks.
    c.fillStyle = g.wall === 'brick' ? '#9a4a36' : g.main;
    c.beginPath();
    c.moveTo(left + w / 2 - 16, body + 1);
    c.lineTo(left + w / 2, top + 1);
    c.lineTo(left + w / 2 + 16, body + 1);
    c.closePath();
    c.fill();
    c.strokeStyle = g.trim;
    c.lineWidth = 1;
    c.stroke();
  } else {
    // A cantilever: the roof's edge, and its trusses showing underneath.
    rect(c, left, top + 3, w, 4, roofC);
    rect(c, left, top + 7, w, 2, '#9aa0a8');
    c.strokeStyle = '#7a8088';
    c.lineWidth = 0.5;
    c.beginPath();
    for (let x = 0; x < w; x += 8) {
      c.moveTo(left + x, top + 7);
      c.lineTo(left + x + 4, top + 3);
      c.lineTo(left + x + 8, top + 7);
    }
    c.stroke();
  }
  if (g.roof === 'masts') {
    // The Etihad: a white roof hung from masts, on cables.
    rect(c, left, top + 5, w, 4, roofC);
    c.strokeStyle = '#ffffff';
    c.lineWidth = 0.5;
    c.beginPath();
    for (const mx of [left + 10, left + w / 2, left + w - 10]) {
      c.moveTo(mx, top + 9);
      c.lineTo(mx, top);
      for (const d of [-8, -4, 4, 8]) {
        c.moveTo(mx, top);
        c.lineTo(mx + d, top + 5);
      }
    }
    c.stroke();
    // The money: two pumpjacks nodding by the stand, oil barrels stacked along the front,
    // sacks of cash, gold bars and bundles of notes at the turnstiles, a slick of oil on the
    // pavement, and notes drifting down off the roof. And the charge sheet, for everyone to see.
    pumpjack(c, left + 18, body + 7, bodyH - 6, now, 0);
    pumpjack(c, left + w - 22, body + 7, bodyH - 6, now, 1.7);
    const base = top + h;
    oilSlick(c, left + w / 2, base - 0.5, w / 2 - 6);
    // A pyramid of barrels each side of the door.
    barrels(c, left + 24, base, 7);
    barrels(c, left + 84, base, 7);
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
    // Gold bars and bundles of notes on top of the barrels.
    for (const gx of [left + 30, left + 90]) goldBars(c, gx, base - 22);
    for (const nx of [left + 44, left + 104]) notes(c, nx, base - 21);
    fallingNotes(c, left, top, w, h, now, 14);
    rect(c, left + 39, body + 12, 21, 12, '#fffdf0');
    rect(c, left + 39, body + 12, 21, 2, '#c8102e');
    text(c, '115 CHARGES', left + 49.5, body + 16.5, 3, '#c8102e', 20);
    text(c, 'APPEALING', left + 49.5, body + 21, 3.5, '#1a1a1a', 20);
    // Its round ramp towers at the corners.
    for (const tx of [left + 2, left + w - 10]) {
      rect(c, tx, body, 8, bodyH, '#3b4a6b');
      c.fillStyle = 'rgb(255 255 255 / 0.35)';
      for (let i = 0; i < bodyH; i += 4) c.fillRect(tx, body + i, 8, 1);
    }
  }
  if (g.floodlights || g.roof === 'cantilever' || g.roof === 'gable') {
    floodlight(c, left + 3, top - 2, body + 2);
    floodlight(c, left + w - 3, top - 2, body + 2);
  }
  // The name across the front, in the club's letters.
  const bandY = body + 6.5;
  if (g.wall === 'white') rect(c, left + 6, body + 2, w - 12, 9, '#ffffff');
  text(c, g.name, left + w / 2, bandY + 0.5, 7, g.letters, w - 12);
  // The turnstiles at the door, and the crest over them.
  const dx = door;
  const dy = top + h - TILE;
  rect(c, dx + 1, dy + 3, TILE - 2, TILE - 3, '#22242a');
  for (let i = 0; i < 3; i++) rect(c, dx + 3 + i * 4, dy + 6, 1, TILE - 7, '#8a8f98');
  rect(c, dx + 1, dy + 3, TILE - 2, 1.5, g.trim);
  text(c, 'TURNSTILES', dx + 8, dy + 1.2, 3, '#ffffff');
  const cx = dx + 8;
  const cy = body + 19.5;
  c.fillStyle = 'rgb(0 0 0 / 0.25)';
  c.beginPath();
  c.arc(cx, cy, 9, 0, Math.PI * 2);
  c.fill();
  paintCrest(c, club, cx, cy, 16);
  // Spurs' cockerel up on the roof as well, and Villa's gable lion's star.
  if (club === 'spurs') paintCrest(c, club, left + w / 2, top + 3, 7);
  // A shade along the bottom where it meets the pavement.
  rect(c, left, top + h - 1, w, 1, 'rgb(0 0 0 / 0.3)');
}

// ---------- the towns' landmarks ----------

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

function paintLandmark(
  c: Ctx,
  kind: Scenery['kind'],
  left: number,
  top: number,
  w: number,
  h: number,
) {
  const foot = top + h;
  switch (kind) {
    case 'manchester-town-hall': {
      // Manchester Town Hall: Gothic sandstone, with its clock tower and spire in the middle.
      rect(c, left, top + 14, w, h - 14, '#b89a72');
      rect(c, left, top + 12, w, 3, '#7c6648');
      for (let x = left + 4; x < left + w - 4; x += 8) {
        gothic(c, x, top + 19, 4, 9);
        if (Math.abs(x + 2 - (left + w / 2)) > 8) gothic(c, x, top + 33, 4, 10);
      }
      const tx = left + w / 2 - 6;
      rect(c, tx, top + 2, 12, h - 2, '#a88a62');
      clock(c, tx + 6, top + 10, 3.5);
      c.fillStyle = '#5a6a6a';
      c.beginPath();
      c.moveTo(tx - 1, top + 3);
      c.lineTo(tx + 6, top - 10);
      c.lineTo(tx + 13, top + 3);
      c.closePath();
      c.fill();
      rect(c, tx + 3, foot - 11, 6, 11, '#3a2a1a');
      board(c, 'TOWN HALL', left + w / 2, top + 15.5, '#7c6648', 4);
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
    case 'liver-building': {
      // The Royal Liver Building: white stone, two clock towers with green domes and a Liver
      // Bird on each.
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
    case 'mersey': {
      // The Mersey ferry terminal at the Pier Head, with the ferry to Dublin.
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
    case 'leeds-town-hall': {
      // Leeds Town Hall: white Portland stone, a row of columns and the domed clock tower.
      rect(c, left, top + 16, w, h - 16, '#ece6d4');
      rect(c, left, top + 14, w, 3, '#cfc6ae');
      for (let x = left + 3; x < left + w - 2; x += 5) rect(c, x, top + 19, 2, h - 21, '#d8d0b8');
      const tx = left + w / 2 - 6;
      rect(c, tx, top + 2, 12, 14, '#e4dcc6');
      clock(c, tx + 6, top + 8, 3.5);
      c.fillStyle = '#c8bea0';
      c.beginPath();
      c.arc(tx + 6, top + 2, 5, Math.PI, 0);
      c.fill();
      rect(c, tx + 5.5, top - 7, 1, 5, '#8a8270');
      rect(c, tx + 3, foot - 10, 6, 10, '#3a2a1a');
      board(c, 'LEEDS', left + w / 2, top + 19, '#1d428a', 5);
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
    case 'selfridges': {
      // Selfridges at the Bullring: a blue blob covered in silver discs, and the bronze bull.
      c.fillStyle = '#2a4c9c';
      c.beginPath();
      c.moveTo(left + 2, foot);
      c.quadraticCurveTo(left - 2, top + 2, left + w * 0.4, top + 2);
      c.quadraticCurveTo(left + w + 2, top - 2, left + w - 2, foot);
      c.closePath();
      c.fill();
      c.save();
      c.clip();
      for (let y = top; y < foot; y += 4)
        for (let x = left + ((y / 4) % 2) * 2; x < left + w; x += 4) {
          c.fillStyle = '#d8dce4';
          c.beginPath();
          c.arc(x, y, 1.3, 0, Math.PI * 2);
          c.fill();
        }
      c.restore();
      board(c, 'BULLRING', left + w / 2, top + 16, '#1a1a1a', 5);
      // The bull, on the pavement in front.
      const bx = left + w / 2;
      const by = foot - 3;
      c.fillStyle = '#7a5630';
      c.beginPath();
      c.ellipse(bx, by - 5, 7, 4, 0, 0, Math.PI * 2);
      c.fill();
      c.fillRect(bx - 6, by - 3, 2, 4);
      c.fillRect(bx + 4, by - 3, 2, 4);
      c.beginPath();
      c.ellipse(bx - 8, by - 6, 3, 2.5, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#e8d8b0';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(bx - 10, by - 8);
      c.lineTo(bx - 11, by - 10);
      c.moveTo(bx - 7, by - 8);
      c.lineTo(bx - 6, by - 10);
      c.stroke();
      break;
    }
    case 'canal': {
      // A canal under a brick bridge, a narrowboat on it: more canals than Venice.
      brick(c, left, top + 4, w, h - 4, '#8c5440');
      rect(c, left, foot - 16, w, 16, '#2c5a5a');
      c.fillStyle = '#1e3a3a';
      c.beginPath();
      c.arc(left + w / 2, foot - 2, 10, Math.PI, 0);
      c.fill();
      rect(c, left + 3, foot - 8, w - 6, 4, '#2f7a3a');
      rect(c, left + 5, foot - 11, w - 14, 3, '#c8102e');
      board(c, 'BIRMINGHAM', left + w / 2, top + 10, '#8c1d2c', 5);
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
      rect(c, left, top, w, h, '#b4d0e4');
      c.fillStyle = '#5a9a4a';
      c.beginPath();
      c.moveTo(left, foot);
      c.quadraticCurveTo(left + w / 2, top + 18, left + w, foot);
      c.closePath();
      c.fill();
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
    case 'underground': {
      // An Underground entrance: the roundel and the tiled arch down to the trains.
      rect(c, left, top + 8, w, h - 8, '#e6e0d0');
      rect(c, left + 3, foot - 16, w - 6, 16, '#1a1a1a');
      c.fillStyle = '#7a1a1a';
      c.fillRect(left, top + 8, w, 3);
      const rx = left + w / 2;
      const ry = top + 12;
      c.strokeStyle = '#dc241f';
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(rx, ry, 7, 0, Math.PI * 2);
      c.stroke();
      rect(c, rx - 11, ry - 2.5, 22, 5, '#0019a8');
      text(c, 'UNDERGROUND', rx, ry + 0.5, 3, '#ffffff', 21);
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

/** A Tube roundel on a post, with its station's name: for the grounds round London. */
export function roundel(c: Ctx, name: string, x: number, y: number) {
  rect(c, x - 0.5, y, 1, 10, '#3a3e46');
  c.strokeStyle = '#dc241f';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(x, y, 5, 0, Math.PI * 2);
  c.stroke();
  c.font = `700 3px ${FONT}`;
  const w = Math.max(14, Math.ceil(c.measureText(name).width) + 3);
  rect(c, x - w / 2, y - 2, w, 4, '#0019a8');
  text(c, name, x, y + 0.3, 3, '#ffffff');
}

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
    c.rect(left, top - 20, w, h + 20);
    c.clip();
    if (s.kind === 'stadium') paintStadium(c, now, s.club, left, top, w, h, ox + doorX(s) * TILE);
    else paintLandmark(c, s.kind, left, top, w, h);
    c.restore();
    if (s.kind === 'stadium' && s.tube) roundel(c, s.tube, left + 10, top + h - 26);
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
  rect(c, ox + 6, oy + 3, 15 * TILE - 12, 29, '#1a1a1e');
  rect(c, ox + 6, oy + 3, 15 * TILE - 12, 1, '#44444c');
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
    text(c, r.to.toUpperCase(), cx, top + 13, 4, '#f8b820', 24);
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
