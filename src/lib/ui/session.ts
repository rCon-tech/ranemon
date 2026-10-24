import { chooseAction, chooseReplacement, type Difficulty } from '../battle/cpu';
import { moveById, type Stat, type Status } from '../battle/moves';
import {
  activeBattler,
  aimsAtFoe,
  effectiveStat,
  legalActions,
  MAX_STAGE,
  playTurn,
  replaceFainted,
  type Action,
  type BattleEvent,
  type BattleState,
  type Side,
} from '../battle/engine';
import { Rng, seedFrom } from '../battle/rng';
import { applyEvent, describeEvent, RIVAL, viewOf, type Foe, type View } from './playback';

export const TURN_SECONDS = 45;
/** Each line stays up long enough to type out and then read; tapping the box skips ahead. */
export const MESSAGE_MS = 1500;
export const MS_PER_CHAR = 45;
export const SILENT_MS = 500;
/** How long a move's animation runs before its damage lands. */
export const EFFECT_MS = 700;
/** Special moves play a longer scene of their own. */
export const SPECIAL_MS = 2200;

export const messagePause = (text: string) => MESSAGE_MS + text.length * MS_PER_CHAR;

export type Mode =
  | 'playing'
  | 'menu'
  | 'fight'
  | 'switch'
  | 'bag'
  | 'forced-switch'
  | 'confirm-run'
  /** Online: your choice is sent, and the friend hasn't chosen yet. */
  | 'waiting'
  | 'over';
export type Result = 'win' | 'loss' | 'draw' | 'caught' | 'fled';
type MenuMode = 'menu' | 'fight' | 'switch' | 'bag' | 'confirm-run';

/** What a healing item does to one of your Ranemon. The story's bag decides who it can target. */
export type ItemEffect =
  | { kind: 'heal'; amount: number }
  /** Full HP and no status. */
  | { kind: 'restore' }
  | { kind: 'revive'; fraction: number }
  | { kind: 'cure'; status: Status }
  /** A vape: raises one stat for the rest of the battle, or until it switches out. */
  | { kind: 'boost'; stat: Stat; stages: number };

/** A pint thrown at a wild Ranemon. */
export interface Pint {
  name: string;
  /** Multiplies the catch chance; Infinity always works. */
  multiplier: number;
}

/** Lines the session itself adds between engine events, and the end of a caught or fled battle. */
export type Line = { kind: 'say'; text: string } | { kind: 'end'; result: Result };
export type QueueItem = BattleEvent | Line;

/**
 * Online, a choice goes to the save server instead of into the engine; the screen sends it and
 * the turn comes back with the friend's. `n` is bumped with each, so each is sent once.
 */
export type Choice =
  | { kind: 'act'; action: Action; turn: number }
  | { kind: 'replace'; to: number }
  | { kind: 'forfeit' };
export type Outgoing = Choice & { n: number };

/** Everything the battle screen shows, driven one step at a time by `reduce`. */
export interface Session {
  /** The engine's state after every event so far, including ones not yet played back. */
  state: BattleState;
  difficulty: Difficulty;
  foe: Foe;
  /** Battle mode runs a turn timer; story mode lets you take your time. */
  timer: boolean;
  view: View;
  queue: QueueItem[];
  message: string;
  mode: Mode;
  /** How long to wait before the next step, so each line can be read. */
  pause: number;
  /** Bumped on each hit and each send-out, to restart that side's animation. */
  hits: [number, number];
  entries: [number, number];
  /** Bumped when a side attacks, to play its lunge. */
  lunges: [number, number];
  /** The move animation playing now, on the side it lands on. `n` restarts it. */
  effect: { side: Side; user: Side; moveId: string; n: number } | null;
  /** Bumped on each new line of text, so the same words twice still type out again. */
  line: number;
  timeLeft: number;
  result: Result | null;
  /** Your Ranemon that have been out this battle, for sharing EXP. */
  fought: number[];
  /** Failed attempts to run, which make the next one likelier. */
  runs: number;
  /** The queued item played last, and a count bumped with each, so its sound plays once. */
  last: QueueItem | null;
  played: number;
  /** A live battle against a friend: the save server plays the turns. */
  remote: boolean;
  /** Online: the last choice to send to the save server. */
  outbox: Outgoing | null;
}

export type SessionAction =
  | { type: 'step'; random: number }
  | { type: 'act'; action: Action; random: number }
  | { type: 'replace'; to: number }
  | { type: 'open'; mode: MenuMode }
  | { type: 'item'; name: string; effect: ItemEffect; target: number; random: number }
  | { type: 'pint'; pint: Pint; rate: number; random: number }
  | { type: 'run'; random: number }
  | { type: 'forfeit' }
  | { type: 'tick'; random: number }
  /** Online: what the save server says happened since, and the battle as it stands now. */
  | { type: 'remote'; state: BattleState; items: QueueItem[] };

