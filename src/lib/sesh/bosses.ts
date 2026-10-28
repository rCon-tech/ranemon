import type { RaneType } from '../battle/types';

/**
 * A boss in The Sesh: one of the main game's named characters, out on the same night. Who you
 * meet is random every run and doesn't set the difficulty; the stage does, through the boss's
 * level, team size and CPU. Each comes as the character you know, with their lines, and a new
 * team of photo Ranemon built around the types of their story team (`bossTypes`).
 */
export interface Boss {
  id: string;
  /** Their story trainer, for their name, lines and types. */
  trainer: string;
  /** Overrides for the story's, where theirs only fit the story (a jersey, say). */
  name?: string;
  before?: string;
  after?: string;
  /** The types their team is built around, where their story team doesn't say it well. */
  types?: RaneType[];
}

/**
 * The pool. The Ranelasses are never in it: they're kept for the end of the Long Sesh.
 */
export const BOSSES: Boss[] = [
  {
    id: 'nora',
    trainer: 'gym-clare',
    after: 'NÓRA: Lovely playing. You’d keep time with any session.',
  },
  {
    id: 'donncha',
    trainer: 'gym-limerick',
    after: 'BIG DONNCHA: You’ve a fine low centre of gravity. Go on to the next one.',
  },
  {
    id: 'saoirse',
    trainer: 'gym-tipperary',
    after: 'SAOIRSE: Okay, I need to process that. Go on, have a great night.',
  },
  {
    id: 'aoife',
    trainer: 'gym-kilkenny',
    after: 'AOIFE: You killed. I’m putting you in the set.',
  },
  {
    id: 'stradbally',
    trainer: 'gym-laois',
    after: 'DJ STRADBALLY: Absolute scenes. One more tune for the road.',
  },
  {
    id: 'ciaran',
    trainer: 'gym-offaly',
    after: 'BROTHER CIARÁN: Go in peace. And mind yourself on the way home.',
  },
  {
    id: 'niamh',
    trainer: 'gym-westmeath',
    after: 'NIAMH: What a crowd. That’s us for the night.',
  },
  {
    id: 'keeper',
    trainer: 'gym-meath',
    after: 'THE KEEPER: The light favours you. Go on into the dawn.',
  },
  {
    id: 'dee',
    trainer: 'gym-kildare',
    before:
      'COMMANDANT DEE: Attention! Nobody leaves this session without getting past me. Fall in!',
    after: 'COMMANDANT DEE: At ease. Carry on, soldier.',
  },
];
