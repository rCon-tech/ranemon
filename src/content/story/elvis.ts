import { NORM_RETURNED } from './sibeal';
import { ELVIS, ELVIS_RETURNED, NORM } from '@/lib/story/norm';
import type { Npc, Step } from '@/lib/story/world';

/**
 * Elvis, Carl Ryan's really huge black dog, at his feet in every McGrattans. Talk to him and Carl
 * asks you to take him for a walk: say yes and Elvis walks behind you instead of your lead
 * Ranemon, like Norm, and finds things the same way (lib/story/norm.ts). One dog at a time, so
 * if Norm is with you he goes back to Sibeal. Give Elvis back to Carl in any McGrattans.
 * Elvis is 2D only: in the 3D look he's drawn as his 2D sprite, standing up.
 */

/** Talking to Elvis, while he's waiting in McGrattans. */
export const ELVIS_TALK: Step[] = [
  { do: 'say', text: 'Elvis, a really huge black dog, thumps his tail on the floor.' },
  {
    do: 'say',
    text: 'CARL RYAN: the big lad needs a walk but I am here locking for Q4. Would you mind walking him?',
  },
  {
    do: 'ask',
    text: 'Take Elvis for a walk?',
    yes: [
      {
        do: 'if',
        flag: NORM,
        then: [
          { do: 'unflag', flag: NORM },
          { do: 'flag', flag: NORM_RETURNED },
          { do: 'say', text: 'Norm went back to Sibeal. Elvis is walking with you now.' },
        ],
      },
      { do: 'flag', flag: ELVIS },
      {
        do: 'say',
        text: 'CARL RYAN: Sound. Bring him back to me in any McGrattans when he’s had enough.',
      },
      { do: 'say', text: 'Elvis heaves himself up and falls in behind you!' },
    ],
    no: [{ do: 'say', text: 'CARL RYAN: No bother. He’ll only lie on my feet so.' }],
  },
];

/** Elvis, beside Carl in every McGrattans until you take him out. */
export const ELVIS_PUB: Npc = { look: 'elvis', face: 'down', hideIf: ELVIS, talk: ELVIS_TALK };

/** Said to Carl while Elvis is out with you: a chance to give him back, before the Blue Ghosts. */
export const CARL_TAKES_ELVIS: Step = {
  do: 'if',
  flag: ELVIS,
  then: [
    { do: 'say', text: 'CARL RYAN: There’s the big lad. Did he behave himself?' },
    {
      do: 'ask',
      text: 'Give Elvis back to Carl?',
      yes: [
        { do: 'unflag', flag: ELVIS },
        { do: 'flag', flag: ELVIS_RETURNED },
        { do: 'say', text: 'Elvis flops down on Carl’s feet with a groan.' },
        { do: 'say', text: 'CARL RYAN: Cheers. Any time you want to walk him again, he’s here.' },
      ],
      no: [{ do: 'say', text: 'CARL RYAN: Keep him a while so. Q4 isn’t going to lock itself.' }],
    },
  ],
};
