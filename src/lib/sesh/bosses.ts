import type { RaneType } from '../battle/types';
import type { SongId } from '../sound/songs';
import type { Look } from '../story/world';

/**
 * A boss in The Sesh: one of the main game's named characters, out on the same night. Who you
 * meet is random every run and doesn't set the difficulty; the stage does, through the boss's
 * level, team size and CPU. Each comes as the character you know, in their story look and with
 * their lines, and a new team of photo Ranemon built around the types of their story team
 * (`bossTypes`).
 *
 * A boss with no story trainer of their own (Enda, say, who's a friend in the story, never a
 * battle) gives their name, lines and types here instead.
 */
export interface Boss {
  id: string;
  /** Their story trainer, for their name, lines and types. */
  trainer?: string;
  /** How they're drawn on the Briefing: their story skin. */
  look: Look;
  /** Their battle theme. The Boss theme unless they have their own. */
  music?: SongId;
  /** Overrides for the story's, where theirs only fit the story (a jersey, say). */
  name?: string;
  before?: string;
  after?: string;
  /** Said each time they send out a Ranemon. */
  line?: string;
  /** The types their team is built around, where their story team doesn't say it well. */
  types?: RaneType[];
}

/** A gym leader: their story trainer, the Gym Leader look and the Gym Leader theme. */
const leader = (id: string, trainer: string, after: string, extra: Partial<Boss> = {}): Boss => ({
  id,
  trainer,
  look: 'leader',
  music: 'leader',
  after,
  ...extra,
});

/**
 * The pool. The Ranelasses are never in it: they're kept for the end of the Long Sesh. Nor is
 * anyone from the story who'd only fit there (Mam, say).
 */
