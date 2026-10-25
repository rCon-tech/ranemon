# Online saves

Online saves let a trainer carry on from any device, and survive a cleared browser. Each name is
locked with a PIN of 4 to 8 numbers, chosen with the name's first online save.

The save server is `save-api/`: two Vercel functions (`api/load.ts`, `api/save.ts`) and a Neon
Postgres database, both on their free plans. The server keeps only a salted PBKDF2 hash of each
PIN, and locks a name for 15 minutes after 5 wrong PINs. It refuses a save older than the one it
has, so an old device can't overwrite a newer game, and it keeps the save from up to an hour
before in `prev_raw`, to restore by hand. It makes its own tables on first use. The game writes at
most once every 15 seconds while someone plays.

Until it is set up, the game works as before: saves stay in the browser, with backups and save
codes. The game itself stays on GitHub Pages; only the save server runs on Vercel.

## Setting it up (once)

1. In Vercel, **Add New → Project**, and import the `ranemon` repo.
2. Before deploying, set **Root Directory** to `save-api` and **Framework Preset** to **Other**,
   then **Deploy**.
3. In the new project, **Storage → Create Database → Neon**, and connect it to the project. This
   adds `DATABASE_URL` to the project's environment variables.
4. **Deployments → ⋯ → Redeploy**, so the functions pick up `DATABASE_URL`.
5. Note the project's address, like `https://ranemon-save-api.vercel.app`.
6. In the GitHub repo, **Settings → Secrets and variables → Actions → Variables**, add
   `SAVE_API_URL` with that address followed by `/api` (for example
   `https://ranemon-save-api.vercel.app/api`), then re-run the **Deploy to GitHub Pages**
   workflow. The title screen then asks for a PIN.

The server only answers `https://rcon-tech.github.io`. To allow another site (such as
`http://localhost:3000` while developing), add an `ALLOWED_ORIGINS` environment variable in
Vercel with the sites, comma-separated.

## Friend battles

Friend battles (`/friends`) run on the same server, through `api/battle.ts`, and keep each room in
a `battles` table it makes on first use. The battle code is the game's own: `npm run build` (which
Vercel runs on each deploy) bundles `src/lib/online/server.ts` into `gen/battle.js`. That needs
**Settings → Build and Deployment → Include files outside the Root Directory in the Build Step**
turned on in Vercel, which it is for new projects. Vercel redeploys the server on each push to
`main`, so it stays on the same version as the game.

### The Online Champion

The crown lives in a `crown` table (one row) that the server makes on first use, so it needs no
setting up, only a redeploy. Until someone wins it, it belongs to Ollie (`FIRST_CHAMPION` in
`src/lib/online/server.ts`) if there is a save under `ollie`. After that it changes only when the
server ends a friend battle with a winner.
To hand it to someone by hand (Rich here), in the Neon SQL Editor:

```sql
INSERT INTO crown (id, doc, version, updated)
VALUES ('online', '{"id":"rich","name":"Rich","since":0,"defences":0,"battle":"by-hand"}', 1, 0)
ON CONFLICT (id) DO UPDATE SET doc = EXCLUDED.doc, version = crown.version + 1;
```

`DELETE FROM crown;` hands it back to Ollie (or leaves it unclaimed if he has no save).

To try it on your own machine, run `npm run local` in `save-api/` (everything in memory, at
`http://localhost:8787/api`), then `NEXT_PUBLIC_SAVE_API=http://localhost:8787/api pnpm dev`.

## Restoring a save by hand

In Vercel, **Storage → the Neon database → Open in Neon → SQL Editor**:

```sql
UPDATE saves SET raw = prev_raw, saved_at = 0 WHERE id = 'rich';
```

`saved_at = 0` lets the next save from any device replace it again.