/** CPU choices need randomness, but the reducer must stay pure, so actions carry a seed. */
function randomFrom(seed: number): () => number {
  const rng = new Rng(seedFrom(String(seed)));
  return () => rng.next();
}

/** Whether a move is about to miss: its user's miss comes straight after it. */
export const missed = (item: QueueItem, rest: QueueItem[]) =>
  item.kind === 'move' && rest[0]?.kind === 'miss' && rest[0].side === item.side;

const bump = (pair: [number, number], side: Side): [number, number] =>
  side === 0 ? [pair[0] + 1, pair[1]] : [pair[0], pair[1] + 1];

export interface SessionOptions {
  foe?: Foe;
  timer?: boolean;
  remote?: boolean;
}

export function startSession(
  start: { state: BattleState; events: QueueItem[] },
  difficulty: Difficulty,
  options: SessionOptions = {},
): Session {
  const view = viewOf(start.state);
  view[0].shown = false;
  view[1].shown = false;
  return {
    state: start.state,
    difficulty,
    foe: options.foe ?? RIVAL,
    timer: options.timer ?? true,
    view,
    queue: start.events,
    message: '',
    mode: 'playing',
    pause: 300,
    hits: [0, 0],
    entries: [0, 0],
    lunges: [0, 0],
    effect: null,
    line: 0,
    timeLeft: TURN_SECONDS,
    result: null,
    fought: [],
    runs: 0,
    last: null,
    played: 0,
    remote: options.remote ?? false,
    outbox: null,
  };
}

/**
 * Online, the foe's Ranemon come in hidden until they're sent out (`stateFor`), so the view holds
 * a placeholder's HP for them. One that has just been revealed has never fought, so it comes in
 * at full health.
 */
function revealed(view: View, before: BattleState, after: BattleState): View {
  const foe = view[1];
  const hidden = (i: number) => before.teams[1].battlers[i]?.creature.id === 'hidden';
  if (!foe.hp.some((_, i) => hidden(i))) return view;
  const shown = after.teams[1].battlers;
  return [
    view[0],
    {
      ...foe,
      hp: foe.hp.map((hp, i) =>
        hidden(i) && shown[i] && shown[i].creature.id !== 'hidden' ? shown[i].stats.hp : hp,
      ),
      status: foe.status.map((st, i) => (hidden(i) ? null : st)),
    },
  ];
}

/** Online: waits for the save server to say what the friend did. */
function wait(s: Session): Session {
  return {
    ...s,
    mode: 'waiting',
    message: `Waiting for ${s.foe.name ?? 'your friend'}…`,
    line: s.line + 1,
  };
}

/** Online: hands a choice to the screen to send, and waits for the friend's. */
function send(s: Session, choice: Choice): Session {
  return { ...wait(s), outbox: { ...choice, n: (s.outbox?.n ?? 0) + 1 } };
}

/**
 * The befriend chance for a pint, from the main series' catch formula: lower HP and a status make
 * it likelier. `rate` is 120 for most Ranemon and 45 for the rare ones.
 */
export function catchChance(
  maxHp: number,
  hp: number,
  rate: number,
  multiplier: number,
  status: Status | null,
): number {
  if (multiplier === Infinity) return 1;
  const bonus = status === 'asleep' ? 2 : status ? 1.5 : 1;
  return Math.min(1, ((3 * maxHp - 2 * hp) * rate * multiplier * bonus) / (3 * maxHp * 255));
}

/**
 * How many sips the Ranemon takes, 0 to 3. Each sip passes with the cube root of the chance, so
 * finishing all 3 (befriending it) happens with exactly the chance.
 */
export function sips(chance: number, random: () => number): number {
  const each = Math.cbrt(chance);
  let n = 0;
  while (n < 3 && random() < each) n++;
  return n;
}

const PUSHED_AWAY = [
  'Oh no! It pushed the pint away!',
  'Aww! It only took one sip!',
  'Argh! It nearly finished it!',
];

function say(text: string): Line {
  return { kind: 'say', text };
}

function playEvents(s: Session, state: BattleState, events: QueueItem[]): Session {
  return { ...s, state, queue: [...s.queue, ...events], mode: 'playing', pause: 0 };
}

