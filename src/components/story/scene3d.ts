import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { find, tileAt, type GameMap } from '@/lib/story/world';
import { DOOR_LABEL, INK, LIGHT } from './pixels';
import {
  CAR_COLOURS,
  carColour,
  frameOf,
  grassFront,
  groundOverlay,
  isAutumn,
  isPine,
  RES,
  TALL_GRASS,
  tileImage,
  variantAt,
  type Around,
} from './tiles';
import { TILE } from './pixels';

/**
 * The 3D overworld's scenery, built once per map from the same tiles as the 2D one: the ground
 * is the 2D map itself, painted onto a plane, and everything that stands up off it is lifted into
 * 3D. Buildings get walls and a pitched roof, trees are low-poly, walls, hedges and furniture are
 * blocks wearing their own tile's art, and tall grass stands up in blades. One unit is one tile.
 */

/** Device pixels per tile in the textures, as in the 2D art. */
const PX = TILE * RES;
const BUILDING = '^#PMGHL';
const WALL_H = 1.5;
const ROOF_H = 0.7;

/** How tall each solid tile stands, in tiles. Anything not here is flat. */
const HEIGHT: Record<string, number> = {
  w: 0.45,
  e: 0.3,
  h: 0.7,
  C: 0.55,
  U: 0.45,
  N: 0.75,
  Q: 0.35,
  X: 1,
  Z: 0.4,
  Y: 1.25,
  V: 1.25,
  A: 1.1,
  W: 1.6,
  O: 1.6,
  J: 1.6,
  '#': WALL_H,
};

/** Kept GPU textures for each canvas the 2D art made, so a tile's look is uploaded once. */
const textures = new WeakMap<HTMLCanvasElement, THREE.CanvasTexture>();
export function textureOf(c: HTMLCanvasElement, repeat = false): THREE.CanvasTexture {
  let t = textures.get(c);
  if (!t) {
    t = pixelTexture(c);
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    textures.set(c, t);
  }
  return t;
}

/** A texture that keeps its pixels crisp up close and smooths them in the distance. */
export function pixelTexture(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = 4;
  return t;
}

const materials = new Map<THREE.Texture, THREE.MeshLambertMaterial>();
const lambert = (map: THREE.Texture) => {
  let m = materials.get(map);
  if (!m) materials.set(map, (m = new THREE.MeshLambertMaterial({ map })));
  return m;
};

export interface Level {
  group: THREE.Group;
  /** Repaints the animated tiles (water, bog, flowers, tall grass, fire) when their frame turns. */
  animate: (now: number) => void;
  /** Tree crowns, which lean in the wind. */
  trees: { mesh: THREE.InstancedMesh; base: THREE.Matrix4[]; at: [number, number][] }[];
  /** Where light spills out at night: in front of each door. */
  doors: { x: number; y: number }[];
  dispose: () => void;
}

