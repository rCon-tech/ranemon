# Ranemon

A turn-based monster-battle game in the style of the classic handhelds, where every creature is one of your friends. Battle mode: pick 6 of the 20 Ranemon, your rival gets 6 of the rest, and you fight 6v6 until one side has no creatures left. Story mode walks you from Co. Clare to Trinity College Dublin.

The full V1 plan (rules, stats, types, moves, Creature Studio, tech stack and milestones) is the **Ranemon V1 Game Plan** doc in the project.

## What works now

- **Battle engine** (`src/lib/battle/`): pure TypeScript with no I/O. Given a seed and the list of actions it always produces the same result.
  - Singles with simultaneous turns, 6v6 in the game. Switches go first, then move priority, then Speed, with a coin flip on a tie.
  - Six personality types (Brains, Brawn, Chaos, Chill, Charm, Hype) on a balanced chart, with 1.5x same-type bonus and dual types.
  - The main-series damage formula fixed at level 50, with crits (1 in 24) and an 85–100% roll.
  - 36 moves (6 per type), PP, accuracy, priority, and effects: statuses, stat stages (±3), recoil, healing and multi-hit. Flail kicks in when every move is out of PP.
  - 20 special moves, one per Ranemon, that no one else can learn. Their percentage boosts stack on top of stages and wear off when the Ranemon switches out. Some swap HP, tag in a partner, or attack and then switch out.
  - Three statuses: Flustered, Hangry and Asleep.
  - A CPU at three levels. Easy picks moves at random, Normal picks the best move about half the time, and Hard always picks the best move and also switches out of bad matchups.
- **Screens**: title screen, team select with a 90-second pick-6 from all 16, the battle screen and the Ranedex. The battle screen has info boxes, a text box, FIGHT, RANEMON and RUN, a 45-second turn timer, text that types out and can be tapped past, an animation for every move in its type's style, a scene of its own for each special move, and hit, send-out and faint animations.
- **Roster**: the 16 lads from the Ranemon sheet plus Paulimon, Skehemon, Vinnimon and Crampemon (`roster.ts`), each with a pixel sprite cut from their photo and their own special move. The rival's 6 are drawn at random from the 14 you didn’t pick, and Oismon and Olliemon are kept together when both are left. The sheet gives no types or stats, so those are a first pass tuned with the simulator.
- **Record**: your wins and losses, kept in this browser until accounts arrive.

## Story mode

`/story` (STORY MODE on the title screen) is a top-down adventure from Co. Clare to Trinity College Dublin, following `docs/story-mode.md`.

