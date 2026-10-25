import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { interiorId } from '@/content/story/interiors';
import { mapById } from '@/content/story/maps';
import {
  BACKUP_EVERY_MS,
  backupKey,
  backups,
  exportCode,
  importCode,
  load,
  migrate,
  parseSave,
  replace,
  save,
  SCHEMA,
} from '@/lib/story/save';
import { newGame, recruit, saveKey } from '@/lib/story/state';
import { doorStep, find, isWalkable, marker, tileAt } from '@/lib/story/world';

const fixture = (name: string) => readFileSync(`tests/fixtures/saves/${name}.json`, 'utf8');
/** A save from the live game early in a run, and one from the build on main late in a run. */
const LIVE = fixture('live-early');
const LATE = fixture('main-late');

function memory(limit = Infinity) {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (v.length > limit) throw new DOMException('full', 'QuotaExceededError');
      store.set(k, v);
    },
  };
}

/** How every build before schemas read a save: anything else is "no save". */
function oldParse(raw: string) {
  const data = JSON.parse(raw);
  if (data.version !== 1 || !Array.isArray(data.party)) return null;
  mapById(data.map);
  return data;
}

describe('saves from the live game', () => {
  it.each([
    ['early', LIVE],
    ['late', LATE],
  ])('load the %s save exactly where the player left off', (_, raw) => {
    const before = JSON.parse(raw);
    const s = parseSave(raw)!;
    expect(s.schema).toBe(SCHEMA);
    expect({ map: s.map, x: s.x, y: s.y, face: s.face }).toEqual({
      map: before.map,
      x: before.x,
      y: before.y,
      face: before.face,
    });
    expect(s.party.map((m) => [m.uid, m.species, m.level, m.exp, m.hp, !!m.shiny])).toEqual(
      before.party.map((m: Record<string, unknown>) => [
        m.uid,
        m.species,
        m.level,
        m.exp,
        m.hp,
        !!m.shiny,
      ]),
    );
    expect(s.box).toHaveLength(before.box.length);
    for (const key of ['bag', 'money', 'flags', 'seen', 'caught', 'pub', 'uid', 'steps', 'starter'])
      expect(s[key as keyof typeof s]).toEqual(before[key]);
    // Moves already chosen stay in their slots.
    s.party.forEach((m, i) =>
      expect(m.moves.slice(0, before.party[i].moves.length)).toEqual(before.party[i].moves),
    );
  });

  it('copies the live save aside before converting it, once', () => {
    const storage = memory();
    storage.setItem(saveKey('Con'), LIVE);
    expect(load(storage, 'con')).not.toBeNull();
    expect(load(storage, 'CON')).not.toBeNull();
    const kept = backups(storage, 'con');
    expect(kept).toHaveLength(1);
    expect(kept[0]).toMatchObject({ why: 'update', raw: LIVE });
    // The save itself is untouched until the game next writes it.
    expect(storage.getItem(saveKey('con'))).toBe(LIVE);
  });

  it('still load in the builds already out there after this one writes them', () => {
    const storage = memory();
    const s = parseSave(LATE)!;
    const raw = save(storage, s, 'Rich')!;
    expect(oldParse(raw)?.party).toHaveLength(s.party.length);
  });

  it('finds the save from before trainer names under the old key', () => {
    const storage = memory();
    storage.setItem('ranemon.story.v1', LIVE);
    expect(load(storage, 'Anyone')?.party[0].species).toBe('conemon');
  });
});