export function buildLevel(map: GameMap, gymRoofs: Set<string>): Level {
  const group = new THREE.Group();
  const owned: { dispose: () => void }[] = [];
  const own = <T extends { dispose: () => void }>(o: T) => (owned.push(o), o);
  const rows = map.rows.length;
  const cols = map.rows[0].length;
  const inMap = (x: number, y: number) => y >= 0 && x >= 0 && y < rows && x < cols;
  // As in 2D: markers read as the ground under them, and past the edge is all trees.
  const at = (x: number, y: number) => (inMap(x, y) ? tileAt(map, x, y) : map.inside ? 'W' : 'T');
  const around = (x: number, y: number): Around => ({
    n: at(x, y - 1),
    e: at(x + 1, y),
    s: at(x, y + 1),
    w: at(x - 1, y),
  });
  const imageAt = (x: number, y: number, now = 0, a = around(x, y)) => {
    const tile = at(x, y);
    return tileImage(tile, a, variantAt(x, y), frameOf(tile, now), gymRoofs.has(`${x},${y}`));
  };

  // ---------- the ground: the 2D map, painted onto a plane ----------
  const [paper, g] = canvas(cols * PX, rows * PX);
  const overlay = map.inside ? null : groundOverlay(map.id, cols, rows, (x, y) => at(x, y));
  const animated: { x: number; y: number; tile: string; frame: number }[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = at(x, y);
      g.drawImage(imageAt(x, y), x * PX, y * PX);
      if ('~Bb,"Jy'.includes(tile)) animated.push({ x, y, tile, frame: 0 });
    }
  }
  if (overlay) g.drawImage(overlay, 0, 0);
  const groundTex = own(pixelTexture(paper));
  const plane = new THREE.Mesh(
    own(new THREE.PlaneGeometry(cols, rows)),
    own(new THREE.MeshLambertMaterial({ map: groundTex })),
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(cols / 2, 0, rows / 2);
  plane.receiveShadow = true;
  group.add(plane);

  // Outdoors, the land carries on past the edges, so the camera never looks off the world.
  if (!map.inside) {
    const beyond = new THREE.Mesh(
      own(new THREE.PlaneGeometry(cols + 80, rows + 80)),
      own(new THREE.MeshLambertMaterial({ color: '#5a9e3e' })),
    );
    beyond.rotation.x = -Math.PI / 2;
    beyond.position.set(cols / 2, -0.02, rows / 2);
    beyond.receiveShadow = true;
    group.add(beyond);
  }

  const animate = (now: number) => {
    let changed = false;
    for (const a of animated) {
      const f = frameOf(a.tile, now);
      if (f === a.frame) continue;
      a.frame = f;
      changed = true;
      g.drawImage(imageAt(a.x, a.y, now), a.x * PX, a.y * PX);
      if (overlay) g.drawImage(overlay, a.x * PX, a.y * PX, PX, PX, a.x * PX, a.y * PX, PX, PX);
    }
    if (changed) groundTex.needsUpdate = true;
  };

  // ---------- trees ----------
  const trees: [number, number, number][] = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) if (at(x, y) === 'T') trees.push([x, y, variantAt(x, y)]);
  if (!map.inside) {
    // A wood around the map, behind its own border of trees.
    for (let y = -5; y < rows + 5; y++) {
      for (let x = -5; x < cols + 5; x++) {
        if (inMap(x, y)) continue;
        const edge = at(Math.max(0, Math.min(cols - 1, x)), Math.max(0, Math.min(rows - 1, y)));
        const v = variantAt(x + 1000, y + 1000);
        if (edge === 'T' && v % 2) trees.push([x, y, v]);
      }
    }
  }
  const forest = buildTrees(trees);
  forest.meshes.forEach((m) => group.add(m));
  owned.push(forest);

  // ---------- buildings, walls and everything else that stands up ----------
  const seen = new Set<string>();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (seen.has(`${x},${y}`) || !BUILDING.includes(at(x, y))) continue;
      // Flood out over the building's tiles.
      const tiles: [number, number][] = [];
      const queue: [number, number][] = [[x, y]];
      seen.add(`${x},${y}`);
      while (queue.length) {
        const [qx, qy] = queue.pop()!;
        tiles.push([qx, qy]);
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const k = `${qx + dx},${qy + dy}`;
          if (!seen.has(k) && inMap(qx + dx, qy + dy) && BUILDING.includes(at(qx + dx, qy + dy))) {
            seen.add(k);
            queue.push([qx + dx, qy + dy]);
          }
        }
      }
      if (tiles.some(([tx, ty]) => at(tx, ty) === '^')) {
        group.add(house(tiles, at, imageAt, gymRoofs, own));
      } else {
        // A wall with no roof, such as the walls around a quad: each tile its own block.
        for (const [tx, ty] of tiles) group.add(block(tx, ty, WALL_H, imageAt(tx, ty), null, own));
      }
    }
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = at(x, y);
      if (tile === 'K') group.add(campanile(x, y));
      else if (tile === 'R') group.add(rock(x, y));
      else if (tile === 'p') group.add(palm(x, y, variantAt(x, y)));
      else if (tile === 'y') group.add(yacht(x, y));
      else if (tile === 'c') group.add(jeep(x, y, variantAt(x, y)));
      else if (tile === 'S') group.add(signpost(x, y, imageAt(x, y)));
      else if (tile === 'f') group.add(fence(x, y, at));
      else if (tile in HEIGHT && tile !== '#') {
        // Indoors, the bottom wall is kept low, so the room can be seen over it.
        const low = map.inside && y === rows - 1;
        const a = around(x, y);
        const top = imageAt(x, y, 0, { ...a, s: tile === 'W' ? 'W' : a.s });
        const face = tile === 'W' ? imageAt(x, y, 0, { ...a, s: 'F' }) : null;
        group.add(block(x, y, low ? 0.2 : HEIGHT[tile], top, face, own));
      }
    }
  }

  // ---------- tall grass, standing up in blades ----------
  const blades: THREE.BufferGeometry[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (at(x, y) !== TALL_GRASS) continue;
      for (const dz of [0.35, 0.85]) {
        const b = new THREE.PlaneGeometry(1, 1);
        b.translate(0, 0.5, 0);
        b.rotateX(-0.35);
        b.translate(x + 0.5, -0.04, y + dz);
        blades.push(b);
      }
    }
  }
  if (blades.length) {
    const frames = [0, 1].map((f) => textureOf(grassFront(f)));
    const mat = own(
      new THREE.MeshLambertMaterial({ map: frames[0], alphaTest: 0.5, side: THREE.DoubleSide }),
    );
    const mesh = new THREE.Mesh(own(mergeGeometries(blades)), mat);
    blades.forEach((b) => b.dispose());
    mesh.onBeforeRender = () => {
      mat.map = frames[frameOf(TALL_GRASS, performance.now())];
    };
    group.add(mesh);
  }

  // ---------- shop signs over the doors ----------
  for (const [door, label] of Object.entries(DOOR_LABEL)) {
    for (const d of find(map, door)) group.add(sign(label, door, d.x, d.y, own));
  }

  return {
    group,
    animate,
    trees: forest.crowns,
    doors: ['P', 'M', 'G', 'H', 'L'].flatMap((d) => find(map, d)),
    dispose: () => {
      owned.forEach((o) => o.dispose());
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    },
  };
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

