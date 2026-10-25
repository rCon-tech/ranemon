/**
 * Serves the GitHub Pages build in `out/` the way GitHub Pages does, under `/ranemon/`, for the
 * offline end-to-end test: `node scripts/offline/serve.mjs 3200`.
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const BASE = '/ranemon';
const port = Number(process.argv[2] ?? 3200);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  if (pathname === '/') return res.writeHead(302, { location: `${BASE}/` }).end();
  if (!pathname.startsWith(`${BASE}/`) && pathname !== BASE) return res.writeHead(404).end();
  let file = join('out', normalize(decodeURIComponent(pathname.slice(BASE.length))));
  if (!file.startsWith('out')) return res.writeHead(404).end();
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!pathname.endsWith('/')) return res.writeHead(301, { location: `${pathname}/` }).end();
    file = join(file, 'index.html');
  }
  if (!existsSync(file)) {
    // Still building.
    if (!existsSync('out/404.html')) return res.writeHead(404).end();
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    return res.end(readFileSync('out/404.html'));
  }
  res.writeHead(200, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'max-age=600',
  });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`Serving out/ at http://localhost:${port}${BASE}/`));
