import { describe, expect, it } from 'vitest';
import { legalActions, startBattle } from '@/lib/battle/engine';
import { lineOf } from '@/lib/battle/evolutions';
import { makeMember, toEntrant } from '@/lib/story/party';
import { find } from '@/lib/story/world';
import { reduce, startSession, type Session } from '@/lib/ui/session';
import { STYLES } from '@/components/story/people';
import { mapById } from '@/content/story/maps';
import { ALEX, trainerById } from '@/content/story/trainers';

const alex = trainerById('trinity-alex');

/** Steps through playback until the screen wants input, keeping every line shown. */
function untilInput(s: Session, said: string[]): Session {
  for (let i = 0; i < 500 && s.mode === 'playing'; i++) {
    const line = s.line;
    s = reduce(s, { type: 'step', random: i });
    if (s.line !== line) said.push(s.message);
  }
  return s;
}

describe('Alex Simonin', () => {
  it('only ever says the one thing', () => {
    expect(ALEX).toBe('ALEX SIMONIN: How do we always end up here?');
    expect(alex.before).toBe(ALEX);
    expect(alex.after).toBe(ALEX);
    expect(alex.line).toBe(ALEX);
    expect(alex.reward).toBeUndefined();
  });

  it('brings Simomon and its evolution, and nothing else', () => {
    const forms = alex.team.map(([id, level], i) => makeMember(id, level, i).species);
    expect(new Set(alex.team.map(([id]) => id))).toEqual(new Set(['simomon']));
    for (const form of forms) expect(lineOf(form)).toBe('simomon');
    // From Lv30 trainers' Ranemon are already evolved, so in Trinity they're all Weezimo.
    expect(forms).toEqual(['weezimo', 'weezimo', 'weezimo']);
  });

  it('matches the scholars around him in Trinity', () => {
    const scholars = ['scholar-1', 'scholar-2', 'scholar-3'].map(trainerById);
    const near = scholars.flatMap((t) => t.team.map(([, l]) => l));
    for (const [, level] of alex.team) {
      expect(level).toBeGreaterThanOrEqual(Math.min(...near) - 1);
      expect(level).toBeLessThanOrEqual(Math.max(...near));
    }
    expect(alex.team.length).toBe(scholars[0].team.length);
    expect(alex.ai).toBe(scholars[0].ai);
    expect(alex.prize).toBe(scholars[0].prize);
  });

  it('stands in Front Square, watching the path to the Long Room', () => {
    const map = mapById('trinity');
    const npc = map.npcs!.find((n) => n.trainer === 'trinity-alex')!;
    expect(npc.look).toBe('alex');
    const [at] = find(map, String(map.npcs!.indexOf(npc) + 1));
    expect(npc.face).toBe('left');
    // The path up from the gate runs through the tile he can see furthest off.
    expect(map.rows[at.y][at.x - npc.sight!]).toBe('=');
  });

  it('wears only pink, with love hearts', () => {
    const s = STYLES.alex;
    expect(s.hearts).toBeDefined();
    for (const colour of [s.hat!.colour, s.top, s.trim, s.legs, s.shoes]) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(colour.slice(i, i + 2), 16));
      // Pink: red highest, blue next, green lowest.
      expect(r).toBeGreaterThan(b);
      expect(b).toBeGreaterThan(g);
    }
  });

  it('says his line in battle every time he sends out a Ranemon', () => {
    const foes = alex.team.map(([id, level], i) => toEntrant(makeMember(id, level, 100 + i)));
    const party = [toEntrant(makeMember('boydemon', 40, 0))];
    const said: string[] = [];
    let s = startSession(startBattle([party, foes], 7), 'easy', {
      foe: { kind: 'trainer', name: alex.name, line: alex.line },
      timer: false,
    });
    s = untilInput(s, said);
    for (let turn = 0; turn < 200 && s.mode !== 'over'; turn++) {
      const move = legalActions(s.state, 0).find((a) => a.kind === 'move')!;
      s = untilInput(reduce(s, { type: 'act', action: move, random: turn }), said);
    }
    const sendOuts = said
      .map((line, i) => [line, i] as const)
      .filter(([line]) => line.startsWith('Alex Simonin sent out'));
    expect(sendOuts.length).toBeGreaterThanOrEqual(2);
    for (const [, i] of sendOuts) expect(said[i + 1]).toBe(ALEX);
    expect(said.filter((line) => line.includes('ALEX')).length).toBe(sendOuts.length);
  });

  it('says nothing extra for a trainer without a line', () => {
    const foes = alex.team.map(([id, level], i) => toEntrant(makeMember(id, level, 100 + i)));
    const party = [toEntrant(makeMember('boydemon', 40, 0))];
    const said: string[] = [];
    untilInput(
      startSession(startBattle([party, foes], 7), 'easy', {
        foe: { kind: 'trainer', name: 'Monk Colm' },
      }),
      said,
    );
    expect(said.some((line) => line.includes('How do we'))).toBe(false);
  });
});
