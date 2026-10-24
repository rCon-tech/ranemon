import type { ItemId } from '@/lib/story/items';
import type { Npc, Step } from '@/lib/story/world';

/**
 * The bigger counties: the famous places and local legends in the land added round each county
 * town. The new ground is east and south of the old map, so every old spot, door and save stays
 * where it was. New doors come after the old ones in reading order, so the rooms keep their ids.
 * 2D only, like everything new.
 */

/** Something handed over once: the first time it's `first` and the gift, after that `after`. */
const once = (flag: string, first: string, item: ItemId, count: number, after: string): Step => ({
  do: 'if',
  flag,
  then: [{ do: 'say', text: after }],
  else: [
    { do: 'say', text: first },
    { do: 'give', item, count },
    { do: 'flag', flag },
  ],
});

const say = (...lines: string[]): Step[] => lines.map((text) => ({ do: 'say', text }));

// ---------- Clare: Bunratty, the Burren, the Cliffs of Moher, Doolin and Lisdoonvarna ----------

export const CLARE_NPCS: Npc[] = [
  {
    look: 'local',
    face: 'down',
    talk: [
      ...say(
        'STORYTELLER: Did you ever hear of Biddy Early? The wise woman of Feakle, east of here. She had a blue bottle that showed her the future, and a cure for anything.',
        'STORYTELLER: The priests hated her, the landlords feared her, and half of Clare queued at her door. When she died, they say the bottle went into Kilbarron Lake.',
        'STORYTELLER: Nobody’s found it since. Mind you, nobody’s looked very hard. It’s not the kind of bottle you’d want to find.',
      ),
      once(
        'gift:biddy',
        'STORYTELLER: Here. Biddy always said a cup of tea cured more than any bottle.',
        'cup-of-tea',
        3,
        'STORYTELLER: If you do find a blue bottle in a lake, leave it there.',
      ),
    ],
  },
  { look: 'trainer', face: 'right', trainer: 'clare-surfer', sight: 3 },
  {
    look: 'oldman',
    face: 'down',
    talk: [
      {
        do: 'ask',
        text: 'WILLIE THE MATCHMAKER: Are you here for the matchmaking? This is the book. Three generations of names in it. Put your hand on it and you’re married within the year.',
        yes: say(
          'WILLIE THE MATCHMAKER: Grand. Hand on the book… Ah. It says here your one true love is a Ranemon.',
          'WILLIE THE MATCHMAKER: Can’t argue with the book. Lisdoonvarna has never got one wrong.',
        ),
        no: say('WILLIE THE MATCHMAKER: That’s what they all say. You’ll be back in September.'),
      },
    ],
  },
  { look: 'busker', face: 'up', trainer: 'clare-fiddler', sight: 3 },
  {
    look: 'farmer',
    face: 'down',
    talk: say(
      'FARMER: See the rock out past the cliffs shaped like a woman’s face? That’s Mal the hag. She fell for Cú Chulainn and chased him the length of Clare.',
      'FARMER: He leapt from rock to rock out to Loop Head. She leapt after him, missed, and fell into the sea. Hag’s Head, we call it since.',
      'FARMER: Or that’s what my granny told me, to keep me back from the edge. It worked.',
    ),
  },
];

export const CLARE_SIGNS = {
  bunratty:
    'BUNRATTY CASTLE AND FOLK PARK. Medieval banquets nightly. Durty Nelly’s by the bridge since 1620.',
  cliffs:
    'THE CLIFFS OF MOHER. 214 metres down to the Atlantic. Stay behind the wall: this wind would lift a Ranemon.',
  dolmen:
    'POULNABRONE DOLMEN. A tomb older than the pyramids. The Burren: not water enough to drown a man, wood enough to hang one, nor earth enough to bury him.',
  doolin:
    'DOOLIN. Trad every night, and the ferry to the Aran Islands when the sea allows. Lisdoonvarna up the road: the matchmaking festival is on.',
};

