import type { Brand, GameMap, Look, Npc, Step, Trainer } from '@/lib/story/world';
import type { ItemId } from '@/lib/story/items';

/**
 * Silicon Docks, at the bottom of Dublin through the gap in the trees: a glass HQ for each of the
 * big tech companies round Grand Canal Dock, and the CEO of each one waiting at the top of it for
 * a battle. Each HQ has a receptionist behind the front desk, someone on staff who battles you on
 * the way up and someone else just working. Beat the seven and Stripe opens its door: the two
 * lads from Tipperary who started it are the last of them.
 *
 * The HQs are landmark doors 7 to 14 in Dublin, after every door Dublin had, so nothing that was
 * already there moves. 2D only, like everything new (Dublin is `flat`).
 */

/** Set the first time you walk into any HQ: the Missions screen picks it up from there. */
export const SILICON_START = 'silicon:start';

/** Every CEO but the Collisons beaten: Stripe's door opens. */
export const SILICON_SEVEN = 'silicon:seven';

/** Dublin's landmark doors before Silicon Docks: the HQs are the ones after these. */
export const FIRST_HQ = 7;

interface Hq {
  /** The company, as on the sign over the door. */
  company: string;
  /** The room's name. */
  name: string;
  /** Its own look: the colours of its building and rooms, and its logo. */
  brand: Brand;
  /** Said every time you walk in. */
  intro: string;
  ceo: {
    id: string;
    name: string;
    look: Look;
    team: [string, number][];
    prize: number;
    before: string;
    after: string;
    line: string;
    /** What they say when you talk to them once they're beaten. */
    beaten: string;
    gift: { item: ItemId; count: number; text: string };
  };
  staff: { id: string; name: string; team: [string, number][]; before: string; after: string };
  /** Said by whoever battles you on the way up, before and after. */
  staffTalk: string;
  receptionist: string;
  /** Someone at a desk, just working. */
  worker: string;
  /**
   * The room's furniture, by the template's letters (see `roomRows`): `s` the screens on the
   * back wall, `a` and `b` the left and right of the middle, `t` the desks, `f` floor and `r` rug.
   */
  decor: Record<'s' | 'a' | 'b' | 't' | 'f' | 'r', string>;
  things: Record<string, string>;
}

const say = (text: string): Step[] => [{ do: 'say', text }];

/**
 * Every HQ is laid out the same, with its own furniture: the CEO (1) at the top of the room, the
 * receptionist (2) behind the front desk by the door, the staffer who battles (3) looking along
 * the middle, and someone working (4) up by the CEO.
 */
const TEMPLATE = [
  'WWWWWWWWWWWW',
  'WOWWssssWWOW',
  'WNfff1ffffNW',
  'Wfffrrrrf4fW',
  'WaafrrrrfbbW',
  'WfffrrrrfffW',
  'Wttfffff3ttW',
  'Wff2fffffttW',
  'WfCCCfffffNW',
  'Wffff@fffffW',
  'WWWWWEWWWWWW',
];

function roomRows(decor: Hq['decor']): string[] {
  return TEMPLATE.map((row) => row.replace(/[satbfr]/g, (c) => decor[c as keyof Hq['decor']]));
}

