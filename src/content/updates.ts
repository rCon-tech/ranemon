/**
 * What's new, newest first, for the Updates screen. Players read this, so no spoilers: say
 * what there is to find, never who or what it is, and nothing about test or developer tools.
 */
export interface Update {
  /** The day it went live, as YYYY-MM-DD. */
  date: string;
  title: string;
  notes: string[];
}

export const UPDATES: Update[] = [
  {
    date: '2026-10-21',
    title: 'A new look for Olliemon',
    notes: [
      'Olliemon has a brand new photo, drawn in twice the detail of before.',
      'In the 3D look he stands in battle as a solid, rounded figure instead of a flat picture.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'Sound and music',
    notes: [
      'The game has music now: its own tunes for the road, the city, the pub, home, gyms, the bike and four kinds of battle, plus jingles for levels, items and new friends.',
      'Every Ranemon has a cry of its own, and moves, hits and menus all make a noise.',
      'Tap ♪ at the top of the screen for music and effects, effects only, or off. SOUND TEST on the title plays them all.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'Get around faster',
    notes: [
      'Someone in Limerick is handing out passes for a brand new way to get about. Hold B to ride.',
      'Once you have one, a new option on the START menu takes you back to any town you’ve already been to.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'New at Vapes',
    notes: [
      'The shop now sells vapes, from Limerick on. Use one in battle to give the Ranemon that’s out a boost for the rest of the fight.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'A new friend',
    notes: ['A four-legged friend is waiting for you somewhere along the road. Say hello.'],
  },
  {
    date: '2026-10-21',
    title: 'Try the 2.5D look',
    notes: ['Tap the 3D button at the top of the screen to see the map and battles in 2.5D.'],
  },
  {
    date: '2026-10-21',
    title: 'Safer saves',
    notes: [
      'Your game is backed up as you play, and older saves carry over to new versions.',
      'Save codes let you move your game to another phone or browser.',
      'Online saves can be locked with a PIN.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'All aboard',
    notes: ['A train now runs from Dublin. Where it goes, and what’s waiting there, is up to you.'],
  },
  {
    date: '2026-10-21',
    title: 'Loads of new moves',
    notes: [
      '36 new moves themed on soccer, rugby, padel, golf, video games and F1, learnt as your Ranemon level up.',
      'Each Ranemon fights with 4 moves. Swap them in and out from PARTY.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'The Town Map',
    notes: [
      'Open MAP from START, or tap the place name, to see where you’ve been and which jerseys you’ve won.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'Sharper characters',
    notes: [
      'Everyone has been redrawn in far more detail.',
      'The locals in Dublin have an old story to tell, if you’re willing to listen.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'A fresh coat of paint',
    notes: [
      'Painted battle backgrounds, a livelier overworld, and moves that show how well they’ll land.',
    ],
  },
  {
    date: '2026-10-20',
    title: 'Shinies and Exp Share',
    notes: [
      'Very rarely, a wild Ranemon is shiny: golden, sparkling, and worth catching.',
      'Turn on Exp Share from START to give your whole party the EXP.',
    ],
  },
  {
    date: '2026-10-20',
    title: 'Speed and a guide',
    notes: [
      'The ▶ button speeds the game up to 2× or 4×.',
      'New How to play page, with the type chart.',
    ],
  },
];

/** The newest update, to tell whether there's something new since you last looked. */
export const LATEST = `${UPDATES[0].date}:${UPDATES[0].title}`;
export const SEEN_KEY = 'ranemon.updates.seen';
