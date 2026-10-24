import type { Dir, Dog, Look } from '@/lib/story/world';
import { INK } from './pixels';

/**
 * The overworld's people, drawn in code at four device pixels to the world pixel: a head with
 * a real face (whites to the eyes, brows, a nose, ears), hair with strands and a shine, clothes
 * shaded in three tones with collars, seams and folds, hands, belts and soled shoes, and an
 * eight-frame walk. Each sprite is 16 × 24 world pixels, drawn at four times that.
 */

/** Device pixels: 64 wide and 96 tall. */
export const PERSON_W = 64;
export const PERSON_H = 96;

type Hair = 'short' | 'spiky' | 'long' | 'balding' | 'slick' | 'bun' | 'bouffant' | 'bob' | 'none';
type Hat = 'cap' | 'flat' | 'garda' | 'mortar' | 'beanie' | 'fila' | 'crown' | 'beret';
type Top =
  'jacket' | 'suit' | 'hivis' | 'gown' | 'jumper' | 'shirt' | 'waistcoat' | 'coat' | 'agbada';

export interface Style {
  skin: string;
  hair: string;
  hairStyle: Hair;
  hat?: { kind: Hat; colour: string; trim?: string };
  top: string;
  topKind: Top;
  /** Collar, cuffs, zip or stripe. */
  trim: string;
  legs: string;
  shoes: string;
  tie?: string;
  glasses?: 'glasses' | 'shades';
  bag?: string;
  /** Carried at the side, on the arm. */
  handbag?: string;
  /** A skirt over the top of the legs, which are then tights. */
  skirt?: string;
  pearls?: boolean;
  earrings?: string;
  /** A canvas tote bag over the shoulder, with a badge on it. */
  tote?: string;
  /** Little badges pinned on the front. */
  badges?: string[];
  /** A walking stick or staff, in the near hand, and the colour of its top. */
  stick?: string;
  stickTop?: string;
  /** The staff is a trident: three gold prongs instead of a knob. */
  trident?: boolean;
  /** A ring through the nose. */
  nosering?: boolean;
  beard?: string;
  /** A long string of beads, worn in two loops. */
  beads?: string;
  /** Embroidered medallions on a robe. */
  emblem?: string;
  /** A guitar slung across the back. */
  guitar?: string;
  /** Hoops round the top, like a Breton shirt. */
  stripes?: string;
  /** Little love hearts all over the clothes, in this colour. */
  hearts?: string;
  /** A child, or anyone short: drawn smaller. */
  small?: boolean;
  /** Anyone very short, like Enda: smaller again. */
  tiny?: boolean;
  /** Anyone very tall: drawn bigger, head and shoulders over everyone. */
  tall?: boolean;
  /** A big man, like Carl Ryan: drawn bigger again, towering over the tall. */
  big?: boolean;
  /** Big DJ headphones over the head, in this colour. */
  headphones?: string;
  /** A St George's cross on the chest. */
  cross?: string;
  /** Very short shorts, like the ones in a GAA kit, over bare legs: `legs` is then the skin. */
  shorts?: string;
  /** Socks pulled up above the shoes. */
  socks?: string;
  moustache?: string;
  /** A frown, and a tear on the cheek. */
  sad?: boolean;
  /** A glow stick in each hand, in this colour. */
  glowsticks?: string;
  /** A knitted balaclava over the whole head, in three bands left to right (as you look at it). */
  balaclava?: [string, string, string];
  /** Bands of Celtic knotwork down the sleeves, in this colour. */
  knots?: string;
  /** Sleeveless, with big bare arms: a gym vest. */
  vest?: boolean;
  /** A plastic bag pulled down over the whole head, with eye holes, in this colour. */
  plasticBag?: string;
  /** A leather strap across the chest from the shoulder, like an officer's Sam Browne belt. */
  strap?: string;
}

/** How tall someone `small` stands, next to everyone else. */
export const SMALL = 0.78;

/** How tall someone `tiny` stands, next to everyone else. */
export const TINY = 0.64;

/** How tall someone `tall` stands, next to everyone else. */
export const TALL = 1.22;

/** How big someone `big` is drawn, next to everyone else. */
export const BIG = 1.5;

/** How big someone is drawn, next to everyone else. */
export const scaleOf = (s: Style) =>
  s.tiny ? TINY : s.small ? SMALL : s.big ? BIG : s.tall ? TALL : 1;

const SKIN = '#f8d0a8';

