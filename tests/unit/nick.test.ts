import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BEAT_NICK,
  NICK_ARRIVE,
  NICK_BERET,
  NICK_DONE,
  NICK_MET,
  NICK_REWARD,
  NICK_TEXT,
  NICK_TRAINER,
  ROCK_OF_CASHEL,
} from '@/content/story/nick';
import { AFTER_MAPS, INTERIORS, MAPS, isFlat, mapById } from '@/content/story/maps';
import { skinById, unlockSkins } from '@/content/story/skins';
import { trainerById } from '@/content/story/trainers';
import { STYLES } from '@/components/story/people';
import { hasSpecialEffect } from '@/components/SpecialEffect';
import { DEX, evolutionOf, formById } from '@/lib/battle/evolutions';
import { moveById } from '@/lib/battle/moves';
import { creatureById } from '@/lib/battle/roster';
import { secondSpecialOf } from '@/lib/battle/second-specials';
import { hasUkForm, ukSprite } from '@/lib/battle/uk';
import { UK_DEX } from '@/lib/story/ukdex';
import { makeMember } from '@/lib/story/party';
import { newGame } from '@/lib/story/state';
import { KEY_ITEMS } from '@/lib/story/keys';
import { openMissions } from '@/lib/story/missions';
import { canEnter, npcsOf, type Step } from '@/lib/story/world';

/** Every line said and battle started in a script, taking `if`s by `flags` and answering yes. */
function play(steps: Step[], flags: Set<string>, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'battle') out.push(`BATTLE ${s.trainer}`);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, out);
    else if (s.do === 'ask') play(s.yes ?? [], flags, out);
  }
  return out;
}

const thurles = () => mapById('tipperary');
const nick = () => npcsOf(thurles()).find((n) => n.item.look === 'nick')!;
const talk = (flags: string[]) => play(nick().item.talk!, new Set(flags)).join(' ');

/** Every step of a script, `if`s and answers included, for checking what it gives and sets. */
function every(steps: Step[]): Step[] {
  return steps.flatMap((s) =>
    s.do === 'if'
      ? [s, ...every(s.then), ...every(s.else ?? [])]
      : s.do === 'ask'
        ? [s, ...every(s.yes ?? []), ...every(s.no ?? [])]
        : [s],
  );
}
const recruits = (steps: Step[]) =>
  every(steps).filter((s) => s.do === 'recruit' && s.species === 'nickamon').length;

