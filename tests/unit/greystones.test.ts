import { describe, expect, it } from 'vitest';
import { BEAT_PEARS, PEAR_HEARD, PEAR_TRAINERS, TO_GREYSTONES } from '@/content/story/greystones';
import { interiorId } from '@/content/story/interiors';
import { mapById } from '@/content/story/maps';
import { stopsOf } from '@/content/story/townmap';
import { trainerById } from '@/content/story/trainers';
import { STYLES } from '@/components/story/people';
import { startBattle } from '@/lib/battle/engine';
import { canUseOn, heldBoost, itemById } from '@/lib/story/items';
import { makeMember, toEntrant } from '@/lib/story/party';
import { exportCode, importCode, parseSave } from '@/lib/story/save';
import { give, holdItem, newGame, takeHeld } from '@/lib/story/state';
import {
  find,
  isPresent,
  isWalkable,
  npcsOf,
  tileAt,
  type GameMap,
  type Look,
  type Step,
} from '@/lib/story/world';

/**
 * Plays a script against `flags`, answering every question with `answer`, returning what was
 * said, fought and where it went. A battle is won, so the trainer's last words and reward play
 * too, unless it's in `lose`.
 */
function play(
  steps: Step[],
  flags: Set<string>,
  answer = true,
  lose: string[] = [],
  out: string[] = [],
): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'give') out.push(`GIVE ${s.item}`);
    else if (s.do === 'travel') out.push(`TRAVEL ${s.map} ${s.x},${s.y}`);
    else if (s.do === 'if')
      play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, answer, lose, out);
    else if (s.do === 'ask') play((answer ? s.yes : s.no) ?? [], flags, answer, lose, out);
    else if (s.do === 'battle') {
      const t = trainerById(s.trainer);
      out.push(`BATTLE ${t.id}`);
      // Losing ends the script there, as it does in the game.
      if (lose.includes(t.id)) return out;
      out.push(t.after);
      flags.add(`beat:${t.id}`);
      play(t.reward ?? [], flags, answer, lose, out);
    }
  }
  return out;
}

const travelIn = (said: string[]) => {
  const [, map, at] = said.find((l) => l.startsWith('TRAVEL'))!.split(' ');
  const [x, y] = at.split(',').map(Number);
  return { map: mapById(map), x, y };
};

describe('the DART to Greystones', () => {
  const dublin = mapById('dublin');
  const greystones = mapById('greystones');
  const station = mapById(interiorId('dublin', 'L', 2));
  const npc = (map: GameMap, look: Look) => npcsOf(map).find((n) => n.item.look === look)!;

  it('leaves from Pearse Station, a door of its own in Dublin', () => {
    expect(find(dublin, 'L')).toHaveLength(3);
    expect(station.name).toBe('Pearse Station, Dublin City');
    expect(npc(station, 'dart').item.talk).toBe(TO_GREYSTONES);
    expect(dublin.signs).toContain('PEARSE STATION. DART southbound for Greystones, Co. Wicklow.');
  });

  it('runs to Greystones and back, onto open ground', () => {
    const there = travelIn(play(TO_GREYSTONES, new Set()));
    const back = travelIn(play(npc(greystones, 'dart').item.talk!, new Set()));
    expect(there.map.id).toBe('greystones');
    expect(back.map.id).toBe('dublin');
    for (const { map, x, y } of [there, back]) expect(isWalkable(tileAt(map, x, y))).toBe(true);
    // Back in Dublin, you're standing right outside the station.
    const door = find(dublin, 'L')[2];
    expect(back).toMatchObject({ x: door.x, y: door.y + 1 });
  });

  it('says nothing if you stay on the platform', () => {
    expect(play(TO_GREYSTONES, new Set(), false).some((l) => l.startsWith('TRAVEL'))).toBe(false);
  });

  it('makes Greystones look the part: slate roofs, palms, yachts, jeeps and a beach', () => {
    expect(greystones.slate).toBe(true);
    for (const tile of ['p', 'y', 'c', 'd'])
      expect(find(greystones, tile).length, tile).toBeGreaterThan(0);
    expect(isWalkable('d')).toBe(true);
    for (const tile of ['p', 'y', 'c']) expect(isWalkable(tile), tile).toBe(false);
    // Its own McGrattans and Vapes, and the Happy Pear café.
    for (const door of ['P', 'M', 'L']) expect(find(greystones, door), door).toHaveLength(1);
  });

  it('joins the Town Map once you have been, after Dublin', () => {
    const game = newGame();
    expect(stopsOf(game).some((s) => s.id === 'greystones')).toBe(false);
    expect(stopsOf({ ...game, map: 'greystones' }).find((s) => s.here)?.id).toBe('greystones');
    const stops = stopsOf({ ...game, flags: ['visited:greystones'] });
    const [dub, grey] = ['dublin', 'greystones'].map((id) => stops.find((s) => s.id === id)!);
    // South of Dublin, on the coast.
    expect(grey.y).toBeGreaterThan(dub.y);
  });
});