export const STYLES: Record<Look | 'player', Style> = {
  // A red and white cap, brown hair, a blue jacket with white trim: the 5th generation's hero.
  player: {
    skin: SKIN,
    hair: '#6a3a1e',
    hairStyle: 'spiky',
    hat: { kind: 'cap', colour: '#e03c3a', trim: '#f8f8f8' },
    top: '#2f6ad0',
    topKind: 'jacket',
    trim: '#f4f4f4',
    legs: '#283048',
    shoes: '#d03030',
    bag: '#303848',
  },
  mam: {
    skin: SKIN,
    hair: '#8a4a22',
    hairStyle: 'long',
    top: '#e87898',
    topKind: 'jumper',
    trim: '#f8c0d0',
    legs: '#58607c',
    shoes: '#5a3a2a',
  },
  // The President: white hair, dark suit, a red tie.
  higgins: {
    skin: SKIN,
    hair: '#f0f0f0',
    hairStyle: 'balding',
    top: '#2c3040',
    topKind: 'suit',
    trim: '#f4f4f4',
    tie: '#c83030',
    legs: '#262a36',
    shoes: '#18181c',
    glasses: 'glasses',
  },
  // The rival: Margaret Thatcher. The hair that never moved, pearls, a royal blue suit and
  // the handbag.
  rival: {
    skin: '#f8d8b8',
    hair: '#d8c8a0',
    hairStyle: 'bouffant',
    top: '#1f4fa8',
    topKind: 'suit',
    trim: '#f4f4f4',
    tie: '#1f4fa8',
    legs: '#e8c8a8',
    shoes: '#1c2848',
    skirt: '#1f4fa8',
    handbag: '#141418',
    pearls: true,
  },
  farmer: {
    skin: SKIN,
    hair: '#8a8078',
    hairStyle: 'short',
    hat: { kind: 'flat', colour: '#7a6a50' },
    top: '#5a6a3a',
    topKind: 'coat',
    trim: '#8a7a4a',
    legs: '#4a3a2a',
    shoes: '#2a4a2a',
  },
  // A county jersey.
  lad: {
    skin: SKIN,
    hair: '#6a4a2a',
    hairStyle: 'short',
    top: '#f0a020',
    topKind: 'shirt',
    trim: '#2f8a4a',
    legs: '#3a4a6a',
    shoes: '#f4f4f4',
  },
  leader: {
    skin: SKIN,
    hair: '#202020',
    hairStyle: 'slick',
    top: '#c83030',
    topKind: 'jacket',
    trim: '#f8d048',
    legs: '#202028',
    shoes: '#f4f4f4',
  },
  trainer: {
    skin: SKIN,
    hair: '#8a5a30',
    hairStyle: 'short',
    hat: { kind: 'beanie', colour: '#4a90d8' },
    top: '#3a78c8',
    topKind: 'jacket',
    trim: '#f4f4f4',
    legs: '#3a3a48',
    shoes: '#e8a020',
    bag: '#c84a30',
  },
  // An Garda Síochána: peaked cap, hi-vis over the navy.
  guard: {
    skin: SKIN,
    hair: '#3a2a1a',
    hairStyle: 'short',
    hat: { kind: 'garda', colour: '#1c2848', trim: '#e8c040' },
    top: '#d8e030',
    topKind: 'hivis',
    trim: '#c8ccd4',
    legs: '#1c2848',
    shoes: '#141418',
  },
  scholar: {
    skin: SKIN,
    hair: '#4a3a30',
    hairStyle: 'short',
    hat: { kind: 'mortar', colour: '#202020', trim: '#e8c040' },
    top: '#202024',
    topKind: 'gown',
    trim: '#f4f4f4',
    legs: '#202020',
    shoes: '#141418',
    glasses: 'glasses',
  },
  bns: {
    skin: '#f0c098',
    hair: '#202020',
    hairStyle: 'slick',
    top: '#202024',
    topKind: 'suit',
    trim: '#f4f4f4',
    tie: '#202024',
    legs: '#2a2a34',
    shoes: '#101014',
    glasses: 'shades',
  },
  local: {
    skin: SKIN,
    hair: '#c06a30',
    hairStyle: 'short',
    top: '#58a058',
    topKind: 'jumper',
    trim: '#88c888',
    legs: '#5a6a8a',
    shoes: '#5a3a2a',
  },
  // Dua Lipa, pulling pints in McGrattans: long black hair, gold hoops, a black top.
  barman: {
    skin: '#f0c8a0',
    hair: '#141418',
    hairStyle: 'long',
    top: '#18181c',
    topKind: 'shirt',
    trim: '#d4a838',
    legs: '#202028',
    shoes: '#101014',
    earrings: '#f0c040',
  },
  // Saoirse, the Tipperary gym leader: a blue bob with a straight fringe, round glasses, a nose
  // ring, an oversized green cardigan covered in badges, a tote bag and Docs.
  saoirse: {
    skin: '#f8d8c0',
    hair: '#3aa8e8',
    hairStyle: 'bob',
    top: '#4a9a6a',
    topKind: 'jumper',
    trim: '#f0e0b0',
    legs: '#2a2a38',
    shoes: '#5a1a22',
    glasses: 'glasses',
    earrings: '#c8ccd4',
    tote: '#ece0c4',
    badges: ['#e83a8a', '#f8d048', '#9b7be8'],
    nosering: true,
  },
  // The old man in Thurles, a retired donkey vet: flat cap, tweed jacket, a blackthorn stick.
  oldman: {
    skin: '#f0c8a8',
    hair: '#e8e8e8',
    hairStyle: 'balding',
    hat: { kind: 'flat', colour: '#6a5a48' },
    top: '#8a7458',
    topKind: 'coat',
    trim: '#5a4a38',
    legs: '#4a4038',
    shoes: '#2a2018',
    glasses: 'glasses',
    stick: '#3a2a1a',
  },
  shopkeeper: {
    skin: SKIN,
    hair: '#c8c8c8',
    hairStyle: 'short',
    top: '#2f8a4a',
    topKind: 'coat',
    trim: '#f4f4f4',
    legs: '#3a3a48',
    shoes: '#2a2a30',
    glasses: 'glasses',
  },
  // The legend in Dublin, never named: cream agbada with embroidered medallions over white, a
  // folded fila cap, coral beads, a red-brown beard and a black staff topped with gold.
  legend: {
    skin: '#f4c8a8',
    hair: '#9a5a30',
    hairStyle: 'short',
    beard: '#a8602e',
    hat: { kind: 'fila', colour: '#e4d4b4' },
    top: '#e4d4b4',
    topKind: 'agbada',
    trim: '#f8f8f4',
    legs: '#f4f4f0',
    shoes: '#c8a878',
    beads: '#f08a58',
    stick: '#1c1c22',
    stickTop: '#f0c040',
    emblem: '#3a8a84',
  },
  // A busker by the Park: beanie, parka, a guitar on his back.
  busker: {
    skin: SKIN,
    hair: '#5a3a22',
    hairStyle: 'long',
    beard: '#5a3a22',
    hat: { kind: 'beanie', colour: '#c8443a' },
    top: '#5a7048',
    topKind: 'coat',
    trim: '#8a9a6a',
    legs: '#3a4a6a',
    shoes: '#4a3424',
    guitar: '#b8742c',
  },
  // The clerk at the ticket desk in Connolly: Iarnród Éireann green, a white shirt and glasses.
  clerk: {
    skin: SKIN,
    hair: '#8a5a32',
    hairStyle: 'bob',
    glasses: 'glasses',
    top: '#2e7a4a',
    topKind: 'jumper',
    trim: '#f4f4f0',
    legs: '#1c2a24',
    shoes: '#141418',
  },
  // An Iarnród Éireann conductor: navy uniform, green tie, a peaked cap with a gold badge.
  conductor: {
    skin: SKIN,
    hair: '#4a3a2a',
    hairStyle: 'short',
    hat: { kind: 'garda', colour: '#1c3050', trim: '#e8c040' },
    top: '#1c3050',
    topKind: 'suit',
    trim: '#e8ecf0',
    tie: '#2e8a4a',
    legs: '#1c3050',
    shoes: '#141418',
  },
  // Josh Lee, who surfs Bundoran all year: bleached hair, shades, a wetsuit top and board shorts.
  josh: {
    skin: '#e8b890',
    hair: '#f0d890',
    hairStyle: 'spiky',
    glasses: 'shades',
    top: '#1c2a38',
    topKind: 'shirt',
    trim: '#30b0c0',
    legs: '#e86a30',
    shoes: '#2a2a2a',
  },
  // Sibeal, who owns Norm: long brown hair, a red rain jacket, jeans, a lead round her wrist.
  sibeal: {
    skin: SKIN,
    hair: '#7a4a26',
    hairStyle: 'long',
    top: '#c83a3a',
    topKind: 'jacket',
    trim: '#f4e8d8',
    legs: '#3a5a8a',
    shoes: '#5a3a24',
    earrings: '#e8c040',
    handbag: '#2a2a30',
  },
  // The Lime rep: a lime-green hi-vis with a white stripe, a black cap and black trousers.
  lime: {
    skin: '#e8b890',
    hair: '#2a1e16',
    hairStyle: 'short',
    hat: { kind: 'cap', colour: '#1c1c1c', trim: '#7ad321' },
    top: '#7ad321',
    topKind: 'hivis',
    trim: '#f4f8f0',
    legs: '#1c1c22',
    shoes: '#f4f4f4',
  },
  // Poseidon, god of the sea: sea-green skin, a white beard, a gold crown and a trident.
  poseidon: {
    skin: '#9cd0c8',
    hair: '#f4f6f8',
    hairStyle: 'long',
    beard: '#f4f6f8',
    hat: { kind: 'crown', colour: '#f0c040', trim: '#2a8ad0' },
    top: '#e8f2f6',
    topKind: 'agbada',
    trim: '#2a8ad0',
    legs: '#e8f2f6',
    shoes: '#c8a050',
    stick: '#c89830',
    stickTop: '#f0c040',
    trident: true,
    emblem: '#2a8ad0',
  },
  // Ollie, in the house by the river: a black beret, a Breton top and a red neckerchief.
  ollie: {
    skin: SKIN,
    hair: '#3a2618',
    hairStyle: 'short',
    hat: { kind: 'beret', colour: '#1c1c22' },
    top: '#f4f4f0',
    topKind: 'shirt',
    trim: '#d03a3a',
    stripes: '#1f3a8a',
    legs: '#2a3048',
    shoes: '#5a3a24',
  },
  // Simo, his housemate: a swept-back quiff, a teal shirt and white trainers.
  simo: {
    skin: '#f0c8a0',
    hair: '#4a2e1a',
    hairStyle: 'slick',
    top: '#2aa8a0',
    topKind: 'shirt',
    trim: '#f4f4f0',
    legs: '#3a3a48',
    shoes: '#f4f4f4',
  },
  // MC: small, with long red hair, a green jumper, a skirt and Irish dancing shoes.
  mc: {
    skin: '#f8dcc0',
    hair: '#c8582a',
    hairStyle: 'long',
    top: '#2f8a4a',
    topKind: 'jumper',
    trim: '#f4e8c8',
    skirt: '#1f5a34',
    legs: '#f4f4f0',
    shoes: '#141418',
    small: true,
  },
  // Melchior, King of France: a gold crown, a long dark wig, a royal blue robe trimmed with
  // ermine, a sceptre, white stockings and red heels.
  melchior: {
    skin: SKIN,
    hair: '#3a2416',
    hairStyle: 'long',
    hat: { kind: 'crown', colour: '#f0c040', trim: '#c83030' },
    top: '#2a3a98',
    topKind: 'coat',
    trim: '#f4f0e8',
    legs: '#f4f4f0',
    shoes: '#c83030',
    stick: '#c89830',
    stickTop: '#f0c040',
  },
  // A DART driver: Iarnród Éireann green, with the DART's yellow-green trim and a peaked cap.
  dart: {
    skin: SKIN,
    hair: '#3a2a1e',
    hairStyle: 'short',
    hat: { kind: 'garda', colour: '#1e6a3a', trim: '#e8c040' },
    top: '#1e6a3a',
    topKind: 'jacket',
    trim: '#c8e830',
    legs: '#1c2a24',
    shoes: '#141418',
  },
  // Kill, in Greystones: blond, in a navy jumper over a white collar, with chinos and loafers.
  kill: {
    skin: '#f8d4b4',
    hair: '#ecd078',
    hairStyle: 'short',
    top: '#262c44',
    topKind: 'jumper',
    trim: '#f4f4f0',
    legs: '#c8b48a',
    shoes: '#6a3a1e',
  },
  // Stead, also in Greystones: an England shirt, white with a red cross, and navy trousers.
  stead: {
    skin: SKIN,
    hair: '#5a3a22',
    hairStyle: 'short',
    top: '#f4f4f4',
    topKind: 'shirt',
    trim: '#1c2448',
    cross: '#c8102e',
    legs: '#1c2448',
    shoes: '#f4f4f4',
  },
  // Cramps, a DJ: slicked strawberry-blond hair, a big beard, all in black, headphones on.
  cramps: {
    skin: '#f8d0b0',
    hair: '#d8a860',
    hairStyle: 'slick',
    beard: '#b07038',
    top: '#18181c',
    topKind: 'jumper',
    trim: '#2a2a30',
    legs: '#24242c',
    shoes: '#f4f4f4',
    headphones: '#c83a3a',
  },
  // The Happy Pear twins, who look exactly alike: shaggy hair and beards, big grins, the café's
  // green t-shirt with a pear on it, and running shoes. In very good shape.
  pear: {
    skin: '#f0c49a',
    hair: '#8a5a2a',
    hairStyle: 'long',
    beard: '#8a5a2a',
    top: '#6ab03a',
    topKind: 'shirt',
    trim: '#f4f4e8',
    badges: ['#c8e050'],
    legs: '#2a3a30',
    shoes: '#f06a30',
  },
  // A cyclist in Greystones: head to toe in lycra, shades, and a bike worth more than a car.
  cyclist: {
    skin: '#f0c8a0',
    hair: '#6a4a2a',
    hairStyle: 'short',
    hat: { kind: 'cap', colour: '#f4f4f4', trim: '#f0c020' },
    glasses: 'shades',
    top: '#f0c020',
    topKind: 'shirt',
    trim: '#1c1c1c',
    legs: '#1c1c1c',
    shoes: '#f4f4f4',
  },
  // Alex Simonin, who only has eyes for Simomon: pink from his beanie to his shoes, with love
  // hearts all over.
  alex: {
    skin: SKIN,
    hair: '#6a3a1e',
    hairStyle: 'short',
    hat: { kind: 'beanie', colour: '#f070a8' },
    top: '#f48cb8',
    topKind: 'jumper',
    trim: '#fbc4dc',
    legs: '#e8609c',
    shoes: '#fbc4dc',
    hearts: '#d81e5b',
  },
  // Paul Mescal, Academy Award nominee and very sad about it: a moustache, a white T-shirt, tiny
  // navy GAA shorts and his socks pulled up.
  mescal: {
    skin: SKIN,
    hair: '#5a3a22',
    hairStyle: 'short',
    moustache: '#5a3a22',
    sad: true,
    top: '#f4f4f0',
    topKind: 'shirt',
    trim: '#d8d8d0',
    legs: SKIN,
    shorts: '#1e2a5a',
    socks: '#f4f4f4',
    shoes: '#5a5a62',
  },
  // Jamie Boyde, as Boydemon's second look: swept-back dirty blond hair, a red rugby jersey with
  // a white collar, black shorts and his socks pulled up.
  boyde: {
    skin: SKIN,
    hair: '#b8894e',
    hairStyle: 'slick',
    top: '#d8392c',
    topKind: 'shirt',
    trim: '#f4f4f0',
    legs: SKIN,
    shorts: '#1a1a22',
    socks: '#f4f4f4',
    shoes: '#141418',
  },
  // Carl Ryan: a big man, in a stone-coloured blazer over an open white shirt, navy trousers, a
  // black belt, clubmaster shades and a moustache, with a blue sports bag full of cans.
  carl: {
    skin: SKIN,
    hair: '#2e2018',
    hairStyle: 'slick',
    top: '#d8d0c0',
    topKind: 'suit',
    trim: '#f6f6f8',
    legs: '#1c2440',
    shoes: '#2a1e16',
    glasses: 'shades',
    moustache: '#4a3020',
    bag: '#3a8ae8',
    big: true,
  },
  // At the Ball in black tie, bow tie loosened.
  reveller: {
    skin: '#e8b890',
    hair: '#c89048',
    hairStyle: 'slick',
    top: '#1c1c24',
    topKind: 'suit',
    trim: '#f4f4f4',
    tie: '#1c1c24',
    legs: '#1c1c24',
    shoes: '#0c0c10',
  },
  // At the Ball in a long red dress, with gold earrings and a little clutch bag.
  debs: {
    skin: SKIN,
    hair: '#e0c068',
    hairStyle: 'long',
    top: '#c8284a',
    topKind: 'shirt',
    trim: '#e8506e',
    legs: '#f0c8a8',
    shoes: '#d4a838',
    skirt: '#c8284a',
    earrings: '#f0c040',
    handbag: '#d4a838',
  },
  // At the Ball in a sparkly blue dress, hair up in a bun.
  dancer: {
    skin: '#c88a5a',
    hair: '#1c1418',
    hairStyle: 'bun',
    top: '#2a6ad8',
    topKind: 'shirt',
    trim: '#9cd4ff',
    legs: '#c88a5a',
    shoes: '#e8e8f0',
    skirt: '#2a6ad8',
    earrings: '#e8e8f0',
    pearls: true,
  },
  // At the Ball in a white dinner jacket and a red bow tie.
  tux: {
    skin: SKIN,
    hair: '#2a1a12',
    hairStyle: 'spiky',
    top: '#f4f0e6',
    topKind: 'suit',
    trim: '#1c1c24',
    tie: '#d02840',
    legs: '#1c1c24',
    shoes: '#0c0c10',
    glasses: 'shades',
  },
  // The Rave Cave's dancers: neon tops, a glow stick in each hand.
  raver: {
    skin: SKIN,
    hair: '#e8c060',
    hairStyle: 'spiky',
    top: '#70f040',
    topKind: 'shirt',
    trim: '#f040a0',
    legs: '#24242c',
    shoes: '#f4f4f4',
    glowsticks: '#f040a0',
  },
  clubber: {
    skin: '#e8b890',
    hair: '#1c1418',
    hairStyle: 'bob',
    hat: { kind: 'beanie', colour: '#30d0f0' },
    glasses: 'shades',
    top: '#18161c',
    topKind: 'shirt',
    trim: '#30d0f0',
    legs: '#3a2a5a',
    shoes: '#18161c',
    glowsticks: '#70f040',
  },
  shuffler: {
    skin: '#c88a5a',
    hair: '#3a2416',
    hairStyle: 'short',
    hat: { kind: 'cap', colour: '#f8d030', trim: '#18161c' },
    top: '#a040e0',
    topKind: 'jumper',
    trim: '#f8d030',
    legs: '#24242c',
    shoes: '#f4f4f4',
    glowsticks: '#30d0f0',
  },
  // The Rave Cave's DJ: all in black, a cap and big headphones.
  dj: {
    skin: SKIN,
    hair: '#5a3a22',
    hairStyle: 'short',
    hat: { kind: 'cap', colour: '#18161c', trim: '#f040a0' },
    beard: '#5a3a22',
    top: '#18161c',
    topKind: 'shirt',
    trim: '#f040a0',
    legs: '#18161c',
    shoes: '#f4f4f4',
    headphones: '#f040a0',
  },
  // The bouncer on the door: a shaved head, a black suit and shades, even at night.
  bouncer: {
    skin: '#f0c49a',
    hair: '#f0c49a',
    hairStyle: 'none',
    glasses: 'shades',
    top: '#18181c',
    topKind: 'suit',
    trim: '#f4f4f4',
    tie: '#18181c',
    legs: '#18181c',
    shoes: '#0c0c10',
  },
  // Enda, in Kildare and Brighton: very small, brown hair, a big smile, a cosy blue jumper with
  // little red hearts all over it, and his good runners for the trip.
  enda: {
    skin: SKIN,
    hair: '#6a3e1e',
    hairStyle: 'short',
    top: '#3a6ac8',
    topKind: 'jumper',
    trim: '#f4f4f0',
    hearts: '#e8445a',
    legs: '#2a3048',
    shoes: '#f4f4f4',
    tiny: true,
  },
  // The Sail & Rail's sailor: a white peaked cap and a navy jacket with gold trim.
  sailor: {
    skin: '#f0c49a',
    hair: '#4a3020',
    hairStyle: 'short',
    hat: { kind: 'garda', colour: '#f4f4f4', trim: '#1c2848' },
    top: '#1c2848',
    topKind: 'jacket',
    trim: '#e8c040',
    beard: '#4a3020',
    legs: '#1c2848',
    shoes: '#141418',
  },
  // On a hen do on the seafront: a pink top, a sash's worth of glitter and a tiara.
  hen: {
    skin: '#f8c8a0',
    hair: '#e8c870',
    hairStyle: 'long',
    hat: { kind: 'crown', colour: '#f0d0f0', trim: '#f040a0' },
    top: '#f070b0',
    topKind: 'shirt',
    trim: '#f8f0f8',
    skirt: '#1c1c24',
    legs: '#f8c8a0',
    shoes: '#f4f4f4',
    earrings: '#f0c040',
  },
  // A Seagulls fan: the Brighton home shirt, blue and white stripes.
  fan: {
    skin: SKIN,
    hair: '#5a3a22',
    hairStyle: 'short',
    top: '#f4f4f4',
    topKind: 'shirt',
    trim: '#1f5fb8',
    stripes: '#1f5fb8',
    legs: '#283048',
    shoes: '#f4f4f4',
  },
  // A Crystal Palace fan: red and blue, a scarf's worth of rage, and a shaved head.
  palace: {
    skin: '#f0c49a',
    hair: '#f0c49a',
    hairStyle: 'none',
    top: '#c8283a',
    topKind: 'shirt',
    trim: '#1f3a8a',
    stripes: '#1f3a8a',
    legs: '#2a2a30',
    shoes: '#141418',
  },
  // In the arcade: a hoodie, a cap on backwards and headphones round the neck.
  gamer: {
    skin: '#e8b890',
    hair: '#2a1a12',
    hairStyle: 'short',
    hat: { kind: 'cap', colour: '#70f040', trim: '#18161c' },
    top: '#3a2a5a',
    topKind: 'jumper',
    trim: '#30d0f0',
    legs: '#24242c',
    shoes: '#f4f4f4',
    glasses: 'glasses',
  },
  // The Arcade King: a gold crown, shades indoors and a leather jacket with a gold zip.
  king: {
    skin: '#f0c8a0',
    hair: '#2a1a12',
    hairStyle: 'slick',
    hat: { kind: 'crown', colour: '#f0c040', trim: '#c83030' },
    glasses: 'shades',
    top: '#18181e',
    topKind: 'jacket',
    trim: '#f0c040',
    moustache: '#2a1a12',
    legs: '#2a3048',
    shoes: '#f4f4f4',
    tall: true,
  },
  // The Eurostar host on platform 4: a navy uniform with yellow trim and a little navy cap.
  eurostar: {
    skin: '#e8b890',
    hair: '#2a1a12',
    hairStyle: 'bun',
    hat: { kind: 'garda', colour: '#1c2448', trim: '#f0d030' },
    top: '#1c2448',
    topKind: 'jacket',
    trim: '#f0d030',
    tie: '#f0d030',
    legs: '#1c2448',
    shoes: '#141418',
  },
  // Festival security in Ghent: a shaved head, a black T-shirt under a hi-vis vest, and black
  // combats. Nobody gets past.
  security: {
    skin: '#f0c49a',
    hair: '#f0c49a',
    hairStyle: 'none',
    top: '#e8f030',
    topKind: 'hivis',
    trim: '#d0d0d8',
    legs: '#18181c',
    shoes: '#0c0c10',
  },
  // DJ Próvaí of Kneecap: a hand-knitted tricolour balaclava, a black and dark green boiler-suit
  // tracksuit with red piping, and white Celtic knotwork down the sleeves.
  provai: {
    skin: '#f0c49a',
    hair: '#f0c49a',
    hairStyle: 'none',
    top: '#1c2a20',
    topKind: 'jacket',
    trim: '#c8282a',
    legs: '#18221a',
    shoes: '#141418',
    balaclava: ['#1e9a50', '#f4f2ea', '#f08a24'],
    knots: '#ecece4',
  },
  // A Dublin Bus driver: a pale blue shirt, a navy jumper and a lanyard.
  bus: {
    skin: '#f0c8a0',
    hair: '#4a3020',
    hairStyle: 'balding',
    top: '#1e2e5a',
    topKind: 'jumper',
    trim: '#9cc4ec',
    tie: '#f0c020',
    legs: '#262a36',
    shoes: '#18181c',
    moustache: '#4a3020',
  },
  // Liam Neeson, behind the bar of every W.B Yates: very tall, grey and very serious, in a black
  // shirt with the sleeves rolled up.
  neeson: {
    skin: '#ecc09a',
    hair: '#8a8a90',
    hairStyle: 'short',
    top: '#202024',
    topKind: 'shirt',
    trim: '#34343a',
    legs: '#2a2a32',
    shoes: '#18181c',
    tall: true,
  },
  // UK Border Force: a navy uniform, a peaked cap and a lanyard.
  border: {
    skin: '#f0c8a0',
    hair: '#3a2a1e',
    hairStyle: 'short',
    hat: { kind: 'garda', colour: '#141a30', trim: '#d0d4dc' },
    top: '#1a2038',
    topKind: 'jacket',
    trim: '#d0d4dc',
    tie: '#141418',
    legs: '#1a2038',
    shoes: '#0c0c10',
  },
  // Ryanair cabin crew: a navy uniform with yellow trim, a bun and a scarf.
  crew: {
    skin: '#f0c8a0',
    hair: '#c89a50',
    hairStyle: 'bun',
    top: '#123278',
    topKind: 'jacket',
    trim: '#f0c020',
    tie: '#f0c020',
    legs: '#123278',
    shoes: '#141418',
  },
  // A stag at the gate: matching pink T-shirt, shorts in October.
  stag: {
    skin: '#f4c8a8',
    hair: '#a86a30',
    hairStyle: 'spiky',
    top: '#f070a8',
    topKind: 'shirt',
    trim: '#f8f8f8',
    legs: '#f4c8a8',
    shorts: '#3a5a8a',
    socks: '#f8f8f8',
    shoes: '#f8f8f8',
  },
  // The man who's been at the gate since 5am: a fleece, a neck pillow and a carry-on.
  gatecamper: {
    skin: '#f0c8a0',
    hair: '#6a6a70',
    hairStyle: 'balding',
    top: '#3a6a4a',
    topKind: 'jumper',
    trim: '#d8b048',
    legs: '#8a7a5a',
    shoes: '#5a3a24',
    bag: '#2a2a34',
    glasses: 'glasses',
  },
  // Donal, the Corkman who runs W.B Yates in London: grey curls, a waistcoat over a white shirt.
  donal: {
    skin: '#f0bc98',
    hair: '#b8b8b8',
    hairStyle: 'short',
    top: '#3a2a22',
    topKind: 'waistcoat',
    trim: '#f4f4f0',
    legs: '#2a2a30',
    shoes: '#2a1a12',
    moustache: '#b8b8b8',
  },
  // A trad fiddler: a flat cap, a cardigan and a beard.
  fiddler: {
    skin: '#f0c8a0',
    hair: '#5a3a24',
    hairStyle: 'short',
    hat: { kind: 'flat', colour: '#5a5a4a' },
    beard: '#5a3a24',
    top: '#7a3a2a',
    topKind: 'jumper',
    trim: '#5a2a1a',
    legs: '#3a3a40',
    shoes: '#2a1a12',
  },
  // The Premier League legends, each in their club's kit (premier.ts).
  // Roy Keane: United red, a grey beard and a stare.
  keane: {
    skin: '#f0c4a0',
    hair: '#5a5a5a',
    hairStyle: 'short',
    beard: '#6a6a6a',
    top: '#d01c24',
    topKind: 'shirt',
    trim: '#f4f4f4',
    legs: '#f4f4f4',
    shoes: '#18181c',
  },
  // Marcelo Bielsa: a navy Leeds tracksuit, glasses and grey hair.
  bielsa: {
    skin: '#ecc09a',
    hair: '#c8c8c8',
    hairStyle: 'balding',
    glasses: 'glasses',
    top: '#1d2f5c',
    topKind: 'jacket',
    trim: '#f6c21c',
    legs: '#1d2f5c',
    shoes: '#f4f4f4',
  },
  // Duncan Ferguson: Everton blue, and enormous.
  ferguson: {
    skin: '#f0c8a8',
    hair: '#3a2a1e',
    hairStyle: 'short',
    top: '#1b3f9c',
    topKind: 'shirt',
    trim: '#f4f4f4',
    legs: '#f4f4f4',
    shoes: '#18181c',
    big: true,
  },
  // Robbie Keane: Spurs white with navy.
  robbie: {
    skin: '#f0c4a0',
    hair: '#3a2a1e',
    hairStyle: 'spiky',
    top: '#f4f4f4',
    topKind: 'shirt',
    trim: '#132257',
    legs: '#132257',
    shoes: '#f4f4f4',
  },
  // Ian Wright: Palace red and blue stripes, and a big grin.
  wright: {
    skin: '#6a4028',
    hair: '#1a1a1a',
    hairStyle: 'none',
    top: '#c8102e',
    topKind: 'shirt',
    trim: '#1b458f',
    stripes: '#1b458f',
    legs: '#1b458f',
    shoes: '#f4f4f4',
  },
  // Glenn Murray: Brighton blue and white stripes.
  murray: {
    skin: '#f0c4a0',
    hair: '#8a6a40',
    hairStyle: 'short',
    top: '#f4f4f4',
    topKind: 'shirt',
    trim: '#0057b8',
    stripes: '#0057b8',
    legs: '#0057b8',
    shoes: '#18181c',
  },
  // Paul McGrath: Villa claret and blue, and the calmest man in England.
  mcgrath: {
    skin: '#7a4a2a',
    hair: '#1a1a1a',
    hairStyle: 'short',
    top: '#670e36',
    topKind: 'shirt',
    trim: '#95bfe5',
    legs: '#f4f4f4',
    shoes: '#18181c',
  },
  // Alan Shearer: Newcastle black and white stripes.
  shearer: {
    skin: '#f0c4a0',
    hair: '#c8b088',
    hairStyle: 'balding',
    top: '#f4f4f4',
    topKind: 'shirt',
    trim: '#16181c',
    stripes: '#16181c',
    legs: '#16181c',
    shoes: '#18181c',
  },
  // John Terry: Chelsea blue, in full kit, shin pads and all.
  terry: {
    skin: '#f0c4a0',
    hair: '#2a1e18',
    hairStyle: 'short',
    top: '#034694',
    topKind: 'shirt',
    trim: '#f4f4f4',
    legs: '#034694',
    shoes: '#18181c',
  },
  // Steven Gerrard: Liverpool red.
  gerrard: {
    skin: '#f0c4a0',
    hair: '#6a4a2a',
    hairStyle: 'short',
    top: '#c8102e',
    topKind: 'shirt',
    trim: '#f6c21c',
    legs: '#c8102e',
    shoes: '#18181c',
  },
  // Thierry Henry: Arsenal red with white sleeves.
  henry: {
    skin: '#5a3420',
    hair: '#1a1a1a',
    hairStyle: 'none',
    top: '#ef0107',
    topKind: 'shirt',
    trim: '#f4f4f4',
    legs: '#f4f4f4',
    shoes: '#18181c',
  },
  // Sergio Agüero: City sky blue.
  aguero: {
    skin: '#d8a07a',
    hair: '#1a1a1a',
    hairStyle: 'short',
    top: '#6cabdd',
    topKind: 'shirt',
    trim: '#f4f4f4',
    legs: '#f4f4f4',
    shoes: '#18181c',
  },
  // The W.B Yates owners. Seán and Pádraig, the Mayo brothers: green and red jumpers, flat caps.
  mayo: {
    skin: '#f0c4a0',
    hair: '#8a8a8a',
    hairStyle: 'short',
    hat: { kind: 'flat', colour: '#4a4a3a' },
    top: '#1f7a3a',
    topKind: 'jumper',
    trim: '#c8282a',
    legs: '#3a3a40',
    shoes: '#2a1a12',
  },
  // Bríd from Kerry: red hair and a Kerry green and gold jumper.
  brid: {
    skin: '#f4d0b0',
    hair: '#b8481e',
    hairStyle: 'long',
    top: '#11804a',
    topKind: 'jumper',
    trim: '#f6c21c',
    legs: '#2a2a30',
    shoes: '#2a1a12',
  },
  // Nana Kelly: grey bob, a cardigan.
  kelly: {
    skin: '#f0c8a8',
    hair: '#c8c8c8',
    hairStyle: 'bob',
    top: '#8a2a3a',
    topKind: 'jumper',
    trim: '#f4f0e8',
    legs: '#3a3a48',
    shoes: '#2a1a12',
    pearls: true,
  },
  // Mick from Tipperary: a tweed flat cap and a waistcoat.
  mick: {
    skin: '#f0c4a0',
    hair: '#d8d8d8',
    hairStyle: 'short',
    hat: { kind: 'flat', colour: '#7a6a4a' },
    top: '#5a4a3a',
    topKind: 'waistcoat',
    trim: '#f4f4f0',
    legs: '#3a3a40',
    shoes: '#2a1a12',
  },
  // Gráinne from Donegal: an Aran jumper, and no coat.
  grainne: {
    skin: '#f4d0b0',
    hair: '#2a1e18',
    hairStyle: 'long',
    top: '#ece4cc',
    topKind: 'jumper',
    trim: '#d8cca8',
    legs: '#2a3a5a',
    shoes: '#2a1a12',
  },
  // Fionnuala from Galway, in Brighton: a maroon cardigan and a sash from a 1994 hen party.
  fionnuala: {
    skin: '#f4d0b0',
    hair: '#c8a050',
    hairStyle: 'bouffant',
    top: '#7d1f2e',
    topKind: 'jumper',
    trim: '#f4f0e8',
    legs: '#2a2a38',
    shoes: '#2a1a12',
    earrings: '#f6c21c',
  },
  // Buckingham Palace (palace.ts). Margaret Thatcher: a royal blue suit, pearls and a handbag.
  thatcher: {
    skin: '#f4d4b8',
    hair: '#d8c8a0',
    hairStyle: 'bouffant',
    top: '#1f3f9e',
    topKind: 'suit',
    trim: '#f4f4f4',
    legs: '#f0c8a8',
    shoes: '#1a1a2a',
    skirt: '#1f3f9e',
    pearls: true,
    handbag: '#1a1a2a',
  },
  // A Royal Guard: a red tunic and a tall black bearskin.
  royalguard: {
    skin: '#f0c4a0',
    hair: '#1a1a1a',
    hairStyle: 'short',
    hat: { kind: 'beanie', colour: '#141414' },
    top: '#c8101e',
    topKind: 'jacket',
    trim: '#f6c21c',
    legs: '#141420',
    shoes: '#0c0c0c',
    tall: true,
  },
  // Prince Edward: a navy blazer nobody notices.
  edward: {
    skin: '#f0c8a8',
    hair: '#8a6a4a',
    hairStyle: 'balding',
    top: '#283a5c',
    topKind: 'suit',
    trim: '#f4f4f4',
    legs: '#283a5c',
    shoes: '#1a1a1a',
    tie: '#8a2a2a',
  },
  // Princess Anne: a headscarf and a waxed jacket, in the stables.
  anne: {
    skin: '#f0c8a8',
    hair: '#a08a68',
    hairStyle: 'bun',
    top: '#4a5a3a',
    topKind: 'coat',
    trim: '#8a6a3a',
    legs: '#5a4a3a',
    shoes: '#2a1a12',
  },
  // Prince William: a gilet, and no moustache this time.
  william: {
    skin: '#f0c8a8',
    hair: '#a08a68',
    hairStyle: 'balding',
    top: '#2a3a4a',
    topKind: 'waistcoat',
    trim: '#9ab8d8',
    legs: '#c8b898',
    shoes: '#5a3a22',
  },
  // Andrew: a dressing gown.
  andrew: {
    skin: '#f0c0a0',
    hair: '#b8b8b8',
    hairStyle: 'short',
    top: '#7a2a3a',
    topKind: 'gown',
    trim: '#d8b048',
    legs: '#2a2a30',
    shoes: '#5a3a22',
  },
  // Zombie Queen Elizabeth: grey-green, in a lilac coat and hat, with her handbag.
  queen: {
    skin: '#a8b898',
    hair: '#e0e0e0',
    hairStyle: 'bouffant',
    hat: { kind: 'beret', colour: '#b898d0' },
    top: '#b898d0',
    topKind: 'coat',
    trim: '#d8c8e8',
    legs: '#a8b898',
    shoes: '#1a1a1a',
    skirt: '#b898d0',
    pearls: true,
    handbag: '#1a1a1a',
  },
  // King Charles: a double-breasted suit and a crown.
  charles: {
    skin: '#f0b8a0',
    hair: '#c8c8c8',
    hairStyle: 'balding',
    hat: { kind: 'crown', colour: '#f6c21c' },
    top: '#3a4a5a',
    topKind: 'suit',
    trim: '#f4f4f4',
    legs: '#3a4a5a',
    shoes: '#1a1a1a',
    tie: '#5a7a4a',
  },
  // Queen Camilla: a blonde bob and a pale blue coat.
  camilla: {
    skin: '#f0c8a8',
    hair: '#e0c890',
    hairStyle: 'bob',
    top: '#a8c0d8',
    topKind: 'coat',
    trim: '#f4f4f4',
    legs: '#f0c8a8',
    shoes: '#1a1a2a',
    skirt: '#a8c0d8',
    pearls: true,
  },
  // Mo Chara and Móglaí Bap of Kneecap, balaclavas and all.
  mochara: {
    skin: '#f0c8a8',
    hair: '#1a1a1a',
    hairStyle: 'short',
    balaclava: ['#1e9a50', '#f4f2ea', '#f08a24'],
    top: '#f4f4f4',
    topKind: 'jacket',
    trim: '#1e9a50',
    legs: '#2a2a30',
    shoes: '#f4f4f4',
  },
  moglai: {
    skin: '#f0c8a8',
    hair: '#1a1a1a',
    hairStyle: 'short',
    balaclava: ['#1e9a50', '#f4f2ea', '#f08a24'],
    top: '#1a1a1a',
    topKind: 'jacket',
    trim: '#f08a24',
    legs: '#3a4a3a',
    shoes: '#1a1a1a',
  },
  // Bridie from Ballina, a palace cleaner: a tabard and a headscarf.
  bridie: {
    skin: '#f0c8a8',
    hair: '#8a8a8a',
    hairStyle: 'bun',
    top: '#3a7ab8',
    topKind: 'shirt',
    trim: '#f4f4f4',
    legs: '#2a2a38',
    shoes: '#2a1a12',
  },
  // DJ Vandenbass, the headliner: long silver hair, shades, a black shirt and gold headphones.
  headliner: {
    skin: '#f0c8a0',
    hair: '#c8c8d0',
    hairStyle: 'long',
    glasses: 'shades',
    beard: '#a8a8b0',
    top: '#18161c',
    topKind: 'shirt',
    trim: '#30d0f0',
    legs: '#18161c',
    shoes: '#f4f4f4',
    headphones: '#f0c040',
  },
  // Rob Lipsett, a gym bro: a fade, a tan, a tight black vest over huge arms, and a shaker.
  lipsett: {
    skin: '#e8b080',
    hair: '#3a2416',
    hairStyle: 'short',
    beard: '#3a2416',
    top: '#18181c',
    topKind: 'shirt',
    trim: '#f04848',
    legs: '#3a3a44',
    shoes: '#f4f4f4',
    vest: true,
    tall: true,
  },
  // Blindboy Boatclub: a plastic shopping bag over his head, a Limerick jersey and jeans.
  blindboy: {
    skin: '#f8d0a8',
    hair: '#f8d0a8',
    hairStyle: 'none',
    plasticBag: '#ece8de',
    top: '#2a7a3a',
    topKind: 'shirt',
    trim: '#f4f4f4',
    legs: '#2c3c64',
    shoes: '#18181c',
  },
  // Johnny B of The 2 Johnnies: a Tipperary jersey, a flat cap and wellies.
  johnnyb: {
    skin: '#f4c8a0',
    hair: '#6a3a1e',
    hairStyle: 'short',
    hat: { kind: 'flat', colour: '#5a6a48' },
    top: '#1e4aa0',
    topKind: 'shirt',
    trim: '#f0c030',
    legs: '#3a4a30',
    shoes: '#1c3a1c',
  },
  // Johnny Smacks: a red beard, a check shirt and a gilet, and wellies too.
  johnnysmacks: {
    skin: '#f8d0a8',
    hair: '#b05a28',
    hairStyle: 'short',
    beard: '#b05a28',
    top: '#3a3a40',
    topKind: 'waistcoat',
    trim: '#c83a3a',
    legs: '#2c3c64',
    shoes: '#1c3a1c',
  },
  // Bono: slicked-back hair, tinted shades, all in black leather, and an earring.
  bono: {
    skin: '#f0c8a0',
    hair: '#24181a',
    hairStyle: 'slick',
    glasses: 'shades',
    earrings: '#e0c060',
    top: '#141418',
    topKind: 'jacket',
    trim: '#2a2a30',
    legs: '#141418',
    shoes: '#141418',
  },
  // Michael Collins: the green uniform of the Free State army, a peaked cap and a Sam Browne belt.
  collins: {
    skin: '#f4caa0',
    hair: '#2a1a12',
    hairStyle: 'slick',
    hat: { kind: 'garda', colour: '#4a5a32', trim: '#c8a040' },
    top: '#4a5a32',
    topKind: 'coat',
    trim: '#c8a040',
    legs: '#4a5a32',
    shoes: '#3a2414',
    strap: '#6a3a1e',
    tall: true,
  },
  // ---------- Silicon Docks ----------
  // A tech HQ's receptionist: hair in a bun, a white shirt and a lanyard-blue collar.
  receptionist: {
    skin: '#f0c49a',
    hair: '#3a2416',
    hairStyle: 'bun',
    earrings: '#e0c060',
    top: '#f4f4f4',
    topKind: 'shirt',
    trim: '#3a70c8',
    legs: '#2a2a38',
    shoes: '#18181c',
  },
  // Someone on staff in tech: glasses, a fleece gilet over a shirt, chinos, white runners and a
  // laptop bag.
  techie: {
    skin: '#f8d0a8',
    hair: '#5a3a1e',
    hairStyle: 'short',
    glasses: 'glasses',
    top: '#3a4a5a',
    topKind: 'waistcoat',
    trim: '#e8e8ec',
    legs: '#c8b090',
    shoes: '#f4f4f4',
    bag: '#2a2a30',
  },
  // Sundar Pichai of Google: glasses and a soft jumper with a Google-blue collar.
  pichai: {
    skin: '#c8905e',
    hair: '#1a1414',
    hairStyle: 'short',
    glasses: 'glasses',
    top: '#d8d8dc',
    topKind: 'jumper',
    trim: '#3a78e8',
    legs: '#2c3c64',
    shoes: '#2a1a12',
  },
  // Mark Zuckerberg of Meta: a short crop, a plain grey T-shirt, jeans and a gold chain.
  zuckerberg: {
    skin: '#f4d0b0',
    hair: '#6a4a2a',
    hairStyle: 'short',
    beads: '#e0c060',
    top: '#8a8a90',
    topKind: 'shirt',
    trim: '#7a7a80',
    legs: '#2c3c64',
    shoes: '#f4f4f4',
  },
  // Satya Nadella of Microsoft: glasses, a short beard and a dark jacket with a blue collar.
  nadella: {
    skin: '#b07a50',
    hair: '#2a2a2a',
    hairStyle: 'balding',
    glasses: 'glasses',
    beard: '#3a3a3a',
    top: '#2a3a5a',
    topKind: 'jacket',
    trim: '#20a4ef',
    legs: '#2a2a38',
    shoes: '#18181c',
  },
  // Tim Cook of Apple: short grey hair, glasses and all in black.
  cook: {
    skin: '#f4d0b0',
    hair: '#c8c8cc',
    hairStyle: 'short',
    glasses: 'glasses',
    top: '#18181c',
    topKind: 'shirt',
    trim: '#2a2a30',
    legs: '#2c3c64',
    shoes: '#18181c',
  },
  // Jeff Bezos of Amazon: bald, aviator shades and a navy gilet with an orange zip.
  bezos: {
    skin: '#f4d0b0',
    hair: '#f4d0b0',
    hairStyle: 'none',
    glasses: 'shades',
    top: '#1a2a4a',
    topKind: 'waistcoat',
    trim: '#f09820',
    legs: '#2a2a38',
    shoes: '#18181c',
  },
  // Shou Chew of TikTok: a dark suit and a tie in TikTok pink, with a cyan collar.
  chew: {
    skin: '#e8c098',
    hair: '#18181c',
    hairStyle: 'short',
    top: '#2a2a30',
    topKind: 'suit',
    trim: '#30e0e8',
    tie: '#e83060',
    legs: '#2a2a30',
    shoes: '#18181c',
  },
  // Elon Musk of X: tall, all in black, a black jacket and black jeans.
  musk: {
    skin: '#f4d0b0',
    hair: '#3a2a1a',
    hairStyle: 'short',
    top: '#18181c',
    topKind: 'jacket',
    trim: '#3a3a40',
    legs: '#18181c',
    shoes: '#18181c',
    tall: true,
  },
  // Patrick Collison of Stripe: sandy hair and a Stripe-purple jumper.
  pcollison: {
    skin: '#f8d8b8',
    hair: '#b8803a',
    hairStyle: 'short',
    top: '#6a5af0',
    topKind: 'jumper',
    trim: '#f4f4f4',
    legs: '#2c3c64',
    shoes: '#2a1a12',
  },
  // John Collison, his brother: glasses, a navy jumper and a purple collar.
  jcollison: {
    skin: '#f8d8b8',
    hair: '#a87038',
    hairStyle: 'short',
    glasses: 'glasses',
    top: '#1a2a4a',
    topKind: 'jumper',
    trim: '#6a5af0',
    legs: '#3a3a44',
    shoes: '#2a1a12',
  },
};

