/**
 * What's new, newest first, for the Updates screen. Players read this, so no spoilers: say
 * what there is to find, never who or what it is, and nothing about test or developer tools.
 */
export interface Update {
  /** The day it went live, as YYYY-MM-DD. */
  date: string;
  title: string;
  notes: string[];
}

export const UPDATES: Update[] = [
  {
    date: '2026-10-25',
    title: 'A tidier bag',
    notes: [
      'The BAG has pockets now: FOOD, PINTS, VAPES, SPECIAL and KEY, with how many things are in each. Tap a thing to read what it does, and tap it again (or USE) to use it.',
      'Food stays open after you use it, so you can feed your whole party one after the other.',
      'In battle the BAG is split into pockets too, with what each thing does under its name.',
      'Every shop buys things back now. Pick SELL, choose how many, and the shop pays half what it charges. Key items and one-of-a-kind finds can’t be sold.',
      'The D-pad and keyboard work in the BAG and the shops: left and right change pocket, up and down pick a thing, A uses it and B goes back.',
    ],
  },
  {
    date: '2026-10-25',
    title: 'A man short',
    notes: [
      'Somebody at King’s Cross is looking for one more player for a big charity match, once you’ve won a few jerseys in England. Six famous faces stand in your way, and someone more famous after them.',
      'Each of them has a Ranemon of their own, never seen in the wild, with a page in the UK Ranedex.',
    ],
  },
  {
    date: '2026-10-25',
    title: 'The Online Champion',
    notes: [
      'There’s a crown up for grabs in friend battles, and only one trainer can hold it at a time. Ollie wears it for now. Beat him to take it.',
      'Beat the Online Champion and the crown is yours, along with the Champion’s skin, the grandest look in the game. Lose a friend battle while you hold it and it goes to whoever beat you.',
      'FRIEND BATTLE shows who holds the crown, and the Champion is crowned in the room, in battle and on their Trainer Card.',
    ],
  },
  {
    date: '2026-10-25',
    title: 'Battle mode catches up',
    notes: [
      'Battle mode has a ROSTER switch, with more Ranemon to battle with as you get further in Story mode. Your rival picks from the same roster.',
      'Switch FORMS to EVOLVED to battle with everyone fully evolved. Where a Ranemon can evolve more than one way, you pick which.',
      'Tap a Ranemon on YOUR TEAM to pick its look, something for it to hold and its moves, with each move’s type and power.',
      'In a friend battle, both trainers show up in the room in their skins, and tapping a Ranemon in your team shows its moves and what it’s holding.',
    ],
  },
  {
    date: '2026-10-25',
    title: 'A missing Ranedex page',
    notes: [
      'One Ranemon you’re given late in the story never had a page in the Ranedex. It has one now, with its types, entry, stats and moves, and if you have it already its page is filled in.',
    ],
  },
  {
    date: '2026-10-25',
    title: 'Not a fan',
    notes: [
      'Somebody in a café in Greystones thinks Ranemon are stupid, and is telling everyone. Maybe a battle will change their mind.',
      'Change it and there’s a new skin to earn, and a new item for a Ranemon to hold that keeps it chill.',
    ],
  },
  {
    date: '2026-10-25',
    title: 'The UK Ranedex',
    notes: [
      'Britain has a Ranedex of its own now: open the Ranedex and tap UK. It has every one of the lads drawn, their evolved forms too, and all of London’s own.',
      'UK Ranemon evolve now, at Lv30 like at home, into drawn versions of their evolved forms.',
      'Only the ones you meet over there count in it. Ireland’s Ranedex hasn’t changed.',
    ],
  },
  {
    date: '2026-10-25',
    title: 'Pick your moves',
    notes: [
      'Open a Ranemon in PARTY and every move shows its type and power, so you can see what you are working with.',
      'Tap MOVES (or CHANGE MOVES when it has spare ones) for a full screen of its moves: type, power, accuracy, PP and what each one is strong against.',
      'Tap a move it knows and a spare move to swap them. Swapped-out moves stay learnt, so you can always swap them back.',
    ],
  },
  {
    date: '2026-10-25',
    title: 'Straight to the point',
    notes: [
      'After a battle, the prize money, EXP, new levels and new moves all come in one box now, a line each, instead of a box for every one of them.',
      'Waking up in the pub after a loss is one box too. Evolutions still get their own moment.',
    ],
  },
  {
    date: '2026-10-25',
    title: 'Down in one',
    notes: [
      'When a wild Ranemon takes to you, you can see it drink the pint now: it flies in, goes down a sip at a time, and the last of it is knocked back in one before it joins you.',
      'Nothing else changes: the same pints work just as well as before.',
    ],
  },
  {
    date: '2026-10-25',
    title: 'A fresh pint over the sea',
    notes: [
      'Across the Irish Sea the pint by a wild Ranemon’s name starts fresh: it only shows for ones you’ve befriended over there.',
      'Your Ranedex keeps every one you’ve befriended, and back home the pint is as it was.',
    ],
  },
  {
    date: '2026-10-24',
    title: 'Silicon Docks',
    notes: [
      'Every big tech company has an HQ in Dublin now. Find the gap in the trees at the bottom of the city.',
      'Each one has someone at the top who’ll battle you, and something for you if you win. Beat enough of them and one more door opens.',
      'There are new skins to earn there, and a new mission on the START menu.',
    ],
  },
  {
    date: '2026-10-24',
    title: 'Every door opens',
    notes: [
      'Every building on the road now has a door, and someone inside to talk to. Castles, caves, cathedrals and abbeys all have a guide, a monk or a caretaker with a story about the place.',
      'A few buildings that were always shut are open now, in Dublin, Westmeath and Brighton. One of them sells chips.',
      'If you saved inside a house in Dublin, you’re still in the same house.',
    ],
  },
  {
    date: '2026-10-24',
    title: 'Bigger counties',
    notes: [
      'Every county on the road, Dublin included, is much bigger, and looks more like the real place: castles, cliffs, cathedrals, lakes, mountains and a few things only locals know about.',
      'There are new people to meet, local legends to hear, and a few gifts for anyone who goes looking. The places the trains go are bigger too.',
      'Everything you knew is where you left it: the new ground is to the east and south of each town.',
    ],
  },
  {
    date: '2026-10-24',
    title: 'Back to 2D',
    notes: [
      'The 3D look is switched off for now, so everything draws in the classic 2D look and the 2D / 3D button is gone.',
      'Nothing else changes: your save, your party and where you are all stay the same.',
    ],
  },
  {
    date: '2026-10-24',
    title: 'The Championship of Ireland',
    notes: [
      'Ranemon can now grow all the way to Lv100.',
      'Beaten B&S? A new line runs from Connolly Station, out west, to the toughest test in the country: four battles in a row with no trips to McGrattans in between.',
      'They keep pace with your best Ranemon, however strong you get. Stock up on food first.',
      'Rumour has it there’s one more room for anyone who makes it through.',
      'This trip is in the 2D look only. It switches to 2D by itself while you’re there.',
    ],
  },
  {
    date: '2026-10-24',
    title: 'The big lad',
    notes: [
      'Someone in McGrattans has a very big dog who badly needs a walk. Ask about him.',
      'You can walk one dog at a time.',
      'Dogs find things a bit less often now, so it’s more of a treat when they do.',
    ],
  },
  {
    date: '2026-10-24',
    title: 'No grinding needed',
    notes: [
      'Someone is sitting in the corner of every McGrattans with a sports bag of Blue Ghosts, going cheap. Don’t ask where they came from.',
      'A level cap: your Ranemon can’t grow past the level of the next gym leader’s strongest Ranemon. Beat the leader to raise it. PARTY shows the cap.',
      'Ranemon already past the cap keep their levels. They just won’t grow until it catches up.',
      'Once you’re Champion the cap is gone, and trainers you battle after that bring teams as strong as yours.',
    ],
  },
  {
    date: '2026-10-24',
    title: 'Missions',
    notes: [
      'A new MISSIONS option on the START menu shows every mission you have on the go, what to do next and where to go.',
      'Side stories appear there once you’ve started them, and drop off once they’re done.',
    ],
  },
  {
    date: '2026-10-24',
    title: 'Skins',
    notes: [
      'SKINS on the START menu: beat one of the characters you meet on your travels, or finish their side quest, and you can walk around dressed as them.',
      'The ones still to earn show as silhouettes, with a hint of how to get them. Anyone you’ve already beaten or helped is waiting for you there.',
      'Your skin shows on the map and on your Trainer Card. Skins are in the 2D look only for now.',
    ],
  },
  {
    date: '2026-10-24',
    title: 'Champions get a proper challenge',
    notes: [
      'After you’re Champion, the trip abroad is tougher: everyone at the door brings more Ranemon and battles smarter, and the long grass there is stronger too.',
      'The weekly rematch at Trinity has a new face on the team.',
      'One very rare Ranemon was far too strong and has been brought into line. It’s still the best around, just not unbeatable.',
    ],
  },
  {
    date: '2026-10-22',
    title: 'The celebrations go on',
    notes: [
      'Once you’re Champion, someone is looking for you back in Dublin with an invitation abroad. Already Champion? Head out into Dublin and you’ll be found.',
      'A fourth line runs from Connolly Station for anyone who says yes, to a night you won’t forget, if you can get past the door.',
      'A new tune to go with it, in the Sound Test too.',
      'This trip is in the 2D look only for now. It switches to 2D by itself while you’re there.',
    ],
  },
  {
    date: '2026-10-22',
    title: 'A new best friend',
    notes: [
      'Someone very friendly is waiting on the road out of Kildare, and he has big plans for a trip abroad. If you’re already past Kildare, go back and say hello.',
      'A new line runs from Connolly Station once you’ve been invited: a match, an arcade, and a few battles along the way.',
      'Some things to hold now work for any Ranemon, not only one kind.',
    ],
  },
  {
    date: '2026-10-22',
    title: 'A pint for old friends',
    notes: [
      'A wild Ranemon you’ve befriended before now has a wee pint next to its name in battle, so you know you’ve already got one.',
    ],
  },
  {
    date: '2026-10-22',
    title: 'County colours',
    notes: [
      'Every jersey you win now shows up on your Trainer Card in that county’s own colours, stripes and hoops included. The ones still to win are grey until you do.',
    ],
  },
  {
    date: '2026-10-22',
    title: 'Dublin gets bigger',
    notes: [
      'Dublin is a proper city now: more streets, more bridges over the Liffey, and pavements instead of fields. Everything that was there before is still there, a few streets further apart.',
      'Follow the music to the Rave Cave on the south side. The party never stops, and everyone on the dance floor wants a battle.',
      'Beat someone in the Rave Cave and they’ll happily go again whenever you ask. Good for training.',
    ],
  },
  {
    date: '2026-10-22',
    title: 'Friend battles',
    notes: [
      'FRIEND BATTLE on the title screen: battle a friend live with your Story mode Ranemon. Sign in with your trainer name and PIN, send them the room code, and both press READY.',
      'Pick the levels when you open the room: everyone at 50, a cap at 50, or as caught.',
    ],
  },
  {
    date: '2026-10-22',
    title: 'The Trinity Ball',
    notes: [
      'Beat B&S and Trinity turns into the Trinity Ball: fairy lights, balloons, confetti, fireworks, a dance floor in the Long Room and everyone having the time of their lives.',
      'A very tall man called Carl Ryan is at the Ball, selling Blue Ghosts out of a sports bag for a tenth of the Vapes price.',
    ],
  },
  {
    date: '2026-10-22',
    title: 'A question at Connolly',
    notes: [
      'Someone in a rugby kit is hanging around the concourse at Connolly Station. He has a question for you. It doesn’t matter what you say.',
    ],
  },
  {
    date: '2026-10-22',
    title: 'A famous face in Dublin',
    notes: [
      'A very famous, very sad man is standing about past Temple Bar, in very short shorts. Cheer him up with a battle, if you can.',
    ],
  },
  {
    date: '2026-10-22',
    title: 'All aboard at Connolly',
    notes: [
      'Connolly Station has opened in Dublin. Every train out of the city leaves from there now: pick where you’re going at the ticket desk.',
      'Keep an eye on the departures board. A few platforms are still waiting for their first train.',
    ],
  },
  {
    date: '2026-10-22',
    title: 'The DART',
    notes: [
      'The DART now runs south from Dublin, to a seaside town with very big houses, very nice boats and some locals who have a lot to get off their chests.',
      'Some things can now be given to a Ranemon to hold. Take them back any time from PARTY.',
    ],
  },
  {
    date: '2026-10-22',
    title: 'A familiar face in Trinity',
    notes: [
      'Someone very pink is hanging around Front Square. He has one thing to say, and he’ll say it more than once.',
    ],
  },
  {
    date: '2026-10-22',
    title: 'A mystery in Dublin',
    notes: [
      'There’s a new house by the river in Dublin, and the people inside are having a very bad day. Follow the clues around the city and decide who’s to blame.',
    ],
  },
  {
    date: '2026-10-22',
    title: 'Ranedex pages',
    notes: [
      'Tap a Ranemon in the Ranedex, or pick it with the D-pad and press A, for a page of its own: a big picture with all its looks, its stats, how it evolves, every move it learns and what each one is good against, and where to find it.',
      'In story mode a page only fills in once you’ve met or befriended that Ranemon, so nothing is given away early.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'New looks',
    notes: [
      'Some Ranemon now have a second look, from a brand new photo drawn in twice the detail. Pick which one you want on the team screen, or keep an eye out in the long grass.',
      'In the 3D look the new ones stand in battle as solid, rounded figures instead of flat pictures.',
      'Enda is now called Endamon, like everyone else.',
      'Four brand new Ranemon have turned up in the wild, each with a special move and an evolution of his own.',
      'The corner shop has something new on the rail. One Ranemon might take a shine to it.',
      'Most Ranemon now learn a second special move of their own later in the story, and every Ranedex entry has been rewritten.',
      'Beat B&S and they hand over a Ranemon you can’t get anywhere else.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'Sound and music',
    notes: [
      'The game has music now: its own tunes for the road, the city, the pub, home, gyms, the bike and four kinds of battle, plus jingles for levels, items and new friends.',
      'Every Ranemon has a cry of its own, and moves, hits and menus all make a noise.',
      'Tap ♪ at the top of the screen for music and effects, effects only, or off. SOUND TEST on the title plays them all.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'Get around faster',
    notes: [
      'Someone in Limerick is handing out passes for a brand new way to get about. Hold B to ride.',
      'Once you have one, a new option on the START menu takes you back to any town you’ve already been to.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'New at Vapes',
    notes: [
      'The shop now sells vapes, from Limerick on. Use one in battle to give the Ranemon that’s out a boost for the rest of the fight.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'A new friend',
    notes: ['A four-legged friend is waiting for you somewhere along the road. Say hello.'],
  },
  {
    date: '2026-10-21',
    title: 'Try the 2.5D look',
    notes: ['Tap the 3D button at the top of the screen to see the map and battles in 2.5D.'],
  },
  {
    date: '2026-10-21',
    title: 'Safer saves',
    notes: [
      'Your game is backed up as you play, and older saves carry over to new versions.',
      'Save codes let you move your game to another phone or browser.',
      'Online saves can be locked with a PIN.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'All aboard',
    notes: ['A train now runs from Dublin. Where it goes, and what’s waiting there, is up to you.'],
  },
  {
    date: '2026-10-21',
    title: 'Loads of new moves',
    notes: [
      '36 new moves themed on soccer, rugby, padel, golf, video games and F1, learnt as your Ranemon level up.',
      'Each Ranemon fights with 4 moves. Swap them in and out from PARTY.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'The Town Map',
    notes: [
      'Open MAP from START, or tap the place name, to see where you’ve been and which jerseys you’ve won.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'Sharper characters',
    notes: [
      'Everyone has been redrawn in far more detail.',
      'The locals in Dublin have an old story to tell, if you’re willing to listen.',
    ],
  },
  {
    date: '2026-10-21',
    title: 'A fresh coat of paint',
    notes: [
      'Painted battle backgrounds, a livelier overworld, and moves that show how well they’ll land.',
    ],
  },
  {
    date: '2026-10-20',
    title: 'Shinies and Exp Share',
    notes: [
      'Very rarely, a wild Ranemon is shiny: golden, sparkling, and worth catching.',
      'Turn on Exp Share from START to give your whole party the EXP.',
    ],
  },
  {
    date: '2026-10-20',
    title: 'Speed and a guide',
    notes: [
      'The ▶ button speeds the game up to 2× or 4×.',
      'New How to play page, with the type chart.',
    ],
  },
];

/** The newest update, to tell whether there's something new since you last looked. */
export const LATEST = `${UPDATES[0].date}:${UPDATES[0].title}`;
export const SEEN_KEY = 'ranemon.updates.seen';
