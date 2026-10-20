'use client';

import { useEffect, useRef } from 'react';
import { asset } from '@/lib/asset';
import { speciesById } from '@/lib/story/party';
import {
  canEnter,
  DELTA,
  find,
  isPresent,
  npcsOf,
  tileAt,
  type Dir,
  type GameMap,
} from '@/lib/story/world';
import { DOOR_LABEL, INK, LIGHT, LOOKS, paintPerson, PERSON, TILE } from './pixels';
import {
  frameOf,
  grassFront,
  RES,
  TALL,
  TALL_GRASS,
  tallImage,
  tileImage,
  variantAt,
} from './tiles';

/** The original handheld's screen: 10 × 9 tiles. */
export const SCREEN_W = 160;
export const SCREEN_H = 144;
export const WALK_MS = 250;
export const BIKE_MS = 125;

export interface Held {
  dir: Dir | null;
  b: boolean;
}

export interface Position {
  x: number;
  y: number;
  face: Dir;
}

interface Props {
  map: GameMap;
  pos: Position;
  flags: ReadonlySet<string>;
  /** The species walking behind you, or null. */
  follower: string | null;
  /** True while a text box, menu or battle intro is up: no walking. */
  frozen: boolean;
  bike: boolean;
  /** A trainer who has just spotted you, for the ! bubble. */
  exclaim: number | null;
  /** People turned to face you while you talk to them. */
  faces: Record<number, Dir>;
  /** Blue Ghosts still lying on this map. */
  ghosts: { x: number; y: number }[];
  held: React.RefObject<Held>;
  /** A step finished. The position may be just off the map edge, to cross to the next map. */
  onStep: (to: Position) => void;
  onTurn: (face: Dir) => void;
  /** Walked into something solid, such as a door. */
  onBump: (x: number, y: number, face: Dir) => void;
}

const cache = new Map<string, HTMLCanvasElement>();
function sprite(key: string, make: () => HTMLCanvasElement) {
  let c = cache.get(key);
  if (!c) cache.set(key, (c = make()));
  return c;
}

const heads = new Map<string, HTMLImageElement>();
function head(species: string): HTMLImageElement {
  let img = heads.get(species);
  if (!img) {
    img = new Image();
    // Each sprite has a 28-pixel version in mini/ beside it, drawn at half size.
    const sprite = speciesById(species).sprite ?? '';
    img.src = asset(sprite.replace(/\/([^/]+)$/, '/mini/$1'));
    heads.set(species, img);
  }
  return img;
}

/** The sign colour over each kind of door. */
const SIGN_COLOUR: Record<string, string> = { P: '#2f8a4a', M: '#3a70c8', G: '#d03838' };

const gymRoofCache = new Map<string, Set<string>>();
/** The roof tiles over each gym, which get slate instead of red so gyms stand out. */
function gymRoofsOf(map: GameMap): Set<string> {
  let roofs = gymRoofCache.get(map.id);
  if (roofs) return roofs;
  roofs = new Set();
  const building = (c: string | undefined) => c !== undefined && '#PMGHL'.includes(c);
  for (const g of find(map, 'G')) {
    const row = map.rows[g.y];
    let x0 = g.x;
    let x1 = g.x;
    while (building(row[x0 - 1])) x0--;
    while (building(row[x1 + 1])) x1++;
    for (let y = g.y - 1; y >= 0 && '#^'.includes(map.rows[y][g.x]); y--) {
      for (let x = x0; x <= x1; x++) if (map.rows[y][x] === '^') roofs.add(`${x},${y}`);
    }
  }
  gymRoofCache.set(map.id, roofs);
  return roofs;
}

