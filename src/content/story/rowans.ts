import { interiorId } from './interiors';
import { MEGA_RING } from '@/lib/story/keys';
import {
  find,
  type GameMap,
  type Npc,
  type Step,
  type Trainer,
  type Yates,
} from '@/lib/story/world';

/**
 * The Ranelasses, at Rowans in Finsbury Park: the secret end of the London story. Beating King
 * Charles frees Kneecap and gets the Agreement signed, but Charles lets slip that he only ever
 * signed what he was told, and an unsigned text invites Próvaí and "the Champion" to Rowans. The
 * Victoria line from King's Cross runs there from then on, with Kneecap along for the ride.
 *
 * Rowans, the bowling alley that's a nightclub after dark, is eight rooms in a row, one per
 * Ranelass, like the Championship in Galway: each waits in front of the door to the next, shut
 * until she's beaten in this run, and a full heal starts the run again from the first (`RUN`,
 * `breakRun`). Each brings her own Ranemon (`RANELASS_MON`) and one ace that Mega evolves
 * (`Trainer.mega`). Viv leads them, on Lane One. Beat her and her Mega Ring is yours: your own
 * Conix, Hitmonollie, Carlizard, Steadakazam, Hitmonois, Lorchu, Cholokill and Clefenda can Mega
 * evolve, once a battle.
 *
 * Nothing before the reveal names them, so the hints in London stay hints. Finsbury Park and
 * Rowans are 2D only (`flat`).
 */

export const FINSBURY_PARK_ID = 'finsbury-park';

/** Rowans is the only landmark door in Finsbury Park. */
export const ROWANS_ID = interiorId(FINSBURY_PARK_ID, 'L', 0);

/** Charles has let it slip, and the text has come: the Victoria line runs to Finsbury Park. */
export const SHADOWS = 'rowans:shadows';

/** Off the train at Finsbury Park with Kneecap, the first time. */
export const ROWANS_ARRIVED = 'rowans:arrived';

/** The lights have gone down in Rowans and the Ranelasses have shown themselves. */
export const RANELASSES_MET = 'rowans:met';

/** Viv is beaten, the first time: the Mega Ring is yours. */
export const RANELASSES_BEATEN = 'rowans:champion';

/** The seven, in the order you meet them, and Viv behind them. */
export const RANELASSES = [
  'rowans-sibeal',
  'rowans-bhav',
  'rowans-ana',
  'rowans-annie',
  'rowans-esme',
  'rowans-meg',
  'rowans-batool',
];
export const VIV = 'rowans-viv';

/** What one run through Rowans has beaten so far. A full heal clears them all. */
export const RUN = [...RANELASSES, VIV].map((t) => `beat:${t}`);

/** Kept for good, unlike a run's beat flags: each one beaten at least once. */
export const wonFlag = (trainer: string) => `rowans:won:${trainer}`;

/** Wipes a run through Rowans: all eight can be fought again. */
export function breakRun(flags: string[]): string[] {
  return flags.some((f) => RUN.includes(f)) ? flags.filter((f) => !RUN.includes(f)) : flags;
}

const said = (text: string): Step[] => [{ do: 'say', text }];

// ---------- the reveal, after the Agreement ----------

/**
 * Said in the Throne Room once the Agreement is signed (palace.ts), or by Próvaí there for anyone
 * who signed it before this was in the game.
 */
export const REVEAL: Step[] = [
  ...said(
    'CHARLES: (Quietly, as he takes your glass.) You don’t really think it was me, do you? Running all this? I just sign things.',
  ),
  ...said(
    'CHARLES: Someone has been pulling the strings since long before Mummy. From the shadows. I’ve never seen them. They ring on a Tuesday, and one does what one is told.',
  ),
  ...said(
    'Próvaí’s phone buzzes. A text, from no number at all: “Lovely gig, lads. Rowans, Finsbury Park. Tonight. Bring the Champion. x”',
  ),
  ...said('MO CHARA: Rowans? The bowling alley? …We’re going, aren’t we.'),
  ...said(
    'PRÓVAÍ: Victoria line from King’s Cross, the guard at the far end. We’ll see you on the platform. Bring your best.',
  ),
  { do: 'flag', flag: SHADOWS },
];