export const CLARE_HOUSES: Step[][] = [
  say(
    'LOCAL: Welcome to the Folk Park! This cottage is just how Clare looked in 1900. The roof leaks, same as it did in 1900.',
  ),
  say(
    'LOCAL: I’m the village blacksmith. Well, weekdays ten to five I am. Saturdays I’m the village schoolteacher.',
  ),
  [
    {
      do: 'say',
      text: 'DURTY NELLY’S. A pub since 1620, built for the soldiers who kept the bridge at Bunratty. The barman says Nelly’s cure for anything was a pint and a song.',
    },
    once(
      'gift:nellys',
      'BARMAN: First time in? Then these are on Nelly.',
      'pint',
      2,
      'BARMAN: Sing us one, or let the man behind you up to the bar.',
    ),
  ],
  say(
    'LOCAL: The matchmaking festival’s on all September. Couples come from Boston, Brisbane and Ballybunion. Willie’s outside with the book if you’re looking.',
  ),
  say(
    'LOCAL: Session’s started. Two fiddles, a flute, a bodhrán and a man from Ohio with a ukulele nobody had the heart to stop.',
  ),
];

export const CLARE_LANDMARKS: Step[][] = [
  [
    {
      do: 'say',
      text: 'BUNRATTY CASTLE. The banquet is on in the great hall: mead, a harpist, and an Earl who won’t stop making speeches.',
    },
    once(
      'gift:bunratty',
      'BUTLER: You look starved, young trainer. The mead is off, but take these from the kitchen.',
      'chicken-fillet-roll',
      2,
      'BUTLER: The Earl is still talking. He started at seven.',
    ),
  ],
  say(
    'O’BRIEN’S TOWER, on the Cliffs of Moher. Built in 1835 so visitors could look out to sea. On a clear day you can see the Aran Islands, and on most days you can see fog.',
  ),
  say(
    'AILLWEE CAVE. A river ate its way under the Burren over a million years. Deep in the dark are the bones of a brown bear who came in to sleep, and never left.',
  ),
];

// ---------- Limerick: the Treaty Stone, St Mary's, the Milk Market, Adare, Lough Gur and Foynes ----------

export const LIMERICK_NPCS: Npc[] = [
  { look: 'trainer', face: 'left', trainer: 'limerick-poet', sight: 3 },
  { look: 'lad', face: 'down', trainer: 'limerick-munster', sight: 3 },
  {
    look: 'oldman',
    face: 'down',
    talk: say(
      'OLD MAN: Under that lake sleeps Gearóid Iarla, the Earl of Desmond, and all his knights, waiting.',
      'OLD MAN: Every seven years he rides out across Lough Gur on a white horse shod with silver. When the shoes wear through, he’ll wake and take back Munster.',
      'OLD MAN: I saw him once, in 1974. Or it was the mist. Either way his shoes looked grand. We’ve a while to wait yet.',
    ),
  },
  {
    look: 'farmer',
    face: 'right',
    talk: say(
      'FARMER: Adare’s the prettiest village in Ireland. It says so on the sign, and the sign’s never wrong.',
      'FARMER: The Ryder Cup is coming to Adare Manor in 2027. I’ve been told to keep the cows off the eighteenth.',
    ),
  },
];

export const LIMERICK_SIGNS = {
  treaty:
    'THE TREATY STONE. The Treaty of Limerick was signed on it in 1691, and broken, they say, before the ink was dry.',
  thomond:
    'THOMOND PARK. Home of Munster rugby. When a kicker lines up, all 26,000 go silent. Even the seagulls.',
  adare: 'ADARE. Thatched cottages, the Manor, and the prettiest main street in Ireland.',
  gur: 'LOUGH GUR. People have lived by this lake for 6,000 years. Mind the mist.',
  circle:
    'THE GRANGE STONE CIRCLE. The biggest in Ireland: 113 stones. At sunrise on midsummer the light comes straight through the gap.',
};