/** A Ranemon's body below its photo head: a little round body in its colour. */
export const monStyle = (colour: string): Style => ({
  skin: colour,
  hair: colour,
  hairStyle: 'none',
  top: colour,
  topKind: 'shirt',
  trim: shade(colour, 1.3),
  legs: shade(colour, 0.6),
  shoes: shade(colour, 0.45),
});

/** Shifts a hex colour toward black (k < 1) or white (k > 1). */
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) =>
    Math.round(k < 1 ? v * k : v + (255 - v) * (k - 1))
      .toString(16)
      .padStart(2, '0');
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

type Ctx = CanvasRenderingContext2D;
type Side = 'down' | 'up' | 'left';

function px(c: Ctx, x: number, y: number, w: number, h: number, colour: string) {
  if (w <= 0 || h <= 0) return;
  c.fillStyle = colour;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** A little love heart, 5 device pixels wide and 4 tall, with its top left at x, y. */
function heart(c: Ctx, x: number, y: number, colour: string) {
  px(c, x, y, 2, 1, colour);
  px(c, x + 3, y, 2, 1, colour);
  px(c, x, y + 1, 5, 1, colour);
  px(c, x + 1, y + 2, 3, 1, colour);
  px(c, x + 2, y + 3, 1, 1, colour);
  px(c, x + 1, y + 1, 1, 1, shade(colour, 1.6));
}

/** The rows of a rectangle with rounded corners, in hard pixels. */
function roundRows(x: number, y: number, w: number, h: number, r: number) {
  x = Math.round(x);
  y = Math.round(y);
  const rows: [number, number, number][] = [];
  for (let i = 0; i < h; i++) {
    const d = i < r ? r - i - 0.5 : i >= h - r ? i - (h - r) + 0.5 : 0;
    const inset = d > 0 ? Math.round(r - Math.sqrt(Math.max(0, r * r - d * d))) : 0;
    rows.push([x + inset, y + i, w - inset * 2]);
  }
  return rows;
}

/** A rectangle with rounded corners, in hard pixels. */
function round(c: Ctx, x: number, y: number, w: number, h: number, r: number, colour: string) {
  c.fillStyle = colour;
  for (const [rx, ry, rw] of roundRows(x, y, w, h, r)) c.fillRect(rx, ry, rw, 1);
}

/** A part shaded like the 5th generation's: lit down the left, in shadow down the right. */
function shaded(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  colour: string,
  light = 0.22,
  dark = 0.3,
) {
  const rows = roundRows(x, y, w, h, r);
  c.save();
  c.beginPath();
  for (const [rx, ry, rw] of rows) c.rect(rx, ry, rw, 1);
  c.clip();
  px(c, x, y, w, h, colour);
  px(c, x + w * (1 - dark), y, w * dark + 1, h, shade(colour, 0.78));
  px(c, x, y, Math.max(2, w * light), h, shade(colour, 1.22));
  c.restore();
}

/** A dark line round everything drawn, one device pixel wide, slightly softened inside. */
function outline(c: Ctx) {
  const img = c.getImageData(0, 0, PERSON_W, PERSON_H);
  const d = img.data;
  const solid = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < PERSON_W && y < PERSON_H && d[(y * PERSON_W + x) * 4 + 3] > 0;
  const edge: number[] = [];
  for (let y = 0; y < PERSON_H; y++)
    for (let x = 0; x < PERSON_W; x++)
      if (
        !solid(x, y) &&
        (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))
      )
        edge.push(x, y);
  const n = parseInt(INK.slice(1), 16);
  for (let i = 0; i < edge.length; i += 2) {
    const at = (edge[i + 1] * PERSON_W + edge[i]) * 4;
    d[at] = n >> 16;
    d[at + 1] = (n >> 8) & 255;
    d[at + 2] = n & 255;
    d[at + 3] = 255;
  }
  c.putImageData(img, 0, 0);
}