describe('Greystones and the Happy Pear Twins', () => {
  const greystones = mapById('greystones');
  const talk = (look: Look, flags: Set<string>, answer = true, lose: string[] = []) =>
    play(npcsOf(greystones).find((n) => n.item.look === look)!.item.talk!, flags, answer, lose);

  it('has Kill, Stead and Cramps, each with their own look', () => {
    for (const look of ['kill', 'stead', 'cramps'] as Look[]) expect(STYLES[look]).toBeTruthy();
    expect(STYLES.kill.hair).toMatch(/^#e/);
    expect(STYLES.stead.cross).toBeTruthy();
    expect(STYLES.cramps.headphones).toBeTruthy();
  });

  it.each([
    ['kill', /Africa/],
    ['stead', /British/],
    ['cramps', /DJ/],
  ] as const)('%s says who they are, and complains about the twins', (look, about) => {
    const flags = new Set<string>();
    const said = talk(look, flags).join(' ');
    expect(said).toMatch(about);
    expect(said).toMatch(/terrible rule of THE HAPPY PEAR TWINS/);
    expect(flags.has(PEAR_HEARD)).toBe(true);
  });

  it('hides the twins until someone tells you about them', () => {
    const twins = greystones.npcs.filter((n) => n.look === 'pear');
    expect(twins).toHaveLength(2);
    for (const t of twins) {
      expect(isPresent(t, new Set())).toBe(false);
      expect(isPresent(t, new Set([PEAR_HEARD]))).toBe(true);
    }
  });

  it('fights Dave then Steve back to back, and gives the Vegan Stone', () => {
    const flags = new Set([PEAR_HEARD]);
    const said = talk('pear', flags);
    const battles = said.filter((l) => l.startsWith('BATTLE'));
    expect(battles).toEqual(PEAR_TRAINERS.map((t) => `BATTLE ${t}`));
    expect(said).toContain('GIVE vegan-stone');
    expect(flags.has(BEAT_PEARS)).toBe(true);
    // And once they're beaten, no more battles.
    expect(talk('pear', flags).some((l) => l.startsWith('BATTLE'))).toBe(false);
    expect(talk('kill', flags).join(' ')).toMatch(/free/);
  });

  it('leaves Dave beaten if you lose to Steve, so next time it is only Steve', () => {
    const flags = new Set([PEAR_HEARD]);
    const said = talk('pear', flags, true, ['pear-steve']);
    expect(said).not.toContain('GIVE vegan-stone');
    expect(flags.has('beat:pear-dave')).toBe(true);
    const again = talk('pear', flags);
    expect(again.filter((l) => l.startsWith('BATTLE'))).toEqual(['BATTLE pear-steve']);
    expect(again).toContain('GIVE vegan-stone');
  });

  it('lets you say no to the twins', () => {
    const flags = new Set([PEAR_HEARD]);
    expect(talk('pear', flags, false).some((l) => l.startsWith('BATTLE'))).toBe(false);
  });

  it('makes the twins strong, on Hard AI, stronger than Dublin', () => {
    for (const id of PEAR_TRAINERS) {
      const t = trainerById(id);
      expect(t.ai).toBe('hard');
      expect(t.team).toHaveLength(3);
      expect(Math.min(...t.team.map(([, l]) => l))).toBeGreaterThanOrEqual(50);
    }
  });
});

describe('the Vegan Stone', () => {
  const stone = itemById('vegan-stone');

  it('is held, never sold, and only Conemon and Conix can hold it', () => {
    expect(stone.price).toBeNull();
    expect(stone.use.kind).toBe('hold');
    expect(canUseOn(stone, makeMember('conemon', 20, 1))).toBe(true);
    expect(canUseOn(stone, makeMember('conemon', 40, 1))).toBe(true);
    expect(makeMember('conemon', 40, 1).species).toBe('conix');
    expect(canUseOn(stone, makeMember('killemon', 40, 1))).toBe(false);
  });

  it('raises Attack by 20% in battle, and nothing else', () => {
    const plain = makeMember('conemon', 50, 1);
    const holding = { ...plain, held: 'vegan-stone' as const };
    expect(heldBoost(plain)).toBeUndefined();
    expect(heldBoost(holding)).toEqual({ attack: 1.2 });
    const foe = toEntrant(makeMember('killemon', 50, 2));
    const without = startBattle([[toEntrant(plain)], [foe]], 1).state.teams[0].battlers[0];
    const withIt = startBattle([[toEntrant(holding)], [foe]], 1).state.teams[0].battlers[0];
    expect(withIt.stats.attack).toBe(Math.floor(without.stats.attack * 1.2));
    expect(withIt.stats.defense).toBe(without.stats.defense);
    expect(withIt.stats.hp).toBe(without.stats.hp);
  });

  it('does nothing for a Ranemon of another line', () => {
    expect(heldBoost({ ...makeMember('killemon', 50, 1), held: 'vegan-stone' })).toBeUndefined();
  });

  it('goes from the bag to a Ranemon and back again', () => {
    let g = give({ ...newGame(), party: [makeMember('conemon', 30, 1)] }, 'vegan-stone');
    g = holdItem(g, 0, 'vegan-stone');
    expect(g.party[0].held).toBe('vegan-stone');
    expect(g.bag['vegan-stone']).toBeUndefined();
    g = takeHeld(g, 0);
    expect(g.party[0].held).toBeUndefined();
    expect(g.bag['vegan-stone']).toBe(1);
  });

  it('stays held through saves and save codes, and an unknown item is dropped', () => {
    const g = {
      ...newGame(),
      party: [{ ...makeMember('conemon', 30, 1), held: 'vegan-stone' as const }],
    };
    expect(parseSave(JSON.stringify(g))?.party[0].held).toBe('vegan-stone');
    const code = importCode(exportCode(g));
    expect('state' in code && code.state.party[0].held).toBe('vegan-stone');
    const odd = { ...g, party: [{ ...g.party[0], held: 'mystery-box' }] };
    const back = parseSave(JSON.stringify(odd));
    expect(back?.party).toHaveLength(1);
    expect(back?.party[0].held).toBeUndefined();
  });
});