const HQS: Hq[] = [
  {
    company: 'GOOGLE',
    brand: {
      logo: 'google',
      colour: '#4285f4',
      facade: '#f4f6fa',
      tint: 0.35,
      panel: '#ffffff',
      band: ['#4285f4', '#ea4335', '#fbbc05', '#34a853'],
    },
    name: 'Google HQ',
    intro:
      'GOOGLE, BARROW STREET. Slides between floors, a free canteen and a sign that says DON’T BE EVIL in very small letters.',
    ceo: {
      id: 'silicon-pichai',
      name: 'Sundar Pichai',
      look: 'pichai',
      team: [
        ['steadmon', 44],
        ['paulimon', 45],
        ['vinnimon', 45],
        ['hugomon', 46],
      ],
      prize: 3000,
      before:
        'SUNDAR PICHAI: Welcome to Google. Today I want to talk about AI. And AI. And, of course, AI. Shall we battle? With AI?',
      after:
        'SUNDAR PICHAI: I searched “how to beat this trainer” and it said to put glue on my pizza.',
      line: 'SUNDAR PICHAI: I’m feeling lucky!',
      beaten:
        'SUNDAR PICHAI: That battle has been added to our training data. Thank you for your contribution.',
      gift: {
        item: 'chicken-fillet-roll',
        count: 3,
        text: 'SUNDAR PICHAI: Take these from the canteen. It’s all free here. Well, you’re the product, but the rolls are free.',
      },
    },
    staff: {
      id: 'silicon-googler',
      name: 'Googler Aoife',
      team: [
        ['jammon', 42],
        ['conemon', 43],
      ],
      before: 'GOOGLER AOIFE: I’m on my third free lunch and it’s only eleven. Battle?',
      after: 'GOOGLER AOIFE: I’m going down the slide to think about this.',
    },
    staffTalk:
      'GOOGLER AOIFE: My job title is Senior Vibes Engineer. I don’t know what it means either.',
    receptionist:
      'RECEPTIONIST: Welcome to Google! Sign in on the iPad. No, the Pixel. We don’t talk about iPads in here.',
    worker:
      'GOOGLER: I’m working on a new chat app. It’s our fourteenth. We’ll shut it down in a year, like the other thirteen.',
    decor: { s: 'D', a: 'm', b: 'X', t: 'U', f: 'F', r: 'r' },
    things: {
      D: 'A wall of screens, each one showing a search box. Somebody has searched “is Ranemon real”.',
      m: 'A games machine, free to play. The high score belongs to someone called LARRY.',
      X: 'A big green robot statue. Someone has put a Dublin jersey on it.',
      U: 'Hot desks with free snacks on them. All of the Taytos are gone.',
    },
  },
  {
    company: 'META',
    brand: { logo: 'meta', colour: '#0866ff', facade: '#0866ff', tint: 0.4, panel: '#0866ff' },
    name: 'Meta HQ',
    intro: 'META. Everyone here is wearing a headset, waving at things that aren’t there.',
    ceo: {
      id: 'silicon-zuckerberg',
      name: 'Mark Zuckerberg',
      look: 'zuckerberg',
      team: [
        ['boydemon', 45],
        ['gibbsmon', 46],
        ['hugomon', 46],
        ['vinnimon', 47],
      ],
      prize: 3200,
      before:
        'MARK ZUCKERBERG: Hello, fellow human. I also enjoy battling Ranemon and smoking meats. Let us battle now, as humans do.',
      after: 'MARK ZUCKERBERG: In the metaverse, I won. And I had legs.',
      line: 'MARK ZUCKERBERG: Move fast and break things!',
      beaten: 'MARK ZUCKERBERG: I have added you as a friend. You cannot remove me.',
      gift: {
        item: 'full-irish',
        count: 2,
        text: 'MARK ZUCKERBERG: Here. I smoked the sausages myself. On my ranch. For seventeen hours. Is that normal?',
      },
    },
    staff: {
      id: 'silicon-metamate',
      name: 'Metamate Ciarán',
      team: [
        ['robinmon', 43],
        ['owemon', 44],
      ],
      before: 'METAMATE CIARÁN: Whoa, a real person! Hang on, let me take the headset off. Battle!',
      after: 'METAMATE CIARÁN: That felt so real. Was it real?',
    },
    staffTalk:
      'METAMATE CIARÁN: I spent nine hours in the metaverse today. I went to a meeting. Nobody else came.',
    receptionist:
      'RECEPTIONIST: Welcome to Meta. You don’t need to sign in. We already know who you are.',
    worker:
      'METAMATE: I moderate posts. Today’s were mostly people in Mayo arguing about a roundabout.',
    decor: { s: 'D', a: 'm', b: 'X', t: 'U', f: 'F', r: 'r' },
    things: {
      D: 'A big screen of everyone’s avatars at a meeting. None of them have legs.',
      m: 'A VR pod. Inside, someone is playing virtual hurling. They are losing to a virtual Kilkenny.',
      X: 'Smart glasses on a stand, watching you back.',
      U: 'Desks with a headset on every one. Somebody is still wearing theirs, asleep.',
    },
  },
  {
    company: 'MICROSOFT',
    brand: {
      logo: 'microsoft',
      colour: '#737373',
      facade: '#c8ccd0',
      tint: 0.4,
      panel: '#f4f4f4',
      band: ['#f25022', '#7fba00', '#00a4ef', '#ffb900'],
    },
    name: 'Microsoft HQ',
    intro:
      'MICROSOFT. A paperclip with eyes looks up at you from the reception desk. It seems to want to help.',
    ceo: {
      id: 'silicon-nadella',
      name: 'Satya Nadella',
      look: 'nadella',
      team: [
        ['steadmon', 46],
        ['simomon', 46],
        ['robinmon', 47],
        ['lorcamon', 47],
        ['paulimon', 48],
      ],
      prize: 3400,
      before:
        'SATYA NADELLA: Welcome. It looks like you’re trying to battle. Would you like Copilot to help you with that?',
      after: 'SATYA NADELLA: Microsoft Ranemon has stopped working. Send an error report?',
      line: 'SATYA NADELLA: Please wait while we install updates…',
      beaten:
        'SATYA NADELLA: You’re very good. Have you thought about working here? We’ll put you on Teams. Everyone’s on Teams.',
      gift: {
        item: 'monster',
        count: 3,
        text: 'SATYA NADELLA: Have these. Everyone here drinks them during the 9am stand-up. And the 10am. And the 11am.',
      },
    },
    staff: {
      id: 'silicon-msft',
      name: 'Engineer Deirdre',
      team: [
        ['conemon', 44],
        ['killemon', 45],
      ],
      before: 'ENGINEER DEIRDRE: I’m on a Teams call right now. I’m on mute. I can battle on mute.',
      after:
        'ENGINEER DEIRDRE: Have you tried turning your Ranemon off and on again? Mine, I mean.',
    },
    staffTalk:
      'ENGINEER DEIRDRE: Sorry, you were on mute. No, I was on mute. Ah, we’re all on mute.',
    receptionist:
      'RECEPTIONIST: Welcome to Microsoft. Please hold. Your visit is 3% complete. Estimated time left: 4 hours.',
    worker:
      'ENGINEER: I’ve been rebooting this PC since half nine. It’s on update 37 of 112. Don’t touch it.',
    decor: { s: 'D', a: 'Y', b: 'm', t: 'U', f: 'F', r: 'r' },
    things: {
      D: 'Screens showing a Teams call with forty people in it. Thirty-nine are on mute. One is eating.',
      Y: 'Boxes of Windows 95 on the shelves, and a sign: DO NOT INSTALL.',
      m: 'An Xbox in the break room, mid-match, with the controller still warm.',
      U: 'Desks with a laptop on each, all of them showing a blue screen.',
    },
  },
  {
    company: 'APPLE',
    brand: { logo: 'apple', colour: '#a2aaad', facade: '#fbfbfd', tint: 0.6, panel: '#ffffff' },
    name: 'Apple HQ',
    intro:
      'APPLE. White walls, white floors, white tables, and a phone on each one. You feel like you shouldn’t touch anything.',
    ceo: {
      id: 'silicon-cook',
      name: 'Tim Cook',
      look: 'cook',
      team: [
        ['lorcamon', 47],
        ['robinmon', 47],
        ['simomon', 48],
        ['conemon', 48],
        ['vinnimon', 49],
      ],
      prize: 3600,
      before:
        'TIM COOK: Good morning. Today we’re introducing the best battle we’ve ever made. We think you’re going to love it.',
      after: 'TIM COOK: That took courage. Real courage. Like when we took out the headphone jack.',
      line: 'TIM COOK: One more thing…',
      beaten:
        'TIM COOK: Ireland has been very good to us. We paid the €13 billion in the end, you know. Eventually. Under protest.',
      gift: {
        item: 'perfect-pour',
        count: 1,
        text: 'TIM COOK: Take this. Designed in California, poured at St James’s Gate. The charger is sold separately.',
      },
    },
    staff: {
      id: 'silicon-genius',
      name: 'Genius Niamh',
      team: [
        ['olliemon', 45],
        ['oismon', 46],
      ],
      before:
        'GENIUS NIAMH: Hi! Do you have an appointment at the Genius Bar? No? Then it’s a battle.',
      after: 'GENIUS NIAMH: Okay. I’ll book you in for next Thursday.',
    },
    staffTalk:
      'GENIUS NIAMH: Have you tried a new phone? It’s the same as your old phone, but it’s new.',
    receptionist:
      'RECEPTIONIST: Welcome to Apple. Your Ranemon aren’t compatible with this building. You’ll need an adapter.',
    worker:
      'DESIGNER: I’ve been working on this button for six years. It’s round. Before, it was also round.',
    decor: { s: 'D', a: 'X', b: 'X', t: 'X', f: 'F', r: 'F' },
    things: {
      D: 'A huge white screen with one word on it: THINK. Underneath, smaller: DIFFERENT. Underneath that, smaller still: €1,499.',
      X: 'A phone on a white table. It is exactly the same as the one next to it, but it costs more.',
    },
  },
  {
    company: 'AMAZON',
    brand: {
      logo: 'amazon',
      colour: '#ff9900',
      facade: '#232f3e',
      tint: 0.55,
      panel: '#232f3e',
      band: ['#ff9900'],
    },
    name: 'Amazon HQ',
    intro:
      'AMAZON. Boxes up to the ceiling, and a drone in the lobby with a package that says FRAGILE.',
    ceo: {
      id: 'silicon-bezos',
      name: 'Jeff Bezos',
      look: 'bezos',
      team: [
        ['killemon', 48],
        ['boydemon', 49],
        ['carlmon', 49],
        ['gibbsmon', 50],
        ['owemon', 51],
      ],
      prize: 4000,
      before:
        'JEFF BEZOS: I was going to fly to space today, but I had a battle pencilled in. You. Battle. Now. Next-day delivery.',
      after: 'JEFF BEZOS: Return to sender. That was me. I’m the sender.',
      line: 'JEFF BEZOS: Out for delivery!',
      beaten:
        'JEFF BEZOS: I’ll be honest with you. I don’t really work here any more. I just come in for the rockets.',
      gift: {
        item: 'blue-ghost',
        count: 3,
        text: 'JEFF BEZOS: Three Blue Ghosts, Prime delivery. They were left with your neighbour. Your neighbour is me.',
      },
    },
    staff: {
      id: 'silicon-picker',
      name: 'Picker Liam',
      team: [
        ['enda', 46],
        ['skehemon', 47],
      ],
      before:
        'PICKER LIAM: I’ve a target of 400 boxes an hour, and you’re in the way of box 401. Battle!',
      after: 'PICKER LIAM: There goes my bonus. And my toilet break.',
    },
    staffTalk:
      'PICKER LIAM: Twelve kilometres a day I walk round this floor. My Ranemon are fitter than any in Ireland.',
    receptionist:
      'RECEPTIONIST: Welcome to Amazon. Customers who visited this building also visited: Vapes, and McGrattans.',
    worker:
      'PACKER: This box has one Blue Ghost in it. And four kilos of bubble wrap. That’s the rule.',
    decor: { s: 'A', a: 'A', b: 'A', t: 'A', f: 'F', r: 'F' },
    things: {
      A: 'Shelves of boxes, every one of them the wrong size for what’s in it.',
    },
  },
  {
    company: 'TIKTOK',
    brand: {
      logo: 'tiktok',
      colour: '#fe2c55',
      facade: '#101014',
      tint: 0.65,
      panel: '#101014',
      band: ['#25f4ee', '#fe2c55'],
    },
    name: 'TikTok HQ',
    intro:
      'TIKTOK. The floor lights up, the music never stops and everyone is filming a dance in a corner.',
    ceo: {
      id: 'silicon-chew',
      name: 'Shou Chew',
      look: 'chew',
      team: [
        ['jammon', 49],
        ['crampemon', 50],
        ['thilomon', 50],
        ['oismon', 51],
        ['olliemon', 52],
      ],
      prize: 4200,
      before:
        'SHOU CHEW: Senator, I am Singaporean. Sorry, habit. I get asked a lot of questions. You have one: battle?',
      after: 'SHOU CHEW: That battle had nine million views before it was even over.',
      line: 'SHOU CHEW: For You!',
      beaten:
        'SHOU CHEW: The algorithm has learned everything about you from that battle. Your next video will be of a goat.',
      gift: {
        item: 'spice-bag',
        count: 2,
        text: 'SHOU CHEW: Have these. A video of a spice bag being opened has 40 million views this week. Nobody knows why.',
      },
    },
    staff: {
      id: 'silicon-creator',
      name: 'Creator Shauna',
      team: [
        ['owemon', 47],
        ['crampemon', 48],
      ],
      before:
        'CREATOR SHAUNA: Wait, wait, I’m live. Say hi to the chat! Okay, battle, but do it for the content.',
      after: 'CREATOR SHAUNA: Chat says you won. Chat is never wrong.',
    },
    staffTalk:
      'CREATOR SHAUNA: I post a dance every hour. My mam has seen every one and commented “lovely” on all of them.',
    receptionist:
      'RECEPTIONIST: Welcome to TikTok. Visitors get fifteen seconds. Fourteen. Thirteen…',
    worker:
      'CONTENT MODERATOR: Today’s trend is people saying “Ranemon” in a Cork accent. It’s mostly people from Cork.',
    decor: { s: 'D', a: 'I', b: 'I', t: 'U', f: 'l', r: 'l' },
    things: {
      D: 'A screen of videos scrolling up forever. You watch for a second and lose twenty minutes.',
      I: 'A speaker stack playing the same eight seconds of a song, over and over.',
      U: 'Ring lights and phones on tripods, all pointing at the same corner.',
    },
  },
  {
    company: 'X',
    brand: { logo: 'x', colour: '#14171a', facade: '#000000', tint: 0.7, panel: '#000000' },
    name: 'X HQ',
    intro:
      'X. It used to say TWITTER over the door. You can still see where the bird was, if you squint.',
    ceo: {
      id: 'silicon-musk',
      name: 'Elon Musk',
      look: 'musk',
      team: [
        ['hugomon', 50],
        ['skehemon', 51],
        ['enda', 51],
        ['carlmon', 52],
        ['crampemon', 52],
        ['thilomon', 53],
      ],
      prize: 4400,
      before:
        'ELON MUSK: I’m renaming this battle X. I’m renaming your Ranemon X. Actually, I’m renaming you X. Fight!',
      after: 'ELON MUSK: That was a bot. You’re a bot. Everyone who beats me is a bot.',
      line: 'ELON MUSK: Haha. Very funny. Concerning.',
      beaten:
        'ELON MUSK: I’ve decided I won that, actually. I’ll post about it at 3am. You can buy a blue tick for €8.',
      gift: {
        item: 'hair-of-the-dog',
        count: 2,
        text: 'ELON MUSK: Have these. They were going to Mars. The rocket blew up. Rapid unscheduled disassembly.',
      },
    },
    staff: {
      id: 'silicon-hardcore',
      name: 'Hardcore Engineer Gav',
      team: [
        ['killemon', 48],
        ['hugomon', 49],
      ],
      before:
        'HARDCORE ENGINEER GAV: I’ve slept under this desk for three weeks. I’m extremely hardcore. Battle!',
      after: 'HARDCORE ENGINEER GAV: I’m going back under the desk.',
    },
    staffTalk:
      'HARDCORE ENGINEER GAV: There used to be four thousand of us. Now it’s me and a fella who might be a bot.',
    receptionist:
      'RECEPTIONIST: Welcome to X, formerly Twitter. Formerly I was a receptionist. Now I’m also legal, sales and IT.',
    worker:
      'ENGINEER: I’m rewriting the whole thing in a weekend. Every weekend. It’s been two years.',
    decor: { s: 'o', a: 'I', b: 'm', t: 'U', f: 'k', r: 'k' },
    things: {
      o: 'A big black X on the wall, glowing. The word TWITTER is still on the bins.',
      I: 'A server, humming. Taped to it: DO NOT UNPLUG, THIS IS THE WHOLE WEBSITE.',
      m: 'A cybertruck arcade game. The doors don’t open.',
      U: 'Desks, mostly empty. One has a sleeping bag under it.',
    },
  },
  {
    company: 'STRIPE',
    brand: {
      logo: 'stripe',
      colour: '#635bff',
      facade: '#635bff',
      tint: 0.45,
      panel: '#ffffff',
      band: ['#635bff', '#80e9ff', '#7a73ff'],
    },
    name: 'Stripe HQ',
    intro:
      'STRIPE, GRAND CANAL DOCK. Bookshelves floor to ceiling, and a good smell of coffee. It feels more like a library than a tech company.',
    ceo: {
      id: 'silicon-collisons',
      name: 'Patrick & John Collison',
      look: 'pcollison',
      team: [
        ['steadmon', 54],
        ['vinnimon', 55],
        ['paulimon', 55],
        ['gibbsmon', 56],
        ['olliemon', 56],
        ['oismon', 57],
      ],
      prize: 8000,
      before:
        'PATRICK COLLISON: Two lads from Dromineer, on Lough Derg. We started this out of a bedroom. Now we’ll see what you’ve got, for real.',
      after: 'JOHN COLLISON: Well. That’s a payment declined. Fair play to you.',
      line: 'JOHN COLLISON: Go on, Patrick!',
      beaten:
        'PATRICK COLLISON: Beaten all of big tech, and two lads from Tipperary. Come back any time. We’ll have the kettle on.',
      gift: {
        item: 'mulligans',
        count: 1,
        text: 'JOHN COLLISON: You’ve beaten everyone in Silicon Docks. Have a Mulligan’s on us. The best pint in Dublin, and the payment’s gone through.',
      },
    },
    staff: {
      id: 'silicon-stripe',
      name: 'Engineer Fiachra',
      team: [
        ['lorcamon', 50],
        ['robinmon', 51],
        ['jammon', 51],
      ],
      before:
        'ENGINEER FIACHRA: You got past all of them? Then you can get past me. Or you can try.',
      after: 'ENGINEER FIACHRA: Go on up. The lads are expecting you.',
    },
    staffTalk:
      'ENGINEER FIACHRA: The lads read about four books a week. Each. I’m on chapter two of one, since March.',
    receptionist:
      'RECEPTIONIST: Welcome to Stripe. Tea or coffee? We have Barry’s and Lyons. We don’t talk about which is better.',
    worker:
      'WRITER: I work for Stripe Press. We make books about how things get built. Nobody believes me at parties.',
    decor: { s: 'Y', a: 'Y', b: 'N', t: 'U', f: 'F', r: 'r' },
    things: {
      Y: 'Books on bridges, rockets, cities and how to run a railway. Most of them have been read.',
      N: 'Plants everywhere, all of them alive. Somebody here actually waters them.',
      U: 'Long wooden desks. Someone has left a Lough Derg tea towel on one.',
    },
  },
];

