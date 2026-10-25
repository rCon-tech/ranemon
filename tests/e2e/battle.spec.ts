import { expect, test, type Page } from '@playwright/test';
import { THREE_D } from '../../src/lib/view';
import { unlock } from './helpers';

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
      // Every damaging move says how it does against the foe.
      await expect(moves.locator('.matchup').first()).toHaveText(/SUPER|NORMAL|WEAK/);
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

test('the game asks for the password once per browser', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('password').fill('wrong');
  await page.getByRole('button', { name: 'ENTER' }).click();
  await expect(page.getByText('That’s not it.')).toBeVisible();
  await page.getByTestId('password').fill('Ranelads');
  await page.getByRole('button', { name: 'ENTER' }).click();
  await expect(page.getByRole('heading', { name: 'RANEMON' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'STORY MODE' })).toBeVisible();
});

test('battle mode: London and evolved rosters, and a pick’s look, item and moves', async ({
  page,
}) => {
  await unlock(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'BATTLE MODE' }).click();
  // Britain's Ranemon stay a surprise until a story save has been there.
  const rosters = page.getByRole('group', { name: 'Roster' });
  await expect(rosters.getByRole('button', { name: '🔒 ???' })).toHaveCount(2);
  await page.getByRole('region', { name: 'Your roster' }).getByRole('button').first().click();
  await page.getByTestId('team-pick').first().click();
  await expect(
    page.getByRole('group', { name: 'Look' }).getByRole('button', { name: /UK/ }),
  ).toHaveCount(0);

  await page.evaluate(() =>
    localStorage.setItem(
      'ranemon.story.v1:abroad',
      JSON.stringify({
        version: 1,
        map: 'clare',
        x: 5,
        y: 5,
        face: 'down',
        party: [],
        box: [],
        bag: {},
        money: 0,
        flags: ['starter'],
        seen: [],
        caught: [],
        ukSeen: ['carlmon'],
        pub: { map: 'clare', x: 5, y: 5 },
        uid: 1,
        steps: 0,
      }),
    ),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'BATTLE MODE' }).click();
  const roster = page.getByRole('region', { name: 'Your roster' }).getByRole('button');
  await page.getByRole('group', { name: 'Roster' }).getByRole('button', { name: 'LONDON' }).click();
  await expect(roster.first()).toContainText('Golpeak');
  await page
    .getByRole('group', { name: 'Roster' })
    .getByRole('button', { name: 'EVERYONE' })
    .click();
  await page.getByRole('group', { name: 'Forms' }).getByRole('button', { name: 'EVOLVED' }).click();
  await expect(roster.first()).toContainText('Carlizard');
  await expect(roster.last()).toContainText('Aerodactivist');

  // Killemon's line: Killigatr or Cholokill.
  await roster.filter({ hasText: 'Killigatr' }).click();
  await page.getByTestId('team-pick').first().click();
  const editor = page.getByTestId('pick-editor');
  await editor
    .getByRole('group', { name: 'Form' })
    .getByRole('button', { name: /Cholokill/ })
    .click();
  await expect(page.getByTestId('team-pick').first()).toContainText('Cholokill');
  await editor.getByRole('group', { name: 'Look' }).getByRole('button', { name: /UK/ }).click();
  await expect(editor.getByRole('img', { name: 'Cholokill' }).first()).toHaveAttribute(
    'src',
    /drawn\/cholokill/,
  );
  await editor
    .getByRole('group', { name: 'Held item' })
    .getByRole('button', { name: /Xanax/ })
    .click();
  await expect(page.getByTestId('team-pick').first()).toContainText('Holds Xanax');
  // Swap a move for a spare one.
  const cards = editor.getByTestId('move-card');
  const before = await cards.nth(1).innerText();
  await cards.nth(1).click();
  await cards.nth(4).click();
  await expect(cards.nth(1)).not.toHaveText(before);

  for (let i = 0; i < 6; i++) await roster.nth(i).click();
  await page.getByRole('button', { name: /BATTLE!/ }).click();
  await expect(page.getByRole('button', { name: 'FIGHT' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('info-you')).toContainText('Cholokill');
});

