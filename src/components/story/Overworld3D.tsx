'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { asset } from '@/lib/asset';
import { speciesById } from '@/lib/story/party';
import { shinySprite } from '@/lib/story/shiny';
import { isPresent, npcsOf, type Dir, type GameMap } from '@/lib/story/world';
import { daylight, gymRoofsOf, type Props } from './Overworld';
import { monStyle, paintPerson, PERSON_H, PERSON_W, STYLES, type Style } from './people';
import { INK, LIGHT } from './pixels';
import { buildLevel, pixelTexture, quality, type Level } from './scene3d';
import { placeWalk, startWalk, stepPose, stepT, tickWalk, type Trail } from './walk';

/**
 * The overworld in 2.5D: the same map, walking and people as the 2D one, but the land is built
 * in 3D under a tilted camera, with sunlight and shadows, and the people stand up in it as their
 * own sprites. Drawn with WebGL, and only loaded when the 3D look is picked.
 */

/** The camera hangs behind and above you, looking down at this angle. */
const PITCH = (50 * Math.PI) / 180;
const DISTANCE = 15.5;
const LEAN = -0.35;

const personTextures = new Map<string, THREE.Texture>();
function personTexture(key: string, make: () => HTMLCanvasElement) {
  let t = personTextures.get(key);
  if (!t) personTextures.set(key, (t = pixelTexture(make())));
  return t;
}

const heads = new Map<string, HTMLImageElement>();
function head(species: string, shiny: boolean): HTMLImageElement {
  const key = `${species}:${shiny}`;
  let img = heads.get(key);
  if (!img) {
    img = new Image();
    const plain = speciesById(species).sprite ?? '';
    img.src = asset((shiny ? shinySprite(plain) : plain).replace(/\/([^/]+)$/, '/mini/$1'));
    heads.set(key, img);
  }
  return img;
}

/** The follower: a body in its colour with its photo head on top, as one picture. */
function followerCanvas(colour: string, dir: Dir, frame: number, img: HTMLImageElement) {
  const c = document.createElement('canvas');
  c.width = 80;
  c.height = 106;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  g.drawImage(paintPerson(monStyle(colour), dir, frame, true), 8, 10, PERSON_W, PERSON_H);
  g.drawImage(img, 0, 0, 80, 80);
  return c;
}

/** The ! over a trainer who has spotted you. */
function exclaimCanvas() {
  const c = document.createElement('canvas');
  c.width = 44;
  c.height = 52;
  const g = c.getContext('2d')!;
  g.fillStyle = INK;
  g.fillRect(0, 0, 44, 52);
  g.fillStyle = LIGHT;
  g.fillRect(2, 2, 40, 48);
  g.fillStyle = '#e03c3a';
  g.fillRect(18, 10, 8, 20);
  g.fillRect(18, 34, 8, 8);
  return c;
}

/** A soft glow, for light spilling from doors at night. */
function glowCanvas() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  r.addColorStop(0, 'rgb(255 190 90 / 1)');
  r.addColorStop(1, 'rgb(255 190 90 / 0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  return c;
}

/** The slight lean of a tree's crown in the wind, as in 2D. */
function sway(now: number, x: number, y: number): number {
  const t = now / 1000;
  const gust = Math.max(0, Math.sin(t / 3.1 + x * 0.05)) ** 4;
  return (Math.sin(t * 1.3 + x * 0.9 + y * 0.6) * 0.018 + gust * 0.03) * (1 + ((x + y) % 3) * 0.2);
}

const tintOf = (tint: string | null) => {
  const m = tint?.match(/rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/);
  return m ? { colour: new THREE.Color(`rgb(${m[1]},${m[2]},${m[3]})`), k: Number(m[4]) } : null;
};

