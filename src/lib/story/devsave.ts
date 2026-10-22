import { INTERIORS, MAPS, mapById } from '@/content/story/maps';
import { TRAINERS } from '@/content/story/trainers';
import { PEAR_TRAINERS } from '@/content/story/greystones';
import { DEX, evolutionOf } from '../battle/evolutions';
import { LEGEND, LEGEND_LEVEL } from '../battle/legend';
import { variantsOf } from '../battle/variants';
import { ITEMS } from './items';
import { HM, CERT, TABLET, TABLET_TAKEN } from './keys';
import { NORM } from './norm';
import { makeMember, PARTY_SIZE, type Member } from './party';
import { SCHEMA } from './save';
import { beatFlag, playerId, type StoryState } from './state';
import { marker } from './world';

/**
 * A developer save with everything unlocked, for testing: every Ranemon and evolution, every
 * town, jersey, key item and story flag, and a full bag, starting in Dublin. It opens for one
 * trainer name, which only its owner knows; only the name's SHA-256 is kept here.
 *
 * It's worked out from the game's own content each time, so anything added later (a new town,
 * trainer, flag or Ranemon) is in a fresh developer save without touching this file. Only that
 * one name's save is affected; it saves like any other.
 */
const DEV_HASH = '93475e962f590263c21e8602e614101206d4a1b3b9ba1c3ab29bd14f30dbc3bd';

/** Whether a trainer name opens the developer save. Case and spacing don't matter. */
export async function isDevName(name: string, hash = DEV_HASH): Promise<boolean> {
  const id = playerId(name);
  if (!id || typeof crypto === 'undefined' || !crypto.subtle) return false;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex === hash;
}

/** The level of the party and of every evolved Ranemon. */
export const DEV_LEVEL = 60;

/**
 * Left for you to play: the bosses you'd want to test (the Happy Pear Twins among them), and
 * Norm, who you borrow from Sibeal.
 * Everything else a script can set is set.
 */
const LEFT_TO_PLAY = new Set([
  beatFlag('poseidon'),
  beatFlag('bns-rematch'),
  ...PEAR_TRAINERS.map(beatFlag),
  NORM,
]);

/** Every flag any script, trainer reward or map sets, found by walking the content. */
export function storyFlags(): string[] {
  const found = new Set<string>();
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if (o.do === 'flag' && typeof o.flag === 'string') found.add(o.flag);
      Object.values(o).forEach(walk);
    }
  };
  walk([MAPS, INTERIORS, TRAINERS]);
  return [...found];
}

/**
 * The whole Ranedex as Ranemon of your own: evolved forms first, then base forms, then the
 * legend, then the other looks of those that have them.
 */
function everyone(): Member[] {
  let uid = 1;
  const evolved = new Set(DEX.map((c) => evolutionOf(c.id)?.id).filter(Boolean));
  const members: Member[] = [];
  for (const c of DEX) {
    if (c.id === LEGEND.id) continue;
    if (evolved.has(c.id)) members.push(makeMember(c.id, DEV_LEVEL, uid++));
  }
  for (const c of DEX) {
    const evo = evolutionOf(c.id);
    if (c.id === LEGEND.id || evolved.has(c.id)) continue;
    // Base forms a level short of evolving, so evolution can be tried out in one battle.
    members.push(makeMember(c.id, evo ? evo.level - 1 : DEV_LEVEL, uid++));
  }
  members.push(makeMember(LEGEND.id, LEGEND_LEVEL, uid++));
  // And every other look, of every form that has one, at the same level as the usual look.
  for (const m of [...members])
    for (const v of variantsOf(m.species))
      members.push({ ...makeMember(m.species, m.level, uid++), variant: v.id });
  return members;
}

export function devSave(): StoryState {
  const dublin = mapById('dublin');
  const at = marker(dublin, '@');
  const members = everyone();
  const flags = new Set([
    'starter',
    'champion',
    HM,
    CERT,
    'bike',
    TABLET,
    TABLET_TAKEN,
    ...storyFlags(),
    ...MAPS.map((m) => `visited:${m.id}`),
    ...TRAINERS.map((t) => beatFlag(t.id)),
    ...DEX.map((c) => `caught:${c.id}`),
  ]);
  for (const f of LEFT_TO_PLAY) flags.delete(f);
  return {
    version: 1,
    map: dublin.id,
    ...at,
    face: 'right',
    party: members.slice(0, PARTY_SIZE),
    box: members.slice(PARTY_SIZE),
    bag: Object.fromEntries(ITEMS.map((i) => [i.id, 99])),
    money: 999_999,
    flags: [...flags],
    seen: DEX.map((c) => c.id),
    caught: DEX.map((c) => c.id),
    pub: { map: dublin.id, ...at },
    uid: members.length + 1,
    starter: members[0].species,
    steps: 0,
    expShare: true,
    schema: SCHEMA,
  };
}
