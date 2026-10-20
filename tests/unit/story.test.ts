import { describe, expect, it } from 'vitest';
import { levelStats } from '@/lib/battle/creature';
import { computeDamage, playTurn, startBattle } from '@/lib/battle/engine';
import { moveById } from '@/lib/battle/moves';
import { creatureById } from '@/lib/battle/roster';
import { applyItem, canUseOn, itemById } from '@/lib/story/items';
import {
  blueGhost,
  creatureOf,
  expAt,
  expYield,
  gainExp,
  learnset,
  makeMember,
  movesAt,
  statsOf,
  toEntrant,
} from '@/lib/story/party';
import { load, newGame, recruit, save, settleBattle } from '@/lib/story/state';
import { pickWild } from '@/lib/story/world';
import { catchChance, reduce, sips, startSession, type Session } from '@/lib/ui/session';

const base = { hp: 100, attack: 80, defense: 80, spirit: 80, speed: 60 };

describe('levels', () => {
  it('gives battle mode’s numbers at level 50', () => {
    expect(levelStats(base, 50)).toEqual(levelStats(base));
    expect(levelStats(base, 50)).toEqual({
      hp: 160,
      attack: 85,
      defense: 85,
      spirit: 85,
      speed: 65,
    });
  });

  it('scales down at 5 and 20', () => {
    expect(levelStats(base, 5)).toEqual({ hp: 25, attack: 13, defense: 13, spirit: 13, speed: 11 });
    expect(levelStats(base, 20)).toEqual({
      hp: 70,
      attack: 37,
      defense: 37,
      spirit: 37,
      speed: 29,
    });
  });

  it('hits harder at higher levels, with 22 as the factor at 50', () => {
    const c = creatureById('carlmon');
    const at = (level: number) =>
      startBattle([[{ creature: c, level }], [{ creature: c, level }]], 1).state;
    const move = moveById('mosh-pit');
    const dmg = (level: number) => {
      const s = at(level);
      return computeDamage(s.teams[0].battlers[0], s.teams[1].battlers[0], move, false, 1);
    };
    expect(dmg(5)).toBeLessThan(dmg(20));
    expect(dmg(20)).toBeLessThan(dmg(50));
    const plain = startBattle([[c], [c]], 1).state;
    expect(
      computeDamage(plain.teams[0].battlers[0], plain.teams[1].battlers[0], move, false, 1),
    ).toBe(dmg(50));
  });

  it('carries HP, PP and status into a battle', () => {
    const c = creatureById('enda');
    const { state } = startBattle(
      [[{ creature: c, level: 10, hp: 7, pp: [1, 2, 3, 4], status: 'hangry' }], [c]],
      1,
    );
    const b = state.teams[0].battlers[0];
    expect([b.hp, b.pp, b.status, b.level]).toEqual([7, [1, 2, 3, 4], 'hangry', 10]);
  });

  it('lets a pass spend the turn while the foe still moves', () => {
    const c = creatureById('carlmon');
    const { state } = startBattle([[c], [c]], 3);
    const next = playTurn(state, [{ kind: 'pass' }, { kind: 'move', index: 1 }]);
    expect(next.state.teams[0].battlers[0].hp).toBeLessThan(state.teams[0].battlers[0].hp);
    expect(next.events.filter((e) => e.kind === 'move')).toHaveLength(1);
  });
});

describe('party', () => {
  it('learns 2 moves to start, a third at 12 and the special at 20', () => {
    const carl = creatureById('carlmon');
    expect(learnset(carl).map((l) => l.level)).toEqual([1, 1, 12, 20]);
    expect(movesAt(carl, 5)).toHaveLength(2);
    expect(movesAt(carl, 12)).toHaveLength(3);
    expect(movesAt(carl, 20).at(-1)).toBe('nozzy-call');
    expect(moveById(movesAt(carl, 5)[0]).signature).toBeUndefined();
  });

  it('levels up on L³ EXP and learns on the way', () => {
    const m = makeMember('carlmon', 11, 1);
    const { member, lines } = gainExp(m, expAt(12) - m.exp);
    expect(member.level).toBe(12);
    expect(member.moves).toHaveLength(3);
    expect(member.pp).toHaveLength(3);
    expect(lines.join(' ')).toMatch(/grew to Lv12.*learned/);
    expect(member.hp).toBeGreaterThan(m.hp);
  });

  it('turns a Blue Ghost into exactly one level', () => {
    const m = makeMember('carlmon', 19, 1);
    const { member, lines } = blueGhost(m);
    expect(member.level).toBe(20);
    expect(member.exp).toBe(expAt(20));
    expect(lines.join(' ')).toMatch(/special move, Nozzy Call/);
  });

  it('takes about 20 wild battles to go from 5 to 12', () => {
    const battles = (expAt(12) - expAt(5)) / expYield(4, false);
    expect(battles).toBeGreaterThan(15);
    expect(battles).toBeLessThan(25);
  });

  it('becomes an engine entrant with only the moves it knows', () => {
    const m = makeMember('enda', 5, 1);
    expect(creatureOf(m).moves).toEqual(m.moves);
    expect(toEntrant(m).level).toBe(5);
    expect(statsOf(m).hp).toBe(m.hp);
  });
});