/** Plays the next queued event, or decides what comes next once the queue is empty. */
function step(s: Session, random: number): Session {
  const [event, ...rest] = s.queue;
  if (event) s = { ...s, last: event, played: s.played + 1 };
  if (event?.kind === 'end') return { ...s, queue: [], mode: 'over', result: event.result };
  if (event?.kind === 'say') {
    return {
      ...s,
      queue: rest,
      message: event.text,
      line: s.line + 1,
      pause: messagePause(event.text),
    };
  }
  if (event) {
    const text = describeEvent(event, s.state, s.view, s.foe);
    let next: Session = {
      ...s,
      queue: rest,
      view: applyEvent(s.view, event),
      message: text ?? s.message,
      line: text ? s.line + 1 : s.line,
      pause: text ? messagePause(text) : SILENT_MS,
    };
    if (event.kind === 'move') {
      const move = moveById(event.moveId);
      const side: Side = aimsAtFoe(move) ? (event.side === 0 ? 1 : 0) : event.side;
      const lunges = move.category === 'status' ? next.lunges : bump(next.lunges, event.side);
      // A move that misses doesn't play its animation: the miss plays instead, next step.
      next = missed(event, rest)
        ? { ...next, effect: null, lunges }
        : {
            ...next,
            effect: { side, user: event.side, moveId: move.id, n: (s.effect?.n ?? 0) + 1 },
            lunges,
            pause: Math.max(next.pause, move.signature ? SPECIAL_MS : EFFECT_MS),
          };
    }
    if (event.kind === 'miss') next = { ...next, pause: Math.max(next.pause, EFFECT_MS) };
    if (event.kind === 'damage' || event.kind === 'recoil' || event.kind === 'status-damage') {
      next = { ...next, hits: bump(next.hits, event.side) };
    }
    if (event.kind === 'send-out') {
      next = { ...next, entries: bump(next.entries, event.side) };
      if (event.side === 1 && s.foe.line) next = { ...next, queue: [say(s.foe.line), ...rest] };
      if (event.side === 0 && !next.fought.includes(event.index)) {
        next = { ...next, fought: [...next.fought, event.index] };
      }
    }
    return next;
  }

  const phase = s.state.phase;
  if (phase.kind === 'over') {
    const result: Result = phase.winner === 'draw' ? 'draw' : phase.winner === 0 ? 'win' : 'loss';
    return { ...s, mode: 'over', result };
  }
  if (phase.kind === 'replace') {
    if (phase.sides.includes(0)) {
      return { ...s, mode: 'forced-switch', message: 'Choose your next Ranemon.' };
    }
    if (s.remote) return wait(s);
    const to = chooseReplacement(s.state, 1, s.difficulty, randomFrom(random));
    const next = replaceFainted(s.state, 1, to);
    return playEvents(s, next.state, next.events);
  }
  return {
    ...s,
    mode: 'menu',
    message: `What will ${activeBattler(s.state, 0).creature.name} do?`,
    timeLeft: TURN_SECONDS,
  };
}

function act(s: Session, action: Action, random: number, before: QueueItem[] = []): Session {
  if (s.remote) return send(s, { kind: 'act', action, turn: s.state.turn });
  const foe = chooseAction(s.state, 1, s.difficulty, randomFrom(random));
  const next = playTurn(s.state, [action, foe]);
  return playEvents({ ...s, queue: [...s.queue, ...before] }, next.state, next.events);
}

/** Uses an item on one of your Ranemon; it takes your turn, as a switch does. */
function applyItemAction(s: Session, a: Extract<SessionAction, { type: 'item' }>): Session {
  const state = structuredClone(s.state);
  const b = state.teams[0].battlers[a.target];
  const name = b.creature.name;
  const before = b.hp;
  const lines: QueueItem[] = [say(`You used a ${a.name}!`)];
  switch (a.effect.kind) {
    case 'heal':
      b.hp = Math.min(b.stats.hp, b.hp + a.effect.amount);
      break;
    case 'restore':
      b.hp = b.stats.hp;
      b.status = null;
      break;
    case 'revive':
      b.hp = Math.max(1, Math.floor(b.stats.hp * a.effect.fraction));
      lines.push(say(`${name} is back on its feet!`));
      break;
    case 'cure':
      if (b.status === a.effect.status) b.status = null;
      break;
    case 'boost': {
      const { stat, stages } = a.effect;
      b.stages[stat] = Math.min(MAX_STAGE, b.stages[stat] + stages);
      lines.push(say(`${name}’s ${stat.toUpperCase()} rose!`));
      break;
    }
  }
  const cured = s.state.teams[0].battlers[a.target].status !== null && b.status === null;
  if (cured) lines.push(say(`${name} feels like itself again.`));
  const view = s.view.map((v) => ({ ...v, hp: [...v.hp], status: [...v.status] })) as View;
  view[0].hp[a.target] = b.hp;
  view[0].status[a.target] = b.status;
  if (b.hp > before && a.effect.kind !== 'revive') {
    lines.push(say(`${name} regained ${b.hp - before} HP!`));
  }
  return act({ ...s, state, view }, { kind: 'pass' }, a.random, lines);
}

