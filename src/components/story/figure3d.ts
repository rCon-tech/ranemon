import * as THREE from 'three';
import type { Dir } from '@/lib/story/world';
import { paintPerson, PERSON_H, PERSON_W, type Style } from './people';
import { pixelTexture } from './scene3d';

/**
 * People in the 3D overworld as solid figures, not cut-outs: a head, a body, two arms and two
 * legs, each a block wearing the matching piece of the person's own 2D art from the front, the
 * back and each side. So a figure has the same face, hair, clothes and shoes as in 2D, but has
 * depth, turns round, swings its arms and legs as it walks, and casts a proper shadow.
 */

/** One unit (a tile) is 64 of the sprite's device pixels, so a figure is as tall as in 2D. */
const PX = 1 / PERSON_W;

/** A piece of a view: x0, y0, width, height, in the 64 × 96 sprite. */
type Crop = [number, number, number, number];

interface Part {
  /** Size in sprite pixels: width, height, depth. */
  size: [number, number, number];
  front: Crop;
  back: Crop;
  side: Crop;
  /** Where it hangs from, in sprite pixels from the top-left of the front view. */
  pivot: [number, number];
}

// Measured from the sprites: the head fills the top 37 rows, the body and arms the next 29, and
// the legs the bottom 30.
const HEAD: Part = {
  size: [36, 37, 30],
  front: [14, 0, 36, 37],
  back: [14, 0, 36, 37],
  side: [16, 0, 30, 37],
  pivot: [32, 37],
};
const BODY: Part = {
  size: [28, 29, 18],
  front: [18, 37, 28, 29],
  back: [18, 37, 28, 29],
  side: [22, 37, 18, 29],
  pivot: [32, 37],
};
const ARM_R: Part = {
  size: [9, 29, 9],
  front: [9, 37, 9, 29],
  back: [46, 37, 9, 29],
  side: [28, 37, 9, 29],
  pivot: [13.5, 38],
};
const ARM_L: Part = { ...ARM_R, front: [46, 37, 9, 29], back: [9, 37, 9, 29], pivot: [50.5, 38] };
const LEG_R: Part = {
  size: [12, 30, 12],
  front: [20, 66, 12, 30],
  back: [32, 66, 12, 30],
  side: [25, 66, 12, 30],
  pivot: [26, 66],
};
const LEG_L: Part = { ...LEG_R, front: [32, 66, 12, 30], back: [20, 66, 12, 30], pivot: [38, 66] };

type Views = Record<'down' | 'up' | 'left' | 'right', HTMLCanvasElement>;

/** The atlas's cells: big enough for the largest piece, with room to bleed. */
const CELL = 40;
const COLS = 8;

/** A kit: one texture holding every piece, and the shapes, shared by everyone dressed alike. */
interface Kit {
  material: THREE.MeshLambertMaterial;
  parts: { geo: THREE.BufferGeometry; pivot: THREE.Vector3 }[];
}

const kits = new Map<string, Kit>();

function kitOf(key: string, style: Style, headless: boolean): Kit {
  let kit = kits.get(key);
  if (kit) return kit;
  const views: Views = {
    down: paintPerson(style, 'down', 0, headless),
    up: paintPerson(style, 'up', 0, headless),
    left: paintPerson(style, 'left', 0, headless),
    right: paintPerson(style, 'right', 0, headless),
  };
  const pieces = headless
    ? [BODY, ARM_R, ARM_L, LEG_R, LEG_L]
    : [HEAD, BODY, ARM_R, ARM_L, LEG_R, LEG_L];
  const atlas = document.createElement('canvas');
  atlas.width = CELL * COLS;
  atlas.height = CELL * Math.ceil((pieces.length * 6) / COLS);
  const g = atlas.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  let cell = 0;
  /** Copies a piece of a view into the next cell, made solid and bled outward so no gaps show. */
  const place = (view: HTMLCanvasElement, [x, y, w, h]: Crop) => {
    const cx = (cell % COLS) * CELL + 2;
    const cy = Math.floor(cell / COLS) * CELL + 2;
    cell++;
    const piece = document.createElement('canvas');
    piece.width = w;
    piece.height = h;
    const p = piece.getContext('2d')!;
    p.drawImage(view, x, y, w, h, 0, 0, w, h);
    solidify(piece);
    for (const [dx, dy] of [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
    ])
      g.drawImage(piece, cx + dx, cy + dy);
    g.drawImage(piece, cx, cy);
    return [cx, cy, w, h] as Crop;
  };
  const parts = pieces.map((part) => {
    // Faces in BoxGeometry's order: +x, -x, +y, -y, +z (the front), -z (the back).
    const front = place(views.down, part.front);
    const back = place(views.up, part.back);
    const right = place(views.left, part.side);
    const left = place(views.right, [
      PERSON_W - part.side[0] - part.side[2],
      ...part.side.slice(1),
    ] as Crop);
    // The top is the back view's top strip (hair, a hat, shoulders); the bottom, its last row.
    const [, by, , bh] = part.back;
    const top = place(views.up, [part.back[0], by + Math.min(6, bh / 4), part.back[2], 4]);
    const bottom = place(views.down, [
      part.front[0],
      part.front[1] + part.front[3] - 3,
      part.front[2],
      2,
    ]);
    const [w, h, d] = part.size;
    const geo =
      part === HEAD
        ? roundedBox(w * PX, h * PX, d * PX)
        : new THREE.BoxGeometry(w * PX, h * PX, d * PX);
    // Hang the block from its pivot: the top of a limb, the neck for a head.
    geo.translate(0, -(h * PX) / 2, 0);
    if (part === HEAD) geo.translate(0, h * PX, 0);
    mapFaces(geo, [right, left, top, bottom, front, back], atlas.width, atlas.height);
    const [px, py] = part.pivot;
    return { geo, pivot: new THREE.Vector3((px - PERSON_W / 2) * PX, (PERSON_H - py) * PX, 0) };
  });
  // Sharp pixels, as in 2D: a figure is drawn at about its own size, where blending smears it.
  const map = pixelTexture(atlas);
  map.minFilter = THREE.NearestFilter;
  map.generateMipmaps = false;
  const material = new THREE.MeshLambertMaterial({ map });
  kit = { material, parts };
  kits.set(key, kit);
  return kit;
}

