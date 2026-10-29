import { NICK_BERET } from '@/lib/story/keys';
import type { Npc, Step } from '@/lib/story/world';

/**
 * Nick, in a white tee and shorts with his backpack on: the second most French man in Ireland,
 * as he'll tell you before you ask. Who's the first? Wait until you meet his brother.
 *
 * He stands in the doorway of Saoirse's gym at Semple Stadium in Thurles, the third gym, and
 * won't move until you find the beret he lost at the Rock of Cashel. Bring it back and beat him
 * and his look is yours as the Nick skin, and Nickamon comes with you: the only way to get one.
 * Your phone tells you where he is the first time you come into Thurles, and it shows in
 * MISSIONS. Thurles is 2D only, so the battle is too.
 *
 * He used to stand by the beach in Clare. A save that beat him there keeps the skin, and gets
 * its Nickamon from him in Thurles instead of a second battle.
 */

/** The id from his Clare days, kept so saves that beat him there still count. */
export const NICK_TRAINER = 'clare-nick';
export const BEAT_NICK = `beat:${NICK_TRAINER}`;

/** Nick's text, the first time you come into Thurles: the mission starts. */
export const NICK_TEXT = 'nick:text';
/** You've talked to him at the gym door and know about the beret. */
export const NICK_MET = 'nick:met';
export { NICK_BERET };
/** Beaten and paid up (or paid up, for a save that beat him in Clare): he's off out of the doorway. */
export const NICK_DONE = 'nick:done';

/** Where he stands: in the only doorway into the Semple Stadium gym. */
export const NICK_DOOR = { x: 19, y: 11 };

export const NICK_LEVEL = 15;

export const NICK_BEFORE =
  'NICK: En garde! The second most French man in Ireland does not lose in Tipperary.';
export const NICK_AFTER = 'NICK: Sacré bleu… Beaten by someone who says “croissant” wrong.';

const say = (text: string): Step => ({ do: 'say', text });

/** Off out of the doorway, for good. */
const LEAVES: Step[] = [
  say(
    'Nick tips his beret and wanders off to find a café in Thurles that does a proper croissant. The gym door is clear.',
  ),
  { do: 'flee', flag: NICK_DONE, dir: 'down' },
];

/** What beating him gives you: a shrug, his look as a skin, and Nickamon. */
export const NICK_REWARD: Step[] = [
  say(
    'NICK: Fine. Take the look. Now YOU can be the second most French man in Ireland. I’ll be third.',
  ),
  say(
    'NICK: And take him too. Nickamon has never lost to anyone less French, so he wants to go with you.',
  ),
  { do: 'recruit', species: 'nickamon', level: NICK_LEVEL },
  say('NICK: Don’t tell my brother about this. Wait until you meet him.'),
  ...LEAVES,
];

/** The first time you come into Thurles, wherever you've come from, unless he's already done. */
export const NICK_ARRIVE: Step[] = [
  {
    do: 'if',
    flag: NICK_DONE,
    then: [],
    else: [
      {
        do: 'if',
        flag: NICK_TEXT,
        then: [],
        else: [
          {
            do: 'if',
            flag: BEAT_NICK,
            then: [
              say(
                '♪ Bzzt. A text from a French number: “Bonjour! It is Nick, from Clare. I am at the gym door at Semple Stadium. I have something for you. Come.”',
              ),
            ],
            else: [
              say(
                '♪ Bzzt. A text from a French number: “Bonjour! C’est Nick. I am in the door of the gym at Semple Stadium and I cannot move. It is an emergency. Of fashion.”',
              ),
            ],
          },
          { do: 'flag', flag: NICK_TEXT },
        ],
      },
    ],
  },
];

/** Up at the Rock of Cashel, Thurles' first landmark: his beret, once he's told you about it. */
export const ROCK_OF_CASHEL: Step[] = [
  say('THE ROCK OF CASHEL. You can see half of Munster from up here.'),
  {
    do: 'if',
    flag: NICK_MET,
    then: [
      {
        do: 'if',
        flag: NICK_BERET,
        then: [],
        else: [
          say('Something black is flapping on the wall of the round tower, caught on a stone.'),
          say('You got NICK’S BERET! It smells faintly of Gauloises and Lynx Africa.'),
          { do: 'flag', flag: NICK_BERET },
        ],
      },
    ],
  },
];

export const NICK: Npc = {
  look: 'nick',
  face: 'down',
  at: NICK_DOOR,
  hideIf: NICK_DONE,
  talk: [
    {
      do: 'if',
      flag: BEAT_NICK,
      // Beaten in Clare, before he moved: the skin's already yours, so just Nickamon.
      then: [
        say(
          'NICK: Ah, it’s you! From the beach in Clare. Still the second most French man in Ireland. Third, since you beat me.',
        ),
        say(
          'NICK: I never gave you anything but the look. Here. Nickamon wants to go with you. He likes you more than me anyway.',
        ),
        { do: 'recruit', species: 'nickamon', level: NICK_LEVEL },
        say('NICK: Wait until you meet my brother. Honestly. Wait.'),
        { do: 'flag', flag: NICK_TEXT },
        { do: 'flag', flag: NICK_MET },
        { do: 'flag', flag: NICK_BERET },
        ...LEAVES,
      ],
      else: [
        {
          do: 'if',
          flag: NICK_BERET,
          then: [
            say('You hand Nick his beret. He puts it on at an angle only a French man could find.'),
            say(
              'NICK: Voilà. Fully French again. And a fully French man does not say thank you. He says…',
            ),
            { do: 'battle', trainer: NICK_TRAINER },
          ],
          else: [
            {
              do: 'if',
              flag: NICK_MET,
              then: [
                say(
                  'NICK: My beret! Still up at the Rock of Cashel, at the top of the town. I do not move from this door without it.',
                ),
              ],
              else: [
                say('NICK: Bonjour! I’m Nick.'),
                say(
                  'NICK: You should know: I am the second most French man in Ireland. I said it before you asked, so you know it’s true.',
                ),
                say('NICK: Who’s the first? Ah. Wait until you meet my brother.'),
                say(
                  'NICK: But today, a disaster. I took a selfie up at the Rock of Cashel and the wind took my beret.',
                ),
                say(
                  'NICK: A French man with no beret, in front of all of Semple Stadium? Non. I stand in this door until it is back on my head. Nobody goes in.',
                ),
                say(
                  'NICK: Find it and I give you a battle. And maybe more. The Rock is up the steps, at the top of the town.',
                ),
                { do: 'flag', flag: NICK_TEXT },
                { do: 'flag', flag: NICK_MET },
              ],
            },
          ],
        },
      ],
    },
  ],
};
