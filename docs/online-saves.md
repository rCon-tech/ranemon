# Online saves

Online saves let a trainer carry on from any device, and survive a cleared browser. Each name is
locked with a PIN of 4 to 8 numbers, chosen with the name's first online save.

The save server is `worker/save-server.ts`, a Cloudflare Worker with a D1 database. Both are free
for a game this size (D1's free plan allows 100,000 writes a day; the game writes at most once
every 15 seconds while someone plays). The server keeps only a salted PBKDF2 hash of each PIN, and
locks a name for 15 minutes after 5 wrong PINs. It refuses a save older than the one it has, so an
old device can't overwrite a newer game, and it keeps the save from up to an hour before in
`prev_raw`, to restore by hand.

Until it is set up, the game works as before: saves stay in the browser, with backups and save
codes.

## Setting it up (once)

1. Make a free account at https://dash.cloudflare.com/sign-up.
2. On a computer with Node, from the repo:

   ```bash
   cd worker
   npx wrangler login
   npx wrangler d1 create ranemon-saves      # prints a database_id
   # paste the database_id into wrangler.toml
   npx wrangler d1 execute ranemon-saves --remote --file schema.sql
   npx wrangler deploy                        # prints the server's URL, https://ranemon-saves.<you>.workers.dev
   ```

3. In the GitHub repo, **Settings → Secrets and variables → Actions → Variables**, add
   `SAVE_API_URL` with that URL, then re-run the **Deploy to GitHub Pages** workflow. The title
   screen then asks for a PIN.

## Restoring a save by hand

In the Cloudflare dashboard, **D1 → ranemon-saves → Console**:

```sql
UPDATE saves SET raw = prev_raw, saved_at = 0 WHERE id = 'rich';
```

`saved_at = 0` lets the next save from any device replace it again.
