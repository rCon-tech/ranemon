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

**The bigger counties (2D only).** Each county map grows east and south to 40 tiles wide (Dublin to 56), with the county's famous places and local legends (`src/content/story/legends.ts`). The old map stays exactly where it was in the top left, so every save, door, person and test spot lines up; only its east border opens, and the Garda and the way out move to the new east edge. New doors come after the old ones in reading order, so rooms keep their ids (`clare-L0` is still Michael D's farmhouse). Expanded counties are `flat`, so they draw in 2D with the 3D look picked. New 2D tiles: `R` rock (boulders on their own, crags and mountains when side by side, on grass, sand, limestone or the sea), `q` castle stone with arrow slits and `u` battlements on top (a door set into either has stone round it), and `j` a slate roof for churches and big houses in a red-roofed town. Gifts from the new people and places are given once each (`gift:` flags). Done so far:

- **Clare**: Bunratty Castle and Folk Park with Durty Nelly's, the Shannon estuary, the Burren's limestone and flowers with Poulnabrone Dolmen and Aillwee Cave, O'Brien's Tower on the Cliffs of Moher, Lahinch beach, Doolin's trad session and Willie the matchmaker in Lisdoonvarna. Legends: Biddy Early's blue bottle, and Mal the hag who chased Cú Chulainn to Hag's Head. New trainers: Surfer Aoife and Fiddler Tomás (Lv6 to 7).
- **Limerick**: the Treaty Stone, St Mary's Cathedral, the Milk Market, King John's Castle in stone, thatched Adare with Adare Manor, Lough Gur and the Grange Stone Circle, and the Foynes Flying Boat Museum, where Irish coffee was invented. Legend: Gearóid Iarla asleep under Lough Gur. New trainers: Poet Nuala, who battles in limericks, and Munster Fan Rory (Lv10 to 11).
- **Tipperary**: the Hayes Hotel where the GAA was founded, Holy Cross Abbey, the Devil's Bit, the Rock of Cashel in stone, Cahir Castle on the Suir, the Swiss Cottage, the Galtees and the Glen of Aherlow. Legends: the devil's bite that became the Rock of Cashel, and Fionn's race up Slievenamon. New trainers: Camogie Star Siobhán and Angler Mick (Lv14 to 15).
- **Kilkenny**: the River Nore with two bridges, St Canice's Cathedral and its round tower, Kyteler's Inn, Smithwick's, the Medieval Mile, Dunmore Cave, Jerpoint Abbey and Inistioge. Legends: the Kilkenny cats, and Dame Alice Kyteler, Ireland's first witch trial. New trainers: Hurler Eoin and Kayaker Órla (Lv18 to 19).
- **Laois**: the Rock of Dunamase on its crag, Emo Court, Morrissey's of Abbeyleix and the Slieve Bloom Mountains. Legends: Bladhma hiding in the Slieve Bloom, and St Fintan's tree full of coins. New trainers: Steam Rally Seán, Glamper Ciara and Footballer Darragh (Lv22 to 23).
- **Offaly**: Birr Castle and the Leviathan telescope, Tullamore D.E.W., Lough Boora, the Bog of Allen, Leap Castle, Charleville Castle and Moneygall. Legends: the ship in the sky over Clonmacnoise, Old Croghan Man in the bog, and the Elemental of Leap Castle. New trainer: Astronomer Niamh (Lv26 to 27).
- **Westmeath**: Mullingar's Cathedral of Christ the King, Belvedere House and the Jealous Wall, Locke's Distillery, Lough Derravaragh, the Hill of Uisneach and Fore Abbey. Legends: the Children of Lir, and the Seven Wonders of Fore. New trainers: Showband Fan Bernie and Pike Angler Dara (Lv30 to 31).
- **Meath**: the Boyne, the Hill of Slane, Trim Castle, Kells, Knowth, Loughcrew's cairns and the Boyne battle site. Legends: the Salmon of Knowledge, the Lia Fáil on Tara (ask to touch it), and the Cailleach of Loughcrew. New trainers: Reenactor Fiachra and Archaeologist Gráinne (Lv34 to 35).
- **Kildare**: Kildare Town and St Brigid's Cathedral, the Irish National Stud, Castletown House, the Hill of Allen, the Grand Canal and Punchestown. Enda still stands in the road right in front of the Garda, now at the new east edge, with the fence beside him. Legends: Brigid's cloak over the Curragh, the devil at Castletown, and the Fianna asleep under the Hill of Allen. New trainers: Jockey Aisling and Punter Gerry (Lv38 to 39). Dublin is still the biggest map by area.
- **Dublin**: now 56 × 38, with Croke Park (stands and pitch), Dublin Bay with the Poolbeg chimneys and Bull Island on the east, and a new south side: Kilmainham Gaol, St Michan's, St Patrick's Cathedral, the James Joyce Tower and the Forty Foot, the Brazen Head, Howth Castle and Molly Malone. Dublin already has its ten people, so its legends are behind the new doors and on the signs: the Crusader in St Michan's vaults, “chancing your arm” at St Patrick's, and Grace O'Malley's extra place at Howth. The porter and the way to Trinity move to the new east edge. Paul Mescal still runs out of sight, though no longer to the edge of the map.
- **Wicklow** (Greystones, `greystones.ts`): Greystones grows south down the coast to 24 × 31, sea still to the east: Wicklow Gaol, the Sugarloaf, Powerscourt, Lough Tay and Glendalough. Legends: the Guinness Lake, and St Kevin and the blackbird. New trainer: Hillwalker Saoirse (Lv48 to 50).
- **Donegal** (Bundoran): Glenveagh Castle, Errigal, the Grianán of Aileach, Donegal Castle, a kitchen where the kettle is never off, and the Fairy Bridges with the Wishing Chair (ask to make a wish), up the coast towards Slieve League. Legends: Balor of the Evil Eye, and the army asleep under the Grianán. New trainers: Climber Eunan and Fiddler Gráinne (Lv48 to 50).

