import { expect, test, type Page } from '@playwright/test';

/** Taps through a whole battle: always the first usable move, the first healthy replacement. */
async function playToTheEnd(page: Page) {
  const fight = page.getByRole('button', { name: 'FIGHT' });
  const moves = page.getByRole('group', { name: 'Moves' });
  const team = page.getByRole('group', { name: 'Your team' });
  const proceed = page.getByRole('button', { name: 'CONTINUE' });
  for (let i = 0; i < 1500; i++) {
    if (await proceed.isVisible()) return;
    if (await fight.isVisible()) {
      await fight.click();
      // The first tap shows what the move does; USE confirms it.
      await moves.getByRole('button', { disabled: false }).first().click();
      await expect(page.getByTestId('move-info')).toBeVisible();
      await page.getByRole('button', { name: /^USE / }).click();
    } else if (await team.isVisible()) {
      await team.getByRole('button', { disabled: false }).first().click();
    } else {
      // Tapping the text box skips to the next line.
      await page.getByTestId('text-box').click();
    }
  }
  throw new Error('The battle never finished');
}

test('pick 6 of the 16, then a full 6v6 battle against the CPU', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'RANEMON' })).toBeVisible();
  await expect(page.getByText('Record: 0W · 0L')).toBeVisible();
  await page.getByRole('button', { name: 'PRESS START' }).click();

  const roster = page.getByRole('region', { name: 'Your roster' }).getByRole('button');
  await expect(roster).toHaveCount(16);
  const start = page.getByRole('button', { name: /BATTLE!/ });
  await expect(start).toBeDisabled();
  for (let i = 0; i < 7; i++) await roster.nth(i).click();
  await expect(roster.nth(0)).toContainText('LEAD');
  // The 7th tap doesn't count: a team is 6.
  await expect(roster.nth(6)).toHaveAttribute('aria-pressed', 'false');
  await expect(start).toHaveText('BATTLE! (6/6)');
  await page.getByRole('button', { name: 'EASY' }).click();
  await start.click();

  await expect(page.getByRole('button', { name: 'FIGHT' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('info-you')).toBeVisible();
  await expect(page.getByTestId('info-foe')).toBeVisible();

  await playToTheEnd(page);
  const ending = await page.getByTestId('text-box').textContent();
  expect(ending).toMatch(/You won the battle!|You lost the battle…|draw/);
  await page.getByRole('button', { name: 'CONTINUE' }).click();

  // The result lands on the record.
  await expect(page.getByText(/Record: [01]W · [01]L/)).toBeVisible();
  await expect(page.getByText('Record: 0W · 0L')).toHaveCount(ending?.includes('draw') ? 1 : 0);
});

test('the Ranedex lists all 16 Ranemon with their photo sprites', async ({ page }) => {
  await page.goto('/ranedex');
  await expect(page.getByRole('heading', { name: 'RANEDEX' })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'No.' })).toHaveCount(16);
  const sprite = page.getByRole('img', { name: 'Steadmon' });
  await expect(sprite).toBeVisible();
  // The full-colour pixel versions: 96 pixels, cut down to 32 colours.
  expect(await sprite.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(96);
  await expect(page.getByText('★ Ranelads.com:')).toBeVisible();
});
