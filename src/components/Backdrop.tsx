'use client';

import { useEffect, useRef } from 'react';
import type { Scene } from './BattleScreen';

/**
 * The battlefield, painted in pixels like the 5th generation's backdrops: a far layer of sky,
 * hills or skyline with haze over it, a near layer of ground with the two platforms, and a
 * drifting layer of clouds (or twinkling stars) between them. Each scene is painted once and
 * kept, so a battle costs nothing per frame but the CSS that moves the clouds.
 */

/** The backdrop's own pixels; the field is 3 : 2. */
export const BACK_W = 300;
export const BACK_H = 200;
/** Where the far layer meets the ground. */
const HORIZON = 96;

type Ctx = CanvasRenderingContext2D;
type Layers = { far: HTMLCanvasElement; drift: HTMLCanvasElement; near: HTMLCanvasElement };

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function layer(w = BACK_W, h = BACK_H): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

const px = (c: Ctx, x: number, y: number, w: number, h: number, colour: string) => {
  c.fillStyle = colour;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** A filled ellipse made of whole-pixel rows, so its edge stays crisp. */
function oval(c: Ctx, cx: number, cy: number, rx: number, ry: number, colour: string) {
  c.fillStyle = colour;
  for (let y = -ry; y <= ry; y++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)));
    c.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2, 1);
  }
}

/** A vertical gradient in bands, dithered where two bands meet, like a handheld's sky. */
function bands(c: Ctx, y0: number, y1: number, colours: string[]) {
  const n = colours.length;
  const h = (y1 - y0) / n;
  colours.forEach((col, i) => px(c, 0, y0 + i * h, BACK_W, h + 1, col));
  for (let i = 1; i < n; i++) {
    const y = Math.round(y0 + i * h);
    for (let x = 0; x < BACK_W; x += 2) {
      px(c, x + (y % 2), y - 1, 1, 1, colours[i]);
      px(c, x + ((y + 1) % 2), y, 1, 1, colours[i - 1]);
    }
  }
}

/** A ridge line across the screen: a hill or mountain range, filled to the bottom. */
function ridge(
  c: Ctx,
  base: number,
  height: number,
  seed: number,
  colour: string,
  light?: string,
  rough = 1,
) {
  const r = rng(seed);
  const phase = [r() * 6, r() * 6, r() * 6];
  const top = (x: number) =>
    base -
    height *
      (0.55 +
        0.3 * Math.sin(x / 47 + phase[0]) +
        0.15 * Math.sin(x / 19 + phase[1]) * rough +
        0.06 * Math.sin(x / 7 + phase[2]) * rough);
  for (let x = 0; x < BACK_W; x++) {
    const y = Math.round(top(x));
    px(c, x, y, 1, BACK_H - y, colour);
    if (light && top(x + 1) > top(x)) px(c, x, y, 1, 2, light);
  }
  return top;
}

function cloud(c: Ctx, x: number, y: number, size: number, r: () => number, tint: string) {
  const puffs = 3 + Math.floor(r() * 3);
  for (let i = 0; i < puffs; i++) {
    const cx = x + (i - puffs / 2) * size * 0.9 + r() * 4;
    const cy = y - Math.sin((i / (puffs - 1)) * Math.PI) * size * 0.7;
    oval(c, cx, cy + 2, size, size * 0.62, 'rgb(150 180 210 / 0.55)');
    oval(c, cx, cy, size, size * 0.6, tint);
    oval(c, cx - size * 0.25, cy - size * 0.2, size * 0.55, size * 0.3, '#ffffff');
  }
  px(c, x - puffs * size * 0.5, y + 2, puffs * size * 0.95, 2, 'rgb(170 196 220 / 0.9)');
}

/** A round tree in the distance: a dark crown with a lit top left. */
function farTree(c: Ctx, x: number, y: number, s: number, dark: string, mid: string, lit: string) {
  px(c, x - 0.5, y, 1, s * 0.6, '#3a2c20');
  oval(c, x, y - s * 0.3, s * 0.75, s * 0.7, dark);
  oval(c, x - s * 0.15, y - s * 0.45, s * 0.55, s * 0.5, mid);
  oval(c, x - s * 0.3, y - s * 0.62, s * 0.25, s * 0.2, lit);
}

