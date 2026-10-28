# The Sesh

A standalone roguelike themed as a night out, from the **Ranemon Roguelike Mode Proposal** doc in the project. It has two modes on the title screen: **QUICK SESH** (built first) and **LONG SESH** (after the group has play-tested Quick Sesh). It needs no story save and never reads or writes one. Its bosses, Ranemon, items and scenes come from the main game, only the Ranemon made from photos are used, and everything new is 2D only, even with 3D switched on.

## Quick Sesh

A random party of 6 strong Ranemon and about 20 minutes a run, over the last three stages of the night. Unlimited runs, each with a new random seed. Nothing carries over between runs.

| Stage          | Place         | Fights  | Boss                  | Bouncers        |
| -------------- | ------------- | ------- | --------------------- | --------------- |
| The Pub        | McGrattans    | Lv46–50 | Lv52, 3 Ranemon       | Lv50, 3 Ranemon |
| The Nightclub  | The Rave Cave | Lv52–56 | Lv58, 4 Ranemon       | Lv56, 3 Ranemon |
| The Afterparty | Silicon Docks | Lv58–62 | Lv65, 5 Ranemon, Mega | Lv62, 3 Ranemon |

`src/lib/sesh/stages.ts` has the table. Foe levels are fixed by the stage, never by your party, so every level you gain counts.

- **The party** (`seshParty` in `src/lib/sesh/party.ts`): 6 at Lv50 from `SESH_POOL`, the 20 lads in their Lv50 forms and Cholokill, no line twice, in random looks (photo, a second look, or the drawn UK look), each holding the Friendship Bracelet or Xanax (Conix gets the Vegan Stone). London's own, the Sidemen's and the Ranelasses' Ranemon are never dealt.
- **A stage** (`src/lib/sesh/map.ts`) is a short branching map: 3 rows of 2 or 3 nodes, then the boss. You pick one node at a time from where your last pick leads. Every route passes a Smoking Area, and no pick is ever between Bouncers only (`isFair`).
- **Nodes**: a Fight (1 Ranemon, now and then 2, Normal CPU, from the stage's own trainers: route lads and hens at The Pub, the Rave Cave's ravers, Silicon Docks' staff), a Bouncer (Hard, 3 Ranemon, drops a held item; The Afterparty's drops the Mega Ring), the Offie (4 to 6 items from the story's shelves at story prices, sometimes a Blue Ghost) and the Smoking Area (heal the party, learn one of 3 moves of its types, or take a Blue Ghost).
- **Bosses** (`src/lib/sesh/bosses.ts`, `bossAt` in `foes.ts`): a random named character from the main game at each stage, no repeats in a run. The stage sets the difficulty through the boss's level, team size and CPU (Hard). Each brings a new team of photo Ranemon built around the types of their story team, the ace last; at The Afterparty the ace is one with a Mega form where their types allow, and it Mega evolves. The Ranelasses are never in the pool.
  - Each boss comes in their story skin (drawn on the Briefing with `Portrait`), with their own battle theme (gym leaders get the Gym Leader theme, the DJs I Love Techno, everyone else the Boss theme) and their story lines, rewritten for a night out where the story's only fit the story.
  - The pool is 58 bosses:
    - **Ireland:** the 9 gym leaders, Thatcher, B&S, Alex Simonin, Paul Mescal, the Happy Pear Twins, Melchior, MC, Carl Ryan, Poseidon, Josh Lee, Cramps, the Rave Cave DJ, Enda, the Arcade King, DJ Vandenbass, Rob Lipsett, Blindboy, The 2 Johnnies, Bono and Michael Collins.
    - **The Premier League legends:** Murray, Wright, McGrath, Ferguson, Bielsa, Shearer, Robbie Keane, Agüero, Terry, Henry, Gerrard and Roy Keane.
    - **Silicon Docks:** Pichai, Zuckerberg, Nadella, Cook, Bezos, Chew, Musk and the Collisons.
    - **Liam Neeson.**
    - **The Sidemen** (KSI, TBJ, Zerkaa, Behzinga, Miniminter, Vikkstar123) and **Jamie Elliott**, who bring their own (`own`).
  - A boss who brings their own has a team from their story team, not the photo pool: their own Ranemon as the ace, the rest dealt from the others on their story team, each in its form for the level (`formAt`), the non-aces 2 levels under. Their Ranemon are never dealt to you.

  | Boss         | Pub     | Nightclub | Afterparty             |
  | ------------ | ------- | --------- | ---------------------- |
  | Level of ace | 52      | 58        | 65 (Mega where it can) |
  | Team         | 3       | 4         | 5                      |
  | The others   | ace − 2 | ace − 2   | ace − 2                |
  - Someone with no story trainer of their own (Carl, Josh, Cramps, the Rave Cave DJ, Enda) or whose story team isn't theirs (Thatcher's are the lads picked against your starter; the Pears are two trainers) gives their name, lines and types in `bosses.ts`.

