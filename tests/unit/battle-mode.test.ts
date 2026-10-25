import { describe, expect, it } from 'vitest';
import { STAT_KEYS } from '@/lib/battle/creature';
import { startBattle, TEAM_SIZE } from '@/lib/battle/engine';
import { formById } from '@/lib/battle/evolutions';
import { LONDON_LINES } from '@/lib/battle/london';
import { moveById } from '@/lib/battle/moves';
import { Rng, seedFrom } from '@/lib/battle/rng';
import { ROSTER } from '@/lib/battle/roster';
import { SECOND_SPECIALS } from '@/lib/battle/second-specials';
import { UK } from '@/lib/battle/uk';
import { movesAt } from '@/lib/story/party';
import { newGame } from '@/lib/story/state';
import {
  britainUnlocked,
  creatureOfPick,
  entrantOfPick,
  holdItemsFor,
  looksOf,
  newPick,
  rivalTeam,
  rosterOf,
  spareMoves,
  withForm,
} from '@/lib/ui/battle-mode';

const total = (id: string) => STAT_KEYS.reduce((sum, k) => sum + formById(id).base[k], 0);
const ids = (slots: ReturnType<typeof rosterOf>) => slots.map((s) => s.forms.map((c) => c.id));

describe('battle mode’s rosters', () => {
  it('keeps the lads as they were by default', () => {
    expect(ids(rosterOf('lads', 'basic'))).toEqual(ROSTER.map((c) => [c.id]));
  });

  it('evolves every lad, with a choice where the story has one', () => {
    const evolved = rosterOf('lads', 'evolved');
    expect(evolved).toHaveLength(ROSTER.length);
    expect(evolved.find((s) => s.line === 'carlmon')!.forms.map((c) => c.id)).toEqual([
      'carlizard',
    ]);
    expect(evolved.find((s) => s.line === 'killemon')!.forms.map((c) => c.id)).toEqual([
      'killigatr',
      'cholokill',
    ]);
    for (const s of evolved) for (const c of s.forms) expect(total(c.id)).toBe(460);
  });

  it('brings London’s own in, inside the usual budget unless evolved', () => {
    const basic = rosterOf('london', 'basic');
    for (const s of basic) expect(total(s.forms[0].id)).toBeLessThanOrEqual(400);
    // A fossil starts out big, so it only fights fully evolved.
    expect(basic.map((s) => s.line)).not.toContain('aerodactivist');
    const evolved = rosterOf('london', 'evolved');
    expect(evolved.map((s) => s.line)).toEqual(LONDON_LINES);
    expect(evolved.find((s) => s.line === 'wickmon')!.forms).toHaveLength(5);
    expect(rosterOf('everyone', 'basic')).toHaveLength(ROSTER.length + basic.length);
  });
});

describe('a pick in battle mode', () => {
  it('can wear the drawn UK look, which only the lads have', () => {
    expect(looksOf('carlmon').map((v) => v.id)).toEqual(['tache', UK]);
    expect(looksOf('cholokill').map((v) => v.id)).toEqual([UK]);
    expect(looksOf('golpeak')).toEqual([]);
    const pick = { ...newPick(rosterOf('lads', 'basic')[0]), variant: UK };
    expect(creatureOfPick(pick).sprite).toBe('/sprites/drawn/carlmon.png');
  });

  it('holds what it gets something from, as in story mode', () => {
    expect(holdItemsFor('enda').map((i) => i.id)).toEqual(['friendship-bracelet', 'xanax']);
    expect(holdItemsFor('conix').map((i) => i.id)).toContain('vegan-stone');
    const pick = { ...newPick(rosterOf('lads', 'basic')[2]), held: 'xanax' as const };
    expect(entrantOfPick(pick)).toMatchObject({ held: { spirit: 1.2 }, calm: true });
    expect(entrantOfPick(newPick(rosterOf('lads', 'basic')[2]))).not.toHaveProperty('calm');
  });

  it('swaps in moves it learns by Lv50, keeping to one special move', () => {
    const seconds = new Set(SECOND_SPECIALS.map((m) => m.id));
    for (const s of rosterOf('everyone', 'evolved'))
      for (const c of s.forms) {
        const spare = spareMoves(c, c.moves);
        for (const id of spare) {
          expect(seconds.has(id), `${c.id} ${id}`).toBe(false);
          expect(c.moves).not.toContain(id);
          expect(movesAt(c, 50).includes(id) || formById(c.id).moves.includes(id)).toBe(true);
        }
        expect(c.moves.filter((id) => moveById(id).signature)).toHaveLength(1);
      }
  });

  it('keeps its moves when it changes form, where the new form can use them', () => {
    const slot = rosterOf('lads', 'evolved').find((s) => s.line === 'killemon')!;
    const pick = newPick(slot);
    const cholo = withForm({ ...pick, held: 'xanax' }, 'cholokill');
    expect(cholo.moves).toContain('whabam');
    expect(cholo.held).toBe('xanax');
    expect(withForm({ ...pick, variant: 'thumbs' }, 'cholokill')).not.toHaveProperty('variant');
  });
});

describe('the rival in battle mode', () => {
  it('draws 6 from the rest of the same roster, at forms the rule allows', () => {
    for (const roster of ['lads', 'london', 'everyone'] as const)
      for (const forms of ['basic', 'evolved'] as const) {
        const slots = rosterOf(roster, forms);
        const mine = slots.slice(0, TEAM_SIZE).map((s) => s.line);
        const rng = new Rng(seedFrom(`${roster}-${forms}`));
        const rival = rivalTeam(slots, mine, TEAM_SIZE, () => rng.next());
        expect(rival).toHaveLength(TEAM_SIZE);
        const allowed = slots.filter((s) => !mine.includes(s.line)).flatMap((s) => s.forms);
        for (const c of rival) expect(allowed.map((a) => a.id)).toContain(c.id);
        const teams = [slots.slice(0, TEAM_SIZE).map((s) => entrantOfPick(newPick(s))), rival];
        expect(() => startBattle(teams as never, 1)).not.toThrow();
      }
  });
});

describe('Britain in battle mode', () => {
  const storage = (entries: Record<string, string>) => ({
    length: Object.keys(entries).length,
    key: (i: number) => Object.keys(entries)[i] ?? null,
    getItem: (k: string) => entries[k] ?? null,
  });

  it('stays a surprise until a story save has been there', () => {
    const home = JSON.stringify(newGame());
    const abroad = JSON.stringify({ ...newGame(), ukSeen: ['carlmon'] });
    expect(britainUnlocked(null)).toBe(false);
    expect(britainUnlocked(storage({ 'ranemon.story.v1:rich': home }))).toBe(false);
    expect(britainUnlocked(storage({ other: abroad }))).toBe(false);
    expect(
      britainUnlocked(storage({ 'ranemon.story.v1:rich': home, 'ranemon.story.v1:con': abroad })),
    ).toBe(true);
    expect(looksOf('carlmon', false).map((v) => v.id)).toEqual(['tache']);
  });
});
