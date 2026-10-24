import { describe, expect, it } from 'vitest';
import { AGREEMENT, CHAMPION, KING_BEATEN, LANDED } from '@/content/story/kneecap';
import { ARRIVALS_ID, FLIGHT, LONDON } from '@/content/story/london';
import { mapById } from '@/content/story/maps';
import { CHARLES, PALACE_ID, PALACE_ROOM_IDS, ROYALS } from '@/content/story/palace';
import { teamOf, trainerById } from '@/content/story/trainers';
import { UK } from '@/lib/battle/uk';
import { makeMember } from '@/lib/story/party';
import { newGame, reunite } from '@/lib/story/state';
import { npcsOf, type Step } from '@/lib/story/world';

/** Plays a script against `flags`, answering every question yes, noting what happens. */
function play(steps: Step[], flags: Set<string>, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'border') out.push('BORDER');
    else if (s.do === 'reunite') out.push('REUNITE');
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, out);
    else if (s.do === 'ask') play(s.yes ?? [], flags, out);
  }
  return out;
}

describe('Buckingham Palace', () => {
  it('opens for the Premier League Champion only', () => {
    expect(LONDON.landmarkLocks?.[2]?.flag).toBe(CHAMPION);
    expect(mapById(PALACE_ID).name).toBe('The Forecourt, London');
  });

  it('is a run of rooms, each door shut until the royal in it is beaten', () => {
    const rooms = PALACE_ROOM_IDS.map(mapById);
    expect(rooms.map((r) => r.name.split(',')[0])).toEqual([
      'The Forecourt',
      'The Grand Staircase',
      'The Royal Mews',
      'The Ballroom',
      'The East Wing',
      'The State Dining Room',
      'The Throne Room',
    ]);
    ROYALS.forEach((royal, i) => {
      expect(rooms[i].landmarkLocks?.[0]?.flag).toBe(`beat:${royal}`);
      expect(
        npcsOf(rooms[i]).some((n) => n.item.trainer === royal),
        royal,
      ).toBe(true);
    });
    // Every way out goes back to the Mall.
    for (const r of rooms) expect(r.inside?.map).toBe('london');
  });

  it('gets harder room by room, up to the King', () => {
    const aces = [...ROYALS, CHARLES].map((id) =>
      Math.max(...teamOf(trainerById(id), 'simomon').map(([, l]) => l)),
    );
    for (let i = 1; i < aces.length; i++) expect(aces[i]).toBeGreaterThan(aces[i - 1]);
    expect(aces.at(-1)).toBe(60);
  });

  it('has Bridie in the East Wing to put the kettle on', () => {
    const east = mapById(PALACE_ROOM_IDS[4]);
    const bridie = east.npcs.find((n) => n.look === 'bridie')!;
    expect(bridie.talk).toContainEqual({ do: 'heal' });
  });
});

describe('King Charles', () => {
  it('frees the lads, signs the Good Saturday Agreement and brings your Irish party back', () => {
    const flags = new Set<string>();
    const said = play(trainerById(CHARLES).reward!, flags);
    expect(flags.has(KING_BEATEN)).toBe(true);
    expect(flags.has(AGREEMENT)).toBe(true);
    expect(said).toContain('REUNITE');
    expect(said.join(' ')).toContain('GOOD SATURDAY AGREEMENT');
  });

  it('puts your Irish party back in front, and keeps the UK lot', () => {
    const s = {
      ...newGame(),
      party: [makeMember('simomon', 50, 1, UK), makeMember('carlmon', 50, 2, UK)],
      away: {
        party: [1, 2, 3, 4, 5].map((i) => makeMember('jammon', 60, 10 + i)),
        box: [makeMember('enda', 60, 20)],
      },
    };
    const back = reunite(s);
    expect(back.away).toBeUndefined();
    expect(back.party).toHaveLength(6);
    expect(back.party[0].uid).toBe(11);
    expect(back.party[5].uid).toBe(1);
    expect(back.box.map((m) => m.uid)).toEqual([2, 20]);
  });

  it('means no more border: your Ranemon fly with you', () => {
    const flags = new Set([LANDED, AGREEMENT]);
    const said = play(FLIGHT, flags);
    expect(said).not.toContain('BORDER');
    const home = mapById(ARRIVALS_ID).npcs.find((n) => n.look === 'crew')!;
    expect(play(home.talk!, flags)).not.toContain('BORDER');
  });
});