**HM Neurodivergent.** The Semple Stadium gym door has a pattern lock. The old man by the gym, a retired donkey vet, asks five yes or no questions loosely after the screening ones (small sounds, library or disco, number plates and patterns, getting back on track after an interruption, one big interest). Every answer gets a friendly reply and none is wrong. Then he certifies you with Donkey Brains and hands over the HM, which opens the door and can be used from the bag's key items to count everything on the map, Blue Ghosts included. The joke is the donkey vet and the certificate, never the player.

**The legend (late game, Dublin).** An old woman on the quays, a busker by the Phoenix Park and the barman in Temple Bar each give a coral bead, in that order, while telling the story of a Ranemon older than the city that nobody has seen in years. Nobody says his name. With all three beads the boarded-up Hellfire Club opens, and inside stands a figure in cream robes with a gold-topped staff, shown only as ??? until the battle starts. He is Tobymon (Brains/Charm, base 480, signature move Staff of Ages: 80 power, raises his Spirit by 15%), a wild battle at level 50 on hard AI. He can be befriended with a pint but only rarely: worn down to 1 HP and asleep, a Mulligan's Pint works about 1 time in 7, and the Perfect Pour always works. Running or winning leaves him there to try again. He is in the Ranedex as ????? until met, never appears in the wild or in battle mode, never evolves, can be shiny, and his sprite carries a gold legendary glow. He was base 520 (105/80/105/125/105) with a 90 power, +30% Staff of Ages until players found he swept the post-game alone: Brains/Charm has no weakness, so a party led by him beat DJ Vandenbass every time against about 1 in 6 without. At 100/80/95/115/90 he beats an evolved Ranemon one on one about 3 times in 4 (the best of the rest about 2 in 3), and a party at the ace's level led by him beats the DJ about 38% and the B&S rematch about 76% of the time.

**Dublin, the city.** Dublin is the biggest map on the road, 40 × 26 tiles against the counties' 24 × 13 or so, and the camera scrolls over it. The Liffey runs across the middle with three bridges. North of it are the Phoenix Park (long grass), St James's Gate, Vapes and O'Connell Street; south of it Temple Bar and McGrattans, the Hellfire Club, the rent house, a Georgian terrace, Silicon Docks, Connolly Station, the Rave Cave and a little of St Stephen's Green (long grass too). It looks like a city: slate roofs (`slate`), granite pavements (`v`) and tarmac roads with a dashed white line (`a`), with parked cars on them, and grass only in the parks. Every door it had is still there, in the same reading order, so the rooms behind them (`dublin-L2` and so on) are unchanged. Saves from before the bigger map (schema 2) are moved on load to the step in front of the nearest door they were standing by on the old map (`toNewDublin` in `save.ts`).

**The Rave Cave (Dublin).** The fourth `L` in Dublin, by the south edge, with a bouncer on the door: a basement where the party never stops (`src/content/story/rave.ts`). Inside, a DJ plays behind the booth at the back and nine trainers dance on a floor of coloured squares that change on the beat (indoor tile `l`, walkable; `k` is the black floor round it, `o` the brick back wall with a neon tube and `I` a speaker stack). Dancers (`dances` on a person) turn about and hop on the beat in 2D and 3D, and stop to face you when you talk to them. None of them jumps you: you pick who to battle. They get harder from the door to the DJ, from Raver Aoife (Lv42 to 43, Easy) to Rave Legend Mossy (Lv56 to 58, Hard), and pay the usual 20 euro a level of their best, every time. Once you've beaten one, talking to them asks whether to battle again, and they always say yes, so it's the place to train up. A battle started from a script now checks the party can fight first, as talking to a trainer always did. In the simulator a Lv46 party from the Dublin grass nearly always beats the first six and rarely the last three; a Lv54 party beats Mossy about three times in four.

