# Ranemon Story Mode: Design Guide

Plan only, written 20 October 2026. Building starts once the battle game is finished. The live, commentable version of this guide is the **Ranemon Story Mode: Design Guide** doc in the project.

## Overview

Story mode is a top-down, early-Pokémon-style adventure that walks the player from Co. Clare to Trinity College Dublin, beating a gym in each of 9 counties and then B&S at Trinity. It runs on the existing battle engine with three additions: levels, wild battles you can catch from, and HP/PP that carry over between fights.

The core loop is: walk a county route, fight wild Ranemon in the long grass, throw a pint of Guinness to befriend them, build a party of 6, heal at McGrattans (the pub), beat the county gym for its county jersey (the badge), and move on.

| Brief from Rich                                       | How the plan handles it                                                                             |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Early-Pokémon top-down adventure                      | 16×16 tile overworld, grid movement, one screen of about 10×9 tiles scaled for a phone held upright |
| Pick your first Ranemon from the full list            | All 20 are on the table at the start, each at level 5                                               |
| Given by President Michael D Higgins                  | He hands it over in Co. Clare, where he grew up                                                     |
| Clare to Trinity College Dublin, a gym in each county | 9 gyms: Clare, Limerick, Tipperary, Kilkenny, Laois, Offaly, Westmeath, Meath, Kildare, then Dublin |
| B&S is the final boss in Trinity                      | B&S waits under the Campanile in Front Square                                                       |
| Catch with a pint of Guinness, party of 6             | The pint replaces the ball; extra Ranemon wait in the Group Chat (storage)                          |
| Level up with EXP                                     | Main-series style EXP and stats, which reduce exactly to today's level-50 numbers                   |
| Rare Candy is a Blue Ghost                            | +1 level, found hidden along the way                                                                |
| One Ranemon follows the player                        | The lead party member walks one tile behind                                                         |

**Assumptions made where the brief was open** (each is also in Open questions at the end):

- The route runs through the midlands: 9 counties with a gym, then Dublin. Clare has a gym too, as the tutorial gym.
- The only species are the 20 friends (plus Petchemon, who only B&S have), so wild Ranemon, gym teams and B&S's team all draw from them. Duplicates are allowed. More can join through Creature Studio later.
- B&S is a trainer with a team of 6 whose last Ranemon is a unique boss creature drawn from their photo (page 7 of the Ranemon sheet).
- Levels run 5 to 60, and the endgame sits at level 50 so it matches the battle game's balance.
- The player is an unnamed young trainer from Clare. The rival is Margaret Thatcher, who picks after you and is incredibly British about everything (tea, queues, pearls and the handbag). Dua Lipa pulls the pints in McGrattans and heals your party.

## Story beats

B&S hold the title of Ranemon Champions of Ireland and have shut themselves into Trinity. Michael D wants someone from the country to go up and take it off them, and only a trainer wearing all 9 county jerseys gets past the Front Gate.

1. **Prologue, Newmarket-on-Fergus, Co. Clare.** The player wakes at home. Mam says the President is in the village visiting the farm he grew up on, and he's asking for you.
2. **Michael D's starter.** In the farmhouse kitchen, 20 pints sit on the table, one per Ranemon. You pick any one; it comes at level 5 with 2 moves. He gives you the Ranedex, 5 Pints of Guinness and the quest. Your rival picks next, choosing one with a type edge over yours, and battles you at the gate.
3. **First catch.** On Route 1 a regular at the pub shows you how to throw a pint, and you catch your first wild Ranemon.
4. **Ennis gym (Clare).** A trad session gym in a pub. Win the Clare jersey. Michael D phones (the Nozzy Call ringtone) to say well done, which becomes his running check-in after every gym.
5. **Limerick to Kilkenny (gyms 2 to 4).** The rival turns up twice, at Thomond Park and on the road into Kilkenny. A stag party, the Lads on Tour, is causing trouble on the routes; you beat their members as ordinary trainers.
6. **Electric Picnic, Laois (gym 5).** The Lads on Tour's ringleader is headlining the festival. Beat him and the gym's DJ. Thilomon and the Oismon and Olliemon pair are found here.
7. **Offaly, Westmeath, Meath (gyms 6 to 8).** Bogs, monasteries, a pop homecoming and Newgrange at the solstice. At Sean's Bar in Athlone, Lorcamon buys you a round: a Guinness 0.0.
8. **The Curragh, Kildare (gym 9).** An army camp gym. Gibbsmon is first seen in the wild here. The rival's last battle before Dublin.
9. **Dublin.** Through the Phoenix Park, then St James's Gate, where you earn the Perfect Pour (the guaranteed catch). Final rival battle on the quays, then Temple Bar's trainer gauntlet.
10. **Trinity.** Show the 9 jerseys at the Front Gate. Three Trinity scholars wait in the Long Room. Then B&S under the Campanile in Front Square.
11. **Ending.** Michael D presents the title in Front Square. Credits roll over the route you walked, county by county, with your party.
12. **Post-game.** B&S rematch at level 60 every in-game week, and the Group Chat unlocks a "Complete the Ranedex" goal for all 16.

**Running characters:** Michael D Higgins (quest giver, phones after each gym), the rival (6 battles), the Lads on Tour (optional villain thread; can be cut if scope is tight), B&S (final boss).

