import type { NextConfig } from 'next';

// Set by the GitHub Pages workflow: the game is served from /<repo>/ as plain static files.
const pagesBasePath = process.env.PAGES_BASE_PATH;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  agentRules: false,
  ...(pagesBasePath !== undefined && {
    output: 'export',
    basePath: pagesBasePath,
    trailingSlash: true,
    images: { unoptimized: true },
    // NEXT_PUBLIC_OFFLINE: this build has a service worker (scripts/offline/), so it plays offline.
    env: { NEXT_PUBLIC_BASE_PATH: pagesBasePath, NEXT_PUBLIC_OFFLINE: '1' },
  }),
};

export default nextConfig;
