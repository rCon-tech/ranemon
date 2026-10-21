import { describe, expect, it } from 'vitest';
import { daylight } from '@/components/story/Overworld';

const at = (h: number) => daylight(new Date(2026, 9, 21, h, 0));

describe('the time of day', () => {
  it('is plain daylight at midday, with the sun shafts', () => {
    expect(at(12)).toEqual({ tint: null, night: 0, rays: 1 });
  });

  it('goes golden in the evening and dark at night, when the doors light up', () => {
    expect(at(18).tint).toMatch(/255 140 50/);
    expect(at(23).night).toBeGreaterThan(0.8);
    expect(at(23).rays).toBe(0);
    expect(at(8).tint).toMatch(/255 170 150/);
  });
});
