import { describe, expect, it } from 'vitest';
import { interiorId } from '@/content/story/interiors';
import {
  AGREEMENT,
  FIXTURES,
  LANDED,
  LONDON_ONLY,
  PROVAI_ASKED,
  PROVAI_MET,
  UK_STARTER,
} from '@/content/story/kneecap';
import { ARRIVALS_ID, LONDON_INTRO } from '@/content/story/london';
import { mapById } from '@/content/story/maps';
import { FIXTURE_LIST, plFlag, legendId } from '@/content/story/premier';
import { trainerById } from '@/content/story/trainers';
import { onlineName } from '@/lib/story/cloud';
import { levelCap } from '@/lib/story/levels';
import { openMissions } from '@/lib/story/missions';
import {
  backupKey,
  describe as describeSave,
  exportCode,
  importCode,
  load,
  save,
} from '@/lib/story/save';
import {
  beatFlag,
  LONDON_SAVE_KEY,
  modeOf,
  newGame,
  newLondonGame,
  recruit,
  SAVE_KEY,
  saveKey,
} from '@/lib/story/state';
import { npcsOf, type Step } from '@/lib/story/world';
import { britainUnlocked } from '@/lib/ui/battle-mode';

/** Plays a script against `flags`, answering every question yes, noting what happens. */
function play(steps: Step[], flags: Set<string>, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'give') out.push(`GIVE ${s.item} ${s.count ?? 1}`);
    else if (s.do === 'travel') out.push(`TRAVEL ${s.map}`);
    else if (s.do === 'starter') out.push(`STARTER${s.uk ? ' UK' : ''}`);
    else if (s.do === 'reunite') out.push('REUNITE');
    else if (s.do === 'battle') {
      out.push(`BATTLE ${s.trainer}`);
      flags.add(beatFlag(s.trainer));
    } else if (s.do === 'flee') flags.add(s.flag);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, out);
    else if (s.do === 'ask') play(s.yes ?? [], flags, out);
  }
  return out;
}

function memory() {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  };
}

const provai = () => mapById(interiorId('london', 'P', 0)).npcs[2];
const ryanair = () => mapById(ARRIVALS_ID).npcs[1];

describe('SKIP TO RANEMON LONDON: a new game', () => {
  it('starts in Stansted arrivals with no Ranemon, on the London story', () => {
    const g = newLondonGame();
    expect(modeOf(g)).toBe('london');
    expect(g.map).toBe(ARRIVALS_ID);
    expect(g.party).toEqual([]);
    expect(g.box).toEqual([]);
    expect(g.away).toBeUndefined();
    expect(g.flags).toEqual(
      expect.arrayContaining([LONDON_ONLY, PROVAI_MET, PROVAI_ASKED, LANDED]),
    );
    expect(g.flags).not.toContain(UK_STARTER);
    expect(g.pub.map).toBe(ARRIVALS_ID);
    // Its starting spot is walkable floor in the arrivals hall.
    expect(mapById(g.map).rows[g.y][g.x]).toBe('F');
  });

  it('leaves Ranemon Dublin’s new game as it was', () => {
    const g = newGame();
    expect(modeOf(g)).toBe('dublin');
    expect(g.map).toBe('clare');
    expect(g.flags).toEqual([]);
  });

  it('opens with who you are and Próvaí’s voice note, then sends you to W.B Yates', () => {
    const said = play(LONDON_INTRO, new Set()).join(' ');
    expect(said).toContain('never had a Ranemon');
    expect(said).toContain('DJ Próvaí');
    expect(said).toContain('W.B Yates');
    // Nothing about B&S, Ghent or a party sent home.
    expect(said).not.toMatch(/B&S|Ghent|beat me/);
  });

  it('gets a starter from Próvaí, with a kit, as a new player', () => {
    const flags = new Set(newLondonGame().flags);
    const said = play(provai().talk!, flags);
    const text = said.join(' ');
    expect(said).toContain('STARTER UK');
    expect(said).toContain('BATTLE rival-uk-1');
    expect(text).toContain('never had a Ranemon');
    expect(text).not.toContain('took the Ranemon off you');
    expect(text).not.toContain('After you beat me on the quays');
    expect(said).toEqual(
      expect.arrayContaining(['GIVE pint 5', 'GIVE chicken-fillet-roll 5', 'GIVE cup-of-tea 2']),
    );
    expect(flags.has(FIXTURES)).toBe(true);
    expect(flags.has('round')).toBe(true);
    expect(flags.has('bike')).toBe(true);
  });

  it('can’t fly to Dublin: Ireland is the other game', () => {
    const flags = new Set(newLondonGame().flags);
    const said = play(ryanair().talk!, flags);
    expect(said.some((s) => s.startsWith('TRAVEL'))).toBe(false);
    expect(said.join(' ')).toContain('STORY MODE');
  });

  it('texts from your mam after each jersey, and has no Irish party to bring back', () => {
    const flags = new Set(newLondonGame().flags);
    const first = trainerById(legendId(FIXTURE_LIST[0].id));
    const after = play(first.reward ?? [], flags).join(' ');
    expect(after).toContain('your mam');
    expect(after).not.toContain('Michael D’s farm');
    const king = trainerById('palace-charles');
    const ending = play(king.reward ?? [], flags);
    expect(ending).not.toContain('REUNITE');
    expect(ending.join(' ')).not.toContain('Irish Ranemon');
    expect(flags.has(AGREEMENT)).toBe(true);
  });

  it('has no level cap, like a Champion of Ireland arriving in London', () => {
    expect(levelCap(newLondonGame()).leader).toBeNull();
    expect(levelCap(newGame()).leader).not.toBeNull();
  });

  it('shows only Free the Lads in MISSIONS, picking up at the Stansted Express', () => {
    const open = openMissions(new Set(newLondonGame().flags));
    expect(open.map((o) => o.mission.id)).toEqual(['kneecap']);
    expect(open[0].step.until).toBe(UK_STARTER);
    expect(openMissions(new Set(newGame().flags)).map((o) => o.mission.id)).toEqual(['champions']);
  });
});

