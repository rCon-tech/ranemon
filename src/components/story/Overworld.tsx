'use client';

import { useEffect, useRef } from 'react';
import { asset } from '@/lib/asset';
import { variantForm } from '@/lib/battle/variants';
import { speciesById } from '@/lib/story/party';
import { shinySprite } from '@/lib/story/shiny';
import {
  DELTA,
  find,
  isDog,
  isPresent,
  npcsOf,
  tileAt,
  type Dir,
  type Dog,
  type GameMap,
  type Look,
} from '@/lib/story/world';
import {
  COATS,
  monStyle,
  paintDog,
  paintPerson,
  paintRider,
  scaleOf,
  STYLES,
  type BikeKind,
  type Style,
} from './people';
import { DOOR_LABEL, INK, LIGHT, TILE } from './pixels';
import {
  balloonsAt,
  bulbsOf,
  CONFETTI_COLOURS,
  dance,
  fireworks,
  glowOf,
  hash,
  SPARKS,
  type Bulb,
} from './partyfx';
import {
  frameOf,
  grassFront,
  groundOverlay,
  RES,
  TALL,
  TALL_GRASS,
  tallImage,
  tileImage,
  variantAt,
} from './tiles';
import {
  placeWalk,
  runOff,
  startWalk,
  isRiding,
  stepPose,
  stepT,
  tickWalk,
  type Flight,
  type Held,
  type Position,
  type Trail,
} from './walk';

export { BIKE_MS, WALK_MS, type Held, type Position } from './walk';

/** The overworld canvas draws at 4 device pixels per world pixel, so people show their detail. */
const SCREEN_RES = 4;

/** The original handheld's screen: 10 × 9 tiles. */
export const SCREEN_W = 160;
export const SCREEN_H = 144;

export interface Props {
  map: GameMap;
  pos: Position;
  flags: ReadonlySet<string>;
  /** The species walking behind you, or null. */
  follower: string | null;
  /** The follower is a shiny, so its head is the golden one. */
  followerShiny?: boolean;
  /** The follower's look, for a Ranemon with more than one, so its head is the right photo. */
  followerVariant?: string;
  /** A dog, Norm or Elvis, is walking behind you instead. */
  dog?: Dog | null;
  /** True while a text box, menu or battle intro is up: no walking. */
  frozen: boolean;
  /** Which bike you have, if any: hold B to ride it. */
  bike: BikeKind | null;
  /** Who you're dressed as: your skin (`content/story/skins.ts`). The 3D look always uses the usual one. */
  look?: Look | 'player';
  /** A trainer who has just spotted you, for the ! bubble. */
  exclaim: number | null;
  /** People turned to face you while you talk to them. */
  faces: Record<number, Dir>;
  /** Someone running off the map just now, if anyone is. */
  flight?: Flight | null;
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
function head(species: string, shiny: boolean, variant?: string): HTMLImageElement {
  const key = `${species}:${shiny}:${variant}`;
  let img = heads.get(key);
  if (!img) {
    img = new Image();
    // Each sprite has a 40-pixel version in mini/ beside it, drawn at half size.
    const plain = variantForm(speciesById(species), variant).sprite ?? '';
    const sprite = shiny ? shinySprite(plain) : plain;
    img.src = asset(sprite.replace(/\/([^/]+)$/, '/mini/$1'));
    heads.set(key, img);
  }
  return img;
}

/**
 * A Ranemon drawn in pixel art (a UK form, or one of London's own) rather than cut from a photo.
 * Its mini sprite is the whole of it, head to feet, so it walks on its own, shorter than people.
 */
function isDrawn(species: string, variant?: string): boolean {
  return /\/(drawn|london)\//.test(variantForm(speciesById(species), variant).sprite ?? '');
}

/** How tall a drawn Ranemon stands, in world pixels: under a person's 24, like a pet beside its trainer. */
const DRAWN_HEIGHT = 16;

/** The sign colour over each kind of door. */
/** How far a tree's crown leans in the wind just now: a slow sway with the odd gust. */
function sway(now: number, x: number, y: number): number {
  const t = now / 1000;
  const gust = Math.max(0, Math.sin(t / 3.1 + x * 0.05)) ** 4;
  return (Math.sin(t * 1.3 + x * 0.9 + y * 0.6) * 0.018 + gust * 0.03) * (1 + ((x + y) % 3) * 0.2);
}

export interface Daylight {
  /** A colour laid over everything, or null at midday. */
  tint: string | null;
  /** 0 by day up to 1 at midnight: how much light the doors give. */
  night: number;
  /** How strong the shafts of sunlight are. */
  rays: number;
}

/** The light at a time of day: Irish hours, so a long evening in summer and a short day. */
export function daylight(d: Date): Daylight {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 7 && h < 9) {
    const k = 1 - (h - 7) / 2;
    return { tint: `rgb(255 170 150 / ${0.16 * k})`, night: 0, rays: 0.6 + 0.4 * (1 - k) };
  }
  if (h >= 9 && h < 17) return { tint: null, night: 0, rays: 1 };
  if (h >= 17 && h < 20) {
    const k = (h - 17) / 3;
    return { tint: `rgb(255 140 50 / ${0.12 + 0.16 * k})`, night: k * 0.4, rays: 1 - k * 0.5 };
  }
  // Night: deepest at midnight, lifting toward dawn.
  const fromMidnight = h >= 20 ? 24 - h : h;
  const k = Math.min(1, 0.6 + (1 - fromMidnight / 7) * 0.4);
  return { tint: `rgb(20 30 80 / ${0.38 * k})`, night: k, rays: 0 };
}

