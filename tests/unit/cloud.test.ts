import { describe, expect, it, vi } from 'vitest';
import { flushOnline, loadOnline, saveOnline, setCloudSaves } from '@/lib/story/cloud';

describe('online saves', () => {
  it('file saves under the trainer name and write only the last of a burst', async () => {
    const store = new Map<string, string>();
    const write = vi.fn(async (id: string, raw: string) => void store.set(id, raw));
    setCloudSaves(Promise.resolve({ load: async (id) => store.get(id) ?? null, save: write }));
    expect(await loadOnline('Rich')).toBeNull();
    saveOnline(' Rich ', 'one');
    saveOnline('Rich', 'two');
    flushOnline();
    await Promise.resolve();
    expect(write).toHaveBeenCalledTimes(1);
    expect(await loadOnline('RICH')).toBe('two');
    setCloudSaves(null);
    expect(await loadOnline('Rich')).toBeNull();
  });
});