function farPine(c: Ctx, x: number, y: number, s: number, dark: string, lit: string) {
  for (let i = 0; i < s; i++) {
    const w = Math.round(((i % 4) + 1 + i / 2) * 0.55);
    px(c, x - w, y - s + i, w * 2 + 1, 1, dark);
    if (i % 4 === 0) px(c, x - w, y - s + i, w, 1, lit);
  }
  px(c, x, y, 1, 2, '#3a2c20');
}

/** Grass texture: strokes of light and dark that get bigger toward the front. */
function grassTexture(c: Ctx, y0: number, y1: number, r: () => number, cols: string[]) {
  for (let i = 0; i < 1600; i++) {
    const y = y0 + (y1 - y0) * Math.sqrt(r());
    const depth = (y - y0) / (y1 - y0);
    const x = r() * BACK_W;
    const h = 1 + Math.round(depth * 3 * r());
    px(c, x, y - h, 1, h, cols[Math.floor(r() * cols.length)]);
  }
}

/**
 * A platform: an oval of ground with a lit top, a darker rim and an earthy side, sitting on
 * its own shadow.
 */
function platform(
  c: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  look: { top: string; lit: string; rim: string; side: string; detail?: (c: Ctx) => void },
) {
  oval(c, cx + 3, cy + ry * 0.55, rx + 2, ry + 1, 'rgb(0 0 0 / 0.18)');
  oval(c, cx, cy + 3, rx, ry, look.side);
  oval(c, cx, cy, rx, ry, look.rim);
  oval(c, cx, cy - 0.5, rx - 2, ry - 1.5, look.top);
  oval(c, cx - rx * 0.18, cy - ry * 0.3, rx * 0.55, ry * 0.42, look.lit);
  look.detail?.(c);
}

/** Where the platforms sit: over the left and right of the field, as the sprites stand. */
const FOE = { cx: 0.74 * BACK_W, cy: 0.395 * BACK_H, rx: 0.2 * BACK_W, ry: 0.06 * BACK_H };
const YOU = { cx: 0.22 * BACK_W, cy: 0.88 * BACK_H, rx: 0.27 * BACK_W, ry: 0.08 * BACK_H };

function tufts(c: Ctx, p: typeof FOE, r: () => number, cols: string[]) {
  for (let i = 0; i < p.rx * 1.2; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 0.85;
    const x = p.cx + Math.cos(a) * p.rx * d;
    const y = p.cy + Math.sin(a) * p.ry * d;
    px(c, x, y - 2, 1, 2, cols[i % cols.length]);
    if (r() < 0.3) px(c, x + 1, y - 1, 1, 1, cols[(i + 1) % cols.length]);
  }
}

// ---------- the four places ----------

