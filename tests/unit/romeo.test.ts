import { describe, expect, it } from 'vitest';
import { legalActions, startBattle } from '@/lib/battle/engine';
import { lineOf } from '@/lib/battle/evolutions';
import { makeMember, toEntrant } from '@/lib/story/party';
import { find } from '@/lib/story/world';
import { reduce, startSession, type Session } from '@/lib/ui/session';
import { STYLES } from '@/components/story/people';
import { mapById } from '@/content/story/maps';
import { ROMEO, trainerById } from '@/content/story/trainers';

const romeo = trainerById('wm-romeo');

/** Steps through playback until the screen wants input, keeping every line shown. */
function untilInput(s: Session, said: string[]): Session {
  for (let i = 0; i < 500 && s.mode === 'playing'; i++) {
    const line = s.line;
    s = reduce(s, { type: 'step', random: i });
    if (s.line !== line) said.push(s.message);
  }
  return s;
}

describe('Romeo Ruairí', () => {
  it('only ever says the one thing', () => {
    expect(ROMEO).toBe('ROMEO RUAIRÍ: How do we always end up here?');
    expect(romeo.before).toBe(ROMEO);
    expect(romeo.after).toBe(ROMEO);
    expect(romeo.line).toBe(ROMEO);
    expect(romeo.reward).toBeUndefined();
  });

  it('brings Simomon and its evolution, and nothing else', () => {
    const forms = romeo.team.map(([id, level], i) => makeMember(id, level, i).species);
    expect(new Set(romeo.team.map(([id]) => id))).toEqual(new Set(['simomon']));
    for (const form of forms) expect(lineOf(form)).toBe('simomon');
    // Both forms turn up: a Simomon at Lv28, and one already evolved at Lv30.
    expect(forms).toEqual(['simomon', 'weezimo']);
  });

  it('matches the trainers around him in Westmeath', () => {
    const near = ['wm-fan', 'lads-fiach'].flatMap((id) => trainerById(id).team.map(([, l]) => l));
    for (const [, level] of romeo.team) {
      expect(level).toBeGreaterThanOrEqual(Math.min(...near) - 1);
      expect(level).toBeLessThanOrEqual(Math.max(...near));
    }
    expect(romeo.team.length).toBe(trainerById('lads-fiach').team.length);
    expect(romeo.ai).toBe('easy');
    expect(romeo.prize).toBe(30 * 20);
  });

  it('waits outside Sean’s Bar, watching the path to the door', () => {
    const map = mapById('westmeath');
    const npc = map.npcs!.find((n) => n.trainer === 'wm-romeo')!;
    expect(npc.look).toBe('romeo');
    const [at] = find(map, String(map.npcs!.indexOf(npc) + 1));
    const [bar] = find(map, 'L');
    expect(npc.face).toBe('left');
    expect(at.x - npc.sight!).toBeLessThanOrEqual(bar.x);
    expect(at.y).toBe(bar.y + 1);
  });

  it('wears only pink, with love hearts', () => {
    const s = STYLES.romeo;
    expect(s.hearts).toBeDefined();
    for (const colour of [s.hat!.colour, s.top, s.trim, s.legs, s.shoes]) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(colour.slice(i, i + 2), 16));
      // Pink: red highest, blue next, green lowest.
      expect(r).toBeGreaterThan(b);
      expect(b).toBeGreaterThan(g);
    }
  });

  it('says his line in battle every time he sends out a Ranemon', () => {
    const foes = romeo.team.map(([id, level], i) => toEntrant(makeMember(id, level, 100 + i)));
    const party = [toEntrant(makeMember('boydemon', 40, 0))];
    const said: string[] = [];
    let s = startSession(startBattle([party, foes], 7), 'easy', {
      foe: { kind: 'trainer', name: romeo.name, line: romeo.line },
      timer: false,
    });
    s = untilInput(s, said);
    for (let turn = 0; turn < 200 && s.mode !== 'over'; turn++) {
      const move = legalActions(s.state, 0).find((a) => a.kind === 'move')!;
      s = untilInput(reduce(s, { type: 'act', action: move, random: turn }), said);
    }
    const sendOuts = said
      .map((line, i) => [line, i] as const)
      .filter(([line]) => line.startsWith('Romeo Ruairí sent out'));
    expect(sendOuts.length).toBeGreaterThanOrEqual(2);
    for (const [, i] of sendOuts) expect(said[i + 1]).toBe(ROMEO);
    expect(said.filter((line) => line.includes('ROMEO')).length).toBe(sendOuts.length);
  });

  it('says nothing extra for a trainer without a line', () => {
    const foes = romeo.team.map(([id, level], i) => toEntrant(makeMember(id, level, 100 + i)));
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
