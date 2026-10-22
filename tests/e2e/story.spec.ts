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
  await page.getByRole('button', { name: /Endamon/ }).click();
  await page.getByRole('button', { name: 'CHOOSE ENDAMON' }).click();
  await expect(text).toContainText('You chose Endamon!');
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

test('story mode in 3D: walks into the house just like 2D', async ({ page }) => {
  await unlock(page);
  await page.addInitScript(() => {
    localStorage.setItem('ranemon.view', '3d');
    if (localStorage.getItem('ranemon.story.v1:solid')) return;
    // Standing at the front door of home, after Michael D.
    localStorage.setItem(
      'ranemon.story.v1:solid',
      JSON.stringify({
        version: 1,
        map: 'clare',
        x: 2,
        y: 3,
        face: 'up',
        party: [
          {
            uid: 1,
            species: 'enda',
            level: 5,
            exp: 125,
            hp: 20,
            pp: [10],
            status: null,
            moves: ['fierce-friendship'],
          },
        ],
        box: [],
        bag: {},
        money: 3000,
        flags: ['starter'],
        seen: [],
        caught: [],
        pub: { map: 'clare', x: 2, y: 3 },
        uid: 2,
        steps: 0,
      }),
    );
  });
  await page.goto('/story');
  await page.getByTestId('trainer-name').fill('Solid');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  const world = page.getByTestId('overworld');
  await expect(world).toHaveAttribute('data-view', '3d');

  // Software graphics on CI draw slowly, so hold the key until the door opens rather than tapping.
  await page.keyboard.down('ArrowUp');
  await expect(world).toHaveAttribute('aria-label', /^Home,/, { timeout: 30_000 });
  await page.keyboard.up('ArrowUp');
  await expect(world).toHaveAttribute('data-view', '3d');

  // Back to 2D in the middle of the game: the same room, the same spot.
  const x = await world.getAttribute('data-x');
  const y = await world.getAttribute('data-y');
  await page.getByTestId('view').click();
  await expect(world).toHaveAttribute('data-view', '2d');
  await expect(world).toHaveAttribute('aria-label', /^Home,/);
  await expect(world).toHaveAttribute('data-x', x!);
  await expect(world).toHaveAttribute('data-y', y!);
});

test('story mode: Sibeal in Limerick lends you Norm', async ({ page }) => {
  await unlock(page);
  await page.addInitScript(() => {
    if (localStorage.getItem('ranemon.story.v1:norm')) return;
    // On the road in Limerick, just below Sibeal.
    localStorage.setItem(
      'ranemon.story.v1:norm',
      JSON.stringify({
        version: 1,
        map: 'limerick',
        x: 9,
        y: 13,
        face: 'up',
        party: [
          {
            uid: 1,
            species: 'enda',
            level: 12,
            exp: 2000,
            hp: 40,
            pp: [10],
            status: null,
            moves: ['fierce-friendship'],
          },
        ],
        box: [],
        bag: {},
        money: 3000,
        flags: ['starter', 'visited:limerick', 'jersey:clare'],
        seen: [],
        caught: [],
        pub: { map: 'limerick', x: 2, y: 12 },
        uid: 2,
        steps: 0,
      }),
    );
  });
  await page.goto('/story');
  await page.getByTestId('trainer-name').fill('Norm');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  const text = page.getByTestId('story-text');
  await expect(page.getByTestId('overworld')).toBeVisible();
  await page.waitForTimeout(400);
  await page.keyboard.press('z');
  await expect(text).toContainText('SIBEAL');
  for (let i = 0; i < 8 && !(await page.getByRole('button', { name: 'YES' }).count()); i++) {
    await text.click();
    await page.waitForTimeout(100);
  }
  await page.getByRole('button', { name: 'YES' }).click();
  await expect(text).toContainText('McGrattans');
  for (let i = 0; i < 6 && (await text.count()); i++) await text.click();
  await expect(text).toHaveCount(0);

  const save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ranemon.story.v1:norm')!),
  );
  expect(save.flags).toContain('norm:with-you');
  expect(save.party).toHaveLength(1);
});

