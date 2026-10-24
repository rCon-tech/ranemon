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
- **Screens**: title screen, team select with a 90-second pick-6 from all 16, the battle screen and the Ranedex, where every Ranemon has a page of its own (`/ranedex/<id>`, `src/components/DexEntry.tsx`): a big picture you can flip through its looks and shiny on (solid in the 3D look), its types and matchups, entry, base stats, evolution line and how each form is reached, its battle and story moves with what each is super effective on, and, in story mode, where it's found. The battle screen has info boxes, a text box, FIGHT, RANEMON and RUN, a 45-second turn timer, text that types out and can be tapped past, an animation for every move in its type's style, a scene of its own for each special move, and hit, send-out and faint animations.
- **Roster**: the 16 lads from the Ranemon sheet plus Paulimon, Skehemon, Vinnimon and Crampemon (`roster.ts`), each with a pixel sprite cut from their photo and their own special move. The rival's 6 are drawn at random from the 14 you didn’t pick, and Oismon and Olliemon are kept together when both are left. The sheet gives no types or stats, so those are a first pass tuned with the simulator.
- **Record**: your wins and losses, kept in this browser until accounts arrive.

## Story mode

`/story` (STORY MODE on the title screen) is a top-down adventure from Co. Clare to Trinity College Dublin, following `docs/story-mode.md`.

