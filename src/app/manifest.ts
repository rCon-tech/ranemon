import type { MetadataRoute } from 'next';
import { asset } from '@/lib/asset';

export const dynamic = 'force-static';

/** Lets a phone install the game to its home screen, where it opens full screen and plays offline. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: asset('/'),
    name: 'Ranemon',
    short_name: 'Ranemon',
    description: 'A battle game where your friends are the creatures.',
    start_url: asset('/'),
    scope: asset('/'),
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#1c2026',
    theme_color: '#1c2026',
    icons: [
      { src: asset('/icons/icon-192.png'), sizes: '192x192', type: 'image/png' },
      { src: asset('/icons/icon-512.png'), sizes: '512x512', type: 'image/png' },
      {
        src: asset('/icons/maskable-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