function field(): Layers {
  const r = rng(7);
  const [far, f] = layer();
  bands(f, 0, HORIZON, [
    '#4aa4ec',
    '#5cb2f0',
    '#72c0f4',
    '#8ccdf6',
    '#a8dbf8',
    '#c4e8fa',
    '#dcf2fc',
  ]);
  // The sun, top left, with a soft glow.
  for (let i = 5; i > 0; i--) oval(f, 46, 22, 7 + i * 5, 7 + i * 5, `rgb(255 250 220 / ${0.07})`);
  oval(f, 46, 22, 8, 8, '#fffbe8');
  // Mountains far off, blue with haze; then green hills with stone walls and fields.
  ridge(f, HORIZON - 14, 26, 3, '#8eb4cc', '#b4d0e0', 1.3);
  ridge(f, HORIZON - 6, 18, 11, '#7aa6a0', '#a0c4b4');
  const hill = ridge(f, HORIZON + 2, 16, 23, '#5c9c58', '#78b46a', 0.6);
  // A patchwork of fields on the hill, split by grey stone walls.
  for (let x = 6; x < BACK_W; x += 22 + Math.floor(r() * 18)) {
    const y = Math.round(hill(x));
    for (let d = 0; d < HORIZON + 6 - y; d++) px(f, x + d * 0.6, y + d, 1, 1, '#9aa294');
  }
  for (let x = 0; x < BACK_W; x += 2) {
    const y = Math.round(hill(x)) + 6 + Math.round(Math.sin(x / 31) * 2);
    if (y < HORIZON + 6) px(f, x, y, 2, 1, '#9aa294');
  }
  // A tree line along the far edge of the field, round trees and pines.
  for (let x = -4; x < BACK_W + 8; x += 7 + r() * 9) {
    const s = 9 + r() * 7;
    if (r() < 0.35) farPine(f, x, HORIZON + 6, s + 4, '#1f5a3c', '#3e8a52');
    else farTree(f, x, HORIZON + 6, s, '#2c6a3a', '#3f8a46', '#6cb45c');
  }
  // Haze over everything far away.
  const haze = f.createLinearGradient(0, HORIZON - 30, 0, HORIZON + 8);
  haze.addColorStop(0, 'rgb(220 240 250 / 0)');
  haze.addColorStop(1, 'rgb(220 240 250 / 0.28)');
  f.fillStyle = haze;
  f.fillRect(0, 0, BACK_W, HORIZON + 8);

  const [near, n] = layer();
  const g = n.createLinearGradient(0, HORIZON + 6, 0, BACK_H);
  g.addColorStop(0, '#7cc45e');
  g.addColorStop(0.5, '#68b850');
  g.addColorStop(1, '#4c9c40');
  n.fillStyle = g;
  n.fillRect(0, HORIZON + 6, BACK_W, BACK_H);
  // Light falling across the grass, and a mown stripe or two.
  for (let i = 0; i < 4; i++) {
    n.fillStyle = `rgb(255 255 200 / ${0.05 + i * 0.01})`;
    n.beginPath();
    n.ellipse(60 + i * 70, HORIZON + 34 + i * 18, 90, 10 + i * 3, 0, 0, Math.PI * 2);
    n.fill();
  }
  grassTexture(n, HORIZON + 7, BACK_H, r, ['#4c9a3c', '#58a846', '#90d070', '#a8dc80', '#3e8a34']);
  // Wild flowers in the near grass.
  for (let i = 0; i < 46; i++) {
    const y = HORIZON + 20 + r() * (BACK_H - HORIZON - 20);
    const x = r() * BACK_W;
    const col = ['#ffffff', '#f8e048', '#f070a0', '#b088f0'][i % 4];
    px(n, x, y, 1, 1, col);
    if (y > 150) px(n, x + 1, y, 1, 1, col);
  }
  // Long grass right at the front, out of focus and dark, for depth.
  for (let i = 0; i < 70; i++) {
    const x = r() * BACK_W;
    const h = 6 + r() * 10;
    const lean = r() < 0.5 ? -1 : 1;
    for (let k = 0; k < h; k++)
      px(n, x + (lean * k * k) / (h * 3), BACK_H - k, 1.5, 1, k < h / 2 ? '#2e7a30' : '#3c8c38');
  }
  const grassy = {
    top: '#8cd468',
    lit: '#b4e888',
    rim: '#3e8c38',
    side: '#7a5a34',
  };
  platform(n, FOE.cx, FOE.cy, FOE.rx, FOE.ry, grassy);
  tufts(n, FOE, r, ['#4a9a40', '#62b04c', '#c4f098']);
  platform(n, YOU.cx, YOU.cy, YOU.rx, YOU.ry, grassy);
  tufts(n, YOU, r, ['#4a9a40', '#62b04c', '#c4f098']);

  const [drift, d] = layer(BACK_W * 2, HORIZON);
  for (let i = 0; i < 7; i++) {
    cloud(d, 20 + i * 86 + r() * 30, 18 + r() * 34, 6 + r() * 6, r, '#f4faff');
  }
  return { far, drift, near };
}

