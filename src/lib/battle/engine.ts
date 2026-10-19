import { levelStats, type BaseStats, type Creature } from './creature';
import { FLAIL, moveById, type Move, type SpecialEffect, type Stat, type Status } from './moves';
import { Rng } from './rng';
import { effectiveness } from './types';

export type Side = 0 | 1;
export const TEAM_SIZE = 3;

export interface Battler {
  creature: Creature;
  stats: BaseStats;
  hp: number;
  status: Status | null;
  /** Turns of sleep left; only meaningful while asleep. */
  sleepTurns: number;
  stages: Record<Stat, number>;
  /** Multipliers from special moves (1 = unchanged). Like stages, they reset on switching out. */
  mods: Record<Stat, number>;
  /** PP left for each of the creature's 4 moves, in order. */
  pp: number[];
}

export interface Team {
  battlers: Battler[];
  active: number;
}

export type Phase =
  | { kind: 'choose' }
  /** These sides must send in a replacement for a fainted creature before the next turn. */
  | { kind: 'replace'; sides: Side[] }
  | { kind: 'over'; winner: Side | 'draw' };

export interface BattleState {
  teams: [Team, Team];
  turn: number;
  phase: Phase;
  rng: number;
}

export type Action = { kind: 'move'; index: number } | { kind: 'switch'; to: number };

export type BattleEvent =
  | { kind: 'send-out'; side: Side; index: number }
  | { kind: 'withdraw'; side: Side; index: number }
  | { kind: 'move'; side: Side; moveId: string }
  | { kind: 'miss'; side: Side }
  | {
      kind: 'damage';
      side: Side;
      amount: number;
      hp: number;
      effectiveness: number;
      crit: boolean;
    }
  | { kind: 'hits'; side: Side; count: number }
  | { kind: 'recoil'; side: Side; amount: number; hp: number }
  | { kind: 'heal'; side: Side; amount: number; hp: number }
  | { kind: 'status'; side: Side; status: Status }
  | { kind: 'status-failed'; side: Side }
  | { kind: 'status-damage'; side: Side; amount: number; hp: number }
  | { kind: 'stat'; side: Side; stat: Stat; change: number }
  | { kind: 'stat-limit'; side: Side; stat: Stat; rising: boolean }
  | { kind: 'asleep'; side: Side }
  | { kind: 'wake'; side: Side }
  | { kind: 'fluster-skip'; side: Side }
  | { kind: 'boost'; side: Side; stat: Stat; factor: number }
  | { kind: 'self-damage'; side: Side; amount: number; hp: number }
  | { kind: 'swap-hp'; side: Side; hp: [number, number] }
  | { kind: 'move-failed'; side: Side }
  | { kind: 'faint'; side: Side }
  | { kind: 'win'; winner: Side | 'draw' };

export const CRIT_CHANCE = 1 / 24;
const NO_MODS: Record<Stat, number> = { attack: 1, defense: 1, spirit: 1, speed: 1 };
/** Special-move multipliers stack, but stay within these bounds. */
export const MOD_MIN = 0.4;
export const MOD_MAX = 3;

function makeBattler(creature: Creature): Battler {
  const stats = levelStats(creature.base);
  return {
    creature,
    stats,
    hp: stats.hp,
    status: null,
    sleepTurns: 0,
    stages: { attack: 0, defense: 0, spirit: 0, speed: 0 },
    mods: { ...NO_MODS },
    pp: creature.moves.map((id) => moveById(id).pp),
  };
}

/** Starts a 3v3 battle. Each team lists its picks with the lead first. */
export function startBattle(
  teams: [Creature[], Creature[]],
  seed: number,
): { state: BattleState; events: BattleEvent[] } {
  for (const team of teams) {
    if (team.length !== TEAM_SIZE) throw new Error(`A team needs exactly ${TEAM_SIZE} creatures`);
  }
  const state: BattleState = {
    teams: [
      { battlers: teams[0].map(makeBattler), active: 0 },
      { battlers: teams[1].map(makeBattler), active: 0 },
    ],
    turn: 1,
    phase: { kind: 'choose' },
    rng: seed,
  };
  return {
    state,
    events: [
      { kind: 'send-out', side: 1, index: 0 },
      { kind: 'send-out', side: 0, index: 0 },
    ],
  };
}

