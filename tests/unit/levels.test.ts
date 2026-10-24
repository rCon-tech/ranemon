import { describe, expect, it } from 'vitest';
import { MAX_LEVEL } from '@/lib/battle/creature';
import { startBattle } from '@/lib/battle/engine';
import { creatureById } from '@/lib/battle/roster';
import { CARL_PRICE, CARL_PUB, MET_CARL } from '@/content/story/ball';
import { INTERIORS } from '@/content/story/maps';
import { trainerById } from '@/content/story/trainers';
import { canUseOn, itemById, priceOf } from '@/lib/story/items';
import { GYM_ORDER, levelCap, scaleTeam } from '@/lib/story/levels';
import { blueGhost, expAt, gainExp, makeMember, toEntrant } from '@/lib/story/party';
import { beatFlag, newGame, recruit, settleBattle } from '@/lib/story/state';
import type { Step } from '@/lib/story/world';

const beaten = (n: number) => GYM_ORDER.slice(0, n).map(beatFlag);

describe('Carl Ryan in McGrattans', () => {
  const pubs = INTERIORS.filter((m) => /-P\d+$/.test(m.id));

  it('is in every McGrattans, from the start', () => {
    expect(pubs.length).toBeGreaterThan(5);
    for (const pub of pubs) {
      const carl = pub.npcs.find((n) => n.look === 'carl');
      expect(carl, pub.id).toBe(CARL_PUB);
      expect(carl?.showIf, pub.id).toBeUndefined();
    }
  });

  it('sells Blue Ghosts for a tenth of the Vapes price, and won’t say where from', () => {
    const shop = CARL_PUB.talk!.find((s) => s.do === 'shop');
    const stall = shop?.do === 'shop' ? shop.stall : undefined;
    expect(stall?.stock.map((s) => s.item)).toEqual(['blue-ghost']);
    expect(priceOf('blue-ghost', stall)).toBe(CARL_PRICE);
    expect(CARL_PRICE * 10).toBe(itemById('blue-ghost').price);
    const text = JSON.stringify(CARL_PUB.talk);
    expect(text).toMatch(/Don’t ask|never saw me/);
    const first = CARL_PUB.talk![0] as Extract<Step, { do: 'if' }>;
    expect(first.flag).toBe(MET_CARL);
  });
});

