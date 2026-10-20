'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { getSpeed, nextSpeed, setSpeed, subscribeSpeed } from '@/lib/speed';

export const useSpeed = () => useSyncExternalStore(subscribeSpeed, getSpeed, () => 1 as const);

/**
 * Speeds up the page's CSS animations (move effects, special-move scenes, sprites coming in)
 * to the game speed. Run after every render that may have started new ones.
 */
export function useAnimationSpeed() {
  const speed = useSpeed();
  useEffect(() => {
    for (const a of document.getAnimations?.() ?? []) a.playbackRate = speed;
  });
}

/** A small button that cycles the game speed: ▶ 1×, ▶▶ 2×, ▶▶▶ 4×. */
export function SpeedButton({ className = '' }: { className?: string }) {
  const speed = useSpeed();
  return (
    <button
      type="button"
      className={`rounded bg-panel/85 px-1.5 py-0.5 text-[10px] font-bold text-paper ${className}`}
      onClick={() => setSpeed(nextSpeed(speed))}
      aria-label={`Game speed ${speed}×. Tap to change.`}
      data-testid="speed"
    >
      {'▶'.repeat(speed === 4 ? 3 : speed)} {speed}×
    </button>
  );
}
