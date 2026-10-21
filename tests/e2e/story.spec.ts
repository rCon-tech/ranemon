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

test('story mode: the old man’s HM opens the Semple Stadium gym', async ({ page }) => {
  await unlock(page);
  await page.addInitScript(() => {
    if (localStorage.getItem('ranemon.story.v1:hm')) return;
    localStorage.setItem(
      'ranemon.story.v1:hm',
      JSON.stringify({
        version: 1,
        map: 'tipperary',
        x: 19,
        y: 11,
        face: 'up',
        party: [
          {
            uid: 1,
            species: 'enda',
            level: 20,
            exp: 8000,
            hp: 70,
            pp: [10],
            status: null,
            moves: ['fierce-friendship'],
          },
        ],
        box: [],
        bag: {},
        money: 3000,
        flags: ['starter', 'visited:tipperary', 'jersey:clare', 'jersey:limerick'],
        seen: [],
        caught: [],
        pub: { map: 'tipperary', x: 4, y: 11 },
        uid: 2,
        steps: 0,
      }),
    );
  });
  await page.goto('/story');
  await page.getByTestId('trainer-name').fill('HM');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  const text = page.getByTestId('story-text');
  const world = page.getByTestId('overworld');
  const tap = async (key: string) => {
    await page.keyboard.down(key);
    await page.waitForTimeout(80);
    await page.keyboard.up(key);
    await page.waitForTimeout(400);
  };
  const walk = async (key: string, x: number, y: number) => {
    for (let i = 0; i < 8; i++) {
      if (
        (await world.getAttribute('data-x')) === String(x) &&
        (await world.getAttribute('data-y')) === String(y)
      )
        return;
      await tap(key);
    }
    await expect(world).toHaveAttribute('data-x', String(x));
    await expect(world).toHaveAttribute('data-y', String(y));
  };
  await expect(world).toBeVisible();

  // Locked without the HM.
  await tap('ArrowUp');
  await expect(text).toContainText('pattern lock');
  for (let i = 0; i < 4 && (await text.count()); i++) await text.click();

  // The old man, up by the gym: five questions, any answers.
  await walk('ArrowRight', 22, 11);
  await walk('ArrowUp', 22, 8);
  await walk('ArrowLeft', 21, 8);
  await tap('ArrowUp');
  await page.keyboard.press('z');
  for (let asked = 0; asked < 5;) {
    if (await page.getByText(/QUESTION \d OF 5/).count()) {
      await page.getByRole('button', { name: asked % 2 ? 'NO' : 'YES' }).click();
      asked++;
    } else await text.click();
  }
  await expect(text).toContainText('OLD MAN:');
  for (let i = 0; i < 30 && !(await text.filter({ hasText: 'DONKEY BRAINS' }).count()); i++)
    await text.click();
  for (let i = 0; i < 12 && (await text.count()); i++) await text.click();
  await expect(text).toHaveCount(0);

  // Now the door opens.
  await walk('ArrowRight', 22, 8);
  await walk('ArrowDown', 22, 11);
  await walk('ArrowLeft', 19, 11);
  await tap('ArrowUp');
  await expect(world).toHaveAttribute('aria-label', /Semple Stadium gym/);
  await expect(text).toContainText('You used HM NEURODIVERGENT!');
});

test('story mode: the Town Map opens from START and from the place name', async ({ page }) => {
  await unlock(page);
  await page.goto('/story');
  await page.getByTestId('trainer-name').fill('Mapper');
  await page.getByRole('button', { name: 'NEW GAME' }).click();
  const text = page.getByTestId('story-text');
  for (let i = 0; i < 6 && (await text.count()); i++) await text.click();
  await expect(text).toHaveCount(0);

  await page.getByRole('button', { name: 'START' }).click();
  await page.getByRole('button', { name: 'MAP', exact: true }).click();
  await expect(page.getByTestId('town-map')).toBeVisible();
  await expect(page.getByTestId('stop-clare')).toHaveAttribute('data-visited', 'true');
  await expect(page.getByTestId('stop-dublin')).toHaveAttribute('data-visited', 'false');
  await expect(page.getByTestId('town-info')).toContainText('Newmarket-on-Fergus (you)');
  await page.getByRole('button', { name: 'Next town' }).click();
  await expect(page.getByTestId('town-info')).toContainText('Limerick City');
  await expect(page.getByTestId('town-info')).toContainText('Not visited yet');
  await page.getByRole('button', { name: 'BACK' }).click();
  await expect(page.getByTestId('town-map')).toHaveCount(0);

  await page.getByTestId('place').click();
  await expect(page.getByTestId('town-map')).toBeVisible();
});
