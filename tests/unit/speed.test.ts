import { describe, expect, it } from 'vitest';
import { getSpeed, nextSpeed, scaled, setSpeed, subscribeSpeed } from '@/lib/speed';

describe('game speed', () => {
  it('cycles 1×, 2×, 4× and shortens every duration to match', () => {
    expect(nextSpeed(1)).toBe(2);
    expect(nextSpeed(2)).toBe(4);
    expect(nextSpeed(4)).toBe(1);
    let heard = 0;
    const stop = subscribeSpeed(() => heard++);
    setSpeed(4);
    expect(getSpeed()).toBe(4);
    expect(scaled(1000)).toBe(250);
    setSpeed(1);
    expect(scaled(1000)).toBe(1000);
    stop();
    expect(heard).toBe(2);
  });
});
