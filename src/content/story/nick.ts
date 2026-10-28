import type { Npc, Step } from '@/lib/story/world';

/**
 * Nick, down by the beach in the south of Clare, in a white tee and shorts with his backpack on:
 * the second most French man in Ireland, as he'll tell you before you ask. Who's the first? Wait
 * until you meet his brother. Beat him and his look is yours as the Nick skin.
 */

export const NICK_TRAINER = 'clare-nick';
export const BEAT_NICK = `beat:${NICK_TRAINER}`;

export const NICK_BEFORE =
  'NICK: En garde! The second most French man in Ireland does not lose in Clare.';
export const NICK_AFTER = 'NICK: Sacré bleu… Beaten by someone who says “croissant” wrong.';

/** What beating him gives you: a shrug, and his look as a skin. */
export const NICK_REWARD: Step[] = [
  {
    do: 'say',
    text: 'NICK: Fine. Take the look. Now YOU can be the second most French man in Ireland. I’ll be third.',
  },
  { do: 'say', text: 'NICK: Don’t tell my brother about this. Wait until you meet him.' },
];

export const NICK: Npc = {
  look: 'nick',
  face: 'right',
  // Past the ten markers Clare already uses: by the beach, on the road south.
  at: { x: 6, y: 26 },
  talk: [
    {
      do: 'if',
      flag: BEAT_NICK,
      then: [
        {
          do: 'say',
          text: 'NICK: Still the second most French man in Ireland. Third, since you beat me. Ça va.',
        },
        { do: 'say', text: 'NICK: Wait until you meet my brother. Honestly. Wait.' },
      ],
      else: [
        { do: 'say', text: 'NICK: Bonjour! I’m Nick.' },
        {
          do: 'say',
          text: 'NICK: You should know: I am the second most French man in Ireland. I said it before you asked, so you know it’s true.',
        },
        {
          do: 'say',
          text: 'NICK: Who’s the first? Ah. Wait until you meet my brother.',
        },
        {
          do: 'ask',
          text: 'Battle Nick?',
          yes: [
            { do: 'say', text: 'NICK: Allez! My Ranemon have never lost to anyone less French.' },
            { do: 'battle', trainer: NICK_TRAINER },
          ],
          no: [{ do: 'say', text: 'NICK: Non? Quel dommage. I’ll be here, being French.' }],
        },
      ],
    },
  ],
};