type Own = <T extends { dispose: () => void }>(o: T) => T;
type ImageAt = (x: number, y: number, now?: number, a?: Around) => HTMLCanvasElement;

/** A block standing on a tile, wearing its tile's art on top and (or its face art) round the sides. */
function block(
  x: number,
  y: number,
  h: number,
  top: HTMLCanvasElement,
  face: HTMLCanvasElement | null,
  own: Own,
) {
  const geo = own(new THREE.BoxGeometry(1, h, 1));
  const side = lambert(textureOf(face ?? top));
  const lid = lambert(textureOf(top));
  // +x, -x, +y, -y, +z, -z
  const mesh = new THREE.Mesh(geo, [side, side, lid, lid, side, side]);
  mesh.position.set(x + 0.5, h / 2, y + 0.5);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

/** A building: walls with the front row's art (its door and windows) and a pitched roof. */
function house(
  tiles: [number, number][],
  at: (x: number, y: number) => string,
  imageAt: ImageAt,
  gymRoofs: Set<string>,
  own: Own,
) {
  const xs = tiles.map(([x]) => x);
  const ys = tiles.map(([, y]) => y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs) + 1;
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys) + 1;
  const w = x1 - x0;
  const d = y1 - y0;
  const slate = tiles.some(([x, y]) => gymRoofs.has(`${x},${y}`));
  const out = new THREE.Group();

  // The front is the bottom row of the building, as it's drawn in 2D: door, windows and all.
  const [front, f] = canvas(w * PX, PX);
  for (let x = x0; x < x1; x++) {
    const tile = at(x, y1 - 1);
    f.drawImage(
      BUILDING.includes(tile) && tile !== '^'
        ? imageAt(x, y1 - 1)
        : tileImage('#', { n: '^', e: '#', s: '.', w: '#' }, 0, 0),
      (x - x0) * PX,
      0,
    );
  }
  const plain = tileImage('#', { n: '#', e: '#', s: '#', w: '#' }, 1, 0);
  // A plain stretch of plaster for the sides and back: the wall's art with the window painted out.
  const [bare, b] = canvas(PX, PX);
  b.drawImage(plain, 0, 0);
  b.drawImage(plain, 0, PX - 6, PX, 6, 0, 2, PX, PX - 8);
  const sideTex = own(pixelTexture(bare));
  sideTex.wrapS = THREE.RepeatWrapping;
  sideTex.repeat.set(d, 1);
  const backTex = own(pixelTexture(bare));
  backTex.wrapS = THREE.RepeatWrapping;
  backTex.repeat.set(w, 1);
  const frontMat = own(new THREE.MeshLambertMaterial({ map: own(pixelTexture(front)) }));
  const sideMat = own(new THREE.MeshLambertMaterial({ map: sideTex }));
  const backMat = own(new THREE.MeshLambertMaterial({ map: backTex }));
  const roofCol = slate ? '#566272' : '#c84434';
  const topMat = own(new THREE.MeshLambertMaterial({ color: roofCol }));
  const body = new THREE.Mesh(own(new THREE.BoxGeometry(w, WALL_H, d)), [
    sideMat,
    sideMat,
    topMat,
    topMat,
    frontMat,
    backMat,
  ]);
  body.position.set(x0 + w / 2, WALL_H / 2, y0 + d / 2);
  body.castShadow = body.receiveShadow = true;
  out.add(body);

  // The roof: two slopes meeting at a ridge along the building, over the eaves, with gable ends.
  const over = 0.14;
  const rw = w + over * 2;
  const rd = d + over * 2;
  const shingles = textureOf(
    tileImage('^', { n: '^', e: '^', s: '^', w: '^' }, 2, 0, slate),
    true,
  ).clone();
  own(shingles);
  shingles.wrapS = shingles.wrapT = THREE.RepeatWrapping;
  shingles.repeat.set(rw, Math.hypot(rd / 2, ROOF_H));
  shingles.needsUpdate = true;
  const roofMat = own(new THREE.MeshLambertMaterial({ map: shingles, side: THREE.DoubleSide }));
  const geo = new THREE.BufferGeometry();
  const hx = rw / 2;
  const hz = rd / 2;
  // Two slopes, each a quad from the eave up to the ridge.
  // prettier-ignore
  const pos = [
    -hx, 0, hz,  hx, 0, hz,  hx, ROOF_H, 0,  -hx, ROOF_H, 0,
    hx, 0, -hz,  -hx, 0, -hz,  -hx, ROOF_H, 0,  hx, ROOF_H, 0,
  ];
  const s = 1;
  // prettier-ignore
  const uv = [0, 0, s, 0, s, s, 0, s,  0, 0, s, 0, s, s, 0, s];
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
  geo.computeVertexNormals();
  const roof = new THREE.Mesh(own(geo), roofMat);
  roof.position.set(x0 + w / 2, WALL_H, y0 + d / 2);
  roof.castShadow = true;
  out.add(roof);
  const gable = new THREE.BufferGeometry();
  // prettier-ignore
  gable.setAttribute('position', new THREE.Float32BufferAttribute([
    -w / 2, 0, d / 2,  -w / 2, 0, -d / 2,  -w / 2, ROOF_H * 0.98, 0,
    w / 2, 0, -d / 2,  w / 2, 0, d / 2,  w / 2, ROOF_H * 0.98, 0,
  ], 3));
  gable.computeVertexNormals();
  const ends = new THREE.Mesh(
    own(gable),
    own(new THREE.MeshLambertMaterial({ color: '#e8dcc0', side: THREE.DoubleSide })),
  );
  ends.position.copy(roof.position);
  out.add(ends);
  // A chimney on houses and pubs.
  if (!slate && w >= 3) {
    const chimney = new THREE.Mesh(
      own(new THREE.BoxGeometry(0.3, 0.6, 0.3)),
      own(new THREE.MeshLambertMaterial({ color: '#8a5a44' })),
    );
    chimney.position.set(x0 + w - 0.7, WALL_H + ROOF_H * 0.75, y0 + d / 2 - 0.25);
    chimney.castShadow = true;
    out.add(chimney);
  }
  return out;
}

