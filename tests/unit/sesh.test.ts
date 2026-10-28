import { describe, expect, it } from 'vitest';
import { lineOf } from '@/lib/battle/evolutions';
import { LONDON } from '@/lib/battle/london';
import { hasMega } from '@/lib/battle/mega';
import { RANELASS_MON } from '@/lib/battle/ranelasses';
import { Rng } from '@/lib/battle/rng';
import { actionOf, replayBattle, settle, startSeshBattle } from '@/lib/sesh/battle';
import { STYLES } from '@/components/story/people';
import { BOSSES } from '@/lib/sesh/bosses';
import { bossAt, bossesFor, bouncerAt, DROPS, fightAt } from '@/lib/sesh/foes';
import { isFair, routes, stageMap } from '@/lib/sesh/map';
import { SESH_LEVEL, SESH_POOL, seshParty } from '@/lib/sesh/party';
import {
  battleOf,
  choices,
  newRun,
  offieStock,
  play,
  replayRun,
  scoreOf,
  type SeshRun,
} from '@/lib/sesh/run';
import { fightLevel, PICKS, QUICK_STAGES } from '@/lib/sesh/stages';
import { heldBoost } from '@/lib/story/items';
import { PARTY_SIZE } from '@/lib/story/party';
import { reduce } from '@/lib/ui/session';
import { botBattle, botRun } from '../fixtures/sesh-bot';

const SEEDS = Array.from({ length: 60 }, (_, i) => 7919 * i + 13);

describe('the Sesh party', () => {
  it('is 6 photo Ranemon at Lv50, no line twice, each holding something that works', () => {
    for (const seed of SEEDS) {
      const party = seshParty(seed);
      expect(party).toHaveLength(PARTY_SIZE);
      expect(new Set(party.map((m) => lineOf(m.species))).size).toBe(PARTY_SIZE);
      for (const m of party) {
        expect(m.level).toBe(SESH_LEVEL);
        expect(SESH_POOL).toContain(m.species);
        expect(heldBoost(m), m.species).toBeDefined();
        expect(m.moves.length).toBeGreaterThan(0);
      }
    }
  });

  it('is the same from the same seed, and differs between seeds', () => {
    expect(seshParty(42)).toEqual(seshParty(42));
    expect(seshParty(42)).not.toEqual(seshParty(43));
  });

  it('never deals London’s own, the Sidemen’s or the Ranelasses’ Ranemon', () => {
    const banned = new Set([...LONDON, ...RANELASS_MON].map((c) => c.id));
    for (const id of SESH_POOL) expect(banned.has(id), id).toBe(false);
  });
});

describe('a stage’s map', () => {
  it('has PICKS rows of 2 or 3, and every node can be reached', () => {
    for (const seed of SEEDS) {
      for (let s = 0; s < QUICK_STAGES.length; s++) {
        const map = stageMap(seed, s);
        expect(map).toHaveLength(PICKS);
        map.forEach((row, r) => {
          expect(row.length).toBeGreaterThanOrEqual(2);
          expect(row.length).toBeLessThanOrEqual(3);
          if (r === 0) return;
          row.forEach((_, j) => expect(map[r - 1].some((n) => n.next.includes(j))).toBe(true));
        });
        for (const n of map[PICKS - 1]) expect(n.next).toEqual([]);
      }
    }
  });

  it('passes a Smoking Area on every route, and every Bouncer can be avoided', () => {
    for (const seed of SEEDS) {
      for (let s = 0; s < QUICK_STAGES.length; s++) {
        const map = stageMap(seed, s);
        expect(isFair(map)).toBe(true);
        for (const route of routes(map)) expect(route).toContain('smoke');
        expect(routes(map).some((route) => !route.includes('bouncer'))).toBe(true);
      }
    }
  });

  it('has every kind of node across a few runs', () => {
    const kinds = new Set(
      SEEDS.flatMap((seed) =>
        stageMap(seed, 0)
          .flat()
          .map((n) => n.kind),
      ),
    );
    expect([...kinds].sort()).toEqual(['bouncer', 'fight', 'offie', 'smoke']);
  });
});