**Connolly Station (Dublin).** Every train out of Dublin leaves from one place: Connolly Station, the door at the bottom left of the map (the third `L`). Inside, the clerk at the ticket desk opens the departures board (the `departures` script step), which lists every line by platform; pick one and the ride runs. Each running line's staff also stand on the platforms and ask whether you're getting on, and whoever runs it at the far end brings you back onto the concourse. The board on the wall (indoor tile `D`) reads the same list. The lines are data in `src/content/story/station.ts` (`DEPARTURES`): a running line gives its map, where you get off, its staff, what they say, the ride and the first-visit line, and the way home. A line marked `soon` shows as COMING SOON and can't be bought; one with a `lock` shows as NOT YET and says why until its flag is set. To add a destination: build its map, add a `Departure`, and put `homeward(id)` on the person there who runs the train back. Today: platform 1 the DART to Greystones, platform 2 the Intercity to Bundoran, platform 3 the Sail & Rail to Brighton (locked until you say yes to Enda), platform 4 the Eurostar to Ghent (locked until you say yes to Cramps), and platforms 5 and 6 (the Enterprise to Belfast and the Intercity to Galway) coming soon. Jamie Boyde stands on the concourse by the benches, in the rugby kit of Boydemon's second look (`boyde.ts`). He's a one-line gag with no battle: he asks whether he should put this pill in his ass, and whatever you answer, he does it anyway.

**Poseidon (side story, Donegal).** The conductor on platform 2 at Connolly Station (below) runs the Atlantic Coast Express to Bundoran, Co. Donegal, and one there brings you back to Connolly. Josh Lee, who surfs Bundoran all year, says a god lives out on the rocks by Tullan Strand and gives you his tablet: take it there and then, or later from the bag's key items. Once it's taken (it leaves the bag), Poseidon appears on the rocks: a hard boss on Hard AI with Jammon 55, Simomon 55, Olliemon 56, Owemon 56 and Poseidon himself at 60 (Chill/Brawn, base 505, his own move Trident). A party of six Lv54s beats him about 30% of the time in the simulator. The prize is €7,000 and 3 Blue Ghosts. Poseidon can't be caught and isn't in the Ranedex. Bundoran has its own McGrattans and Vapes, and long grass at Lv46 to 52. Once you've been, the Town Map shows Donegal, with the railway line from Dublin.

**The missing rent (side story, Dublin).** A new house on the south bank, past Temple Bar, is shared by Ollie (very French), Simo and their housemates MC (a small Irish girl) and Melchior (King of France). The rent money is gone from the biscuit tin. Ollie starts it; then three clues, each of which points at both suspects, come from Simo (half a croissant and a Tayto by the tin), the neighbour outside (someone shouting “Sláinte!” or “Santé!”) and a Garda on the quays (tiny fingerprints with ring marks). With all three you can accuse MC or Melchior, once, and must battle whoever you pick (Normal AI, three Ranemon at Lv43 to 47, €1,100). Lose and you face the same one again. Win and they only say “This changes nothing, you’ll still never find out who took the cash!”, and Simo gives you 2 Full Irish. The culprit is never revealed.

**Greystones and the Happy Pear Twins (side story, Wicklow).** The DART driver on platform 1 at Connolly Station takes you south along the coast to Greystones, Co. Wicklow, and one at Greystones station brings you back to Connolly. Greystones is the richest town in Ireland and looks it: slate roofs on every building (`slate` on the map), cabbage palms (`p`), a sandy beach (`d`), yachts in the marina (`y`) and jeeps in the car park (`c`), all drawn in 2D and built as models in 3D. Kill (blond, sure he'll be forced to move to Africa), Stead (in an England shirt, insists he's British) and Cramps (a DJ in headphones) each complain about the terrible rule of the Happy Pear Twins. Talking to any of them, or to the waiter in the Happy Pear café, sets `greystones:heard`, and the twins appear on the beach. Talk to either twin to battle Dave and then Steve back to back, with no healing between (Hard AI, three each at Lv52 to 56, €3,000 each). Lose to Steve and Dave stays beaten. A party of six Lv52s beats Dave about 90% of the time and both about half the time in the simulator. Steve's reward is the Vegan Stone. Greystones has its own McGrattans and Vapes, a cyclist in lycra, long grass on the golf course at Lv46 to 52, and joins the Town Map once visited, with a railway line from Dublin.

