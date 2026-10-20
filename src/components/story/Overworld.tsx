'use client';

import { useEffect, useRef } from 'react';
import { asset } from '@/lib/asset';
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
import { DOOR_LABEL, LOOKS, paint, PERSON, SHADES, TILE, TILE_ART } from './pixels';

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
    img.src = asset(`/sprites/gb/mini/${species}.png`);
    heads.set(species, img);
  }
  return img;
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
      const t = w.from ? Math.min(1, (now - w.t0) / w.dur) : 1;
      const lerp = (a: number, b: number) => a + (b - a) * t;
      const px = (w.from ? lerp(w.from.x, w.x) : w.x) * TILE;
      const py = (w.from ? lerp(w.from.y, w.y) : w.y) * TILE;
      const mapW = map.rows[0].length * TILE;
      const mapH = map.rows.length * TILE;
      const clamp = (v: number, size: number, screen: number) =>
        size <= screen ? (size - screen) / 2 : Math.max(0, Math.min(size - screen, v));
      const camX = Math.round(clamp(px + 8 - SCREEN_W / 2, mapW, SCREEN_W));
      const camY = Math.round(clamp(py + 8 - SCREEN_H / 2, mapH, SCREEN_H));

      c.fillStyle = SHADES[0];
      c.fillRect(0, 0, SCREEN_W, SCREEN_H);
      const waterFrame = Math.floor(now / 500) % 2;
      const x0 = Math.floor(camX / TILE);
      const y0 = Math.floor(camY / TILE);
      for (let ty = y0; ty <= y0 + SCREEN_H / TILE + 1; ty++) {
        for (let tx = x0; tx <= x0 + SCREEN_W / TILE + 1; tx++) {
          if (ty < 0 || tx < 0 || ty >= map.rows.length || tx >= map.rows[0].length) continue;
          const tile = tileAt(map, tx, ty);
          const frames = TILE_ART[tile] ?? TILE_ART.T;
          const f = frames.length > 1 ? waterFrame : 0;
          c.drawImage(
            sprite(`t:${tile}:${f}`, () => paint(frames[f])),
            tx * TILE - camX,
            ty * TILE - camY,
          );
        }
      }

      // Shop signs over the doors.
      c.font = '8px "Press Start 2P", monospace';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      for (const [door, label] of Object.entries(DOOR_LABEL)) {
        for (const d of find(map, door)) {
          const lx = d.x * TILE + 8 - camX;
          const ly = (d.y - 1) * TILE + 8 - camY;
          c.fillStyle = SHADES[0];
          c.fillRect(lx - label.length * 4 - 2, ly - 6, label.length * 8 + 4, 12);
          c.fillStyle = SHADES[3];
          c.fillText(label, lx, ly + 1);
        }
      }

      // Blue Ghosts glint every so often.
      if (Math.floor(now / 400) % 3 === 0) {
        c.fillStyle = SHADES[0];
        for (const g of p.ghosts) {
          const gx = g.x * TILE - camX + 8;
          const gy = g.y * TILE - camY + 8;
          c.fillRect(gx - 1, gy - 4, 2, 8);
          c.fillRect(gx - 4, gy - 1, 8, 2);
        }
      }

      type Drawn = { y: number; paint: () => void };
      const drawn: Drawn[] = [];
      const person = (look: keyof typeof LOOKS, dir: Dir, frame: number, sx: number, sy: number) =>
        drawn.push({
          y: sy,
          paint: () =>
            c.drawImage(
              sprite(`p:${look}:${dir}:${frame}`, () => paint(PERSON[dir][frame], LOOKS[look])),
              Math.round(sx - camX),
              Math.round(sy - camY - 4),
            ),
        });

      for (const n of npcsOf(map)) {
        if (!isPresent(n.item, p.flags)) continue;
        person(n.item.look, p.faces[n.index] ?? n.item.face, 0, n.x * TILE, n.y * TILE);
        if (p.exclaim === n.index) {
          drawn.push({
            y: 9999,
            paint: () => {
              const bx = n.x * TILE - camX + 3;
              const by = n.y * TILE - camY - 18;
              c.fillStyle = SHADES[3];
              c.fillRect(bx, by, 10, 12);
              c.strokeStyle = SHADES[0];
              c.strokeRect(bx + 0.5, by + 0.5, 9, 11);
              c.fillStyle = SHADES[0];
              c.fillRect(bx + 4, by + 2, 2, 5);
              c.fillRect(bx + 4, by + 8, 2, 2);
            },
          });
        }
      }

      // The follower takes the tile you just left.
      const tr = trail.current;
      if (p.follower && (tr.at.x !== w.x || tr.at.y !== w.y)) {
        const fx = (tr.from && w.from ? lerp(tr.from.x, tr.at.x) : tr.at.x) * TILE;
        const fy = (tr.from && w.from ? lerp(tr.from.y, tr.at.y) : tr.at.y) * TILE;
        const bob = w.from && t < 0.5 ? 1 : 0;
        const img = head(p.follower);
        drawn.push({
          y: fy,
          paint: () => {
            const sx = Math.round(fx - camX);
            const sy = Math.round(fy - camY - 4);
            c.fillStyle = SHADES[0];
            c.fillRect(sx + 4, sy + 11, 8, 3);
            c.fillRect(sx + 4, sy + 14 - bob, 3, 2);
            c.fillRect(sx + 9, sy + 13 + bob, 3, 2);
            if (img.complete && img.naturalWidth) c.drawImage(img, sx + 2, sy + bob);
            else c.fillRect(sx + 3, sy + 1, 10, 10);
          },
        });
      }

      // Each step shows a foot forward for its first half, alternating feet.
      const stepFrame = w.from && t < 0.5 ? (w.frame % 2 ? 1 : 3) : 0;
      person('player', w.face, stepFrame, px, py);

      drawn.sort((a, b) => a.y - b.y).forEach((d) => d.paint());
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvas}
      width={SCREEN_W}
      height={SCREEN_H}
      className="block h-auto w-full [image-rendering:pixelated]"
      data-testid="overworld"
      aria-label={`${props.map.name}. Use the arrow keys or the D-pad to walk.`}
    />
  );
}