export function activeBattler(state: BattleState, side: Side): Battler {
  const team = state.teams[side];
  return team.battlers[team.active];
}

const other = (side: Side): Side => (side === 0 ? 1 : 0);

/** Each stage is ±50%: +1 is 1.5x, +3 is 2.5x, −1 is 1/1.5, −3 is 1/2.5. */
export function stageMultiplier(stage: number): number {
  return stage >= 0 ? 1 + stage / 2 : 1 / (1 - stage / 2);
}

export function effectiveStat(b: Battler, stat: Stat): number {
  let value = b.stats[stat] * stageMultiplier(b.stages[stat]) * b.mods[stat];
  if (stat === 'speed' && b.status === 'flustered') value /= 2;
  if (stat === 'attack' && b.status === 'hangry') value /= 2;
  return value;
}

/** The move a battler actually uses for a move action: Flail once every move is out of PP. */
export function moveFor(b: Battler, index: number): Move {
  if (b.pp.every((pp) => pp === 0)) return FLAIL;
  return moveById(b.creature.moves[index]);
}

/** Bench indices a side could switch to: not active and not fainted. */
export function switchTargets(state: BattleState, side: Side): number[] {
  const team = state.teams[side];
  return team.battlers.flatMap((b, i) => (i !== team.active && b.hp > 0 ? [i] : []));
}

/** Everything a side may do this turn. */
export function legalActions(state: BattleState, side: Side): Action[] {
  const b = activeBattler(state, side);
  const moves: Action[] = b.pp.every((pp) => pp === 0)
    ? [{ kind: 'move', index: 0 }]
    : b.pp.flatMap((pp, index) => (pp > 0 ? [{ kind: 'move' as const, index }] : []));
  const switches = switchTargets(state, side).map((to) => ({ kind: 'switch' as const, to }));
  return [...moves, ...switches];
}

function isLegal(state: BattleState, side: Side, action: Action): boolean {
  return legalActions(state, side).some(
    (a) =>
      a.kind === action.kind &&
      (a.kind === 'move'
        ? a.index === (action as { index: number }).index
        : a.to === (action as { to: number }).to),
  );
}

/** Damage for one hit, following the main-series formula fixed at level 50. */
export function computeDamage(
  attacker: Battler,
  defender: Battler,
  move: Move,
  crit: boolean,
  roll: number,
): number {
  const physical = move.category === 'physical';
  const a = effectiveStat(attacker, physical ? 'attack' : 'spirit');
  const d = effectiveStat(defender, physical ? 'defense' : 'spirit');
  const base = (22 * move.power * (a / d)) / 50 + 2;
  const stab =
    move.type !== null && (attacker.creature.types as string[]).includes(move.type) ? 1.5 : 1;
  const type = effectiveness(move.type, defender.creature.types);
  const random = 0.85 + 0.15 * roll;
  return Math.max(1, Math.floor(base * stab * type * (crit ? 1.5 : 1) * random));
}

function clone(state: BattleState): BattleState {
  return structuredClone(state);
}

class Turn {
  events: BattleEvent[] = [];
  rng: Rng;

  constructor(public state: BattleState) {
    this.rng = new Rng(state.rng);
  }

  active(side: Side) {
    return activeBattler(this.state, side);
  }

  switchIn(side: Side, to: number) {
    const team = this.state.teams[side];
    const leaving = team.battlers[team.active];
    if (leaving.hp > 0) {
      this.events.push({ kind: 'withdraw', side, index: team.active });
      // Stat changes don't survive a switch; statuses do.
      leaving.stages = { attack: 0, defense: 0, spirit: 0, speed: 0 };
      leaving.mods = { ...NO_MODS };
    }
    team.active = to;
    this.events.push({ kind: 'send-out', side, index: to });
  }