function city(): Layers {
  const r = rng(19);
  const [far, f] = layer();
  bands(f, 0, HORIZON, ['#7ea8d4', '#90b6dc', '#a4c4e2', '#b8d2e8', '#ccdeee', '#dee8f2']);
  // Far skyline in the haze: spires, cranes and the Poolbeg chimneys.
  for (let x = 0; x < BACK_W;) {
    const w = 8 + r() * 16;
    const h = 10 + r() * 22;
    px(f, x, HORIZON - h, w, h, '#a4b4c8');
    x += w + r() * 3;
  }
  for (const cx of [222, 234]) {
    px(f, cx, HORIZON - 54, 5, 54, '#e8ecf0');
    for (let y = HORIZON - 54; y < HORIZON; y += 9) px(f, cx, y, 5, 4, '#d05a48');
  }
  px(f, 70, HORIZON - 46, 2, 30, '#a4b4c8');
  for (let i = 0; i < 8; i++) px(f, 71 - i * 0.4, HORIZON - 46 - i * 2, 1, 2, '#a4b4c8');
  // A Georgian terrace: red brick, sash windows, coloured doors with fanlights, railings.
  const doors = ['#c8283c', '#2858a8', '#f0c020', '#2c8a50', '#7a3c98', '#202428'];
  for (let x = -6, i = 0; x < BACK_W; x += 38, i++) {
    const top = HORIZON - 40 - (i % 3) * 3;
    px(f, x, top, 38, HORIZON + 10 - top, i % 2 ? '#a24a34' : '#b25438');
    for (let y = top + 2; y < HORIZON + 10; y += 3)
      for (let bx = x + ((y / 3) % 2) * 2; bx < x + 38; bx += 4) px(f, bx, y, 1, 1, '#8c3c2a');
    px(f, x, top - 2, 38, 2, '#5c6470');
    for (const cx of [x + 22, x + 32]) px(f, cx, top - 6, 3, 4, '#7a3a2c');
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++) {
        const wx = x + 4 + col * 11;
        const wy = top + 4 + row * 12;
        if (row === 2 && col === 0) continue;
        px(f, wx - 1, wy - 1, 8, 10 - row, '#f0ece0');
        px(f, wx, wy, 6, 8 - row, row === 0 && col === 2 ? '#f8e0a0' : '#46607a');
        px(f, wx, wy + 3, 6, 1, '#f0ece0');
        px(f, wx + 2, wy, 1, 8 - row, '#f0ece0');
        px(f, wx, wy, 2, 2, 'rgb(255 255 255 / 0.35)');
      }
    // The door, with its fanlight, steps and boot scraper.
    const dx = x + 4;
    const dy = top + 28;
    px(f, dx - 1, dy - 3, 9, HORIZON + 10 - dy + 3, '#f0ece0');
    oval(f, dx + 3.5, dy - 1, 3, 2, '#e8d090');
    px(f, dx, dy, 7, HORIZON + 8 - dy, doors[i % doors.length]);
    px(f, dx + 5, dy + 5, 1, 1, '#f0c040');
    px(f, dx - 2, HORIZON + 8, 11, 2, '#c8c8c0');
    // Railings along the basement.
    for (let rx = x + 12; rx < x + 38; rx += 2) px(f, rx, HORIZON + 2, 1, 8, '#202428');
    px(f, x + 12, HORIZON + 3, 26, 1, '#202428');
  }
  // Street lamps.
  for (const lx of [50, 160, 270]) {
    px(f, lx, HORIZON - 26, 2, 36, '#2a3038');
    px(f, lx - 3, HORIZON - 30, 8, 5, '#2a3038');
    px(f, lx - 2, HORIZON - 29, 6, 3, '#f8e8b0');
  }

  const [near, n] = layer();
  px(n, 0, HORIZON + 10, BACK_W, 6, '#b8bcc4');
  px(n, 0, HORIZON + 10, BACK_W, 1, '#e0e4e8');
  for (let x = 0; x < BACK_W; x += 18) px(n, x, HORIZON + 10, 1, 6, '#9aa0aa');
  px(n, 0, HORIZON + 16, BACK_W, 2, '#8a909a');
  // Cobbles, larger toward the front, set in dark mortar.
  px(n, 0, HORIZON + 18, BACK_W, BACK_H, '#6a707a');
  for (let y = HORIZON + 18, row = 0; y < BACK_H; row++) {
    const h = 3 + Math.floor(((y - HORIZON) / (BACK_H - HORIZON)) * 5);
    const w = h * 1.6;
    for (let x = -((row % 2) * w) / 2; x < BACK_W; x += w) {
      const shade = ['#8c929c', '#9aa0aa', '#a6acb4', '#868c96'][Math.floor(r() * 4)];
      px(n, x, y, w - 1, h - 1, shade);
      px(n, x, y, w - 1, 1, '#bcc2ca');
    }
    y += h;
  }
  const flags = {
    top: '#d8d4cc',
    lit: '#ece8e0',
    rim: '#8a8478',
    side: '#5c5850',
    detail: (c: Ctx) => {
      for (const p of [FOE, YOU])
        for (let i = -2; i <= 2; i++)
          px(c, p.cx + (i * p.rx) / 3, p.cy - p.ry + 2, 1, p.ry * 2 - 3, '#b8b4ac');
    },
  };
  platform(n, FOE.cx, FOE.cy, FOE.rx, FOE.ry, flags);
  platform(n, YOU.cx, YOU.cy, YOU.rx, YOU.ry, flags);

  const [drift, d] = layer(BACK_W * 2, HORIZON);
  for (let i = 0; i < 5; i++)
    cloud(d, 30 + i * 120 + r() * 30, 12 + r() * 20, 5 + r() * 5, r, '#eef2f8');
  return { far, drift, near };
}

