import { describe, expect, it } from 'vitest';
import { interiorId } from '@/content/story/interiors';
import { INTERIORS, LEGEND_FLAG, MAPS, mapById } from '@/content/story/maps';
import { LEGEND, LEGEND_LEVEL } from '@/lib/battle/legend';
import { ROSTER } from '@/lib/battle/roster';
import { DEX } from '@/lib/battle/evolutions';
import { catchRate } from '@/lib/story/party';
import { catchChance } from '@/lib/ui/session';
import { isPresent, npcsOf, type Step } from '@/lib/story/world';

/** Plays a script's says, flags and ifs against `flags`, returning everything said and fought. */
function play(steps: Step[], flags: Set<string>, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'wild') out.push(`WILD ${s.species} ${s.level}`);
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, out);
  }
  return out;
}

describe('the legend of Dublin', () => {
  const dublin = mapById('dublin');
  const talkTo = (look: string, flags: Set<string>) =>
    play(npcsOf(dublin).find((n) => n.item.look === look)!.item.talk!, flags);
  const barman = (flags: Set<string>) => {
    const room = mapById(interiorId('dublin', 'H', 2));
    return play(room.arrive ?? [], flags);
  };

  it('takes three beads, in order, to open the Hellfire Club', () => {
    const flags = new Set<string>();
    talkTo('busker', flags);
    expect(flags.has('bead:busker')).toBe(false);
    talkTo('local', flags);
    expect(flags.has('bead:liffey')).toBe(true);
    talkTo('busker', flags);
    expect(flags.has('bead:busker')).toBe(true);
    expect(flags.has(LEGEND_FLAG)).toBe(false);
    barman(flags);
    expect([...flags]).toEqual(
      expect.arrayContaining(['bead:liffey', 'bead:busker', 'bead:templebar', LEGEND_FLAG]),
    );
    expect(dublin.landmarkLocks?.[1]?.flag).toBe(LEGEND_FLAG);
  });

  it('waits in the Hellfire Club, nameless, for a hard wild battle', () => {
    const room = mapById(interiorId('dublin', 'L', 1));
    const him = room.npcs.find((n) => n.look === 'legend')!;
    expect(isPresent(him, new Set())).toBe(false);
    expect(isPresent(him, new Set([LEGEND_FLAG]))).toBe(true);
    expect(isPresent(him, new Set([LEGEND_FLAG, `caught:${LEGEND.id}`]))).toBe(false);
    const said = play(him.talk!, new Set([LEGEND_FLAG]));
    expect(said).toContain(`WILD ${LEGEND.id} ${LEGEND_LEVEL}`);
  });

  it('is never named before you meet him', () => {
    const lines: string[] = [];
    const words = (steps: Step[]): void =>
      steps.forEach((s) => {
        if (s.do === 'say' || s.do === 'ask') lines.push(s.text);
        if (s.do === 'if') [s.then, s.else ?? []].forEach(words);
        if (s.do === 'ask') [s.yes ?? [], s.no ?? []].forEach(words);
      });
    for (const m of [...MAPS, ...INTERIORS]) {
      for (const n of m.npcs) words(n.talk ?? []);
      words(m.arrive ?? []);
    }
    expect(lines.length).toBeGreaterThan(100);
    for (const line of lines) expect(line.toLowerCase()).not.toContain('tobymon');
  });

  it('is in the Ranedex but not in the wild or battle mode', () => {
    expect(DEX.at(-1)?.id).toBe(LEGEND.id);
    expect(ROSTER.some((c) => c.id === LEGEND.id)).toBe(false);
    for (const m of MAPS) expect(JSON.stringify(m.wild ?? {}), m.id).not.toContain(LEGEND.id);
  });

  it('is befriended only rarely, even at 1 HP and asleep with a Mulligan’s Pint', () => {
    const chance = catchChance(100, 1, catchRate(LEGEND.id), 2, 'asleep');
    expect(chance).toBeGreaterThan(0.1);
    expect(chance).toBeLessThan(0.2);
    expect(catchChance(100, 100, catchRate(LEGEND.id), 1, null)).toBeLessThan(0.02);
  });
});