export function Overworld(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  // The latest props, read by the animation loop without restarting it.
  const live = useRef(props);
  useEffect(() => {
    live.current = props;
  });

  const walk = useRef({
    ...props.pos,
    from: null as { x: number; y: number } | null,
    t0: 0,
    dur: WALK_MS,
    frame: 0,
    /** Waiting for the story to take in the last step. */
    waiting: false,
    lastBump: 0,
  });
  const trail = useRef({
    at: { x: props.pos.x, y: props.pos.y },
    from: null as null | { x: number; y: number },
  });

  // The story moved us (a warp, a blackout) or took in our last step.
  const { x, y, face } = props.pos;
  const mapId = props.map.id;
  useEffect(() => {
    const w = walk.current;
    w.waiting = false;
    if (w.from) return;
    if (w.x !== x || w.y !== y) {
      Object.assign(w, { x, y });
      trail.current = { at: { x, y }, from: null };
    }
    w.face = face;
  }, [x, y, face, mapId]);

  useEffect(() => {
    const ctx = canvas.current!.getContext('2d')!;
    let raf = 0;
    const sun = ctx.createLinearGradient(0, 0, SCREEN_W, SCREEN_H);
    sun.addColorStop(0, 'rgb(255 236 190 / 0.12)');
    sun.addColorStop(0.5, 'rgb(255 236 190 / 0)');
    const vignette = ctx.createRadialGradient(
      SCREEN_W / 2,
      SCREEN_H / 2,
      SCREEN_H * 0.45,
      SCREEN_W / 2,
      SCREEN_H / 2,
      SCREEN_W * 0.75,
    );
    vignette.addColorStop(0, 'rgb(10 20 40 / 0)');
    vignette.addColorStop(1, 'rgb(10 20 40 / 0.28)');

    const tick = (now: number) => {
      const p = live.current;
      const w = walk.current;
      if (w.from && now - w.t0 >= w.dur) {
        w.from = null;
        trail.current.from = null;
        w.waiting = true;
        p.onStep({ x: w.x, y: w.y, face: w.face });
      }
      const dir = p.held.current?.dir ?? null;
      if (!w.from && !w.waiting && !p.frozen && dir) {
        if (dir !== w.face) {
          w.face = dir;
          p.onTurn(dir);
        }
        const [dx, dy] = DELTA[dir];
        const nx = w.x + dx;
        const ny = w.y + dy;
        const width = p.map.rows[0].length;
        const offEdge = (nx < 0 && p.map.west) || (nx >= width && p.map.east);
        if (offEdge || canEnter(p.map, nx, ny, p.flags)) {
          trail.current = { at: { x: w.x, y: w.y }, from: trail.current.at };
          w.from = { x: w.x, y: w.y };
          w.x = nx;
          w.y = ny;
          w.t0 = now;
          w.dur = p.bike && p.held.current?.b ? BIKE_MS : WALK_MS;
          w.frame++;
        } else if (now - w.lastBump > 350) {
          w.lastBump = now;
          p.onBump(nx, ny, dir);
        }
      }
      draw(ctx, now);
      raf = requestAnimationFrame(tick);
    };

    const draw = (c: CanvasRenderingContext2D, now: number) => {
      const p = live.current;
      const w = walk.current;
      const map = p.map;
      c.setTransform(RES, 0, 0, RES, 0, 0);
      c.imageSmoothingEnabled = false;
      const t = w.from ? Math.min(1, (now - w.t0) / w.dur) : 1;
      const lerp = (a: number, b: number) => a + (b - a) * t;
      const px = (w.from ? lerp(w.from.x, w.x) : w.x) * TILE;
      const py = (w.from ? lerp(w.from.y, w.y) : w.y) * TILE;
      const mapW = map.rows[0].length * TILE;
      const mapH = map.rows.length * TILE;
      const clamp = (v: number, size: number, screen: number) =>
        size <= screen ? (size - screen) / 2 : Math.max(0, Math.min(size - screen, v));
      // Half-pixel camera steps: the screen has twice the world's resolution.
      const snap = (v: number) => Math.round(v * RES) / RES;
      const camX = snap(clamp(px + 8 - SCREEN_W / 2, mapW, SCREEN_W));
      const camY = snap(clamp(py + 8 - SCREEN_H / 2, mapH, SCREEN_H));
      const gymRoofs = gymRoofsOf(map);
      const sx = (x: number) => snap(x - camX);
      const sy = (y: number) => snap(y - camY);

      c.fillStyle = INK;
      c.fillRect(0, 0, SCREEN_W, SCREEN_H);
      const x0 = Math.floor(camX / TILE);
      const y0 = Math.floor(camY / TILE);
      const inMap = (tx: number, ty: number) =>
        ty >= 0 && tx >= 0 && ty < map.rows.length && tx < map.rows[0].length;
      const at = (tx: number, ty: number) => (inMap(tx, ty) ? tileAt(map, tx, ty) : 'T');

      type Drawn = { y: number; paint: () => void };
      const drawn: Drawn[] = [];

      // Visible rows plus one below, so a tree's canopy can rise into view.
      for (let ty = y0; ty <= y0 + SCREEN_H / TILE + 2; ty++) {
        for (let tx = x0; tx <= x0 + SCREEN_W / TILE + 1; tx++) {
          if (!inMap(tx, ty)) continue;
          const tile = at(tx, ty);
          const around = {
            n: at(tx, ty - 1),
            e: at(tx + 1, ty),
            s: at(tx, ty + 1),
            w: at(tx - 1, ty),
          };
          const variant = variantAt(tx, ty);
          const image = tileImage(
            tile,
            around,
            variant,
            frameOf(tile, now),
            tile === '^' && gymRoofs.has(`${tx},${ty}`),
          );
          c.drawImage(image, sx(tx * TILE), sy(ty * TILE), TILE, TILE);
          if (TALL.has(tile)) {
            const { image: top, rise } = tallImage(tile, variant);
            drawn.push({
              y: ty * TILE,
              paint: () => c.drawImage(top, sx(tx * TILE), sy(ty * TILE - rise), TILE, TILE + rise),
            });
          }
        }
      }

      // Shop signs over the doors, in the door's own colour.
      c.font = '700 7px "Pixelify Sans", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      for (const [door, label] of Object.entries(DOOR_LABEL)) {
        for (const d of find(map, door)) {
          const width = Math.ceil(c.measureText(label).width) + 6;
          // Centred over the door, but kept on the building's front when it's long.
          const row = map.rows[d.y];
          let x0 = d.x;
          let x1 = d.x;
          while ('#PMGHL'.includes(row[x0 - 1] ?? '.')) x0--;
          while ('#PMGHL'.includes(row[x1 + 1] ?? '.')) x1++;
          const lo = x0 * TILE + width / 2;
          const hi = (x1 + 1) * TILE - width / 2;
          const centre = d.x * TILE + 8;
          const lx = sx(lo <= hi ? Math.min(hi, Math.max(lo, centre)) : (lo + hi) / 2);
          const ly = sy((d.y - 1) * TILE + 8);
          c.fillStyle = INK;
          c.fillRect(lx - width / 2 - 0.5, ly - 5, width + 1, 10);
          c.fillStyle = SIGN_COLOUR[door];
          c.fillRect(lx - width / 2, ly - 4.5, width, 9);
          c.fillStyle = 'rgb(255 255 255 / 0.3)';
          c.fillRect(lx - width / 2, ly - 4.5, width, 1);
          c.fillStyle = LIGHT;
          c.fillText(label, lx, ly + 0.5);
        }
      }

      // Blue Ghosts lie about as little blue cans, with a glint every so often.
      for (const g of p.ghosts) {
        const gx = sx(g.x * TILE + 8);
        const gy = sy(g.y * TILE + 8);
        c.fillStyle = 'rgb(0 0 0 / 0.2)';
        c.fillRect(gx - 3, gy + 3, 6, 1.5);
        c.fillStyle = INK;
        c.fillRect(gx - 2.5, gy - 4.5, 5, 8.5);
        c.fillStyle = '#3a8ae8';
        c.fillRect(gx - 2, gy - 4, 4, 7.5);
        c.fillStyle = '#9cd4ff';
        c.fillRect(gx - 1.5, gy - 3.5, 1, 6);
        c.fillStyle = '#c8ccd4';
        c.fillRect(gx - 2, gy - 4, 4, 1);
        if (Math.floor(now / 400) % 4 === 0) {
          c.fillStyle = LIGHT;
          c.fillRect(gx + 2, gy - 7, 0.5, 3);
          c.fillRect(gx + 0.75, gy - 5.75, 3, 0.5);
        }
      }

      const person = (
        look: keyof typeof LOOKS,
        dir: Dir,
        frame: number,
        wx: number,
        wy: number,
        bob = 0,
      ) =>
        drawn.push({
          y: wy,
          paint: () => {
            // A soft shadow under everyone.
            c.fillStyle = 'rgb(0 0 0 / 0.22)';
            c.beginPath();
            c.ellipse(sx(wx + 8), sy(wy + 11), 5, 1.75, 0, 0, Math.PI * 2);
            c.fill();
            c.drawImage(
              sprite(`p:${look}:${dir}:${frame}`, () =>
                paintPerson(PERSON[dir][frame], LOOKS[look]),
              ),
              sx(wx),
              sy(wy - 4 - bob),
              TILE,
              TILE,
            );
          },
        });

      for (const n of npcsOf(map)) {
        if (!isPresent(n.item, p.flags)) continue;
        person(n.item.look, p.faces[n.index] ?? n.item.face, 0, n.x * TILE, n.y * TILE);
        if (p.exclaim === n.index) {
          drawn.push({
            y: 9999,
            paint: () => {
              const bx = sx(n.x * TILE + 3);
              const by = sy(n.y * TILE - 18);
              c.fillStyle = INK;
              c.fillRect(bx - 0.5, by - 0.5, 11, 13);
              c.fillStyle = LIGHT;
              c.fillRect(bx, by, 10, 12);
              c.fillStyle = '#e03c3a';
              c.fillRect(bx + 4, by + 2, 2, 5);
              c.fillRect(bx + 4, by + 8, 2, 2);
            },
          });
        }
      }

      // The follower takes the tile you just left: its face on a little body, hopping along.
      const tr = trail.current;
      if (p.follower && (tr.at.x !== w.x || tr.at.y !== w.y)) {
        const fx = (tr.from && w.from ? lerp(tr.from.x, tr.at.x) : tr.at.x) * TILE;
        const fy = (tr.from && w.from ? lerp(tr.from.y, tr.at.y) : tr.at.y) * TILE;
        const hop = w.from ? Math.sin(t * Math.PI) * 1.5 : Math.floor(now / 500) % 2 ? 0.5 : 0;
        const img = head(p.follower);
        const colour = speciesById(p.follower).colour;
        drawn.push({
          y: fy,
          paint: () => {
            const ax = sx(fx);
            const ay = sy(fy - 4);
            c.fillStyle = 'rgb(0 0 0 / 0.22)';
            c.beginPath();
            c.ellipse(ax + 8, ay + 15, 5, 1.75, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = INK;
            c.beginPath();
            c.ellipse(ax + 8, ay + 11.5 - hop, 5, 3.5, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = colour;
            c.beginPath();
            c.ellipse(ax + 8, ay + 11.5 - hop, 4.5, 3, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = INK;
            c.fillRect(ax + 4.5, ay + 13.5 - hop * 0.3, 2.5, 1.5);
            c.fillRect(ax + 9, ay + 13.5 - hop * 0.6, 2.5, 1.5);
            if (img.complete && img.naturalWidth) c.drawImage(img, ax + 1, ay - 2 - hop, 14, 14);
            else c.fillRect(ax + 3, ay, 10, 10);
          },
        });
      }

      // Each step shows a foot forward for its first half, alternating feet, with a small bob.
      const stepFrame = w.from && t < 0.5 ? (w.frame % 2 ? 1 : 3) : 0;
      person('player', w.face, stepFrame, px, py, stepFrame ? 0.5 : 0);

      drawn.sort((a, b) => a.y - b.y).forEach((d) => d.paint());

      // Tall grass hides your feet.
      const grassFrame = frameOf(TALL_GRASS, now);
      const hide = [{ x: px, y: py }];
      if (p.follower) hide.push({ x: tr.at.x * TILE, y: tr.at.y * TILE });
      for (const h of hide) {
        const tx = Math.round(h.x / TILE);
        const ty = Math.round(h.y / TILE);
        if (at(tx, ty) !== TALL_GRASS) continue;
        c.drawImage(grassFront(grassFrame), sx(tx * TILE), sy(ty * TILE), TILE, TILE);
      }

      // Light: slow cloud shadows drifting over the land, warm sun from the top left, and a
      // soft vignette. Indoors, just the lamplight and the vignette.
      c.fillStyle = 'rgb(20 40 60 / 0.08)';
      for (let i = 0; i < (map.inside ? 0 : 2); i++) {
        const span = mapW + 120;
        const cx = ((now / 160 + i * span * 0.55) % span) - 60;
        const cy = (i ? 0.7 : 0.25) * mapH;
        c.beginPath();
        c.ellipse(sx(cx), sy(cy), 46, 20, 0, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = map.inside ? 'rgb(255 200 120 / 0.06)' : sun;
      c.fillRect(0, 0, SCREEN_W, SCREEN_H);
      c.fillStyle = vignette;
      c.fillRect(0, 0, SCREEN_W, SCREEN_H);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvas}
      width={SCREEN_W * RES}
      height={SCREEN_H * RES}
      className="block h-auto w-full [image-rendering:pixelated]"
      data-testid="overworld"
      data-x={props.pos.x}
      data-y={props.pos.y}
      aria-label={`${props.map.name}. Use the arrow keys or the D-pad to walk.`}
    />
  );
}
