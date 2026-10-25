import { CloudError, type CloudSaves, type Online } from './cloud';

/**
 * Online saves on the save server in `save-api/`, at `base` (NEXT_PUBLIC_SAVE_API). The server
 * keeps each name's save with a hash of its PIN; the PIN itself is only ever sent to it, and
 * after that a device token can stand in for it.
 */

/** A weak signal counts as none after this long, so the title screen doesn't hang. */
const TIMEOUT_MS = 8000;

export function remoteSaves(base: string): CloudSaves {
  const url = base.replace(/\/+$/, '');
  async function call(path: string, body: object) {
    const res = await fetch(`${url}/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout?.(TIMEOUT_MS),
    });
    if (res.status === 401) throw new CloudError('pin');
    if (res.status === 429) throw new CloudError('locked');
    if (res.status === 409) {
      // Another device has saved since (or the server has a newer save, or one from a newer
      // version of the game): it keeps its own, and the title screen sorts it out.
      const data = await res.json().catch(() => ({}));
      throw new CloudError(
        'conflict',
        typeof data.raw === 'string' && typeof data.rev === 'number'
          ? { raw: data.raw, rev: data.rev }
          : undefined,
      );
    }
    if (!res.ok) throw new Error(`save server: ${res.status}`);
    return res.json() as Promise<Online & { rev?: number }>;
  }
  // The PIN when there is one, otherwise the device token.
  const auth = (pin?: string, device?: string) => (pin ? { pin } : { device });
  return {
    pin: true,
    load: async (id, pin, opts) => {
      const got = await call('load', {
        id,
        ...auth(pin, opts?.device),
        ...(opts?.newDevice && { newDevice: true }),
      });
      return { raw: got.raw ?? null, rev: got.rev, device: got.device };
    },
    save: async (id, raw, pin, opts) => {
      const got = await call('save', {
        id,
        ...auth(pin, opts?.device),
        raw,
        ...(opts?.base !== undefined && { base: opts.base }),
      });
      return { rev: got.rev };
    },
  };
}
