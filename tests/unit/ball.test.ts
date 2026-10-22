import { describe, expect, it } from 'vitest';
import { STYLES, TALL, scaleOf } from '@/components/story/people';
import { BEAT_MS, bulbsOf, dance, fireworks } from '@/components/story/partyfx';
import { BALL_FLAG, CARL_PRICE, CARL_STALL } from '@/content/story/ball';
import { AFTER_MAPS, mapById, mapFor } from '@/content/story/maps';
import { trainerById } from '@/content/story/trainers';
import { itemById, priceOf } from '@/lib/story/items';
import {
  canEnter,
  crowdAt,
  DELTA,
  find,
  isWalkable,
  marker,
  npcsOf,
  tileAt,
} from '@/lib/story/world';

const plain = mapById('trinity');
const ball = mapFor('trinity', [BALL_FLAG]);

describe('the Trinity Ball', () => {
  it('is Trinity until B&S are beaten, then the Ball for good', () => {
    expect(mapFor('trinity', [])).toBe(plain);
    expect(ball).not.toBe(plain);
    expect(ball.id).toBe('trinity');
    expect(ball.name).toBe('Trinity Ball');
    // The same object every time, so the 3D view only rebuilds when it changes.
    expect(mapFor('trinity', [BALL_FLAG, 'beat:bns'])).toBe(ball);
    expect(AFTER_MAPS).toContain(ball);
    expect(BALL_FLAG).toBe('champion');
  });

  it('turns on once B&S hand over the title', () => {
    const reward = trainerById('bns').reward!;
    const end = reward.findIndex((s) => s.do === 'ending');
    expect(reward.slice(end + 1)).toContainEqual(
      expect.objectContaining({ text: expect.stringContaining('TRINITY BALL') }),
    );
  });

  it('keeps the same ground, so nobody ends up stuck in a wall', () => {
    plain.rows.forEach((row, y) =>
      [...row].forEach((_, x) =>
        expect(isWalkable(tileAt(ball, x, y)), `${x},${y}`).toBe(isWalkable(tileAt(plain, x, y))),
      ),
    );
  });

  it('keeps Michael D, Alex and the B&S rematch, and the scholars stay beaten', () => {
    const trainers = ball.npcs.flatMap((n) => n.trainer ?? []);
    expect(trainers).toEqual(
      expect.arrayContaining([
        'scholar-1',
        'scholar-2',
        'scholar-3',
        'bns-rematch',
        'trinity-alex',
      ]),
    );
    expect(trainers).not.toContain('bns');
    expect(ball.npcs.some((n) => n.look === 'higgins')).toBe(true);
  });

  it('is a party: fairy lights, revellers, and everyone having a great time', () => {
    expect(bulbsOf(ball.party!.lights).length).toBeGreaterThan(50);
    expect(plain.party).toBeUndefined();
    const party = ball.npcs.filter((n) => n.look === 'reveller' || n.look === 'debs');
    expect(party.length).toBeGreaterThanOrEqual(3);
  });

  it('has Carl Ryan, a tall man, selling Blue Ghosts cheap', () => {
    const carl = npcsOf(ball).find((n) => n.item.look === 'carl')!;
    expect(carl).toBeTruthy();
    expect(STYLES.carl.tall).toBe(true);
    expect(scaleOf(STYLES.carl)).toBe(TALL);
    expect(TALL).toBeGreaterThan(1);
    expect(carl.item.talk).toContainEqual({ do: 'shop', stall: CARL_STALL });
    expect(CARL_STALL.stock).toEqual([{ item: 'blue-ghost', price: CARL_PRICE }]);
    expect(priceOf('blue-ghost', CARL_STALL)).toBe(CARL_PRICE);
    expect(CARL_PRICE).toBeLessThan(itemById('blue-ghost').price! / 5);
    // Vapes still charges full price, and Carl sells nothing else.
    expect(priceOf('blue-ghost')).toBe(itemById('blue-ghost').price);
    expect(priceOf('pint', CARL_STALL)).toBe(Infinity);
    expect(find(ball, '8')).toHaveLength(1);
  });

  it('has a crowd dancing, out of everyone’s way', () => {
    const crowd = ball.party!.crowd!;
    expect(crowd.length).toBeGreaterThanOrEqual(10);
    const flags = new Set([BALL_FLAG]);
    const people = npcsOf(ball);
    for (const d of crowd) {
      expect(isWalkable(tileAt(ball, d.x, d.y)), `${d.x},${d.y}`).toBe(true);
      expect(ball.rows[d.y][d.x], `${d.x},${d.y}`).toMatch(/[.F]/);
      expect(people.some((n) => n.x === d.x && n.y === d.y)).toBe(false);
      expect(canEnter(ball, d.x, d.y, flags)).toBe(false);
    }
    expect(crowdAt(ball, crowd[0].x, crowd[0].y)).toBe(0);
    expect(crowdAt(plain, crowd[0].x, crowd[0].y)).toBe(-1);
    expect(ball.party!.lines!.length).toBeGreaterThanOrEqual(5);

    // With the crowd in the way, you can still reach everyone, the sign and both ends of the map.
    const start = marker(ball, '@');
    const seen = new Set([`${start.x},${start.y}`]);
    const queue = [start];
    while (queue.length) {
      const { x, y } = queue.shift()!;
      for (const [dx, dy] of Object.values(DELTA)) {
        const nx = x + dx;
        const ny = y + dy;
        if (seen.has(`${nx},${ny}`) || !canEnter(ball, nx, ny, flags)) continue;
        seen.add(`${nx},${ny}`);
        queue.push({ x: nx, y: ny });
      }
    }
    const near = (x: number, y: number) =>
      Object.values(DELTA).some(([dx, dy]) => seen.has(`${x + dx},${y + dy}`));
    for (const n of people) expect(near(n.x, n.y), `person ${n.index + 1}`).toBe(true);
    for (const d of crowd) expect(near(d.x, d.y), `dancer at ${d.x},${d.y}`).toBe(true);
    for (const s of find(ball, 'S')) expect(near(s.x, s.y)).toBe(true);
  });

  it('has balloons tied to things, not floating in your way', () => {
    for (const [x, y] of ball.party!.balloons!) expect(isWalkable(tileAt(ball, x, y))).toBe(false);
  });

  it('dances on the beat, and fireworks keep going off', () => {
    const steps = new Set([0, 1, 2, 3, 4, 5, 6, 7].map((b) => dance(3, b * BEAT_MS * 2).dir));
    expect(steps.size).toBeGreaterThan(1);
    expect(dance(3, 0).hop).toBeGreaterThanOrEqual(0);
    expect(dance(3, BEAT_MS / 2).hop).toBeLessThanOrEqual(1);
    const now = fireworks(1000);
    expect(now).toHaveLength(2);
    for (const f of now) {
      expect(f.t).toBeGreaterThanOrEqual(0);
      expect(f.t).toBeLessThan(1);
    }
  });
});
