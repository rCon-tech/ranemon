import { CloudError, type CloudSaves } from './cloud';

/**
 * Online saves on the save server in `save-api/`, at `base` (NEXT_PUBLIC_SAVE_API). The server
 * keeps each name's save with a hash of its PIN; the PIN itself is only ever sent to it.
 */
export function remoteSaves(base: string): CloudSaves {
  const url = base.replace(/\/+$/, '');
  async function call(path: string, body: object) {
    const res = await fetch(`${url}/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 401) throw new CloudError('pin');
    if (res.status === 429) throw new CloudError('locked');
    // 409: the server has a newer save from another device, and keeps it.
    if (!res.ok && res.status !== 409) throw new Error(`save server: ${res.status}`);
    return res.json() as Promise<{ raw?: string | null }>;
  }
  return {
    pin: true,
    load: async (id, pin) => (await call('load', { id, pin })).raw ?? null,
    save: async (id, raw, pin) => void (await call('save', { id, pin, raw })),
  };
}