## Route and gyms

The route is Clare → Limerick → Tipperary → Kilkenny → Laois → Offaly → Westmeath → Meath → Kildare → Dublin. Each county borders the next, it passes through the midlands, and it gives 9 gyms, one more than the classic 8. Each gym covers one of the 6 personality types; the last three are dual-type to keep late gyms hard. The route loops south through Limerick and Tipperary before turning north through the midlands, so the player crosses the Shannon early and reaches Dublin from the west.

```
                      Westmeath (7) ──→ Meath (8)
                          ↑                 ↓
                      Offaly (6)        Kildare (9) ──→ Dublin: B&S at Trinity
                          ↑
 Clare (1)            Laois (5)
    ↓                     ↑
 Limerick (2) ──→ Tipperary (3) ──→ Kilkenny (4)
```

| #     | County    | Town and gym                                          | Leader                                  | Type             | Team (level)                                                | Jersey reward                                      |
| ----- | --------- | ----------------------------------------------------- | --------------------------------------- | ---------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| 1     | Clare     | Ennis: a trad session in the back of a pub            | Nóra, concertina player                 | Chill            | Simomon 10, Jammon 12                                       | Clare jersey; Cup of Tea x3                        |
| 2     | Limerick  | Thomond Park: a rugby scrum gym                       | Big Donncha, tighthead prop             | Brawn            | Olliemon 14, Boydemon 16                                    | Limerick jersey; High Nelly bike                   |
| 3     | Tipperary | Thurles: Semple Stadium, home of the GAA              | Saoirse, blue hair, very online liberal | Mixed            | Jammon 18, Steadmon 18, Conemon 20                          | Tipperary jersey. The door needs HM Neurodivergent |
| 4     | Kilkenny  | Kilkenny Castle during the Cat Laughs comedy festival | Aoife, stand-up comic                   | Charm            | Endamon 22, Robinmon 22, Lorcamon 24                        | Kilkenny jersey; The Round (EXP share)             |
| 5     | Laois     | Stradbally: the Electric Picnic main stage            | DJ Stradbally                           | Chaos            | Hugomon 26, Thilomon 26, Boydemon 28                        | Laois jersey; Currach (cross rivers and loughs)    |
| 6     | Offaly    | Clonmacnoise: a monastery scriptorium                 | Brother Ciarán                          | Brains           | Steadmon 30, Simomon 31, Hugomon 32                         | Offaly jersey; Ordnance Survey map (fast travel)   |
| 7     | Westmeath | Mullingar: a pop star's homecoming gig                | Niamh, the frontwoman                   | Charm and Hype   | Robinmon 34, Carlmon 34, Endamon 35, Conemon 36             | Westmeath jersey; Hi-Vis Vest x5                   |
| 8     | Meath     | Newgrange at the winter solstice                      | The Keeper of Brú na Bóinne             | Brains and Chill | Jammon 38, Simomon 38, Hugomon 39, Steadmon 40              | Meath jersey; Blue Ghost x2                        |
| 9     | Kildare   | The Curragh army camp                                 | Commandant Dee                          | Brawn            | Oismon 39, Olliemon 39, Boydemon 40, Owemon 41, Gibbsmon 44 | Kildare jersey; entry to Dublin                    |
| Final | Dublin    | Trinity College: Long Room, then the Campanile        | 3 scholars, then B&S                    | Mixed            | Scholars 3 each at 46 to 48; B&S 6 at 50 to 55              | Champions of Ireland                               |

**Places on the way** (non-gym landmarks that make each county feel like itself): Cliffs of Moher, the Burren and Shannon Airport (Clare); King John's Castle (Limerick); Rock of Cashel (Tipperary); the Bog of Allen (Offaly); Sean's Bar, Athlone, the oldest pub in Ireland (Westmeath); the Hill of Tara (Meath); Punchestown (Kildare); the Phoenix Park, St James's Gate, Temple Bar and Grafton Street (Dublin).

**HM Neurodivergent.** The Semple Stadium gym door has a pattern lock. The old man by the gym, a retired donkey vet, asks five yes or no questions loosely after the screening ones (small sounds, library or disco, number plates and patterns, getting back on track after an interruption, one big interest). Every answer gets a friendly reply and none is wrong. Then he certifies you with Donkey Brains and hands over the HM, which opens the door and can be used from the bag's key items to count everything on the map, Blue Ghosts included. The joke is the donkey vet and the certificate, never the player.

**The legend (late game, Dublin).** An old woman on the quays, a busker by the Phoenix Park and the barman in Temple Bar each give a coral bead, in that order, while telling the story of a Ranemon older than the city that nobody has seen in years. Nobody says his name. With all three beads the boarded-up Hellfire Club opens, and inside stands a figure in cream robes with a gold-topped staff, shown only as ??? until the battle starts. He is Tobymon (Brains/Charm, base 520, signature move Staff of Ages), a wild battle at level 50 on hard AI. He can be befriended with a pint but only rarely: worn down to 1 HP and asleep, a Mulligan's Pint works about 1 time in 7, and the Perfect Pour always works. Running or winning leaves him there to try again. He is in the Ranedex as ????? until met, never appears in the wild or in battle mode, never evolves, can be shiny, and his sprite carries a gold legendary glow.

