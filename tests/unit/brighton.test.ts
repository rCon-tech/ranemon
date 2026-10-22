import { describe, expect, it } from 'vitest';
import { AMEX_ID, ARCADE_ID, ARCADE_KING, BRIGHTON_TRAINERS } from '@/content/story/brighton';
import { BRIGHTON_DONE, ENDA_ASKED, ENDA_MET, MATCH_DONE } from '@/content/story/enda';
import { mapById, mapFor } from '@/content/story/maps';
import { STATION_ID, departureTo, homeward, ticket } from '@/content/story/station';
import { stopsOf } from '@/content/story/townmap';
import { trainerById } from '@/content/story/trainers';
import { STYLES, scaleOf, SMALL } from '@/components/story/people';
import { startBattle } from '@/lib/battle/engine';
import { evolutionOf } from '@/lib/battle/evolutions';
import { battleSong } from '@/lib/sound/cues';
import { habitats } from '@/lib/story/dex';
import { canUseOn, heldBoost, itemById } from '@/lib/story/items';
import { makeMember, toEntrant } from '@/lib/story/party';
import { exportCode, importCode } from '@/lib/story/save';
import { give, holdItem, newGame } from '@/lib/story/state';
import {
  canEnter,
  DELTA,
  find,
  isPresent,
  isWalkable,
  marker,
  npcsOf,
  spottedBy,
  tileAt,
  type Dir,
  type GameMap,
  type Look,
  type Step,
} from '@/lib/story/world';

/**
 * Plays a script against `flags`, answering every question with `answer`, returning what was
 * said, fought, given and where it went. A battle is won, so the trainer's reward plays too.
 */
function play(steps: Step[], flags: Set<string>, answer = true, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'give') out.push(`GIVE ${s.item}`);
    else if (s.do === 'travel') out.push(`TRAVEL ${s.map} ${s.x},${s.y}`);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, answer, out);
    else if (s.do === 'ask') play((answer ? s.yes : s.no) ?? [], flags, answer, out);
    else if (s.do === 'battle') {
      const t = trainerById(s.trainer);
      out.push(`BATTLE ${t.id}`, t.after);
      flags.add(`beat:${t.id}`);
      play(t.reward ?? [], flags, answer, out);
    }
  }
  return out;
}

/** Every tile you can walk to from a start, with the people present for these flags in the way. */
function walkable(map: GameMap, from: { x: number; y: number }, flags: Set<string>): Set<string> {
  const seen = new Set([`${from.x},${from.y}`]);
  const queue = [from];
  while (queue.length) {
    const { x, y } = queue.shift()!;
    for (const dir of Object.keys(DELTA) as Dir[]) {
      const [dx, dy] = DELTA[dir];
      const key = `${x + dx},${y + dy}`;
      if (seen.has(key) || !canEnter(map, x + dx, y + dy, flags)) continue;
      seen.add(key);
      queue.push({ x: x + dx, y: y + dy });
    }
  }
  return seen;
}

const person = (map: GameMap, look: Look, flags = new Set<string>()) =>
  npcsOf(map).find((n) => n.item.look === look && isPresent(n.item, flags))!;