test('story mode: the Limepass fast travels to a town you’ve been to', async ({ page }) => {
  await unlock(page);
  await page.addInitScript(() => {
    if (localStorage.getItem('ranemon.story.v1:lime')) return;
    localStorage.setItem(
      'ranemon.story.v1:lime',
      JSON.stringify({
        version: 1,
        map: 'clare',
        x: 2,
        y: 3,
        face: 'down',
        party: [
          {
            uid: 1,
            species: 'enda',
            level: 12,
            exp: 2000,
            hp: 40,
            pp: [10],
            status: null,
            moves: ['fierce-friendship'],
          },
        ],
        box: [],
        bag: {},
        money: 3000,
        flags: ['starter', 'visited:clare', 'visited:limerick', 'limepass'],
        seen: [],
        caught: [],
        pub: { map: 'clare', x: 2, y: 3 },
        uid: 2,
        steps: 0,
      }),
    );
  });
  await page.goto('/story');
  await page.getByTestId('trainer-name').fill('Lime');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  await expect(page.getByTestId('overworld')).toBeVisible();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'LIMEPASS' }).click();
  await expect(page.getByTestId('lime-clare')).toBeDisabled();
  await page.getByTestId('lime-limerick').click();
  await expect(page.getByTestId('story-text')).toContainText('zip over to Limerick');
  await expect(page.getByTestId('place')).toContainText('Limerick');
});

/** A save with a few Ranemon seen and one befriended, standing at home in Clare. */
const dexSave = () => ({
  version: 1,
  map: 'clare',
  x: 2,
  y: 3,
  face: 'up',
  party: [
    {
      uid: 1,
      species: 'olliemon',
      level: 20,
      exp: 8000,
      hp: 60,
      pp: [10],
      status: null,
      moves: ['fend-off'],
    },
  ],
  box: [],
  bag: {},
  money: 3000,
  flags: ['starter', 'visited:clare'],
  seen: ['enda', 'clefenda', 'olliemon'],
  caught: ['olliemon'],
  pub: { map: 'clare', x: 2, y: 3 },
  uid: 2,
  steps: 0,
});

for (const view of ['2d', '3d'] as const) {
  test(`story mode in ${view.toUpperCase()}: a Ranedex page for each Ranemon you've seen`, async ({
    page,
  }) => {
    await unlock(page);
    await page.addInitScript(
      ([v, raw]) => {
        localStorage.setItem('ranemon.view', v);
        if (!localStorage.getItem('ranemon.story.v1:dexter'))
          localStorage.setItem('ranemon.story.v1:dexter', raw);
      },
      [view, JSON.stringify(dexSave())] as const,
    );
    await page.goto('/story');
    await page.getByTestId('trainer-name').fill('Dexter');
    await page.getByRole('button', { name: 'CONTINUE' }).click();
    await expect(page.getByTestId('overworld')).toHaveAttribute('data-view', view);

    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'RANEDEX' }).click();
    // Unseen Ranemon can't be opened.
    await expect(page.getByRole('button', { name: 'No.001 unknown' })).toBeDisabled();

    // The D-pad moves the cursor and A opens the page: two rows down is Olliemon.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('z');
    const entry = page.getByTestId('dex-entry');
    await expect(entry).toHaveAttribute('data-id', 'olliemon');
    await expect(entry).toContainText('BASE STATS');
    // His second special move is learnt later on, so it isn't given away.
    await expect(entry).toContainText('??? · learnt later on');
    await expect(entry).not.toContainText('Know Your Sport');
    // A flips to his other look.
    await page.keyboard.press('z');
    await expect(page.getByRole('button', { name: 'Tricolour' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    if (view === '3d') await expect(entry.locator('canvas')).toHaveCount(1);

    // ◀ goes to the last Ranemon seen before him: Clefenda, seen but not befriended.
    await page.keyboard.press('ArrowLeft');
    await expect(entry).toHaveAttribute('data-id', 'clefenda');
    await expect(entry).toContainText('Befriend one to fill in the rest');
    await expect(entry).not.toContainText('BASE STATS');
    // Its evolution line opens Endamon's page with a tap.
    await entry.getByRole('button', { name: /Endamon/ }).click();
    await expect(entry).toHaveAttribute('data-id', 'enda');
    await expect(entry).toContainText('Newmarket-on-Fergus, Co. Clare');
    await expect(entry).toContainText('?????');

    // B goes back to the list, and B again closes the Ranedex.
    await page.keyboard.press('x');
    await expect(entry).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'No.005 Endamon' })).toBeVisible();
    await page.keyboard.press('x');
    await expect(page.getByRole('button', { name: 'No.005 Endamon' })).toHaveCount(0);
  });
}

