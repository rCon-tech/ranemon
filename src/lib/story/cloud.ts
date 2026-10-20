import { playerId } from './state';

/**
 * Online saves, filed under the trainer's name so a save follows you to another device or
 * survives a cleared browser. The static site has no server, so this is off unless the page
 * that hosts the game provides one (the shared play link keeps saves in its own database).
 */
export interface CloudSaves {
  /** The save's JSON, or null if there is none under that name. */
  load(id: string): Promise<string | null>;
  save(id: string, raw: string): Promise<void>;
}

let cloud: CloudSaves | null = null;
let ready: Promise<CloudSaves | null> = Promise.resolve(null);

/** Turns online saves on. The host may still be connecting, so this takes a promise too. */
export function setCloudSaves(c: CloudSaves | Promise<CloudSaves | null> | null) {
  ready = Promise.resolve(c).then(
    (resolved) => (cloud = resolved),
    () => (cloud = null),
  );
}

export const hasCloudSaves = () => cloud !== null;

export async function loadOnline(name: string): Promise<string | null> {
  try {
    return (await (await ready)?.load(playerId(name))) ?? null;
  } catch {
    return null;
  }
}

/** Saves often happen a few times a minute, so writes wait a moment and keep only the last. */
const WRITE_DELAY_MS = 4000;
let pending: { id: string; raw: string } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

export function saveOnline(name: string, raw: string) {
  if (!cloud) return;
  pending = { id: playerId(name), raw };
  timer ??= setTimeout(flushOnline, WRITE_DELAY_MS);
}

/** Writes any waiting save now, such as when the page is being hidden. */
export function flushOnline() {
  if (timer) clearTimeout(timer);
  timer = null;
  const next = pending;
  pending = null;
  if (next && cloud) cloud.save(next.id, next.raw).catch(() => {});
}