describe('Enda, in Kildare', () => {
  const kildare = mapById('kildare');
  const exit = { x: kildare.rows[0].length - 1, y: 11 };
  // Kildare's jersey is won, so the Garda has stepped aside: only Enda can be in the way.
  const won = ['jersey:kildare'];

  it('is very small, with brown hair, smaller than anyone else in the game', () => {
    const enda = STYLES.enda;
    expect(enda.tiny).toBe(true);
    expect(scaleOf(enda)).toBeLessThan(SMALL);
    for (const [look, s] of Object.entries(STYLES))
      if (look !== 'enda') expect(scaleOf(s), look).toBeGreaterThan(scaleOf(enda));
    // Brown: more red than green, more green than blue, and dark.
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(enda.hair.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(b);
    expect(r).toBeLessThan(0x90);
  });

  it('stands in the road so nobody reaches Dublin without meeting him', () => {
    const start = marker(kildare, '@');
    expect(walkable(kildare, start, new Set(won)).has(`${exit.x},${exit.y}`)).toBe(false);
    const enda = person(kildare, 'enda');
    expect(enda.item.hideIf).toBe(ENDA_MET);
    // Right in front of the Garda, on the only way out.
    expect(enda.y).toBe(exit.y);
    expect(enda.x).toBe(exit.x - 2);
    // Once you've met him he's by the road instead, and the way is clear.
    const met = new Set([...won, ENDA_MET]);
    expect(walkable(kildare, start, met).has(`${exit.x},${exit.y}`)).toBe(true);
    const aside = person(kildare, 'enda', met);
    expect(aside.item.showIf).toBe(ENDA_MET);
    expect(walkable(kildare, start, met).has(`${aside.x},${aside.y}`)).toBe(false);
  });

  it('is in the way coming back from Dublin too, until you meet him', () => {
    const arrive = marker(kildare, '>');
    const enda = person(kildare, 'enda');
    expect(Math.abs(arrive.x - enda.x) + Math.abs(arrive.y - enda.y)).toBe(1);
  });

  it('makes you his best friend and asks you to Brighton with Ollie and Kill', () => {
    const flags = new Set<string>();
    const said = play(person(kildare, 'enda').item.talk!, flags).join(' ');
    expect(said).toMatch(/best friends?/);
    expect(said).toMatch(/Ollie and Kill/);
    expect(said).toMatch(/BRIGHTON/);
    expect(said).toMatch(/Connolly Station/);
    expect(flags).toEqual(new Set([ENDA_ASKED, ENDA_MET]));
  });

  it('steps aside if you say no, and asks again whenever you talk to him', () => {
    const flags = new Set<string>();
    play(person(kildare, 'enda').item.talk!, flags, false);
    expect(flags).toEqual(new Set([ENDA_MET]));
    const aside = person(kildare, 'enda', flags);
    expect(play(aside.item.talk!, flags, false).join(' ')).toMatch(/changed your mind/);
    expect(flags.has(ENDA_ASKED)).toBe(false);
    play(aside.item.talk!, flags, true);
    expect(flags.has(ENDA_ASKED)).toBe(true);
    // Then he just points you at the train, and after the trip he's the happiest man in Kildare.
    expect(play(aside.item.talk!, flags).join(' ')).toMatch(/Sail & Rail/);
    flags.add(BRIGHTON_DONE);
    expect(play(aside.item.talk!, flags).join(' ')).toMatch(/best day/);
  });

  it('can still be found by a save that is already past Kildare', () => {
    // A save from before Enda, in Dublin: he's in Kildare, in the road, waiting.
    const flags = new Set(['jersey:kildare', 'visited:kildare', 'visited:dublin']);
    expect(isPresent(person(kildare, 'enda').item, flags)).toBe(true);
    // And the clerk at Connolly tells you where to find him.
    const said = play(ticket(departureTo('brighton')), flags).join(' ');
    expect(said).toMatch(/Kildare/);
    expect(said).toMatch(/Enda/);
    expect(said).not.toMatch(/TRAVEL/);
  });
});

describe('the Sail & Rail to Brighton', () => {
  const line = departureTo('brighton');
  const station = mapById(STATION_ID);

  it('runs from Connolly only once you have said yes to Enda', () => {
    expect(line.lock?.flag).toBe(ENDA_ASKED);
    expect(play(ticket(line), new Set()).some((l) => l.startsWith('TRAVEL'))).toBe(false);
    const there = play(ticket(line), new Set([ENDA_ASKED])).find((l) => l.startsWith('TRAVEL'))!;
    const [, map, at] = there.split(' ');
    const [x, y] = at.split(',').map(Number);
    expect(map).toBe('brighton');
    expect(isWalkable(tileAt(mapById(map), x, y))).toBe(true);
    // A sailor on the platform, and one in Brighton to bring you home.
    expect(person(station, 'sailor').item.talk).toBeTruthy();
    expect(person(mapById('brighton'), 'sailor').item.talk).toEqual(homeward('brighton'));
  });

  it('puts Brighton on the Town Map once you have been, off in the corner out to sea', () => {
    const game = newGame();
    expect(stopsOf(game).some((s) => s.id === 'brighton')).toBe(false);
    const stops = stopsOf({ ...game, flags: ['visited:brighton'] });
    const brighton = stops.find((s) => s.id === 'brighton')!;
    expect(brighton).toMatchObject({ town: 'Brighton', county: 'England' });
    const dublin = stops.find((s) => s.id === 'dublin')!;
    expect(brighton.x).toBeGreaterThan(dublin.x);
    expect(brighton.y).toBeGreaterThan(dublin.y);
    expect(stopsOf({ ...game, map: 'brighton' }).find((s) => s.here)?.id).toBe('brighton');
  });
});

describe('the Brighton adventure', () => {
  const brighton = mapById('brighton');
  const amex = mapById(AMEX_ID);
  const arcade = mapById(ARCADE_ID);
  const arrive = departureTo('brighton').at;

  it('has Enda, Ollie and Kill waiting off the train', () => {
    for (const look of ['enda', 'ollie', 'kill'] as Look[]) {
      const p = person(brighton, look);
      expect(Math.abs(p.x - arrive.x) + Math.abs(p.y - arrive.y), look).toBeLessThanOrEqual(3);
    }
    expect(play(person(brighton, 'enda').item.talk!, new Set()).join(' ')).toMatch(/Amex/);
  });

  it('is a seaside town with a pub, a shop, a beach, a pier and long grass', () => {
    for (const door of ['P', 'M']) expect(find(brighton, door), door).toHaveLength(1);
    expect(find(brighton, 'L')).toHaveLength(3);
    for (const tile of ['d', '~', 'B', ','])
      expect(find(brighton, tile).length, tile).toBeGreaterThan(0);
    expect(amex.name).toBe('The Amex, Brighton');
    expect(arcade.name).toBe('The Arcade, Brighton');
  });

  it('keeps the arcade shut until the match is over', () => {
    expect(brighton.landmarkLocks?.[2]?.flag).toBe(MATCH_DONE);
    expect(brighton.landmarkLocks?.[2]?.locked).toMatch(/Match first/);
  });

  it('plays the match from the front row with Enda, Brighton winning it late', () => {
    const flags = new Set<string>();
    const enda = person(amex, 'enda');
    // Not now: nothing happens.
    play(enda.item.talk!, flags, false);
    expect(flags.has(MATCH_DONE)).toBe(false);
    const said = play(enda.item.talk!, flags).join(' ');
    expect(said).toMatch(/Kick-off/);
    expect(said).toMatch(/FULL TIME\. Brighton 2, Crystal Palace 1/);
    expect(flags.has(MATCH_DONE)).toBe(true);
    // The three of them leave for the arcade, and wait for you there.
    for (const look of ['enda', 'ollie', 'kill'] as Look[]) {
      expect(npcsOf(amex).some((n) => n.item.look === look && isPresent(n.item, flags))).toBe(
        false,
      );
      expect(npcsOf(brighton).some((n) => n.item.look === look && isPresent(n.item, flags))).toBe(
        false,
      );
      expect(person(arcade, look, flags), look).toBeTruthy();
    }
  });

  it('has two fans in the stands, and a Palace fan by the way out after the match', () => {
    const fans = amex.npcs.filter((n) => n.look === 'fan');
    expect(fans.map((f) => f.trainer)).toEqual(['amex-fan-callum', 'amex-fan-pat']);
    const palace = person(amex, 'palace', new Set([MATCH_DONE]));
    expect(palace.item.showIf).toBe(MATCH_DONE);
    // He sees the tile in front of the way out, so nobody leaves without a battle.
    const out = find(amex, 'E')[0];
    const beaten = () => false;
    expect(spottedBy(amex, out.x, out.y - 1, new Set(), beaten)).toBeNull();
    expect(spottedBy(amex, out.x, out.y - 1, new Set([MATCH_DONE]), beaten)?.item.trainer).toBe(
      'amex-palace',
    );
  });

  it('makes you get past the gamers to reach the Arcade King', () => {
    const flags = new Set([MATCH_DONE]);
    const king = person(arcade, 'king', flags);
    const start = marker(arcade, '@');
    const gamers = npcsOf(arcade).filter((n) => n.item.look === 'gamer');
    expect(gamers.map((g) => g.item.trainer)).toEqual([
      'arcade-kayleigh',
      'arcade-derek',
      'arcade-hannah',
    ]);
    /** Whether the King can be reached with the tiles these gamers can see walled off. */
    const reachable = (watching: typeof gamers) => {
      const seen = new Set<string>();
      for (const g of watching) {
        const [dx, dy] = DELTA[g.item.face];
        for (let d = 1; d <= g.item.sight!; d++) seen.add(`${g.x + dx * d},${g.y + dy * d}`);
      }
      const blocked: GameMap = {
        ...arcade,
        rows: arcade.rows.map((row, y) =>
          [...row].map((c, x) => (seen.has(`${x},${y}`) ? 'W' : c)).join(''),
        ),
      };
      const reach = walkable(blocked, start, flags);
      return Object.values(DELTA).some(([kx, ky]) => reach.has(`${king.x + kx},${king.y + ky}`));
    };
    expect(reachable([])).toBe(true);
    // Kayleigh watches the only way in from the door; Derek and Hannah each watch one of the two
    // ways past the middle row of machines.
    expect(reachable([gamers[0]])).toBe(false);
    expect(reachable([gamers[1]])).toBe(true);
    expect(reachable([gamers[1], gamers[2]])).toBe(false);
  });

  it('ends with the Arcade King, a boss with boss music, and Enda’s Friendship Bracelet', () => {
    const boss = trainerById(ARCADE_KING);
    expect(boss.ai).toBe('hard');
    expect(boss.team.length).toBeGreaterThanOrEqual(5);
    const best = (id: string) => Math.max(...trainerById(id).team.map(([, l]) => l));
    for (const t of BRIGHTON_TRAINERS.filter((t) => t.id !== ARCADE_KING))
      expect(best(t.id), t.id).toBeLessThan(best(ARCADE_KING));
    expect(battleSong('city', false, ARCADE_KING)).toBe('boss');

    const flags = new Set([MATCH_DONE]);
    const king = person(arcade, 'king', flags);
    expect(king.item.trainer).toBe(ARCADE_KING);
    const said = play([{ do: 'battle', trainer: ARCADE_KING }], flags);
    expect(said).toContain('GIVE friendship-bracelet');
    expect(said.join(' ')).toMatch(/ENDA/);
    expect(flags.has(BRIGHTON_DONE)).toBe(true);
    expect(play(person(arcade, 'enda', flags).item.talk!, flags).join(' ')).toMatch(/BEST FRIENDS/);
  });
});

describe('the Friendship Bracelet', () => {
  const bracelet = itemById('friendship-bracelet');

  it('can be held by any Ranemon, and raises its Defense 20% in battle', () => {
    expect(bracelet.price).toBeNull();
    for (const id of ['enda', 'conemon', 'killemon', 'olliemon'])
      expect(canUseOn(bracelet, makeMember(id, 50, 1)), id).toBe(true);
    const member = { ...makeMember('killemon', 50, 1), held: bracelet.id };
    expect(heldBoost(member)).toEqual({ defense: 1.2 });
    const foe = toEntrant(makeMember('conemon', 50, 2));
    const without = startBattle([[toEntrant(makeMember('killemon', 50, 1))], [foe]], 1).state;
    const withIt = startBattle([[toEntrant(member)], [foe]], 1).state;
    const defense = (s: typeof without) => s.teams[0].battlers[0].stats.defense;
    expect(defense(withIt)).toBe(Math.floor(defense(without) * 1.2));
  });

  it('is kept by saves and save codes', () => {
    let g = newGame();
    g = { ...g, party: [makeMember('enda', 50, 1)] };
    g = holdItem(give(g, 'friendship-bracelet'), 0, 'friendship-bracelet');
    const back = importCode(exportCode(g));
    expect('state' in back && back.state.party[0].held).toBe('friendship-bracelet');
  });
});

describe('Brighton in the Ranedex', () => {
  it('lists Brighton where its wild Ranemon are found, once you have been', () => {
    const brighton = mapById('brighton');
    // At Lv44 and up most are found already evolved, so it's on whichever form you meet there.
    for (const [id] of brighton.wild!.table) {
      const forms = [id, evolutionOf(id)?.id].filter((f): f is string => !!f);
      expect(
        forms.some((f) => habitats(f).some((h) => h.map === 'brighton')),
        id,
      ).toBe(true);
    }
    expect(mapFor('brighton', []).name).toBe('Brighton, England');
  });
});
