import { describe, expect, it } from 'vitest';
import { mapById } from '@/content/story/maps';
import {
  DEPARTURES,
  PLATFORM,
  RUNNING,
  STATION_ID,
  aboard,
  boardText,
  homeward,
  ticket,
  type Departure,
} from '@/content/story/station';
import { storyFlags } from '@/lib/story/devsave';
import { find, isWalkable, npcsOf, tileAt, type Step } from '@/lib/story/world';

/** Plays a script with every question answered `answer`, returning what was said and where it went. */
function play(steps: Step[], flags: Set<string>, answer = true, out: string[] = []): string[] {
  for (const s of steps) {
    if (s.do === 'say') out.push(s.text);
    else if (s.do === 'flag') flags.add(s.flag);
    else if (s.do === 'travel') out.push(`TRAVEL ${s.map} ${s.x},${s.y}`);
    else if (s.do === 'departures') out.push('DEPARTURES');
    else if (s.do === 'if') play(flags.has(s.flag) ? s.then : (s.else ?? []), flags, answer, out);
    else if (s.do === 'ask') play((answer ? s.yes : s.no) ?? [], flags, answer, out);
  }
  return out;
}

const travelled = (said: string[]) => {
  const line = said.find((l) => l.startsWith('TRAVEL'));
  if (!line) return null;
  const [, map, at] = line.split(' ');
  const [x, y] = at.split(',').map(Number);
  return { map, x, y };
};

describe('Connolly Station', () => {
  const dublin = mapById('dublin');
  const station = mapById(STATION_ID);

  it('is a door of its own in Dublin, with a sign outside', () => {
    expect(station.name).toBe('Connolly Station, Dublin City');
    expect(station.inside).toEqual({ map: 'dublin', ...find(dublin, 'L')[2] });
    expect(dublin.signs!.some((s) => s.startsWith('CONNOLLY STATION'))).toBe(true);
    // The trains all leave from here now: nobody runs one from the street.
    expect(dublin.npcs.some((n) => n.look === 'conductor' || n.look === 'dart')).toBe(false);
  });

  it('has a clerk at the ticket desk who shows the departures board', () => {
    const clerk = npcsOf(station).find((n) => n.item.look === 'clerk')!;
    expect(play(clerk.item.talk!, new Set())).toContain('DEPARTURES');
    // Behind the desk, so you talk to them across it.
    expect(tileAt(station, clerk.x, clerk.y + 1)).toBe('C');
  });

  it('puts every running line’s staff on the platforms, and their train runs', () => {
    for (const d of RUNNING) {
      const staff = npcsOf(station).find((n) => n.item.look === d.staff)!;
      expect(staff, d.id).toBeTruthy();
      expect(staff.item.talk).toEqual(aboard(d));
    }
  });

  it('runs each line out to open ground and home again to the concourse', () => {
    expect(isWalkable(tileAt(station, PLATFORM.x, PLATFORM.y))).toBe(true);
    for (const d of RUNNING) {
      const open = new Set(d.lock ? [d.lock.flag] : []);
      const there = travelled(play(ticket(d), open))!;
      expect(there.map, d.id).toBe(d.id);
      expect(isWalkable(tileAt(mapById(d.id), there.x, there.y)), d.id).toBe(true);
      const back = travelled(play(homeward(d.id), new Set()))!;
      expect(back).toEqual({ map: STATION_ID, x: PLATFORM.x, y: PLATFORM.y });
      // Whoever runs it at the other end brings you back.
      const far = mapById(d.id).npcs.find((n) => n.look === d.staff)!;
      expect(far.talk, d.id).toEqual(homeward(d.id));
    }
  });

  it('welcomes you the first time only, and keeps Bundoran’s old flag', () => {
    const flags = new Set<string>();
    const greystones = RUNNING.find((d) => d.id === 'greystones')!;
    expect(play(ticket(greystones), flags)).toContain(greystones.first);
    expect(play(ticket(greystones), flags)).not.toContain(greystones.first);
    const bundoran = RUNNING.find((d) => d.id === 'donegal')!;
    expect(play(ticket(bundoran), new Set(['seen:bundoran']))).not.toContain(bundoran.first);
  });

  it('lists every line on the board, with the ones still to come marked', () => {
    const platforms = DEPARTURES.map((d) => d.platform);
    expect(new Set(platforms).size).toBe(platforms.length);
    expect(new Set(DEPARTURES.map((d) => d.id)).size).toBe(DEPARTURES.length);
    for (const d of DEPARTURES) expect(boardText()).toContain(d.to);
    expect(DEPARTURES.some((d) => d.soon)).toBe(true);
    expect(boardText()).toContain('(coming soon)');
    expect(station.things?.D).toBe(boardText());
    // A line that runs goes to a real map; one that's coming soon has no staff yet.
    for (const d of RUNNING) expect(mapById(d.id)).toBeTruthy();
    // The clerk, the staff, and Jamie Boyde on the concourse.
    expect(npcsOf(station)).toHaveLength(RUNNING.length + 2);
  });

  it('keeps a locked line shut until its flag is set', () => {
    const locked: Departure = {
      ...RUNNING[0],
      lock: { flag: 'mission:done', locked: 'CLERK: That line isn’t running yet.' },
    };
    expect(travelled(play(ticket(locked), new Set()))).toBeNull();
    expect(play(ticket(locked), new Set())).toContain('CLERK: That line isn’t running yet.');
    expect(travelled(play(ticket(locked), new Set(['mission:done'])))).not.toBeNull();
  });

  it('lets the developer save know every flag the trains set', () => {
    const flags = storyFlags();
    expect(flags).toContain('seen:greystones');
    expect(flags).toContain('seen:bundoran');
  });
});
