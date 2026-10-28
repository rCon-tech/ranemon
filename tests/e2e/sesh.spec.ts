import { expect, test } from '@playwright/test';
import { unlock } from './helpers';

test('Quick Sesh: from the title screen into the first node of the night', async ({ page }) => {
  await unlock(page);
  await page.goto('/');
  await expect(page.getByTestId('long-sesh')).toBeDisabled();
  await page.getByTestId('quick-sesh').click();
  await page.getByTestId('sesh-name').fill('Sesh Tester');
  await page.getByTestId('sesh-new').click();
  await page.getByTestId('sesh-go').click();
  await expect(page.getByTestId('sesh-stage')).toHaveText('THE PUB');
  // The Sesh starts at 2×, and leaves the rest of the game's speed alone.
  await expect(page.getByTestId('speed')).toContainText('2×');
  const open = page.locator('[data-testid^="node-0-"]:not([disabled])');
  expect(await open.count()).toBeGreaterThanOrEqual(2);
  await open.first().click();
  // Whatever the node is, it opens: a battle's briefing, the Offie or the Smoking Area.
  await expect(
    page
      .getByTestId('sesh-fight')
      .or(page.getByTestId('leave-offie'))
      .or(page.getByTestId('rest-heal')),
  ).toBeVisible();
  // Leaving and coming back carries on the same night.
  await page.goto('/sesh');
  await page.getByRole('button', { name: 'CARRY ON THE NIGHT' }).click();
  await expect(
    page
      .getByTestId('sesh-fight')
      .or(page.getByTestId('leave-offie'))
      .or(page.getByTestId('rest-heal')),
  ).toBeVisible();
  await page.goto('/');
  await page.getByRole('link', { name: 'SOUND TEST' }).waitFor();
  expect(await page.evaluate(() => localStorage.getItem('ranemon.speed'))).toBeNull();
});

test('Quick Sesh: a battle left halfway carries on where it was', async ({ page }) => {
  await unlock(page);
  await page.goto('/sesh');
  await page.getByTestId('sesh-name').fill('Sesh Resumer');
  await page.getByTestId('sesh-new').click();
  await page.getByTestId('sesh-go').click();
  // Into the first battle on the map, whichever row it's in.
  for (let i = 0; i < 12 && !(await page.getByTestId('sesh-fight').count()); i++) {
    if (await page.getByTestId('sesh-line').count()) await page.getByTestId('sesh-line').click();
    else if (await page.getByTestId('leave-offie').count())
      await page.getByTestId('leave-offie').click();
    else if (await page.getByTestId('rest-ghost').count())
      await page.getByTestId('rest-ghost').click();
    else await page.locator('[data-testid^="node-"]:not([disabled])').first().click();
  }
  await page.getByTestId('sesh-fight').click();
  await page.getByRole('button', { name: 'FIGHT', exact: true }).click();
  const move = page.getByRole('group', { name: 'Moves' }).locator('button:not([disabled])').first();
  await move.click();
  await move.click();
  // One move in: the next turn, or (a one-hit win) the end of the battle.
  const turn2 = page.getByText('Turn 2');
  const done = page.getByRole('button', { name: 'CONTINUE' });
  await expect(turn2.or(done)).toBeVisible({ timeout: 30_000 });
  const ended = await done.isVisible();
  await page.reload();
  await page.getByRole('button', { name: 'CARRY ON THE NIGHT' }).click();
  // Straight back into the battle, where it was.
  await expect(page.getByTestId('battlefield')).toBeVisible();
  await expect(ended ? done : turn2).toBeVisible();
});
