import {
  legalActions,
  playTurn,
  replaceFainted,
  startBattle,
  switchTargets,
  type Action,
  type BattleEvent,
  type BattleState,
  type Entrant,
  type Side,
} from '../battle/engine';
import type { QueueItem } from '../ui/session';
import {
  CHAMPION_SKIN,
  entrantsOf,
  eventFor,
  isLevelRule,
  isOnlineAction,
  RULES_VERSION,
  skinOf,
  stateFor,
  trainerId,
  validateTeam,
  type ChampionView,
  type LevelRule,
  type RoomStage,
  type RoomView,
} from './rules';

/**
 * Live friend battles on the save server. The server holds the seed and the battle, and runs
 * every turn itself once both players have chosen, so a changed game can't change the outcome.
 * Each phone polls for what happened and plays it back (`link.ts`).
 *
 *   POST /api/battle {op: 'create', name, pin, rules, rule}  → a room with a code to share
 *   POST /api/battle {op: 'join', name, pin, rules, code}    → into the room (or back into it)
 *   POST /api/battle {op: 'ready' | 'poll' | 'act' | 'replace' | 'forfeit', code, token, ...}
 *   POST /api/battle {op: 'champion'}                        → {champion}: who holds the crown
 *
 * Every answer is a RoomView, plus the player's `token` from create and join. The name's PIN
 * is checked against its online save, and the team is that save's party, checked by
 * `validateTeam`. This file has no I/O: storage and the PIN check come in a BattleContext, so the
 * tests run it against memory and the save server against Neon.
 */

/** A room nobody has started a battle in closes after this. */
export const ROOM_MS = 15 * 60 * 1000;
/**
 * How long a player has to act after each step before the server acts for them. The game's own
 * turn timer is 45 seconds once playback ends, so this only catches a player who has gone.
 */
export const STEP_MS = 100 * 1000;
/** Missing this many in a row forfeits. */
export const MAX_MISSED = 2;

interface Player {
  id: string;
  name: string;
  token: string;
  ready: boolean;
  team?: Entrant[];
  /** Their Story mode skin, from their save (`skinOf`), or the Champion's while they hold it. */
  skin?: string;
  /** They hold the Online Champion's crown. */
  champion?: boolean;
}

export interface Room {
  code: string;
  rule: LevelRule;
  rules: string;
  created: number;
  stage: RoomStage;
  players: Player[];
  state: BattleState | null;
  /** Everything that has happened, one list per step (start, turn, replacement, ending). */
  steps: QueueItem[][];
  /** Each side's Ranemon that have been sent out, which the other phone may see. */
  seen: [number[], number[]];
  pending: [Action | null, Action | null];
  missed: [number, number];
  deadline: number;
  why?: RoomView['why'];
  /** What the battle did to the crown, once it's over. */
  crown?: RoomView['crown'];
}

/**
 * The Online Champion: one trainer at a time, kept on the server. Beat them in a friend battle
 * (or have them forfeit, or leave) and the crown, and the Champion's skin, are yours. Nobody
 * holds it until the first friend battle anyone wins.
 */
export interface Champion {
  id: string;
  name: string;
  /** When they took the crown. */
  since: number;
  /** Battles won while holding it. */
  defences: number;
  /** Who they took it from; missing for the first Champion. */
  from?: string;
  /** The battle that last changed the record (code and when it opened), so it counts once. */
  battle: string;
}

/** The one Champion record, as JSON with a version, like a room. */
export interface CrownStore {
  get(): Promise<{ doc: string; version: number } | null>;
  /** Writes if the record is still at `version` (0: there's none yet). False if it moved on. */
  put(doc: string, version: number, now: number): Promise<boolean>;
}

/** Rooms by code, as JSON with a version, so two calls at once can't overwrite each other. */
export interface RoomStore {
  get(code: string): Promise<{ doc: string; version: number } | null>;
  /** Writes if the room is still at `version` (0: doesn't exist yet). False if it moved on. */
  put(code: string, doc: string, version: number, now: number): Promise<boolean>;
}

