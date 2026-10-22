import { describe, expect, it } from 'vitest';
import { STYLES, TALL, scaleOf } from '@/components/story/people';
import { bulbsOf } from '@/components/story/fairylights';
import { BALL_FLAG, CARL_PRICE, CARL_STALL } from '@/content/story/ball';
import { AFTER_MAPS, mapById, mapFor } from '@/content/story/maps';
import { trainerById } from '@/content/story/trainers';
import { itemById, priceOf } from '@/lib/story/items';
import { find, isWalkable, npcsOf, tileAt } from '@/lib/story/world';

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
});
