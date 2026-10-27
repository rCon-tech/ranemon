# London bosses (drafts)

New London bosses, each with a Ranemon of their own, for Rich to approve. **Not in the game**:
nothing in `src/` uses anything here, and no map, trainer, roster or Ranedex has changed.

- `preview.png`: every boss on one sheet. Each boss's folder has their `card.png` too.
- `<boss>/overworld.png`: their walk, as the overworld draws them: a row each for down, left,
  right and up, the nine frames of the walk across (64 × 96 each).
- `<boss>/<ranemon>.png`, `-back.png`, `shiny/` and `-mini.png`: their Ranemon's front, back,
  shiny and story-mode follower, 96 pixels like the London Ranemon. All 2D.
- `bosses.ts`: each boss's overworld look, and a proposal for their Ranemon (types, stats, moves,
  a signature move idea and a Ranedex entry).

Dr Bhav and Sibeal keep the looks they already have in the game; only their Ranemon are new.

## Adding a boss

1. Add them to `BOSSES` in `bosses.ts`: their look (a `Style`, as in `people.ts`) and their
   Ranemon's proposal.
2. Add their Ranemon's `Look` to `RANEMON` in `scripts/drawn/bosses.py`.
3. Run `node scripts/drawn/bosses-overworld.mjs && python3 scripts/drawn/bosses.py` (set
   `CHROMIUM` to a Chromium binary if Playwright's own isn't installed).

The overworld looks needed six new options in `people.ts`, which nobody in the game uses yet:
`tank` (sleeveless, slim bare arms), `neckerchief`, `shawl`, `glass`, `open` (worn open over a
top) and `facings` (a gown's facings over a dress).

## Putting them in the game later

Copy a look into `STYLES` in `people.ts`, the Ranemon's sprites into `public/sprites/london/`,
and its line into `src/lib/battle/london.ts`, with its signature move in `london-moves.ts`.