/** Every CEO, in the order the HQs stand, west to east, north row then south. */
export const CEOS = HQS.map((h) => h.ceo.id);
/** The seven who have to be beaten before Stripe opens. */
export const SEVEN = CEOS.slice(0, -1);
export const COLLISONS = CEOS.at(-1)!;

/** Sets `SILICON_SEVEN` once all seven are beaten, whichever was last. */
const checkSeven = (rest: string[]): Step[] =>
  rest.length
    ? [{ do: 'if', flag: `beat:${rest[0]}`, then: checkSeven(rest.slice(1)) }]
    : [
        { do: 'flag', flag: SILICON_SEVEN },
        {
          do: 'say',
          text: 'Your phone buzzes: “STRIPE: Heard you’ve beaten all of big tech. The door at Grand Canal Dock is open. The kettle’s on.”',
        },
      ];

export const SILICON_TRAINERS: Trainer[] = HQS.flatMap((h, i): Trainer[] => [
  {
    id: h.staff.id,
    name: h.staff.name,
    team: h.staff.team,
    ai: 'normal',
    prize: Math.max(...h.staff.team.map(([, l]) => l)) * 30,
    before: h.staff.before,
    after: h.staff.after,
  },
  {
    id: h.ceo.id,
    name: h.ceo.name,
    team: h.ceo.team,
    ai: 'hard',
    prize: h.ceo.prize,
    before: h.ceo.before,
    after: h.ceo.after,
    line: h.ceo.line,
    reward: [
      { do: 'say', text: h.ceo.gift.text },
      { do: 'give', item: h.ceo.gift.item, count: h.ceo.gift.count },
      // The Collisons are last, and only open once the seven are beaten.
      ...(i < SEVEN.length ? checkSeven(SEVEN) : []),
    ],
  },
]);