/** The low-poly trees: a trunk and a crown of leaves for each, pines in tiers, in instances. */
export function buildTrees(trees: [number, number, number][]) {
  const trunkGeo = new THREE.CylinderGeometry(0.09, 0.13, 0.7, 6);
  trunkGeo.translate(0, 0.35, 0);
  // Few faces: hundreds of trees go to the GPU twice a frame (once for the shadows).
  const blobGeo = new THREE.DodecahedronGeometry(0.52, 0);
  const coneGeo = new THREE.ConeGeometry(0.5, 0.8, 7);
  const leaves = new THREE.MeshLambertMaterial({ flatShading: true });
  const bark = new THREE.MeshLambertMaterial({ color: '#6a4426' });
  const broad = trees.filter(([, , v]) => !isPine(v));
  const pines = trees.filter(([, , v]) => isPine(v));
  const trunks = new THREE.InstancedMesh(trunkGeo, bark, trees.length);
  const blobs = new THREE.InstancedMesh(blobGeo, leaves, broad.length * 2);
  const cones = new THREE.InstancedMesh(coneGeo, leaves, pines.length * 3);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const col = new THREE.Color();
  const crowns = [
    { mesh: blobs, base: [] as THREE.Matrix4[], at: [] as [number, number][] },
    { mesh: cones, base: [] as THREE.Matrix4[], at: [] as [number, number][] },
  ];
  const put = (
    k: 0 | 1,
    i: number,
    x: number,
    y: number,
    pos: THREE.Vector3,
    scale: THREE.Vector3,
    colour: string,
  ) => {
    const mat = new THREE.Matrix4().compose(
      pos,
      q.setFromEuler(new THREE.Euler(0, x * 1.7, 0)),
      scale,
    );
    crowns[k].mesh.setMatrixAt(i, mat);
    crowns[k].mesh.setColorAt(i, col.set(colour));
    crowns[k].base.push(mat);
    crowns[k].at.push([x, y]);
  };
  trees.forEach(([x, y, v], i) => {
    const s = 0.9 + ((v >>> 3) % 5) * 0.06;
    m.compose(new THREE.Vector3(x + 0.5, 0, y + 0.5), q.identity(), new THREE.Vector3(s, s, s));
    trunks.setMatrixAt(i, m);
  });
  const GREENS = ['#2f7a2c', '#3a8a36', '#46963a', '#2a6e30'];
  const AUTUMN = ['#d0641e', '#e08a2c', '#c4561c'];
  broad.forEach(([x, y, v], i) => {
    const s = 0.9 + ((v >>> 3) % 5) * 0.06;
    const pal = isAutumn(v) ? AUTUMN : GREENS;
    put(
      0,
      i * 2,
      x,
      y,
      new THREE.Vector3(x + 0.5, 0.95 * s, y + 0.5),
      new THREE.Vector3(1.15 * s, 0.95 * s, 1.15 * s),
      pal[v % pal.length],
    );
    put(
      0,
      i * 2 + 1,
      x,
      y,
      new THREE.Vector3(x + 0.38, 1.4 * s, y + 0.42),
      new THREE.Vector3(0.75 * s, 0.7 * s, 0.75 * s),
      pal[(v >>> 2) % pal.length],
    );
  });
  pines.forEach(([x, y, v], i) => {
    const s = 0.9 + ((v >>> 3) % 5) * 0.06;
    const shade = ['#1f5a2c', '#246632', '#1a4e28'][v % 3];
    for (let k = 0; k < 3; k++) {
      put(
        1,
        i * 3 + k,
        x,
        y,
        new THREE.Vector3(x + 0.5, (0.75 + k * 0.42) * s, y + 0.5),
        new THREE.Vector3((1.25 - k * 0.3) * s, s, (1.25 - k * 0.3) * s),
        shade,
      );
    }
  });
  const meshes = [trunks, blobs, cones];
  for (const mesh of meshes) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  return {
    meshes,
    crowns,
    dispose: () => {
      [trunkGeo, blobGeo, coneGeo, leaves, bark].forEach((o) => o.dispose());
      meshes.forEach((o) => o.dispose());
    },
  };
}

