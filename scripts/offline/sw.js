/*
 * Ranemon's service worker: keeps the whole game on the phone so it plays with no connection.
 * `precache.mjs` writes it into the static export with the build's file list in front of it:
 *
 *   BASE   the folder the game is served from, such as '/ranemon'
 *   BUILD  a hash of every file, naming this build's cache
 *   FILES  each file's path under BASE and a hash of its contents
 *
 * Each build's files go into a cache of their own, so a phone never runs half of one build and
 * half of the next. Files that haven't changed are copied over from the last build's cache rather
 * than downloaded again. A new build waits until the player taps to update on the title screen
 * (`src/lib/offline.ts`). Calls to the save server go to another site and are never touched.
 */
/* global BASE, BUILD, FILES */

const PREFIX = 'ranemon-';
const CACHE = `${PREFIX}${BUILD}`;
/** Where each cache keeps the hashes of its files, to tell what changed. */
const LIST = `${BASE}/__precache.json`;

const urlOf = (path) => `${BASE}${path}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const old = await previous();
      const todo = Object.entries(FILES);
      // A few at a time, so a slow phone isn't asked for 700 files at once.
      for (let i = 0; i < todo.length; i += 16) {
        await Promise.all(
          todo.slice(i, i + 16).map(async ([path, hash]) => {
            const url = urlOf(path);
            if (old && old.files[path] === hash) {
              const kept = await old.cache.match(url);
              if (kept) return cache.put(url, kept);
            }
            const res = await fetch(url, { cache: 'no-cache' });
            if (!res.ok) throw new Error(`${url}: ${res.status}`);
            await cache.put(url, res);
          }),
        );
      }
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
});

self.addEventListener('message', (event) => {
  if (event.data === 'update') self.skipWaiting();
});

/** The file a page's address is served from: `/story/` and `/story` are `/story/index.html`. */
function fileFor(pathname) {
  if (!pathname.startsWith(BASE)) return null;
  let path = pathname.slice(BASE.length) || '/';
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
      return hit ?? fetch(req);
    })(),
  );
});
