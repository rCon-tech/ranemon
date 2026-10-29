import type { StoryState } from '@/lib/story/state';
import type { Look } from '@/lib/story/world';
import { HEAD_OF_SECURITY, TECHNO_DJ } from './techno';
import { CHAMPION_OF_IRELAND, wonFlag } from './galway';
import { TECHNO_DONE } from './cramps';
import { BRIGHTON_DONE } from './enda';
import { ARCADE_KING } from './brighton';
import { BEAT_PEARS, BHAV_TRAINER } from './greystones';
import { INTERIORS, MAPS } from './maps';
import { MESCAL_TRAINER } from './mescal';
import { NICK_TRAINER } from './nick';
import { RENT_DONE } from './rent';
import { COLLISONS } from './silicon';
import { JAMIE } from './sidemen';
import { NEESON_TRAINER } from './neeson';
import { NORM_RETURNED } from './sibeal';
import { ELVIS_RETURNED } from '@/lib/story/norm';
import { CHAMPION_SKIN } from '@/lib/online/rules';

/**
 * Skins: the characters you can walk around as. Beat someone in the story, or finish their side
 * quest, and their look is yours to wear, picked from SKINS on the START menu. A skin is one of
 * the overworld's people (`Look`, drawn by `people.ts`), so it needs no new art.
 *
 * A new character gets a skin with one entry in SKINS: their look, a name, the flags that unlock
 * it (all of them), and a hint for while it's locked. `beat('trainer-id')` is the flag for
 * beating a trainer, and `wearing('look')` is every trainer dressed that way, found in the maps.
 * Skins are 2D: in the 3D look you're always drawn in the usual cap and jacket.
 */
export interface Skin {
  /** Also the `Look` the player is drawn in. */
  id: Look | 'player';
  name: string;
  /** Every flag that has to be set. Empty is unlocked from the start. */
  unlock: string[];
  /** Said on the Skins screen while it's locked. */
  hint: string;
  /**
   * Not kept in any save: worn only while the save server says you hold the Online Champion's
   * crown, and gone the moment someone beats you for it.
   */
  online?: boolean;
}

export const DEFAULT_SKIN = 'player';

const beat = (...trainers: string[]) => trainers.map((t) => `beat:${t}`);

let worn: Map<string, string[]> | null = null;
/** Every trainer who wears a look, from the maps, their rooms and the Ball. */
export function wearing(look: Look): string[] {
  if (!worn) {
    const found = new Map<string, Set<string>>();
    const walk = (v: unknown): void => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        if (typeof o.look === 'string' && typeof o.trainer === 'string') {
          if (!found.has(o.look)) found.set(o.look, new Set());
          found.get(o.look)!.add(o.trainer);
        }
        Object.values(o).forEach(walk);
      }
    };
    walk([MAPS, INTERIORS]);
    worn = new Map([...found].map(([k, v]) => [k, [...v]]));
  }
  return worn.get(look) ?? [];
}

