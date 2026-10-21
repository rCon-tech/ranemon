'use client';

import { useSyncExternalStore } from 'react';
import { canDraw3d, getView, setView, subscribeView, type View } from '@/lib/view';

/** The look to draw in: 3D only where the browser can draw it. */
export const useView = () =>
  useSyncExternalStore(
    subscribeView,
    (): View => (getView() === '3d' && canDraw3d() ? '3d' : '2d'),
    (): View => '2d',
  );

/** A small button that flips between the classic 2D look and 3D. */
export function ViewButton({ className = '' }: { className?: string }) {
  const view = useView();
  const supported = useSyncExternalStore(never, canDraw3d, () => false);
  if (!supported) return null;
  return (
    <button
      type="button"
      className={`rounded bg-panel/85 px-1.5 py-0.5 text-[10px] font-bold text-paper ${className}`}
      onClick={() => setView(view === '3d' ? '2d' : '3d')}
      aria-label={`Showing the ${view.toUpperCase()} look. Tap for ${view === '3d' ? '2D' : '3D'}.`}
      data-testid="view"
    >
      {view === '3d' ? '3D' : '2D'}
    </button>
  );
}

/** WebGL doesn't come and go. */
const never = () => () => {};