// ---------- King's Cross: the Victoria line, and Kneecap waiting ----------

const KINGS_CROSS = { map: interiorId('london', 'L', 0), x: 12, y: 5, face: 'up' } as const;

/** Where the Victoria line leaves you: off the train at the top left, by the station. */
const ARRIVAL = { map: FINSBURY_PARK_ID, x: 1, y: 4, face: 'right' } as const;

const RIDE: Step[] = [
  {
    do: 'if',
    flag: ROWANS_ARRIVED,
    then: said('Two stops north on the Victoria line. Nobody on the train is talking.'),
    else: said(
      'Kneecap pile onto the Victoria line with you, Próvaí’s decks across three seats. Two stops north, every light in the carriage flickers at once. Móglaí Bap stops singing.',
    ),
  },
  { do: 'travel', ...ARRIVAL },
];

/** The guard at the far end of the King's Cross concourse, once the text has come. */
export const VICTORIA: Npc = {
  look: 'conductor',
  face: 'down',
  at: { x: 22, y: 4 },
  showIf: SHADOWS,
  talk: [
    {
      do: 'ask',
      text: 'GUARD: The Victoria line to Finsbury Park. Hop on?',
      yes: RIDE,
      no: said('GUARD: Suit yourself. It’s the one train nobody asked me to put on.'),
    },
  ],
};

/** Kneecap on the concourse, by the Victoria line, until you've been to Rowans together. */
export const KNEECAP_AT_KINGS_CROSS: Npc[] = [
  {
    look: 'mochara',
    face: 'up',
    at: { x: 20, y: 5 },
    showIf: SHADOWS,
    hideIf: ROWANS_ARRIVED,
    talk: said(
      'MO CHARA: Victoria line. The guard at the end. Whoever sent that text, we’re finding out.',
    ),
  },
  {
    look: 'moglai',
    face: 'up',
    at: { x: 21, y: 5 },
    showIf: SHADOWS,
    hideIf: ROWANS_ARRIVED,
    talk: said('MÓGLAÍ BAP: A kiss on the end of it. A KISS. I don’t like it.'),
  },
  {
    look: 'provai',
    face: 'up',
    at: { x: 19, y: 5 },
    showIf: SHADOWS,
    hideIf: ROWANS_ARRIVED,
    talk: said('PRÓVAÍ: Decks are packed. If it’s a gig, it’s a gig. If it’s not, it’s a battle.'),
  },
];

// ---------- the Ranelasses ----------

/**
 * Where each one's ace comes in against your best Ranemon, as in Galway: a few levels under it,
 * closing in on Viv, so they keep up with you all the way to 100.
 */
export const ABOVE: Record<string, number> = {
  'rowans-sibeal': -3,
  'rowans-bhav': -3,
  'rowans-ana': -3,
  'rowans-annie': -2,
  'rowans-esme': -2,
  'rowans-meg': -2,
  'rowans-batool': -2,
  'rowans-viv': -1,
};

const lass = (
  id: string,
  name: string,
  mega: string,
  team: [string, number][],
  before: string,
  after: string,
  line: string,
  reward: Step[] = [],
): Trainer => ({
  id,
  name,
  team,
  mega,
  ai: 'hard',
  above: ABOVE[id],
  prize: id === VIV ? 15000 : 8000,
  before,
  after,
  line,
  reward: [{ do: 'flag', flag: wonFlag(id) }, ...reward],
});

