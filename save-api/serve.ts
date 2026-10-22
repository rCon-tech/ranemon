import { databaseUrl, handle, type BattleCall, type RoomStore, type SaveStore } from './handler.js';
import { neonRooms, neonStore } from './store.js';

let store: SaveStore | null = null;
let rooms: RoomStore | null = null;

const origins = () =>
  (process.env.ALLOWED_ORIGINS ?? 'https://rcon-tech.github.io').split(',').map((o) => o.trim());

/**
 * Runs a request through the save server with the database and allowed sites from Vercel's
 * settings. `battles` is the bundled battle logic, for `api/battle.ts`.
 */
export async function serve(req: Request, battles?: BattleCall): Promise<Response> {
  const url = databaseUrl(process.env);
  try {
    if (!url) throw new Error('no database connected');
    store ??= neonStore(url);
    rooms ??= neonRooms(url);
    return await handle(req, store, {
      origins: origins(),
      ...(battles && { battles: { rooms, call: battles } }),
    });
  } catch (e) {
    console.error(e);
    // Answer with the site's CORS headers, so the game can tell the server is having trouble.
    const origin = req.headers.get('origin') ?? '';
    return new Response(JSON.stringify({ error: 'save server unavailable' }), {
      status: 503,
      headers: {
        'content-type': 'application/json',
        ...(origins().includes(origin) && {
          'access-control-allow-origin': origin,
          vary: 'origin',
        }),
      },
    });
  }
}

/** GET /api/health: whether the database is connected, to open in a browser when setting up. */
export async function health(): Promise<Response> {
  const url = databaseUrl(process.env);
  let database = 'connected';
  try {
    if (!url) throw new Error('no database connected (add Neon under Storage, then redeploy)');
    store ??= neonStore(url);
    await store.get('health-check');
  } catch (e) {
    database = e instanceof Error ? e.message : 'error';
  }
  return new Response(JSON.stringify({ ok: database === 'connected', database }, null, 2), {
    status: database === 'connected' ? 200 : 503,
    headers: { 'content-type': 'application/json' },
  });
}