**Dublin, the city.** Dublin is the biggest map on the road, 40 × 26 tiles against the counties' 24 × 13 or so, and the camera scrolls over it. The Liffey runs across the middle with three bridges. North of it are the Phoenix Park (long grass), St James's Gate, Vapes and O'Connell Street; south of it Temple Bar and McGrattans, the Hellfire Club, the rent house, a Georgian terrace, Silicon Docks, Connolly Station, the Rave Cave and a little of St Stephen's Green (long grass too). It looks like a city: slate roofs (`slate`), granite pavements (`v`) and tarmac roads with a dashed white line (`a`), with parked cars on them, and grass only in the parks. Every door it had is still there, in the same reading order, so the rooms behind them (`dublin-L2` and so on) are unchanged. Saves from before the bigger map (schema 2) are moved on load to the step in front of the nearest door they were standing by on the old map (`toNewDublin` in `save.ts`).

**The Rave Cave (Dublin).** The fourth `L` in Dublin, by the south edge, with a bouncer on the door: a basement where the party never stops (`src/content/story/rave.ts`). Inside, a DJ plays behind the booth at the back and nine trainers dance on a floor of coloured squares that change on the beat (indoor tile `l`, walkable; `k` is the black floor round it, `o` the brick back wall with a neon tube and `I` a speaker stack). Dancers (`dances` on a person) turn about and hop on the beat in 2D and 3D, and stop to face you when you talk to them. None of them jumps you: you pick who to battle. They get harder from the door to the DJ, from Raver Aoife (Lv42 to 43, Easy) to Rave Legend Mossy (Lv56 to 58, Hard), and pay the usual 20 euro a level of their best, every time. Once you've beaten one, talking to them asks whether to battle again, and they always say yes, so it's the place to train up. A battle started from a script now checks the party can fight first, as talking to a trainer always did. In the simulator a Lv46 party from the Dublin grass nearly always beats the first six and rarely the last three; a Lv54 party beats Mossy about three times in four.

**Connolly Station (Dublin).** Every train out of Dublin leaves from one place: Connolly Station, the door at the bottom left of the map (the third `L`). Inside, the clerk at the ticket desk opens the departures board (the `departures` script step), which lists every line by platform; pick one and the ride runs. Each running line's staff also stand on the platforms and ask whether you're getting on, and whoever runs it at the far end brings you back onto the concourse. The board on the wall (indoor tile `D`) reads the same list. The lines are data in `src/content/story/station.ts` (`DEPARTURES`): a running line gives its map, where you get off, its staff, what they say, the ride and the first-visit line, and the way home. A line marked `soon` shows as COMING SOON and can't be bought; one with a `lock` shows as NOT YET and says why until its flag is set. To add a destination: build its map, add a `Departure`, and put `homeward(id)` on the person there who runs the train back. Today: platform 1 the DART to Greystones, platform 2 the Intercity to Bundoran, and platforms 3 and 4 (the Enterprise to Belfast and the Intercity to Galway) coming soon. Jamie Boyde stands on the concourse by the benches, in the rugby kit of Boydemon's second look (`boyde.ts`). He's a one-line gag with no battle: he asks whether he should put this pill in his ass, and whatever you answer, he does it anyway.

**Poseidon (side story, Donegal).** The conductor on platform 2 at Connolly Station (below) runs the Atlantic Coast Express to Bundoran, Co. Donegal, and one there brings you back to Connolly. Josh Lee, who surfs Bundoran all year, says a god lives out on the rocks by Tullan Strand and gives you his tablet: take it there and then, or later from the bag's key items. Once it's taken (it leaves the bag), Poseidon appears on the rocks: a hard boss on Hard AI with Jammon 55, Simomon 55, Olliemon 56, Owemon 56 and Poseidon himself at 60 (Chill/Brawn, base 505, his own move Trident). A party of six Lv54s beats him about 30% of the time in the simulator. The prize is €7,000 and 3 Blue Ghosts. Poseidon can't be caught and isn't in the Ranedex. Bundoran has its own McGrattans and Vapes, and long grass at Lv46 to 52. Once you've been, the Town Map shows Donegal, with the railway line from Dublin.

**The missing rent (side story, Dublin).** A new house on the south bank, past Temple Bar, is shared by Ollie (very French), Simo and their housemates MC (a small Irish girl) and Melchior (King of France). The rent money is gone from the biscuit tin. Ollie starts it; then three clues, each of which points at both suspects, come from Simo (half a croissant and a Tayto by the tin), the neighbour outside (someone shouting “Sláinte!” or “Santé!”) and a Garda on the quays (tiny fingerprints with ring marks). With all three you can accuse MC or Melchior, once, and must battle whoever you pick (Normal AI, three Ranemon at Lv43 to 47, €1,100). Lose and you face the same one again. Win and they only say “This changes nothing, you’ll still never find out who took the cash!”, and Simo gives you 2 Full Irish. The culprit is never revealed.