describe('level cap', () => {
  it('is the next gym leader’s ace, and goes up as each gym is beaten', () => {
    expect(levelCap(newGame())).toEqual({ level: 11, leader: 'Nóra' });
    expect(levelCap({ flags: beaten(1) })).toEqual({ level: 16, leader: 'Big Donncha' });
    expect(levelCap({ flags: beaten(9) })).toEqual({ level: 55, leader: 'B&S' });
    let last = 0;
    for (let n = 0; n < GYM_ORDER.length; n++) {
      const cap = levelCap({ flags: beaten(n) });
      expect(cap.level).toBeGreaterThan(last);
      last = cap.level;
    }
  });

  it('is gone once you’re Champion', () => {
    expect(levelCap({ flags: [...beaten(10)] })).toEqual({ level: MAX_LEVEL, leader: null });
    expect(levelCap({ flags: ['champion'] })).toEqual({ level: MAX_LEVEL, leader: null });
  });

  it('stops EXP at the cap and loses what’s left over', () => {
    const cap = levelCap(newGame());
    const m = makeMember('carlmon', 9, 1);
    const { member, lines } = gainExp(m, expAt(20) - m.exp, [], cap);
    expect(member.level).toBe(11);
    expect(member.exp).toBe(expAt(11));
    expect(lines.at(-1)).toBe('Carlmon can’t grow past Lv11 until you beat Nóra.');
    const again = gainExp(member, 500, [], cap);
    expect(again.member).toEqual(member);
    expect(again.lines).toEqual(['Carlmon can’t grow past Lv11 until you beat Nóra.']);
  });

  it('stops Blue Ghosts at the cap, and the bag won’t offer one', () => {
    const cap = levelCap(newGame());
    const ghost = itemById('blue-ghost');
    const under = makeMember('carlmon', 10, 1);
    expect(canUseOn(ghost, under, cap.level)).toBe(true);
    const up = blueGhost(under, [], cap).member;
    expect(up.level).toBe(11);
    expect(canUseOn(ghost, up, cap.level)).toBe(false);
    const r = blueGhost(up, [], cap);
    expect(r.member).toEqual(up);
    expect(r.lines.at(-1)).toMatch(/can’t grow past Lv11/);
    // With no cap given, as before.
    expect(canUseOn(ghost, up)).toBe(true);
  });

  it('caps battle EXP, but beating the leader who sets the cap lifts it for that win', () => {
    let s = recruit(newGame(), 'carlmon', 11).state;
    const foe = creatureById('enda');
    const { state } = startBattle([s.party.map(toEntrant), [{ creature: foe, level: 30 }]], 1);
    const won = structuredClone(state);
    won.teams[1].battlers[0].hp = 0;
    const wild = settleBattle(s, won, 'win', [0], false);
    expect(wild.state.party[0].level).toBe(11);
    expect(wild.lines).toEqual(['Carlmon can’t grow past Lv11 until you beat Nóra.']);
    const gym = settleBattle(s, won, 'win', [0], true, 'gym-clare');
    expect(gym.state.party[0].level).toBeGreaterThan(11);
    expect(gym.state.party[0].level).toBeLessThanOrEqual(16);
    s = { ...s, flags: ['champion'] };
    expect(settleBattle(s, won, 'win', [0], false).state.party[0].level).toBeGreaterThan(11);
  });

  it('says the whole party is at the cap in one line', () => {
    let s = recruit(newGame(), 'carlmon', 11).state;
    s = recruit(s, 'olliemon', 10).state;
    s = { ...s, expShare: true };
    const foe = creatureById('enda');
    const { state } = startBattle([s.party.map(toEntrant), [{ creature: foe, level: 30 }]], 1);
    const won = structuredClone(state);
    won.teams[1].battlers[0].hp = 0;
    const { lines } = settleBattle(s, won, 'win', [0], false);
    expect(lines[0]).toMatch(/^Olliemon gained \d+ EXP!$/);
    expect(lines.at(-1)).toBe('Carlmon and Olliemon can’t grow past Lv11 until you beat Nóra.');
    expect(lines.filter((l) => l.includes('can’t grow past'))).toHaveLength(1);
  });

  it('never takes levels off a Ranemon already past it', () => {
    const s = recruit(newGame(), 'carlmon', 30).state;
    const foe = creatureById('enda');
    const { state } = startBattle([s.party.map(toEntrant), [{ creature: foe, level: 5 }]], 1);
    const won = structuredClone(state);
    won.teams[1].battlers[0].hp = 0;
    const out = settleBattle(s, won, 'win', [0], false).state.party[0];
    expect(out.level).toBe(30);
    expect(out.exp).toBe(s.party[0].exp);
  });
});

describe('level scaling after the gyms', () => {
  const team = trainerById('greystones-cyclist').team;

  it('leaves teams alone until you’re Champion', () => {
    const s = recruit(newGame(), 'carlmon', 58).state;
    expect(scaleTeam(team, s)).toEqual(team);
  });

  it('lifts the whole team so its ace matches your best Ranemon', () => {
    let s = recruit({ ...newGame(), flags: ['champion'] }, 'carlmon', 30).state;
    s = recruit(s, 'enda', 58).state;
    const scaled = scaleTeam(team, s);
    const ace = Math.max(...team.map(([, l]) => l));
    expect(Math.max(...scaled.map(([, l]) => l))).toBe(58);
    scaled.forEach(([id, l], i) => {
      expect(id).toBe(team[i][0]);
      expect(l).toBe(team[i][1] + 58 - ace);
    });
  });

  it('never makes a team weaker, or higher than the top level', () => {
    const low = recruit({ ...newGame(), flags: ['champion'] }, 'carlmon', 10).state;
    expect(scaleTeam(team, low)).toEqual(team);
    const top = recruit({ ...newGame(), flags: ['champion'] }, 'carlmon', MAX_LEVEL).state;
    const bns = trainerById('bns-rematch').team;
    expect(scaleTeam(bns, top).every(([, l]) => l <= MAX_LEVEL)).toBe(true);
  });
});
