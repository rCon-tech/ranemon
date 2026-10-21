import { describe, expect, it, vi } from 'vitest';
import {
  CloudError,
  flushOnline,
  loadOnline,
  saveOnline,
  setCloudSaves,
  type CloudSaves,
} from '@/lib/story/cloud';

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
    expect(write).toHaveBeenCalledWith('rich', 'two', '1234');
    setCloudSaves(null);
  });

  it('say the server is unreachable instead of throwing', async () => {
    setCloudSaves({ load: () => Promise.reject(new Error('down')), save: async () => {} });
    expect(await loadOnline('Rich')).toEqual({ error: 'offline' });
    setCloudSaves(null);
  });
});
