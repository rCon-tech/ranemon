import { BALL_FLAG } from './ball';
import { TECHNO_ASKED, TECHNO_DONE, TECHNO_MET } from './cramps';
import { BRIGHTON_DONE, ENDA_ASKED, ENDA_MET, MATCH_DONE } from './enda';
import { BEAT_PEARS, PEAR_HEARD } from './greystones';
import { LEGEND_FLAG } from './maps';
import { RENT_ACCUSED, RENT_CLUES, RENT_DONE, RENT_READY, RENT_START } from './rent';
import { HEAD_OF_SECURITY } from './techno';
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
];
