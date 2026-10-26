import { STAT_BUDGET, STAT_KEYS, type Creature } from '../battle/creature';
import type { Entrant } from '../battle/engine';
import { ALL_ITEM_EVOLUTIONS, evolutionOf, formById, lineOf } from '../battle/evolutions';
import { LONDON_LINES } from '../battle/london';
import { drawTeam, ROSTER } from '../battle/roster';
import { secondSpecialOf } from '../battle/second-specials';
import { hasUkForm, UK } from '../battle/uk';
import { rollVariant, variantForm, variantOf, variantsOf, type Variant } from '../battle/variants';
import { heldBoost, heldCalm, ITEMS, type Item, type ItemId } from '../story/items';
import { MOVE_SLOTS } from '../story/learnsets';
import { movesAt } from '../story/party';
import { parseSave } from '../story/save';
import { SAVE_KEY } from '../story/state';
import { hasUkDex } from '../story/ukdex';

/**
 * Battle mode's team rules: which Ranemon you pick from, at which stage, and what each of your
 * picks brings from story mode (its look, a held item and its moves). Pure data, so the team
 * screen and the tests share it.
 */

/** Who's in the roster. The rival draws from the same roster, from the ones you didn't pick. */
export type RosterId = 'lads' | 'london' | 'everyone';
/** Basic forms, or every Ranemon fully evolved, as at Lv30 and on in story mode. */
export type Forms = 'basic' | 'evolved';

export const ROSTERS: { id: RosterId; label: string; about: string }[] = [
  { id: 'lads', label: 'THE LADS', about: `The ${ROSTER.length} lads from Ireland.` },
  { id: 'london', label: 'LONDON', about: 'London’s own Ranemon, from the London Ranedex.' },
  { id: 'everyone', label: 'EVERYONE', about: 'The lads and London’s own together.' },
];

export const FORMS: { id: Forms; label: string; about: string }[] = [
  { id: 'basic', label: 'BASIC', about: 'Every Ranemon as it starts out.' },
  {
    id: 'evolved',
    label: 'EVOLVED',
    about: 'Every Ranemon fully evolved, with a bigger stat budget. Some pick a branch.',
  },
];

/**
 * Whether battle mode has Britain's Ranemon: London's own and the drawn UK looks stay a surprise
 * until a Story mode save in this browser has made it over (it has a UK Ranedex).
 */
export function britainUnlocked(storage: Pick<Storage, 'length' | 'key' | 'getItem'> | null) {
  if (!storage) return false;
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key !== SAVE_KEY && !key?.startsWith(`${SAVE_KEY}:`)) continue;
    const game = parseSave(storage.getItem(key));
    if (game && hasUkDex(game)) return true;
  }
  return false;
}

const total = (c: Creature) => STAT_KEYS.reduce((sum, k) => sum + c.base[k], 0);

/** Every form of a line, first form first: each levelled step, then any item branches. */
function lineForms(first: string): Creature[] {
  const ids = [first];
  for (let evo = evolutionOf(first); evo; evo = evolutionOf(evo.id)) ids.push(evo.id);
  const branches = ALL_ITEM_EVOLUTIONS.filter((e) => ids.includes(e.from)).map((e) => e.id);
  return [...ids, ...branches].map(formById);
}

/**
 * One line in the roster: the forms you can pick it as under a rule. Basic is the line's last
 * form inside battle mode's usual budget; evolved is every form it can end up as, so Killemon
 * picks Killigatr or Cholokill and Wickmon one of its branches.
 */
export interface Slot {
  line: string;
  forms: Creature[];
}

function slotOf(first: string, forms: Forms): Slot | null {
  const all = lineForms(first);
  if (forms === 'basic') {
    const basic = all.filter((c) => !ALL_ITEM_EVOLUTIONS.some((e) => e.id === c.id));
    const within = basic.filter((c) => total(c) <= STAT_BUDGET).at(-1);
    return within ? { line: first, forms: [within] } : null;
  }
  const branched = ALL_ITEM_EVOLUTIONS.some((e) => e.from === first && !evolutionOf(first));
  const ends = all.filter((c) => !evolutionOf(c.id) && !(branched && c.id === first));
  return { line: first, forms: ends };
}