  applyDamage(side: Side, amount: number): number {
    const b = this.active(side);
    const dealt = Math.min(b.hp, amount);
    b.hp -= dealt;
    return dealt;
  }

  /** Returns false if the creature can't act this turn. */
  canAct(side: Side): boolean {
    const b = this.active(side);
    if (b.status === 'asleep') {
      if (b.sleepTurns > 0) {
        b.sleepTurns--;
        this.events.push({ kind: 'asleep', side });
        return false;
      }
      b.status = null;
      this.events.push({ kind: 'wake', side });
    }
    if (b.status === 'flustered' && this.rng.chance(0.25)) {
      this.events.push({ kind: 'fluster-skip', side });
      return false;
    }
    return true;
  }

  useMove(side: Side, index: number) {
    const user = this.active(side);
    if (user.hp === 0 || !this.canAct(side)) return;
    const move = moveFor(user, index);
    if (move !== FLAIL) user.pp[index]--;
    this.events.push({ kind: 'move', side, moveId: move.id });
    this.execute(side, move);
  }

  /** Everything a move does once it's been called: accuracy, damage, effects, specials. */
  execute(side: Side, move: Move) {
    const user = this.active(side);
    const foeSide = other(side);
    const foe = this.active(foeSide);
    const targetsFoe =
      move.category !== 'status' ||
      move.effect?.kind === 'status' ||
      (move.effect?.kind === 'stat' && move.effect.target === 'foe') ||
      (move.specials ?? []).some(
        (e) => e.kind === 'swap-hp' || (e.kind === 'boost' && e.target === 'foe'),
      );

    if (targetsFoe && foe.hp === 0) return;
    if (move.accuracy !== null && targetsFoe && !this.rng.chance(move.accuracy / 100)) {
      this.events.push({ kind: 'miss', side });
      return;
    }

    let dealt = 0;
    if (move.category !== 'status') {
      const hits =
        move.effect?.kind === 'multiHit' ? this.rng.int(move.effect.min, move.effect.max) : 1;
      let landed = 0;
      for (let i = 0; i < hits && foe.hp > 0; i++) {
        const crit = this.rng.chance(CRIT_CHANCE);
        const amount = computeDamage(user, foe, move, crit, this.rng.next());
        dealt += this.applyDamage(foeSide, amount);
        landed++;
        this.events.push({
          kind: 'damage',
          side: foeSide,
          amount,
          hp: foe.hp,
          effectiveness: effectiveness(move.type, foe.creature.types),
          crit,
        });
      }
      if (hits > 1) this.events.push({ kind: 'hits', side: foeSide, count: landed });
    }

    const effect = move.effect;
    switch (effect?.kind) {
      case 'recoil': {
        const amount = Math.max(1, Math.floor(dealt * effect.fraction));
        this.applyDamage(side, amount);
        this.events.push({ kind: 'recoil', side, amount, hp: user.hp });
        break;
      }
      case 'heal': {
        const amount = Math.min(
          user.stats.hp - user.hp,
          Math.floor(user.stats.hp * effect.fraction),
        );
        user.hp += amount;
        this.events.push({ kind: 'heal', side, amount, hp: user.hp });
        break;
      }
      case 'status': {
        if (foe.hp === 0) break;
        const isStatusMove = move.category === 'status';
        if (!isStatusMove && !this.rng.chance(effect.chance)) break;
        if (foe.status !== null) {
          if (isStatusMove) this.events.push({ kind: 'status-failed', side: foeSide });
          break;
        }
        foe.status = effect.status;
        if (effect.status === 'asleep') foe.sleepTurns = this.rng.int(1, 3);
        this.events.push({ kind: 'status', side: foeSide, status: effect.status });
        break;
      }
      case 'stat': {
        const targetSide = effect.target === 'self' ? side : foeSide;
        const target = this.active(targetSide);
        if (target.hp === 0) break;
        if (effect.chance < 1 && !this.rng.chance(effect.chance)) break;
        const before = target.stages[effect.stat];
        const after = Math.max(-3, Math.min(3, before + effect.stages));
        if (after === before) {
          this.events.push({
            kind: 'stat-limit',
            side: targetSide,
            stat: effect.stat,
            rising: effect.stages > 0,
          });
        } else {
          target.stages[effect.stat] = after;
          this.events.push({
            kind: 'stat',
            side: targetSide,
            stat: effect.stat,
            change: after - before,
          });
        }
        break;
      }
      default:
        break;
    }
    for (const special of move.specials ?? []) this.special(side, special);
  }

