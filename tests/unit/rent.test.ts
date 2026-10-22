import { describe, expect, it } from 'vitest';
import { interiorId } from '@/content/story/interiors';
import { mapById } from '@/content/story/maps';
import {
  accusedFlag,
  NEVER_FIND_OUT,
  RENT_ACCUSED,
  RENT_CLUES,
  RENT_DONE,
  RENT_READY,
  RENT_START,
  RENT_TRAINERS,
} from '@/content/story/rent';
import { trainerById } from '@/content/story/trainers';
import { STYLES } from '@/components/story/people';
import { npcsOf, type Look, type Step } from '@/lib/story/world';

/**
 * Plays a script against `flags`, answering every question with `answer`, returning what was
 * said and fought. A battle is won, so the trainer's last words and reward play too.
 */
function play(steps: Step[], flags: Set<string>, answer = true, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
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

describe('the missing rent', () => {
  const dublin = mapById('dublin');
  const house = mapById(interiorId('dublin', 'H', 1));
  const who = (map: typeof dublin, look: Look) =>
    npcsOf(map).find((n) => n.item.look === look)!.item.talk!;
  const talk = (map: typeof dublin, look: Look, flags: Set<string>, answer = true) =>
    play(who(map, look), flags, answer);
  const neighbour = () =>
    npcsOf(dublin).find((n) => n.item.talk?.some((s) => JSON.stringify(s).includes('NEIGHBOUR')))!
      .item.talk!;
  const garda = () =>
    npcsOf(dublin).find((n) => n.item.talk?.some((s) => JSON.stringify(s).includes('dusted')))!.item
      .talk!;

  /** Everything up to the accusation: Ollie, then the three clues. */
  function solve(): Set<string> {
    const flags = new Set<string>();
    talk(house, 'ollie', flags);
    talk(house, 'simo', flags);
    play(neighbour(), flags);
    play(garda(), flags);
    return flags;
  }

  it('is in the second house in Dublin, with Ollie, Simo, MC and Melchior', () => {
    expect(house.name).toBe('A house, Dublin City');
    expect(house.npcs.map((n) => n.look)).toEqual(['ollie', 'simo', 'mc', 'melchior']);
    // The first house is still Temple Bar.
    expect(mapById(interiorId('dublin', 'H', 0)).npcs[0].look).toBe('local');
    for (const look of ['ollie', 'simo', 'mc', 'melchior'] as const)
      expect(STYLES[look]).toBeTruthy();
    expect(STYLES.mc.small).toBe(true);
    expect(STYLES.melchior.hat?.kind).toBe('crown');
  });

  it('starts when Ollie tells you, and nobody gives a clue before', () => {
    const flags = new Set<string>();
    talk(house, 'simo', flags);
    play(neighbour(), flags);
    play(garda(), flags);
    expect(RENT_CLUES.some((c) => flags.has(c))).toBe(false);
    expect(talk(house, 'ollie', flags).join(' ')).toContain('rent money');
    expect(flags.has(RENT_START)).toBe(true);
  });

  it('needs all three clues, in any order, before you can accuse anyone', () => {
    const flags = new Set([RENT_START]);
    play(garda(), flags);
    play(neighbour(), flags);
    expect(flags.has(RENT_READY)).toBe(false);
    expect(talk(house, 'mc', flags).join(' ')).not.toContain('BATTLE');
    expect(flags.has(RENT_ACCUSED)).toBe(false);
    talk(house, 'simo', flags);
    expect(RENT_CLUES.every((c) => flags.has(c))).toBe(true);
    expect(flags.has(RENT_READY)).toBe(true);
  });

  it.each(['mc', 'melchior'] as const)(
    'lets you accuse %s, battle them, and never find out who did it',
    (id) => {
      const flags = solve();
      const other = id === 'mc' ? 'melchior' : 'mc';
      const said = talk(house, id, flags);
      expect(said).toContain(`BATTLE ${RENT_TRAINERS[id]}`);
      expect(said.some((l) => l.endsWith(NEVER_FIND_OUT))).toBe(true);
      expect(flags.has(accusedFlag(id))).toBe(true);
      expect(flags.has(RENT_DONE)).toBe(true);
      // The other one can't be accused or fought now.
      expect(talk(house, other, flags).join(' ')).not.toContain('BATTLE');
      expect(flags.has(accusedFlag(other))).toBe(false);
      // And whoever you beat just says it again.
      expect(talk(house, id, flags)).toEqual([`${id.toUpperCase()}: ${NEVER_FIND_OUT}`]);
    },
  );

  it('lets you change your mind before accusing anyone', () => {
    const flags = solve();
    expect(talk(house, 'mc', flags, false).join(' ')).not.toContain('BATTLE');
    expect(flags.has(RENT_ACCUSED)).toBe(false);
  });

  it('makes you fight the one you accused again if you lose', () => {
    const flags = solve();
    flags.add(RENT_ACCUSED);
    flags.add(accusedFlag('melchior'));
    expect(talk(house, 'melchior', flags)).toContain(`BATTLE ${RENT_TRAINERS.melchior}`);
  });

  it('says the same last words for both, and never names the culprit', () => {
    for (const id of Object.values(RENT_TRAINERS)) {
      const t = trainerById(id);
      expect(t.after.endsWith(NEVER_FIND_OUT)).toBe(true);
      expect(t.friendly).toBeFalsy();
      for (const [, level] of t.team) expect(level).toBeGreaterThanOrEqual(40);
    }
    expect(NEVER_FIND_OUT).toBe(
      'This changes nothing, you’ll still never find out who took the cash!',
    );
  });
});
