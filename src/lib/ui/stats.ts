import type { BaseStats } from '../battle/creature';
import type { Category } from '../battle/moves';

/**
 * One line on what each stat does, for the Ranedex and the guide. Spirit is the one players ask
 * about: it is both the attack stat for Spirit moves and the guard against them (engine.ts's
 * computeDamage), so raising it helps both ways and lowering a foe's does too.
 */
export const STAT_HELP: Record<keyof BaseStats, string> = {
  hp: 'How much it can take before it faints.',
  attack: 'How hard its Physical moves hit.',
  defense: 'How well it takes Physical hits.',
  spirit: 'How hard its Spirit moves hit, and how well it takes Spirit hits.',
  speed: 'Whoever is faster moves first.',
};

/** What a move's category means for the damage it does, shown with the move. */
export const CATEGORY_HELP: Record<Category, string> = {
  physical: 'Physical move: its Attack against the foe’s Defense.',
  spirit: 'Spirit move: its Spirit against the foe’s Spirit.',
  status: 'Status move: does no damage.',
};
