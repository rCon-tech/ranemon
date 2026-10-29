import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { LEGEND_OWN, PL_TRAINERS } from '@/content/story/premier';
import { FOOTBALLER_MON, FOOTBALLER_MOVES } from '@/lib/battle/footballers';
import { moveById } from '@/lib/battle/moves';
import { rosterOf } from '@/lib/ui/battle-mode';
import { SESH_POOL } from '@/lib/sesh/party';
import { learnedOf, makeMember, speciesById } from '@/lib/story/party';
import { legendsOwn, migrate, SCHEMA } from '@/lib/story/save';
import { beatFlag, newGame } from '@/lib/story/state';
import { UK_DEX } from '@/lib/story/ukdex';

const sum = (b: object) => Object.values(b).reduce((a: number, n: number) => a + n, 0);

describe('the legends’ own Ranemon', () => {
  it('gives each of the twelve one of his own, with a special move only it knows', () => {
    expect(FOOTBALLER_MON).toHaveLength(12);
    expect(LEGEND_OWN.map((o) => o.species)).toEqual(FOOTBALLER_MON.map((c) => c.id));
    for (const c of FOOTBALLER_MON) {
      expect(sum(c.base), c.id).toBe(460);
      const own = c.moves.filter((id) => moveById(id).signature);
      expect(own, c.id).toHaveLength(1);
      expect(moveById(own[0]).signature).toBe(c.id);
      expect(existsSync(resolve('public', c.sprite!.slice(1))), c.id).toBe(true);
      expect(existsSync(resolve('public/sprites/premier/mini', `${c.id}.png`))).toBe(true);
      expect(existsSync(resolve('public/sprites/shiny/premier', `${c.id}.png`))).toBe(true);
    }
    expect(FOOTBALLER_MOVES.every((m) => FOOTBALLER_MON.some((c) => c.id === m.signature))).toBe(
      true,
    );
  });

  it('is his ace in the jersey battle, at the level the team’s ace was', () => {
    for (const t of PL_TRAINERS) {
      const [species, level] = t.team[t.team.length - 1];
      expect(
        FOOTBALLER_MON.some((c) => c.id === species),
        t.id,
      ).toBe(true);
      expect(Math.max(...t.team.map(([, l]) => l))).toBe(level);
      expect(t.team.filter(([id]) => id === species)).toHaveLength(1);
    }
  });

  it('is given to you when you win, after the jersey', () => {
    for (const [i, t] of PL_TRAINERS.entries()) {
      const own = LEGEND_OWN[i];
      const recruit = t.reward!.find((s) => s.do === 'recruit');
      expect(recruit, t.id).toEqual({ do: 'recruit', species: own.species, level: own.level });
    }
  });

  it('is in the UK Ranedex, and never dealt in battle mode or The Sesh', () => {
    const pickable = (['basic', 'evolved'] as const).flatMap((f) =>
      rosterOf('everyone', f).flatMap((s) => s.forms.map((c) => c.id)),
    );
    for (const c of FOOTBALLER_MON) {
      expect(UK_DEX.some((d) => d.id === c.id)).toBe(true);
      expect(pickable).not.toContain(c.id);
      expect(SESH_POOL).not.toContain(c.id);
    }
  });

  it('knows its special move from the start', () => {
    for (const c of FOOTBALLER_MON) {
      const m = makeMember(c.id, 10, 1);
      expect(
        m.moves.some((id) => moveById(id).signature === c.id),
        c.id,
      ).toBe(true);
      expect(learnedOf(m).length).toBeGreaterThan(0);
      expect(speciesById(c.id).name).toBe(c.name);
    }
  });
});

describe('a save that beat legends before they had their own', () => {
  const britain = { map: 'falmer', x: 4, y: 4 };
  const old = (flags: string[], extra: object = {}) => ({
    ...newGame(),
    ...britain,
    party: [makeMember('carlmon', 30, 1)],
    uid: 2,
    flags,
    schema: 7,
    ...extra,
  });

  it('finds each one it beat waiting in the Group Chat, and no others', () => {
    const s = migrate(old([beatFlag('pl-brighton'), beatFlag('pl-palace'), 'pl:brighton']))!;
    expect(s.schema).toBe(SCHEMA);
    expect(s.box.map((m) => m.species)).toEqual(['murraymon', 'wrightymon']);
    expect(s.box.map((m) => m.level)).toEqual([LEGEND_OWN[0].level, LEGEND_OWN[1].level]);
    expect(s.party).toHaveLength(1);
    expect(new Set([...s.party, ...s.box].map((m) => m.uid)).size).toBe(3);
    expect(s.caught).toEqual(expect.arrayContaining(['murraymon', 'wrightymon']));
    expect(s.uid).toBeGreaterThan(Math.max(...s.box.map((m) => m.uid)));
  });

  it('gives nothing to a save that hasn’t beaten anyone, or already has his Ranemon', () => {
    expect(migrate(old([]))!.box).toEqual([]);
    const had = old([beatFlag('pl-brighton')], { box: [makeMember('murraymon', 10, 5)] });
    expect(migrate(had)!.box.map((m) => m.species)).toEqual(['murraymon']);
  });

  it('puts them with your British Ranemon when you’re back in Ireland without them', () => {
    const away = { party: [makeMember('oystermon', 20, 7)], box: [] };
    const d = old([beatFlag('pl-united')], { map: 'clare', x: 3, y: 3, away });
    const s = migrate(d)!;
    expect(s.box).toEqual([]);
    expect(s.away!.box.map((m) => m.species)).toEqual(['keanemon']);
    expect(legendsOwn({ ...d, map: 'falmer' }).box).toBeDefined();
  });

  it('runs once: a save already on this schema is left as it is', () => {
    const s = migrate({ ...old([beatFlag('pl-brighton')]), schema: SCHEMA })!;
    expect(s.box).toEqual([]);
  });
});