function room(h: Hq): Pick<GameMap, 'rows' | 'npcs' | 'name' | 'things' | 'brand'> {
  const npcs: Npc[] = [
    {
      look: h.ceo.look,
      face: 'down',
      trainer: h.ceo.id,
      talk: say(h.ceo.beaten),
    },
    { look: 'receptionist', face: 'down', talk: say(h.receptionist) },
    { look: 'techie', face: 'left', trainer: h.staff.id, sight: 4, talk: say(h.staffTalk) },
    { look: 'techie', face: 'down', talk: say(h.worker) },
  ];
  // The Collisons are two: John stands beside Patrick, in the worker's place.
  if (h.ceo.id === COLLISONS) {
    npcs[3] = {
      look: 'jcollison',
      face: 'down',
      talk: say(
        'JOHN COLLISON: Patrick does the talking. I do the other talking. Come down to Lough Derg some time. The swimming is unreal, if you don’t mind the cold.',
      ),
    };
  }
  return {
    name: h.name,
    rows: roomRows(h.decor),
    npcs,
    things: h.things,
    brand: h.brand,
  };
}

/** What each HQ door says as you go in. Walking in once starts the Silicon Docks mission. */
export const SILICON_LANDMARKS: Step[][] = HQS.map((h) => [
  { do: 'say', text: h.intro },
  { do: 'flag', flag: SILICON_START },
]);