export interface BattleContext {
  rooms: RoomStore;
  /** Checks a name's PIN against its online save. */
  auth(id: string, pin: string): Promise<'ok' | 'pin' | 'locked' | 'nosave'>;
  /** The name's online save, as JSON. */
  save(id: string): Promise<string | null>;
  now(): number;
  /** A random 32-bit seed. */
  seed(): number;
  /** A random secret for a player's calls in one room. */
  token(): string;
  /** A random number in [0, 1), for room codes. */
  random(): number;
  /** The Online Champion's record. A server without it has no Champion. */
  crown?: CrownStore;
}

export interface Reply {
  status: number;
  body: object;
}

const other = (side: Side): Side => (side === 0 ? 1 : 0);
const fail = (status: number, error: string): Reply => ({ status, body: { error } });
const isObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

const CONSONANTS = 'BDFGHKLMNPRSTVZ';
const VOWELS = 'AEIOU';

/** A room code like BOKA-42: easy to read out, and to type on a phone. */
export function makeCode(random: () => number): string {
  const pick = (from: string) => from[Math.floor(random() * from.length)];
  const word = pick(CONSONANTS) + pick(VOWELS) + pick(CONSONANTS) + pick(VOWELS);
  return `${word}-${String(Math.floor(random() * 100)).padStart(2, '0')}`;
}

