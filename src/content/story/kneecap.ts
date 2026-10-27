import { TECHNO_DONE } from './cramps';
import type { Npc, Step } from '@/lib/story/world';

/**
 * The London expansion's start (docs/london-expansion.md): back from Ghent, DJ Próvaí of Kneecap
 * finds you at Connolly. The other two lads went over to London on a mission and haven't come
 * back, and he needs you. Say yes and the airport bus runs from Connolly; London itself is in
 * london.ts.
 */

/**
 * A save from SKIP TO RANEMON LONDON on the home screen: a new game that starts at Stansted, for
 * players who haven't played Ranemon Dublin. Only these saves have it, so every line gated on it
 * leaves the Dublin game, and Dublin saves that go on to London, exactly as they were.
 */
export const LONDON_ONLY = 'london:only';

/** Próvaí has found you, yes or no: he waits at Connolly from then on. */
export const PROVAI_MET = 'provai:met';
/** You've said yes: the airport bus runs for you. */
export const PROVAI_ASKED = 'provai:asked';
/** You've landed at Stansted and been through the border once. */
export const LANDED = 'london:landed';
/** Próvaí has given you a UK Ranemon in W.B Yates. */
export const UK_STARTER = 'london:starter';
/** Thatcher has barged into W.B Yates, after your UK Ranemon. */
export const THATCHER_IN = 'london:thatcher-in';
/** She's battled you and stormed back out of W.B Yates. */
export const THATCHER_OUT = 'london:thatcher-out';
/** Próvaí has told you why the lads were taken, and what it'll take to get to the King. */
export const FIXTURES = 'london:fixtures';
/** Ian Wright's Railcard: the trains to Brighton, Birmingham and Newcastle run for you. */
export const RAILCARD = 'london:railcard';
/** Agüero is beaten: you're Premier League Champion, and the police line on the Mall steps aside. */
export const CHAMPION = 'london:champion';
/** King Charles is beaten and the lads are free. */
export const KING_BEATEN = 'london:king';
/**
 * Charles has signed the Good Saturday Agreement: Ranemon are in the Common Travel Area, your
 * Irish party is with you again, and Buckingham Palace is an Irish party for good.
 */
export const AGREEMENT = 'london:agreement';

const ASK: Step[] = [
  {
    do: 'ask',
    text: 'Go to London with DJ Próvaí to find the Kneecap lads?',
    yes: [
      { do: 'flag', flag: PROVAI_ASKED },
      {
        do: 'say',
        text: 'PRÓVAÍ: Maith an duine! I’m flying over tonight. Meet me in London. Bring your Ranemon. Bring ALL of them.',
      },
      {
        do: 'say',
        text: 'PRÓVAÍ: Bus to the airport goes from here, ask at the desk. No, there’s no train to the airport. There’s never been a train to the airport. Don’t ask.',
      },
    ],
    no: [
      {
        do: 'say',
        text: 'PRÓVAÍ: Ah, you’re wrecked after Ghent. Fair. I’ll be here on the concourse. The lads aren’t going anywhere. That’s the problem.',
      },
    ],
  },
];

/**
 * Coming back from Ghent: Próvaí is waiting. On Connolly's `arrive` and Dublin's, guarded so it
 * only plays once, so saves already back from Ghent meet him too.
 */
export const PROVAI_ARRIVE: Step[] = [
  {
    do: 'if',
    flag: TECHNO_DONE,
    then: [
      {
        do: 'if',
        flag: PROVAI_MET,
        then: [],
        else: [
          {
            do: 'say',
            text: '(The music cuts out. A drum and bass beat kicks in from somewhere. Someone in a tricolour balaclava and a black and green tracksuit is walking straight at you.)',
          },
          {
            do: 'say',
            text: 'PRÓVAÍ: Dia dhuit! You’re the one who beat B&S? And the Belgian lad with the decks? Grand. I’m Próvaí. DJ Próvaí. Out of Kneecap.',
          },
          {
            do: 'say',
            text: 'PRÓVAÍ: I need you. There’s trouble in London, and the other two lads need help.',
          },
          {
            do: 'say',
            text: 'PRÓVAÍ: Mo Chara and Móglaí Bap went over on a bit of a mission. They haven’t come back. Phones are off.',
          },
          {
            do: 'say',
            text: 'PRÓVAÍ: Last thing I got was a voice note of Mo Chara shouting “HE’S GOT A CROWN ON HIM”. That’s all. That was it.',
          },
          ...ASK,
          { do: 'flag', flag: PROVAI_MET },
        ],
      },
    ],
  },
];

/** Próvaí on the concourse at Connolly once he's found you. */
export const PROVAI_AT_STATION: Npc = {
  look: 'provai',
  face: 'down',
  showIf: PROVAI_MET,
  hideIf: PROVAI_ASKED,
  talk: [
    {
      do: 'say',
      text: 'PRÓVAÍ: Changed your mind? The lads are in London, and something’s after happening them.',
    },
    ...ASK,
  ],
};