/** The rooms behind the HQ doors, by Dublin landmark index. */
export const SILICON_ROOMS = Object.fromEntries(
  HQS.map((h, i) => [FIRST_HQ + i, room(h)]),
) as Record<number, ReturnType<typeof room>>;

/** The company signs over the HQ doors, by Dublin landmark index. */
export const SILICON_LABELS = Object.fromEntries(
  HQS.map((h, i) => [FIRST_HQ + i, { text: h.company, colour: h.brand.colour, brand: h.brand }]),
) as Record<number, { text: string; colour: string; brand: Brand }>;

/** Stripe stays shut until the seven are beaten. */
export const SILICON_LOCKS = {
  [FIRST_HQ + SEVEN.length]: {
    flag: SILICON_SEVEN,
    locked:
      'STRIPE. A sign on the door: “Back soon. Gone to beat all of big tech? Come back when you have.”',
    opened: 'The door at Stripe is open. Somebody inside has the kettle on.',
  },
};

/** Dublin's signs in Silicon Docks, after every sign Dublin had. */
export const SILICON_SIGNS = [
  'SILICON DOCKS. Every big tech company in the world, round one dock. Every CEO inside is up for a battle.',
  'GRAND CANAL DOCK. Yachts nobody sails, kayaks everybody falls out of, and a lot of people in lanyards eating lunch.',
];

