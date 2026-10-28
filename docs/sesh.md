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
- **EXP**: everyone still out gets `SESH_EXP` (7) times a trainer's EXP for every foe that faints, so the party grows from Lv50 to about Lv65 by the last boss.
- **Permadeath**: a Ranemon still fainted when a battle ends is sent home in a taxi for the rest of the run. Hair of the Dog revives only during a battle. Lose a battle, or win one with nobody standing, and the night's over.
- **Score** (`scoreOf`): bosses beaten first, then Ranemon left standing, then fewest turns.

## Replays

A run is plain data (`SeshRun` in `src/lib/sesh/run.ts`), and everything in it follows from its seed and the choices made (`SeshAction`): `replayRun` plays a run again from those alone and throws on any choice the run wouldn't allow. A battle is kept as the player's choices (`BattleInput` in `src/lib/sesh/battle.ts`). Its session is seeded (`seeded` in `src/lib/ui/session.ts`): every roll the CPU and items need comes from the battle's own RNG state, never from the screen, so the same choices always play out the same battle. That is how a page closed mid-fight can carry on, and how the save server can check a run before it goes on the board.

## Tuning

In a 300-run check with a simple bot (`tests/fixtures/sesh-bot.ts`: Hard-CPU moves, food between fights, a rest when hurt, Bouncers only when healthy), about 1 run in 5 clears The Afterparty, going into the bosses at about Lv53, 59 and 65.
