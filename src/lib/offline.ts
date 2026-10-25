import { asset } from './asset';

/**
 * Offline play: the GitHub Pages build registers a service worker (`scripts/offline/sw.js`) that
 * keeps every file of the game on the phone. A new build downloads in the background and waits
 * until the player taps to update on the title screen, never in the middle of a battle.
 */
export const OFFLINE = process.env.NEXT_PUBLIC_OFFLINE === '1';

let waiting: ServiceWorker | null = null;
const listeners = new Set<() => void>();
const changed = () => listeners.forEach((l) => l());

function watch(reg: ServiceWorkerRegistration) {
  // Only an update waits: the first install has nothing to replace.
  const check = () => {
    if (reg.waiting && navigator.serviceWorker.controller) {
      waiting = reg.waiting;
      changed();
    }
  };
  check();
  reg.addEventListener('updatefound', () => {
    reg.installing?.addEventListener('statechange', check);
  });
}

let registered: Promise<ServiceWorkerRegistration | null> | null = null;

/** Registers the service worker once, in builds that have one. */
export function registerOffline(): Promise<ServiceWorkerRegistration | null> {
  registered ??= (async () => {
    if (!OFFLINE || !('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register(asset('/sw.js'), { scope: asset('/') });
      watch(reg);
      // Asks the browser to keep the game's files and saves when the phone runs low on space.
      navigator.storage?.persist?.().catch(() => {});
      return reg;
    } catch {
      return null;
    }
  })();
  return registered;
}

/** For `useSyncExternalStore`: whether a new version is downloaded and ready. */
export const updateReady = () => waiting !== null;
export function onUpdateReady(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Switches to the waiting version and reloads into it. */
export async function applyUpdate() {
  // The registration's own waiting worker, in case a newer one has arrived since.
  const next = (await navigator.serviceWorker.getRegistration(asset('/')))?.waiting ?? waiting;
  if (!next) return location.reload();
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), {
    once: true,
  });
  next.postMessage('update');
  // The old version can hold on while the page still has requests open with it; a reload lets
  // it go, and the new one takes over.
  setTimeout(() => location.reload(), 2000);
}

/**
 * Checks for a new version now, and switches to it if there is one: for when the save server
 * says this phone is on an older version of the game. Without a service worker, a reload is enough.
 */
export async function updateNow() {
  const reg = await registerOffline();
  if (!reg) return location.reload();
  await reg.update().catch(() => {});
  const sw = reg.installing;
  if (sw)
    await new Promise<void>((done) =>
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' || sw.state === 'redundant') done();
      }),
    );
  await applyUpdate();
}

/** For `useSyncExternalStore`: whether the browser thinks it has a connection. Only a hint. */
export const isOnline = () => navigator.onLine;
export function onOnlineChange(listener: () => void) {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);
  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
}
