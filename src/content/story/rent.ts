import type { GameMap, Npc, Step } from '@/lib/story/world';

/**
 * The missing rent, a side story in Dublin. In a house by the river, Ollie and Alex Simonin
 * find the rent money gone from the biscuit tin. Three clues, from Alex, the neighbour and a Garda on
 * the quays, could point at either of their housemates: MC or Melchior. Accuse one and you
 * battle them, and whoever you pick says the same thing when they lose. Nobody ever finds out
 * who took it.
 */

/** Set once Ollie tells you the rent is gone. */
export const RENT_START = 'rent:start';
/** The three clues, one from each of Alex Simonin, the neighbour and the Garda. */
export const RENT_CLUES = ['rent:crumbs', 'rent:shout', 'rent:prints'];
/** Set once all three clues are found, so you can accuse someone. */
export const RENT_READY = 'rent:ready';
/** Set once you've accused someone. There's no taking it back. */
export const RENT_ACCUSED = 'rent:accused';
export const accusedFlag = (who: Suspect) => `rent:accused:${who}`;
/** Set once you beat whoever you accused. */
export const RENT_DONE = 'rent:done';

export type Suspect = 'mc' | 'melchior';
export const RENT_TRAINERS: Record<Suspect, string> = { mc: 'rent-mc', melchior: 'rent-melchior' };

/** What whoever you accused says once they've lost. The culprit is never revealed. */
export const NEVER_FIND_OUT =
  'This changes nothing, you’ll still never find out who took the cash!';

/** Runs `then` if every flag is set, or `otherwise` if any isn't. */
const ifAll = (flags: string[], then: Step[], otherwise: Step[]): Step[] =>
  flags.reduceRight<Step[]>(
    (inner, flag) => [{ do: 'if', flag, then: inner, else: otherwise }],
    then,
  );

/** Finding a clue: the clue itself, then whether that's all three. */
const clue = (flag: string, found: Step[], already: string): Step[] => [
  {
    do: 'if',
    flag,
    then: [{ do: 'say', text: already }],
    else: [
      ...found,
      { do: 'flag', flag },
      ...ifAll(
        RENT_CLUES,
        [
          {
            do: 'say',
            text: 'That’s three clues, and every one of them points two ways. Back to the house to make up your mind!',
          },
          { do: 'flag', flag: RENT_READY },
        ],
        [{ do: 'say', text: 'A clue! There must be more of them about Dublin.' }],
      ),
    ],
  },
];

const OLLIE: Step[] = [
  {
    do: 'if',
    flag: RENT_DONE,
    then: [
      {
        do: 'say',
        text: 'OLLIE: Still no rent. C’est la vie. Alex says we can pay the landlord in Simomon. I do not think he will accept.',
      },
    ],
    else: [
      {
        do: 'if',
        flag: RENT_READY,
        then: [
          {
            do: 'say',
            text: 'OLLIE: You have all the clues? Formidable! So, who is the thief? Go and tell MC or Melchior to their face, mon ami.',
          },
        ],
        else: [
          {
            do: 'if',
            flag: RENT_START,
            then: [
              {
                do: 'say',
                text: 'OLLIE: Any clues? Alex found something by the biscuit tin. And ask around outside, somebody must have seen something!',
              },
            ],
            else: [
              {
                do: 'say',
                text: 'OLLIE: Oh là là, c’est une catastrophe! The rent money, it is GONE! Four hundred euro, from the biscuit tin!',
              },
              {
                do: 'say',
                text: 'OLLIE: The landlord comes on Friday. I have been pacing since lunch. I have had four espressos. My hands, regarde, they are shaking.',
              },
              {
                do: 'say',
                text: 'OLLIE: Only four of us live here. Alex and me, we would never. So it was MC… or it was Melchior.',
              },
              {
                do: 'say',
                text: 'OLLIE: Please, mon ami, find the clues and work out who it was. Start with Alex, he found something by the tin.',
              },
              { do: 'flag', flag: RENT_START },
            ],
          },
        ],
      },
    ],
  },
];

