import { describe, expect, it } from 'vitest';
import { MAPS } from '@/content/story/maps';
import { TRAINERS } from '@/content/story/trainers';
import { DEX } from '@/lib/battle/evolutions';
import { ITEMS } from '@/lib/story/items';
import { KEY_ITEMS } from '@/lib/story/keys';
import { devSave, isDevName, storyFlags } from '@/lib/story/devsave';
import { NORM } from '@/lib/story/norm';
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
    const owned = [...g.party, ...g.box].map((m) => m.species).sort();
    expect(owned).toEqual(DEX.map((c) => c.id).sort());
    expect(g.party).toHaveLength(6);
    expect(new Set(g.caught)).toEqual(new Set(DEX.map((c) => c.id)));
    expect(new Set(g.seen)).toEqual(new Set(DEX.map((c) => c.id)));
    expect(new Set([...g.party, ...g.box].map((m) => m.uid)).size).toBe(DEX.length);
  });

  it('has every jersey, town, key item and story flag', () => {
    for (const m of MAPS) expect(flags.has(`visited:${m.id}`), m.id).toBe(true);
    for (const k of KEY_ITEMS) expect(flags.has(k.flag), k.name).toBe(true);
    for (const f of storyFlags().filter((f) => f !== NORM)) expect(flags.has(f), f).toBe(true);
    // One jersey per county, Clare to Kildare.
    expect(g.flags.filter((f) => f.startsWith('jersey:') && f !== 'jersey:all')).toHaveLength(9);
    expect(flags.has('jersey:all')).toBe(true);
    expect(flags.has('champion')).toBe(true);
  });

  it('has beaten every trainer but leaves Poseidon and the B&S rematch to fight', () => {
    for (const t of TRAINERS.filter((t) => !['poseidon', 'bns-rematch'].includes(t.id)))
      expect(flags.has(beatFlag(t.id)), t.id).toBe(true);
    expect(flags.has(beatFlag('poseidon'))).toBe(false);
    expect(flags.has(beatFlag('bns-rematch'))).toBe(false);
    expect(flags.has(NORM)).toBe(false);
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
