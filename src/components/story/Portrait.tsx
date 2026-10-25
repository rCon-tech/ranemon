'use client';

import { useEffect, useRef } from 'react';
import type { Look } from '@/lib/story/world';
import { paintPerson, PERSON_H, PERSON_W, STYLES } from './people';

/** Whether a skin id from elsewhere (a friend's save, say) is a look this build can draw. */
export const isLook = (x: unknown): x is Look | 'player' =>
  typeof x === 'string' && Object.hasOwn(STYLES, x);

/** Someone as they walk the overworld, facing you: a dark silhouette while `locked`. */
export function Portrait({
  look,
  locked = false,
  className,
}: {
  look: Look | 'player';
  locked?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext('2d');
    if (!c) return;
    c.clearRect(0, 0, PERSON_W, PERSON_H);
    c.globalCompositeOperation = 'source-over';
    c.drawImage(paintPerson(STYLES[look], 'down', 0), 0, 0);
    if (locked) {
      c.globalCompositeOperation = 'source-in';
      c.fillStyle = '#1c2026';
      c.fillRect(0, 0, PERSON_W, PERSON_H);
      c.globalCompositeOperation = 'source-over';
    }
  }, [look, locked]);
  return (
    <canvas
      ref={ref}
      width={PERSON_W}
      height={PERSON_H}
      className={className}
      style={{ imageRendering: 'pixelated' }}
      data-look={locked ? undefined : look}
      aria-hidden="true"
    />
  );
}