export default function Overworld3D(props: Props) {
  const box = useRef<HTMLDivElement>(null);
  const live = useRef(props);
  useEffect(() => {
    live.current = props;
  });

  const walk = useRef(startWalk(props.pos));
  const trail = useRef<Trail>({ at: { x: props.pos.x, y: props.pos.y }, from: null });
  const { x, y, face } = props.pos;
  const mapId = props.map.id;
  useEffect(() => {
    placeWalk(walk.current, trail.current, { x, y, face });
  }, [x, y, face, mapId]);

  useEffect(() => {
    const host = box.current!;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    // Phones have very dense screens; past 2× the extra pixels cost more than they show.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'block h-full w-full';
    host.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 10 / 9, 0.5, 80);
    const hemi = new THREE.HemisphereLight('#dcecff', '#5a6a40', 1.6);
    const sun = new THREE.DirectionalLight('#fff3dc', 2.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -13,
      right: 13,
      top: 13,
      bottom: -13,
      near: 1,
      far: 50,
    });
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.02;
    scene.add(hemi, sun, sun.target);

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const watch = new ResizeObserver(resize);
    watch.observe(host);
    resize();

    // People are pictures standing up in the world, leaning back a little toward the camera.
    const personGeo = new THREE.PlaneGeometry(1, 1.5);
    personGeo.translate(0, 0.75, 0);
    const followerGeo = new THREE.PlaneGeometry(1.25, 1.656);
    followerGeo.translate(0, 0.828, 0);
    const pool: THREE.Mesh[] = [];
    const people = new THREE.Group();
    scene.add(people);
    const blobGeo = new THREE.CircleGeometry(0.32, 16);
    blobGeo.rotateX(-Math.PI / 2);
    const blobMat = new THREE.MeshBasicMaterial({
      color: '#000',
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const blobs: THREE.Mesh[] = [];

    const exclaim = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.74),
      new THREE.MeshBasicMaterial({ map: pixelTexture(exclaimCanvas()) }),
    );
    exclaim.rotation.x = LEAN;
    scene.add(exclaim);

    // Blue Ghosts: little blue cans that turn and bob.
    const canGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.34, 12);
    const canMat = [
      new THREE.MeshLambertMaterial({ color: '#3a8ae8' }),
      new THREE.MeshLambertMaterial({ color: '#c8ccd4' }),
      new THREE.MeshLambertMaterial({ color: '#c8ccd4' }),
    ];
    const cans = new THREE.Group();
    scene.add(cans);
    let cansKey = '';

    const glowTex = pixelTexture(glowCanvas());
    glowTex.magFilter = THREE.LinearFilter;
    const glowMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowGeo = new THREE.PlaneGeometry(3.2, 3.2);
    glowGeo.rotateX(-Math.PI / 2);
    const glows = new THREE.Group();
    scene.add(glows);

    let level: Level | null = null;
    let levelOf: GameMap | null = null;
    const target = new THREE.Vector3();
    let placed = false;
    const sway4 = new THREE.Matrix4();
    const shear = new THREE.Matrix4();

    const loadLevel = (map: GameMap) => {
      if (level) {
        scene.remove(level.group);
        level.dispose();
      }
      level = buildLevel(map, gymRoofsOf(map));
      levelOf = map;
      scene.add(level.group);
      glows.clear();
      for (const d of map.inside ? [] : level.doors) {
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(d.x + 0.5, 0.02, d.y + 1.4);
        glows.add(glow);
      }
      if (map.inside) {
        scene.background = new THREE.Color('#14161c');
        scene.fog = null;
      } else {
        scene.fog = new THREE.Fog('#a8d0e8', 20, 38);
      }
      placed = false;
    };

    const adapt = quality(renderer, sun);
    let raf = 0;
    const tick = (now: number) => {
      if (adapt(now)) resize();
      const p = live.current;
      const w = walk.current;
      tickWalk(w, trail.current, p, now);
      if (p.map !== levelOf) loadLevel(p.map);
      const lvl = level!;
      const map = p.map;
      const rows = map.rows.length;
      const cols = map.rows[0].length;
      lvl.animate(now);

      const t = stepT(w, now);
      const lerp = (a: number, b: number) => a + (b - a) * t;
      const px = (w.from ? lerp(w.from.x, w.x) : w.x) + 0.5;
      const pz = (w.from ? lerp(w.from.y, w.y) : w.y) + 0.5;

      // The camera follows you, but stops short of the map's edges like the 2D one.
      const clamp = (v: number, size: number, half: number) =>
        size <= half * 2 ? size / 2 : Math.max(half, Math.min(size - half, v));
      const want = new THREE.Vector3(
        clamp(px, cols, map.inside ? 5 : 4.5),
        0,
        map.inside ? rows / 2 + 0.3 : clamp(pz, rows, 3.2),
      );
      if (!placed) target.copy(want);
      else target.lerp(want, 0.18);
      placed = true;
      camera.position.set(
        target.x,
        target.y + DISTANCE * Math.sin(PITCH),
        target.z + DISTANCE * Math.cos(PITCH),
      );
      camera.lookAt(target);
      sun.position.set(target.x - 7, 14, target.z + 4);
      sun.target.position.copy(target);

      // Light by the clock: a pink dawn, a golden evening and a blue night.
      const light = daylight(new Date());
      const tint = tintOf(light.tint);
      const sky = new THREE.Color(map.inside ? '#14161c' : '#a8d0e8');
      sun.color.set('#fff3dc');
      hemi.color.set('#dcecff');
      if (tint) {
        sun.color.lerp(tint.colour, tint.k * 2.2);
        hemi.color.lerp(tint.colour, tint.k * 1.8);
        sky.lerp(tint.colour, tint.k * 2);
      }
      sun.intensity = map.inside ? 1.4 : 2.4 * (1 - light.night * 0.8);
      hemi.intensity = map.inside ? 2 : 1.6 * (1 - light.night * 0.55);
      if (!map.inside) {
        scene.background = sky;
        (scene.fog as THREE.Fog).color.copy(sky);
      }
      glowMat.opacity = light.night * 0.8;
      glows.visible = light.night > 0;

      // Trees lean in the wind.
      for (const crown of lvl.trees) {
        crown.base.forEach((base, i) => {
          const [tx, ty] = crown.at[i];
          shear.set(1, sway(now, tx, ty) * 1.2, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
          // Lean about the ground under the tree, not the crown's own middle.
          sway4.makeTranslation(tx + 0.5, 0, ty + 0.5);
          sway4.multiply(shear);
          sway4.multiply(new THREE.Matrix4().makeTranslation(-(tx + 0.5), 0, -(ty + 0.5)));
          crown.mesh.setMatrixAt(i, sway4.multiply(base));
        });
        crown.mesh.instanceMatrix.needsUpdate = true;
      }

      // Everyone on the map, then you, from the pool of standing pictures.
      let used = 0;
      const idle = (phase: number) => (Math.floor(now / 700 + phase) % 2 ? 0.03 : 0);
      const stand = (
        texture: THREE.Texture,
        geo: THREE.BufferGeometry,
        wx: number,
        wz: number,
        bob: number,
      ) => {
        let mesh = pool[used];
        if (!mesh) {
          mesh = new THREE.Mesh(
            geo,
            new THREE.MeshLambertMaterial({ alphaTest: 0.5, side: THREE.DoubleSide }),
          );
          mesh.rotation.x = LEAN;
          mesh.castShadow = true;
          pool.push(mesh);
          people.add(mesh);
          const blob = new THREE.Mesh(blobGeo, blobMat);
          blobs.push(blob);
          people.add(blob);
        }
        mesh.geometry = geo;
        const mat = mesh.material as THREE.MeshLambertMaterial;
        if (mat.map !== texture) {
          mat.map = texture;
          mat.needsUpdate = true;
        }
        mesh.position.set(wx, bob, wz);
        mesh.visible = true;
        blobs[used].position.set(wx, 0.015, wz);
        blobs[used].visible = true;
        used++;
      };
      const person = (
        key: string,
        style: Style,
        dir: Dir,
        frame: number,
        wx: number,
        wz: number,
        bob: number,
      ) =>
        stand(
          personTexture(`${key}:${dir}:${frame}`, () => paintPerson(style, dir, frame)),
          personGeo,
          wx,
          wz,
          bob,
        );

      exclaim.visible = false;
      for (const n of npcsOf(map)) {
        if (!isPresent(n.item, p.flags)) continue;
        person(
          n.item.look,
          STYLES[n.item.look],
          p.faces[n.index] ?? n.item.face,
          0,
          n.x + 0.5,
          n.y + 0.5,
          idle(n.index * 0.37),
        );
        if (p.exclaim === n.index) {
          exclaim.position.set(n.x + 0.5, 2.1, n.y + 0.2);
          exclaim.visible = true;
        }
      }

      const tr = trail.current;
      if (p.follower && (tr.at.x !== w.x || tr.at.y !== w.y)) {
        const moving = !!(tr.from && w.from);
        const fx = (moving ? lerp(tr.from!.x, tr.at.x) : tr.at.x) + 0.5;
        const fz = (moving ? lerp(tr.from!.y, tr.at.y) : tr.at.y) + 0.5;
        const toward = moving
          ? { x: tr.at.x - tr.from!.x, y: tr.at.y - tr.from!.y }
          : { x: w.x - tr.at.x, y: w.y - tr.at.y };
        const fdir: Dir =
          toward.x < 0 ? 'left' : toward.x > 0 ? 'right' : toward.y < 0 ? 'up' : 'down';
        const img = head(p.follower, !!p.followerShiny);
        const colour = p.followerShiny ? '#f8b830' : speciesById(p.follower).colour;
        const frame = moving ? stepPose(t, w.frame) : 0;
        if (img.complete && img.naturalWidth) {
          stand(
            personTexture(`mon:${p.follower}:${!!p.followerShiny}:${fdir}:${frame}`, () =>
              followerCanvas(colour, fdir, frame, img),
            ),
            followerGeo,
            fx,
            fz,
            moving ? Math.sin(t * Math.PI) * 0.1 : idle(0.5),
          );
        }
      }

      const stepFrame = w.from ? stepPose(t, w.frame) : 0;
      person('player', STYLES.player, w.face, stepFrame, px, pz, w.from ? 0 : idle(0));
      for (let i = used; i < pool.length; i++) pool[i].visible = blobs[i].visible = false;

      // Blue Ghosts, rebuilt when one is picked up.
      const key = p.ghosts.map((g) => `${g.x},${g.y}`).join(';') + map.id;
      if (key !== cansKey) {
        cansKey = key;
        cans.clear();
        for (const g of p.ghosts) {
          const can = new THREE.Mesh(canGeo, canMat);
          can.position.set(g.x + 0.5, 0.25, g.y + 0.5);
          can.castShadow = true;
          cans.add(can);
        }
      }
      cans.children.forEach((c, i) => {
        c.rotation.y = now / 600 + i;
        c.position.y = 0.25 + Math.sin(now / 400 + i) * 0.05;
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      watch.disconnect();
      level?.dispose();
      [personGeo, followerGeo, blobGeo, canGeo, glowGeo].forEach((g) => g.dispose());
      pool.forEach((m) => (m.material as THREE.Material).dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={box}
      className="relative h-full w-full bg-ink"
      data-testid="overworld"
      data-view="3d"
      data-x={props.pos.x}
      data-y={props.pos.y}
      role="img"
      aria-label={`${props.map.name}. Use the arrow keys or the D-pad to walk.`}
    >
      {/* A soft vignette, as in 2D. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(10_20_40/0.3))]" />
    </div>
  );
}