  /** The friend-specific part of a special move. */
  special(side: Side, effect: SpecialEffect) {
    const user = this.active(side);
    const foeSide = other(side);
    const foe = this.active(foeSide);
    switch (effect.kind) {
      case 'boost': {
        const targetSide = effect.target === 'self' ? side : foeSide;
        const target = this.active(targetSide);
        if (target.hp === 0) return;
        const before = target.mods[effect.stat];
        const after = Math.max(MOD_MIN, Math.min(MOD_MAX, before * effect.factor));
        if (after === before) {
          this.events.push({
            kind: 'stat-limit',
            side: targetSide,
            stat: effect.stat,
            rising: effect.factor > 1,
          });
          return;
        }
        target.mods[effect.stat] = after;
        this.events.push({
          kind: 'boost',
          side: targetSide,
          stat: effect.stat,
          factor: effect.factor,
        });
        return;
      }
      case 'self-damage': {
        const amount = this.applyDamage(
          side,
          Math.max(1, Math.floor(user.stats.hp * effect.fraction)),
        );
        this.events.push({ kind: 'self-damage', side, amount, hp: user.hp });
        return;
      }
      case 'swap-hp': {
        if (foe.hp === 0) return;
        const mine = user.hp;
        user.hp = Math.min(user.stats.hp, foe.hp);
        foe.hp = Math.min(foe.stats.hp, mine);
        const hp: [number, number] = side === 0 ? [user.hp, foe.hp] : [foe.hp, user.hp];
        this.events.push({ kind: 'swap-hp', side, hp });
        return;
      }
      case 'tag-partner': {
        const team = this.state.teams[side];
        const to = team.battlers.findIndex(
          (b, i) => b.creature.id === effect.partner && b.hp > 0 && i !== team.active,
        );
        if (to < 0) {
          this.events.push({ kind: 'move-failed', side });
          return;
        }
        this.switchIn(side, to);
        const partner = this.active(side);
        const amount = partner.stats.hp - partner.hp;
        partner.hp = partner.stats.hp;
        this.events.push({ kind: 'heal', side, amount, hp: partner.hp });
        partner.mods.attack = Math.min(MOD_MAX, partner.mods.attack * effect.attackFactor);
        this.events.push({ kind: 'boost', side, stat: 'attack', factor: effect.attackFactor });
        return;
      }
      case 'hit-and-run': {
        const attacks = user.creature.moves.map(moveById).filter((m) => m.category !== 'status');
        if (attacks.length > 0 && foe.hp > 0) {
          const pick = attacks[this.rng.int(0, attacks.length - 1)];
          this.events.push({ kind: 'move', side, moveId: pick.id });
          this.execute(side, pick);
        }
        const bench = switchTargets(this.state, side);
        if (user.hp > 0 && bench.length > 0) {
          const team = this.state.teams[side];
          const best = bench.reduce((a, b) =>
            team.battlers[b].hp / team.battlers[b].stats.hp >
            team.battlers[a].hp / team.battlers[a].stats.hp
              ? b
              : a,
          );
          this.switchIn(side, best);
        }
        return;
      }
    }
  }

  endOfTurn() {
    for (const side of [0, 1] as Side[]) {
      const b = this.active(side);
      if (b.hp > 0 && b.status === 'hangry') {
        const amount = this.applyDamage(side, Math.max(1, Math.floor(b.stats.hp / 16)));
        this.events.push({ kind: 'status-damage', side, amount, hp: b.hp });
      }
    }
  }