const ALEX_SIMONIN: Step[] = [
  {
    do: 'if',
    flag: RENT_DONE,
    then: [
      {
        do: 'say',
        text: 'ALEX SIMONIN: No rent, no answers, and Simomon’s had no dinner. How do we always end up here?',
      },
    ],
    else: [
      {
        do: 'if',
        flag: RENT_START,
        then: clue(
          RENT_CLUES[0],
          [
            {
              do: 'say',
              text: 'ALEX SIMONIN: Simomon sniffed out the kitchen three times. Look what he found right by the empty biscuit tin.',
            },
            {
              do: 'say',
              text: 'ALEX SIMONIN: Half a croissant… and a single cheese and onion Tayto. Whoever it was, they had a snack on the way out.',
            },
            {
              do: 'say',
              text: 'ALEX SIMONIN: Melchior eats nothing but croissants. MC eats nothing but Tayto. So that’s no help at all.',
            },
          ],
          'ALEX SIMONIN: A croissant AND a Tayto. Simomon can’t pick between them either. Try outside.',
        ),
        else: [
          {
            do: 'say',
            text: 'ALEX SIMONIN: Oh, hiya. The rent’s gone, Ollie’s in bits, and Simomon’s hiding under the table. How do we always end up here? Talk to Ollie.',
          },
        ],
      },
    ],
  },
];

/** The neighbour, out on the path in front of the house. */
const NEIGHBOUR: Step[] = [
  {
    do: 'if',
    flag: RENT_START,
    then: [
      {
        do: 'if',
        flag: RENT_DONE,
        then: [
          {
            do: 'say',
            text: 'NEIGHBOUR: Did you find out who took the rent? No? Ah well. It’s always the quiet ones.',
          },
        ],
        else: clue(
          RENT_CLUES[1],
          [
            {
              do: 'say',
              text: 'NEIGHBOUR: The rent? Jaysus. Well, I saw someone run out of that door at half three, shouting at the top of their lungs.',
            },
            {
              do: 'say',
              text: 'NEIGHBOUR: It was either “SLÁINTE!” or “SANTÉ!”. Hard to tell over the 46A.',
            },
          ],
          'NEIGHBOUR: Sláinte or santé, that’s all I heard. Ask the Garda on the quays, she sees everything.',
        ),
      },
    ],
    else: [
      {
        do: 'say',
        text: 'NEIGHBOUR: Lovely bunch, next door. Bit loud. There’s a king living in there, did you know? An actual king.',
      },
    ],
  },
];

/** A Garda on the quays. */
const GARDA: Step[] = [
  {
    do: 'if',
    flag: RENT_START,
    then: [
      {
        do: 'if',
        flag: RENT_DONE,
        then: [{ do: 'say', text: 'GARDA: Case closed? Not as such, no. But it’s off my desk.' }],
        else: clue(
          RENT_CLUES[2],
          [
            {
              do: 'say',
              text: 'GARDA: Missing rent, is it? I dusted that biscuit tin this morning. Wouldn’t want to waste a good tin.',
            },
            {
              do: 'say',
              text: 'GARDA: Tiny fingerprints, all over the lid. And on every finger, the mark of a ring.',
            },
            {
              do: 'say',
              text: 'GARDA: Small hands, so. Or very big rings. I’ll leave the detective work to you.',
            },
          ],
          'GARDA: Small fingers, lots of rings. That’s all I have for you.',
        ),
      },
    ],
    else: [{ do: 'say', text: 'GARDA: Quiet day on the quays. Long may it last.' }],
  },
];

interface Who {
  id: Suspect;
  /** As the text says it, in capitals. */
  name: string;
  /** As the question says it. */
  title: string;
  /** Before the clues are in. */
  alibi: string;
  /** Once you have the clues, before you accuse anyone. */
  denial: string;
  /** Accused, before the battle. */
  accused: string;
  /** If you say no to accusing them. */
  spared: string;
  /** Talked to once you've accused the other one. */
  other: string;
  /** Talked to again after you lost to them. */
  again: string;
}