const VIV_REWARD: Step[] = [
  {
    do: 'if',
    flag: RANELASSES_BEATEN,
    then: said('VIV: Again? Fine. Same table next week. You’re buying the jug.'),
    else: [
      ...said(
        'VIV: (She takes off the sunglasses for the first time all night.) Eight of us. One after the other. Nobody has ever got past the shoe hire.',
      ),
      ...said(
        'VIV: The Royals, the Premier League, the Sidemen. Who do you think books their tables? Who do you think tells Charles when to sign? We let the lads think they run things. It’s less work for us.',
      ),
      ...said(
        'VIV: But you. You didn’t just beat our Ranemon. You beat them while they were Mega. Nobody does that.',
      ),
      ...said('VIV: Here. You’ve earned it. Don’t tell the lads where you got it.'),
      { do: 'flag', flag: MEGA_RING },
      ...said(
        'You got the MEGA RING! Once a battle, a Ranemon of yours that has a Mega form can Mega evolve: press MEGA EVOLVE before you pick its move.',
      ),
      ...said(
        'MO CHARA: (From the back of the lanes, holding a bowling ball he very clearly hasn’t paid for.) So the girls have been running it the whole time.',
      ),
      ...said('MÓGLAÍ BAP: Of course they have. Of course they have.'),
      ...said(
        'PRÓVAÍ: Well. We’ve a gig to play. (He plugs the decks into the bowling alley’s sound system. The Ranelasses are first on the dancefloor.)',
      ),
      { do: 'flag', flag: RANELASSES_BEATEN },
    ],
  },
];

export const ROWANS_TRAINERS: Trainer[] = [
  lass(
    'rowans-sibeal',
    'Sibeal',
    'hitmonois',
    [
      ['sibealmon', 58],
      ['robinmon', 58],
      ['owemon', 59],
      ['killemon', 59],
      ['oismon', 60],
    ],
    'SIBEAL: Surprised? You borrowed my dog once. You thought I was just the girl with the dog. Sibealmon comes to heel for nobody else on earth, and Hitmonois? I’ve trained him off the lead. Watch what he does when I let him go.',
    'SIBEAL: …Good dog. Not you. Him. Go on through, the rest of them aren’t as nice as me.',
    'SIBEAL: Heel!',
  ),
  lass(
    'rowans-bhav',
    'Dr Bhav',
    'cholokill',
    [
      ['bhavemon', 58],
      ['simomon', 58],
      ['hugomon', 59],
      ['vinnimon', 59],
      ['cholokill', 60],
    ],
    'DR BHAV: I told you in Greystones Ranemon were amazing. I didn’t tell you I’d been running a clinic for them in Finsbury Park for years. Bhavemon does exactly what I prescribe, and my Cholokill takes his WHABAM on doctor’s orders. Nobody else can get a dose like that out of him.',
    'DR BHAV: …That’s not in any of my textbooks. Go on. And don’t tell Greystones.',
    'DR BHAV: Doctor’s orders!',
  ),
  lass(
    'rowans-ana',
    'Ana',
    'hitmonollie',
    [
      ['anamon', 58],
      ['paulimon', 58],
      ['jammon', 59],
      ['boydemon', 59],
      ['olliemon', 60],
    ],
    'ANA: (She hasn’t spilled a drop of her pint all night.) Anamon only comes out in the sun, and only for me. And Hitmonollie? The lads have him throwing cans. I have him throwing punches. Nobody gets him to Mega but me.',
    'ANA: …I spilled it. I actually spilled it. Go on through.',
    'ANA: Cheers!',
  ),
  lass(
    'rowans-annie',
    'Annie',
    'steadakazam',
    [
      ['anniemon', 59],
      ['skehemon', 58],
      ['thilomon', 59],
      ['gibbsmon', 59],
      ['steadmon', 60],
    ],
    'ANNIE: (Sunglasses on, in a karaoke booth, glass of red in hand.) Anniemon won’t get off its scooter for anyone but me. And Steadakazam reads every page on Ranelads.com, but only the pages I’ve written. I tell it what to think. Then it Megas.',
    'ANNIE: …Well. That’s ruined the song. Go on through.',
    'ANNIE: Mic drop.',
  ),
  lass(
    'rowans-esme',
    'Esme',
    'clefenda',
    [
      ['esmeon', 59],
      ['crampemon', 59],
      ['robinmon', 59],
      ['paulimon', 60],
      ['enda', 61],
    ],
    'ESME: (She has the biggest smile in London and her spritz has a little umbrella in it.) Esmeon evolved for me at golden hour, and only for me. And Clefenda? Every party he’s ever thrown, I’ve been the one who let him throw it. He glows when I say glow.',
    'ESME: …Ah, stop! That was GORGEOUS. Go on, go on through.',
    'ESME: Golden hour!',
  ),
  lass(
    'rowans-meg',
    'Meg',
    'conix',
    [
      ['megamon', 60],
      ['killemon', 59],
      ['gibbsmon', 60],
      ['hugomon', 60],
      ['conemon', 61],
    ],
    'MEG: Mega. Megamon. Meg. Did you think that was a coincidence? Megamon’s mine and only mine, and Conix tries so hard for the lads he turns to stone. For me, he turns to diamond.',
    'MEG: …Grand. It’s grand. I’m grand. Go on.',
    'MEG: Go big!',
  ),
  lass(
    'rowans-batool',
    'Dr Batool',
    'lorchu',
    [
      ['batoolmon', 60],
      ['steadmon', 60],
      ['vinnimon', 60],
      ['owemon', 61],
      ['lorcamon', 62],
    ],
    'DR BATOOL: (Still in her gown and mortarboard.) I’ve delivered half the Ranemon in London, so they all listen to me. But Batoolmon listens to no one else at all, and Lorchu’s charge? I’m the only one who knows where to put the paddles.',
    'DR BATOOL: …Discharged. Go on through to Viv. Mind yourself.',
    'DR BATOOL: Clear!',
  ),
  lass(
    VIV,
    'Viv',
    'carlizard',
    [
      ['vivemon', 61],
      ['skehemon', 61],
      ['thilomon', 61],
      ['crampemon', 62],
      ['hugomon', 62],
      ['carlmon', 63],
    ],
    'VIV: (On Lane One, a jug of sangria on the scorer’s table, sunglasses on indoors.) You beat the King. Sweet. Who do you think told him to lose? Vivemon has never once listened to anyone but me, and the lads’ Carlizard flies over the crowd to the bar. Mine flies where I point. Shall we?',
    'VIV: …Well. Pour me another, then.',
    'VIV: Strike.',
    VIV_REWARD,
  ),
];