export const LIMERICK_HOUSES: Step[][] = [
  [
    {
      do: 'say',
      text: 'THE MILK MARKET. Stalls of cheese, bread, curry and a man who’ll sharpen your knives while you wait.',
    },
    once(
      'gift:milkmarket',
      'STALL HOLDER: You’ve the look of a trainer on the road. Have a couple of these, on the house.',
      'spice-bag',
      2,
      'STALL HOLDER: Back on Saturday? I’ll keep you a spice bag.',
    ),
  ],
  say(
    'LOCAL: A thatched cottage in Adare. Lovely, until the tour buses stop outside and forty people take a photo of you eating your dinner.',
  ),
  say(
    'LOCAL: There was a limerick competition in the village. I came second, to a man from Kerry. We don’t talk about it.',
  ),
];

export const LIMERICK_LANDMARKS: Step[][] = [
  say(
    'ST MARY’S CATHEDRAL. Founded in 1168 on the site of a palace. The oak seats in the choir are carved with beasts, and one of them looks a bit like Boydemon.',
  ),
  say(
    'ADARE MANOR. A Gothic mansion with a golf course fit for the Ryder Cup. The doorman looks at your shoes, then lets you in anyway.',
  ),
  [
    {
      do: 'say',
      text: 'FOYNES FLYING BOAT MUSEUM. In 1943 a flight turned back in a storm, and chef Joe Sheridan put whiskey in the coffee to warm the passengers. The Irish coffee was born.',
    },
    once(
      'gift:foynes',
      'GUIDE: No coffee for trainers under the counter, but here, something for your Ranemon when they’re flat out.',
      'hair-of-the-dog',
      1,
      'GUIDE: Somebody asked Joe was it Brazilian coffee. “No,” says he, “Irish coffee.”',
    ),
  ],
];

// ---------- Tipperary: the Hayes Hotel, Holy Cross, the Devil's Bit, Cahir and the Galtees ----------

export const TIPPERARY_NPCS: Npc[] = [
  { look: 'trainer', face: 'left', trainer: 'tipp-camogie', sight: 3 },
  { look: 'lad', face: 'right', trainer: 'tipp-angler', sight: 3 },
  {
    look: 'local',
    face: 'left',
    talk: say(
      'LOCAL: See that mountain up north with a bite out of it? The Devil’s Bit. The devil was flying over Tipperary, starving, and took a bite of the mountain.',
      'LOCAL: It broke his teeth, so he spat it out, and where it landed is the Rock of Cashel. Look at the two of them and tell me it doesn’t fit.',
    ),
  },
  {
    look: 'oldman',
    face: 'down',
    talk: [
      ...say(
        'HILLWALKER: Slievenamon, there. Fionn Mac Cumhaill couldn’t pick a wife, so he had every woman in Ireland race to the top. The first to reach him would marry him.',
        'HILLWALKER: Gráinne won. She ran the whole way. Then she ran off with Diarmuid, but that’s a different story and a longer walk.',
      ),
      once(
        'gift:slievenamon',
        'HILLWALKER: Here, you’ll want these for the climb.',
        'monster',
        2,
        'HILLWALKER: The view from the top is worth every step. I’m told. I’ve never got past here.',
      ),
    ],
  },
];

export const TIPPERARY_SIGNS = {
  hayes:
    'THE HAYES HOTEL. Where seven men met on 1 November 1884 and founded the GAA. Lár na Páirce, the GAA museum, is up the street.',
  holycross: 'HOLY CROSS ABBEY. Built round a piece of the True Cross, brought from Rome in 1110.',
  cahir: 'CAHIR. A castle on a rock in the River Suir, and the Swiss Cottage down the river path.',
  aherlow:
    'THE GLEN OF AHERLOW. The Galtee Mountains on one side, Slievenamon off to the east. Long grass all the way.',
};

