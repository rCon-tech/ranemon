import type { Creature } from '../battle/creature';
import { DEX } from '../battle/evolutions';
import { FOOTBALLER_MON } from '../battle/footballers';
import { KANEMON } from '../battle/kane';
import { LONDON } from '../battle/london';
import { hasUkForm, UK, UK_ENTRIES } from '../battle/uk';
import { variantForm } from '../battle/variants';
import { mapById, outsideOf } from '@/content/story/maps';
import { storyKnowledge, type DexKnowledge } from './dex';
import type { StoryState } from './state';

/**
 * The UK Ranedex: every Ranemon over the Irish Sea, kept apart from Ireland's. The lads come
 * first in their drawn UK forms, each base form followed by what it evolves into, then London's
 * own (`london.ts`), then the Premier League legends' (`footballers.ts`), then Harry Kane (`kane.ts`). What you've seen and
 * befriended here is what you've met in Britain.
 */

/** A Ranemon as it is in Britain: one of the lads drawn, with its UK entry; London's own as is. */
export function ukForm(c: Creature): Creature {
  return hasUkForm(c.id) ? { ...variantForm(c, UK), entry: UK_ENTRIES[c.id] } : c;
}

export const UK_DEX: Creature[] = [
  ...DEX.filter((c) => hasUkForm(c.id)).map(ukForm),
  ...LONDON,
  ...FOOTBALLER_MON,
  KANEMON,
];

const LONDON_IDS = new Set([...LONDON, ...FOOTBALLER_MON, KANEMON].map((c) => c.id));

/**
 * What a save has come across in Britain. Saves from before the UK Ranedex have no `ukSeen`, so
 * London's own Ranemon and every UK Ranemon you have (on either side of the sea) count as well.
 */
export function ukKnowledge(game: StoryState): DexKnowledge {
  const members = [
    ...game.party,
    ...game.box,
    ...(game.away?.party ?? []),
    ...(game.away?.box ?? []),
  ].filter((m) => m.variant === UK || LONDON_IDS.has(m.species));
  const had = members.map((m) => m.species);
  // Anything befriended has been seen.
  const seen = new Set([
    ...(game.ukSeen ?? []),
    ...(game.ukCaught ?? []),
    ...game.seen.filter((id) => LONDON_IDS.has(id)),
    ...had,
  ]);
  const caught = new Set([
    ...(game.ukCaught ?? []),
    ...game.caught.filter((id) => LONDON_IDS.has(id)),
    ...had,
  ]);
  const story = storyKnowledge(game);
  return {
    ...story,
    seen: (id) => seen.has(id),
    caught: (id) => caught.has(id),
    where: (map) => !!outsideOf(mapById(map)).uk,
    form: ukForm,
  };
}

/** Whether there's anything in the UK Ranedex yet, so it gets a tab. */
export function hasUkDex(game: StoryState): boolean {
  const know = ukKnowledge(game);
  return UK_DEX.some((c) => know.seen(c.id));
}
