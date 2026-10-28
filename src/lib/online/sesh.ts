import { countsFor, dailySeed } from '../sesh/daily';
import { replayRun, scoreOf, type SeshAction } from '../sesh/run';
import { trainerId } from './rules';

/**
 * The Sesh's boards on the save server. A finished run goes up as its seed and every choice
 * made, never as a score: the server replays it on the game's own code (`replayRun`), which
 * turns away any choice the game wouldn't allow, and works out the score itself.
 *
 *   POST /api/sesh {op: 'submit', name, pin | device, v, seed, daily?, actions, newDevice?}
 *                                    → {ok, score, best, device?}: `best` if it's the name's best
 *                                      for that day and seed, and with the PIN and `newDevice` a
 *                                      device token to send from then on in place of it. 401 wrong PIN, 404 no
 *                                      online save, 409 'update' if the phone is on a different
 *                                      version of the rules, 400 a run that doesn't replay.
 *   POST /api/sesh {op: 'board', day} → {day, rows}: that day's Daily Challenge, best first
 *   POST /api/sesh {op: 'winners', before}
 *                                    → {rows}: each past day's winner, newest first
 *   POST /api/sesh {op: 'mine', name} → {free, daily}: the name's best free runs and dailies
 *
 * Who you are is your trainer name and PIN, as for online saves and friend battles: the name
 * needs an online save, and the phone's device token works in place of the PIN, so a run
 * finished offline goes up later without asking. A Daily Challenge only counts on its own day's
 * seed, and only if it's in within 48 hours of the day ending (`countsFor`). This file has no
 * I/O: storage and the PIN check come in a SeshContext, so the tests run it against memory.
 */

/** Bumped when a change to the game would make an old run replay differently. */
export const SESH_RULES = 1;

/** A free run's `day`. */
export const FREE = 'free';

/** A run on a board. */
export interface SeshEntry {
  id: string;
  name: string;
  /** The Daily Challenge's day, or FREE. */
  day: string;
  seed: number;
  score: number;
  beaten: number;
  standing: number;
  turns: number;
  /** When the server took it. */
  at: number;
  /** The choices, as JSON, to replay it again by hand. */
  actions: string;
}

/** A run as a board shows it. */
export type SeshRow = Omit<SeshEntry, 'actions' | 'id' | 'seed'>;

export interface SeshStore {
  /** Keeps a run, unless the name already has a better one for that day and seed. */
  put(entry: SeshEntry): Promise<boolean>;
  /** A day's runs, best first, ties to whoever got there first. */
  board(day: string, limit: number): Promise<SeshRow[]>;
  /** The best run of each day before `before`, newest day first. */
  winners(before: string, limit: number): Promise<SeshRow[]>;
  /** A name's best runs on a day (or FREE), or on any day but FREE with `day` null. */
  mine(id: string, day: string | null, limit: number): Promise<SeshRow[]>;
}

export interface SeshContext {
  runs: SeshStore;
  /** Checks a name's PIN against its online save. */
  auth(id: string, pin: string): Promise<'ok' | 'pin' | 'locked' | 'nosave'>;
  /** Whether a device token was handed out for the name. */
  device(id: string, token: string): Promise<boolean>;
  /** Hands out a new device token for the name, if the server keeps them. */
  newDevice(id: string): Promise<string | null>;
  now(): number;
}

export interface Reply {
  status: number;
  body: object;
}

export const BOARD_SIZE = 20;
/** Past days' winners shown. */
export const WINNERS = 14;
/** A run's choices can't be longer than this, as JSON. */
const MAX_ACTIONS_BYTES = 200 * 1024;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

const fail = (status: number, error: string): Reply => ({ status, body: { error } });
const isObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

export async function seshCall(body: unknown, ctx: SeshContext): Promise<Reply> {
  if (!isObject(body)) return fail(400, 'bad request');
  const { op } = body;

  if (op === 'board') {
    if (typeof body.day !== 'string' || !DAY.test(body.day)) return fail(400, 'bad day');
    return {
      status: 200,
      body: { day: body.day, rows: await ctx.runs.board(body.day, BOARD_SIZE) },
    };
  }
  if (op === 'winners') {
    if (typeof body.before !== 'string' || !DAY.test(body.before)) return fail(400, 'bad day');
    return { status: 200, body: { rows: await ctx.runs.winners(body.before, WINNERS) } };
  }
  if (op === 'mine') {
    const id = typeof body.name === 'string' ? trainerId(body.name) : '';
    if (!id) return fail(400, 'bad name');
    const [free, daily] = await Promise.all([
      ctx.runs.mine(id, FREE, 5),
      ctx.runs.mine(id, null, 14),
    ]);
    return { status: 200, body: { free, daily } };
  }
  if (op !== 'submit') return fail(400, 'bad request');

  if (body.v !== SESH_RULES) return fail(409, 'update');
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 20) : '';
  const id = trainerId(name);
  if (!id) return fail(400, 'bad name or PIN');
  const byDevice = typeof body.device === 'string' && body.pin === undefined;
  if (byDevice) {
    if (!(await ctx.device(id, body.device as string))) return fail(401, 'wrong PIN');
  } else {
    if (typeof body.pin !== 'string') return fail(400, 'bad name or PIN');
    const auth = await ctx.auth(id, body.pin);
    if (auth === 'pin') return fail(401, 'wrong PIN');
    if (auth === 'locked') return fail(429, 'locked');
    if (auth === 'nosave') return fail(404, 'no save');
  }

  const { seed, daily, actions } = body;
  if (typeof seed !== 'number' || !Number.isInteger(seed) || !Array.isArray(actions))
    return fail(400, 'bad run');
  const json = JSON.stringify(actions);
  if (json.length > MAX_ACTIONS_BYTES) return fail(400, 'bad run');
  if (daily !== undefined) {
    if (typeof daily !== 'string' || !DAY.test(daily) || seed !== dailySeed(daily))
      return fail(400, 'bad run');
    if (!countsFor(daily, ctx.now())) return fail(400, 'too late');
  }

  let run;
  try {
    run = replayRun(seed, actions as SeshAction[], daily as string | undefined);
  } catch {
    return fail(400, 'bad run');
  }
  if (!run.over) return fail(400, 'not finished');

  const score = scoreOf(run);
  const best = await ctx.runs.put({
    id,
    name,
    day: (daily as string | undefined) ?? FREE,
    seed,
    score,
    beaten: run.beaten,
    standing: run.party.length,
    turns: run.turns,
    at: ctx.now(),
    actions: json,
  });
  const device = !byDevice && body.newDevice === true ? await ctx.newDevice(id) : null;
  return { status: 200, body: { ok: true, score, best, ...(device && { device }) } };
}