describe('converting older saves', () => {
  it('fills in fields that older saves did not have', () => {
    const { box, bag, steps, uid, ...bare } = JSON.parse(LIVE);
    void [box, bag, steps, uid];
    const s = migrate(bare)!;
    expect(s.box).toEqual([]);
    expect(s.bag).toEqual({});
    expect(s.steps).toBe(0);
    expect(s.uid).toBe(2);
  });

  it('moves you to your last pub if your map no longer exists', () => {
    const s = migrate({ ...JSON.parse(LIVE), map: 'atlantis' })!;
    expect({ map: s.map, x: s.x, y: s.y }).toEqual({ map: 'clare', x: 2, y: 15 });
  });

  it('keeps a Ranemon it can no longer read aside instead of losing the save', () => {
    const data = JSON.parse(LATE);
    data.box[0] = { ...data.box[0], species: 'missingno' };
    const s = migrate(data)!;
    expect(s.box).toHaveLength(data.box.length - 1);
    expect(s.stray).toEqual([data.box[0]]);
    expect(s.party).toHaveLength(data.party.length);
  });

  it('drops a move the game no longer has, with its PP', () => {
    const data = JSON.parse(LIVE);
    data.party[0].moves = ['gym-bro-punch', 'gone-move', 'try-hard'];
    data.party[0].pp = [15, 9, 5];
    const m = migrate(data)!.party[0];
    expect(m.moves.slice(0, 2)).toEqual(['gym-bro-punch', 'try-hard']);
    expect(m.pp.slice(0, 2)).toEqual([15, 5]);
    expect(m.pp).toHaveLength(m.moves.length);
  });

  it('moves anyone out on the old, smaller Dublin to the same door on the new one', () => {
    const dublin = mapById('dublin');
    const inFront = (kind: string, i: number) => {
      const door = find(dublin, kind)[i];
      const { x, y } = doorStep(dublin, door.x, door.y);
      return { map: 'dublin', x, y };
    };
    const at = (x: number, y: number, schema = 2) =>
      migrate({ ...JSON.parse(LATE), schema, map: 'dublin', x, y, pub: { map: 'dublin', x, y } })!;
    // Just below the McGrattans door, the house by the river and Connolly Station.
    for (const [x, y, kind, i] of [
      [4, 11, 'P', 0],
      [17, 13, 'H', 4],
      [5, 14, 'L', 2],
      [15, 3, 'L', 0],
    ] as const) {
      const s = at(x, y);
      expect({ map: s.map, x: s.x, y: s.y }, `${x},${y}`).toEqual(inFront(kind, i));
      expect(s.pub).toEqual(inFront(kind, i));
      expect(isWalkable(tileAt(dublin, s.x, s.y))).toBe(true);
    }
    // At the way in from Kildare, and on the road to Trinity.
    expect(at(1, 4)).toMatchObject({ ...marker(dublin, '@') });
    expect(at(21, 10)).toMatchObject({ ...marker(dublin, '>') });
    // A save from this build is already on the new map, and stays where it is.
    expect(at(30, 20, SCHEMA)).toMatchObject({ x: 30, y: 20 });
    // And anywhere else is left alone.
    expect(migrate({ ...JSON.parse(LATE), schema: 2 })).toMatchObject({ map: 'kilkenny' });
  });

  it('keeps a save inside a room whose door moved along when new doors came before it', () => {
    const at = (map: string) =>
      migrate({ ...JSON.parse(LATE), schema: 4, map, x: 4, y: 6, pub: { map, x: 4, y: 6 } })!;
    // The house by the river, where the rent goes missing, and Fore Abbey.
    expect(at('dublin-H1')).toMatchObject({ map: 'dublin-H4', x: 4, y: 6 });
    expect(at('dublin-H1').pub).toMatchObject({ map: 'dublin-H4' });
    expect(at('dublin-H1').map).toBe(interiorId('dublin', 'H', 4));
    expect(mapById(at('dublin-H1').map).npcs[0].look).toBe('ollie');
    expect(mapById(at('westmeath-L2').map).name).toMatch(/^Fore Abbey/);
    // Rooms before the new doors stay where they are.
    expect(at('dublin-L2')).toMatchObject({ map: 'dublin-L2' });
  });

  it('reads a save from a newer build without throwing away what it does not know', () => {
    const s = migrate({ ...JSON.parse(LATE), schema: SCHEMA + 1, future: { x: 1 } })!;
    expect((s as unknown as { future: unknown }).future).toEqual({ x: 1 });
  });

  it('keeps a newer build’s schema when an older build writes the save back', () => {
    const newer = migrate({ ...JSON.parse(LATE), schema: SCHEMA + 1 })!;
    const storage = memory();
    expect(JSON.parse(save(storage, newer, 'rich')!).schema).toBe(SCHEMA + 1);
    expect(JSON.parse(save(storage, newGame(), 'rich')!).schema).toBe(SCHEMA);
  });

  it('turns away what is not a save', () => {
    expect(parseSave('{nope')).toBeNull();
    expect(parseSave('{"version":2,"party":[]}')).toBeNull();
    expect(parseSave('[]')).toBeNull();
    expect(parseSave(null)).toBeNull();
  });
});

