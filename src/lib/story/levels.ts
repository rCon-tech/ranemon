import { trainerById } from '@/content/story/trainers';
import { MAX_LEVEL } from '../battle/creature';
import { beatFlag, type StoryState } from './state';

/**
 * The level cap and level scaling. Until B&S are beaten, no Ranemon can grow past the level of
 * the next gym leader's ace, by EXP or by Blue Ghost. Beat that leader and the cap goes up to the
 * next one's. Once you're Champion there's no cap, and every trainer battle scales up to your
 * party instead, so the missions after the gyms are still a fight.
 */

/** Every gym leader, in the order you meet them on the road. B&S at Trinity are the last. */
export const GYM_ORDER = [
  'gym-clare',
  'gym-limerick',
  'gym-tipperary',
  'gym-kilkenny',
  'gym-laois',
  'gym-offaly',
  'gym-westmeath',
  'gym-meath',
  'gym-kildare',
  'bns',
];

/** Set when B&S are beaten (the same flag as the Trinity Ball). */
const CHAMPION = 'champion';

export interface LevelCap {
  level: number;
  /** The leader to beat to lift it, or null once there's no cap. */
  leader: string | null;
}

type Flags = Pick<StoryState, 'flags'>;
const has = (s: Flags, flag: string) => s.flags.includes(flag);

const aceOf = (team: [string, number][]) => Math.max(...team.map(([, l]) => l));

/** How high a save's Ranemon can grow right now. */
export function levelCap(s: Flags): LevelCap {
  const champion = has(s, CHAMPION);
  const next = GYM_ORDER.find((id) => !has(s, beatFlag(id)));
  if (champion || !next) return { level: MAX_LEVEL, leader: null };
  const t = trainerById(next);
  return { level: aceOf(t.team), leader: t.name };
}

/** Whether trainers scale to your party: once you're Champion. */
export const scales = (s: Flags) => has(s, CHAMPION);

/**
 * A trainer's team, scaled up to the party once you're Champion: the whole team goes up by the
 * same amount, so its ace is as high as your best Ranemon. A team is never made weaker.
 */
export function scaleTeam(
  team: [string, number][],
  s: Pick<StoryState, 'flags' | 'party'>,
): [string, number][] {
  if (!scales(s) || !team.length || !s.party.length) return team;
  const best = Math.max(...s.party.map((m) => m.level));
  const up = Math.max(0, best - aceOf(team));
  return team.map(([id, level]) => [id, Math.min(MAX_LEVEL, level + up)]);
}
