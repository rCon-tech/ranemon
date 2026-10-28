import { trainerById } from '@/content/story/trainers';
import type { Difficulty } from '../battle/cpu';
import { lineOf } from '../battle/evolutions';
import { hasMega } from '../battle/mega';
import { Rng, seedFrom } from '../battle/rng';
import type { RaneType } from '../battle/types';
import { UK } from '../battle/uk';
import type { SongId } from '../sound/songs';
import type { ItemId } from '../story/items';
import { makeMember, speciesById, type Member } from '../story/party';
import type { Look } from '../story/world';
import { BOSSES, type Boss } from './bosses';
import { deal, lookFor, SESH_POOL } from './party';
import { fightLevel, type Stage, type StageId } from './stages';

/** Someone to battle at a node, or a stage's boss. */
export interface SeshFoe {
  /** The story trainer they are, or a Sesh one, for their lines (and later their look). */
  id: string;
  name: string;
  team: Member[];
  ai: Difficulty;
  before: string;
  after: string;
  /** Said each time they send out a Ranemon. */
  line?: string;
  /** Euro for beating them. */
  prize: number;
  /** Their ace Mega evolves: The Afterparty's boss, when their ace has a Mega form. */
  mega?: string;
  /** What a Bouncer drops: a held item, or the Mega Ring from The Afterparty's. */
  drop?: ItemId | 'mega-ring';
  kind: 'fight' | 'bouncer' | 'boss';
  /** A boss's story look, drawn on the Briefing. */
  look?: Look;
  /** A boss's battle theme. */
  music?: SongId;
}

/** Who you meet at an ordinary fight, by stage: the main game's own trainers, with new teams. */
export const FIGHTERS: Record<StageId, string[]> = {
  pub: [
    'dublin-stag',
    'airport-hen',
    'airport-stag',
    'airport-camper',
    'lads-dec',
    'lads-gav',
    'lads-fiach',
    'lads-ringleader',
    'kildare-punter',
    'brighton-hen',
    'rent-mc',
    'limerick-munster',
  ],
  club: [
    'rave-aoife',
    'rave-darragh',
    'rave-niamh',
    'rave-cian',
    'rave-sorcha',
    'rave-podge',
    'rave-kev',
    'rave-orla',
    'rave-mossy',
    'laois-raver',
  ],
  after: [
    'silicon-googler',
    'silicon-metamate',
    'silicon-msft',
    'silicon-genius',
    'silicon-picker',
    'silicon-creator',
    'silicon-hardcore',
    'silicon-stripe',
  ],
};

interface Bouncer {
  id: string;
  name: string;
  before: string;
  after: string;
}

/** Door staff who won't let you in yet, by stage. The Rave Cave's are from I Love Techno. */
export const BOUNCERS: Record<StageId, Bouncer[]> = {
  pub: [
    {
      id: 'sesh-doorman-gerry',
      name: 'Doorman Gerry',
      before: 'DOORMAN GERRY: Not tonight, lads. Not in those runners. Unless you can battle.',
      after: 'DOORMAN GERRY: Go on, so. Mind the step.',
    },
    {
      id: 'sesh-doorman-bernie',
      name: 'Doorwoman Bernie',
      before: 'BERNIE: Regulars only. Prove you’re a regular.',
      after: 'BERNIE: Fair enough. You’re a regular now.',
    },
  ],
  club: ['techno-wouter', 'techno-ilse', 'techno-dirk', 'techno-bart'].map((id) => {
    const t = trainerById(id);
    return { id, name: t.name, before: t.before, after: t.after };
  }),
  after: [
    {
      id: 'sesh-concierge',
      name: 'Concierge Fiona',
      before: 'CONCIERGE FIONA: Which apartment? Whose party? Nobody goes up without a battle.',
      after: 'CONCIERGE FIONA: Penthouse. Take the lift. Don’t touch the plants.',
    },
    {
      id: 'sesh-security',
      name: 'Building Security Dan',
      before: 'SECURITY DAN: It’s six in the morning. Residents only. Or winners.',
      after: 'SECURITY DAN: Grand. I didn’t see you.',
    },
  ],
};

/** Held items a Bouncer can drop. */
export const DROPS: ItemId[] = ['xanax', 'friendship-bracelet', 'vegan-stone'];

/** A foe's Ranemon: dealt from the pool at a level, in a random look. */
function member(species: string, level: number, uid: number, rng: Rng): Member {
  const look = lookFor(species, rng);
  const m = makeMember(species, level, uid, look === UK ? UK : undefined);
  return look && look !== UK ? { ...m, variant: look } : m;
}

/** A seeded RNG for one node of one stage of a run, so the same run always meets the same foes. */
export const nodeRng = (seed: number, stage: number, row: number, col: number, what = '') =>
  new Rng(seedFrom(`${seed}:${stage}:${row}:${col}:${what}`));