// ---------- Rowans ----------

/** Where each Ranelass stands, facing the way in, and how far she sees. */
const SIGHT = 4;

interface Room {
  name: string;
  rows: string[];
  things: Record<string, string>;
  /** Everyone in the room, the Ranelass first. */
  npcs: Npc[];
  arrive: Step[];
}

const LOOKS = ['sibeal', 'bhav', 'ana', 'annie', 'esme', 'meg', 'batool'] as const;

/** One of the seven: in the middle of her room, facing the way in. */
const battler = (i: number, after: string): Npc => ({
  look: LOOKS[i],
  face: 'down',
  trainer: RANELASSES[i],
  sight: SIGHT,
  ...(i > 0 && { readyIf: `beat:${RANELASSES[i - 1]}` }),
  talk: said(after),
});

/** The lights going down in the first room, and the eight of them, the first time. */
const REVEALED: Step[] = [
  ...said(
    'ROWANS. The music stops. The lanes go dark, one after another, and the disco ball over the dancefloor starts to turn.',
  ),
  ...said(
    'Eight silhouettes on the scoreboards over the lanes. Sunglasses, indoors, at night. Somebody is pouring sangria.',
  ),
  ...said(
    'VIV: (Over the PA.) Welcome to Rowans. We’re the Ranelasses. Did you really think the lads were in charge? Of course it’s the girls. It was always the girls.',
  ),
  ...said(
    'VIV: Every one of us has a Ranemon nobody else can handle, and a Mega nobody else can make. Eight in a row, no healing. Lose, and it’s back to the shoe hire.',
  ),
  ...said('MO CHARA: (Behind you, very quietly.) Lads. Lads. We are in so much trouble.'),
  { do: 'flag', flag: RANELASSES_MET },
];