export const TIPPERARY_HOUSES: Step[][] = [
  [
    {
      do: 'say',
      text: 'THE HAYES HOTEL. A brass plaque in the billiard room marks where the GAA was founded. Michael Cusack’s chair is still here, and nobody’s allowed to sit in it.',
    },
    once(
      'gift:hayes',
      'PORTER: Every trainer who comes through Thurles gets a pint in the GAA room. House rule since 1884. Probably.',
      'settled-pint',
      1,
      'PORTER: Up Tipp. That’s the whole of the house rules, really.',
    ),
  ],
  say(
    'THE SWISS COTTAGE. Built for Lord Cahir in about 1810 so his guests could pretend to be peasants for the afternoon. The thatch alone took a year.',
  ),
];

export const TIPPERARY_LANDMARKS: Step[][] = [
  say(
    'HOLY CROSS ABBEY. Monks kept the relic of the True Cross here for four hundred years. Pilgrims still walk from as far as Cork.',
  ),
  say(
    'CAHIR CASTLE. One of the biggest castles in Ireland, on its own island in the Suir. It was so strong that it was only ever taken by cannon. Twice. And once by a letter.',
  ),
];

// ---------- Kilkenny: St Canice's, Kyteler's Inn, the Medieval Mile, Dunmore Cave, Jerpoint and Inistioge ----------

export const KILKENNY_NPCS: Npc[] = [
  {
    look: 'local',
    face: 'left',
    talk: say(
      'LOCAL: You know why we’re the Cats? Two cats in Kilkenny once fought so hard that they ate each other up, all but the tails.',
      'LOCAL: Some say it was soldiers who tied two cats together by the tails for sport, and cut them loose when the officer came. Left the tails behind as proof.',
      'LOCAL: Either way, nobody in Kilkenny gives up. Not the cats, and not the hurlers.',
    ),
  },
  { look: 'trainer', face: 'down', trainer: 'kk-hurler', sight: 3 },
  {
    look: 'oldman',
    face: 'down',
    talk: [
      ...say(
        'OLD MAN: Dame Alice Kyteler kept the inn on the corner, back in 1324. Four husbands, and every one of them died rich and left it all to Alice.',
        'OLD MAN: The bishop had her tried as a witch, the first in Ireland. Alice slipped away to England the night before, and was never seen again.',
        'OLD MAN: Her maid Petronella wasn’t so lucky. Some nights, they say, you can still hear Alice laughing in the cellar.',
      ),
      once(
        'gift:kyteler',
        'OLD MAN: Here, take these. Alice always said a strong drink was the best spell of all.',
        'settled-pint',
        2,
        'OLD MAN: If you hear laughing in Kyteler’s cellar, don’t go down to look.',
      ),
    ],
  },
  { look: 'trainer', face: 'left', trainer: 'kk-kayaker', sight: 3 },
];

export const KILKENNY_SIGNS = {
  canice:
    'ST CANICE’S CATHEDRAL. The round tower beside it is 1,200 years old, and you can still climb to the top. Kilkenny is named after the saint: Cill Chainnigh.',
  mile: 'THE MEDIEVAL MILE. From the Castle to St Canice’s: Kyteler’s Inn, Rothe House, the Black Abbey and Smithwick’s.',
  dunmore:
    'DUNMORE CAVE. In 928 a thousand people hid here from the Vikings of Dublin. Viking coins were still being found in the cracks in 1999.',
  jerpoint:
    'JERPOINT ABBEY. A Cistercian ruin full of carvings: knights, saints, dragons, and a man with a very sore stomach.',
};

export const KILKENNY_HOUSES: Step[][] = [
  [
    {
      do: 'say',
      text: 'KYTELER’S INN. The oldest inn in Kilkenny, since 1324. There’s a statue of Dame Alice by the stairs, and she’s looking at you.',
    },
    once(
      'gift:kytelers-inn',
      'BARMAN: First visit? A pint on the house, for luck. You’ll need it with Alice watching.',
      'pint',
      2,
      'BARMAN: She moved again last night. A few inches to the left. Don’t ask.',
    ),
  ],
  say(
    'SMITHWICK’S. Monks were brewing ale in the abbey here back in the 1200s. The guide says the recipe hasn’t changed. The guide says that about everything.',
  ),
  say(
    'LOCAL: Inistioge. They filmed half the films in Ireland here: the bridge, the square, the river. I was an extra in three of them. I was “man on bridge”.',
  ),
];