describe('Sesh foes', () => {
  it('fight at the stage’s fixed levels, mostly 1v1', () => {
    let singles = 0;
    let all = 0;
    QUICK_STAGES.forEach((stage, s) => {
      for (const seed of SEEDS) {
        for (let row = 0; row < PICKS; row++) {
          const foe = fightAt(seed, stage, s, row, 0);
          all++;
          if (foe.team.length === 1) singles++;
          expect(foe.team.length).toBeLessThanOrEqual(2);
          expect(Math.max(...foe.team.map((m) => m.level))).toBe(fightLevel(stage, row));
          for (const m of foe.team) {
            expect(m.level).toBeGreaterThanOrEqual(stage.fights[0] - 1);
            expect(m.level).toBeLessThanOrEqual(stage.fights[1]);
          }
          expect(foe.ai).toBe('normal');
        }
      }
    });
    expect(singles / all).toBeGreaterThan(0.6);
  });

  it('run from Lv46 at The Pub to Lv65 for The Afterparty’s boss', () => {
    expect(QUICK_STAGES.map((s) => s.fights)).toEqual([
      [46, 50],
      [52, 56],
      [58, 62],
    ]);
    expect(QUICK_STAGES.map((s) => s.boss)).toEqual([
      { level: 52, team: 3 },
      { level: 58, team: 4 },
      { level: 65, team: 5 },
    ]);
  });

  it('have Bouncers that are Hard and drop a held item, or the Mega Ring at The Afterparty', () => {
    QUICK_STAGES.forEach((stage, s) => {
      const b = bouncerAt(9, stage, s, 1, 0, false);
      expect(b.ai).toBe('hard');
      expect(b.team).toHaveLength(stage.bouncer.team);
      if (stage.id === 'after') expect(b.drop).toBe('mega-ring');
      else expect(DROPS).toContain(b.drop);
    });
    const after = QUICK_STAGES.length - 1;
    expect(DROPS).toContain(bouncerAt(9, QUICK_STAGES[after], after, 1, 0, true).drop);
  });

  it('have a different random boss at each stage, at the stage’s level and team size', () => {
    for (const seed of SEEDS) {
      const ids = bossesFor(seed, QUICK_STAGES.length);
      expect(new Set(ids).size).toBe(ids.length);
      QUICK_STAGES.forEach((stage, s) => {
        const boss = bossAt(seed, stage, s, ids[s]);
        expect(boss.ai).toBe('hard');
        expect(boss.team).toHaveLength(stage.boss.team);
        expect(boss.team.at(-1)!.level).toBe(stage.boss.level);
        expect(new Set(boss.team.map((m) => lineOf(m.species))).size).toBe(boss.team.length);
        for (const m of boss.team) expect(SESH_POOL).toContain(m.species);
        if (boss.mega) {
          expect(stage.id).toBe('after');
          expect(boss.team.at(-1)!.species).toBe(boss.mega);
          expect(hasMega(boss.mega)).toBe(true);
        }
      });
    }
    expect(new Set(SEEDS.map((seed) => bossesFor(seed, 3)[0])).size).toBeGreaterThan(3);
  });

  it('never have a Ranelass as a boss', () => {
    for (const b of BOSSES) {
      expect(b.trainer?.startsWith('rowans-')).not.toBe(true);
      expect(['bhav', 'esme', 'viv']).not.toContain(b.look);
    }
  });

  it('each come with their story look, lines and a team, with or without a story trainer', () => {
    expect(new Set(BOSSES.map((b) => b.id)).size).toBe(BOSSES.length);
    for (const b of BOSSES) {
      expect(Object.hasOwn(STYLES, b.look)).toBe(true);
      QUICK_STAGES.forEach((stage, s) => {
        const foe = bossAt(1, stage, s, b.id);
        expect(foe.name).toBeTruthy();
        expect(foe.before).toBeTruthy();
        expect(foe.after).toBeTruthy();
        expect(foe.look).toBe(b.look);
        expect(foe.music).toBeTruthy();
        expect(foe.team).toHaveLength(stage.boss.team);
      });
    }
  });
});

describe('a Sesh battle', () => {
  const run = newRun(5);
  const boss = bossAt(5, QUICK_STAGES[0], 0, run.bosses[0]);

  it('plays out the same from the same choices, whatever the screen rolls', () => {
    const start = startSeshBattle(run.party, boss, 99, false);
    const { inputs, session } = botBattle(start, new Rng(1));
    // The same choices with other rolls passed in: still the same battle.
    let s = settle(start);
    for (const input of inputs) {
      const a = { ...actionOf(input), random: 0.123 } as ReturnType<typeof actionOf>;
      s = settle(reduce(s, a));
    }
    expect(s.state).toEqual(session.state);
    expect(replayBattle(start, inputs, {}).session.state).toEqual(session.state);
  });

  it('turns away a choice the battle or the bag doesn’t allow', () => {
    const start = startSeshBattle(run.party, boss, 99, false);
    expect(() =>
      replayBattle(start, [{ kind: 'act', action: { kind: 'move', index: 9 } }], {}),
    ).toThrow();
    expect(() =>
      replayBattle(start, [{ kind: 'item', item: 'full-irish', target: 0 }], {}),
    ).toThrow();
    expect(() => replayBattle(start, [{ kind: 'replace', to: 1 }], {})).toThrow();
  });
});

