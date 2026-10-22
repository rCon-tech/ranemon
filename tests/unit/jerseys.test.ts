import { describe, expect, it } from 'vitest';
import { bandsOf, jerseyOf, JERSEYS } from '@/content/story/jerseys';
import { COUNTIES } from '@/content/story/maps';

describe('the county jerseys', () => {
  it('has a jersey for each of the nine counties, and no others', () => {
    expect(Object.keys(JERSEYS).sort()).toEqual([...COUNTIES].sort());
    expect(COUNTIES).toHaveLength(9);
  });

  it('gives every jersey real colours', () => {
    for (const id of COUNTIES) {
      const kit = jerseyOf(id);
      for (const c of [kit.body, kit.band, kit.trim]) expect(c).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('only Kildare, the Lilywhites, is all white', () => {
    const white = COUNTIES.filter((id) => {
      const k = jerseyOf(id);
      return k.body === '#ffffff' && k.band === '#ffffff' && k.trim === '#ffffff';
    });
    expect(white).toEqual(['kildare']);
  });

  it('keeps the colours each county is known for', () => {
    expect(jerseyOf('kilkenny').pattern).toBe('stripes');
    expect(jerseyOf('offaly').pattern).toBe('tricolour');
    expect(jerseyOf('tipperary').body).not.toBe(jerseyOf('tipperary').band);
    // Limerick and Meath are both green, told apart by their trim.
    expect(jerseyOf('limerick').body).toBe(jerseyOf('meath').body);
    expect(jerseyOf('limerick').trim).not.toBe(jerseyOf('meath').trim);
  });

  it('draws every band inside the jersey', () => {
    for (const id of COUNTIES) {
      for (const [y, h] of bandsOf(jerseyOf(id))) {
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y + h).toBeLessThanOrEqual(14);
      }
    }
    expect(bandsOf(jerseyOf('meath'))).toEqual([]);
  });

  it('has no jersey for Dublin', () => {
    expect(() => jerseyOf('dublin')).toThrow();
  });
});
