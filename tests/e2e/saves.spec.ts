import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { unlock } from './helpers';

/** A save from the live game, as a player has it in their browser right now. */
const LIVE = readFileSync('tests/fixtures/saves/live-early.json', 'utf8');

test('saves: a live save carries on, and a save code moves it to a new browser', async ({
  page,
  browser,
}) => {
  await unlock(page);
  await page.addInitScript((raw) => {
    if (!localStorage.getItem('ranemon.story.v1:con'))
      localStorage.setItem('ranemon.story.v1:con', raw);
  }, LIVE);
  await page.goto('/story');
  await page.getByTestId('trainer-name').fill('Con');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  const world = page.getByTestId('overworld');
  await expect(world).toHaveAttribute('data-x', '10');
  await expect(world).toHaveAttribute('data-y', '9');

  // The save as it was is kept aside, and the converted one is written under the same key.
  const stored = await page.evaluate(() => ({
    save: JSON.parse(localStorage.getItem('ranemon.story.v1:con')!),
    copies: JSON.parse(localStorage.getItem('ranemon.backups:con')!),
  }));
  expect(stored.save.version).toBe(1);
  expect(stored.save.party[0].species).toBe('conemon');
  expect(stored.copies.find((c: { why: string }) => c.why === 'update').raw).toBe(LIVE);

  // Make a save code on the title screen.
  await page.reload();
  await page.getByTestId('trainer-name').fill('Con');
  await page.getByTestId('open-save-tools').click();
  await expect(page.getByTestId('backup').first()).toBeVisible();
  await page.getByRole('button', { name: 'MAKE MY SAVE CODE' }).click();
  const code = await page.getByTestId('save-code').inputValue();
  expect(code).toMatch(/^RANEMON1\./);

  // A different browser, with nothing in it, loads the code and carries on in the same spot.
  const fresh = await browser.newPage();
  await unlock(fresh);
  await fresh.goto('/story');
  await fresh.getByTestId('trainer-name').fill('Con');
  await fresh.getByTestId('open-save-tools').click();
  await fresh.getByTestId('load-code').fill(code);
  await fresh.getByRole('button', { name: 'READ CODE' }).click();
  await expect(fresh.getByText(/1 Ranemon/)).toBeVisible();
  await fresh.getByTestId('use-code').click();
  await expect(fresh.getByTestId('overworld')).toHaveAttribute('data-x', '10');
  const moved = await fresh.evaluate(() =>
    JSON.parse(localStorage.getItem('ranemon.story.v1:con')!),
  );
  expect(moved.party[0].exp).toBe(205);
  expect(moved.flags).toContain('beat:rival-1');
  await fresh.close();
});