test('story mode: the missing rent starts with Ollie, in the house by the river', async ({
  page,
}) => {
  await unlock(page);
  await page.addInitScript(() => {
    if (localStorage.getItem('ranemon.story.v1:rent')) return;
    // On the path in Dublin, just below the house by the river.
    localStorage.setItem(
      'ranemon.story.v1:rent',
      JSON.stringify({
        version: 1,
        map: 'dublin',
        x: 17,
        y: 13,
        face: 'up',
        party: [
          {
            uid: 1,
            species: 'enda',
            level: 45,
            exp: 100000,
            hp: 150,
            pp: [10],
            status: null,
            moves: ['fierce-friendship'],
          },
        ],
        box: [],
        bag: {},
        money: 3000,
        flags: ['starter', 'visited:dublin', 'jersey:kildare'],
        seen: [],
        caught: [],
        pub: { map: 'dublin', x: 4, y: 11 },
        uid: 2,
        steps: 0,
      }),
    );
  });
  await page.goto('/story');
  await page.getByTestId('trainer-name').fill('Rent');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  const world = page.getByTestId('overworld');
  const text = page.getByTestId('story-text');
  await expect(world).toBeVisible();
  await page.waitForTimeout(400);

  await page.keyboard.down('ArrowUp');
  await expect(world).toHaveAttribute('aria-label', /^A house, Dublin City/, { timeout: 10_000 });
  await page.keyboard.up('ArrowUp');
  await expect(text).toContainText('French');
  for (let i = 0; i < 4 && (await text.count()); i++) {
    await text.click();
    await page.waitForTimeout(100);
  }
  await expect(text).toHaveCount(0);

  // Round the table to Ollie.
  const walk = async (key: string, n: number) => {
    for (let i = 0; i < n; i++) {
      await page.keyboard.press(key);
      await page.waitForTimeout(250);
    }
  };
  await walk('ArrowLeft', 1);
  await walk('ArrowUp', 4);
  await page.keyboard.press('z');
  await expect(text).toContainText('OLLIE');
  for (let i = 0; i < 8 && (await text.count()); i++) {
    await text.click();
    await page.waitForTimeout(100);
  }
  const save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ranemon.story.v1:rent')!),
  );
  expect(save.flags).toContain('rent:start');
});

test('story mode: Alex Simonin in Trinity only ever says the one thing', async ({ page }) => {
  await unlock(page);
  await page.addInitScript(() => {
    if (localStorage.getItem('ranemon.story.v1:alex')) return;
    // In Front Square, just below the path up to the Long Room.
    localStorage.setItem(
      'ranemon.story.v1:alex',
      JSON.stringify({
        version: 1,
        map: 'trinity',
        x: 5,
        y: 7,
        face: 'up',
        party: [
          {
            uid: 1,
            species: 'enda',
            level: 45,
            exp: 100000,
            hp: 150,
            pp: [10],
            status: null,
            moves: ['fierce-friendship'],
          },
        ],
        box: [],
        bag: {},
        money: 3000,
        flags: ['starter', 'visited:trinity', 'jersey:all'],
        seen: [],
        caught: [],
        pub: { map: 'dublin', x: 4, y: 11 },
        uid: 2,
        steps: 0,
      }),
    );
  });
  await page.goto('/story');
  await page.getByTestId('trainer-name').fill('Alex');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  const world = page.getByTestId('overworld');
  const text = page.getByTestId('story-text');
  await expect(world).toBeVisible();
  await page.waitForTimeout(400);

  // One step up the path and he sees you.
  await page.keyboard.press('ArrowUp');
  await expect(text).toHaveText(/ALEX SIMONIN: How do we always end up here\?/, {
    timeout: 10_000,
  });
  await text.click();
  await page.waitForTimeout(300);
  if (await text.count()) await text.click();
  const box = page.getByTestId('text-box');
  await expect(box).toContainText('Alex Simonin sent out Weezimo!', { timeout: 15_000 });
  await expect(box).toContainText('ALEX SIMONIN: How do we always end up here?', {
    timeout: 15_000,
  });
});

