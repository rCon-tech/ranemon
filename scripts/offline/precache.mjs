/**
 * Runs after `next build`. For the GitHub Pages build (PAGES_BASE_PATH set, a static export in
 * `out/`) it writes `out/sw.js`: the service worker in `sw.js`, with every file of the build and
 * a hash of each in front of it, so the game can be kept whole on the phone and play offline.
 * Other builds (`pnpm dev`, `pnpm start`) have no service worker, and this does nothing.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const base = process.env.PAGES_BASE_PATH;
if (base === undefined) process.exit(0);

const OUT = 'out';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex').slice(0, 16);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else yield path;
  }
}

const files = {};
let bytes = 0;
for (const path of [...walk(OUT)].sort()) {
  const url = `/${relative(OUT, path).split(sep).join('/')}`;
  // The worker itself, and GitHub Pages' own `.nojekyll`.
  if (url === '/sw.js' || url.startsWith('/.')) continue;
  const data = readFileSync(path);
  files[url] = hash(data);
  bytes += data.length;
}
const build = hash(JSON.stringify(files));

const worker = readFileSync(new URL('./sw.js', import.meta.url), 'utf8');
writeFileSync(
  join(OUT, 'sw.js'),
  `const BASE = ${JSON.stringify(base)};\nconst BUILD = ${JSON.stringify(build)};\n` +
    `const FILES = ${JSON.stringify(files)};\n${worker}`,
);
console.log(
  `Offline: ${Object.keys(files).length} files (${(bytes / 1e6).toFixed(1)} MB) in build ${build}`,
);