// ---------- the walk ----------

/**
 * One pose of the walk. `stride` runs -2 to 2: the left foot forward at -2, the right at 2,
 * the legs passing at ±1. `lift` raises the whole body a pixel at the passing poses.
 */
interface Pose {
  stride: number;
  lift: number;
}

function poseOf(frame: number): Pose {
  // 0 stands. 1-4 step with the left foot (pass, full, pass, back to stand); 5-8 the right.
  const cycle = [0, -1, -2, -1, 0, 1, 2, 1, 0];
  const stride = cycle[frame % cycle.length] ?? 0;
  return { stride, lift: Math.abs(stride) === 1 ? -1 : 0 };
}

// ---------- legs and feet ----------

function legsFront(c: Ctx, s: Style, p: Pose, back: boolean) {
  const dark = shade(s.legs, 0.72);
  const top = 64;
  // Each leg shortens a little as its foot comes up off the ground.
  for (const [x, foot] of [
    [21, -1],
    [33, 1],
  ] as const) {
    const up = p.stride === foot * 2 ? 3 : p.stride === foot ? 1 : 0;
    const h = 24 - up;
    shaded(c, x, top, 11, h, 2, s.legs, 0.25, 0.3);
    if (!s.skirt && !s.shorts) {
      // A crease down the front and a hem.
      px(c, x + 5, top + 6, 1, h - 8, dark);
      px(c, x, top + h - 2, 11, 1, dark);
    }
    if (s.hearts)
      for (const dy of foot < 0 ? [5, 14] : [9, 17]) heart(c, x + 3, top + dy, s.hearts);
    if (s.socks) {
      px(c, x, top + h - 7, 11, 6, s.socks);
      px(c, x, top + h - 7, 11, 1, shade(s.socks, 0.8));
    }
    // The shoe: an upper, a lighter toe cap and a dark sole.
    const sy = top + h - 1;
    shaded(c, x - 1, sy, 13, 7, 3, s.shoes, 0.3, 0.3);
    px(c, x + 1, sy + 1, 4, 2, shade(s.shoes, 1.35));
    px(c, x - 1, sy + 6, 13, 1, shade(s.shoes, 0.45));
    if (back) px(c, x + 2, sy + 2, 7, 2, shade(s.shoes, 0.75));
  }
  // The gap between the legs.
  if (!s.skirt) px(c, 32, top + 8, 1, 16, shade(s.legs, 0.55));
  if (s.skirt) {
    shaded(c, 18, top - 2, 28, 15, 3, s.skirt);
    for (const x of [24, 32, 40]) px(c, x, top + 3, 1, 9, shade(s.skirt, 0.75));
  }
  if (s.shorts) {
    // Barely past the hips: a split up the middle and a pale hem.
    shaded(c, 20, top - 1, 25, 7, 2, s.shorts);
    px(c, 32, top + 2, 1, 4, shade(s.shorts, 0.6));
    px(c, 20, top + 5, 25, 1, shade(s.shorts, 1.6));
  }
}

