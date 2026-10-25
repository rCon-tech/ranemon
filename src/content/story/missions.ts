import { BALL_FLAG } from './ball';
import { TECHNO_ASKED, TECHNO_DONE, TECHNO_MET } from './cramps';
import { BRIGHTON_DONE, ENDA_ASKED, ENDA_MET, MATCH_DONE } from './enda';
import { BEAT_PEARS, PEAR_HEARD } from './greystones';
import { LEGEND_FLAG } from './maps';
import { RENT_ACCUSED, RENT_CLUES, RENT_DONE, RENT_READY, RENT_START } from './rent';
import { HEAD_OF_SECURITY } from './techno';
import {
  AGREEMENT,
  CHAMPION,
  FIXTURES,
  LANDED,
  PROVAI_ASKED,
  PROVAI_MET,
  UK_STARTER,
} from './kneecap';
import { FIXTURE_LIST, PL_FLAGS } from './premier';
import { CHAMPION_OF_IRELAND, COLLINS_HEARD } from './galway';
import { COLLISONS, SEVEN, SILICON_SEVEN, SILICON_START } from './silicon';
import { SIDEMEN_ARRIVED, SIDEMEN_DONE, SIDEMEN_SIX, SIDEMEN_START, SIX } from './sidemen';
import { TABLET, TABLET_TAKEN } from '@/lib/story/keys';
import { beatFlag } from '@/lib/story/state';

/**
 * Missions: the main story and every side story, as START → MISSIONS shows them. A mission is
 * open once its `start` flag is set (or from the beginning, with no `start`) until its `done`
 * flag is. What it says to do next is the first step whose `until` flag isn't set yet.
 *
 * To add a mission, add one entry to `MISSIONS`, using the flags its story already sets. The
 * screen needs no other change. See docs/story-mode.md (Missions).
 */

export interface MissionStep {
  /** This is what to do next until this flag is set. */
  until: string;
  /** The objective, or a hint at it. */
  todo: string;
  /** Where to go for it. */
  where: string;
  /** Flags to count as progress, shown as 1/3 and so on, such as clues or beads. */
  count?: readonly string[];
}

export interface Mission {
  id: string;
  name: string;
  /** One line on what it's about. */
  about: string;
  /** Open once this flag is set. Left out, it's open from the start. */
  start?: string;
  /** Closed for good once this flag is set. */
  done: string;
  steps: MissionStep[];
}

/** The legend's coral beads, in the order you're given them. */
const BEADS = ['bead:liffey', 'bead:busker', 'bead:templebar'];

/** Each gym on the road, in order, for the main story's steps. */
const GYMS: [county: string, gym: string, where: string][] = [
  ['Clare', 'the trad session gym', 'Co. Clare'],
  ['Limerick', 'Big Donncha’s gym at Thomond Park', 'Limerick City'],
  ['Tipperary', 'Saoirse’s gym at Semple Stadium', 'Thurles, Co. Tipperary'],
  ['Kilkenny', 'Aoife’s gym at the Cat Laughs', 'Kilkenny City'],
  ['Laois', 'DJ Stradbally’s gym at the Electric Picnic', 'Stradbally, Co. Laois'],
  ['Offaly', 'Brother Ciarán’s gym in the scriptorium', 'Clonmacnoise, Co. Offaly'],
  ['Westmeath', 'Niamh’s gym at the homecoming gig', 'Mullingar, Co. Westmeath'],
  ['Meath', 'the Keeper’s gym at Newgrange', 'Brú na Bóinne, Co. Meath'],
  ['Kildare', 'Commandant Dee’s gym at the army camp', 'The Curragh, Co. Kildare'],
];

