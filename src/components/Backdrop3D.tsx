'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { buildTrees, pixelTexture, quality } from './story/scene3d';
import type { Scene } from './BattleScreen';

/**
 * The battlefield in 3D, behind the same sprites, info boxes and effects as the 2D one: a stage
 * built for each scene (the fields, Dublin's streets, a gym, Trinity at night) under a fixed
 * camera, with the two platforms placed exactly under the sprites' slots. The sky and the clouds
 * move; the camera only breathes, so the sprites stay on their platforms.
 */

/** Where each sprite stands on the field, as fractions of its width and height (see globals.css). */
const FOE = { x: 0.74, y: 0.4, w: 0.34 };
const YOU = { x: 0.23, y: 0.92, w: 0.46 };

interface Look {
  sky: [string, string];
  ground: string;
  platform: string;
  rim: string;
  fog: string;
  sun: number;
  hemi: number;
}

const LOOKS: Record<Scene, Look> = {
  field: {
    sky: ['#4aa0f0', '#cfeaff'],
    ground: '#6cbc4a',
    platform: '#8ad05a',
    rim: '#a8844e',
    fog: '#cfe6f6',
    sun: 2.6,
    hemi: 1.4,
  },
  city: {
    sky: ['#5a9ee0', '#e0eef8'],
    ground: '#9a9a9e',
    platform: '#c4c0b8',
    rim: '#7a766e',
    fog: '#d8e2ea',
    sun: 2.4,
    hemi: 1.4,
  },
  gym: {
    sky: ['#1c1a28', '#3a3448'],
    ground: '#c89a5c',
    platform: '#e8e0d0',
    rim: '#c83838',
    fog: '#2a2634',
    sun: 1.8,
    hemi: 1.6,
  },
  night: {
    sky: ['#070a22', '#26306a'],
    ground: '#3a6e44',
    platform: '#5a8a5a',
    rim: '#8a8060',
    fog: '#1a2048',
    sun: 1.3,
    hemi: 1.1,
  },
};

function gradient(top: string, bottom: string) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 128;
  const g = c.getContext('2d')!;
  const l = g.createLinearGradient(0, 0, 0, 128);
  l.addColorStop(0, top);
  l.addColorStop(1, bottom);
  g.fillStyle = l;
  g.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A small pixel texture made by a painter, for floors and walls. */
function painted(w: number, h: number, paint: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(c.getContext('2d')!);
  const t = pixelTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/** A Georgian front: brick with rows of white sash windows and a coloured door. */
function georgian(brick: string, door: string, lit = 0) {
  return painted(64, 96, (g) => {
    const r = rng(brick.length * 7 + door.charCodeAt(1));
    g.fillStyle = brick;
    g.fillRect(0, 0, 64, 96);
    for (let y = 0; y < 96; y += 4)
      for (let x = (y / 4) % 2 ? 0 : 4; x < 64; x += 8) {
        g.fillStyle = 'rgb(0 0 0 / 0.12)';
        g.fillRect(x, y + 3, 8, 1);
        g.fillRect(x + 7, y, 1, 4);
      }
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++) {
        const x = 6 + col * 20;
        const y = 8 + row * 24;
        g.fillStyle = '#f4f0e8';
        g.fillRect(x - 1, y - 1, 12, 18);
        g.fillStyle = r() < lit ? '#ffd27a' : '#3a5a7a';
        g.fillRect(x, y, 10, 16);
        g.fillStyle = '#f4f0e8';
        g.fillRect(x + 4.5, y, 1, 16);
        g.fillRect(x, y + 7.5, 10, 1);
      }
    g.fillStyle = '#f4f0e8';
    g.fillRect(22, 74, 20, 22);
    g.fillStyle = door;
    g.fillRect(25, 78, 14, 18);
    g.fillStyle = '#ffe9a0';
    g.fillRect(25, 74, 14, 3);
  });
}

