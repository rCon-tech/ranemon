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
