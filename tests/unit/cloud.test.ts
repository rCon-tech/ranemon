import { describe, expect, it, vi } from 'vitest';
import {
  choose,
  CloudError,
  flushOnline,
  loadOnline,
  readSync,
  saveOnline,
  setCloudSaves,
  settle,
  unsynced,
  type CloudSaves,
} from '@/lib/story/cloud';
import { newGame, type StoryState } from '@/lib/story/state';

const at = (savedAt: number): StoryState => ({ ...newGame(), savedAt });
const raw = (savedAt: number) => JSON.stringify(at(savedAt));

/** A save server in memory that counts writes and turns away a save from behind, as `save-api/` does. */
function server() {
  const rows = new Map<string, { raw: string; rev: number }>();
  let up = true;
  const saves: CloudSaves = {
    pin: true,
    load: async (id, pin, opts) => {
      if (!up) throw new Error('offline');
      if (pin !== '1234' && opts?.device !== 'token-for-' + id) throw new CloudError('pin');
      const row = rows.get(id);
      return {
        raw: row?.raw ?? null,
        rev: row?.rev,
        ...(pin && opts?.newDevice && row && { device: 'token-for-' + id }),
      };
    },
    save: async (id, raw, pin, opts) => {
      if (!up) throw new Error('offline');
      if (pin !== '1234' && opts?.device !== 'token-for-' + id) throw new CloudError('pin');
      const row = rows.get(id);
      if (row && opts?.base !== undefined && opts.base !== row.rev)
        throw new CloudError('conflict', row);
      const rev = (row?.rev ?? 0) + 1;
      rows.set(id, { raw, rev });
      return { rev };
    },
  };
  return { saves, rows, setUp: (on: boolean) => (up = on) };
}

describe('online saves', () => {
  it('file saves under the trainer name and write only the last of a burst', async () => {
    const store = new Map<string, string>();
    const write = vi.fn(async (id: string, raw: string) => void store.set(id, raw));
    setCloudSaves(Promise.resolve({ load: async (id) => store.get(id) ?? null, save: write }));
    expect(await loadOnline('Rich')).toEqual({ raw: null });
    saveOnline(' Rich ', 'one');
    saveOnline('Rich', 'two');
    flushOnline();
    await Promise.resolve();
    expect(write).toHaveBeenCalledTimes(1);
    expect(await loadOnline('RICH')).toEqual({ raw: 'two' });
    setCloudSaves(null);
    expect(await loadOnline('Rich')).toEqual({ raw: null });
  });

  it('only write a PIN-locked name once its PIN has opened it', async () => {
    const write = vi.fn(async () => {});
    const saves: CloudSaves = {
      pin: true,
      load: async (_, pin) => {
        if (pin !== '1234') throw new CloudError('pin');
        return null;
      },
      save: write,
    };
    setCloudSaves(saves);
    expect(await loadOnline('Rich', '9999')).toEqual({ error: 'pin' });
    saveOnline('Rich', 'one');
    flushOnline();
    expect(write).not.toHaveBeenCalled();
    expect(await loadOnline('Rich', '1234')).toEqual({ raw: null });
    saveOnline('Rich', 'two');
    flushOnline();
    expect(write).toHaveBeenCalledWith('rich', 'two', '1234', { base: undefined });
    setCloudSaves(null);
  });

  it('say the server is unreachable instead of throwing', async () => {
    setCloudSaves({ load: () => Promise.reject(new Error('down')), save: async () => {} });
    expect(await loadOnline('Rich')).toEqual({ error: 'offline' });
    setCloudSaves(null);
  });

  it('send a save made offline once the connection is back, without the PIN', async () => {
    const s = server();
    setCloudSaves(s.saves);
    s.rows.set('aoife', { raw: raw(1), rev: 1 });
    // The PIN opens the name once, and the phone is handed a device token.
    expect(await loadOnline('Aoife', '1234')).toEqual({ raw: raw(1), rev: 1 });
    expect(readSync('Aoife').device).toBe('token-for-aoife');
    settle('Aoife', 1);

    // Next time, offline: no PIN this visit, but the token lets the save wait to go up.
    setCloudSaves(null);
    setCloudSaves(s.saves);
    s.setUp(false);
    saveOnline('Aoife', raw(2));
    await flushOnline();
    expect(s.rows.get('aoife')!.rev).toBe(1);
    expect(unsynced('Aoife', at(2))).toBe(true);

    // Back online: the waiting save goes up, following on from rev 1.
    s.setUp(true);
    await flushOnline();
    expect(s.rows.get('aoife')).toEqual({ raw: raw(2), rev: 2 });
    expect(readSync('Aoife')).toMatchObject({ base: 2, synced: 2 });
    expect(unsynced('Aoife', at(2))).toBe(false);
    setCloudSaves(null);
  });

  it('stop writing over a save another device has moved on', async () => {
    const s = server();
    setCloudSaves(s.saves);
    s.rows.set('niamh', { raw: raw(1), rev: 1 });
    await loadOnline('Niamh', '1234');
    settle('Niamh', 1);
    // The laptop saves on from rev 1 in the meantime.
    s.rows.set('niamh', { raw: raw(5), rev: 2 });
    saveOnline('Niamh', raw(3));
    await flushOnline();
    expect(s.rows.get('niamh')!.rev).toBe(2);
    saveOnline('Niamh', raw(4));
    await flushOnline();
    expect(s.rows.get('niamh')!.raw).toBe(raw(5));
    setCloudSaves(null);
  });
});

describe('picking the save to carry on from', () => {
  it('takes whichever follows on from the other, and asks when both have moved on', () => {
    // Nobody has saved online since this browser did: its own, newer or not.
    expect(choose(at(9), at(5), 3, { base: 3, synced: 5 })).toBe('local');
    // Nothing new here since the last save went up: the online one is further on.
    expect(choose(at(5), at(9), 4, { base: 3, synced: 5 })).toBe('online');
    // Both have moved on from rev 3, whatever the clocks say.
    expect(choose(at(9), at(6), 4, { base: 3, synced: 5 })).toBe('ask');
    expect(choose(at(6), at(9), 4, { base: 3, synced: 5 })).toBe('ask');
    // Only one of them.
    expect(choose(null, at(9), 4, {})).toBe('online');
    expect(choose(at(9), null, undefined, {})).toBe('local');
    // A browser that has never synced, or a server without counts: the newer, as before.
    expect(choose(at(9), at(6), 4, {})).toBe('local');
    expect(choose(at(6), at(9), undefined, { base: 3 })).toBe('online');
  });
});