test('story mode: a ticket from Connolly Station to Greystones, where Kill has a complaint', async ({
  page,
}) => {
  await unlock(page);
  await page.addInitScript(() => {
    if (localStorage.getItem('ranemon.story.v1:dart')) return;
    // In Dublin, just below the door of Connolly Station.
    localStorage.setItem(
      'ranemon.story.v1:dart',
      JSON.stringify({
        version: 1,
        map: 'dublin',
        x: 5,
        y: 14,
        face: 'up',
        party: [
          {
            uid: 1,
            species: 'conemon',
            level: 50,
            exp: 125000,
            hp: 170,
            pp: [10],
            status: null,
            moves: ['try-hard'],
          },
        ],
        box: [],
        bag: {},
        money: 3000,
        flags: ['starter', 'visited:dublin', 'jersey:kildare'],
        seen: [],
        caught: [],
        pub: { map: 'dublin', x: 4, y: 11 },
        uid: 2,
        steps: 0,
      }),
    );
  });
  await page.goto('/story');
  await page.getByTestId('trainer-name').fill('Dart');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  const world = page.getByTestId('overworld');
  const text = page.getByTestId('story-text');
  await expect(world).toBeVisible();
  await page.waitForTimeout(400);
  const dismiss = async () => {
    for (let i = 0; i < 12 && (await text.count()); i++) {
      await text.click();
      await page.waitForTimeout(100);
    }
    await expect(text).toHaveCount(0);
  };
  const walk = async (key: string, n: number) => {
    for (let i = 0; i < n; i++) {
      await page.keyboard.press(key);
      await page.waitForTimeout(250);
    }
  };

  await page.keyboard.down('ArrowUp');
  await expect(world).toHaveAttribute('aria-label', /^Connolly Station, Dublin City/, {
    timeout: 10_000,
  });
  await page.keyboard.up('ArrowUp');
  await expect(text).toContainText('CONNOLLY STATION');
  await dismiss();

  // Over to the ticket desk, and the clerk shows the departures board.
  await walk('ArrowLeft', 2);
  await walk('ArrowUp', 1);
  await page.keyboard.press('z');
  await expect(text).toContainText('CLERK');
  await dismiss();
  await expect(page.getByTestId('departure-belfast')).toBeDisabled();
  await page.getByTestId('departure-greystones').click();
  // The ride down the coast, then Greystones.
  await dismiss();
  await expect(world).toHaveAttribute('aria-label', /^Greystones, Co\. Wicklow/, {
    timeout: 15_000,
  });

  // Along the road and up to Kill, who isn't happy about the twins.
  await walk('ArrowRight', 5);
  await walk('ArrowUp', 1);
  await page.waitForTimeout(400);
  await page.keyboard.press('z');
  await expect(text).toContainText('KILL');
  await dismiss();
  const save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ranemon.story.v1:dart')!),
  );
  expect(save.map).toBe('greystones');
  expect(save.flags).toContain('greystones:heard');
});

test('story mode: Jamie Boyde on the concourse at Connolly has a question', async ({ page }) => {
  await unlock(page);
  await page.addInitScript(() => {
    if (localStorage.getItem('ranemon.story.v1:jamie')) return;
    // On the concourse at Connolly, just left of him.
    localStorage.setItem(
      'ranemon.story.v1:jamie',
      JSON.stringify({
        version: 1,
        map: 'dublin-L2',
        x: 6,
        y: 5,
        face: 'right',
        party: [
          {
            uid: 1,
            species: 'conemon',
            level: 50,
            exp: 125000,
            hp: 170,
            pp: [10],
            status: null,
            moves: ['try-hard'],
          },
        ],
        box: [],
        bag: {},
        money: 3000,
        flags: ['starter', 'visited:dublin'],
        seen: [],
        caught: [],
        pub: { map: 'dublin', x: 4, y: 11 },
        uid: 2,
        steps: 0,
      }),
    );
  });
  await page.goto('/story');
  await page.getByTestId('trainer-name').fill('Jamie');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  const world = page.getByTestId('overworld');
  const text = page.getByTestId('story-text');
  await expect(world).toHaveAttribute('aria-label', /^Connolly Station, Dublin City/);
  await page.waitForTimeout(400);
  for (let i = 0; i < 12 && (await text.count()); i++) {
    await text.click();
    await page.waitForTimeout(100);
  }

  // A yes or no question comes up in a box of its own.
  const no = page.getByRole('button', { name: 'NO', exact: true });
  await page.keyboard.press('z');
  await expect(page.getByText('Should I put this pill in my ass?')).toBeVisible();
  await no.click();
  await expect(text).toContainText('The ear, so?');
  for (let i = 0; i < 4 && (await text.count()); i++) {
    await text.click();
    await page.waitForTimeout(100);
  }
  await expect(text).toHaveCount(0);
  await expect(world).toHaveAttribute('aria-label', /^Connolly Station, Dublin City/);
});