const ROOMS: Room[] = [
  {
    name: 'Shoe Hire',
    rows: [
      'WWWWWWLWWWWWW',
      'WmmkkkkkkkmmW',
      'Wmkkkk1kkkkmW',
      'WkkkkkkkkkkkW',
      'WCCCkkkkkCCCW',
      'WkkkkkkkkkkkW',
      'WmkkkkkkkkkmW',
      'WNkkkk@kkkkNW',
      'WWWWWWEWWWWWW',
    ],
    things: {
      m: 'An arcade machine. The high score on every one of them is SIB.',
      C: 'The shoe hire counter. Every pair is a size you aren’t.',
      N: 'A potted palm, in a bowling shoe.',
    },
    npcs: [battler(0, 'SIBEAL: Go on through. Norm says good luck. Norm doesn’t mean it.')],
    arrive: [
      {
        do: 'if',
        flag: RANELASSES_MET,
        then: [
          {
            do: 'if',
            flag: RUN[0],
            then: said('ROWANS. You’re still on your run. Don’t go near the bar.'),
            else: said(
              'ROWANS. Eight in a row, no healing in between. Heal or lose, and it’s back to the shoe hire.',
            ),
          },
        ],
        else: REVEALED,
      },
    ],
  },
  {
    name: 'The Pool Tables',
    rows: [
      'WWWWWWLWWWWWW',
      'WVVVFFFFFVVVW',
      'WNFFFF1FFFFNW',
      'WUUFFFFFFFUUW',
      'WFFFFFFFFFFFW',
      'WUUFFFFFFFUUW',
      'WFFFFFFFFFFFW',
      'WNFFFF@FFFFNW',
      'WWWWWWEWWWWWW',
    ],
    things: {
      V: 'A rack of cues, and a jar of chalk. Someone has labelled it PRESCRIPTION ONLY.',
      U: 'A pool table. The eight ball is in a pill bottle.',
      N: 'A rubber plant. It looks healthier than you.',
    },
    npcs: [
      battler(1, 'DR BHAV: Take two of these and go through to Ana. (She hands you nothing.)'),
    ],
    arrive: said('THE POOL TABLES. The click of balls, and the smell of an oat latte.'),
  },
  {
    name: 'The Bar',
    rows: [
      'WWWWWWLWWWWWW',
      'WVVVVFFFVVVVW',
      'WCCCCF1FCCCCW',
      'WFFFFFFFFFFFW',
      'WUFFFFFFFFFUW',
      'WFFFFFFFFFFFW',
      'WUFFFFFFFFFUW',
      'WNFFFF@FFFFNW',
      'WWWWWWEWWWWWW',
    ],
    things: {
      V: 'Every spirit in London, and one bottle of Buckfast nobody will admit to.',
      C: 'The bar. A sign on it says NO HEALING ON A RUN. Somebody has underlined it twice.',
      U: 'A high table with a pint on it. Not a drop spilled.',
      N: 'A plant in a pint glass.',
    },
    npcs: [battler(2, 'ANA: Through you go. Don’t touch my pint.')],
    arrive: said('THE BAR. Sun lamps over every stool, for some reason.'),
  },
  {
    name: 'The Karaoke Booth',
    rows: [
      'WWWWWWLWWWWWW',
      'WIDDDkkkDDDIW',
      'WIkkkk1kkkkIW',
      'WnnkkkkkkknnW',
      'WkkkkkkkkkkkW',
      'WnnkkkkkkknnW',
      'WkkkkkkkkkkkW',
      'WNkkkk@kkkkNW',
      'WWWWWWEWWWWWW',
    ],
    things: {
      D: 'The karaoke screen. The next song queued is DANCING QUEEN, eight times.',
      I: 'A speaker, turned up to eleven.',
      n: 'A velvet booth. There’s a lipstick kiss on the table.',
      N: 'A fake plant, glittered.',
    },
    npcs: [battler(3, 'ANNIE: On you go. The next booth’s got a disco ball.')],
    arrive: said('THE KARAOKE BOOTH. Somebody has been singing Dancing Queen since nine.'),
  },
  {
    name: 'The Dancefloor',
    rows: [
      'WoooooLoooooW',
      'WIllll1llllIW',
      'WIllllllllllW',
      'WllllllllllIW',
      'WIllllllllllW',
      'WllllllllllIW',
      'WIllllllllllW',
      'WIllll@llllIW',
      'WWWWWWEWWWWWW',
    ],
    things: {
      I: 'A speaker stack. The bass is so deep your Ranemon can feel it.',
      o: 'A wall of lights. Golden hour, on a loop.',
    },
    npcs: [battler(4, 'ESME: Go on! Go on! Meg’s in the diner.')],
    arrive: said('THE DANCEFLOOR. Rowans after dark: a disco ball, and nobody dancing yet.'),
  },
  {
    name: 'The Diner',
    rows: [
      'WWWWWWLWWWWWW',
      'WCCCCF1FCCCCW',
      'WFFFFFFFFFFFW',
      'WnnFUFFFUFnnW',
      'WFFFFFFFFFFFW',
      'WnnFUFFFUFnnW',
      'WFFFFFFFFFFFW',
      'WNFFFF@FFFFNW',
      'WWWWWWEWWWWWW',
    ],
    things: {
      C: 'The diner counter. Hot dogs, nachos, and a drinks pouch with a straw in it.',
      U: 'A table. Somebody has carved MEGA into it.',
      n: 'A red leather booth, still warm.',
      N: 'A plant with a bowling pin for a pot.',
    },
    npcs: [battler(5, 'MEG: Batool’s through there. She’s still in the gown. Don’t mention it.')],
    arrive: said('THE DINER. Nachos, neon, and a booth for eight with a RESERVED sign.'),
  },
  {
    name: 'The VIP Lanes',
    rows: [
      'WWWWWWLWWWWWW',
      'WXggXgggXggXW',
      'WggggX1XggggW',
      'WgggggggggggW',
      'WnnnngggnnnnW',
      'WgggggggggggW',
      'WnnnngggnnnnW',
      'WNgggg@ggggNW',
      'WWWWWWEWWWWWW',
    ],
    things: {
      X: 'The pins at the end of a lane, all standing. Nobody has bowled here in years.',
      n: 'The VIP seats. A graduation photo on every one.',
      N: 'A plant, and a stethoscope hung on it.',
    },
    npcs: [battler(6, 'DR BATOOL: Viv’s on Lane One. Good luck. You’ll need it.')],
    arrive: said('THE VIP LANES. Velvet ropes, and the scores on the screens are all perfect.'),
  },
  {
    name: 'Lane One',
    rows: [
      'WWWWWWWWWWWWW',
      'WDDDDDDDDDDDW',
      'WXggXg1gXggXW',
      'WgggggggggggW',
      'Wggg2ggg3gggW',
      'WCgggggggggCW',
      'WgggggggggggW',
      'WNgggg@ggggNW',
      'WWWWWWEWWWWWW',
    ],
    things: {
      D: 'The scoreboard. Eight names, every one of them a strike: SIB, BHAV, ANA, ANNIE, ESME, MEG, BAT, VIV.',
      X: 'Ten pins, standing, and a jug of sangria on the end of the lane.',
      C: 'The scorer’s table. A Mega Ring sits on it in a glass case.',
      N: 'A palm in a gold bowling ball.',
    },
    npcs: [
      {
        look: 'viv',
        face: 'down',
        trainer: VIV,
        sight: SIGHT,
        readyIf: `beat:${RANELASSES[6]}`,
        talk: [
          {
            do: 'if',
            flag: RANELASSES_BEATEN,
            then: said('VIV: Mind the ring. They don’t make many.'),
            else: said('VIV: Seven of us down. One to go. Me.'),
          },
        ],
      },
      {
        look: 'mochara',
        face: 'up',
        showIf: RANELASSES_BEATEN,
        talk: said('MO CHARA: The girls run everything. I’m not even annoyed. I’m impressed.'),
      },
      {
        look: 'moglai',
        face: 'up',
        showIf: RANELASSES_BEATEN,
        talk: said('MÓGLAÍ BAP: Rowans, though. Best gig we’ve ever played. Don’t tell the Mall.'),
      },
    ],
    arrive: [
      {
        do: 'if',
        flag: RANELASSES_BEATEN,
        then: said('LANE ONE. Kneecap on the decks, the Ranelasses on the dancefloor.'),
        else: said(
          'LANE ONE. One lane, lit gold. Viv is waiting at the end of it with a jug of sangria.',
        ),
      },
    ],
  },
];