export const SKINS: Skin[] = [
  { id: 'player', name: 'You', unlock: [], hint: '' },
  {
    id: CHAMPION_SKIN,
    name: 'Online Champion',
    unlock: [],
    hint: 'Beat the Online Champion in a friend battle. Only one trainer can wear it.',
    online: true,
  },
  // ---------- the main story ----------
  {
    id: 'rival',
    name: 'Margaret Thatcher',
    unlock: beat('rival-5'),
    hint: 'Beat your rival for the last time.',
  },
  {
    id: 'saoirse',
    name: 'Saoirse',
    unlock: beat('gym-tipperary'),
    hint: 'Beat the Tipperary gym leader.',
  },
  {
    id: 'leader',
    name: 'Gym Leader',
    unlock: ['jersey:all'],
    hint: 'Win every county jersey.',
  },
  {
    id: 'scholar',
    name: 'Scholar',
    unlock: beat(...wearing('scholar')),
    hint: 'Beat every scholar in Trinity.',
  },
  { id: 'bns', name: 'B&S', unlock: beat('bns'), hint: 'Beat B&S under the Campanile.' },
  {
    id: 'higgins',
    name: 'Michael D Higgins',
    unlock: ['champion'],
    hint: 'Become Champion of Ireland.',
  },
  {
    id: 'alex',
    name: 'Alex Simonin',
    unlock: beat('trinity-alex'),
    hint: 'How do we always end up here? Beat him in Trinity.',
  },
  {
    id: 'legend',
    name: 'Legend',
    unlock: ['caught:tobymon'],
    hint: 'Follow the legend of Dublin to the end.',
  },
  // ---------- side quests and bosses ----------
  {
    id: 'sibeal',
    name: 'Sibeal',
    unlock: [NORM_RETURNED],
    hint: 'Take Norm for a walk, then give him back.',
  },
  {
    id: 'carl',
    name: 'Carl Ryan',
    unlock: [ELVIS_RETURNED],
    hint: 'Walk Elvis for Carl in McGrattans, then bring him back.',
  },
  {
    id: 'poseidon',
    name: 'Poseidon',
    unlock: beat('poseidon'),
    hint: 'Beat the god of the sea in Bundoran.',
  },
  {
    id: 'josh',
    name: 'Josh Lee',
    unlock: beat('poseidon'),
    hint: 'Do what nobody in the Surf Club believes: beat Poseidon.',
  },
  {
    id: 'ollie',
    name: 'Ollie',
    unlock: [RENT_DONE],
    hint: 'Find out who took the rent.',
  },
  { id: 'mc', name: 'MC', unlock: [RENT_DONE], hint: 'Find out who took the rent.' },
  {
    id: 'melchior',
    name: 'Melchior',
    unlock: [RENT_DONE],
    hint: 'Find out who took the rent.',
  },
  {
    id: 'pear',
    name: 'Happy Pear Twins',
    unlock: [BEAT_PEARS],
    hint: 'Beat both twins in Greystones.',
  },
  { id: 'kill', name: 'Kill', unlock: [BEAT_PEARS], hint: 'Sort out Greystones.' },
  { id: 'stead', name: 'Stead', unlock: [BEAT_PEARS], hint: 'Sort out Greystones.' },
  {
    id: 'nick',
    name: 'Nick',
    unlock: beat(NICK_TRAINER),
    hint: 'Find what the second most French man in Ireland lost in Tipperary, then beat him.',
  },
  {
    id: 'bhav',
    name: 'Dr Bhav',
    unlock: beat(BHAV_TRAINER),
    hint: 'Prove a Ranemon hater in Greystones wrong.',
  },
  {
    id: 'cyclist',
    name: 'Cyclist',
    unlock: beat(...wearing('cyclist')),
    hint: 'Beat the cyclist in Greystones.',
  },
  {
    id: 'mescal',
    name: 'Paul Mescal',
    unlock: beat(MESCAL_TRAINER),
    hint: 'Cheer up a very sad man in Dublin. With a battle.',
  },
  {
    id: 'raver',
    name: 'Raver',
    unlock: beat(...wearing('raver')),
    hint: 'Beat every raver in the Rave Cave.',
  },
  {
    id: 'clubber',
    name: 'Clubber',
    unlock: beat(...wearing('clubber')),
    hint: 'Beat every clubber in the Rave Cave.',
  },
  {
    id: 'shuffler',
    name: 'Shuffler',
    unlock: beat(...wearing('shuffler')),
    hint: 'Beat every shuffler in the Rave Cave.',
  },
  {
    id: 'dj',
    name: 'Rave Cave DJ',
    unlock: beat(...wearing('raver'), ...wearing('clubber'), ...wearing('shuffler')),
    hint: 'Beat all nine trainers in the Rave Cave.',
  },
  {
    id: 'enda',
    name: 'Enda',
    unlock: [BRIGHTON_DONE],
    hint: 'Go on Enda’s trip to Brighton.',
  },
  {
    id: 'hen',
    name: 'Hen',
    unlock: beat(...wearing('hen')),
    hint: 'Beat the hen party on Brighton seafront.',
  },
  {
    id: 'fan',
    name: 'Seagulls Fan',
    unlock: beat(...wearing('fan')),
    hint: 'Beat the Seagulls fans at the Amex.',
  },
  {
    id: 'palace',
    name: 'Palace Fan',
    unlock: beat(...wearing('palace')),
    hint: 'Beat the Crystal Palace fan at the Amex.',
  },
  {
    id: 'gamer',
    name: 'Gamer',
    unlock: beat(...wearing('gamer')),
    hint: 'Beat every gamer in the Brighton arcade.',
  },
  {
    id: 'king',
    name: 'Arcade King',
    unlock: beat(ARCADE_KING),
    hint: 'Take the crown in the Brighton arcade.',
  },
  {
    id: 'security',
    name: 'Security',
    unlock: beat(HEAD_OF_SECURITY),
    hint: 'Get past the head of security in Ghent.',
  },
  {
    id: 'headliner',
    name: 'DJ Vandenbass',
    unlock: beat(TECHNO_DJ),
    hint: 'Beat the headliner at I Love Techno.',
  },
  // ---------- the Championship in Galway ----------
  {
    id: 'lipsett',
    name: 'Rob Lipsett',
    unlock: [wonFlag('galway-lipsett')],
    hint: 'Beat the first of the four in Galway’s Hall of Champions.',
  },
  {
    id: 'blindboy',
    name: 'Blindboy Boatclub',
    unlock: [wonFlag('galway-blindboy')],
    hint: 'Beat the second of the four in Galway’s Hall of Champions.',
  },
  {
    id: 'johnnyb',
    name: 'Johnny B',
    unlock: [wonFlag('galway-johnnies')],
    hint: 'Beat the third of the four in Galway’s Hall of Champions.',
  },
  {
    id: 'johnnysmacks',
    name: 'Johnny Smacks',
    unlock: [wonFlag('galway-johnnies')],
    hint: 'Beat the third of the four in Galway’s Hall of Champions.',
  },
  {
    id: 'bono',
    name: 'Bono',
    unlock: [wonFlag('galway-bono')],
    hint: 'Beat all four in Galway’s Hall of Champions, in a row.',
  },
  {
    id: 'collins',
    name: 'Michael Collins',
    unlock: [CHAMPION_OF_IRELAND],
    hint: 'Somebody is waiting at the top of Galway’s Hall of Champions.',
  },
  {
    id: 'cramps',
    name: 'Cramps',
    unlock: [TECHNO_DONE],
    hint: 'Go to I Love Techno with Cramps.',
  },
  // ---------- Silicon Docks ----------
  {
    id: 'techie',
    name: 'Tech Worker',
    unlock: beat(...wearing('techie')),
    hint: 'Beat everyone on staff in the HQs of Silicon Docks, Dublin.',
  },
  {
    id: 'pichai',
    name: 'Sundar Pichai',
    unlock: beat('silicon-pichai'),
    hint: 'Beat the CEO at the top of Google in Silicon Docks, Dublin.',
  },
  {
    id: 'zuckerberg',
    name: 'Mark Zuckerberg',
    unlock: beat('silicon-zuckerberg'),
    hint: 'Beat the CEO at the top of Meta in Silicon Docks, Dublin.',
  },
  {
    id: 'nadella',
    name: 'Satya Nadella',
    unlock: beat('silicon-nadella'),
    hint: 'Beat the CEO at the top of Microsoft in Silicon Docks, Dublin.',
  },
  {
    id: 'cook',
    name: 'Tim Cook',
    unlock: beat('silicon-cook'),
    hint: 'Beat the CEO at the top of Apple in Silicon Docks, Dublin.',
  },
  {
    id: 'bezos',
    name: 'Jeff Bezos',
    unlock: beat('silicon-bezos'),
    hint: 'Beat the CEO at the top of Amazon in Silicon Docks, Dublin.',
  },
  {
    id: 'chew',
    name: 'Shou Chew',
    unlock: beat('silicon-chew'),
    hint: 'Beat the CEO at the top of TikTok in Silicon Docks, Dublin.',
  },
  {
    id: 'musk',
    name: 'Elon Musk',
    unlock: beat('silicon-musk'),
    hint: 'Beat the CEO at the top of X in Silicon Docks, Dublin.',
  },
  {
    id: 'pcollison',
    name: 'Patrick Collison',
    unlock: beat(COLLISONS),
    hint: 'Beat every CEO in Silicon Docks, Dublin. Two more are waiting at the end.',
  },
  {
    id: 'jcollison',
    name: 'John Collison',
    unlock: beat(COLLISONS),
    hint: 'Beat every CEO in Silicon Docks, Dublin. Two more are waiting at the end.',
  },
  {
    id: 'ksi',
    name: 'KSI',
    unlock: beat('sidemen-ksi'),
    hint: 'Beat the Sideman in the boxing ring at Wembley Park, London.',
  },
  {
    id: 'miniminter',
    name: 'Miniminter',
    unlock: beat('sidemen-miniminter'),
    hint: 'Beat the Sideman in the Sidemen FC clubhouse at Wembley Park, London.',
  },
  {
    id: 'zerkaa',
    name: 'Zerkaa',
    unlock: beat('sidemen-zerkaa'),
    hint: 'Beat the Sideman in the clothes shop at Wembley Park, London.',
  },
  {
    id: 'behzinga',
    name: 'Behzinga',
    unlock: beat('sidemen-behzinga'),
    hint: 'Beat the Sideman in the gym at Wembley Park, London.',
  },
  {
    id: 'vikkstar',
    name: 'Vikkstar123',
    unlock: beat('sidemen-vikkstar'),
    hint: 'Beat the Sideman in the Gaming House at Wembley Park, London.',
  },
  {
    id: 'tbj',
    name: 'TBJ',
    unlock: beat('sidemen-tbj'),
    hint: 'Beat the Sideman in Sides at Wembley Park, London.',
  },
  {
    id: 'jamie',
    name: 'Jamie Elliott',
    unlock: beat(JAMIE),
    hint: 'Beat all six Sidemen at Wembley Park, London, then their leader on the pitch.',
  },
  {
    id: 'neeson',
    name: 'Liam Neeson',
    unlock: beat(NEESON_TRAINER),
    hint: 'Somebody left W.B Yates with a very particular set of skills. Find him, and beat him.',
  },
];