**Greystones and the Happy Pear Twins (side story, Wicklow).** The DART driver on platform 1 at Connolly Station takes you south along the coast to Greystones, Co. Wicklow, and one at Greystones station brings you back to Connolly. Greystones is the richest town in Ireland and looks it: slate roofs on every building (`slate` on the map), cabbage palms (`p`), a sandy beach (`d`), yachts in the marina (`y`) and jeeps in the car park (`c`), all drawn in 2D and built as models in 3D. Kill (blond, sure he'll be forced to move to Africa), Stead (in an England shirt, insists he's British) and Cramps (a DJ in headphones) each complain about the terrible rule of the Happy Pear Twins. Talking to any of them, or to the waiter in the Happy Pear café, sets `greystones:heard`, and the twins appear on the beach. Talk to either twin to battle Dave and then Steve back to back, with no healing between (Hard AI, three each at Lv52 to 56, €3,000 each). Lose to Steve and Dave stays beaten. A party of six Lv52s beats Dave about 90% of the time and both about half the time in the simulator. Steve's reward is the Vegan Stone. Greystones has its own McGrattans and Vapes, a cyclist in lycra, long grass on the golf course at Lv46 to 52, and joins the Town Map once visited, with a railway line from Dublin.

**Held items.** A Ranemon can hold one item (`held` on a party member, kept in saves and save codes; an item a build doesn't know is dropped on load). The only one so far is the **Vegan Stone**: from the BAG, give it to Conemon or Conix (any Ranemon of the `conemon` line) to hold, and its Attack is multiplied by 1.2 for every battle, switching out included (`held` on the battle entrant). Other Ranemon can't take it. PARTY shows what a member holds, with TAKE to put it back in the bag, and a ◆ by its name. Held items can't be used in battle.

**Alex Simonin (Trinity).** A trainer in Front Square, beside the path up to the Long Room, dressed head to toe in pink with love hearts all over, who only has eyes for Simomon: three Weezimo (Simomon evolved) at Lv45, 46 and 47, Hard AI and €1,880 like the scholars. A Lv45 party from the Dublin grass beats him about 77% of the time in the simulator, against 87% to 94% for the scholars. Every line he says, before the battle, each time he sends one out (the trainer's `line`) and when you talk to him after, is “How do we always end up here?”.

**The Trinity Ball (after B&S).** Once B&S are beaten (flag `champion`), Trinity is the Trinity Ball for good: the map's `after` form (`TRINITY_BALL` in content/story/ball.ts), which `mapFor` picks in place of the plain map once its flag is set. It keeps the same ground but has fairy lights strung over Front Square and the Long Room (`party.lights`, drawn in 2D and 3D), the pub's reel for music, party lines for the scholars, and revellers in black tie and ball gowns. The rest of the party is `party` on the map too: a crowd of 13 more dancers (`crowd`, in the Long Room and Front Square, who block the way like anyone else and each shout a line from `lines`), bunches of balloons tied to the hedges, walls and Campanile, confetti, coloured light beams sweeping the square and fireworks overhead. Everyone at a party dances on the beat (`dance` in components/story/partyfx.ts), except a trainer on the lookout or whoever you're talking to. Michael D, Alex Simonin and the B&S rematch are there as before. Carl Ryan, a very tall man (the `tall` style, drawn 1.22× as big) in black tie with a Blue Ghost blue bow tie and a blue sports bag, stands east of the Campanile and sells Blue Ghosts (+1 level) at €480, a tenth of the Vapes price, from his own stall (`{ do: 'shop', stall }`). He's the man who was selling them out of a sports bag in Temple Bar.

**Paul Mescal (Dublin).** A route trainer on the south side of Dublin, past Temple Bar, in a white T-shirt, tiny navy GAA shorts and socks pulled up, with a moustache, a frown and a tear on his cheek (2D and 3D). Before the battle he tells you he's an Academy Award nominated actor, really attractive and really rich, and yet really, really sad. He has Paulimon 42, Skehemon 43 and Robinmon 43 (Pauliwrath, Skehdinja and Robinsey by then), Easy AI and €860, like the other Dublin street trainers; a Lv42 party from the Dublin grass beats him over 99% of the time in the simulator. Beat him and he's even sadder, says “Look over there!” and runs off east, out of sight (the `flee` script step: whoever on the map is hidden by its flag runs off, then the flag is set). He's gone for good after that (flag `mescal:gone`). He's Dublin's ninth person; the Rave Cave's bouncer is the tenth (maps can place a tenth with the marker `0`).

Sibeal stands by the road in Limerick with her black and white dog, Norm. Say yes and Norm comes with you (flag `norm:with-you`): he walks behind you in place of your lead Ranemon, in 2D and 3D, and he never fights, so the party doesn't change. Each step there's a 1 in 150 chance that "Norm found something!" and you get an item, mostly pints, tea and chicken fillet rolls, now and then a Mulligan's or, rarely, a Blue Ghost (`NORM_FINDS` in lib/story/norm.ts). While you have him, Sibeal waits in every McGrattans; talk to her there to give him back, and she's back in Limerick if you want him again. Norm is just a flag, so he's kept in saves and save codes with no schema change.

**The Limepass (Limerick).** The Lime rep, in a lime hi-vis by the gym, signs you up for a Limepass (key item, flag `limepass`). It does two things. You can ride a Lime e-bike, drawn in 2D and 3D as a lime green step-through bike with a black basket: hold B to go twice as fast, just like the High Nelly, which is drawn as a black roadster if you only have that. And LIMEPASS appears on the START menu: pick any town you've been to and you're dropped outside its McGrattans (`limeStops` in lib/story/limepass.ts). It's just a flag, so saves need no change.

**Town Map.** START → MAP, a tap on the place name at the top of the screen, or the M key opens a flat map of Ireland in the 5th generation's style. The road runs Clare to Dublin through all ten stops; visited towns are red and the rest grey, a gold star marks each jersey won (Dublin's star is the championship), and a blinking red cap shows where you are (rooms count as their town, Trinity as Dublin). Left and right step through the towns, showing each one's county and gym. It never shows landmarks, so the legend stays hidden.

**Field gates** (what stops you skipping ahead): flooded bog roads need Wellies, rivers need the Currach, a flock of sheep blocking the road into Laois moves only after the Tipperary jersey, and the Trinity Front Gate needs all 9 jerseys. Gating is by key items rather than field moves, so battle moves stay battle-only.

## Core mechanics

### Levels and stats

Stats use the main-series formula without IVs or EVs. At level 50 it gives exactly today's numbers (HP = base + 60, others = base + 5), so the battle game's balance carries over untouched.

```
stat = floor(2 × base × L / 100) + 5
HP   = floor(2 × base × L / 100) + L + 10
```

The damage formula's fixed 22 becomes (2L/5 + 2), which is 22 again at level 50. Levels run 5 to 60.

### EXP

- Every Ranemon uses one growth curve: total EXP to reach level L is L³ (the main series' Medium Fast). All 16 have the same 400 stat budget, so one curve is fair.
- A win gives floor(140 × foe level ÷ 7) EXP, ×1.5 against a trainer, split between the Ranemon that fought.
- The Round (key item from Kilkenny) gives every party member who didn't fight half that amount too.
- Exp Share (a START menu option, off to begin with and kept in the save) gives every party member still standing the same EXP as a fighter. While it's on, The Round makes no difference.
- Reaching level 5 → 12 takes about 20 wild battles, matching the pace of the early games.

### Moves

Each Ranemon learns its 4 moves from the battle game in this order: its weakest attack and its special move at level 1, then the other two at 12 and 20. Every Ranemon is itself from the first fight.

On top of those, each line learns 6 **sport moves** at levels 8, 16, 25, 33, 42 and 50 (`lib/story/learnsets.ts`). There are 36 of them, 6 for each of soccer, rugby, padel, golf, video games and F1 (`lib/battle/sports.ts`), spread over all six types. Every line gets a strong attack of its own type among its six, and evolved forms learn their line's moves. Battle mode doesn't use them, so its balance is untouched.

A Ranemon fights with 4 moves at a time. A move learnt with all 4 slots full waits ("Swap it in from PARTY"): in PARTY, tap a member, tap one of its moves, then tap a learnt move to swap it in with full PP. Wild and trainer Ranemon fight with their special move and the 3 latest they've learnt. Saves from before sport moves catch up on load without going over 4.

Aoife plays on Hard AI and Commandant Dee's supporting Ranemon are 2 to 3 levels lower than before, to keep both gyms inside the 45% to 90% band now that both sides have sport moves.

### Catching with a pint of Guinness

In a wild battle, BAG → a pint throws it instead of attacking. The Ranemon takes up to 3 sips; it befriends you if it finishes the pint, or pushes it away and the battle carries on. The chance follows the main-series formula, simplified to one roll shown as 3 sips:

```
p = min(1, (3 × maxHP − 2 × HP) × rate × pint × status / (3 × maxHP × 255))
```

- rate is 120 for most species and 45 for the rarer ones (Gibbsmon, Thilomon, Oismon, Olliemon).
- pint is the pint's multiplier (see Items). status is 2 when asleep, 1.5 when Flustered or Hangry, 1 otherwise.
- At full health with a plain pint, a common Ranemon is befriended about 16% of the time; at 1 HP, about 47%.
- Throwing a pint in a trainer battle is refused: "That's someone else's Ranemon. Get your own round in."

### Party of 6 and the Group Chat

The party holds 6. A 7th catch goes to the Group Chat, the storage box, reachable from any pub. Duplicates are allowed and can be nicknamed. If your whole party faints, you wake in the last pub you visited and pay half your money for the bar tab.

### Blue Ghosts

A Blue Ghost raises one Ranemon by exactly 1 level, with its EXP set to the start of that level and any move it learns on the way. There are 20 in the game: 12 hidden on the map (sparkling tiles, often behind a landmark), 2 from the Meath gym, 4 as NPC rewards, and 2 sold only at the Temple Bar shop at €4,800 each.

### Following Ranemon

The first healthy Ranemon in the party walks one tile behind the player, taking exactly the tiles the player just walked. It turns to face the player when you stop, hops when it levels up, and talking to it shows a mood line from its Ranedex entry. It hides indoors in small rooms and on the Currach, and reappears outside.

## Wild encounters and difficulty

Every one of the 16 can be caught on the main route, each in a place that suits them. Wild Ranemon appear in long grass, bog and festival crowds: 1 step in 10 starts a check, and the Hi-Vis Vest stops encounters with anything below your lead's level for 200 steps.

| County    | Wild levels | Encounters (chance per encounter)                    | Easter egg                                                                      |
| --------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| Clare     | 2–6         | Endamon 35%, Lorcamon 30%, Simomon 25%, Owemon 10%   | Owemon only on the Shannon Airport apron: US military planes refuel there       |
| Limerick  | 7–11        | Jammon 35%, Boydemon 25%, Lorcamon 25%, Hugomon 15%  | Boydemon trains at a boxing club by the Treaty Stone                            |
| Tipperary | 11–15       | Carlmon 40%, Conemon 35%, Killemon 25%               | Conemon trains too hard on the Semple pitch, alone, after everyone's gone       |
| Kilkenny  | 15–19       | Endamon 40%, Robinmon 35%, Steadmon 25%              | Robinmon filming content on the castle lawn                                     |
| Laois     | 19–23       | Killemon 35%, Thilomon 25%, Oismon 20%, Olliemon 20% | Thilomon plays B2B in the dance tent; Oismon and Olliemon only appear backstage |
| Offaly    | 23–27       | Simomon 40%, Steadmon 35%, Hugomon 25%               | Simomon "blazing up" in a quiet corner of the bog                               |
| Westmeath | 27–31       | Lorcamon 30%, Carlmon 25%, Robinmon 25%, Conemon 20% | Lorcamon at Sean's Bar gives you a Guinness 0.0                                 |
| Meath     | 31–35       | Steadmon 30%, Jammon 30%, Simomon 25%, Endamon 15%   | Jammon demanding a refund at the Navan shop counter                             |
| Kildare   | 35–39       | Owemon 40%, Boydemon 40%, Gibbsmon 20%               | Gibbsmon is first found at the Curragh camp, calling in bombers                 |
| Dublin    | 40–46       | All 16, 4–8% each; Gibbsmon and Thilomon 3%          | Steadmon in a Ranelads.com internet café off Dame Street                        |

### Difficulty curve

The target is that a player who catches as they go, without grinding, arrives at each gym 1 to 2 levels under the leader's ace and wins with sensible type choices. Each gym ace is 4 levels above the last (12 to 44), wild Ranemon trail the next gym by about 6 levels, and route trainers sit between the two.

- **Gym AI**: gyms 1–3 use the Easy CPU, 4–6 Normal, 7–9 and the Trinity scholars Hard. B&S uses Hard and holds 2 Full Irish.
- **Rival**: always 2 levels above your highest at the time, with the type that beats your starter.
- **Tuning**: extend `pnpm simulate` with a route simulator that plays a party through the expected encounters and checks each gym's win rate sits between 55% and 80% for a typical party.
- **Endgame**: B&S's team at 50 to 55 lines up with the battle game's level 50, so story teams and battle-mode teams stay comparable.

## Items

Money is euro, won from trainers (leader's ace level × €40, route trainers × €20) and spent at Vapes, the corner shop in each town. Items used in battle take your turn, like a switch. Vapes only work in battle: each raises one stat of the Ranemon that's out by a stage (up to +3), and it wears off when the battle ends or it switches out.

| Item                | Kind   | Effect                                                      | Where                         | Price    |
| ------------------- | ------ | ----------------------------------------------------------- | ----------------------------- | -------- |
| Pint of Guinness    | Catch  | ×1 catch rate                                               | Every shop                    | €200     |
| Well-Settled Pint   | Catch  | ×1.5                                                        | Shops from Tipperary          | €600     |
| Mulligan's Pint     | Catch  | ×2                                                          | Shops from Westmeath          | €1,200   |
| Guinness 0.0        | Catch  | ×4 on Lorcamon, ×1 on others                                | Lorcamon at Sean's Bar, x3    | Not sold |
| The Perfect Pour    | Catch  | Always works                                                | St James's Gate, one only     | Not sold |
| Blue Ghost          | Level  | +1 level                                                    | Hidden, NPC gifts, Temple Bar | €4,800   |
| Chicken Fillet Roll | Heal   | +30 HP                                                      | Every shop                    | €300     |
| Spice Bag           | Heal   | +80 HP                                                      | Shops from Kilkenny           | €700     |
| Full Irish          | Heal   | Full HP and cures status                                    | Shops from Meath              | €2,500   |
| Cup of Tea          | Status | Cures Flustered                                             | Every shop                    | €150     |
| Curry Chips         | Status | Cures Hangry                                                | Every shop                    | €150     |
| Can of Monster      | Status | Wakes from Asleep; Oismon and Olliemon also get +20% Attack | Every shop; Oismon gives x5   | €200     |
| Hair of the Dog     | Revive | Revives at half HP                                          | Shops from Laois              | €1,500   |
| Mammy's Dinner      | Revive | Revives at full HP                                          | Gifts only, x3                | Not sold |
| Club Orange         | PP     | +10 PP to one move                                          | Shops from Offaly             | €1,000   |
| Hi-Vis Vest         | Field  | No weaker wild encounters for 200 steps                     | Shops from Limerick           | €350     |
| Taxi Home           | Field  | Back to the last pub                                        | Every shop                    | €550     |
| Watermelon Ice      | Vape   | Defense +1 stage in battle, on the Ranemon that's out       | Shops from Limerick           | €500     |
| Blue Razz           | Vape   | Speed +1 stage in battle                                    | Shops from Limerick           | €500     |
| Cherry Cola         | Vape   | Attack +1 stage in battle                                   | Shops from Limerick           | €500     |
| Mango Tango         | Vape   | Spirit +1 stage in battle                                   | Shops from Limerick           | €500     |

**Key items** (never used up): Ranedex, Group Chat (storage, at pubs), High Nelly bike (double speed), Wellies (bog roads), The Round (EXP share), Currach (water), Ordnance Survey map (fly to any visited pub), and the 9 county jerseys shown on the trainer card. **Pubs** (every one is called McGrattans) do what Pokémon Centres do: the barman heals the party for free and the Group Chat is on the wall.

## Overworld, tiles and sprites

The overworld is a 16×16 pixel tile grid drawn at whole-number scale, showing 10×9 tiles (160×144, the original handheld screen) above an on-screen D-pad and A/B buttons on a phone held upright. Arrow keys, Z and X work on a keyboard. Movement is one tile per step at 4 steps a second, 8 on the bike.

**Map count.** About 10 outdoor county maps (one town and one or two routes each, roughly 60×40 tiles), plus about 35 small interiors: 9 gyms, 10 pubs, 10 shops, Michael D's farmhouse, your house, the Long Room and a few landmark rooms. Interiors share most of their tiles.

| Tile set    | What it needs                                                                                 | Used in                            |
| ----------- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| Countryside | Grass, long grass (encounters), dry-stone walls, hedges, gates, dirt roads, sheep             | Every county                       |
| The Burren  | Limestone pavement, cliff edges, sea, wildflowers                                             | Clare                              |
| Water       | Shannon river, loughs, shore edges (animated, 2 frames), Currach dock                         | Clare, Limerick, Westmeath, Offaly |
| Bog         | Bog (encounters), turf stacks, boardwalk                                                      | Offaly, Tipperary road             |
| Town        | Painted shopfronts, pub, corner shop, houses, church, round tower, castle walls               | Every town                         |
| Landmarks   | Rock of Cashel, Kilkenny Castle, festival stages, Newgrange mound, Campanile and Front Square | One each, as set pieces            |
| Interiors   | Wooden floor, bar counter, snug, shelves, stage, scriptorium desks, army barracks             | Pubs, shops, gyms                  |

**Sprites.**

- **Player**: 16×16, 4 directions × 3 frames (stand, two steps), plus a bike set. Male and female versions if wanted (open question).
- **Followers, all 16 Ranemon**: 4 directions × 2 frames. Walk cycles can't be cut from photos, so each one is a chibi: the head from the existing photo sprite (already made by `scripts/make_sprite.py`) on a small shared body tinted with the Ranemon's `colour`. A script makes all 16, and any Creature Studio additions, automatically.
- **NPCs**: Michael D (with his dog), the rival, 9 gym leaders, 3 scholars, B&S, about 12 generic townspeople and trainers (hurler, festival-goer, monk, soldier, student, barman).
- **Battle sprites**: the existing ones, plus a back view for the player's side and a trainer portrait for each leader and B&S.
- **B&S**: an overworld group sprite and a battle portrait made from the group photo on page 7 of the Ranemon sheet.
- **Effects**: pint throw arc, 3 sip frames, befriend sparkle, Blue Ghost sparkle tile, grass rustle, exclamation bubble when a trainer spots you.

**Ranedex pages.** Tap a Ranemon in the Ranedex, or move to it with the D-pad and press A, for its page; ◀ and ▶ (or left and right) flip to the next one you've seen, A flips through its looks, up and down scroll, and B goes back to the list. A page only shows what you've come across (`src/lib/story/dex.ts`): unseen Ranemon can't be opened and are ????? in evolution lines, a Ranemon seen but not befriended shows only its picture, types, matchups, evolution line and where it's found, places you haven't been are ?????, a second special move is ??? until one of its line has learnt it, and its shiny look shows only while you have one. Petchemon and Poseidon still have no page.

**Text and UI.** Dialogue box in Press Start 2P, matching the battle screen. Start menu: Ranedex, Party, Bag, Jerseys, Save, Options.

## Technical architecture

Story mode lives in the same Next.js app at `/story`, still a static site on GitHub Pages. The rules stay in pure TypeScript with no I/O, as the battle engine does today; React draws the menus and battle screen, and one `<canvas>` draws the overworld.

### Reusing the battle engine

The battle engine (`src/lib/battle/`) needs five small, backward-compatible changes. Battle mode keeps calling it exactly as now, and every existing test and the 5,000-battle simulation must still pass.

1. **Levels.** Add `level` to the battler (default 50). `levelStats(base)` becomes `levelStats(base, level)`, and `computeDamage` uses (2L/5 + 2) in place of 22. Both give today's numbers at 50.
2. **Carry-over state.** `startBattle` accepts an optional starting HP, PP and status per battler, and the finished `BattleState` already holds what the story layer copies back to the party.
3. **Move lists by level.** A battler's moves come from its learnset at that level (1 to 4 moves), not always the creature's 4.
4. **Bag action.** Add `{ kind: 'item' }` to `Action`. The engine treats it as the turn spent, ordered like a switch, and emits an `item` event. The story layer applies the item (heal, cure, pint) between turns.
5. **Wild battles.** Side 1 is one Ranemon with no trainer. RUN works (the main series' speed-based escape odds), and a successful pint ends the battle with a new `befriend` result. Helping Hand's wild-partner rule already fits.

The CPU (`cpu.ts`) is reused as-is for wild Ranemon (Easy) and trainers (per the difficulty curve). `BattleScreen.tsx` gets a BAG button and an EXP bar on the player's info box; the rest is shared.

### New modules

| Module                                                                        | Pure TS? | What it does                                                                |
| ----------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `src/lib/story/party.ts`                                                      | Yes      | Party and Group Chat, EXP, level-ups, learnsets, Blue Ghosts                |
| `src/lib/story/catch.ts`                                                      | Yes      | Befriend chance and the 3-sip roll from a seed                              |
| `src/lib/story/encounters.ts`                                                 | Yes      | Encounter tables per map area; step checks; Hi-Vis Vest                     |
| `src/lib/story/items.ts`                                                      | Yes      | Item list, prices and effects                                               |
| `src/lib/story/world.ts`                                                      | Yes      | Player position, facing, follower trail, flags (jerseys, pickups, trainers) |
| `src/lib/story/script.ts`                                                     | Yes      | A tiny event script runner: say, give, battle, move NPC, set flag, if flag  |
| `src/lib/story/save.ts`                                                       | Yes      | Serialise, version and migrate the save                                     |
| `src/content/story/`                                                          | Data     | Maps (Tiled JSON), NPC scripts, trainer teams, encounter tables, learnsets  |
| `src/components/story/Overworld.tsx`                                          | No       | Canvas renderer, camera, input, 60 fps loop with fixed 4 Hz steps           |
| `src/components/story/Dialogue.tsx`, `Menu.tsx`, `Bag.tsx`, `PartyScreen.tsx` | No       | The menus                                                                   |

Maps are drawn in [Tiled](https://www.mapeditor.org/) (free) and exported as JSON with layers for ground, objects, collision, encounters and triggers. Keeping rules, content and drawing apart means the story's logic can be tested in Vitest without a browser, as the battle engine is.

### Save system

- Saved in `localStorage` under `ranemon.story.v1`, the same way the win/loss record is kept today, with every read and write guarded for private windows.
- Autosaves on every map change and after every battle; SAVE in the menu saves on the spot. One save slot, plus Export and Import as a copyable code so a run survives a cleared browser or moves to another phone.
- Each save carries a `version` number, and `save.ts` migrates old saves forward so content updates never wipe a run.
- Holds: player name, map and position, party and Group Chat (species, nickname, level, EXP, HP, PP, status), bag, money, flags, Ranedex seen and caught, play time, and an RNG seed so a reloaded battle plays the same way.
- When accounts arrive, the same JSON syncs to the server with no format change.

## Implementation plan

Six phases, each its own pull request or small set of them, starting once the battle game is done. Each ends with something playable on a phone, and the first two prove the hard parts before any county content is built.

1. **Engine prep.** Levels, carry-over HP/PP/status, learnsets, the item action and wild battles (the five engine changes). Battle mode unchanged; existing tests and the simulator still pass, with new tests at levels 5, 20 and 50.
2. **Clare vertical slice.** `/story` with the canvas overworld, D-pad, one Clare map, dialogue, Michael D and the starter pick, the follower, long grass, pint catching, EXP and level-ups, the pub heal and the save. Done when a new player can pick a starter, catch 2 Ranemon and save and reload.
3. **Systems.** Bag, shop, money, Group Chat, trainers who spot you, the rival, blackout, Blue Ghosts, the Ennis gym and the Clare jersey. A Playwright test plays from the farmhouse to the Clare jersey.
4. **Counties 2 to 5.** Limerick, Tipperary, Kilkenny and Laois with their gyms, key items and the Lads on Tour thread. Add the route simulator to `pnpm simulate` and tune levels.
5. **Counties 6 to 9 and Dublin.** Offaly to Kildare, Dublin, Trinity, the scholars, B&S and the ending. Full-run balance check.
6. **Polish.** Sound and music, map transitions, follower moods, post-game B&S rematch, Ranedex completion, and an export code to bring your story team into battle mode.

## Open questions for Rich

The plan above uses the default in brackets for each until Rich says otherwise.

1. **Who are B&S?** The photo on page 7 of the Ranemon sheet shows 7 lads. Is B&S one person, a pair, or the whole group? (Default: a trainer whose 6th Ranemon is a unique B&S boss creature drawn from that photo, with its own special move to be named by Rich.)
2. **Only the 16 friends as species?** That means seeing the same faces a lot over 10 counties. (Default: yes, 16 plus anyone added through Creature Studio. Alternative: 10 to 20 extra wild-only Ranemon.)
3. **Is the route right?** Clare, Limerick, Tipperary, Kilkenny, Laois, Offaly, Westmeath, Meath, Kildare, Dublin. Any county in or out, or a gym leader who should be one of the lads?
4. **Who is the player, and who is the rival?** (Default: an unnamed trainer from Clare you name yourself; the rival is a mate from the village. Conemon's entry says "Rich tries too hard", so the rival could be a cameo instead.)
5. **Michael D and Guinness by name.** Fine while the game is private among friends, like the photo sprites. If it ever goes public, the President's likeness and the Guinness and Mulligan's names would need changing. (Default: keep them; repo stays private.)
6. **Can you catch B&S after beating them?** (Default: no, but they rematch at level 60 in the post-game.)
7. **Story team in battle mode?** (Default: yes, in phase 6, as an import into team select at level 50.)
8. **Lads on Tour villain thread: keep or cut?** (Default: keep, but it is the first thing to cut if time is short.)