/** The door at the top of each of the seven's rooms: shut until she's beaten in this run. */
const doorOut = (i: number): Record<number, { flag: string; locked: string; opened: string }> => ({
  0: {
    flag: `beat:${RANELASSES[i]}`,
    locked: 'The door is shut. A sign on it: STAFF AND RANELASSES ONLY.',
    opened: 'The door swings open.',
  },
});

const room = (i: number): Pick<GameMap, 'rows' | 'npcs' | 'name'> & Partial<GameMap> => ({
  name: ROOMS[i].name,
  rows: ROOMS[i].rows,
  npcs: ROOMS[i].npcs,
  things: ROOMS[i].things,
  arrive: ROOMS[i].arrive,
  ...(i < RANELASSES.length && { landmarkLocks: doorOut(i) }),
});

/** The rooms, in order: the first behind Rowans' door, each next one behind the last's. */
export const ROWANS_ROOM_IDS = [ROWANS_ID];
for (let i = 1; i < ROOMS.length; i++)
  ROWANS_ROOM_IDS.push(interiorId(ROWANS_ROOM_IDS[i - 1], 'L', 0));

// ---------- Finsbury Park ----------

const BACK_TO_KINGS_CROSS: Step[] = [
  {
    do: 'ask',
    text: 'GUARD: Victoria line, back to King’s Cross?',
    yes: [
      ...said('Two stops south. The lights don’t flicker on the way back.'),
      { do: 'travel', ...KINGS_CROSS },
    ],
    no: said('GUARD: Right you are. Mind yourself in that bowling alley.'),
  },
];