const STONE = new THREE.MeshLambertMaterial({ color: '#d8d6d0' });

/** The Campanile: a stone plinth, four columns round the bell, a carved top and a little dome. */
function campanile(x: number, y: number) {
  const out = new THREE.Group();
  const part = (w: number, h: number, d: number, px: number, py: number, pz: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), STONE);
    m.position.set(x + 0.5 + px, py, y + 0.5 + pz);
    m.castShadow = m.receiveShadow = true;
    out.add(m);
  };
  part(1, 0.3, 1, 0, 0.15, 0);
  part(0.86, 0.12, 0.86, 0, 0.36, 0);
  for (const [cx, cz] of [
    [-0.32, -0.32],
    [0.32, -0.32],
    [-0.32, 0.32],
    [0.32, 0.32],
  ])
    part(0.16, 1.2, 0.16, cx, 1.02, cz);
  part(0.95, 0.3, 0.95, 0, 1.77, 0);
  part(0.8, 0.12, 0.8, 0, 1.98, 0);
  const bell = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: '#6a9a88' }),
  );
  bell.position.set(x + 0.5, 1.12, y + 0.5);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: '#7aa898' }),
  );
  dome.position.set(x + 0.5, 2.04, y + 0.5);
  dome.castShadow = true;
  out.add(bell, dome);
  return out;
}