/** An ordinary fight: mostly 1 Ranemon, now and then 2, at the stage's level for that pick. */
export function fightAt(seed: number, stage: Stage, s: number, row: number, col: number): SeshFoe {
  const rng = nodeRng(seed, s, row, col, 'fight');
  const level = fightLevel(stage, row);
  const pool = FIGHTERS[stage.id];
  const t = trainerById(pool[rng.int(0, pool.length - 1)]);
  const count = rng.chance(0.3) ? 2 : 1;
  const team = deal(rng, count).map((id, i) =>
    member(id, i === count - 1 ? level : level - 1, -1 - i, rng),
  );
  return {
    id: t.id,
    name: t.name,
    team,
    ai: 'normal',
    before: t.before,
    after: t.after,
    line: t.line,
    prize: 20 * level,
    kind: 'fight',
  };
}

/**
 * A Bouncer: Hard, with a bigger team, and a held item for getting past them. The Afterparty's
 * drops the Mega Ring if you haven't got it, so the last fights can Mega evolve.
 */
export function bouncerAt(
  seed: number,
  stage: Stage,
  s: number,
  row: number,
  col: number,
  ringed: boolean,
): SeshFoe {
  const rng = nodeRng(seed, s, row, col, 'bouncer');
  const pool = BOUNCERS[stage.id];
  const b = pool[rng.int(0, pool.length - 1)];
  const { level, team: size } = stage.bouncer;
  const team = deal(rng, size).map((id, i) =>
    member(id, i === size - 1 ? level : level - 1, -1 - i, rng),
  );
  const drop = stage.id === 'after' && !ringed ? 'mega-ring' : DROPS[rng.int(0, DROPS.length - 1)];
  return { ...b, team, ai: 'hard', prize: 30 * level, drop, kind: 'bouncer' };
}

/**
 * The types a boss's team is built around: the two their story team has most of, so each comes
 * as the character you know, with a new team of photo Ranemon at the stage's level.
 */
export function bossTypes(boss: Boss): RaneType[] {
  if (boss.types) return boss.types;
  if (!boss.trainer) throw new Error(`${boss.id} needs types`);
  const count = new Map<RaneType, number>();
  for (const [species] of trainerById(boss.trainer).team) {
    for (const t of speciesById(species).types) count.set(t, (count.get(t) ?? 0) + 1);
  }
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([t]) => t);
}

/**
 * A boss's team for a stage: `size` Ranemon of their types where the pool has enough (any
 * others where it doesn't), every one at the stage's level and the ace last. At The Afterparty
 * the ace is one with a Mega form if their types allow, and it Mega evolves.
 */
export function bossTeam(
  boss: Boss,
  stage: Stage,
  rng: Rng,
  mega: boolean,
): { team: Member[]; mega?: string } {
  const types = bossTypes(boss);
  const fits = (id: string) => speciesById(id).types.some((t) => types.includes(t));
  const { level, team: size } = stage.boss;
  const picks: string[] = [];
  const take = (from: string[]) => {
    const pool = from.filter((id) => !picks.some((p) => lineOf(p) === lineOf(id)));
    if (pool.length) picks.push(pool[rng.int(0, pool.length - 1)]);
  };
  if (mega) take(SESH_POOL.filter((id) => hasMega(id) && fits(id)));
  while (picks.length < size) {
    const fitting = SESH_POOL.filter(fits);
    const before = picks.length;
    take(fitting);
    if (picks.length === before) take(SESH_POOL);
  }
  // The ace goes out last.
  const order = [...picks.slice(1), picks[0]];
  const team = order.map((id, i) =>
    member(id, i === order.length - 1 ? level : level - 2, -1 - i, rng),
  );
  const ace = order[order.length - 1];
  return { team, ...(mega && hasMega(ace) && { mega: ace }) };
}

/** The bosses for a run: one per stage, drawn from the whole pool, never the same one twice. */
export function bossesFor(seed: number, stages: number): string[] {
  const rng = new Rng(seedFrom(`${seed}:bosses`));
  const pool = BOSSES.map((b) => b.id);
  return Array.from({ length: stages }, () => pool.splice(rng.int(0, pool.length - 1), 1)[0]);
}

/** A stage's boss, at the stage's level and team size. Bosses are Hard. */
export function bossAt(seed: number, stage: Stage, s: number, id: string): SeshFoe {
  const boss = BOSSES.find((b) => b.id === id)!;
  const rng = new Rng(seedFrom(`${seed}:${s}:boss`));
  const { team, mega } = bossTeam(boss, stage, rng, stage.id === 'after');
  const t = boss.trainer ? trainerById(boss.trainer) : undefined;
  const name = boss.name ?? t?.name;
  const before = boss.before ?? t?.before;
  const after = boss.after ?? t?.after;
  if (!name || !before || !after) throw new Error(`${boss.id} needs a name and lines`);
  return {
    id: boss.id,
    name,
    team,
    ai: 'hard',
    before,
    after,
    line: boss.line ?? t?.line,
    prize: 50 * stage.boss.level,
    ...(mega && { mega }),
    kind: 'boss',
    look: boss.look,
    music: boss.music ?? 'boss',
  };
}