const BY_ID = new Map(SKINS.map((s) => [s.id as string, s]));

export const skinById = (id: string): Skin | undefined => BY_ID.get(id);

/** Whether a skin's flags are all set, whether or not the save has it yet. */
export function earned(s: Pick<StoryState, 'flags'>, skin: Skin): boolean {
  if (skin.online) return false;
  const flags = new Set(s.flags);
  return skin.unlock.every((f) => flags.has(f));
}

/**
 * Whether a save has a skin to wear. The Online Champion's is never in a save: it's there only
 * while `champion` (the save server says this trainer holds the crown).
 */
export const hasSkin = (s: Pick<StoryState, 'skins'>, skin: Skin, champion = false) =>
  skin.online ? champion : skin.id === DEFAULT_SKIN || !!s.skins?.includes(skin.id);

/** Skins the save has earned but not been given yet. */
export const newSkins = (s: Pick<StoryState, 'flags' | 'skins'>): Skin[] =>
  SKINS.filter((k) => !hasSkin(s, k) && earned(s, k));

/** Gives a save every skin it has earned, and the lines that announce them. */
export function unlockSkins(s: StoryState): { state: StoryState; lines: string[] } {
  const fresh = newSkins(s);
  if (!fresh.length) return { state: s, lines: [] };
  return {
    state: { ...s, skins: [...(s.skins ?? []), ...fresh.map((k) => k.id)] },
    lines: fresh.map(
      (k) => `You unlocked the ${k.name} skin! Wear it from SKINS on the START menu.`,
    ),
  };
}

/** Wears a skin the save has, or goes back to the usual look. */
export function wearSkin(s: StoryState, id: string, champion = false): StoryState {
  const skin = skinById(id);
  if (!skin || !hasSkin(s, skin, champion)) return s;
  if (skin.id === DEFAULT_SKIN) {
    const rest = { ...s };
    delete rest.skin;
    return rest;
  }
  return { ...s, skin: skin.id };
}

/**
 * The look the player is drawn in: their skin, or the usual one if this build doesn't know it.
 * A Champion who loses the crown goes back to the usual look, though the save still says
 * they're wearing it, so it comes back if they win it again.
 */
export function lookOf(s: Pick<StoryState, 'skin' | 'skins'>, champion = false): Look | 'player' {
  const skin = s.skin ? skinById(s.skin) : undefined;
  return skin && hasSkin(s, skin, champion) ? skin.id : DEFAULT_SKIN;
}
