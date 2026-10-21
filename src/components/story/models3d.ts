import * as THREE from 'three';
import type { Dir } from '@/lib/story/world';
import { turnToward, type Ride } from './figure3d';
import {
  BIKES,
  DOG,
  DOG_GREY,
  DOG_SHINE,
  DOG_WHITE,
  NOSE,
  RIM,
  shade,
  TONGUE,
  TYRE,
  type BikeKind,
} from './people';

/**
 * Norm and the bikes in the 3D overworld as solid models, built from blocks in the colours of
 * their 2D art: Norm is a black and white collie who trots, wags and turns round, and a bike has
 * round wheels that roll, pedals that turn and a frame you sit on.
 */

const materials = new Map<string, THREE.MeshLambertMaterial>();
function paint(colour: string, glow = false) {
  const key = `${colour}:${glow}`;
  let m = materials.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color: colour });
    if (glow) m.emissive.set(colour);
    materials.set(key, m);
  }
  return m;
}

const boxes = new Map<string, THREE.BoxGeometry>();
/** A block of the given size, centred on (x, y, z), added to `parent`. */
function block(
  parent: THREE.Object3D,
  size: [number, number, number],
  at: [number, number, number],
  colour: string,
  glow = false,
) {
  const key = size.join(',');
  let geo = boxes.get(key);
  if (!geo) boxes.set(key, (geo = new THREE.BoxGeometry(...size)));
  const mesh = new THREE.Mesh(geo, paint(colour, glow));
  mesh.position.set(...at);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** A square rod of thickness `t` from a to b, as for the tubes of a bike's frame. */
function rod(
  parent: THREE.Object3D,
  a: [number, number, number],
  b: [number, number, number],
  t: number,
  colour: string,
) {
  const from = new THREE.Vector3(...a);
  const to = new THREE.Vector3(...b);
  const mesh = block(parent, [t, from.distanceTo(to) + t, t], [0, 0, 0], colour);
  mesh.position.copy(from).lerp(to, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.sub(from).normalize());
  return mesh;
}

/** A group hung from a pivot, so it can swing like a leg or a tail. */
function joint(parent: THREE.Object3D, x: number, y: number, z: number) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

/** Norm leans back a little toward the camera, like people do, but less, as he's long. */
const NORM_TILT = -0.15;

/** Norm: a border collie, black with a white blaze, muzzle, chest, socks and tail tip. */
export class Norm {
  readonly group = new THREE.Group();
  private readonly body = new THREE.Group();
  private readonly head: THREE.Group;
  private readonly tail: THREE.Group;
  /** Front left, front right, back left, back right. */
  private readonly legs: THREE.Group[] = [];
  private angle: number | null = null;

  constructor() {
    this.group.rotation.x = NORM_TILT;
    this.group.add(this.body);
    const b = this.body;
    // He faces +z. The body, with a white chest at the front and a grey belly under it.
    block(b, [0.3, 0.28, 0.6], [0, 0.44, 0], DOG);
    block(b, [0.31, 0.06, 0.6], [0, 0.6, 0], DOG_SHINE);
    block(b, [0.31, 0.24, 0.14], [0, 0.41, 0.24], DOG_WHITE);
    block(b, [0.2, 0.16, 0.16], [0, 0.6, 0.24], DOG);
    block(b, [0.2, 0.04, 0.4], [0, 0.29, 0.06], DOG_GREY);
    for (const [x, z] of [
      [0.09, 0.2],
      [-0.09, 0.2],
      [0.09, -0.2],
      [-0.09, -0.2],
    ]) {
      const leg = joint(b, x, 0.34, z);
      block(leg, [0.09, 0.26, 0.09], [0, -0.13, 0], DOG);
      block(leg, [0.1, 0.08, 0.1], [0, -0.3, 0.005], DOG_WHITE);
      this.legs.push(leg);
    }
    // The head, out in front over the chest.
    const h = (this.head = joint(b, 0, 0.62, 0.3));
    block(h, [0.32, 0.3, 0.26], [0, 0.12, 0.05], DOG);
    // The blaze up the middle of the face, opening into the white muzzle.
    block(h, [0.06, 0.2, 0.02], [0, 0.15, 0.19], DOG_WHITE);
    block(h, [0.16, 0.1, 0.12], [0, 0.03, 0.24], DOG_WHITE);
    block(h, [0.06, 0.04, 0.03], [0, 0.07, 0.305], NOSE);
    block(h, [0.06, 0.02, 0.06], [0, -0.025, 0.27], TONGUE);
    // Eyes, with a glint.
    for (const x of [-0.075, 0.075]) {
      block(h, [0.05, 0.05, 0.02], [x, 0.16, 0.19], NOSE);
      block(h, [0.015, 0.015, 0.01], [x - 0.012, 0.175, 0.202], DOG_WHITE);
    }
    // One ear up, one flopped over.
    block(h, [0.08, 0.1, 0.05], [0.1, 0.31, 0.02], DOG);
    const flop = block(h, [0.1, 0.05, 0.07], [-0.17, 0.24, 0.02], DOG);
    flop.rotation.z = 0.5;
    // The tail, curving up behind, with its white tip.
    const t = (this.tail = joint(b, 0, 0.52, -0.29));
    t.rotation.x = -0.7;
    block(t, [0.06, 0.06, 0.2], [0, 0, -0.1], DOG);
    block(t, [0.065, 0.065, 0.07], [0, 0, -0.23], DOG_WHITE);
  }

  /**
   * Stands Norm at (x, z) facing `dir`. `swing` runs from -1 to 1 through a step, as for people:
   * he trots, his legs going in diagonal pairs, and wags harder on the move.
   */
  pose(x: number, z: number, dir: Dir, swing: number, bob: number, now: number) {
    this.angle = turnToward(this.angle, dir);
    this.body.rotation.y = this.angle;
    this.group.position.set(x, bob, z);
    const [fl, fr, bl, br] = this.legs;
    fl.rotation.x = br.rotation.x = swing * 0.55;
    fr.rotation.x = bl.rotation.x = -swing * 0.55;
    this.head.rotation.x = Math.abs(swing) * 0.08;
    this.tail.rotation.y = Math.sin(now / (swing ? 70 : 140)) * (swing ? 0.6 : 0.35);
  }
}

/** The hubs are this high, and the wheels this big round, so a bike stands on the ground. */
const WHEEL_R = 0.2;
const TREAD = 0.045;
const AXLE = WHEEL_R + TREAD;
/** Where the seat is, so a rider can sit on it. */
const SEAT = { y: 0.69, z: -0.14 };

/** A bike, front wheel at +z: a Lime e-bike or the High Nelly, by `kind`. */
export class Bike implements Ride {
  readonly group = new THREE.Group();
  readonly seat = SEAT;
  private readonly wheels: THREE.Group[] = [];
  private readonly cranks: THREE.Group;

  constructor(kind: BikeKind) {
    const look = BIKES[kind];
    const lime = kind === 'lime';
    const g = this.group;
    const frame = look.frame;
    const dark = shade(frame, 0.7);
    const tyre = new THREE.TorusGeometry(WHEEL_R, TREAD, 8, 24).rotateY(Math.PI / 2);
    const rim = new THREE.TorusGeometry(WHEEL_R - 0.05, 0.012, 4, 24).rotateY(Math.PI / 2);
    // A mudguard: the top part of a ring, over the wheel.
    const guard = new THREE.TorusGeometry(WHEEL_R + 0.065, 0.02, 4, 16, 2.2)
      .rotateZ(Math.PI / 2 - 1.1)
      .rotateY(Math.PI / 2);
    for (const z of [0.38, -0.38]) {
      const wheel = joint(g, 0, AXLE, z);
      const t = new THREE.Mesh(tyre, paint(TYRE));
      t.castShadow = true;
      wheel.add(t, new THREE.Mesh(rim, paint(RIM)));
      // Spokes, so you can see it roll.
      for (let i = 0; i < 3; i++)
        block(wheel, [0.01, (WHEEL_R - 0.05) * 2, 0.012], [0, 0, 0], RIM).rotation.x =
          (i * Math.PI) / 3;
      block(wheel, [0.06, 0.05, 0.05], [0, 0, 0], '#5a5e66');
      this.wheels.push(wheel);
      const m = new THREE.Mesh(guard, paint(frame));
      m.position.set(0, AXLE, z);
      m.castShadow = true;
      g.add(m);
    }
    const head: [number, number, number] = [0, 0.66, 0.3];
    const crank: [number, number, number] = [0, 0.24, 0.02];
    const seatPost: [number, number, number] = [0, SEAT.y - 0.03, SEAT.z];
    const rear: [number, number, number] = [0, AXLE, -0.38];
    // The frame: a Lime steps through, low between the wheels; the Nelly has a high top tube.
    if (lime) {
      rod(g, head, [0, 0.27, 0.12], 0.07, frame);
      rod(g, [0, 0.27, 0.12], [0, 0.24, -0.08], 0.07, frame);
      rod(g, [0, 0.24, -0.08], seatPost, 0.065, frame);
      // The battery, on the down tube, with the name in white along it.
      block(g, [0.09, 0.08, 0.24], [0, 0.31, 0.03], '#3a3e46');
      block(g, [0.092, 0.02, 0.16], [0, 0.31, 0.03], look.trim);
    } else {
      rod(g, head, crank, 0.05, frame);
      rod(g, crank, seatPost, 0.05, frame);
      rod(g, [0, 0.6, 0.28], [0, 0.62, SEAT.z], 0.045, frame);
    }
    // Stays from under the seat and the cranks back to the rear hub, one each side.
    for (const x of [-0.05, 0.05]) {
      rod(g, [x, seatPost[1] - 0.05, seatPost[2]], [x, AXLE, -0.38], 0.03, frame);
      rod(g, [x, crank[1], crank[2] - 0.04], [x, rear[1], rear[2]], 0.03, frame);
      // The fork, from the head tube down to the front hub.
      rod(g, [x * 0.8, head[1] - 0.04, head[2]], [x, AXLE, 0.38], 0.035, dark);
    }
    // Seat, stem and handlebars, with grips at the ends.
    block(g, [0.13, 0.05, 0.2], [0, SEAT.y, SEAT.z], '#141418');
    rod(g, head, [0, 0.84, 0.27], 0.045, '#2a2a30');
    block(g, [0.5, 0.035, 0.035], [0, 0.85, 0.25], '#141418');
    for (const x of [-0.23, 0.23]) block(g, [0.06, 0.05, 0.05], [x, 0.85, 0.25], '#2a2a30');
    if (look.basket) {
      // A black wire basket over the front wheel, open at the top.
      const bx = joint(g, 0, 0.64, 0.47);
      block(bx, [0.26, 0.02, 0.2], [0, -0.08, 0], '#141418');
      for (const x of [-0.12, 0.12]) block(bx, [0.02, 0.16, 0.2], [x, 0, 0], '#141418');
      for (const z of [-0.09, 0.09]) block(bx, [0.26, 0.16, 0.02], [0, 0, z], '#141418');
      block(bx, [0.24, 0.02, 0.022], [0, 0.07, 0.1], '#3a3e46');
      block(bx, [0.1, 0.04, 0.025], [0, 0.0, 0.1], frame);
      // And a rack behind, in the frame's colour, with the tail light.
      block(g, [0.14, 0.03, 0.26], [0, 0.56, -0.34], frame);
      block(g, [0.15, 0.012, 0.24], [0, 0.578, -0.34], shade(frame, 1.25));
    }
    block(g, [0.06, 0.04, 0.03], [0, lime ? 0.5 : 0.52, -0.48], '#e83a3a', true);
    // The headlight, under the bars.
    block(g, [0.06, 0.05, 0.04], [0, 0.66, lime ? 0.36 : 0.34], '#fff8c0', true);
    // Cranks and pedals, which turn as you ride.
    this.cranks = joint(g, 0, crank[1], crank[2]);
    block(this.cranks, [0.04, 0.1, 0.1], [0, 0, 0], '#5a5e66');
    for (const side of [-1, 1]) {
      block(this.cranks, [0.02, 0.16, 0.025], [side * 0.06, -side * 0.08, 0], '#2a2a30');
      block(this.cranks, [0.08, 0.02, 0.05], [side * 0.1, -side * 0.15, 0], '#141418');
    }
  }

  /** Rolls the wheels and turns the cranks to `turn`, the wheels' angle in radians. */
  roll(turn: number) {
    for (const w of this.wheels) w.rotation.x = turn;
    // Gearing: the cranks go round a little slower than the wheels.
    this.cranks.rotation.x = turn * 0.6;
  }

  /** How far forward the rider's right foot is through the pedals' turn, from -1 to 1. */
  pedal(turn: number) {
    return Math.sin(turn * 0.6);
  }
}