export default function Backdrop3D({ scene: kind }: { scene: Scene }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = box.current!;
    const look = LOOKS[kind];
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'absolute inset-0 h-full w-full';
    host.append(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = gradient(...look.sky);
    scene.fog = new THREE.Fog(look.fog, 18, 60);
    const camera = new THREE.PerspectiveCamera(44, 3 / 2, 0.1, 140);
    const camAt = new THREE.Vector3(0, 3.5, 9);
    const lookAt = new THREE.Vector3(0, 0, -3.2);
    camera.position.copy(camAt);
    camera.lookAt(lookAt);
    camera.updateMatrixWorld();

    const hemi = new THREE.HemisphereLight('#e4f0ff', '#5a5040', look.hemi);
    const sun = new THREE.DirectionalLight(kind === 'night' ? '#9ab0ff' : '#fff2d8', look.sun);
    sun.position.set(-6, 10, 6);
    sun.target.position.set(0, 0, -2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, far: 40 });
    sun.shadow.bias = -0.0008;
    scene.add(hemi, sun, sun.target);

    const disposables: { dispose: () => void }[] = [];
    const keep = <T extends { dispose: () => void }>(o: T) => (disposables.push(o), o);
    const lambert = (o: THREE.MeshLambertMaterialParameters) =>
      keep(new THREE.MeshLambertMaterial(o));
    const mesh = (
      geo: THREE.BufferGeometry,
      mat: THREE.Material | THREE.Material[],
      shadow = true,
    ) => {
      const m = new THREE.Mesh(keep(geo), mat);
      m.castShadow = shadow;
      m.receiveShadow = true;
      scene.add(m);
      return m;
    };

    // The ground, with a texture so it reads as grass, cobbles or polished boards.
    const floorTex = painted(32, 32, (g) => {
      const r = rng(kind.length * 31);
      g.fillStyle = look.ground;
      g.fillRect(0, 0, 32, 32);
      if (kind === 'gym') {
        for (let y = 0; y < 32; y += 8) {
          g.fillStyle = 'rgb(0 0 0 / 0.14)';
          g.fillRect(0, y + 7, 32, 1);
          g.fillRect(((y / 8) % 2) * 16 + 4, y, 1, 8);
        }
      } else if (kind === 'city') {
        for (let y = 0; y < 32; y += 6)
          for (let x = (y / 6) % 2 ? 0 : 5; x < 32; x += 10) {
            g.fillStyle = 'rgb(0 0 0 / 0.16)';
            g.fillRect(x, y + 5, 9, 1);
            g.fillRect(x + 9, y, 1, 6);
          }
      } else {
        for (let i = 0; i < 70; i++) {
          g.fillStyle = r() < 0.5 ? 'rgb(0 0 0 / 0.1)' : 'rgb(255 255 255 / 0.12)';
          g.fillRect((r() * 32) | 0, (r() * 32) | 0, 1, 2);
        }
      }
    });
    keep(floorTex);
    floorTex.repeat.set(30, 30);
    const ground = mesh(new THREE.PlaneGeometry(80, 80), lambert({ map: floorTex }), false);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -25;

    // The two platforms, placed under the sprites by casting from the screen onto the ground.
    const onGround = (sx: number, sy: number) => {
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(sx * 2 - 1, 1 - sy * 2), camera);
      const hit = new THREE.Vector3();
      ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit);
      return hit;
    };
    const top = lambert({ color: look.platform });
    const rim = lambert({ color: look.rim });
    for (const p of [FOE, YOU]) {
      const at = onGround(p.x, p.y);
      // As wide on screen as the 2D platform.
      const r = onGround(p.x + p.w / 2, p.y).distanceTo(onGround(p.x - p.w / 2, p.y)) / 2;
      const disc = mesh(new THREE.CylinderGeometry(r, r * 1.04, r * 0.1, 40), [rim, top, rim]);
      disc.position.set(at.x, r * 0.05, at.z);
      const ring = mesh(new THREE.TorusGeometry(r * 0.8, r * 0.02, 6, 40), rim, false);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(at.x, r * 0.105, at.z);
    }

    const r = rng(kind.charCodeAt(0) * 97);
    const moving: ((t: number) => void)[] = [];

    if (kind === 'field' || kind === 'night') {
      // Rolling hills, a wood behind the field, and (by day) clouds drifting past.
      const hillMat = lambert({
        color: kind === 'night' ? '#1e3a2a' : '#5aa848',
        flatShading: true,
      });
      for (let i = 0; i < 7; i++) {
        const hill = mesh(new THREE.IcosahedronGeometry(1, 1), hillMat, false);
        hill.scale.set(7 + r() * 6, 2 + r() * 2.5, 4);
        hill.position.set(-28 + i * 9 + r() * 3, -0.4, -44 - r() * 6);
      }
      const trees: [number, number, number][] = [];
      for (let i = 0; i < 46; i++) {
        // Placed in the forest's own scale, which is 1.6 times the field's.
        const x = (-30 + r() * 60) / 1.6;
        const z = (-20 - r() * 10) / 1.6;
        trees.push([x, z, (r() * 4294967296) >>> 0]);
      }
      const forest = keep(buildTrees(trees));
      for (const m of forest.meshes) {
        m.scale.setScalar(1.6);
        scene.add(m);
      }
    }
    if (kind === 'field') {
      const cloudMat = lambert({ color: '#ffffff', flatShading: true, emissive: '#8090a0' });
      for (let i = 0; i < 6; i++) {
        const cloud = new THREE.Group();
        for (let k = 0; k < 4; k++) {
          const puff = new THREE.Mesh(keep(new THREE.IcosahedronGeometry(1 + r(), 1)), cloudMat);
          puff.position.set(k * 1.4 - 2, r() * 0.6, r() * 0.8);
          cloud.add(puff);
        }
        cloud.scale.set(1.4, 0.8, 1);
        const y = 9 + r() * 6;
        const z = -56 - r() * 10;
        const x0 = r() * 80;
        cloud.position.set(0, y, z);
        moving.push((t) => {
          cloud.position.x = ((x0 + t * 0.0012) % 80) - 40;
        });
        scene.add(cloud);
      }
    }
    if (kind === 'night') {
      // Stars, twinkling, over Trinity's Front Square: the façade, lit windows and the Campanile.
      const stars = new THREE.BufferGeometry();
      const pts: number[] = [];
      for (let i = 0; i < 400; i++) pts.push(-60 + r() * 120, 6 + r() * 30, -50 - r() * 5);
      stars.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      const starMat = keep(new THREE.PointsMaterial({ color: '#ffffff', size: 0.18, fog: false }));
      scene.add(new THREE.Points(keep(stars), starMat));
      moving.push((t) => {
        starMat.opacity = 0.75 + 0.25 * Math.sin(t / 700);
        starMat.transparent = true;
      });
      const front = keep(georgian('#c8c0b0', '#2a3a5a', 0.6));
      front.repeat.set(8, 1);
      const facade = mesh(new THREE.BoxGeometry(48, 7, 2), [
        lambert({ color: '#a8a090' }),
        lambert({ color: '#a8a090' }),
        lambert({ color: '#8a8478' }),
        lambert({ color: '#8a8478' }),
        lambert({ map: front, emissive: '#ffcc66', emissiveIntensity: 0.25, emissiveMap: front }),
        lambert({ color: '#a8a090' }),
      ]);
      facade.position.set(0, 3.5, -36);
      const stone = lambert({ color: '#c8c4bc' });
      const cx = -6;
      const cz = -27;
      mesh(new THREE.BoxGeometry(2.2, 0.8, 2.2), stone).position.set(cx, 0.4, cz);
      for (const [dx, dz] of [
        [-0.8, -0.8],
        [0.8, -0.8],
        [-0.8, 0.8],
        [0.8, 0.8],
      ])
        mesh(new THREE.BoxGeometry(0.35, 3, 0.35), stone).position.set(cx + dx, 2.3, cz + dz);
      mesh(new THREE.BoxGeometry(2.3, 0.8, 2.3), stone).position.set(cx, 4.2, cz);
      mesh(
        new THREE.SphereGeometry(0.85, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        lambert({ color: '#5a8a7a' }),
      ).position.set(cx, 4.6, cz);
      const lamp = new THREE.PointLight('#ffc070', 30, 14);
      lamp.position.set(cx, 3, cz + 3);
      scene.add(lamp);
    }
    if (kind === 'city') {
      // A terrace of Georgian Dublin across the street, every door its own colour.
      const doors = ['#c83838', '#2a5ab8', '#2a8a4a', '#e0b030', '#7a3a9a', '#1a1a1a'];
      const bricks = ['#a8543a', '#b8664a', '#9a4a34', '#c47a54'];
      for (let i = 0; i < 9; i++) {
        const tex = keep(georgian(bricks[i % bricks.length], doors[i % doors.length]));
        const h = 7 + (i % 3) * 0.6;
        const house = mesh(new THREE.BoxGeometry(5, h, 4), [
          lambert({ color: bricks[i % bricks.length] }),
          lambert({ color: bricks[i % bricks.length] }),
          lambert({ color: '#5a5a62' }),
          lambert({ color: '#5a5a62' }),
          lambert({ map: tex }),
          lambert({ color: bricks[i % bricks.length] }),
        ]);
        house.position.set(-22 + i * 5, h / 2, -26);
      }
      const pavement = mesh(
        new THREE.BoxGeometry(60, 0.2, 3),
        lambert({ color: '#c0bcb4' }),
        false,
      );
      pavement.position.set(0, 0.1, -22.5);
      const iron = lambert({ color: '#2a2e36' });
      const glow = lambert({ color: '#fff0c0', emissive: '#ffd070', emissiveIntensity: 0.8 });
      for (let i = 0; i < 5; i++) {
        const x = -16 + i * 8;
        mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 8), iron).position.set(x, 1.6, -21.5);
        mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), glow).position.set(x, 3.3, -21.5);
      }
      const trees: [number, number, number][] = [];
      for (let i = 0; i < 4; i++)
        trees.push([(-18 + i * 12) / 1.8, -20.5 / 1.8, (r() * 4294967296) >>> 0]);
      const forest = keep(buildTrees(trees.map(([x, z, v]) => [x, z, v & ~(7 << 9)])));
      for (const m of forest.meshes) {
        m.scale.setScalar(1.8);
        scene.add(m);
      }
    }
    if (kind === 'gym') {
      // A sports hall: a back wall with banners and the All-Ireland cups, and spotlights.
      const wall = mesh(new THREE.BoxGeometry(60, 12, 1), lambert({ color: '#4a4258' }), false);
      wall.position.set(0, 6, -24);
      const colours = ['#d03838', '#2a5ab8', '#2a8a4a', '#e0b030', '#2a5ab8', '#d03838'];
      colours.forEach((c, i) => {
        const banner = mesh(new THREE.BoxGeometry(2, 4, 0.1), lambert({ color: c }), false);
        banner.position.set(-12.5 + i * 5, 6.5, -23.4);
        const stripe = mesh(
          new THREE.BoxGeometry(2, 0.5, 0.12),
          lambert({ color: '#f4f0e8' }),
          false,
        );
        stripe.position.set(-12.5 + i * 5, 5.4, -23.38);
      });
      const silver = new THREE.MeshStandardMaterial({
        color: '#e8e8f0',
        metalness: 0.9,
        roughness: 0.25,
      });
      keep(silver);
      for (const x of [-4.5, 4.5]) {
        mesh(new THREE.BoxGeometry(1.4, 1.2, 1.4), lambert({ color: '#2a2a34' })).position.set(
          x,
          0.6,
          -21,
        );
        mesh(new THREE.CylinderGeometry(0.55, 0.25, 1.1, 16), silver).position.set(x, 1.75, -21);
      }
      const beams: THREE.Mesh[] = [];
      const beamMat = keep(
        new THREE.MeshBasicMaterial({
          color: '#fff6d0',
          transparent: true,
          opacity: 0.12,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      for (const x of [-7, 0, 7]) {
        const beam = new THREE.Mesh(keep(new THREE.ConeGeometry(2.2, 14, 24, 1, true)), beamMat);
        beam.position.set(x, 7, -12);
        scene.add(beam);
        beams.push(beam);
      }
      moving.push((t) => {
        beams.forEach((b, i) => (b.rotation.z = Math.sin(t / 1800 + i * 2) * 0.25));
      });
    }

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const watch = new ResizeObserver(resize);
    watch.observe(host);
    resize();

    const adapt = quality(renderer, sun);
    let raf = 0;
    const tick = (t: number) => {
      if (adapt(t)) resize();
      moving.forEach((m) => m(t));
      // A slow breath of the camera: alive, but small enough that the sprites stay put.
      camera.position.set(
        camAt.x + Math.sin(t / 2600) * 0.06,
        camAt.y + Math.sin(t / 1900) * 0.03,
        camAt.z,
      );
      camera.lookAt(lookAt);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      watch.disconnect();
      disposables.forEach((d) => d.dispose());
      (scene.background as THREE.Texture).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [kind]);

  return <div ref={box} className="backdrop" aria-hidden data-scene={kind} data-view="3d" />;
}
