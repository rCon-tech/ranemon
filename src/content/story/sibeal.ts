import { NORM } from '@/lib/story/norm';
import type { Npc, Step } from '@/lib/story/world';

/**
 * Sibeal and her dog Norm. Talk to her in Limerick and she lends you Norm, who walks behind you
 * instead of your lead Ranemon, doesn't fight, and turns things up as you go (see lib/story/norm.ts).
 * She waits in every McGrattans after, to take him back.
 */

/** Sibeal in Limerick, with Norm at her feet. */
export const SIBEAL_LENDS: Step[] = [
  {
    do: 'say',
    text: 'SIBEAL: Howya! This is Norm. He’s been cooped up all week and he’s driving me up the walls.',
  },
  {
    do: 'say',
    text: 'SIBEAL: He won’t fight, he’s a lover not a fighter. But he has some nose on him. He’s always finding things.',
  },
  {
    do: 'ask',
    text: 'Take Norm on your adventure?',
    yes: [
      { do: 'flag', flag: NORM },
      {
        do: 'say',
        text: 'SIBEAL: Ah, you’re a star. Mind him now. I’ll be in McGrattans, any McGrattans, when you want to give him back.',
      },
      { do: 'say', text: 'Norm wags his tail and falls in behind you!' },
    ],
    no: [{ do: 'say', text: 'SIBEAL: No bother. Norm’ll be here if you change your mind.' }],
  },
];

/** Sibeal in McGrattans, while you have Norm. */
export const SIBEAL_PUB: Step[] = [
  { do: 'say', text: 'SIBEAL: There he is! Has he been good for you?' },
  {
    do: 'ask',
    text: 'Give Norm back to Sibeal?',
    yes: [
      { do: 'unflag', flag: NORM },
      { do: 'say', text: 'Norm trots over to Sibeal and flops down at her feet.' },
      {
        do: 'say',
        text: 'SIBEAL: Thanks a million. He’ll sleep for a week. Come find me in Limerick if you want him again.',
      },
    ],
    no: [
      { do: 'say', text: 'SIBEAL: Keep him a while so. Sure he’s having the time of his life.' },
    ],
  },
];

/** Sibeal, by the fire in every McGrattans while Norm is out with you. */
export const sibealInPub: Npc = { look: 'sibeal', face: 'down', showIf: NORM, talk: SIBEAL_PUB };
