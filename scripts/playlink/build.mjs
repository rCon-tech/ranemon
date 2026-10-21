// Builds the claude.ai play link: the whole game as one HTML page, sprites inlined.
// Run from the repo root after `pnpm build` (for the CSS): node scripts/playlink/build.mjs out.html
import { build } from 'esbuild';
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const out = process.argv[2] ?? 'ranemon.html';

// Every sprite under public/ except the raw photo cut-outs, as data URIs.
const assets = {};
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.png')) {
      const url = p.slice(join(root, 'public').length);
      if (/^\/sprites\/[^/]+\.png$/.test(url)) continue;
      assets[url] = `data:image/png;base64,${readFileSync(p).toString('base64')}`;
    }
  }
};
walk(join(root, 'public'));

const shims = {
  name: 'shims',
  setup(b) {
    b.onResolve({ filter: /^next\/link$/ }, () => ({
      path: join(import.meta.dirname, 'link.tsx'),
    }));
    b.onResolve({ filter: /^next\/dynamic$/ }, () => ({
      path: join(import.meta.dirname, 'dynamic.tsx'),
    }));
    b.onResolve({ filter: /^@\/lib\/asset$/ }, () => ({ path: 'asset', namespace: 'assets' }));
    b.onLoad({ filter: /.*/, namespace: 'assets' }, () => ({
      contents: `const A = ${JSON.stringify(assets)};\nexport function asset(p) { return A[p] ?? p; }`,
      loader: 'js',
    }));
  },
};

const js = await build({
  entryPoints: [join(import.meta.dirname, 'entry.tsx')],
  bundle: true,
  write: false,
  format: 'iife',
  minify: true,
  jsx: 'automatic',
  target: 'es2022',
  alias: { '@': join(root, 'src') },
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.NEXT_PUBLIC_BASE_PATH': 'undefined',
    'process.env.NEXT_PUBLIC_SAVE_API': 'undefined',
  },
  plugins: [shims],
  logLevel: 'warning',
});

const cssDir = join(root, '.next/static/chunks');
const css = readdirSync(cssDir)
  .filter((f) => f.endsWith('.css'))
  .map((f) => readFileSync(join(cssDir, f), 'utf8'))
  .join('\n');

const script = js.outputFiles[0].text.replaceAll('</script', '<\\/script');
writeFileSync(
  out,
  `<title>Ranemon</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;700&display=swap">
<style>
${css}
:root { color-scheme: light; }
html, body { background: #1c2026; }
#root { padding-left: max(0px, env(safe-area-inset-left, 0px)); padding-right: max(0px, env(safe-area-inset-right, 0px)); }
</style>
<div id="root"></div>
<script>${script}</script>
`,
);
console.log(
  `${out}: ${Math.round(statSync(out).size / 1024)} KB, ${Object.keys(assets).length} sprites`,
);