const WELCOME: Step[] = [
  ...said(
    'FINSBURY PARK. The station, the park, and over the road, Rowans: a bowling alley by day, a nightclub after dark. The sign is lit, pink and gold.',
  ),
  ...said(
    'PRÓVAÍ: That’s where the text said. Rowans. (He looks up at it.) The lights are on, but there’s no music. There’s always music.',
  ),
  ...said(
    'MO CHARA: W.B Yates is on the corner if your Ranemon need a pint first. Go in fresh. We’re right behind you.',
  ),
  { do: 'flag', flag: ROWANS_ARRIVED },
];

const FINSBURY_YATES: Yates = {
  owner: {
    look: 'barman',
    face: 'down',
    talk: [
      ...said(
        'DECLAN: W.B Yates Finsbury Park. Declan, from Donegal. I’ve worked across from Rowans for fifteen years. I don’t go in. Nobody from in here goes in.',
      ),
      {
        do: 'if',
        flag: RANELASSES_BEATEN,
        then: said('DECLAN: You came out with a ring on. Fair play. Fair play.'),
        else: said(
          'DECLAN: A pint before you go over, so. Heal up here and you start from the shoe hire, mind. That’s their rule, not mine.',
        ),
      },
    ],
  },
  things: {
    V: 'Every whiskey in Ireland, and a framed scorecard from Rowans: eight strikes, signed with lipstick.',
    U: 'A table. There’s a bowling pin on it. Nobody knows how it got here.',
    J: 'A turf fire.',
  },
};

