import { readFileSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { PAGES_PORT } from '../../playwright.config';
import { handle, type SaveRow, type SaveStore } from '../../save-api/handler';
import { unlock } from './helpers';

/** The GitHub Pages build, the one with the service worker. */
const GAME = `http://localhost:${PAGES_PORT}/ranemon/`;
const LIVE = readFileSync('tests/fixtures/saves/live-early.json', 'utf8');

test('offline: once loaded, the game plays with no connection', async ({ page, context }) => {
  test.slow();
  await unlock(page);
  await page.addInitScript((raw) => {
    if (!localStorage.getItem('ranemon.story.v1:con'))
      localStorage.setItem('ranemon.story.v1:con', raw);
  }, LIVE);
  await page.goto(GAME);
  await expect(page.getByRole('heading', { name: 'RANEMON' })).toBeVisible();

  // The title says when the whole game is on the phone.
  const ready = page.getByTestId('offline-status');
  await expect(ready).toHaveText(/GETTING READY FOR OFFLINE|READY TO PLAY OFFLINE/);
  await expect(ready).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
  await expect(ready).toHaveText('✓ READY TO PLAY OFFLINE');

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'RANEMON' })).toBeVisible();
  await expect(page.getByTestId('friends-offline')).toBeVisible();
  // The font is part of the game now, not fetched from Google.
  expect(await page.evaluate(() => document.fonts.check('16px "Pixelify Sans"'))).toBe(true);

  // A Ranedex page, opened fresh, with its sprite.
  await page.goto(`${GAME}ranedex/carlmon/`);
  const sprite = page.locator('img[src*="/sprites/"]').first();
  await expect(sprite).toBeVisible();
  expect(await sprite.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  // Story mode: the save server can't be reached, so CONTINUE plays this browser's save at once.
  await page.goto(`${GAME}story/`);
  await page.getByTestId('trainer-name').fill('Con');
  await page.getByTestId('trainer-pin').fill('1234');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  await expect(page.getByTestId('overworld')).toBeVisible();

  // Battle mode, through to a battle, from in-app links.
  await page.goto(GAME);
  await page.getByRole('button', { name: 'PRESS START' }).click();
  const roster = page.getByRole('region', { name: 'Your roster' }).getByRole('button');
  for (let i = 0; i < 6; i++) await roster.nth(i).click();
  await page.getByRole('button', { name: /BATTLE!/ }).click();
  await expect(page.getByRole('button', { name: 'FIGHT' })).toBeVisible({ timeout: 15_000 });
});

test('offline: the game opens offline even if the pictures were cut off, and finishes later', async ({
  page,
  context,
}) => {
  test.slow();
  await unlock(page);
  // A patchy connection: no pictures get through on the first visit.
  await context.route('**/ranemon/sprites/**', (route) => route.abort('connectionreset'));
  await page.goto(GAME);
  await expect(page.getByTestId('offline-status')).toHaveAttribute('data-ready', 'false');

  // The game itself is in, so it still opens with no connection.
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'RANEMON' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'PRESS START' })).toBeVisible();

  // Back online, the next visit picks up the pictures where it stopped.
  await context.setOffline(false);
  await context.unroute('**/ranemon/sprites/**');
  await page.reload();
  await expect(page.getByTestId('offline-status')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
});

test('offline: a new version downloads, then waits for a tap on the title screen', async ({
  page,
}) => {
  test.slow();
  await unlock(page);
  await page.goto(GAME);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect(page.getByTestId('update-ready')).toHaveCount(0);

  // A new build goes up: the same files under a new build name.
  const worker = readFileSync('out/sw.js', 'utf8');
  try {
    writeFileSync('out/sw.js', worker.replace(/const BUILD = "[^"]+"/, 'const BUILD = "next"'));
    await page.reload();
    await page.getByTestId('update-ready').click();
    await expect(page.getByTestId('update-ready')).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'RANEMON' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => caches.keys())).toEqual(['ranemon-next']);
  } finally {
    writeFileSync('out/sw.js', worker);
  }
});

test('offline: a save made offline goes up once back online, and a clash asks which to keep', async ({
  page,
  context,
}) => {
  test.slow();
  // The real save server's code, in memory, at the address the Pages build was given.
  const rows = new Map<string, SaveRow>();
  const devices = new Map<string, string>();
  const store: SaveStore = {
    get: async (id) => rows.get(id) ?? null,
    put: async (r) => void rows.set(r.id, r),
    fails: async () => null,
    setFails: async () => {},
    clearFails: async () => {},
    device: async (hash) => devices.get(hash) ?? null,
    addDevice: async (hash, id) => void devices.set(hash, id),
  };
  let down = false;
  await context.route('http://127.0.0.1:9/api/**', async (route) => {
    if (down) return route.abort('internetdisconnected');
    const req = route.request();
    const res = await handle(
      new Request(req.url(), {
        method: req.method(),
        headers: req.headers(),
        body: req.method() === 'POST' ? req.postData() : undefined,
      }),
      store,
      { origins: [`http://localhost:${PAGES_PORT}`] },
    );
    await route.fulfill({
      status: res.status,
      headers: Object.fromEntries(res.headers),
      body: await res.text(),
    });
  });
  const online = () => JSON.parse(rows.get('con')!.raw) as { savedAt: number; money: number };
  const local = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('ranemon.story.v1:con')!).savedAt);
  async function play() {
    await page.goto(`${GAME}story/`);
    await page.getByTestId('trainer-name').fill('Con');
    await page.getByTestId('trainer-pin').fill('1234');
    await page.getByRole('button', { name: 'CONTINUE' }).click();
  }

  // A save from another device is online; this phone picks it up, and gets a device token.
  await unlock(page);
  await handle(
    new Request('https://saves/api/save', {
      method: 'POST',
      body: JSON.stringify({ id: 'con', pin: '1234', raw: LIVE }),
    }),
    store,
    { origins: [] },
  );
  await play();
  await expect(page.getByTestId('overworld')).toBeVisible();
  expect(devices.size).toBe(1);

  // No signal: CONTINUE plays the save here at once, and the save waits to go up.
  down = true;
  await play();
  await expect(page.getByTestId('overworld')).toBeVisible();
  const offlineSave = await local();
  expect(online().savedAt).not.toBe(offlineSave);
  // Back online: up it goes, with the device token, no PIN asked for.
  down = false;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect.poll(() => online().savedAt).toBe(offlineSave);

  // Offline again, while another device plays on from the same save.
  down = true;
  await play();
  await expect(page.getByTestId('overworld')).toBeVisible();
  const theirs = { ...JSON.parse(rows.get('con')!.raw), savedAt: 5, money: 123456 };
  const rev = rows.get('con')!.rev! + 1;
  rows.set('con', { ...rows.get('con')!, raw: JSON.stringify(theirs), rev });
  down = false;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  // Neither writes over the other...
  await page.waitForTimeout(1000);
  expect(online().money).toBe(123456);

  // ...and the title asks which to keep. The other is kept as a copy.
  await play();
  await expect(page.getByTestId('save-clash')).toBeVisible();
  await page.getByTestId('keep-online').click();
  await expect(page.getByTestId('overworld')).toBeVisible();
  const copies = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ranemon.backups:con')!),
  );
  expect(copies.some((c: { why: string }) => c.why === 'clash')).toBe(true);
  // The online save carries on from here, following on from the other device's.
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect.poll(() => rows.get('con')!.rev).toBe(rev + 1);
  expect(online().money).toBe(123456);
});
