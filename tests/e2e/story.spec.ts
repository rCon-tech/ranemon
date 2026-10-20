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