/**
 * Finsbury Park: the station at the top left, W.B Yates and a shop, and Rowans along the top,
 * the park below the road, with long grass in it.
 */
export const FINSBURY_PARK: GameMap = {
  id: FINSBURY_PARK_ID,
  name: 'Finsbury Park, London',
  county: 9,
  // New places are 2D only: the 3D look shows Finsbury Park and Rowans in 2D.
  flat: true,
  terraces: 'english',
  uk: true,
  yates: FINSBURY_YATES,
  arrive: [{ do: 'if', flag: ROWANS_ARRIVED, then: [], else: WELCOME }],
  rows: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'TWWWWWTTTTTTTTTTTTTTTTTT',
    'T^^^^^^^^^^^^^^^^^^^^^^T',
    'T#####P#M#####L########T',
    'T@vvvvvvvvvvvvvvvvvvvvvT',
    'Tv1vvvvvvvvv2vvv3vv4vvvT',
    'TaaaaaaaaaaaaaaaaaaaaaaT',
    'TaacaaaaaaaaaaaaaaaaacaT',
    'TvvvvvvvvvvvvvvSvvvvvvvT',
    'Tv,,,,,,,,vvvvv,,,,,,,vT',
    'Tv,,,,,,,,vv5vv,,,,,,,vT',
    'TvvvvvvvvvvvvvvvvvvvvvvT',
    'TTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  scenery: [{ x0: 1, x1: 5, y0: 1, y1: 3, kind: 'underground', label: 'FINSBURY PARK' }],
  // The park's long grass: what the Ranelasses fight with.
  wild: {
    min: 56,
    max: 60,
    table: [
      ['gibbsmon', 15],
      ['olliemon', 15],
      ['oismon', 15],
      ['lorcamon', 15],
      ['conemon', 15],
      ['enda', 15],
      ['carlmon', 10],
    ],
  },
  npcs: [
    { look: 'conductor', face: 'down', talk: BACK_TO_KINGS_CROSS },
    {
      look: 'mochara',
      face: 'up',
      talk: [
        {
          do: 'if',
          flag: RANELASSES_BEATEN,
          then: said('MO CHARA: I’m still not over it. The girls. The whole time.'),
          else: said('MO CHARA: Go on in. We’ll be right behind you. A bit behind you.'),
        },
      ],
    },
    {
      look: 'moglai',
      face: 'up',
      talk: said('MÓGLAÍ BAP: I’ve played every venue in London. Never Rowans. It never had us.'),
    },
    {
      look: 'provai',
      face: 'up',
      talk: said('PRÓVAÍ: Whoever’s in there, I want my decks on that sound system by midnight.'),
    },
    {
      look: 'local',
      face: 'up',
      talk: said(
        'LOCAL: Rowans? Been there since the forties. Bowling by day, the club at night. Lately there’s a table of eight in there every night in sunglasses, and nobody’s ever seen them pay.',
      ),
    },
  ],
  signs: [
    'FINSBURY PARK. Rowans Tenpin Bowl over the road. Victoria line to King’s Cross: the guard by the station.',
  ],
  landmarks: [said('ROWANS TENPIN BOWL. Bowling, pool, karaoke and the club upstairs. Open late.')],
  landmarkLabels: { 0: { text: 'ROWANS', colour: '#e8508a' } },
  landmarkRooms: { 0: room(0) },
};

/** The rooms past the first, each one behind the door at the top of the room before. */
export const ROWANS_ROOMS: GameMap[] = ROWANS_ROOM_IDS.slice(1).map((id, j) => {
  const door = find(FINSBURY_PARK, 'L')[0];
  return {
    ...room(j + 1),
    id,
    county: FINSBURY_PARK.county,
    name: `${ROOMS[j + 1].name}, Rowans`,
    inside: { map: FINSBURY_PARK.id, ...door },
  };
});