describe('a Quick Sesh run', () => {
  it('starts with the party, cash and a boss for each stage', () => {
    const run = newRun(77);
    expect(run.party).toEqual(seshParty(77));
    expect(run.bosses).toHaveLength(QUICK_STAGES.length);
    expect(run.cash).toBeGreaterThan(0);
    expect(choices(run)).toEqual(stageMap(77, 0)[0].map((_, i) => i));
  });

  it('replays exactly from its seed and choices', () => {
    for (const seed of SEEDS.slice(0, 8)) {
      const played = botRun(newRun(seed), seed);
      expect(replayRun(seed, played.actions)).toEqual(played.run);
      expect(played.run.over).not.toBeNull();
    }
  });

  it('turns away choices it doesn’t allow', () => {
    const run = newRun(3);
    expect(() => play(run, { kind: 'pick', col: 7 })).toThrow();
    expect(() => play(run, { kind: 'boss' })).toThrow();
    expect(() => play(run, { kind: 'leave' })).toThrow();
    expect(() => play(run, { kind: 'battle', inputs: [] })).toThrow();
    expect(() => play(run, { kind: 'use', item: 'blue-ghost', uid: 1 })).toThrow();
  });

  it('won’t take a battle that isn’t finished', () => {
    const map = stageMap(11, 0);
    const col = map[0].findIndex((n) => n.kind === 'fight' || n.kind === 'bouncer');
    if (col < 0) return;
    const run = play(newRun(11), { kind: 'pick', col }).run;
    expect(() => play(run, { kind: 'battle', inputs: [] })).toThrow();
  });

  it('sends anyone still fainted after a win home in a taxi, and gives everyone else EXP', () => {
    for (const seed of SEEDS) {
      let run: SeshRun = newRun(seed);
      const col = choices(run).find((c) => stageMap(seed, 0)[0][c].kind === 'fight');
      if (col === undefined) continue;
      run = play(run, { kind: 'pick', col }).run;
      const battle = battleOf(run)!;
      const { inputs, session } = botBattle(battle.start, new Rng(seed));
      if (session.result !== 'win') continue;
      const after = play(run, { kind: 'battle', inputs }).run;
      // A wild partner who joined mid-battle is on the end of the team, not in the party.
      const fainted = session.state.teams[0].battlers
        .slice(0, run.party.length)
        .filter((b) => b.hp === 0).length;
      expect(after.party).toHaveLength(run.party.length - fainted);
      expect(after.gone).toHaveLength(fainted);
      for (const m of after.party) {
        expect(m.hp).toBeGreaterThan(0);
        expect(m.exp).toBeGreaterThan(run.party.find((p) => p.uid === m.uid)!.exp);
      }
      expect(after.cash).toBe(run.cash + battle.foe.prize);
      if (fainted) return;
    }
  });

  it('sells at the Offie only what it stocks, for cash you have', () => {
    for (const seed of SEEDS) {
      const col = stageMap(seed, 0)[0].findIndex((n) => n.kind === 'offie');
      if (col < 0) continue;
      let run = play(newRun(seed), { kind: 'pick', col }).run;
      const stock = offieStock(run);
      expect(stock.length).toBeGreaterThanOrEqual(4);
      expect(() => play(run, { kind: 'buy', item: 'perfect-pour' })).toThrow();
      run = play(run, { kind: 'buy', item: 'chicken-fillet-roll' }).run;
      expect(run.bag['chicken-fillet-roll']).toBe(3);
      run = play(run, { kind: 'leave' }).run;
      expect(run.at).toBeNull();
      return;
    }
    throw new Error('No Offie in the first row of any seed');
  });

  it('scores bosses first, then Ranemon standing, then fewest turns', () => {
    const base = newRun(1);
    const a = { ...base, beaten: 2, party: base.party.slice(0, 1), turns: 900 };
    const b = { ...base, beaten: 1, party: base.party, turns: 10 };
    const c = { ...base, beaten: 1, party: base.party.slice(0, 5), turns: 5 };
    const d = { ...base, beaten: 1, party: base.party.slice(0, 5), turns: 50 };
    expect(scoreOf(a)).toBeGreaterThan(scoreOf(b));
    expect(scoreOf(b)).toBeGreaterThan(scoreOf(c));
    expect(scoreOf(c)).toBeGreaterThan(scoreOf(d));
  });
});