- **The road**: 11 maps (Clare, Limerick, Tipperary, Kilkenny, Laois, Offaly, Westmeath, Meath, Kildare, Dublin, Trinity), each with McGrattans (the pub, which heals), Vapes (the shop) and a gym. A Garda at each county line lets you through once you have that county's jersey. Every door opens into a room of its own (`src/content/story/interiors.ts`): the barman heals you across the bar, the shopkeeper sells across the counter, gym leaders wait at the end of a red carpet between two All-Ireland cups, and your house has Mam, a turf fire and a lovely Ocean Linen couch.
- **The story**: Michael D Higgins gives you your first Ranemon (any of the 20) in Newmarket-on-Fergus, your rival from the village picks the one that beats yours, and B&S wait under the Campanile with a boss Ranemon made from their group photo and Petchemon, a Ranemon only they have.
- **Evolutions** (`src/lib/battle/evolutions.ts`): every Ranemon evolves once at Lv30, into a pun on a Gen 1 or 2 Pokémon (Conemon into Conix). The evolved form keeps its types and moves with a bigger stat budget (460 against 400). Wild and trainer Ranemon from Lv30 are already evolved, and evolved ones are harder to befriend. Killemon has a second branch (`ITEM_EVOLUTIONS`): give him a Flannel Shirt from the shop (from Kilkenny on, €3000) before he reaches Killigatr and he evolves into Cholokill, drawn from his own photo, whose special move Whabam takes the place of This One's for Africa.
- **Second special moves** (`src/lib/battle/second-specials.ts`): most lines learn a second special move of their own at Lv36 in story mode (Carlmon's Fossil Record, Steadmon's Bed by 8:30, ...). Battle mode keeps to one special move each. Crampemon evolves into CrampsB2BThilomon at Lv30 or later only with a Thilomon or Thilotrode in the party (`partner` on his evolution).
- **Rules** (`src/lib/story/`): levels 5 to 60 by the main-series stat formula (level 50 gives battle mode's numbers), EXP on an L³ curve, every Ranemon knows its special move from the start, with its other moves learnt weakest first, pints of Guinness to befriend wild Ranemon, Blue Ghosts for +1 level, a party of 6 with the rest in the Group Chat, and a save in this browser.
- **Content** (`src/content/story/`): the maps as one character per tile, trainers, gyms and wild tables. `tests/unit/story-maps.test.ts` checks every door, person and exit can be reached, and `pnpm simulate` also plays each gym with a typical party and checks it is winnable but not a walkover.
- **Saves** (`src/lib/story/save.ts`): you enter a trainer name on the title screen, and the save is filed under it (any case), so friends can share a browser. Every save carries a schema number, and each update converts older saves step by step, copying the old one aside first, so nobody loses their place. A Ranemon, move or map the game no longer has is set aside or swapped for your last pub instead of making the save unreadable, and saves written by this build still load in older ones. The game keeps a copy every 10 minutes of play (the last 5), and **BACKUPS AND SAVE CODES** on the title screen restores one, or turns the save into a code or file to load on another device. Online saves follow a name and a 4 to 8 number PIN on the save server in `save-api/` (Vercel and Neon) once it is set up (`docs/online-saves.md`); the claude.ai play link keeps them in the page's own database, which only the owner can write.
- **Shiny Ranemon** (`src/lib/story/shiny.ts`): 1 wild Ranemon in 256 (`SHINY_ODDS`) is a shiny, in a golden palette made by `scripts/sprites.py` (`public/sprites/shiny/`). It comes in with a gold flash and a burst of sparkles, the text says “A shiny X appeared!”, its name has a gold ★ in battle, the party, the Group Chat and the Ranedex, and befriending one sets off a celebration. It stays shiny in saves and when it evolves; saves from before shinies load as before.
- **Controls**: D-pad, A, B (hold to ride the bike) and START on screen; arrow keys, Z, X and Enter on a keyboard.
- **Speed**: the ▶ button on the map and in battles cycles 1×, 2× and 4×. Walking, text, battle playback and animations all speed up (`src/lib/speed.ts`).
- **How to play** (`/guide`, on the title screen): the game, the six types and the full type chart, battles, statuses and story mode, for new players.

## 3D look

The **2D / 3D** button beside the speed button (on the map and in battles) switches to a 2.5D look, kept per browser. 2D stays the default. Only the drawing changes: maps, walking, scripts, battles and saves are the same code, and you can switch mid-game.

- **Overworld** (`src/components/story/Overworld3D.tsx`, `scene3d.ts`): the map's own 2D ground art on a plane under a tilted camera, with buildings lifted into walls and pitched roofs (slate on gyms), low-poly trees that sway, tall grass standing up in blades, walls, hedges, fences and furniture as blocks wearing their tile art, the Campanile in stone, sunlight with real shadows, and the clock's dawn, evening and night. People are solid figures (`figure3d.ts`) built from their own 2D art: a head, body, arms and legs as blocks wearing the matching piece of the sprite from the front, back and sides, so they turn round, swing their arms and legs as they walk, and cast real shadows. Your follower gets a solid body in its colour under its photo head, which faces the camera as in 2D. Walking lives in `walk.ts`, shared by both looks.
- **Battles** (`src/components/Backdrop3D.tsx`): a 3D stage per scene (fields with hills and drifting clouds, a Georgian terrace, a sports hall with spotlights, Trinity at night under the stars) behind the same sprites, info boxes and move effects, with the platforms placed under the sprites. The second looks (below) stand in it as solid figures (`src/components/Solid.tsx`): the sprite blown up into a rounded body, thickest where the art is widest, with a dark rim for the outline, lit like the stage and turned toward the foe. A Ranemon or look opts in with `solid: true`.
- **Phones**: it uses WebGL through Three.js, loaded only when 3D is picked. Where frames run slow it draws fewer pixels, then turns shadows off. Browsers without WebGL don't show the button.

## Second looks

Some Ranemon have a second look from another photo (`src/lib/battle/variants.ts`): Olliemon (Tricolour), Oismon (Orange Cap), Endamon (Red Wine), Carlmon (Moustache), Conemon (Curls), Boydemon (Rugby), Steadmon (Wedding Suit), Gibbsmon (Races), Jammon (Shades), Killemon (Thumbs Up), Owemon (Dance Floor), Robinmon (Long Coat), Simomon (Linen Suit), Lorcamon (Tuxedo) and Thilomon (Big Catch), and their evolutions. It's the same Ranemon, with the same name, types, stats and moves; only the picture changes. The new photos are cut at 192 pixels and 64 colours, twice the detail of the others (`HD` in `scripts/sprites.py`), with their own follower heads, shiny versions and evolved costumes.

- **Battle mode**: the team screen has a picker for each one's look, and the rival's come in a random look.
- **Story mode**: a wild one is either look, equally likely. The look is kept when you befriend it, when it evolves (the evolution scene shows it too) and in saves, and the Ranemon following you wears it. The Ranedex page shows every look.

## Sound

All the music and effects are made in the browser as the game plays (`src/lib/sound/`), on a chip like the old handhelds': two pulse waves, a triangle bass and noise drums, through Web Audio. There are no sound files, so nothing to download and nothing copied.

- **Music** (`songs.ts`): original tunes, written tracker style, note by note with chords bar by bar (`music.ts`). The title; a jig on the road; Dublin and Trinity; a reel in McGrattans; home and the shop; inside a gym; the bike (hold B); battles against wild Ranemon, trainers, gym leaders, and B&S, the legend and Poseidon; and victory. Short jingles play over them for a level up, an item, the pub's heal, befriending, evolving and losing.
- **Effects** (`sfx.ts`): menus, doors, the encounter, a sound for each type's moves and for special moves, hits (super effective, not very, critical), misses, stat changes, statuses, faints, pints and sips, running away, shiny sparkles, Norm's bark and the bike bell. Every Ranemon has its own cry, made from its id.
- **What plays when** (`cues.ts`): battle events, story lines ("You got…", "grew to Lv…") and the map you're on. Tested in `tests/unit/sound.test.ts`.
- **Controls**: ♪ at the top of the screen cycles music and effects, effects only, and off, kept per browser. Phones allow sound only after a tap, so it starts at the first one, and it goes quiet when the tab is hidden. On an iPhone the ring/silent switch mutes it too. **SOUND TEST** on the title plays every tune, jingle, effect and cry.

## Play link

`scripts/playlink/` builds the whole game as one HTML page, sprites inlined, for sharing as a claude.ai artifact (saves go to the artifact's own storage there): run `pnpm build` (for the CSS), then `node scripts/playlink/build.mjs ranemon.html`.

## Password

The game asks for the word once per browser (`src/components/Gate.tsx`). Only a SHA-256 hash of it is in the code, but the site is static, so this keeps out casual visitors rather than anyone determined.

## Look

The 5th-generation handhelds (Black and White): full-colour pixel sprites that breathe, dark info panels with bright HP bars, white text boxes with a soft double border, glossy colour-coded FIGHT, BAG, RANEMON and RUN buttons, move buttons in their type's colour, and a battlefield whose clouds drift past (fields, Dublin's streets, a gym floor, or Trinity at night for B&S). Story mode's overworld (`src/components/story/tiles.ts`) is drawn in code at twice the world's resolution, like the later 2D games: shaded, textured tiles that join up with their neighbours (paths fray into the grass, water foams at the shore, roofs get ridges and eaves, gyms have slate roofs), trees that rise above their tile, animated water, tall grass and flowers, tall grass that hides your feet, shaded people, a follower that hops along behind you, and drifting cloud shadows with a soft vignette. `scripts/sprites.py` builds the sprites from the photo cut-outs: 96-pixel, 32-colour versions in `public/sprites/bw/`, 28-pixel heads for the Ranemon that follows you, and the evolved forms in `public/sprites/evo/`, each with a type-coloured aura and a costume piece from its Pokémon.

## Not yet

These come next, as their own pull requests: Creature Studio (photo upload, cut-out, the creature card, the friend's approval), accounts and invite-only groups, server-side battles with a committed seed, and live friend battles.

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

Sprites are made from the friends' own photos, so keep the repo and any shared links private. All other art, names and fonts are original or openly licensed. The pixel font is Pixelify Sans, under the SIL Open Font Licence. The game uses no Pokémon logos, sprites or music (all its music is original and made in code); the evolved forms' names are parodies of Pokémon names.