function rock(x: number, y: number) {
  const r = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.42, 0),
    new THREE.MeshLambertMaterial({ color: '#9a9a94', flatShading: true }),
  );
  r.scale.set(1, 0.7, 0.9);
  r.position.set(x + 0.5, 0.25, y + 0.5);
  r.castShadow = r.receiveShadow = true;
  return r;
}

/** A cabbage palm: a slim, bent, ringed trunk and a burst of spiky fronds. */
function palm(x: number, y: number, v: number) {
  const out = new THREE.Group();
  const bark = new THREE.MeshLambertMaterial({ color: '#8a6a48', flatShading: true });
  const leaf = new THREE.MeshLambertMaterial({
    color: '#3f9640',
    flatShading: true,
    side: THREE.DoubleSide,
  });
  const lean = v % 2 ? 0.12 : -0.12;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.5, 6), bark);
  trunk.position.set(0, 0.75, 0);
  trunk.rotation.z = lean;
  out.add(trunk);
  const top = new THREE.Vector3(-Math.sin(lean) * 1.5, Math.cos(lean) * 1.5, 0);
  for (let i = 0; i < 9; i++) {
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.75, 3), leaf);
    frond.geometry.translate(0, 0.375, 0);
    frond.position.copy(top);
    frond.rotation.set(0, (i / 9) * Math.PI * 2 + v, 0);
    frond.rotateX(1.1 + (i % 3) * 0.25);
    frond.scale.set(1, 1, 0.35);
    frond.castShadow = true;
    out.add(frond);
  }
  trunk.castShadow = true;
  out.position.set(x + 0.5, 0, y + 0.5);
  return out;
}

/** A yacht in the marina: a white hull, a teak deck, a little cabin and a tall mast. */
function yacht(x: number, y: number) {
  const out = new THREE.Group();
  const white = new THREE.MeshLambertMaterial({ color: '#f4f4f6' });
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.3, 4, 1), white);
  hull.rotation.y = Math.PI / 4;
  hull.scale.set(1.25, 1, 0.55);
  hull.position.y = 0.12;
  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.05, 0.42),
    new THREE.MeshLambertMaterial({ color: '#1f4fa8' }),
  );
  stripe.position.y = 0.16;
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.03, 0.36),
    new THREE.MeshLambertMaterial({ color: '#c08850' }),
  );
  deck.position.y = 0.28;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.26), white);
  cabin.position.set(0.05, 0.36, 0);
  const metal = new THREE.MeshLambertMaterial({ color: '#c8ccd4' });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.7, 5), metal);
  mast.position.set(-0.05, 1.12, 0);
  const boom = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.05), white);
  boom.position.set(0.17, 0.5, 0);
  const pennant = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.06, 0.01),
    new THREE.MeshLambertMaterial({ color: '#d03838' }),
  );
  pennant.position.set(0.02, 1.92, 0);
  for (const m of [hull, stripe, deck, cabin, mast, boom, pennant]) {
    m.castShadow = true;
    out.add(m);
  }
  out.position.set(x + 0.5, 0, y + 0.5);
  return out;
}

