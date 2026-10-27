import { expect, test } from '@playwright/test';
import { unlock } from './helpers';

test('skip to Ranemon London: a new game that starts at Stansted, with saves of its own', async ({
  page,
}) => {
  await unlock(page);
  // Rich already has a Dublin save in this browser. Nothing here may touch it.
  const dublin = JSON.stringify({
    version: 1,
    schema: 7,
    map: 'clare',
    x: 2,
    y: 4,
    face: 'down',
    party: [],
    box: [],
    bag: {},
    money: 1234,
    flags: ['starter'],
    seen: [],
    caught: [],
    pub: { map: 'clare', x: 2, y: 4 },
    uid: 1,
    steps: 0,
  });
  await page.addInitScript((raw) => {
    if (!localStorage.getItem('ranemon.story.v1:rich'))
      localStorage.setItem('ranemon.story.v1:rich', raw);
  }, dublin);

  await page.goto('/');
  await expect(page.getByRole('link', { name: /STORY MODE/ })).toBeVisible();
  await page.getByTestId('skip-to-london').click();
  await expect(page.getByTestId('london-title')).toBeVisible();
  await page.getByTestId('trainer-name').fill('Rich');
  // Rich has no London save yet, whatever there is in Dublin.
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  await expect(page.getByText('No save under “Rich” yet.')).toBeVisible();
  await page.getByRole('button', { name: 'NEW GAME' }).click();

  const text = page.getByTestId('story-text');
  await expect(text).toContainText('RANEMON LONDON');
  for (let i = 0; i < 24 && (await text.count()); i++) await text.click();
  await expect(text).toHaveCount(0);
  await expect(page.getByTestId('place')).toContainText('Arrivals');

  const saves = await page.evaluate(() => ({
    london: JSON.parse(localStorage.getItem('ranemon.london.v1:rich')!),
    dublin: localStorage.getItem('ranemon.story.v1:rich'),
  }));
  expect(saves.london.flags).toContain('london:only');
  expect(saves.london.party).toEqual([]);
  expect(saves.dublin).toBe(dublin);

  // MISSIONS has Free the Lads, and nothing of Ireland's.
  await page.getByRole('button', { name: 'START' }).click();
  await expect(page.getByRole('button', { name: 'MAP', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'MISSIONS', exact: true }).click();
  await expect(page.getByTestId('mission-kneecap')).toContainText('Stansted Express');
  await expect(page.getByTestId('mission-champions')).toHaveCount(0);

  // Story mode still carries on from the Dublin save.
  await page.goto('/story');
  await page.getByTestId('trainer-name').fill('Rich');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  await expect(page.getByTestId('place')).toContainText('Clare');

  // And back in London, CONTINUE carries on from the London save.
  await page.goto('/london');
  await page.getByTestId('trainer-name').fill('rich');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  await expect(page.getByTestId('place')).toContainText('Arrivals');
});