- **The road**: 11 maps (Clare, Limerick, Tipperary, Kilkenny, Laois, Offaly, Westmeath, Meath, Kildare, Dublin, Trinity), each with McGrattans (the pub, which heals), Vapes (the shop) and a gym. A Garda at each county line lets you through once you have that county's jersey. Every door opens into a room of its own (`src/content/story/interiors.ts`): the barman heals you across the bar, the shopkeeper sells across the counter, gym leaders wait at the end of a red carpet between two All-Ireland cups, and your house has Mam, a turf fire and a lovely Ocean Linen couch.
- **Bigger counties** (`src/content/story/legends.ts`): Clare, Limerick and Tipperary are 40 tiles wide, grown east and south of the old towns with the county's landmarks (Bunratty, the Burren, the Cliffs of Moher, the Treaty Stone, Adare, Lough Gur, the Hayes Hotel, Cahir Castle and more), local legends told by the people there, new route trainers and one-off gifts. 2D only (`flat`). The old ground and doors haven't moved, so saves carry on as before. More counties follow.
- **The story**: Michael D Higgins gives you your first Ranemon (any of the 20) in Newmarket-on-Fergus, your rival from the village picks the one that beats yours, and B&S wait under the Campanile with a boss Ranemon made from their group photo and Petchemon, a Ranemon only they have. Beat them and Petchemon joins you.
- **Evolutions** (`src/lib/battle/evolutions.ts`): every Ranemon evolves once at Lv30, into a pun on a Gen 1 or 2 Pokémon (Conemon into Conix). The evolved form keeps its types and moves with a bigger stat budget (460 against 400). Wild and trainer Ranemon from Lv30 are already evolved, and evolved ones are harder to befriend. Killemon has a second branch (`ITEM_EVOLUTIONS`): give him a Flannel Shirt from the shop (from Kilkenny on, €3000) before he reaches Killigatr and he evolves into Cholokill, drawn from his own photo, whose special move Whabam takes the place of This One's for Africa.
- **Second special moves** (`src/lib/battle/second-specials.ts`): most lines learn a second special move of their own at Lv36 in story mode (Carlmon's Fossil Record, Steadmon's Bed by 8:30, ...). Battle mode keeps to one special move each. Crampemon evolves into CrampsB2BThilomon at Lv30 or later only with a Thilomon or Thilotrode in the party (`partner` on his evolution).
- **Rules** (`src/lib/story/`): levels 5 to 100 by the main-series stat formula (level 50 gives battle mode's numbers), EXP on an L³ curve, every Ranemon knows its special move from the start, with its other moves learnt weakest first, pints of Guinness to befriend wild Ranemon, Blue Ghosts for +1 level, a party of 6 with the rest in the Group Chat, and a save in this browser.
- **Connolly Station** (`src/content/story/station.ts`): one door in Dublin for every train out of the city. The clerk at the ticket desk opens a departures board, and the staff on each platform will take you onto their own train. The lines are a list (`DEPARTURES`): today the DART to Greystones, the Intercity to Bundoran, the Sail & Rail to Brighton (locked until Enda asks you) and the Eurostar to Ghent (locked until Cramps asks you) and the Intercity to Galway (locked until you're Champion), with the Enterprise to Belfast on the board as coming soon. A new destination is a map plus one entry, and a line can stay locked until a flag is set.
- **Enda and Brighton** (`src/content/story/enda.ts`, `src/content/story/brighton.ts`): Enda, a very small man who makes best friends with everyone, stands in the road out of Kildare until you've met him, and asks you to Brighton with Ollie and Kill. Saying yes opens the Sail & Rail at Connolly Station: a match at the Amex, then the arcade, with fans and gamers to battle and the Arcade King as the boss. Beating him gets you Enda's Friendship Bracelet, a held item for any Ranemon.
- **Cramps and I Love Techno** (`src/content/story/cramps.ts`, `src/content/story/techno.ts`): once you're Champion, Cramps runs up to you the first time you're back out in Dublin (Dublin's `arrive`, which runs whenever you come onto it) and says that to celebrate the win the crew are going to I Love Techno in Belgium. Saying yes opens the Eurostar to Ghent on platform 4 at Connolly, where he waits if you said no. At Flanders Expo security won't let anyone in: three guards in the queue lane, stage security inside, then DJ Vandenbass. Beating him gets you 10 Blue Ghosts from his rider and the hall turns into the festival. Ghent is 2D only for now (`flat` on the map).
- **The Championship of Ireland** (`src/content/story/galway.ts`): once B&S are beaten, the Intercity from Connolly (platform 6) runs to Galway. The Hall of Champions on Eyre Square is five rooms in a row, each one themed for whoever waits in the middle of it: Rob Lipsett's gym, Blindboy Boatclub's study, The 2 Johnnies' farmhouse kitchen, Bono's stage and the Champion's hall. The door at the top of each room opens once its battler is beaten, into the next. Beat all four in a row with no healing (any full heal, at McGrattans, at home or after a blackout, wipes the run and you start again from the first; food from the BAG is allowed) and the secret Champion, Michael Collins, is waiting behind Bono's door. Beat him to become Champion of Ireland (a Perfect Pour, the title, and his skin). Their teams always scale to your best Ranemon, Champion or not (`above` on a trainer), 3 levels under it for the first two up to 1 under for Collins, so it stays a fight all the way to Lv100. In the simulator a random party wins each of the four 70% to 90% of the time and Collins about half the time, but a whole run with a bag of food only about 1 in 20 (`tests/sim/galway.test.ts`). Galway and the Hall are 2D only (`flat`).
- **Missions** (`src/content/story/missions.ts`): START → MISSIONS lists every mission you've started and not finished, the main story included, each with a line on what it's about, what to do next and where to go (with a count, such as clues found, where there is one). Nothing open shows a friendly empty screen. A mission is one entry in `MISSIONS`, made from the flags its story already sets: a `start` flag, a `done` flag and steps, each shown until its `until` flag is set.
- **Dublin and the Rave Cave** (`src/content/story/rave.ts`): Dublin is a city twice the size of a county town, with the Liffey, three bridges, pavements, tarmac and slate roofs. The Rave Cave, a door on its south side, has nine trainers dancing under the lights, easiest by the door and hardest by the DJ, and anyone you've beaten there will battle you again whenever you ask, for training.
- **Content** (`src/content/story/`): the maps as one character per tile, trainers, gyms and wild tables. `tests/unit/story-maps.test.ts` checks every door, person and exit can be reached, and `pnpm simulate` also plays each gym with a typical party and checks it is winnable but not a walkover.
- **Saves** (`src/lib/story/save.ts`): you enter a trainer name on the title screen, and the save is filed under it (any case), so friends can share a browser. Every save carries a schema number, and each update converts older saves step by step, copying the old one aside first, so nobody loses their place. A Ranemon, move or map the game no longer has is set aside or swapped for your last pub instead of making the save unreadable, and saves written by this build still load in older ones. The game keeps a copy every 10 minutes of play (the last 5), and **BACKUPS AND SAVE CODES** on the title screen restores one, or turns the save into a code or file to load on another device. Online saves follow a name and a 4 to 8 number PIN on the save server in `save-api/` (Vercel and Neon) once it is set up (`docs/online-saves.md`); the claude.ai play link keeps them in the page's own database, which only the owner can write.
- **Shiny Ranemon** (`src/lib/story/shiny.ts`): 1 wild Ranemon in 256 (`SHINY_ODDS`) is a shiny, in a golden palette made by `scripts/sprites.py` (`public/sprites/shiny/`). It comes in with a gold flash and a burst of sparkles, the text says “A shiny X appeared!”, its name has a gold ★ in battle, the party, the Group Chat and the Ranedex, and befriending one sets off a celebration. It stays shiny in saves and when it evolves; saves from before shinies load as before.
- **Skins** (`src/content/story/skins.ts`): SKINS on the START menu. Beat a boss or named trainer, or finish a character's side quest, and you can walk around dressed as them, on the 2D map and the Trainer Card. Locked ones are silhouettes with a hint. A new character gets a skin with one entry (`docs/story-mode.md`, Skins).
- **Controls**: D-pad, A, B (hold to ride the bike) and START on screen; arrow keys, Z, X and Enter on a keyboard.
- **Speed**: the ▶ button on the map and in battles cycles 1×, 2× and 4×. Walking, text, battle playback and animations all speed up (`src/lib/speed.ts`).
- **How to play** (`/guide`, on the title screen): the game, the six types and the full type chart, battles, statuses and story mode, for new players.

## Friend battles

`/friends` (FRIEND BATTLE on the title screen) is a live battle against a friend with your Story mode party, through the save server (`docs/online-saves.md`). You sign in with your trainer name and PIN, open a room and share its code (like `BOKA-42`, or a link that fills it in), and both press READY. The challenger picks the levels: everyone at 50 (the default), a cap at 50, or as caught.

- **The server runs the battle** (`src/lib/online/server.ts`, served by `save-api/api/battle.ts`): it takes each team from the player's online save, checks it could have come from the game (`validateTeam` in `src/lib/online/rules.ts`), keeps the seed, and plays each turn once both have chosen. Phones only send their choice and play back what happened, with their own team at the front and the foe's unseen Ranemon hidden. A game on a different version (`RULES_VERSION`, a hash of the battle data) is asked to reload.
- **Turns** have the usual 45-second timer. If a player is gone for 100 seconds the server moves for them, and the second time in a row they lose. Closing the page and opening it again carries on with the battle.
- **Not yet**: picking your 6 from the Group Chat, rematches, friend lists, and battles in the claude.ai play link.

## 3D look

**Switched off for now.** `THREE_D` in `src/lib/view.ts` is `false`, so the 2D / 3D button is hidden and every map, battle and Ranedex page draws in 2D, even in a browser that had 3D picked before. The code below is all kept: set `THREE_D` to `true` to bring it back, with each browser's old choice.

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

These come next, as their own pull requests: Creature Studio (photo upload, cut-out, the creature card, the friend's approval), accounts and invite-only groups, and friend battles in the play link.

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
