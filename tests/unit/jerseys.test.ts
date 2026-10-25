import { describe, expect, it } from 'vitest';
import {
  bandsOf,
  CLUB_JERSEYS,
  CLUB_SHORT,
  clubJerseyOf,
  columnsOf,
  jerseyOf,
  JERSEYS,
} from '@/content/story/jerseys';
import { FIXTURE_LIST } from '@/content/story/premier';
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

describe('the Premier League jerseys', () => {
  const clubs = FIXTURE_LIST.map((f) => f.id);

  it('has a jersey and a short name for each of the twelve clubs, and no others', () => {
    expect(clubs).toHaveLength(12);
    expect(Object.keys(CLUB_JERSEYS).sort()).toEqual([...clubs].sort());
    expect(Object.keys(CLUB_SHORT).sort()).toEqual([...clubs].sort());
  });

  it('gives every jersey real colours, and no two the same kit', () => {
    const kits = new Set<string>();
    for (const id of clubs) {
      const kit = clubJerseyOf(id);
      for (const c of [kit.body, kit.band, kit.trim]) expect(c).toMatch(/^#[0-9a-f]{6}$/);
      kits.add(JSON.stringify(kit));
    }
    expect(kits.size).toBe(12);
  });

  it('keeps the kits each club is known for', () => {
    expect(clubJerseyOf('newcastle').pattern).toBe('vstripes');
    expect(clubJerseyOf('brighton').pattern).toBe('vstripes');
    expect(clubJerseyOf('palace').pattern).toBe('vstripes');
    expect(clubJerseyOf('arsenal').pattern).toBe('sleeves');
    expect(clubJerseyOf('arsenal').band).toBe('#ffffff');
    expect(clubJerseyOf('villa').pattern).toBe('sleeves');
    for (const id of ['leeds', 'spurs'] as const) expect(clubJerseyOf(id).body).toBe('#ffffff');
  });

  it('draws every stripe inside the jersey', () => {
    for (const id of clubs) {
      const kit = clubJerseyOf(id);
      expect(bandsOf(kit)).toEqual([]);
      for (const [x, w] of columnsOf(kit)) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x + w).toBeLessThanOrEqual(16);
      }
    }
    expect(columnsOf(jerseyOf('kilkenny'))).toEqual([]);
  });
});
