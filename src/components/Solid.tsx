'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { asset } from '@/lib/asset';
import { pixelTexture } from './story/scene3d';

/**
 * A Ranemon in the 3D look's battles as a solid figure instead of a flat cut-out: its own sprite,
 * blown up into a rounded body like a cushion, thickest where the art is widest, with a dark rim
 * where the 2D outline would be. It's lit like the stage behind it, turns a little toward the foe
 * and breathes, and keeps the sprite's own pixels, so it's the same friend in either look.
 */

/** How far in from the edge (in sprite pixels) the body is fully rounded, and how deep it gets. */
const ROUND = 22;
/** The back is a little flatter than the front, so the figure doesn't look like a ball. */
const BACK = 0.7;
const RIM = [40, 40, 48];

interface Relief {
  w: number;
  h: number;
  /** Each pixel's depth in sprite pixels; 0 outside and on the rim. */
  depth: Float32Array;
  /** Pixels in the figure or on its rim, which get vertices. */
  solid: Uint8Array;
}

/** The depth of every pixel of a sprite from how far it is from the edge. */
function relief(alpha: Uint8ClampedArray, w: number, h: number): Relief {
  const inside = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) inside[i] = alpha[i * 4 + 3] > 127 ? 1 : 0;
  // Distance to the nearest outside pixel, by the usual two-pass chamfer (3 straight, 4 diagonal).
  const far = 1e9;
  const d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = inside[i] ? far : 0;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!inside[i]) continue;
      d[i] = Math.min(
        d[i],
        at(x - 1, y) + 3,
        at(x, y - 1) + 3,
        at(x - 1, y - 1) + 4,
        at(x + 1, y - 1) + 4,
      );
    }
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (!inside[i]) continue;
      d[i] = Math.min(
        d[i],
        at(x + 1, y) + 3,
        at(x, y + 1) + 3,
        at(x + 1, y + 1) + 4,
        at(x - 1, y + 1) + 4,
      );
    }
  // A quarter circle in from the edge, then flat: rounded like a cushion.
  let depth = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = Math.min(Math.max(d[i] / 3 - 1, 0), ROUND);
    depth[i] = Math.sqrt(2 * ROUND * r - r * r);
  }
  // Smoothed, so the chamfer's facets don't show in the light.
  for (let pass = 0; pass < 3; pass++) {
    const next = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!inside[i]) continue;
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const xx = Math.min(Math.max(x + dx, 0), w - 1);
            const yy = Math.min(Math.max(y + dy, 0), h - 1);
            sum += depth[yy * w + xx];
          }
        next[i] = sum / 9;
      }
    depth = next;
  }
  const solid = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h && inside[yy * w + xx]) solid[y * w + x] = 1;
        }
  return { w, h, depth, solid };
}

/** The front and back of the figure, two units across, standing on y = 0. Faces point outward. */
function body({ w, h, depth, solid }: Relief): THREE.BufferGeometry {
  const unit = 2 / w;
  const pos: number[] = [];
  const uv: number[] = [];
  const faces: number[] = [];
  const rear: number[] = [];
  const front = new Int32Array(w * h).fill(-1);
  const back = new Int32Array(w * h).fill(-1);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!solid[i]) continue;
      const px = (x + 0.5 - w / 2) * unit;
      const py = (h - y - 0.5) * unit;
      const u = (x + 0.5) / w;
      const v = 1 - (y + 0.5) / h;
      front[i] = pos.length / 3;
      pos.push(px, py, depth[i] * unit);
      uv.push(u, v);
      // The rim is shared, so the two halves close up into one solid.
      if (depth[i] === 0) back[i] = front[i];
      else {
        back[i] = pos.length / 3;
        pos.push(px, py, -depth[i] * unit * BACK);
        uv.push(u, v);
      }
    }
  for (let y = 0; y < h - 1; y++)
    for (let x = 0; x < w - 1; x++) {
      const a = y * w + x;
      const b = a + 1;
      const c = a + w;
      const e = c + 1;
      if (front[a] < 0 || front[b] < 0 || front[c] < 0 || front[e] < 0) continue;
      faces.push(front[a], front[c], front[b], front[b], front[c], front[e]);
      rear.push(back[a], back[b], back[c], back[b], back[e], back[c]);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex([...faces, ...rear]);
  // The front wears the first material and the back the second.
  geo.addGroup(0, faces.length, 0);
  geo.addGroup(faces.length, rear.length, 1);
  geo.computeVertexNormals();
  return geo;
}

/** The sprite with its see-through pixels round the figure filled with the rim colour. */
function skin(img: HTMLImageElement, r: Relief) {
  const c = document.createElement('canvas');
  c.width = r.w;
  c.height = r.h;
  const g = c.getContext('2d')!;
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, r.w, r.h);
  for (let i = 0; i < r.w * r.h; i++) {
    if (data.data[i * 4 + 3] > 127) continue;
    data.data.set([...RIM, 255], i * 4);
  }
  g.putImageData(data, 0, 0);
  return pixelTexture(c);
}

export default function Solid({
  sprite,
  name,
  back,
}: {
  sprite: string;
  name: string;
  back: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = box.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = 'h-full w-full';
    host.append(renderer.domElement);

    const scene = new THREE.Scene();
    // The same light as the stage: sky from above, the sun from the front left.
    scene.add(new THREE.HemisphereLight('#e4f0ff', '#5a5040', 2.2));
    const sun = new THREE.DirectionalLight('#fff2d8', 2.2);
    sun.position.set(-3, 4, 5);
    scene.add(sun);

    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50);
    const figure = new THREE.Group();
    scene.add(figure);
    // Turned toward the foe: yours up and to the right, theirs down and to the left.
    const facing = back ? 0.5 : -0.35;

    let geo: THREE.BufferGeometry | null = null;
    let tex: THREE.Texture | null = null;
    let front: THREE.Material | null = null;
    let rear: THREE.Material | null = null;
    let dead = false;
    const img = new Image();
    img.onload = () => {
      if (dead) return;
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d')!;
      g.drawImage(img, 0, 0);
      const r = relief(g.getImageData(0, 0, img.width, img.height).data, img.width, img.height);
      geo = body(r);
      tex = skin(img, r);
      front = new THREE.MeshLambertMaterial({ map: tex });
      // The back is the same art in shadow, only seen at an angle.
      rear = new THREE.MeshLambertMaterial({ map: tex, color: '#707070' });
      figure.add(new THREE.Mesh(geo, [front, rear]));
    };
    img.src = asset(sprite);

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Fit the two-unit square the sprite fills, standing on the bottom like the 2D sprite.
      const fit = Math.max(1, 1 / camera.aspect);
      const dist = (1.02 * fit) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      camera.position.set(0, 1, dist);
      camera.lookAt(0, 1, 0);
      camera.updateProjectionMatrix();
    };
    const watch = new ResizeObserver(resize);
    watch.observe(host);
    resize();

    let raf = 0;
    const tick = (t: number) => {
      // A slow breath and a little sway, like the 2D sprites' breathing.
      figure.rotation.y = facing + Math.sin(t / 1300 + (back ? 2 : 0)) * 0.07;
      figure.scale.set(1, 1 + Math.max(0, Math.sin(t / 700 + (back ? 2 : 0))) * 0.02, 1);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      watch.disconnect();
      geo?.dispose();
      tex?.dispose();
      front?.dispose();
      rear?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [sprite, back]);

  return <div ref={box} role="img" aria-label={name} className="h-full w-full" data-solid />;
}