describe('Nick, before the third gym', () => {
  it('has left Clare for Thurles, which is 2D only', () => {
    expect(npcsOf(mapById('clare')).some((n) => n.item.look === 'nick')).toBe(false);
    expect(nick()).toBeDefined();
    expect(isFlat(thurles())).toBe(true);
  });

  it('stands in the only way into the Semple Stadium gym until he is done', () => {
    const map = thurles();
    const { x, y } = nick();
    expect(map.rows[y - 1][x]).toBe('G');
    // Walls either side of the door: he is the only way in.
    expect(map.rows[y - 1][x - 1]).toBe('#');
    expect(map.rows[y - 1][x + 1]).toBe('#');
    expect(canEnter(map, x, y, new Set())).toBe(false);
    expect(canEnter(map, x, y, new Set([NICK_DONE]))).toBe(true);
  });

  it('texts you the first time you come into Thurles, once', () => {
    expect(thurles().arrive).toBe(NICK_ARRIVE);
    const first = play(NICK_ARRIVE, new Set()).join(' ');
    expect(first).toContain('Semple Stadium');
    expect(every(NICK_ARRIVE).some((s) => s.do === 'flag' && s.flag === NICK_TEXT)).toBe(true);
    expect(play(NICK_ARRIVE, new Set([NICK_TEXT]))).toEqual([]);
    expect(play(NICK_ARRIVE, new Set([NICK_DONE]))).toEqual([]);
    expect(openMissions(new Set([NICK_TEXT])).map((m) => m.mission.id)).toContain('nick');
  });

  it('is the second most French man in Ireland, and lost his beret at the Rock of Cashel', () => {
    const said = talk([]);
    expect(said).toContain('second most French man in Ireland');
    expect(said).toContain('Wait until you meet my brother');
    expect(said).toContain('Rock of Cashel');
    expect(said).not.toContain('BATTLE');
    expect(talk([NICK_MET])).not.toContain('BATTLE');
  });

  it('keeps the beret at the Rock of Cashel, once he has told you about it', () => {
    expect(thurles().landmarks![0]).toBe(ROCK_OF_CASHEL);
    expect(play(ROCK_OF_CASHEL, new Set()).join(' ')).not.toContain('BERET');
    expect(play(ROCK_OF_CASHEL, new Set([NICK_MET])).join(' ')).toContain('NICK’S BERET');
    expect(play(ROCK_OF_CASHEL, new Set([NICK_MET, NICK_BERET])).join(' ')).not.toContain('BERET');
    expect(KEY_ITEMS.find((k) => k.flag === NICK_BERET)?.goneIf).toBe(NICK_DONE);
  });

  it('battles you once he has his beret back, with Nickamon on his team', () => {
    expect(talk([NICK_MET, NICK_BERET])).toMatch(new RegExp(`BATTLE ${NICK_TRAINER}$`));
    expect(trainerById(NICK_TRAINER).team.map(([s]) => s)).toContain('nickamon');
    expect(trainerById(NICK_TRAINER).reward).toBe(NICK_REWARD);
  });

  it('gives you Nickamon and steps aside when you beat him', () => {
    expect(recruits(NICK_REWARD)).toBe(1);
    expect(play(NICK_REWARD, new Set()).join(' ')).toContain('brother');
    expect(every(NICK_REWARD).some((s) => s.do === 'flee' && s.flag === NICK_DONE)).toBe(true);
  });

  it('gives a save that beat him in Clare its Nickamon, with no second battle', () => {
    const said = talk([BEAT_NICK]);
    expect(said).not.toContain('BATTLE');
    expect(recruits((nick().item.talk![0] as Extract<Step, { do: 'if' }>).then)).toBe(1);
    const flags = every((nick().item.talk![0] as Extract<Step, { do: 'if' }>).then).flatMap((s) =>
      s.do === 'flag' || s.do === 'flee' ? [s.flag] : [],
    );
    expect(flags).toEqual(expect.arrayContaining([NICK_TEXT, NICK_MET, NICK_BERET, NICK_DONE]));
    // The Clare battle's reward has already run for them, so this is their only Nickamon from him.
    expect(play(NICK_ARRIVE, new Set([BEAT_NICK])).join(' ')).toContain('something for you');
  });

  it('gives you his skin when you beat him, same as in Clare', () => {
    expect(skinById('nick')!.unlock).toEqual([BEAT_NICK]);
    const { state, lines } = unlockSkins({ ...newGame(), flags: [BEAT_NICK] });
    expect(state.skins).toContain('nick');
    expect(lines.join(' ')).toContain('Nick');
    expect(STYLES.nick.beard).toBeDefined();
    expect(STYLES.nick.bag).toBeDefined();
  });
});

describe('Nickamon', () => {
  it('joins the lads with his own move, a second at 36, and evolves into Nickoking', () => {
    const c = creatureById('nickamon');
    expect(moveById(c.moves[0]).signature).toBe('nickamon');
    expect(hasSpecialEffect(c.moves[0])).toBe(true);
    expect(secondSpecialOf('nickamon')?.id).toBe('wait-till-you-meet-my-brother');
    expect(evolutionOf('nickamon')?.id).toBe('nickoking');
    expect(makeMember('nickamon', 31, 1).species).toBe('nickoking');
    expect(formById('nickoking').types).toEqual(c.types);
    expect(DEX.map((d) => d.id)).toEqual(expect.arrayContaining(['nickamon', 'nickoking']));
  });

  it('is cut from his photo at home, and drawn over in Britain', () => {
    for (const id of ['nickamon', 'nickoking']) {
      expect(existsSync(`public${formById(id).sprite}`)).toBe(true);
      expect(hasUkForm(id)).toBe(true);
      expect(existsSync(`public${ukSprite(id)}`)).toBe(true);
      expect(UK_DEX.some((d) => d.id === id)).toBe(true);
    }
  });

  it('is only got from Nick, never in the long grass', () => {
    const grass = [...MAPS, ...INTERIORS, ...AFTER_MAPS].flatMap((m) => m.wild?.table ?? []);
    expect(grass.some(([s]) => s === 'nickamon')).toBe(false);
  });
});