const doorCache = new Map<string, { x: number; y: number }[]>();
function doors(map: GameMap) {
  if (!doorCache.has(map.id))
    doorCache.set(
      map.id,
      ['P', 'M', 'G', 'H', 'L'].flatMap((d) => find(map, d)),
    );
  return doorCache.get(map.id)!;
}

const SIGN_COLOUR: Record<string, string> = { P: '#2f8a4a', M: '#3a70c8', G: '#d03838' };

/** Dancing: standing, then a step one way and the other. */
const DANCE_FRAMES = [0, 2, 0, 6];

const bulbCache = new Map<GameMap, Bulb[]>();
function bulbsAt(map: GameMap) {
  if (!bulbCache.has(map)) bulbCache.set(map, bulbsOf(map.party?.lights ?? []));
  return bulbCache.get(map)!;
}

const gymRoofCache = new Map<string, Set<string>>();
/**
 * The roof tiles over each gym, which get slate instead of red so gyms stand out. A town with
 * slate roofs everywhere, such as Greystones, has every roof in it.
 */
export function gymRoofsOf(map: GameMap): Set<string> {
  let roofs = gymRoofCache.get(map.id);
  if (roofs) return roofs;
  roofs = new Set();
  if (map.slate) for (const r of find(map, '^')) roofs.add(`${r.x},${r.y}`);
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

  const walk = useRef(startWalk(props.pos));
  const trail = useRef<Trail>({ at: { x: props.pos.x, y: props.pos.y }, from: null });

  // The story moved us (a warp, a blackout) or took in our last step.
  const { x, y, face } = props.pos;
  const mapId = props.map.id;
  useEffect(() => {
    placeWalk(walk.current, trail.current, { x, y, face });
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
      tickWalk(walk.current, trail.current, live.current, now);
      draw(ctx, now);
      raf = requestAnimationFrame(tick);
    };

    const draw = (c: CanvasRenderingContext2D, now: number) => {
      const p = live.current;
      const w = walk.current;
      const map = p.map;
      const light = daylight(new Date());
      c.setTransform(SCREEN_RES, 0, 0, SCREEN_RES, 0, 0);
      c.imageSmoothingEnabled = false;
      const t = stepT(w, now);
      const lerp = (a: number, b: number) => a + (b - a) * t;
      const px = (w.from ? lerp(w.from.x, w.x) : w.x) * TILE;
      const py = (w.from ? lerp(w.from.y, w.y) : w.y) * TILE;
      const mapW = map.rows[0].length * TILE;
      const mapH = map.rows.length * TILE;
      const clamp = (v: number, size: number, screen: number) =>
        size <= screen ? (size - screen) / 2 : Math.max(0, Math.min(size - screen, v));
      // Half-pixel camera steps, matching the tile art's resolution.
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
        for (let tx = x0 - 1; tx <= x0 + SCREEN_W / TILE + 1; tx++) {
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
            const { image: top, rise, spread } = tallImage(tile, variant);
            // Trees and palms lean a little in the wind, each in its own time; the Campanile
            // and the boats don't.
            const lean = tile === 'T' || tile === 'p' ? sway(now, tx, ty) : 0;
            drawn.push({
              y: ty * TILE,
              paint: () => {
                const bx = sx(tx * TILE + 8);
                const by = sy(ty * TILE + TILE);
                c.save();
                c.translate(bx, by);
                c.transform(1, 0, lean, 1, 0, 0);
                c.drawImage(top, -8 - spread, -TILE - rise, TILE + spread * 2, TILE + rise);
                c.restore();
              },
            });
          }
        }
      }

      // Light and shade, worn patches, tree shadows and fallen leaves, laid over the ground.
      if (!map.inside) {
        const rows = map.rows.length;
        const cols = map.rows[0].length;
        c.drawImage(groundOverlay(map.id, cols, rows, at), sx(0), sy(0), mapW, mapH);
      }

      // Sun glints dancing on the water.
      if (!map.inside) {
        for (let ty = y0; ty <= y0 + SCREEN_H / TILE + 1; ty++) {
          for (let tx = x0 - 1; tx <= x0 + SCREEN_W / TILE + 1; tx++) {
            if (at(tx, ty) !== '~') continue;
            for (let k = 0; k < 2; k++) {
              const beat = Math.floor(now / 260) + tx * 7 + ty * 13 + k * 5;
              if (beat % 9) continue;
              const gx = sx(tx * TILE + 3 + ((tx * 5 + k * 7 + ty) % 10));
              const gy = sy(ty * TILE + 3 + ((ty * 3 + k * 9 + tx) % 10));
              c.fillStyle = 'rgb(255 255 255 / 0.9)';
              c.fillRect(gx, gy, 1, 0.5);
              c.fillStyle = 'rgb(255 255 255 / 0.5)';
              c.fillRect(gx - 1, gy, 3, 0.5);
              c.fillRect(gx + 0.25, gy - 0.5, 0.5, 1.5);
            }
          }
        }
      }

      // Shop signs over the doors, in the door's own colour.
      c.font = '700 7px "Pixelify Sans", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      // And a company's own sign over its landmark door, such as the HQs in Silicon Docks.
      const signs = [
        ...Object.entries(DOOR_LABEL).flatMap(([door, label]) =>
          find(map, door).map((d) => ({ d, label, colour: SIGN_COLOUR[door] })),
        ),
        ...find(map, 'L').flatMap((d, i) => {
          const own = map.landmarkLabels?.[i];
          return own ? [{ d, label: own.text, colour: own.colour }] : [];
        }),
      ];
      for (const { d, label, colour } of signs) {
        const width = Math.ceil(c.measureText(label).width) + 6;
        // Centred over the door, but kept on the building's front when it's long.
        const row = map.rows[d.y];
        let x0 = d.x;
        let x1 = d.x;
        while ('#zPMGHL'.includes(row[x0 - 1] ?? '.')) x0--;
        while ('#zPMGHL'.includes(row[x1 + 1] ?? '.')) x1++;
        const lo = x0 * TILE + width / 2;
        const hi = (x1 + 1) * TILE - width / 2;
        const centre = d.x * TILE + 8;
        const lx = sx(lo <= hi ? Math.min(hi, Math.max(lo, centre)) : (lo + hi) / 2);
        const ly = sy((d.y - 1) * TILE + 8);
        c.fillStyle = INK;
        c.fillRect(lx - width / 2 - 0.5, ly - 5, width + 1, 10);
        c.fillStyle = colour;
        c.fillRect(lx - width / 2, ly - 4.5, width, 9);
        c.fillStyle = 'rgb(255 255 255 / 0.3)';
        c.fillRect(lx - width / 2, ly - 4.5, width, 1);
        c.fillStyle = LIGHT;
        c.fillText(label, lx, ly + 0.5);
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

      /** Someone 16 × 24 standing on a tile, feet at its bottom, over a soft shadow. */
      const person = (
        key: string,
        style: Style,
        dir: Dir,
        frame: number,
        wx: number,
        wy: number,
        bob = 0,
      ) =>
        drawn.push({
          y: wy,
          paint: () => {
            c.fillStyle = 'rgb(0 0 0 / 0.25)';
            c.beginPath();
            c.ellipse(sx(wx + 8), sy(wy + 13.5), 6, 2, 0, 0, Math.PI * 2);
            c.fill();
            // Someone small is drawn smaller and someone tall bigger, standing on the same spot.
            const k = scaleOf(style);
            c.drawImage(
              sprite(`p:${key}:${dir}:${frame}`, () => paintPerson(style, dir, frame)),
              sx(wx + 8 - 8 * k),
              sy(wy + 14.5 - 24 * k - bob),
              16 * k,
              24 * k,
            );
          },
        });
      /** A dog on a tile, feet at its bottom, over a shadow as long as it is; Elvis is huge. */
      const dogAt = (dog: Dog, dir: Dir, frame: number, wx: number, wy: number, bob = 0) =>
        drawn.push({
          y: wy,
          paint: () => {
            const k = COATS[dog].scale;
            c.fillStyle = 'rgb(0 0 0 / 0.25)';
            c.beginPath();
            c.ellipse(sx(wx + 8), sy(wy + 13.5), 6 * k, 2 * k, 0, 0, Math.PI * 2);
            c.fill();
            c.drawImage(
              sprite(`dog:${dog}:${dir}:${frame}`, () => paintDog(dir, frame, dog)),
              sx(wx + 8 - 8 * k),
              sy(wy + 14.5 - 24 * k - bob),
              16 * k,
              24 * k,
            );
          },
        });
      // Standing still, everyone breathes: a half-pixel bob, out of step with each other.
      const idle = (phase: number) => (Math.floor(now / 700 + phase) % 2 ? 0.5 : 0);

      for (const n of npcsOf(map)) {
        if (!isPresent(n.item, p.flags)) continue;
        const look = n.item.look;
        if (isDog(look)) {
          dogAt(
            look,
            p.faces[n.index] ?? n.item.face,
            0,
            n.x * TILE,
            n.y * TILE,
            idle(n.index * 0.37),
          );
          continue;
        }
        if (p.flight?.index === n.index) {
          // Running off, a step at a time, out of sight.
          const run = runOff(p.flight, now);
          const [dx, dy] = DELTA[p.flight.dir];
          person(
            look,
            STYLES[look],
            p.flight.dir,
            stepPose(run.t, run.step),
            (n.x + dx * run.tiles) * TILE,
            (n.y + dy * run.tiles) * TILE,
            Math.sin(run.t * Math.PI),
          );
          continue;
        }
        // At a party or on a dance floor everyone dances, except a trainer on the lookout or whoever you're talking to.
        const moves =
          (map.party || n.item.dances) && !n.item.sight && !p.faces[n.index]
            ? dance(n.index, now)
            : null;
        person(
          look,
          STYLES[look],
          moves?.dir ?? p.faces[n.index] ?? n.item.face,
          moves ? DANCE_FRAMES[moves.beat % DANCE_FRAMES.length] : 0,
          n.x * TILE,
          n.y * TILE,
          moves ? moves.hop * 2 : idle(n.index * 0.37),
        );
        if (p.exclaim === n.index) {
          drawn.push({
            y: 9999,
            paint: () => {
              const bx = sx(n.x * TILE + 3);
              const by = sy(n.y * TILE - 26);
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

      // A party's crowd, dancing, and bunches of balloons bobbing on their strings.
      map.party?.crowd?.forEach((d, i) => {
        const moves = dance(i + 10, now);
        person(
          d.look,
          STYLES[d.look],
          moves.dir,
          DANCE_FRAMES[moves.beat % DANCE_FRAMES.length],
          d.x * TILE,
          d.y * TILE,
          moves.hop * 2,
        );
      });
      map.party?.balloons?.forEach(([bx, by], i) =>
        drawn.push({
          y: by * TILE + 1,
          paint: () => {
            const tx = sx(bx * TILE + 8);
            const ty = sy(by * TILE + 10);
            for (const b of balloonsAt(i, now)) {
              const hx = tx + b.dx * TILE;
              const hy = ty - b.rise * TILE;
              c.strokeStyle = 'rgb(240 240 240 / 0.8)';
              c.lineWidth = 0.4;
              c.beginPath();
              c.moveTo(tx, ty);
              c.lineTo(hx, hy + 4);
              c.stroke();
              c.fillStyle = INK;
              c.beginPath();
              c.ellipse(hx, hy, 3.4, 4.2, 0, 0, Math.PI * 2);
              c.fill();
              c.fillStyle = b.colour;
              c.beginPath();
              c.ellipse(hx, hy, 3, 3.8, 0, 0, Math.PI * 2);
              c.fill();
              c.fillStyle = 'rgb(255 255 255 / 0.6)';
              c.fillRect(hx - 1.5, hy - 2.5, 1, 1.5);
              c.fillStyle = b.colour;
              c.fillRect(hx - 0.5, hy + 3.6, 1, 1);
            }
          },
        }),
      );

      // The follower takes the tile you just left: its photo head on a body in its colour,
      // as tall as you (a drawn one is shorter, on its own legs), walking the way it's going and hopping a little. Or a dog, trotting.
      const tr = trail.current;
      const fname = p.dog ? null : p.follower;
      if (p.dog && (tr.at.x !== w.x || tr.at.y !== w.y)) {
        const moving = !!(tr.from && w.from);
        const toward = moving
          ? { x: tr.at.x - tr.from!.x, y: tr.at.y - tr.from!.y }
          : { x: w.x - tr.at.x, y: w.y - tr.at.y };
        dogAt(
          p.dog,
          toward.x < 0 ? 'left' : toward.x > 0 ? 'right' : toward.y < 0 ? 'up' : 'down',
          moving ? stepPose(t, w.frame) : 0,
          (moving ? lerp(tr.from!.x, tr.at.x) : tr.at.x) * TILE,
          (moving ? lerp(tr.from!.y, tr.at.y) : tr.at.y) * TILE,
          (moving ? Math.sin(t * Math.PI) * 1.5 : idle(0.5)) / 2,
        );
      } else if (fname && (tr.at.x !== w.x || tr.at.y !== w.y)) {
        const fx = (tr.from && w.from ? lerp(tr.from.x, tr.at.x) : tr.at.x) * TILE;
        const fy = (tr.from && w.from ? lerp(tr.from.y, tr.at.y) : tr.at.y) * TILE;
        const moving = !!(tr.from && w.from);
        const toward = moving
          ? { x: tr.at.x - tr.from!.x, y: tr.at.y - tr.from!.y }
          : { x: w.x - tr.at.x, y: w.y - tr.at.y };
        const fdir: Dir =
          toward.x < 0 ? 'left' : toward.x > 0 ? 'right' : toward.y < 0 ? 'up' : 'down';
        const hop = moving ? Math.sin(t * Math.PI) * 1.5 : idle(0.5);
        const frame = moving ? stepPose(t, w.frame) : 0;
        const drawnFollower = isDrawn(fname, p.followerVariant);
        drawn.push({
          y: fy,
          paint: () => {
            c.fillStyle = 'rgb(0 0 0 / 0.25)';
            c.beginPath();
            c.ellipse(sx(fx + 8), sy(fy + 13.5), 6, 2, 0, 0, Math.PI * 2);
            c.fill();
            const img = head(fname, !!p.followerShiny, p.followerVariant);
            if (drawnFollower) {
              // A drawn one is all there in its sprite, standing on the tile, a head shorter than you.
              if (img.complete && img.naturalWidth) {
                c.drawImage(
                  img,
                  sx(fx + 8 - DRAWN_HEIGHT / 2),
                  sy(fy + 14.5 - DRAWN_HEIGHT - hop),
                  DRAWN_HEIGHT,
                  DRAWN_HEIGHT,
                );
              }
              return;
            }
            // A shiny's body is gold to match its head.
            const colour = p.followerShiny ? '#f8b830' : speciesById(fname).colour;
            c.drawImage(
              sprite(`mon:${colour}:${fdir}:${frame}`, () =>
                paintPerson(monStyle(colour), fdir, frame, true),
              ),
              sx(fx),
              sy(fy - 9.5 - hop),
              16,
              24,
            );
            // The photo always faces you, as there's no back view of it.
            if (img.complete && img.naturalWidth) {
              c.drawImage(img, sx(fx - 2), sy(fy - 12 - hop), 20, 20);
            } else {
              c.fillStyle = INK;
              c.fillRect(sx(fx), sy(fy - 10 - hop), 16, 16);
            }
          },
        });
      }

      // Each step passes, plants a foot, passes back and stands, alternating feet.
      const stepFrame = w.from ? stepPose(t, w.frame) : 0;
      const bike = isRiding(w, live.current) ? p.bike : null;
      const look = p.look ?? 'player';
      if (bike) {
        const turn = w.from ? stepFrame % 4 : 0;
        drawn.push({
          y: py,
          paint: () => {
            c.fillStyle = 'rgb(0 0 0 / 0.25)';
            c.beginPath();
            c.ellipse(sx(px + 8), sy(py + 13.5), 7, 2, 0, 0, Math.PI * 2);
            c.fill();
            c.drawImage(
              sprite(`ride:${look}:${bike}:${w.face}:${turn}`, () =>
                paintRider(STYLES[look], w.face, turn, bike),
              ),
              sx(px),
              sy(py - 9.5),
              16,
              24,
            );
          },
        });
      } else {
        person(
          `player:${look}`,
          STYLES[look],
          w.face,
          stepFrame,
          px,
          py,
          w.from ? (stepFrame % 2 ? 0.5 : 0) : idle(0),
        );
      }

      drawn.sort((a, b) => a.y - b.y).forEach((d) => d.paint());

      // A party's fairy lights, strung over everyone's heads.
      const bulbs = map.party ? bulbsAt(map) : [];
      const bulbAt = (b: Bulb) => [sx(b.x * TILE), sy((b.y - b.h) * TILE)] as const;
      c.strokeStyle = 'rgb(30 30 40 / 0.7)';
      c.lineWidth = 0.5;
      c.beginPath();
      bulbs.forEach((b) => {
        const [bx, by] = bulbAt(b);
        if (b.start) c.moveTo(bx, by);
        else c.lineTo(bx, by);
      });
      c.stroke();
      for (const b of bulbs) {
        const [bx, by] = bulbAt(b);
        c.fillStyle = b.colour;
        c.globalAlpha = glowOf(b, now);
        c.fillRect(bx - 1, by, 2, 2);
      }
      c.globalAlpha = 1;

      // Confetti drifting down over everything.
      if (map.party) {
        for (let i = 0; i < 60; i++) {
          const life = 5000 + hash(i) * 4000;
          const tt = ((now + hash(i + 99) * life) % life) / life;
          const cx =
            ((hash(i + 7) * (SCREEN_W + 20) + Math.sin(tt * 9 + i) * 8) % (SCREEN_W + 20)) - 10;
          const cy = tt * (SCREEN_H + 10) - 5;
          const flip = Math.abs(Math.sin(now / 150 + i));
          c.fillStyle = CONFETTI_COLOURS[i % CONFETTI_COLOURS.length];
          c.fillRect(cx, cy, 1.5 * flip + 0.3, 1);
        }
      }

      // Tall grass hides your feet.
      const grassFrame = frameOf(TALL_GRASS, now);
      const hide = [{ x: px, y: py }];
      if (p.follower || p.dog) hide.push({ x: tr.at.x * TILE, y: tr.at.y * TILE });
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

      if (!map.inside) {
        // Shafts of sunlight slanting down from the top left, slowly breathing.
        if (light.rays > 0) {
          c.save();
          c.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 3; i++) {
            const a = light.rays * (0.05 + 0.025 * Math.sin(now / 2300 + i * 2));
            c.fillStyle = `rgb(255 240 200 / ${a})`;
            const x = 10 + i * 46 - (camX % 40) * 0.3;
            c.beginPath();
            c.moveTo(x, 0);
            c.lineTo(x + 14 + i * 4, 0);
            c.lineTo(x + 70 + i * 4, SCREEN_H);
            c.lineTo(x + 46, SCREEN_H);
            c.fill();
          }
          c.restore();
        }
        // Leaves and seeds blowing through on the wind.
        for (let i = 0; i < 10; i++) {
          const life = 9000 + i * 700;
          const tt = ((now + i * 1777) % life) / life;
          const lx = ((i * 53 + tt * 260) % 220) - 30;
          const ly = ((i * 37) % 120) + tt * 50 + Math.sin(tt * 12 + i) * 6;
          c.fillStyle = i % 3 ? 'rgb(232 150 60 / 0.85)' : 'rgb(250 250 230 / 0.8)';
          c.fillRect(lx, ly, i % 3 ? 1.5 : 1, i % 3 ? 1 : 1);
          if (i % 3) {
            c.fillStyle = 'rgb(170 80 30 / 0.8)';
            c.fillRect(lx + 0.5, ly + 0.5, 1, 0.5);
          }
        }
      }

      // The time of day, from the clock: a pink dawn, a golden evening, a blue night with
      // light spilling from every door.
      if (light.tint) {
        c.fillStyle = light.tint;
        c.fillRect(0, 0, SCREEN_W, SCREEN_H);
      }
      if (light.night > 0) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (const d of map.inside ? [] : doors(map)) {
          const gx = sx(d.x * TILE + 8);
          const gy = sy(d.y * TILE + 14);
          if (gx < -40 || gy < -40 || gx > SCREEN_W + 40 || gy > SCREEN_H + 40) continue;
          const g = c.createRadialGradient(gx, gy, 1, gx, gy, 26);
          g.addColorStop(0, `rgb(255 190 90 / ${0.42 * light.night})`);
          g.addColorStop(1, 'rgb(255 190 90 / 0)');
          c.fillStyle = g;
          c.fillRect(gx - 26, gy - 26, 52, 52);
        }
        c.restore();
      }
      if (map.party) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        // Coloured beams sweeping the square from the stage lights, brighter after dark.
        const beams = ['#ff4d6d', '#4dabff', '#4be08a', '#b06bff'];
        beams.forEach((colour, i) => {
          const from = { x: i % 2 ? SCREEN_W + 10 : -10, y: SCREEN_H + 10 };
          const angle = -Math.PI / 2 + Math.sin(now / (1700 + i * 300) + i * 2) * 0.75;
          const reach = 230;
          const spread = 0.1;
          c.globalAlpha = 0.07 + 0.08 * light.night;
          c.fillStyle = colour;
          c.beginPath();
          c.moveTo(from.x, from.y);
          c.lineTo(
            from.x + Math.cos(angle - spread) * reach,
            from.y + Math.sin(angle - spread) * reach,
          );
          c.lineTo(
            from.x + Math.cos(angle + spread) * reach,
            from.y + Math.sin(angle + spread) * reach,
          );
          c.fill();
        });
        // Fireworks overhead: a rocket goes up, bursts and the sparks fall away.
        for (const f of fireworks(now)) {
          const fx = f.x * SCREEN_W;
          const top = 8 + f.y * 50;
          if (f.t < 0.25) {
            c.globalAlpha = 0.9;
            c.fillStyle = '#fff2c0';
            c.fillRect(fx, top + (1 - f.t / 0.25) * 40, 1, 2.5);
            continue;
          }
          const k = (f.t - 0.25) / 0.75;
          c.globalAlpha = 1 - k;
          c.fillStyle = f.colour;
          for (let i = 0; i < SPARKS; i++) {
            const a = (i / SPARKS) * Math.PI * 2 + f.n;
            const r = Math.sqrt(k) * 22;
            c.fillRect(fx + Math.cos(a) * r, top + Math.sin(a) * r + k * k * 10, 1.5, 1.5);
          }
        }
        c.restore();
      }

      // The fairy lights glow through the dark.
      if (bulbs.length) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (const b of bulbs) {
          const [bx, by] = bulbAt(b);
          if (bx < -8 || by < -8 || bx > SCREEN_W + 8 || by > SCREEN_H + 8) continue;
          c.globalAlpha = (0.25 + 0.35 * light.night) * glowOf(b, now);
          c.fillStyle = b.colour;
          c.beginPath();
          c.arc(bx, by + 1, 3, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }
      c.fillStyle = vignette;
      c.fillRect(0, 0, SCREEN_W, SCREEN_H);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvas}
      width={SCREEN_W * SCREEN_RES}
      height={SCREEN_H * SCREEN_RES}
      className="block h-auto w-full [image-rendering:pixelated]"
      data-testid="overworld"
      data-view="2d"
      data-x={props.pos.x}
      data-y={props.pos.y}
      aria-label={`${props.map.name}. Use the arrow keys or the D-pad to walk.`}
    />
  );
}
