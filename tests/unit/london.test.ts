import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TECHNO_DONE } from '@/content/story/cramps';
import { interiorId } from '@/content/story/interiors';
import {
  FIXTURES,
  LANDED,
  PROVAI_ARRIVE,
  PROVAI_ASKED,
  PROVAI_AT_STATION,
  PROVAI_MET,
} from '@/content/story/kneecap';
import {
  ARRIVALS_ID,
  FLIGHT,
  LONDON,
  NEESON_LINES,
  TERMINAL_ID,
  UK_TRAINERS,
} from '@/content/story/london';
import { MAPS, mapById } from '@/content/story/maps';
import { STATION_ARRIVE, STATION_ID, departureTo, ticket } from '@/content/story/station';
import { teamOf, trainerById } from '@/content/story/trainers';
import { ROSTER } from '@/lib/battle/roster';
import { hasUkForm, UK, UK_ENTRIES } from '@/lib/battle/uk';
import { rollVariant, variantForm, variantOf, variantsOf } from '@/lib/battle/variants';
import { gainExp, makeMember, speciesById } from '@/lib/story/party';
import { parseSave, replace } from '@/lib/story/save';
import { crossBorder, newGame, recruit } from '@/lib/story/state';
import { npcsOf, type Step } from '@/lib/story/world';

/** Plays a script against `flags`, answering every question yes (or no), noting what happens. */
function play(steps: Step[], flags: Set<string>, answer = true, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'give') out.push(`GIVE ${s.item} ${s.count ?? 1}`);
    else if (s.do === 'travel') out.push(`TRAVEL ${s.map} ${s.x},${s.y}`);
    else if (s.do === 'border') out.push(`BORDER ${s.pub.map}`);
    else if (s.do === 'starter') out.push(`STARTER${s.uk ? ' UK' : ''}`);
    else if (s.do === 'battle') out.push(`BATTLE ${s.trainer}`);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, answer, out);
    else if (s.do === 'ask') play((answer ? s.yes : s.no) ?? [], flags, answer, out);
  }
  return out;
}

describe('DJ Próvaí, back from Ghent', () => {
  it('only turns up once you’re back from I Love Techno, and only the once', () => {
    expect(play(PROVAI_ARRIVE, new Set())).toEqual([]);
    const flags = new Set([TECHNO_DONE]);
    const said = play(PROVAI_ARRIVE, flags);
    expect(said.join(' ')).toContain('trouble in London');
    expect(flags.has(PROVAI_MET)).toBe(true);
    expect(flags.has(PROVAI_ASKED)).toBe(true);
    expect(play(PROVAI_ARRIVE, flags)).toEqual([]);
  });

  it('meets you at Connolly, or in Dublin, whichever comes first', () => {
    expect(STATION_ARRIVE).toEqual(expect.arrayContaining(PROVAI_ARRIVE));
    expect(mapById('dublin').arrive).toEqual(expect.arrayContaining(PROVAI_ARRIVE));
  });

  it('waits on the concourse after a no, and is gone once you’ve said yes', () => {
    const station = mapById(STATION_ID);
    expect(station.npcs).toContain(PROVAI_AT_STATION);
    expect(PROVAI_AT_STATION.showIf).toBe(PROVAI_MET);
    expect(PROVAI_AT_STATION.hideIf).toBe(PROVAI_ASKED);
    const flags = new Set<string>();
    play(PROVAI_AT_STATION.talk!, flags, false);
    expect(flags.has(PROVAI_ASKED)).toBe(false);
  });

  it('is drawn in a tricolour balaclava', async () => {
    const { STYLES } = await import('@/components/story/people');
    expect(STYLES.provai.balaclava).toHaveLength(3);
    expect(STYLES.provai.knots).toBeTruthy();
  });
});

describe('the airport bus and the flight', () => {
  it('only runs once you’ve told Próvaí yes', () => {
    const bus = departureTo('airport');
    expect(play(ticket(bus), new Set()).join(' ')).not.toContain('TRAVEL');
    expect(play(ticket(bus), new Set([PROVAI_ASKED]))).toContain('TRAVEL airport 3,6');
  });

  it('lands at Stansted, and the border sends your Ranemon home the first time', () => {
    const flags = new Set<string>();
    const first = play(FLIGHT, flags);
    expect(first).toContain(`TRAVEL ${ARRIVALS_ID} 2,4`);
    expect(first).toContain(`BORDER ${ARRIVALS_ID}`);
    expect(first.join(' ')).toContain('Good Friday Agreement');
    expect(first.join(' ')).toContain('Ollie');
    expect(flags.has(LANDED)).toBe(true);
    const again = play(FLIGHT, flags);
    expect(again).toContain(`BORDER ${ARRIVALS_ID}`);
    expect(again.join(' ')).not.toContain('Good Friday Agreement');
  });

  it('flies you home from Stansted, swapping your Ranemon back', () => {
    const arrivals = mapById(ARRIVALS_ID);
    const ryanair = arrivals.npcs.find((n) => n.look === 'crew')!;
    const home = play(ryanair.talk!, new Set());
    expect(home).toContain('BORDER airport');
    expect(home).toContain(`TRAVEL ${TERMINAL_ID} 6,10`);
  });
});

