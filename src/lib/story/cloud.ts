import { playerId } from './state';

/**
 * Online saves, filed under the trainer's name so a save follows you to another device or
 * survives a cleared browser. It is off unless the page that hosts the game provides it: the
 * claude.ai play link keeps saves in its own database, and a build with NEXT_PUBLIC_SAVE_API set
 * uses the save server in `worker/` (`remote.ts`), where each name is locked with a PIN.
 */
export interface CloudSaves {
  /** The save's JSON, or null if there is none under that name. Rejects with a CloudError. */
  load(id: string, pin?: string): Promise<string | null>;
  save(id: string, raw: string, pin?: string): Promise<void>;
  /** Each name is locked with a PIN, chosen with its first online save. */
  pin?: boolean;
}

/** `pin`: the PIN doesn't match the name's. `locked`: too many wrong PINs; wait and try again. */
export class CloudError extends Error {
  constructor(readonly code: 'pin' | 'locked') {
    super(code);
  }
}

export type OnlineResult = { raw: string | null } | { error: 'pin' | 'locked' | 'offline' };

let cloud: CloudSaves | null = null;
let ready: Promise<CloudSaves | null> = Promise.resolve(null);
/** The PIN that opened each name's online save this visit. Never stored. */
const pins = new Map<string, string>();

/** Turns online saves on. The host may still be connecting, so this takes a promise too. */
export function setCloudSaves(c: CloudSaves | Promise<CloudSaves | null> | null) {
  if (!(c instanceof Promise)) cloud = c;
  ready = Promise.resolve(c).then(
    (resolved) => (cloud = resolved),
    () => (cloud = null),
  );
}

export const hasCloudSaves = () => cloud !== null;
/** Whether the title screen should ask for a PIN. */
export const cloudNeedsPin = () => !!cloud?.pin;
export const isPin = (pin: string) => /^\d{4,8}$/.test(pin);

export async function loadOnline(name: string, pin?: string): Promise<OnlineResult> {
  const id = playerId(name);
  try {
    const c = await ready;
    if (!c) return { raw: null };
    const raw = (await c.load(id, pin)) ?? null;
    if (c.pin && pin) pins.set(id, pin);
    return { raw };
  } catch (e) {
    return { error: e instanceof CloudError ? e.code : 'offline' };
  }
}

/** Saves often happen a few times a minute, so writes wait a moment and keep only the last. */
const WRITE_DELAY_MS = 15_000;
let pending: { id: string; raw: string } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

export function saveOnline(name: string, raw: string) {
  const id = playerId(name);
  // A PIN-locked name is only written once its PIN has opened it this visit.
  if (!cloud || (cloud.pin && !pins.has(id))) return;
  pending = { id, raw };
  timer ??= setTimeout(flushOnline, WRITE_DELAY_MS);
}

/** Writes any waiting save now, such as when the page is being hidden. */
export function flushOnline() {
  if (timer) clearTimeout(timer);
  timer = null;
  const next = pending;
  pending = null;
  if (next && cloud) cloud.save(next.id, next.raw, pins.get(next.id)).catch(() => {});
}