/** The lines to pick from, in order: the lads, then London's own. */
export function rosterOf(roster: RosterId, forms: Forms): Slot[] {
  const lines = [
    ...(roster !== 'london' ? ROSTER.map((c) => c.id) : []),
    ...(roster !== 'lads' ? LONDON_LINES : []),
  ];
  return lines.map((l) => slotOf(l, forms)).filter((s): s is Slot => s !== null);
}

/** Every look a form has, and the drawn UK one for the lads once Britain is unlocked. */
export function looksOf(species: string, britain = true): Variant[] {
  const uk = britain && variantOf(species, UK);
  return [...variantsOf(species), ...(hasUkForm(species) && uk ? [uk] : [])];
}

/** The items a species gets something from holding: any Ranemon's, and its own line's. */
export function holdItemsFor(species: string): Item[] {
  return ITEMS.filter((i) => heldBoost({ species, held: i.id }) !== undefined);
}

/** Its spare moves: what it would know by Lv50 in story mode, minus its second special move. */
export function spareMoves(c: Creature, moves: string[]): string[] {
  const second = secondSpecialOf(lineOf(c.id))?.id;
  const known = movesAt(formById(c.id), 50).filter((id) => id !== second);
  return [...formById(c.id).moves, ...known].filter(
    (id, i, all) => all.indexOf(id) === i && !moves.includes(id),
  );
}

/** One of your 6, as picked. */
export interface TeamPick {
  line: string;
  /** The form, for a line with more than one under the rule. */
  form: string;
  variant?: string;
  held?: ItemId;
  /** Its 4 moves, in order. */
  moves: string[];
}

export function newPick(slot: Slot): TeamPick {
  const c = slot.forms[0];
  return { line: slot.line, form: c.id, moves: [...c.moves] };
}

/** A pick at another form: the moves it can't use there go back to the form's own. */
export function withForm(pick: TeamPick, form: string): TeamPick {
  const c = formById(form);
  const spare = new Set([...c.moves, ...spareMoves(c, [])]);
  const kept = pick.moves.filter((id) => spare.has(id));
  const moves = kept.length === MOVE_SLOTS ? kept : [...c.moves];
  const variant = pick.variant && variantOf(form, pick.variant) ? pick.variant : undefined;
  return {
    line: pick.line,
    form,
    moves,
    ...(variant && { variant }),
    ...(pick.held && { held: pick.held }),
  };
}

/** The pick's creature: its form in its look, with its moves. */
export function creatureOfPick(pick: TeamPick): Creature {
  return variantForm({ ...formById(pick.form), moves: pick.moves }, pick.variant);
}

/** The pick as it joins the battle, at Lv50, with its held item's effect. */
export function entrantOfPick(pick: TeamPick): Entrant {
  const member = { species: pick.form, held: pick.held };
  const held = heldBoost(member);
  return {
    creature: creatureOfPick(pick),
    ...(held && { held }),
    ...(heldCalm(member) && { calm: true }),
  };
}

const shuffle = <T>(xs: T[], random: () => number) =>
  xs
    .map((x) => [random(), x] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, x]) => x);

/**
 * The rival's team: drawn at random from the lines in the roster you didn't pick, each at a
 * random form the rule allows and in a random look. It doesn't hold anything.
 */
export function rivalTeam(slots: Slot[], picked: string[], size: number, random: () => number) {
  const rest = slots.filter((s) => !picked.includes(s.line));
  const firsts = new Map(rest.map((s) => [s.line, s]));
  const drawn = drawTeam(
    shuffle(
      rest.map((s) => formById(s.line)),
      random,
    ),
    size,
  );
  return drawn.map((c) => {
    const slot = firsts.get(c.id)!;
    const form = slot.forms[Math.floor(random() * slot.forms.length)];
    return variantForm(form, rollVariant(form.id, random()));
  });
}