export const KILKENNY_LANDMARKS: Step[][] = [
  say(
    'ST CANICE’S CATHEDRAL. Inside, the tombs of the Butlers, Earls of Ormonde, lie in stone, with their dogs at their feet.',
  ),
  say(
    'DUNMORE CAVE. Dripping limestone halls, and a pillar called the Market Cross. It’s cold, and it’s very, very quiet.',
  ),
  say(
    'JERPOINT ABBEY. In the cloister, carved knights and ladies stand between the arches. One of them has been holding his sword for 800 years.',
  ),
];

// ---------- Laois: the Rock of Dunamase, Emo Court, Morrissey's, the Slieve Bloom and St Fintan's tree ----------

export const LAOIS_NPCS: Npc[] = [
  { look: 'farmer', face: 'left', trainer: 'laois-steam', sight: 2 },
  { look: 'trainer', face: 'down', trainer: 'laois-glamper', sight: 3 },
  {
    look: 'oldman',
    face: 'down',
    talk: say(
      'HILLWALKER: The Slieve Bloom, named for Bladhma, a warrior in the old stories who hid out up here when all of Ireland was hunting him.',
      'HILLWALKER: Nobody found him. Nobody finds anyone in the Slieve Bloom. I’ve been looking for my car since Tuesday.',
    ),
  },
  { look: 'trainer', face: 'up', trainer: 'laois-footballer', sight: 3 },
  {
    look: 'local',
    face: 'right',
    talk: [
      ...say(
        'LOCAL: That’s St Fintan’s Tree. The monks at Clonenagh had a holy well, and when a landowner filled it in, the water moved up into this tree instead.',
        'LOCAL: People pushed coins into the bark for luck, for two hundred years. The tree’s that full of money now it’s more of a bank.',
      ),
      once(
        'gift:fintan',
        'LOCAL: I won’t take a coin off you. Here: the tree gave me a few of these, I swear.',
        'full-irish',
        1,
        'LOCAL: Make a wish on the tree. Not a big one. It’s an old tree.',
      ),
    ],
  },
];

export const LAOIS_SIGNS = {
  dunamase:
    'THE ROCK OF DUNAMASE. A castle on a crag, given to Strongbow in 1170 as part of Aoife MacMurrough’s dowry. Cromwell’s men blew it up in 1650.',
  emo: 'EMO COURT. A domed mansion by James Gandon, who built the Custom House in Dublin. Lovely gardens. Lovelier tea rooms.',
  bloom: 'THE SLIEVE BLOOM MOUNTAINS. Blanket bog, waterfalls and no phone signal for miles.',
};

export const LAOIS_HOUSES: Step[][] = [
  say(
    'EMO COURT. The guide tells you Gandon designed it in 1790 and it took 70 years to finish. “The builders in Laois are thorough,” she says.',
  ),
  [
    {
      do: 'say',
      text: 'MORRISSEY’S, ABBEYLEIX. A pub, a grocer’s and once an undertaker’s, since 1775. Biscuit tins on the shelves, and a pot-bellied stove in the corner.',
    },
    once(
      'gift:morrisseys',
      'BARMAN: Pint? On the house, for the trainer passing through.',
      'pint',
      2,
      'BARMAN: The tea’s from 1775 as well. Only joking. It’s from 1976.',
    ),
  ],
];

export const LAOIS_LANDMARKS: Step[][] = [
  say(
    'THE ROCK OF DUNAMASE. From the top you can see the whole of Laois, and the Slieve Bloom blue in the west. The wind up here has been at it since 1170.',
  ),
];

