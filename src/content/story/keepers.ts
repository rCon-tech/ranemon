import type { Dir, Look, Npc, Step } from '@/lib/story/world';

/**
 * Whoever looks after each landmark, so nobody walks into an empty room: a guide, a caretaker, a
 * monk or a ghost hunter, standing by the display with something to say about the place.
 * Keyed by map, then by the landmark's name as its room shows it (`Kilkenny Castle`), so they
 * stay put when a new door shifts the landmarks' order. A landmark with nobody here gets a guide.
 */

const say = (...lines: string[]): Step[] => lines.map((text) => ({ do: 'say', text }));
const keeper = (look: Look, ...lines: string[]): Npc => ({
  look,
  face: 'down' as Dir,
  talk: say(...lines),
});

export const KEEPERS: Record<string, Record<string, Npc>> = {
  clare: {
    'Michael D’s farmhouse': keeper(
      'farmer',
      'NEIGHBOUR: I farm the land next door. Michael D used to read poetry to my cows. Best milk yields in Clare that year.',
      'NEIGHBOUR: The dog? Leave him. He’s been asleep on that step since the 2011 election.',
    ),
    'Bunratty Castle': keeper(
      'fiddler',
      'HARPIST: I play the harp at the banquet. Well, the fiddle. The harp is in for repairs since the Earl sat on it.',
      'HARPIST: Every night he makes a speech about the old days. Every night the old days get longer.',
    ),
    'O’brien’s Tower': keeper(
      'local',
      'GUIDE: Seven hundred feet down to the Atlantic. Don’t lean on the wall, the puffins have seen enough.',
      'GUIDE: Cornelius O’Brien built this so the ladies could see the view. They say he built everything round here except the cliffs.',
    ),
    'Aillwee Cave': keeper(
      'local',
      'CAVE GUIDE: Mind your head. I’m going to turn off the lights now, so you can see real darkness.',
      'CAVE GUIDE: …',
      'CAVE GUIDE: Grand, they’re back on. The bear is a lot less scary when you can see he’s been dead ten thousand years.',
    ),
  },
  limerick: {
    'King John’s Castle': keeper(
      'guard',
      'CASTLE WARDEN: King John ordered it built in 1200, then spent the rest of his reign losing things. Normandy, mostly.',
      'WARDEN: Boydemon was in earlier doing pull-ups on the portcullis. We’ve asked him not to.',
    ),
    'St Mary’s Cathedral': keeper(
      'scholar',
      'VERGER: Those carved seats are misericords. The monks could lean on them and look like they were standing for the whole Mass.',
      'VERGER: Eight hundred years of lads pretending to stand. Limerick invented that.',
    ),
    'Adare Manor': keeper(
      'tux',
      'DOORMAN: Welcome to Adare Manor. Shoes off the carpet, Ranemon off the furniture, and nobody mentions the Ryder Cup prices.',
      'DOORMAN: A Kerry man booked a round here last week. He’s still looking for his ball on the fourth.',
    ),
    'Foynes Flying Boat Museum': keeper(
      'conductor',
      'CURATOR: The flying boats landed on the Shannon on their way to New York. Fourteen hours over the Atlantic in a boat with wings.',
      'CURATOR: The passengers got off frozen and cross, and Joe Sheridan fixed both with one coffee. Proper Irish solution.',
    ),
  },
  tipperary: {
    'The Rock of Cashel': keeper(
      'oldman',
      'OLD CARETAKER: The Devil took a bite out of the Devil’s Bit mountain, broke a tooth, and spat it out here. That’s the Rock.',
      'OLD CARETAKER: I’ve swept it every day for forty years. Not one bit of thanks from the Devil.',
    ),
    'Holy Cross Abbey': keeper(
      'scholar',
      'BROTHER: Pilgrims walk here from Cork. Their feet are in bits. I keep a box of plasters by the font.',
      'BROTHER: Bless you, now. And bless your Ranemon. Especially the one that looks like it needs it.',
    ),
    'Cahir Castle': keeper(
      'guard',
      'GUIDE: Taken by cannon twice, and once by a letter. The letter just said “Surrender?” and they said “Grand, so.”',
      'GUIDE: They made a film here once. The castle was the only one in it who didn’t need make-up.',
    ),
  },
  kilkenny: {
    'Kilkenny Castle': keeper(
      'trainer',
      'TOUR GUIDE: The Butlers lived here for six hundred years and then sold it to the town for fifty quid. The best deal Kilkenny ever made.',
      'TOUR GUIDE: Don’t mind Robinmon on the lawn. If you get in the background of his video, you’ll be famous in Kilkenny by teatime.',
    ),
    'St Canice’s Cathedral': keeper(
      'scholar',
      'VERGER: You can climb the round tower for a few euro. 121 steps. The view’s great, the ladders are “character-building”.',
      'VERGER: The stone dogs at the Earls’ feet are the best-behaved dogs in the county. They haven’t moved in five hundred years.',
    ),
    'Dunmore Cave': keeper(
      'local',
      'CAVE GUIDE: In 928 the Vikings raided here, and a thousand people hid in the cave. Bring a jumper, it’s ten degrees all year.',
      'CAVE GUIDE: They found Viking coins hidden in a crack in the rock. Somebody’s lunch money, never collected.',
    ),
    'Jerpoint Abbey': keeper(
      'scholar',
      'BROTHER: The monks carved those knights to keep them company. There’s one with a bellyache. They say St Nicholas himself is buried out the back.',
      'BROTHER: Yes, that St Nicholas. Brought home by crusaders. He gets a lot of letters in December.',
    ),
  },
  laois: {
    'The Rock of Dunamase': keeper(
      'oldman',
      'OLD SHEPHERD: Strongbow got this rock as part of his wedding present. Some lads get a toaster.',
      'OLD SHEPHERD: Hold onto your hat. And your Ranemon. The wind took a Gibbsmon off here in 2019.',
    ),
  },
  offaly: {
    'A Round Tower': keeper(
      'scholar',
      'MONK: The door is ten feet up, so when the Vikings came the monks climbed in and pulled the ladder up after them.',
      'MONK: Simomon was in here earlier. The whole tower smelt like a festival campsite. I had to open the windows. All four of them.',
    ),
    'Birr Castle': keeper(
      'scholar',
      'ASTRONOMER: For seventy years this was the biggest telescope in the world. In Birr. In Offaly. Under clouds, mostly.',
      'ASTRONOMER: Clear nights here come about twice a year. The Earl saw the whole universe in those two nights.',
    ),
    'Leap Castle': keeper(
      'local',
      'GHOST HUNTER: The most haunted castle in Ireland. My readings are off the charts. Or my machine is broken. One of the two.',
      'GHOST HUNTER: Did you hear the footsteps upstairs? No? Oh no. Then who was that?',
    ),
    'Charleville Castle': keeper(
      'local',
      'CARETAKER: I polish the banister every morning. Every morning there are little handprints on it again. I’ve stopped asking.',
      'CARETAKER: The King Oak out front is a thousand years old. When a branch falls, someone in the family dies. We prune it very, very carefully.',
    ),
  },
  westmeath: {
    'Sean’s Bar': keeper(
      'lad',
      'LORCAMON: Oldest pub in Ireland. They found the walls were built in 900 AD. The carpet is a bit newer. 1987, maybe.',
      'LORCAMON: The barman says I’ve been here since 900 AD as well. Cheeky.',
    ),
    'The Cathedral of Christ the King': keeper(
      'scholar',
      'SACRISTAN: The mosaics were done by a Russian artist, Boris Anrep. Took him years. Every tile put up by hand.',
      'SACRISTAN: Mind, the bronze Joe Dolan down the street is still mid-song. Mullingar wouldn’t have it any other way.',
    ),
    'Athlone Castle': keeper(
      'guard',
      'CASTLE GUIDE: In 1691 they fired twelve thousand cannonballs at this castle in ten days. We’re still finding them in people’s gardens.',
      'CASTLE GUIDE: Half of Athlone is in Westmeath and half is in Roscommon. Which half the castle is in, we don’t discuss at dinner.',
    ),
    'Fore Abbey': keeper(
      'scholar',
      'BROTHER: The hermit sealed himself in his cell for life. Some days, with the tour buses, I understand him.',
      'BROTHER: The water flows uphill, you know. You can try it with your Ranemon. They’ll be no more confused than the rest of us.',
    ),
  },
  meath: {
    'The Hill of Tara': keeper(
      'oldman',
      'OLD DRUID (retired): A hundred and forty-two High Kings were crowned here. The wind was fierce for every one of them.',
      'OLD DRUID: Brian Boru, Niall of the Nine Hostages… none of them ever beat a gym leader, mind. You’re doing better than the lot of them.',
    ),
    'Trim Castle': keeper(
      'trainer',
      'GUIDE: They filmed Braveheart here. Half of Meath were extras. My uncle got killed eleven times on the one day.',
      'GUIDE: He still does the face if you ask him. He’s not asked much any more.',
    ),
    Knowth: keeper(
      'scholar',
      'ARCHAEOLOGIST: Over five thousand years old. Older than the pyramids. A third of all the megalithic art in western Europe, right here in Meath.',
      'ARCHAEOLOGIST: We still don’t know what the swirls mean. My guess? Someone in 3200 BC was very bored on a wet Tuesday.',
    ),
    Loughcrew: keeper(
      'scholar',
      'ARCHAEOLOGIST: Come back at the equinox. The sun comes in the passage and lights up the carvings. It lasts about fifty minutes.',
      'ARCHAEOLOGIST: Last year it was cloudy. The year before, also cloudy. It’s worth it, I promise.',
    ),
  },
  kildare: {
    'St Brigid’s Cathedral': keeper(
      'scholar',
      'SISTER: Brigid asked the King of Leinster for as much land as her cloak would cover. Then the cloak grew and covered the whole Curragh.',
      'SISTER: The King was raging. Fair play to her. We lit her flame again in 1993, and it hasn’t gone out since.',
    ),
  },
  dublin: {
    'St James’s Gate': keeper(
      'barman',
      'BREWER: Arthur Guinness signed a lease on this place for nine thousand years. Forty-five pound a year. We’ve 8,700 years left on it.',
      'BREWER: You let it settle. Then you top it. Anyone who doesn’t wait for the settle isn’t welcome in Dublin.',
    ),
    'Kilmainham Gaol': keeper(
      'guard',
      'GUIDE: Grace Gifford and Joseph Plunkett had ten minutes together after the wedding, with soldiers in the room. He was shot that morning.',
      'GUIDE: She never married again. Mind how you go now. It stays with you, this place.',
    ),
    'St Patrick’s Cathedral': keeper(
      'scholar',
      'VERGER: Jonathan Swift is buried here, under the floor. He wrote Gulliver’s Travels. Don’t stand on him, he was very particular.',
      'VERGER: Go on, put your arm through the hole in the door. Chance your arm. Nobody’s taken it off anyone in a few hundred years.',
    ),
    'The James Joyce Tower': keeper(
      'scholar',
      'JOYCE SCHOLAR: Ulysses happens on one day, the 16th of June 1904. It takes about three weeks to read. I’m on my eleventh go.',
      'JOYCE SCHOLAR: Down below is the Forty Foot. People swim there all year. In winter. On purpose.',
    ),
  },
  donegal: {
    'Glenveagh Castle': keeper(
      'trainer',
      'RANGER: That eagle up there is a golden eagle. We brought them back to Donegal after a hundred years. She’s fierce.',
      'RANGER: Mind the deer on the way out. Red deer. Bigger than your car, some of them, and twice as stubborn.',
    ),
    'Donegal Castle': keeper(
      'local',
      'GUIDE: Red Hugh burnt it so the English couldn’t have it. Then he went to Spain. Donegal has been waiting for him to come back since 1602.',
      'GUIDE: We keep his room made up, just in case.',
    ),
  },
  greystones: {
    'The Happy Pear': keeper(
      'pear',
      'PEAR TWIN (a third one?): Don’t mind me. I’m the cousin. We all look the same. Smoothie?',
      'PEAR COUSIN: Kale, ginger, a bit of sea water. Lovely. Your Ranemon will be swimming to Wales.',
    ),
    'Wicklow Gaol': keeper(
      'guard',
      'GAOL GUIDE: After 1798, prisoners went from here to Australia on the convict ships. Many never came home.',
      'GAOL GUIDE: Their great-great-grandchildren come back now from Sydney to see the cells. Sunburnt, and very emotional.',
    ),
    Glendalough: keeper(
      'scholar',
      'MONK: St Kevin lived up here in a cave by the lake. A blackbird laid her eggs in his hand while he prayed, and he held it still till they hatched.',
      'MONK: Weeks, that took. The lads at the monastery said he was just looking for an excuse not to do the washing up.',
    ),
  },
  brighton: {
    'The Royal Pavilion': keeper(
      'palace',
      'PAVILION GUIDE: The Prince Regent threw such big parties the kitchens had their own fake palm trees. Copper ones.',
      'PAVILION GUIDE: Your friend Enda has already asked if he can have his birthday here. I said I’d ask.',
    ),
  },
  belgium: {
    Gravensteen: keeper(
      'security',
      'CASTLE STEWARD: In 1949 the students of Ghent took over the castle to protest the price of beer. They won.',
      'CASTLE STEWARD: Please do not touch the torture tools. Your friend with the beard already tried. Twice.',
    ),
  },
  london: {
    'Big Ben': keeper(
      'border',
      'MAN IN HI-VIS: The bell weighs nearly fourteen tonnes. Still not as heavy as my Monday.',
      'MAN IN HI-VIS: They stopped it for five years for repairs. Parliament said nobody noticed. Everybody noticed.',
    ),
  },
  galway: {
    'The Spanish Arch': keeper(
      'busker',
      'BUSKER: I play under the Arch every day. I know “Galway Girl” in eleven keys. People only ever want the one.',
      'BUSKER: Down the river is the Claddagh, where the rings come from. Heart facing in, you’re taken. Facing out, you’re looking.',
    ),
  },
};

/** The person in a landmark's room: its own keeper, or a guide who just likes the place. */
export const keeperOf = (map: string, name: string): Npc =>
  KEEPERS[map]?.[name] ??
  keeper(
    'local',
    `GUIDE: Welcome to ${name}. Have a good look around, and mind the steps on the way out.`,
  );