function gym(): Layers {
  const r = rng(31);
  const [far, f] = layer();
  // Wood-panelled walls, high windows with the light coming in, banners and the stands.
  px(f, 0, 0, BACK_W, HORIZON + 8, '#c89a64');
  for (let x = 0; x < BACK_W; x += 12) {
    px(f, x, 0, 1, HORIZON + 8, '#a87a4c');
    px(f, x + 1, 0, 1, HORIZON + 8, '#d8ac78');
  }
  px(f, 0, 0, BACK_W, 6, '#6a4a30');
  for (const wx of [24, 104, 184, 264]) {
    px(f, wx - 1, 9, 26, 30, '#6a4a30');
    px(f, wx, 10, 24, 28, '#bfe4f8');
    px(f, wx, 10, 24, 10, '#dcf2fc');
    px(f, wx + 11, 10, 2, 28, '#6a4a30');
    px(f, wx, 22, 24, 2, '#6a4a30');
  }
  // Banners in county colours.
  const colours: [string, string][] = [
    ['#f8d048', '#2858a8'],
    ['#2c8a50', '#f4f4f4'],
    ['#2858a8', '#f8d048'],
    ['#c8283c', '#f4f4f4'],
  ];
  colours.forEach(([a, b], i) => {
    const bx = 60 + i * 60;
    px(f, bx, 8, 18, 30, a);
    px(f, bx, 18, 18, 8, b);
    for (let k = 0; k < 9; k++) px(f, bx + k * 2, 38, 1, 2 + (k % 2), a);
  });
  // The stands: rows of supporters, every one a coloured dot with a head.
  for (let row = 0; row < 4; row++) {
    const y = HORIZON - 34 + row * 9;
    px(f, 0, y + 6, BACK_W, 3, '#7a5434');
    for (let x = (row % 2) * 3; x < BACK_W; x += 6) {
      if (r() < 0.15) continue;
      const shirt = ['#f8d048', '#2858a8', '#c8283c', '#2c8a50', '#f4f4f4', '#e07a30'][
        Math.floor(r() * 6)
      ];
      px(f, x, y + 2, 4, 4, shirt);
      px(f, x + 1, y, 2, 2, ['#f8d0a8', '#e8b890', '#c08a60', '#f0c098'][Math.floor(r() * 4)]);
      px(f, x + 1, y - 1, 2, 1, ['#3a2a1a', '#d8b060', '#8a4a22', '#202020'][Math.floor(r() * 4)]);
    }
  }
  px(f, 0, HORIZON + 2, BACK_W, 6, '#5a3c26');
  px(f, 0, HORIZON + 2, BACK_W, 1, '#8a6040');

  const [near, n] = layer();
  // Polished boards with lines, and the windows reflected in them.
  for (let y = HORIZON + 8; y < BACK_H; y++) {
    const depth = (y - HORIZON) / (BACK_H - HORIZON);
    px(n, 0, y, BACK_W, 1, depth < 0.5 ? '#dca46a' : '#d0965c');
  }
  for (let x = -BACK_W; x < BACK_W * 2; x += 14) {
    for (let y = HORIZON + 8; y < BACK_H; y++) {
      const spread = (y - HORIZON) / (BACK_H - HORIZON);
      px(n, BACK_W / 2 + (x - BACK_W / 2) * (0.35 + spread * 0.9), y, 1, 1, '#b87c48');
    }
  }
  for (const wx of [24, 104, 184, 264]) {
    n.fillStyle = 'rgb(255 255 255 / 0.13)';
    n.fillRect(wx + 2, HORIZON + 10, 20, 40);
    n.fillStyle = 'rgb(255 255 255 / 0.07)';
    n.fillRect(wx, HORIZON + 50, 24, 60);
  }
  // Court lines.
  px(n, 0, HORIZON + 28, BACK_W, 2, '#f4f0e8');
  n.strokeStyle = '#f4f0e8';
  n.lineWidth = 2;
  n.beginPath();
  n.ellipse(BACK_W / 2, HORIZON + 60, 60, 18, 0, 0, Math.PI * 2);
  n.stroke();
  const marker = {
    top: '#f4f4f0',
    lit: '#ffffff',
    rim: '#c83a3a',
    side: '#8a2a2a',
    detail: (c: Ctx) => {
      for (const p of [FOE, YOU]) {
        oval(c, p.cx, p.cy - 0.5, p.rx * 0.55, p.ry * 0.5, '#c83a3a');
        oval(c, p.cx, p.cy - 0.5, p.rx * 0.45, p.ry * 0.38, '#f4f4f0');
      }
    },
  };
  platform(n, FOE.cx, FOE.cy, FOE.rx, FOE.ry, marker);
  platform(n, YOU.cx, YOU.cy, YOU.rx, YOU.ry, marker);

  // Shafts of light from the high windows, drifting over the hall.
  const [drift, d] = layer(BACK_W * 2, BACK_H);
  for (let i = 0; i < 8; i++) {
    const x = 20 + i * 76;
    const g = d.createLinearGradient(x, 0, x + 70, BACK_H);
    g.addColorStop(0, 'rgb(255 248 220 / 0.22)');
    g.addColorStop(1, 'rgb(255 248 220 / 0)');
    d.fillStyle = g;
    d.beginPath();
    d.moveTo(x, 10);
    d.lineTo(x + 22, 10);
    d.lineTo(x + 90, BACK_H);
    d.lineTo(x + 50, BACK_H);
    d.fill();
  }
  return { far, drift, near };
}

