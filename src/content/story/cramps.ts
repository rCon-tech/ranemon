import { BALL_FLAG } from './ball';
import type { Npc, Step } from '@/lib/story/world';

/**
 * Cramps, the DJ from Greystones, who asks you to I Love Techno once you're Champion: he runs up
 * to you in Dublin, and waits at Connolly Station after. The trip itself is in techno.ts; the
 * Eurostar to Ghent at Connolly only runs once you've said yes.
 */

/** Set once Cramps has caught you in Dublin, yes or no: he's at Connolly from then on. */
export const TECHNO_MET = 'techno:met';
/** Set once you've said yes: the Eurostar to Ghent runs for you. */
export const TECHNO_ASKED = 'techno:asked';
/** DJ Vandenbass is beaten and I Love Techno has begun. */
export const TECHNO_DONE = 'techno:done';

// ---------- Cramps, in Dublin and at Connolly ----------

/** The question, the first time and every time after a no. */
const ASK: Step[] = [
  {
    do: 'ask',
    text: 'Go to I Love Techno in Belgium with Cramps and the crew?',
    yes: [
      { do: 'flag', flag: TECHNO_ASKED },
      {
        do: 'say',
        text: 'CRAMPS: YES! The Champion of Ireland on the guest list. Well. Sort of on the guest list. We’ll sort it out at the door.',
      },
      {
        do: 'say',
        text: 'CRAMPS: Get the Eurostar from Connolly Station, platform 4. Ferry, London, under the sea, Belgium. See you in the queue!',
      },
    ],
    no: [
      {
        do: 'say',
        text: 'CRAMPS: No? NO? Ah, you’re wrecked after the Ball. Fair. I’ll be hanging around Connolly Station in case you change your mind.',
      },
    ],
  },
];

/**
 * Coming into Dublin as Champion for the first time: Cramps runs up to you. On Dublin's
 * `arrive`, which runs every time you come out onto the streets, so nobody can miss it.
 */
export const CRAMPS_ARRIVE: Step[] = [
  {
    do: 'if',
    flag: BALL_FLAG,
    then: [
      {
        do: 'if',
        flag: TECHNO_MET,
        then: [],
        else: [
          {
            do: 'say',
            text: '(Someone comes sprinting down the street at you, waving both arms, big red headphones bouncing round his neck. There’s no getting away.)',
          },
          {
            do: 'say',
            text: 'CRAMPS: CHAMPION! CHAMPION OF IRELAND! It’s me, Cramps! The DJ! Thursdays at the yacht club in Greystones!',
          },
          {
            do: 'say',
            text: 'CRAMPS: Beating B&S, and then the Trinity Ball. What a night. The whole crew’s still buzzing.',
          },
          {
            do: 'say',
            text: 'CRAMPS: So listen. To celebrate the win, we are going to I Love Techno music festival in Belgium! Me, Thilo, the whole crew.',
          },
          {
            do: 'say',
            text: 'CRAMPS: Twelve hours of techno in a hall the size of Croke Park. And you’re coming. You HAVE to come.',
          },
          ...ASK,
          { do: 'flag', flag: TECHNO_MET },
        ],
      },
    ],
  },
];

/** Cramps on the concourse at Connolly, once he's found you. */
export const CRAMPS_AT_STATION: Npc = {
  look: 'cramps',
  face: 'down',
  showIf: TECHNO_MET,
  talk: [
    {
      do: 'if',
      flag: TECHNO_DONE,
      then: [
        {
          do: 'say',
          text: 'CRAMPS: My ears are still ringing from Ghent. Best festival of my life. Thilo wants to go back next year. And the year after.',
        },
      ],
      else: [
        {
          do: 'if',
          flag: TECHNO_ASKED,
          then: [
            {
              do: 'say',
              text: 'CRAMPS: Platform 4, the Eurostar to Ghent! I’m on the next one. I Love Techno waits for nobody!',
            },
          ],
          else: [
            {
              do: 'say',
              text: 'CRAMPS: Champion! Changed your mind about I Love Techno? Belgium, the crew, twelve hours of techno?',
            },
            ...ASK,
          ],
        },
      ],
    },
  ],
};