describe('copies in this browser', () => {
  it('keeps a copy every ten minutes of play, up to five', () => {
    vi.useFakeTimers();
    const storage = memory();
    let s = recruit(newGame(), 'enda', 5).state;
    for (let i = 0; i < 8; i++) {
      s = { ...s, steps: i };
      save(storage, s, 'Rich');
      vi.advanceTimersByTime(BACKUP_EVERY_MS / 2);
      save(storage, { ...s, steps: i + 0.5 }, 'Rich');
      vi.advanceTimersByTime(BACKUP_EVERY_MS / 2);
    }
    const kept = backups(storage, 'Rich');
    expect(kept).toHaveLength(5);
    expect(kept.map((b) => JSON.parse(b.raw).steps)).toEqual([7, 6, 5, 4, 3]);
    vi.useRealTimers();
  });

  it('falls back to the newest copy that can be read if the save is broken', () => {
    const storage = memory();
    const s = recruit(newGame(), 'enda', 5).state;
    save(storage, s, 'Rich');
    storage.setItem(saveKey('Rich'), '{"version":1,"par');
    expect(load(storage, 'Rich')?.party[0].species).toBe('enda');
  });

  it('keeps the save it replaces when restoring or importing', () => {
    const storage = memory();
    const a = recruit(newGame(), 'enda', 5).state;
    const b = recruit(newGame(), 'carlmon', 9).state;
    save(storage, a, 'Rich');
    replace(storage, b, 'Rich', 'import');
    expect(load(storage, 'Rich')?.party[0].species).toBe('carlmon');
    const kept = backups(storage, 'Rich').find((k) => k.why === 'import')!;
    expect(parseSave(kept.raw)?.party[0].species).toBe('enda');
  });

  it('writes the save even when the browser is too full for its copies', () => {
    const storage = memory(LATE.length + 200);
    expect(save(storage, parseSave(LATE)!, 'Rich')).toBeTruthy();
    expect(load(storage, 'Rich')).not.toBeNull();
    expect(storage.getItem(backupKey('Rich'))).toBeNull();
  });
});

describe('save codes', () => {
  it('carry a whole save to another device', () => {
    const s = { ...parseSave(LATE)!, starter: 'enda' };
    const code = exportCode(s);
    expect(code).toMatch(/^RANEMON1\./);
    // Chat apps wrap long text; the code still reads.
    const wrapped = code.replace(/(.{40})/g, '$1\n');
    const back = importCode(wrapped);
    expect('state' in back && back.state).toEqual({ ...s, schema: SCHEMA });
  });

  it('say why a code cannot be read', () => {
    const code = exportCode(parseSave(LIVE)!);
    expect(importCode(code.slice(0, -10))).toHaveProperty('error');
    expect(importCode('hello')).toHaveProperty('error');
  });

  it('read a save file of plain JSON too', () => {
    const back = importCode(LIVE);
    expect('state' in back && back.state.party[0].species).toBe('conemon');
  });
});
