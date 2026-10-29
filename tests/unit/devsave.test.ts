import { KANE_TRAINER } from '@/content/story/kane';
import { describe, expect, it } from 'vitest';
import { CHAMPION_OF_IRELAND, COLLINS, COLLINS_HEARD, ELITE } from '@/content/story/galway';
import { ARCADE_KING } from '@/content/story/brighton';
import { BRIGHTON_DONE } from '@/content/story/enda';
import { TECHNO_DONE } from '@/content/story/cramps';
import { TECHNO_DJ } from '@/content/story/techno';
import { PEAR_TRAINERS } from '@/content/story/greystones';
import { MAPS } from '@/content/story/maps';
import { PALACE_TRAINERS } from '@/content/story/palace';
import { PREMIER_TRAINERS } from '@/content/story/premier';
import { SIDEMEN_TRAINERS, WEMBLEY_TRAINERS } from '@/content/story/sidemen';
import { TRAINERS } from '@/content/story/trainers';
import { DEX } from '@/lib/battle/evolutions';
import { LONDON } from '@/lib/battle/london';
import { variantsOf } from '@/lib/battle/variants';
import { ITEMS } from '@/lib/story/items';
import { KEY_ITEMS } from '@/lib/story/keys';
import {
  devSave,
  isDevName,
  LONDON_TO_PLAY,
  recruits,
  SIDEMEN_TO_PLAY,
  storyFlags,
} from '@/lib/story/devsave';
import { ELVIS, NORM } from '@/lib/story/norm';
import { exportCode, importCode, parseSave } from '@/lib/story/save';
import { beatFlag } from '@/lib/story/state';

describe('the developer save', () => {
  const g = devSave();
  const flags = new Set(g.flags);

  it('opens only for the name whose hash it keeps, in any case or spacing', async () => {
    // The hash of "example-name" stands in for the real name's.
    const real = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('example-name'));
    const hex = [...new Uint8Array(real)].map((b) => b.toString(16).padStart(2, '0')).join('');
    expect(await isDevName('Example Name', hex)).toBe(true);
    expect(await isDevName('  EXAMPLE   name ', hex)).toBe(true);
    expect(await isDevName('Example', hex)).toBe(false);
    expect(await isDevName('', hex)).toBe(false);
    expect(await isDevName('Example Name', '0'.repeat(64))).toBe(false);
    expect(await isDevName('Rich')).toBe(false);
  });

  it('has every Ranemon and evolution, caught and in the party or Group Chat', () => {
    const all = [...g.party, ...g.box];
    const usual = all.filter((m) => !m.variant).map((m) => m.species);
    const dex = [...DEX, ...LONDON].map((c) => c.id);
    expect(usual.sort()).toEqual([...new Set([...dex, ...recruits()])].sort());
    // Petchemon is never caught, only given by B&S, so he comes in as theirs.
    expect(recruits()).toContain('petchemon');
    expect(usual).toContain('petchemon');
    expect(g.party).toHaveLength(6);
    expect(new Set(g.caught)).toEqual(new Set(dex));
    expect(new Set(g.seen)).toEqual(new Set(dex));
    expect(new Set(all.map((m) => m.uid)).size).toBe(all.length);
  });

  it('has every other look too, beside the usual one', () => {
    const looks = [...g.party, ...g.box]
      .filter((m) => m.variant)
      .map((m) => `${m.species}:${m.variant}`);
    const expected = DEX.flatMap((c) => variantsOf(c.id).map((v) => `${c.id}:${v.id}`));
    expect(looks.sort()).toEqual(expected.sort());
    expect(looks).toContain('olliemon:tricolour');
    expect(looks).toContain('hitmonollie:tricolour');
  });

  it('has every jersey, town, key item and story flag', () => {
    for (const m of MAPS) expect(flags.has(`visited:${m.id}`), m.id).toBe(true);
    for (const k of KEY_ITEMS) expect(flags.has(k.flag), k.name).toBe(true);
    // The London expansion is all still to play, from Próvaí at Connolly on.
    const london = LONDON_TO_PLAY;
    for (const f of storyFlags().filter(
      (f) =>
        ![
          NORM,
          ELVIS,
          BRIGHTON_DONE,
          TECHNO_DONE,
          ...london,
          ...SIDEMEN_TO_PLAY,
          COLLINS_HEARD,
          CHAMPION_OF_IRELAND,
        ].includes(f) && !f.startsWith('galway:won:'),
    ))
      expect(flags.has(f), f).toBe(true);
    // One jersey per county, Clare to Kildare.
    expect(g.flags.filter((f) => f.startsWith('jersey:') && f !== 'jersey:all')).toHaveLength(9);
    expect(flags.has('jersey:all')).toBe(true);
    expect(flags.has('champion')).toBe(true);
    // Paul Mescal runs off after his battle, so he's gone too.
    expect(flags.has('mescal:gone')).toBe(true);
  });

  it('has beaten every trainer but leaves Poseidon, the B&S rematch, the twins, the Arcade King, DJ Vandenbass, Galway, the Premier League and Harry Kane to fight', () => {
    const bosses = [
      'poseidon',
      'bns-rematch',
      ...PEAR_TRAINERS,
      ARCADE_KING,
      TECHNO_DJ,
      ...ELITE,
      COLLINS,
      ...PREMIER_TRAINERS.map((t) => t.id),
      ...PALACE_TRAINERS.map((t) => t.id),
      ...[...SIDEMEN_TRAINERS, ...WEMBLEY_TRAINERS].map((t) => t.id),
      KANE_TRAINER,
    ];
    for (const t of TRAINERS.filter((t) => !bosses.includes(t.id)))
      expect(flags.has(beatFlag(t.id)), t.id).toBe(true);
    for (const id of bosses) expect(flags.has(beatFlag(id)), id).toBe(false);
    expect(flags.has(NORM)).toBe(false);
    // The end of the Brighton trip comes with beating the King, so that's left to play too.
    expect(flags.has(BRIGHTON_DONE)).toBe(false);
    // Likewise the start of I Love Techno, but the guards are beaten and Cramps has asked you.
    expect(flags.has(TECHNO_DONE)).toBe(false);
    expect(flags.has('techno:asked')).toBe(true);
    expect(flags.has('beat:techno-dirk')).toBe(true);
  });

  it('has a bag full of everything and money to burn', () => {
    for (const i of ITEMS) expect(g.bag[i.id], i.id).toBe(99);
    expect(g.money).toBeGreaterThan(100_000);
  });

  it('is a valid save that round-trips through saves and save codes', () => {
    const back = parseSave(JSON.stringify(g));
    expect(back?.party.map((m) => m.species)).toEqual(g.party.map((m) => m.species));
    expect(back?.box).toHaveLength(g.box.length);
    expect(back?.flags.sort()).toEqual([...g.flags].sort());
    const code = importCode(exportCode(g));
    expect('state' in code && code.state.box).toHaveLength(g.box.length);
  });
});
