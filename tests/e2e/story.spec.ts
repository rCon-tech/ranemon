import { expect, test } from '@playwright/test';

test('story mode: Michael D hands over a starter in Clare', async ({ page }) => {
  await page.goto('/story');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'START' }).click();
  const text = page.getByTestId('story-text');
  // Mam's wake-up call: tap twice per line (finish typing, then next).
  for (let i = 0; i < 4 && (await text.count()); i++) await text.click();
  await expect(text).toHaveCount(0);

  // Walk east along the lane to Michael D and talk to him.
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(16 * 250 + 100);
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

  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('ranemon.story.v1')!));
  expect(save.party[0].species).toBe('enda');
  expect(save.party[0].level).toBe(5);
});