function legsSide(c: Ctx, s: Style, p: Pose) {
  const top = 64;
  const swing = p.stride * 3;
  // The far leg first, in shadow, then the near one.
  for (const [dx, far] of [
    [swing, true],
    [-swing, false],
  ] as const) {
    const col = far ? shade(s.legs, 0.78) : s.legs;
    const x = 26 + dx;
    const lean = Math.sign(dx);
    for (let y = 0; y < 24; y++) {
      const off = Math.round((lean * y * Math.abs(dx)) / 24 / 2);
      px(c, x + off, top + y, 10, 1, col);
      px(c, x + off + 7, top + y, 3, 1, shade(col, 0.8));
      px(c, x + off, top + y, 2, 1, shade(col, 1.15));
      if (s.socks && y >= 17) px(c, x + off, top + y, 10, 1, far ? shade(s.socks, 0.8) : s.socks);
    }
    const fx = x + Math.round((lean * Math.abs(dx)) / 2) - 3;
    const shoe = far ? shade(s.shoes, 0.8) : s.shoes;
    round(c, fx, top + 23, 14, 6, 3, shoe);
    px(c, fx + 1, top + 24, 5, 2, shade(shoe, 1.3));
    px(c, fx, top + 28, 14, 1, shade(shoe, 0.45));
  }
  if (s.skirt) {
    shaded(c, 21, top - 2, 22, 15, 3, s.skirt);
    px(c, 30, top + 2, 1, 10, shade(s.skirt, 0.75));
  }
  if (s.shorts) {
    shaded(c, 22, top - 1, 20, 7, 2, s.shorts);
    px(c, 22, top + 5, 20, 1, shade(s.shorts, 1.6));
  }
}

// ---------- the body ----------

const LONG = new Set<Top>(['gown', 'agbada', 'coat']);

/** Where the love hearts sit on the front or back of a top, clear of the middle seam. */
const HEARTS_TORSO = [
  [20, 5],
  [39, 7],
  [24, 13],
  [36, 15],
  [20, 20],
  [40, 21],
] as const;

function torsoFront(c: Ctx, s: Style, p: Pose, back: boolean) {
  const y0 = 37 + p.lift;
  const long = LONG.has(s.topKind);
  const h = s.topKind === 'agbada' ? 42 : s.topKind === 'gown' ? 40 : long ? 34 : 29;
  const dark = shade(s.top, 0.75);
  const darker = shade(s.top, 0.6);
  const light = shade(s.top, 1.25);

  if (s.guitar && !back) {
    // The neck of the guitar over the shoulder.
    px(c, 44, y0 - 10, 4, 18, shade(s.guitar, 0.6));
    px(c, 43, y0 - 14, 6, 5, '#2a2018');
  }
  if (s.bag && back) {
    shaded(c, 20, y0 + 3, 24, 24, 5, s.bag);
    px(c, 22, y0 + 6, 20, 3, shade(s.bag, 1.35));
    px(c, 26, y0 + 15, 12, 6, shade(s.bag, 0.75));
    px(c, 31, y0 + 15, 2, 6, shade(s.bag, 1.4));
  }
  if (s.guitar && back) {
    c.save();
    c.translate(32, y0 + 18);
    c.rotate(-0.55);
    round(c, -9, -4, 18, 22, 8, s.guitar);
    round(c, -7, -2, 14, 18, 7, shade(s.guitar, 1.2));
    px(c, -2, 4, 4, 4, '#2a2018');
    px(c, -2, -26, 4, 24, shade(s.guitar, 0.6));
    px(c, -3, -30, 6, 5, '#2a2018');
    c.restore();
  }
  // The trunk, wider at the shoulders.
  shaded(c, 17, y0, 30, h, 5, s.top, 0.2, 0.28);
  px(c, 17, y0 + h - 1, 30, 1, darker);
  if (s.bag && back) {
    shaded(c, 20, y0 + 5, 24, 22, 5, s.bag);
    px(c, 22, y0 + 7, 20, 3, shade(s.bag, 1.35));
    px(c, 26, y0 + 16, 12, 6, shade(s.bag, 0.72));
    px(c, 28, y0 + 18, 8, 1, shade(s.bag, 1.3));
  }
  if (s.stripes) for (let y = y0 + 5; y < y0 + h - 3; y += 4) px(c, 17, y, 30, 2, s.stripes);
  if (s.hearts && back) for (const [x, y] of HEARTS_TORSO) heart(c, x, y0 + y, s.hearts);
  if (back && s.strap) for (let i = 0; i < 26; i++) px(c, 44 - i * 0.95, y0 + 1 + i, 3, 2, s.strap);
  if (back) {
    // A seam down the back, and the collar.
    px(c, 32, y0 + 3, 1, h - 6, dark);
    px(c, 24, y0, 16, 3, s.topKind === 'suit' ? dark : s.trim);
    if (s.topKind === 'hivis') {
      px(c, 17, y0 + 11, 30, 3, s.trim);
      px(c, 17, y0 + 19, 30, 3, s.trim);
    }
    return;
  }
  switch (s.topKind) {
    case 'jacket':
      // Zipped, with a white collar and yoke and pockets.
      px(c, 24, y0, 16, 4, s.trim);
      px(c, 31, y0 + 2, 2, h - 3, s.trim);
      px(c, 31, y0 + 2, 1, h - 3, shade(s.trim, 0.8));
      px(c, 17, y0 + 9, 30, 2, s.trim);
      px(c, 20, y0 + h - 9, 8, 1, dark);
      px(c, 36, y0 + h - 9, 8, 1, dark);
      px(c, 17, y0 + h - 4, 30, 3, shade(s.top, 0.82));
      break;
    case 'suit':
      // A shirt and tie in a V, lapels and buttons.
      for (let i = 0; i < 12; i++) px(c, 32 - 6 + i * 0.5, y0 + i, 12 - i, 1, '#f4f4f0');
      px(c, 31, y0 + 1, 3, 15, s.tie ?? dark);
      px(c, 30, y0 + 1, 5, 3, shade(s.tie ?? dark, 0.8));
      for (let i = 0; i < 14; i++) {
        px(c, 24 + i * 0.45, y0 + i, 2, 1, light);
        px(c, 39 - i * 0.45, y0 + i, 2, 1, dark);
      }
      px(c, 31, y0 + 18, 2, 2, darker);
      px(c, 31, y0 + 23, 2, 2, darker);
      px(c, 20, y0 + 15, 6, 1, darker);
      break;
    case 'waistcoat':
      px(c, 24, y0, 16, h - 2, s.trim);
      for (const y of [8, 14, 20]) px(c, 31, y0 + y, 2, 2, s.top);
      break;
    case 'hivis':
      px(c, 17, y0 + 11, 30, 3, s.trim);
      px(c, 17, y0 + 19, 30, 3, s.trim);
      px(c, 24, y0, 4, h, s.trim);
      px(c, 36, y0, 4, h, s.trim);
      px(c, 31, y0 + 2, 2, h - 3, dark);
      px(c, 37, y0 + 3, 2, 3, '#e8c040');
      break;
    case 'gown':
      px(c, 25, y0, 14, 6, s.trim);
      px(c, 31, y0 + 4, 2, h - 6, shade(s.top, 1.5));
      for (const x of [22, 41]) px(c, x, y0 + 8, 1, h - 10, darker);
      break;
    case 'jumper':
      // Ribbed neck, cuffs and hem, and a cable down the front.
      px(c, 24, y0, 16, 3, s.trim);
      px(c, 17, y0 + h - 4, 30, 4, s.trim);
      for (let x = 18; x < 47; x += 2) px(c, x, y0 + h - 4, 1, 4, shade(s.trim, 0.85));
      for (let y = y0 + 6; y < y0 + h - 6; y += 3) {
        px(c, 30, y, 2, 2, light);
        px(c, 32, y + 1, 2, 2, dark);
      }
      break;
    case 'coat':
      // Long, double-seamed, with toggles and pockets.
      px(c, 25, y0, 14, 4, s.trim);
      px(c, 31, y0 + 3, 2, h - 4, darker);
      for (const y of [8, 15, 22]) {
        px(c, 27, y0 + y, 3, 1, s.trim);
        px(c, 34, y0 + y, 3, 1, s.trim);
      }
      px(c, 19, y0 + 22, 9, 6, dark);
      px(c, 36, y0 + 22, 9, 6, dark);
      px(c, 19, y0 + 22, 9, 1, light);
      px(c, 36, y0 + 22, 9, 1, light);
      break;
    case 'shirt':
      if (s.vest) {
        // A scooped neck and wide armholes, and a logo on the chest.
        round(c, 25, y0 - 1, 14, 6, 3, s.skin);
        px(c, 17, y0, 4, 8, s.skin);
        px(c, 43, y0, 4, 8, s.skin);
        px(c, 29, y0 + 10, 7, 3, s.trim);
        break;
      }
      // A collar, a placket and a stripe.
      px(c, 26, y0, 5, 3, s.trim);
      px(c, 33, y0, 5, 3, s.trim);
      px(c, 31, y0 + 2, 2, 9, shade(s.top, 0.85));
      px(c, 17, y0 + 12, 30, 3, s.trim);
      break;
    case 'agbada':
      // The white robe underneath, the wide outer robe, embroidered medallions.
      px(c, 26, y0, 12, h - 3, s.trim);
      for (let y = y0 + 4; y < y0 + h - 4; y += 3) px(c, 27, y, 10, 1, shade(s.top, 1.12));
      px(c, 31, y0 + 1, 2, 6, shade(s.trim, 0.85));
      for (const [x, y] of [
        [19, 12],
        [41, 12],
        [19, 28],
        [41, 28],
      ])
        if (s.emblem) {
          round(c, x - 3, y0 + y - 3, 7, 7, 3, s.emblem);
          round(c, x - 2, y0 + y - 2, 5, 5, 2, shade(s.top, 1.15));
          px(c, x - 1, y0 + y - 1, 3, 3, '#e07a40');
        }
      for (const x of [23, 41]) px(c, x, y0 + 4, 1, h - 6, darker);
      break;
  }
  // A belt on the shorter tops.
  if (!long && s.topKind !== 'jumper' && s.topKind !== 'hivis')
    px(c, 18, y0 + h - 2, 28, 2, shade(s.shorts ?? s.legs, 0.6));
  if (s.hearts) for (const [x, y] of HEARTS_TORSO) heart(c, x, y0 + y, s.hearts);
  if (s.badges) s.badges.forEach((b, i) => round(c, 36 + (i % 2) * 4, y0 + 7 + i * 4, 3, 3, 1, b));
  if (s.strap) for (let i = 0; i < 26; i++) px(c, 20 + i * 0.95, y0 + 1 + i, 3, 2, s.strap);
  if (s.cross) {
    px(c, 30, y0 + 3, 4, 16, s.cross);
    px(c, 23, y0 + 9, 18, 4, s.cross);
  }
  if (s.pearls)
    for (let i = 0; i < 9; i++)
      px(c, 25 + i * 1.6, y0 + 2 + Math.sin((i / 8) * Math.PI) * 3, 2, 2, '#f8f4ec');
  if (s.beads) {
    // Two long loops of coral down to the waist.
    for (const [w, d] of [
      [9, 14],
      [12, 26],
    ])
      for (let i = 0; i <= 14; i++) {
        const t = i / 14;
        const bx = 32 + Math.cos(Math.PI * t) * w;
        const by = y0 + 1 + Math.sin(Math.PI * t) * d;
        px(c, bx - 1, by - 1, 3, 3, s.beads);
        px(c, bx - 1, by - 1, 1, 1, shade(s.beads, 1.35));
      }
  }
}

function armsFront(c: Ctx, s: Style, p: Pose, back: boolean) {
  const y0 = 38 + p.lift;
  const wide = s.topKind === 'agbada' || s.topKind === 'gown';
  for (const [x, foot] of [
    [10, -1],
    [47, 1],
  ] as const) {
    // Arms swing against the legs: forward is down and in a little, seen from the front.
    const swing =
      p.stride === -foot * 2 ? 2 : p.stride === -foot ? 1 : p.stride === foot * 2 ? -1 : 0;
    const ay = y0 + swing;
    if (wide) {
      // A wide sleeve falling in folds.
      shaded(c, x - 2, ay, 11, 26, 4, s.top, 0.3, 0.35);
      px(c, x + 2, ay + 6, 1, 16, shade(s.top, 0.7));
      px(c, x, ay + 21, 7, 4, s.trim);
    } else if (s.vest) {
      // Bare arms, a size up, with a bulge at the bicep and a line where it meets the forearm.
      shaded(c, x - 1, ay, 9, 22, 4, s.skin, 0.3, 0.3);
      round(c, x - 2, ay + 3, 11, 8, 4, s.skin);
      px(c, x + (x < 32 ? 1 : 3), ay + 5, 4, 2, shade(s.skin, 1.12));
      px(c, x, ay + 12, 7, 1, shade(s.skin, 0.82));
    } else {
      shaded(c, x, ay, 7, 22, 3, s.top, 0.35, 0.35);
      // An elbow fold and a cuff.
      px(c, x + 1, ay + 11, 5, 1, shade(s.top, 0.72));
      const cuff = s.topKind === 'jacket' || s.topKind === 'hivis' ? s.trim : shade(s.top, 0.85);
      px(c, x, ay + 19, 7, 3, cuff);
      if (s.hearts) heart(c, x + 1, ay + 5, s.hearts);
      if (s.knots) knotwork(c, x + 2, ay + 1, 17, s.knots);
    }
    if (!back || !wide) {
      round(c, x, ay + (wide ? 24 : 21), 7, 6, 2, s.skin);
      px(c, x + (x < 32 ? 0 : 5), ay + (wide ? 25 : 22), 2, 4, shade(s.skin, 0.85));
    }
    if (s.glowsticks) glowstick(c, s.glowsticks, x + 2, ay + 13);
  }
  if (!back && s.handbag) handbag(c, s.handbag, 49, y0 + 22);
  if (s.tote) {
    if (!back) for (let i = 0; i < 20; i++) px(c, 20 + i, y0 + i * 0.9, 2, 1, shade(s.tote, 0.8));
    shaded(c, back ? 9 : 43, y0 + 18, 13, 15, 2, s.tote);
    if (!back) round(c, 46, y0 + 23, 6, 6, 3, '#e83a8a');
  }
  if (s.stick && !back) staff(c, s, 12, y0 + 18);
}