export const MISSIONS: Mission[] = [
  {
    id: 'champions',
    name: 'Champions of Ireland',
    about:
      'B&S have shut themselves into Trinity. Michael D wants someone from the country to take the title off them.',
    done: BALL_FLAG,
    steps: [
      {
        until: 'starter',
        todo: 'Michael D is in the village and asking for you. Go and pick your first Ranemon.',
        where: 'The farmhouse, Newmarket-on-Fergus, Co. Clare',
      },
      ...GYMS.map(([county, gym, where]) => ({
        until: `jersey:${county.toLowerCase()}`,
        todo: `Win the ${county} jersey at ${gym}.`,
        where,
      })),
      {
        until: BALL_FLAG,
        todo: 'Show your nine jerseys at the Front Gate, get past the scholars and beat B&S under the Campanile.',
        where: 'Trinity College Dublin',
      },
    ],
  },
  {
    id: 'rent',
    name: 'The missing rent',
    about:
      'The rent money is gone from Ollie and Alex Simonin’s biscuit tin, and it was one of the housemates.',
    start: RENT_START,
    done: RENT_DONE,
    steps: [
      {
        until: RENT_READY,
        todo: 'Find three clues: ask Alex Simonin, the neighbour outside and the Garda on the quays.',
        where: 'The rent house and the quays, Dublin',
        count: RENT_CLUES,
      },
      {
        until: RENT_ACCUSED,
        todo: 'You have all three clues. Accuse MC or Melchior. There’s no taking it back.',
        where: 'The rent house, Dublin',
      },
      {
        until: RENT_DONE,
        todo: 'Beat whoever you accused.',
        where: 'The rent house, Dublin',
      },
    ],
  },
  {
    id: 'greystones',
    name: 'The Happy Pear Twins',
    about: 'Greystones is under the terrible rule of the Happy Pear Twins.',
    start: PEAR_HEARD,
    done: BEAT_PEARS,
    steps: [
      {
        until: BEAT_PEARS,
        todo: 'Beat Dave and then Steve, back to back, with no healing in between.',
        where: 'The beach, Greystones, Co. Wicklow',
      },
    ],
  },
  {
    id: 'poseidon',
    name: 'Poseidon',
    about: 'Josh Lee swears a god lives out on the rocks, and his tablet lets you see him.',
    start: TABLET,
    done: beatFlag('poseidon'),
    steps: [
      {
        until: TABLET_TAKEN,
        todo: 'Take Josh Lee’s tablet, from the key items in your BAG.',
        where: 'Anywhere',
      },
      {
        until: beatFlag('poseidon'),
        todo: 'Find Poseidon out on the rocks and beat him.',
        where: 'Tullan Strand, Bundoran, Co. Donegal',
      },
    ],
  },
  {
    id: 'legend',
    name: 'The legend of Dublin',
    about: 'A story about a Ranemon older than the city, that nobody has seen in years.',
    start: BEADS[0],
    done: 'caught:tobymon',
    steps: [
      {
        until: 'bead:busker',
        todo: 'Collect the coral beads. Follow the music: the busker sings the old song.',
        where: 'By the Phoenix Park, Dublin',
        count: BEADS,
      },
      {
        until: LEGEND_FLAG,
        todo: 'One bead left. Ask the barman in Temple Bar about the old song.',
        where: 'Temple Bar, Dublin',
        count: BEADS,
      },
      {
        until: 'caught:tobymon',
        todo: 'Somewhere on the hill, an old door creaked open. Something is waiting inside.',
        where: 'The Hellfire Club, Dublin',
      },
    ],
  },
  {
    id: 'brighton',
    name: 'Brighton with Enda',
    about: 'Enda wants to go on an adventure to Brighton with you, Ollie and Kill.',
    start: ENDA_MET,
    done: BRIGHTON_DONE,
    steps: [
      {
        until: ENDA_ASKED,
        todo: 'Tell Enda yes. He’s waiting by the road.',
        where: 'The Curragh, Co. Kildare',
      },
      {
        until: 'visited:brighton',
        todo: 'Get the Sail & Rail to Brighton from platform 3.',
        where: 'Connolly Station, Dublin',
      },
      {
        until: MATCH_DONE,
        todo: 'Find Enda in the front row and watch Brighton against Crystal Palace.',
        where: 'The Amex, Brighton',
      },
      {
        until: BRIGHTON_DONE,
        todo: 'Get past the gamers and beat the Arcade King at the back.',
        where: 'The arcade, Brighton',
      },
    ],
  },
  {
    id: 'techno',
    name: 'I Love Techno',
    about:
      'Cramps and the crew are going to I Love Techno in Belgium to celebrate, and you’re coming.',
    start: TECHNO_MET,
    done: TECHNO_DONE,
    steps: [
      {
        until: TECHNO_ASKED,
        todo: 'Tell Cramps yes. He’s hanging around the concourse.',
        where: 'Connolly Station, Dublin',
      },
      {
        until: 'visited:belgium',
        todo: 'Get the Eurostar to Ghent from platform 4.',
        where: 'Connolly Station, Dublin',
      },
      {
        until: beatFlag(HEAD_OF_SECURITY),
        todo: 'Security won’t let anyone in. Battle your way down the queue to the door.',
        where: 'Flanders Expo, Ghent',
      },
      {
        until: TECHNO_DONE,
        todo: 'Get past stage security and beat DJ Vandenbass at the decks.',
        where: 'Flanders Expo, Ghent',
      },
    ],
  },
  {
    id: 'kneecap',
    name: 'Free the Lads',
    about:
      'Mo Chara and Móglaí Bap of Kneecap went to London on a mission and never came back. DJ Próvaí needs you.',
    start: PROVAI_MET,
    done: AGREEMENT,
    steps: [
      {
        until: PROVAI_ASKED,
        todo: 'Tell Próvaí yes. He’s on the concourse.',
        where: 'Connolly Station, Dublin',
      },
      {
        until: LANDED,
        todo: 'Get the airport bus from platform 7, then the Ryanair flight to London Stansted.',
        where: 'Dublin Airport',
      },
      {
        until: UK_STARTER,
        todo: 'Get the Stansted Express into London, and find Próvaí in W.B Yates.',
        where: 'London',
      },
      {
        until: FIXTURES,
        todo: 'Hear Próvaí out. What happened the lads?',
        where: 'W.B Yates, London',
      },
      // The twelve legends, in order: the trains go from King's Cross.
      ...FIXTURE_LIST.map((f, i) => ({
        // The last one makes you Champion.
        until: i === FIXTURE_LIST.length - 1 ? CHAMPION : f.flag,
        todo: `Beat ${f.legend} for the ${f.club} jersey.`,
        where: f.ground,
        count: PL_FLAGS,
      })),
      {
        until: AGREEMENT,
        todo: 'Get through the Royal Family, room by room, and beat King Charles. Bridie in the East Wing will make you a cup of tea.',
        where: 'Buckingham Palace, London',
      },
    ],
  },
  {
    id: 'galway',
    name: 'The Championship of Ireland',
    about:
      'Four of the best in the country wait in the Hall of Champions in Galway, one after the other.',
    start: 'visited:galway',
    done: CHAMPION_OF_IRELAND,
    steps: [
      {
        until: COLLINS_HEARD,
        todo: 'Beat Rob Lipsett, Blindboy Boatclub, The 2 Johnnies and Bono in a row. Heal at McGrattans, or lose, and you start again from the first.',
        where: 'The Hall of Champions, Galway',
      },
      {
        until: CHAMPION_OF_IRELAND,
        todo: 'Beat the four in a row again, then the secret Champion behind Bono’s door.',
        where: 'The Hall of Champions, Galway',
      },
    ],
  },
  {
    id: 'silicon',
    name: 'Silicon Docks',
    about:
      'Every big tech company has an HQ in Silicon Docks, and every one of their CEOs is up for a battle.',
    start: SILICON_START,
    done: beatFlag(COLLISONS),
    steps: [
      {
        until: SILICON_SEVEN,
        todo: 'Beat the CEOs of Google, Meta, Microsoft, Apple, Amazon, TikTok and X, at the top of each HQ.',
        where: 'Silicon Docks, Dublin',
        count: SEVEN.map(beatFlag),
      },
      {
        until: beatFlag(COLLISONS),
        todo: 'Stripe’s door is open. Two lads from Tipperary are waiting inside.',
        where: 'Stripe, Silicon Docks, Dublin',
      },
    ],
  },
  {
    id: 'sidemen',
    name: 'The Eighth Sideman',
    about:
      'Jamie Elliott’s Sidemen are a man short for the Charity Match at Wembley. Beat all six of the lads, then him, and the spot is yours.',
    start: SIDEMEN_START,
    done: SIDEMEN_DONE,
    steps: [
      {
        until: SIDEMEN_ARRIVED,
        todo: 'Get the Metropolitan line to Wembley Park. The guard is at the end of the platforms.',
        where: 'King’s Cross, London',
      },
      {
        until: SIDEMEN_SIX,
        todo: 'Beat KSI, Miniminter, Zerkaa, Behzinga, Vikkstar123 and TBJ, in any order. Each is filming behind a door with a sign over it.',
        where: 'Wembley Park, London',
        count: SIX.map(beatFlag),
      },
      {
        until: SIDEMEN_DONE,
        todo: 'All six are beaten. Jamie Elliott is waiting on the pitch.',
        where: 'Wembley Stadium, London',
      },
    ],
  },
];
