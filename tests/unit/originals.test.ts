import { describe, expect, it } from 'vitest';
import { MAPS } from '@/content/story/maps';
import { TRAINERS } from '@/content/story/trainers';
import { LONDON } from '@/lib/battle/london';

/**
 * Players want a party of the lads, so the grass is mostly theirs, and London's own Ranemon are
 * mostly met in trainers' teams. Everyone who matters fields at least one of the lads.
 */
const LONDONERS = new Set(LONDON.map((c) => c.id));
const original = (id: string) => !LONDONERS.has(id);

/** Gym leaders, rivals, bosses, scholars, club legends, royals and the Championship. */
const IMPORTANT =
  /^(rival|gym-|scholar-|bns|poseidon|rent-|pear-|trinity-|dublin-mescal|rave-mossy|arcade-king|techno-dj|pl-|palace-(?!guard)|galway-)/;

describe('the original Ranemon', () => {
  it('are at least three quarters of every wild table', () => {
    for (const map of MAPS) {
      if (!map.wild) continue;
      const total = map.wild.table.reduce((s, [, w]) => s + w, 0);
      const lads = map.wild.table.filter(([s]) => original(s)).reduce((s, [, w]) => s + w, 0);
      expect(lads / total, map.id).toBeGreaterThanOrEqual(0.74);
    }
  });

  it('are in the team of everyone who matters', () => {
    const important = TRAINERS.filter((t) => IMPORTANT.test(t.id) && !t.rival);
    expect(important.length).toBeGreaterThanOrEqual(45);
    for (const t of important)
      expect(
        t.team.some(([s]) => original(s)),
        t.id,
      ).toBe(true);
  });

  it('leave London’s own to the trainers more than the grass', () => {
    const trainers = new Set(
      TRAINERS.flatMap((t) => t.team.map(([s]) => s)).filter((s) => !original(s)),
    );
    expect(trainers.size).toBeGreaterThanOrEqual(10);
  });
});
