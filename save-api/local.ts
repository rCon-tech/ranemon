import { createServer } from 'node:http';
import { battleCall } from '../src/lib/online/server';
import { handle, type RoomStore, type SaveRow, type SaveStore } from './handler';

/**
 * The save server on this machine, keeping everything in memory, for trying online saves and
 * friend battles while developing: `npm run local` here, then run the game with
 * `NEXT_PUBLIC_SAVE_API=http://localhost:8787/api pnpm dev`.
 */

const PORT = Number(process.env.PORT ?? 8787);
const origins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(',');

const rows = new Map<string, SaveRow>();
const fails = new Map<string, { count: number; until: number }>();
const saves: SaveStore = {
  get: async (id) => rows.get(id) ?? null,
  put: async (r) => void rows.set(r.id, r),
  fails: async (id) => fails.get(id) ?? null,
  setFails: async (id, count, until) => void fails.set(id, { count, until }),
  clearFails: async (id) => void fails.delete(id),
};
const battles = new Map<string, { doc: string; version: number }>();
const rooms: RoomStore = {
  get: async (code) => battles.get(code) ?? null,
  put: async (code, doc, version) => {
    if ((battles.get(code)?.version ?? 0) !== version) return false;
    battles.set(code, { doc, version: version + 1 });
    return true;
  },
};

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const body = req.method === 'POST' ? Buffer.concat(chunks) : undefined;
  const reply = await handle(
    new Request(`http://localhost:${PORT}${req.url}`, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body,
    }),
    saves,
    { origins, battles: { rooms, call: battleCall } },
  );
  reply.headers.forEach((value, key) => res.setHeader(key, value));
  res.writeHead(reply.status);
  res.end(Buffer.from(await reply.arrayBuffer()));
}).listen(PORT, () => console.log(`Save server on http://localhost:${PORT}/api`));