**Nick and Nickamon (side story, Clare).** Nick stands by the beach on the road south in Clare (`src/content/story/nick.ts`, `look: 'nick'`: dark hair, a dark beard, a white tee, black shorts, white trainers and a black backpack, from his photo), placed with `at` since Clare's ten markers are taken. He tells you he's the second most French man in Ireland before you ask, and to wait until you meet his brother (the brother isn't in the game yet). Say yes to battle him (`clare-nick`, Normal AI, Endamon Lv10 and Nickamon Lv12, €900). Beat him and his look is yours as the Nick skin. Clare is 2D only, so the battle is too. **Nickamon** (Charm/Chill, `roster.ts`) is one of the lads, cut from Nick's photo at home and drawn in Britain like the rest: his special move is Ooh La La, his second at Lv36 is Wait Till You Meet My Brother, and at Lv30 he evolves into **Nickoking** (Nidoking: a horn, big pointed ears, spikes and a tail; `costume` in `scripts/sprites.py` for the photo and `nickoking` in `scripts/drawn/costumes.py` for the drawing, where the base form holds a baguette). He's rare in Clare's long grass and in Dublin's, and in London's.

**Dr Bhav (side story, Greystones).** The Happy Pear café (Greystones' first `L`) has a room of its own, 2D only like the town: the twins' cousin behind the counter, and Dr Bhav at a table (`look: 'bhav'`: long dark hair, round gold-rimmed shades, a burgundy spaghetti-strap maxi dress drawn with the `maxi` style, gold bangles, earrings and platform sandals). She's a doctor and thinks Ranemon are stupid. Talk to her and say yes to battle her (`greystones-bhav`, Hard AI, three at Lv50 to 53, €2,400). Beat her and she admits she's a big idiot and Ranemon is amazing, gives you Xanax, and her look is yours as the Dr Bhav skin. **Xanax** is a held item for any Ranemon that keeps it chill: Spirit up 20% in every battle, and it can't be Flustered (`calm` on the `hold` item, then on the battle entrant and battler, so a Fluster from any move fails against it).

**Held items.** A Ranemon can hold one item (`held` on a party member, kept in saves and save codes; an item a build doesn't know is dropped on load). The first was the **Vegan Stone**: from the BAG, give it to Conemon or Conix (any Ranemon of the `conemon` line) to hold, and its Attack is multiplied by 1.2 for every battle, switching out included (`held` on the battle entrant). Other Ranemon can't take it. PARTY shows what a member holds, with TAKE to put it back in the bag, and a ◆ by its name. Held items can't be used in battle.

**Alex Simonin (Trinity).** A trainer in Front Square, beside the path up to the Long Room, dressed head to toe in pink with love hearts all over, who only has eyes for Simomon: three Weezimo (Simomon evolved) at Lv45, 46 and 47, Hard AI and €1,880 like the scholars. A Lv45 party from the Dublin grass beats him about 77% of the time in the simulator, against 87% to 94% for the scholars. Every line he says, before the battle, each time he sends one out (the trainer's `line`) and when you talk to him after, is “How do we always end up here?”.

**The Trinity Ball (after B&S).** Once B&S are beaten (flag `champion`), Trinity is the Trinity Ball for good: the map's `after` form (`TRINITY_BALL` in content/story/ball.ts), which `mapFor` picks in place of the plain map once its flag is set. It keeps the same ground but has fairy lights strung over Front Square and the Long Room (`party.lights`, drawn in 2D and 3D), the pub's reel for music, party lines for the scholars, and revellers in black tie and ball gowns. The rest of the party is `party` on the map too: a crowd of 13 more dancers (`crowd`, in the Long Room and Front Square, who block the way like anyone else and each shout a line from `lines`), bunches of balloons tied to the hedges, walls and Campanile, confetti, coloured light beams sweeping the square and fireworks overhead. Everyone at a party dances on the beat (`dance` in components/story/partyfx.ts), except a trainer on the lookout or whoever you're talking to. Michael D, Alex Simonin and the B&S rematch are there as before. Carl Ryan, a big man (drawn 1.5× as big, the `big` style) in a stone-coloured blazer over an open white shirt, navy trousers, clubmaster shades and a moustache, with a blue sports bag, stands east of the Campanile and sells Blue Ghosts (+1 level) at €480, a tenth of the Vapes price, from his own stall (`{ do: 'shop', stall }`). He's the man who was selling them out of a sports bag in Temple Bar.

**Enda and the Brighton adventure (side story, Kildare and Brighton).** Enda (`src/content/story/enda.ts`) is a very small man with brown hair (drawn `tiny`, smaller than anyone else, in a blue jumper with little red hearts) who makes best friends with everyone he meets. He stands in the road on the Curragh, right in front of the Garda at the way out to Dublin, and a fence closes off the way round him, so nobody reaches Dublin without meeting him (`enda:met`). Until you've met him he also waves you over, with a line of text, every time you come into Kildare by road, train or Lime (the map's `arrive`, which outdoor maps now run on the way in), so a save coming back from Dublin, with him behind it, or arriving by Lime at the pub doesn't miss him either. He asks you on an adventure to Brighton with Ollie and Kill. Yes sets `enda:asked`; no is fine too. Either way he steps to the side of the road, where he stays for good, asking again until you say yes. Saves already past Kildare can walk back and find him, and the clerk at Connolly tells anyone who tries to book Brighton early to go and meet Enda in Kildare. Saying yes opens the Sail & Rail (platform 3 at Connolly, a `lock` on `enda:asked`): ferry to Holyhead, then trains to Brighton, England (`src/content/story/brighton.ts`). Brighton is a 24 × 16 seaside town: slate roofs, a station with the sailor who takes you home, McGrattans and Vapes, the Amex, the Royal Pavilion, the arcade, a beach, a pier out over the sea and long grass in The Level at Lv44 to 50. Enda, Ollie and Kill meet you off the train. The match is in the Amex (the first `L`, a room of its own: blue seats `n` and the pitch `x`, which you can't walk on). Two fans in the stands battle you on the way to the front row; talk to Enda there and the match plays out, Brighton beating Crystal Palace 2–1 in the 90th minute (`brighton:match`). Then a Palace fan turns up by the way out, and nobody leaves without a battle. The arcade (the third `L`, with arcade machines `m`) stays locked until the match is over. Inside, three gamers watch the ways through the machines, and the Arcade King (Hard AI, five Ranemon at Lv51 to 54, €5,000, boss music) waits at the back. Beat him and Enda hands you a Friendship Bracelet he made on the ferry (`brighton:done`): a held item for any Ranemon (a `hold` item with no `line`), Defense up 20% in every battle. In the simulator a Lv48 party from the Brighton grass beats everyone on the way most of the time and the King about a quarter of the time; at Lv52 it beats the King about 60% of the time. Battles in Brighton use the city backdrop and its music. Brighton sits in the corner of the Town Map, out to sea, once you've been. The developer save leaves the King and the end of the trip to play.

**Cramps and I Love Techno (after B&S, Dublin and Ghent).** Once B&S are beaten (`champion`) and you're back out of the Ball, Cramps, the DJ from Greystones, comes sprinting down the street at you the first time you're out in Dublin: to celebrate the win, the crew are going to I Love Techno music festival in Belgium (`src/content/story/cramps.ts`). He's on Dublin's `arrive`, which on a map outdoors runs every time you come onto it (by its edge, out of a door, off a train or a Lime, or loading a save there), with `if` steps so he only shows up once (`techno:met`). So nobody misses him, and saves already past the Ball meet him on their next walk out into Dublin. Yes sets `techno:asked`; no is fine too, and either way he waits on the Connolly concourse after, asking again until you say yes. The Eurostar to Ghent is platform 4 at Connolly (a `lock` on `techno:asked`; the clerk tells anyone early that Cramps is putting a guest list together), ferry, London and under the sea. Ghent (`src/content/story/techno.ts`) is a 24 × 13 town with slate roofs, the Eurostar host who takes you home, McGrattans, Vapes, Gravensteen, a park of long grass at Lv54 to 58 and Flanders Expo, the second `L`, whose door stays shut until the head of security is beaten. Security won't let anyone in: a fenced queue lane up to the door with three guards in it (Wouter and Ilse, then Head of Security Dirk on the door, all Hard AI with 3 or 4 Ranemon each), each placed so you can't get past without a battle, then Stage Security Bart inside, watching the whole floor between the way in and the decks. DJ Vandenbass waits behind them (Hard AI, six Ranemon at Lv56 to 60, €6,000, boss music). Beat him and he gives you the ten Blue Ghosts on his rider (`techno:done`), and the hall becomes I Love Techno: the room's own `after` form (rooms can have one now, and going through a door picks it with `mapFor`), with a dancing crowd, laser strings, balloons and party lines. The hall plays its own techno track (`techno` in songs.ts) before and during the festival. In the simulator a Lv56 party from the Ghent grass beats the guards 83% to 96% of the time, and a Lv58 party beats the DJ about 33% of the time. At each one's ace level, a party wins 85% to 94% against the guards and about 66% against the DJ (`tests/sim/postgame.test.ts`). The guards, the DJ and the B&S rematch carry Hugengar or Vinnisaur, which stand up to Tobymon (see the legend). Ghent and the Expo are 2D only for now (`flat` on the map): with the 3D look picked, the map and its battles draw in 2D. The developer save has Cramps's yes and the guards beaten, and leaves the DJ and the festival to play.

**Paul Mescal (Dublin).** A route trainer on the south side of Dublin, past Temple Bar, in a white T-shirt, tiny navy GAA shorts and socks pulled up, with a moustache, a frown and a tear on his cheek (2D and 3D). Before the battle he tells you he's an Academy Award nominated actor, really attractive and really rich, and yet really, really sad. He has Paulimon 42, Skehemon 43 and Robinmon 43 (Pauliwrath, Skehdinja and Robinsey by then), Easy AI and €860, like the other Dublin street trainers; a Lv42 party from the Dublin grass beats him over 99% of the time in the simulator. Beat him and he's even sadder, says “Look over there!” and runs off east, out of sight (the `flee` script step: whoever on the map is hidden by its flag runs off, then the flag is set). He's gone for good after that (flag `mescal:gone`). He's Dublin's ninth person; the Rave Cave's bouncer is the tenth (maps can place a tenth with the marker `0`).

Sibeal stands by the road in Limerick with her black and white dog, Norm. Say yes and Norm comes with you (flag `norm:with-you`): he walks behind you in place of your lead Ranemon, in 2D and 3D, and he never fights, so the party doesn't change. Every so often "Norm found something!" and you get an item, mostly pints, tea and chicken fillet rolls, now and then a Mulligan's or, rarely, a Blue Ghost (`NORM_FINDS` in lib/story/norm.ts). How often is `finds`: once 100 steps (`FIND_GAP`) have passed since the last find, each step has a 1 in 250 chance (`NORM_FIND_RATE`), so about one find every 350 steps, and never two close together (it used to be 1 in 150 a step, with no gap). The step count at the last find is the save's optional `foundAt`. While you have him, Sibeal waits in every McGrattans; talk to her there to give him back, and she's back in Limerick if you want him again. Norm is just a flag, so he's kept in saves and save codes with no schema change.

**Silicon Docks (Dublin).** A strip of 13 rows added under Dublin's old bottom row, through a gap in the tree line at x24 (`SILICON_ROWS` in `src/content/story/silicon.ts`): eight glass office blocks (tile `z`, blocked, drawn as a curtain wall; a landmark door set in glass is drawn as sliding glass doors) round Grand Canal Dock, four along the top and four along the bottom either side of the water, each with its company's sign over the door (`landmarkLabels`, drawn like the McGRATTANS and VAPES signs). They are Dublin's landmark doors 7 to 14 and its last two signs, after everything Dublin had, so no existing room or sign is renumbered. Every HQ is the same 12 × 11 room (`TEMPLATE`) with its own furniture and things to look at: the CEO at the top (Hard AI, no sight, so you walk up and talk to them), a receptionist behind the front desk by the door, someone on staff (Normal AI, sight 4, looking along the middle of the room) and someone working. In reading order: Google (Sundar Pichai), Meta (Mark Zuckerberg), Microsoft (Satya Nadella), Apple (Tim Cook), Amazon (Jeff Bezos), TikTok (Shou Chew), X (Elon Musk) and Stripe (Patrick and John Collison; Patrick battles, John stands beside him). Each CEO gives a gift when beaten and unlocks their skin; beating everyone on staff unlocks the Tech Worker skin. Stripe's door is shut (`landmarkLocks`) until the other seven are beaten in any order: each of their rewards checks the seven beat flags and sets `silicon:seven` with a text from Stripe once they're all in. Walking into any HQ sets `silicon:start`, which opens the Silicon Docks mission. All their Ranemon are the lads. Aces go from Lv46 (Pichai) to Lv57 (the Collisons); in the simulator a party of Dublin's wild Ranemon at each one's ace level wins about 9 in 10 against Pichai and about 1 in 2 against Musk (`tests/sim/silicon.test.ts`). 2D only, with the rest of Dublin.

**The Championship of Ireland (after B&S, Galway).** The Intercity to Galway is platform 6 at Connolly, locked on `champion` (`src/content/story/galway.ts`). Galway is a 24 × 13 city with McGrattans, Vapes, the Spanish Arch, long grass on Eyre Square at Lv56 to 60, a busker stuck on Galway Girl, a local who's heard the rumour, and a doorman outside the Hall of Champions (the second `L`) who explains the rules. The Hall is five rooms in a row (`ROOMS`), one per battler, like the main series' Elite Four: each waits in the middle of their own themed room facing the way in (sight 4), in front of a door at the top that stays shut until they're beaten in this run (`landmarkLocks`), and leads into the next room (`interiorId(room, 'L', 0)`, in `HALL_ROOMS`). Every room's way out goes back to Eyre Square. In order: Rob Lipsett (Brawn) in his gym of dumbbell racks and benches (after losing: "and that's what happens when you take preworkout before a Ranemon battle"), Blindboy Boatclub (Chaos, a plastic bag on his head, very Limerick) in his study of books and a fire, The 2 Johnnies (Charm; Johnny B battles, Johnny Smacks stands beside him) in a farmhouse kitchen with a range and the Farmers Journal, Bono (Hype) on his stage of lights and speakers, and the Champion's hall at the end. Each battler after the first waits on the one before (`readyIf`). The rooms play the gym theme. A run is the beat flags of the four and Collins (`RUN`): `healParty` wipes them, so healing at McGrattans or Mam's, or coming round after a blackout, starts you again from Lipsett, while BAG items are allowed. Beating Bono reveals that B&S's title was only ever Trinity's, and the door behind Bono opens on Michael Collins. The first win over him sets `galway:champion`, gives a Perfect Pour and unlocks his skin; later runs can beat him again. Permanent `galway:won:<id>` flags keep the skins. All five are Hard AI and scale to your best Ranemon whether or not you're Champion (`above`: -3, -3, -2, -3 and -1 for Collins), never past 100. Collins has boss music and a night scene, the four the leader theme in a gym scene. In the simulator, a random party at Lv60, 80 or 100 wins each of the four 70% to 90% of the time and Collins 44% to 54%, but a whole run, patching up between battles with up to 10 Hair of the Dog and 20 Full Irish, only 3% to 6% of the time (`tests/sim/galway.test.ts`): PP is what runs out. Galway and the Hall are 2D only (`flat`). The developer save leaves the whole Championship to play.

**Elvis (every McGrattans).** Carl Ryan's dog Elvis, really huge and black, lies at Carl's feet in every McGrattans (`src/content/story/elvis.ts`), drawn as a dog twice Norm's size (`COATS` in people.ts). Talk to him and Carl says "the big lad needs a walk but I am here locking for Q4. Would you mind walking him?" Say yes and Elvis walks behind you instead (flag `elvis:with-you`), exactly like Norm: he never fights and he finds things with the same nose, rates and finds. Only one dog at a time: take Elvis while you have Norm and you're told "Norm went back to Sibeal", and borrow Norm from Sibeal while you have Elvis and Elvis goes back to Carl. Talk to Carl in any McGrattans to give Elvis back (`elvis:returned`, which unlocks the Carl Ryan skin). Elvis is 2D only: in the 3D look, in McGrattans and following you, he's drawn as his flat 2D sprite, standing up, rather than as a model. Like Norm, he's just a flag.

**The Limepass (Limerick).** The Lime rep, in a lime hi-vis by the gym, signs you up for a Limepass (key item, flag `limepass`). It does two things. You can ride a Lime e-bike, drawn in 2D and 3D as a lime green step-through bike with a black basket: hold B to go twice as fast, just like the High Nelly, which is drawn as a black roadster if you only have that. And LIMEPASS appears on the START menu: pick any town you've been to and you're dropped outside its McGrattans (`limeStops` in lib/story/limepass.ts). It's just a flag, so saves need no change.

**Missions.** START → MISSIONS lists the missions you have open: started (its `start` flag is set, or it has none, like the main story) and not finished (its `done` flag isn't). Each shows its name, a line on what it's about, what to do next and where to go, plus a count like 2/3 for steps that collect things (the rent's clues, the legend's beads). With nothing open it says so and nudges you to go and talk to people. Side stories only appear once they've begun, so nothing is spoiled, and the legend never names who is waiting. Missions are data in `src/content/story/missions.ts`; `openMissions` in `src/lib/story/missions.ts` picks the open ones and, for each, the first step whose `until` flag isn't set. They're read from flags the game already sets, so saves need no change. To add a mission, add one entry to `MISSIONS`:

```ts
{
  id: 'rent',
  name: 'The missing rent',
  about: 'The rent money is gone from Ollie and Simo’s biscuit tin.',
  start: RENT_START, // open once this is set; leave it out to be open from the start
  done: RENT_DONE, // closed once this is set
  steps: [
    { until: RENT_READY, todo: 'Find three clues…', where: 'The rent house, Dublin', count: RENT_CLUES },
    { until: RENT_ACCUSED, todo: 'Accuse MC or Melchior.', where: 'The rent house, Dublin' },
    { until: RENT_DONE, todo: 'Beat whoever you accused.', where: 'The rent house, Dublin' },
  ],
}
```

The last step's `until` must be the `done` flag, and every flag must be one the game can set; `tests/unit/missions.test.ts` checks both. Open today, when started: Champions of Ireland (the main story, from the starter to B&S), the missing rent, the Happy Pear Twins, Poseidon, the legend of Dublin, Brighton with Enda and I Love Techno.

**Town Map.** START → MAP, a tap on the place name at the top of the screen, or the M key opens a flat map of Ireland in the 5th generation's style. The road runs Clare to Dublin through all ten stops; visited towns are red and the rest grey, a gold star marks each jersey won (Dublin's star is the championship), and a blinking red cap shows where you are (rooms count as their town, Trinity as Dublin). Left and right step through the towns, showing each one's county and gym. It never shows landmarks, so the legend stays hidden.

**Field gates** (what stops you skipping ahead): flooded bog roads need Wellies, rivers need the Currach, a flock of sheep blocking the road into Laois moves only after the Tipperary jersey, and the Trinity Front Gate needs all 9 jerseys. Gating is by key items rather than field moves, so battle moves stay battle-only.

## Core mechanics

### Levels and stats

Stats use the main-series formula without IVs or EVs. At level 50 it gives exactly today's numbers (HP = base + 60, others = base + 5), so the battle game's balance carries over untouched.

```
stat = floor(2 × base × L / 100) + 5
HP   = floor(2 × base × L / 100) + L + 10
```

The damage formula's fixed 22 becomes (2L/5 + 2), which is 22 again at level 50. Levels run 5 to 100 (`MAX_LEVEL`); wild Ranemon stop at 60, so the last 40 come from trainers, who scale up to you after B&S.

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

The BAG (`BagPanel`) sorts items into pockets by what they do (`pocketOf` in `items.ts`): FOOD (heals, cures and revives), PINTS, VAPES, SPECIAL (Blue Ghosts, evolution items and held items) and KEY (key items, from `keys.ts`). Each tab shows how many kinds are in it. Tapping an item shows what it does and where it works; tapping it again, or USE, picks a Ranemon. Its button says IN BATTLE ONLY for pints and vapes, and NOBODY NEEDS IT when no one in the party could use it. Food and held items stay in the BAG after use, with what happened in a note, so a whole party can be fed in one go; a Blue Ghost or an evolution item closes it for its scene. The battle BAG is in pockets too: pints first against a wild Ranemon, last against a trainer. Every shop, Vapes, Vapes & More and anyone's stall, has a SELL tab: pick an item, how many (− / + / ALL) and confirm. The shop pays half its Vapes price (`sellPrice`), rounded down. Key items and anything Vapes doesn't sell (the Perfect Pour, the Vegan Stone, the Friendship Bracelet, Wickmon's finds) can't be sold, since they're one of a kind. The D-pad and keyboard work in the BAG and the shops (`MenuNav`): left and right change pocket or tab, up and down move the cursor, A uses or picks, B goes back a step. In the quantity picker, up or right is one more and down or left one fewer. Nothing new is saved: the bag and money are as before.

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

## Skins

SKINS on the START menu lets you walk around as someone you've met. Beat a boss or named trainer, or finish a character's side quest, and their look is yours (`src/content/story/skins.ts`). Locked skins show as silhouettes with a hint. The skin you wear draws you on the 2D map (walking and on the bike) and on the Trainer Card; the 3D look always draws the usual cap and jacket, since new things are 2D only.

**Adding a skin for a new character** is one entry in `SKINS`:

```ts
{ id: 'enda', name: 'Enda', unlock: [BRIGHTON_DONE], hint: 'Go on Enda’s trip to Brighton.' },
```

- `id` is the character's `Look` (the overworld person in `people.ts`), so a new character's skin needs no new art.
- `unlock` is every flag that has to be set. Use `beat('trainer-id')` for beating a trainer, the quest's own "done" flag for a side quest, or `beat(...wearing('look'))` for every trainer dressed that way in the maps.
- `hint` is shown while it's locked. Keep it a nudge, not a spoiler.

When a script finishes, any skin the save has newly earned is announced ("You unlocked the Enda skin!") and kept in the save's `skins`; the one you wear is `skin`. Saves from before skins (schema 3) are given every skin they'd already earned when they load, and a skin added later for someone you'd already beaten is announced the next time a script runs. The developer save has every skin. `tests/unit/skins.test.ts` checks every skin is a real look with flags the game can set.

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
- A London-only game (SKIP TO RANEMON LONDON on the home screen, `/london`) has its own slot: `ranemon.london.v1:<name>`, its own backups, and its own online save under `ln__<name>`. Its saves carry the `london:only` flag, which is how the game tells them apart; a Dublin save never has it, and neither game will load the other's save, save code or online save.

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
