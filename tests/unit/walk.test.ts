import { describe, expect, it } from 'vitest';
import { mapById } from '@/content/story/maps';
import {
  BIKE_MS,
  isRiding,
  placeWalk,
  startWalk,
  tickWalk,
  WALK_MS,
  type Held,
  type Position,
  type Trail,
} from '@/components/story/walk';

/** A walk on the open road in Clare, with the story's side played by a list of steps taken. */
function road() {
  const w = startWalk({ x: 12, y: 15, face: 'down' });
  const trail: Trail = { at: { x: 12, y: 15 }, from: null };
  const held = { current: { dir: null, b: false } as Held };
  const steps: Position[] = [];
  const walker = {
    map: mapById('clare'),
    flags: new Set<string>(),
    frozen: false,
    bike: null as string | null,
    held,
    onStep: (to: Position) => steps.push(to),
    onTurn: () => {},
    onBump: () => {},
  };
  return {
    w,
    trail,
    held,
    steps,
    walker,
    tick: (now: number) => tickWalk(w, trail, walker, now),
  };
}

describe('walking', () => {
  it('takes one step for a tap let go before the next frame', () => {
    const { w, held, steps, tick } = road();
    held.current.dir = held.current.tapped = 'right';
    held.current.dir = null;
    tick(1000);
    tick(1000 + WALK_MS);
    expect(steps).toEqual([{ x: 13, y: 15, face: 'right' }]);
    expect(w.waiting).toBe(true);
  });

  it('keeps a step when the story renders a turn late, with the old position', () => {
    const { w, trail, held, steps, tick } = road();
    held.current.dir = 'right';
    tick(1000);
    tick(1000 + WALK_MS);
    // The re-render for the turn lands after the step, still saying 12.
    placeWalk(w, trail, { x: 12, y: 15, face: 'right' });
    expect(w.x).toBe(13);
    expect(w.waiting).toBe(true);
    // Then the step itself, and walking carries on.
    placeWalk(w, trail, { x: 13, y: 15, face: 'right' });
    tick(1100 + WALK_MS);
    tick(1100 + WALK_MS * 2);
    expect(steps.map((s) => s.x)).toEqual([13, 14]);
  });

  it('still goes where the story sends it, such as a warp', () => {
    const { w, trail, held, tick } = road();
    held.current.dir = 'right';
    tick(1000);
    tick(1000 + WALK_MS);
    placeWalk(w, trail, { x: 3, y: 4, face: 'down' });
    expect([w.x, w.y, w.waiting]).toEqual([3, 4, false]);
  });

  it('rides the bike twice as fast while B is held, and only with a bike', () => {
    const { w, held, walker, tick } = road();
    held.current.b = true;
    held.current.dir = 'right';
    tick(1000);
    expect([w.dur, isRiding(w, walker)]).toEqual([WALK_MS, false]);
    walker.bike = 'lime';
    tick(1000 + WALK_MS);
    placeWalk(w, road().trail, { x: w.x, y: w.y, face: 'right' });
    tick(2000);
    expect(w.dur).toBe(BIKE_MS);
    expect(isRiding(w, walker)).toBe(true);
    held.current.b = false;
    expect(isRiding(w, walker)).toBe(true);
  });
});