describe('items', () => {
  it('heals, revives and refuses when pointless', () => {
    const m = makeMember('enda', 10, 1);
    const roll = itemById('chicken-fillet-roll');
    expect(canUseOn(roll, m)).toBe(false);
    const hurt = { ...m, hp: 3 };
    expect(canUseOn(roll, hurt)).toBe(true);
    expect(applyItem(roll, hurt).hp).toBe(Math.min(statsOf(m).hp, 33));
    const out = { ...m, hp: 0 };
    expect(canUseOn(roll, out)).toBe(false);
    expect(applyItem(itemById('hair-of-the-dog'), out).hp).toBe(Math.floor(statsOf(m).hp / 2));
  });
});

describe('catching', () => {
  it('follows the main-series odds', () => {
    expect(catchChance(100, 100, 120, 1, null)).toBeCloseTo(0.157, 2);
    expect(catchChance(100, 1, 120, 1, null)).toBeCloseTo(0.469, 2);
    expect(catchChance(100, 1, 120, 1, 'asleep')).toBeCloseTo(0.937, 2);
    expect(catchChance(100, 100, 45, Infinity, null)).toBe(1);
  });

  it('takes 3 sips exactly as often as the chance', () => {
    let state = 1;
    const random = () => (state = (state * 16807) % 2147483647) / 2147483647;
    let full = 0;
    for (let i = 0; i < 20000; i++) if (sips(0.3, random) === 3) full++;
    expect(full / 20000).toBeCloseTo(0.3, 1);
  });

  it('ends a wild battle with the Ranemon joining you', () => {
    const c = creatureById('enda');
    let s: Session = startSession(startBattle([[c], [{ creature: c, level: 3 }]], 2), 'easy', {
      foe: { kind: 'wild' },
      timer: false,
    });
    for (let i = 0; i < 50 && s.mode === 'playing'; i++) s = reduce(s, { type: 'step', random: i });
    expect(s.message).toMatch(/What will/);
    s = reduce(s, {
      type: 'pint',
      pint: { name: 'Perfect Pour', multiplier: Infinity },
      rate: 120,
      random: 1,
    });
    for (let i = 0; i < 50 && s.mode === 'playing'; i++) s = reduce(s, { type: 'step', random: i });
    expect(s.result).toBe('caught');
    expect(s.message).toMatch(/joined you/);
  });

  it('won’t run from a trainer', () => {
    const c = creatureById('enda');
    let s: Session = startSession(startBattle([[c], [c]], 2), 'easy', {
      foe: { kind: 'trainer', name: 'Nóra' },
    });
    for (let i = 0; i < 50 && s.mode === 'playing'; i++) s = reduce(s, { type: 'step', random: i });
    s = reduce(s, { type: 'run', random: 1 });
    expect(s.mode).toBe('menu');
    expect(s.message).toMatch(/No running/);
  });
});

describe('story state', () => {
  it('starts in Clare with no Ranemon', () => {
    const s = newGame();
    expect(s.map).toBe('clare');
    expect(s.party).toHaveLength(0);
  });

  it('sends a 7th Ranemon to the Group Chat', () => {
    let s = newGame();
    for (let i = 0; i < 6; i++) s = recruit(s, 'enda', 5).state;
    const r = recruit(s, 'carlmon', 5);
    expect(r.state.party).toHaveLength(6);
    expect(r.state.box).toHaveLength(1);
    expect(r.line).toMatch(/Group Chat/);
  });

  it('shares EXP after a win and wakes you in the pub after a loss', () => {
    let s = recruit(newGame(), 'carlmon', 5).state;
    const foe = creatureById('enda');
    const { state } = startBattle([s.party.map(toEntrant), [{ creature: foe, level: 5 }]], 1);
    const won = structuredClone(state);
    won.teams[1].battlers[0].hp = 0;
    const after = settleBattle(s, won, 'win', [0], false);
    expect(after.state.party[0].exp).toBe(s.party[0].exp + expYield(5, false));
    s = { ...s, money: 1000, map: 'limerick' };
    const lost = structuredClone(state);
    lost.teams[0].battlers[0].hp = 0;
    const out = settleBattle(s, lost, 'loss', [0], false);
    expect(out.state.money).toBe(500);
    expect(out.state.map).toBe('clare');
    expect(out.state.party[0].hp).toBe(statsOf(s.party[0]).hp);
  });

  it('saves and loads, and survives a broken save', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    const s = recruit(newGame(), 'enda', 5).state;
    expect(save(storage, s)).toBe(true);
    expect(load(storage)).toEqual(s);
    store.set('ranemon.story.v1', '{nope');
    expect(load(storage)).toBeNull();
  });

  it('picks wild Ranemon by weight and level range', () => {
    const wild = {
      min: 2,
      max: 6,
      table: [
        ['enda', 1],
        ['carlmon', 3],
      ] as [string, number][],
    };
    expect(pickWild(wild, 0.1, 0)).toEqual({ species: 'enda', level: 2 });
    expect(pickWild(wild, 0.9, 0.999)).toEqual({ species: 'carlmon', level: 6 });
  });
});
