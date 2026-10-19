import { describe, expect, it } from 'vitest';
import type { Creature } from '@/lib/battle/creature';
import {
  activeBattler,
  computeDamage,
  legalActions,
  playTurn,
  replaceFainted,
  stageMultiplier,
  startBattle,
  type Action,
  type BattleState,
} from '@/lib/battle/engine';
import { moveById } from '@/lib/battle/moves';
import { starterById, STARTERS } from '@/lib/battle/roster';
import { simulateBattle } from '@/lib/battle/simulate';

const move = (index: number): Action => ({ kind: 'move', index });

function card(id: string, overrides: Partial<Creature> = {}): Creature {
  return { ...starterById(id), ...overrides };
}

function battle(a: Creature[], b: Creature[], seed = 1): BattleState {
  return startBattle([a, b], seed).state;
}

// Fixed speeds so turn order in these tests doesn't depend on roster balancing.
const pip = () =>
  card('professor-pip', { base: { hp: 100, attack: 55, defense: 70, spirit: 80, speed: 95 } });
const tone = () =>
  card('big-tone', { base: { hp: 100, attack: 115, defense: 70, spirit: 50, speed: 65 } });
const snooze = () =>
  card('snooze', { base: { hp: 105, attack: 50, defense: 95, spirit: 100, speed: 50 } });

describe('stages', () => {
  it('moves stats by 50% a stage', () => {
    expect(stageMultiplier(0)).toBe(1);
    expect(stageMultiplier(1)).toBe(1.5);
    expect(stageMultiplier(3)).toBe(2.5);
    expect(stageMultiplier(-1)).toBeCloseTo(1 / 1.5);
    expect(stageMultiplier(-3)).toBeCloseTo(1 / 2.5);
  });
});

describe('computeDamage', () => {
  const state = battle([pip(), tone(), snooze()], [tone(), pip(), snooze()]);
  const user = state.teams[0].battlers[0];
  const target = state.teams[1].battlers[0];

  it('follows the level 50 formula', () => {
    // Prof Pip uses Galaxy Brain (110, Brains STAB) on Big Tone (Brawn: 2x).
    const ratio = user.stats.spirit / target.stats.spirit;
    const expected = Math.floor(((22 * 110 * ratio) / 50 + 2) * 1.5 * 2 * 1);
    expect(computeDamage(user, target, moveById('galaxy-brain'), false, 1)).toBe(expected);
  });

  it('crits for 1.5x and rolls between 85% and 100%', () => {
    const m = moveById('well-actually');
    const plain = computeDamage(user, target, m, false, 1);
    const crit = computeDamage(user, target, m, true, 1);
    expect(crit / plain).toBeGreaterThan(1.45);
    expect(crit / plain).toBeLessThan(1.55);
    expect(computeDamage(user, target, m, false, 0)).toBeLessThan(plain);
    expect(computeDamage(user, target, m, false, 0)).toBeGreaterThanOrEqual(
      Math.floor(plain * 0.84),
    );
  });
});