describe('a Dublin save in London is as it was', () => {
  it('gets Próvaí’s old lines, Thatcher from the quays and the Ollie’s parents postcards', () => {
    const flags = new Set([LANDED]);
    const text = play(provai().talk!, flags).join(' ');
    expect(text).toContain('They took the Ranemon off you?');
    expect(text).toContain('After you beat me on the quays');
    expect(text).not.toContain('never had a Ranemon');
    expect(flags.has('round')).toBe(false);
    const after = play(trainerById(legendId(FIXTURE_LIST[0].id)).reward ?? [], flags).join(' ');
    expect(after).toContain('Michael D’s farm');
  });

  it('flies home from Stansted, and gets its Irish party back at the palace', () => {
    expect(play(ryanair().talk!, new Set([LANDED]))).toContain(
      `TRAVEL ${interiorId('airport', 'L', 0)}`,
    );
    expect(play(trainerById('palace-charles').reward ?? [], new Set())).toContain('REUNITE');
  });
});

describe('London-only saves', () => {
  it('are kept apart from the Dublin save under the same name', () => {
    const storage = memory();
    const dublin = recruit(newGame(), 'carlmon', 5).state;
    const london = newLondonGame();
    save(storage, dublin, 'Rich');
    save(storage, london, 'Rich');
    expect(storage.store.has(saveKey('rich'))).toBe(true);
    expect(storage.store.has(saveKey('rich', 'london'))).toBe(true);
    expect(saveKey('rich', 'london').startsWith(`${LONDON_SAVE_KEY}:`)).toBe(true);
    expect(modeOf(load(storage, 'Rich')!)).toBe('dublin');
    expect(load(storage, 'Rich')!.party).toHaveLength(1);
    expect(modeOf(load(storage, 'rich', 'london')!)).toBe('london');
    // Their copies are kept apart too.
    expect(storage.store.has(backupKey('rich'))).toBe(true);
    expect(storage.store.has(backupKey('rich', 'london'))).toBe(true);
  });

  it('never reads a Dublin save as a London one, or the other way round', () => {
    const storage = memory();
    // A save from before trainer names is a Dublin save, and stays one.
    storage.setItem(SAVE_KEY, JSON.stringify(newGame()));
    expect(load(storage, 'rich', 'london')).toBeNull();
    expect(load(storage, 'rich')).not.toBeNull();
    // Even a London save that somehow sits under a Dublin key isn't played as Dublin's.
    const other = memory();
    other.setItem(saveKey('rich'), JSON.stringify(newLondonGame()));
    expect(load(other, 'rich')).toBeNull();
  });

  it('carry their game in a save code', () => {
    const got = importCode(exportCode(newLondonGame()));
    expect('state' in got && modeOf(got.state)).toBe('london');
    const won = { ...newLondonGame(), flags: [...newLondonGame().flags, plFlag('brighton')] };
    expect(describeSave(won)).toContain('1 jerseys');
  });

  it('go online under a name of their own that the save server takes', () => {
    expect(onlineName('Rich')).toBe('Rich');
    expect(onlineName('Rich', 'london')).toBe('ln__rich');
    const long = onlineName('Abcdefghijklmnopqrst', 'london');
    expect(long).toMatch(/^[a-z0-9_-]{1,20}$/);
    expect(long).not.toBe(onlineName('Abcdefghijklmnopqrsz', 'london'));
  });

  it('unlock Britain in battle mode, as a Dublin save that’s been over does', () => {
    const abroad = JSON.stringify({ ...newLondonGame(), ukSeen: ['carlmon'] });
    const storage = (entries: Record<string, string>) => ({
      length: Object.keys(entries).length,
      key: (i: number) => Object.keys(entries)[i] ?? null,
      getItem: (k: string) => entries[k] ?? null,
    });
    expect(britainUnlocked(storage({ [saveKey('rich', 'london')]: abroad }))).toBe(true);
  });
});

it('keeps every person in arrivals where they were', () => {
  expect(npcsOf(mapById(ARRIVALS_ID))).toHaveLength(4);
});
