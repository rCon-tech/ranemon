import { chooseAction, chooseReplacement, type Difficulty } from '../battle/cpu';
import { moveById } from '../battle/moves';
import {
  activeBattler,
  aimsAtFoe,
  legalActions,
  playTurn,
  replaceFainted,
  type Action,
  type BattleEvent,
  type BattleState,
  type Side,
} from '../battle/engine';
import { Rng, seedFrom } from '../battle/rng';
import { applyEvent, describeEvent, viewOf, type View } from './playback';

export const TURN_SECONDS = 45;
/** Each line stays up long enough to type out and then read; tapping the box skips ahead. */
export const MESSAGE_MS = 1500;
export const MS_PER_CHAR = 45;
export const SILENT_MS = 500;
/** How long a move's animation runs before its damage lands. */
export const EFFECT_MS = 700;

export const messagePause = (text: string) => MESSAGE_MS + text.length * MS_PER_CHAR;

export type Mode =
  'playing' | 'menu' | 'fight' | 'switch' | 'forced-switch' | 'confirm-run' | 'over';
export type Result = 'win' | 'loss' | 'draw';

/** Everything the battle screen shows, driven one step at a time by `reduce`. */
export interface Session {
  /** The engine's state after every event so far, including ones not yet played back. */
  state: BattleState;
  difficulty: Difficulty;
  view: View;
  queue: BattleEvent[];
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
  effect: { side: Side; moveId: string; n: number } | null;
  /** Bumped on each new line of text, so the same words twice still type out again. */
  line: number;
  timeLeft: number;
  result: Result | null;
}

export type SessionAction =
  | { type: 'step'; random: number }
  | { type: 'act'; action: Action; random: number }
  | { type: 'replace'; to: number }
  | { type: 'open'; mode: 'menu' | 'fight' | 'switch' | 'confirm-run' }
  | { type: 'forfeit' }
  | { type: 'tick'; random: number };

/** CPU choices need randomness, but the reducer must stay pure, so actions carry a seed. */
function randomFrom(seed: number): () => number {
  const rng = new Rng(seedFrom(String(seed)));
  return () => rng.next();
}

const bump = (pair: [number, number], side: Side): [number, number] =>
  side === 0 ? [pair[0] + 1, pair[1]] : [pair[0], pair[1] + 1];

export function startSession(
  start: { state: BattleState; events: BattleEvent[] },
  difficulty: Difficulty,
): Session {
  const view = viewOf(start.state);
  view[0].shown = false;
  view[1].shown = false;
  return {
    state: start.state,
    difficulty,
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
  };
}

function playEvents(s: Session, state: BattleState, events: BattleEvent[]): Session {
  return { ...s, state, queue: [...s.queue, ...events], mode: 'playing', pause: 0 };
}

/** Plays the next queued event, or decides what comes next once the queue is empty. */
function step(s: Session, random: number): Session {
  const [event, ...rest] = s.queue;
  if (event) {
    const text = describeEvent(event, s.state, s.view);
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
      next = {
        ...next,
        effect: { side, moveId: move.id, n: (s.effect?.n ?? 0) + 1 },
        lunges: move.category === 'status' ? next.lunges : bump(next.lunges, event.side),
        pause: Math.max(next.pause, EFFECT_MS),
      };
    }
    if (event.kind === 'damage' || event.kind === 'recoil' || event.kind === 'status-damage') {
      next = { ...next, hits: bump(next.hits, event.side) };
    }
    if (event.kind === 'send-out') next = { ...next, entries: bump(next.entries, event.side) };
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

function act(s: Session, action: Action, random: number): Session {
  const foe = chooseAction(s.state, 1, s.difficulty, randomFrom(random));
  const next = playTurn(s.state, [action, foe]);
  return playEvents(s, next.state, next.events);
}

export const isChoosing = (mode: Mode) =>
  mode === 'menu' || mode === 'fight' || mode === 'switch' || mode === 'confirm-run';

export function reduce(s: Session, a: SessionAction): Session {
  switch (a.type) {
    case 'step':
      return s.mode === 'playing' ? step(s, a.random) : s;
    case 'act':
      return isChoosing(s.mode) ? act(s, a.action, a.random) : s;
    case 'replace': {
      if (s.mode !== 'forced-switch') return s;
      const next = replaceFainted(s.state, 0, a.to);
      return playEvents(s, next.state, next.events);
    }
    case 'open':
      return isChoosing(s.mode) ? { ...s, mode: a.mode } : s;
    case 'forfeit':
      return {
        ...s,
        mode: 'over',
        result: 'loss',
        queue: [],
        message: 'You forfeited the battle.',
      };
    case 'tick': {
      if (!isChoosing(s.mode)) return s;
      if (s.timeLeft > 1) return { ...s, timeLeft: s.timeLeft - 1 };
      // Out of time: a random legal move is used.
      const moves = legalActions(s.state, 0).filter((x) => x.kind === 'move');
      const pick = moves[Math.floor(randomFrom(a.random)() * moves.length)];
      return act({ ...s, timeLeft: 0 }, pick, a.random + 1);
    }
  }
}