function handbag(c: Ctx, colour: string, x: number, y: number) {
  px(c, x + 2, y - 4, 8, 2, colour);
  px(c, x, y - 2, 2, 3, colour);
  px(c, x + 10, y - 2, 2, 3, colour);
  shaded(c, x - 2, y + 1, 16, 12, 3, colour, 0.3, 0.3);
  px(c, x, y + 3, 12, 1, shade(colour, 1.8));
  px(c, x + 4, y + 1, 4, 2, '#e8c040');
}

function staff(c: Ctx, s: Style, x: number, y: number) {
  px(c, x, y - 2, 3, 40, s.stick!);
  px(c, x, y - 2, 1, 40, shade(s.stick!, 1.8));
  if (s.trident) {
    const gold = s.stickTop ?? s.stick!;
    px(c, x - 5, y - 4, 13, 3, gold);
    for (const dx of [-5, 0, 5]) {
      px(c, x + dx, y - 16, 3, 13, gold);
      px(c, x + dx, y - 16, 1, 13, shade(gold, 1.5));
      px(c, x + dx - 1, y - 14, 1, 2, gold);
    }
    return;
  }
  if (s.stickTop) {
    round(c, x - 2, y - 10, 7, 9, 3, s.stickTop);
    px(c, x - 1, y - 9, 2, 3, shade(s.stickTop, 1.5));
    px(c, x - 2, y - 2, 7, 2, shade(s.stickTop, 0.75));
  }
}

function bodySide(c: Ctx, s: Style, p: Pose) {
  const y0 = 37 + p.lift;
  const long = LONG.has(s.topKind);
  const h = s.topKind === 'agbada' ? 42 : s.topKind === 'gown' ? 40 : long ? 34 : 29;
  const swing = p.stride * 3;
  // The far arm, behind, swinging the other way.
  const far = shade(s.top, 0.7);
  if (s.guitar) {
    c.save();
    c.translate(42, y0 + 16);
    c.rotate(-0.5);
    round(c, -6, -4, 12, 22, 5, shade(s.guitar, 0.85));
    px(c, -2, -26, 4, 24, shade(s.guitar, 0.6));
    c.restore();
  }
  if (s.bag) shaded(c, 38, y0 + 4, 10, 22, 4, s.bag, 0.3, 0.3);
  shaded(c, 29 + swing, y0 + 1, 7, 22, 3, s.vest ? shade(s.skin, 0.8) : far, 0.1, 0.4);
  shaded(c, 21, y0, 22, h, 5, s.top, 0.3, 0.25);
  px(c, 21, y0 + h - 1, 22, 1, shade(s.top, 0.6));
  if (s.topKind === 'hivis') {
    px(c, 21, y0 + 11, 22, 3, s.trim);
    px(c, 21, y0 + 19, 22, 3, s.trim);
  }
  if (s.stripes) for (let y = y0 + 5; y < y0 + h - 3; y += 4) px(c, 21, y, 22, 2, s.stripes);
  if (s.hearts)
    for (const [x, y] of [
      [24, 5],
      [36, 11],
      [25, 19],
      [37, 22],
    ])
      heart(c, x, y0 + y, s.hearts);
  if (s.topKind === 'jacket') {
    px(c, 21, y0, 9, 4, s.trim);
    px(c, 21, y0 + 9, 22, 2, s.trim);
  }
  if (s.topKind === 'suit' || s.topKind === 'waistcoat') px(c, 21, y0, 5, 12, s.trim);
  if (s.topKind === 'agbada' && s.emblem) {
    round(c, 27, y0 + 14, 7, 7, 3, s.emblem);
    round(c, 28, y0 + 15, 5, 5, 2, shade(s.top, 1.15));
  }
  if (!long && s.topKind !== 'jumper') px(c, 21, y0 + h - 2, 22, 2, shade(s.shorts ?? s.legs, 0.6));
  if (s.beads) for (let i = 0; i < 9; i++) px(c, 20 + i * 0.4, y0 + 2 + i * 3, 3, 3, s.beads);
  if (s.pearls) for (let i = 0; i < 5; i++) px(c, 20 + i, y0 + 2 + i * 0.6, 2, 2, '#f8f4ec');
  // The near arm, in front.
  const wide = s.topKind === 'agbada' || s.topKind === 'gown';
  const ax = 27 - swing;
  if (s.vest) {
    shaded(c, ax - 1, y0 + 1, 10, 22, 4, s.skin, 0.35, 0.3);
    round(c, ax - 2, y0 + 3, 12, 8, 4, s.skin);
    px(c, ax, y0 + 12, 8, 1, shade(s.skin, 0.82));
  } else {
    shaded(c, ax - (wide ? 2 : 0), y0 + 1, wide ? 11 : 8, wide ? 25 : 22, 3, s.top, 0.35, 0.3);
    px(c, ax + 1, y0 + 12, 6, 1, shade(s.top, 0.72));
  }
  if (s.strap) px(c, 24, y0 + 1, 3, h - 3, s.strap);
  if (s.hearts) heart(c, ax + 2, y0 + 5, s.hearts);
  if (s.knots) knotwork(c, ax + 2, y0 + 2, 17, s.knots);
  round(c, ax, y0 + (wide ? 24 : 21), 8, 6, 2, s.skin);
  if (s.handbag) handbag(c, s.handbag, ax - 3, y0 + 22);
  if (s.tote) shaded(c, 34, y0 + 16, 11, 14, 2, s.tote);
  if (s.stick) staff(c, s, ax - 3, y0 + 18);
  if (s.glowsticks) glowstick(c, s.glowsticks, ax + 2, y0 + 13);
}

/** A glow stick held upright in a hand: a soft halo round a bright core. */
function glowstick(c: Ctx, colour: string, x: number, y: number) {
  px(c, x - 1, y - 1, 5, 18, `${colour}55`);
  px(c, x, y, 3, 16, colour);
  px(c, x + 1, y + 1, 1, 14, shade(colour, 1.6));
}

// ---------- the head ----------

function head(c: Ctx, s: Style, side: Side, p: Pose) {
  const y = p.lift;
  const hairDark = shade(s.hair, 0.7);
  const hairLight = shade(s.hair, 1.35);
  const skinDark = shade(s.skin, 0.84);
  const skinLight = shade(s.skin, 1.08);
  const bald = s.hairStyle === 'balding' || s.hairStyle === 'none';
  const covered = !!s.hat;

  // Hair that falls behind the head: long, bobbed, bouffant.
  if (side !== 'up') {
    if (s.hairStyle === 'long')
      round(c, side === 'left' ? 24 : 15, 12 + y, side === 'left' ? 24 : 34, 36, 9, hairDark);
    if (s.hairStyle === 'bob')
      round(c, side === 'left' ? 22 : 13, 10 + y, side === 'left' ? 26 : 38, 26, 8, s.hair);
  }
  if (s.hairStyle === 'bouffant') round(c, 11, 1 + y, 42, 30, 14, s.hair);

  // Neck.
  px(c, 28, 33 + y, 9, 6, skinDark);

  if (side === 'up') {
    round(c, 18, 6 + y, 28, 30, 11, bald ? s.skin : s.hair);
    if (s.hairStyle === 'balding') {
      round(c, 18, 18 + y, 28, 16, 8, s.hair);
      px(c, 24, 9 + y, 10, 3, skinLight);
    } else if (!bald) {
      // Strands down the back of the head, and a shine on the crown.
      for (let x = 22; x < 44; x += 4) px(c, x, 14 + y, 1, 18, hairDark);
      round(c, 23, 8 + y, 12, 5, 2, hairLight);
      if (s.hairStyle === 'long') round(c, 17, 20 + y, 30, 30, 8, s.hair);
      if (s.hairStyle === 'bob') round(c, 15, 12 + y, 34, 24, 8, s.hair);
      if (s.hairStyle === 'bun') round(c, 26, 1 + y, 12, 10, 5, s.hair);
      if (s.hairStyle === 'spiky')
        for (const x of [18, 25, 32, 39]) {
          px(c, x, 3 + y, 6, 6, s.hair);
          px(c, x + 2, y, 2, 4, s.hair);
        }
    }
    // Ears either side.
    round(c, 15, 20 + y, 5, 8, 2, skinDark);
    round(c, 44, 20 + y, 5, 8, 2, skinDark);
    if (s.beard) px(c, 20, 31 + y, 24, 3, s.beard);
  } else if (side === 'down') {
    // The face: a rounded jaw, ears, cheeks.
    round(c, 18, 8 + y, 28, 28, 11, s.skin);
    round(c, 15, 19 + y, 5, 8, 2, skinDark);
    round(c, 44, 19 + y, 5, 8, 2, skinDark);
    px(c, 16, 21 + y, 2, 4, shade(s.skin, 0.72));
    px(c, 46, 21 + y, 2, 4, shade(s.skin, 0.72));
    round(c, 38, 12 + y, 8, 22, 6, skinDark);
    round(c, 20, 10 + y, 6, 14, 3, skinLight);
    if (s.beard) {
      // A full beard round the jaw, the mouth showing through.
      round(c, 18, 24 + y, 28, 14, 8, s.beard);
      px(c, 18, 18 + y, 4, 8, s.beard);
      px(c, 42, 18 + y, 4, 8, s.beard);
      round(c, 26, 26 + y, 12, 4, 2, shade(s.beard, 1.15));
      for (let x = 21; x < 44; x += 3) px(c, x, 30 + y, 1, 5, shade(s.beard, 0.8));
    }
    // Eyes: a brow, the white, the iris with its shine, a lid line.
    for (const ex of [23, 35]) {
      px(c, ex - 1, 17 + y, 8, 2, bald && !s.beard ? shade(s.skin, 0.6) : hairDark);
      px(c, ex, 20 + y, 6, 5, '#f8f8f8');
      px(c, ex + (ex < 32 ? 2 : 1), 20 + y, 3, 5, '#2c3c64');
      px(c, ex + (ex < 32 ? 3 : 2), 21 + y, 1, 2, '#0c1020');
      px(c, ex + (ex < 32 ? 2 : 1), 20 + y, 1, 1, '#ffffff');
      px(c, ex, 19 + y, 6, 1, '#3a2a2a');
    }
    // Nose, cheeks and mouth.
    px(c, 31, 25 + y, 2, 3, skinDark);
    px(c, 33, 26 + y, 1, 2, shade(s.skin, 0.72));
    px(c, 21, 27 + y, 4, 2, '#f4a8a0');
    px(c, 39, 27 + y, 4, 2, '#f4a8a0');
    if (s.sad) {
      // Turned down at the corners, and a tear running down one cheek.
      px(c, 29, 30 + y, 6, 1, '#a04a48');
      px(c, 28, 31 + y, 1, 1, '#a04a48');
      px(c, 35, 31 + y, 1, 1, '#a04a48');
      px(c, 24, 25 + y, 2, 4, '#7cc4f4');
      px(c, 24, 25 + y, 1, 1, '#ffffff');
    } else {
      px(c, 28, 30 + y, 8, 1, '#a04a48');
      px(c, 29, 31 + y, 6, 1, '#d87a78');
    }
    if (s.moustache) {
      px(c, 27, 28 + y, 10, 2, s.moustache);
      px(c, 26, 29 + y, 1, 2, s.moustache);
      px(c, 37, 29 + y, 1, 2, s.moustache);
    }
    if (s.nosering) px(c, 32, 28 + y, 2, 1, '#c8ccd4');
    if (s.glasses === 'shades') {
      round(c, 20, 19 + y, 11, 7, 2, '#141418');
      round(c, 33, 19 + y, 11, 7, 2, '#141418');
      px(c, 30, 20 + y, 4, 1, '#141418');
      px(c, 22, 20 + y, 3, 1, '#5a6a8a');
      px(c, 35, 20 + y, 3, 1, '#5a6a8a');
    }
    if (s.glasses === 'glasses') {
      for (const gx of [21, 33]) {
        px(c, gx, 18 + y, 10, 1, INK);
        px(c, gx, 26 + y, 10, 1, INK);
        px(c, gx, 18 + y, 1, 9, INK);
        px(c, gx + 9, 18 + y, 1, 9, INK);
        px(c, gx + 2, 19 + y, 2, 1, 'rgb(255 255 255 / 0.7)');
      }
      px(c, 30, 20 + y, 4, 1, INK);
    }
    // Hair over the top: a fringe with strands and a shine.
    if (!bald) {
      const fringe =
        s.hairStyle === 'slick' || s.hairStyle === 'bouffant' ? 4 : s.hairStyle === 'bob' ? 9 : 7;
      round(c, 16, 3 + y, 32, 12, 8, s.hair);
      for (let x = 18; x < 47; x++) {
        const drop = s.hairStyle === 'slick' ? 0 : s.hairStyle === 'bob' ? 0 : (x * 7) % 4;
        px(c, x, 10 + y, 1, fringe - 4 + drop, s.hair);
      }
      for (let x = 20; x < 45; x += 4) px(c, x, 6 + y, 1, fringe, hairDark);
      round(c, 21, 4 + y, 13, 3, 1, hairLight);
      px(c, 15, 12 + y, 4, 10, s.hair);
      px(c, 45, 12 + y, 4, 10, s.hair);
      if (s.hairStyle === 'bob') {
        px(c, 12, 12 + y, 6, 22, s.hair);
        px(c, 46, 12 + y, 6, 22, s.hair);
        px(c, 26, 3 + y, 4, 12, hairLight);
      }
      if (s.hairStyle === 'long') {
        px(c, 13, 12 + y, 5, 26, s.hair);
        px(c, 46, 12 + y, 5, 26, s.hair);
      }
      if (s.hairStyle === 'spiky')
        for (const x of [17, 24, 31, 38]) {
          px(c, x, 0 + y, 7, 6, s.hair);
          px(c, x + 2, -2 + y, 3, 3, s.hair);
          px(c, x + 1, 1 + y, 2, 3, hairLight);
        }
      if (s.hairStyle === 'bun') round(c, 26, 0 + y, 12, 9, 5, s.hair);
      if (s.hairStyle === 'bouffant') {
        round(c, 13, 0 + y, 38, 14, 7, s.hair);
        round(c, 18, 2 + y, 22, 4, 2, hairLight);
        px(c, 18, 11 + y, 26, 1, hairDark);
      }
    } else if (s.hairStyle === 'balding') {
      px(c, 15, 14 + y, 5, 12, s.hair);
      px(c, 44, 14 + y, 5, 12, s.hair);
      px(c, 24, 9 + y, 10, 2, skinLight);
    }
  } else {
    // Facing left: a profile, with the nose, one eye and the ear.
    round(c, 18, 8 + y, 26, 28, 10, s.skin);
    round(c, 34, 12 + y, 10, 22, 6, skinDark);
    px(c, 15, 22 + y, 4, 5, s.skin);
    px(c, 15, 26 + y, 3, 1, skinDark);
    round(c, 34, 18 + y, 6, 9, 2, skinDark);
    px(c, 36, 20 + y, 2, 5, shade(s.skin, 0.7));
    if (s.beard) {
      round(c, 18, 25 + y, 20, 13, 7, s.beard);
      px(c, 33, 18 + y, 4, 10, s.beard);
      for (let x = 20; x < 36; x += 3) px(c, x, 31 + y, 1, 5, shade(s.beard, 0.8));
      px(c, 18, 29 + y, 6, 1, shade(s.beard, 0.7));
    }
    px(c, 20, 17 + y, 8, 2, bald ? shade(s.skin, 0.6) : hairDark);
    px(c, 21, 20 + y, 5, 5, '#f8f8f8');
    px(c, 21, 20 + y, 3, 5, '#2c3c64');
    px(c, 21, 21 + y, 1, 2, '#0c1020');
    px(c, 22, 20 + y, 1, 1, '#ffffff');
    px(c, 21, 19 + y, 5, 1, '#3a2a2a');
    if (s.sad) {
      px(c, 19, 30 + y, 4, 1, '#a04a48');
      px(c, 23, 31 + y, 1, 1, '#a04a48');
      px(c, 23, 25 + y, 2, 4, '#7cc4f4');
    } else px(c, 19, 30 + y, 5, 1, '#a04a48');
    if (!s.sad) px(c, 24, 27 + y, 4, 2, '#f4a8a0');
    if (s.moustache) px(c, 17, 28 + y, 7, 2, s.moustache);
    if (s.nosering) px(c, 16, 26 + y, 1, 2, '#c8ccd4');
    if (s.glasses === 'shades') round(c, 17, 19 + y, 12, 7, 2, '#141418');
    if (s.glasses === 'glasses') {
      px(c, 18, 18 + y, 10, 1, INK);
      px(c, 18, 26 + y, 10, 1, INK);
      px(c, 18, 18 + y, 1, 9, INK);
      px(c, 27, 18 + y, 1, 9, INK);
      px(c, 28, 20 + y, 9, 1, INK);
    }
    if (!bald) {
      round(c, 20, 3 + y, 28, 14, 8, s.hair);
      px(c, 36, 12 + y, 10, 12, s.hair);
      for (let x = 20; x < 32; x++) px(c, x, 11 + y, 1, 2 + ((x * 7) % 4), s.hair);
      for (let x = 24; x < 46; x += 4) px(c, x, 6 + y, 1, 10, hairDark);
      round(c, 22, 4 + y, 12, 3, 1, hairLight);
      if (s.hairStyle === 'long') px(c, 38, 14 + y, 10, 26, s.hair);
      if (s.hairStyle === 'bob') px(c, 34, 12 + y, 16, 22, s.hair);
      if (s.hairStyle === 'spiky')
        for (const x of [24, 31, 38, 44]) {
          px(c, x, 0 + y, 6, 6, s.hair);
          px(c, x + 2, -2 + y, 3, 3, s.hair);
        }
      if (s.hairStyle === 'bun') round(c, 40, 2 + y, 10, 10, 5, s.hair);
      if (s.hairStyle === 'bouffant') round(c, 14, 0 + y, 36, 15, 7, s.hair);
    } else if (s.hairStyle === 'balding') round(c, 34, 12 + y, 12, 14, 4, s.hair);
  }
  if (s.earrings && side !== 'up') {
    for (const ex of side === 'left' ? [36] : [15, 46]) {
      round(c, ex, 27 + y, 4, 5, 2, s.earrings);
      px(c, ex + 1, 28 + y, 2, 3, side === 'left' ? s.skin : shade(s.skin, 0.84));
    }
  }
  if (s.headphones) headphones(c, s.headphones, side, y);
  if (covered) hat(c, s, side, y);
  if (s.balaclava) balaclava(c, s.balaclava, s.skin, side, y);
  if (s.plasticBag) plasticBag(c, s.plasticBag, side, y);
}

