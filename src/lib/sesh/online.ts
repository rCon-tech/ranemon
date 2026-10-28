import { SESH_RULES, type SeshRow } from '../online/sesh';
import { keepDevice, readSync } from '../story/cloud';
import { playerId } from '../story/state';
import type { SeshAction, SeshRun } from './run';

/**
 * A phone's side of The Sesh's boards (`src/lib/online/sesh.ts` on the save server). A finished
 * run joins a queue in this browser and goes up as its seed and choices; with no connection it
 * waits, and goes up the next time The Sesh opens online. The name's device token (from Story
 * mode's online saves, or from the first run sent with the PIN) stands in for the PIN.
 */

/** A finished run waiting to go up. */
export interface Queued {
  name: string;
  seed: number;
  daily?: string;
  actions: SeshAction[];
}

const queueKey = (name: string) => `ranemon.sesh.queue:${playerId(name)}`;

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function queued(name: string): Queued[] {
  try {
    const list = JSON.parse(storage()?.getItem(queueKey(name)) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function setQueue(name: string, list: Queued[]) {
  try {
    if (list.length) storage()?.setItem(queueKey(name), JSON.stringify(list));
    else storage()?.removeItem(queueKey(name));
  } catch {
    // Kept for this visit only.
  }
}

/** Puts a finished run in the queue to go up. */
export function queueRun(name: string, run: SeshRun, actions: SeshAction[]) {
  setQueue(name, [
    ...queued(name),
    { name, seed: run.seed, ...(run.daily && { daily: run.daily }), actions },
  ]);
}

/**
 * How sending the queue went. `pin`: there's no device token, or it no longer works, so the PIN
 * is needed. `nosave`: the name has no online save. `offline`: the server couldn't be reached.
 * `update`: this phone and the server are on different versions of the game.
 */
export type Sent = {
  sent: number;
  waiting: number;
  error?: 'pin' | 'nosave' | 'offline' | 'update';
};

const TIMEOUT_MS = 8000;

async function post(base: string, body: object): Promise<{ status: number; data: Record<string, unknown> }> {
  const res = await fetch(`${base.replace(/\/+$/, '')}/sesh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout?.(TIMEOUT_MS),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

/**
 * Sends a name's queued runs, oldest first, with the PIN if given and the device token
 * otherwise. A run the server turns away (one that doesn't replay, or a Daily Challenge sent too
 * late) leaves the queue; anything else wrong leaves it to try again.
 */
export async function sendQueue(base: string, name: string, pin?: string): Promise<Sent> {
  const list = queued(name);
  let sent = 0;
  const device = readSync(name).device;
  if (list.length && !pin && !device) return { sent, waiting: list.length, error: 'pin' };
  let usePin = pin;
  while (list.length) {
    const run = list[0];
    let reply;
    try {
      reply = await post(base, {
        op: 'submit',
        v: SESH_RULES,
        ...run,
        name,
        ...(usePin ? { pin: usePin, newDevice: !device } : { device }),
      });
    } catch {
      setQueue(name, list);
      return { sent, waiting: list.length, error: 'offline' };
    }
    const { status, data } = reply;
    if (status === 200 && typeof data.device === 'string') {
      keepDevice(name, data.device);
      usePin = undefined;
    }
    if (status === 401 || status === 429 || status === 404 || status === 409 || status >= 500) {
      setQueue(name, list);
      const error =
        status === 404 ? 'nosave' : status === 409 ? 'update' : status >= 500 ? 'offline' : 'pin';
      return { sent, waiting: list.length, error };
    }
    list.shift();
    if (status === 200) sent++;
  }
  setQueue(name, list);
  return { sent, waiting: 0 };
}

export async function fetchBoard(base: string, day: string): Promise<SeshRow[]> {
  const { status, data } = await post(base, { op: 'board', day });
  if (status !== 200) throw new Error(String(data.error ?? status));
  return data.rows as SeshRow[];
}

export async function fetchWinners(base: string, before: string): Promise<SeshRow[]> {
  const { status, data } = await post(base, { op: 'winners', before });
  if (status !== 200) throw new Error(String(data.error ?? status));
  return data.rows as SeshRow[];
}

export async function fetchMine(
  base: string,
  name: string,
): Promise<{ free: SeshRow[]; daily: SeshRow[] }> {
  const { status, data } = await post(base, { op: 'mine', name });
  if (status !== 200) throw new Error(String(data.error ?? status));
  return data as { free: SeshRow[]; daily: SeshRow[] };
}