describe('the border', () => {
  it('leaves your Ranemon on one side and gives you back the ones on the other', () => {
    const irish = {
      ...newGame(),
      party: [makeMember('carlmon', 20, 1)],
      box: [makeMember('jammon', 20, 2)],
    };
    const over = crossBorder(irish, { map: ARRIVALS_ID, x: 2, y: 4 });
    expect(over.party).toEqual([]);
    expect(over.box).toEqual([]);
    expect(over.pub.map).toBe(ARRIVALS_ID);
    const uk = { ...over, party: [makeMember('simomon', 38, 3, UK)] };
    const home = crossBorder(uk, { map: 'airport', x: 3, y: 6 });
    expect(home.party.map((m) => m.species)).toEqual(['carlmon']);
    expect(home.box.map((m) => m.species)).toEqual(['jammon']);
    expect(home.away?.party.map((m) => m.species)).toEqual(['simomon']);
  });

  it('keeps whoever is waiting on the other side in the save', () => {
    const irish = { ...newGame(), party: [makeMember('carlmon', 20, 1)] };
    const over = crossBorder(irish, { map: ARRIVALS_ID, x: 2, y: 4 });
    const back = parseSave(JSON.stringify(over))!;
    expect(back.away?.party.map((m) => m.species)).toEqual(['carlmon']);
    expect(back.uid).toBeGreaterThan(1);
    expect(replace).toBeTruthy();
  });
});

describe('UK Ranemon', () => {
  it('has a drawn UK form and a UK Ranedex line for every one of the lads', () => {
    for (const r of ROSTER) {
      expect(hasUkForm(r.id), r.id).toBe(true);
      expect(UK_ENTRIES[r.id], r.id).toBeTruthy();
      const uk = variantForm(r, UK);
      expect(uk.sprite, r.id).toBe(`/sprites/drawn/${r.id}.png`);
      for (const file of [uk.sprite!, uk.sprite!.replace('/sprites/', '/sprites/shiny/')])
        expect(existsSync(`public${file}`), file).toBe(true);
      expect(existsSync(`public/sprites/drawn/mini/${r.id}.png`), r.id).toBe(true);
      expect(existsSync(`public/sprites/shiny/drawn/mini/${r.id}.png`), r.id).toBe(true);
    }
    expect(Object.keys(UK_ENTRIES)).toHaveLength(ROSTER.length);
  });

  it('is the same Ranemon underneath: name, types and stats', () => {
    const c = speciesById('carlmon');
    const uk = variantForm(c, UK);
    expect(uk.name).toBe(c.name);
    expect(uk.types).toEqual(c.types);
    expect(uk.base).toEqual(c.base);
  });

  it('never turns up at home, in battle mode’s looks or in the wild in Ireland', () => {
    for (const r of ROSTER) {
      expect(variantsOf(r.id).map((v) => v.id)).not.toContain(UK);
      for (const roll of [0, 0.5, 0.99]) expect(rollVariant(r.id, roll)).not.toBe(UK);
    }
  });

  it('stays the way it’s drawn: a UK Ranemon doesn’t evolve', () => {
    const m = makeMember('carlmon', 50, 1, UK);
    expect(m.species).toBe('carlmon');
    expect(m.variant).toBe(UK);
    expect(makeMember('carlmon', 50, 1).species).toBe('carlizard');
    const caught = recruit(newGame(), 'simomon', 40, { variant: UK }).state.party[0];
    expect(caught.species).toBe('simomon');
    const grown = gainExp(caught, 10_000_000).member;
    expect(grown.species).toBe('simomon');
    expect(grown.level).toBeGreaterThan(40);
  });

  it('has no drawn form for an evolution or a legend yet: they keep their photos', () => {
    expect(variantOf('carlizard', UK)).toBeUndefined();
    expect(variantOf('tobymon', UK)).toBeUndefined();
  });
});

describe('Britain', () => {
  const uk = MAPS.filter((m) => m.uk);

  it('is 2D only, every map of it', () => {
    expect(uk.map((m) => m.id)).toEqual(['stansted', 'london']);
    for (const m of [...uk, mapById('airport')]) expect(m.flat, m.id).toBe(true);
  });

  it('has W.B Yates for a pub, with Liam Neeson on the bar, and a Tesco Express', () => {
    const pub = mapById(interiorId('london', 'P', 0));
    expect(pub.name).toBe('W.B Yates, London');
    const [neeson, owner, provai] = pub.npcs;
    expect(neeson.look).toBe('neeson');
    expect(neeson.talk).toEqual([{ do: 'pub' }]);
    expect(owner.look).toBe('donal');
    expect(provai.look).toBe('provai');
    expect(npcsOf(pub)).toHaveLength(3);
    expect(NEESON_LINES.length).toBeGreaterThan(3);
    expect(mapById(interiorId('london', 'M', 0)).name).toBe('Tesco Express, London');
  });

  it('gives you a UK Ranemon in W.B Yates, then Thatcher, then the story of the lads', () => {
    const provai = mapById(interiorId('london', 'P', 0)).npcs[2];
    const flags = new Set<string>();
    const said = play(provai.talk!, flags);
    const order = ['STARTER UK', 'BATTLE rival-uk-1'].map((s) => said.indexOf(s));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect(order[0]).toBeLessThan(order[1]);
    expect(said.join(' ')).toContain('Premier League Champion');
    expect(said.join(' ')).toContain('Irish Crown Jewels');
    expect(said).toContain('GIVE pint 5');
    expect(flags.has(FIXTURES)).toBe(true);
  });

  it('fights with UK Ranemon, and Thatcher picks one that beats yours', () => {
    for (const t of UK_TRAINERS.filter((t) => !t.id.startsWith('airport')))
      expect(t.uk, t.id).toBe(true);
    const thatcher = trainerById('rival-uk-1');
    expect(thatcher.friendly).toBe(true);
    expect(teamOf(thatcher, 'simomon')[0][0]).not.toBe('simomon');
  });

  it('keeps the palace and King’s Cross shut for now', () => {
    expect(LONDON.landmarkLocks?.[0]).toBeTruthy();
    expect(LONDON.landmarkLocks?.[2]).toBeTruthy();
  });
});