/** A big parked jeep, black or white, with tinted glass and silver wheels. */
function jeep(x: number, y: number, v: number) {
  const out = new THREE.Group();
  const [body] = CAR_COLOURS[carColour(v)];
  const paint = new THREE.MeshLambertMaterial({ color: body });
  const glass = new THREE.MeshLambertMaterial({ color: '#2a3440' });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.3, 0.5), paint);
  base.position.y = 0.27;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.22, 0.46), [
    glass,
    glass,
    paint,
    paint,
    glass,
    glass,
  ]);
  cabin.position.set(-0.04, 0.53, 0);
  out.add(base, cabin);
  const tyre = new THREE.MeshLambertMaterial({ color: '#141418' });
  for (const [wx, wz] of [
    [-0.28, 0.25],
    [0.28, 0.25],
    [-0.28, -0.25],
    [0.28, -0.25],
  ]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 10), tyre);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(wx, 0.11, wz);
    out.add(wheel);
  }
  for (const m of out.children) m.castShadow = true;
  out.position.set(x + 0.5, 0, y + 0.5);
  return out;
}

const WOOD = new THREE.MeshLambertMaterial({ color: '#9a6a3c' });

/** A signpost: a board on a post, with the 2D sign's art on its face. */
function signpost(x: number, y: number, art: HTMLCanvasElement) {
  const out = new THREE.Group();
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), WOOD);
  post.position.set(x + 0.5, 0.3, y + 0.5);
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.08), [
    WOOD,
    WOOD,
    WOOD,
    WOOD,
    lambert(textureOf(art)),
    WOOD,
  ]);
  board.position.set(x + 0.5, 0.65, y + 0.55);
  post.castShadow = board.castShadow = true;
  out.add(post, board);
  return out;
}

/** A post-and-rail fence, its rails running on to the fences beside it. */
function fence(x: number, y: number, at: (x: number, y: number) => string) {
  const out = new THREE.Group();
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), WOOD);
  post.position.set(x + 0.5, 0.25, y + 0.5);
  post.castShadow = true;
  out.add(post);
  const x0 = at(x - 1, y) === 'f' ? 0 : 0.4;
  const x1 = at(x + 1, y) === 'f' ? 1 : 0.6;
  for (const h of [0.2, 0.4]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.06, 0.06), WOOD);
    rail.position.set(x + (x0 + x1) / 2, h, y + 0.5);
    rail.castShadow = true;
    out.add(rail);
  }
  return out;
}

const SIGN_COLOUR: Record<string, string> = { P: '#2f8a4a', M: '#3a70c8', G: '#d03838' };

/** A shop sign on the wall over a door, in the door's colour. */
function sign(label: string, door: string, x: number, y: number, own: Own) {
  const k = 8;
  const [, p] = canvas(1, 1);
  p.font = `700 ${7 * k}px "Pixelify Sans", sans-serif`;
  const width = Math.ceil(p.measureText(label).width / k) + 6;
  const [c, g] = canvas(width * k, 10 * k);
  g.fillStyle = INK;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = SIGN_COLOUR[door];
  g.fillRect(k / 2, k / 2, c.width - k, c.height - k);
  g.fillStyle = 'rgb(255 255 255 / 0.3)';
  g.fillRect(k / 2, k / 2, c.width - k, k);
  g.font = `700 ${7 * k}px "Pixelify Sans", sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = LIGHT;
  g.fillText(label, c.width / 2, c.height / 2 + k / 2);
  const tex = own(new THREE.CanvasTexture(c));
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    own(new THREE.PlaneGeometry(width / TILE, 10 / TILE)),
    own(new THREE.MeshLambertMaterial({ map: tex })),
  );
  mesh.position.set(x + 0.5, WALL_H - 0.14, y + 1.02);
  return mesh;
}

/**
 * Keeps the 3D look smooth on slower phones: when frames run long, it first draws fewer pixels,
 * then drops the shadows. Call it once a frame with the time; it returns true when it changed
 * something, so the caller can resize.
 */
export function quality(renderer: THREE.WebGLRenderer, sun: THREE.DirectionalLight) {
  let last = 0;
  let slow = 0;
  let frames = 0;
  return (now: number) => {
    const dt = last ? now - last : 16;
    last = now;
    // Ignore the odd long gap, such as the tab coming back from the background.
    if (dt > 500) return false;
    frames++;
    slow = slow * 0.9 + dt * 0.1;
    // A second or so of slow frames is enough to tell; then give the change time to show.
    if (frames < 12 || slow < 42) return false;
    frames = 0;
    if (renderer.getPixelRatio() > 1) {
      renderer.setPixelRatio(1);
      return true;
    }
    if (sun.castShadow) {
      sun.castShadow = false;
      return true;
    }
    return false;
  };
}
