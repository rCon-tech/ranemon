import type { Npc, Step } from '@/lib/story/world';

/**
 * Enda, in Kildare on the road to Dublin: a very small man with brown hair who makes best
 * friends with everyone he meets. He's standing in the middle of the road out to Dublin, so
 * nobody gets past without meeting him, and he asks you on an adventure to Brighton with Ollie
 * and Kill. Say no and he steps aside anyway, and stays by the road to ask again. The trip itself
 * is in brighton.ts; the Sail & Rail to Brighton at Connolly Station only runs once you've said
 * yes.
 */

/** Set once you've met him, yes or no: he steps out of the road. */
export const ENDA_MET = 'enda:met';
/** Set once you've said yes to Brighton: the Sail & Rail at Connolly runs for you. */
export const ENDA_ASKED = 'enda:asked';
/** The Brighton match is over, and on to the arcade. */
export const MATCH_DONE = 'brighton:match';
/** The Arcade King is beaten and the adventure is over. */
export const BRIGHTON_DONE = 'brighton:done';

/** The question, the first time and every time after a no. */
const ASK: Step[] = [
  {
    do: 'ask',
    text: 'Go on an adventure to Brighton with Enda, Ollie and Kill?',
    yes: [
      { do: 'flag', flag: ENDA_ASKED },
      {
        do: 'say',
        text: 'ENDA: YES! Best friends on tour! Ollie and Kill are going to love you. They love everyone I love.',
      },
      {
        do: 'say',
        text: 'ENDA: Get the Sail & Rail from Connolly Station in Dublin. Ferry, train, train, train, Brighton! I’ll see you there!',
      },
    ],
    no: [
      {
        do: 'say',
        text: 'ENDA: No bother at all! Best friends never have to do anything. I’ll be right here by the road if you change your mind.',
      },
    ],
  },
];

/** Meeting him in the road, the first time. */
const INTRO: Step[] = [
  {
    do: 'say',
    text: '(A very small man with brown hair grabs your hand and shakes it for a long, long time.)',
  },
  {
    do: 'say',
    text: 'ENDA: Hiya! I’m Enda! What’s your name? Actually, it doesn’t matter. We’re best friends now. That’s how it works.',
  },
  {
    do: 'say',
    text: 'ENDA: Private Byrne is my best friend. The Garda is my best friend. Margaret Thatcher is my best friend, which I wasn’t expecting.',
  },
  {
    do: 'say',
    text: 'ENDA: Listen. Me and my other best friends, Ollie and Kill, are going on an adventure. To BRIGHTON! A Brighton match, and then the arcade on the seafront after.',
  },
  {
    do: 'say',
    text: 'ENDA: You HAVE to come. It won’t be the same without my newest best friend.',
  },
  ...ASK,
  { do: 'flag', flag: ENDA_MET },
  { do: 'say', text: '(Enda skips to the side of the road, waving at you the whole way.)' },
];

/** By the side of the road, once you've met him. */
const AFTER: Step[] = [
  {
    do: 'if',
    flag: BRIGHTON_DONE,
    then: [
      {
        do: 'say',
        text: 'ENDA: BEST FRIEND! Brighton was the best day of my whole life. So far. I’m already planning the next one.',
      },
    ],
    else: [
      {
        do: 'if',
        flag: ENDA_ASKED,
        then: [
          {
            do: 'say',
            text: 'ENDA: Brighton! Get the Sail & Rail from Connolly Station in Dublin. Ollie and Kill are already on their way!',
          },
        ],
        else: [
          {
            do: 'say',
            text: 'ENDA: My best friend! Have you changed your mind about Brighton? The match, the arcade, Ollie, Kill and me?',
          },
          ...ASK,
        ],
      },
    ],
  },
];

/**
 * Every time you come into Kildare until you've met him, by road, train or Lime: he's small, so
 * he waves you over from the road to Dublin. That way nobody misses him, even coming back from
 * Dublin with him behind them.
 */
export const ENDA_CALLS: Step[] = [
  {
    do: 'if',
    flag: ENDA_MET,
    then: [],
    else: [
      {
        do: 'say',
        text: 'ENDA: HIYA! You! Yes, YOU! Over here! (A very small man is jumping up and down on the road to Dublin, at the far east end of the Curragh, waving both arms.)',
      },
    ],
  },
];

/** Enda in the road out to Dublin, until you've met him. */
export const ENDA_IN_ROAD: Npc = { look: 'enda', face: 'left', hideIf: ENDA_MET, talk: INTRO };

/** Enda by the side of the road, once you have. */
export const ENDA_BY_ROAD: Npc = { look: 'enda', face: 'down', showIf: ENDA_MET, talk: AFTER };
