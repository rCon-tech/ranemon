# Ranemon

A turn-based monster-battle game in the style of the classic handhelds, where every creature is one of your friends. Battle mode: pick 6 of the 16 Ranemon, your rival gets 6 of the rest, and you fight 6v6 until one side has no creatures left. Story mode walks you from Co. Clare to Trinity College Dublin.

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

## Story mode

`/story` (STORY MODE on the title screen) is a top-down adventure from Co. Clare to Trinity College Dublin, following `docs/story-mode.md`.

- **The road**: 11 maps (Clare, Limerick, Tipperary, Kilkenny, Laois, Offaly, Westmeath, Meath, Kildare, Dublin, Trinity), each with a pub that heals, a corner shop and a gym. A Garda at each county line lets you through once you have that county's jersey.
- **The story**: Michael D Higgins gives you your first Ranemon (any of the 16) in Newmarket-on-Fergus, your rival from the village picks the one that beats yours, and B&S wait under the Campanile with a boss Ranemon made from their group photo.
- **Evolutions** (`src/lib/battle/evolutions.ts`): every Ranemon evolves once at Lv30, into a pun on a Gen 1 or 2 Pokémon (Conemon into Conix). The evolved form keeps its types and moves with a bigger stat budget (460 against 400). Wild and trainer Ranemon from Lv30 are already evolved, and evolved ones are harder to befriend.
- **Rules** (`src/lib/story/`): levels 5 to 60 by the main-series stat formula (level 50 gives battle mode's numbers), EXP on an L³ curve, every Ranemon knows its special move from the start, with its other moves learnt weakest first, pints of Guinness to befriend wild Ranemon, Blue Ghosts for +1 level, a party of 6 with the rest in the Group Chat, and a save in this browser.
- **Content** (`src/content/story/`): the maps as one character per tile, trainers, gyms and wild tables. `tests/unit/story-maps.test.ts` checks every door, person and exit can be reached, and `pnpm simulate` also plays each gym with a typical party and checks it is winnable but not a walkover.
- **Saves**: you enter a trainer name on the title screen, and the save is filed under it (any case), so friends can share a browser. On the shared play link, saves also go to the page's own database, so the same name carries on from another device or after the browser is cleared. The static site has no server, so there they stay in the browser (`src/lib/story/cloud.ts` is where a server would plug in).
- **Controls**: D-pad, A, B (hold to ride the bike) and START on screen; arrow keys, Z, X and Enter on a keyboard.

## Password

The game asks for the word once per browser (`src/components/Gate.tsx`). Only a SHA-256 hash of it is in the code, but the site is static, so this keeps out casual visitors rather than anyone determined.

## Look

The 5th-generation handhelds (Black and White): full-colour pixel sprites that breathe, dark info panels with bright HP bars, white text boxes with a soft double border, glossy colour-coded FIGHT, BAG, RANEMON and RUN buttons, move buttons in their type's colour, and a battlefield whose clouds drift past (fields, Dublin's streets, a gym floor, or Trinity at night for B&S). Story mode's overworld (`src/components/story/tiles.ts`) is drawn in code at twice the world's resolution, like the later 2D games: shaded, textured tiles that join up with their neighbours (paths fray into the grass, water foams at the shore, roofs get ridges and eaves, gyms have slate roofs), trees that rise above their tile, animated water, tall grass and flowers, tall grass that hides your feet, shaded people, a follower that hops along behind you, and drifting cloud shadows with a soft vignette. `scripts/sprites.py` builds the sprites from the photo cut-outs: 96-pixel, 32-colour versions in `public/sprites/bw/`, 28-pixel heads for the Ranemon that follows you, and the evolved forms in `public/sprites/evo/`, each with a type-coloured aura and a costume piece from its Pokémon.

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

Sprites are made from the friends' own photos, so keep the repo and any shared links private. All other art, names and fonts are original or openly licensed. The pixel font is Pixelify Sans, under the SIL Open Font Licence. The game uses no Pokémon logos, sprites or music; the evolved forms' names are parodies of Pokémon names.
