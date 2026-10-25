import { readFileSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { PAGES_PORT } from '../../playwright.config';
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

  // The service worker keeps every file of the build before it takes over.
  const files = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const name = (await caches.keys()).find((k) => k.startsWith('ranemon-'))!;
    return (await (await caches.open(name)).keys()).length;
  });
  expect(files).toBeGreaterThan(500);

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
    expect(await page.evaluate(() => caches.keys())).toEqual(['ranemon-next']);
  } finally {
    writeFileSync('out/sw.js', worker);
  }
});