/** The dark outline round the 2D art, which a block's own edges stand in for. */
const isInk = (d: Uint8ClampedArray, i: number) =>
  Math.abs(d[i] - 0x28) + Math.abs(d[i + 1] - 0x30) + Math.abs(d[i + 2] - 0x38) < 24;

/**
 * Makes a piece a solid block face. The 2D art is round, with an outline and see-through
 * corners; each row is carried out to the edges in its own colours (hair to the sides of the
 * hair, skin to the sides of a chin), and rows with nothing in them take the nearest row's.
 */
function solidify(c: HTMLCanvasElement) {
  const g = c.getContext('2d')!;
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const w = c.width;
  const solid = (i: number) => d[i + 3] >= 128 && !isInk(d, i);
  const copy = (to: number, from: number) => {
    for (let k = 0; k < 4; k++) d[to + k] = d[from + k];
    d[to + 3] = 255;
  };
  const filled: boolean[] = [];
  for (let y = 0; y < c.height; y++) {
    const row = y * w * 4;
    let first = -1;
    let last = -1;
    for (let x = 0; x < w; x++)
      if (solid(row + x * 4)) {
        if (first < 0) first = x;
        last = x;
      }
    filled.push(first >= 0);
    if (first < 0) continue;
    for (let x = 0; x < first; x++) copy(row + x * 4, row + first * 4);
    for (let x = last + 1; x < w; x++) copy(row + x * 4, row + last * 4);
    // Gaps inside, such as between an arm and the body, take the colour to their left.
    for (let x = first + 1; x < last; x++)
      if (d[row + x * 4 + 3] < 128) copy(row + x * 4, row + (x - 1) * 4);
  }
  const rows = filled.flatMap((f, y) => (f ? [y] : []));
  for (let y = 0; y < c.height; y++) {
    if (filled[y]) continue;
    if (!rows.length) {
      for (let x = 0; x < w; x++) d.set([0x80, 0x80, 0x80, 255], (y * w + x) * 4);
      continue;
    }
    const near = rows.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a));
    d.copyWithin(y * w * 4, near * w * 4, (near + 1) * w * 4);
  }
  g.putImageData(img, 0, 0);
}

/** How finely a head is cut, along each side: enough that its curves read as round. */
const HEAD_SEGMENTS = 6;
/** How much of a head's narrowest half is curve rather than flat. */
const HEAD_ROUND = 0.6;

/**
 * A box with its edges and corners rounded off, for a head. It keeps a box's six faces, so each
 * still wears its own piece of the art, but the art wraps round the curves: the face looks out
 * of the flat middle of the front, the hair runs over the top and down the sides. The cuts are
 * spaced evenly along the surface, so the art is not squashed at the edges.
 */
function roundedBox(w: number, h: number, d: number) {
  const n = HEAD_SEGMENTS;
  const geo = new THREE.BoxGeometry(w, h, d, n, n, n);
  const half = [w / 2, h / 2, d / 2];
  const r = Math.min(...half) * HEAD_ROUND;
  // Along one axis: flat for 2(e - r) in the middle, then an eighth of a turn of curve each end.
  const spread = (u: number, e: number) => {
    const flat = e - r;
    const arc = (r * Math.PI) / 4;
    const s = Math.abs(u) * (flat + arc);
    const a = s <= flat ? s : flat + r * Math.tan((s - flat) / r);
    return Math.sign(u) * a;
  };
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const nrm = geo.getAttribute('normal') as THREE.BufferAttribute;
  const p = new THREE.Vector3();
  const core = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.set(
      spread(pos.getX(i) / half[0], half[0]),
      spread(pos.getY(i) / half[1], half[1]),
      spread(pos.getZ(i) / half[2], half[2]),
    );
    // The nearest point of the flat-sided core, then out from it by the radius.
    core.set(
      THREE.MathUtils.clamp(p.x, r - half[0], half[0] - r),
      THREE.MathUtils.clamp(p.y, r - half[1], half[1] - r),
      THREE.MathUtils.clamp(p.z, r - half[2], half[2] - r),
    );
    const out = p.sub(core).normalize();
    nrm.setXYZ(i, out.x, out.y, out.z);
    out.multiplyScalar(r).add(core);
    pos.setXYZ(i, out.x, out.y, out.z);
  }
  return geo;
}

