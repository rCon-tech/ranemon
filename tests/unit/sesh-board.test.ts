import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handle, type SaveRow, type SaveStore } from '../../save-api/handler';
import { memorySesh } from '../../save-api/sesh-memory';
import { botRun } from '../fixtures/sesh-bot';
import { seshCall, SESH_RULES } from '@/lib/online/sesh';
import { dailyRun, dailySeed } from '@/lib/sesh/daily';
import { queued, queueRun, sendQueue } from '@/lib/sesh/online';
import { newRun, scoreOf } from '@/lib/sesh/run';
import { readSync } from '@/lib/story/cloud';

const LIVE = readFileSync('tests/fixtures/saves/live-early.json', 'utf8');
const DAY = '2026-10-28';
const NOON = Date.parse(`${DAY}T12:00:00Z`);

function server() {
  const rows = new Map<string, SaveRow>();
  const fails = new Map<string, { count: number; until: number }>();
  const devices = new Map<string, string>();
  const store: SaveStore = {
    get: async (id) => rows.get(id) ?? null,
    put: async (r) => void rows.set(r.id, r),
    fails: async (id) => fails.get(id) ?? null,
    setFails: async (id, count, until) => void fails.set(id, { count, until }),
    clearFails: async (id) => void fails.delete(id),
    device: async (hash) => devices.get(hash) ?? null,
    addDevice: async (hash, id) => void devices.set(hash, id),
  };
  const runs = memorySesh();
  let clock = NOON;
  const opts = {
    origins: ['https://rcon-tech.github.io'],
    now: () => clock,
    sesh: { runs, call: seshCall },
  };
  const request = (path: string, body: object) =>
    handle(
      new Request(`https://saves.example${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
      store,
      opts,
    );
  const call = async (path: string, body: object) => {
    const res = await request(path, body);
    return { status: res.status, body: await res.json() };
  };
  const sesh = (body: object) => call('/api/sesh', body);
  return { runs, call, sesh, request, setClock: (t: number) => (clock = t) };
}

// Bot runs take a moment to play, so each is played once.
const free = botRun(newRun(7), 7);
const daily = botRun(dailyRun(DAY), 3);
const dailyToo = botRun(dailyRun(DAY), 11);

const submit = (b: typeof free, extra: object = {}) => ({
  op: 'submit',
  v: SESH_RULES,
  name: 'Rich',
  pin: '1234',
  seed: b.run.seed,
  ...(b.run.daily && { daily: b.run.daily }),
  actions: b.actions,
  ...extra,
});

describe('The Sesh’s boards on the save server', () => {
  it('replays a finished run and posts the score it works out itself', async () => {
    const s = server();
    await s.call('/api/save', { id: 'rich', pin: '1234', raw: LIVE });
    const r = await s.sesh(submit(free, { score: 999_999_999 }));
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, score: scoreOf(free.run), best: true });
    expect(s.runs.all[0]).toMatchObject({ id: 'rich', day: 'free', score: scoreOf(free.run) });
    const mine = await s.sesh({ op: 'mine', name: 'Rich' });
    expect(mine.body.free).toHaveLength(1);
  });

  it('turns away a run the game wouldn’t allow, or one that isn’t finished', async () => {
    const s = server();
    await s.call('/api/save', { id: 'rich', pin: '1234', raw: LIVE });
    // A battle won with different choices than were made.
    const i = free.actions.findIndex((a) => a.kind === 'battle');
    const tampered = free.actions.map((a, j) =>
      j === i && a.kind === 'battle' ? { ...a, inputs: a.inputs.slice(0, 1) } : a,
    );
    expect((await s.sesh(submit(free, { actions: tampered }))).status).toBe(400);
    expect((await s.sesh(submit(free, { actions: free.actions.slice(0, 3) }))).body.error).toBe(
      'not finished',
    );
    expect((await s.sesh(submit(free, { seed: free.run.seed + 1 }))).status).toBe(400);
    expect(s.runs.all).toHaveLength(0);
  });

  it('needs the name’s PIN and online save, and the same rules', async () => {
    const s = server();
    expect((await s.sesh(submit(free))).status).toBe(404);
    await s.call('/api/save', { id: 'rich', pin: '1234', raw: LIVE });
    expect((await s.sesh(submit(free, { pin: '0000' }))).status).toBe(401);
    expect((await s.sesh(submit(free, { device: 'x'.repeat(32), pin: undefined }))).status).toBe(
      401,
    );
    expect((await s.sesh(submit(free, { v: SESH_RULES + 1 }))).body.error).toBe('update');
  });

  it('hands out a device token with the PIN, to send runs without it from then on', async () => {
    const s = server();
    await s.call('/api/save', { id: 'rich', pin: '1234', raw: LIVE });
    const first = await s.sesh(submit(free, { newDevice: true }));
    expect(first.body.device).toMatch(/^[A-Za-z0-9_-]{32}$/);
    const again = await s.sesh(submit(daily, { pin: undefined, device: first.body.device }));
    expect(again.status).toBe(200);
  });

  it('ranks the Daily Challenge on its own seed and day, best first, keeping each name’s best', async () => {
    const s = server();
    await s.call('/api/save', { id: 'rich', pin: '1234', raw: LIVE });
    await s.call('/api/save', { id: 'ollie', pin: '4321', raw: LIVE });
    // A free run's seed passed off as the day's.
    expect((await s.sesh(submit(free, { daily: DAY }))).status).toBe(400);
    expect(dailySeed(DAY)).toBe(daily.run.seed);
    const [lo, hi] = [daily, dailyToo].sort((a, b) => scoreOf(a.run) - scoreOf(b.run));
    expect((await s.sesh(submit(hi))).body.best).toBe(true);
    // A worse try later doesn't replace your best.
    expect((await s.sesh(submit(lo))).body.best).toBe(scoreOf(lo.run) > scoreOf(hi.run));
    await s.sesh(submit(lo, { name: 'Ollie', pin: '4321' }));
    const board = await s.sesh({ op: 'board', day: DAY });
    // Rich's best is at least Ollie's, and a tie goes to whoever was first.
    expect(board.body.rows.map((r: { name: string }) => r.name)).toEqual(['Rich', 'Ollie']);
    expect(board.body.rows[0].score).toBe(scoreOf(hi.run));
    const winners = await s.sesh({ op: 'winners', before: '2026-10-29' });
    expect(winners.body.rows).toHaveLength(1);
    expect(winners.body.rows[0]).toMatchObject({ day: DAY, score: scoreOf(hi.run) });
    expect((await s.sesh({ op: 'winners', before: DAY })).body.rows).toHaveLength(0);
  });

  it('counts a Daily Challenge sent up to 48 hours after its day, and no later', async () => {
    const s = server();
    await s.call('/api/save', { id: 'rich', pin: '1234', raw: LIVE });
    s.setClock(Date.parse('2026-10-30T23:00:00Z'));
    expect((await s.sesh(submit(daily))).status).toBe(200);
    s.setClock(Date.parse('2026-10-31T00:00:01Z'));
    expect((await s.sesh(submit(dailyToo))).body.error).toBe('too late');
  });
});

describe('sending runs from the phone', () => {
  let s: ReturnType<typeof server>;
  let online = true;
  beforeEach(() => {
    s = server();
    online = true;
    const kept = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => kept.get(k) ?? null,
      setItem: (k: string, v: string) => void kept.set(k, v),
      removeItem: (k: string) => void kept.delete(k),
    });
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      if (!online) throw new TypeError('Failed to fetch');
      return s.request(new URL(url).pathname, JSON.parse(String(init.body)));
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('waits offline, asks for the PIN once, then goes up with the device token', async () => {
    await s.call('/api/save', { id: 'rich', pin: '1234', raw: LIVE });
    queueRun('Rich', free.run, free.actions);
    // No device token on this phone yet: the PIN is needed.
    expect(await sendQueue('https://saves.example/api', 'Rich')).toEqual({
      sent: 0,
      waiting: 1,
      error: 'pin',
    });
    online = false;
    expect((await sendQueue('https://saves.example/api', 'Rich', '1234')).error).toBe('offline');
    expect(queued('Rich')).toHaveLength(1);
    online = true;
    expect(await sendQueue('https://saves.example/api', 'Rich', '1234')).toEqual({
      sent: 1,
      waiting: 0,
    });
    expect(readSync('Rich').device).toBeTruthy();
    // The next run, finished offline, goes up later without the PIN.
    queueRun('Rich', daily.run, daily.actions);
    expect(await sendQueue('https://saves.example/api', 'Rich')).toEqual({ sent: 1, waiting: 0 });
    expect(s.runs.all).toHaveLength(2);
  });

  it('drops a run the server turns away, and keeps one for a name with no online save', async () => {
    queueRun('Rich', free.run, free.actions);
    expect((await sendQueue('https://saves.example/api', 'Rich', '1234')).error).toBe('nosave');
    expect(queued('Rich')).toHaveLength(1);
    await s.call('/api/save', { id: 'rich', pin: '1234', raw: LIVE });
    queueRun('Rich', { ...free.run, seed: free.run.seed + 1 }, free.actions);
    expect(await sendQueue('https://saves.example/api', 'Rich', '1234')).toEqual({
      sent: 1,
      waiting: 0,
    });
    expect(queued('Rich')).toHaveLength(0);
  });
});
