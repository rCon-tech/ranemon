# Ranemon

A turn-based monster-battle game in the style of the classic handhelds, where every creature is one of your friends. V1 is battles only: pick 6 of the 16 Ranemon, your rival gets 6 of the rest, and you fight 6v6 until one side has no creatures left.

The full V1 plan (rules, stats, types, moves, Creature Studio, tech stack and milestones) is the **Ranemon V1 Game Plan** doc in the project.

## What works now

- **Battle engine** (`src/lib/battle/`): pure TypeScript with no I/O. Given a seed and the list of actions it always produces the same result.
  - Singles with simultaneous turns, 6v6 in the game. Switches go first, then move priority, then Speed, with a coin flip on a tie.
  - Six personality types (Brains, Brawn, Chaos, Chill, Charm, Hype) on a balanced chart, with 1.5x same-type bonus and dual types.
  - The main-series damage formula fixed at level 50, with crits (1 in 24) and an 85–100% roll.
  - 36 moves (6 per type), PP, accuracy, priority, and effects: statuses, stat stages (±3), recoil, healing and multi-hit. Flail kicks in when every move is out of PP.
  - 16 special moves, one per Ranemon, that no one else can learn. Their percentage boosts stack on top of stages and wear off when the Ranemon switches out. Some swap HP, tag in a partner, or attack and then switch out.
  - Three statuses: Flustered, Hangry and Asleep.
  - A CPU at three levels. Easy picks moves at random, Normal picks the best move about half the time, and Hard always picks the best move and also switches out of bad matchups.
- **Screens**: title screen, team select with a 90-second pick-6 from all 16, the battle screen and the Ranedex. The battle screen has info boxes, a text box, FIGHT, RANEMON and RUN, a 45-second turn timer, text that types out and can be tapped past, an animation for every move in its type's style, a scene of its own for each special move, and hit, send-out and faint animations.
- **Roster**: the 16 lads from the Ranemon sheet (`roster.ts`), each with a pixel sprite cut from their photo and their own special move. The rival's 6 are drawn at random from the 10 you didn't pick, and Oismon and Olliemon are kept together when both are left. The sheet gives no types or stats, so those are a first pass tuned with the simulator.
- **Record**: your wins and losses, kept in this browser until accounts arrive.

## Not yet

These come next, as their own pull requests: Creature Studio (photo upload, cut-out, the creature card, the friend's approval), accounts and invite-only groups, server-side battles with a committed seed, live friend battles, and sound.

## Running it

Requires Node ≥ 22 (`.nvmrc` pins 24) and pnpm 10.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Command          | What it does                                                            |
| ---------------- | ----------------------------------------------------------------------- |
| `pnpm test`      | Unit tests (Vitest)                                                     |
| `pnpm simulate`  | 5,000 CPU-vs-CPU battles; fails if any type wins over 60% of them (6v6) |
| `pnpm test:e2e`  | Builds the app and plays a whole battle in a phone-sized browser        |
| `pnpm lint`      | ESLint                                                                  |
| `pnpm typecheck` | TypeScript                                                              |

`SIM_BATTLES=20000 pnpm simulate` runs a bigger balance check. `scripts/make_sprite.py` turns a photo into a sprite; its header lists the Python packages it needs. On a machine with Chromium already installed, set `PW_CHROMIUM_PATH` to skip `playwright install`.

## Art and sound

Sprites are made from the friends' own photos, so keep the repo and any shared links private. All other art, names and fonts are original or openly licensed. The pixel font is Press Start 2P, under the SIL Open Font Licence. The game uses no Pokémon names, logos, sprites or music.
