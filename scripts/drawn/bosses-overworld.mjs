/**
 * Paints each boss in `art/bosses/bosses.ts` as the overworld draws them (`paintPerson` in
 * people.ts), in Chromium, and saves a sheet of their walk to `art/bosses/<id>/overworld.png`:
 * a row each for down, left, right and up, the nine frames of the walk across. Also writes
 * `art/bosses/bosses.json` for `bosses.py` to put on the preview sheet.
 *
 *     node scripts/drawn/bosses-overworld.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = resolve(root, 'art/bosses');

const entry = `
  import { BOSSES } from './art/bosses/bosses';
  import { paintPerson, PERSON_H, PERSON_W, STYLES } from './src/components/story/people';
  const DIRS = ['down', 'left', 'right', 'up'];
  window.paint = () => BOSSES.map((b) => {
    const style = typeof b.look === 'string' ? STYLES[b.look] : b.look;
    const sheet = document.createElement('canvas');
    sheet.width = PERSON_W * 9;
    sheet.height = PERSON_H * 4;
    const c = sheet.getContext('2d');
    DIRS.forEach((dir, row) => {
      for (let f = 0; f < 9; f++) c.drawImage(paintPerson(style, dir, f), f * PERSON_W, row * PERSON_H);
    });
    return { id: b.id, png: sheet.toDataURL('image/png') };
  });
  window.BOSSES = BOSSES;
`;

const bundle = await build({
  stdin: { contents: entry, resolveDir: root, loader: 'ts' },
  bundle: true,
  write: false,
  format: 'iife',
  alias: { '@': resolve(root, 'src') },
  logLevel: 'error',
});

// CHROMIUM: a Chromium to use instead of Playwright's own, if that isn't installed.
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
await page.addScriptTag({ content: bundle.outputFiles[0].text });
const sheets = await page.evaluate(() => window.paint());
const bosses = await page.evaluate(() => window.BOSSES);
await browser.close();

for (const { id, png } of sheets) {
  mkdirSync(resolve(out, id), { recursive: true });
  writeFileSync(resolve(out, id, 'overworld.png'), Buffer.from(png.split(',')[1], 'base64'));
}
writeFileSync(resolve(out, 'bosses.json'), JSON.stringify(bosses, null, 2) + '\n');
console.log(`Painted ${sheets.length}: ${sheets.map((s) => s.id).join(', ')}`);
