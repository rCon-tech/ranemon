import { handle, type SaveStore } from './handler';
import { neonStore } from './store';

let store: SaveStore | null = null;

/** Runs a request through the save server with the database and allowed sites from Vercel's settings. */
export function serve(req: Request): Promise<Response> {
  store ??= neonStore(process.env.DATABASE_URL ?? '');
  const origins = (process.env.ALLOWED_ORIGINS ?? 'https://rcon-tech.github.io')
    .split(',')
    .map((o) => o.trim());
  return handle(req, store, { origins });
}
