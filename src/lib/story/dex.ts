import type { Creature } from '../battle/creature';
import { evolutionOf, formById, ITEM_EVOLUTIONS, lineOf } from '../battle/evolutions';
import { LEGEND } from '../battle/legend';
import { moveById, type Move } from '../battle/moves';
import { secondSpecialOf } from '../battle/second-specials';
import { effectiveness, TYPES, typeMultiplier, type RaneType } from '../battle/types';
import { variantForm, variantsOf, CLASSIC } from '../battle/variants';
import { MAPS } from '@/content/story/maps';
import { itemById, type ItemId } from './items';
import { learnedOf, learnset } from './party';
import { shinyForm, SHINY_STAR } from './shiny';
import { hasFlag, type StoryState } from './state';

/**
 * A Ranedex page: everything there is to know about one Ranemon, and how much of it you've found
 * out. Battle mode knows everything; story mode shows only what you've come across, so a page
 * never gives away a Ranemon, a move or a place before the story gets there.
 */
export interface DexKnowledge {
  seen: (id: string) => boolean;
  /** Befriended: its entry, stats and moves are filled in. */
  caught: (id: string) => boolean;
  /** Whether a move that's learnt late in the story is known yet. */
  knowsMove: (id: string) => boolean;
  /** Whether a place is named in "where it's found"; null leaves the section out. */
  visited: ((map: string) => boolean) | null;
  /** Whether its shiny palette is shown. */
  shiny: (id: string) => boolean;
}

/** Battle mode's Ranedex: everything, with no story places. */
export const KNOW_ALL: DexKnowledge = {
  seen: () => true,
  caught: () => true,
  knowsMove: () => true,
  visited: null,
  shiny: () => true,
};

/** What a story save has come across. */
export function storyKnowledge(game: StoryState): DexKnowledge {
  const members = [...game.party, ...game.box];
  const learned = new Set(members.flatMap(learnedOf));
  const shinies = new Set(members.filter((m) => m.shiny).map((m) => m.species));
  return {
    seen: (id) => game.seen.includes(id),
    caught: (id) => game.caught.includes(id),
    knowsMove: (id) => learned.has(id),
    visited: (map) => hasFlag(game, `visited:${map}`),
    shiny: (id) => shinies.has(id),
  };
}

/** The pictures a page can flip through: each look, then each in its shiny palette. */
export function looksOf(c: Creature, shiny: boolean): { label: string; creature: Creature }[] {
  const plain = [
    { label: CLASSIC, creature: c },
    ...variantsOf(c.id).map((v) => ({ label: v.label, creature: variantForm(c, v.id) })),
  ];
  if (!shiny) return plain;
  return [
    ...plain,
    ...plain.map((l) => ({ label: `${SHINY_STAR}${l.label}`, creature: shinyForm(l.creature) })),
  ];
}

/** One step of an evolution line: the form, and how it's reached from the one before. */
export interface Stage {
  creature: Creature;
  /** Undefined for the first form. */
  how?: string;
}

/** A line's first form and every form it can evolve into. */
export function evolutionLine(id: string): { first: Creature; branches: Stage[] } {
  const first = formById(lineOf(id));
  const branches: Stage[] = [];
  const evo = evolutionOf(first.id);
  if (evo) {
    const partner = evo.partner && formById(evo.partner).name;
    branches.push({
      creature: formById(evo.id),
      how: `Lv${evo.level}${partner ? ` with a ${partner} in the party` : ''}`,
    });
  }
  for (const e of ITEM_EVOLUTIONS.filter((e) => e.from === first.id))
    branches.push({ creature: formById(e.id), how: `Given a ${itemById(e.item as ItemId).name}` });
  return { first, branches };
}

/** A move on a page, with the level it's learnt at in story mode. */
export interface DexMove {
  move: Move;
  /** Undefined for battle mode's four. */
  level?: number;
  /** Learnt late in the story and not known yet: shown as ??? until it is. */
  hidden: boolean;
}

/** Every move a form learns in story mode, in order, with late ones hidden until known. */
export function dexMoves(c: Creature, know: DexKnowledge): DexMove[] {
  const late = secondSpecialOf(lineOf(c.id))?.id;
  return learnset(c).map(({ level, move }) => ({
    move: moveById(move),
    level,
    hidden: move === late && !know.knowsMove(move),
  }));
}

/** The types a move's type hits for double, or none for a status move. */
export function strongAgainst(move: Move): RaneType[] {
  if (move.type === null || move.category === 'status') return [];
  return TYPES.filter((t) => typeMultiplier(move.type!, t) >= 2);
}

/** Attacking types that hit these types for double or more, and those that hit for half or less. */
export function matchups(types: readonly RaneType[]): { weak: RaneType[]; resists: RaneType[] } {
  return {
    weak: TYPES.filter((t) => effectiveness(t, types) >= 2),
    resists: TYPES.filter((t) => effectiveness(t, types) <= 0.5),
  };
}

/** A place a form turns up in the long grass, and at what levels. */
export interface Habitat {
  map: string;
  name: string;
  min: number;
  max: number;
}

/**
 * Where a form is met in the wild: wherever its line's first form is in the grass at levels it
 * would be this form. Item evolutions and the legend are never wild.
 */
export function habitats(id: string): Habitat[] {
  if (id === LEGEND.id) return [];
  const base = lineOf(id);
  const evo = evolutionOf(base);
  const evolved = id !== base;
  if (evolved && evo?.id !== id) return [];
  return MAPS.flatMap((map) => {
    if (!map.wild?.table.some(([s]) => s === base)) return [];
    let { min, max } = map.wild;
    if (evo && evolved) min = Math.max(min, evo.level);
    if (evo && !evolved) max = Math.min(max, evo.level - 1);
    return min <= max ? [{ map: map.id, name: map.name, min, max }] : [];
  });
}
