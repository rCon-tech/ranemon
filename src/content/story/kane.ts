import { KANE_ID } from '@/lib/battle/kane';
import type { GameMap, Step, Trainer } from '@/lib/story/world';
import { CHAMPION } from './kneecap';

/**
 * London's legendary: Harry Kane. Once you're Premier League Champion, with all twelve jerseys
 * and a gift from every legend, Jamie Elliott texts that Kane is home from Munich for the week,
 * at Wembley, and saying he's never coming back. Wembley Park opens out east onto Wembley Way,
 * where he's on his own by the Bobby Moore statue with a Ballon d'Or. Beat him (his Kanemon
 * Mega evolves into Ballan d'Or, gold like the trophy) and he comes back to England and joins
 * your party, Ballon d'Or and all, so he can Mega evolve for you without a Mega Ring: just in
 * time for the Ranelasses.
 *
 * Wembley Way and its battle are 2D only (`flat`), like everything new.
 */

export const WEMBLEY_WAY_ID = 'wembley-way';
export const KANE_TRAINER = 'wembley-kane';

/** Kane beaten: he's back in England, and in your party. */
export const KANE_HOME = 'kane:home';

/** Wembley Way opens off Wembley Park once you're Champion. */
export const KANE_GATE = CHAMPION;

/** His level, and Kanemon's when he joins you: a few over the palace, under the Ranelasses. */
export const KANE_LEVEL = 56;

/** Jamie's text, at the end of the Premier League. */
export const KANE_TEXT: Step[] = [
  {
    do: 'say',
    text: 'Your phone buzzes again: “JAMIE ELLIOTT: Champion! Here, guess who’s at Wembley. Harry Kane, home from Munich for the week. Says he’s never coming back. Go and change his mind. Metropolitan line, then out the east end of Wembley Park.”',
  },
];

const say = (text: string): Step[] => [{ do: 'say', text }];

const KANE_REWARD: Step[] = [
  ...say(
    'HARRY KANE: …Yeah. Yeah, all right. Maybe it’s time. Maybe it’s coming home. Properly this time.',
  ),
  ...say(
    'HARRY KANE: I’m not taking the Ballon d’Or back to Munich, mind. It comes with me. Kanemon can do things with it you’ve never seen.',
  ),
  { do: 'flag', flag: KANE_HOME },
  { do: 'recruit', species: KANE_ID, level: KANE_LEVEL },
  ...say(
    'Harry Kane is back in England! Kanemon brings the Ballon d’Or with him: he can Mega evolve into BALLAN D’OR in any battle, Mega Ring or not.',
  ),
];

export const KANE: Trainer = {
  id: KANE_TRAINER,
  name: 'Harry Kane',
  uk: true,
  team: [[KANE_ID, KANE_LEVEL]],
  ai: 'hard',
  prize: KANE_LEVEL * 100,
  mega: KANE_ID,
  before:
    'HARRY KANE: (Holding a golden ball. It isn’t his, strictly.) Don’t. I know what you’re going to say. England need me. They always need me in June, and by July they’ve gone out on penalties. I’m staying in Munich. Unless you can change my mind.',
  after: 'HARRY KANE: Right. Right. Fair enough.',
  line: 'HARRY KANE: That’s what I do. That’s what I’ve always done.',
  reward: KANE_REWARD,
};

/**
 * Wembley Way: the walk from the station up to the stadium, east off Wembley Park. The arch is
 * over it, the Bobby Moore statue is at the top, and Harry Kane is in front of it.
 */
export const WEMBLEY_WAY: GameMap = {
  id: WEMBLEY_WAY_ID,
  name: 'Wembley Way, London',
  county: 9,
  flat: true,
  uk: true,
  terraces: 'english',
  west: 'wembley',
  rows: [
    'TTTTTTTTTTTTTTTTTTTT',
    'TvvvvvvvvSvvvvvvvvvT',
    'TvaaaaaaaaaaaaaaR1vT',
    '@vaaaaaaaaaaaaaaaavT',
    'Tvaaa2aaaaaaaaaaaavT',
    'TvvvvvvvvvvvvvvvvvvT',
    'TTTTTTTTTTTTTTTTTTTT',
  ],
  npcs: [
    {
      look: 'kane',
      face: 'left',
      trainer: KANE_TRAINER,
      hideIf: KANE_HOME,
      talk: say('HARRY KANE: Go on, then. Change my mind.'),
    },
    {
      look: 'local',
      face: 'right',
      talk: [
        {
          do: 'if',
          flag: KANE_HOME,
          then: say('FAN: You got him home! You actually got him home! It’s coming home!'),
          else: say(
            'FAN: That’s Harry Kane. HARRY KANE. He says he’s not coming back. He says that every summer.',
          ),
        },
      ],
    },
  ],
  signs: [
    'WEMBLEY WAY. The Bobby Moore statue is at the top. England expects. England usually loses on penalties.',
  ],
  things: {
    R: 'The Bobby Moore statue. 1966, and the only time, so far. Someone has hung an England scarf on it.',
  },
  arrive: [
    {
      do: 'if',
      flag: KANE_HOME,
      then: [],
      else: say(
        'WEMBLEY WAY. The arch is right overhead, and at the top, by the Bobby Moore statue, someone is standing on his own in an England shirt with a golden ball under his arm.',
      ),
    },
  ],
};