test('story mode: Paul Mescal is sad, loses, says look over there and runs off', async ({
  page,
}) => {
  await unlock(page);
  await page.addInitScript(() => {
    if (localStorage.getItem('ranemon.story.v1:paul')) return;
    // Down past Temple Bar, a few steps along the street from him.
    localStorage.setItem(
      'ranemon.story.v1:paul',
      JSON.stringify({
        version: 1,
        map: 'dublin',
        x: 11,
        y: 13,
        face: 'right',
        party: [
          {
            uid: 1,
            species: 'enda',
            level: 100,
            exp: 1000000,
            hp: 400,
            pp: [10],
            status: null,
            moves: ['fierce-friendship'],
          },
        ],
        box: [],
        bag: {},
        money: 3000,
        flags: ['starter', 'visited:dublin'],
        seen: [],
        caught: [],
        pub: { map: 'dublin', x: 4, y: 11 },
        uid: 2,
        steps: 0,
      }),
    );
  });
  await page.goto('/story');
  await page.getByTestId('trainer-name').fill('Paul');
  await page.getByRole('button', { name: 'CONTINUE' }).click();
  const world = page.getByTestId('overworld');
  const text = page.getByTestId('story-text');
  await expect(world).toBeVisible();
  await page.waitForTimeout(400);

  // One step right and he sees you.
  await page.keyboard.press('ArrowRight');
  await expect(text).toContainText('Academy Award nominated', { timeout: 10_000 });
  await expect(text).toContainText('really, really sad', { timeout: 10_000 });
  for (let i = 0; i < 4 && (await text.count()); i++) await text.click();

  // The battle: always the first move.
  const fight = page.getByRole('button', { name: 'FIGHT' });
  const proceed = page.getByRole('button', { name: 'CONTINUE' });
  await expect(page.getByTestId('text-box')).toContainText('Paul Mescal sent out', {
    timeout: 15_000,
  });
  for (let i = 0; i < 400 && !(await proceed.isVisible()); i++) {
    if (await fight.isVisible()) {
      await fight.click();
      await page
        .getByRole('group', { name: 'Moves' })
        .getByRole('button', { disabled: false })
        .first()
        .click();
      await page.getByRole('button', { name: /^USE / }).click();
    } else if (await page.getByTestId('text-box').isVisible()) {
      await page.getByTestId('text-box').click();
    }
  }
  await proceed.click();

  // Sadder still, then off he runs.
  for (let i = 0; i < 20 && !/Look over there!/.test((await text.textContent()) ?? ''); i++) {
    await text.click();
    await page.waitForTimeout(150);
  }
  await expect(text).toContainText('even sadder');
  // Tap until the line moves on: once to finish typing it, once more to go on.
  for (let i = 0; i < 4 && /Look over there!/.test((await text.textContent()) ?? ''); i++) {
    await text.click();
    await page.waitForTimeout(200);
  }
  await expect(text).toHaveText(/There’s nothing over there\. Paul Mescal is gone\./, {
    timeout: 10_000,
  });
  for (let i = 0; i < 4 && (await text.count()); i++) await text.click();
  await expect(text).toHaveCount(0);

  const save = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ranemon.story.v1:paul')!),
  );
  expect(save.flags).toContain('beat:dublin-mescal');
  expect(save.flags).toContain('mescal:gone');
  // He's gone: you can walk on to where he stood.
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
  }
  await expect(world).toHaveAttribute('data-x', '15', { timeout: 5_000 });
  await expect(world).toHaveAttribute('data-y', '13');
});
