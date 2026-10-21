import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { handle, LOCK_MS, MAX_FAILS, type SaveRow, type SaveStore } from '../../worker/save-server';

const LIVE = readFileSync('tests/fixtures/saves/live-early.json', 'utf8');
const at = (raw: string, savedAt: number) => JSON.stringify({ ...JSON.parse(raw), savedAt });

function server() {
  const rows = new Map<string, SaveRow>();
  const fails = new Map<string, { count: number; until: number }>();
  const store: SaveStore = {
    get: async (id) => rows.get(id) ?? null,
    put: async (r) => void rows.set(r.id, r),
    fails: async (id) => fails.get(id) ?? null,
    setFails: async (id, count, until) => void fails.set(id, { count, until }),
    clearFails: async (id) => void fails.delete(id),
  };
  let clock = 1_000_000;
  const opts = { origins: ['https://rcon-tech.github.io'], now: () => clock };
  const call = async (path: string, body: object, origin = 'https://rcon-tech.github.io') => {
    const res = await handle(
      new Request(`https://saves.example${path}`, {
        method: 'POST',
        headers: { origin, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
      store,
      opts,
    );
    return { status: res.status, body: await res.json(), headers: res.headers };
  };
  return { rows, call, tick: (ms: number) => (clock += ms) };
}

describe('the save server', () => {
  it('sets a name’s PIN with its first save and keeps only a hash of it', async () => {
    const s = server();
    expect((await s.call('/load', { id: 'rich', pin: '1234' })).body).toEqual({ raw: null });
    expect((await s.call('/save', { id: 'rich', pin: '1234', raw: LIVE })).status).toBe(200);
    expect((await s.call('/load', { id: 'rich', pin: '1234' })).body).toEqual({ raw: LIVE });
    const row = s.rows.get('rich')!;
    expect(JSON.stringify(row)).not.toContain('"1234"');
    expect(row.hash).toHaveLength(44);
  });

  it('turns away the wrong PIN, and locks the name after five', async () => {
    const s = server();
    await s.call('/save', { id: 'rich', pin: '1234', raw: LIVE });
    for (let i = 0; i < MAX_FAILS; i++)
      expect((await s.call('/load', { id: 'rich', pin: '0000' })).status).toBe(401);
    // Locked: even the right PIN waits.
    expect((await s.call('/load', { id: 'rich', pin: '1234' })).status).toBe(429);
    expect((await s.call('/save', { id: 'rich', pin: '0000', raw: LIVE })).status).toBe(429);
    s.tick(LOCK_MS + 1);
    expect((await s.call('/load', { id: 'rich', pin: '1234' })).status).toBe(200);
    expect(s.rows.get('rich')!.raw).toBe(LIVE);
  });

  it('keeps a newer save from another device over an older one', async () => {
    const s = server();
    await s.call('/save', { id: 'rich', pin: '1234', raw: at(LIVE, 200) });
    expect((await s.call('/save', { id: 'rich', pin: '1234', raw: at(LIVE, 100) })).status).toBe(
      409,
    );
    expect(JSON.parse(s.rows.get('rich')!.raw).savedAt).toBe(200);
  });

  it('keeps the save from up to an hour before', async () => {
    const s = server();
    await s.call('/save', { id: 'rich', pin: '1234', raw: at(LIVE, 1) });
    await s.call('/save', { id: 'rich', pin: '1234', raw: at(LIVE, 2) });
    s.tick(10_000);
    await s.call('/save', { id: 'rich', pin: '1234', raw: at(LIVE, 3) });
    const row = s.rows.get('rich')!;
    expect(JSON.parse(row.prev_raw!).savedAt).toBe(1);
    expect(JSON.parse(row.raw).savedAt).toBe(3);
  });

  it('only takes Ranemon saves, good names and PINs', async () => {
    const s = server();
    expect((await s.call('/save', { id: 'rich', pin: '1234', raw: '{"x":1}' })).status).toBe(400);
    expect((await s.call('/save', { id: 'Rich!', pin: '1234', raw: LIVE })).status).toBe(400);
    expect((await s.call('/save', { id: 'rich', pin: '12', raw: LIVE })).status).toBe(400);
    expect(s.rows.size).toBe(0);
  });

  it('answers only the game’s own site', async () => {
    const s = server();
    const ok = await s.call('/load', { id: 'rich', pin: '1234' });
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://rcon-tech.github.io');
    const other = await s.call('/load', { id: 'rich', pin: '1234' }, 'https://evil.example');
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
  });
});
