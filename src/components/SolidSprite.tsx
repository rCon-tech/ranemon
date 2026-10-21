'use client';

import dynamic from 'next/dynamic';

/** `Solid`, with Three.js loaded only once the 3D look is picked. Its own client file, so `Sprite` stays usable from server pages like the Ranedex. */
export const SolidSprite = dynamic(() => import('./Solid'), { ssr: false, loading: () => null });
