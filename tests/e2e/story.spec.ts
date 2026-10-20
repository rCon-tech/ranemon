import { expect, test } from '@playwright/test';
import { unlock } from './helpers';

test('story mode: Michael D hands over a starter in Clare', async ({ page }) => {
  await unlock(page);
  await page.goto('/story');
  await page.getByTestId('trainer-name').fill('Rich');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  await expect(page.getByText('No save under “Rich” yet.')).toBeVisible();
  await page.getByRole('button', { name: 'NEW GAME' }).click();
  const text = page.getByTestId('story-text');
  // Mam's wake-up call: tap twice per line (finish typing, then next).
  for (let i = 0; i < 4 && (await text.count()); i++) await text.click();
  await expect(text).toHaveCount(0);

  // Walk east along the lane until Michael D blocks the way, then talk to him. Waiting on the
  // position rather than a fixed time keeps this steady on slow machines.
  await page.keyboard.down('ArrowRight');
  await expect(page.getByTestId('overworld')).toHaveAttribute('data-x', '19', { timeout: 30_000 });
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(400);
  await page.keyboard.press('z');
  for (let i = 0; i < 12 && !(await page.getByText('PICK YOUR RANEMON').count()); i++) {
    await page.keyboard.press('z');
    await page.waitForTimeout(150);
  }
  await page.getByRole('button', { name: /Enda/ }).click();
  await page.getByRole('button', { name: 'CHOOSE ENDA' }).click();
  await expect(text).toContainText('You chose Enda!');
  // The rest of Michael D's lines; the game saves once he's done.
  for (let i = 0; i < 12 && (await text.count()); i++) await text.click();
  await expect(text).toHaveCount(0);

  const save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ranemon.story.v1:rich')!),
  );
  expect(save.party[0].species).toBe('enda');
  expect(save.party[0].level).toBe(5);

  // Back on the title screen, the same name (any case) carries on from the save.
  await page.reload();
  await expect(page.getByTestId('trainer-name')).toHaveValue('Rich');
  await page.getByTestId('trainer-name').fill('rich');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  await expect(page.getByTestId('overworld')).toBeVisible();
});

test('story mode: the couch at home is a lovely Ocean Linen couch', async ({ page }) => {
  await unlock(page);
  await page.goto('/story');
  await page.getByTestId('trainer-name').fill('Couch');
  await page.getByRole('button', { name: 'NEW GAME' }).click();
  const text = page.getByTestId('story-text');
  const world = page.getByTestId('overworld');
  const drain = async () => {
    for (let i = 0; i < 12 && (await text.count()); i++) await text.click();
    await expect(text).toHaveCount(0);
  };
  /** Taps a key for one step at a time, until the player stands on the tile. */
  const walk = async (key: string, x: number, y: number) => {
    for (let i = 0; i < 8; i++) {
      if (
        (await world.getAttribute('data-x')) === String(x) &&
        (await world.getAttribute('data-y')) === String(y)
      )
        return;
      await page.keyboard.down(key);
      await page.waitForTimeout(80);
      await page.keyboard.up(key);
      await page.waitForTimeout(400);
    }
    await expect(world).toHaveAttribute('data-x', String(x));
    await expect(world).toHaveAttribute('data-y', String(y));
  };
  await drain();

  // Home is the door just up and to the left of where you wake up.
  await walk('ArrowLeft', 2, 3);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(80);
  await page.keyboard.up('ArrowUp');
  await expect(world).toHaveAttribute('aria-label', /^Home,/);
  await drain();

  // In front of the couch, facing it.
  await walk('ArrowUp', 4, 3);
  await walk('ArrowLeft', 3, 3);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(80);
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(300);
  await page.keyboard.press('z');
  await expect(text).toContainText('A lovely Ocean Linen couch.');
});
