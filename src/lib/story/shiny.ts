import type { Creature } from '../battle/creature';

/**
 * Shiny Ranemon: a rare golden palette, rolled once for every wild Ranemon you meet. The chance
 * is 1 in SHINY_ODDS, so a whole playthrough (about 150 wild battles) finds one less often
 * than not. Raise it to make shinies rarer, lower it to make them commoner.
 */
export const SHINY_ODDS = 256;

/** Whether a wild Ranemon is shiny, from a random number in [0, 1). */
export const rollShiny = (random: number, odds: number = SHINY_ODDS) => random < 1 / odds;

/** The chance of meeting at least one shiny in a number of wild encounters. */
export const shinyChance = (encounters: number, odds: number = SHINY_ODDS) =>
  1 - (1 - 1 / odds) ** encounters;

/** Every sprite's shiny version sits at the same path under /sprites/shiny/. */
export const shinySprite = (sprite: string) => sprite.replace(/^\/sprites\//, '/sprites/shiny/');

/** A creature in its shiny palette. */
export function shinyForm(c: Creature): Creature {
  return {
    ...c,
    shiny: true,
    sprite: c.sprite && shinySprite(c.sprite),
    backSprite: c.backSprite && shinySprite(c.backSprite),
  };
}

/** The star shown next to a shiny's name everywhere it appears. */
export const SHINY_STAR = '★';
