/*
 * Ranemon's service worker: keeps the whole game on the phone so it plays with no connection.
 * `precache.mjs` writes it into the static export with the build's file list in front of it:
 *
 *   BASE   the folder the game is served from, such as '/ranemon'
 *   BUILD  a hash of every file, naming this build's cache
 *   FILES  each file's path under BASE and a hash of its contents
 *
 * It comes in two steps, so a slow or patchy connection can't leave the phone with nothing:
 *
 *   1. Install: the game itself (pages, code, page data, font, icons, about 4 MB). Once that is
 *      in, the worker takes over and the game opens offline.
 *   2. Fill: the pictures (about 7 MB), in the background, a few at a time, each tried again if
 *      it fails. Any page that opens asks the worker to carry on, so a fill cut short by a lost
 *      connection or a closed app picks up where it stopped. Pictures the game shows before then
 *      are kept as they load.
 *
 * Pages ask how far it has got (`status`), and the title screen shows it until the whole game is
 * on the phone (`src/lib/offline.ts`). Each build's files go into a cache of their own, so a phone
 * never runs half of one build and half of the next; files that haven't changed are copied over
 * from the last build's cache rather than downloaded again. A new build waits until the player
 * taps to update on the title screen. Calls to the save server go to another site and are never
 * touched.
 */
/* global BASE, BUILD, FILES */

const PREFIX = 'ranemon-';
const CACHE = `${PREFIX}${BUILD}`;
/** Where each cache keeps the hashes of its files, to tell what changed. */
const LIST = `${BASE}/__precache.json`;
/** The pictures, which can follow once the game itself is in. */
const isPicture = (path) => path.startsWith('/sprites/');
const PATHS = Object.keys(FILES);

const urlOf = (path) => `${BASE}${path}`;
/** A file's path as a cached request spells it, escapes and all. */
const keyOf = (path) => new URL(urlOf(path), self.location.origin).pathname;
/** The paths of the files already in a cache. */
const held = async (cache) => new Set((await cache.keys()).map((r) => new URL(r.url).pathname));

/** A file from the network, tried up to three times. */
async function download(path) {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(urlOf(path), { cache: 'no-cache' });
      if (res.ok) return res;
      if (res.status === 404 || i === 2) throw new Error(`${path}: ${res.status}`);
    } catch (e) {
      if (i === 2) throw e;
    }
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }
}

/** Runs `job` on each item, a few at a time. */
async function each(items, job, at = 6) {
  let next = 0;
  await Promise.all(
    Array.from({ length: at }, async () => {
      while (next < items.length) await job(items[next++]);
    }),
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const old = await previous();
      // Everything unchanged since the last build comes across from its cache, pictures too.
      if (old)
        await each(PATHS, async (path) => {
          if (old.files[path] !== FILES[path]) return;
          const kept = await old.cache.match(urlOf(path));
          if (kept) await cache.put(urlOf(path), kept);
        });
      const have = await held(cache);
      // The game itself must all be here before the worker takes over.
      await each(
        PATHS.filter((p) => !isPicture(p) && !have.has(keyOf(p))),
        async (path) => cache.put(urlOf(path), await download(path)),
      );
      await cache.put(LIST, new Response(JSON.stringify(FILES)));
    })(),
  );
});

/** The newest earlier build's cache and its list of files, if there is one. */
async function previous() {
  for (const name of (await caches.keys()).reverse()) {
    if (!name.startsWith(PREFIX) || name === CACHE) continue;
    const cache = await caches.open(name);
    const list = await cache.match(LIST);
    if (list) return { cache, files: await list.json() };
  }
  return null;
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys())
        if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
      await self.clients.claim();
    })(),
  );
  // The pictures follow; a page that opens later carries on if this is cut short.
  void fill();
});

/** How many of the build's files are on the phone. */
async function status() {
  const have = await held(await caches.open(CACHE));
  return {
    type: 'offline',
    done: PATHS.filter((p) => have.has(keyOf(p))).length,
    total: PATHS.length,
  };
}

async function tell(message) {
  for (const client of await self.clients.matchAll()) client.postMessage(message);
}

let filling = null;
/** Downloads the pictures still missing, telling the pages how it's going. */
function fill() {
  filling ??= (async () => {
    try {
      const cache = await caches.open(CACHE);
      const have = await held(cache);
      const todo = PATHS.filter((p) => !have.has(keyOf(p)));
      let n = 0;
      await each(todo, async (path) => {
        try {
          await cache.put(urlOf(path), await download(path));
        } catch {
          // Offline, or gone: the next page that opens tries again.
        }
        if (++n % 20 === 0) await tell(await status());
      });
    } finally {
      filling = null;
      await tell(await status());
    }
  })();
  return filling;
}

self.addEventListener('message', (event) => {
  if (event.data === 'update') self.skipWaiting();
  // Pages send this to the worker in charge, never to one waiting to take over.
  if (event.data === 'fill') {
    event.waitUntil(
      (async () => {
        event.source?.postMessage(await status());
        await fill();
      })(),
    );
  }
});

/** The file a page's address is served from: `/story/` and `/story` are `/story/index.html`. */
function fileFor(pathname) {
  if (!pathname.startsWith(BASE)) return null;
  let path = decodeURIComponent(pathname.slice(BASE.length)) || '/';
  if (FILES[path] !== undefined) return path;
  if (!path.endsWith('/')) path += '/';
  path += 'index.html';
  return FILES[path] !== undefined ? path : null;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const path = fileFor(url.pathname);
  if (path === null) {
    // Not part of the game (or not yet): the network, or the 404 page with no connection.
    if (req.mode === 'navigate')
      event.respondWith(
        fetch(req).catch(() => caches.match(urlOf('/404.html'), { cacheName: CACHE })),
      );
    return;
  }
  event.respondWith(
    (async () => {
      // The query string (Next.js's `_rsc`, a room code in a link) doesn't change the file.
      const hit = await caches.match(urlOf(path), { cacheName: CACHE });
      if (hit) return hit;
      // Not in yet (a picture the fill hasn't reached): from the network, and kept.
      const res = await fetch(urlOf(path));
      if (res.ok) {
        const copy = res.clone();
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put(urlOf(path), copy)));
      }
      return res;
    })(),
  );
});