/** A typed code in any case, with or without its dash. */
export function normalCode(x: unknown): string {
  const s = typeof x === 'string' ? x.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
  return /^[A-Z]{4}\d{2}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4)}` : '';
}

/** The skin a save's JSON is wearing, if any. */
function readSkin(raw: string | null): string | undefined {
  try {
    return raw ? skinOf(JSON.parse(raw)) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The first Champion, who holds the crown before anyone has won it from them, if the save server
 * has a save under their name. Without one, the crown waits for the first friend battle anyone
 * wins.
 */
export const FIRST_CHAMPION = 'Ollie';

async function readCrown(ctx: BattleContext): Promise<{ champ: Champion | null; version: number }> {
  if (!ctx.crown) return { champ: null, version: 0 };
  const got = await ctx.crown.get();
  if (!got) {
    const id = trainerId(FIRST_CHAMPION);
    const first: Champion = { id, name: FIRST_CHAMPION, since: 0, defences: 0, battle: 'first' };
    return { champ: (await ctx.save(id)) ? first : null, version: 0 };
  }
  try {
    return { champ: JSON.parse(got.doc) as Champion, version: got.version };
  } catch {
    return { champ: null, version: got.version };
  }
}

/**
 * Dresses a player for the room: the Champion always wears the crown and the Champion's skin,
 * and nobody else can, whatever their save says.
 */
function dress(p: Player, champ: Champion | null, saved: string | undefined) {
  const crowned = !!champ && champ.id === p.id;
  const skin = crowned ? CHAMPION_SKIN : saved === CHAMPION_SKIN ? undefined : saved;
  if (skin) p.skin = skin;
  else delete p.skin;
  if (crowned) p.champion = true;
  else delete p.champion;
}

/** The battle that ended in `room`, as the Champion record names it. */
const battleKey = (room: Room) => `${room.code}@${room.created}`;

/**
 * What a finished battle does to the crown: the winner takes it from the Champion, or claims it
 * if nobody holds it, and a Champion who wins has defended it. Null if it changes nothing.
 */
export function crowned(
  champ: Champion | null,
  room: Room,
  now: number,
): { champ: Champion; crown: NonNullable<Room['crown']> } | null {
  const phase = room.state?.phase;
  if (room.stage !== 'over' || phase?.kind !== 'over' || phase.winner === 'draw') return null;
  const key = battleKey(room);
  if (champ?.battle === key) return null;
  const winner = room.players[phase.winner];
  const loser = room.players[other(phase.winner)];
  if (!winner || !loser) return null;
  if (champ?.id === winner.id)
    return {
      champ: { ...champ, name: winner.name, defences: champ.defences + 1, battle: key },
      crown: { holder: winner.name, change: 'kept' },
    };
  if (champ && champ.id !== loser.id) return null;
  return {
    champ: {
      id: winner.id,
      name: winner.name,
      since: now,
      defences: 0,
      ...(champ && { from: loser.name }),
      battle: key,
    },
    crown: { holder: winner.name, change: champ ? 'took' : 'claimed' },
  };
}

/** The crown as anyone may see it. */
const championView = (c: Champion | null): ChampionView | null =>
  c && {
    id: c.id,
    name: c.name,
    since: c.since,
    defences: c.defences,
    ...(c.from && { from: c.from }),
  };

const say = (text: string): QueueItem => ({ kind: 'say', text });

function pushStep(room: Room, items: QueueItem[], now: number) {
  room.steps.push(items);
  for (const e of items) {
    if ('side' in e && e.kind === 'send-out' && !room.seen[e.side].includes(e.index))
      room.seen[e.side].push(e.index);
  }
  room.deadline = now + STEP_MS;
}

function end(room: Room, winner: Side | 'draw', why: RoomView['why'], text: string, now: number) {
  room.state = { ...room.state!, phase: { kind: 'over', winner } };
  pushStep(room, [say(text), { kind: 'win', winner }], now);
  room.stage = 'over';
  room.why = why;
}

function afterStep(room: Room, events: BattleEvent[], now: number) {
  pushStep(room, events, now);
  if (room.state!.phase.kind === 'over') {
    room.stage = 'over';
    room.why = 'battle';
  }
}

/** Plays the turn once both sides have chosen. */
function resolve(room: Room, now: number) {
  const [a, b] = room.pending;
  if (!a || !b) return;
  const next = playTurn(room.state!, [a, b]);
  room.state = next.state;
  room.pending = [null, null];
  afterStep(room, next.events, now);
}

/** Acts for anyone who has gone quiet, and ends the battle for anyone gone too long. */
function advance(room: Room, now: number) {
  if ((room.stage === 'waiting' || room.stage === 'lobby') && now > room.created + ROOM_MS) {
    room.stage = 'closed';
    return;
  }
  if (room.stage !== 'live' || now <= room.deadline) return;
  const state = room.state!;
  const phase = state.phase;
  const late: Side[] =
    phase.kind === 'choose'
      ? ([0, 1] as Side[]).filter((s) => !room.pending[s])
      : phase.kind === 'replace'
        ? phase.sides
        : [];
  for (const side of late) room.missed[side]++;
  const gone = late.filter((s) => room.missed[s] >= MAX_MISSED);
  if (gone.length > 0) {
    const names = gone.map((s) => room.players[s].name).join(' and ');
    end(
      room,
      gone.length === 2 ? 'draw' : other(gone[0]),
      'timeout',
      `${names} left the battle.`,
      now,
    );
    return;
  }
  if (phase.kind === 'choose') {
    for (const side of late) room.pending[side] = legalActions(state, side)[0];
    resolve(room, now);
  } else if (phase.kind === 'replace') {
    let next = { state, events: [] as BattleEvent[] };
    for (const side of late) {
      const step = replaceFainted(next.state, side, switchTargets(next.state, side)[0]);
      next = { state: step.state, events: [...next.events, ...step.events] };
    }
    room.state = next.state;
    afterStep(room, next.events, now);
  }
}

/** The room as one player's phone sees it, with what happened after step `after`. */
export function viewOf(room: Room, side: Side, after: number): RoomView {
  const foeSide = other(side);
  const player = (p: Player | undefined) =>
    p
      ? {
          name: p.name,
          ready: p.ready,
          ...(p.team && { size: p.team.length }),
          ...(p.skin && { skin: p.skin }),
          ...(p.champion && { champion: true as const }),
        }
      : null;
  const from = after < 0 ? room.steps.length : Math.min(after, room.steps.length);
  const state = room.state && stateFor(room.state, side, room.seen[foeSide]);
  return {
    code: room.code,
    rule: room.rule,
    stage: room.stage,
    you: player(room.players[side])!,
    foe: player(room.players[foeSide]),
    n: room.steps.length,
    items: room.steps
      .slice(from)
      // The battle opens with the foe's send-out, then your own, for both players.
      .flatMap((step, i) => (from + i === 0 && side === 1 ? [...step].reverse() : step))
      .map((e) => eventFor(e, side)),
    // The seed would tell a changed game which moves will hit.
    state: state && { ...state, rng: 0 },
    ...(room.why && { why: room.why }),
    ...(room.crown && { crown: room.crown }),
  };
}

const sameAction = (a: Action, b: Action) =>
  a.kind === b.kind &&
  (a.kind === 'move'
    ? a.index === (b as { index: number }).index
    : a.kind === 'switch' && a.to === (b as { to: number }).to);

type Change = (room: Room, side: Side) => Reply | void;

/**
 * Reads the room, catches it up, applies `change` for the player with `token` (or `side`), and
 * writes it back, trying again if another call wrote first.
 */
async function update(
  ctx: BattleContext,
  code: string,
  who: { token: string } | { side: Side },
  after: number,
  change: Change,
  extra: object = {},
): Promise<Reply> {
  for (let tries = 0; tries < 5; tries++) {
    const got = await ctx.rooms.get(code);
    if (!got) return fail(404, 'no room');
    const room = JSON.parse(got.doc) as Room;
    const side =
      'side' in who
        ? who.side
        : (room.players.findIndex((p) => p.token === who.token) as Side | -1);
    if (side === -1) return fail(403, 'not in this room');
    const now = ctx.now();
    const was = room.stage;
    advance(room, now);
    const refused = change(room, side);
    if (refused) return refused;
    // The battle has just ended: settle the crown, and show who holds it now.
    let crown: Champion | null = null;
    if (was !== 'over' && room.stage === 'over' && ctx.crown) {
      const { champ } = await readCrown(ctx);
      const next = crowned(champ, room, now);
      if (next) {
        crown = next.champ;
        room.crown = next.crown;
        for (const p of room.players) dress(p, crown, p.champion ? undefined : p.skin);
      }
    }
    const doc = JSON.stringify(room);
    if (doc !== got.doc && !(await ctx.rooms.put(code, doc, got.version, now))) continue;
    if (crown) await settleCrown(ctx, room, now);
    return { status: 200, body: { ...viewOf(room, side, after), ...extra } };
  }
  return fail(503, 'busy');
}

/** Writes the crown for a battle that has ended, once, trying again if another wrote first. */
async function settleCrown(ctx: BattleContext, room: Room, now: number) {
  for (let tries = 0; tries < 5; tries++) {
    const { champ, version } = await readCrown(ctx);
    const next = crowned(champ, room, now);
    if (!next) return;
    if (await ctx.crown!.put(JSON.stringify(next.champ), version, now)) return;
  }
}

/** Handles one battle call. */
export async function battleCall(body: unknown, ctx: BattleContext): Promise<Reply> {
  if (!isObject(body)) return fail(400, 'bad request');
  const { op } = body;
  const after = typeof body.after === 'number' ? body.after : 0;

  if (op === 'champion')
    return { status: 200, body: { champion: championView((await readCrown(ctx)).champ) } };

  if (op === 'create' || op === 'join') {
    if (body.rules !== RULES_VERSION) return fail(409, 'update');
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 20) : '';
    const id = trainerId(name);
    if (!id || typeof body.pin !== 'string') return fail(400, 'bad name or PIN');
    const auth = await ctx.auth(id, body.pin);
    if (auth === 'pin') return fail(401, 'wrong PIN');
    if (auth === 'locked') return fail(429, 'locked');
    if (auth === 'nosave') return fail(404, 'no save');
    const token = ctx.token();
    const skin = readSkin(await ctx.save(id));
    const { champ } = await readCrown(ctx);
    const me: Player = { id, name, token, ready: false };
    dress(me, champ, skin);

    if (op === 'create') {
      const rule = isLevelRule(body.rule) ? body.rule : 'flat50';
      for (let tries = 0; tries < 5; tries++) {
        const now = ctx.now();
        const room: Room = {
          code: makeCode(ctx.random),
          rule,
          rules: RULES_VERSION,
          created: now,
          stage: 'waiting',
          players: [me],
          state: null,
          steps: [],
          seen: [[], []],
          pending: [null, null],
          missed: [0, 0],
          deadline: 0,
        };
        if (await ctx.rooms.put(room.code, JSON.stringify(room), 0, now))
          return { status: 200, body: { ...viewOf(room, 0, 0), token } };
      }
      return fail(503, 'busy');
    }

    const code = normalCode(body.code);
    if (!code) return fail(404, 'no room');
    const got = await ctx.rooms.get(code);
    if (!got) return fail(404, 'no room');
    const known = (JSON.parse(got.doc) as Room).players.findIndex((p) => p.id === id);
    const side: Side = known === -1 ? 1 : (known as Side);
    // Coming back in (from another device, say) hands out a new token; the old one stops working.
    return update(
      ctx,
      code,
      { side },
      -1,
      (room) => {
        if (known !== -1) {
          room.players[side].token = token;
          dress(room.players[side], champ, skin);
          return;
        }
        if (room.stage === 'closed') return fail(410, 'closed');
        if (room.players.length > 1) return fail(409, 'full');
        room.players.push(me);
        room.stage = 'lobby';
      },
      { token },
    );
  }

  const code = normalCode(body.code);
  const token = typeof body.token === 'string' ? body.token : '';
  if (!code || !token) return fail(400, 'bad request');

  switch (op) {
    case 'poll':
      return update(ctx, code, { token }, after, () => {});

    case 'ready': {
      const got = await ctx.rooms.get(code);
      const player = got && (JSON.parse(got.doc) as Room).players.find((p) => p.token === token);
      if (!player) return fail(403, 'not in this room');
      const raw = await ctx.save(player.id);
      let party: unknown = null;
      try {
        party = raw ? JSON.parse(raw).party : null;
      } catch {
        // An unreadable save brings no team.
      }
      const skin = readSkin(raw);
      const { champ } = await readCrown(ctx);
      const checked = validateTeam(party);
      if ('error' in checked) return { status: 422, body: { error: 'team', why: checked.error } };
      return update(ctx, code, { token }, after, (room, side) => {
        if (room.stage !== 'lobby') return fail(409, room.stage);
        const me = room.players[side];
        me.ready = true;
        me.team = entrantsOf(checked.team, room.rule);
        // The save is read again here, so a skin changed since joining shows too.
        dress(me, champ, skin);
        const [a, b] = room.players;
        if (!a.ready || !b?.ready) return;
        const now = ctx.now();
        const start = startBattle([a.team!, b.team!], ctx.seed());
        room.state = start.state;
        room.stage = 'live';
        pushStep(room, start.events, now);
      });
    }

    case 'act': {
      const action = body.action;
      if (!isOnlineAction(action)) return fail(400, 'bad action');
      return update(ctx, code, { token }, after, (room, side) => {
        const state = room.state;
        if (room.stage !== 'live' || state?.phase.kind !== 'choose' || state.turn !== body.turn)
          return fail(409, 'stale');
        if (!legalActions(state, side).some((a) => sameAction(a, action)))
          return fail(400, 'illegal');
        room.pending[side] = action;
        room.missed[side] = 0;
        resolve(room, ctx.now());
      });
    }

    case 'replace':
      return update(ctx, code, { token }, after, (room, side) => {
        const state = room.state;
        const phase = state?.phase;
        if (room.stage !== 'live' || phase?.kind !== 'replace' || !phase.sides.includes(side))
          return fail(409, 'stale');
        if (!switchTargets(state!, side).includes(body.to as number)) return fail(400, 'illegal');
        const next = replaceFainted(state!, side, body.to as number);
        room.state = next.state;
        room.missed[side] = 0;
        afterStep(room, next.events, ctx.now());
      });

    case 'forfeit':
      return update(ctx, code, { token }, after, (room, side) => {
        if (room.stage === 'waiting' || room.stage === 'lobby') room.stage = 'closed';
        else if (room.stage === 'live')
          end(
            room,
            other(side),
            'forfeit',
            `${room.players[side].name} forfeited the battle.`,
            ctx.now(),
          );
      });
  }
  return fail(404, 'not found');
}