/**
 * A knitted balaclava pulled over the whole head, in three bands, with ribbing, a slot for the
 * eyes and a hole for the mouth.
 */
function balaclava(c: Ctx, bands: [string, string, string], skin: string, side: Side, y: number) {
  const rows = roundRows(14, 2 + y, 36, 38, 13);
  // Looking at the back of the head the bands are the other way round; side on, two show.
  const order = side === 'up' ? [bands[2], bands[1], bands[0]] : bands;
  const edges = side === 'left' ? [14, 14, 30, 50] : [14, 26, 38, 50];
  for (const [rx, ry, rw] of rows) {
    for (let b = 0; b < 3; b++) {
      const from = Math.max(rx, edges[b]);
      const to = Math.min(rx + rw, edges[b + 1]);
      px(c, from, ry, to - from, 1, order[b]);
    }
  }
  // Ribbing: a darker line down every few stitches.
  for (const [rx, ry, rw] of rows) {
    for (let x = rx + 1; x < rx + rw; x += 3) {
      const b = x < edges[1] ? 0 : x < edges[2] ? 1 : 2;
      px(c, x, ry, 1, 1, shade(order[b], 0.82));
    }
  }
  if (side === 'up') return;
  const eyes = side === 'left' ? [17, 28] : [21, 43];
  // The eye slot, with the eyes looking out of it, and the mouth.
  px(c, eyes[0], 18 + y, eyes[1] - eyes[0], 8, skin);
  px(c, eyes[0], 18 + y, eyes[1] - eyes[0], 1, shade(skin, 0.7));
  for (const ex of side === 'left' ? [20] : [24, 35]) {
    px(c, ex, 20 + y, 5, 4, '#f8f8f8');
    px(c, ex + 1, 20 + y, 3, 4, '#2c3c64');
    px(c, ex + 2, 21 + y, 1, 2, '#0c1020');
  }
  const mouth = side === 'left' ? 17 : 28;
  round(c, mouth, 28 + y, 8, 5, 2, skin);
  px(c, mouth + 1, 30 + y, 6, 1, '#a04a48');
}

/** A band of Celtic knotwork, two pixels of plait either side of a running chain. */
function knotwork(c: Ctx, x: number, y: number, h: number, colour: string) {
  const dark = shade(colour, 0.7);
  for (let i = 0; i < h; i += 4) {
    px(c, x, y + i, 1, 2, colour);
    px(c, x + 2, y + i, 1, 2, colour);
    px(c, x + 1, y + i + 1, 1, 2, dark);
    px(c, x, y + i + 2, 3, 1, colour);
  }
}

/** A plastic shopping bag over the whole head: creased, tied at the neck, with two eye holes. */
function plasticBag(c: Ctx, colour: string, side: Side, y: number) {
  const crease = shade(colour, 0.8);
  const light = shade(colour, 1.08);
  // The handles, sticking up off the top like ears.
  for (const x of side === 'left' ? [26, 38] : [18, 42]) {
    px(c, x, y - 4, 4, 7, colour);
    px(c, x + 1, y - 3, 2, 4, crease);
  }
  round(c, 13, 1 + y, 38, 37, 11, colour);
  round(c, 17, 4 + y, 10, 18, 4, light);
  for (const [x, y1, h] of [
    [22, 8, 12],
    [34, 5, 14],
    [42, 12, 16],
    [27, 26, 8],
  ])
    px(c, x, y1 + y, 1, h, crease);
  // Gathered in at the neck.
  px(c, 18, 35 + y, 28, 3, crease);
  if (side === 'up') return;
  // Eye holes, and a little smile drawn on in marker.
  const eyes = side === 'left' ? [19] : [22, 36];
  for (const ex of eyes) {
    round(c, ex, 18 + y, 7, 6, 2, '#18181c');
    px(c, ex + 2, 20 + y, 2, 2, '#f8f8f8');
  }
  if (side === 'left') px(c, 18, 30 + y, 5, 1, '#2a2a30');
  else {
    px(c, 27, 30 + y, 10, 1, '#2a2a30');
    px(c, 26, 29 + y, 1, 1, '#2a2a30');
    px(c, 37, 29 + y, 1, 1, '#2a2a30');
  }
}

/** DJ headphones: a band over the top of the head and a big cup over each ear. */
function headphones(c: Ctx, colour: string, side: Side, y: number) {
  const band = '#2a2a30';
  const light = shade(colour, 1.3);
  if (side === 'left') {
    px(c, 30, 1 + y, 6, 3, band);
    px(c, 34, 3 + y, 3, 14, band);
    round(c, 31, 16 + y, 10, 12, 4, colour);
    px(c, 33, 18 + y, 4, 2, light);
    return;
  }
  px(c, 18, 1 + y, 28, 3, band);
  px(c, 15, 3 + y, 3, 14, band);
  px(c, 46, 3 + y, 3, 14, band);
  for (const x of [11, 45]) {
    round(c, x, 16 + y, 8, 12, 3, colour);
    px(c, x + 2, 18 + y, 3, 2, light);
  }
}

function hat(c: Ctx, s: Style, side: Side, y: number) {
  const { kind, colour, trim } = s.hat!;
  const dark = shade(colour, 0.7);
  const light = shade(colour, 1.3);
  const left = side === 'left';
  switch (kind) {
    case 'cap':
      shaded(c, 16, 1 + y, 32, 16, 10, colour, 0.25, 0.25);
      if (trim && side === 'down') {
        round(c, 22, 3 + y, 20, 11, 5, trim);
        round(c, 28, 6 + y, 8, 6, 3, colour);
        px(c, 30, 7 + y, 4, 4, trim);
      } else if (trim && left) round(c, 17, 3 + y, 14, 11, 5, trim);
      px(c, 30, 1 + y, 4, 2, dark);
      if (side === 'down') {
        round(c, 16, 14 + y, 32, 5, 2, dark);
        px(c, 18, 14 + y, 28, 1, shade(colour, 0.55));
      }
      if (left) round(c, 6, 14 + y, 18, 5, 2, dark);
      if (side === 'up') {
        px(c, 26, 12 + y, 12, 4, s.hair);
        px(c, 27, 11 + y, 10, 1, dark);
      }
      break;
    case 'flat':
      shaded(c, 15, 6 + y, 34, 11, 5, colour, 0.25, 0.25);
      // Tweed: flecks across the cloth.
      for (let x = 17; x < 47; x += 3)
        for (let yy = 8; yy < 15; yy += 3) px(c, x + (yy % 2), yy + y, 1, 1, dark);
      px(c, 16, 6 + y, 30, 1, light);
      if (side === 'down') round(c, 16, 15 + y, 32, 4, 2, dark);
      if (left) round(c, 8, 14 + y, 16, 4, 2, dark);
      break;
    case 'garda':
      shaded(c, 14, 2 + y, 36, 13, 5, colour, 0.25, 0.25);
      px(c, 16, 12 + y, 32, 3, '#101418');
      if (side !== 'up') {
        round(c, 29, 4 + y, 7, 7, 2, trim ?? '#e8c040');
        px(c, 31, 6 + y, 3, 3, shade(trim ?? '#e8c040', 0.7));
      }
      if (side === 'down') round(c, 18, 15 + y, 28, 4, 2, '#101418');
      if (left) round(c, 6, 14 + y, 16, 4, 2, '#101418');
      break;
    case 'mortar':
      shaded(c, 20, 6 + y, 24, 11, 3, colour, 0.25, 0.25);
      px(c, 6, 2 + y, 52, 5, colour);
      px(c, 6, 2 + y, 52, 1, light);
      px(c, left ? 48 : 44, 4 + y, 2, 16, trim ?? '#e8c040');
      round(c, left ? 47 : 43, 19 + y, 4, 4, 1, trim ?? '#e8c040');
      break;
    case 'beanie':
      shaded(c, 16, 1 + y, 32, 16, 10, colour, 0.25, 0.25);
      px(c, 16, 13 + y, 32, 4, dark);
      for (let x = 17; x < 48; x += 2) px(c, x, 13 + y, 1, 4, shade(colour, 0.6));
      round(c, 29, -1 + y, 6, 4, 2, light);
      break;
    case 'fila':
      // A tall folded cap, its point flopping to one side.
      shaded(c, 16, 4 + y, 32, 13, 4, colour, 0.25, 0.3);
      for (let i = 0; i < 12; i++)
        px(c, 22 + i * 0.8, 4 + y - i, 18 - i * 1.2, 1, i < 6 ? colour : shade(colour, 0.85));
      px(c, 16, 14 + y, 32, 2, dark);
      px(c, 24, 6 + y, 1, 8, dark);
      px(c, 38, 5 + y, 10, 2, light);
      break;
    case 'crown':
      // A gold band with five points, a jewel in the middle one.
      shaded(c, 17, 9 + y, 30, 7, 2, colour, 0.25, 0.3);
      for (const [x, h] of [
        [17, 6],
        [24, 8],
        [30, 11],
        [37, 8],
        [43, 6],
      ] as const) {
        for (let i = 0; i < h; i++)
          px(c, x + i * 0.2, 9 + y - i, 4 - i * 0.35, 1, i < 2 ? dark : colour);
        px(c, x + 1, 9 + y - h, 2, 1, light);
      }
      px(c, 17, 10 + y, 30, 1, light);
      if (side !== 'up') round(c, 30, 11 + y, 4, 4, 1, trim ?? '#3a8ac8');
      break;
    case 'beret':
      // Soft and flat, slouched to one side, with a little stalk on top.
      shaded(c, left ? 10 : 14, 4 + y, 38, 11, 5, colour, 0.25, 0.3);
      px(c, 16, 13 + y, 32, 2, dark);
      px(c, left ? 16 : 20, 5 + y, 16, 1, light);
      px(c, 31, 1 + y, 2, 4, dark);
      break;
  }
}