export const BOSSES: Boss[] = [
  // ---------- the nine gym leaders ----------
  leader('nora', 'gym-clare', 'NÓRA: Lovely playing. You’d keep time with any session.'),
  leader(
    'donncha',
    'gym-limerick',
    'BIG DONNCHA: You’ve a fine low centre of gravity. Go on to the next one.',
  ),
  leader(
    'saoirse',
    'gym-tipperary',
    'SAOIRSE: Okay, I need to process that. Go on, have a great night.',
    {
      look: 'saoirse',
    },
  ),
  leader('aoife', 'gym-kilkenny', 'AOIFE: You killed. I’m putting you in the set.'),
  leader('stradbally', 'gym-laois', 'DJ STRADBALLY: Absolute scenes. One more tune for the road.', {
    music: 'techno',
  }),
  leader('ciaran', 'gym-offaly', 'BROTHER CIARÁN: Go in peace. And mind yourself on the way home.'),
  leader('niamh', 'gym-westmeath', 'NIAMH: What a crowd. That’s us for the night.'),
  leader('keeper', 'gym-meath', 'THE KEEPER: The light favours you. Go on into the dawn.'),
  leader('dee', 'gym-kildare', 'COMMANDANT DEE: At ease. Carry on, soldier.', {
    before:
      'COMMANDANT DEE: Attention! Nobody leaves this session without getting past me. Fall in!',
  }),
  // ---------- Dublin and the main story ----------
  {
    id: 'thatcher',
    trainer: 'rival-5',
    look: 'rival',
    // Her story teams are the lads she picks against your starter, so none is hers.
    types: ['posh', 'brains'],
    before:
      'THATCHER: A night out? In Dublin? I have brought my pearls, my handbag and a very small sherry. Jolly good. Let’s begin.',
    after: 'THATCHER: Oh, go on then. I shall be getting a taxi to the Shelbourne. Cheerio!',
    line: 'THATCHER: The lady’s not for turning!',
  },
  {
    id: 'bns',
    trainer: 'bns',
    look: 'bns',
    before: 'B&S: Out on the town, are we? We’re B&S, Ranemon Champions of Ireland. Last orders!',
    after: 'B&S: …Fair play. Next round’s on us.',
  },
  {
    id: 'alex',
    trainer: 'trinity-alex',
    look: 'alex',
    after: 'ALEX SIMONIN: How do we always end up here? (He means the smoking area.)',
  },
  {
    id: 'mescal',
    trainer: 'dublin-mescal',
    look: 'mescal',
    before:
      'PAUL MESCAL: I’m on a night out with the lads. I’m wearing my GAA shorts. I’m having the time of my life. And yet… I’m really, really sad.',
    after: 'PAUL MESCAL: Oh no. Now I’m even sadder. …Wait. Is that a chipper?',
  },
  {
    id: 'pears',
    trainer: 'pear-dave',
    name: 'The Happy Pear Twins',
    look: 'pear',
    // Dave's and Steve's teams together.
    types: ['chill', 'brawn'],
    before:
      'DAVE: Eat the rainbow! STEVE: It’s our one night out a year! Two of us, one battle. Bring it on!',
    after: 'DAVE: Ah, nice one! STEVE: Wow. Fair play. Sea swim at six, if you’re still up?',
    line: 'STEVE: It’s leg day!',
  },
  {
    id: 'melchior',
    trainer: 'rent-melchior',
    look: 'melchior',
    after: 'MELCHIOR: This changes nothing. You’ll still never find out who took the rent.',
  },
  {
    id: 'mc',
    trainer: 'rent-mc',
    look: 'mc',
    after: 'MC: Grand, grand. Still small, still mighty. Still not telling you about the rent.',
  },
  {
    id: 'carl',
    name: 'Carl Ryan',
    look: 'carl',
    types: ['chaos', 'chill'],
    before:
      'CARL RYAN: Howya. Remember me from Temple Bar? I’ve a bag of Blue Ghosts and a team that’s on all of them.',
    after: 'CARL RYAN: No hard feelings. Mind yourself.',
    line: 'CARL RYAN: Ice cold, out of the bag!',
  },
  // ---------- side quests around Ireland ----------
  {
    id: 'poseidon',
    trainer: 'poseidon',
    look: 'poseidon',
    before:
      'POSEIDON: A mortal who can see me, on a night out. Josh Lee has been handing out tablets again. Very well: face the Atlantic!',
    after:
      'POSEIDON: …The sea has not lost since Atlantis. Tell no one. They would not believe you.',
  },
  {
    id: 'josh',
    name: 'Josh Lee',
    look: 'josh',
    types: ['chill', 'hype'],
    before:
      'JOSH LEE: Up from Bundoran for the night! The swell’s flat, so I’m here. Fancy a battle?',
    after: 'JOSH LEE: Absolute legend. Nobody in the Surf Club is going to believe me.',
    line: 'JOSH LEE: Paddle, paddle, paddle!',
  },
  {
    id: 'cramps',
    name: 'Cramps',
    look: 'cramps',
    music: 'techno',
    types: ['hype', 'chaos'],
    before:
      'CRAMPS: It’s me, Cramps! The DJ! Thursdays at the yacht club in Greystones! You’re on the guest list. Well. Sort of. Battle me for it.',
    after: 'CRAMPS: You’re on the guest list. Properly this time. I’ll sort it at the door.',
    line: 'CRAMPS: Bring it BACK!',
  },
  // ---------- the Rave Cave, Brighton and I Love Techno ----------
  {
    id: 'ravedj',
    name: 'Rave Cave DJ',
    look: 'dj',
    music: 'techno',
    types: ['hype', 'charm'],
    before:
      'DJ: (Without taking off the headphones.) WELCOME TO THE RAVE CAVE! NOBODY GETS TO THE FRONT WITHOUT A BATTLE!',
    after: 'DJ: (Still wearing the headphones.) RESPECT! THIS ONE’S FOR YOU!',
    line: 'DJ: HANDS IN THE AIR!',
  },
  {
    id: 'enda',
    name: 'Enda',
    look: 'enda',
    types: ['charm'],
    before:
      'ENDA: BEST FRIEND! You’re out too! Let’s have a battle! Best friends battle all the time. I think. Do they? COME ON!',
    after: 'ENDA: Best. Night. EVER. You’re still my best friend. Obviously.',
    line: 'ENDA: Go on, best friend!',
  },
  {
    id: 'king',
    trainer: 'arcade-king',
    look: 'king',
    after: 'THE ARCADE KING: …GAME OVER. For me. Insert coin to continue? No. I’m going home.',
  },
  {
    id: 'vandenbass',
    trainer: 'techno-dj',
    look: 'headliner',
    music: 'techno',
    before:
      'DJ VANDENBASS: Twenty-five years headlining. The night doesn’t start until I press play. And I don’t press play for anyone who can’t keep up.',
  },
  // ---------- the Championship in Galway ----------
  {
    id: 'lipsett',
    trainer: 'galway-lipsett',
    look: 'lipsett',
    before:
      'ROB LIPSETT: Out on the sesh, bro? Not me. Sparkling water, early night, cold plunge at 4am. But first: three scoops of preworkout and a battle. LET’S GO.',
    after: 'ROB LIPSETT: (He is shaking.) …That’s the preworkout, bro. Not you. Okay, a bit you.',
  },
  {
    id: 'blindboy',
    trainer: 'galway-blindboy',
    look: 'blindboy',
    before:
      'BLINDBOY: Story, boi. (The plastic bag rustles.) I’m going to talk to you about the history of the nightclub for a bit, and then I’m going to batter you.',
  },
  {
    id: 'johnnies',
    trainer: 'galway-johnnies',
    look: 'johnnyb',
    before:
      'JOHNNY B: Well, lads! JOHNNY SMACKS: WELL! JOHNNY B: Up from Cahir in the Hiace for the night out. The taxi rank is mental, so we’ll make this quick.',
  },
  {
    id: 'bono',
    trainer: 'galway-bono',
    look: 'bono',
    before:
      'BONO: (Sunglasses on. Indoors. At night.) I’ve played to a hundred thousand people in Rio. I can play to one. But I still haven’t found what I’m looking for. Maybe it’s you.',
  },
  {
    id: 'collins',
    trainer: 'galway-collins',
    look: 'collins',
    before:
      'MICHAEL COLLINS: I’m Michael Collins. I’ve held the title since 1922, and I’ve not missed a night out since either. Shall we?',
    after: 'MICHAEL COLLINS: …Well. That’s that, so. Mine’s a pint.',
  },
];