function night(): Layers {
  const r = rng(43);
  const [far, f] = layer();
  bands(f, 0, HORIZON, [
    '#0e1230',
    '#141a3c',
    '#1c2248',
    '#262a56',
    '#323264',
    '#423c74',
    '#54467e',
  ]);
  // The moon and its halo.
  for (let i = 5; i > 0; i--) oval(f, 236, 24, 6 + i * 5, 6 + i * 5, 'rgb(200 210 255 / 0.06)');
  oval(f, 236, 24, 8, 8, '#f4f0dc');
  oval(f, 239, 22, 3, 2, '#dcd8c4');
  oval(f, 233, 27, 2, 2, '#dcd8c4');
  // Trinity's buildings round Front Square, windows lit, and the Campanile in the middle.
  px(f, 0, HORIZON - 30, BACK_W, 40, '#2a2c48');
  px(f, 0, HORIZON - 32, BACK_W, 2, '#3a3c5c');
  for (let x = 4; x < BACK_W; x += 10)
    for (let y = HORIZON - 26; y < HORIZON; y += 11) {
      const lit = r() < 0.45;
      px(f, x, y, 5, 7, lit ? '#f8d070' : '#1c1e34');
      if (lit) px(f, x - 1, y - 1, 7, 9, 'rgb(248 208 112 / 0.18)');
    }
  // The Campanile.
  const cx = BACK_W / 2;
  px(f, cx - 16, HORIZON - 4, 32, 12, '#3c3e60');
  px(f, cx - 12, HORIZON - 30, 24, 26, '#44466a');
  px(f, cx - 6, HORIZON - 26, 12, 22, '#1c1e34');
  px(f, cx - 14, HORIZON - 34, 28, 4, '#505278');
  for (const k of [-10, 6]) px(f, k + cx, HORIZON - 52, 4, 18, '#44466a');
  px(f, cx - 12, HORIZON - 56, 24, 4, '#505278');
  for (let i = 0; i < 12; i++) px(f, cx - 11 + i, HORIZON - 57 - i, 22 - i * 2, 1, '#44466a');
  px(f, cx - 1, HORIZON - 72, 2, 4, '#505278');

  const [near, n] = layer();
  // Front Square's cobbles, with pools of lamplight.
  px(n, 0, HORIZON + 8, BACK_W, BACK_H, '#262c44');
  for (let y = HORIZON + 8, row = 0; y < BACK_H; row++) {
    const h = 3 + Math.floor(((y - HORIZON) / (BACK_H - HORIZON)) * 5);
    const w = h * 1.6;
    for (let x = -((row % 2) * w) / 2; x < BACK_W; x += w) {
      px(n, x, y, w - 1, h - 1, ['#3c4462', '#424a6a', '#363e5a'][Math.floor(r() * 3)]);
      px(n, x, y, w - 1, 1, '#4c5576');
    }
    y += h;
  }
  for (const lx of [40, 260]) {
    const g = n.createRadialGradient(lx, HORIZON + 24, 2, lx, HORIZON + 24, 60);
    g.addColorStop(0, 'rgb(255 210 120 / 0.35)');
    g.addColorStop(1, 'rgb(255 210 120 / 0)');
    n.fillStyle = g;
    n.fillRect(0, HORIZON, BACK_W, BACK_H - HORIZON);
    px(n, lx, HORIZON - 14, 2, 38, '#141628');
    px(n, lx - 3, HORIZON - 19, 8, 6, '#141628');
    px(n, lx - 2, HORIZON - 18, 6, 4, '#ffe0a0');
  }
  const stage = { top: '#7080a8', lit: '#90a0c8', rim: '#f8b830', side: '#3a3054' };
  platform(n, FOE.cx, FOE.cy, FOE.rx, FOE.ry, stage);
  platform(n, YOU.cx, YOU.cy, YOU.rx, YOU.ry, stage);

  // Stars, which twinkle as the layer fades in and out.
  const [drift, d] = layer(BACK_W * 2, HORIZON);
  for (let i = 0; i < 90; i++) {
    const x = r() * BACK_W * 2;
    const y = r() * (HORIZON - 30);
    px(d, x, y, 1, 1, r() < 0.2 ? '#fff4c8' : '#ffffff');
    if (r() < 0.12) {
      px(d, x - 1, y, 3, 1, 'rgb(255 255 255 / 0.5)');
      px(d, x, y - 1, 1, 3, 'rgb(255 255 255 / 0.5)');
    }
  }
  return { far, drift, near };
}