/**
 * One frame of a person. Frame 0 stands; 1-4 are a step with the left foot and 5-8 with the
 * right (pass, stride, pass, land). Right is left, mirrored. With `headless`, the head is left
 * off, for a Ranemon's photo to go on top.
 */
export function paintPerson(
  s: Style,
  dir: Dir,
  frame: number,
  headless = false,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = PERSON_W;
  canvas.height = PERSON_H;
  const c = canvas.getContext('2d')!;
  const side: Side = dir === 'right' ? 'left' : dir;
  const p = poseOf(frame);
  if (side === 'left') {
    legsSide(c, s, p);
    bodySide(c, s, p);
  } else {
    const back = side === 'up';
    if (!back && s.guitar) torsoFront(c, { ...s, guitar: undefined }, p, true);
    legsFront(c, s, p, back);
    torsoFront(c, s, p, back);
    armsFront(c, s, p, back);
  }
  if (!headless) head(c, s, side, p);
  outline(c);
  if (dir !== 'right') return canvas;
  const flipped = document.createElement('canvas');
  flipped.width = PERSON_W;
  flipped.height = PERSON_H;
  const f = flipped.getContext('2d')!;
  f.scale(-1, 1);
  f.drawImage(canvas, -PERSON_W, 0);
  return flipped;
}

// ---------- dogs: Norm and Elvis ----------

export const DOG = '#1e1e24';
export const DOG_SHINE = '#3e3e4a';
export const DOG_WHITE = '#f4f4f0';
export const DOG_GREY = '#c8c8cc';
export const NOSE = '#0a0a0c';
export const TONGUE = '#e86a7a';
const GLINT = '#f4f4f0';

/** A dog's colours: its coat, the coat's highlight, its markings and their shadow. */
export interface Coat {
  coat: string;
  shine: string;
  white: string;
  grey: string;
  /** Drawn this much bigger than Norm, standing on the same spot. */
  scale: number;
}

export const COATS: Record<Dog, Coat> = {
  // Norm: a border collie, black with a white blaze, chest, socks and tail tip.
  norm: { coat: DOG, shine: DOG_SHINE, white: DOG_WHITE, grey: DOG_GREY, scale: 1 },
  // Elvis, Carl Ryan's dog: really huge and black all over, only a dusty grey chest and muzzle.
  elvis: { coat: '#141418', shine: '#30303a', white: '#3c3c46', grey: '#2a2a32', scale: 2 },
};

/**
 * A dog who walks behind you in place of your Ranemon, or waits in a corner: Norm is a border
 * collie with a white blaze, white chest and socks, and a white tip to his tail, and Elvis the
 * same shape in black. On the same 64 × 96 canvas as a person, standing on the same ground, but
 * half as tall; draw it `COATS[dog].scale` times bigger.
 */
export function paintDog(dir: Dir, frame: number, dog: Dog = 'norm'): HTMLCanvasElement {
  const { coat, shine, white, grey } = COATS[dog];
  const canvas = document.createElement('canvas');
  canvas.width = PERSON_W;
  canvas.height = PERSON_H;
  const c = canvas.getContext('2d')!;
  const p = poseOf(frame);
  const ground = 93;
  const lift = p.lift;
  if (dir === 'left' || dir === 'right') {
    // Tail first, curving up behind.
    const wag = p.stride % 2 ? 1 : 0;
    px(c, 50, 60 + lift - wag, 4, 10, coat);
    px(c, 53, 54 + lift - wag, 4, 8, coat);
    px(c, 55, 50 + lift - wag, 4, 5, white);
    // Legs: far pair in shadow, then the body, then the near pair.
    const swing = p.stride * 2;
    const leg = (x: number, far: boolean, dx: number) => {
      const up = Math.abs(dx) >= 4 ? 2 : 0;
      px(c, x + dx, 74 + lift, 5, ground - 74 - lift - 4 - up, far ? shine : coat);
      px(c, x + dx, ground - 5 - up, 5, 5, far ? grey : white);
    };
    leg(17, true, -swing);
    leg(43, true, swing);
    shaded(c, 12, 58 + lift, 42, 20, 9, coat, 0.18, 0.2);
    // The white chest and belly.
    round(c, 12, 64 + lift, 12, 14, 5, white);
    px(c, 22, 74 + lift, 20, 3, grey);
    leg(14, false, swing);
    leg(40, false, -swing);
    // The head, out in front: a black skull, a white blaze and muzzle, and a floppy ear.
    shaded(c, 4, 42 + lift, 22, 20, 8, coat, 0.2, 0.2);
    round(c, 0, 52 + lift, 14, 10, 4, white);
    px(c, 10, 42 + lift, 4, 12, white);
    px(c, 0, 52 + lift, 4, 4, NOSE);
    px(c, 4, 61 + lift, 5, 3, TONGUE);
    px(c, 9, 48 + lift, 3, 3, NOSE);
    px(c, 9, 48 + lift, 1, 1, GLINT);
    px(c, 16, 38 + lift, 7, 6, coat);
    px(c, 18, 44 + lift, 6, 8, shine);
  } else if (dir === 'down') {
    // Facing you: head over a white chest, front legs below, the back end behind.
    shaded(c, 18, 60 + lift, 28, 22, 10, coat, 0.2, 0.25);
    round(c, 23, 62 + lift, 18, 18, 7, white);
    for (const [x, foot] of [
      [22, -1],
      [37, 1],
    ] as const) {
      const up = p.stride === foot * 2 ? 2 : p.stride === foot ? 1 : 0;
      px(c, x, 76 + lift, 6, ground - 76 - lift - up, coat);
      px(c, x, ground - 6 - up, 6, 6, white);
    }
    // Ears, one up and one flopped.
    px(c, 16, 38 + lift, 7, 8, coat);
    px(c, 41, 42 + lift, 8, 6, coat);
    shaded(c, 18, 40 + lift, 28, 24, 10, coat, 0.2, 0.2);
    // The blaze down the middle, opening into a white muzzle.
    px(c, 30, 40 + lift, 4, 14, white);
    round(c, 24, 52 + lift, 16, 12, 5, white);
    round(c, 29, 52 + lift, 6, 4, 2, NOSE);
    px(c, 30, 60 + lift, 4, 4, TONGUE);
    // Eyes, with a glint.
    px(c, 23, 47 + lift, 4, 4, NOSE);
    px(c, 37, 47 + lift, 4, 4, NOSE);
    px(c, 23, 47 + lift, 1, 1, GLINT);
    px(c, 37, 47 + lift, 1, 1, GLINT);
  } else {
    // Walking away: the back legs, the body, the back of the head and the tail up high.
    for (const [x, foot] of [
      [20, -1],
      [38, 1],
    ] as const) {
      const up = p.stride === foot * 2 ? 2 : p.stride === foot ? 1 : 0;
      px(c, x, 76 + lift, 6, ground - 76 - lift - up, coat);
      px(c, x, ground - 6 - up, 6, 6, white);
    }
    shaded(c, 17, 56 + lift, 30, 26, 11, coat, 0.2, 0.25);
    shaded(c, 20, 42 + lift, 24, 18, 8, coat, 0.2, 0.2);
    px(c, 18, 38 + lift, 7, 8, coat);
    px(c, 39, 42 + lift, 7, 6, coat);
    const wag = p.stride > 0 ? 2 : p.stride < 0 ? -2 : 0;
    px(c, 30 + wag, 62 + lift, 4, 12, shine);
    px(c, 30 + wag, 72 + lift, 4, 5, white);
  }
  outline(c);
  if (dir !== 'right') return canvas;
  const flipped = document.createElement('canvas');
  flipped.width = PERSON_W;
  flipped.height = PERSON_H;
  const f = flipped.getContext('2d')!;
  f.scale(-1, 1);
  f.drawImage(canvas, -PERSON_W, 0);
  return flipped;
}

// ---------- bikes ----------

export type BikeKind = 'lime' | 'nelly';

export const BIKES: Record<BikeKind, { frame: string; trim: string; basket: boolean }> = {
  // A Lime e-bike, as on every street in London: lime green, a step-through frame, chunky
  // tyres, a black basket up front and the battery under the seat.
  lime: { frame: '#7ad321', trim: '#f4f8f0', basket: true },
  // The High Nelly: a big black Irish roadster.
  nelly: { frame: '#202024', trim: '#c8ccd4', basket: false },
};
export const TYRE = '#1c1c22';
export const RIM = '#9aa0a8';

function wheel(c: Ctx, x: number, y: number, r: number, turn: number) {
  c.fillStyle = TYRE;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = RIM;
  c.beginPath();
  c.arc(x, y, r - 3, 0, Math.PI * 2);
  c.fill();
  c.save();
  c.globalCompositeOperation = 'destination-out';
  c.beginPath();
  c.arc(x, y, r - 4, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // Spokes, turned a little each frame as you pedal.
  for (let i = 0; i < 3; i++) {
    const a = turn * 0.5 + (i * Math.PI) / 3;
    const dx = Math.cos(a) * (r - 4);
    const dy = Math.sin(a) * (r - 4);
    c.strokeStyle = RIM;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(Math.round(x - dx), Math.round(y - dy));
    c.lineTo(Math.round(x + dx), Math.round(y + dy));
    c.stroke();
  }
  px(c, x - 2, y - 2, 4, 4, '#5a5e66');
}

/** A bike on its own, on the same canvas and ground as a person, facing `dir`. */
function bikeLayer(c: Ctx, kind: BikeKind, dir: Dir, frame: number) {
  const b = BIKES[kind];
  const dark = shade(b.frame, 0.7);
  const side: Side = dir === 'right' ? 'left' : dir;
  if (side === 'left') {
    // Front wheel on the left.
    wheel(c, 13, 82, 11, frame);
    wheel(c, 51, 82, 11, frame);
    // Mudguards.
    px(c, 4, 69, 18, 3, b.frame);
    px(c, 42, 69, 18, 3, b.frame);
    // The step-through frame: down from the head tube, along low, up to the seat.
    for (let i = 0; i <= 12; i++) px(c, 18 + i, 58 + i * 1.6, 5, 5, i % 4 ? b.frame : dark);
    px(c, 26, 76, 16, 5, b.frame);
    for (let i = 0; i <= 10; i++) px(c, 40 - i * 0.4, 76 - i * 1.6, 5, 4, b.frame);
    // Battery under the seat, and the seat.
    px(c, 33, 66, 6, 10, '#3a3e46');
    px(c, 33, 57, 12, 3, '#141418');
    // Fork, stem and bars.
    px(c, 15, 60, 4, 22, dark);
    px(c, 17, 48, 4, 12, '#2a2a30');
    px(c, 12, 47, 12, 3, '#141418');
    // Chain ring.
    px(c, 30, 77, 7, 7, '#5a5e66');
    if (b.basket) {
      px(c, 2, 52, 16, 10, '#141418');
      px(c, 3, 53, 14, 1, '#3a3e46');
      px(c, 4, 57, 2, 2, b.frame);
    }
    // The name along the frame, in white.
    if (kind === 'lime') for (const x of [27, 30, 33, 36]) px(c, x, 78, 2, 2, b.trim);
    // Headlight.
    px(c, 1, 60, 3, 3, '#fff8c0');
  } else if (side === 'down') {
    // Coming towards you: the front wheel, fork, mudguard, basket and bars.
    px(c, 28, 71, 8, 22, TYRE);
    px(c, 30, 73, 4, 18, '#3a3e46');
    px(c, 27, 68, 10, 4, b.frame);
    px(c, 25, 60, 4, 12, dark);
    px(c, 35, 60, 4, 12, dark);
    px(c, 12, 51, 40, 3, '#141418');
    px(c, 10, 50, 5, 5, '#2a2a30');
    px(c, 49, 50, 5, 5, '#2a2a30');
    if (b.basket) {
      px(c, 21, 55, 22, 12, '#141418');
      px(c, 22, 56, 20, 1, '#3a3e46');
      px(c, 26, 60, 12, 3, b.frame);
    }
    px(c, 30, 66, 4, 3, '#fff8c0');
  } else {
    // Going away: the back wheel, mudguard, rack and tail light, and the ends of the bars.
    px(c, 28, 71, 8, 22, TYRE);
    px(c, 30, 73, 4, 18, '#3a3e46');
    px(c, 25, 64, 14, 8, b.frame);
    px(c, 26, 65, 12, 1, shade(b.frame, 1.25));
    px(c, 29, 67, 6, 3, '#e83a3a');
    px(c, 10, 50, 6, 4, '#2a2a30');
    px(c, 48, 50, 6, 4, '#2a2a30');
  }
}

/** You on a bike: standing on the pedals, with the bike over your legs. Pedals turn with `frame`. */
export function paintRider(s: Style, dir: Dir, frame: number, kind: BikeKind): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = PERSON_W;
  canvas.height = PERSON_H;
  const c = canvas.getContext('2d')!;
  c.drawImage(paintPerson(s, dir, 0), 0, -7);
  const bike = document.createElement('canvas');
  bike.width = PERSON_W;
  bike.height = PERSON_H;
  const b = bike.getContext('2d')!;
  const side: Side = dir === 'right' ? 'left' : dir;
  bikeLayer(b, kind, side === 'left' ? 'left' : dir, frame);
  outline(b);
  if (dir === 'right') {
    c.save();
    c.scale(-1, 1);
    c.drawImage(bike, -PERSON_W, 0);
    c.restore();
  } else c.drawImage(bike, 0, 0);
  return canvas;
}