  /** Records faints and works out the next phase. */
  settle() {
    const needs: Side[] = [];
    const out: Side[] = [];
    for (const side of [0, 1] as Side[]) {
      const team = this.state.teams[side];
      const b = team.battlers[team.active];
      if (team.battlers.every((x) => x.hp === 0)) out.push(side);
      else if (b.hp === 0) needs.push(side);
    }
    if (out.length > 0) {
      const winner: Side | 'draw' = out.length === 2 ? 'draw' : other(out[0]);
      this.state.phase = { kind: 'over', winner };
      this.events.push({ kind: 'win', winner });
    } else if (needs.length > 0) {
      this.state.phase = { kind: 'replace', sides: needs };
    } else {
      this.state.phase = { kind: 'choose' };
    }
  }

  finish(): { state: BattleState; events: BattleEvent[] } {
    this.state.rng = this.rng.state;
    return { state: this.state, events: this.events };
  }
}

/** Pushes a faint event for each active creature that just hit 0 HP. */
function pushFaints(turn: Turn, fainted: Set<Side>) {
  for (const side of [0, 1] as Side[]) {
    if (!fainted.has(side) && turn.active(side).hp === 0) {
      fainted.add(side);
      turn.events.push({ kind: 'faint', side });
    }
  }
}

/** Order for this turn's actions: switches first, then move priority, then Speed, then a coin flip. */
function actionOrder(turn: Turn, actions: [Action, Action]): Side[] {
  const key = (side: Side): [number, number] => {
    const action = actions[side];
    if (action.kind === 'switch') return [10, effectiveStat(turn.active(side), 'speed')];
    const move = moveFor(turn.active(side), action.index);
    return [move.priority, effectiveStat(turn.active(side), 'speed')];
  };
  const [p0, s0] = key(0);
  const [p1, s1] = key(1);
  if (p0 !== p1) return p0 > p1 ? [0, 1] : [1, 0];
  if (s0 !== s1) return s0 > s1 ? [0, 1] : [1, 0];
  return turn.rng.chance(0.5) ? [0, 1] : [1, 0];
}

/** Resolves one turn where both sides act at once. */
export function playTurn(
  state: BattleState,
  actions: [Action, Action],
): { state: BattleState; events: BattleEvent[] } {
  if (state.phase.kind !== 'choose')
    throw new Error(`Can't play a turn during ${state.phase.kind}`);
  for (const side of [0, 1] as Side[]) {
    if (!isLegal(state, side, actions[side])) {
      throw new Error(`Illegal action for side ${side}: ${JSON.stringify(actions[side])}`);
    }
  }

  const turn = new Turn(clone(state));
  const fainted = new Set<Side>();
  for (const side of actionOrder(turn, actions)) {
    const action = actions[side];
    if (action.kind === 'switch') turn.switchIn(side, action.to);
    else turn.useMove(side, action.index);
    pushFaints(turn, fainted);
    if (turn.state.teams.some((t) => t.battlers.every((b) => b.hp === 0))) break;
  }
  if (!turn.state.teams.some((t) => t.battlers.every((b) => b.hp === 0))) {
    turn.endOfTurn();
    pushFaints(turn, fainted);
  }
  turn.state.turn++;
  turn.settle();
  return turn.finish();
}

/** Sends in a replacement for a side whose active creature fainted. */
export function replaceFainted(
  state: BattleState,
  side: Side,
  to: number,
): { state: BattleState; events: BattleEvent[] } {
  const phase = state.phase;
  if (phase.kind !== 'replace' || !phase.sides.includes(side)) {
    throw new Error(`Side ${side} has nothing to replace`);
  }
  if (!switchTargets(state, side).includes(to)) throw new Error(`Can't send in ${to}`);
  const turn = new Turn(clone(state));
  turn.switchIn(side, to);
  const rest = phase.sides.filter((s) => s !== side);
  turn.state.phase = rest.length > 0 ? { kind: 'replace', sides: rest } : { kind: 'choose' };
  return turn.finish();
}