const PAINTERS: Record<Scene, () => Layers> = { field, city, gym, night };
const painted = new Map<Scene, Layers>();
const layersOf = (scene: Scene) => {
  if (!painted.has(scene)) painted.set(scene, PAINTERS[scene]());
  return painted.get(scene)!;
};

export function Backdrop({ scene }: { scene: Scene }) {
  const far = useRef<HTMLCanvasElement>(null);
  const drift = useRef<HTMLCanvasElement>(null);
  const near = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const l = layersOf(scene);
    for (const [ref, from] of [
      [far, l.far],
      [drift, l.drift],
      [near, l.near],
    ] as const) {
      const c = ref.current!;
      c.width = from.width;
      c.height = from.height;
      c.getContext('2d')!.drawImage(from, 0, 0);
    }
  }, [scene]);
  const tall = scene === 'gym';
  return (
    <div className="backdrop" aria-hidden data-scene={scene}>
      <canvas ref={far} className="backdrop-far" />
      <canvas
        ref={drift}
        className={`backdrop-drift ${scene === 'night' ? 'twinkle' : ''}`}
        style={{ height: `${((tall ? BACK_H : HORIZON) / BACK_H) * 100}%` }}
      />
      <canvas ref={near} className="backdrop-near" />
    </div>
  );
}
