import { STAT_KEYS, type BaseStats, type Creature } from './creature';
import type { RaneType } from './types';

/**
 * Mega Evolution, as in the main series: once per battle, one Ranemon on a side whose trainer
 * has a Mega Ring can Mega evolve as it attacks, for the rest of that battle. It keeps its HP,
 * moves and level; its other stats grow by MEGA_BOOST in all, mostly where it's already
 * strongest, and it may take a second type. Only these evolved forms have a Mega form.
 */
export const MEGA_BOOST = 100;

interface Mega {
  /** Gets most of the boost: half of it, the other half shared in the shape of the rest. */
  focus: keyof Omit<BaseStats, 'hp'>;
  /** Its types as a Mega, if they change. */
  types?: [RaneType] | [RaneType, RaneType];
  /** Its name as a Mega, if it isn't “Mega” and its own. */
  name?: string;
}

export const MEGAS: Record<string, Mega> = {
  conix: { focus: 'defense' },
  hitmonollie: { focus: 'attack' },
  carlizard: { focus: 'spirit' },
  steadakazam: { focus: 'spirit' },
  hitmonois: { focus: 'speed' },
  lorchu: { focus: 'speed' },
  cholokill: { focus: 'attack' },
  clefenda: { focus: 'spirit' },
  // Harry Kane, with the Ballon d'Or he brings himself: gold, like the trophy.
  kanemon: { focus: 'attack', types: ['brawn', 'posh'], name: 'Ballan d’Or' },
};

export const hasMega = (species: string) => Object.hasOwn(MEGAS, species);

/** Its stats as a Mega: the same HP, and MEGA_BOOST more across the rest. */
export function megaStats(base: BaseStats, focus: Mega['focus']): BaseStats {
  const rest = STAT_KEYS.filter((k) => k !== 'hp');
  const total = rest.reduce((sum, k) => sum + base[k], 0);
  const out = { ...base };
  const shared = MEGA_BOOST / 2;
  for (const k of rest) out[k] += Math.round((base[k] * shared) / total);
  out[focus] += MEGA_BOOST - rest.reduce((sum, k) => sum + out[k] - base[k], 0);
  return out;
}

/**
 * Its Mega sprite: the same picture's Mega version, its look and shininess kept
 * (`/sprites/evo/carlizard-tache.png` becomes `/sprites/mega/carlizard-tache.png`). A drawn UK
 * form's Mega is drawn too (`/sprites/drawn/carlizard.png` becomes
 * `/sprites/drawn/mega/carlizard.png`, from `scripts/drawn/mega.py`), and so is Harry Kane's
 * (`/sprites/premier/mega/kanemon.png`, from `scripts/drawn/footballers.py`).
 */
export const megaSprite = (sprite: string) =>
  /^\/sprites\/(shiny\/)?(drawn|premier)\//.test(sprite)
    ? sprite.replace(/^\/sprites\/(shiny\/)?(drawn|premier)\//, '/sprites/$1$2/mega/')
    : sprite.replace(/^\/sprites\/(shiny\/)?(evo|bw)\//, '/sprites/$1mega/');

/** A creature's Mega form, or undefined if it hasn't one (or already is one). */
export function megaForm(c: Creature): Creature | undefined {
  const m = MEGAS[c.id];
  if (!m || c.mega) return undefined;
  return {
    ...c,
    name: m.name ?? `Mega ${c.name}`,
    types: m.types ?? c.types,
    base: megaStats(c.base, m.focus),
    sprite: c.sprite && megaSprite(c.sprite),
    solid: false,
    mega: true,
  };
}