function suspect(who: Who): Step[] {
  const trainer = RENT_TRAINERS[who.id];
  const say = (text: string): Step => ({ do: 'say', text: `${who.name}: ${text}` });
  return [
    {
      do: 'if',
      flag: `beat:${trainer}`,
      then: [say(NEVER_FIND_OUT)],
      else: [
        {
          do: 'if',
          flag: accusedFlag(who.id),
          then: [say(who.again), { do: 'battle', trainer }],
          else: [
            {
              do: 'if',
              flag: RENT_ACCUSED,
              then: [say(who.other)],
              else: [
                {
                  do: 'if',
                  flag: RENT_READY,
                  then: [
                    say(who.denial),
                    {
                      do: 'ask',
                      text: `Accuse ${who.title} of taking the rent money?`,
                      yes: [
                        { do: 'flag', flag: RENT_ACCUSED },
                        { do: 'flag', flag: accusedFlag(who.id) },
                        say(who.accused),
                        { do: 'battle', trainer },
                      ],
                      no: [say(who.spared)],
                    },
                  ],
                  else: [say(who.alibi)],
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}

const MC = suspect({
  id: 'mc',
  name: 'MC',
  title: 'MC',
  alibi:
    'I was at Irish dancing all afternoon, so I was. Hard shoe. Ask anyone. Actually don’t, they’re all very tired.',
  denial:
    'I know what you’re thinking. I’m small, and I like Tayto. That doesn’t make me a criminal.',
  accused: 'ME?! Right. I’ve won three feiseanna this year. You don’t scare me.',
  spared: 'Good. Because it wasn’t me. Probably.',
  other: 'You’ve already blamed Melchior. Leave me out of it, I’ve a feis on Saturday.',
  again: 'Back for more? I could do this all day.',
});

const MELCHIOR = suspect({
  id: 'melchior',
  name: 'MELCHIOR',
  title: 'Melchior',
  alibi:
    'We are Melchior, King of France. A king does not steal rent. A king has a palace. Well. We have the box room.',
  denial:
    'Croissants, rings, a cry of “Santé!”… We see where this is going. We are insulted. Mildly.',
  accused: 'Sacrebleu! You dare accuse the crown? Then we shall settle this the royal way!',
  spared: 'A wise choice. We shall remember your loyalty when we are back on the throne.',
  other: 'You have already accused the little one. We are above all this.',
  again: 'You return to the royal court? Very well. En garde!',
});

/** The house by the river: Ollie and Alex Simonin, and their housemates MC and Melchior. */
export const RENT_ROOM: Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things'> = {
  name: 'A house',
  rows: [
    'WWWWWWWWWW',
    'WOWWJWWOWW',
    'WQFFFFFYYW',
    'WQF1FF2FFW',
    'WFFFUUFFFW',
    'WF3FUUF4FW',
    'WFFrrrFFFW',
    'WNFF@FFFNW',
    'WWWWEWWWWW',
  ],
  npcs: [
    { look: 'ollie', face: 'down', talk: OLLIE },
    { look: 'alex', face: 'down', talk: ALEX_SIMONIN },
    { look: 'mc', face: 'right', talk: MC },
    { look: 'melchior', face: 'left', talk: MELCHIOR },
  ],
  things: {
    U: 'The kitchen table. In the middle, an empty biscuit tin with RENT written on the lid in marker.',
    Y: 'A shelf of French cookbooks, a feis medal and a small velvet cushion for a crown.',
    J: 'A fire, burning low. Nobody has had the heart to put on more turf.',
    Q: 'A bunk bed. The top bunk has a canopy. The bottom one has a Tayto multipack.',
  },
};

/** Said as you come in, until Ollie has told you what happened. */
export const RENT_ARRIVE: Step[] = [
  {
    do: 'if',
    flag: RENT_START,
    then: [],
    else: [{ do: 'say', text: 'Someone in here is very upset, and a lot of it is in French.' }],
  },
];

/** The neighbour and the Garda, outside in Dublin. */
export const RENT_NEIGHBOUR: Npc = { look: 'local', face: 'left', talk: NEIGHBOUR };
export const RENT_GARDA: Npc = { look: 'guard', face: 'down', talk: GARDA };
