/**
 * The look: the classic 2D handheld view, or the 2.5D one, where the world and the battlefield
 * are built in 3D and the people and Ranemon stand in them as sprites. Only the drawing changes;
 * the game, its rules and saves are the same either way. Kept per browser, and read live.
 */
export type View = '2d' | '3d';

/**
 * The 3D look is switched off for now: everything draws in 2D and the 2D / 3D button is hidden.
 * The 3D code and each browser's saved choice are kept, so turning this back on brings it all back.
 */
export const THREE_D = false;

const KEY = 'ranemon.view';
let view: View = '2d';
const listeners = new Set<() => void>();

try {
  if (globalThis.localStorage?.getItem(KEY) === '3d') view = '3d';
} catch {
  // No storage: start in 2D.
}

export const getView = (): View => (THREE_D ? view : '2d');

export function setView(next: View) {
  view = next;
  try {
    globalThis.localStorage?.setItem(KEY, next);
  } catch {
    // Kept for this visit only.
  }
  listeners.forEach((l) => l());
}

export function subscribeView(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whether this browser can draw in 3D at all. Checked once. */
let webgl: boolean | null = null;
export function canDraw3d(): boolean {
  if (!THREE_D) return false;
  if (webgl === null) {
    try {
      webgl = !!document.createElement('canvas').getContext('webgl2');
    } catch {
      webgl = false;
    }
  }
  return webgl;
}
