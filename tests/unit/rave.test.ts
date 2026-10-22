import { describe, expect, it } from 'vitest';
import { interiorId } from '@/content/story/interiors';
import { mapById } from '@/content/story/maps';
import { BOUNCER, RAVE_ID, RAVE_TRAINERS } from '@/content/story/rave';
import { STATION_ID } from '@/content/story/station';
import { trainerById } from '@/content/story/trainers';
import { STYLES } from '@/components/story/people';
import { BEAT_MS, dance } from '@/components/story/partyfx';
import { find, isWalkable, npcsOf, tileAt, type Step } from '@/lib/story/world';

/** Plays a script with every question answered `answer`, returning what was said and fought. */
function play(steps: Step[], answer = true, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'battle') out.push(`BATTLE ${s.trainer}`);
    else if (s.do === 'ask') {
      out.push(`ASK ${s.text}`);
      play((answer ? s.yes : s.no) ?? [], answer, out);
    }
  }
  return out;
}

describe('the Rave Cave', () => {
  const dublin = mapById('dublin');
  const cave = mapById(RAVE_ID);
  const ravers = npcsOf(cave).filter((n) => n.item.trainer);

  it('is the fourth landmark door in Dublin, after Connolly Station', () => {
    expect(RAVE_ID).toBe(interiorId('dublin', 'L', 3));
    expect(STATION_ID).toBe(interiorId('dublin', 'L', 2));
    expect(cave.name).toBe('The Rave Cave, Dublin City');
    expect(cave.inside).toEqual({ map: 'dublin', ...find(dublin, 'L')[3] });
    expect(dublin.signs!.some((s) => s.startsWith('THE RAVE CAVE'))).toBe(true);
    expect(dublin.npcs).toContain(BOUNCER);
    expect(play(cave.arrive!)[0]).toMatch(/^THE RAVE CAVE/);
  });

  it('is full of trainers, all partying', () => {
    expect(ravers).toHaveLength(RAVE_TRAINERS.length);
    expect(ravers.length).toBeGreaterThanOrEqual(8);
    for (const n of npcsOf(cave)) expect(n.item.dances, `person ${n.index + 1}`).toBe(true);
    for (const n of ravers) {
      expect(tileAt(cave, n.x, n.y)).toBe('l');
      // Nobody jumps you: you pick who to battle.
      expect(n.item.sight).toBeUndefined();
    }
    expect(isWalkable('l')).toBe(true);
    expect(isWalkable('I')).toBe(false);
  });

  it('gets harder from the door to the DJ', () => {
    const aces = RAVE_TRAINERS.map((t) => Math.max(...t.team.map(([, l]) => l)));
    expect([...aces].sort((a, b) => a - b)).toEqual(aces);
    // From about where you reach Dublin up to well past B&S.
    expect(aces[0]).toBeLessThanOrEqual(44);
    expect(aces.at(-1)).toBeGreaterThanOrEqual(56);
    const ys = ravers.map((n) => n.y);
    expect([...ys].sort((a, b) => b - a)).toEqual(ys);
    for (const t of RAVE_TRAINERS) expect(t.prize).toBe(Math.max(...t.team.map(([, l]) => l)) * 20);
  });

  it('battles anyone you have beaten again, whenever you ask', () => {
    for (const n of ravers) {
      const t = trainerById(n.item.trainer!);
      const yes = play(n.item.talk!, true);
      expect(yes[0]).toBe(`ASK Ask ${t.name} for another battle?`);
      expect(yes[1]).toMatch(new RegExp(`^${t.name.toUpperCase()}: `));
      expect(yes.at(-1)).toBe(`BATTLE ${t.id}`);
      const no = play(n.item.talk!, false);
      expect(no.some((s) => s.startsWith('BATTLE'))).toBe(false);
    }
  });

  it('has a DJ, speakers, a dance floor and a bouncer on the door', () => {
    expect(npcsOf(cave)[0].item.look).toBe('dj');
    expect(STYLES.dj.headphones).toBeDefined();
    expect(STYLES.bouncer.glasses).toBe('shades');
    for (const look of ['raver', 'clubber', 'shuffler'] as const)
      expect(STYLES[look].glowsticks).toBeDefined();
    expect(find(cave, 'I').length).toBeGreaterThan(0);
    expect(find(cave, 'l').length).toBeGreaterThan(40);
    const door = find(dublin, 'L')[3];
    const bouncer = npcsOf(dublin).find((n) => n.item === BOUNCER)!;
    expect(Math.abs(bouncer.x - door.x) + Math.abs(bouncer.y - door.y)).toBeLessThanOrEqual(3);
  });

  it('dances on the beat, out of step with the dancer beside them', () => {
    const at = (i: number, beat: number) => dance(i, beat * BEAT_MS);
    const faces = new Set(Array.from({ length: 8 }, (_, b) => at(0, b).dir));
    expect(faces.size).toBeGreaterThan(1);
    expect(at(0, 0).dir).not.toBe(at(1, 0).dir);
    for (let b = 0; b < 8; b++) {
      const d = at(2, b + 0.3);
      expect(d.hop).toBeGreaterThanOrEqual(0);
      expect(d.hop).toBeLessThanOrEqual(1);
    }
  });
});

describe('Dublin, as a city', () => {
  const dublin = mapById('dublin');

  it('is bigger than the county towns, with the river crossed by several bridges', () => {
    expect(dublin.rows[0].length).toBeGreaterThan(mapById('kildare').rows[0].length);
    expect(dublin.rows.length).toBeGreaterThan(mapById('kildare').rows.length);
    const bridges = new Set(find(dublin, 'B').map((p) => p.x));
    expect(bridges.size).toBeGreaterThanOrEqual(3);
  });

  it('keeps every door it had, in the same order', () => {
    // Saves and the rooms behind the doors go by which door of each kind it is.
    expect(mapById(interiorId('dublin', 'L', 0)).name).toMatch(/^St James’s Gate/);
    expect(mapById(interiorId('dublin', 'L', 1)).name).toMatch(/Hellfire Club/);
    expect(mapById(interiorId('dublin', 'H', 0)).arrive![0]).toMatchObject({
      text: expect.stringMatching(/^TEMPLE BAR/),
    });
    expect(mapById(interiorId('dublin', 'P', 0)).name).toBe('McGrattans, Dublin City');
    expect(mapById(interiorId('dublin', 'M', 0)).name).toBe('Vapes, Dublin City');
  });
});