/** Points each face of a box at its piece of the atlas. */
function mapFaces(geo: THREE.BufferGeometry, crops: Crop[], aw: number, ah: number) {
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  // A box cut finer has more corners to each face, but still in face order.
  const each = uv.count / 6;
  crops.forEach(([x, y, w, h], face) => {
    for (let k = 0; k < each; k++) {
      const i = face * each + k;
      const u = uv.getX(i);
      const v = uv.getY(i);
      uv.setXY(i, (x + u * w) / aw, 1 - (y + (1 - v) * h) / ah);
    }
  });
  uv.needsUpdate = true;
}

/**
 * How far a figure leans back toward the camera. The camera looks down steeply, which on its own
 * shows mostly the tops of heads; this keeps faces in view, as the 2D art does.
 */
const TILT = -0.3;

const ANGLE: Record<Dir, number> = { down: 0, up: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 };

/** Turns from `angle` toward facing `dir` the short way round, quickly but not in a snap. */
export function turnToward(angle: number | null, dir: Dir): number {
  const want = ANGLE[dir];
  if (angle === null) return want;
  let delta = want - angle;
  delta = Math.atan2(Math.sin(delta), Math.cos(delta));
  return angle + delta * 0.35;
}

/** Something a figure can ride: it sits on its seat and pedals. */
export interface Ride {
  readonly group: THREE.Group;
  /** Where the seat is, from the ground under the ride's middle. */
  readonly seat: { y: number; z: number };
}

/** One person standing in the world. */
export class Figure {
  readonly group = new THREE.Group();
  /** Turns to face the way the figure is going, inside the group that leans it back. */
  private readonly body = new THREE.Group();
  private readonly limbs: THREE.Mesh[] = [];
  private angle: number | null = null;
  private ride: Ride | null = null;

  constructor(key: string, style: Style, headless = false) {
    const kit = kitOf(key, style, headless);
    this.group.rotation.x = TILT;
    this.group.add(this.body);
    for (const part of kit.parts) {
      const mesh = new THREE.Mesh(part.geo, kit.material);
      mesh.position.copy(part.pivot);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.body.add(mesh);
      this.limbs.push(mesh);
    }
  }

  /**
   * Stands the figure at (x, z) facing `dir`. `swing` runs from -1 to 1 through a step (0 when
   * standing): legs and arms swing opposite ways, and the body rises a little at mid-stride.
   */
  pose(x: number, z: number, dir: Dir, swing: number, bob: number) {
    this.mount(null);
    this.place(x, bob + Math.abs(swing) * 0.03, z, dir);
    const [armR, armL, legR, legL] = this.arms();
    legR.rotation.x = swing * 0.6;
    legL.rotation.x = -swing * 0.6;
    armR.rotation.x = -swing * 0.5;
    armL.rotation.x = swing * 0.5;
  }

  /**
   * Sits the figure on `ride` at (x, z) facing `dir`, hands on the bars, feet on the pedals.
   * `pedal` is how far forward the right foot is, from -1 to 1.
   */
  rideOn(ride: Ride, x: number, z: number, dir: Dir, pedal: number) {
    this.mount(ride);
    // Hips on the seat: the legs hang from 30 sprite pixels up.
    const lift = ride.seat.y - 30 * PX;
    this.place(x, lift, z, dir);
    ride.group.position.set(0, -lift, -ride.seat.z);
    const [armR, armL, legR, legL] = this.arms();
    legR.rotation.x = -0.3 - pedal * 0.25;
    legL.rotation.x = -0.3 + pedal * 0.25;
    armR.rotation.x = armL.rotation.x = -0.95;
  }

  private place(x: number, y: number, z: number, dir: Dir) {
    this.angle = turnToward(this.angle, dir);
    this.group.position.set(x, y, z);
    this.body.rotation.y = this.angle;
  }

  /** The last four limbs are always right arm, left arm, right leg, left leg. */
  private arms() {
    return this.limbs.slice(this.limbs.length - 4);
  }

  /** Puts the ride under the figure, turning with it, or takes it away. */
  private mount(ride: Ride | null) {
    if (this.ride === ride) return;
    if (this.ride) this.body.remove(this.ride.group);
    this.ride = ride;
    if (ride) this.body.add(ride.group);
  }
}