/** Throws a pint at a wild Ranemon: 3 sips and it's your friend, or it pushes it away. */
function throwPint(s: Session, a: Extract<SessionAction, { type: 'pint' }>): Session {
  const target = activeBattler(s.state, 1);
  const chance = catchChance(target.stats.hp, target.hp, a.rate, a.pint.multiplier, target.status);
  const n = sips(chance, randomFrom(a.random));
  const lines: QueueItem[] = [say(`You threw a ${a.pint.name}!`)];
  for (let i = 1; i <= n; i++) lines.push(say(['Sip…', ...Array(i - 1).fill('sip…')].join(' ')));
  if (n === 3) {
    lines.push(say(`Gotcha! ${target.creature.name} finished the pint and joined you!`));
    if (target.creature.shiny) {
      lines.push(
        say(`★ A SHINY ${target.creature.name.toUpperCase()}! Hardly anyone ever finds one! ★`),
      );
    }
    return {
      ...s,
      queue: [...s.queue, ...lines, { kind: 'end', result: 'caught' }],
      mode: 'playing',
      pause: 0,
    };
  }
  lines.push(say(PUSHED_AWAY[n]));
  return act(s, { kind: 'pass' }, a.random + 1, lines);
}

/** Running from a wild Ranemon: certain when you're faster, and likelier with each try. */
function run(s: Session, random: number): Session {
  const mine = effectiveStat(activeBattler(s.state, 0), 'speed');
  const theirs = effectiveStat(activeBattler(s.state, 1), 'speed');
  const odds = mine >= theirs ? 1 : ((mine * 128) / theirs + 30 * (s.runs + 1)) / 256;
  if (randomFrom(random)() < odds) {
    return {
      ...s,
      queue: [say('Got away safely!'), { kind: 'end', result: 'fled' }],
      mode: 'playing',
      pause: 0,
    };
  }
  return act({ ...s, runs: s.runs + 1 }, { kind: 'pass' }, random + 1, [say('Can’t escape!')]);
}

export const isChoosing = (mode: Mode) =>
  mode === 'menu' ||
  mode === 'fight' ||
  mode === 'switch' ||
  mode === 'bag' ||
  mode === 'confirm-run';

export function reduce(s: Session, a: SessionAction): Session {
  switch (a.type) {
    case 'step':
      return s.mode === 'playing' ? step(s, a.random) : s;
    case 'act':
      return isChoosing(s.mode) ? act(s, a.action, a.random) : s;
    case 'replace': {
      if (s.mode !== 'forced-switch') return s;
      if (s.remote) return send(s, { kind: 'replace', to: a.to });
      const next = replaceFainted(s.state, 0, a.to);
      return playEvents(s, next.state, next.events);
    }
    case 'open':
      return isChoosing(s.mode) ? { ...s, mode: a.mode } : s;
    case 'item':
      return isChoosing(s.mode) ? applyItemAction(s, a) : s;
    case 'pint':
      return isChoosing(s.mode) && s.foe.kind === 'wild' ? throwPint(s, a) : s;
    case 'run':
      if (!isChoosing(s.mode)) return s;
      if (s.foe.kind !== 'wild') {
        return {
          ...s,
          mode: 'menu',
          message: 'No running from a trainer battle!',
          line: s.line + 1,
        };
      }
      return run(s, a.random);
    case 'forfeit':
      return {
        ...s,
        mode: 'over',
        result: 'loss',
        queue: [],
        message: 'You forfeited the battle.',
        ...(s.remote && { outbox: { kind: 'forfeit' as const, n: (s.outbox?.n ?? 0) + 1 } }),
      };
    case 'remote': {
      // Once you've forfeited, what the server says next is only the friend being told.
      if (s.mode === 'over') return s;
      const next = playEvents({ ...s, view: revealed(s.view, s.state, a.state) }, a.state, a.items);
      return s.mode === 'playing' ? { ...next, pause: s.pause } : next;
    }
    case 'tick': {
      if (!s.timer || !isChoosing(s.mode)) return s;
      if (s.timeLeft > 1) return { ...s, timeLeft: s.timeLeft - 1 };
      // Out of time: a random legal move is used.
      const moves = legalActions(s.state, 0).filter((x) => x.kind === 'move');
      const pick = moves[Math.floor(randomFrom(a.random)() * moves.length)];
      return act({ ...s, timeLeft: 0 }, pick, a.random + 1);
    }
  }
}