describe('playTurn', () => {
  it('is deterministic for a seed', () => {
    const teams: [Creature[], Creature[]] = [
      [pip(), tone(), snooze()],
      [snooze(), pip(), tone()],
    ];
    const a = simulateBattle(teams, 42);
    const b = simulateBattle(teams, 42);
    expect(a.state).toEqual(b.state);
  });

  it('leaves the old state untouched', () => {
    const start = battle([pip(), tone(), snooze()], [tone(), pip(), snooze()]);
    const copy = structuredClone(start);
    playTurn(start, [move(0), move(1)]);
    expect(start).toEqual(copy);
  });

  it('lets the faster creature move first', () => {
    const start = battle([tone(), pip(), snooze()], [pip(), tone(), snooze()]);
    const { events } = playTurn(start, [move(1), move(1)]);
    const order = events.filter((e) => e.kind === 'move').map((e) => e.side);
    expect(order[0]).toBe(1); // Pip (speed 95) outspeeds Tone (55)
  });

  it('puts priority moves ahead of Speed, and switches ahead of both', () => {
    const start = battle([tone(), pip(), snooze()], [pip(), tone(), snooze()]);
    const priority = playTurn(start, [move(2), move(1)]).events.filter((e) => e.kind === 'move');
    expect(priority[0]).toMatchObject({ side: 0, moveId: 'shoulder-barge' });

    const switched = playTurn(start, [move(2), { kind: 'switch', to: 2 }]).events;
    expect(switched.findIndex((e) => e.kind === 'send-out')).toBeLessThan(
      switched.findIndex((e) => e.kind === 'move'),
    );
    const after = playTurn(start, [move(2), { kind: 'switch', to: 2 }]).state;
    expect(activeBattler(after, 1).creature.id).toBe('snooze');
  });

  it('spends PP, and falls back to Flail when all of it is gone', () => {
    let state = battle([tone(), pip(), snooze()], [snooze(), pip(), tone()]);
    state = playTurn(state, [move(3), move(1)]).state;
    expect(activeBattler(state, 0).pp[3]).toBe(9);

    const drained = structuredClone(state);
    activeBattler(drained, 0).pp = [0, 0, 0, 0];
    expect(legalActions(drained, 0).filter((a) => a.kind === 'move')).toEqual([move(0)]);
    const { events } = playTurn(drained, [move(0), move(1)]);
    expect(events).toContainEqual({ kind: 'move', side: 0, moveId: 'flail' });
    expect(events.some((e) => e.kind === 'recoil' && e.side === 0)).toBe(true);
  });

  it('refuses moves with no PP and switches to fainted creatures', () => {
    const state = battle([tone(), pip(), snooze()], [snooze(), pip(), tone()]);
    const noPp = structuredClone(state);
    activeBattler(noPp, 0).pp[0] = 0;
    expect(() => playTurn(noPp, [move(0), move(0)])).toThrow(/Illegal/);
    const fainted = structuredClone(state);
    fainted.teams[0].battlers[1].hp = 0;
    expect(() => playTurn(fainted, [{ kind: 'switch', to: 1 }, move(0)])).toThrow(/Illegal/);
  });

  it('applies statuses: Hangry ticks, a status move fails on a creature that has one', () => {
    let state = battle([card('deadlift-dee'), pip(), snooze()], [snooze(), pip(), tone()], 3);
    // Steal Their Chips (90% accurate): try seeds until it lands.
    for (let seed = 0; seed < 20; seed++) {
      const result = playTurn({ ...state, rng: seed }, [move(3), move(1)]);
      if (result.events.some((e) => e.kind === 'status')) {
        state = result.state;
        expect(activeBattler(state, 1).status).toBe('hangry');
        expect(result.events.some((e) => e.kind === 'status-damage' && e.side === 1)).toBe(true);
        const again = playTurn(state, [move(3), move(1)]).events;
        if (
          again.some((e) => e.kind === 'move' && e.side === 0) &&
          !again.some((e) => e.kind === 'miss')
        ) {
          expect(again).toContainEqual({ kind: 'status-failed', side: 1 });
        }
        return;
      }
    }
    throw new Error('Status never landed');
  });

  it('keeps an asleep creature from acting until it wakes', () => {
    const state = battle([snooze(), pip(), tone()], [tone(), pip(), snooze()]);
    const sleepy = structuredClone(state);
    activeBattler(sleepy, 1).status = 'asleep';
    activeBattler(sleepy, 1).sleepTurns = 1;
    const first = playTurn(sleepy, [move(1), move(1)]);
    expect(first.events).toContainEqual({ kind: 'asleep', side: 1 });
    expect(first.events.some((e) => e.kind === 'move' && e.side === 1)).toBe(false);
    const second = playTurn(first.state, [move(1), move(1)]);
    expect(second.events).toContainEqual({ kind: 'wake', side: 1 });
    expect(second.events.some((e) => e.kind === 'move' && e.side === 1)).toBe(true);
  });

  it('caps stat stages at +3', () => {
    let state = battle([tone(), pip(), snooze()], [snooze(), pip(), tone()]);
    state = playTurn(state, [move(3), move(1)]).state;
    state = playTurn(state, [move(3), move(1)]).state;
    expect(activeBattler(state, 0).stages.attack).toBe(3);
    const { events } = playTurn(state, [move(3), move(1)]);
    expect(events).toContainEqual({ kind: 'stat-limit', side: 0, stat: 'attack', rising: true });
  });

  it('asks for a replacement after a faint, and ends when a side has none left', () => {
    let state = battle([pip(), tone(), snooze()], [tone(), pip(), snooze()]);
    activeBattler(state, 1).hp = 1;
    // Well, Actually never misses, and Pip outspeeds Big Tone.
    const ko = playTurn(state, [move(1), move(0)]);
    expect(ko.events).toContainEqual({ kind: 'faint', side: 1 });
    expect(ko.events.filter((e) => e.kind === 'move' && e.side === 1)).toHaveLength(0);
    expect(ko.state.phase).toEqual({ kind: 'replace', sides: [1] });
    expect(() => playTurn(ko.state, [move(0), move(0)])).toThrow();
    expect(() => replaceFainted(ko.state, 1, 0)).toThrow();
    state = replaceFainted(ko.state, 1, 2).state;
    expect(state.phase).toEqual({ kind: 'choose' });
    expect(activeBattler(state, 1).creature.id).toBe('snooze');

    const last = structuredClone(state);
    last.teams[1].battlers.forEach((b) => (b.hp = 0));
    last.teams[1].battlers[2].hp = 1;
    const end = playTurn(last, [move(1), move(0)]);
    expect(end.state.phase).toEqual({ kind: 'over', winner: 0 });
    expect(end.events.at(-1)).toEqual({ kind: 'win', winner: 0 });
  });
});

describe('whole battles', () => {
  it('always finish, at every difficulty', () => {
    for (let seed = 0; seed < 60; seed++) {
      const pick = (offset: number) =>
        [0, 1, 2].map((i) => STARTERS[(seed * 5 + offset + i * 4) % STARTERS.length]);
      const levels = ['easy', 'normal', 'hard'] as const;
      const result = simulateBattle([pick(0), pick(7)], seed, [
        levels[seed % 3],
        levels[(seed + 1) % 3],
      ]);
      expect(result.state.phase.kind).toBe('over');
    }
  });

  it('a Hard CPU beats an Easy one most of the time', () => {
    let hardWins = 0;
    const games = 200;
    for (let seed = 0; seed < games; seed++) {
      const a = [0, 1, 2].map((i) => STARTERS[(seed + i * 3) % 12]);
      const b = [0, 1, 2].map((i) => STARTERS[(seed + 6 + i * 3) % 12]);
      const { state } = simulateBattle([a, b], seed, ['hard', 'easy']);
      if (state.phase.kind === 'over' && state.phase.winner === 0) hardWins++;
    }
    expect(hardWins / games).toBeGreaterThan(0.6);
  });
});
