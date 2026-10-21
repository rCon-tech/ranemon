'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { Cue } from '@/lib/sound/cues';
import { playCryOf, playJingle, playSfx, setMusic, unlock } from '@/lib/sound/engine';
import { getSoundMode, nextSoundMode, setSoundMode, subscribeSound } from '@/lib/sound/settings';
import type { SfxId } from '@/lib/sound/sfx';
import type { SongId } from '@/lib/sound/songs';

export const useSoundMode = () =>
  useSyncExternalStore(subscribeSound, getSoundMode, () => 'on' as const);

/** Plays a song while this screen is up. `undefined` leaves the music to someone else. */
export function useMusic(id: SongId | null | undefined) {
  useEffect(() => {
    if (id !== undefined) setMusic(id);
  }, [id]);
}

export function play(cues: Cue[]) {
  for (const c of cues) {
    if ('sfx' in c) playSfx(c.sfx, c.delay);
    else if ('cry' in c) playCryOf(c.cry, c.low, c.delay);
    else playJingle(c.jingle);
  }
}

const LABEL = { on: '♪', sfx: '♪ FX', off: '♪ OFF' } as const;
const SAY = { on: 'Music and sound on', sfx: 'Sound effects only', off: 'Sound off' } as const;

/** A small button that cycles the sound: music and effects, effects only, off. */
export function SoundButton({ className = '' }: { className?: string }) {
  const mode = useSoundMode();
  return (
    <button
      type="button"
      className={`rounded bg-panel/85 px-1.5 py-0.5 text-[10px] font-bold text-paper ${mode === 'off' ? 'line-through opacity-80' : ''} ${className}`}
      onClick={() => setSoundMode(nextSoundMode(mode))}
      aria-label={`${SAY[mode]}. Tap to change.`}
      data-testid="sound"
    >
      {LABEL[mode]}
    </button>
  );
}

const BACK_WORDS = new Set(['BACK', 'NO', 'CLOSE', 'CANCEL']);

/**
 * Wakes the audio on the first tap or key (phones allow nothing before one), and gives every
 * button and menu link a blip: a lower one for BACK and NO. `data-sound` on a button picks
 * another effect, or `none` for one that makes its own.
 */
export function SoundHooks() {
  useEffect(() => {
    const wake = () => unlock();
    const click = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('button, a');
      if (!el) return;
      const own = el.closest('[data-sound]')?.getAttribute('data-sound');
      if (own === 'none') return;
      const word = el.textContent?.trim().toUpperCase() ?? '';
      playSfx(own ? (own as SfxId) : BACK_WORDS.has(word) ? 'back' : 'select');
    };
    const opts = { capture: true, passive: true };
    window.addEventListener('pointerdown', wake, opts);
    window.addEventListener('keydown', wake, opts);
    window.addEventListener('touchend', wake, opts);
    window.addEventListener('click', click, opts);
    return () => {
      window.removeEventListener('pointerdown', wake, opts);
      window.removeEventListener('keydown', wake, opts);
      window.removeEventListener('touchend', wake, opts);
      window.removeEventListener('click', click, opts);
    };
  }, []);
  return null;
}
