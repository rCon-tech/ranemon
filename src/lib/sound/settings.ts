/**
 * Sound: music and effects, effects only, or off. Kept per browser, and read live, so a change
 * takes effect at once. Sound starts on; phones still stay quiet until the first tap.
 */
export type SoundMode = 'on' | 'sfx' | 'off';
export const SOUND_MODES: SoundMode[] = ['on', 'sfx', 'off'];

const KEY = 'ranemon.sound';
let mode: SoundMode = 'on';
const listeners = new Set<() => void>();

try {
  const saved = globalThis.localStorage?.getItem(KEY);
  if (saved === 'sfx' || saved === 'off') mode = saved;
} catch {
  // No storage: start with sound on.
}

export const getSoundMode = (): SoundMode => mode;

export function setSoundMode(next: SoundMode) {
  mode = next;
  try {
    globalThis.localStorage?.setItem(KEY, next);
  } catch {
    // Kept for this visit only.
  }
  listeners.forEach((l) => l());
}

export function subscribeSound(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The next mode along, for a button that cycles on, effects only, off. */
export const nextSoundMode = (m: SoundMode): SoundMode =>
  SOUND_MODES[(SOUND_MODES.indexOf(m) + 1) % SOUND_MODES.length];