// ---------- Offaly: Birr Castle, Tullamore, Lough Boora, the Bog of Allen, Leap and Charleville Castles, Moneygall ----------

export const OFFALY_NPCS: Npc[] = [
  {
    look: 'local',
    face: 'down',
    talk: say(
      'LOCAL: Did you hear about the ship in the sky? Monks at Clonmacnoise saw it in 744, sailing over the church in the clouds.',
      'LOCAL: Its anchor caught on the altar rail. A sailor climbed down the rope to free it, and the monks held on to him till he cried he was drowning in our air.',
      'LOCAL: They let him go, he climbed back up, and the ship sailed off. The anchor’s long gone. The monks never did find out what ship it was.',
    ),
  },
  { look: 'trainer', face: 'up', trainer: 'offaly-astronomer', sight: 3 },
  {
    look: 'farmer',
    face: 'down',
    talk: say(
      'TURF CUTTER: In 2003 they found a man in the bog by Croghan Hill. Old Croghan Man, 2,000 years dead, and his fingernails still done.',
      'TURF CUTTER: A king, they think, given to the bog. The bog keeps everything: butter, bodies, the odd Ranemon. I check every sod twice.',
    ),
  },
  {
    look: 'oldman',
    face: 'down',
    talk: [
      ...say(
        'OLD MAN: Leap Castle. The most haunted house in Ireland. The O’Carrolls killed their own brother, a priest, at the altar in the Bloody Chapel.',
        'OLD MAN: When they cleared out a dungeon behind the wall, they found it full of bones. And something lives there still. They call it the Elemental. It smells of sulphur.',
      ),
      once(
        'gift:leap',
        'OLD MAN: Here, take these, in case you go in. You’ll want your Ranemon in good form.',
        'chicken-fillet-roll',
        3,
        'OLD MAN: Did you smell it? You did. You’ve gone white.',
      ),
    ],
  },
];

export const OFFALY_SIGNS = {
  birr: 'BIRR CASTLE. Home of the Leviathan, for 70 years the biggest telescope in the world.',
  tullamore:
    'TULLAMORE. Home of Tullamore D.E.W. In 1785 a hot-air balloon crashed here and burned half the town. The town put the balloon on its crest.',
  boora:
    'LOUGH BOORA. An old cutaway bog turned into a park of lakes and giant sculptures. Mind the grey partridges.',
  bog: 'THE BOG OF ALLEN. A thousand square kilometres of bog. Keep to the path.',
  leap: 'LEAP CASTLE. Most haunted house in Ireland. Visitors at own risk.',
};

export const OFFALY_HOUSES: Step[][] = [
  [
    {
      do: 'say',
      text: 'TULLAMORE D.E.W. The letters are Daniel E. Williams, who ran the distillery from the age of 15. Give every man his Dew, the old ad said.',
    },
    once(
      'gift:dew',
      'GUIDE: The tasting’s for over-18s, but your Ranemon can have these.',
      'mulligans',
      1,
      'GUIDE: Give every man his Dew. And every Ranemon a pint.',
    ),
  ],
  say(
    'LOCAL: Moneygall. Barack Obama’s great-great-great-grandfather was the shoemaker here. When Obama came for a pint in 2011, the whole village had a pint with him.',
  ),
];

export const OFFALY_LANDMARKS: Step[][] = [
  say(
    'BIRR CASTLE. The Leviathan of Parsonstown, built by the 3rd Earl of Rosse in 1845. Through it he was the first to see that some nebulae were spirals.',
  ),
  say(
    'LEAP CASTLE. It’s cold, it’s dark, and somebody upstairs is walking slowly from one end of the Bloody Chapel to the other. Nobody else is here.',
  ),
  say(
    'CHARLEVILLE CASTLE. A gothic castle in an oak forest. A little girl, Harriet, slid down the banister in 1861 and fell. Some say she still plays on the stairs.',
  ),
];
