import type { Npc, Step } from '@/lib/story/world';

/**
 * Paul Mescal, on the south side of Dublin past Temple Bar: an Academy Award nominee, really
 * attractive and really rich, and really sad about it. Beat him and he's sadder still, points
 * over your shoulder and runs off, and he's gone for good.
 */

export const MESCAL_TRAINER = 'dublin-mescal';
/** Set once he's run off, so he’s not in Dublin any more. */
export const MESCAL_GONE = 'mescal:gone';

export const MESCAL_BEFORE =
  'PAUL MESCAL: I’m an Academy Award nominated actor. I’m really attractive. I’m really rich. And yet… I’m really, really sad.';
export const MESCAL_AFTER = 'PAUL MESCAL: Oh no. Now I’m even sadder. …Wait. Look over there!';

/** After the battle: off he runs, and there was nothing over there at all. */
export const MESCAL_RUNS: Step[] = [
  { do: 'flee', flag: MESCAL_GONE, dir: 'right' },
  { do: 'say', text: 'You look. There’s nothing over there. Paul Mescal is gone.' },
];

export const MESCAL: Npc = {
  look: 'mescal',
  face: 'left',
  trainer: MESCAL_TRAINER,
  sight: 3,
  hideIf: MESCAL_GONE,
  // Only if he's somehow still here after you've beaten him: he tries the same trick again.
  talk: [{ do: 'say', text: MESCAL_AFTER }, ...MESCAL_RUNS],
};