/**
 * Silicon Docks, as rows to go under Dublin's own: the tree line along the bottom of the city
 * with a gap in it, then the glass HQs, four along the top and four along the bottom, either side
 * of the dock. `z` is the glass. Each row is Dublin's width, with its strand and sea on the right.
 */
export const SILICON_ROWS = [
  'TTTTTTTTTTTTTTTTTTTTTTTTvTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'Tvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvdd~~T',
  'Tvzzzzzzvvvzzzzzzvvvvvvvvvvvvvvzzzzzzvvvzzzzzzvvvvvdd~~T',
  'Tvzzzzzzvvvzzzzzzvvvvvvvvvvvvvvzzzzzzvvvzzzzzzvvvvvdd~~T',
  'TvzzLzzzvvvzzLzzzvvvvvvSvvvvvvvzzLzzzvvvzzLzzzvvvvvdd~~T',
  'Tvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvdd~~T',
  'Taaaaaaacaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaacaaaaaadd~~T',
  'Tvvvvvvvvvvvvvvvvvv~~~~~~~~~~~vvvvvvvvvvvvvvvvvvvvvdd~~T',
  'Tvzzzzzzvvvzzzzzzvv~~~y~~~~~~~vzzzzzzvvvzzzzzzvvvvvdd~~T',
  'Tvzzzzzzvvvzzzzzzvv~~~~~~~y~~~vzzzzzzvvvzzzzzzvvvvvdd~~T',
  'TvzzLzzzvvvzzLzzzvv~~~~~~~~~~~vzzLzzzvvvzzLzzzvvvvvdd~~T',
  'Tvvvvvvvvvvvvvvvvvv~~~~~~~~~~~vvvvvvvvvvvvvvvvvvvvvdd~~T',
  'TvvvvvvvvvvvvvvvvvvvvvvvSvvvvvvvvvvvvvvvvvvvvvvvvvvdd~~T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];
