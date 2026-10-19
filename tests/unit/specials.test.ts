import { describe, expect, it } from 'vitest';
import type { Creature } from '@/lib/battle/creature';
import { activeBattler, playTurn, startBattle, type Action } from '@/lib/battle/engine';
import { creatureById, deal, ROSTER } from '@/lib/battle/roster';
import { starterById } from '../fixtures/placeholders';

const move = (index: number): Action => ({ kind: 'move', index });
const mo = () => starterById('mellow-mo');
const snooze = () => starterById('snooze');

/** Mo just uses Unbothered (a self boost), so it never gets in the way of the move under test. */
const WAIT = move(2);

function battle(mine: Creature[], seed = 1) {
  return startBattle([mine, [mo(), snooze(), mo()]], seed).state;
}

describe('special moves', () => {
  it('Nozzy Call raises Speed by 50%', () => {
    const { state, events } = playTurn(battle([creatureById('carlmon'), mo(), snooze()]), [
      move(0),
      WAIT,
    ]);
    expect(events).toContainEqual({ kind: 'boost', side: 0, stat: 'speed', factor: 1.5 });
    expect(activeBattler(state, 0).mods.speed).toBe(1.5);
  });

  it('Fierce Friendship drops the foe’s Attack by 30%', () => {
    const { state } = playTurn(battle([creatureById('enda'), mo(), snooze()]), [move(0), WAIT]);
    expect(activeBattler(state, 1).mods.attack).toBeCloseTo(0.7);
  });

  it('Try Hard raises Attack by 30% and costs 15% HP', () => {
    const start = battle([creatureById('conemon'), mo(), snooze()]);
    const max = activeBattler(start, 0).stats.hp;
    const { state, events } = playTurn(start, [move(0), WAIT]);
    expect(activeBattler(state, 0).mods.attack).toBeCloseTo(1.3);
    expect(events).toContainEqual({
      kind: 'self-damage',
      side: 0,
      amount: Math.floor(max * 0.15),
      hp: max - Math.floor(max * 0.15),
    });
  });

  it('Blaze Up trades Speed for a lot of Defense', () => {
    const { state } = playTurn(battle([creatureById('simomon'), mo(), snooze()]), [move(0), WAIT]);
    expect(activeBattler(state, 0).mods).toMatchObject({ speed: 0.75, defense: 1.6 });
  });

  it('Rounds on Me slows the foe and speeds Lorcamon up', () => {
    const { state } = playTurn(battle([creatureById('lorcamon'), mo(), snooze()]), [move(0), WAIT]);
    expect(activeBattler(state, 0).mods.speed).toBeCloseTo(1.2);
    expect(activeBattler(state, 1).mods.speed).toBeCloseTo(0.8);
  });

  it('Ranelads.com swaps HP with the foe', () => {
    let swaps = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const start = battle([creatureById('steadmon'), mo(), snooze()], seed);
      activeBattler(start, 0).hp = 20;
      const foeHp = activeBattler(start, 1).hp;
      const myMax = activeBattler(start, 0).stats.hp;
      const { events } = playTurn(start, [move(0), WAIT]);
      const swap = events.find((e) => e.kind === 'swap-hp');
      if (!swap) continue;
      swaps++;
      // Nobody goes over their own max HP.
      expect(swap).toEqual({ kind: 'swap-hp', side: 0, hp: [Math.min(foeHp, myMax), 20] });
    }
    expect(swaps).toBeGreaterThan(12); // 90% accurate
  });

  it('Helping Hand tags in the partner with full HP and 20% more Attack', () => {
    const start = battle([creatureById('oismon'), mo(), creatureById('olliemon')]);
    start.teams[0].battlers[2].hp = 10;
    const { state, events } = playTurn(start, [move(0), WAIT]);
    const ollie = activeBattler(state, 0);
    expect(ollie.creature.id).toBe('olliemon');
    expect(ollie.hp).toBe(ollie.stats.hp);
    expect(ollie.mods.attack).toBeCloseTo(1.2);
    expect(events).toContainEqual({ kind: 'send-out', side: 0, index: 2 });
  });

  it('Helping Hand fails without the partner', () => {
    const { state, events } = playTurn(battle([creatureById('oismon'), mo(), snooze()]), [
      move(0),
      WAIT,
    ]);
    expect(events).toContainEqual({ kind: 'move-failed', side: 0 });
    expect(activeBattler(state, 0).creature.id).toBe('oismon');
  });

  it('B2B fires a random attack, then switches to the healthiest teammate', () => {
    const start = battle([creatureById('thilomon'), mo(), snooze()]);
    start.teams[0].battlers[1].hp = 30;
    const { state, events } = playTurn(start, [move(0), WAIT]);
    const moves = events.filter((e) => e.kind === 'move' && e.side === 0);
    expect(moves[0]).toMatchObject({ moveId: 'b2b' });
    expect(['shopping-trolley', 'mosh-pit', 'cheap-shot']).toContain(
      moves[1].kind === 'move' && moves[1].moveId,
    );
    expect(activeBattler(state, 0).creature.id).toBe('snooze');
  });

  it('wear off when the Ranemon switches out', () => {
    let state = playTurn(battle([creatureById('carlmon'), mo(), snooze()]), [move(0), WAIT]).state;
    state = playTurn(state, [{ kind: 'switch', to: 1 }, WAIT]).state;
    state = playTurn(state, [{ kind: 'switch', to: 0 }, WAIT]).state;
    expect(activeBattler(state, 0).mods.speed).toBe(1);
  });
});

describe('deal', () => {
  it('never splits Oismon and Olliemon across hands', () => {
    for (let i = 0; i < 200; i++) {
      const shuffled = [...ROSTER].sort(() => Math.random() - 0.5);
      const hands = deal(shuffled, 6);
      expect(hands[0]).toHaveLength(6);
      expect(hands[1]).toHaveLength(6);
      expect(new Set([...hands[0], ...hands[1]]).size).toBe(12);
      for (const hand of hands) {
        const ids = hand.map((c) => c.id);
        expect(ids.includes('oismon')).toBe(ids.includes('olliemon'));
      }
    }
  });
});
