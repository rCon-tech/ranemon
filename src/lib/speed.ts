/**
 * Game speed: 1×, 2× or 4×. Walking, text, battle playback and animations all run this much
 * faster. Kept per browser, and read live, so a change takes effect at once.
 */
export type Speed = 1 | 2 | 4;
export const SPEEDS: Speed[] = [1, 2, 4];

const KEY = 'ranemon.speed';
let speed: Speed = 1;
const listeners = new Set<() => void>();

try {
  const saved = Number(globalThis.localStorage?.getItem(KEY));
  if (saved === 2 || saved === 4) speed = saved;
} catch {
  // No storage: start at 1×.
}

export const getSpeed = (): Speed => speed;

export function setSpeed(next: Speed) {
  speed = next;
  try {
    globalThis.localStorage?.setItem(KEY, String(next));
  } catch {
    // Kept for this visit only.
  }
  listeners.forEach((l) => l());
}

export function subscribeSpeed(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The next speed along, for a button that cycles 1×, 2×, 4×. */
export const nextSpeed = (s: Speed): Speed => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length];

/** A duration at the current speed. */
export const scaled = (ms: number) => ms / speed;