test('pick 6 of the 20, then a full 6v6 battle against the CPU', async ({ page }) => {
  await unlock(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'RANEMON' })).toBeVisible();
  await expect(page.getByText('Record: 0W · 0L')).toBeVisible();
  await page.getByRole('button', { name: 'BATTLE MODE' }).click();

  const roster = page.getByRole('region', { name: 'Your roster' }).getByRole('button');
  await expect(roster).toHaveCount(20);
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

  if (THREE_D) {
    // The 3D look swaps in a 3D battlefield behind the same sprites, and back again.
    await page.getByTestId('view').click();
    await expect(page.locator('.backdrop[data-view="3d"] canvas')).toBeVisible();
    await page.getByTestId('view').click();
    await expect(page.locator('.backdrop[data-view="3d"]')).toHaveCount(0);
  } else {
    // The 3D look is switched off for now: no button to pick it.
    await expect(page.getByTestId('view')).toHaveCount(0);
  }

  await playToTheEnd(page);
  const ending = await page.getByTestId('text-box').textContent();
  expect(ending).toMatch(/You won the battle!|You lost the battle…|draw/);
  await page.getByRole('button', { name: 'CONTINUE' }).click();

  // The result lands on the record.
  await expect(page.getByText(/Record: [01]W · [01]L/)).toBeVisible();
  await expect(page.getByText('Record: 0W · 0L')).toHaveCount(ending?.includes('draw') ? 1 : 0);
});

test('the Ranedex lists all 20 Ranemon with their photo sprites', async ({ page }) => {
  await unlock(page);
  await page.goto('/ranedex');
  await expect(page.getByRole('heading', { name: 'RANEDEX' })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'No.' })).toHaveCount(20);
  // The first is the usual look; a second look sits beside it.
  const sprite = page.getByRole('img', { name: 'Steadmon' }).first();
  await expect(sprite).toBeVisible();
  // The full-colour pixel versions: 96 pixels, cut down to 32 colours.
  expect(await sprite.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(96);

  // Each one opens to a page of its own; the arrow keys flip through them, Escape goes back.
  await page.getByRole('link', { name: /Steadmon/ }).click();
  await expect(page.getByTestId('dex-entry')).toHaveAttribute('data-id', 'steadmon');
  await expect(page.getByText('BATTLE MODE MOVES')).toBeVisible();
  await expect(page.getByText('★ Ranelads.com').first()).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/\/ranedex\/enda/);
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/ranedex\/?$/);
});

test('how to play: the guide explains the game and shows the type chart', async ({ page }) => {
  await unlock(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'HOW TO PLAY' }).click();
  await expect(page.getByRole('heading', { name: 'HOW TO PLAY' })).toBeVisible();
  const chart = page.getByTestId('type-chart');
  await expect(chart.locator('tbody tr')).toHaveCount(9);
  // Each type hits three types for 2× and three for ½.
  await expect(chart.locator('td', { hasText: '2×' })).toHaveCount(27);
  await expect(chart.locator('td', { hasText: '½' })).toHaveCount(27);
});

test('updates: the title shows NEW until you’ve read the Updates screen', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ranemon.unlocked', '1'));
  await page.goto('/');
  const link = page.getByTestId('updates-link');
  await expect(link).toContainText('NEW');
  await link.click();
  await expect(page.getByRole('heading', { name: 'UPDATES' })).toBeVisible();
  expect(await page.getByTestId('update-day').count()).toBeGreaterThan(0);
  await page.getByRole('link', { name: 'BACK' }).click();
  await expect(page.getByTestId('updates-link')).not.toContainText('NEW');
});

test('sound: the sound test plays music once tapped, and ♪ turns it off', async ({ page }) => {
  await unlock(page);
  // Count the chip's notes as they start.
  await page.addInitScript(() => {
    const w = window as unknown as { notes: number };
    w.notes = 0;
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args) {
      w.notes++;
      return start.apply(this, args);
    };
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('link', { name: 'SOUND TEST' }).click();
  await expect(page.getByRole('heading', { name: 'SOUND TEST' })).toBeVisible();
  const notes = () => page.evaluate(() => (window as unknown as { notes: number }).notes);
  await page.getByRole('button', { name: /Wild Ranemon/ }).click();
  await expect(page.getByRole('button', { name: /Wild Ranemon/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect.poll(notes).toBeGreaterThan(20);

  const sound = page.getByTestId('sound');
  await expect(sound).toHaveText('♪');
  await sound.click();
  await expect(sound).toHaveText('♪ FX');
  await sound.click();
  await expect(sound).toHaveText('♪ OFF');
  expect(await page.evaluate(() => localStorage.getItem('ranemon.sound'))).toBe('off');
  // Off means silence: nothing new starts.
  await page.waitForTimeout(300);
  const before = await notes();
  await page.getByRole('button', { name: 'HIT-SUPER' }).click();
  await page.waitForTimeout(500);
  expect(await notes()).toBe(before);
  expect(errors).toEqual([]);
});