- **EXP**: everyone still out gets `SESH_EXP` (7) times a trainer's EXP for every foe that faints, so the party grows from Lv50 to about Lv65 by the last boss.
- **Permadeath**: a Ranemon still fainted when a battle ends is sent home in a taxi for the rest of the run. Hair of the Dog revives only during a battle. Lose a battle, or win one with nobody standing, and the night's over.
- **Score** (`scoreOf`): bosses beaten first, then Ranemon left standing, then fewest turns.

## Daily Challenge

`src/lib/sesh/daily.ts`. A Quick Sesh that everyone plays on the same seed for one day (UTC): `dailySeed(day)` is `seedFrom('ranemon-sesh-daily:YYYY-MM-DD')`, so the same party, maps, foes and bosses, worked out on each phone, even offline. Play it as often as you like that day; your best score counts.

- It has its own save slot (`ranemon.sesh.daily.v1:<name>`), so starting one never ends a free run, and the other way round. A challenge left unfinished can be carried on after its day; it still counts for its own day.
- Your best score each day is kept for the last 30 days (`recordDaily`); free runs keep their 5 best nights as before.
- The start screen shows today's date, your best today, and a countdown to the next one at midnight UTC. The map shows DAILY CHALLENGE and its day.
- A run counts on its day's board if it reaches the save server within 48 hours of the day ending (`countsFor`), for the leaderboard.

## Screens

`src/components/sesh/` (`/sesh`), all 2D (`flat` on the battles, and the map is a flat screen of its own):

- **Start**: a trainer name (the last one used, or Story mode's), NEW RUN, and CARRY ON THE NIGHT when there's a run going.
- **Your party tonight**: the six you've been dealt, their types and what they're holding, then START THE NIGHT.
- **The map** (`SeshMap.tsx`): the stage's name and place, cash, the party's faces with HP (a grey TAXI for anyone sent home), and the picks from the bottom up to the boss, whose name is shown. Nodes you can go to next are ringed; the route taken so far is lit. PARTY (moves, taking back a held item), BAG (food, Blue Ghosts, things to hold) and GO HOME (ends the run).
- **A battle**: who it is and what they say, then the usual battle screen with the BAG, in the stage's scene, with the trainer music for fights, the boss music for Bouncers, and each boss's own theme.
- **The Offie** and **the Smoking Area**, and the **results card**: bosses, standing, turns, the score, your 5 best nights in this browser, and PLAY AGAIN.

Every choice is saved as it's made, so leaving and coming back carries on the same night, in the same node. A battle keeps its choices as they're made (`fight` in the save), so a page closed mid-fight opens straight back into it, on the turn it was on: the choices play out the same again. Reloading can't change what happened, since the same choices always give the same rolls.

## Replays

A run is plain data (`SeshRun` in `src/lib/sesh/run.ts`), and everything in it follows from its seed and the choices made (`SeshAction`): `replayRun` plays a run again from those alone and throws on any choice the run wouldn't allow. A battle is kept as the player's choices (`BattleInput` in `src/lib/sesh/battle.ts`). Its session is seeded (`seeded` in `src/lib/ui/session.ts`): every roll the CPU and items need comes from the battle's own RNG state, never from the screen, so the same choices always play out the same battle. That is how a page closed mid-fight can carry on, and how the save server can check a run before it goes on the board.

## Tuning

`tests/sim/sesh.test.ts` (in `pnpm simulate`) plays 300 runs with a simple bot (`tests/fixtures/sesh-bot.ts`: Hard-CPU moves, food between fights, a rest when hurt, Bouncers only when healthy). About 1 run in 5 clears The Afterparty (it checks 1 in 10 to 4 in 10), going into the bosses at about Lv53, 59 and 65. It also times a whole night: the battles' playback at 2× plus 2.5 seconds for each choice in battle and 4 outside comes to about 17 minutes (it checks 12 to 28). If play-testing finds runs too long, the proposal's first cut is to 2 picks a stage (`PICKS`).
