/**
 * Game speed: 1×, 2× or 4×. Walking, text, battle playback and animations all run this much
 * faster. Kept per browser, and read live, so a change takes effect at once.
 */
export type Speed = 1 | 2 | 4;
export const SPEEDS: Speed[] = [1, 2, 4];

const KEY = 'ranemon.speed';
let speed: Speed = 1;
/** A mode with a speed of its own (The Sesh), kept apart from the rest of the game's. */
let scope: string | null = null;
const listeners = new Set<() => void>();

const keyOf = (s: string | null) => (s ? `${KEY}.${s}` : KEY);

function load(s: string | null, fallback: Speed): Speed {
  try {
    const saved = Number(globalThis.localStorage?.getItem(keyOf(s)));
    if (saved === 1 || saved === 2 || saved === 4) return saved;
  } catch {
    // No storage: the fallback.
  }
  return fallback;
}

speed = load(null, 1);

export const getSpeed = (): Speed => speed;

export function setSpeed(next: Speed) {
  speed = next;
  try {
    globalThis.localStorage?.setItem(keyOf(scope), String(next));
  } catch {
    // Kept for this visit only.
  }
  listeners.forEach((l) => l());
}

/**
 * Plays at a mode's own speed until the returned function is called, which goes back to the
 * game's. The Sesh starts at 2× (`fallback`), and a change made in it is kept for it alone.
 */
export function ownSpeed(name: string, fallback: Speed): () => void {
  scope = name;
  speed = load(name, fallback);
  listeners.forEach((l) => l());
  return () => {
    scope = null;
    speed = load(null, 1);
    listeners.forEach((l) => l());
  };
}

export function subscribeSpeed(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The next speed along, for a button that cycles 1×, 2×, 4×. */
export const nextSpeed = (s: Speed): Speed => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length];

/** A duration at the current speed. */
export const scaled = (ms: number) => ms / speed;
